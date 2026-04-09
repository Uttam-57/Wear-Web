import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuthStore from '@/features/auth/authSlice'
import useSellerProfile from '@/features/user/hooks/useSellerProfile'
import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || null

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const toArray = (value) => (Array.isArray(value) ? value : [])

const request = async (url, params = {}) => {
  const response = await queryGet(
    url,
    { params },
    { ttlMs: 5 * 60 * 1000 }
  )
  return unwrapData(response)
}

const safeRequest = (promise, fallback = null) => promise.catch(() => fallback)

export default function useSellerShellData() {
  const user = useAuthStore((state) => state.user)
  const profileState = useSellerProfile()
  const { sellerProfile, refresh: refreshSellerProfile } = profileState

  const [shellData, setShellData] = useState({
    unreadCount: 0,
    notifications: [],
    allOrdersCount: 0,
    returnsCount: 0,
  })

  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const [notifications, unreadCount, allOrders, returnsCount] = await Promise.all([
        safeRequest(request(API_ENDPOINTS.NOTIFICATIONS, { unread: true, limit: 5 })),
        safeRequest(request(API_ENDPOINTS.NOTIFICATIONS_UNREAD)),
        safeRequest(request(API_ENDPOINTS.SELLER_ORDERS, { count: true })),
        safeRequest(request('/seller/orders/returns', { count: true })),
      ])

      const notificationItems = toArray(
        notifications?.notifications || notifications?.items || notifications
      ).slice(0, 5)

      setShellData({
        unreadCount: toNumber(unreadCount?.count ?? unreadCount?.unreadCount, notificationItems.filter((item) => !item?.isRead).length),
        notifications: notificationItems,
        allOrdersCount: toNumber(allOrders?.count ?? allOrders?.total),
        returnsCount: toNumber(returnsCount?.count ?? returnsCount?.total),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSellerProfile().catch(() => {})
    refresh().catch(() => {})
  }, [refreshSellerProfile, refresh])

  const storeName = useMemo(() => {
    if (sellerProfile?.companyName) return sellerProfile.companyName
    if (user?.storeName) return user.storeName
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    return fullName || 'Seller Store'
  }, [sellerProfile, user])

  const sellerEmail = user?.email || sellerProfile?.contactEmail || 'seller@wearweb.local'
  const sellerId = user?._id || sellerProfile?.sellerId || sellerProfile?.userId || ''

  return {
    storeName,
    sellerEmail,
    sellerId,
    status: sellerProfile?.status || user?.status,
    shellData,
    loading,
    refresh,
  }
}
