import { useCallback, useEffect } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getProductById } from '@/features/products/api/products.api'

const useProductDetail = (productId) => {
  const { data, loading, error, run } = useAsync(null)

  useEffect(() => {
    if (!productId) return
    run(() => getProductById(productId)).catch(() => {})
  }, [productId, run])

  const refetch = useCallback(() => run(() => getProductById(productId)), [productId, run])

  return {
    product: data,
    loading,
    error,
    refetch,
  }
}

export default useProductDetail
