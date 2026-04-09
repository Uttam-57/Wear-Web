import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, 'Invalid ObjectId');

// ─── Place Order ─────────────────────────────────────────────────────────────
// Customer selects specific cart items (by variantId) and picks an address
export const placeOrderSchema = z.object({
  variantIds: z
    .array(objectId)
    .min(1, 'Select at least one item to order'),
  addressId: objectId,
});

// ─── Update Order Status (Seller) ────────────────────────────────────────────
export const updateOrderStatusSchema = z.object({
  status: z.enum(['accepted', 'packed', 'shipped', 'out_for_delivery'], {
    errorMap: () => ({ message: 'Invalid status. Allowed: accepted, packed, shipped, out_for_delivery' }),
  }),
});

// ─── Reject Order (Seller) ───────────────────────────────────────────────────
export const rejectOrderSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters').trim(),
});

// ─── Cancel Order (Customer) ─────────────────────────────────────────────────
export const cancelOrderSchema = z.object({
  reason: z.string().min(5, 'Cancellation reason must be at least 5 characters').trim(),
});

// ─── Admin Override Status ───────────────────────────────────────────────────
export const adminUpdateStatusSchema = z.object({
  status: z.enum(
    ['placed', 'accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    { errorMap: () => ({ message: 'Invalid status value' }) }
  ),
});

export const adminOrdersQuerySchema = z.object({
  status: z
    .enum(['placed', 'accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'])
    .optional(),
  customerId: objectId.optional(),
  sellerId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Return Request (Customer) ───────────────────────────────────────────────
export const returnRequestSchema = z.object({
  reason: z.string().min(10, 'Please describe the issue in at least 10 characters').trim(),
});

// ─── Resolve Return (Admin) ──────────────────────────────────────────────────
export const resolveReturnSchema = z.object({
  status: z.enum(['accepted', 'picked', 'received', 'refund_completed', 'rejected'], {
    errorMap: () => ({ message: 'Status must be accepted, picked, received, refund_completed, or rejected' }),
  }),
  adminNote: z.string().trim().optional(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code').optional(),
});

// ─── Confirm Delivery (Customer stub) ────────────────────────────────────────
// OTP field deferred — Twilio not integrated yet
export const confirmDeliverySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});