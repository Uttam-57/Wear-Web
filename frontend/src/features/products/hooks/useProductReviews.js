import { useCallback, useEffect, useMemo } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getProductReviews } from '@/features/products/api/products.api'
import { normalizeReview } from '@/features/products/utils/productBrowse.utils'

const useProductReviews = ({ productId, page = 1, limit = 5 } = {}) => {
  const { data, loading, error, run } = useAsync({ reviews: [], pagination: null })

  const stableArgs = useMemo(
    () => ({ productId, page, limit }),
    [productId, page, limit]
  )

  useEffect(() => {
    if (!stableArgs.productId) return

    run(() => getProductReviews(stableArgs.productId, { page: stableArgs.page, limit: stableArgs.limit })).catch(() => {})
  }, [stableArgs, run])

  const reviews = useMemo(() => {
    return (data?.reviews || []).map(normalizeReview).filter(Boolean)
  }, [data])

  const refetch = useCallback(
    () => run(() => getProductReviews(productId, { page, limit })),
    [limit, page, productId, run]
  )

  return {
    reviews,
    pagination: data?.pagination || null,
    loading,
    error,
    refetch,
  }
}

export default useProductReviews
