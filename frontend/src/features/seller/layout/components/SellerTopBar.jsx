import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import useAuthStore from '@/features/auth/authSlice'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
} from '@/features/notifications/api/notifications.api'

function BellIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M15 17H5.5a1 1 0 0 1-.9-1.4A7.6 7.6 0 0 0 6 11V9.8a6 6 0 1 1 12 0V11c0 1.6.5 3.1 1.4 4.6a1 1 0 0 1-.9 1.4H15Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  )
}

const formatRelativeTime = (value) => {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const minutes = Math.round(diffMs / 60000)

  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')

  const days = Math.round(hours / 24)
  return rtf.format(days, 'day')
}

const toPreview = (message, max = 100) => {
  const text = String(message || '').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

export default function SellerTopBar({
  storeName,
  sellerEmail,
  notifications,
  unreadCount,
  onToggleMobileNav,
  onViewPublicStore,
  onLogout,
}) {
  const sellerFirstName = useAuthStore((state) => state.user?.firstName?.trim()) || 'Seller'
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sellerNotifications, setSellerNotifications] = useState(
    Array.isArray(notifications) ? notifications.slice(0, 3) : []
  )
  const [sellerUnreadCount, setSellerUnreadCount] = useState(
    Number.isFinite(Number(unreadCount))
      ? Number(unreadCount)
      : (Array.isArray(notifications) ? notifications.filter((item) => !item?.isRead).length : 0)
  )
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  const loadSellerNotifications = async () => {
    setNotificationsLoading(true)

    try {
      const [notificationsResult, unread] = await Promise.all([
        listNotifications({ page: 1, limit: 3 }),
        getUnreadNotificationCount(),
      ])

      setSellerNotifications(Array.isArray(notificationsResult?.notifications) ? notificationsResult.notifications : [])
      setSellerUnreadCount(Number(unread) || 0)
    } catch {
      setSellerNotifications([])
      setSellerUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    loadSellerNotifications().catch(() => {})
  }, [])

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications
    setShowNotifications(nextState)
    setShowProfile(false)

    if (!nextState) return
    await loadSellerNotifications()
  }

  const handleMarkAllNotificationsRead = async () => {
    if (sellerUnreadCount <= 0) return

    try {
      await markAllNotificationsRead()
      setSellerUnreadCount(0)
      setSellerNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })))
    } catch {
      // Ignore popup action failures silently.
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1520px] items-center gap-sm px-md py-sm md:px-lg">
        {onToggleMobileNav ? (
          <button
            type="button"
            className="rounded-md border border-border px-sm py-2 text-sm text-text-primary lg:hidden"
            onClick={onToggleMobileNav}
            aria-label="Open seller navigation"
          >
            Menu
          </button>
        ) : null}

        <Link
          to={ROUTES.SELLER_DASHBOARD}
          className="whitespace-nowrap font-display text-2xl tracking-tight text-text-primary"
        >
          WearWeb
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{storeName}</p>
          <p className="truncate text-xs text-text-muted">Seller Console</p>
        </div>

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => handleToggleNotifications()}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
            aria-label="Seller notifications"
            title="Notifications"
          >
            <BellIcon />
            {sellerUnreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {sellerUnreadCount}
              </span>
            ) : null}
          </button>

          {showNotifications ? (
            <div className="absolute right-0 z-[125] mt-2 w-[320px] rounded-lg border border-border bg-surface-elevated p-sm shadow-card">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <p className="text-sm font-semibold text-text-primary">Notifications</p>
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  disabled={!sellerUnreadCount}
                  className="text-xs font-medium text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark all read
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {notificationsLoading ? (
                  <p className="rounded-md border border-dashed border-border bg-surface-tertiary p-sm text-sm text-text-secondary">
                    Loading notifications...
                  </p>
                ) : sellerNotifications.length ? sellerNotifications.map((notification) => (
                  <div key={notification?._id || notification?.createdAt} className="rounded-md border border-border bg-surface-3 p-sm">
                    <p className="text-sm text-text-primary">{toPreview(notification?.message || 'You have a new update.')}</p>
                    <p className="mt-1 text-xs text-text-secondary">{formatRelativeTime(notification?.createdAt || notification?.updatedAt)}</p>
                  </div>
                )) : (
                  <p className="rounded-md border border-dashed border-border bg-surface-3 p-sm text-sm text-text-secondary">
                    You have no notifications right now.
                  </p>
                )}
              </div>

              <Link
                to={ROUTES.SELLER_NOTIFICATIONS}
                onClick={() => setShowNotifications(false)}
                className="mt-2 inline-flex text-sm font-medium text-primary hover:text-primary-hover"
              >
                View All Notifications
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfile((state) => !state)
              setShowNotifications(false)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-sm text-text-primary hover:bg-surface-3"
            aria-label="Seller profile menu"
            title="Profile"
          >
            <UserIcon />
            <span className="max-w-[120px] truncate text-sm font-medium">{sellerFirstName}</span>
          </button>

          {showProfile ? (
            <div className="absolute right-0 z-50 mt-2 w-[260px] rounded-lg border border-border bg-surface-elevated p-sm shadow-card">
              <p className="text-sm font-semibold text-text-primary">{storeName}</p>
              <p className="text-xs text-text-muted">{sellerEmail}</p>
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                <button
                  type="button"
                  className="block w-full rounded-md px-sm py-2 text-left text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                  onClick={onViewPublicStore}
                >
                  View My Public Store
                </button>
                <Link
                  to={ROUTES.SELLER_DASHBOARD}
                  onClick={() => setShowProfile(false)}
                  className="block rounded-md px-sm py-2 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  to={ROUTES.SELLER_NOTIFICATIONS}
                  onClick={() => setShowProfile(false)}
                  className="block rounded-md px-sm py-2 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                >
                  Notifications
                </Link>
                <Link
                  to={ROUTES.SELLER_PROFILE}
                  onClick={() => setShowProfile(false)}
                  className="block rounded-md px-sm py-2 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                >
                  Settings
                </Link>
                <a href="mailto:support@wearweb.com" className="block rounded-md px-sm py-2 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary">
                  Help Center
                </a>
                <button
                  type="button"
                  onClick={onLogout}
                  className="block w-full rounded-md px-sm py-2 text-left text-sm text-danger hover:bg-danger-soft"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
