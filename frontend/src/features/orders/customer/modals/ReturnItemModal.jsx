import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import { getDefaultProductFallback } from '@/shared/constants/media'
import { RETURN_REASON_OPTIONS } from '@/features/orders/customer/utils/orderDetail.constants'

const FALLBACK_IMAGE = getDefaultProductFallback(500, 80)

export default function ReturnItemModal({
  returnItem,
  returnReason,
  returnComment,
  returnSubmitting,
  onClose,
  onReturnReasonChange,
  onReturnCommentChange,
  onSubmit,
}) {
  if (!returnItem) return null

  return (
    <div className="fixed inset-0 z-[150]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        aria-label="Close return modal"
      />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Return Item</h2>
          <button type="button" onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary">Close</button>
        </div>

        <div className="mt-2 grid gap-sm sm:grid-cols-[84px,1fr]">
          <img
            src={returnItem.imageUrl || FALLBACK_IMAGE}
            alt={returnItem.productName}
            className="h-24 w-20 rounded-lg border border-border object-cover"
          />
          <div className="text-sm text-text-secondary">
            <p className="font-semibold text-text-primary">{returnItem.productName}</p>
            <p>Size: {returnItem.size}, Color: {returnItem.colorName}</p>
            <p>Qty: {returnItem.quantity} x {formatPrice(returnItem.unitPrice)} = {formatPrice(returnItem.subtotal)}</p>
          </div>
        </div>

        <div className="mt-sm space-y-2">
          <p className="text-sm font-semibold text-text-primary">Reason for return</p>
          {RETURN_REASON_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="radio"
                name="return_reason"
                checked={returnReason === option.value}
                onChange={() => onReturnReasonChange(option.value)}
                className="h-4 w-4 border-border accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">Additional Details (Optional)</label>
          <textarea
            rows={3}
            value={returnComment}
            onChange={(event) => onReturnCommentChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            placeholder="Describe the issue"
          />
        </div>

        <div className="mt-sm rounded-md border border-border bg-surface-tertiary p-sm text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Return Pickup</p>
          <p>Free pickup from your delivery address.</p>
          <p>Pickup will be scheduled within 24 to 48 hours.</p>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={returnSubmitting}>Cancel</Button>
          <Button variant="primary" loading={returnSubmitting} onClick={onSubmit}>Submit Return Request</Button>
        </div>
      </section>
    </div>
  )
}
