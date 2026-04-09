export const GENDER_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
  { value: 'unisex', label: 'Unisex' },
]

export const BASE_COLOR_OPTIONS = [
  'Red', 'Pink', 'Orange', 'Yellow', 'Green',
  'Blue', 'Purple', 'Brown', 'Black', 'White',
  'Grey', 'Beige', 'Gold', 'Silver', 'Multicolor',
]

const toStringSafe = (value) => String(value ?? '').trim()

const toNumberSafe = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const formatNumberInput = (value, decimals = 2) => {
  if (!Number.isFinite(value)) return ''
  const fixed = Number(value.toFixed(decimals))
  return String(fixed)
}

export const calculateSellingPrice = (basePrice, discountPercent) => {
  const base = Math.max(0, toNumberSafe(basePrice, 0))
  const discount = Math.max(0, Math.min(100, toNumberSafe(discountPercent, 0)))
  return Math.max(0, base - (base * discount) / 100)
}

export const calculateDiscountPercent = (basePrice, sellingPrice) => {
  const base = Math.max(0, toNumberSafe(basePrice, 0))
  const selling = Math.max(0, toNumberSafe(sellingPrice, 0))
  if (base <= 0) return 0
  const discount = ((base - Math.min(base, selling)) / base) * 100
  return Math.max(0, Math.min(100, discount))
}

const parseListText = (value) => {
  return String(value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const mapTreeById = (categories = []) => {
  const map = new Map()

  const walk = (node, parentId = null) => {
    if (!node?._id) return
    map.set(String(node._id), {
      ...node,
      __id: String(node._id),
      __parentId: parentId,
    })

    ;(node.children || []).forEach((child) => walk(child, String(node._id)))
  }

  categories.forEach((category) => walk(category, null))
  return map
}

export const getRootCategoryOptions = (categories = []) => {
  return categories
    .map((item) => ({ value: String(item._id), label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export const getSubCategoryOptions = (categories = [], rootCategoryId = '') => {
  const root = categories.find((item) => String(item?._id) === String(rootCategoryId || ''))
  if (!root) return []

  return (root.children || [])
    .map((item) => ({ value: String(item._id), label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export const resolveCategorySelection = (categories = [], categoryId = '') => {
  const map = mapTreeById(categories)
  const current = map.get(String(categoryId || ''))

  if (!current) {
    return {
      rootCategoryId: '',
      subCategoryId: '',
    }
  }

  if (!current.__parentId) {
    return {
      rootCategoryId: current.__id,
      subCategoryId: '',
    }
  }

  let cursor = current
  while (cursor?.__parentId && map.get(cursor.__parentId)?.__parentId) {
    cursor = map.get(cursor.__parentId)
  }

  return {
    rootCategoryId: cursor?.__parentId || current.__parentId,
    subCategoryId: current.__id,
  }
}

export const createEmptyVariant = () => ({
  colorName: '',
  colorCode: '#000000',
  baseColor: 'Black',
  size: '',
  selectedSizes: [],
  price: '',
  sellingPrice: '',
  stock: '',
  discount: '0',
  sku: '',
  minOrderQty: '1',
})

export const createInitialProductForm = () => ({
  rootCategoryId: '',
  subCategoryId: '',
  name: '',
  brand: '',
  gender: 'unisex',
  description: '',
  video: '',
  tagsText: '',
  highlightsText: '',
  images: [],
  variants: [createEmptyVariant()],
  colorImageMap: {},
  descriptionBlocks: [],
  specificationValues: {},
  manufacturerName: '',
  manufacturerAddress: '',
  manufacturerCountryOfOrigin: '',
  manufacturerImporterName: '',
  manufacturerPackerDetails: '',
  shippingWeight: '',
  shippingLength: '',
  shippingBreadth: '',
  shippingHeight: '',
  isCODAvailable: true,
  isPack: false,
  packOf: '1',
  returnable: true,
  returnWindow: '7',
})

const getUniqueColorNames = (variants = []) => {
  const set = new Set(
    variants
      .map((item) => toStringSafe(item.colorName))
      .filter(Boolean)
  )
  return Array.from(set)
}

export const syncColorImageMapWithVariants = (existingMap = {}, variants = []) => {
  const colorNames = getUniqueColorNames(variants)
  const nextMap = {}

  colorNames.forEach((colorName) => {
    const existing = existingMap[colorName]
    nextMap[colorName] = {
      usePrimary: existing?.usePrimary ?? true,
      images: Array.isArray(existing?.images) ? existing.images : [],
    }
  })

  return nextMap
}

export const syncSpecificationValues = (existingValues = {}, specFields = []) => {
  const next = {}
  ;(specFields || []).forEach((field) => {
    const key = String(field?.key || '').trim().toLowerCase()
    if (!key) return
    next[key] = String(existingValues?.[key] || '')
  })
  return next
}

export const buildFormFromProduct = (product, categories = []) => {
  const base = createInitialProductForm()
  if (!product) return base

  const categorySelection = resolveCategorySelection(categories, product?.categoryId?._id || product?.categoryId)

  const variants = Array.isArray(product?.variants) && product.variants.length
    ? product.variants.map((variant) => ({
      colorName: toStringSafe(variant?.colorName),
      colorCode: toStringSafe(variant?.colorCode) || '#000000',
      baseColor: toStringSafe(variant?.baseColor) || 'Black',
      size: toStringSafe(variant?.size),
      selectedSizes: toStringSafe(variant?.size) ? [toStringSafe(variant?.size)] : [],
      price: String(variant?.price ?? ''),
      sellingPrice: formatNumberInput(calculateSellingPrice(variant?.price, variant?.discount)),
      stock: String(variant?.stock ?? ''),
      discount: String(variant?.discount ?? 0),
      sku: toStringSafe(variant?.sku),
      minOrderQty: String(variant?.minOrderQty ?? 1),
    }))
    : [createEmptyVariant()]

  const colorImageMap = {}
  ;(product?.colorImages || []).forEach((entry) => {
    const colorName = toStringSafe(entry?.colorName)
    if (!colorName) return
    colorImageMap[colorName] = {
      usePrimary: Boolean(entry?.usePrimary ?? true),
      images: Array.isArray(entry?.images) ? entry.images : [],
    }
  })

  const specificationValues = {}
  ;(product?.specifications || []).forEach((item) => {
    const key = toStringSafe(item?.key).toLowerCase()
    const value = toStringSafe(item?.value)
    if (!key || !value) return
    specificationValues[key] = value
  })

  return {
    ...base,
    ...categorySelection,
    name: toStringSafe(product?.name),
    brand: toStringSafe(product?.brand),
    gender: toStringSafe(product?.gender) || 'unisex',
    description: toStringSafe(product?.description),
    video: toStringSafe(product?.video),
    tagsText: Array.isArray(product?.tags) ? product.tags.join(', ') : '',
    highlightsText: Array.isArray(product?.highlights) ? product.highlights.join('\n') : '',
    images: Array.isArray(product?.images) ? product.images : [],
    variants,
    colorImageMap: syncColorImageMapWithVariants(colorImageMap, variants),
    descriptionBlocks: Array.isArray(product?.descriptionBlocks) ? product.descriptionBlocks.map((block) => ({
      type: toStringSafe(block?.type),
      content: toStringSafe(block?.content),
      itemsText: Array.isArray(block?.items) ? block.items.join('\n') : '',
    })) : [],
    specificationValues,
    manufacturerName: toStringSafe(product?.manufacturerDetails?.name),
    manufacturerAddress: toStringSafe(product?.manufacturerDetails?.address),
    manufacturerCountryOfOrigin: toStringSafe(product?.manufacturerDetails?.countryOfOrigin),
    manufacturerImporterName: toStringSafe(product?.manufacturerDetails?.importerName),
    manufacturerPackerDetails: toStringSafe(product?.manufacturerDetails?.packerDetails),
    shippingWeight: String(product?.shippingInfo?.weight ?? ''),
    shippingLength: String(product?.shippingInfo?.length ?? ''),
    shippingBreadth: String(product?.shippingInfo?.breadth ?? ''),
    shippingHeight: String(product?.shippingInfo?.height ?? ''),
    isCODAvailable: Boolean(product?.isCODAvailable ?? true),
    isPack: Boolean(product?.packInfo?.isPack ?? false),
    packOf: String(product?.packInfo?.packOf ?? 1),
    returnable: Boolean(product?.returnPolicy?.returnable ?? true),
    returnWindow: String(product?.returnPolicy?.returnWindow ?? 7),
  }
}

const compactNullableObject = (entries) => {
  const result = {}
  Object.entries(entries).forEach(([key, value]) => {
    const text = toStringSafe(value)
    if (text) result[key] = text
  })
  return Object.keys(result).length ? result : undefined
}

const buildDescriptionBlocksPayload = (blocks = []) => {
  return blocks
    .map((block) => {
      const type = toStringSafe(block?.type)
      if (!type) return null

      if (type === 'bullets') {
        const items = parseListText(block?.itemsText)
        return items.length ? { type, items } : null
      }

      const content = toStringSafe(block?.content)
      return content ? { type, content } : null
    })
    .filter(Boolean)
}

export const buildProductPayload = (form) => {
  const categoryId = toStringSafe(form?.subCategoryId) || toStringSafe(form?.rootCategoryId)

  const variants = (form?.variants || []).reduce((accumulator, variant) => {
    const colorName = toStringSafe(variant?.colorName)
    const colorCode = toStringSafe(variant?.colorCode)
    const baseColor = toStringSafe(variant?.baseColor)

    if (!colorName || !colorCode || !baseColor) {
      return accumulator
    }

    const selectedSizes = Array.isArray(variant?.selectedSizes)
      ? variant.selectedSizes.map((item) => toStringSafe(item)).filter(Boolean)
      : []

    const sizes = selectedSizes.length
      ? Array.from(new Set(selectedSizes))
      : [toStringSafe(variant?.size)].filter(Boolean)

    sizes.forEach((size) => {
      accumulator.push({
        colorName,
        colorCode,
        baseColor,
        size,
        price: toNumberSafe(variant?.price, 0),
        stock: Math.max(0, Math.round(toNumberSafe(variant?.stock, 0))),
        discount: Math.max(0, Math.min(100, toNumberSafe(variant?.discount, 0))),
        sku: toStringSafe(variant?.sku) || null,
        minOrderQty: Math.max(1, Math.round(toNumberSafe(variant?.minOrderQty, 1))),
      })
    })

    return accumulator
  }, [])

  const colorImages = Object.entries(form?.colorImageMap || {})
    .map(([colorName, entry]) => ({
      colorName,
      usePrimary: Boolean(entry?.usePrimary ?? true),
      images: Array.isArray(entry?.images) ? entry.images.slice(0, 3) : [],
    }))
    .filter((entry) => entry.colorName && (!entry.usePrimary || entry.images.length > 0))

  const specifications = Object.entries(form?.specificationValues || {})
    .map(([key, value]) => ({ key: key.toLowerCase(), value: toStringSafe(value) }))
    .filter((item) => item.key && item.value)

  const payload = {
    categoryId,
    name: toStringSafe(form?.name),
    brand: toStringSafe(form?.brand),
    gender: toStringSafe(form?.gender).toLowerCase(),
    description: toStringSafe(form?.description),
    images: Array.isArray(form?.images) ? form.images.slice(0, 5) : [],
    colorImages,
    video: toStringSafe(form?.video) || null,
    variants,
    descriptionBlocks: buildDescriptionBlocksPayload(form?.descriptionBlocks),
    specifications,
    tags: parseListText(form?.tagsText),
    highlights: parseListText(form?.highlightsText).slice(0, 5),
    manufacturerDetails: compactNullableObject({
      name: form?.manufacturerName,
      address: form?.manufacturerAddress,
      countryOfOrigin: form?.manufacturerCountryOfOrigin,
      importerName: form?.manufacturerImporterName,
      packerDetails: form?.manufacturerPackerDetails,
    }),
    shippingInfo: compactNullableObject({
      weight: form?.shippingWeight,
      length: form?.shippingLength,
      breadth: form?.shippingBreadth,
      height: form?.shippingHeight,
    }),
    isCODAvailable: Boolean(form?.isCODAvailable),
    packInfo: {
      isPack: Boolean(form?.isPack),
      packOf: Math.max(1, Math.round(toNumberSafe(form?.packOf, 1))),
    },
    returnPolicy: {
      returnable: Boolean(form?.returnable),
      returnWindow: Math.max(0, Math.round(toNumberSafe(form?.returnWindow, 7))),
    },
  }

  if (!payload.manufacturerDetails) delete payload.manufacturerDetails

  if (payload.shippingInfo) {
    payload.shippingInfo = {
      weight: payload.shippingInfo.weight !== undefined ? Number(payload.shippingInfo.weight) : undefined,
      length: payload.shippingInfo.length !== undefined ? Number(payload.shippingInfo.length) : undefined,
      breadth: payload.shippingInfo.breadth !== undefined ? Number(payload.shippingInfo.breadth) : undefined,
      height: payload.shippingInfo.height !== undefined ? Number(payload.shippingInfo.height) : undefined,
    }

    Object.keys(payload.shippingInfo).forEach((key) => {
      if (!Number.isFinite(payload.shippingInfo[key])) {
        delete payload.shippingInfo[key]
      }
    })

    if (!Object.keys(payload.shippingInfo).length) delete payload.shippingInfo
  }

  return payload
}

export const validateProductForm = (form, mode = 'create') => {
  const errors = {}

  const categoryId = toStringSafe(form?.subCategoryId) || toStringSafe(form?.rootCategoryId)
  if (!categoryId) errors.categoryId = 'Select at least one category.'

  if (!toStringSafe(form?.name)) errors.name = 'Product name is required.'
  if (!toStringSafe(form?.brand)) errors.brand = 'Brand is required.'
  if (!toStringSafe(form?.gender)) errors.gender = 'Gender is required.'
  if (!toStringSafe(form?.description)) errors.description = 'Description is required.'

  const images = Array.isArray(form?.images) ? form.images : []
  if (!images.length) errors.images = 'At least one primary image is required.'

  const variants = Array.isArray(form?.variants) ? form.variants : []
  if (!variants.length) {
    errors.variants = 'At least one variant is required.'
  } else {
    const invalidVariant = variants.find((variant) => {
      const selectedSizes = Array.isArray(variant?.selectedSizes)
        ? variant.selectedSizes.map((item) => toStringSafe(item)).filter(Boolean)
        : []
      const hasSizeSelection = selectedSizes.length > 0 || Boolean(toStringSafe(variant?.size))

      const hasMissing = !toStringSafe(variant?.colorName)
        || !toStringSafe(variant?.colorCode)
        || !toStringSafe(variant?.baseColor)
        || !hasSizeSelection
      if (hasMissing) return true

      const basePrice = toNumberSafe(variant?.price, -1)
      const stock = toNumberSafe(variant?.stock, -1)
      if (basePrice < 0 || stock < 0) return true

      const sellingValue = toStringSafe(variant?.sellingPrice)
      if (sellingValue) {
        const selling = toNumberSafe(sellingValue, -1)
        if (selling < 0 || selling > basePrice) return true
      }

      return false
    })

    if (invalidVariant) {
      errors.variants = 'Each variant must have color, size selection, base price, stock, and valid selling values.'
    }
  }

  const uniquePairs = new Set()
  for (const variant of variants) {
    const selectedSizes = Array.isArray(variant?.selectedSizes)
      ? variant.selectedSizes.map((item) => toStringSafe(item)).filter(Boolean)
      : []

    const sizes = selectedSizes.length
      ? Array.from(new Set(selectedSizes))
      : [toStringSafe(variant?.size)].filter(Boolean)

    for (const size of sizes) {
      const key = `${toStringSafe(variant?.colorName).toLowerCase()}__${size.toLowerCase()}`
      if (key === '__') continue
      if (uniquePairs.has(key)) {
        errors.variants = 'Duplicate color and size combination found.'
        break
      }
      uniquePairs.add(key)
    }

    if (errors.variants) break
  }

  if (mode === 'edit' && Object.keys(errors).length === 0) {
    return errors
  }

  return errors
}

export const createEmptyDescriptionBlock = () => ({
  type: 'paragraph',
  content: '',
  itemsText: '',
})
