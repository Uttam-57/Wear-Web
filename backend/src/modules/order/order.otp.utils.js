import crypto from 'crypto';
import { sendEmail, deliveryOtpTemplate, returnPickupOtpTemplate } from '../../utils/email.utils.js';
import User from '../user/user.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';
import { createNotification } from '../../utils/notification.utils.js';
import { getPublicOrderId } from '../../utils/orderId.utils.js';
import {
  OTP_EXPIRY_MS,
  OTP_LOCK_MS,
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_COOLDOWN_MS,
} from './order.constants.js';
import { setStatusTimestamp } from './order.lifecycle.utils.js';

const generateOtp = () => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hash };
};

export const issueDeliveryOtpForOrder = async (order, { failSilently = false } = {}) => {
  const customer = await User.findById(order.customerId).select('email');
  const publicOrderId = getPublicOrderId(order);
  if (!customer) {
    if (failSilently) return { otp: null, sent: false };
    throw new AppError('Customer not found', 404, 'NOT_FOUND');
  }

  const { otp, hash } = generateOtp();
  order.deliveryOtp = hash;
  order.deliveryOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  order.deliveryOtpRequestedAt = new Date();
  order.deliveryOtpAttemptCount = 0;
  order.deliveryOtpLockedUntil = null;

  await order.save();

  try {
    await sendEmail(
      customer.email,
      'Your WearWeb Delivery OTP',
      deliveryOtpTemplate(otp, { orderId: publicOrderId })
    );
  } catch (err) {
    if (!failSilently) throw err;
    logger.error(`[ORDER] Failed to send delivery OTP email for order ${order._id}: ${err.message}`);
    return { otp: null, sent: false };
  }

  if (process.env.NODE_ENV === 'test') {
    return { otp, sent: true };
  }

  logger.info(`[ORDER] Delivery OTP sent for order ${order._id} to ${customer.email}`);
  return { otp: null, sent: true };
};

export const issueReturnPickupOtpForOrder = async (
  order,
  { failSilently = false, force = false } = {}
) => {
  if (!order?.returnRequest) {
    throw new AppError('No return request found for this order', 404, 'NOT_FOUND');
  }

  if (order.returnRequest.status !== 'accepted') {
    throw new AppError('Return pickup OTP can only be issued for accepted returns', 400, 'VALIDATION_ERROR');
  }

  const now = Date.now();
  const requestedAt = order.returnRequest.pickupOtpRequestedAt
    ? new Date(order.returnRequest.pickupOtpRequestedAt).getTime()
    : 0;

  if (!force && requestedAt && now - requestedAt < OTP_REQUEST_COOLDOWN_MS) {
    throw new AppError('OTP was requested recently. Please wait a minute before requesting again.', 429, 'TOO_MANY_REQUESTS');
  }

  const customer = await User.findById(order.customerId).select('email');
  if (!customer) {
    if (failSilently) return { otp: null, sent: false };
    throw new AppError('Customer not found', 404, 'NOT_FOUND');
  }

  const { otp, hash } = generateOtp();

  order.returnRequest.pickupOtp = hash;
  order.returnRequest.pickupOtpExpiresAt = new Date(now + OTP_EXPIRY_MS);
  order.returnRequest.pickupOtpRequestedAt = new Date(now);
  order.returnRequest.pickupOtpAttemptCount = 0;
  order.returnRequest.pickupOtpLockedUntil = null;
  order.markModified('returnRequest');
  await order.save();

  try {
    await sendEmail(
      customer.email,
      'Your WearWeb Return Pickup OTP',
      returnPickupOtpTemplate(otp, { orderId: getPublicOrderId(order) })
    );
  } catch (err) {
    if (!failSilently) throw err;
    logger.error(`[RETURN] Failed to send pickup OTP email for order ${order._id}: ${err.message}`);
    return { otp: null, sent: false };
  }

  if (process.env.NODE_ENV === 'test') {
    return { otp, sent: true };
  }

  logger.info(`[RETURN] Pickup OTP sent for order ${order._id} to ${customer.email}`);
  return { otp: null, sent: true };
};

export const verifyReturnPickupOtp = async (order, otp) => {
  if (!order?.returnRequest) {
    throw new AppError('No return request found for this order', 404, 'NOT_FOUND');
  }

  if (order.returnRequest.status !== 'accepted') {
    throw new AppError('Return can be marked picked only after acceptance', 400, 'VALIDATION_ERROR');
  }

  if (order.returnRequest.pickupOtpLockedUntil && order.returnRequest.pickupOtpLockedUntil > new Date()) {
    throw new AppError('Too many invalid OTP attempts. Please try again later.', 429, 'TOO_MANY_REQUESTS');
  }

  if (!order.returnRequest.pickupOtp || !order.returnRequest.pickupOtpExpiresAt) {
    throw new AppError('Pickup OTP not generated. Request a new OTP.', 400, 'VALIDATION_ERROR');
  }

  if (new Date() > order.returnRequest.pickupOtpExpiresAt) {
    throw new AppError('Pickup OTP has expired. Request a new OTP.', 400, 'VALIDATION_ERROR');
  }

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  if (hash !== order.returnRequest.pickupOtp) {
    order.returnRequest.pickupOtpAttemptCount = (order.returnRequest.pickupOtpAttemptCount || 0) + 1;

    if (order.returnRequest.pickupOtpAttemptCount >= OTP_MAX_ATTEMPTS) {
      order.returnRequest.pickupOtpLockedUntil = new Date(Date.now() + OTP_LOCK_MS);
      order.returnRequest.pickupOtp = null;
      order.returnRequest.pickupOtpExpiresAt = null;
      order.markModified('returnRequest');
      await order.save();
      throw new AppError('Too many invalid OTP attempts. Please request a new OTP later.', 429, 'TOO_MANY_REQUESTS');
    }

    order.markModified('returnRequest');
    await order.save();
    throw new AppError('Invalid OTP', 400, 'VALIDATION_ERROR');
  }

  order.returnRequest.pickupOtp = null;
  order.returnRequest.pickupOtpExpiresAt = null;
  order.returnRequest.pickupOtpRequestedAt = null;
  order.returnRequest.pickupOtpAttemptCount = 0;
  order.returnRequest.pickupOtpLockedUntil = null;
  order.markModified('returnRequest');
};

export const confirmDeliveryByOtp = async (order, otp) => {
  if (order.status !== 'out_for_delivery') {
    throw new AppError(
      'Delivery can only be confirmed when order is out for delivery',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!order.deliveryOtp || !order.deliveryOtpExpiresAt) {
    throw new AppError('OTP not generated. Ask seller to resend OTP.', 400, 'VALIDATION_ERROR');
  }

  if (order.deliveryOtpLockedUntil && order.deliveryOtpLockedUntil > new Date()) {
    throw new AppError('Too many invalid OTP attempts. Please try again later.', 429, 'TOO_MANY_REQUESTS');
  }

  if (new Date() > order.deliveryOtpExpiresAt) {
    throw new AppError('OTP has expired. Request a new OTP.', 400, 'VALIDATION_ERROR');
  }

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  if (hash !== order.deliveryOtp) {
    order.deliveryOtpAttemptCount = (order.deliveryOtpAttemptCount || 0) + 1;
    if (order.deliveryOtpAttemptCount >= OTP_MAX_ATTEMPTS) {
      order.deliveryOtpLockedUntil = new Date(Date.now() + OTP_LOCK_MS);
      order.deliveryOtp = null;
      order.deliveryOtpExpiresAt = null;
      await order.save();
      throw new AppError('Too many invalid OTP attempts. Please request a new OTP later.', 429, 'TOO_MANY_REQUESTS');
    }

    await order.save();
    throw new AppError('Invalid OTP', 400, 'VALIDATION_ERROR');
  }

  order.deliveryOtp = null;
  order.deliveryOtpExpiresAt = null;
  order.deliveryOtpRequestedAt = null;
  order.deliveryOtpAttemptCount = 0;
  order.deliveryOtpLockedUntil = null;
  order.status = 'delivered';
  setStatusTimestamp(order);
  await order.save();

  createNotification({
    userId: order.customerId.toString(),
    type: 'ORDER_DELIVERED',
    message: `Your order #${getPublicOrderId(order)} has been marked as delivered.`,
    refId: order._id.toString(),
    refModel: 'Order',
  });

  try {
    const { creditDeliveredOrderPayoutService } = await import('../wallet/wallet.service.js');
    await creditDeliveredOrderPayoutService({ orderId: order._id, enforceReturnWindow: false });
  } catch (err) {
    logger.error(`[ORDER] Failed to reconcile wallet credit for order ${order._id}: ${err.message}`);
  }

  return order;
};
