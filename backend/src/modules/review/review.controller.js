import logger from '../../utils/logger.js';
import {
  createReviewService,
  listReviewsService,
  updateReviewService,
  deleteReviewService,
  addSellerResponseService,
  deleteSellerResponseService,
  adminDeleteReviewService,
} from './review.service.js';

// ─── Create Review ────────────────────────────────────────────────────────────

export const createReview = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] createReview → userId: ${req.user.userId} | productId: ${req.params.productId}`);
    const review = await createReviewService(
      req.user.userId,
      req.params.productId,
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

// ─── List Reviews ─────────────────────────────────────────────────────────────

export const listReviews = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] listReviews → productId: ${req.params.productId}`);
    const result = await listReviewsService(
      req.params.productId,
      req.parsedQuery
    );
    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Review ────────────────────────────────────────────────────────────

export const updateReview = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] updateReview → userId: ${req.user.userId} | reviewId: ${req.params.reviewId}`);
    const review = await updateReviewService(
      req.user.userId,
      req.params.reviewId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Review (Customer) ─────────────────────────────────────────────────

export const deleteReview = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] deleteReview → userId: ${req.user.userId} | reviewId: ${req.params.reviewId}`);
    await deleteReviewService(req.user.userId, req.params.reviewId);
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Add Seller Response ──────────────────────────────────────────────────────

export const addSellerResponse = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] addSellerResponse → sellerId: ${req.user.userId} | reviewId: ${req.params.reviewId}`);
    const review = await addSellerResponseService(
      req.user.userId,
      req.params.reviewId,
      req.body.text
    );
    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Seller Response ───────────────────────────────────────────────────

export const deleteSellerResponse = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] deleteSellerResponse → sellerId: ${req.user.userId} | reviewId: ${req.params.reviewId}`);
    await deleteSellerResponseService(req.user.userId, req.params.reviewId);
    res.status(200).json({
      success: true,
      message: 'Seller response deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Delete Review ──────────────────────────────────────────────────────

export const adminDeleteReview = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] adminDeleteReview → reviewId: ${req.params.reviewId}`);
    await adminDeleteReviewService(req.params.reviewId);
    res.status(200).json({
      success: true,
      message: 'Review removed by admin successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};