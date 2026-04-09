import Wishlist from './wishlist.model.js';
import Product from '../product/product.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

const WISHLIST_LIMIT = 70;
const mediaToUrl = (media) => media?.url ?? media ?? null;

// ─── Add To Wishlist ────────────────────────────────────────────────────────

export const addToWishlistService = async (userId, productId) => {
  logger.info(`[SERVICE] addToWishlistService → userId: ${userId} | productId: ${productId}`);
  const product = await Product.findById(productId).select('status');

  if (!product || product.status === 'removed') {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  if (product.status !== 'active') {
    throw new AppError('Product is not available', 404, 'NOT_FOUND');
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = new Wishlist({ userId, products: [] });
  }

  const alreadyAdded = wishlist.products.some(
    (id) => id.toString() === productId.toString()
  );

  if (alreadyAdded) {
    throw new AppError('Product already in wishlist', 400, 'VALIDATION_ERROR');
  }

  if (wishlist.products.length >= WISHLIST_LIMIT) {
    throw new AppError(
      `Wishlist cannot exceed ${WISHLIST_LIMIT} items`,
      400,
      'VALIDATION_ERROR'
    );
  }

  wishlist.products.push(productId);
  await wishlist.save();

  return wishlist;
};

// ─── Get Wishlist ───────────────────────────────────────────────────────────

export const getWishlistService = async (userId) => {
  logger.info(`[SERVICE] getWishlistService → userId: ${userId}`);
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist || wishlist.products.length === 0) {
    return { products: [] };
  }

  const productDocs = await Product.find({
    _id: { $in: wishlist.products },
  }).select('name images variants status');

  const productMap = new Map(
    productDocs.map((p) => [p._id.toString(), p])
  );

  const items = wishlist.products.map((productId) => {
    const product = productMap.get(productId.toString());

    if (!product) {
      return {
        productId,
        available: false,
        name: null,
        image: null,
        priceRange: null,
      };
    }

    const available = product.status === 'active';

    const effectivePrices = (product.variants || []).map((v) => {
      const price = v.price || 0;
      const discount = v.discount || 0;
      return parseFloat((price - (price * discount) / 100).toFixed(2));
    });

    const priceRange =
      effectivePrices.length > 0
        ? {
            min: Math.min(...effectivePrices),
            max: Math.max(...effectivePrices),
          }
        : null;

    return {
      productId: product._id,
      available,
      name: product.name,
      image: mediaToUrl(product.images?.[0]),
      priceRange,
    };
  });

  return { products: items };
};

// ─── Remove From Wishlist ───────────────────────────────────────────────────

export const removeFromWishlistService = async (userId, productId) => {
  logger.info(`[SERVICE] removeFromWishlistService → userId: ${userId} | productId: ${productId}`);
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    throw new AppError('Product not found in wishlist', 404, 'NOT_FOUND');
  }

  const index = wishlist.products.findIndex(
    (id) => id.toString() === productId.toString()
  );

  if (index === -1) {
    throw new AppError('Product not found in wishlist', 404, 'NOT_FOUND');
  }

  wishlist.products.splice(index, 1);
  await wishlist.save();

  return wishlist;
};
