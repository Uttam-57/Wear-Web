import logger from '../../utils/logger.js';
import {
  addToCartService,
  getCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
} from './cart.service.js';

export const addToCart = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] addToCart → userId: ${req.user.userId}`);
    const cart = await addToCartService(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: { cart },
    });
  } catch (err) {
    next(err);
  }
};

export const getCart = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getCart → userId: ${req.user.userId}`);
    const cart = await getCartService(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Cart fetched',
      data: { cart },
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] updateCartItem → userId: ${req.user.userId} | variantId: ${req.params.variantId}`);
    const cart = await updateCartItemService(req.user.userId, req.params.variantId, req.body);
    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: { cart },
    });
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] removeCartItem → userId: ${req.user.userId} | variantId: ${req.params.variantId}`);
    const cart = await removeCartItemService(req.user.userId, req.params.variantId);
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { cart },
    });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] clearCart → userId: ${req.user.userId}`);
    const cart = await clearCartService(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: { cart },
    });
  } catch (err) {
    next(err);
  }
};