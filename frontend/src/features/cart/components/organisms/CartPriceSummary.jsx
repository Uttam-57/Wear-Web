import { Button, Card } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const CartPriceSummary = ({
  summary,
  busy,
  cartIsEmpty,
  onPlaceOrder,
}) => {
  return (
    <Card className="space-y-sm lg:sticky lg:top-[132px]">
      <h2 className="text-lg font-semibold text-text-primary">Price Details</h2>

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
          <span>Delivery Charges</span>
          <span className={summary.deliveryCharges === 0 ? 'font-semibold text-success' : 'font-semibold text-text-primary'}>
            {summary.deliveryCharges === 0 ? 'FREE' : formatPrice(summary.deliveryCharges)}
          </span>
        </div>

        {summary.deliveryCharges > 0 ? (
          <p className="rounded-md bg-warning-soft px-sm py-2 text-xs text-warning">
            Add items worth {formatPrice(summary.addMoreForFreeDelivery)} more to unlock FREE delivery.
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
          <span>Total Amount</span>
          <span>{formatPrice(summary.totalAmount)}</span>
        </div>
      </div>

      <div className="rounded-md border border-success/25 bg-success-soft px-sm py-2 text-sm font-medium text-success">
        You will save {formatPrice(summary.totalDiscount)} on this order.
      </div>

      {!cartIsEmpty ? (
        <Button
          fullWidth
          loading={busy}
          disabled={!summary.canCheckout || busy}
          onClick={onPlaceOrder}
        >
          {busy ? 'Processing...' : 'Place Order'}
        </Button>
      ) : (
        <p className="rounded-md bg-surface-secondary px-sm py-2 text-center text-sm text-text-secondary">Your cart is empty.</p>
      )}

      {summary.outOfStockCount > 0 ? (
        <p className="text-xs font-medium text-danger">Remove out-of-stock items to continue checkout.</p>
      ) : null}

      <div className="border-t border-border pt-2 text-xs text-text-secondary">
        <p>Safe and Secure Payments</p>
        <p>100% Payment Protection</p>
        <p>Easy Returns</p>
      </div>
    </Card>
  )
}

export default CartPriceSummary
