import { z } from 'zod';

// ─── Create Review ────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  orderId: z
    .string({ required_error: 'orderId is required' })
    .regex(/^[a-fA-F0-9]{24}$/, 'orderId must be a valid ObjectId'),
  rating: z
    .number({ required_error: 'rating is required', invalid_type_error: 'rating must be a number' })
    .int('rating must be a whole number')
    .min(1, 'rating must be at least 1')
    .max(5, 'rating cannot exceed 5'),
  title: z
    .string()
    .trim()
    .min(4, 'title must be at least 4 characters')
    .max(300, 'title cannot exceed 300 characters')
    .optional(),
  body: z
    .string()
    .trim()
    .min(4, 'body must be at least 4 characters')
    .max(3000, 'body cannot exceed 3000 characters')
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url('image url must be a valid URL'),
        publicId: z.string().nullable().optional(),
      })
    )
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

// ─── Update Review ────────────────────────────────────────────────────────────

export const updateReviewSchema = z
  .object({
    rating: z
      .number({ invalid_type_error: 'rating must be a number' })
      .int('rating must be a whole number')
      .min(1, 'rating must be at least 1')
      .max(5, 'rating cannot exceed 5')
      .optional(),
    title: z
      .string()
      .trim()
      .min(4, 'title must be at least 4 characters')
      .max(300, 'title cannot exceed 300 characters')
      .nullable()
      .optional(),
    body: z
      .string()
      .trim()
      .min(4, 'body must be at least 4 characters')
      .max(3000, 'body cannot exceed 3000 characters')
      .nullable()
      .optional(),
    images: z
      .array(
        z.object({
          url: z.string().url('image url must be a valid URL'),
          publicId: z.string().nullable().optional(),
        })
      )
      .max(5, 'Maximum 5 images allowed')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// ─── Seller Response ──────────────────────────────────────────────────────────

export const sellerResponseSchema = z.object({
  text: z
    .string({ required_error: 'text is required' })
    .trim()
    .min(4, 'Response must be at least 4 characters')
    .max(1000, 'Response cannot exceed 1000 characters'),
});

// ─── List Reviews Query ───────────────────────────────────────────────────────

export const listReviewsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page must be a positive integer')
    .transform(Number)
    .refine((n) => n >= 1, 'page must be at least 1')
    .optional()
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'limit must be a positive integer')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 50, 'limit must be between 1 and 50')
    .optional()
    .default('10'),
});

// ─── Admin Delete Query ───────────────────────────────────────────────────────

export const adminDeleteReviewSchema = z.object({
  reason: z
    .string({ required_error: 'reason is required' })
    .trim()
    .min(5, 'reason must be at least 5 characters'),
});