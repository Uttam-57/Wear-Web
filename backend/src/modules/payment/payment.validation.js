import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'))
    .min(1, 'At least one order ID is required'),
  addressId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid address ID'),
  paymentMethod: z.enum(['card', 'upi']).default('card'),
});

export const confirmPaymentSchema = z.object({
  purchaseId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid purchase ID'),
  paymentIntentId: z
    .string()
    .min(1, 'Payment intent ID is required')
    .regex(/^pi_/i, 'Invalid payment intent ID'),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(1, 'Refund reason is required').max(500),
});