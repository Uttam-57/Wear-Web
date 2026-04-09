import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import { SELLER_ANALYTICS_EMPTY_CHART_MESSAGE } from '@/features/analytics/seller/constants/sellerAnalytics.constants'

const formatAxisDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date)
}

const formatCompactAmount = (value) => {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '0'

  if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`
  if (number >= 100000) return `${(number / 100000).toFixed(1)}L`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return String(Math.round(number))
}

export default function SellerRevenueAreaChart({ data, loading }) {
  return (
    <Card className="h-full space-y-sm">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-base font-semibold text-text-primary">Revenue Over Time</h2>
        <p className="text-xs text-text-muted">Wallet credits by day</p>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-md bg-surface-3" />
      ) : data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-surface-3 px-md text-center text-sm text-text-secondary">
          {SELLER_ANALYTICS_EMPTY_CHART_MESSAGE}
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="seller-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B4575" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0B4575" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgb(var(--c-border) / 0.7)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
                tickFormatter={formatAxisDate}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
                tickFormatter={formatCompactAmount}
              />
              <Tooltip
                formatter={(value) => formatPrice(value)}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid rgb(var(--c-border) / 1)',
                  backgroundColor: 'rgb(var(--c-surface-2) / 0.97)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0B4575"
                strokeWidth={2.5}
                fill="url(#seller-revenue-fill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
