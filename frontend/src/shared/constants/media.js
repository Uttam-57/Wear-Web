const UNSPLASH_BASE_URL = 'https://images.unsplash.com'

const DEFAULT_PRODUCT_PHOTO_ID = 'photo-1512436991641-6745cdb1723f'
const CART_PRODUCT_PHOTO_ID = 'photo-1491553895911-0055eca6402d'
const CHECKOUT_PRODUCT_PHOTO_ID = 'photo-1521572163474-6864f9cf17ab'

export const buildUnsplashImageUrl = (photoId, { width = 900, quality = 80, fit = 'crop' } = {}) => {
  return `${UNSPLASH_BASE_URL}/${photoId}?auto=format&fit=${fit}&w=${width}&q=${quality}`
}

export const getDefaultProductFallback = (width = 900, quality = 80) => {
  return buildUnsplashImageUrl(DEFAULT_PRODUCT_PHOTO_ID, { width, quality })
}

export const getCartProductFallback = (width = 900, quality = 80) => {
  return buildUnsplashImageUrl(CART_PRODUCT_PHOTO_ID, { width, quality })
}

export const getCheckoutProductFallback = (width = 480, quality = 80) => {
  return buildUnsplashImageUrl(CHECKOUT_PRODUCT_PHOTO_ID, { width, quality })
}

export const normalizeMediaUrl = (media) => {
  if (!media) return ''
  if (typeof media === 'string') return media
  return media.url || ''
}