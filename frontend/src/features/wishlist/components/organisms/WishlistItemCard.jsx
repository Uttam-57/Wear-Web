import { Link } from 'react-router-dom'
import { Button, Checkbox, RatingStars } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { formatPrice } from '@/shared/utils/formatters'

const statusTone = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

const WishlistItemCard = ({
  item,
  checked,
  pending = false,
  onToggle,
  onAddToCart,
  onRemove,
  onNotify,
}) => {
  const productPath = ROUTES.PRODUCT_DETAIL.replace(':id', item.productId)

  return (
    <article className="rounded-xl border border-border bg-surface-elevated p-sm shadow-soft sm:p-md">
      <div className="grid grid-cols-[auto,96px,1fr] gap-sm sm:grid-cols-[auto,180px,1fr] sm:gap-md">
        <div className="pt-1">
          <Checkbox
            id={`wishlist-item-${item.id}`}
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
            disabled={pending || item.missingProduct}
            aria-label={`Select ${item.name}`}
          />
        </div>

        <Link to={productPath} className="block overflow-hidden rounded-lg border border-border bg-surface-secondary">
          <img
            src={item.image}
            alt={item.name}
            className={`h-[125px] w-full object-cover sm:h-[220px] ${item.stock.key === 'out' ? 'grayscale opacity-70' : ''}`}
          />
        </Link>

        <div className="space-y-2">
          <Link to={productPath} className="line-clamp-2 text-sm font-semibold text-text-primary hover:text-primary sm:text-base">
            {item.name}
          </Link>

          <div className="text-xs sm:text-sm">
            <RatingStars rating={item.rating} totalReviews={item.reviewsCount} size="sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-text-primary">{formatPrice(item.effectivePrice)}</span>
            {item.discount > 0 ? (
              <>
                <span className="text-sm text-text-muted line-through">{formatPrice(item.price)}</span>
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">{item.discount}% OFF</span>
              </>
            ) : null}
          </div>

          <p className={`text-sm font-medium ${statusTone[item.stock.tone] || 'text-text-secondary'}`}>
            {item.stock.label}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {item.stock.available ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending || item.missingProduct}
                onClick={onAddToCart}
              >
                Add to Cart
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={pending || item.missingProduct} onClick={onNotify}>
                Notify Me
              </Button>
            )}

            <Button size="sm" variant="ghost" disabled={pending} onClick={onRemove}>
              Remove
            </Button>
          </div>

          {item.colors.length > 0 || item.sizes.length > 0 ? (
            <p className="text-xs text-text-muted">
              {item.colors.length > 0 ? `${item.colors.length} color option(s)` : ''}
              {item.colors.length > 0 && item.sizes.length > 0 ? ' | ' : ''}
              {item.sizes.length > 0 ? `${item.sizes.length} size option(s)` : ''}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default WishlistItemCard
