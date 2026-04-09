import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, 'Invalid ObjectId');

export const addToCartSchema = z.object({
  productId: objectId,
  variantId: objectId,
  quantity: z
    .number({ invalid_type_error: 'quantity must be a number' })
    .int('quantity must be a whole number')
    .min(1, 'quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number({ invalid_type_error: 'quantity must be a number' })
    .int('quantity must be a whole number')
    .min(1, 'quantity must be at least 1'),
});