import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getSellerAnalytics } from '@/features/analytics/api'

const useSellerAnalytics = () => {
  const { data, setData, loading, error, run } = useAsync(null, { cacheKey: 'analytics:seller:view' })

  const refresh = useCallback(
    (params = {}) =>
      run(() => getSellerAnalytics(params)).then((result) => {
        setData(result || null)
        return result
      }),
    [run, setData]
  )

  return {
    analytics: data,
    loading,
    error,
    refresh,
  }
}

export default useSellerAnalytics
