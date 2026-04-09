import { Button, Card, KeyValueRow } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const CheckoutOrderSummarySidebar = ({
  summary,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
}) => {
  return (
    <Card className="h-fit space-y-sm lg:sticky lg:top-[132px]">
      <h2 className="text-lg font-semibold text-text-primary">Price Details</h2>

      <div className="space-y-2 border-t border-border pt-2 text-sm text-text-secondary">
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
          label="Delivery Charges"
          value={summary.deliveryCharges === 0 ? 'FREE' : formatPrice(summary.deliveryCharges)}
          valueClassName="font-semibold text-success"
        />
        <KeyValueRow
          label="Total Amount"
          value={formatPrice(summary.totalAmount)}
          className="border-t border-border pt-2 text-base font-semibold text-text-primary"
        />
      </div>

      <div className="rounded-md border border-success/25 bg-success-soft px-sm py-2 text-sm font-medium text-success">
        You will save {formatPrice(summary.totalDiscount)} on this order.
      </div>

      <Button fullWidth loading={actionLoading} disabled={actionDisabled || actionLoading} onClick={onAction}>
        {actionLabel}
      </Button>
    </Card>
  )
}

export default CheckoutOrderSummarySidebar
