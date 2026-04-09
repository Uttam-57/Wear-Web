import { formatPrice } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'

/**
 * PriceTag molecule — formatted price display
 *
 * Uses: formatPrice() from shared/utils/formatters (domain layer)
 * Used by: ProductCard, CartItem, OrderCard, CheckoutSummary
 *
 * price:         number  — main price (required)
 * originalPrice: number  — crossed-out original if discounted (optional)
 * size:          'sm' | 'md' | 'lg'
 */
const PriceTag = ({ price, originalPrice, size = 'md', className }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }

  const hasDiscount = originalPrice && originalPrice > price

  return (
    <div className={cn('inline-flex items-baseline gap-sm flex-wrap', className)}>
      <span className={cn('font-semibold text-text-primary', sizes[size])}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-text-muted line-through">
            {formatPrice(originalPrice)}
          </span>
          <span className="text-xs font-medium text-success">
            {Math.round(((originalPrice - price) / originalPrice) * 100)}% off
          </span>
        </>
      )}
    </div>
  )
}

export default PriceTag