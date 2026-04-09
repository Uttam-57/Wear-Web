import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      comment: 'Amount in paise.',
    },
    currency: {
      type: String,
      default: 'inr',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi'],
      default: 'card',
    },
    status: {
      type: String,
      enum: ['succeeded', 'failed', 'refunded', 'partially_refunded'],
      required: true,
    },
    stripeRefundId: {
      type: String,
      default: null,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      comment: 'Total refunded so far in paise.',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;