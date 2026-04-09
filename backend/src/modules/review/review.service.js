import mongoose from 'mongoose';
import AppError from '../../utils/appError.js';
import Review from './review.model.js';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import { createNotification } from '../../utils/notification.utils.js';
import logger from '../../utils/logger.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recalculates avgRating and totalReviews on Product from current Review documents.
 * Called after every review create or delete.
 */
const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length > 0 ? result[0].count : 0;

  await Product.findByIdAndUpdate(productId, {
    avgRating: avg,
    totalReviews: count,
  });
};

// ─── Create Review ────────────────────────────────────────────────────────────

export const createReviewService = async (customerId, productId, data) => {
  logger.info(`[SERVICE] createReviewService → customerId: ${customerId} | productId: ${productId}`);
  const { orderId, rating, title, body, images } = data;

  // Verify order belongs to customer, contains this product, and is delivered
  const order = await Order.findOne({
    _id: orderId,
    customerId,
    status: 'delivered',
    'items.productId': productId,
  });

  if (!order) {
    throw new AppError(
      'No delivered order found for this product. You can only review products you have received.',
      404,
      'NOT_FOUND'
    );
  }

  // Get sellerId from the order item for this product
  const orderItem = order.items.find(
    (item) => item.productId.toString() === productId.toString()
  );
  const sellerId = orderItem.sellerId;

  // Check product exists and is not removed
  const product = await Product.findById(productId);
  if (!product || product.status === 'removed') {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  // Check duplicate — one review per order per product
  const existing = await Review.findOne({ orderId, productId });
  if (existing) {
    throw new AppError(
      'You have already reviewed this product for this order',
      409,
      'CONFLICT'
    );
  }

  const review = await Review.create({
    productId,
    customerId,
    orderId,
    sellerId,
    rating,
    title: title ?? null,
    body: body ?? null,
    images: images ?? [],
  });

  await recalculateProductRating(productId);

  createNotification({
    userId: review.sellerId.toString(),
    type: 'REVIEW_RECEIVED',
    message: `A customer left a ${review.rating}-star review on one of your products.`,
    refId: review._id.toString(),
    refModel: 'Review',
  });

  return review;
};

// ─── List Reviews for Product ─────────────────────────────────────────────────

export const listReviewsService = async (productId, query) => {
  logger.info(`[SERVICE] listReviewsService → productId: ${productId} | page: ${query.page} | limit: ${query.limit}`);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const product = await Product.findById(productId).select('_id');
  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    Review.countDocuments({ productId }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Update Review ────────────────────────────────────────────────────────────

export const updateReviewService = async (customerId, reviewId, data) => {
  logger.info(`[SERVICE] updateReviewService → customerId: ${customerId} | reviewId: ${reviewId}`);
  const review = await Review.findOne({ _id: reviewId, customerId });
  if (!review) {
    throw new AppError('Review not found', 404, 'NOT_FOUND');
  }

  const { rating, title, body, images } = data;

  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (body !== undefined) review.body = body;
  if (images !== undefined) review.images = images;

  await review.save();

  await recalculateProductRating(review.productId);

  return review;
};

// ─── Delete Review (Customer) ─────────────────────────────────────────────────

export const deleteReviewService = async (customerId, reviewId) => {
  logger.info(`[SERVICE] deleteReviewService → customerId: ${customerId} | reviewId: ${reviewId}`);
  const review = await Review.findOne({ _id: reviewId, customerId });
  if (!review) {
    throw new AppError('Review not found', 404, 'NOT_FOUND');
  }

  const productId = review.productId;
  await review.deleteOne();
  await recalculateProductRating(productId);
};

// ─── Add Seller Response ──────────────────────────────────────────────────────

export const addSellerResponseService = async (sellerId, reviewId, text) => {
  logger.info(`[SERVICE] addSellerResponseService → sellerId: ${sellerId} | reviewId: ${reviewId}`);
  const review = await Review.findOne({ _id: reviewId, sellerId });
  if (!review) {
    throw new AppError('Review not found', 404, 'NOT_FOUND');
  }

  if (review.sellerResponse) {
    throw new AppError(
      'You have already responded to this review',
      409,
      'CONFLICT'
    );
  }

  review.sellerResponse = { text, createdAt: new Date() };
  await review.save();

  createNotification({
    userId: review.customerId.toString(),
    type: 'SELLER_RESPONSE_RECEIVED',
    message: 'The seller has responded to your review.',
    refId: review._id.toString(),
    refModel: 'Review',
  });

  return review;
};

// ─── Delete Seller Response ───────────────────────────────────────────────────

export const deleteSellerResponseService = async (sellerId, reviewId) => {
  logger.info(`[SERVICE] deleteSellerResponseService → sellerId: ${sellerId} | reviewId: ${reviewId}`);
  const review = await Review.findOne({ _id: reviewId, sellerId });
  if (!review) {
    throw new AppError('Review not found', 404, 'NOT_FOUND');
  }

  if (!review.sellerResponse) {
    throw new AppError('No seller response exists on this review', 404, 'NOT_FOUND');
  }

  review.sellerResponse = null;
  await review.save();
};

// ─── Admin Delete Review ──────────────────────────────────────────────────────

export const adminDeleteReviewService = async (reviewId) => {
  logger.info(`[SERVICE] adminDeleteReviewService → reviewId: ${reviewId}`);
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404, 'NOT_FOUND');
  }

  const productId = review.productId;
  await review.deleteOne();
  await recalculateProductRating(productId);
};