import mongoose from 'mongoose';

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },

    users: {
      total: { type: Number, default: 0 },
      byRole: {
        customer: { type: Number, default: 0 },
        seller: { type: Number, default: 0 },
        admin: { type: Number, default: 0 },
      },
      sellerStatus: {
        pending: { type: Number, default: 0 },
        active: { type: Number, default: 0 },
        blocked: { type: Number, default: 0 },
      },
      newRegistrationsOverTime: [
        {
          date: String,
          count: { type: Number, default: 0 },
        },
      ],
    },

    revenue: {
      grossGMV: { type: Number, default: 0 },
      commissionEarned: { type: Number, default: 0 },
      sellerPayouts: { type: Number, default: 0 },
      overTime: [
        {
          date: String,
          gmv: { type: Number, default: 0 },
          commission: { type: Number, default: 0 },
        },
      ],
      byCategory: [
        {
          categoryId: mongoose.Schema.Types.ObjectId,
          categoryName: String,
          revenue: { type: Number, default: 0 },
          orderCount: { type: Number, default: 0 },
          commissionEarned: { type: Number, default: 0 },
        },
      ],
      byRootCategory: [
        {
          rootId: mongoose.Schema.Types.ObjectId,
          rootName: String,
          revenue: { type: Number, default: 0 },
          orderCount: { type: Number, default: 0 },
          commissionEarned: { type: Number, default: 0 },
        },
      ],
    },

    orders: {
      total: { type: Number, default: 0 },
      byStatus: {
        placed: { type: Number, default: 0 },
        accepted: { type: Number, default: 0 },
        packed: { type: Number, default: 0 },
        shipped: { type: Number, default: 0 },
        out_for_delivery: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 },
        rejected: { type: Number, default: 0 },
        return_requested: { type: Number, default: 0 },
        return_approved: { type: Number, default: 0 },
        return_rejected: { type: Number, default: 0 },
        returned: { type: Number, default: 0 },
      },
      averageOrderValue: { type: Number, default: 0 },
      fulfilmentRate: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 },
      rejectionRate: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
    },

    payments: {
      totalVolume: { type: Number, default: 0 },
      totalCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
    },

    withdrawals: {
      pendingCount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 },
      approvedTotalInWindow: { type: Number, default: 0 },
      rejectedTotalInWindow: { type: Number, default: 0 },
    },

    products: {
      totalActive: { type: Number, default: 0 },
      totalHeld: { type: Number, default: 0 },
      totalDeleted: { type: Number, default: 0 },
      newOverTime: [
        {
          date: String,
          count: { type: Number, default: 0 },
        },
      ],
      topByRevenue: [
        {
          productId: mongoose.Schema.Types.ObjectId,
          name: String,
          imageUrl: String,
          revenue: { type: Number, default: 0 },
          unitsSold: { type: Number, default: 0 },
          sellerName: String,
        },
      ],
      topByUnitsSold: [
        {
          productId: mongoose.Schema.Types.ObjectId,
          name: String,
          imageUrl: String,
          unitsSold: { type: Number, default: 0 },
          revenue: { type: Number, default: 0 },
          sellerName: String,
        },
      ],
    },

    sellers: {
      topByRevenue: [
        {
          sellerId: mongoose.Schema.Types.ObjectId,
          sellerName: String,
          revenue: { type: Number, default: 0 },
          orderCount: { type: Number, default: 0 },
        },
      ],
      topByOrderCount: [
        {
          sellerId: mongoose.Schema.Types.ObjectId,
          sellerName: String,
          orderCount: { type: Number, default: 0 },
          revenue: { type: Number, default: 0 },
        },
      ],
      inactiveCount: { type: Number, default: 0 },
    },

    reviews: {
      totalInWindow: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      pendingModerationCount: { type: Number, default: 0 },
      flaggedCount: { type: Number, default: 0 },
    },

    // metadata
    computedAt: { type: Date, default: Date.now },
    windowDays: { type: Number, required: true },
    isLive: { type: Boolean, default: false }, // true when returned from live fallback
  },
  { timestamps: false }
);

analyticsSnapshotSchema.index({ date: -1 });

const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
export default AnalyticsSnapshot;