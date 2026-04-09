import { Button } from '@/shared/ui'

export default function SellerDashboardHeader({
  storeName,
  period,
  periodOptions,
  onPeriodChange,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-sm">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Welcome back, {storeName}. Here is your business snapshot.</p>
      </div>

      <div className="flex items-center gap-sm">
        <select
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
          className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
          aria-label="Dashboard period"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRefresh(true)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
