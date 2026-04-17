import mongoose from 'mongoose';

const generateWalletTransactionId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TXN-${ts}-${rand}`;
};

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: generateWalletTransactionId,
      trim: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    type: {
      type: String,
      enum: ['credit', 'withdrawal', 'refund_debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: null,
      index: true,
    },
    payoutReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    payoutReviewedAt: {
      type: Date,
      default: null,
    },
    payoutRejectCategory: {
      type: String,
      default: null,
      trim: true,
    },
    payoutRejectDescription: {
      type: String,
      default: null,
      trim: true,
    },
    payoutSettlementId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ sellerId: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ sellerId: 1, type: 1, payoutStatus: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, payoutStatus: 1, createdAt: -1 });

walletTransactionSchema.pre('validate', async function () {
  if (this.type !== 'withdrawal') {
    this.payoutStatus ??= null;
    return; // Simply return to finish the hook
  }

  this.payoutStatus ??= 'approved';
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;