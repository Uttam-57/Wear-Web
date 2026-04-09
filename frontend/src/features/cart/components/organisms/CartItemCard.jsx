import { Link } from 'react-router-dom'
import { Button, Checkbox } from '@/shared/ui'
import CartQuantityControl from '@/features/cart/components/molecules/CartQuantityControl'
import { ROUTES } from '@/shared/constants/routes'
import { formatPrice } from '@/shared/utils/formatters'

const CartItemCard = ({
  item,
  checked,
  pending = false,
  onToggle,
  onQuantityChange,
  onSaveForLater,
  onRemove,
  onNotify,
  onMaxReached,
}) => {
  const productPath = ROUTES.PRODUCT_DETAIL.replace(':id', item.productId)

  return (
    <article className="rounded-xl border border-border bg-surface-elevated p-sm shadow-soft sm:p-md">
      <div className="grid grid-cols-[auto,88px,1fr] gap-sm sm:grid-cols-[auto,120px,1fr] sm:gap-md">
        <div className="pt-1">
          <Checkbox
            id={`cart-item-${item.id}`}
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
            disabled={item.isOutOfStock || pending}
            aria-label={`Select ${item.name}`}
          />
        </div>

        <Link to={productPath} className="block overflow-hidden rounded-lg border border-border bg-surface-secondary">
          <img
            src={item.image}
            alt={item.name}
            className={`h-[110px] w-full object-cover sm:h-[150px] ${item.isOutOfStock ? 'grayscale opacity-65' : ''}`}
          />
        </Link>

        <div className="space-y-2">
          <Link to={productPath} className="line-clamp-2 text-sm font-semibold text-text-primary hover:text-primary sm:text-base">
            {item.name}
          </Link>

          <p className="text-xs text-text-secondary sm:text-sm">
            Color: <span className="font-medium text-text-primary">{item.colorName}</span>
            <span className="mx-2 text-border-strong">|</span>
            Size: <span className="font-medium text-text-primary">{item.size}</span>
          </p>

          <p className="text-xs text-text-secondary sm:text-sm">
            Seller:{' '}
            <Link to={item.sellerPath} className="font-medium text-text-primary hover:text-primary">
              {item.sellerName}
            </Link>
          </p>

          <div className="border-t border-border pt-2">
            {item.isOutOfStock ? (
              <p className="text-sm font-semibold text-danger">OUT OF STOCK</p>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">{formatPrice(item.effectivePrice)}</span>
                  {item.discount > 0 ? (
                    <>
                      <span className="text-sm text-text-muted line-through">{formatPrice(item.price)}</span>
                      <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">{item.discount}% OFF</span>
                    </>
                  ) : null}
                </div>
                <p className="text-xs text-text-secondary">
                  {formatPrice(item.effectivePrice)} x {item.quantity} = {formatPrice(item.effectiveTotal)}
                </p>
              </div>
            )}
          </div>

          {item.isOutOfStock ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={onNotify} disabled={pending}>Notify Me</Button>
              <Button size="sm" variant="ghost" onClick={onRemove} disabled={pending}>Remove</Button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <CartQuantityControl
                  key={`${item.id}-${item.quantity}`}
                  value={item.quantity}
                  max={item.maxQuantity}
                  disabled={pending}
                  loading={pending}
                  onCommit={onQuantityChange}
                  onMaxReached={onMaxReached}
                />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={onSaveForLater} disabled={pending}>Save for Later</Button>
                  <Button size="sm" variant="ghost" onClick={onRemove} disabled={pending}>Remove</Button>
                </div>
              </div>

              {item.isLowStock ? (
                <p className="text-xs font-medium text-warning">Only {item.stock} item(s) left in stock</p>
              ) : null}

              {item.isVariantUnavailable ? (
                <p className="text-xs font-medium text-danger">This variant is no longer available. Remove it to continue.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default CartItemCard
