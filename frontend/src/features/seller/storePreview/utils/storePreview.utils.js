import {
  getPrimaryVariant,
  getProductImages,
  getVariantPricing,
} from '@/features/products/utils/productBrowse.utils'
import { getDefaultProductFallback } from '@/shared/constants/media'

export const STORE_FILTER_ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'out', label: 'Out of stock' },
  { id: 'low', label: 'Low stock' },
]

export const STORE_SORT_ITEMS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-rating', label: 'Rating: high to low' },
]

export const LOW_STOCK_THRESHOLD = 5

const FALLBACK_PRODUCT_IMAGE = getDefaultProductFallback(900, 80)

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const formatMonthYear = (dateValue) => {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const getStoreInitials = (storeName = '') => {
  const parts = String(storeName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'SS'
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}

export const getVariantStockTone = (stock) => {
  if (stock <= 0) return 'danger'
  if (stock <= LOW_STOCK_THRESHOLD) return 'warning'
  return 'neutral'
}

export const buildInventorySnapshot = (product = {}) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []

  const variantStocks = variants.map((variant, index) => {
    const color = String(variant?.colorName || '').trim()
    const size = String(variant?.size || '').trim()
    const label = [color || `Color ${index + 1}`, size || '-'].join('/')
    const stock = Math.max(0, toNumber(variant?.stock))

    return {
      id: String(variant?._id || `${color}-${size}-${index}`),
      label,
      stock,
      tone: getVariantStockTone(stock),
    }
  })

  const totalStock = variantStocks.reduce((sum, row) => sum + row.stock, 0)
  const hasLowStock = variantStocks.some((row) => row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD)

  const status = totalStock <= 0
    ? 'out'
    : hasLowStock
      ? 'low'
      : 'active'

  return {
    totalStock,
    variantStocks,
    status,
    isOutOfStock: status === 'out',
    isLowStock: status === 'low',
  }
}

export const decorateStoreProducts = (products = []) => {
  return (products || []).map((product) => {
    const inventory = buildInventorySnapshot(product)
    const primaryVariant = getPrimaryVariant(product)
    const pricing = getVariantPricing(primaryVariant)
    const image = getProductImages(product)?.[0] || FALLBACK_PRODUCT_IMAGE

    return {
      ...product,
      preview: {
        inventory,
        pricing,
        image,
        primaryVariant,
        rating: toNumber(product?.avgRating),
        reviews: toNumber(product?.totalReviews),
      },
    }
  })
}

export const buildFilterCounts = (products = []) => {
  const all = products.length
  const active = products.filter((product) => !product?.preview?.inventory?.isOutOfStock).length
  const out = products.filter((product) => product?.preview?.inventory?.isOutOfStock).length
  const low = products.filter((product) => product?.preview?.inventory?.isLowStock).length

  return { all, active, out, low }
}

export const filterStoreProducts = (products = [], activeFilter = 'all') => {
  if (activeFilter === 'active') {
    return products.filter((product) => !product?.preview?.inventory?.isOutOfStock)
  }

  if (activeFilter === 'out') {
    return products.filter((product) => product?.preview?.inventory?.isOutOfStock)
  }

  if (activeFilter === 'low') {
    return products.filter((product) => product?.preview?.inventory?.isLowStock)
  }

  return products
}

const sortByDate = (products = [], direction = 'desc') => {
  return [...products].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || 0).getTime()
    const rightTime = new Date(right?.createdAt || 0).getTime()
    return direction === 'asc' ? leftTime - rightTime : rightTime - leftTime
  })
}

const sortByPrice = (products = [], direction = 'asc') => {
  return [...products].sort((left, right) => {
    const leftPrice = toNumber(left?.preview?.pricing?.effective)
    const rightPrice = toNumber(right?.preview?.pricing?.effective)
    return direction === 'asc' ? leftPrice - rightPrice : rightPrice - leftPrice
  })
}

const sortByRating = (products = []) => {
  return [...products].sort((left, right) => {
    const leftRating = toNumber(left?.preview?.rating)
    const rightRating = toNumber(right?.preview?.rating)
    return rightRating - leftRating
  })
}

export const sortStoreProducts = (products = [], sortBy = '-createdAt') => {
  if (sortBy === 'createdAt') return sortByDate(products, 'asc')
  if (sortBy === 'price') return sortByPrice(products, 'asc')
  if (sortBy === '-price') return sortByPrice(products, 'desc')
  if (sortBy === '-rating') return sortByRating(products)
  return sortByDate(products, 'desc')
}

export const buildStoreSummary = (products = []) => {
  const totalProducts = products.length
  const totalReviews = products.reduce((sum, product) => sum + toNumber(product?.preview?.reviews), 0)

  const weightedRatings = products.reduce((sum, product) => {
    const rating = toNumber(product?.preview?.rating)
    const reviews = toNumber(product?.preview?.reviews)
    return sum + (rating * reviews)
  }, 0)

  const avgRating = totalReviews > 0
    ? weightedRatings / totalReviews
    : 0

  const dates = products
    .map((product) => new Date(product?.createdAt || 0).getTime())
    .filter((time) => Number.isFinite(time) && time > 0)

  const firstListingAt = dates.length ? new Date(Math.min(...dates)) : null

  return {
    totalProducts,
    activeProducts: products.filter((product) => !product?.preview?.inventory?.isOutOfStock).length,
    outOfStockProducts: products.filter((product) => product?.preview?.inventory?.isOutOfStock).length,
    lowStockProducts: products.filter((product) => product?.preview?.inventory?.isLowStock).length,
    totalReviews,
    avgRating,
    activeSince: firstListingAt,
    activeSinceLabel: firstListingAt ? formatMonthYear(firstListingAt) : '-',
  }
}

export const buildColorOptions = (variants = []) => {
  const map = new Map()

  ;(variants || []).forEach((variant) => {
    const colorName = String(variant?.colorName || '').trim()
    if (!colorName) return

    const stock = Math.max(0, toNumber(variant?.stock))
    const existing = map.get(colorName)

    if (!existing) {
      map.set(colorName, {
        colorName,
        colorCode: variant?.colorCode || '#c7d2e5',
        totalStock: stock,
      })
      return
    }

    existing.totalStock += stock
    if (!existing.colorCode && variant?.colorCode) existing.colorCode = variant.colorCode
  })

  return Array.from(map.values()).map((item) => {
    const inStock = item.totalStock > 0
    const stockLabel = !inStock
      ? 'Out of stock'
      : item.totalStock <= LOW_STOCK_THRESHOLD
        ? 'Low stock'
        : 'In stock'

    return {
      ...item,
      inStock,
      stockLabel,
    }
  })
}

export const buildSizeOptions = (variants = [], colorName = '') => {
  return (variants || [])
    .filter((variant) => String(variant?.colorName || '') === String(colorName || ''))
    .map((variant, index) => {
      const stock = Math.max(0, toNumber(variant?.stock))
      return {
        key: String(variant?._id || `${variant?.size || 'size'}-${index}`),
        size: variant?.size || '-',
        stock,
        variant,
      }
    })
}

export const resolveVariantSelection = (variants = [], selectedColor = '', selectedSize = '') => {
  const exact = (variants || []).find((variant) => {
    return String(variant?.colorName || '') === String(selectedColor || '')
      && String(variant?.size || '') === String(selectedSize || '')
  })
  if (exact) return exact

  const byColor = (variants || []).find((variant) => String(variant?.colorName || '') === String(selectedColor || ''))
  if (byColor) return byColor

  return getPrimaryVariant({ variants }) || null
}

export const buildExactStockRows = (variants = []) => {
  return (variants || [])
    .map((variant, index) => ({
      key: String(variant?._id || `${variant?.colorName}-${variant?.size}-${index}`),
      colorName: variant?.colorName || '-',
      size: variant?.size || '-',
      stock: Math.max(0, toNumber(variant?.stock)),
    }))
    .sort((left, right) => {
      const colorCompare = String(left.colorName).localeCompare(String(right.colorName))
      if (colorCompare !== 0) return colorCompare
      return String(left.size).localeCompare(String(right.size))
    })
}

export const getTotalStock = (variants = []) => {
  return (variants || []).reduce((sum, variant) => sum + Math.max(0, toNumber(variant?.stock)), 0)
}
