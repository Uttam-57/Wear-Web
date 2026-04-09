import { useCallback, useEffect, useMemo } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getProducts } from '@/features/products/api/products.api'

const useProducts = (filters) => {
  const { data, loading, error, run } = useAsync([])
  const serializedFilters = JSON.stringify(filters || {})
  const stableFilters = useMemo(() => JSON.parse(serializedFilters), [serializedFilters])

  const fetchProducts = useMemo(
    () => () => getProducts(stableFilters),
    [stableFilters]
  )

  useEffect(() => {
    run(fetchProducts).catch(() => {})
  }, [fetchProducts, run])

  const refetch = useCallback(() => run(fetchProducts), [fetchProducts, run])

  return {
    products: data || [],
    loading,
    error,
    refetch,
  }
}

export default useProducts
