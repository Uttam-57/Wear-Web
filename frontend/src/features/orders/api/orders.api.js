import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet, queryPost, queryPut } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || {}

const toListResult = (response) => {
  const data = unwrapData(response)
  return {
    orders: data?.orders || [],
    pagination: data?.pagination || null,
  }
}

export const fetchCustomerOrders = async (params = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.ORDERS,
    { params },
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  return toListResult(response)
}

export const fetchCustomerOrderById = async (orderId) => {
  const response = await queryGet(
    `${API_ENDPOINTS.ORDERS}/${orderId}`,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const cancelCustomerOrder = async ({ orderId, reason }) => {
  const response = await queryPut(
    `${API_ENDPOINTS.ORDERS}/${orderId}/cancel`,
    { reason },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const requestCustomerOrderReturn = async ({ orderId, reason }) => {
  const response = await queryPost(
    `${API_ENDPOINTS.ORDERS}/${orderId}/return`,
    { reason },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const fetchCustomerReturnStatus = async (orderId) => {
  const response = await queryGet(
    `${API_ENDPOINTS.ORDERS}/${orderId}/return`,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.returnRequest || null
}

export const submitOrderProductReview = async ({
  productId,
  orderId,
  rating,
  title,
  body,
}) => {
  const payload = {
    orderId,
    rating,
    title: title?.trim() || undefined,
    body: body?.trim() || undefined,
  }

  const response = await queryPost(
    `${API_ENDPOINTS.PRODUCTS}/${productId}/reviews`,
    payload
  )

  const data = unwrapData(response)
  return data?.review || data || null
}

export const downloadOrderInvoiceBlob = async (orderId) => {
  const response = await queryGet(
    `${API_ENDPOINTS.ORDERS}/${orderId}/invoice`,
    { responseType: 'blob' },
    { cache: false, dedupe: false, force: true }
  )

  return response?.data
}

export const fetchAdminOrders = async (params = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.ADMIN_ORDERS,
    { params },
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  const data = unwrapData(response)
  return {
    orders: Array.isArray(data?.orders) ? data.orders : [],
    pagination: data?.pagination || null,
  }
}

export const updateAdminOrderStatus = async ({ orderId, status }) => {
  const response = await queryPut(
    `${API_ENDPOINTS.ADMIN_ORDERS}/${orderId}/status`,
    { status },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const fetchAdminReturns = async () => {
  const response = await queryGet(
    API_ENDPOINTS.ADMIN_RETURNS,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  const data = unwrapData(response)
  return Array.isArray(data?.orders) ? data.orders : []
}

export const requestAdminReturnPickupOtp = async (orderId) => {
  const response = await queryPost(
    `${API_ENDPOINTS.ADMIN_RETURNS}/${orderId}/request-pickup-otp`,
    {},
    {},
    { invalidateTags: ['orders'] }
  )

  return unwrapData(response)
}

export const resolveAdminReturn = async ({ orderId, status, adminNote, otp }) => {
  const payload = {
    status,
    adminNote: adminNote || undefined,
    otp: otp || undefined,
  }

  const response = await queryPut(
    `${API_ENDPOINTS.ADMIN_RETURNS}/${orderId}`,
    payload,
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}
