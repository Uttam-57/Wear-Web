import Product from '../product/product.model.js';
import { createNotification } from '../../utils/notification.utils.js';
import { getPublicOrderId } from '../../utils/orderId.utils.js';
import { STATUS_TIMESTAMP_MAP } from './order.constants.js';

export const setStatusTimestamp = (order) => {
  const field = STATUS_TIMESTAMP_MAP[order.status];
  if (field) order[field] = new Date();
};

export const notifyCustomerOrderStatus = (order, status) => {
  const statusKey = String(status || '').toLowerCase();
  const publicOrderId = getPublicOrderId(order);

  const notificationMap = {
    accepted: {
      type: 'ORDER_ACCEPTED',
      message: `Your order #${publicOrderId} has been accepted by the seller.`,
    },
    packed: {
      type: 'ORDER_PACKED',
      message: `Your order #${publicOrderId} has been packed and is preparing for dispatch.`,
    },
    shipped: {
      type: 'ORDER_SHIPPED',
      message: `Your order #${publicOrderId} has been shipped and is on its way.`,
    },
    out_for_delivery: {
      type: 'ORDER_OUT_FOR_DELIVERY',
      message: `Your order #${publicOrderId} is out for delivery. Check your email for delivery OTP.`,
    },
  };

  const entry = notificationMap[statusKey];
  if (!entry) return;

  createNotification({
    userId: order.customerId.toString(),
    type: entry.type,
    message: entry.message,
    refId: order._id.toString(),
    refModel: 'Order',
  });
};

export const parseSortParam = (sortValue = '-createdAt') => {
  const sortFields = String(sortValue || '-createdAt')
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  if (!sortFields.length) return { createdAt: -1 };

  const sort = {};
  sortFields.forEach((field) => {
    if (field.startsWith('-')) {
      sort[field.slice(1)] = -1;
    } else {
      sort[field] = 1;
    }
  });

  return Object.keys(sort).length ? sort : { createdAt: -1 };
};

export const restoreStock = async (items, session) => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': item.quantity } },
      session ? { session } : undefined
    );
  }
};
