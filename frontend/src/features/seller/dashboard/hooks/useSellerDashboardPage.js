import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { USER_STATUS } from '@/shared/constants/app'
import useAuthStore from '@/features/auth/authSlice'
import useSellerProfile from '@/features/user/hooks/useSellerProfile'
import { fetchSellerDashboardPayload } from '@/features/seller/dashboard/api/sellerDashboard.api'

export const DASHBOARD_PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'all_time', label: 'All Time' },
  { value: 'this_year', label: 'This Year' },
]

const EMPTY_SNAPSHOT = {
  totalSales: 0,
  salesChange: 0,
  totalOrders: 0,
  ordersChange: 0,
  totalProducts: 0,
  outOfStockProducts: 0,
  walletBalance: 0,
  pendingOrdersCount: 0,
  pendingReturnsCount: 0,
  chart: {
    labels: [],
    salesData: [],
    ordersData: [],
  },
  recentOrders: [],
  topProducts: [],
  lowStockProducts: [],
  notifications: [],
  unreadNotificationCount: 0,
  hasProducts: false,
  hasOrders: false,
}

const SELLER_DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000
let sellerDashboardCache = null

const getSellerDashboardCache = () => {
  if (!sellerDashboardCache) return null
  if (Date.now() - sellerDashboardCache.updatedAt > SELLER_DASHBOARD_CACHE_TTL_MS) {
    sellerDashboardCache = null
    return null
  }
  return sellerDashboardCache
}

const setSellerDashboardCache = (payload) => {
  sellerDashboardCache = {
    ...payload,
    updatedAt: Date.now(),
  }
}

const toArray = (value) => (Array.isArray(value) ? value : [])

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const pickNumber = (...values) => {
  for (const value of values) {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return 0
}

const normalizeChart = (chartPayload) => {
  if (!chartPayload) return EMPTY_SNAPSHOT.chart

  const payload = chartPayload.chart || chartPayload
  const labels = toArray(payload.labels).map((label) => String(label || ''))
  const salesData = toArray(payload.salesData || payload.sales || payload.revenue)
  const ordersData = toArray(payload.ordersData || payload.orders)

  if (!labels.length && toArray(payload.overTime).length) {
    const overTime = toArray(payload.overTime)
    return {
      labels: overTime.map((point) => point.label || point.date || ''),
      salesData: overTime.map((point) => pickNumber(point.sales, point.amount, point.value)),
      ordersData: overTime.map((point) => pickNumber(point.orders, point.orderCount)),
    }
  }

  return {
    labels: labels.filter(Boolean),
    salesData: salesData.map((value) => toNumber(value)),
    ordersData: ordersData.map((value) => toNumber(value)),
  }
}

const normalizeSnapshot = (payload) => {
  const chart = normalizeChart(payload.salesChart)

  const recentOrders = toArray(payload.recentOrders?.orders || payload.recentOrders?.items || payload.recentOrders).slice(0, 5)
  const topProducts = toArray(payload.topProducts?.products || payload.topProducts?.items || payload.topProducts).slice(0, 3)
  const lowStockProducts = toArray(payload.lowStock?.lowStockProducts || payload.lowStock?.products || payload.lowStock)

  const notifications = toArray(payload.notifications?.notifications || payload.notifications?.items || payload.notifications).slice(0, 5)
  const unreadFromList = notifications.filter((item) => !item?.isRead).length

  const totalOrders = pickNumber(
    payload.orderSummary?.totalOrders,
    payload.orderSummary?.orders?.total,
    payload.salesSummary?.orders?.total,
    payload.salesChart?.summary?.totalOrders
  )

  const totalProducts = pickNumber(
    payload.productSummary?.totalProducts,
    payload.productSummary?.products?.total,
    payload.productSummary?.activeProducts
  )

  const outOfStockProducts = pickNumber(
    payload.productSummary?.outOfStockProducts,
    payload.productSummary?.products?.outOfStock,
    lowStockProducts.filter((item) => toNumber(item?.variant?.stock, item?.stock) <= 0).length
  )

  return {
    totalSales: pickNumber(
      payload.salesSummary?.totalSales,
      payload.salesSummary?.revenue?.totalEarned,
      payload.salesChart?.summary?.totalSales
    ),
    salesChange: pickNumber(
      payload.salesSummary?.percentageChange,
      payload.salesSummary?.growthPercentage,
      payload.salesSummary?.revenue?.growthRate
    ),
    totalOrders,
    ordersChange: pickNumber(
      payload.orderSummary?.percentageChange,
      payload.orderSummary?.orders?.growthRate,
      payload.salesSummary?.orders?.growthRate
    ),
    totalProducts,
    outOfStockProducts,
    walletBalance: pickNumber(
      payload.walletBalance?.availableForPayout,
      payload.walletBalance?.balance,
      payload.walletBalance?.currentBalance
    ),
    pendingOrdersCount: pickNumber(
      payload.pendingOrders?.count,
      payload.pendingOrders?.total,
      payload.pendingOrders?.pagination?.total
    ),
    pendingReturnsCount: pickNumber(
      payload.returnsSummary?.count,
      payload.returnsSummary?.total,
      payload.returnsSummary?.pagination?.total
    ),
    chart,
    recentOrders,
    topProducts,
    lowStockProducts,
    notifications,
    unreadNotificationCount: pickNumber(
      payload.unreadNotifications?.count,
      payload.unreadNotifications?.unreadCount,
      unreadFromList
    ),
    hasProducts: totalProducts > 0,
    hasOrders: totalOrders > 0 || recentOrders.length > 0,
  }
}

export default function useSellerDashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const cachedDashboardState = getSellerDashboardCache()

  const { sellerProfile, loading: profileLoading, refresh: refreshSellerProfile } = useSellerProfile()

  const [snapshot, setSnapshot] = useState(() => cachedDashboardState?.snapshot || EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(() => !cachedDashboardState)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(() => cachedDashboardState?.error || '')

  const currentPeriod = searchParams.get('period')
  const period = DASHBOARD_PERIOD_OPTIONS.some((item) => item.value === currentPeriod)
    ? currentPeriod
    : 'last_7_days'

  const sellerStatus = String(sellerProfile?.status || user?.status || '').toLowerCase()
  const isPending = sellerStatus === USER_STATUS.PENDING
  const isBlocked = sellerStatus === USER_STATUS.BLOCKED
  const isProfileIncomplete = sellerProfile ? sellerProfile.profileComplete === false : false

  const setPeriod = useCallback((nextPeriod) => {
    const params = new URLSearchParams(searchParams)
    params.set('period', nextPeriod)
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  const refresh = useCallback(async (softRefresh = false) => {
    if (softRefresh) {
      setRefreshing(true)
    } else {
      const hasCachedDashboard = Boolean(getSellerDashboardCache())
      if (!hasCachedDashboard) setLoading(true)
    }

    try {
      const payload = await fetchSellerDashboardPayload({ period })
      const nextSnapshot = normalizeSnapshot(payload)
      setSnapshot(nextSnapshot)
      setError('')
      setSellerDashboardCache({ snapshot: nextSnapshot, error: '' })
    } catch (err) {
      const nextError = err?.response?.data?.message || err?.message || 'Unable to load dashboard data'
      setError(nextError)
      setSellerDashboardCache({ snapshot: getSellerDashboardCache()?.snapshot || EMPTY_SNAPSHOT, error: nextError })
    } finally {
      if (softRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [period])

  useEffect(() => {
    refreshSellerProfile().catch(() => {})
  }, [refreshSellerProfile])

  useEffect(() => {
    if (profileLoading) return
    if (isBlocked) {
      setLoading(false)
      return
    }
    if (isPending) {
      navigate(ROUTES.SELLER_PENDING, { replace: true })
      return
    }
    if (isProfileIncomplete) {
      navigate(ROUTES.SELLER_PROFILE, {
        replace: true,
        state: { requiresProfileSetup: true },
      })
    }
  }, [profileLoading, isBlocked, isPending, isProfileIncomplete, navigate])

  useEffect(() => {
    if (profileLoading || isPending || isBlocked || isProfileIncomplete) return
    refresh(false).catch(() => {})
  }, [profileLoading, isPending, isBlocked, isProfileIncomplete, refresh])

  const periodLabel = useMemo(() => {
    const selected = DASHBOARD_PERIOD_OPTIONS.find((item) => item.value === period)
    return selected?.label || 'Last 7 Days'
  }, [period])

  return {
    period,
    periodLabel,
    periodOptions: DASHBOARD_PERIOD_OPTIONS,
    setPeriod,
    loading: loading || (profileLoading && !sellerProfile),
    refreshing,
    error,
    refresh,
    snapshot,
    isBlocked,
    blockedInfo: user?.blockInfo || sellerProfile?.blockInfo || null,
    sellerProfile,
  }
}
