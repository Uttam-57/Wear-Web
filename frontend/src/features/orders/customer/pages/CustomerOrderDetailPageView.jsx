import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import {
  Alert,
  Badge,
  Button,
  Card,
  PageLoadingState,
  PageMessageState,
} from '@/shared/ui'
import { formatDate, formatDateTime, formatPrice } from '@/shared/utils/formatters'
import {
  CANCEL_REASON_OPTIONS,
  RETURN_REASON_OPTIONS,
  paymentStatusMeta,
} from '@/features/orders/customer/utils/orderDetail.constants'
import {
  getOrderActionDateMeta,
  getOrderAmountSaved,
  getReasonLabel,
} from '@/features/orders/customer/utils/orderDetail.helpers'
import OrderTimelineItem from '@/features/orders/customer/components/OrderTimelineItem'
import OrderDetailItemCard from '@/features/orders/customer/components/OrderDetailItemCard'
import CancelOrderModal from '@/features/orders/customer/modals/CancelOrderModal'
import ReturnItemModal from '@/features/orders/customer/modals/ReturnItemModal'
import ReviewItemModal from '@/features/orders/customer/modals/ReviewItemModal'
import {
  cancelCustomerOrder,
  downloadOrderInvoiceBlob,
  fetchCustomerOrderById,
  requestCustomerOrderReturn,
  submitOrderProductReview,
} from '@/features/orders/api/orders.api'
import {
  buildOrderTimeline,
  canCancelOrder,
  canTrackShipment,
  getExpectedDeliveryDate,
  getStatusMeta,
  getStatusText,
  normalizeOrder,
} from '@/features/orders/utils/orders.utils'

const CUSTOMER_ORDER_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000
const customerOrderDetailCache = new Map()

const getCustomerOrderDetailCache = (orderId) => {
  if (!orderId) return null

  const cached = customerOrderDetailCache.get(orderId)
  if (!cached) return null

  if (Date.now() - cached.updatedAt > CUSTOMER_ORDER_DETAIL_CACHE_TTL_MS) {
    customerOrderDetailCache.delete(orderId)
    return null
  }

  return cached
}

const setCustomerOrderDetailCache = (orderId, payload) => {
  if (!orderId) return

  customerOrderDetailCache.set(orderId, {
    ...payload,
    updatedAt: Date.now(),
  })
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pushToast = useUIStore((state) => state.pushToast)
  const cachedOrderDetailState = getCustomerOrderDetailCache(id)

  const [loading, setLoading] = useState(() => !cachedOrderDetailState)
  const [error, setError] = useState(() => cachedOrderDetailState?.error || '')
  const [errorCode, setErrorCode] = useState(() => cachedOrderDetailState?.errorCode ?? null)
  const [order, setOrder] = useState(() => cachedOrderDetailState?.order || null)

  const [timelineOpenOnMobile, setTimelineOpenOnMobile] = useState(false)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelComment, setCancelComment] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  const [returnItem, setReturnItem] = useState(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnComment, setReturnComment] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)

  const [reviewItem, setReviewItem] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const [invoiceDownloading, setInvoiceDownloading] = useState(false)

  const loadOrder = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setLoading(true)
      setError('')
      setErrorCode(null)
    }

    try {
      const payload = await fetchCustomerOrderById(id)
      const normalized = normalizeOrder(payload)
      setOrder(normalized)
      setCustomerOrderDetailCache(id, { order: normalized, error: '', errorCode: null })
    } catch (err) {
      if (!background) {
        const nextError = getApiError(err, 'Unable to load this order right now.')
        const nextErrorCode = Number(err?.response?.status) || null
        setError(nextError)
        setErrorCode(nextErrorCode)
        setOrder(null)
        setCustomerOrderDetailCache(id, { order: null, error: nextError, errorCode: nextErrorCode })
      }
    } finally {
      if (!background) {
        setLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    loadOrder().catch(() => {})
  }, [loadOrder])

  const statusMeta = useMemo(() => getStatusMeta(order || {}), [order])
  const statusText = useMemo(() => getStatusText(order || {}), [order])
  const timeline = useMemo(() => buildOrderTimeline(order || {}), [order])
  const paymentMeta = useMemo(() => paymentStatusMeta(order?.payment?.status), [order])
  const canShowInvoice = useMemo(() => order?.uiStatus === 'delivered', [order])
  const expectedDeliveryDate = useMemo(() => getExpectedDeliveryDate(order || {}), [order])

  const actionDateMeta = useMemo(() => {
    return getOrderActionDateMeta({ order, expectedDeliveryDate })
  }, [expectedDeliveryDate, order])

  const amountSaved = useMemo(() => {
    return getOrderAmountSaved(order)
  }, [order])

  const closeCancelModal = () => {
    setCancelOpen(false)
    setCancelReason('')
    setCancelComment('')
  }

  const closeReturnModal = () => {
    setReturnItem(null)
    setReturnReason('')
    setReturnComment('')
  }

  const closeReviewModal = () => {
    setReviewItem(null)
    setReviewRating(5)
    setReviewTitle('')
    setReviewBody('')
  }

  const handleCancelOrder = async () => {
    if (!order || !cancelReason) {
      pushToast({ type: 'warning', title: 'Reason required', message: 'Please select a cancellation reason.' })
      return
    }

    const reasonText = `${getReasonLabel(CANCEL_REASON_OPTIONS, cancelReason)}${cancelComment ? ` - ${cancelComment.trim()}` : ''}`
    setCancelSubmitting(true)

    try {
      const updated = await cancelCustomerOrder({ orderId: order.id, reason: reasonText })
      setOrder(normalizeOrder(updated))
      closeCancelModal()
      pushToast({ type: 'success', title: 'Order cancelled', message: 'Your order has been cancelled successfully.' })
    } catch (err) {
      pushToast({ type: 'danger', title: 'Cancellation failed', message: getApiError(err, 'Unable to cancel the order.') })
    } finally {
      setCancelSubmitting(false)
    }
  }

  const handleReturnOrder = async () => {
    if (!order || !returnItem || !returnReason) {
      pushToast({ type: 'warning', title: 'Reason required', message: 'Please select a return reason.' })
      return
    }

    const reasonText = `${getReasonLabel(RETURN_REASON_OPTIONS, returnReason)}${returnComment ? ` - ${returnComment.trim()}` : ''}`
    setReturnSubmitting(true)

    try {
      const updated = await requestCustomerOrderReturn({ orderId: order.id, reason: reasonText })
      setOrder(normalizeOrder(updated))
      closeReturnModal()
      pushToast({ type: 'success', title: 'Return requested', message: 'Your return request has been submitted.' })
    } catch (err) {
      pushToast({ type: 'danger', title: 'Return failed', message: getApiError(err, 'Unable to create return request.') })
    } finally {
      setReturnSubmitting(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!order || !reviewItem || !reviewItem.productId) {
      pushToast({ type: 'warning', title: 'Cannot submit review', message: 'Product details are missing.' })
      return
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      pushToast({ type: 'warning', title: 'Rating required', message: 'Please select a rating from 1 to 5.' })
      return
    }

    setReviewSubmitting(true)

    try {
      await submitOrderProductReview({
        productId: reviewItem.productId,
        orderId: order.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      })
      closeReviewModal()
      pushToast({ type: 'success', title: 'Review submitted', message: 'Thank you for sharing your feedback.' })
    } catch (err) {
      pushToast({ type: 'danger', title: 'Review failed', message: getApiError(err, 'Unable to submit review right now.') })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleTrackShipment = () => {
    if (!order?.shipping?.trackingUrl) {
      pushToast({ type: 'warning', title: 'Tracking unavailable', message: 'Tracking link is not available for this order.' })
      return
    }

    window.open(order.shipping.trackingUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenProduct = useCallback((productId) => {
    if (!productId) return
    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', String(productId)))
  }, [navigate])

  const handleDownloadInvoice = async () => {
    if (!order) return
    if (!canShowInvoice) {
      pushToast({
        type: 'info',
        title: 'Invoice unavailable',
        message: 'Invoice is available only for successfully delivered orders.',
      })
      return
    }

    setInvoiceDownloading(true)

    try {
      const blob = await downloadOrderInvoiceBlob(order.id)
      if (!(blob instanceof Blob)) throw new Error('Invoice download is not available right now.')

      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${order.orderNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      pushToast({ type: 'warning', title: 'Invoice unavailable', message: getApiError(err, 'Invoice is not available for this order yet.') })
    } finally {
      setInvoiceDownloading(false)
    }
  }

  if (loading) return <PageLoadingState />

  if (!order) {
    if (errorCode === 404) {
      return (
        <PageMessageState
          message="Order not found."
          action={<Button as={Link} to={ROUTES.ORDERS}>Back to My Orders</Button>}
        />
      )
    }

    if (errorCode === 403) {
      return (
        <PageMessageState
          message="Access denied. This order does not belong to your account."
          action={<Button as={Link} to={ROUTES.ORDERS}>Back to My Orders</Button>}
        />
      )
    }

    return (
      <PageMessageState
        message={error || 'Order details are not available right now.'}
        action={<Button as={Link} to={ROUTES.ORDERS}>Back to My Orders</Button>}
      />
    )
  }

  return (
    <div className="page-shell space-y-md pb-xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to={ROUTES.ORDERS} className="hover:text-primary">My Orders</Link>
        <span>/</span>
        <span className="text-text-secondary">Order #{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <Button as={Link} to={ROUTES.ORDERS} variant="ghost" size="sm">Back to Orders</Button>
          <h1 className="section-title mt-2">Order #{order.orderNumber}</h1>
          <p className="section-subtitle">Placed on {formatDateTime(order.createdAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusMeta.badgeVariant}>{statusText}</Badge>
          {canShowInvoice ? (
            <Button variant="secondary" onClick={handleDownloadInvoice} loading={invoiceDownloading}>Download Invoice</Button>
          ) : null}
          <Button variant="secondary" onClick={() => pushToast({ type: 'info', title: 'Support', message: 'Please contact support from your profile help center.' })}>
            Need Help?
          </Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <section className="grid gap-md lg:grid-cols-[1.65fr,1fr]">
        <div className="space-y-md">
          <Card className="space-y-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-text-primary">Order Status Timeline</h2>
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setTimelineOpenOnMobile((prev) => !prev)}
              >
                {timelineOpenOnMobile ? 'Hide Timeline' : 'Show Timeline'}
              </Button>
            </div>

            <div className={`${timelineOpenOnMobile ? 'block' : 'hidden'} space-y-1 lg:block`}>
              {timeline.map((event, index) => (
                <OrderTimelineItem
                  key={`${event.key}-${index}`}
                  event={event}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>

            {order.uiStatus !== 'delivered' && order.uiStatus !== 'cancelled' && order.uiStatus !== 'returned' && expectedDeliveryDate ? (
              <div className="rounded-md border border-primary/25 bg-primary-soft px-sm py-2 text-sm text-primary">
                Delivery is expected by {formatDate(expectedDeliveryDate)}.
              </div>
            ) : null}
          </Card>

          <div className="space-y-sm">
            <h2 className="text-lg font-semibold text-text-primary">Order Items ({order.items.length})</h2>

            {order.items.map((item) => (
              <OrderDetailItemCard
                key={item.id}
                order={order}
                item={item}
                onOpenProduct={handleOpenProduct}
                onOpenReturn={setReturnItem}
                onOpenReview={setReviewItem}
                onTrackShipment={handleTrackShipment}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-sm lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-sm">
            <h2 className="text-base font-semibold text-text-primary">Order Summary</h2>

            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start justify-between gap-2">
                <span>Order Date</span>
                <span className="font-medium text-text-primary">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span>Order Number</span>
                <span className="font-medium text-text-primary">{order.orderNumber}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span>Total Items</span>
                <span className="font-medium text-text-primary">{order.totalItems}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span>Total Amount</span>
                <span className="font-semibold text-text-primary">{formatPrice(order.pricing.totalAmount)}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span>Payment Method</span>
                <span className="font-medium text-text-primary">
                  {String(order.payment.method).toLowerCase() === 'card' && order.payment.cardLast4
                    ? `Card ending ${order.payment.cardLast4}`
                    : order.payment.method}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span>Payment Status</span>
                <Badge variant={paymentMeta.variant}>{paymentMeta.label}</Badge>
              </div>
              {actionDateMeta.value ? (
                <div className="flex items-start justify-between gap-2">
                  <span>{actionDateMeta.label}</span>
                  <span className="font-medium text-text-primary">{formatDate(actionDateMeta.value)}</span>
                </div>
              ) : null}
              {order.payment.paymentIntentId ? (
                <div className="flex items-start justify-between gap-2">
                  <span>Payment ID</span>
                  <span className="max-w-[170px] truncate font-medium text-text-primary" title={order.payment.paymentIntentId}>
                    {order.payment.paymentIntentId}
                  </span>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-2">
            <h2 className="text-base font-semibold text-text-primary">Delivery Address</h2>
            <div className="text-sm text-text-secondary">
              <p className="font-semibold text-text-primary">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
            </div>
          </Card>

          <Card className="space-y-2">
            <h2 className="text-base font-semibold text-text-primary">Price Breakdown</h2>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Items Total</span>
                <span>{formatPrice(order.pricing.itemsTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="font-medium text-success">- {formatPrice(order.pricing.discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charges</span>
                <span className="font-medium text-success">{order.pricing.deliveryCharges > 0 ? formatPrice(order.pricing.deliveryCharges) : 'FREE'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
                <span>Total Paid</span>
                <span>{formatPrice(order.pricing.totalAmount)}</span>
              </div>
            </div>

            {amountSaved > 0 ? (
              <div className="rounded-md border border-success/30 bg-success-soft px-sm py-2 text-sm font-medium text-success">
                You saved {formatPrice(amountSaved)}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => pushToast({ type: 'info', title: 'Issue Reported', message: 'Support will contact you soon.' })}
            >
              Report Issue
            </Button>
            {canCancelOrder(order) ? (
              <Button fullWidth variant="danger" onClick={() => setCancelOpen(true)}>Cancel Order</Button>
            ) : null}
            {canTrackShipment(order) ? (
              <Button fullWidth variant="ghost" onClick={handleTrackShipment}>Track Shipment</Button>
            ) : null}
          </Card>
        </aside>
      </section>

      <CancelOrderModal
        open={cancelOpen}
        order={order}
        cancelReason={cancelReason}
        cancelComment={cancelComment}
        cancelSubmitting={cancelSubmitting}
        onClose={closeCancelModal}
        onCancelReasonChange={setCancelReason}
        onCancelCommentChange={setCancelComment}
        onSubmit={handleCancelOrder}
      />

      <ReturnItemModal
        returnItem={returnItem}
        returnReason={returnReason}
        returnComment={returnComment}
        returnSubmitting={returnSubmitting}
        onClose={closeReturnModal}
        onReturnReasonChange={setReturnReason}
        onReturnCommentChange={setReturnComment}
        onSubmit={handleReturnOrder}
      />

      <ReviewItemModal
        reviewItem={reviewItem}
        reviewRating={reviewRating}
        reviewTitle={reviewTitle}
        reviewBody={reviewBody}
        reviewSubmitting={reviewSubmitting}
        onClose={closeReviewModal}
        onReviewRatingChange={setReviewRating}
        onReviewTitleChange={setReviewTitle}
        onReviewBodyChange={setReviewBody}
        onSubmit={handleSubmitReview}
      />
    </div>
  )
}
