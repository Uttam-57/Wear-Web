import { queryDelete, queryGet, queryPost, queryPut } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data

const authHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined)

export const getProfile = (token) => {
  return queryGet(
    API_ENDPOINTS.PROFILE,
    { headers: authHeader(token) },
    { ttlMs: 15000, tags: ['user:profile'] }
  ).then((res) => unwrapData(res).user || unwrapData(res))
}

export const updateProfile = (payload) => {
  return queryPut(
    API_ENDPOINTS.PROFILE,
    payload,
    {},
    { invalidateTags: ['user:profile'] }
  ).then((res) => unwrapData(res).user || unwrapData(res))
}

export const uploadProfilePhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return queryPost(
    API_ENDPOINTS.PROFILE_PHOTO,
    formData,
    {},
    { invalidateTags: ['user:profile'] }
  ).then((res) => unwrapData(res).user || unwrapData(res))
}

export const changePassword = (payload) => {
  return queryPut(API_ENDPOINTS.CHANGE_PASSWORD, payload).then(unwrapData)
}

export const deleteAccount = (payload) => {
  return queryDelete(
    API_ENDPOINTS.ACCOUNT_DELETE,
    { data: payload },
    { invalidateAll: true }
  ).then(unwrapData)
}

export const listAddresses = () => {
  return queryGet(API_ENDPOINTS.ADDRESSES, {}, { ttlMs: 20000, tags: ['user:addresses'] })
    .then((res) => unwrapData(res).addresses || unwrapData(res))
}

export const createAddress = (payload) => {
  return queryPost(
    API_ENDPOINTS.ADDRESSES,
    payload,
    {},
    { invalidateTags: ['user:addresses'] }
  ).then((res) => unwrapData(res).address || unwrapData(res))
}

export const updateAddress = (id, payload) => {
  return queryPut(
    `${API_ENDPOINTS.ADDRESSES}/${id}`,
    payload,
    {},
    { invalidateTags: ['user:addresses'] }
  ).then((res) => unwrapData(res).address || unwrapData(res))
}

export const deleteAddress = (id) => {
  return queryDelete(`${API_ENDPOINTS.ADDRESSES}/${id}`, {}, { invalidateTags: ['user:addresses'] }).then(unwrapData)
}

export const setDefaultAddress = (id) => {
  return queryPut(
    `${API_ENDPOINTS.ADDRESSES}/${id}/default`,
    {},
    {},
    { invalidateTags: ['user:addresses'] }
  ).then(unwrapData)
}

export const lookupAddressByPincode = (pincode) => {
  return queryGet(
    `${API_ENDPOINTS.ADDRESS_LOOKUP_PINCODE}/${encodeURIComponent(pincode)}`,
    {},
    { ttlMs: 300000 }
  ).then((res) => unwrapData(res).lookup || unwrapData(res))
}

export const reverseGeocodeAddress = ({ lat, lon }) => {
  return queryGet(
    API_ENDPOINTS.ADDRESS_LOOKUP_REVERSE_GEOCODE,
    { params: { lat, lon } },
    { ttlMs: 120000 }
  ).then((res) => unwrapData(res).lookup || unwrapData(res))
}

export const setupSellerProfile = (payload) => {
  return queryPost(
    API_ENDPOINTS.SELLER_PROFILE_SETUP,
    payload,
    {},
    { invalidateTags: ['seller:profile'] }
  ).then((res) => unwrapData(res).profile || unwrapData(res))
}

export const getSellerProfile = () => {
  return queryGet(API_ENDPOINTS.SELLER_PROFILE, {}, { ttlMs: 20000, tags: ['seller:profile'] })
    .then((res) => unwrapData(res).profile || unwrapData(res))
}

export const updateSellerProfile = (payload) => {
  return queryPut(
    API_ENDPOINTS.SELLER_PROFILE,
    payload,
    {},
    { invalidateTags: ['seller:profile'] }
  ).then((res) => unwrapData(res).profile || unwrapData(res))
}

export const listAdminUsers = (params = {}) => {
  return queryGet(API_ENDPOINTS.ADMIN_USERS, { params }, { ttlMs: 10000, tags: ['admin:users'] })
    .then((res) => {
      const data = unwrapData(res)
      return {
        users: Array.isArray(data?.users) ? data.users : [],
        pagination: data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      }
    })
}

export const getAdminUserDetail = (userId) => {
  return queryGet(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`).then((res) => unwrapData(res).user || unwrapData(res))
}

export const listPendingSellers = () => {
  return queryGet(API_ENDPOINTS.ADMIN_SELLERS_PENDING, {}, { ttlMs: 10000, tags: ['admin:sellers:pending'] })
    .then((res) => unwrapData(res).sellers || unwrapData(res))
}

export const approveSeller = (sellerId) => {
  return queryPut(
    `/users/admin/sellers/${sellerId}/approve`,
    {},
    {},
    { invalidateTags: ['admin:sellers:pending', 'admin:users'] }
  ).then(unwrapData)
}

export const rejectSeller = (sellerId, reason) => {
  return queryPut(
    `/users/admin/sellers/${sellerId}/reject`,
    { reason },
    {},
    { invalidateTags: ['admin:sellers:pending', 'admin:users'] }
  ).then(unwrapData)
}

export const blockUser = (userId, reason, message) => {
  return queryPut(
    `/users/admin/users/${userId}/block`,
    { reason, message: message || undefined },
    {},
    { invalidateTags: ['admin:users'] }
  ).then(unwrapData)
}

export const unblockUser = (userId) => {
  return queryPut(
    `/users/admin/users/${userId}/unblock`,
    {},
    {},
    { invalidateTags: ['admin:users'] }
  ).then(unwrapData)
}

export const adminDeleteUser = (userId, reason) => {
  return queryPut(
    `/users/admin/users/${userId}/delete`,
    { reason },
    {},
    { invalidateTags: ['admin:users'] }
  ).then(unwrapData)
}
