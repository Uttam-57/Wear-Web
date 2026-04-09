import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { addToWishlistSchema } from './wishlist.validation.js';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from './wishlist.controller.js';

const router = express.Router();

router.use(rateLimiter('general'));
router.use(authenticate);
router.use(authorize('customer'));

router.post('/', validate(addToWishlistSchema), addToWishlist);
router.get('/', getWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;