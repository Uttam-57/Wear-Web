import { Button, RatingStars, Spinner } from '@/shared/ui'
import { formatDate } from '@/shared/utils/formatters'

export default function SellerProductReviewList({
  reviews,
  totalReviews,
  averageRating,
  reviewsLoading,
  reviewsError,
  canLoadMoreReviews,
  onLoadMoreReviews,
  onReplyReview,
}) {
  const hasReviewText = (review) => {
    const text = String(review?.body || review?.message || '').trim()
    return text.length > 0
  }

  return (
    <section className="space-y-md rounded-xl border border-border bg-surface-elevated p-md shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-text-primary">Customer reviews ({totalReviews})</h2>
          <RatingStars rating={averageRating} totalReviews={totalReviews} />
        </div>
      </div>

      {reviewsLoading ? (
        <div className="flex justify-center py-lg"><Spinner /></div>
      ) : reviewsError ? (
        <p className="rounded-lg border border-danger bg-danger-soft px-sm py-2 text-sm text-danger">{reviewsError}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-text-secondary">No reviews available for this product yet.</p>
      ) : (
        <div className="space-y-sm">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-lg border border-border bg-surface p-sm">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <p className="text-base font-semibold text-text-primary">{review.customerName || 'Verified Customer'}</p>
                  <p className="text-xs text-text-muted">{formatDate(review.createdAt)}</p>
                </div>
                <RatingStars rating={Number(review.rating || 0)} showCount={false} />
              </div>

              <p className="mt-2 text-sm text-text-primary">{review.title || 'Customer review'}</p>
              {hasReviewText(review) ? (
                <p className="mt-1 text-sm text-text-secondary">{review.body || review.message || ''}</p>
              ) : (
                <p className="mt-1 text-sm text-text-muted">Star-only rating. No written review.</p>
              )}

              {review?.sellerResponse?.text ? (
                <div className="mt-3 rounded-md border border-primary/35 bg-primary-soft/40 px-sm py-2">
                  <p className="text-sm font-medium text-primary">Your reply</p>
                  <p className="mt-1 text-sm text-text-secondary">{review.sellerResponse.text}</p>
                </div>
              ) : !hasReviewText(review) ? (
                <div className="mt-3 rounded-md border border-dashed border-border px-sm py-2">
                  <p className="text-sm text-text-secondary">Reply is not available for star-only ratings.</p>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-md border border-dashed border-border px-sm py-2">
                  <p className="text-sm text-text-secondary">You have not replied to this review yet.</p>
                  <Button variant="secondary" size="sm" onClick={() => onReplyReview?.(review)}>Reply review</Button>
                </div>
              )}
            </article>
          ))}

          {canLoadMoreReviews ? (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={onLoadMoreReviews}>Load more reviews</Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
