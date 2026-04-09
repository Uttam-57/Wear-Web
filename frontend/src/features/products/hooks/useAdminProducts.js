import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { listAdminProducts, holdAdminProduct, unholdAdminProduct, removeAdminProduct } from '@/features/products/api/products.api'

const normalizeAdminProduct = (product = {}) => {
  return {
    ...product,
    id: product?.id || product?.productId || product?._id || '',
  }
}

const useAdminProducts = () => {
  const { data, setData, loading, error, run } = useAsync([])

  const refresh = useCallback(
    (params = {}) => run(() => listAdminProducts(params)).then((products) => {
      const normalizedProducts = Array.isArray(products)
        ? products.map((product) => normalizeAdminProduct(product))
        : []

      setData(normalizedProducts)
      return normalizedProducts
    }),
    [run, setData]
  )

  return {
    products: data || [],
    loading,
    error,
    refresh,
    holdProduct: holdAdminProduct,
    unholdProduct: unholdAdminProduct,
    removeProduct: removeAdminProduct,
  }
}

export default useAdminProducts
