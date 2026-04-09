import mongoose from 'mongoose';
import Cart from './cart.model.js';
import Product from '../product/product.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

const MAX_CART_ITEMS = 20;
const mediaToUrl = (media) => media?.url ?? media ?? null;

// ─── Add To Cart ────────────────────────────────────────────────────────────
export const addToCartService = async (userId, { productId, variantId, quantity }) => {
  logger.info(`[SERVICE] addToCartService → userId: ${userId} | productId: ${productId} | variantId: ${variantId}`);
  const product = await Product.findById(productId);

  if (!product || product.status === 'removed') {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  if (product.status === 'held') {
    throw new AppError('Product is currently unavailable', 410, 'PRODUCT_UNAVAILABLE');
  }

  const variant = product.variants.find((v) => v._id.toString() === variantId.toString());

  if (!variant) {
    throw new AppError('Variant not found', 404, 'NOT_FOUND');
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existingIndex = cart.items.findIndex(
    (item) =>
      item.productId.toString() === productId.toString() &&
      item.variantId.toString() === variantId.toString()
  );

  if (existingIndex !== -1) {
    // Item already in cart — increment quantity
    const newQuantity = cart.items[existingIndex].quantity + quantity;

    if (variant.stock < newQuantity) {
      throw new AppError(
        `Only ${variant.stock} units available`,
        410,
        'OUT_OF_STOCK'
      );
    }

    cart.items[existingIndex].quantity = newQuantity;
  } else {
    // New item
    if (cart.items.length >= MAX_CART_ITEMS) {
      throw new AppError(
        `Cart cannot exceed ${MAX_CART_ITEMS} items`,
        400,
        'VALIDATION_ERROR'
      );
    }

    if (variant.stock < quantity) {
      throw new AppError(
        `Only ${variant.stock} units available`,
        410,
        'OUT_OF_STOCK'
      );
    }

    const effectivePrice = variant.price - (variant.price * (variant.discount || 0)) / 100;

    cart.items.push({
      productId: product._id,
      variantId: variant._id,
      sellerId: product.sellerId,
      snapshot: {
        productName: product.name,
        images: product.images.map(mediaToUrl).filter(Boolean),
        size: variant.size,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
        price: variant.price,
        effectivePrice: parseFloat(effectivePrice.toFixed(2)),
      },
      quantity,
    });
  }

  await cart.save();
  logger.info(`[SERVICE] addToCartService → cart updated for userId: ${userId}`);
  return cart;
};

// ─── Get Cart ────────────────────────────────────────────────────────────────
export const getCartService = async (userId) => {
  logger.info(`[SERVICE] getCartService → userId: ${userId}`);
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = { userId, items: [] };
  }

  return cart;
};

// ─── Update Cart Item ────────────────────────────────────────────────────────
export const updateCartItemService = async (userId, variantId, { quantity }) => {
  logger.info(`[SERVICE] updateCartItemService → userId: ${userId} | variantId: ${variantId} | quantity: ${quantity}`);
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError('Cart not found', 404, 'NOT_FOUND');
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.variantId.toString() === variantId.toString()
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404, 'NOT_FOUND');
  }

  const item = cart.items[itemIndex];

  // Re-validate stock against live product
  const product = await Product.findById(item.productId);

  if (!product || product.status === 'removed') {
    throw new AppError('Product no longer available', 410, 'PRODUCT_UNAVAILABLE');
  }

  if (product.status === 'held') {
    throw new AppError('Product is currently unavailable', 410, 'PRODUCT_UNAVAILABLE');
  }

  const variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());

  if (!variant) {
    throw new AppError('Variant no longer available', 410, 'PRODUCT_UNAVAILABLE');
  }

  if (variant.stock < quantity) {
    throw new AppError(
      `Only ${variant.stock} units available`,
      410,
      'OUT_OF_STOCK'
    );
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  logger.info(`[SERVICE] updateCartItemService → item updated for userId: ${userId} | variantId: ${variantId}`);
  return cart;
};

// ─── Remove Cart Item ────────────────────────────────────────────────────────
export const removeCartItemService = async (userId, variantId) => {
  logger.info(`[SERVICE] removeCartItemService → userId: ${userId} | variantId: ${variantId}`);
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError('Cart not found', 404, 'NOT_FOUND');
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.variantId.toString() === variantId.toString()
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404, 'NOT_FOUND');
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  logger.info(`[SERVICE] removeCartItemService → item removed for userId: ${userId} | variantId: ${variantId}`);
  return cart;
};

// ─── Clear Cart ──────────────────────────────────────────────────────────────
// Exported for internal use by Order module after checkout
export const clearCartService = async (userId) => {
  logger.info(`[SERVICE] clearCartService → userId: ${userId}`);
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    // Already empty — idempotent, not an error
    return { userId, items: [] };
  }

  cart.items = [];
  await cart.save();

  logger.info(`[SERVICE] clearCartService → cart cleared for userId: ${userId}`);
  return cart;
};
