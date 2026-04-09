import { Button } from '@/shared/ui'

export default function SellerOrderRejectModal({
  open,
  orderNumber,
  reason,
  submitting = false,
  onReasonChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  const trimmedLength = String(reason || '').trim().length
  const canSubmit = trimmedLength >= 5 && !submitting

  return (
    <div className="fixed inset-0 z-[180]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/55"
        aria-label="Close reject order dialog"
        onClick={onCancel}
      />

      <section
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card"
      >
        <h2 className="text-lg font-semibold text-text-primary">Reject Order #{orderNumber}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Are you sure you want to reject this order? This action cannot be undone, the customer will be notified, and stock will be restored.
        </p>

        <div className="mt-md space-y-2">
          <label htmlFor="seller-reject-reason" className="text-sm font-medium text-text-primary">
            Reason for rejection (Required)
          </label>
          <textarea
            id="seller-reject-reason"
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange?.(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            placeholder="Tell the customer why this order is being rejected"
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Must be at least 5 characters.</span>
            <span>{trimmedLength} / 5</span>
          </div>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button
            variant="danger"
            loading={submitting}
            disabled={!canSubmit}
            onClick={onConfirm}
          >
            Confirm Rejection
          </Button>
        </div>
      </section>
    </div>
  )
}
