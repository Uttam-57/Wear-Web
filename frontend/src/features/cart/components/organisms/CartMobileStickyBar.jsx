import { useState } from 'react'
import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const CartMobileStickyBar = ({
  summary,
  busy,
  cartIsEmpty,
  onPlaceOrder,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (cartIsEmpty) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 p-sm backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-sm">
          <button
            type="button"
            onClick={() => setShowBreakdown((prev) => !prev)}
            className="min-w-[120px] rounded-md border border-border bg-surface-secondary px-sm py-2 text-left"
          >
            <p className="text-[11px] uppercase tracking-wide text-text-muted">Total</p>
            <p className="text-sm font-semibold text-text-primary">{formatPrice(summary.totalAmount)}</p>
          </button>

          <Button
            fullWidth
            loading={busy}
            disabled={!summary.canCheckout || busy}
            onClick={onPlaceOrder}
          >
            {busy ? 'Processing...' : 'Place Order'}
          </Button>
        </div>
      </div>

      {showBreakdown ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-text-primary/50"
            onClick={() => setShowBreakdown(false)}
            aria-label="Close price details"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border border-border bg-surface-elevated p-md shadow-card">
            <div className="mb-sm flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Price Details</h3>
              <button
                type="button"
                className="rounded px-sm py-1 text-sm text-text-secondary hover:bg-surface-secondary"
                onClick={() => setShowBreakdown(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Price ({summary.totalItems} items)</span>
                <span>{formatPrice(summary.priceBeforeDiscount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="font-semibold text-success">- {formatPrice(summary.totalDiscount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span>{summary.deliveryCharges === 0 ? 'FREE' : formatPrice(summary.deliveryCharges)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
                <span>Total</span>
                <span>{formatPrice(summary.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default CartMobileStickyBar
