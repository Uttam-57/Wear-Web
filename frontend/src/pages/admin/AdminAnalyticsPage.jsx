import { useEffect, useMemo, useState } from 'react'
import { Card, Spinner } from '@/shared/ui'
import { formatNumber } from '@/shared/utils/formatters'
import useAdminAnalytics from '@/features/analytics/hooks/useAdminAnalytics'

const PERIODS = ['7d', '30d', '90d', 'all']

const formatINR = (value) => formatNumber(value, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const { analytics, loading, refresh } = useAdminAnalytics()

  useEffect(() => {
    refresh({ period }).catch(() => {})
  }, [period, refresh])

  const cards = useMemo(() => {
    return [
      { title: `GMV (${period})`, value: formatINR(analytics?.revenue?.grossGMV ?? 0) },
      { title: `Orders (${period})`, value: analytics?.orders?.total ?? 0 },
      { title: 'Average Order Value', value: formatINR(analytics?.orders?.averageOrderValue ?? 0) },
      { title: 'Active Sellers', value: analytics?.users?.sellerStatus?.active ?? 0 },
    ]
  }, [analytics, period])

  const registrationSeries = analytics?.users?.newRegistrationsOverTime || []
  const maxRegistration = Math.max(1, ...registrationSeries.map((point) => point.count || 0))

  const revenueSeries = analytics?.revenue?.overTime || []
  const maxPayout = Math.max(1, ...revenueSeries.map((point) => point.sellerPayouts || 0))

  if (loading && !analytics) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="section-title">Platform Analytics</h1>
        <p className="section-subtitle">Live analytics from backend snapshots and aggregates.</p>
      </div>

      <div className="flex items-center gap-sm">
        <p className="text-sm text-text-secondary">Period:</p>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border border-border bg-surface px-sm py-2 text-sm"
        >
          {PERIODS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <p className="text-xs uppercase tracking-wide text-text-muted">{card.title}</p>
            <p className="mt-2 text-3xl font-display text-text-primary">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-sm">
        <h2 className="text-sm font-semibold text-text-primary">Order Status Breakdown</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {Object.entries(analytics?.orders?.byStatus || {}).map(([status, count]) => (
            <div key={status} className="rounded-md border border-border bg-surface-3 px-sm py-2">
              <p className="text-xs uppercase tracking-wide text-text-muted">{status.replaceAll('_', ' ')}</p>
              <p className="text-lg font-semibold text-text-primary">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-md xl:grid-cols-2">
        <Card className="space-y-sm">
          <h2 className="text-sm font-semibold text-text-primary">New Registrations Trend</h2>
          <div className="space-y-2">
            {registrationSeries.map((point) => (
              <div key={point.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{point.date}</span>
                  <span>{point.count}</span>
                </div>
                <div className="h-2 rounded bg-surface-3">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${Math.max(3, (point.count / maxRegistration) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-sm">
          <h2 className="text-sm font-semibold text-text-primary">Seller Payout Trend</h2>
          <div className="space-y-2">
            {revenueSeries.map((point) => (
              <div key={point.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{point.date}</span>
                  <span>{formatINR(point.sellerPayouts || 0)}</span>
                </div>
                <div className="h-2 rounded bg-surface-3">
                  <div
                    className="h-2 rounded bg-success"
                    style={{ width: `${Math.max(3, ((point.sellerPayouts || 0) / maxPayout) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm text-text-secondary">
          Source: {analytics?.isLive ? 'Live aggregation' : `Snapshot (${analytics?.snapshotAge || 'fresh'})`}
        </div>
      </Card>
    </div>
  )
}
