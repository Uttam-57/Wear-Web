import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  initiatePaymentSchema,
  confirmPaymentSchema,
  refundPaymentSchema,
} from './payment.validation.js';
import {
  initiatePayment,
  confirmPayment,
  handleWebhook,
  refundPayment,
  getPaymentHistory,
  getAllPayments,
} from './payment.controller.js';

const router = express.Router();

// ─── Webhook (no auth — Stripe calls this directly) ─────────────────────────
// NOTE: This route requires express.raw() body parsing, handled in app.js
// before global express.json(). Do not add authenticate here.
router.post('/webhook', handleWebhook);

// Apply rate limiting only to authenticated/API routes, not Stripe webhooks.
router.use(rateLimiter('general'));

// ─── Customer Routes ─────────────────────────────────────────────────────────
router.post(
  '/initiate',
  authenticate,
  authorize('customer'),
  validate(initiatePaymentSchema),
  initiatePayment
);

router.post(
  '/confirm',
  authenticate,
  authorize('customer'),
  validate(confirmPaymentSchema),
  confirmPayment
);

router.post(
  '/refund/:orderId',
  authenticate,
  authorize('customer'),
  validate(refundPaymentSchema),
  refundPayment
);

router.get(
  '/history',
  authenticate,
  authorize('customer'),
  getPaymentHistory
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get(
  '/admin/payments',
  authenticate,
  authorize('admin'),
  getAllPayments
);

export default router;