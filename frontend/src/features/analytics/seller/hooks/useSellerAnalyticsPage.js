import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSellerAnalytics } from '@/features/analytics/api'
import { SELLER_ANALYTICS_PERIOD_OPTIONS } from '@/features/analytics/seller/constants/sellerAnalytics.constants'
import {
  buildSellerAnalyticsParams,
  createEmptySellerAnalyticsView,
  getCustomRangeError,
  getDefaultCustomRange,
  normalizeSellerAnalytics,
} from '@/features/analytics/seller/utils/sellerAnalytics.utils'
import { getApiError } from '@/shared/services/apiClient'

const SELLER_ANALYTICS_VIEW_CACHE_TTL_MS = 5 * 60 * 1000
let sellerAnalyticsViewCache = null

const getSellerAnalyticsViewCache = () => {
  if (!sellerAnalyticsViewCache) return null
  if (Date.now() - sellerAnalyticsViewCache.updatedAt > SELLER_ANALYTICS_VIEW_CACHE_TTL_MS) {
    sellerAnalyticsViewCache = null
    return null
  }
  return sellerAnalyticsViewCache
}

const setSellerAnalyticsViewCache = (payload) => {
  sellerAnalyticsViewCache = {
    ...payload,
    updatedAt: Date.now(),
  }
}

export default function useSellerAnalyticsPage() {
  const cachedViewState = getSellerAnalyticsViewCache()
  const defaultRange = useMemo(() => getDefaultCustomRange(), [])

  const [period, setPeriod] = useState('7d')
  const [customFrom, setCustomFrom] = useState(defaultRange.from)
  const [customTo, setCustomTo] = useState(defaultRange.to)

  const [view, setView] = useState(() => cachedViewState?.view || createEmptySellerAnalyticsView())
  const [loading, setLoading] = useState(() => !cachedViewState)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(() => cachedViewState?.error || '')

  const hasLoadedRef = useRef(false)
  const requestIdRef = useRef(0)

  const customRangeError = useMemo(
    () => getCustomRangeError({ period, from: customFrom, to: customTo }),
    [period, customFrom, customTo]
  )

  const requestParams = useMemo(
    () => buildSellerAnalyticsParams({ period, from: customFrom, to: customTo }),
    [period, customFrom, customTo]
  )

  const fetchAnalytics = useCallback(async ({ params, silent = false } = {}) => {
    if (!params) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const payload = await getSellerAnalytics(params)

      if (requestId !== requestIdRef.current) return

      const nextView = normalizeSellerAnalytics(payload)
      setView(nextView)
      setError('')
      setSellerAnalyticsViewCache({ view: nextView, error: '' })
      hasLoadedRef.current = true
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return
      const nextError = getApiError(requestError, 'Unable to load analytics data right now.')
      setError(nextError)
      setSellerAnalyticsViewCache({ view, error: nextError })
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!requestParams) return

    if (cachedViewState && !hasLoadedRef.current) {
      hasLoadedRef.current = true
    }

    fetchAnalytics({
      params: requestParams,
      silent: hasLoadedRef.current,
    }).catch(() => {})
  }, [requestParams, fetchAnalytics])

  const refresh = useCallback(() => {
    if (!requestParams) return Promise.resolve()
    return fetchAnalytics({ params: requestParams, silent: true })
  }, [requestParams, fetchAnalytics])

  return {
    period,
    periodOptions: SELLER_ANALYTICS_PERIOD_OPTIONS,
    customFrom,
    customTo,
    customRangeError,
    loading,
    refreshing,
    error,
    view,
    setPeriod,
    setCustomFrom,
    setCustomTo,
    refresh,
  }
}
