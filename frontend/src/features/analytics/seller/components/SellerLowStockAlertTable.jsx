import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { SELLER_ANALYTICS_EMPTY_LIST_MESSAGE } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

export default function SellerLowStockAlertTable({ rows, loading }) {
  return (
    <Card className="space-y-sm">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-base font-semibold text-text-primary">Low Stock Variants ( 5 or less )</h2>
        <Link to={ROUTES.SELLER_PRODUCTS} className="text-xs font-medium text-primary hover:text-primary-hover">
          Update Stock
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-md bg-surface-3" />
          <div className="h-12 animate-pulse rounded-md bg-surface-3" />
          <div className="h-12 animate-pulse rounded-md bg-surface-3" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 px-md py-lg text-sm text-text-secondary">
          {SELLER_ANALYTICS_EMPTY_LIST_MESSAGE}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-sm rounded-md border border-border bg-surface-3 px-sm py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{row.name}</p>
                <p className="text-xs text-text-muted">{row.variantLabel}</p>
              </div>
              <span className="rounded-full border border-warning/40 bg-warning-soft px-2 py-1 text-xs font-semibold text-warning">
                {Number(row.stock || 0)} left
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
