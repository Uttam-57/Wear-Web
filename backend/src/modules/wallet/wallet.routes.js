import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { processPayoutSchema, withdrawSchema } from './wallet.validation.js';
import {
  getWallet,
  withdraw,
  getTransactions,
  getAllWallets,
  getAllTransactions,
  processAdminPayout,
} from './wallet.controller.js';

const router = express.Router();

router.use(rateLimiter('general'));

// ─── Seller routes ────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('seller'), getWallet);
router.post('/withdraw', authenticate, authorize('seller'), validate(withdrawSchema), withdraw);
router.get('/transactions', authenticate, authorize('seller'), getTransactions);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/wallets', authenticate, authorize('admin'), getAllWallets);
router.get('/admin/transactions', authenticate, authorize('admin'), getAllTransactions);
router.put('/admin/transactions/:id/payout', authenticate, authorize('admin'), validate(processPayoutSchema), processAdminPayout);

export default router;