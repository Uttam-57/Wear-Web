import { queryGet } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data

export const getAdminAnalytics = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.ADMIN_ANALYTICS,
    { params },
    { ttlMs: 5 * 60 * 1000, tags: ['analytics:admin'] }
  ).then(unwrapData)
}

export const getSellerAnalytics = (params = {}) => {
  return queryGet(
    API_ENDPOINTS.SELLER_ANALYTICS,
    { params },
    { ttlMs: 5 * 60 * 1000, tags: ['analytics:seller'] }
  ).then(unwrapData)
}
