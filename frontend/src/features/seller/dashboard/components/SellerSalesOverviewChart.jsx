import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const formatAxisDate = (value) => {
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

export default function SellerSalesOverviewChart({ chart, periodLabel }) {
  const labels = useMemo(() => chart?.labels || [], [chart?.labels])
  const safeSales = useMemo(() => (chart?.salesData || []).map((item) => Number(item || 0)), [chart?.salesData])
  const safeOrders = useMemo(() => (chart?.ordersData || []).map((item) => Number(item || 0)), [chart?.ordersData])

  const chartRows = useMemo(() => {
    return labels.map((label, index) => ({
      label,
      sales: safeSales[index] || 0,
      orders: safeOrders[index] || 0,
    }))
  }, [labels, safeSales, safeOrders])

  const totalSales = safeSales.reduce((sum, value) => sum + value, 0)
  const totalOrders = safeOrders.reduce((sum, value) => sum + value, 0)

  const hasOrderTrend = safeOrders.some((value) => value > 0)

  return (
    <Card className="space-y-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Sales Overview</h2>
          <p className="text-xs text-text-secondary">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-md text-xs">
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Sales {formatPrice(totalSales)}
          </span>
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Orders {totalOrders}
          </span>
        </div>
      </div>

      {!labels.length ? (
        <div className="rounded-md border border-dashed border-border bg-surface-3 p-lg text-sm text-text-secondary">
          No chart data available for this period.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartRows} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="dashboard-sales-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B4575" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#0B4575" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgb(var(--c-border) / 0.75)" />
              <XAxis
                dataKey="label"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
              />
              <YAxis tickFormatter={formatCompactAmount} tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'orders' ? Number(value || 0).toLocaleString('en-IN') : formatPrice(value),
                  name === 'orders' ? 'Orders' : 'Sales',
                ]}
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
                dataKey="sales"
                name="sales"
                stroke="#0B4575"
                strokeWidth={2.5}
                fill="url(#dashboard-sales-fill)"
                dot={false}
              />
              {hasOrderTrend ? (
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="orders"
                  stroke="#D66B27"
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  dot={false}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
