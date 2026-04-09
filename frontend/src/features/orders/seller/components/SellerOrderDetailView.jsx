import { Badge, Button, Card, Input } from '@/shared/ui'
import { formatDateTime, formatPrice } from '@/shared/utils/formatters'
import { getDefaultProductFallback } from '@/shared/constants/media'
import {
  buildSellerFulfillmentTimeline,
  buildSellerReturnTimeline,
  getSellerOrderActionModel,
  getSellerOrderPaymentSummary,
  getSellerReturnActionModel,
  getSellerOrderStatusMeta,
} from '@/features/orders/seller/utils/sellerOrders.utils'

const FALLBACK_IMAGE = getDefaultProductFallback(240, 70)

const TimelineStep = ({ step, isLast }) => {
  const dotClass =
    step.state === 'completed'
      ? 'border-primary bg-primary'
      : step.state === 'current'
        ? 'border-primary bg-primary/40'
        : 'border-border bg-surface-elevated'

  const textClass = step.state === 'pending' ? 'text-text-muted' : 'text-text-primary'

  return (
    <div className="relative pl-8">
      <span className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${dotClass}`} />
      {!isLast ? <span className="absolute left-[7px] top-5 h-[calc(100%-0.25rem)] border-l border-border" /> : null}

      <div className="pb-md">
        <p className={`text-sm font-semibold ${textClass}`}>{step.label}</p>
        {step.dateLabel ? <p className="text-xs text-text-secondary">{step.dateLabel}</p> : null}
      </div>
    </div>
  )
}

export default function SellerOrderDetailView({
  order,
  loadingAction = false,
  deliveryOtpValue = '',
  returnPickupOtpValue = '',
  onBack,
  onUpdateStatus,
  onDeliveryOtpChange,
  onSubmitDeliveryOtp,
  onReturnOtpChange,
  onSubmitReturnStatus,
  onRequestReturnPickupOtp,
  onOpenReject,
}) {
  if (!order) return null

  const isOutForDelivery = order.status === 'out_for_delivery'
  const hasValidDeliveryOtp = /^\d{6}$/.test(String(deliveryOtpValue || ''))
  const statusMeta = getSellerOrderStatusMeta(order.status)
  const timeline = buildSellerFulfillmentTimeline(order)
  const returnTimeline = buildSellerReturnTimeline(order)
  const actionModel = getSellerOrderActionModel(order.status)
  const returnActionModel = getSellerReturnActionModel(order.returnRequest)
  const hasReturnRequest = Boolean(order.returnRequest)
  const hasValidReturnOtp = /^\d{6}$/.test(String(returnPickupOtpValue || ''))
  const paymentSummary = getSellerOrderPaymentSummary(order)

  return (
    <div className="space-y-md">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to Orders
      </button>

      <Card className="space-y-sm">
        <div className="flex flex-wrap items-start justify-between gap-sm">
          <div>
            <h1 className="section-title">Order #{order.orderNumber}</h1>
            <p className="section-subtitle">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
        </div>
      </Card>

      <div className="grid gap-md xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-md">
          <Card className="space-y-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Customer and Delivery</h2>

            <div className="space-y-1 text-sm text-text-secondary">
              <p><span className="font-semibold text-text-primary">Name:</span> {order.customer.name}</p>
              <p><span className="font-semibold text-text-primary">Email:</span> {order.customer.email || '-'}</p>
              <p><span className="font-semibold text-text-primary">Phone:</span> {order.customer.phone || '-'}</p>
              <p className="whitespace-pre-line"><span className="font-semibold text-text-primary">Address:</span> {order.customer.address || '-'}</p>
            </div>
          </Card>

          <Card className="space-y-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Order Items</h2>

            <div className="space-y-sm">
              {order.items.map((item) => (
                <article key={item.id} className="grid gap-sm border-b border-border pb-sm last:border-b-0 last:pb-0 sm:grid-cols-[84px,1fr]">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.productName}
                    className="h-24 w-20 rounded-md border border-border object-cover"
                    loading="lazy"
                  />

                  <div className="space-y-1 text-sm text-text-secondary">
                    <p className="font-semibold text-text-primary">{item.productName}</p>
                    <p>Color: {item.colorName} | Size: {item.size}</p>
                    <p>Qty: {item.quantity} x {formatPrice(item.unitPrice)} = <span className="font-semibold text-text-primary">{formatPrice(item.subtotal)}</span></p>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-md">
          <Card className="space-y-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Fulfillment Tracker</h2>

            <div>
              {timeline.map((step, index) => (
                <TimelineStep key={step.key} step={step} isLast={index === timeline.length - 1} />
              ))}
            </div>

            <div className="rounded-md border border-border bg-surface-tertiary p-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Action Required</p>

              {actionModel.primaryLabel ? (
                <div className="mt-2 space-y-2">
                  <Button
                    fullWidth
                    variant="primary"
                    loading={loadingAction}
                    disabled={isOutForDelivery && !hasValidDeliveryOtp}
                    onClick={() => {
                      if (isOutForDelivery) {
                        onSubmitDeliveryOtp?.(order.id)
                        return
                      }

                      onUpdateStatus?.(order.id, actionModel.nextStatus, actionModel.primaryLabel)
                    }}
                  >
                    {actionModel.primaryLabel}
                  </Button>

                  {actionModel.showReject ? (
                    <Button
                      fullWidth
                      variant="danger"
                      disabled={loadingAction}
                      onClick={() => onOpenReject?.(order.id)}
                    >
                      Reject Order
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">{actionModel.infoText || 'No action required.'}</p>
              )}

              {order.rejectedReason ? (
                <p className="mt-2 text-xs text-danger">Reason: {order.rejectedReason}</p>
              ) : null}

              {isOutForDelivery ? (
                <div className="mt-3 space-y-2 rounded-md border border-border bg-surface-elevated p-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Delivery OTP Confirmation</p>
                  <Input
                    value={deliveryOtpValue}
                    onChange={(event) => onDeliveryOtpChange?.(order.id, event.target.value)}
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    maxLength={6}
                    aria-label="Delivery OTP"
                  />
                  <p className="text-xs text-text-secondary">
                    Enter a valid OTP to enable the Mark as Delivered action.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          {hasReturnRequest ? (
            <Card className="space-y-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Return Tracker</h2>

              <div>
                {returnTimeline.length ? returnTimeline.map((step, index) => (
                  <TimelineStep key={step.key} step={step} isLast={index === returnTimeline.length - 1} />
                )) : (
                  <p className="text-sm text-text-secondary">Return timeline is not available.</p>
                )}
              </div>

              <div className="rounded-md border border-border bg-surface-tertiary p-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Return Action</p>

                {order.returnRequest?.reason ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">Reason:</span> {order.returnRequest.reason}
                  </p>
                ) : null}

                {order.returnRequest?.adminNote ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">Note:</span> {order.returnRequest.adminNote}
                  </p>
                ) : null}

                {returnActionModel.primaryLabel ? (
                  <div className="mt-2 space-y-2">
                    <Button
                      fullWidth
                      variant="primary"
                      loading={loadingAction}
                      disabled={returnActionModel.requiresOtp && !hasValidReturnOtp}
                      onClick={() => onSubmitReturnStatus?.({
                        orderId: order.id,
                        status: returnActionModel.nextStatus,
                        requiresOtp: returnActionModel.requiresOtp,
                        successMessage: `${returnActionModel.primaryLabel} completed successfully.`,
                      })}
                    >
                      {returnActionModel.primaryLabel}
                    </Button>

                    {returnActionModel.secondaryStatus === 'request_pickup_otp' ? (
                      <Button
                        fullWidth
                        variant="secondary"
                        disabled={loadingAction}
                        onClick={() => onRequestReturnPickupOtp?.(order.id)}
                      >
                        {returnActionModel.secondaryLabel || 'Resend Pickup OTP'}
                      </Button>
                    ) : null}

                    {returnActionModel.secondaryStatus && returnActionModel.secondaryStatus !== 'request_pickup_otp' ? (
                      <Button
                        fullWidth
                        variant="danger"
                        disabled={loadingAction}
                        onClick={() => onSubmitReturnStatus?.({
                          orderId: order.id,
                          status: returnActionModel.secondaryStatus,
                          requiresOtp: false,
                          successMessage: `${returnActionModel.secondaryLabel} completed successfully.`,
                        })}
                      >
                        {returnActionModel.secondaryLabel}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">{returnActionModel.infoText || 'No return action required.'}</p>
                )}

                {returnActionModel.requiresOtp ? (
                  <div className="mt-3 space-y-2 rounded-md border border-border bg-surface-elevated p-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Pickup OTP Confirmation</p>
                    <Input
                      value={returnPickupOtpValue}
                      onChange={(event) => onReturnOtpChange?.(order.id, event.target.value)}
                      placeholder="Enter 6-digit pickup OTP"
                      inputMode="numeric"
                      maxLength={6}
                      aria-label="Return pickup OTP"
                    />
                    <p className="text-xs text-text-secondary">
                      Ask customer for pickup OTP and verify before marking item picked.
                    </p>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Payment Summary</h2>

            <div className="space-y-1 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(paymentSummary.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{paymentSummary.shipping > 0 ? formatPrice(paymentSummary.shipping) : 'Free'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
                <span>Total</span>
                <span>{formatPrice(paymentSummary.total)}</span>
              </div>
            </div>

            <div className="pt-1">
              <Badge variant={paymentSummary.paymentVariant}>{paymentSummary.paymentLabel} via {paymentSummary.paymentMethod}</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
