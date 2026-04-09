import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/app'
import { Button } from '@/shared/ui'
import useAuthStore from '@/features/auth/authSlice'
import useCartStore from '@/features/cart/cartSlice'
import useCart from '@/features/cart/hooks/useCart'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
} from '@/features/notifications/api/notifications.api'
import { getActiveSessions, logout as logoutApi } from '@/features/auth/api'
import { suggestProducts } from '@/features/products/api/products.api'
import { BellIcon, CartIcon, HeartIcon, SearchIcon, UserIcon } from '@/shared/ui/organisms/Navbar/Navbar.icons'
import { formatRelativeTime, toPreview } from '@/shared/ui/organisms/Navbar/Navbar.utils'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuthStore()
  const itemCount = useCartStore((s) => s.itemCount)
  const { refresh: refreshCart } = useCart()
  const { refresh: refreshWishlist } = useWishlist()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [customerNotifications, setCustomerNotifications] = useState([])
  const [customerUnreadCount, setCustomerUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false)
  const [logoutDialogError, setLogoutDialogError] = useState('')
  const [sessionsData, setSessionsData] = useState({
    sessions: [],
    activeDevices: 1,
    maxDevices: 3,
  })
  const notificationsRef = useRef(null)
  const profileMenuRef = useRef(null)

  const profileName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account'
  const profileFirstName = user?.firstName?.trim() || 'Profile'
  const isCustomer = isLoggedIn && user?.role === ROLES.CUSTOMER
  const isSeller = isLoggedIn && user?.role === ROLES.SELLER
  const isAdmin = isLoggedIn && user?.role === ROLES.ADMIN

  const categoryLinks = useMemo(() => ([
    { label: 'Men', to: `${ROUTES.PRODUCTS}?gender=men` },
    { label: 'Women', to: `${ROUTES.PRODUCTS}?gender=women` },
    { label: 'Kids', to: `${ROUTES.PRODUCTS}?q=kids` },
    { label: 'Accessories', to: `${ROUTES.PRODUCTS}?q=accessories` },
    { label: 'Unisex', to: `${ROUTES.PRODUCTS}?gender=unisex` },
  ]), [])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!isCustomer) return
    refreshCart().catch(() => {})
    refreshWishlist().catch(() => {})
  }, [isCustomer, refreshCart, refreshWishlist])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = (params.get('q') || params.get('search') || '').trim()
    setSearchQuery(q)
  }, [location.search])

  useEffect(() => {
    const keyword = searchQuery.trim()

    if (keyword.length < 2) {
      setSearchSuggestions([])
      setIsSuggesting(false)
      return
    }

    let isActive = true
    setIsSuggesting(true)

    const timer = window.setTimeout(() => {
      suggestProducts({ q: keyword, limit: 7 })
        .then((result) => {
          if (!isActive) return
          setSearchSuggestions(Array.isArray(result?.suggestions) ? result.suggestions : [])
        })
        .catch(() => {
          if (!isActive) return
          setSearchSuggestions([])
        })
        .finally(() => {
          if (isActive) setIsSuggesting(false)
        })
    }, 250)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [searchQuery])

  const loadCustomerNotifications = async () => {
    if (!isCustomer) return

    setNotificationsLoading(true)
    try {
      const [notificationsResult, unreadCount] = await Promise.all([
        listNotifications({ page: 1, limit: 3 }),
        getUnreadNotificationCount(),
      ])

      setCustomerNotifications(notificationsResult.notifications || [])
      setCustomerUnreadCount(unreadCount)
    } catch {
      setCustomerNotifications([])
      setCustomerUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (!isCustomer) {
      setCustomerNotifications([])
      setCustomerUnreadCount(0)
      setIsNotificationsOpen(false)
      return
    }

    loadCustomerNotifications().catch(() => {})
  }, [isCustomer])

  const handleToggleNotifications = async () => {
    const nextState = !isNotificationsOpen
    setIsNotificationsOpen(nextState)
    setIsProfileOpen(false)

    if (!nextState || !isCustomer) return

    await loadCustomerNotifications()
  }

  const handleMarkAllNotificationsRead = async () => {
    if (!isCustomer || customerUnreadCount <= 0) return

    try {
      await markAllNotificationsRead()
      setCustomerUnreadCount(0)
      setCustomerNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })))
    } catch {
      // Ignore popup action failures silently.
    }
  }

  const formatSessionTime = (value) => {
    if (!value) return 'Unknown'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown'
    return date.toLocaleString()
  }

  const openLogoutDialog = async () => {
    setIsProfileOpen(false)
    setIsLogoutDialogOpen(true)
    setIsSessionsLoading(true)
    setLogoutDialogError('')

    try {
      const data = await getActiveSessions()
      setSessionsData({
        sessions: data?.sessions || [],
        activeDevices: data?.activeDevices ?? data?.sessions?.length ?? 1,
        maxDevices: data?.maxDevices ?? 3,
      })
    } catch {
      setSessionsData({
        sessions: [],
        activeDevices: 1,
        maxDevices: 3,
      })
      setLogoutDialogError('Could not load active device details. You can still continue logout.')
    } finally {
      setIsSessionsLoading(false)
    }
  }

  const handleLogoutAction = async (allDevices) => {
    setIsLogoutSubmitting(true)
    try {
      await logoutApi(allDevices)
    } catch {
      // Even if server logout fails, clear local session to avoid stale auth state.
    } finally {
      logout()
      setIsLogoutDialogOpen(false)
      setIsLogoutSubmitting(false)
      navigate(ROUTES.LOGIN)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    const next = q ? `${ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}` : ROUTES.PRODUCTS
    setShowSearchSuggestions(false)
    navigate(next)
  }

  const handleSearchSuggestionSelect = (item) => {
    setShowSearchSuggestions(false)

    if (item?.type === 'category' && item?.categoryId) {
      navigate(`${ROUTES.PRODUCTS}?category=${encodeURIComponent(item.categoryId)}`)
      return
    }

    const q = String(item?.value || item?.label || '').trim()
    if (!q) return

    setSearchQuery(q)
    navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}`)
  }

  const handleBrandClick = (event) => {
    if (location.pathname === ROUTES.HOME) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)
  }

  const getMenuItems = () => {
    if (!isLoggedIn) {
      return [
        { label: 'Login', to: ROUTES.LOGIN },
        { label: 'Create Account', to: ROUTES.REGISTER },
      ]
    }

    if (user?.role === ROLES.CUSTOMER) {
      return [
        { label: 'Notifications', to: ROUTES.NOTIFICATIONS },
        { label: 'My Orders', to: ROUTES.ORDERS },
        { label: 'Addresses', to: ROUTES.ADDRESSES },
        { label: 'Wishlist', to: ROUTES.WISHLIST },
        { label: 'Settings', to: ROUTES.PROFILE },
      ]
    }

    if (isAdmin) {
      return [
        { label: 'Admin Dashboard', to: ROUTES.ADMIN_DASHBOARD },
        { label: 'Profile', to: ROUTES.PROFILE },
      ]
    }

    return [{ label: 'My Profile', to: ROUTES.PROFILE }]
  }

  const menuItems = getMenuItems()
  const showBuyerIcons = !isLoggedIn || isCustomer

  return (
    <header className="fixed top-0 z-[90] w-full shadow-nav">
      <div className="relative z-20 border-b border-border bg-surface-elevated/95 backdrop-blur overflow-visible">
        <div className="page-shell grid min-h-[70px] grid-cols-[auto,1fr,auto] items-center gap-sm md:gap-md">
          <Link to={ROUTES.HOME} onClick={handleBrandClick} className="whitespace-nowrap font-display text-2xl tracking-tight text-text-primary">
            WearWeb
          </Link>

          <form onSubmit={handleSearch} className="relative flex min-w-0 items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSearchSuggestions(false), 120)
              }}
              placeholder="Search products or categories..."
              className="h-10 w-full min-w-0 rounded-md border border-border bg-surface px-sm text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              aria-label="Search"
              title="Search"
            >
              <SearchIcon />
            </button>

            {showSearchSuggestions && searchQuery.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-full z-[130] mt-1 overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-card">
                {isSuggesting ? (
                  <div className="px-sm py-3 text-sm text-text-secondary">Finding suggestions...</div>
                ) : searchSuggestions.length === 0 ? (
                  <div className="px-sm py-3 text-sm text-text-secondary">No matching products or categories</div>
                ) : (
                  <ul className="max-h-72 overflow-auto py-1">
                    {searchSuggestions.map((item, index) => (
                      <li key={`${item.type || 'product'}-${item.categoryId || item.productId || item.value || index}`}>
                        <button
                          type="button"
                          onMouseDown={() => handleSearchSuggestionSelect(item)}
                          className="flex w-full items-center gap-3 px-sm py-2 text-left hover:bg-surface-tertiary"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.label || item.value}
                              className="h-9 w-9 rounded-md object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-surface-tertiary" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-primary">{item.label || item.value}</p>
                            <p className="truncate text-xs text-text-muted">
                              {item.type === 'category' ? 'Category' : (item.brand || 'Product')}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </form>

          <div className="flex items-center gap-xs md:gap-sm">
            {showBuyerIcons ? (
              <>
                {isLoggedIn && isCustomer ? (
                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => handleToggleNotifications()}
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                      aria-label="Notifications"
                      title="Notifications"
                    >
                      <BellIcon />
                      {customerUnreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                          {customerUnreadCount}
                        </span>
                      ) : null}
                    </button>

                    {isNotificationsOpen ? (
                      <div className="absolute right-0 z-[125] mt-2 w-[320px] rounded-lg border border-border bg-surface-elevated p-sm shadow-card">
                        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                          <p className="text-sm font-semibold text-text-primary">Notifications</p>
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            disabled={!customerUnreadCount}
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
                          ) : customerNotifications.length ? customerNotifications.map((notification) => (
                            <div key={notification?._id || notification?.createdAt} className="rounded-md border border-border bg-surface-3 p-sm">
                              <p className="text-sm text-text-primary">{toPreview(notification?.message || 'You have a new update.')}</p>
                              <p className="mt-1 text-xs text-text-secondary">{formatRelativeTime(notification?.createdAt || notification?.updatedAt)}</p>
                            </div>
                          )) : (
                            <p className="rounded-md border border-dashed border-border bg-surface-tertiary p-sm text-sm text-text-secondary">
                              You have no notifications right now.
                            </p>
                          )}
                        </div>

                        <Link
                          to={ROUTES.NOTIFICATIONS}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="mt-2 inline-flex text-sm font-medium text-primary hover:text-primary-hover"
                        >
                          View All Notifications
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Link
                  to={isLoggedIn ? ROUTES.WISHLIST : ROUTES.LOGIN}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  aria-label={isLoggedIn ? 'Wishlist' : 'Login to view wishlist'}
                  title="Wishlist"
                >
                  <HeartIcon />
                </Link>

                <Link
                  to={isLoggedIn ? ROUTES.CART : ROUTES.LOGIN}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  aria-label={isLoggedIn ? 'Cart' : 'Login to view cart'}
                  title="Cart"
                >
                  <CartIcon />
                  {isLoggedIn && itemCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {itemCount}
                    </span>
                  ) : (
                    !isLoggedIn ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-border px-1 text-[10px] font-bold text-text-secondary">
                        0
                      </span>
                    ) : null
                  )}
                </Link>
              </>
            ) : null}

            {!isLoggedIn ? (
              <Button as={Link} to={ROUTES.LOGIN} size="sm">
                Login / Sign Up
              </Button>
            ) : isSeller ? (
              <>
                <Button as={Link} to={ROUTES.SELLER_DASHBOARD} size="sm" variant="secondary">
                  Seller Dashboard
                </Button>
                <Button size="sm" variant="ghost" onClick={openLogoutDialog}>Logout</Button>
              </>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="inline-flex h-10 items-center gap-2 rounded-md px-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  aria-label="Open profile menu"
                  title="Profile"
                >
                  <UserIcon />
                  <span className="max-w-[120px] truncate text-sm font-medium text-text-primary">{profileFirstName}</span>
                </button>

                {isProfileOpen ? (
                  <div className="absolute right-0 z-[120] mt-2 w-52 overflow-hidden rounded-md border border-border bg-surface shadow-card">
                    <div className="border-b border-border px-sm py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Account
                    </div>
                    <div className="flex flex-col py-1">
                      {menuItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsProfileOpen(false)}
                          className="px-sm py-2 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false)
                          openLogoutDialog()
                        }}
                        className="px-sm py-2 text-left text-sm text-danger hover:bg-danger-soft"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 border-b border-border bg-surface-elevated/90 backdrop-blur">
        <nav className="page-shell flex h-11 items-center gap-xs overflow-x-auto">
          {categoryLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="whitespace-nowrap rounded-full px-sm py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary hover:bg-primary-soft hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {isLogoutDialogOpen ? (
        <div className="fixed inset-0 z-[140]">
          <button
            type="button"
            className="absolute inset-0 bg-text-primary/45"
            aria-label="Close logout dialog"
            onClick={() => {
              if (!isLogoutSubmitting) setIsLogoutDialogOpen(false)
            }}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card"
          >
            <div className="mb-sm flex items-start justify-between gap-sm">
              <div>
                <h2 id="logout-dialog-title" className="text-lg font-semibold text-text-primary">
                  Logout Options
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Choose whether to logout only this device or all active devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isLogoutSubmitting) setIsLogoutDialogOpen(false)
                }}
                className="rounded-md px-sm py-1 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                disabled={isLogoutSubmitting}
              >
                Close
              </button>
            </div>

            {logoutDialogError ? (
              <div className="mb-sm rounded-md border border-amber-200 bg-amber-50 px-sm py-2 text-xs text-amber-800">
                {logoutDialogError}
              </div>
            ) : null}

            <div className="mb-md rounded-lg border border-border bg-surface px-sm py-sm">
              {isSessionsLoading ? (
                <p className="text-sm text-text-muted">Loading active device details...</p>
              ) : (
                <>
                  <p className="text-sm text-text-primary">
                    Active devices: <span className="font-semibold">{sessionsData.activeDevices}</span> / {sessionsData.maxDevices}
                  </p>
                  <div className="mt-sm max-h-56 space-y-2 overflow-y-auto pr-1">
                    {(sessionsData.sessions || []).map((session) => (
                      <div
                        key={session.sessionId}
                        className="rounded-md border border-border bg-surface-secondary px-sm py-2"
                      >
                        <div className="flex items-center justify-between gap-sm">
                          <p className="text-sm font-medium text-text-primary">{session.deviceName || 'Unknown device'}</p>
                          {session.isCurrent ? (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">IP: {session.ipAddress || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">Last active: {formatSessionTime(session.lastUsedAt)}</p>
                      </div>
                    ))}
                    {!sessionsData.sessions?.length ? (
                      <p className="text-xs text-text-muted">No detailed session list available for this account.</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleLogoutAction(false)}
                loading={isLogoutSubmitting}
              >
                Logout Current Device
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleLogoutAction(true)}
                loading={isLogoutSubmitting}
              >
                Logout All Devices
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  )
}
