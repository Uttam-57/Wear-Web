import mongoose from 'mongoose';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import Wallet from '../wallet/wallet.model.js';
import Review from '../review/review.model.js';
import User from '../user/user.model.js';
import Payment from '../payment/payment.model.js';
import Category from '../category/category.model.js';
import AnalyticsSnapshot from './analytics.snapshot.model.js';
import logger from '../../utils/logger.js';
import {
  ANALYTICS_TIMEZONE,
  getDailyBuckets,
  resolveDateRange,
} from './analytics.date.utils.js';
export { resolveDateRange } from './analytics.date.utils.js';

const SELLER_ANALYTICS_RECONCILE_INTERVAL_MS = Math.max(
  0,
  Number(process.env.SELLER_ANALYTICS_RECONCILE_INTERVAL_MS || 15 * 60 * 1000)
);
const sellerReconcileState = new Map();

const ADMIN_ANALYTICS_LIVE_CACHE_TTL_MS = Math.max(
  0,
  Number(process.env.ADMIN_ANALYTICS_LIVE_CACHE_TTL_MS || 60 * 1000)
);
const adminLiveAnalyticsCache = new Map();

const toMinuteBucketIso = (value) => {
  const date = new Date(value);
  date.setSeconds(0, 0);
  return date.toISOString();
};

const buildRangeCacheKey = (start, end) => `${toMinuteBucketIso(start)}::${toMinuteBucketIso(end)}`;

function scheduleSellerCreditReconciliation(sellerId, sellerObjId) {
  const key = String(sellerId || sellerObjId);
  if (!key) return;

  const now = Date.now();
  const state = sellerReconcileState.get(key) || { inFlight: false, lastRunAt: 0 };

  if (state.inFlight) return;
  if (
    SELLER_ANALYTICS_RECONCILE_INTERVAL_MS > 0
    && now - state.lastRunAt < SELLER_ANALYTICS_RECONCILE_INTERVAL_MS
  ) {
    return;
  }

  state.inFlight = true;
  sellerReconcileState.set(key, state);

  void (async () => {
    const { creditEligibleOrdersService } = await import('../wallet/wallet.service.js');
    await creditEligibleOrdersService({ sellerId: sellerObjId, enforceReturnWindow: false });
    state.lastRunAt = Date.now();
  })()
    .catch((error) => {
      logger.warn('[SERVICE] getSellerAnalyticsService → seller credit reconciliation failed', {
        sellerId: key,
        error: error.message,
      });
    })
    .finally(() => {
      state.inFlight = false;
      sellerReconcileState.set(key, state);
    });
}

async function getLiveAdminAnalytics(start, end) {
  const cacheKey = buildRangeCacheKey(start, end);
  const now = Date.now();
  const cached = adminLiveAnalyticsCache.get(cacheKey);

  if (cached?.payload && cached.expiresAt > now) {
    return cached.payload;
  }

  if (cached?.inFlightPromise) {
    return cached.inFlightPromise;
  }

  const computePromise = computeAdminAnalytics(start, end)
    .then((payload) => {
      adminLiveAnalyticsCache.set(cacheKey, {
        payload,
        expiresAt: Date.now() + ADMIN_ANALYTICS_LIVE_CACHE_TTL_MS,
        inFlightPromise: null,
      });
      return payload;
    })
    .catch((error) => {
      adminLiveAnalyticsCache.delete(cacheKey);
      throw error;
    });

  adminLiveAnalyticsCache.set(cacheKey, {
    payload: cached?.payload || null,
    expiresAt: cached?.expiresAt || 0,
    inFlightPromise: computePromise,
  });

  return computePromise;
}

// ─── Seller Analytics (real-time) ────────────────────────────────────────────

export async function getSellerAnalyticsService(sellerId, query) {
  logger.info(`[SERVICE] getSellerAnalyticsService → sellerId: ${sellerId}`);
  const { start, end } = resolveDateRange(query);
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);
  const dateFilter = { $gte: start, $lte: end };

  // Keep wallet credits eventually consistent without blocking analytics response latency.
  scheduleSellerCreditReconciliation(sellerId, sellerObjId);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const [orderStats] = await Order.aggregate([
    { $match: { sellerId: sellerObjId, createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        packed: { $sum: { $cond: [{ $eq: ['$status', 'packed'] }, 1, 0] } },
        shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        out_for_delivery: { $sum: { $cond: [{ $eq: ['$status', 'out_for_delivery'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        return_requested: { $sum: { $cond: [{ $eq: ['$status', 'return_requested'] }, 1, 0] } },
        return_approved: { $sum: { $cond: [{ $eq: ['$status', 'return_approved'] }, 1, 0] } },
        return_rejected: { $sum: { $cond: [{ $eq: ['$status', 'return_rejected'] }, 1, 0] } },
        returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
        totalOrderValue: { $sum: '$totalAmount' },
      },
    },
  ]);

  const os = orderStats || {
    total: 0, placed: 0, accepted: 0, packed: 0, shipped: 0,
    out_for_delivery: 0, delivered: 0, cancelled: 0, rejected: 0,
    return_requested: 0, return_approved: 0, return_rejected: 0,
    returned: 0, totalOrderValue: 0,
  };

  const nonCancelled = os.total - os.cancelled - os.rejected;
  const fulfilmentRate = nonCancelled > 0
    ? parseFloat(((os.delivered / nonCancelled) * 100).toFixed(2))
    : 0;
  const cancellationRate = os.total > 0
    ? parseFloat(((os.cancelled / os.total) * 100).toFixed(2))
    : 0;
  const returnRate = os.delivered > 0
    ? parseFloat((((os.return_requested + os.return_approved + os.returned) / os.delivered) * 100).toFixed(2))
    : 0;
  const averageOrderValue = os.total > 0
    ? parseFloat((os.totalOrderValue / os.total).toFixed(2))
    : 0;

  // ── Revenue over time (daily) ────────────────────────────────────────────
  const revenueOverTimeRaw = await WalletTransaction.aggregate([
    {
      $match: {
        sellerId: sellerObjId,
        type: 'credit',
        createdAt: dateFilter,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ANALYTICS_TIMEZONE } },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let revenueMap = Object.fromEntries(revenueOverTimeRaw.map((r) => [r._id, r.amount]));

  const creditedInWindow = revenueOverTimeRaw.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
  if (creditedInWindow <= 0) {
    const deliveredPayouts = await Order.aggregate([
      {
        $match: {
          sellerId: sellerObjId,
          status: 'delivered',
          paymentStatus: 'paid',
          deliveredAt: dateFilter,
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$deliveredAt',
              timezone: ANALYTICS_TIMEZONE,
            },
          },
          payout: {
            $cond: [
              { $gt: ['$sellerPayout', 0] },
              '$sellerPayout',
              {
                $cond: [
                  { $gt: ['$platformCommission', 0] },
                  { $subtract: ['$totalAmount', '$platformCommission'] },
                  '$totalAmount',
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          amount: { $sum: '$payout' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    revenueMap = Object.fromEntries(deliveredPayouts.map((row) => [row._id, row.amount]));
  }

  const dailyBuckets = getDailyBuckets(start, end);
  const revenueOverTime = dailyBuckets.map((date) => ({
    date,
    amount: revenueMap[date] || 0,
  }));

  // ── Wallet summary ───────────────────────────────────────────────────────
  const [walletData, walletCreditInWindow, walletWithdrawalInWindow, pendingWithdrawals] =
    await Promise.all([
      Wallet.findOne({ sellerId: sellerObjId }).lean(),
      WalletTransaction.aggregate([
        { $match: { sellerId: sellerObjId, type: 'credit', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { sellerId: sellerObjId, type: 'withdrawal', payoutStatus: 'approved', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { sellerId: sellerObjId, type: 'withdrawal', payoutStatus: 'pending' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
    ]);

  const wallet = {
    currentBalance: walletData?.balance ?? 0,
    totalCreditedInWindow:
      (walletCreditInWindow[0]?.total ?? 0)
      || revenueOverTime.reduce((sum, row) => sum + Number(row?.amount || 0), 0),
    totalWithdrawnInWindow: walletWithdrawalInWindow[0]?.total ?? 0,
    pendingWithdrawalCount: pendingWithdrawals[0]?.count ?? 0,
    pendingWithdrawalAmount: pendingWithdrawals[0]?.amount ?? 0,
  };

  // ── Products ─────────────────────────────────────────────────────────────
  const [productCounts, topByRevenue, topByUnitsSold, lowStock, noSalesProducts] =
    await Promise.all([
      Product.aggregate([
        { $match: { sellerId: sellerObjId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // top 5 by revenue in window via delivered orders
      Order.aggregate([
        {
          $match: {
            sellerId: sellerObjId,
            status: 'delivered',
            createdAt: dateFilter,
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            unitsSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            imageUrl: { $arrayElemAt: ['$product.images.url', 0] },
            revenue: 1,
            unitsSold: 1,
          },
        },
      ]),

      // top 5 by units sold
      Order.aggregate([
        {
          $match: {
            sellerId: sellerObjId,
            status: 'delivered',
            createdAt: dateFilter,
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            imageUrl: { $arrayElemAt: ['$product.images.url', 0] },
            unitsSold: 1,
            revenue: 1,
          },
        },
      ]),

      // low stock — variants with stock <= 5
      Product.aggregate([
        { $match: { sellerId: sellerObjId, status: 'active' } },
        { $unwind: '$variants' },
        { $match: { 'variants.stock': { $lte: 5 } } },
        {
          $project: {
            productId: '$_id',
            name: 1,
            variantId: '$variants._id',
            size: '$variants.size',
            stock: '$variants.stock',
          },
        },
        { $limit: 20 },
      ]),

      // products with no sales in window
      (async () => {
        const soldProductIds = await Order.distinct('items.productId', {
          sellerId: sellerObjId,
          status: 'delivered',
          createdAt: dateFilter,
        });
        return Product.find(
          {
            sellerId: sellerObjId,
            status: 'active',
            _id: { $nin: soldProductIds },
          },
          { name: 1, createdAt: 1 }
        )
          .limit(10)
          .lean();
      })(),
    ]);

  const productStatusMap = Object.fromEntries(productCounts.map((p) => [p._id, p.count]));

  // wishlist counts for top products (demand signal)
  const topProductIds = [...new Set([
    ...topByRevenue.map((p) => p.productId?.toString()),
    ...topByUnitsSold.map((p) => p.productId?.toString()),
  ])].filter(Boolean);

  let wishlistMap = {};
  if (topProductIds.length > 0) {
    const { default: Wishlist } = await import('../wishlist/wishlist.model.js');
    const wishlistCounts = await Wishlist.aggregate([
      { $match: { productId: { $in: topProductIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
    ]);
    wishlistMap = Object.fromEntries(wishlistCounts.map((w) => [w._id.toString(), w.count]));
  }

  const enrichWithWishlist = (arr) =>
    arr.map((p) => ({
      ...p,
      wishlistCount: wishlistMap[p.productId?.toString()] ?? 0,
    }));

  // ── Reviews ──────────────────────────────────────────────────────────────
  const [reviewStats] = await Review.aggregate([
    { $match: { sellerId: sellerObjId } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        responded: { $sum: { $cond: [{ $ifNull: ['$sellerResponse.comment', false] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  const reviews = {
    totalReviews: reviewStats?.totalReviews ?? 0,
    averageRating: reviewStats ? parseFloat(reviewStats.averageRating.toFixed(2)) : 0,
    responseCount: reviewStats?.responded ?? 0,
    responseRate:
      reviewStats?.totalReviews > 0
        ? parseFloat(((reviewStats.responded / reviewStats.totalReviews) * 100).toFixed(2))
        : 0,
    ratingDistribution: {
      1: reviewStats?.rating1 ?? 0,
      2: reviewStats?.rating2 ?? 0,
      3: reviewStats?.rating3 ?? 0,
      4: reviewStats?.rating4 ?? 0,
      5: reviewStats?.rating5 ?? 0,
    },
  };

  // ── Customers ────────────────────────────────────────────────────────────
  const customerStats = await Order.aggregate([
    { $match: { sellerId: sellerObjId, createdAt: dateFilter } },
    { $group: { _id: '$customerId', orderCount: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        uniqueCustomers: { $sum: 1 },
        repeatCustomers: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } },
      },
    },
  ]);

  const customers = {
    uniqueCustomers: customerStats[0]?.uniqueCustomers ?? 0,
    repeatCustomers: customerStats[0]?.repeatCustomers ?? 0,
  };

  return {
    period: { start, end },
    orders: {
      total: os.total,
      byStatus: {
        placed: os.placed,
        accepted: os.accepted,
        packed: os.packed,
        shipped: os.shipped,
        out_for_delivery: os.out_for_delivery,
        delivered: os.delivered,
        cancelled: os.cancelled,
        rejected: os.rejected,
        return_requested: os.return_requested,
        return_approved: os.return_approved,
        return_rejected: os.return_rejected,
        returned: os.returned,
      },
      averageOrderValue,
      fulfilmentRate,
      cancellationRate,
      returnRate,
    },
    revenue: {
      totalEarned: wallet.totalCreditedInWindow,
      overTime: revenueOverTime,
    },
    wallet,
    products: {
      totalActive: productStatusMap['active'] ?? 0,
      totalHeld: productStatusMap['held'] ?? 0,
      topByRevenue: enrichWithWishlist(topByRevenue),
      topByUnitsSold: enrichWithWishlist(topByUnitsSold),
      lowStock,
      noSalesInWindow: noSalesProducts,
    },
    reviews,
    customers,
  };
}

// ─── Admin Analytics (snapshot + live fallback) ───────────────────────────────

export async function getAdminAnalyticsService(query) {
  logger.info('[SERVICE] getAdminAnalyticsService → request received');
  const { start, end } = resolveDateRange(query);
  const hasExplicitRange = Boolean(query?.from || query?.to);
  const STALE_THRESHOLD_HOURS = 48;

  // Explicit date ranges (used by quarter windows) should always compute live.
  if (hasExplicitRange) {
    const live = await getLiveAdminAnalytics(start, end);
    return { ...live, isLive: true, snapshotAge: null };
  }

  // try snapshot first
  const latestSnapshot = await AnalyticsSnapshot.findOne().sort({ date: -1 }).lean();

  if (latestSnapshot) {
    const ageHours = (Date.now() - new Date(latestSnapshot.computedAt).getTime()) / 36e5;
    const overTimeRows = Array.isArray(latestSnapshot?.revenue?.overTime)
      ? latestSnapshot.revenue.overTime
      : [];
    const snapshotHasChartSeries = overTimeRows.every((row) => {
      const gmv = Number(row?.gmv);
      const commission = Number(row?.commission);
      return Number.isFinite(gmv) && Number.isFinite(commission);
    });
    const snapshotHasRootRollup = Array.isArray(latestSnapshot?.revenue?.byRootCategory);

    if (ageHours <= STALE_THRESHOLD_HOURS) {
      if (!snapshotHasChartSeries || !snapshotHasRootRollup) {
        logger.warn('Analytics snapshot shape is outdated — falling back to live aggregation');
      } else {
        return { ...latestSnapshot, isLive: false, snapshotAge: `${Math.round(ageHours)} hours` };
      }
    } else {
      logger.warn('Analytics snapshot is stale — falling back to live aggregation');
    }
  }

  // live fallback
  const result = await getLiveAdminAnalytics(start, end);
  return { ...result, isLive: true, snapshotAge: null };
}

// ─── Core admin computation (used by both scheduler and live fallback) ────────

export async function computeAdminAnalytics(start, end) {
  logger.info('[SERVICE] computeAdminAnalytics → aggregating snapshot data');
  const dateFilter = { $gte: start, $lte: end };
  const dailyBuckets = getDailyBuckets(start, end);

  // ── Users ────────────────────────────────────────────────────────────────
  const [userCounts, newRegistrationsRaw, sellerStatusCounts] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ANALYTICS_TIMEZONE } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: 'seller' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const byRole = Object.fromEntries(userCounts.map((u) => [u._id, u.count]));
  const sellerStatus = Object.fromEntries(sellerStatusCounts.map((s) => [s._id, s.count]));
  const regMap = Object.fromEntries(newRegistrationsRaw.map((r) => [r._id, r.count]));
  const newRegistrationsOverTime = dailyBuckets.map((date) => ({
    date,
    count: regMap[date] || 0,
  }));

  // ── Orders ───────────────────────────────────────────────────────────────
  const [orderAgg] = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        packed: { $sum: { $cond: [{ $eq: ['$status', 'packed'] }, 1, 0] } },
        shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        out_for_delivery: { $sum: { $cond: [{ $eq: ['$status', 'out_for_delivery'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        return_requested: { $sum: { $cond: [{ $eq: ['$status', 'return_requested'] }, 1, 0] } },
        return_approved: { $sum: { $cond: [{ $eq: ['$status', 'return_approved'] }, 1, 0] } },
        return_rejected: { $sum: { $cond: [{ $eq: ['$status', 'return_rejected'] }, 1, 0] } },
        returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
        totalValue: { $sum: '$totalAmount' },
      },
    },
  ]);

  const oa = orderAgg || {
    total: 0, placed: 0, accepted: 0, packed: 0, shipped: 0, out_for_delivery: 0,
    delivered: 0, cancelled: 0, rejected: 0, return_requested: 0,
    return_approved: 0, return_rejected: 0, returned: 0, totalValue: 0,
  };

  const nonCancelledAdmin = oa.total - oa.cancelled - oa.rejected;
  const adminFulfilmentRate = nonCancelledAdmin > 0
    ? parseFloat(((oa.delivered / nonCancelledAdmin) * 100).toFixed(2))
    : 0;

  // ── Revenue ──────────────────────────────────────────────────────────────
  const sellerPayoutExpr = {
    $cond: [
      { $gt: ['$sellerPayout', 0] },
      '$sellerPayout',
      {
        $cond: [
          { $gt: ['$platformCommission', 0] },
          { $subtract: ['$totalAmount', '$platformCommission'] },
          '$totalAmount',
        ],
      },
    ],
  };

  const [revenueOverTimeRaw, revenueByCategoryRaw] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          status: 'delivered',
          paymentStatus: 'paid',
          deliveredAt: dateFilter,
        },
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt', timezone: ANALYTICS_TIMEZONE } },
          gmv: { $ifNull: ['$totalAmount', 0] },
          sellerPayout: sellerPayoutExpr,
          commission: {
            $max: [
              0,
              { $subtract: [{ $ifNull: ['$totalAmount', 0] }, sellerPayoutExpr] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          gmv: { $sum: '$gmv' },
          sellerPayouts: { $sum: '$sellerPayout' },
          commission: { $sum: '$commission' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Order.aggregate([
      {
        $match: {
          status: 'delivered',
          paymentStatus: 'paid',
          deliveredAt: dateFilter,
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          categoryId: '$category._id',
          categoryName: '$category.name',
          commissionRate: { $ifNull: ['$category.commissionRate', 0] },
          lineRevenue: {
            $ifNull: [
              '$items.subtotal',
              {
                $ifNull: [
                  { $multiply: [{ $ifNull: ['$items.snapshot.effectivePrice', 0] }, { $ifNull: ['$items.quantity', 0] }] },
                  { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$categoryName' },
          revenue: { $sum: '$lineRevenue' },
          orderCount: { $sum: 1 },
          commissionEarned: {
            $sum: {
              $multiply: ['$lineRevenue', { $divide: ['$commissionRate', 100] }],
            },
          },
        },
      },
      {
        $project: {
          categoryId: '$_id',
          categoryName: 1,
          revenue: 1,
          orderCount: 1,
          commissionEarned: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const categories = await Category.find({}, { name: 1, parentId: 1 }).lean();
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));

  const resolveRootCategory = (categoryId) => {
    const id = String(categoryId || '');
    if (!id) return null;

    let current = categoryById.get(id);
    if (!current) {
      return {
        rootId: id,
        rootName: 'Uncategorized',
      };
    }

    const visited = new Set([id]);
    while (current?.parentId) {
      const parentId = String(current.parentId);
      if (visited.has(parentId)) break;
      visited.add(parentId);

      const parent = categoryById.get(parentId);
      if (!parent) break;
      current = parent;
    }

    return {
      rootId: String(current?._id || id),
      rootName: current?.name || 'Root Category',
    };
  };

  const revenueByRootMap = new Map(
    categories
      .filter((category) => !category.parentId)
      .map((root) => [
        String(root._id),
        {
          rootId: String(root._id),
          rootName: root.name,
          revenue: 0,
          orderCount: 0,
          commissionEarned: 0,
        },
      ])
  );

  revenueByCategoryRaw.forEach((row) => {
    const resolvedRoot = resolveRootCategory(row?.categoryId);
    if (!resolvedRoot?.rootId) return;

    const existing = revenueByRootMap.get(resolvedRoot.rootId) || {
      rootId: resolvedRoot.rootId,
      rootName: resolvedRoot.rootName,
      revenue: 0,
      orderCount: 0,
      commissionEarned: 0,
    };

    existing.revenue += Number(row?.revenue || 0);
    existing.orderCount += Number(row?.orderCount || 0);
    existing.commissionEarned += Number(row?.commissionEarned || 0);
    revenueByRootMap.set(resolvedRoot.rootId, existing);
  });

  const revenueByRootCategory = Array.from(revenueByRootMap.values()).sort((a, b) => {
    return Number(b?.commissionEarned || 0) - Number(a?.commissionEarned || 0);
  });

  const dailyRevenueMap = Object.fromEntries(
    revenueOverTimeRaw.map((row) => [
      row._id,
      {
        gmv: Number(row?.gmv || 0),
        commission: Number(row?.commission || 0),
        sellerPayouts: Number(row?.sellerPayouts || 0),
      },
    ])
  );

  const revenueOverTime = dailyBuckets.map((date) => ({
    date,
    gmv: dailyRevenueMap[date]?.gmv || 0,
    commission: dailyRevenueMap[date]?.commission || 0,
    sellerPayouts: dailyRevenueMap[date]?.sellerPayouts || 0,
  }));

  const grossGMV = revenueOverTime.reduce((sum, row) => sum + Number(row?.gmv || 0), 0);
  const sellerPayoutsTotal = revenueOverTime.reduce((sum, row) => sum + Number(row?.sellerPayouts || 0), 0);
  const commissionEarned = revenueOverTime.reduce((sum, row) => sum + Number(row?.commission || 0), 0);

  // ── Payments ─────────────────────────────────────────────────────────────
  const [paymentAgg] = await Payment.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      },
    },
  ]);

  // ── Withdrawals ──────────────────────────────────────────────────────────
  const [withdrawalAgg] = await WalletTransaction.aggregate([
    { $match: { type: 'withdrawal' } },
    {
      $group: {
        _id: null,
        pendingCount: { $sum: 0 },
        pendingAmount: { $sum: 0 },
        approvedInWindow: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', start] },
                  { $lte: ['$createdAt', end] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        rejectedInWindow: { $sum: 0 }
      },
    },
  ]);

  // ── Products ─────────────────────────────────────────────────────────────
  const [productCountAgg, topProductsByRevenue, topProductsByUnits, newProductsRaw] =
    await Promise.all([
      Product.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Order.aggregate([
        { $match: { status: 'delivered', paymentStatus: 'paid', deliveredAt: dateFilter } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            unitsSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'product.sellerId',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            imageUrl: { $arrayElemAt: ['$product.images.url', 0] },
            revenue: 1,
            unitsSold: 1,
            sellerName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$seller.firstName', ''] },
                    ' ',
                    { $ifNull: ['$seller.lastName', ''] },
                  ],
                },
              },
            },
            sellerEmail: '$seller.email',
          },
        },
      ]),

      Order.aggregate([
        { $match: { status: 'delivered', paymentStatus: 'paid', deliveredAt: dateFilter } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'product.sellerId',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            imageUrl: { $arrayElemAt: ['$product.images.url', 0] },
            unitsSold: 1,
            revenue: 1,
            sellerName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$seller.firstName', ''] },
                    ' ',
                    { $ifNull: ['$seller.lastName', ''] },
                  ],
                },
              },
            },
            sellerEmail: '$seller.email',
          },
        },
      ]),

      Product.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ANALYTICS_TIMEZONE } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const productStatusMap = Object.fromEntries(productCountAgg.map((p) => [p._id, p.count]));
  const newProductMap = Object.fromEntries(newProductsRaw.map((p) => [p._id, p.count]));
  const newProductsOverTime = dailyBuckets.map((date) => ({
    date,
    count: newProductMap[date] || 0,
  }));

  // ── Sellers ──────────────────────────────────────────────────────────────
  const [topSellersByRevenue, topSellersByOrders, inactiveSellerCount] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid', deliveredAt: dateFilter } },
      { $group: { _id: '$sellerId', revenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' },
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sellerId: '$_id',
          sellerName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$seller.firstName', ''] },
                  ' ',
                  { $ifNull: ['$seller.lastName', ''] },
                ],
              },
            },
          },
          sellerEmail: '$seller.email',
          revenue: 1,
          orderCount: 1,
        },
      },
    ]),

    Order.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$sellerId', orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' },
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sellerId: '$_id',
          sellerName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$seller.firstName', ''] },
                  ' ',
                  { $ifNull: ['$seller.lastName', ''] },
                ],
              },
            },
          },
          sellerEmail: '$seller.email',
          orderCount: 1,
          revenue: 1,
        },
      },
    ]),

    (async () => {
      const activeSellers = await Order.distinct('sellerId', { createdAt: dateFilter });
      const totalSellers = await User.countDocuments({ role: 'seller', status: 'active' });
      return totalSellers - activeSellers.length;
    })(),
  ]);

  // ── Reviews ──────────────────────────────────────────────────────────────
  const [reviewAgg] = await Review.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        totalInWindow: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        pendingModerationCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        flaggedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    computedAt: new Date(),
    windowDays: Math.round((end - start) / 864e5),
    users: {
      total: (byRole.customer ?? 0) + (byRole.seller ?? 0) + (byRole.admin ?? 0),
      byRole: {
        customer: byRole.customer ?? 0,
        seller: byRole.seller ?? 0,
        admin: byRole.admin ?? 0,
      },
      sellerStatus: {
        pending: sellerStatus.pending ?? 0,
        active: sellerStatus.active ?? 0,
        blocked: sellerStatus.blocked ?? 0,
      },
      newRegistrationsOverTime,
    },
    revenue: {
      grossGMV,
      commissionEarned: parseFloat(commissionEarned.toFixed(2)),
      sellerPayouts: parseFloat(sellerPayoutsTotal.toFixed(2)),
      overTime: revenueOverTime,
      byCategory: revenueByCategoryRaw,
      byRootCategory: revenueByRootCategory,
    },
    orders: {
      total: oa.total,
      byStatus: {
        placed: oa.placed,
        accepted: oa.accepted,
        packed: oa.packed,
        shipped: oa.shipped,
        out_for_delivery: oa.out_for_delivery,
        delivered: oa.delivered,
        cancelled: oa.cancelled,
        rejected: oa.rejected,
        return_requested: oa.return_requested,
        return_approved: oa.return_approved,
        return_rejected: oa.return_rejected,
        returned: oa.returned,
      },
      averageOrderValue: oa.total > 0 ? parseFloat((oa.totalValue / oa.total).toFixed(2)) : 0,
      fulfilmentRate: adminFulfilmentRate,
      cancellationRate: oa.total > 0
        ? parseFloat(((oa.cancelled / oa.total) * 100).toFixed(2))
        : 0,
      rejectionRate: oa.total > 0
        ? parseFloat(((oa.rejected / oa.total) * 100).toFixed(2))
        : 0,
      returnRate: oa.delivered > 0
        ? parseFloat((
            ((oa.return_requested + oa.return_approved + oa.returned) / oa.delivered) * 100
          ).toFixed(2))
        : 0,
    },
    payments: {
      totalVolume: paymentAgg?.totalVolume ?? 0,
      totalCount: paymentAgg?.totalCount ?? 0,
      failedCount: paymentAgg?.failedCount ?? 0,
      pendingCount: paymentAgg?.pendingCount ?? 0,
    },
    withdrawals: {
      pendingCount: withdrawalAgg?.pendingCount ?? 0,
      pendingAmount: withdrawalAgg?.pendingAmount ?? 0,
      approvedTotalInWindow: withdrawalAgg?.approvedInWindow ?? 0,
      rejectedTotalInWindow: withdrawalAgg?.rejectedInWindow ?? 0,
    },
    products: {
      totalActive: productStatusMap['active'] ?? 0,
      totalHeld: productStatusMap['held'] ?? 0,
      totalDeleted: productStatusMap['deleted'] ?? 0,
      newOverTime: newProductsOverTime,
      topByRevenue: topProductsByRevenue,
      topByUnitsSold: topProductsByUnits,
    },
    sellers: {
      topByRevenue: topSellersByRevenue,
      topByOrderCount: topSellersByOrders,
      inactiveCount: Math.max(0, inactiveSellerCount),
    },
    reviews: {
      totalInWindow: reviewAgg?.totalInWindow ?? 0,
      averageRating: reviewAgg ? parseFloat(reviewAgg.averageRating.toFixed(2)) : 0,
      pendingModerationCount: reviewAgg?.pendingModerationCount ?? 0,
      flaggedCount: reviewAgg?.flaggedCount ?? 0,
    },
  };
}
