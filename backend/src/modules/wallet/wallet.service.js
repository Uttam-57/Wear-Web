import Wallet from './wallet.model.js';
import WalletTransaction from './walletTransaction.model.js';
import AppError from '../../utils/appError.js';
import { createNotification } from '../../utils/notification.utils.js';
import { getPublicOrderId } from '../../utils/orderId.utils.js';
import mongoose from 'mongoose';
import logger from '../../utils/logger.js';

const DAILY_WITHDRAWAL_LIMIT = 200000; // ₹2,00,000
const MIN_WITHDRAWAL = 1000;           // ₹1,000

const PAYOUT_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
};

const resolveWithdrawalStatus = (transaction = {}) => {
  const status = String(transaction?.payoutStatus || '').toLowerCase();
  if (['pending', 'approved', 'rejected'].includes(status)) return status;
  return 'approved';
};

const getPendingWithdrawalAmount = async (sellerId) => {
  const [result] = await WalletTransaction.aggregate([
    {
      $match: {
        sellerId: new mongoose.Types.ObjectId(sellerId),
        type: 'withdrawal',
        payoutStatus: 'pending',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return Number(result?.total || 0);
};

const hasActiveReturnRequest = (order) => {
  const status = String(order?.returnRequest?.status || '').toLowerCase();
  if (!status) return false;
  return !['rejected', 'refund_completed'].includes(status);
};

const resolveOrderReturnWindowDays = async (order, Product) => {
  let maxReturnWindow = 0;

  for (const item of order.items || []) {
    const product = await Product.findOne(
      { 'variants._id': item.variantId },
      { returnPolicy: 1 }
    ).lean();

    if (!product) continue;

    const returnWindow = product.returnPolicy?.returnable === false
      ? 0
      : (product.returnPolicy?.returnWindow ?? 7);

    if (returnWindow > maxReturnWindow) {
      maxReturnWindow = returnWindow;
    }
  }

  return maxReturnWindow;
};

const calculateCommissionAndPayout = async (order, { Product, Category }) => {
  let totalCommission = 0;

  for (const item of order.items || []) {
    const product = await Product.findOne(
      { 'variants._id': item.variantId },
      { categoryId: 1 }
    ).lean();

    if (!product?.categoryId) continue;

    const category = await Category.findById(product.categoryId, { commissionRate: 1 }).lean();
    const commissionRate = Number(category?.commissionRate || 0);
    totalCommission += (Number(item?.subtotal || 0) * commissionRate) / 100;
  }

  const sellerPayout = Number(order.totalAmount || 0) - totalCommission;
  return {
    totalCommission,
    sellerPayout,
  };
};

const creditSingleOrderPayout = async ({
  order,
  now,
  enforceReturnWindow,
  Product,
  Category,
  Order,
}) => {
  if (!order) return { credited: false, reason: 'missing_order' };
  if (order.status !== 'delivered') return { credited: false, reason: 'not_delivered' };
  if (String(order.paymentStatus || '').toLowerCase() !== 'paid') {
    return { credited: false, reason: 'payment_not_paid' };
  }
  if (!order.deliveredAt) return { credited: false, reason: 'missing_delivered_at' };
  if (hasActiveReturnRequest(order)) return { credited: false, reason: 'active_return' };

  const alreadyCredited = await WalletTransaction.findOne({
    orderId: order._id,
    type: 'credit',
  }).lean();

  if (alreadyCredited) {
    return { credited: false, reason: 'already_credited' };
  }

  if (enforceReturnWindow) {
    const returnWindowDays = await resolveOrderReturnWindowDays(order, Product);
    const windowCloseDate = new Date(order.deliveredAt);
    windowCloseDate.setDate(windowCloseDate.getDate() + returnWindowDays);

    if (now < windowCloseDate) {
      return { credited: false, reason: 'return_window_open' };
    }
  }

  const { totalCommission, sellerPayout } = await calculateCommissionAndPayout(order, { Product, Category });
  if (sellerPayout <= 0) {
    return { credited: false, reason: 'non_positive_payout' };
  }

  const wallet = await getOrCreateWallet(order.sellerId);
  const balanceBefore = Number(wallet.balance || 0);
  const balanceAfter = balanceBefore + sellerPayout;

  wallet.balance = balanceAfter;
  await wallet.save();

  await Order.updateOne(
    { _id: order._id },
    {
      platformCommission: totalCommission,
      sellerPayout,
    }
  );

  const transaction = await WalletTransaction.create({
    sellerId: order.sellerId,
    orderId: order._id,
    type: 'credit',
    amount: sellerPayout,
    balanceBefore,
    balanceAfter,
    description: `Order #${getPublicOrderId(order)} payout credited to wallet`,
  });

  createNotification({
    userId: order.sellerId.toString(),
    type: 'WALLET_CREDITED',
    message: `₹${sellerPayout.toFixed(2)} has been credited to your wallet for order #${getPublicOrderId(order)}.`,
    refId: transaction._id.toString(),
    refModel: 'WalletTransaction',
  });

  return {
    credited: true,
    amount: sellerPayout,
  };
};

// ─── Get or create wallet for a seller ───────────────────────────────────────
export const getOrCreateWallet = async (sellerId, session = null) => {
  logger.info(`[SERVICE] getOrCreateWallet → sellerId: ${sellerId}`);
  const walletQuery = Wallet.findOne({ sellerId });
  if (session) walletQuery.session(session);

  let wallet = await walletQuery;
  if (!wallet) {
    const createdWallets = await Wallet.create([{ sellerId }], session ? { session } : undefined);
    wallet = createdWallets[0];
  }
  return wallet;
};

// ─── Get seller wallet balance ────────────────────────────────────────────────
export const getWalletService = async (sellerId) => {
  logger.info(`[SERVICE] getWalletService → sellerId: ${sellerId}`);
  // Reconcile eligible delivered payouts on read so wallet does not remain stale.
  await creditEligibleOrdersService({ sellerId, enforceReturnWindow: false });
  const wallet = await getOrCreateWallet(sellerId);
  const pendingWithdrawalAmount = await getPendingWithdrawalAmount(sellerId);

  return {
    balance: Number(wallet.balance || 0),
    pendingWithdrawalAmount,
    availableToWithdraw: Number(wallet.balance || 0) - pendingWithdrawalAmount,
  };
};

// ─── Withdraw from wallet ─────────────────────────────────────────────────────
export const withdrawService = async (sellerId, amount) => {
  logger.info(`[SERVICE] withdrawService → sellerId: ${sellerId} | amount: ${amount}`);
  if (amount < MIN_WITHDRAWAL) {
    throw new AppError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`, 400, 'VALIDATION_ERROR');
  }

  // Check daily withdrawal total
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyTotal = await WalletTransaction.aggregate([
    {
      $match: {
        sellerId: sellerId,
        type: 'withdrawal',
        createdAt: { $gte: startOfDay },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const withdrawnToday = dailyTotal.length > 0 ? dailyTotal[0].total : 0;

  if (withdrawnToday + amount > DAILY_WITHDRAWAL_LIMIT) {
    throw new AppError(
      `Daily withdrawal limit of ₹${DAILY_WITHDRAWAL_LIMIT.toLocaleString('en-IN')} exceeded`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const wallet = await getOrCreateWallet(sellerId);
  const pendingWithdrawalAmount = await getPendingWithdrawalAmount(sellerId);
  const availableToWithdraw = Number(wallet.balance || 0) - pendingWithdrawalAmount;

  if (availableToWithdraw < amount) {
    throw new AppError('Insufficient wallet balance', 400, 'VALIDATION_ERROR');
  }

  const requestTransaction = await WalletTransaction.create({
    sellerId,
    orderId: null,
    type: 'withdrawal',
    amount,
    balanceBefore: Number(wallet.balance || 0),
    balanceAfter: Number(wallet.balance || 0),
    description: `Withdrawal request for ₹${amount.toLocaleString('en-IN')} submitted and pending admin approval`,
    payoutStatus: 'pending',
  });

  createNotification({
    userId: sellerId.toString(),
    type: 'WALLET_WITHDRAWAL_REQUESTED',
    message: `Withdrawal request of ₹${amount.toLocaleString('en-IN')} submitted for admin approval. Ref: ${requestTransaction.transactionId}`,
    refId: requestTransaction._id.toString(),
    refModel: 'WalletTransaction',
  });

  return {
    balance: Number(wallet.balance || 0),
    pendingWithdrawalAmount: pendingWithdrawalAmount + amount,
    availableToWithdraw: availableToWithdraw - amount,
    request: {
      id: requestTransaction._id,
      transactionId: requestTransaction.transactionId,
      status: requestTransaction.payoutStatus,
    },
  };
};

// ─── Get seller transaction history ──────────────────────────────────────────
export const getTransactionsService = async (sellerId, page = 1, limit = 10) => {
  logger.info(`[SERVICE] getTransactionsService → sellerId: ${sellerId} | page: ${page} | limit: ${limit}`);
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find({ sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments({ sellerId }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Admin: get all seller wallets ────────────────────────────────────────────
export const getAllWalletsService = async (page = 1, limit = 10) => {
  logger.info(`[SERVICE] getAllWalletsService → page: ${page} | limit: ${limit}`);
  const skip = (page - 1) * limit;

  const [wallets, total] = await Promise.all([
    Wallet.find()
      .populate('sellerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Wallet.countDocuments(),
  ]);

  return {
    wallets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Admin: get all transactions ──────────────────────────────────────────────
export const getAllTransactionsService = async (page = 1, limit = 10) => {
  logger.info(`[SERVICE] getAllTransactionsService → page: ${page} | limit: ${limit}`);
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find()
      .populate('sellerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments(),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Admin: approve/reject payout request ─────────────────────────────────────
export const processAdminPayoutService = async (adminId, payoutRequestId, payload = {}) => {
  logger.info(`[SERVICE] processAdminPayoutService → adminId: ${adminId} | payoutRequestId: ${payoutRequestId}`);
  const action = String(payload?.action || '').trim().toLowerCase();
  const rejectCategory = String(payload?.rejectCategory || '').trim();
  const rejectDescription = String(payload?.rejectDescription || '').trim();
  const settlementTransactionId = String(payload?.settlementTransactionId || '').trim();

  if (![PAYOUT_ACTIONS.APPROVE, PAYOUT_ACTIONS.REJECT].includes(action)) {
    throw new AppError('Invalid payout action', 400, 'VALIDATION_ERROR');
  }

  if (action === PAYOUT_ACTIONS.REJECT && rejectDescription.length < 5) {
    throw new AppError('Reject reason description must be at least 5 characters', 400, 'VALIDATION_ERROR');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payoutRequest = await WalletTransaction.findById(payoutRequestId).session(session);
    if (!payoutRequest || payoutRequest.type !== 'withdrawal') {
      throw new AppError('Payout request not found', 404, 'NOT_FOUND');
    }

    if (resolveWithdrawalStatus(payoutRequest) !== 'pending') {
      throw new AppError('Payout request has already been processed', 400, 'VALIDATION_ERROR');
    }

    const sellerId = payoutRequest.sellerId;
    const amount = Number(payoutRequest.amount || 0);
    const reviewedAt = new Date();

    if (action === PAYOUT_ACTIONS.APPROVE) {
      const wallet = await getOrCreateWallet(sellerId, session);

      if (Number(wallet.balance || 0) < amount) {
        throw new AppError('Seller wallet balance is insufficient to approve this payout', 400, 'VALIDATION_ERROR');
      }

      const balanceBefore = Number(wallet.balance || 0);
      const balanceAfter = balanceBefore - amount;

      wallet.balance = balanceAfter;
      await wallet.save({ session });

      payoutRequest.balanceBefore = balanceBefore;
      payoutRequest.balanceAfter = balanceAfter;
      payoutRequest.payoutStatus = 'approved';
      payoutRequest.payoutReviewedBy = adminId;
      payoutRequest.payoutReviewedAt = reviewedAt;
      payoutRequest.payoutSettlementId = settlementTransactionId || null;
      payoutRequest.payoutRejectCategory = null;
      payoutRequest.payoutRejectDescription = null;
      payoutRequest.description = settlementTransactionId
        ? `Withdrawal approved by admin. Settlement transaction ID: ${settlementTransactionId}`
        : 'Withdrawal approved by admin and queued for bank settlement';
      await payoutRequest.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        createNotification({
          userId: sellerId.toString(),
          type: 'WALLET_WITHDRAWAL_APPROVED',
          message: `Withdrawal request ${payoutRequest.transactionId} for ₹${amount.toLocaleString('en-IN')} has been approved by admin.`,
          refId: payoutRequest._id.toString(),
          refModel: 'WalletTransaction',
        });
      } catch (_) {
        // Ignore notification failures after payout state is committed.
      }

      return { transaction: payoutRequest.toObject() };
    }

    payoutRequest.payoutStatus = 'rejected';
    payoutRequest.payoutReviewedBy = adminId;
    payoutRequest.payoutReviewedAt = reviewedAt;
    payoutRequest.payoutSettlementId = null;
    payoutRequest.payoutRejectCategory = rejectCategory || 'other';
    payoutRequest.payoutRejectDescription = rejectDescription;
    payoutRequest.description = `Withdrawal rejected (${payoutRequest.payoutRejectCategory}): ${rejectDescription}`;
    await payoutRequest.save({ session });

    await session.commitTransaction();
    session.endSession();

    try {
      createNotification({
        userId: sellerId.toString(),
        type: 'WALLET_WITHDRAWAL_REJECTED',
        message: `Withdrawal request ${payoutRequest.transactionId} was rejected by admin. Reason: ${rejectDescription}`,
        refId: payoutRequest._id.toString(),
        refModel: 'WalletTransaction',
      });
    } catch (_) {
      // Ignore notification failures after payout state is committed.
    }

    return { transaction: payoutRequest.toObject() };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ─── Cron: credit seller wallets for eligible delivered orders ────────────────
export const creditEligibleOrdersService = async ({ sellerId = null, enforceReturnWindow = true } = {}) => {
  logger.info(`[SERVICE] creditEligibleOrdersService → sellerId: ${sellerId || 'all'}`);
  // Lazy imports to avoid circular dependency at module load time
  const { default: Order } = await import('../order/order.model.js');
  const { default: Product } = await import('../product/product.model.js');
  const { default: Category } = await import('../category/category.model.js');

  const now = new Date();

  const orderFilter = {
    status: 'delivered',
    paymentStatus: 'paid',
    $or: [
      { returnRequest: null },
      { 'returnRequest.status': 'rejected' },
    ],
    deliveredAt: { $ne: null },
  };

  if (sellerId) {
    orderFilter.sellerId = sellerId;
  }

  // Find all delivered, paid orders with no active return request
  const orders = await Order.find(orderFilter).lean();

  let credited = 0;

  for (const order of orders) {
    const result = await creditSingleOrderPayout({
      order,
      now,
      enforceReturnWindow,
      Product,
      Category,
      Order,
    });

    if (result.credited) credited++;
  }

  return { credited };
};

export const creditDeliveredOrderPayoutService = async ({ orderId, enforceReturnWindow = false } = {}) => {
  logger.info(`[SERVICE] creditDeliveredOrderPayoutService → orderId: ${orderId}`);
  if (!orderId) {
    throw new AppError('orderId is required', 400, 'VALIDATION_ERROR');
  }

  const { default: Order } = await import('../order/order.model.js');
  const { default: Product } = await import('../product/product.model.js');
  const { default: Category } = await import('../category/category.model.js');

  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  const result = await creditSingleOrderPayout({
    order,
    now: new Date(),
    enforceReturnWindow,
    Product,
    Category,
    Order,
  });

  return result;
};