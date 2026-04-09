import mongoose from 'mongoose';

// ─── Address Snapshot ────────────────────────────────────────────────────────
const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    building: { type: String, default: null },
    landmark: { type: String, default: null },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    label: { type: String, default: 'home' },
  },
  { _id: false }
);

// ─── Order Item Snapshot ─────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    snapshot: {
      productName: { type: String, required: true },
      images: [{ url: { type: String, required: true }, publicId: { type: String, default: null }, _id: false }],
      size: { type: String, required: true },
      colorName: { type: String, required: true },
      colorCode: { type: String, required: true },
      price: { type: Number, required: true },
      effectivePrice: { type: Number, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }, // effectivePrice * quantity
  },
  { _id: true }
);

// ─── Return Request ──────────────────────────────────────────────────────────
const returnRequestSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'picked', 'received', 'refund_completed', 'rejected'],
      default: 'requested',
    },
    adminNote: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },

    acceptedAt: { type: Date, default: null },

    pickupOtp: { type: String, default: null },
    pickupOtpExpiresAt: { type: Date, default: null },
    pickupOtpRequestedAt: { type: Date, default: null },
    pickupOtpAttemptCount: { type: Number, default: 0, min: 0 },
    pickupOtpLockedUntil: { type: Date, default: null },

    pickedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    refundCompletedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    refundedAmount: { type: Number, default: 0 },
    walletDeducted: { type: Boolean, default: false },
    walletDeductionAmount: { type: Number, default: 0 },

    resolvedAt: { type: Date },
  },
  { _id: false }
);

// ─── Order Schema ────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: [orderItemSchema],

    addressSnapshot: { type: addressSnapshotSchema, required: true },

    status: {
      type: String,
      enum: ['placed', 'accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'],
      default: 'placed',
      index: true,
    },

    // Seller rejection
    rejectionReason: { type: String, default: '' },

    // Cancellation
    cancelledBy: { type: String, enum: ['customer', 'seller', 'admin'], default: null },
    cancellationReason: { type: String, default: '' },

    // Financials
    totalAmount: { type: Number, required: true }, // sum of all item subtotals
    platformCommission: { type: Number, default: 0 }, // populated when payment built
    sellerPayout: { type: Number, default: 0 },       // populated when payment built

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    }, 

    // Delivery OTP — stub until Twilio integrated
    deliveryOtp: { type: String, default: null },
    deliveryOtpExpiresAt: { type: Date, default: null },
    deliveryOtpRequestedAt: { type: Date, default: null },
    deliveryOtpAttemptCount: { type: Number, default: 0, min: 0 },
    deliveryOtpLockedUntil: { type: Date, default: null },

    // Return
    returnRequest: { type: returnRequestSchema, default: null },

    // Timestamps for status changes
    acceptedAt: { type: Date },
    packedAt: { type: Date },
    shippedAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, status: 1, paymentStatus: 1, deliveredAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1, deliveredAt: -1 });
orderSchema.index({ 'items.productId': 1, sellerId: 1, deliveredAt: -1 });

// ─── blockedAt must be explicit — strict mode would silently ignore it ───────
// (following project convention from User module)

const Order = mongoose.model('Order', orderSchema);
export default Order;