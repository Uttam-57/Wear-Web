import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
      },
    ],
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeClientSecret: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      comment: 'Total in paise (INR). 1 INR = 100 paise.',
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
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;