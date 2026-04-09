import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryDelete, queryGet, queryPut } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || {}

const formatPublicOrderId = (id) => {
  const raw = String(id || '').trim()
  if (!raw) return 'ORD-000000'
  return `ORD-${raw.slice(-6).toUpperCase()}`
}

const normalizeNotificationMessage = (message) => {
  const text = String(message || '')
  if (!text) return text

  return text.replace(/order\s*#\s*([a-f0-9]{24})/gi, (_match, orderId) => {
    return `Order #${formatPublicOrderId(orderId)}`
  })
}

const normalizeNotification = (notification) => ({
  ...notification,
  message: normalizeNotificationMessage(notification?.message),
})

export const listNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.NOTIFICATIONS,
    { params: { page, limit } },
    { ttlMs: 5 * 60 * 1000, tags: ['notifications'] }
  )

  const data = unwrapData(response)
  return {
    notifications: Array.isArray(data?.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
    pagination: data?.pagination || { page, limit, total: 0, totalPages: 1 },
  }
}

export const getUnreadNotificationCount = async () => {
  const response = await queryGet(
    API_ENDPOINTS.NOTIFICATIONS_UNREAD,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['notifications'] }
  )

  const data = unwrapData(response)
  return Number(data?.unreadCount || data?.count || 0)
}

export const markAllNotificationsRead = async () => {
  const response = await queryPut(
    `${API_ENDPOINTS.NOTIFICATIONS}/read-all`,
    {},
    {},
    { invalidateTags: ['notifications'] }
  )

  return unwrapData(response)
}

export const clearAllNotifications = async () => {
  const response = await queryDelete(
    API_ENDPOINTS.NOTIFICATIONS,
    {},
    { invalidateTags: ['notifications'] }
  )

  return unwrapData(response)
}
