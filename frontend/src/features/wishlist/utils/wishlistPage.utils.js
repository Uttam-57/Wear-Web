import { getDefaultProductFallback, normalizeMediaUrl } from '@/shared/constants/media'

const FALLBACK_IMAGE = getDefaultProductFallback(900, 80)

const toId = (value) => String(value || '')

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const unique = (values = []) => Array.from(new Set(values.filter(Boolean)))

export const getEffectivePrice = (price, discount = 0) => {
  const base = Math.max(0, toNumber(price))
  const off = Math.min(100, Math.max(0, toNumber(discount)))
  return Number((base - (base * off) / 100).toFixed(2))
}

export const getProductCardImage = (product, fallback = '') => {
  const productImage = normalizeMediaUrl(product?.images?.[0])
  return productImage || fallback || FALLBACK_IMAGE
}

export const buildColorGroups = (variants = []) => {
  const map = new Map()

  ;(variants || []).forEach((variant) => {
    const key = String(variant?.colorName || '').trim()
    if (!key) return

    if (!map.has(key)) {
      map.set(key, {
        colorName: key,
        colorCode: variant?.colorCode || '#d6dce7',
        variants: [],
      })
    }

    map.get(key).variants.push(variant)
  })

  return Array.from(map.values())
}

export const getStockSummary = (variants = []) => {
  const stocks = (variants || []).map((variant) => Math.max(0, toNumber(variant?.stock))).filter((stock) => Number.isFinite(stock))
  const maxStock = stocks.length ? Math.max(...stocks) : 0

  if (maxStock <= 0) {
    return {
      key: 'out',
      label: 'OUT OF STOCK',
      tone: 'danger',
      available: false,
      maxStock,
    }
  }

  if (maxStock <= 5) {
    return {
      key: 'low',
      label: `Low Stock (${maxStock} left)`,
      tone: 'warning',
      available: true,
      maxStock,
    }
  }

  return {
    key: 'in',
    label: 'In Stock',
    tone: 'success',
    available: true,
    maxStock,
  }
}

export const pickDefaultVariant = (variants = []) => {
  const inStock = (variants || []).find((variant) => toNumber(variant?.stock) > 0)
  return inStock || variants[0] || null
}

export const pickCheapestVariant = (variants = []) => {
  if (!variants.length) return null

  return variants.reduce((best, variant) => {
    if (!best) return variant
    const candidatePrice = getEffectivePrice(variant?.price, variant?.discount)
    const bestPrice = getEffectivePrice(best?.price, best?.discount)
    return candidatePrice < bestPrice ? variant : best
  }, null)
}

export const toWishlistViewModel = (wishlistItem, product, index = 0) => {
  const variants = product?.variants || []
  const cardVariant = pickCheapestVariant(variants) || pickDefaultVariant(variants)
  const defaultVariant = pickDefaultVariant(variants)
  const stock = getStockSummary(variants)

  const price = toNumber(cardVariant?.price, 0)
  const discount = toNumber(cardVariant?.discount, 0)
  const effectivePrice = getEffectivePrice(price, discount)

  const colors = unique(variants.map((variant) => variant?.colorName))
  const sizes = unique(variants.map((variant) => variant?.size))

  return {
    id: toId(wishlistItem?.productId || product?._id),
    productId: toId(wishlistItem?.productId || product?._id),
    product,
    index,
    name: product?.name || wishlistItem?.name || 'Unavailable Product',
    image: getProductCardImage(product, wishlistItem?.image),
    rating: toNumber(product?.avgRating, 0),
    reviewsCount: Math.max(0, toNumber(product?.totalReviews, 0)),
    price,
    effectivePrice,
    discount,
    stock,
    colors,
    sizes,
    variants,
    defaultVariant,
    cardVariant,
    available: Boolean(stock.available),
    missingProduct: !product,
    addedAt: wishlistItem?.addedAt || null,
  }
}

const sortFns = {
  recently: (a, b) => a.index - b.index,
  priceLow: (a, b) => a.effectivePrice - b.effectivePrice,
  priceHigh: (a, b) => b.effectivePrice - a.effectivePrice,
  discountHigh: (a, b) => b.discount - a.discount,
}

export const applyWishlistSortingAndFilter = (items = [], sortBy = 'recently', inStockOnly = false) => {
  const filtered = inStockOnly ? items.filter((item) => item.available) : [...items]
  const sorter = sortFns[sortBy] || sortFns.recently
  return filtered.sort(sorter)
}

export const getVariantSelectorState = (product) => {
  const variants = product?.variants || []
  const colorGroups = buildColorGroups(variants)
  const firstAvailableColor = colorGroups.find((group) => group.variants.some((variant) => toNumber(variant?.stock) > 0))

  const selectedColor = firstAvailableColor?.colorName || colorGroups[0]?.colorName || ''
  const sizeOptions = selectedColor
    ? variants.filter((variant) => variant?.colorName === selectedColor)
    : variants

  const selectedVariant = pickDefaultVariant(sizeOptions)

  return {
    colorGroups,
    selectedColor,
    selectedVariant,
    quantity: 1,
  }
}

export const makeCartPayloadFromVariant = (productId, variant, quantity = 1) => ({
  productId: toId(productId),
  variantId: toId(variant?._id),
  quantity: Math.max(1, toNumber(quantity, 1)),
})
