import { Link } from 'react-router-dom'
import { Badge, Button, Card, KeyValueRow, PageLoadingState, PageMessageState } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { getDefaultProductFallback } from '@/shared/constants/media'
import {
  formatDate,
  formatDateTime,
  formatOrderStatus,
  formatPrice,
} from '@/shared/utils/formatters'
import useCheckoutConfirmationPage from '@/features/checkout/hooks/useCheckoutConfirmationPage'
import { addBusinessDays, formatAddressPreview } from '@/features/checkout/utils/checkout.utils'

const fallbackImage = getDefaultProductFallback(400, 80)

const paymentStatusMeta = (status) => {
  if (status === 'succeeded' || status === 'paid') return { label: 'Paid', variant: 'success' }
  if (status === 'failed') return { label: 'Failed', variant: 'danger' }
  if (status === 'refunded' || status === 'partially_refunded') return { label: 'Refunded', variant: 'warning' }
  return { label: 'Pending', variant: 'warning' }
}

export default function CheckoutConfirmationPage() {
  const {
    loading,
    error,
    orders,
    primaryOrder,
    lineItems,
    totals,
    payment,
  } = useCheckoutConfirmationPage()

  if (loading) {
    return <PageLoadingState />
  }

  if (error || !primaryOrder) {
    return (
      <PageMessageState
        message={error || 'Order details are not available right now.'}
        action={<Button as={Link} to={ROUTES.ORDERS}>View My Orders</Button>}
      />
    )
  }

  const orderIds = orders.map((order) => order._id)
  const estimatedDelivery = formatDate(addBusinessDays(new Date(primaryOrder.createdAt), 7))
  const paymentInfo = paymentStatusMeta(payment?.status || primaryOrder.paymentStatus)
  const paymentAmount = payment?.amount ? Number(payment.amount) / 100 : totals.totalPaid

  return (
    <div className="page-shell space-y-md pb-xl">
      <Card className="space-y-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success-soft text-3xl text-success">
          ✓
        </div>

        <div>
          <h1 className="section-title">Order Placed Successfully</h1>
          <p className="section-subtitle">Thank you for shopping with WearWeb.</p>
        </div>

        <div className="space-y-1 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Order Reference: {primaryOrder._id}</p>
          <p>Placed on {formatDateTime(primaryOrder.createdAt)}</p>
          {orderIds.length > 1 ? <p>{orderIds.length} seller order(s) were created for this checkout.</p> : null}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button as={Link} to={ROUTES.ORDER_DETAIL.replace(':id', primaryOrder._id)}>
            Track Order
          </Button>
          <Button as={Link} to={ROUTES.ORDERS} variant="secondary">
            View All Orders
          </Button>
        </div>
      </Card>

      <section className="grid gap-md lg:grid-cols-[1.35fr,1fr]">
        <div className="space-y-md">
          <Card className="space-y-sm">
            <h2 className="text-lg font-semibold text-text-primary">Delivery Details</h2>
            <div className="rounded-md border border-border bg-surface-secondary p-sm text-sm text-text-secondary">
              <p className="font-semibold text-text-primary">{primaryOrder.addressSnapshot?.fullName}</p>
              <p>{formatAddressPreview(primaryOrder.addressSnapshot)}</p>
              <p>Phone: {primaryOrder.addressSnapshot?.phone}</p>
              <p className="mt-2 font-medium text-text-primary">Expected Delivery: {estimatedDelivery}</p>
            </div>
          </Card>

          <Card className="space-y-sm">
            <h2 className="text-lg font-semibold text-text-primary">Order Summary</h2>
            <div className="space-y-sm">
              {lineItems.map((item) => (
                <article key={`${item.orderId}_${item.variantId}`} className="rounded-xl border border-border bg-surface-secondary p-sm sm:p-md">
                  <div className="grid grid-cols-1 gap-sm sm:grid-cols-[120px,1fr] sm:gap-md lg:grid-cols-[120px,1fr,220px]">
                    <div className="flex flex-col items-start gap-2">
                      <img
                        src={item.image || fallbackImage}
                        alt={item.productName}
                        className="h-[130px] w-[110px] rounded-lg border border-border object-cover"
                        loading="lazy"
                      />
                      <p className="text-sm font-medium text-text-secondary">
                        Qty: <span className="font-semibold text-text-primary">{item.quantity}</span>
                      </p>
                    </div>

                    <div className="min-w-0 space-y-2">
                      <p className="line-clamp-2 text-base font-semibold text-text-primary">{item.productName}</p>
                      <p className="text-sm text-text-secondary">
                        Size: <span className="font-medium text-text-primary">{item.size}</span>
                      </p>
                      <p className="text-sm text-text-secondary">
                        Color: <span className="font-medium text-text-primary">{item.colorName}</span>
                      </p>
                      <p className="text-xs text-text-secondary">Order Ref: {item.orderId}</p>

                      <div className="border-t border-border pt-2">
                        <p className="text-sm font-semibold text-text-primary">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-surface-elevated p-sm text-sm text-text-secondary lg:ml-auto lg:w-full">
                      <p className="text-xs uppercase tracking-wide text-text-muted">Delivery</p>
                      <p className="mt-1 font-semibold text-text-primary">Expected by {estimatedDelivery}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-text-muted">Status</p>
                      <p className="mt-1 font-medium text-text-primary">{formatOrderStatus(primaryOrder.status)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-md">
          <Card className="space-y-sm">
            <h2 className="text-lg font-semibold text-text-primary">Payment Details</h2>

            <div className="space-y-2 text-sm text-text-secondary">
              <KeyValueRow
                label="Payment Method"
                value="Card (Stripe)"
              />

              <KeyValueRow
                label="Transaction ID"
                value={(
                  <span className="max-w-[190px] truncate text-text-primary" title={payment?.stripePaymentIntentId || ''}>
                    {payment?.stripePaymentIntentId || 'Will be available shortly'}
                  </span>
                )}
              />

              <KeyValueRow
                label="Payment Status"
                value={<Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>}
              />

              <KeyValueRow
                label="Order Status"
                value={formatOrderStatus(primaryOrder.status)}
                className="border-t border-border pt-2"
                valueClassName="font-semibold text-text-primary"
              />

              <KeyValueRow
                label="Items Total"
                value={formatPrice(totals.itemsTotal)}
              />
              <KeyValueRow
                label="Discount"
                value={`- ${formatPrice(totals.discount)}`}
                valueClassName="font-semibold text-success"
              />
              <KeyValueRow
                label="Delivery"
                value="FREE"
                valueClassName="font-semibold text-success"
              />
              <KeyValueRow
                label="Total Paid"
                value={formatPrice(paymentAmount)}
                className="border-t border-border pt-2 text-base font-semibold text-text-primary"
              />
            </div>
          </Card>

        </div>
      </section>
    </div>
  )
}
