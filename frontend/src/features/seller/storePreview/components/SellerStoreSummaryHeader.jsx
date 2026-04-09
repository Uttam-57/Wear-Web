import { Button } from '@/shared/ui'

const formatRating = (value) => {
  const rating = Number(value || 0)
  if (!Number.isFinite(rating) || rating <= 0) return '0.0'
  return rating.toFixed(1)
}

export default function SellerStoreSummaryHeader({
  storeInitials,
  storeName,
  subtitle,
  summary,
  onEditStoreInfo,
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-md shadow-card">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Store info</p>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="flex min-w-0 flex-1 items-start gap-md">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary-soft text-3xl font-semibold text-primary">
            {storeInitials}
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-display text-text-primary md:text-3xl">{storeName}</h1>
            <p className="text-sm text-text-secondary">{subtitle}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-md gap-y-1 text-sm text-text-secondary">
              <span>{summary.totalProducts} products</span>
              <span>{formatRating(summary.avgRating)} avg rating</span>
              <span>{summary.totalReviews} reviews</span>
              <span>Active since {summary.activeSinceLabel}</span>
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={onEditStoreInfo}>
          Edit store info
        </Button>
      </div>
    </section>
  )
}
