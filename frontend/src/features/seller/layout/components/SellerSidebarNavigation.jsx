import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

const getSections = (publicStoreTo) => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: ROUTES.SELLER_DASHBOARD,
  },
  {
    id: 'my-public-store',
    label: 'My Public Store',
    to: publicStoreTo,
  },
  {
    id: 'orders',
    label: 'Orders',
    children: [
      { label: 'All Orders', to: ROUTES.SELLER_ORDERS, badgeKey: 'allOrdersCount' },
      { label: 'Returns', to: `${ROUTES.SELLER_ORDERS}?tab=returns`, badgeKey: 'returnsCount' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    to: ROUTES.SELLER_NOTIFICATIONS,
  },
  {
    id: 'wallet',
    label: 'Wallets & Payouts',
    to: ROUTES.SELLER_WALLET,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    to: ROUTES.SELLER_ANALYTICS,
  },
  {
    id: 'settings',
    label: 'Settings',
    to: ROUTES.SELLER_PROFILE,
  },
]

const isLinkActive = (location, to) => {
  const [path, query] = String(to).split('?')
  if (location.pathname !== path) return false
  if (!query) return true

  const expected = new URLSearchParams(query)
  const current = new URLSearchParams(location.search)
  for (const [key, value] of expected.entries()) {
    if (current.get(key) !== value) return false
  }
  return true
}

const hasQueryString = (to) => String(to).includes('?')
const getPathOnly = (to) => String(to).split('?')[0]

const isChildLinkActive = (location, child, siblings = []) => {
  const baseActive = isLinkActive(location, child.to)
  if (!baseActive) return false

  // If current URL matches a query-specific sibling (same path), keep only that sibling active.
  if (!hasQueryString(child.to)) {
    const hasActiveQuerySibling = siblings.some((sibling) => {
      if (sibling.to === child.to) return false
      if (!hasQueryString(sibling.to)) return false
      if (getPathOnly(sibling.to) !== getPathOnly(child.to)) return false
      return isLinkActive(location, sibling.to)
    })

    if (hasActiveQuerySibling) return false
  }

  return true
}

export default function SellerSidebarNavigation({ counts, onNavigate, publicStoreTo }) {
  const location = useLocation()
  const sections = getSections(publicStoreTo || ROUTES.SELLER_DASHBOARD)

  return (
    <nav className="space-y-sm">
      {sections.map((section) => {
        const hasChildren = Array.isArray(section.children) && section.children.length > 0
        const parentActive = hasChildren
          ? section.children.some((child) => isLinkActive(location, child.to))
          : isLinkActive(location, section.to)

        return (
          <div key={section.id} className="rounded-lg border border-border bg-surface-elevated p-sm">
            {!hasChildren ? (
              <Link
                to={section.to}
                onClick={onNavigate}
                className={cn(
                  'block rounded-md border-l-4 px-sm py-2 text-sm font-semibold transition-colors',
                  parentActive
                    ? 'border-l-primary bg-primary text-white'
                    : 'border-l-transparent text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                )}
              >
                {section.label}
              </Link>
            ) : (
              <>
                <p className={cn('px-sm pb-xs text-xs font-semibold uppercase tracking-wide', parentActive ? 'text-primary' : 'text-text-muted')}>
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.children.map((child) => {
                    const active = isChildLinkActive(location, child, section.children)
                    const badgeValue = Number(counts?.[child.badgeKey] || 0)

                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center justify-between rounded-md border-l-4 px-sm py-2 text-sm transition-colors',
                          active
                            ? 'border-l-primary bg-primary text-white'
                            : 'border-l-transparent text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                        )}
                      >
                        <span>{child.label}</span>
                        {child.badgeKey ? (
                          <span className={cn(
                            'rounded-full px-2 py-[2px] text-xs font-semibold',
                            active ? 'bg-white/20 text-white' : 'bg-surface-3 text-text-primary'
                          )}
                          >
                            {badgeValue}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
