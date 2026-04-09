import { Button } from '@/shared/ui'

export default function ReturnActionModal({
  open,
  action,
  order,
  note,
  otp,
  submitting,
  onNoteChange,
  onOtpChange,
  onClose,
  onConfirm,
  returnActions,
  getPublicOrderNumber,
}) {
  if (!open || !action || !order) return null

  const actionMeta = returnActions[action]
  if (!actionMeta) return null

  const needsOtp = action === 'picked'
  const needsReason = action === 'reject'

  const noteLength = String(note || '').trim().length
  const canSubmit = !submitting
    && (!needsReason || noteLength >= 5)
    && (!needsOtp || String(otp || '').trim().length >= 4)

  return (
    <div className="fixed inset-0 z-[180]">
      <button type="button" className="absolute inset-0 bg-text-primary/55" onClick={onClose} aria-label="Close return action modal" />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">{actionMeta.label}</h2>
        <p className="mt-1 text-sm text-text-secondary">Order {getPublicOrderNumber(order)}</p>

        {needsOtp ? (
          <div className="mt-md space-y-2">
            <label htmlFor="admin-return-otp" className="text-sm font-medium text-text-primary">Pickup OTP</label>
            <input
              id="admin-return-otp"
              value={otp}
              onChange={(event) => onOtpChange(event.target.value)}
              className="h-[42px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
              placeholder="Enter customer OTP"
            />
          </div>
        ) : null}

        <div className="mt-md space-y-2">
          <label htmlFor="admin-return-note" className="text-sm font-medium text-text-primary">
            Admin Note {needsReason ? '(required, min 5 chars)' : '(optional)'}
          </label>
          <textarea
            id="admin-return-note"
            rows={3}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
            placeholder="Add context for seller and customer notifications"
          />
          {needsReason ? (
            <p className="text-xs text-text-muted">{noteLength} / 5 characters</p>
          ) : null}
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onConfirm} loading={submitting} disabled={!canSubmit}>{actionMeta.label}</Button>
        </div>
      </section>
    </div>
  )
}
