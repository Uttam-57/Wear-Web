import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  createReviewSchema,
  updateReviewSchema,
  sellerResponseSchema,
  listReviewsQuerySchema,
  adminDeleteReviewSchema,
} from './review.validation.js';
import {
  createReview,
  listReviews,
  updateReview,
  deleteReview,
  addSellerResponse,
  deleteSellerResponse,
  adminDeleteReview,
} from './review.controller.js';

const router = Router();

router.use(rateLimiter('general'));

// ─── Public ───────────────────────────────────────────────────────────────────

router.get(
  '/products/:productId/reviews',
  validate(listReviewsQuerySchema, 'query'),
  listReviews
);

// ─── Customer ─────────────────────────────────────────────────────────────────

router.post(
  '/products/:productId/reviews',
  authenticate,
  authorize('customer'),
  validate(createReviewSchema),
  createReview
);

router.put(
  '/reviews/:reviewId',
  authenticate,
  authorize('customer'),
  validate(updateReviewSchema),
  updateReview
);

router.delete(
  '/reviews/:reviewId',
  authenticate,
  authorize('customer'),
  deleteReview
);

// ─── Seller ───────────────────────────────────────────────────────────────────

router.post(
  '/reviews/:reviewId/seller-response',
  authenticate,
  authorize('seller'),
  validate(sellerResponseSchema),
  addSellerResponse
);

router.delete(
  '/reviews/:reviewId/seller-response',
  authenticate,
  authorize('seller'),
  deleteSellerResponse
);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.delete(
  '/admin/reviews/:reviewId',
  authenticate,
  authorize('admin'),
  validate(adminDeleteReviewSchema),
  adminDeleteReview
);

export default router;