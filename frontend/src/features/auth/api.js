import { invalidateAllQueryCache, queryGet, queryPost } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data

export const register = (payload) => {
  const request = {
    firstName: payload.firstName?.trim(),
    lastName: payload.lastName?.trim(),
    email: payload.email?.trim(),
    password: payload.password,
    role: payload.role,
  }

  if (payload.middleName?.trim()) request.middleName = payload.middleName.trim()
  if (payload.phone?.trim()) request.phone = payload.phone.trim()

  return queryPost(API_ENDPOINTS.REGISTER, request).then((res) => {
    invalidateAllQueryCache()
    return unwrapData(res)
  })
}

export const login = ({ email, password }) => {
  return queryPost(API_ENDPOINTS.LOGIN, { email: email?.trim(), password }).then((res) => {
    invalidateAllQueryCache()
    return unwrapData(res)
  })
}

export const logout = (allDevices = false) => {
  return queryPost(API_ENDPOINTS.LOGOUT, { allDevices }).then((res) => {
    invalidateAllQueryCache()
    return unwrapData(res)
  })
}

export const getActiveSessions = () => {
  return queryGet(API_ENDPOINTS.AUTH_SESSIONS, {}, { cache: false }).then(unwrapData)
}

export const refreshToken = () => {
  return queryPost(API_ENDPOINTS.REFRESH_TOKEN, {}).then(unwrapData)
}

export const forgotPassword = (email) => {
  return queryPost(API_ENDPOINTS.FORGOT_PASSWORD, { email: email?.trim() }).then(unwrapData)
}

export const resetPassword = ({ token, newPassword }) => {
  return queryPost(API_ENDPOINTS.RESET_PASSWORD, { token, password: newPassword }).then(unwrapData)
}
