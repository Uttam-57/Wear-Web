import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { requireSellerApproved } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  sellerAnalyticsQuerySchema,
  adminAnalyticsQuerySchema,
} from './analytics.validation.js';
import {
  getSellerAnalyticsController,
  getAdminAnalyticsController,
} from './analytics.controller.js';

const router = Router();

router.use(rateLimiter('general'));

// GET /seller/analytics
router.get(
  '/seller/analytics',
  authenticate,
  authorize('seller'),
  requireSellerApproved,
  validate(sellerAnalyticsQuerySchema, 'query'),
  getSellerAnalyticsController
);

// GET /admin/analytics
router.get(
  '/admin/analytics',
  authenticate,
  authorize('admin'),
  validate(adminAnalyticsQuerySchema, 'query'),
  getAdminAnalyticsController
);

export default router;