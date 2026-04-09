import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { formatPrice } from '@/shared/utils/formatters'
import { getDefaultProductFallback } from '@/shared/constants/media'
import {
  canBuyAgain,
  canTrackShipment,
  canWriteReview,
  getItemReturnWindow,
  getStatusText,
} from '@/features/orders/utils/orders.utils'
import { Button, Card } from '@/shared/ui'

const FALLBACK_IMAGE = getDefaultProductFallback(500, 80)

export default function OrderDetailItemCard({
  order,
  item,
  onOpenProduct,
  onOpenReturn,
  onOpenReview,
  onTrackShipment,
}) {
  const returnWindow = getItemReturnWindow(order, item, new Date())
  const hasProductLink = Boolean(item?.productId)

  const handleCardClick = () => {
    if (!hasProductLink) return
    onOpenProduct?.(item.productId)
  }

  const handleCardKeyDown = (event) => {
    if (!hasProductLink) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpenProduct?.(item.productId)
  }

  return (
    <Card
      className={`space-y-sm ${hasProductLink ? 'cursor-pointer transition-colors hover:bg-surface-tertiary/40' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={hasProductLink ? 'button' : undefined}
      tabIndex={hasProductLink ? 0 : undefined}
      aria-label={hasProductLink ? `Open ${item.productName}` : undefined}
    >
      <div className="grid gap-sm sm:grid-cols-[120px,1fr]">
        <img
          src={item.imageUrl || FALLBACK_IMAGE}
          alt={item.productName}
          className="h-[150px] w-[120px] rounded-lg border border-border object-cover"
          loading="lazy"
        />

        <div className="space-y-1">
          <p className="text-base font-semibold text-text-primary">{item.productName}</p>
          <p className="text-sm text-text-secondary">Size: {item.size}, Color: {item.colorName}</p>
          <p className="text-sm text-text-secondary">Quantity: {item.quantity}</p>
          <p className="text-sm text-text-secondary">
            Price: {formatPrice(item.unitPrice)} x {item.quantity} = <span className="font-semibold text-text-primary">{formatPrice(item.subtotal)}</span>
          </p>
          {item.sellerName && item.sellerName !== '-' ? <p className="text-sm text-text-secondary">Seller: {item.sellerName}</p> : null}

          <div className="mt-2 rounded-md border border-border bg-surface-tertiary px-sm py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Delivery Status</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{getStatusText(order)}</p>
            {returnWindow.message ? <p className="mt-1 text-xs text-text-secondary">{returnWindow.message}</p> : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
            {canTrackShipment(order) ? (
              <Button size="sm" variant="secondary" onClick={onTrackShipment}>Track Shipment</Button>
            ) : null}

            {canWriteReview(order) ? (
              <Button size="sm" variant="secondary" onClick={() => onOpenReview(item)}>Write Review</Button>
            ) : null}

            {returnWindow.isEligible ? (
              <Button size="sm" variant="secondary" onClick={() => onOpenReturn(item)}>Return Item</Button>
            ) : null}

            {canBuyAgain(order) && item.productId ? (
              <Button
                as={Link}
                size="sm"
                variant="ghost"
                to={ROUTES.PRODUCT_DETAIL.replace(':id', item.productId)}
              >
                Buy Again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
