import { Tabs, RatingStars, Button, Spinner } from '@/shared/ui'
import { formatDate } from '@/shared/utils/formatters'

const renderSpecs = (product) => {
  const specs = product?.specifications || []
  if (!specs.length) return <p className="text-sm text-text-secondary">No specifications available.</p>

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {specs.map((item) => (
        <div key={`${item.key}-${item.value}`} className="rounded-md border border-border bg-surface-tertiary px-sm py-2">
          <dt className="text-xs uppercase tracking-wide text-text-muted">{item.key}</dt>
          <dd className="text-sm text-text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const ProductTabsSection = ({
  product,
  reviews,
  reviewsLoading,
  reviewsError,
  canLoadMoreReviews,
  onLoadMoreReviews,
  includeReviews = true,
}) => {
  const detailsContent = (
    <div className="space-y-3 text-sm text-text-secondary">
      <p>{product?.description || 'No description available.'}</p>

      {(product?.tags || []).length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Key Features</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {product.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Return Policy</p>
        <p className="mt-1">{product?.returnPolicy?.returnable ? 'Returnable' : 'Not returnable'}</p>
        <p>Window: {product?.returnPolicy?.returnWindow ?? '-'} days</p>
      </div>
    </div>
  )

  const specificationsContent = (
    <div className="space-y-md text-sm text-text-secondary">
      <div className="grid gap-2 sm:grid-cols-2">
        <p><span className="font-medium text-text-primary">Brand:</span> {product?.brand || '-'}</p>
        <p><span className="font-medium text-text-primary">Gender:</span> {product?.gender || '-'}</p>
        <p><span className="font-medium text-text-primary">Category:</span> {product?.categoryId?.name || '-'}</p>
        <p><span className="font-medium text-text-primary">Tags:</span> {(product?.tags || []).join(', ') || '-'}</p>
      </div>

      {renderSpecs(product)}
    </div>
  )

  const reviewsContent = (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">Customer Reviews ({Number(product?.totalReviews || 0)})</h3>
          <RatingStars rating={Number(product?.avgRating || 0)} totalReviews={Number(product?.totalReviews || 0)} />
        </div>
      </div>

      {reviewsLoading ? (
        <div className="flex justify-center py-lg"><Spinner /></div>
      ) : reviewsError ? (
        <p className="rounded-md border border-danger bg-danger-soft px-sm py-2 text-sm text-danger">{reviewsError}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-text-secondary">No reviews yet for this product.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-lg border border-border bg-surface-tertiary p-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStars rating={Number(review?.rating || 0)} showCount={false} />
                <span className="text-xs text-text-muted">{formatDate(review?.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-text-primary">{review?.title || 'Customer Review'}</p>
              <p className="mt-1 text-sm text-text-secondary">{review?.body || review?.message || ''}</p>
              <p className="mt-2 text-xs text-text-muted">By {review?.customerName || 'Verified Customer'}</p>
            </article>
          ))}

          {canLoadMoreReviews ? (
            <Button variant="secondary" size="sm" onClick={onLoadMoreReviews}>Load More Reviews</Button>
          ) : null}
        </div>
      )}
    </div>
  )

  const tabItems = [
    { value: 'details', label: 'Product Details', content: detailsContent },
    { value: 'specs', label: 'Specifications', content: specificationsContent },
  ]

  if (includeReviews) {
    tabItems.push({ value: 'reviews', label: `Reviews (${Number(product?.totalReviews || 0)})`, content: reviewsContent })
  }

  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-md shadow-soft">
      <Tabs
        items={tabItems}
        defaultValue="details"
      />
    </section>
  )
}

export default ProductTabsSection
