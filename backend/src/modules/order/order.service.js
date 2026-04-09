import mongoose from 'mongoose';
import Order from './order.model.js';
import Cart from '../cart/cart.model.js';
import Product from '../product/product.model.js';
import Address from '../user/address.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

import { createNotification } from '../../utils/notification.utils.js';
import { getPublicOrderId } from '../../utils/orderId.utils.js';
import {
  CANCELLABLE_STATUSES,
  OTP_REQUEST_COOLDOWN_MS,
  RETURN_ALLOWED_TRANSITIONS,
  RETURN_TERMINAL_STATUSES,
  SELLER_REJECTABLE_STATUS,
} from './order.constants.js';
import {
  confirmDeliveryByOtp,
  issueDeliveryOtpForOrder,
  issueReturnPickupOtpForOrder,
  verifyReturnPickupOtp,
} from './order.otp.utils.js';
import {
  deductSellerWalletForReturn,
  processReturnRefundIfNeeded,
} from './order.return.utils.js';
import {
  notifyCustomerOrderStatus,
  parseSortParam,
  restoreStock,
  setStatusTimestamp,
} from './order.lifecycle.utils.js';

// ─── Place Order ─────────────────────────────────────────────────────────────
export const placeOrderService = async (customerId, { variantIds, addressId }) => {
  logger.info(`[SERVICE] placeOrderService → customerId: ${customerId} | selectedVariants: ${variantIds?.length || 0}`);
  // 1. Fetch customer's cart
  const cart = await Cart.findOne({ userId: customerId });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400, 'VALIDATION_ERROR');
  }

  // 2. Filter selected items
  const selectedItems = cart.items.filter((item) =>
    variantIds.includes(item.variantId.toString())
  );

  if (selectedItems.length === 0) {
    throw new AppError('None of the selected items are in your cart', 400, 'VALIDATION_ERROR');
  }

  // 3. Fetch customer address
  const address = await Address.findOne({ _id: addressId, userId: customerId });
  if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');

  // 4. Validate stock and build order items — live check per product
  // Group by productId to minimize DB calls
  const productIds = [...new Set(selectedItems.map((i) => i.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  const orderItemsBySeller = {}; // sellerId → items[]

  for (const cartItem of selectedItems) {
    const product = productMap[cartItem.productId.toString()];

    if (!product || product.status === 'removed') {
      throw new AppError(
        `Product "${cartItem.snapshot.productName}" is no longer available`,
        404,
        'NOT_FOUND'
      );
    }

    if (product.status === 'held') {
      throw new AppError(
        `Product "${cartItem.snapshot.productName}" is currently unavailable`,
        410,
        'PRODUCT_UNAVAILABLE'
      );
    }

    const variant = product.variants.find(
      (v) => v._id.toString() === cartItem.variantId.toString()
    );

    if (!variant) {
      throw new AppError(
        `A variant of "${cartItem.snapshot.productName}" is no longer available`,
        404,
        'NOT_FOUND'
      );
    }

    if (variant.stock < cartItem.quantity) {
      throw new AppError(
        `Only ${variant.stock} units of "${cartItem.snapshot.productName}" (${variant.size}) are available`,
        410,
        'OUT_OF_STOCK'
      );
    }

    const effectivePrice =
      variant.price - (variant.price * (variant.discount || 0)) / 100;
    const subtotal = parseFloat((effectivePrice * cartItem.quantity).toFixed(2));

    const sellerKey = cartItem.sellerId.toString();
    if (!orderItemsBySeller[sellerKey]) orderItemsBySeller[sellerKey] = [];

    orderItemsBySeller[sellerKey].push({
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      sellerId: cartItem.sellerId,
      snapshot: {
        productName: product.name,
        images: product.images,
        size: variant.size,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
        price: variant.price,
        effectivePrice: parseFloat(effectivePrice.toFixed(2)),
      },
      quantity: cartItem.quantity,
      subtotal,
    });
  }

  // 5. Address snapshot
  const addressSnapshot = {
    fullName: address.fullName,
    phone: address.phone,
    street: address.street,
    building: address.building || null,
    landmark: address.landmark || null,
    district: address.district,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    label: address.label,
  };

  // 6. Deduct stock and create one Order per seller — in a session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  const createdOrders = [];

  try {
    for (const [sellerIdStr, items] of Object.entries(orderItemsBySeller)) {
      // Deduct stock for each item
      for (const item of items) {
        const updateResult = await Product.updateOne(
          {
            _id: item.productId,
            variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } },
          },
          { $inc: { 'variants.$.stock': -item.quantity } },
          { session }
        );

        if (!updateResult.modifiedCount) {
          throw new AppError(
            `Stock changed while placing order for "${item.snapshot.productName}". Please refresh cart and try again.`,
            410,
            'OUT_OF_STOCK'
          );
        }
      }

      const totalAmount = parseFloat(
        items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
      );

      const order = new Order({
        customerId,
        sellerId: sellerIdStr,
        items,
        addressSnapshot,
        totalAmount,
        status: 'placed',
      });

      await order.save({ session });
      createdOrders.push(order);
      
      createNotification({
        userId: order.sellerId.toString(),
        type: 'ORDER_PLACED',
        message: `New order #${getPublicOrderId(order)} received. Please process it promptly.`,
        refId: order._id.toString(),
        refModel: 'Order',
      });
    }

    await session.commitTransaction();
    logger.info(`Orders placed by customer ${customerId} — ${createdOrders.length} seller order(s)`);
    return createdOrders;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Get Customer Orders ──────────────────────────────────────────────────────
export const getCustomerOrdersService = async (customerId) => {
  logger.info(`[SERVICE] getCustomerOrdersService → customerId: ${customerId}`);
  const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
  return orders;
};

// ─── Get Single Order (Customer) ──────────────────────────────────────────────
export const getOrderByIdService = async (customerId, orderId) => {
  logger.info(`[SERVICE] getOrderByIdService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  return order;
};

// ─── Cancel Order (Customer) ──────────────────────────────────────────────────
export const cancelOrderService = async (customerId, orderId, { reason }) => {
  logger.info(`[SERVICE] cancelOrderService → customerId: ${customerId} | orderId: ${orderId}`);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
  const order = await Order.findOne({ _id: orderId, customerId }).session(session);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new AppError(
      `Order cannot be cancelled once it is ${order.status}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Restore stock
  await restoreStock(order.items, session);

  order.status = 'cancelled';
  order.cancelledBy = 'customer';
  order.cancellationReason = reason;
  setStatusTimestamp(order);
  await order.save({ session });

  createNotification({
    userId: order.sellerId.toString(),
    type: 'ORDER_CANCELLED',
    message: `Order #${getPublicOrderId(order)} has been cancelled by the customer.`,
    refId: order._id.toString(),
    refModel: 'Order',
  });

  await session.commitTransaction();

  logger.info(`Order ${orderId} cancelled by customer ${customerId}`);
  return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const requestDeliveryOtpService = async (customerId, orderId) => {
  logger.info(`[SERVICE] requestDeliveryOtpService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
 
  if (order.status !== 'out_for_delivery') {
    throw new AppError(
      'OTP can only be requested when order is out for delivery',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (order.deliveryOtpLockedUntil && order.deliveryOtpLockedUntil > new Date()) {
    throw new AppError('Too many invalid OTP attempts. Please try again later.', 429, 'TOO_MANY_REQUESTS');
  }

  if (order.deliveryOtpRequestedAt && (Date.now() - new Date(order.deliveryOtpRequestedAt).getTime()) < OTP_REQUEST_COOLDOWN_MS) {
    throw new AppError('OTP was requested recently. Please wait a minute before requesting again.', 429, 'TOO_MANY_REQUESTS');
  }
 
  return issueDeliveryOtpForOrder(order, { failSilently: false });
};
 
// ─── Confirm Delivery (Customer — OTP stubbed) ────────────────────────────────

export const confirmDeliveryService = async (customerId, orderId, otp) => {
  logger.info(`[SERVICE] confirmDeliveryService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  const updated = await confirmDeliveryByOtp(order, otp);

  logger.info(`Order ${orderId} delivered — confirmed by customer ${customerId}`);
  return updated;
};

export const confirmDeliveryBySellerService = async (sellerId, orderId, otp) => {
  logger.info(`[SERVICE] confirmDeliveryBySellerService → sellerId: ${sellerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, sellerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  const updated = await confirmDeliveryByOtp(order, otp);
  logger.info(`Order ${orderId} delivered — confirmed by seller ${sellerId}`);
  return updated;
};
// ─── Request Return (Customer) ────────────────────────────────────────────────
export const requestReturnService = async (customerId, orderId, { reason }) => {
  logger.info(`[SERVICE] requestReturnService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  if (order.status !== 'delivered') {
    throw new AppError('Returns can only be raised for delivered orders', 400, 'VALIDATION_ERROR');
  }

  if (order.returnRequest) {
    throw new AppError('A return request already exists for this order', 400, 'VALIDATION_ERROR');
  }

  order.returnRequest = { reason, status: 'requested', requestedAt: new Date() };
  await order.save();

  createNotification({
    userId: order.sellerId.toString(),
    type: 'RETURN_REQUESTED',
    message: `A return has been requested for order #${getPublicOrderId(order)}.`,
    refId: order._id.toString(),
    refModel: 'Order',
  });

  logger.info(`Return requested for order ${orderId} by customer ${customerId}`);
  return order;
};

// ─── Get Return Status (Customer) ────────────────────────────────────────────
export const getReturnStatusService = async (customerId, orderId) => {
  logger.info(`[SERVICE] getReturnStatusService → customerId: ${customerId} | orderId: ${orderId}`);
  const order = await Order.findOne({ _id: orderId, customerId }).select('returnRequest status');
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (!order.returnRequest) throw new AppError('No return request found for this order', 404, 'NOT_FOUND');
  return order.returnRequest;
};

// ─── Get Seller Orders ────────────────────────────────────────────────────────
export const getSellerOrdersService = async (sellerId, query = {}) => {
  logger.info(`[SERVICE] getSellerOrdersService → sellerId: ${sellerId}`);
  const statusValues = String(query?.status || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const filter = { sellerId };
  if (statusValues.length) {
    filter.status = { $in: statusValues };
  }

  const countOnly = String(query?.count || '').toLowerCase() === 'true';
  if (countOnly) {
    const count = await Order.countDocuments(filter);
    return { count };
  }

  const page = Number(query?.page);
  const limit = Number(query?.limit);
  const hasPagination = Number.isFinite(page) || Number.isFinite(limit);

  const sort = parseSortParam(query?.sort);

  if (!hasPagination) {
    const orders = await Order.find(filter).sort(sort);
    return orders;
  }

  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
  const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 20));
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(safeLimit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
};

export const getSellerReturnsService = async (sellerId, query = {}) => {
  logger.info(`[SERVICE] getSellerReturnsService → sellerId: ${sellerId}`);
  const statusValues = String(query?.status || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const filter = {
    sellerId,
    returnRequest: { $ne: null },
  };

  if (statusValues.length) {
    filter['returnRequest.status'] = { $in: statusValues };
  }

  const countOnly = String(query?.count || '').toLowerCase() === 'true';
  if (countOnly) {
    const count = await Order.countDocuments(filter);
    return { count };
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const requestSellerReturnPickupOtpService = async (sellerId, orderId) => {
  logger.info(`[SERVICE] requestSellerReturnPickupOtpService → sellerId: ${sellerId} | orderId: ${orderId}`);
  const sellerOrder = await Order.findOne({ _id: orderId, sellerId }).select('_id');
  if (!sellerOrder) throw new AppError('Order not found', 404, 'NOT_FOUND');

  return requestReturnPickupOtpService(orderId);
};

export const updateSellerReturnStatusService = async (sellerId, orderId, payload = {}) => {
  logger.info(`[SERVICE] updateSellerReturnStatusService → sellerId: ${sellerId} | orderId: ${orderId}`);
  const sellerOrder = await Order.findOne({ _id: orderId, sellerId }).select('_id');
  if (!sellerOrder) throw new AppError('Order not found', 404, 'NOT_FOUND');

  return resolveReturnService(orderId, payload);
};

// ─── Update Order Status (Seller) ────────────────────────────────────────────
export const updateOrderStatusService = async (sellerId, orderId, { status }) => {
  logger.info(`[SERVICE] updateOrderStatusService → sellerId: ${sellerId} | orderId: ${orderId} | status: ${status}`);
  const order = await Order.findOne({ _id: orderId, sellerId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  const allowedTransitions = {
    placed: ['accepted'],
    accepted: ['packed'],
    packed: ['shipped'],
    shipped: ['out_for_delivery'],
  };

  const allowed = allowedTransitions[order.status];
  if (!allowed || !allowed.includes(status)) {
    throw new AppError(
      `Cannot move order from "${order.status}" to "${status}"`,
      400,
      'VALIDATION_ERROR'
    );
  }

  order.status = status;
  setStatusTimestamp(order);
  await order.save();

  notifyCustomerOrderStatus(order, status);

  if (status === 'out_for_delivery') {
    await issueDeliveryOtpForOrder(order, { failSilently: true });
  }

  logger.info(`Order ${orderId} status updated to ${status} by seller ${sellerId}`);
  return order;
};

// ─── Reject Order (Seller) ────────────────────────────────────────────────────
export const rejectOrderService = async (sellerId, orderId, { reason }) => {
  logger.info(`[SERVICE] rejectOrderService → sellerId: ${sellerId} | orderId: ${orderId}`);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
  const order = await Order.findOne({ _id: orderId, sellerId }).session(session);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  if (order.status !== SELLER_REJECTABLE_STATUS) {
    throw new AppError(
      `Order can only be rejected at "placed" status, current status is "${order.status}"`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Restore stock on rejection
  await restoreStock(order.items, session);

  order.status = 'rejected';
  order.rejectionReason = reason;
  order.cancelledBy = 'seller';
  order.cancelledAt = new Date();
  await order.save({ session });

  createNotification({
    userId: order.customerId.toString(),
    type: 'ORDER_REJECTED',
    message: `Your order #${getPublicOrderId(order)} was rejected by the seller.`,
    refId: order._id.toString(),
    refModel: 'Order',
  });

  await session.commitTransaction();

  logger.info(`Order ${orderId} rejected by seller ${sellerId}`);
  return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────
export const getAllOrdersService = async (query = {}) => {
  logger.info('[SERVICE] getAllOrdersService → request received');
  const { status, customerId, sellerId, page = 1, limit = 20 } = query;

  const filter = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;
  if (sellerId) filter.sellerId = sellerId;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'email phone status firstName lastName')
      .populate('sellerId', 'email phone status firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const normalizedOrders = orders.map((orderDoc) => {
    const order = orderDoc.toObject();
    order.orderNumber = getPublicOrderId(orderDoc);
    return order;
  });

  return {
    orders: normalizedOrders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Admin Override Status ────────────────────────────────────────────────────
export const adminUpdateOrderStatusService = async (orderId, { status }) => {
  logger.info(`[SERVICE] adminUpdateOrderStatusService → orderId: ${orderId} | status: ${status}`);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

  order.status = status;
  setStatusTimestamp(order);
  if (status === 'cancelled') order.cancelledBy = 'admin';
  await order.save();

  logger.info(`Order ${orderId} status overridden to ${status} by admin`);
  return order;
};

// ─── Admin Get All Returns ────────────────────────────────────────────────────
export const getAllReturnsService = async () => {
  logger.info('[SERVICE] getAllReturnsService → request received');
  const orders = await Order.find({ 'returnRequest': { $ne: null } })
    .populate('customerId', 'email phone status firstName lastName')
    .populate('sellerId', 'email phone status firstName lastName')
    .sort({ createdAt: -1 });

  return orders.map((orderDoc) => {
    const order = orderDoc.toObject();
    order.orderNumber = getPublicOrderId(orderDoc);
    return order;
  });
};

// ─── Admin Resolve Return ─────────────────────────────────────────────────────
export const requestReturnPickupOtpService = async (orderId) => {
  logger.info(`[SERVICE] requestReturnPickupOtpService → orderId: ${orderId}`);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (!order.returnRequest) throw new AppError('No return request on this order', 404, 'NOT_FOUND');

  return issueReturnPickupOtpForOrder(order, { failSilently: false, force: false });
};

export const resolveReturnService = async (orderId, { status, adminNote, otp }) => {
  logger.info(`[SERVICE] resolveReturnService → orderId: ${orderId} | targetStatus: ${status}`);
  const nextStatus = String(status || '').toLowerCase();
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (!order.returnRequest) throw new AppError('No return request on this order', 404, 'NOT_FOUND');

  const currentStatus = String(order.returnRequest.status || 'requested').toLowerCase();

  if (RETURN_TERMINAL_STATUSES.has(currentStatus)) {
    throw new AppError('Return request has already been resolved', 400, 'VALIDATION_ERROR');
  }

  const allowed = RETURN_ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Cannot move return from "${currentStatus}" to "${nextStatus}"`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (adminNote) {
    order.returnRequest.adminNote = adminNote;
  }

  if (nextStatus === 'accepted') {
    order.returnRequest.status = 'accepted';
    order.returnRequest.acceptedAt = new Date();
    order.returnRequest.resolvedAt = null;
    order.returnRequest.rejectedAt = null;
    order.markModified('returnRequest');
    await order.save();

    await issueReturnPickupOtpForOrder(order, { failSilently: true, force: true });

    createNotification({
      userId: order.customerId.toString(),
      type: 'RETURN_UPDATED',
      message: `Return for order #${getPublicOrderId(order)} accepted. Pickup OTP has been sent to your email.`,
      refId: order._id.toString(),
      refModel: 'Order',
    });

    logger.info(`Return for order ${orderId} moved to accepted by admin`);
    return order;
  }

  if (nextStatus === 'picked') {
    if (!otp) {
      throw new AppError('Pickup OTP is required to mark return as picked', 400, 'VALIDATION_ERROR');
    }

    await verifyReturnPickupOtp(order, otp);
    order.returnRequest.status = 'picked';
    order.returnRequest.pickedAt = new Date();
    order.markModified('returnRequest');
    await order.save();

    createNotification({
      userId: order.customerId.toString(),
      type: 'RETURN_UPDATED',
      message: `Return item for order #${getPublicOrderId(order)} has been picked up successfully.`,
      refId: order._id.toString(),
      refModel: 'Order',
    });

    logger.info(`Return for order ${orderId} marked picked by admin`);
    return order;
  }

  if (nextStatus === 'received') {
    order.returnRequest.status = 'received';
    order.returnRequest.receivedAt = new Date();
    order.markModified('returnRequest');
    await order.save();

    createNotification({
      userId: order.customerId.toString(),
      type: 'RETURN_UPDATED',
      message: `Returned item for order #${getPublicOrderId(order)} has been received by the seller.`,
      refId: order._id.toString(),
      refModel: 'Order',
    });

    logger.info(`Return for order ${orderId} marked received by admin`);
    return order;
  }

  if (nextStatus === 'refund_completed') {
    const refundResult = await processReturnRefundIfNeeded(order);
    const walletResult = await deductSellerWalletForReturn(order);

    order.returnRequest.status = 'refund_completed';
    order.returnRequest.refundCompletedAt = new Date();
    order.returnRequest.resolvedAt = new Date();

    if (refundResult.refunded || refundResult.alreadyRefunded) {
      const refundedAmountRupees = refundResult.refundedAmountPaise
        ? Number(refundResult.refundedAmountPaise) / 100
        : Number(order.totalAmount || 0);
      order.returnRequest.refundedAmount = Number(refundedAmountRupees.toFixed(2));
    }

    order.returnRequest.walletDeducted = Boolean(walletResult.deducted);
    order.returnRequest.walletDeductionAmount = Number(Number(walletResult.amount || 0).toFixed(2));
    order.markModified('returnRequest');
    await order.save();

    createNotification({
      userId: order.customerId.toString(),
      type: 'RETURN_UPDATED',
      message: `Refund completed for order #${getPublicOrderId(order)}.`,
      refId: order._id.toString(),
      refModel: 'Order',
    });

    if (walletResult.deducted) {
      createNotification({
        userId: order.sellerId.toString(),
        type: 'RETURN_UPDATED',
        message: `Wallet adjusted by ₹${Number(walletResult.amount || 0).toFixed(2)} for return on order #${getPublicOrderId(order)}.`,
        refId: order._id.toString(),
        refModel: 'Order',
      });
    }

    logger.info(`Return for order ${orderId} marked refund_completed by admin`);
    return order;
  }

  if (nextStatus === 'rejected') {
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectedAt = new Date();
    order.returnRequest.resolvedAt = new Date();
    order.returnRequest.pickupOtp = null;
    order.returnRequest.pickupOtpExpiresAt = null;
    order.returnRequest.pickupOtpRequestedAt = null;
    order.returnRequest.pickupOtpAttemptCount = 0;
    order.returnRequest.pickupOtpLockedUntil = null;
    order.markModified('returnRequest');
    await order.save();

    createNotification({
      userId: order.customerId.toString(),
      type: 'RETURN_UPDATED',
      message: `Return request for order #${getPublicOrderId(order)} was rejected.`,
      refId: order._id.toString(),
      refModel: 'Order',
    });

    logger.info(`Return for order ${orderId} rejected by admin`);
    return order;
  }

  throw new AppError('Unsupported return status transition', 400, 'VALIDATION_ERROR');
};
