import { useState } from 'react'
import { Button, KeyValueRow } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const CheckoutMobileStickyBar = ({
  summary,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 p-sm backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-sm">
          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="min-w-[120px] rounded-md border border-border bg-surface-secondary px-sm py-2 text-left"
          >
            <p className="text-[11px] uppercase tracking-wide text-text-muted">Total</p>
            <p className="text-sm font-semibold text-text-primary">{formatPrice(summary.totalAmount)}</p>
          </button>
          <Button
            fullWidth
            loading={actionLoading}
            disabled={actionDisabled || actionLoading}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      </div>

      {showDetails ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-text-primary/50"
            onClick={() => setShowDetails(false)}
            aria-label="Close summary"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border border-border bg-surface-elevated p-md shadow-card">
            <div className="mb-sm flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Price Details</h3>
              <button
                type="button"
                className="rounded px-sm py-1 text-sm text-text-secondary hover:bg-surface-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <KeyValueRow
                label={`Price (${summary.totalItems} items)`}
                value={formatPrice(summary.priceBeforeDiscount)}
              />
              <KeyValueRow
                label="Discount"
                value={`- ${formatPrice(summary.totalDiscount)}`}
                valueClassName="font-semibold text-success"
              />
              <KeyValueRow
                label="Delivery"
                value={summary.deliveryCharges === 0 ? 'FREE' : formatPrice(summary.deliveryCharges)}
              />
              <KeyValueRow
                label="Total"
                value={formatPrice(summary.totalAmount)}
                className="border-t border-border pt-2 text-base font-semibold text-text-primary"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default CheckoutMobileStickyBar
