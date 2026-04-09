import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import { CANCEL_REASON_OPTIONS } from '@/features/orders/customer/utils/orderDetail.constants'

export default function CancelOrderModal({
  open,
  order,
  cancelReason,
  cancelComment,
  cancelSubmitting,
  onClose,
  onCancelReasonChange,
  onCancelCommentChange,
  onSubmit,
}) {
  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[150]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        aria-label="Close cancel modal"
      />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Cancel Order?</h2>
          <button type="button" onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary">Close</button>
        </div>

        <p className="mt-2 text-sm text-text-secondary">Order #{order.orderNumber}</p>
        <p className="text-sm text-text-secondary">{order.items.length} item(s) | Total: {formatPrice(order.pricing.totalAmount)}</p>

        <div className="mt-sm space-y-2">
          <p className="text-sm font-semibold text-text-primary">Reason for cancellation</p>
          {CANCEL_REASON_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="radio"
                name="cancel_reason"
                checked={cancelReason === option.value}
                onChange={() => onCancelReasonChange(option.value)}
                className="h-4 w-4 border-border accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">Additional Comments (Optional)</label>
          <textarea
            rows={3}
            value={cancelComment}
            onChange={(event) => onCancelCommentChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            placeholder="Tell us more"
          />
        </div>

        <div className="mt-sm rounded-md border border-border bg-surface-tertiary p-sm text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Refund Information</p>
          <p>Refund amount: {formatPrice(order.pricing.totalAmount)}</p>
          <p>Refund will be credited to your wallet.</p>
          <p>Estimated processing time: 5 to 7 business days.</p>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={cancelSubmitting}>Go Back</Button>
          <Button variant="danger" loading={cancelSubmitting} onClick={onSubmit}>Confirm Cancellation</Button>
        </div>
      </section>
    </div>
  )
}
