import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/shared/ui'
import { SELLER_ANALYTICS_EMPTY_CHART_MESSAGE } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

const getPercent = (value, total) => {
  if (!total) return '0%'
  return `${Math.round((Number(value || 0) / total) * 100)}%`
}

export default function SellerOrderStatusDonut({ segments, loading }) {
  const totalOrders = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0)

  return (
    <Card className="h-full space-y-sm">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Orders by Status</h2>
        <p className="text-xs text-text-muted">Operations health snapshot</p>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-md bg-surface-3" />
      ) : totalOrders === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-surface-3 px-md text-center text-sm text-text-secondary">
          {SELLER_ANALYTICS_EMPTY_CHART_MESSAGE}
        </div>
      ) : (
        <div className="space-y-sm">
          <div className="relative h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {segments.map((segment) => (
                    <Cell key={segment.key} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value || 0).toLocaleString('en-IN')} (${getPercent(value, totalOrders)})`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgb(var(--c-border) / 1)',
                    backgroundColor: 'rgb(var(--c-surface-2) / 0.97)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-display text-text-primary">{totalOrders.toLocaleString('en-IN')}</p>
              <p className="text-xs text-text-muted">Total Orders</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {segments.map((segment) => (
              <div key={segment.key} className="flex items-center justify-between rounded-md border border-border bg-surface-3 px-sm py-2 text-xs">
                <span className="inline-flex items-center gap-2 text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden="true" />
                  {segment.label}
                </span>
                <span className="font-semibold text-text-primary">{Number(segment.value || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
