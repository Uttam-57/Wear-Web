import logger from '../../utils/logger.js';
import {
  getWalletService,
  withdrawService,
  getTransactionsService,
  getAllWalletsService,
  getAllTransactionsService,
  processAdminPayoutService,
} from './wallet.service.js';

// ─── GET /wallet ──────────────────────────────────────────────────────────────
export const getWallet = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getWallet → userId: ${req.user.userId}`);
    const data = await getWalletService(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Wallet retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /wallet/withdraw ────────────────────────────────────────────────────
export const withdraw = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] withdraw → userId: ${req.user.userId}`);
    const { amount } = req.body;
    const data = await withdrawService(req.user.userId, amount);
    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted for admin approval',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /wallet/transactions ─────────────────────────────────────────────────
export const getTransactions = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getTransactions → userId: ${req.user.userId} | page: ${req.parsedQuery?.page} | limit: ${req.parsedQuery?.limit}`);
    const page = parseInt(req.parsedQuery?.page) || 1;
    const limit = parseInt(req.parsedQuery?.limit) || 10;
    const data = await getTransactionsService(req.user.userId, page, limit);
    res.status(200).json({
      success: true,
      message: 'Transactions retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /wallet/admin/wallets ────────────────────────────────────────────────
export const getAllWallets = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getAllWallets → page: ${req.parsedQuery?.page} | limit: ${req.parsedQuery?.limit}`);
    const page = parseInt(req.parsedQuery?.page) || 1;
    const limit = parseInt(req.parsedQuery?.limit) || 10;
    const data = await getAllWalletsService(page, limit);
    res.status(200).json({
      success: true,
      message: 'All wallets retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /wallet/admin/transactions ──────────────────────────────────────────
export const getAllTransactions = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getAllTransactions → page: ${req.parsedQuery?.page} | limit: ${req.parsedQuery?.limit}`);
    const page = parseInt(req.parsedQuery?.page) || 1;
    const limit = parseInt(req.parsedQuery?.limit) || 10;
    const data = await getAllTransactionsService(page, limit);
    res.status(200).json({
      success: true,
      message: 'All transactions retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /wallet/admin/transactions/:id/payout ──────────────────────────────
export const processAdminPayout = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] processAdminPayout → adminId: ${req.user.userId} | transactionId: ${req.params.id}`);
    const data = await processAdminPayoutService(req.user.userId, req.params.id, req.body || {});
    res.status(200).json({
      success: true,
      message: 'Payout request processed',
      data,
    });
  } catch (err) {
    next(err);
  }
};