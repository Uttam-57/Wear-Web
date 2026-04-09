import { z } from 'zod';

const periodValues = ['7d', '30d', '90d', 'all'];

const dateRangeSchema = z
  .object({
    period: z
      .enum(periodValues)
      .optional()
      .default('30d'),
    from: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'from must be a valid date string (e.g. 2024-01-01)',
      }),
    to: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'to must be a valid date string (e.g. 2024-01-31)',
      }),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    { message: 'from must be before or equal to to' }
  );

export const sellerAnalyticsQuerySchema = dateRangeSchema;
export const adminAnalyticsQuerySchema = dateRangeSchema;