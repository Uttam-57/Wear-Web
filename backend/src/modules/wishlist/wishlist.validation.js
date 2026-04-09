import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const addToWishlistSchema = z.object({
  productId: z
    .string({ required_error: 'productId is required' })
    .regex(objectIdRegex, 'productId must be a valid ObjectId'),
});