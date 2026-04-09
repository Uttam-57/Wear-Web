import logger from '../../utils/logger.js';
import {
  placeOrderService,
  getCustomerOrdersService,
  getOrderByIdService,
  cancelOrderService,
  confirmDeliveryService,
  confirmDeliveryBySellerService,
  requestReturnService,
  getReturnStatusService,
  getSellerOrdersService,
  getSellerReturnsService,
  requestSellerReturnPickupOtpService,
  updateSellerReturnStatusService,
  updateOrderStatusService,
  rejectOrderService,
  getAllOrdersService,
  adminUpdateOrderStatusService,
  getAllReturnsService,
  requestReturnPickupOtpService,
  resolveReturnService,
} from './order.service.js';
import { requestDeliveryOtpService } from './order.service.js';

export const requestDeliveryOtp = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] requestDeliveryOtp → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const result = await requestDeliveryOtpService(req.user.userId, req.params.id);
    const data = process.env.NODE_ENV === 'test' ? { otp: result?.otp } : {};
    res.status(200).json({
      success: true,
      message: 'OTP sent to your registered email',
      data,
    });
  } catch (err) {
    next(err);
  }
};
// ─── Customer ─────────────────────────────────────────────────────────────────

export const placeOrder = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] placeOrder → userId: ${req.user.userId}`);
    const orders = await placeOrderService(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { orders },
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getCustomerOrders → userId: ${req.user.userId}`);
    const orders = await getCustomerOrdersService(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Orders retrieved',
      data: { orders },
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getOrderById → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await getOrderByIdService(req.user.userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Order retrieved',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] cancelOrder → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await cancelOrderService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Order cancelled',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const confirmDelivery = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] confirmDelivery → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await confirmDeliveryService(req.user.userId, req.params.id, req.body.otp);
    res.status(200).json({
      success: true,
      message: 'Delivery confirmed',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const confirmDeliveryBySeller = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] confirmDeliveryBySeller → sellerId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await confirmDeliveryBySellerService(req.user.userId, req.params.id, req.body.otp);
    res.status(200).json({
      success: true,
      message: 'Delivery confirmed',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const requestReturn = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] requestReturn → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await requestReturnService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Return request submitted',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const getReturnStatus = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getReturnStatus → userId: ${req.user.userId} | orderId: ${req.params.id}`);
    const returnRequest = await getReturnStatusService(req.user.userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Return status retrieved',
      data: { returnRequest },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getSellerOrders = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getSellerOrders → sellerId: ${req.user.userId}`);
    const result = await getSellerOrdersService(req.user.userId, req.query || {});

    if (Array.isArray(result)) {
      res.status(200).json({
        success: true,
        message: 'Orders retrieved',
        data: { orders: result },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Orders retrieved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] updateOrderStatus → sellerId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await updateOrderStatusService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const rejectOrder = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] rejectOrder → sellerId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await rejectOrderService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Order rejected',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOrders = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getAllOrders → adminId: ${req.user.userId}`);
    const result = await getAllOrdersService(req.parsedQuery);
    res.status(200).json({
      success: true,
      message: 'All orders retrieved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] adminUpdateOrderStatus → adminId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await adminUpdateOrderStatusService(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllReturns = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getAllReturns → adminId: ${req.user.userId}`);
    const orders = await getAllReturnsService();
    res.status(200).json({
      success: true,
      message: 'Return requests retrieved',
      data: { orders },
    });
  } catch (err) {
    next(err);
  }
};

export const resolveReturn = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] resolveReturn → adminId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await resolveReturnService(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Return request resolved',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerReturns = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getSellerReturns → sellerId: ${req.user.userId}`);
    const result = await getSellerReturnsService(req.user.userId, req.query || {});
    res.status(200).json({
      success: true,
      message: 'Returns retrieved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const requestReturnPickupOtp = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] requestReturnPickupOtp → adminId: ${req.user.userId} | orderId: ${req.params.id}`);
    const result = await requestReturnPickupOtpService(req.params.id);
    const data = process.env.NODE_ENV === 'test' ? { otp: result?.otp } : {};
    res.status(200).json({
      success: true,
      message: 'Return pickup OTP sent to customer email',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const requestSellerReturnPickupOtp = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] requestSellerReturnPickupOtp → sellerId: ${req.user.userId} | orderId: ${req.params.id}`);
    const result = await requestSellerReturnPickupOtpService(req.user.userId, req.params.id);
    const data = process.env.NODE_ENV === 'test' ? { otp: result?.otp } : {};
    res.status(200).json({
      success: true,
      message: 'Return pickup OTP sent to customer email',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSellerReturnStatus = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] updateSellerReturnStatus → sellerId: ${req.user.userId} | orderId: ${req.params.id}`);
    const order = await updateSellerReturnStatusService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Return status updated',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};