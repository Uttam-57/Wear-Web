import { Button, Input } from '@/shared/ui'

export default function ReviewItemModal({
  reviewItem,
  reviewRating,
  reviewTitle,
  reviewBody,
  reviewSubmitting,
  onClose,
  onReviewRatingChange,
  onReviewTitleChange,
  onReviewBodyChange,
  onSubmit,
}) {
  if (!reviewItem) return null

  return (
    <div className="fixed inset-0 z-[150]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        aria-label="Close review modal"
      />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Write a Review</h2>
          <button type="button" onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary">Close</button>
        </div>

        <div className="mt-2 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">{reviewItem.productName}</p>
          <p>Size: {reviewItem.size}, Color: {reviewItem.colorName}</p>
        </div>

        <div className="mt-sm">
          <p className="mb-1 text-sm font-medium text-text-primary">Rating</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onReviewRatingChange(value)}
                className={`rounded-md border px-sm py-1 text-sm ${reviewRating >= value ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-secondary'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">Review Title</label>
          <Input
            value={reviewTitle}
            onChange={(event) => onReviewTitleChange(event.target.value)}
            placeholder="Great quality"
          />
        </div>

        <div className="mt-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">Your Review</label>
          <textarea
            rows={4}
            value={reviewBody}
            onChange={(event) => onReviewBodyChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            placeholder="Share your experience"
          />
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={reviewSubmitting}>Cancel</Button>
          <Button variant="primary" loading={reviewSubmitting} onClick={onSubmit}>Submit Review</Button>
        </div>
      </section>
    </div>
  )
}
