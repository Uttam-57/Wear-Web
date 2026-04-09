import { Button } from '@/shared/ui'

export default function SellerAnalyticsHeader({
  period,
  periodOptions,
  customFrom,
  customTo,
  customRangeError,
  refreshing,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
  onRefresh,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-md">
      <div>
        <h1 className="section-title">Analytics Overview</h1>
        <p className="section-subtitle">Track your store performance and growth.</p>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-end gap-sm">
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
            className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            aria-label="Analytics period"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <Button variant="secondary" size="sm" onClick={onRefresh} loading={refreshing}>
            Refresh
          </Button>
        </div>

        {period === 'custom' ? (
          <div className="flex flex-wrap items-center justify-end gap-sm">
            <label className="text-xs text-text-secondary" htmlFor="analytics-from-date">From</label>
            <input
              id="analytics-from-date"
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            />

            <label className="text-xs text-text-secondary" htmlFor="analytics-to-date">To</label>
            <input
              id="analytics-to-date"
              type="date"
              value={customTo}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            />
          </div>
        ) : null}

        {period === 'custom' && customRangeError ? (
          <p className="text-xs text-danger">{customRangeError}</p>
        ) : null}
      </div>
    </div>
  )
}
