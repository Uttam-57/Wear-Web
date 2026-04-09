import { Card } from '@/shared/ui'
import { formatPercent, formatPrice } from '@/shared/utils/formatters'

const getKpiItems = (kpis) => {
  return [
    {
      id: 'net-earnings',
      title: 'Net Earnings',
      value: formatPrice(kpis?.netEarnings),
      helper: 'Wallet credits in selected period',
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: Number(kpis?.totalOrders || 0).toLocaleString('en-IN'),
      helper: 'All order statuses included',
    },
    {
      id: 'aov',
      title: 'Avg. Order Value',
      value: formatPrice(kpis?.averageOrderValue),
      helper: 'Average order amount',
    },
    {
      id: 'fulfilment-rate',
      title: 'Fulfilment Rate',
      value: formatPercent(kpis?.fulfilmentRate),
      helper: 'Delivered over non-cancelled orders',
    },
  ]
}

const SkeletonCard = () => {
  return (
    <Card className="space-y-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
      <div className="h-8 w-28 animate-pulse rounded bg-surface-3" />
      <div className="h-3 w-36 animate-pulse rounded bg-surface-3" />
    </Card>
  )
}

export default function SellerAnalyticsKpiGrid({ kpis, loading }) {
  if (loading) {
    return (
      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
      {getKpiItems(kpis).map((item) => (
        <Card key={item.id} className="space-y-sm">
          <p className="text-xs uppercase tracking-wide text-text-muted">{item.title}</p>
          <p className="text-3xl font-display text-text-primary">{item.value}</p>
          <p className="text-xs text-text-secondary">{item.helper}</p>
        </Card>
      ))}
    </div>
  )
}
