import express from 'express';
import { authenticate, authorize, requireSellerApproved, requireSellerProfileComplete } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  rejectOrderSchema,
  cancelOrderSchema,
  adminUpdateStatusSchema,
  adminOrdersQuerySchema,
  returnRequestSchema,
  resolveReturnSchema,
  confirmDeliverySchema,
} from './order.validation.js';
import {
  placeOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder,
   requestDeliveryOtp,
  confirmDelivery,
  confirmDeliveryBySeller,
  requestReturn,
  getReturnStatus,
  getSellerOrders,
  getSellerReturns,
  requestSellerReturnPickupOtp,
  updateSellerReturnStatus,
  updateOrderStatus,
  rejectOrder,
  getAllOrders,
  adminUpdateOrderStatus,
  getAllReturns,
  requestReturnPickupOtp,
  resolveReturn,
} from './order.controller.js';

const router = express.Router();

router.use(rateLimiter('general'));

// ─── Customer Routes ──────────────────────────────────────────────────────────
router.post('/orders', authenticate, authorize('customer'), validate(placeOrderSchema), placeOrder);
router.get('/orders', authenticate, authorize('customer'), getCustomerOrders);
router.get('/orders/:id', authenticate, authorize('customer'), getOrderById);
router.put('/orders/:id/cancel', authenticate, authorize('customer'), validate(cancelOrderSchema), cancelOrder);
router.post('/orders/:id/confirm-delivery/request-otp', rateLimiter('otpRequest'), authenticate, authorize('customer'), requestDeliveryOtp);
router.post('/orders/:id/confirm-delivery', rateLimiter('otpVerify'), authenticate, authorize('customer'), validate(confirmDeliverySchema), confirmDelivery);
router.post('/orders/:id/return', authenticate, authorize('customer'), validate(returnRequestSchema), requestReturn);
router.get('/orders/:id/return', authenticate, authorize('customer'), getReturnStatus);

// ─── Seller Routes ────────────────────────────────────────────────────────────
router.get('/seller/orders', authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, getSellerOrders);
router.get('/seller/orders/returns', authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, getSellerReturns);
router.post('/seller/orders/:id/returns/request-pickup-otp', rateLimiter('otpRequest'), authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, requestSellerReturnPickupOtp);
router.put('/seller/orders/:id/returns/status', authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, validate(resolveReturnSchema), updateSellerReturnStatus);
router.put('/seller/orders/:id/status', authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, validate(updateOrderStatusSchema), updateOrderStatus);
router.put('/seller/orders/:id/reject', authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, validate(rejectOrderSchema), rejectOrder);
router.post('/seller/orders/:id/confirm-delivery', rateLimiter('otpVerify'), authenticate, authorize('seller'), requireSellerApproved, requireSellerProfileComplete, validate(confirmDeliverySchema), confirmDeliveryBySeller);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/admin/orders', authenticate, authorize('admin'), validate(adminOrdersQuerySchema, 'query'), getAllOrders);
router.put('/admin/orders/:id/status', authenticate, authorize('admin'), validate(adminUpdateStatusSchema), adminUpdateOrderStatus);
router.get('/admin/returns', authenticate, authorize('admin'), getAllReturns);
router.post('/admin/returns/:id/request-pickup-otp', rateLimiter('otpRequest'), authenticate, authorize('admin'), requestReturnPickupOtp);
router.put('/admin/returns/:id', authenticate, authorize('admin'), validate(resolveReturnSchema), resolveReturn);

export default router;