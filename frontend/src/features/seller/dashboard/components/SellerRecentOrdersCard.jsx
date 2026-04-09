import { Link } from 'react-router-dom'
import { Badge, Card } from '@/shared/ui'
import { formatOrderStatus, formatPrice } from '@/shared/utils/formatters'

const statusMeta = {
  processing: { icon: 'R', variant: 'primary' },
  pending: { icon: 'R', variant: 'warning' },
  shipped: { icon: 'P', variant: 'warning' },
  delivered: { icon: 'D', variant: 'success' },
  cancelled: { icon: 'X', variant: 'danger' },
  returned: { icon: 'U', variant: 'danger' },
}

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return 'Just now'

  const date = new Date(dateValue)
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

const toOrderNumber = (order) => {
  if (order?.orderNumber) return String(order.orderNumber)
  const id = String(order?._id || '')
  if (!id) return 'ORD-000000'
  return `ORD-${id.slice(-6).toUpperCase()}`
}

export default function SellerRecentOrdersCard({ orders = [] }) {
  return (
    <Card className="space-y-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Recent Orders</h2>
        <Link to="/seller/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
          View All
        </Link>
      </div>

      {!orders.length ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 p-md text-sm text-text-secondary">
          No orders yet. Your orders will appear here when customers start purchasing.
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const statusKey = String(order?.status || '').toLowerCase()
            const meta = statusMeta[statusKey] || statusMeta.pending
            const orderNumber = toOrderNumber(order)
            const amount = formatPrice(order?.totalAmount || order?.amount || 0)

            return (
              <div key={order?._id || orderNumber} className="rounded-md border border-border bg-surface-3 p-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">#{orderNumber}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{amount}</span>
                    <Badge variant={meta.variant} size="sm">{meta.icon} {formatOrderStatus(statusKey || 'pending')}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-text-secondary">{formatRelativeTime(order?.createdAt)}</p>
                  <Link to="/seller/orders" className="text-xs font-medium text-primary hover:text-primary-hover">
                    View Details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
