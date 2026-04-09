import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/ui'
import { SELLER_ANALYTICS_EMPTY_CHART_MESSAGE } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

export default function SellerRatingDistributionChart({ bars, loading }) {
  const total = bars.reduce((sum, item) => sum + Number(item.count || 0), 0)

  return (
    <Card className="space-y-sm">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-base font-semibold text-text-primary">Rating Spread</h2>
        <p className="text-xs text-text-muted">Review count by star rating</p>
      </div>

      {loading ? (
        <div className="h-60 animate-pulse rounded-md bg-surface-3" />
      ) : total === 0 ? (
        <div className="flex h-60 items-center justify-center rounded-md border border-dashed border-border bg-surface-3 px-md text-center text-sm text-text-secondary">
          {SELLER_ANALYTICS_EMPTY_CHART_MESSAGE}
        </div>
      ) : (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgb(var(--c-border) / 0.7)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }} />
              <YAxis
                dataKey="label"
                type="category"
                width={48}
                tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
              />
              <Tooltip
                formatter={(value) => [Number(value || 0).toLocaleString('en-IN'), 'Reviews']}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid rgb(var(--c-border) / 1)',
                  backgroundColor: 'rgb(var(--c-surface-2) / 0.97)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#0B4575" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
