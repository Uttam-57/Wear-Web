import { Badge, Button, Card } from '@/shared/ui'
import { getSellerReturnStatusMeta } from '@/features/orders/seller/utils/sellerOrders.utils'

export default function SellerReturnsListView({ rows = [], onOpenOrder }) {
  return (
    <div className="space-y-md">
      <div>
        <h1 className="section-title">Returns</h1>
        <p className="section-subtitle">Review items requested for return by customers.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2">Reason</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-2 py-lg text-center text-sm text-text-secondary">
                    No return requests right now.
                  </td>
                </tr>
              ) : null}

              {rows.map((row) => {
                const statusMeta = getSellerReturnStatusMeta(row.status)

                return (
                  <tr key={row.id} className="border-b border-border/70 align-top text-sm text-text-primary">
                    <td className="px-2 py-sm">
                      <p className="font-semibold">#{row.orderNumber}</p>
                      <p className="text-xs text-text-secondary">{row.customerName}</p>
                    </td>

                    <td className="px-2 py-sm">
                      <p>{row.productName}</p>
                      <p className="text-xs text-text-secondary">{row.variantText}</p>
                      {row.moreLabel ? <p className="text-xs font-medium text-primary">{row.moreLabel}</p> : null}
                    </td>

                    <td className="px-2 py-sm text-text-secondary">{row.reason}</td>

                    <td className="px-2 py-sm">
                      <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                    </td>

                    <td className="px-2 py-sm text-right">
                      <Button size="sm" variant="secondary" onClick={() => onOpenOrder?.(row.id)}>
                        {row.status === 'requested' ? 'Start Return Flow' : 'Manage Return'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
