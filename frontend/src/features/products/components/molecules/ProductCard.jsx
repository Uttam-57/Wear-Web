import { Link } from 'react-router-dom'
import { Button, PriceTag, RatingStars } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { getDefaultProductFallback } from '@/shared/constants/media'
import { cn } from '@/shared/utils/cn'
import ProductBadge from '@/features/products/components/atoms/ProductBadge'
import {
  getPrimaryVariant,
  getProductImages,
  getVariantPricing,
  isProductNew,
} from '@/features/products/utils/productBrowse.utils'

const HeartIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={cn('h-4 w-4', active ? 'fill-danger text-danger' : 'fill-none text-text-primary')} aria-hidden="true">
    <path
      d="M12 20.2 4.9 13.4a4.8 4.8 0 0 1 0-6.9 5.1 5.1 0 0 1 7.1 0L12 7l.1-.5a5.1 5.1 0 0 1 7.1 0 4.8 4.8 0 0 1 0 6.9L12 20.2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const resolveDetailLink = (productId) => ROUTES.PRODUCT_DETAIL.replace(':id', productId)
const FALLBACK_IMAGE = getDefaultProductFallback(900, 80)

const ProductCard = ({
  product,
  view = 'grid',
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  showQuickView = true,
  showWishlist = true,
  showAddToCart = true,
  detailTo,
  statusBadges = [],
  disableDetailLink = false,
  onDetailBlocked,
}) => {
  const detailLink = detailTo || resolveDetailLink(product?._id || '')
  const images = getProductImages(product)
  const primaryImage = images[0] || FALLBACK_IMAGE
  const secondaryImage = images[1] || primaryImage

  const variant = getPrimaryVariant(product)
  const pricing = getVariantPricing(variant)
  const hasDiscount = pricing.discount > 0
  const isNew = isProductNew(product?.createdAt)

  const colorNames = Array.from(new Set((product?.variants || []).map((item) => item?.colorName).filter(Boolean)))
  const sizeNames = Array.from(new Set((product?.variants || []).map((item) => item?.size).filter(Boolean)))

  const canAddToCart = variant?._id && Number(variant?.stock || 0) > 0

  const handleDetailClick = (event) => {
    if (!disableDetailLink) return
    event.preventDefault()
    onDetailBlocked?.(product)
  }

  if (view === 'list') {
    return (
      <article className="group overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-card">
        <div className="grid gap-md p-md sm:grid-cols-[220px,1fr]">
          <Link
            to={detailLink}
            onClick={handleDetailClick}
            className={cn('relative block overflow-hidden rounded-lg bg-surface-tertiary', disableDetailLink && 'cursor-not-allowed')}
          >
            <img
              src={primaryImage}
              alt={product?.name}
              className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {hasDiscount ? (
              <span className="absolute right-sm top-sm"><ProductBadge variant="danger">{Math.round(pricing.discount)}% OFF</ProductBadge></span>
            ) : null}
          </Link>

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  to={detailLink}
                  onClick={handleDetailClick}
                  className={cn('text-lg font-semibold text-text-primary hover:text-primary', disableDetailLink && 'cursor-not-allowed')}
                >
                  {product?.name}
                </Link>
                {Number(product?.totalReviews || 0) > 0 ? (
                  <RatingStars rating={Number(product?.avgRating || 0)} totalReviews={Number(product?.totalReviews || 0)} />
                ) : null}
              </div>

              {showWishlist ? (
                <button
                  type="button"
                  onClick={() => onToggleWishlist?.(product)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-primary hover:border-danger hover:text-danger"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <HeartIcon active={isWishlisted} />
                </button>
              ) : null}
            </div>

            <PriceTag
              price={pricing.effective}
              originalPrice={pricing.base > pricing.effective ? pricing.base : undefined}
              size="lg"
            />

            <div className="space-y-1 text-sm text-text-secondary">
              {statusBadges.length ? (
                <div className="flex flex-wrap gap-1 pb-1">
                  {statusBadges.map((badge, index) => (
                    <ProductBadge key={`${badge.label}-${index}`} variant={badge.variant || 'neutral'}>
                      {badge.label}
                    </ProductBadge>
                  ))}
                </div>
              ) : null}
              <p>Available in {colorNames.length || 1} colors: {colorNames.slice(0, 4).join(', ') || '-'}</p>
              <p>Sizes: {sizeNames.join(', ') || '-'}</p>
              {product?.specifications?.length ? <p>{product.specifications.slice(0, 2).map((item) => `${item.key}: ${item.value}`).join(' | ')}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {disableDetailLink ? (
                <Button size="sm" variant="secondary" onClick={() => onDetailBlocked?.(product)}>
                  View Disabled
                </Button>
              ) : (
                <Button as={Link} to={detailLink} size="sm">View Details</Button>
              )}
              {showAddToCart ? (
                <Button variant="secondary" size="sm" disabled={!canAddToCart} onClick={() => onAddToCart?.(product, variant)}>
                  {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              ) : null}
              {isNew ? <ProductBadge variant="success">New</ProductBadge> : null}
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-card">
      <div className="relative">
        <Link
          to={detailLink}
          onClick={handleDetailClick}
          className={cn('block overflow-hidden bg-surface-tertiary', disableDetailLink && 'cursor-not-allowed')}
        >
          <img
            src={primaryImage}
            alt={product?.name}
            className="h-64 w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            loading="lazy"
          />
          <img
            src={secondaryImage}
            alt={`${product?.name} alternate`}
            className="pointer-events-none absolute inset-0 hidden h-64 w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block"
            loading="lazy"
          />
        </Link>

        <div className="pointer-events-none absolute left-sm top-sm flex flex-col gap-1">
          {isNew ? <ProductBadge variant="success">New</ProductBadge> : null}
          {statusBadges.map((badge, index) => (
            <ProductBadge key={`${badge.label}-${index}`} variant={badge.variant || 'neutral'}>{badge.label}</ProductBadge>
          ))}
        </div>

        {hasDiscount ? (
          <span className="absolute right-sm top-sm"><ProductBadge variant="danger">{Math.round(pricing.discount)}% OFF</ProductBadge></span>
        ) : null}

        {showWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist?.(product)}
            className="absolute left-sm top-12 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated/90 text-text-primary hover:border-danger hover:text-danger"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon active={isWishlisted} />
          </button>
        ) : null}

        {showQuickView ? (
          <Link
            to={detailLink}
            onClick={handleDetailClick}
            className={cn(
              'absolute bottom-sm left-1/2 hidden -translate-x-1/2 rounded-full border border-white/70 bg-white/92 px-md py-1.5 text-xs font-semibold text-text-primary shadow-lg backdrop-blur-sm opacity-0 transition group-hover:opacity-100 sm:block',
              disableDetailLink && 'cursor-not-allowed'
            )}
          >
            Quick View
          </Link>
        ) : null}
      </div>

      <div className="space-y-2 p-md">
        <Link
          to={detailLink}
          onClick={handleDetailClick}
          className={cn('line-clamp-2 text-sm font-semibold text-text-primary hover:text-primary', disableDetailLink && 'cursor-not-allowed')}
        >
          {product?.name || 'Untitled Product'}
        </Link>

        {Number(product?.totalReviews || 0) > 0 ? (
          <RatingStars rating={Number(product?.avgRating || 0)} totalReviews={Number(product?.totalReviews || 0)} size="sm" />
        ) : null}

        <PriceTag
          price={pricing.effective}
          originalPrice={pricing.base > pricing.effective ? pricing.base : undefined}
          size="md"
        />

        {pricing.effective >= 499 ? <p className="text-xs text-success">Free Delivery</p> : null}

        <p className="text-xs text-text-secondary">{colorNames.length || 1} colors available</p>
      </div>
    </article>
  )
}

export default ProductCard
