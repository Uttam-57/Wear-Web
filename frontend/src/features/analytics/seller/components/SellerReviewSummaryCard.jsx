import { Card } from '@/shared/ui'

export default function SellerReviewSummaryCard({ reviews, loading }) {
  return (
    <Card className="space-y-sm">
      <h2 className="text-base font-semibold text-text-primary">Reviews</h2>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-surface-3" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-3" />
          <div className="h-4 w-36 animate-pulse rounded bg-surface-3" />
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-display text-text-primary">{Number(reviews.averageRating || 0).toFixed(1)}</p>
            <p className="pb-1 text-sm text-text-secondary">/ 5.0</p>
          </div>
          <p className="text-sm text-text-secondary">Total Reviews: {Number(reviews.totalReviews || 0).toLocaleString('en-IN')}</p>
          <p className="text-sm text-text-secondary">Response Rate: {Math.round(Number(reviews.responseRate || 0))}%</p>
        </>
      )}
    </Card>
  )
}
