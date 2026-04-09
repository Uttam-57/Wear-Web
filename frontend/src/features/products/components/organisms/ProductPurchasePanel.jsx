import { Button, PriceTag, QuantityInput, RatingStars } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'
import { formatPrice } from '@/shared/utils/formatters'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/app'

const getStockLabel = (stock) => {
  if (stock <= 0) return { text: 'Out of stock', tone: 'text-danger' }
  if (stock <= 10) return { text: `Only ${stock} left!`, tone: 'text-danger' }
  return { text: 'In stock', tone: 'text-success' }
}

const ProductPurchasePanel = ({
  product,
  selectedVariant,
  selectedColor,
  selectedSize,
  colorOptions,
  sizeOptions,
  quantity,
  setQuantity,
  onSelectColor,
  onSelectSize,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  isLoggedIn,
  user,
  deliveryThreshold = 499,
  showManageProductButton = true,
}) => {
  const variantPrice = Number(selectedVariant?.effectivePrice || selectedVariant?.price || 0)
  const basePrice = Number(selectedVariant?.price || variantPrice)
  const discount = Number(selectedVariant?.discount || 0)
  const stock = Number(selectedVariant?.stock || 0)

  const stockLabel = getStockLabel(stock)

  const isCustomer = isLoggedIn && user?.role === ROLES.CUSTOMER
  const isSeller = isLoggedIn && user?.role === ROLES.SELLER
  const isAdmin = isLoggedIn && user?.role === ROLES.ADMIN
  const sellerOwnsProduct = isSeller && String(product?.sellerId?._id || product?.sellerId || '') === String(user?._id || '')

  return (
    <section className="space-y-md rounded-xl border border-border bg-surface-elevated p-md shadow-card">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{product?.brand || 'WearWeb'}</p>
        <h1 className="text-2xl font-display text-text-primary md:text-3xl">{product?.name}</h1>

        {Number(product?.totalReviews || 0) > 0 ? (
          <div className="flex items-center gap-2">
            <RatingStars rating={Number(product?.avgRating || 0)} totalReviews={Number(product?.totalReviews || 0)} />
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <PriceTag price={variantPrice} originalPrice={basePrice > variantPrice ? basePrice : undefined} size="lg" />
        {discount > 0 ? <p className="text-xs font-semibold text-danger">{discount}% OFF</p> : null}
        <p className="text-xs text-text-muted">Inclusive of all taxes</p>
        <p className="text-xs text-success">Free Delivery on orders above {formatPrice(deliveryThreshold)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Select Color</p>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.colorName}
              type="button"
              disabled={!color.inStock}
              onClick={() => onSelectColor(color.colorName)}
              className={cn(
                'flex items-center gap-2 rounded-md border px-sm py-1.5 text-sm transition',
                selectedColor === color.colorName ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-text-secondary',
                !color.inStock && 'cursor-not-allowed opacity-40'
              )}
            >
              <span className="inline-block h-4 w-4 rounded-full border border-border" style={{ backgroundColor: color.colorCode }} />
              <span>{color.colorName}</span>
              <span className="text-xs text-text-muted">{color.stockLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Select Size</p>
          <button type="button" className="text-xs text-primary hover:text-primary-hover">Size Guide</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((item) => (
            <button
              key={item.size}
              type="button"
              disabled={item.stock <= 0}
              onClick={() => onSelectSize(item.size)}
              className={cn(
                'rounded-md border px-sm py-1 text-sm transition',
                selectedSize === item.size ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-text-secondary',
                item.stock <= 0 && 'cursor-not-allowed line-through opacity-40'
              )}
            >
              {item.size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-tertiary px-md py-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Quantity</p>
          <p className={cn('text-sm', stockLabel.tone)}>{stockLabel.text}</p>
        </div>

        <QuantityInput value={quantity} onChange={setQuantity} min={1} max={Math.max(1, stock)} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!isCustomer || stock <= 0} onClick={onAddToCart}>
          Add to Cart
        </Button>
        <Button variant="secondary" disabled={!isCustomer || stock <= 0} onClick={onBuyNow}>
          Buy Now
        </Button>
      </div>

      <Button variant="secondary" fullWidth onClick={onToggleWishlist}>
        {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>

      {!isLoggedIn ? (
        <p className="text-xs text-text-muted">Please login to purchase or wishlist. <a href={ROUTES.LOGIN} className="font-semibold text-primary">Go to Login</a></p>
      ) : null}

      {isSeller ? (
        <p className="text-xs text-warning">Sellers cannot purchase products.</p>
      ) : null}

      {sellerOwnsProduct && showManageProductButton ? (
        <Button as={Link} to={ROUTES.SELLER_PRODUCTS} variant="secondary" fullWidth>
          Manage Your Product
        </Button>
      ) : null}

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" disabled>Hold Product</Button>
          <Button variant="danger" size="sm" disabled>Remove Product</Button>
        </div>
      ) : null}
    </section>
  )
}

export default ProductPurchasePanel
