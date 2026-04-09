import logger from '../../utils/logger.js';
import {
  addToWishlistService,
  getWishlistService,
  removeFromWishlistService,
} from './wishlist.service.js';

export const addToWishlist = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] addToWishlist → userId: ${req.user.userId} | productId: ${req.body.productId}`);
    const wishlist = await addToWishlistService(req.user.userId, req.body.productId);
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: { wishlist },
    });
  } catch (err) {
    next(err);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getWishlist → userId: ${req.user.userId}`);
    const data = await getWishlistService(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Wishlist fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] removeFromWishlist → userId: ${req.user.userId} | productId: ${req.params.productId}`);
    const wishlist = await removeFromWishlistService(req.user.userId, req.params.productId);
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: { wishlist },
    });
  } catch (err) {
    next(err);
  }
};