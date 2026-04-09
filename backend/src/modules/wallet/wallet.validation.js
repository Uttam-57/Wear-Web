import { z } from 'zod';

export const PAYOUT_REJECTION_REASONS = [
  'bank_details_invalid',
  'compliance_issue',
  'duplicate_request',
  'suspected_fraud',
  'limit_exceeded',
  'other',
];

export const withdrawSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .int({ message: 'Amount must be a whole number' })
    .min(1000, { message: 'Minimum withdrawal amount is ₹1,000' }),
});

export const processPayoutSchema = z
  .object({
    action: z.enum(['approve', 'reject'], {
      errorMap: () => ({ message: 'Action must be approve or reject' }),
    }),
    rejectCategory: z.enum(PAYOUT_REJECTION_REASONS).optional(),
    rejectDescription: z.string().trim().optional(),
    settlementTransactionId: z.string().trim().max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action !== 'reject') return;

    if (!value.rejectCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejectCategory'],
        message: 'Reject reason category is required',
      });
    }

    if (!value.rejectDescription || value.rejectDescription.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejectDescription'],
        message: 'Reject reason description must be at least 5 characters',
      });
    }
  });