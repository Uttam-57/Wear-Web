import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet, queryPost, queryPut } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || {}

export const fetchSellerOrders = async () => {
  const response = await queryGet(
    API_ENDPOINTS.SELLER_ORDERS,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.orders || []
}

export const updateSellerOrderStatus = async ({ orderId, status }) => {
  const response = await queryPut(
    `${API_ENDPOINTS.SELLER_ORDERS}/${orderId}/status`,
    { status },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const rejectSellerOrder = async ({ orderId, reason }) => {
  const response = await queryPut(
    `${API_ENDPOINTS.SELLER_ORDERS}/${orderId}/reject`,
    { reason },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const confirmSellerOrderDelivery = async ({ orderId, otp }) => {
  const response = await queryPost(
    `${API_ENDPOINTS.SELLER_ORDERS}/${orderId}/confirm-delivery`,
    { otp },
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}

export const requestSellerReturnPickupOtp = async ({ orderId }) => {
  const response = await queryPost(
    `${API_ENDPOINTS.SELLER_ORDERS}/${orderId}/returns/request-pickup-otp`,
    {},
    {},
    { invalidateTags: ['orders'] }
  )

  return unwrapData(response)
}

export const updateSellerReturnStatus = async ({ orderId, status, otp }) => {
  const payload = { status }
  if (otp) payload.otp = otp

  const response = await queryPut(
    `${API_ENDPOINTS.SELLER_ORDERS}/${orderId}/returns/status`,
    payload,
    {},
    { invalidateTags: ['orders'] }
  )

  const data = unwrapData(response)
  return data?.order || data || null
}
