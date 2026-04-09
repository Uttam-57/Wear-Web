import { formatPrice } from '@/shared/utils/formatters'
import { getCheckoutProductFallback } from '@/shared/constants/media'

const fallbackImage = getCheckoutProductFallback(480, 80)

const CheckoutOrderItemsGrid = ({ items, expectedDeliveryText }) => {
  if (!items?.length) {
    return <p className="text-sm text-text-secondary">No products available for review.</p>
  }

  return (
    <div className="space-y-sm">
      {items.map((item) => (
        <article key={item.id} className="w-full rounded-lg border border-border bg-surface-secondary p-sm sm:p-md">
          <div className="flex items-start gap-3">
            <img
              src={item.image || fallbackImage}
              alt={item.name}
              className="h-24 w-20 rounded object-cover"
              loading="lazy"
            />

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{item.name}</h3>
              <p className="mt-1 text-xs text-text-secondary">Size: {item.size} • Color: {item.colorName}</p>
              <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
              <p className="mt-1 text-xs font-semibold text-text-primary">
                {formatPrice(item.effectivePrice)} × {item.quantity} = {formatPrice(item.subtotal)}
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-border pt-2 text-xs text-text-secondary">
            Expected Delivery: {expectedDeliveryText}
          </div>
        </article>
      ))}
    </div>
  )
}

export default CheckoutOrderItemsGrid
