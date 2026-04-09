import { getCartProductFallback, normalizeMediaUrl } from '@/shared/constants/media'

const DELIVERY_FREE_THRESHOLD = 499
const STANDARD_DELIVERY_FEE = 40
const SAVED_ITEMS_STORAGE_KEY = 'wearweb_saved_items_v1'
const FALLBACK_IMAGE = getCartProductFallback(900, 80)

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toId = (value) => String(value || '')

export const getDiscountedPrice = (price, discount) => {
  const base = Math.max(0, toNumber(price))
  const off = Math.min(100, Math.max(0, toNumber(discount)))
  return Number((base - (base * off) / 100).toFixed(2))
}

export const getCartItemImage = (item, product = null) => {
  const productImage = normalizeMediaUrl(product?.images?.[0])
  const snapshotImage = normalizeMediaUrl(item?.snapshot?.images?.[0])
  return productImage || snapshotImage || FALLBACK_IMAGE
}

const getSnapshotDiscount = (item) => {
  const price = toNumber(item?.snapshot?.price)
  const effective = toNumber(item?.snapshot?.effectivePrice)
  if (price <= 0 || effective <= 0 || effective >= price) return 0
  return Math.round(((price - effective) / price) * 100)
}

const resolveSellerName = (item, product) => {
  const firstName = product?.sellerId?.firstName || ''
  const lastName = product?.sellerId?.lastName || ''
  const sellerFromProduct = `${firstName} ${lastName}`.trim()
  if (sellerFromProduct) return sellerFromProduct
  if (item?.snapshot?.sellerName) return item.snapshot.sellerName
  return 'WearWeb Partner Store'
}

const resolveVariant = (item, product) => {
  if (!product?.variants?.length) return null
  const targetId = toId(item?.variantId)
  return product.variants.find((variant) => toId(variant?._id) === targetId) || null
}

export const toCartItemViewModel = (item, product) => {
  const variant = resolveVariant(item, product)
  const snapshotPrice = toNumber(item?.snapshot?.price)
  const snapshotEffectivePrice = toNumber(item?.snapshot?.effectivePrice, snapshotPrice)
  const livePrice = toNumber(variant?.price, snapshotPrice)
  const liveDiscount = toNumber(variant?.discount, getSnapshotDiscount(item))

  const price = livePrice > 0 ? livePrice : snapshotPrice
  const effectivePrice = variant
    ? getDiscountedPrice(price, liveDiscount)
    : (snapshotEffectivePrice > 0 ? snapshotEffectivePrice : getDiscountedPrice(price, liveDiscount))

  const stock = Math.max(0, toNumber(variant?.stock, 0))
  const quantity = Math.max(1, toNumber(item?.quantity, 1))

  const productUnavailable = !product || ['held', 'removed'].includes(String(product?.status || '').toLowerCase())
  const variantUnavailable = Boolean(product) && !variant
  const outOfStock = productUnavailable || variantUnavailable || stock <= 0

  const name = product?.name || item?.snapshot?.productName || 'Unavailable Product'
  const colorName = variant?.colorName || item?.snapshot?.colorName || '-'
  const size = variant?.size || item?.snapshot?.size || '-'

  const priceTotal = Number((price * quantity).toFixed(2))
  const effectiveTotal = Number((effectivePrice * quantity).toFixed(2))
  const discountTotal = Number((priceTotal - effectiveTotal).toFixed(2))

  return {
    ...item,
    id: toId(item?.variantId),
    productId: toId(item?.productId),
    variantId: toId(item?.variantId),
    product,
    variant,
    name,
    colorName,
    size,
    image: getCartItemImage(item, product),
    sellerName: resolveSellerName(item, product),
    sellerPath: `/products?q=${encodeURIComponent(resolveSellerName(item, product))}`,
    price,
    effectivePrice,
    discount: Math.max(0, liveDiscount),
    stock,
    quantity,
    isOutOfStock: outOfStock,
    isProductUnavailable: productUnavailable,
    isVariantUnavailable: variantUnavailable,
    isLowStock: stock > 0 && stock < 10,
    maxQuantity: stock > 0 ? stock : quantity,
    priceTotal,
    effectiveTotal,
    discountTotal,
  }
}

export const buildCartSummary = (items = []) => {
  const activeItems = (items || []).filter((item) => !item.isOutOfStock)
  const outOfStockCount = (items || []).filter((item) => item.isOutOfStock).length

  const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0)
  const priceBeforeDiscount = Number(activeItems.reduce((sum, item) => sum + item.priceTotal, 0).toFixed(2))
  const totalDiscount = Number(activeItems.reduce((sum, item) => sum + item.discountTotal, 0).toFixed(2))

  const deliveryCharges = priceBeforeDiscount >= DELIVERY_FREE_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE
  const totalAmount = Number((priceBeforeDiscount - totalDiscount + deliveryCharges).toFixed(2))

  return {
    totalItems,
    itemKinds: activeItems.length,
    outOfStockCount,
    priceBeforeDiscount,
    totalDiscount,
    deliveryCharges,
    totalAmount,
    addMoreForFreeDelivery: deliveryCharges === 0 ? 0 : Math.max(0, DELIVERY_FREE_THRESHOLD - priceBeforeDiscount),
    canCheckout: activeItems.length > 0 && outOfStockCount === 0,
  }
}

export const sanitizeQuantity = (value, maxStock, fallback = 1) => {
  const next = Number(value)
  const max = Math.max(1, Number(maxStock || 1))
  if (!Number.isInteger(next)) return fallback
  if (next < 1) return fallback
  if (next > max) return max
  return next
}

const normalizeSavedItems = (items = []) => {
  return (items || [])
    .map((item) => ({
      id: toId(item?.id || item?.variantId),
      productId: toId(item?.productId),
      variantId: toId(item?.variantId || item?.id),
      quantity: Math.max(1, toNumber(item?.quantity, 1)),
      sellerId: toId(item?.sellerId),
      snapshot: item?.snapshot || null,
      createdAt: item?.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.productId && item.variantId)
}

export const readSavedItems = () => {
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return normalizeSavedItems(parsed)
  } catch {
    return []
  }
}

export const writeSavedItems = (items) => {
  const normalized = normalizeSavedItems(items)
  localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export const toSavedItem = (cartItem) => {
  return {
    id: cartItem.variantId,
    productId: cartItem.productId,
    variantId: cartItem.variantId,
    quantity: cartItem.quantity,
    sellerId: cartItem.sellerId,
    snapshot: cartItem.snapshot,
    createdAt: new Date().toISOString(),
  }
}

export const toSavedItemViewModel = (savedItem, product) => {
  const variant = resolveVariant(savedItem, product)
  const price = toNumber(variant?.price, toNumber(savedItem?.snapshot?.price))
  const discount = toNumber(variant?.discount, getSnapshotDiscount(savedItem))
  const effectivePrice = getDiscountedPrice(price, discount)

  return {
    ...savedItem,
    name: product?.name || savedItem?.snapshot?.productName || 'Unavailable Product',
    colorName: variant?.colorName || savedItem?.snapshot?.colorName || '-',
    size: variant?.size || savedItem?.snapshot?.size || '-',
    image: getCartItemImage(savedItem, product),
    price,
    effectivePrice,
    discount,
    stock: Math.max(0, toNumber(variant?.stock, 0)),
    isOutOfStock: !variant || Math.max(0, toNumber(variant?.stock, 0)) <= 0,
    product,
    variant,
  }
}

export const toSavedItemCartPayload = (savedItem) => ({
  productId: savedItem.productId,
  variantId: savedItem.variantId,
  quantity: Math.max(1, toNumber(savedItem.quantity, 1)),
})

export const cartConstants = {
  DELIVERY_FREE_THRESHOLD,
  STANDARD_DELIVERY_FEE,
}
