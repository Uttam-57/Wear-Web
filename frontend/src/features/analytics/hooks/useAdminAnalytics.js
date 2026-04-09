import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getAdminAnalytics } from '@/features/analytics/api'

const useAdminAnalytics = () => {
  const { data, setData, loading, error, run } = useAsync(null, { cacheKey: 'analytics:admin:view' })

  const refresh = useCallback(
    (params = {}) =>
      run(() => getAdminAnalytics(params)).then((result) => {
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

export default useAdminAnalytics
