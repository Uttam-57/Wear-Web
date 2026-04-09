import { z } from "zod";
import { BLOCK_REASONS, SELLER_REJECTION_REASONS } from "../../config/constants.js";

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(55).optional(),
  middleName: z.string().trim().max(55).nullable().optional(),
  lastName: z.string().trim().min(1).max(55).optional(),
  email: z.string().trim().email("Invalid email").optional(),
  phone: z.string().trim().nullable().optional(),
  profilePhoto: z.object({
    url: z.string().url(),
    publicId: z.string().nullable(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  confirmText: z.literal("DELETE", {
    errorMap: () => ({ message: 'Type DELETE to confirm account deletion' }),
  }),
});

// ─── Address ──────────────────────────────────────────────────────────────────

const addressBaseSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
  country: z.string().trim().min(1).max(60),
  state: z.string().trim().min(1).max(60),
  district: z.string().trim().min(1).max(60).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  locality: z.string().trim().min(1).max(100).optional(),
  street: z.string().trim().min(1).max(200),
  building: z.string().trim().max(100).nullable().optional(),
  landmark: z.string().trim().max(100).nullable().optional(),
  pincode: z.string().trim().regex(/^\d{4,10}$/, "Invalid pincode"),
  label: z.enum(["home", "work", "other"]).default("home"),
});

export const addAddressSchema = addressBaseSchema.superRefine((data, ctx) => {
  const hasLocality = Boolean(data.locality?.trim());
  const hasCityAndDistrict = Boolean(data.city?.trim() && data.district?.trim());

  if (!hasLocality && !hasCityAndDistrict) {
    ctx.addIssue({
      code: "custom",
      path: ["locality"],
      message: "Provide locality or both city and district",
    });
  }
});

export const updateAddressSchema = addressBaseSchema.partial().superRefine((data, ctx) => {
  const providedLocality = data.locality !== undefined;

  if (providedLocality && !data.locality?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["locality"],
      message: "Locality cannot be empty",
    });
  }
});

export const addressPincodeLookupSchema = z.object({
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be a valid 6 digit India pincode"),
});

export const addressReverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const blockUserSchema = z.object({
  reason: z.enum(BLOCK_REASONS, { errorMap: () => ({ message: "Invalid block reason" }) }),
  message: z.string().trim().max(500).optional(),
});

export const adminDeleteUserSchema = z.object({
  reason: z.string().trim().min(5, "Delete reason must be at least 5 characters").max(500),
});

export const rejectSellerSchema = z.object({
  reason: z.enum(SELLER_REJECTION_REASONS, { errorMap: () => ({ message: "Invalid rejection reason" }) }),
  message: z.string().trim().max(500).optional(),
});

export const adminUsersQuerySchema = z.object({
  status: z.enum(["pending", "active", "blocked", "deleted"]).optional(),
  role: z.enum(["customer", "seller", "admin"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Seller Profile ───────────────────────────────────────────────────────────

const locationSchema = z.object({
  country: z.string().trim().min(1).max(60),
  state: z.string().trim().min(1).max(60),
  district: z.string().trim().min(1).max(60),
  addressLine: z.string().trim().min(1).max(200),
});

const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(1).max(100),
  accountNumber: z.string().trim().min(1).max(30),
  ifscCode: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
});

const bankRefine = (data) => {
  if (!data.bankDetails) return true;
  const { accountHolderName, accountNumber, ifscCode } = data.bankDetails;
  const filled = [accountHolderName, accountNumber, ifscCode].filter(Boolean).length;
  return filled === 0 || filled === 3;
};

const bankRefineOptions = {
  message: "Provide all bank details together or none at all",
  path: ["bankDetails"],
};

const sellerProfileBase = z.object({
  companyName: z.string().trim().min(1).max(100),
  ownerName: z.string().trim().min(1).max(100),
  companyEmail: z.string().trim().email("Invalid company email"),
  companyPhone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Invalid company phone number"),
  companyProof: z
    .array(z.string().trim().min(1))
    .min(1, "At least one company proof document is required"),
  website: z.string().trim().url("Invalid website URL").nullable().optional(),
  gstNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number")
    .nullable()
    .optional(),
  location: locationSchema,
  majorCategories: z.array(z.string().trim().min(1)).optional(),
  bankDetails: bankDetailsSchema.optional(),
});

export const setupSellerProfileSchema = sellerProfileBase.refine(bankRefine, bankRefineOptions);

export const updateSellerProfileSchema = sellerProfileBase.partial().refine(bankRefine, bankRefineOptions);