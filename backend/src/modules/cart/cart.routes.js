import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { addToCartSchema, updateCartItemSchema } from './cart.validation.js';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cart.controller.js';

const router = express.Router();

router.use(rateLimiter('general'));
router.use(authenticate);
router.use(authorize('customer'));

router.post('/', validate(addToCartSchema), addToCart);
router.get('/', getCart);
router.put('/:variantId', validate(updateCartItemSchema), updateCartItem);
router.delete('/:variantId', removeCartItem);
router.delete('/', clearCart);

export default router;