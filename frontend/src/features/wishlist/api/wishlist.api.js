import { queryDelete, queryGet, queryPost } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data
const isNotFound = (err) => Number(err?.response?.status) === 404

const withNotFoundFallback = async (request, fallback) => {
  try {
    return await request()
  } catch (err) {
    if (isNotFound(err) && typeof fallback === 'function') {
      return fallback()
    }
    throw err
  }
}

export const fetchWishlist = () => {
  return queryGet(API_ENDPOINTS.WISHLIST, {}, { ttlMs: 8000, tags: ['wishlist'] })
    .then((res) => unwrapData(res).products || unwrapData(res))
}

export const addWishlistProduct = (productId) => {
  return queryPost(API_ENDPOINTS.WISHLIST, { productId }, {}, { invalidateTags: ['wishlist'] })
    .then((res) => unwrapData(res).wishlist || unwrapData(res))
}

export const removeWishlistProduct = (productId) => {
  return queryDelete(`${API_ENDPOINTS.WISHLIST}/${productId}`, {}, { invalidateTags: ['wishlist'] })
    .then((res) => unwrapData(res).wishlist || unwrapData(res))
}

export const toggleWishlistProduct = (productId) => {
  return queryPost(`${API_ENDPOINTS.WISHLIST}/toggle`, { productId }, {}, { invalidateTags: ['wishlist'] })
    .then(unwrapData)
}

export const removeWishlistProductsBulk = async (productIds = []) => {
  const ids = Array.from(new Set((productIds || []).filter(Boolean)))
  if (!ids.length) return fetchWishlist()

  return withNotFoundFallback(
    () => queryPost(
      `${API_ENDPOINTS.WISHLIST}/bulk-remove`,
      { productIds: ids },
      {},
      { invalidateTags: ['wishlist'] }
    ).then((res) => unwrapData(res).wishlist || unwrapData(res)),
    async () => {
      await Promise.all(ids.map((productId) => removeWishlistProduct(productId).catch(() => null)))
      return fetchWishlist()
    }
  )
}
