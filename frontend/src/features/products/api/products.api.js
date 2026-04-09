import { queryDelete, queryGet, queryPost, queryPut } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data

const normalizeProductListPayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      products: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || 1,
      pagination: {
        total: payload.length,
        page: 1,
        limit: payload.length || 1,
        totalPages: 1,
      },
    }
  }

  const products = payload?.products || payload?.items || []
  const page = Number(payload?.page || payload?.pagination?.page || 1)
  const limit = Number(payload?.limit || payload?.pagination?.limit || products.length || 1)
  const total = Number(payload?.total || payload?.pagination?.total || products.length)
  const totalPages = Number(payload?.pagination?.totalPages || Math.max(1, Math.ceil(total / limit)))

  return {
    ...payload,
    products,
    total,
    page,
    limit,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const normalizeSortValue = (sortValue) => {
  const sortMap = {
    relevance: 'arrival',
    price: 'price_asc',
    '-price': 'price_desc',
    '-createdAt': 'newest',
    '-discount': 'price_desc',
    '-rating': 'rating',
  }

  return sortMap[sortValue] || sortValue
}

const parseFirstValue = (value) => {
  if (!value) return ''
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)[0] || ''
}

const cleanQueryParams = (params = {}) => {
  const next = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim() === '') return
    next[key] = value
  })

  return next
}

const toLegacyBrowseParams = (params = {}) => {
  const specs = {}

  Object.entries(params).forEach(([key, value]) => {
    const specMatch = /^specs\[(.+)\]$/.exec(key)
    if (specMatch) {
      specs[specMatch[1]] = parseFirstValue(value)
    }
  })

  const legacy = {
    page: params.page,
    limit: params.limit,
    q: params.search || params.q,
    categoryId: params.category || params.categoryId,
    gender: parseFirstValue(params.gender)?.toLowerCase(),
    baseColor: parseFirstValue(params.baseColors || params.baseColor),
    size: parseFirstValue(params.sizes || params.size),
    brand: parseFirstValue(params.brands || params.brand),
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sortBy: normalizeSortValue(params.sort || params.sortBy),
  }

  if (params.discount) {
    const discountNumber = Number(String(params.discount).replace(/[^0-9]/g, ''))
    if (Number.isFinite(discountNumber) && discountNumber > 0) {
      legacy.minPrice = legacy.minPrice || params.minPrice
    }
  }

  return cleanQueryParams({
    ...legacy,
    ...specs,
  })
}

const requestProductList = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.PRODUCTS,
    { params },
    { ttlMs: 15000, tags: ['products:public'] }
  )
    .then((res) => normalizeProductListPayload(unwrapData(res)))
}

export const getProducts = (params = {}) => {
  const legacyParams = toLegacyBrowseParams(params)

  if (legacyParams.q) {
    return searchProducts({
      q: legacyParams.q,
      page: legacyParams.page,
      limit: legacyParams.limit,
    })
  }

  const relaxedParams = cleanQueryParams({
    page: legacyParams.page,
    limit: legacyParams.limit,
    q: legacyParams.q,
    categoryId: legacyParams.categoryId,
    sortBy: legacyParams.sortBy,
    minPrice: legacyParams.minPrice,
    maxPrice: legacyParams.maxPrice,
  })

  return requestProductList(legacyParams).then((result) => {
    const products = result?.products || []
    if (products.length > 0) return result

    const hadStrictFilters = Boolean(
      legacyParams.gender ||
      legacyParams.baseColor ||
      legacyParams.size ||
      legacyParams.brand ||
      Object.keys(legacyParams).some((key) => !['page', 'limit', 'q', 'categoryId', 'sortBy', 'minPrice', 'maxPrice'].includes(key))
    )

    if (!hadStrictFilters) return result

    return requestProductList(relaxedParams).catch(() => result)
  })
}

export const searchProducts = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.PRODUCT_SEARCH,
    { params },
    { ttlMs: 15000, tags: ['products:public'] }
  )
    .then((res) => normalizeProductListPayload(unwrapData(res)))
}

export const suggestProducts = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.PRODUCT_SUGGESTIONS,
    { params },
    { ttlMs: 8000, tags: ['products:public'] }
  ).then((res) => {
    const payload = unwrapData(res) || {}
    return {
      suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
      total: Number(payload.total || 0),
    }
  })
}

export const getProductById = (id) => {
  return queryGet(
    `${API_ENDPOINTS.PRODUCT_BY_ID}/${id}`,
    {},
    { ttlMs: 30000, tags: ['products:public', `product:${id}`] }
  ).then((res) => unwrapData(res).product || unwrapData(res))
}

export const getSellerProductById = (id) => {
  return queryGet(
    `${API_ENDPOINTS.SELLER_PRODUCT_BY_ID}/${id}`,
    {},
    { ttlMs: 15000, tags: ['products:seller', `seller-product:${id}`] }
  ).then((res) => unwrapData(res).product || unwrapData(res))
}

const normalizeReviewListPayload = (payload) => {
  return {
    reviews: payload?.reviews || [],
    pagination: payload?.pagination || {
      total: Number(payload?.reviews?.length || 0),
      page: 1,
      limit: Number(payload?.reviews?.length || 0),
      totalPages: 1,
    },
  }
}

export const getProductReviews = (productId, params = {}) => {
  return queryGet(
    `${API_ENDPOINTS.REVIEWS}/${productId}/reviews`,
    { params },
    { ttlMs: 15000, tags: [`reviews:${productId}`] }
  )
    .then((res) => normalizeReviewListPayload(unwrapData(res)))
}

export const createProductReview = (productId, payload) => {
  return queryPost(
    `${API_ENDPOINTS.REVIEWS}/${productId}/reviews`,
    payload,
    {},
    { invalidateTags: [`reviews:${productId}`, `product:${productId}`, 'products:public'] }
  )
    .then((res) => unwrapData(res).review || unwrapData(res))
}

export const uploadSellerProductMedia = (files) => {
  const formData = new FormData()
  Array.from(files || []).forEach((file) => {
    formData.append('files', file)
  })
  return queryPost(API_ENDPOINTS.SELLER_MEDIA_UPLOAD, formData).then((res) => {
    const payload = unwrapData(res)
    if (Array.isArray(payload?.files)) return payload.files
    if (Array.isArray(payload?.images)) return payload.images
    if (Array.isArray(payload)) return payload
    return []
  })
}

export const createSellerProduct = (payload) => {
  return queryPost(
    API_ENDPOINTS.SELLER_PRODUCTS,
    payload,
    {},
    { invalidateTags: ['products:seller', 'products:public', 'products:admin'] }
  ).then((res) => unwrapData(res).product || unwrapData(res))
}

export const listSellerProducts = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.SELLER_PRODUCTS,
    { params },
    { ttlMs: 12000, tags: ['products:seller'] }
  ).then((res) => unwrapData(res).products || unwrapData(res))
}

export const updateSellerProduct = (id, payload) => {
  return queryPut(
    `${API_ENDPOINTS.SELLER_PRODUCTS}/${id}`,
    payload,
    {},
    { invalidateTags: ['products:seller', 'products:public', 'products:admin', `product:${id}`] }
  ).then((res) => unwrapData(res).product || unwrapData(res))
}

export const deleteSellerProduct = (id) => {
  return queryDelete(
    `${API_ENDPOINTS.SELLER_PRODUCTS}/${id}`,
    {},
    { invalidateTags: ['products:seller', 'products:public', 'products:admin', `product:${id}`] }
  ).then(unwrapData)
}

export const listAdminProducts = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.ADMIN_PRODUCTS,
    { params },
    { ttlMs: 12000, tags: ['products:admin'] }
  ).then((res) => unwrapData(res).products || unwrapData(res))
}

export const holdAdminProduct = (id, reason) => {
  return queryPut(
    `${API_ENDPOINTS.ADMIN_PRODUCTS}/${id}/hold`,
    { reason },
    {},
    { invalidateTags: ['products:admin', 'products:public', 'products:seller', `product:${id}`] }
  ).then(unwrapData)
}

export const unholdAdminProduct = (id) => {
  return queryPut(
    `${API_ENDPOINTS.ADMIN_PRODUCTS}/${id}/unhold`,
    {},
    {},
    { invalidateTags: ['products:admin', 'products:public', 'products:seller', `product:${id}`] }
  ).then(unwrapData)
}

export const holdSellerProduct = (id, reason) => {
  return queryPut(
    `${API_ENDPOINTS.SELLER_PRODUCTS}/${id}/hold`,
    { reason },
    {},
    { invalidateTags: ['products:seller', 'products:public', 'products:admin', `product:${id}`] }
  ).then(unwrapData)
}

export const unholdSellerProduct = (id) => {
  return queryPut(
    `${API_ENDPOINTS.SELLER_PRODUCTS}/${id}/unhold`,
    {},
    {},
    { invalidateTags: ['products:seller', 'products:public', 'products:admin', `product:${id}`] }
  ).then(unwrapData)
}

export const removeAdminProduct = (id) => {
  return queryDelete(
    `${API_ENDPOINTS.ADMIN_PRODUCTS}/${id}`,
    {},
    { invalidateTags: ['products:admin', 'products:public', 'products:seller', `product:${id}`] }
  ).then(unwrapData)
}
