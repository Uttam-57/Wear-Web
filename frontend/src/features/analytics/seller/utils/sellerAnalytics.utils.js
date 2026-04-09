import { ORDER_STATUS_SEGMENT_STYLES } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const toArray = (value) => (Array.isArray(value) ? value : [])

const toDateInputValue = (dateValue) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export const getDefaultCustomRange = () => {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  }
}

const normalizeRevenuePoints = (points) => {
  return toArray(points)
    .map((point) => ({
      date: point?.date || '',
      amount: toNumber(point?.amount),
    }))
    .filter((point) => point.date)
}

const normalizeTopProducts = (products) => {
  return toArray(products).map((item, index) => ({
    id: item?.productId || item?._id || `product-${index}`,
    name: item?.name || 'Untitled Product',
    imageUrl: item?.imageUrl || '',
    revenue: toNumber(item?.revenue),
    unitsSold: toNumber(item?.unitsSold),
    wishlistCount: toNumber(item?.wishlistCount),
  }))
}

const normalizeLowStockRows = (rows) => {
  return toArray(rows).map((row, index) => {
    const size = row?.size || '-'
    return {
      id: row?.variantId || row?.productId || `low-stock-${index}`,
      productId: row?.productId || row?._id || '',
      name: row?.name || 'Untitled Product',
      stock: toNumber(row?.stock),
      variantLabel: `Size ${size}`,
    }
  })
}

const normalizeDeadStockRows = (rows) => {
  return toArray(rows).map((row, index) => ({
    id: row?._id || `dead-stock-${index}`,
    productId: row?._id || '',
    name: row?.name || 'Untitled Product',
    createdAt: row?.createdAt || null,
  }))
}

const normalizeRatingDistribution = (distribution) => {
  const safe = distribution && typeof distribution === 'object' ? distribution : {}

  const map = {
    1: toNumber(safe[1] ?? safe.one),
    2: toNumber(safe[2] ?? safe.two),
    3: toNumber(safe[3] ?? safe.three),
    4: toNumber(safe[4] ?? safe.four),
    5: toNumber(safe[5] ?? safe.five),
  }

  return {
    map,
    bars: [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} Star`,
      star,
      count: map[star],
    })),
  }
}

const buildOrderStatusSegments = (byStatus) => {
  const source = byStatus && typeof byStatus === 'object' ? byStatus : {}

  const pending = toNumber(source.placed)
  const processing = toNumber(source.accepted)
    + toNumber(source.packed)
    + toNumber(source.shipped)
    + toNumber(source.out_for_delivery)
  const delivered = toNumber(source.delivered)
  const cancelled = toNumber(source.cancelled) + toNumber(source.rejected)
  const returned = toNumber(source.return_requested)
    + toNumber(source.return_approved)
    + toNumber(source.return_rejected)
    + toNumber(source.returned)

  return [
    { key: 'delivered', value: delivered, ...ORDER_STATUS_SEGMENT_STYLES.delivered },
    { key: 'processing', value: processing, ...ORDER_STATUS_SEGMENT_STYLES.processing },
    { key: 'cancelled', value: cancelled, ...ORDER_STATUS_SEGMENT_STYLES.cancelled },
    { key: 'returned', value: returned, ...ORDER_STATUS_SEGMENT_STYLES.returned },
    { key: 'pending', value: pending, ...ORDER_STATUS_SEGMENT_STYLES.pending },
  ]
}

export const createEmptySellerAnalyticsView = () => ({
  kpis: {
    netEarnings: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    fulfilmentRate: 0,
  },
  revenueOverTime: [],
  orderStatusSegments: buildOrderStatusSegments({}),
  topProductsByRevenue: [],
  topProductsByUnitsSold: [],
  reviews: {
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
    ratingBars: [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} Star`,
      star,
      count: 0,
    })),
  },
  customers: {
    uniqueCustomers: 0,
    repeatCustomers: 0,
    repeatRate: 0,
  },
  lowStock: [],
  deadStock: [],
})

export const normalizeSellerAnalytics = (payload) => {
  const source = payload && typeof payload === 'object' ? payload : {}

  const ordersTotal = toNumber(source?.orders?.total)
  const uniqueCustomers = toNumber(source?.customers?.uniqueCustomers)
  const repeatCustomers = toNumber(source?.customers?.repeatCustomers)
  const repeatRate = uniqueCustomers > 0
    ? Number(((repeatCustomers / uniqueCustomers) * 100).toFixed(2))
    : 0

  const ratings = normalizeRatingDistribution(source?.reviews?.ratingDistribution)

  return {
    kpis: {
      netEarnings: toNumber(source?.revenue?.totalEarned),
      totalOrders: ordersTotal,
      averageOrderValue: toNumber(source?.orders?.averageOrderValue),
      fulfilmentRate: toNumber(source?.orders?.fulfilmentRate),
    },
    revenueOverTime: normalizeRevenuePoints(source?.revenue?.overTime),
    orderStatusSegments: buildOrderStatusSegments(source?.orders?.byStatus),
    topProductsByRevenue: normalizeTopProducts(source?.products?.topByRevenue),
    topProductsByUnitsSold: normalizeTopProducts(source?.products?.topByUnitsSold),
    reviews: {
      averageRating: toNumber(source?.reviews?.averageRating),
      totalReviews: toNumber(source?.reviews?.totalReviews),
      responseRate: toNumber(source?.reviews?.responseRate),
      ratingBars: ratings.bars,
    },
    customers: {
      uniqueCustomers,
      repeatCustomers,
      repeatRate,
    },
    lowStock: normalizeLowStockRows(source?.products?.lowStock),
    deadStock: normalizeDeadStockRows(source?.products?.noSalesInWindow),
  }
}

export const getCustomRangeError = ({ period, from, to }) => {
  if (period !== 'custom') return ''
  if (!from || !to) return 'Select both From and To dates for custom range.'
  if (from > to) return 'Custom range is invalid. From date must be before To date.'
  return ''
}

export const buildSellerAnalyticsParams = ({ period, from, to }) => {
  if (period === 'custom') {
    const customError = getCustomRangeError({ period, from, to })
    if (customError) return null

    return { from, to }
  }

  return { period }
}
