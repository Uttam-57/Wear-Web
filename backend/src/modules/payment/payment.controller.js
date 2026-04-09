import logger from '../../utils/logger.js';
import {
  initiatePaymentService,
  confirmPaymentService,
  handleWebhookService,
  processRefundService,
  getPaymentHistoryService,
  getAllPaymentsService,
} from './payment.service.js';

export const initiatePayment = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] initiatePayment → customerId: ${req.user.userId}`);
    const { orderIds, addressId, paymentMethod } = req.body;
    const customerId = req.user.userId;

    const data = await initiatePaymentService({ customerId, orderIds, addressId, paymentMethod });

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] confirmPayment → customerId: ${req.user.userId}`);
    const { purchaseId, paymentIntentId } = req.body;
    const customerId = req.user.userId;

    const data = await confirmPaymentService({ customerId, purchaseId, paymentIntentId });

    res.status(200).json({
      success: true,
      message: 'Payment confirmation checked successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    logger.info('[CONTROLLER] handleWebhook → request received');
    const signature = req.headers['stripe-signature'];

    const data = await handleWebhookService({
      rawBody: req.body, // raw buffer — set by express.raw() in app.js
      signature,
    });

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] refundPayment → customerId: ${req.user.userId} | orderId: ${req.params.orderId}`);
    const { orderId } = req.params;
    const customerId = req.user.userId;
    const { reason } = req.body;

    const data = await processRefundService({ orderId, customerId, reason });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getPaymentHistory → customerId: ${req.user.userId}`);
    const customerId = req.user.userId;

    const data = await getPaymentHistoryService({ customerId });

    res.status(200).json({
      success: true,
      message: 'Payment history retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getAllPayments → admin request | page: ${req.parsedQuery?.page} | limit: ${req.parsedQuery?.limit}`);
    const page = parseInt(req.parsedQuery?.page) || 1;
    const limit = parseInt(req.parsedQuery?.limit) || 20;

    const data = await getAllPaymentsService({ page, limit });

    res.status(200).json({
      success: true,
      message: 'All payments retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};