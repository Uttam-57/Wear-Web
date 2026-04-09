import { Card } from '@/shared/ui'
import { formatNumber, formatPrice } from '@/shared/utils/formatters'
import { SELLER_ANALYTICS_EMPTY_LIST_MESSAGE } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

const getMetricLabel = ({ metric, row }) => {
  if (metric === 'units') {
    return `${formatNumber(row.unitsSold || 0)} units`
  }

  return formatPrice(row.revenue)
}

const ProductImage = ({ src, alt }) => {
  if (!src) {
    return (
      <div className="h-10 w-10 rounded-md border border-border bg-surface-3" aria-hidden="true" />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded-md border border-border object-cover"
      loading="lazy"
    />
  )
}

export default function SellerTopProductsTable({ title, rows, metric, loading }) {
  return (
    <Card className="space-y-sm">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>

      {loading ? (
        <div className="space-y-2">
          <div className="h-14 animate-pulse rounded-md bg-surface-3" />
          <div className="h-14 animate-pulse rounded-md bg-surface-3" />
          <div className="h-14 animate-pulse rounded-md bg-surface-3" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 px-md py-lg text-sm text-text-secondary">
          {SELLER_ANALYTICS_EMPTY_LIST_MESSAGE}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-sm rounded-md border border-border bg-surface-3 px-sm py-2">
              <span className="w-5 text-sm font-semibold text-text-secondary">{index + 1}</span>

              <ProductImage src={row.imageUrl} alt={row.name} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{row.name}</p>
                <p className="text-xs text-danger">Wishlist: {formatNumber(row.wishlistCount || 0)}</p>
              </div>

              <p className="text-sm font-semibold text-text-primary">{getMetricLabel({ metric, row })}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
