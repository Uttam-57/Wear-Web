import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  blockCategories,
  previewDeleteCategories,
  deleteCategories,
  setCategoryTemplate,
} from '@/features/category/api/category.api'

const useAdminCategories = () => {
  const { data, setData, loading, error, run } = useAsync([], { cacheKey: 'admin:categories:tree' })

  const refresh = useCallback(() => {
    return run(() => getCategoryTree()).then((categories) => {
      setData(categories || [])
      return categories
    })
  }, [run, setData])

  return {
    categories: data || [],
    loading,
    error,
    refresh,
    createCategory,
    updateCategory,
    blockCategories,
    previewDeleteCategories,
    deleteCategories,
    setCategoryTemplate,
  }
}

export default useAdminCategories
