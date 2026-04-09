import { cn } from '@/shared/utils/cn'

/**
 * RatingStars molecule — read-only star rating display
 *
 * Used by: ProductCard, ProductDetail, ReviewList
 * NOTE: rating and totalReviews must come from backend — never compute client-side
 *
 * rating:       number  — average rating (0–5), e.g. 4.3
 * totalReviews: number  — review count shown beside stars
 * size:         'sm' | 'md'
 * showCount:    boolean — show "(N reviews)" beside stars
 */
const RatingStars = ({ rating = 0, totalReviews = 0, size = 'md', showCount = true, className }) => {
  const clamped = Math.min(Math.max(rating, 0), 5)
  const fullStars = Math.floor(clamped)
  const hasHalf   = clamped - fullStars >= 0.5

  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className={cn('inline-flex items-center gap-xs', className)} aria-label={`${clamped} out of 5 stars`}>
      <div className="flex items-center gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= fullStars
          const half   = !filled && i === fullStars + 1 && hasHalf

          return (
            <svg
              key={i}
              className={cn(
                starSize,
                filled ? 'text-warning' : half ? 'text-warning' : 'text-border-strong'
              )}
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              {half ? (
                // Half star using clipPath
                <defs>
                  <clipPath id={`half-${i}`}>
                    <rect x="0" y="0" width="10" height="20" />
                  </clipPath>
                </defs>
              ) : null}
              {/* Full or empty star */}
              <path
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
              {/* Half fill overlay */}
              {half && (
                <path
                  fill="currentColor"
                  clipPath={`url(#half-${i})`}
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              )}
            </svg>
          )
        })}
      </div>

      {showCount && totalReviews > 0 && (
        <span className="text-xs text-text-muted">
          ({totalReviews.toLocaleString()})
        </span>
      )}
    </div>
  )
}

export default RatingStars