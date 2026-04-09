import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true, default: null },
    accountNumber: { type: String, trim: true, default: null },
    ifscCode: { type: String, trim: true, uppercase: true, default: null },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxLength: [100, "Company name cannot exceed 100 characters"],
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      maxLength: [100, "Owner name cannot exceed 100 characters"],
    },
    companyEmail: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
    },
    companyPhone: {
      type: String,
      required: [true, "Company phone is required"],
      trim: true,
    },
    // Cloudinary URLs — will be updated to public IDs when Cloudinary is integrated
    companyProof: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one company proof document is required",
      },
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    majorCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({ accountHolderName: null, accountNumber: null, ifscCode: null }),
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// sellerProfileSchema.index({ userId: 1 }); // duplicate index since unique: true is used

// ─── Pre-save: auto compute profileComplete ───────────────────────────────────
sellerProfileSchema.pre("save", function (next) {
  const p = this;
  p.profileComplete =
    !!p.companyName &&
    !!p.ownerName &&
    !!p.companyEmail &&
    !!p.companyPhone &&
    p.companyProof.length >= 1 &&
    !!p.location?.country &&
    !!p.location?.state &&
    !!p.location?.district &&
    !!p.location?.addressLine;
 
});

const SellerProfile = mongoose.model("SellerProfile", sellerProfileSchema);

export default SellerProfile;