import { queryGet } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'
import { getProductReviews, getSellerProductById } from '@/features/products/api/products.api'

const unwrapData = (response) => response?.data?.data || response?.data || {}

export const listSellerStorePreviewProducts = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.SELLER_PRODUCTS,
    { params },
    { ttlMs: 10000, tags: ['products:seller'] }
  ).then((response) => {
    const payload = unwrapData(response)
    const products = Array.isArray(payload?.products)
      ? payload.products
      : Array.isArray(payload)
        ? payload
        : []

    return {
      products,
      total: Number(payload?.total || products.length),
      page: Number(payload?.page || 1),
      limit: Number(payload?.limit || Math.max(1, products.length || 1)),
    }
  })
}

export const getSellerStorePreviewProduct = (productId) => getSellerProductById(productId)

export const getSellerStorePreviewReviews = (productId, params = {}) => {
  return getProductReviews(productId, params)
}
