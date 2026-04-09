import { Badge, Button, Card, Input, Pagination } from '@/shared/ui'
import {
  SELLER_ORDER_DATE_OPTIONS,
  SELLER_ORDER_STATUS_TABS,
  getSellerOrderItemPreview,
  getSellerOrderRowActionLabel,
  getSellerOrderStatusMeta,
} from '@/features/orders/seller/utils/sellerOrders.utils'
import { formatDateTime } from '@/shared/utils/formatters'

const STATUS_TABS = [
  { value: SELLER_ORDER_STATUS_TABS.ALL, label: 'All Orders' },
  { value: SELLER_ORDER_STATUS_TABS.PENDING_ACTION, label: 'Pending Action' },
  { value: SELLER_ORDER_STATUS_TABS.COMPLETED, label: 'Completed' },
]

export default function SellerOrdersListView({
  rows = [],
  loading = false,
  refreshing = false,
  statusTab,
  statusCounts,
  searchTerm,
  dateFilter,
  page,
  totalPages,
  onStatusTabChange,
  onSearchChange,
  onDateFilterChange,
  onPageChange,
  onOpenOrder,
  onRefresh,
}) {
  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Orders</h1>
          <p className="section-subtitle">Manage and process your customer orders.</p>
        </div>

        <Button variant="secondary" onClick={onRefresh} loading={refreshing}>
          Refresh
        </Button>
      </div>

      <Card className="space-y-sm">
        <div className="grid gap-sm lg:grid-cols-[1fr,220px]">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Search Orders</span>
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search by Order ID, customer, or item"
              aria-label="Search orders"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Filter by Date</span>
            <select
              value={dateFilter}
              onChange={(event) => onDateFilterChange?.(event.target.value)}
              className="h-[42px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm text-text-primary"
            >
              {SELLER_ORDER_DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-sm">
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab.value
            const count = statusCounts?.[tab.value] || 0

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusTabChange?.(tab.value)}
                className={`rounded-md px-sm py-2 text-sm font-medium transition ${isActive ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'}`}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Items</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-lg text-center text-sm text-text-secondary">
                    No orders found for the selected filters.
                  </td>
                </tr>
              ) : null}

              {rows.map((order) => {
                const statusMeta = getSellerOrderStatusMeta(order.status)
                const itemPreview = getSellerOrderItemPreview(order)
                const actionLabel = getSellerOrderRowActionLabel(order.status)
                const actionVariant = actionLabel === 'Enter OTP' ? 'primary' : 'secondary'

                return (
                  <tr key={order.id} className="border-b border-border/70 align-top text-sm text-text-primary">
                    <td className="px-2 py-sm">
                      <p className="font-semibold">#{order.orderNumber}</p>
                      <p className="text-xs text-text-secondary">{order.customer.name}</p>
                    </td>

                    <td className="px-2 py-sm text-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="px-2 py-sm">
                      <p>{itemPreview.title}</p>
                      <p className="text-xs text-text-secondary">{itemPreview.variant}</p>
                      {itemPreview.moreLabel ? (
                        <p className="text-xs font-medium text-primary">{itemPreview.moreLabel}</p>
                      ) : null}
                    </td>

                    <td className="px-2 py-sm">
                      <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                    </td>

                    <td className="px-2 py-sm text-right">
                      <Button
                        size="sm"
                        variant={actionVariant}
                        onClick={() => onOpenOrder?.(order.id)}
                      >
                        {actionLabel}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </Card>
    </div>
  )
}
