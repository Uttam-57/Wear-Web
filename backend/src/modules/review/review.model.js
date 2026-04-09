import mongoose from 'mongoose';

// ─── Seller Response Subdocument ──────────────────────────────────────────────
const sellerResponseSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Review Schema ────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    title: {
      type: String,
      trim: true,
      default: null,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    body: {
      type: String,
      trim: true,
      default: null,
      maxlength: [3000, 'Body cannot exceed 3000 characters'],
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: null },
          _id: false,
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Maximum 5 images allowed per review',
      },
    },
    sellerResponse: {
      type: sellerResponseSchema,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// One review per order per product — core business rule
reviewSchema.index({ orderId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Review = mongoose.model('Review', reviewSchema);
export default Review;