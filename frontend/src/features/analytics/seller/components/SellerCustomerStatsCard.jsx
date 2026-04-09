import { Card } from '@/shared/ui'

export default function SellerCustomerStatsCard({ customers, loading }) {
  return (
    <Card className="space-y-sm">
      <h2 className="text-base font-semibold text-text-primary">Customers</h2>

      {loading ? (
        <div className="space-y-2">
          <div className="h-5 w-36 animate-pulse rounded bg-surface-3" />
          <div className="h-5 w-36 animate-pulse rounded bg-surface-3" />
          <div className="h-2 w-full animate-pulse rounded bg-surface-3" />
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            Total Unique: <span className="font-semibold text-text-primary">{Number(customers.uniqueCustomers || 0).toLocaleString('en-IN')}</span>
          </p>
          <p className="text-sm text-text-secondary">
            Repeat Buyers: <span className="font-semibold text-text-primary">{Number(customers.repeatCustomers || 0).toLocaleString('en-IN')}</span>
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Repeat Buyer Ratio</span>
              <span>{Math.round(Number(customers.repeatRate || 0))}%</span>
            </div>
            <div className="h-2 rounded bg-surface-3">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, Number(customers.repeatRate || 0)))}%` }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
