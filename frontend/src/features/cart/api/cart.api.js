import { queryDelete, queryGet, queryPost, queryPut } from '@/shared/services/dataClient'
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

const asCart = (res) => unwrapData(res).cart || unwrapData(res)

export const fetchCart = (options = {}) => {
  return queryGet(API_ENDPOINTS.CART, {}, { ttlMs: 8000, tags: ['cart'], ...options }).then(asCart)
}

export const addToCart = (payload) => {
  return queryPost(API_ENDPOINTS.CART, payload, {}, { invalidateTags: ['cart'] }).then(asCart)
}

export const updateCartQuantity = (itemId, quantity) => {
  return withNotFoundFallback(
    () => queryPut(
      `${API_ENDPOINTS.CART}/items/${itemId}`,
      { quantity },
      {},
      { invalidateTags: ['cart'] }
    ).then(asCart),
    () => queryPut(
      `${API_ENDPOINTS.CART}/${itemId}`,
      { quantity },
      {},
      { invalidateTags: ['cart'] }
    ).then(asCart)
  )
}

export const removeCartItem = (itemId) => {
  return withNotFoundFallback(
    () => queryDelete(`${API_ENDPOINTS.CART}/items/${itemId}`, {}, { invalidateTags: ['cart'] }).then(asCart),
    () => queryDelete(`${API_ENDPOINTS.CART}/${itemId}`, {}, { invalidateTags: ['cart'] }).then(asCart)
  )
}

export const clearCart = () => {
  return queryDelete(API_ENDPOINTS.CART, {}, { invalidateTags: ['cart'] }).then(asCart)
}

export const saveCartItemForLater = (itemId) => {
  return queryPost(
    `${API_ENDPOINTS.CART}/items/${itemId}/save`,
    {},
    {},
    { invalidateTags: ['cart'] }
  ).then(asCart)
}

export const moveSavedItemToCart = (itemId) => {
  return withNotFoundFallback(
    () => queryPost(
      `${API_ENDPOINTS.CART}/saved-items/${itemId}/move-to-cart`,
      {},
      {},
      { invalidateTags: ['cart'] }
    ).then(asCart),
    () => queryPost(
      `${API_ENDPOINTS.CART}/saved-items/${itemId}/move`,
      {},
      {},
      { invalidateTags: ['cart'] }
    ).then(asCart)
  )
}

export const removeCartItemsBulk = async (itemIds = []) => {
  const ids = Array.from(new Set((itemIds || []).filter(Boolean)))
  if (!ids.length) return fetchCart()

  return withNotFoundFallback(
    () => queryPost(
      `${API_ENDPOINTS.CART}/bulk-remove`,
      { itemIds: ids },
      {},
      { invalidateTags: ['cart'] }
    ).then(asCart),
    async () => {
      await Promise.all(ids.map((itemId) => removeCartItem(itemId).catch(() => null)))
      return fetchCart()
    }
  )
}

export const moveCartItemsToWishlist = async (itemIds = []) => {
  const ids = Array.from(new Set((itemIds || []).filter(Boolean)))
  if (!ids.length) return fetchCart()

  return withNotFoundFallback(
    () => queryPost(
      `${API_ENDPOINTS.CART}/bulk-move-to-wishlist`,
      { itemIds: ids },
      {},
      { invalidateTags: ['cart', 'wishlist'] }
    ).then(asCart),
    async () => {
      await removeCartItemsBulk(ids)
      return fetchCart()
    }
  )
}
