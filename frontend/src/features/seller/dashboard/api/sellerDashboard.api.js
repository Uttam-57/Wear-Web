import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet } from '@/shared/services/dataClient'
import { getSellerAnalytics } from '@/features/analytics/api'

const unwrapData = (response) => response?.data?.data || response?.data || null

const request = async (url, params = {}) => {
  const response = await queryGet(
    url,
    { params },
    { ttlMs: 5 * 60 * 1000 }
  )
  return unwrapData(response)
}

const safeRequest = (promise, fallback = null) => {
  return promise.catch(() => fallback)
}

const PERIOD_TO_DAY_COUNT = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
}

const toDateString = (date) => {
  return new Date(date).toISOString().slice(0, 10)
}

const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const resolveCurrentRange = (period) => {
  const now = new Date()

  if (period === 'all_time') {
    return {
      start: new Date(0),
      end: now,
    }
  }

  if (period === 'this_year') {
    return {
      start: startOfDay(new Date(now.getFullYear(), 0, 1)),
      end: now,
    }
  }

  const days = PERIOD_TO_DAY_COUNT[period] || 30
  const start = new Date(now)
  start.setDate(start.getDate() - days)

  return {
    start: startOfDay(start),
    end: now,
  }
}

const resolvePreviousRange = ({ start, end }) => {
  const windowMs = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime())

  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - windowMs)

  return {
    start: startOfDay(prevStart),
    end: prevEnd,
  }
}

const calculateGrowthPercent = (currentValue, previousValue) => {
  const current = Number(currentValue || 0)
  const previous = Number(previousValue || 0)

  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }

  return Number((((current - previous) / previous) * 100).toFixed(2))
}

const aggregateOrdersByDate = (orders = [], buckets = []) => {
  if (!buckets.length) return []

  const map = Object.fromEntries(buckets.map((bucket) => [bucket, 0]))

  orders.forEach((order) => {
    const createdAt = order?.createdAt
    if (!createdAt) return

    const day = toDateString(createdAt)
    if (Object.prototype.hasOwnProperty.call(map, day)) {
      map[day] += 1
    }
  })

  return buckets.map((bucket) => map[bucket] || 0)
}

const normalizeOrders = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.orders)) return data.orders
  return []
}

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.products)) return data.products
  return []
}

export const fetchSellerDashboardPayload = async ({ period = 'last_30_days' } = {}) => {
  const currentRange = resolveCurrentRange(period)
  const shouldComparePrevious = period !== 'all_time'
  const previousRange = shouldComparePrevious ? resolvePreviousRange(currentRange) : null

  const [currentAnalytics, previousAnalytics, ordersResponse, productsResponse, walletResponse] = await Promise.all([
    safeRequest(getSellerAnalytics({ from: toDateString(currentRange.start), to: toDateString(currentRange.end) }), null),
    shouldComparePrevious
      ? safeRequest(getSellerAnalytics({ from: toDateString(previousRange.start), to: toDateString(previousRange.end) }), null)
      : Promise.resolve(null),
    safeRequest(request(API_ENDPOINTS.SELLER_ORDERS), { orders: [] }),
    safeRequest(request(API_ENDPOINTS.SELLER_PRODUCTS, { limit: 1000, page: 1 }), { products: [], total: 0 }),
    safeRequest(request(API_ENDPOINTS.WALLET), null),
  ])

  const orders = normalizeOrders(ordersResponse)
  const products = normalizeProducts(productsResponse)

  const revenueBuckets = (currentAnalytics?.revenue?.overTime || []).map((item) => item.date)
  const ordersData = aggregateOrdersByDate(orders, revenueBuckets)

  const currentRevenue = Number(currentAnalytics?.revenue?.totalEarned || 0)
  const previousRevenue = Number(previousAnalytics?.revenue?.totalEarned || 0)
  const currentOrders = Number(currentAnalytics?.orders?.total || 0)
  const previousOrders = Number(previousAnalytics?.orders?.total || 0)

  const byStatus = currentAnalytics?.orders?.byStatus || {}
  const pendingOrdersCount = Number(byStatus.placed || 0)
    + Number(byStatus.accepted || 0)
    + Number(byStatus.packed || 0)
    + Number(byStatus.shipped || 0)
    + Number(byStatus.out_for_delivery || 0)

  const pendingReturnsCount = Number(byStatus.return_requested || 0)
    + Number(byStatus.return_approved || 0)

  const outOfStockProducts = products.filter((product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : []
    if (!variants.length) return false

    return variants.every((variant) => Number(variant?.stock || 0) <= 0)
  }).length

  return {
    salesSummary: {
      totalSales: currentRevenue,
      percentageChange: shouldComparePrevious ? calculateGrowthPercent(currentRevenue, previousRevenue) : 0,
    },
    orderSummary: {
      totalOrders: currentOrders,
      percentageChange: shouldComparePrevious ? calculateGrowthPercent(currentOrders, previousOrders) : 0,
    },
    productSummary: {
      totalProducts: Number(productsResponse?.total || products.length || 0),
      outOfStockProducts,
      activeProducts: Number(currentAnalytics?.products?.totalActive || 0),
    },
    walletBalance: {
      balance: Number(walletResponse?.balance || currentAnalytics?.wallet?.currentBalance || 0),
      currentBalance: Number(walletResponse?.balance || currentAnalytics?.wallet?.currentBalance || 0),
      availableForPayout: Number(walletResponse?.balance || currentAnalytics?.wallet?.currentBalance || 0),
    },
    pendingOrders: { count: pendingOrdersCount },
    returnsSummary: { count: pendingReturnsCount },
    salesChart: {
      labels: revenueBuckets,
      salesData: (currentAnalytics?.revenue?.overTime || []).map((item) => Number(item?.amount || 0)),
      ordersData,
      summary: {
        totalSales: currentRevenue,
        totalOrders: currentOrders,
      },
    },
    recentOrders: { orders: orders.slice(0, 5) },
    topProducts: {
      products: (currentAnalytics?.products?.topByRevenue || []).slice(0, 3).map((item) => ({
        ...item,
        totalRevenue: Number(item?.revenue || 0),
      })),
    },
    lowStock: {
      products: currentAnalytics?.products?.lowStock || [],
    },
    notifications: { notifications: [] },
    unreadNotifications: { count: 0 },
    analytics: currentAnalytics,
  }
}
