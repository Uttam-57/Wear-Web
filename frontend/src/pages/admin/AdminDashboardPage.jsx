import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Spinner } from '@/shared/ui'
import useAdminAnalytics from '@/features/analytics/hooks/useAdminAnalytics'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate, formatPrice } from '@/shared/utils/formatters'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CURRENT_YEAR = new Date().getFullYear()
const PREVIOUS_YEAR = CURRENT_YEAR - 1

const toApiDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildQuarterOptions = (year) => {
  return [
    { value: 'Q1', label: `Q1 (Jan-Mar) ${year}`, start: new Date(year, 0, 1), end: new Date(year, 3, 0), shortLabel: `Q1 ${year}` },
    { value: 'Q2', label: `Q2 (Apr-Jun) ${year}`, start: new Date(year, 3, 1), end: new Date(year, 6, 0), shortLabel: `Q2 ${year}` },
    { value: 'Q3', label: `Q3 (Jul-Sep) ${year}`, start: new Date(year, 6, 1), end: new Date(year, 9, 0), shortLabel: `Q3 ${year}` },
    { value: 'Q4', label: `Q4 (Oct-Dec) ${year}`, start: new Date(year, 9, 1), end: new Date(year, 12, 0), shortLabel: `Q4 ${year}` },
  ].map((item) => ({
    ...item,
    from: toApiDate(item.start),
    to: toApiDate(item.end),
  }))
}

const QUARTER_OPTIONS = buildQuarterOptions(CURRENT_YEAR)

const WINDOW_OPTIONS = [
  { value: '7d', label: 'Last 7 Days', shortLabel: 'Last 7 Days', request: { period: '7d' } },
  { value: '30d', label: 'Last 30 Days', shortLabel: 'Last 30 Days', request: { period: '30d' } },
  { value: '90d', label: 'Last 90 Days', shortLabel: 'Last 90 Days', request: { period: '90d' } },
  {
    value: 'last_year',
    label: `Last Year (${PREVIOUS_YEAR})`,
    shortLabel: `Last Year (${PREVIOUS_YEAR})`,
    request: {
      from: toApiDate(new Date(PREVIOUS_YEAR, 0, 1)),
      to: toApiDate(new Date(PREVIOUS_YEAR, 11, 31)),
    },
  },
  ...QUARTER_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    shortLabel: option.shortLabel,
    request: { from: option.from, to: option.to },
  })),
  { value: 'all', label: 'All Time', shortLabel: 'All Time', request: { period: 'all' } },
]

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

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [selectedWindow, setSelectedWindow] = useState('30d')
  const { analytics, loading, refresh } = useAdminAnalytics()

  const activeWindow = WINDOW_OPTIONS.find((item) => item.value === selectedWindow) || WINDOW_OPTIONS[0]

  useEffect(() => {
    if (!activeWindow) return
    refresh(activeWindow.request || {}).catch(() => {})
  }, [activeWindow, refresh])

  const grossGMV = Number(analytics?.revenue?.grossGMV || 0)
  const platformCommission = Number(analytics?.revenue?.commissionEarned || 0)
  const ordersTotal = Number(analytics?.orders?.total || 0)
  const pendingSellers = Number(analytics?.users?.sellerStatus?.pending || 0)
  const pendingPayoutCount = Number(analytics?.withdrawals?.pendingCount || 0)
  const pendingPayoutAmount = Number(analytics?.withdrawals?.pendingAmount || 0)
  const totalNewUsers = (analytics?.users?.newRegistrationsOverTime || []).reduce((sum, row) => sum + Number(row?.count || 0), 0)

  const overTime = Array.isArray(analytics?.revenue?.overTime) ? analytics.revenue.overTime : []
  const revenueSeries = overTime.map((entry) => {
    const normalizedGmv = Number(entry?.gmv ?? entry?.amount ?? 0)
    const normalizedCommission = Number(entry?.commission ?? entry?.platformCommission ?? 0)

    return {
      date: entry?.date,
      gmv: Number.isFinite(normalizedGmv) ? normalizedGmv : 0,
      commission: Number.isFinite(normalizedCommission) ? normalizedCommission : 0,
    }
  })
  const nonZeroRevenuePoints = revenueSeries.filter((point) => point.gmv > 0 || point.commission > 0).length
  const showRevenueDots = nonZeroRevenuePoints <= 1

  const rootCategoryRows = Array.isArray(analytics?.revenue?.byRootCategory)
    ? analytics.revenue.byRootCategory.map((item) => ({
        rootId: String(item?.rootId || ''),
        rootName: item?.rootName || 'Root Category',
        commission: Number(item?.commissionEarned || 0),
        revenue: Number(item?.revenue || 0),
        orderCount: Number(item?.orderCount || 0),
      }))
    : []
  const rootCommissionRows = [...rootCategoryRows].sort((a, b) => b.commission - a.commission)
  const productCommission = rootCategoryRows.reduce((sum, row) => sum + Number(row?.commission || 0), 0)
  const productCommissionCategoryCount = rootCategoryRows.filter((row) => Number(row?.commission || 0) > 0).length

  const rawTopSellers = Array.isArray(analytics?.sellers?.topByRevenue)
    ? analytics.sellers.topByRevenue.slice(0, 5)
    : []
  const topSellers = Array.from({ length: 5 }, (_, index) => rawTopSellers[index] || null)

  const rawTopRootCategories = [...rootCategoryRows]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
  const topCategories = Array.from({ length: 5 }, (_, index) => rawTopRootCategories[index] || null)

  if (loading && !analytics) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-subtitle">Platform-level analytics and action queues.</p>
        </div>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Time Window</span>
          <select
            value={selectedWindow}
            onChange={(event) => setSelectedWindow(event.target.value)}
            className="w-[200px] rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
          >
            {WINDOW_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-text-muted">Platform GMV</p>
          <p className="mt-2 text-3xl font-display text-text-primary">{formatPrice(grossGMV)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-text-muted">Platform Commission</p>
          <p className="mt-2 text-3xl font-display text-text-primary">{formatPrice(platformCommission)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-text-muted">Product Commission</p>
          <p className="mt-2 text-3xl font-display text-text-primary">{formatPrice(productCommission)}</p>
          <p className="mt-2 text-xs text-text-secondary">
            Total commission from all root categories ({productCommissionCategoryCount} active).
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-text-muted">Total Orders</p>
          <p className="mt-2 text-3xl font-display text-text-primary">{ordersTotal}</p>
        </Card>
      </div>

      <div className="grid gap-md md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-text-muted">New Users</p>
          <p className="mt-2 text-3xl font-display text-text-primary">{totalNewUsers}</p>
          <p className="mt-2 text-xs text-text-secondary">
            Registered in {activeWindow?.shortLabel}. Customers {analytics?.users?.byRole?.customer || 0} | Sellers {analytics?.users?.byRole?.seller || 0}
          </p>
        </Card>

        <Card className="space-y-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending Sellers</p>
            <p className="mt-2 text-3xl font-display text-text-primary">{pendingSellers}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.ADMIN_SELLERS_PENDING)}>
            Review Now
          </Button>
        </Card>

        <Card className="space-y-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending Payouts</p>
            <p className="mt-2 text-3xl font-display text-text-primary">{pendingPayoutCount}</p>
            <p className="text-xs text-text-secondary">{formatPrice(pendingPayoutAmount)}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.ADMIN_PAYOUTS)}>
            Process Now
          </Button>
        </Card>
      </div>

      <Card className="space-y-sm">
        <h2 className="text-sm font-semibold text-text-primary">Revenue Overview</h2>
        <p className="text-xs text-text-muted">
          Daily trend for GMV vs Platform Commission in {activeWindow?.shortLabel}.
        </p>

        {!revenueSeries.length ? (
          <p className="text-sm text-text-secondary">No revenue trend data available in this window.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgb(var(--c-border) / 0.75)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
                />
                <YAxis tickFormatter={formatCompactAmount} tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }} />
                <Tooltip
                  formatter={(value, name) => [formatPrice(value), name === 'gmv' ? 'GMV' : 'Platform Commission']}
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgb(var(--c-border) / 1)',
                    backgroundColor: 'rgb(var(--c-surface-2) / 0.97)',
                    fontSize: 12,
                  }}
                />
                <Legend
                  formatter={(value) => (value === 'gmv' ? 'GMV' : 'Platform Commission')}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="gmv"
                  name="gmv"
                  stroke="#0B4575"
                  strokeWidth={2.4}
                  dot={showRevenueDots}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  name="commission"
                  stroke="#D66B27"
                  strokeWidth={2.2}
                  dot={showRevenueDots}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="space-y-sm">
        <h2 className="text-sm font-semibold text-text-primary">Commission by Root Category</h2>
        <p className="text-xs text-text-muted">
          Subcategory commissions are aggregated into their parent root category for easier reading.
        </p>

        {!rootCommissionRows.length ? (
          <p className="text-sm text-text-secondary">No category commission data available.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rootCommissionRows} margin={{ top: 12, right: 16, left: 4, bottom: 32 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgb(var(--c-border) / 0.75)" />
                <XAxis
                  dataKey="rootName"
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={72}
                  tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }}
                />
                <YAxis tickFormatter={formatCompactAmount} tick={{ fontSize: 11, fill: 'rgb(var(--c-text-3) / 1)' }} />
                <Tooltip
                  formatter={(value) => [formatPrice(value), 'Commission']}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgb(var(--c-border) / 1)',
                    backgroundColor: 'rgb(var(--c-surface-2) / 0.97)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="commission" fill="#D66B27" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-md xl:grid-cols-2">
        <Card className="space-y-sm">
          <h2 className="text-sm font-semibold text-text-primary">Top Performing Sellers</h2>
          {topSellers.length ? (
            <div className="space-y-2">
              {topSellers.map((seller, index) => (
                <div key={`${seller?.sellerId || `placeholder-${index}`}`} className="flex items-center justify-between rounded-md border border-border bg-surface-3 px-sm py-2">
                  <p className="text-sm text-text-primary">{index + 1}. {seller?.sellerName || seller?.sellerEmail || 'No seller data'}</p>
                  <p className="text-sm font-semibold text-text-primary">{formatPrice(Number(seller?.revenue || 0))}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No seller ranking data for this period.</p>
          )}
        </Card>

        <Card className="space-y-sm">
          <h2 className="text-sm font-semibold text-text-primary">Top Selling Categories</h2>
          {topCategories.length ? (
            <div className="space-y-2">
              {topCategories.map((category, index) => (
                <div key={`${category?.rootId || `placeholder-${index}`}`} className="flex items-center justify-between rounded-md border border-border bg-surface-3 px-sm py-2">
                  <p className="text-sm text-text-primary">{index + 1}. {category?.rootName || 'No category data'}</p>
                  <p className="text-sm font-semibold text-text-primary">{formatPrice(Number(category?.revenue || 0))}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No category ranking data for this period.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
