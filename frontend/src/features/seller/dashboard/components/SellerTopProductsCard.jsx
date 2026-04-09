import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

export default function SellerTopProductsCard({ products = [] }) {
  return (
    <Card className="space-y-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Top Selling Products</h2>
        <Link to="/seller/products" className="text-sm font-medium text-primary hover:text-primary-hover">
          View All
        </Link>
      </div>

      {!products.length ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 p-md text-sm text-text-secondary">
          No top product data available yet.
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((item, index) => {
            const id = item?.productId || item?._id || index
            const name = item?.productName || item?.name || 'Untitled Product'
            const unitsSold = Number(item?.unitsSold || item?.soldCount || 0)
            const price = Number(item?.price || item?.unitPrice || 0)
            const revenue = Number(item?.totalRevenue || item?.revenue || unitsSold * price || 0)
            const imageUrl = item?.imageUrl || item?.image || item?.images?.[0]

            return (
              <div key={id} className="flex items-center gap-sm rounded-md border border-border bg-surface-3 p-sm">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="h-12 w-12 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-xs font-semibold text-text-muted">
                    IMG
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
                  <p className="text-xs text-text-secondary">{unitsSold} sold this month • {formatPrice(price)}</p>
                  <p className="text-xs text-text-secondary">Revenue: {formatPrice(revenue)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
