import { Link } from 'react-router-dom'
import { Button, Card, PriceTag, RatingStars } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { getDefaultProductFallback, normalizeMediaUrl } from '@/shared/constants/media'
import { cn } from '@/shared/utils/cn'

const FALLBACK_IMAGE = getDefaultProductFallback(900, 80)

const getImage = (product) => {
  const first = normalizeMediaUrl(product?.images?.[0])
  return first || FALLBACK_IMAGE
}

const getPrimaryVariant = (product) => {
  const variants = product?.variants || []
  return variants.find((variant) => Number(variant?.stock || 0) > 0) || variants[0] || null
}

const getVariantPrices = (variant) => {
  const base = Number(variant?.price || 0)
  const discount = Number(variant?.discount || 0)
  const withEffective = Number(variant?.effectivePrice)
  const effective = Number.isFinite(withEffective)
    ? withEffective
    : base - (base * discount) / 100

  return {
    base,
    effective: Math.max(0, effective),
    discount: Math.max(0, discount),
  }
}

const getVariantColors = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const unique = []
  const seen = new Set()

  variants.forEach((variant) => {
    const key = `${variant?.colorName}-${variant?.colorCode}`
    if (!variant?.colorCode || seen.has(key)) return
    seen.add(key)
    unique.push({
      colorName: variant.colorName,
      colorCode: variant.colorCode,
      inStock: Number(variant?.stock || 0) > 0,
    })
  })

  return unique
}

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

const ProductShowcaseCard = ({
  product,
  detailTo,
  className,
  showWishlist = false,
  isWishlisted = false,
  wishlistDisabled = false,
  onToggleWishlist,
  showAddToCart = false,
  cartDisabled = false,
  addToCartLabel = 'Add to cart',
  onAddToCart,
  exploreLabel = 'Explore',
}) => {
  const variant = getPrimaryVariant(product)
  const prices = getVariantPrices(variant)
  const discount = prices.discount
  const variantColors = getVariantColors(product)
  const resolvedDetailLink = detailTo || ROUTES.PRODUCT_DETAIL.replace(':id', product?._id || '')

  return (
    <Card className={cn('group overflow-hidden p-0', className)}>
      <div className="relative">
        <Link to={resolvedDetailLink}>
          <img
            src={getImage(product)}
            alt={product?.name || 'Product image'}
            loading="lazy"
            decoding="async"
            className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        {discount > 0 ? (
          <span className="absolute left-sm top-sm rounded-full bg-danger px-2 py-1 text-[11px] font-semibold text-white">
            {Math.round(discount)}% OFF
          </span>
        ) : null}

        {showWishlist ? (
          <button
            type="button"
            disabled={wishlistDisabled}
            onClick={() => onToggleWishlist?.(product)}
            className="absolute right-sm top-sm inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated/90 text-text-primary transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon active={isWishlisted} />
          </button>
        ) : null}
      </div>

      <div className="space-y-2 p-md">
        <p className="text-xs uppercase tracking-wide text-text-muted">{product?.brand || 'Wear Web'}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{product?.name || 'Untitled product'}</h3>

        <PriceTag
          price={prices.effective}
          originalPrice={prices.base > prices.effective ? prices.base : undefined}
          size="sm"
        />

        {variantColors.length ? (
          <div className="flex items-center gap-1.5">
            {variantColors.slice(0, 5).map((color) => (
              <span
                key={`${color.colorName}-${color.colorCode}`}
                title={color.colorName}
                className={cn(
                  'inline-block h-4 w-4 rounded-full border',
                  color.inStock ? 'border-border-strong' : 'border-border opacity-45'
                )}
                style={{ backgroundColor: color.colorCode }}
                aria-label={color.colorName}
              />
            ))}
            {variantColors.length > 5 ? (
              <span className="text-xs text-text-muted">+{variantColors.length - 5}</span>
            ) : null}
          </div>
        ) : null}

        {Number(product?.totalReviews || 0) > 0 ? (
          <RatingStars
            rating={Number(product?.avgRating || 0)}
            totalReviews={Number(product?.totalReviews || 0)}
            size="sm"
          />
        ) : null}

        <div className={cn('grid gap-2', showAddToCart ? 'grid-cols-2' : 'grid-cols-1')}>
          {showAddToCart ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={cartDisabled || !variant?._id}
              onClick={() => onAddToCart?.(product, variant)}
            >
              {variant?._id ? addToCartLabel : 'Out of stock'}
            </Button>
          ) : null}

          <Button as={Link} size="sm" to={resolvedDetailLink} fullWidth>
            {exploreLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProductShowcaseCard
