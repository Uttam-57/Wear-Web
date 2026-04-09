import mongoose from 'mongoose';

const normalizeMediaItem = (item) => {
  if (typeof item === 'string') {
    return { url: item, publicId: null };
  }

  if (item && typeof item === 'object') {
    return {
      url: item.url,
      publicId: item.publicId ?? null,
    };
  }

  return item;
};

const normalizeMediaArray = (items) => {
  if (!Array.isArray(items)) return items;
  return items.map(normalizeMediaItem);
};

const mediaArrayToUrls = (items) => {
  if (!Array.isArray(items)) return items;
  return items.map((item) => item?.url ?? item).filter(Boolean);
};

const snapshotSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    images: {
      type: [{ url: { type: String, required: true }, publicId: { type: String, default: null }, _id: false }],
      required: true,
      set: normalizeMediaArray,
      get: mediaArrayToUrls,
    },
    size: { type: String, required: true },
    colorName: { type: String, required: true },
    colorCode: { type: String, required: true },
    price: { type: Number, required: true },
    effectivePrice: { type: Number, required: true },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    snapshot: { type: snapshotSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
