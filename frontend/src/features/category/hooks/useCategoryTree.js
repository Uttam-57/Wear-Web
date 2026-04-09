import { useCallback, useEffect } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { getCategoryTree } from '@/features/category/api/category.api'

const useCategoryTree = () => {
  const { data, setData, loading, error, run } = useAsync([], { cacheKey: 'category:tree' })

  const refresh = useCallback(() => {
    return run(() => getCategoryTree())
      .then((categories) => {
        const normalized = categories || []
        setData(normalized)
        return normalized
      })
  }, [run, setData])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  return {
    categories: data || [],
    setCategories: setData,
    loading,
    error,
    refresh,
  }
}

export default useCategoryTree
