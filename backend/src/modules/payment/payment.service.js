import Stripe from 'stripe';
import Purchase from './purchase.model.js';
import Payment from './payment.model.js';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import Cart from '../cart/cart.model.js';
import Address from '../user/address.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';
import { createNotification } from '../../utils/notification.utils.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PAYMENT_METHODS = new Set(['card', 'upi']);

const removePurchasedItemsFromCart = async (purchase) => {
  const orders = await Order.find(
    { _id: { $in: purchase.orderIds } },
    { items: 1 }
  );

  const orderedVariantIds = new Set(
    orders.flatMap((order) =>
      (order.items || []).map((item) => item.variantId?.toString()).filter(Boolean)
    )
  );

  if (!orderedVariantIds.size) return;

  const cart = await Cart.findOne({ userId: purchase.customerId });
  if (!cart || !Array.isArray(cart.items) || !cart.items.length) return;

  const previousCount = cart.items.length;
  cart.items = cart.items.filter(
    (item) => !orderedVariantIds.has(item.variantId?.toString())
  );

  if (cart.items.length !== previousCount) {
    await cart.save();
    logger.info(
      `Cart cleaned up after payment success for customer ${purchase.customerId}: removed ${previousCount - cart.items.length} item(s)`
    );
  }
};

// ─── Initiate Payment ────────────────────────────────────────────────────────

export const initiatePaymentService = async ({ customerId, orderIds, addressId, paymentMethod = 'card' }) => {
  logger.info(`[SERVICE] initiatePaymentService → customerId: ${customerId} | orderCount: ${orderIds?.length || 0}`);
  const normalizedPaymentMethod = String(paymentMethod || 'card').toLowerCase();

  if (!ALLOWED_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
    throw new AppError('Unsupported payment method', 400, 'VALIDATION_ERROR');
  }

  // Validate address belongs to customer
  const address = await Address.findOne({ _id: addressId, userId: customerId });
  if (!address) {
    throw new AppError('Address not found', 404, 'NOT_FOUND');
  }

  // Fetch and validate orders
  const orders = await Order.find({
    _id: { $in: orderIds },
    customerId,
    paymentStatus: 'pending',
    status: 'placed',
  });

  if (orders.length !== orderIds.length) {
    throw new AppError(
      'One or more orders are invalid, already paid, or do not belong to you',
      400,
      'VALIDATION_ERROR'
    );
  }

  // Calculate total in paise
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const amountInPaise = Math.round(totalAmount * 100);

  // Create Stripe PaymentIntent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      payment_method_types: [normalizedPaymentMethod],
      metadata: {
        customerId: customerId.toString(),
        orderIds: orderIds.join(','),
        addressId: addressId.toString(),
        paymentMethod: normalizedPaymentMethod,
      },
    });
  } catch (err) {
    logger.warn(`[SERVICE] initiatePaymentService → Stripe payment intent creation failed: ${err.message}`);
    throw new AppError(
      normalizedPaymentMethod === 'upi'
        ? 'UPI payment is not available right now. Please try card.'
        : 'Unable to initiate payment right now. Please try again.',
      400,
      'PAYMENT_INITIATION_FAILED'
    );
  }

  // Create pending Purchase record
  const purchase = await Purchase.create({
    customerId,
    orderIds,
    addressId,
    stripePaymentIntentId: paymentIntent.id,
    stripeClientSecret: paymentIntent.client_secret,
    amount: amountInPaise,
    currency: 'inr',
    paymentMethod: normalizedPaymentMethod,
    status: 'pending',
  });

  // Link purchaseId on orders
  await Order.updateMany(
    { _id: { $in: orderIds } },
    { purchaseId: purchase._id }
  );

  return {
    purchaseId: purchase._id,
    clientSecret: paymentIntent.client_secret,
    amount: amountInPaise,
    currency: 'inr',
    paymentMethod: normalizedPaymentMethod,
  };
};

export const confirmPaymentService = async ({ customerId, purchaseId, paymentIntentId }) => {
  logger.info(`[SERVICE] confirmPaymentService → customerId: ${customerId} | purchaseId: ${purchaseId}`);
  const purchase = await Purchase.findOne({
    _id: purchaseId,
    customerId,
  });

  if (!purchase) {
    throw new AppError('Purchase not found', 404, 'NOT_FOUND');
  }

  if (paymentIntentId && paymentIntentId !== purchase.stripePaymentIntentId) {
    throw new AppError('Payment intent does not match purchase', 400, 'VALIDATION_ERROR');
  }

  if (purchase.status === 'paid') {
    await removePurchasedItemsFromCart(purchase);

    const payment = await Payment.findOne({ purchaseId: purchase._id }).sort({ createdAt: -1 });
    return {
      purchaseId: purchase._id,
      stripePaymentIntentId: purchase.stripePaymentIntentId,
      stripeStatus: 'succeeded',
      purchaseStatus: 'paid',
      paymentStatus: payment?.status || 'succeeded',
      confirmed: true,
    };
  }

  if (purchase.status === 'failed') {
    const payment = await Payment.findOne({ purchaseId: purchase._id }).sort({ createdAt: -1 });
    return {
      purchaseId: purchase._id,
      stripePaymentIntentId: purchase.stripePaymentIntentId,
      stripeStatus: 'requires_payment_method',
      purchaseStatus: 'failed',
      paymentStatus: payment?.status || 'failed',
      confirmed: false,
    };
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
  } catch (err) {
    logger.warn(`[SERVICE] confirmPaymentService → Stripe payment intent retrieve failed: ${err.message}`);
    throw new AppError('Unable to verify payment status right now', 400, 'PAYMENT_CONFIRMATION_FAILED');
  }

  if (paymentIntent.status === 'succeeded') {
    await handlePaymentSuccess(paymentIntent);
  } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
    await handlePaymentFailure(paymentIntent);
  }

  const [updatedPurchase, payment] = await Promise.all([
    Purchase.findById(purchase._id),
    Payment.findOne({ purchaseId: purchase._id }).sort({ createdAt: -1 }),
  ]);

  return {
    purchaseId: purchase._id,
    stripePaymentIntentId: purchase.stripePaymentIntentId,
    stripeStatus: paymentIntent.status,
    purchaseStatus: updatedPurchase?.status || purchase.status,
    paymentStatus: payment?.status || null,
    confirmed: paymentIntent.status === 'succeeded',
  };
};

// ─── Handle Stripe Webhook ───────────────────────────────────────────────────

export const handleWebhookService = async ({ rawBody, signature }) => {
  logger.info('[SERVICE] handleWebhookService → webhook received');
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.warn(`[SERVICE] handleWebhookService → webhook signature verification failed: ${err.message}`);
    throw new AppError('Invalid webhook signature', 400, 'VALIDATION_ERROR');
  }

  const paymentIntent = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
      await handlePaymentFailure(paymentIntent);
      break;

    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  return { received: true };
};

const handlePaymentSuccess = async (paymentIntent) => {
  const purchase = await Purchase.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (!purchase) {
    logger.warn(`[SERVICE] handlePaymentSuccess → purchase not found for paymentIntentId: ${paymentIntent.id}`);
    return;
  }

  // Idempotency guard
  if (purchase.status === 'paid') {
    await removePurchasedItemsFromCart(purchase);
    logger.info(`Purchase ${purchase._id} already marked paid. Skipping.`);
    return;
  }

  // Update purchase
  purchase.status = 'paid';
  purchase.paidAt = new Date();
  await purchase.save();

  // Create Payment record
  const payment = await Payment.create({
    purchaseId: purchase._id,
    customerId: purchase.customerId,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    paymentMethod: purchase.paymentMethod || paymentIntent.metadata?.paymentMethod || 'card',
    status: 'succeeded',
  });

  createNotification({
    userId: payment.customerId.toString(),
    type: 'PAYMENT_CONFIRMED',
    message: `Payment of ₹${(payment.amount / 100).toFixed(2)} confirmed for your order.`,
    refId: payment._id.toString(),
    refModel: 'Payment',
  });

  // Update all linked orders payment status
  await Order.updateMany(
    { _id: { $in: purchase.orderIds } },
    { paymentStatus: 'paid' }
  );

  // Remove only purchased checkout items from cart after payment is successful.
  await removePurchasedItemsFromCart(purchase);

  logger.info(`Payment succeeded for purchase ${purchase._id}`);
};

const handlePaymentFailure = async (paymentIntent) => {
  const purchase = await Purchase.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (!purchase) {
    logger.warn(`[SERVICE] handlePaymentFailure → purchase not found for paymentIntentId: ${paymentIntent.id}`);
    return;
  }

  if (purchase.status === 'failed') {
    logger.info(`Purchase ${purchase._id} already marked failed. Skipping.`);
    return;
  }

  // Update purchase status
  purchase.status = 'failed';
  await purchase.save();

  // Create Payment record
  await Payment.create({
    purchaseId: purchase._id,
    customerId: purchase.customerId,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    paymentMethod: purchase.paymentMethod || paymentIntent.metadata?.paymentMethod || 'card',
    status: 'failed',
  });

  // Cancel orders and restore stock
  const orders = await Order.find({ _id: { $in: purchase.orderIds } });

  for (const order of orders) {
    if (['cancelled', 'delivered'].includes(order.status)) continue;

    // Restore stock for each item
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, 'variants._id': item.variantId },
        { $inc: { 'variants.$.stock': item.quantity } }
      );
    }

    order.status = 'cancelled';
    order.paymentStatus = 'failed';
    order.cancelledAt = new Date();
    order.cancellationReason = 'Payment failed';
    await order.save();
  }

  logger.info(`Payment failed for purchase ${purchase._id}. Orders cancelled.`);
};

// ─── Process Refund ──────────────────────────────────────────────────────────

export const processRefundService = async ({ orderId, customerId, reason }) => {
  logger.info(`[SERVICE] processRefundService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Order has not been paid — no refund applicable', 400, 'VALIDATION_ERROR');
  }

  const purchase = await Purchase.findOne({ orderIds: orderId });
  if (!purchase) {
    throw new AppError('Purchase record not found for this order', 404, 'NOT_FOUND');
  }

  const payment = await Payment.findOne({ purchaseId: purchase._id, status: 'succeeded' });
  if (!payment) {
    throw new AppError('Payment record not found', 404, 'NOT_FOUND');
  }

  // Refund amount = order's totalAmount in paise
  const refundAmountPaise = Math.round(order.totalAmount * 100);

  // Call Stripe refund
  let stripeRefund;
  if (process.env.NODE_ENV !== 'test') {
    stripeRefund = await stripe.refunds.create({
      payment_intent: purchase.stripePaymentIntentId,
      amount: refundAmountPaise,
      reason: 'requested_by_customer',
      metadata: { orderId: orderId.toString(), reason },
    });
  } else {
    // Test mode synthetic refund
    stripeRefund = { id: `re_test_${Date.now()}`, status: 'succeeded' };
  }

  // Update payment record
  const newRefundedAmount = payment.refundedAmount + refundAmountPaise;
  const newStatus =
    newRefundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';

  payment.stripeRefundId = stripeRefund.id;
  payment.refundedAmount = newRefundedAmount;
  payment.status = newStatus;
  await payment.save();

  // Update order payment status
  order.paymentStatus = 'refunded';
  await order.save();

  logger.info(`Refund processed for order ${orderId}. Stripe refund ID: ${stripeRefund.id}`);

  return { refundId: stripeRefund.id, refundedAmount: refundAmountPaise };
};

// ─── Payment History ─────────────────────────────────────────────────────────

export const getPaymentHistoryService = async ({ customerId }) => {
  logger.info(`[SERVICE] getPaymentHistoryService → customerId: ${customerId}`);
  const payments = await Payment.find({ customerId })
    .populate({
      path: 'purchaseId',
      select: 'orderIds addressId amount status paidAt createdAt',
      populate: {
        path: 'orderIds',
        select: 'items totalAmount status sellerId',
      },
    })
    .sort({ createdAt: -1 });

  // Flatten and aggregate line items across all orders in each payment
  const history = payments.map((payment) => {
    const purchase = payment.purchaseId;
    const variantMap = new Map();

    if (purchase && purchase.orderIds) {
      for (const order of purchase.orderIds) {
        for (const item of order.items) {
          // Key = productId + variantId to group same variant across orders
          const key = `${item.productId}_${item.variantId}`;

          if (variantMap.has(key)) {
            const existing = variantMap.get(key);
            existing.quantity += item.quantity;
            existing.totalPrice += item.snapshot.effectivePrice * item.quantity;
          } else {
            variantMap.set(key, {
              productId: item.productId,
              productName: item.snapshot.productName,
              color: item.snapshot.colorName,
              size: item.snapshot.size,
              image: item.snapshot.images?.[0]?.url || null,
              unitPrice: item.snapshot.effectivePrice,
              quantity: item.quantity,
              totalPrice: item.snapshot.effectivePrice * item.quantity,
            });
          }
        }
      }
    }

    return {
      paymentId: payment._id,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      refundedAmount: payment.refundedAmount,
      createdAt: payment.createdAt,
      purchase: purchase
        ? {
            purchaseId: purchase._id,
            paidAt: purchase.paidAt,
            totalAmount: purchase.amount,
          }
        : null,
      items: Array.from(variantMap.values()),
    };
  });

  return history;
};

// ─── Admin: All Payments ─────────────────────────────────────────────────────

export const getAllPaymentsService = async ({ page = 1, limit = 20 }) => {
  logger.info(`[SERVICE] getAllPaymentsService → page: ${page} | limit: ${limit}`);
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find()
      .populate('customerId', 'name email')
      .populate('purchaseId', 'orderIds amount status paidAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};