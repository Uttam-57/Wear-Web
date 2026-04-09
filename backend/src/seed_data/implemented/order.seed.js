import crypto from 'crypto';

import Address from '../../modules/user/address.model.js';
import Order from '../../modules/order/order.model.js';
import Product from '../../modules/product/product.model.js';
import User from '../../modules/user/user.model.js';
import Purchase from '../../modules/payment/purchase.model.js';
import Payment from '../../modules/payment/payment.model.js';
import { ORDER_SCENARIOS } from '../data/order/orderSeed.data.js';

const STOCK_DEDUCT_STATUSES = new Set([
  'placed',
  'accepted',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]);

const getEffectivePrice = (price, discount = 0) =>
  Number((price - (price * discount) / 100).toFixed(2));

const buildAddressSnapshot = (address) => ({
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  building: address.building ?? null,
  landmark: address.landmark ?? null,
  district: address.district,
  city: address.city,
  state: address.state,
  pincode: address.pincode,
  country: address.country,
  label: address.label,
});

const applyStatusTimestamps = (order, status, placedAt) => {
  const plusHours = (hours) => new Date(placedAt.getTime() + hours * 60 * 60 * 1000);

  if (['accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
    order.acceptedAt = plusHours(4);
  }
  if (['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
    order.packedAt = plusHours(12);
  }
  if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
    order.shippedAt = plusHours(24);
  }
  if (['out_for_delivery', 'delivered'].includes(status)) {
    order.outForDeliveryAt = plusHours(48);
  }
  if (status === 'delivered') {
    order.deliveredAt = plusHours(72);
  }
  if (status === 'cancelled') {
    order.cancelledAt = plusHours(6);
  }
  if (status === 'rejected') {
    order.cancelledAt = plusHours(8);
  }
};

const buildPaymentMeta = (order, scenario, index, addressId) => {
  const amountPaise = Math.round(order.totalAmount * 100);
  const paymentIntentId = `pi_seed_${Date.now()}_${index + 1}`;
  const shouldCreatePayment = ['paid', 'failed', 'refunded'].includes(scenario.paymentStatus);

  const purchaseStatus =
    scenario.paymentStatus === 'pending'
      ? 'pending'
      : scenario.paymentStatus === 'failed'
        ? 'failed'
        : 'paid';

  return {
    amountPaise,
    paymentIntentId,
    purchase: {
      customerId: order.customerId,
      orderIds: [order._id],
      addressId,
      stripePaymentIntentId: paymentIntentId,
      stripeClientSecret: `${paymentIntentId}_secret_seed`,
      amount: amountPaise,
      currency: 'inr',
      status: purchaseStatus,
      paidAt: purchaseStatus === 'paid' ? new Date() : null,
    },
    payment: shouldCreatePayment
      ? {
          customerId: order.customerId,
          stripePaymentIntentId: paymentIntentId,
          amount: amountPaise,
          currency: 'inr',
          status:
            scenario.paymentStatus === 'paid'
              ? 'succeeded'
              : scenario.paymentStatus === 'failed'
                ? 'failed'
                : 'refunded',
          refundedAmount: scenario.paymentStatus === 'refunded' ? amountPaise : 0,
        }
      : null,
  };
};

export const seedOrders = async ({ clearExisting = true, orderCount = 30 } = {}) => {
  if (clearExisting) {
    console.log('Clearing old orders, purchases, and payments...');
    await Promise.all([
      Payment.deleteMany({}),
      Purchase.deleteMany({}),
      Order.deleteMany({}),
    ]);
  }

  const [customers, products, addresses] = await Promise.all([
    User.find({ role: 'customer', status: 'active' }).select('_id firstName lastName'),
    Product.find({ status: 'active' }),
    Address.find({ isDefault: true }).select('_id userId fullName phone street building landmark district city state pincode country label'),
  ]);

  if (customers.length === 0) {
    throw new Error('No active customers found. Seed users first.');
  }
  if (products.length === 0) {
    throw new Error('No active products found. Seed products first.');
  }

  const addressByCustomerId = new Map();
  for (const address of addresses) {
    addressByCustomerId.set(String(address.userId), address);
  }

  const customersWithAddress = customers.filter((customer) => addressByCustomerId.has(String(customer._id)));
  if (customersWithAddress.length === 0) {
    throw new Error('No customer default addresses found. Seed users first.');
  }

  let productCursor = 0;
  let paidOrders = 0;
  let pendingOrders = 0;
  let refundedOrders = 0;
  let failedOrders = 0;

  const createdOrders = [];

  for (let i = 0; i < orderCount; i += 1) {
    const scenario = ORDER_SCENARIOS[i % ORDER_SCENARIOS.length];
    const customer = customersWithAddress[i % customersWithAddress.length];
    const address = addressByCustomerId.get(String(customer._id));

    let selectedProduct = null;
    let selectedVariant = null;

    for (let attempts = 0; attempts < products.length; attempts += 1) {
      const candidate = products[(productCursor + attempts) % products.length];
      const variant = candidate.variants.find((item) => item.stock >= scenario.quantity + 2);
      if (variant) {
        selectedProduct = candidate;
        selectedVariant = variant;
        productCursor = (productCursor + attempts + 1) % products.length;
        break;
      }
    }

    if (!selectedProduct || !selectedVariant) {
      throw new Error('Unable to find products with enough stock for seeded orders. Increase product stock or reduce order count.');
    }

    const effectivePrice = getEffectivePrice(selectedVariant.price, selectedVariant.discount);
    const subtotal = Number((effectivePrice * scenario.quantity).toFixed(2));

    const now = Date.now();
    const placedAt = new Date(now - (orderCount - i) * 10 * 60 * 60 * 1000);
    const order = new Order({
      customerId: customer._id,
      sellerId: selectedProduct.sellerId,
      items: [
        {
          productId: selectedProduct._id,
          variantId: selectedVariant._id,
          sellerId: selectedProduct.sellerId,
          snapshot: {
            productName: selectedProduct.name,
            images: selectedProduct.images,
            size: selectedVariant.size,
            colorName: selectedVariant.colorName,
            colorCode: selectedVariant.colorCode,
            price: selectedVariant.price,
            effectivePrice,
          },
          quantity: scenario.quantity,
          subtotal,
        },
      ],
      addressSnapshot: buildAddressSnapshot(address),
      status: scenario.status,
      totalAmount: subtotal,
      paymentStatus: scenario.paymentStatus,
      createdAt: placedAt,
      updatedAt: placedAt,
    });

    if (scenario.status === 'cancelled') {
      order.cancelledBy = scenario.cancelledBy ?? 'customer';
      order.cancellationReason = scenario.cancellationReason ?? 'Order cancelled by customer request.';
    }

    if (scenario.status === 'rejected') {
      order.cancelledBy = 'seller';
      order.rejectionReason = scenario.rejectionReason ?? 'Order rejected by seller.';
    }

    if (scenario.status === 'out_for_delivery') {
      const otpHash = crypto.createHash('sha256').update('123456').digest('hex');
      order.deliveryOtp = otpHash;
      order.deliveryOtpExpiresAt = new Date(placedAt.getTime() + 24 * 60 * 60 * 1000);
      order.deliveryOtpRequestedAt = placedAt;
      order.deliveryOtpAttemptCount = 0;
      order.deliveryOtpLockedUntil = null;
    }

    if (scenario.returnRequest) {
      const requestedAt = new Date(placedAt.getTime() + 85 * 60 * 60 * 1000);
      order.returnRequest = {
        reason: scenario.returnRequest.reason,
        status: scenario.returnRequest.status,
        adminNote: scenario.returnRequest.adminNote ?? '',
        requestedAt,
        resolvedAt: scenario.returnRequest.status === 'requested' ? undefined : new Date(requestedAt.getTime() + 16 * 60 * 60 * 1000),
      };
    }

    applyStatusTimestamps(order, scenario.status, placedAt);

    if (STOCK_DEDUCT_STATUSES.has(scenario.status)) {
      selectedVariant.stock -= scenario.quantity;
      await selectedProduct.save();
    }

    if (scenario.paymentStatus === 'paid') {
      const commission = Number((subtotal * 0.12).toFixed(2));
      order.platformCommission = commission;
      order.sellerPayout = Number((subtotal - commission).toFixed(2));
      paidOrders += 1;
    } else if (scenario.paymentStatus === 'pending') {
      pendingOrders += 1;
    } else if (scenario.paymentStatus === 'refunded') {
      refundedOrders += 1;
    } else if (scenario.paymentStatus === 'failed') {
      failedOrders += 1;
    }

    await order.save();

    const paymentMeta = buildPaymentMeta(order, scenario, i, address._id);
    const purchase = await Purchase.create(paymentMeta.purchase);
    order.purchaseId = purchase._id;
    await order.save();

    if (paymentMeta.payment) {
      await Payment.create({
        purchaseId: purchase._id,
        ...paymentMeta.payment,
      });
    }

    createdOrders.push(order);
  }

  console.log(`Seeded ${createdOrders.length} orders with lifecycle states.`);
  return {
    orderCount: createdOrders.length,
    paymentBreakdown: {
      paid: paidOrders,
      pending: pendingOrders,
      refunded: refundedOrders,
      failed: failedOrders,
    },
    statuses: createdOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {}),
  };
};

export default seedOrders;
