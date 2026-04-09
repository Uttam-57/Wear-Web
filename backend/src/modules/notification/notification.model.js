import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'ORDER_PLACED',
  'ORDER_ACCEPTED',
  'ORDER_PACKED',
  'ORDER_SHIPPED',
  'ORDER_OUT_FOR_DELIVERY',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'ORDER_REJECTED',
  'RETURN_REQUESTED',
  'RETURN_UPDATED',
  'PAYMENT_CONFIRMED',
  'WALLET_CREDITED',
  'WITHDRAWAL_PROCESSED',
  'WITHDRAWAL_REJECTED',
  'SELLER_APPROVED',
  'SELLER_REJECTED',
  'ACCOUNT_DELETION_PENDING',
  'PRODUCT_HELD',
  'REVIEW_RECEIVED',
  'SELLER_RESPONSE_RECEIVED',
];

const REF_MODELS = ['Order', 'Payment', 'Wallet', 'WalletTransaction', 'Review', 'Product'];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    refModel: {
      type: String,
      enum: REF_MODELS,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — documents auto-deleted 30 days after creation
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound index for efficient paginated listing per user
notificationSchema.index({ userId: 1, createdAt: -1 });

// Fast unread count per user
notificationSchema.index({ userId: 1, isRead: 1 });

export const NOTIFICATION_TYPES_LIST = NOTIFICATION_TYPES;

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;