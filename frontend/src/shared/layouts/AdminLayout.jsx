import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Drawer } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import useAuthStore from '@/features/auth/authSlice'
import { logout as logoutApi } from '@/features/auth/api'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
} from '@/features/notifications/api/notifications.api'
import { cn } from '@/shared/utils/cn'

const adminNavLinks = [
  { id: 'dashboard', label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD },
  { id: 'users', label: 'Users and Sellers', path: ROUTES.ADMIN_USERS },
  { id: 'categories', label: 'Categories', path: ROUTES.ADMIN_CATEGORIES },
  { id: 'catalog', label: 'Catalog', path: ROUTES.ADMIN_PRODUCTS },
  { id: 'orders', label: 'Orders and Returns', path: ROUTES.ADMIN_ORDERS },
  { id: 'payouts', label: 'Payouts', path: ROUTES.ADMIN_PAYOUTS },
]

function AdminNavigation({ onNavigate }) {
  return (
    <nav className="space-y-sm">
      {adminNavLinks.map((link) => (
        <NavLink
          key={link.id}
          to={link.path}
          onClick={onNavigate}
          className={({ isActive }) => cn(
            'block rounded-md border-l-4 px-sm py-2 text-sm font-semibold transition-colors',
            isActive
              ? 'border-l-primary bg-primary text-white'
              : 'border-l-transparent text-text-secondary hover:bg-surface-3 hover:text-text-primary'
          )}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}

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

export default function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  const loadNotifications = async () => {
    setNotificationsLoading(true)

    try {
      const [notificationResult, count] = await Promise.all([
        listNotifications({ page: 1, limit: 3 }),
        getUnreadNotificationCount(),
      ])

      setNotifications(Array.isArray(notificationResult?.notifications) ? notificationResult.notifications : [])
      setUnreadCount(Number(count) || 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

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

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications
    setShowNotifications(nextState)
    setShowProfile(false)

    if (!nextState) return
    await loadNotifications()
  }

  const handleMarkAllNotificationsRead = async () => {
    if (unreadCount <= 0) return

    try {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })))
    } catch {
      // Ignore popup action failures silently.
    }
  }

  const handleLogout = async () => {
    try {
      await logoutApi(false)
    } catch {
      // Keep local logout even if API request fails.
    }
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1520px] items-center gap-sm px-md py-sm md:px-lg">
          <button
            type="button"
            className="rounded-md border border-border px-sm py-2 text-sm text-text-primary lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open admin navigation"
          >
            Menu
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl tracking-tight text-text-primary">WearWeb</p>
            <p className="truncate text-xs text-text-muted">Platform Administration</p>
          </div>

          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => handleToggleNotifications()}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              aria-label="Admin notifications"
              title="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount}
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
                    disabled={!unreadCount}
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
                  ) : notifications.length ? notifications.map((notification) => (
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-primary hover:bg-surface-3"
              aria-label="Admin profile menu"
              title="Profile"
            >
              <UserIcon />
            </button>

            {showProfile ? (
              <div className="absolute right-0 z-50 mt-2 w-[240px] rounded-lg border border-border bg-surface-elevated p-sm shadow-card">
                <p className="text-sm font-semibold text-text-primary">{user?.firstName || 'Admin'} {user?.lastName || ''}</p>
                <p className="text-xs text-text-muted">{user?.email || 'admin@wearweb.local'}</p>
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  <Link
                    to={ROUTES.ADMIN_PROFILE}
                    onClick={() => setShowProfile(false)}
                    className="block rounded-md px-sm py-2 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
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

      <div className="mx-auto flex w-full max-w-[1520px] gap-md px-md py-md md:px-lg">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-[78px] max-h-[calc(100vh-92px)] overflow-y-auto rounded-xl border border-border bg-surface-elevated p-sm shadow-soft">
            <AdminNavigation />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-xl">
          <Outlet />
        </main>
      </div>

      <Drawer
        open={mobileSidebarOpen}
        title="Admin Menu"
        onClose={() => setMobileSidebarOpen(false)}
        side="left"
      >
        <AdminNavigation onNavigate={() => setMobileSidebarOpen(false)} />
      </Drawer>
    </div>
  )
}
