import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui'

export default function SellerLowStockAlertsCard({ items = [] }) {
  return (
    <Card className="space-y-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Low Stock Alerts</h2>
        <Link to="/seller/products?filter=low-stock" className="text-sm font-medium text-primary hover:text-primary-hover">
          Manage Inventory
        </Link>
      </div>

      {!items.length ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 p-md text-sm text-text-secondary">
          Inventory levels look healthy. No low-stock products right now.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const id = item?.productId || item?._id || `${item?.productName || 'item'}-${index}`
            const productName = item?.productName || item?.name || 'Untitled Product'
            const colorName = item?.variant?.colorName || item?.colorName || '-'
            const size = item?.variant?.size || item?.size || '-'
            const stock = Number(item?.variant?.stock ?? item?.stock ?? 0)
            const stockText = stock <= 0 ? 'Out of stock' : `Only ${stock} left`
            const toneClass = stock <= 0 ? 'text-danger' : 'text-warning'

            return (
              <div key={id} className="rounded-md border border-border bg-surface-3 p-sm">
                <p className="text-sm font-semibold text-text-primary">{productName}</p>
                <p className={`text-xs ${toneClass}`}>! ({colorName}, {size}) {stockText}</p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
