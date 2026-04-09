export const DEFAULT_SORT = 'relevance'
export const DEFAULT_VIEW = 'grid'
export const DEFAULT_LIMIT = 12

export const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Newest First', value: '-createdAt' },
  { label: 'Discount: High to Low', value: '-discount' },
  { label: 'Rating: High to Low', value: '-rating' },
]

export const DISCOUNT_OPTIONS = [10, 20, 30, 50]

export const PRICE_PRESETS = [
  { label: 'Under INR 500', min: '', max: '500' },
  { label: 'INR 500 - INR 1000', min: '500', max: '1000' },
  { label: 'INR 1000 - INR 2000', min: '1000', max: '2000' },
  { label: 'INR 2000 - INR 5000', min: '2000', max: '5000' },
  { label: 'Above INR 5000', min: '5000', max: '' },
]

export const parseCsv = (value) => {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const stringifyCsv = (list = []) => {
  return (list || []).filter(Boolean).join(',')
}

export const toTitleCase = (value = '') => {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const normalizeColorCode = (colorCode, fallback = '#d8e0ed') => {
  if (!colorCode || typeof colorCode !== 'string') return fallback
  const trimmed = colorCode.trim()
  if (!trimmed) return fallback
  return trimmed
}

export const collectUniqueValues = (products, picker) => {
  const map = new Map()

  ;(products || []).forEach((product) => {
    ;(picker(product) || []).forEach((value) => {
      const key = String(value || '').trim()
      if (!key) return
      map.set(key, (map.get(key) || 0) + 1)
    })
  })

  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export const getPrimaryVariant = (product) => {
  const variants = product?.variants || []
  return variants.find((variant) => Number(variant?.stock || 0) > 0) || variants[0] || null
}

export const getVariantPricing = (variant) => {
  const base = Number(variant?.price || 0)
  const apiEffective = Number(variant?.effectivePrice)
  const discount = Number(variant?.discount || 0)
  const effective = Number.isFinite(apiEffective)
    ? apiEffective
    : base - (base * discount) / 100

  return {
    base,
    effective: Math.max(0, effective),
    discount: Math.max(0, discount),
  }
}

export const getProductImages = (product) => {
  const images = (product?.images || []).map((image) => (typeof image === 'string' ? image : image?.url)).filter(Boolean)
  return images
}

export const getColorImageSet = (product, colorName) => {
  if (!colorName) return getProductImages(product)

  const colorEntry = (product?.colorImages || []).find((entry) => entry?.colorName === colorName)
  if (colorEntry?.usePrimary === false && Array.isArray(colorEntry.images) && colorEntry.images.length > 0) {
    return colorEntry.images.map((image) => (typeof image === 'string' ? image : image?.url)).filter(Boolean)
  }

  return getProductImages(product)
}

export const isProductNew = (createdAt) => {
  if (!createdAt) return false
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return false

  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return now - created.getTime() <= sevenDays
}

export const getLowestStock = (product) => {
  const stocks = (product?.variants || []).map((variant) => Number(variant?.stock || 0)).filter((stock) => stock > 0)
  if (stocks.length === 0) return 0
  return Math.min(...stocks)
}

export const resolveBreadcrumbs = ({ categoryName, search, productName }) => {
  const crumbs = [{ label: 'Home', to: '/' }]

  if (categoryName) crumbs.push({ label: categoryName, to: '/products' })
  if (search) crumbs.push({ label: `Search: ${search}`, to: '/products' })
  if (productName) crumbs.push({ label: productName })

  if (!categoryName && !search && !productName) crumbs.push({ label: 'Products' })

  return crumbs
}

export const normalizeReview = (review) => {
  if (!review) return null

  const customer = review.customerId
  const customerName = typeof customer === 'object'
    ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
    : 'Verified Customer'

  return {
    ...review,
    customerName: customerName || 'Verified Customer',
    message: review.body || review.title || '',
  }
}
