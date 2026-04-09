import { formatDate, formatDateTime, formatOrderStatus } from '@/shared/utils/formatters'
import {
  ACTIVE_RETURN_STATUS_META,
  ORDER_UI_STATUS,
  STATUS_META,
  STATUS_UI_MAP,
} from '@/features/orders/utils/orderStatus.constants'

export { ORDER_UI_STATUS } from '@/features/orders/utils/orderStatus.constants'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_RETURN_WINDOW_DAYS = 7

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfDay = (date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

const addDays = (date, days) => {
  const value = new Date(date)
  value.setDate(value.getDate() + Number(days || 0))
  return value
}

export const getExpectedDeliveryDate = (order) => {
  const explicit = toDate(order?.estimatedDelivery)
  if (explicit) return explicit

  const delivered = toDate(order?.deliveredAt)
  if (delivered) return delivered

  const shipped = toDate(order?.shippedAt || order?.outForDeliveryAt)
  if (shipped) return addDays(shipped, 3)

  const created = toDate(order?.createdAt)
  if (created) return addDays(created, 7)

  return null
}


const normalizeReturnStatus = (status) => {
  const raw = String(status || '').toLowerCase()
  if (!raw) return ''
  if (raw === 'approved') return 'accepted'
  return raw
}


const getReturnStatusDate = (order, status) => {
  const request = order?.returnRequest || {}

  if (status === 'rejected') {
    return request?.rejectedAt || request?.resolvedAt || request?.requestedAt || null
  }

  if (status === 'refund_completed') {
    return request?.refundCompletedAt || request?.receivedAt || request?.pickedAt || request?.acceptedAt || request?.requestedAt || null
  }

  if (status === 'received') {
    return request?.receivedAt || request?.pickedAt || request?.acceptedAt || request?.requestedAt || null
  }

  if (status === 'picked') {
    return request?.pickedAt || request?.acceptedAt || request?.requestedAt || null
  }

  if (status === 'accepted') {
    return request?.acceptedAt || request?.requestedAt || null
  }

  if (status === 'requested') {
    return request?.requestedAt || null
  }

  return request?.refundCompletedAt || request?.receivedAt || request?.pickedAt || request?.acceptedAt || request?.requestedAt || null
}

const deriveUiStatus = (order) => {
  const returnStatus = normalizeReturnStatus(order?.returnRequest?.status)

  if (['refund_completed', 'approved'].includes(returnStatus)) {
    return ORDER_UI_STATUS.RETURNED
  }

  if (order?.deliveredAt) {
    return ORDER_UI_STATUS.DELIVERED
  }

  const mapped = STATUS_UI_MAP[String(order?.status || '').toLowerCase()]
  return mapped || ORDER_UI_STATUS.PENDING
}

const toOrderNumber = (order) => {
  if (order?.orderNumber) return order.orderNumber
  const id = String(order?._id || '')
  if (!id) return 'Order'
  return `ORD-${id.slice(-6).toUpperCase()}`
}

const normalizeOrderItem = (item, index = 0) => {
  const snapshot = item?.snapshot || item?.variantSnapshot || {}

  const quantity = toNumber(item?.quantity, 1)
  const unitPrice = toNumber(
    item?.priceAtPurchase ?? snapshot?.effectivePrice ?? snapshot?.price,
    0
  )

  return {
    id: item?._id || item?.itemId || item?.variantId || `${item?.productId || 'item'}-${index}`,
    productId: item?.productId || null,
    variantId: item?.variantId || null,
    productName: item?.productName || snapshot?.productName || 'Product',
    imageUrl: item?.imageUrl || snapshot?.imageUrl || snapshot?.images?.[0]?.url || '',
    size: item?.size || snapshot?.size || '-',
    colorName: item?.colorName || snapshot?.colorName || '-',
    quantity,
    unitPrice,
    subtotal: toNumber(item?.subtotal, unitPrice * quantity),
    sellerName: item?.sellerName || '-',
    returnWindow: toNumber(item?.returnPolicy?.returnWindow, DEFAULT_RETURN_WINDOW_DAYS),
  }
}

const normalizeAddress = (order) => {
  const shippingAddress = order?.shippingAddress
  if (shippingAddress) {
    return {
      name: shippingAddress.name || '-',
      line1: shippingAddress.line1 || '-',
      line2: shippingAddress.line2 || '',
      city: shippingAddress.city || '-',
      state: shippingAddress.state || '-',
      pincode: shippingAddress.pincode || '-',
      phone: shippingAddress.phone || '-',
    }
  }

  const snapshot = order?.addressSnapshot || {}
  return {
    name: snapshot.fullName || '-',
    line1: snapshot.street || '-',
    line2: [snapshot.building, snapshot.landmark].filter(Boolean).join(', '),
    city: snapshot.city || snapshot.district || '-',
    state: snapshot.state || '-',
    pincode: snapshot.pincode || '-',
    phone: snapshot.phone || '-',
  }
}

const normalizePayment = (order) => {
  const payment = order?.payment || {}

  return {
    method: payment?.method || order?.paymentMethod || 'card',
    status: payment?.status || order?.paymentStatus || 'pending',
    paymentIntentId: payment?.paymentIntentId || payment?.transactionId || payment?.stripePaymentIntentId || order?.purchaseId || '',
    cardLast4: payment?.cardLast4 || '',
  }
}

export const normalizeOrder = (order) => {
  const items = Array.isArray(order?.items) ? order.items.map(normalizeOrderItem) : []

  const pricing = order?.pricing || {}
  const fallbackItemsTotal = items.reduce((sum, item) => sum + toNumber(item.subtotal, 0), 0)

  const createdAt = order?.createdAt || null
  const deliveredAt = order?.deliveredAt || null
  const cancelledAt = order?.cancelledAt || null

  const totalAmount = toNumber(
    pricing?.totalAmount ?? order?.totalAmount,
    fallbackItemsTotal
  )

  const normalized = {
    id: order?._id || '',
    orderNumber: toOrderNumber(order),
    status: String(order?.status || '').toLowerCase(),
    uiStatus: deriveUiStatus(order),
    createdAt,
    updatedAt: order?.updatedAt || null,
    deliveredAt,
    shippedAt: order?.shippedAt || order?.shipping?.shippedAt || null,
    outForDeliveryAt: order?.outForDeliveryAt || null,
    acceptedAt: order?.acceptedAt || null,
    packedAt: order?.packedAt || null,
    cancelledAt,
    estimatedDelivery: order?.estimatedDelivery || null,
    cancellationReason: order?.cancellationReason || order?.cancelReason || '',
    rejectedReason: order?.rejectionReason || '',
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    pricing: {
      itemsTotal: toNumber(pricing?.itemsTotal, fallbackItemsTotal),
      discount: toNumber(pricing?.discount, 0),
      deliveryCharges: toNumber(pricing?.deliveryCharges, 0),
      totalAmount,
    },
    payment: normalizePayment(order),
    shipping: {
      courierPartner: order?.shipping?.courierPartner || '',
      awbNumber: order?.shipping?.awbNumber || '',
      trackingUrl: order?.shipping?.trackingUrl || '',
      shippedAt: order?.shipping?.shippedAt || order?.shippedAt || null,
    },
    timeline: Array.isArray(order?.timeline) ? order.timeline : [],
    returnRequest: order?.returnRequest || null,
    shippingAddress: normalizeAddress(order),
    source: order,
  }

  return normalized
}

export const normalizeOrders = (orders = []) => {
  return (orders || []).map(normalizeOrder)
}

export const buildTimePeriodOptions = (referenceDate = new Date()) => {
  const currentYear = referenceDate.getFullYear()
  return [
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_6_months', label: 'Last 6 months' },
    { value: `year_${currentYear}`, label: String(currentYear) },
    { value: `year_${currentYear - 1}`, label: String(currentYear - 1) },
    { value: 'older', label: 'Older' },
  ]
}

const matchesTimePeriod = (order, period, referenceDate = new Date()) => {
  const createdDate = toDate(order?.createdAt)
  if (!createdDate) return false

  const todayStart = startOfDay(referenceDate)

  if (period === 'last_30_days') {
    const start = addDays(todayStart, -30)
    return createdDate >= start
  }

  if (period === 'last_6_months') {
    const start = addDays(todayStart, -183)
    return createdDate >= start
  }

  if (String(period || '').startsWith('year_')) {
    const year = Number(String(period).slice(5))
    if (!Number.isFinite(year)) return true
    return createdDate.getFullYear() === year
  }

  if (period === 'older') {
    return createdDate.getFullYear() < referenceDate.getFullYear() - 1
  }

  return true
}

const matchesSearch = (order, searchTerm = '') => {
  const term = String(searchTerm || '').trim().toLowerCase()
  if (!term) return true

  const inOrderNumber = String(order?.orderNumber || '').toLowerCase().includes(term)
  if (inOrderNumber) return true

  return (order?.items || []).some((item) => String(item?.productName || '').toLowerCase().includes(term))
}

const sortOrders = (orders, sortBy) => {
  const copy = [...orders]

  const completionRank = (order) => {
    const completedStatuses = new Set([
      ORDER_UI_STATUS.DELIVERED,
      ORDER_UI_STATUS.CANCELLED,
      ORDER_UI_STATUS.RETURNED,
    ])

    return completedStatuses.has(order?.uiStatus) ? 1 : 0
  }

  const compareWithCompletionPriority = (left, right, comparator) => {
    const rankDiff = completionRank(left) - completionRank(right)
    if (rankDiff !== 0) return rankDiff
    return comparator(left, right)
  }

  if (sortBy === 'oldest') {
    return copy.sort((a, b) => {
      return compareWithCompletionPriority(
        a,
        b,
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      )
    })
  }

  if (sortBy === 'amount_desc') {
    return copy.sort((a, b) => {
      return compareWithCompletionPriority(
        a,
        b,
        (left, right) => toNumber(right?.pricing?.totalAmount) - toNumber(left?.pricing?.totalAmount)
      )
    })
  }

  if (sortBy === 'amount_asc') {
    return copy.sort((a, b) => {
      return compareWithCompletionPriority(
        a,
        b,
        (left, right) => toNumber(left?.pricing?.totalAmount) - toNumber(right?.pricing?.totalAmount)
      )
    })
  }

  return copy.sort((a, b) => {
    return compareWithCompletionPriority(
      a,
      b,
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  })
}

export const applyClientOrderFilters = (
  orders = [],
  {
    selectedStatuses = [],
    timePeriod = 'last_30_days',
    search = '',
    sortBy = 'recent',
    referenceDate = new Date(),
  } = {}
) => {
  const filtered = (orders || []).filter((order) => {
    const statusMatch = !selectedStatuses.length || selectedStatuses.includes(order.uiStatus)
    return statusMatch && matchesTimePeriod(order, timePeriod, referenceDate) && matchesSearch(order, search)
  })

  return sortOrders(filtered, sortBy)
}

export const countOrdersByStatus = (orders = []) => {
  const base = {
    all: 0,
    [ORDER_UI_STATUS.PENDING]: 0,
    [ORDER_UI_STATUS.PROCESSING]: 0,
    [ORDER_UI_STATUS.SHIPPED]: 0,
    [ORDER_UI_STATUS.OUT_FOR_DELIVERY]: 0,
    [ORDER_UI_STATUS.DELIVERED]: 0,
    [ORDER_UI_STATUS.CANCELLED]: 0,
    [ORDER_UI_STATUS.RETURNED]: 0,
  }

  return (orders || []).reduce((acc, order) => {
    const key = order?.uiStatus
    acc.all += 1
    if (Object.prototype.hasOwnProperty.call(acc, key)) {
      acc[key] += 1
    }
    return acc
  }, base)
}

export const getStatusMeta = (order) => {
  const returnStatus = normalizeReturnStatus(order?.returnRequest?.status)
  const activeReturnMeta = ACTIVE_RETURN_STATUS_META[returnStatus]
  if (activeReturnMeta) return activeReturnMeta

  const key = order?.uiStatus || ORDER_UI_STATUS.PENDING
  return STATUS_META[key] || STATUS_META[ORDER_UI_STATUS.PENDING]
}

export const getStatusText = (order) => {
  const meta = getStatusMeta(order)
  const returnStatus = normalizeReturnStatus(order?.returnRequest?.status)

  if (order?.returnRequest && returnStatus && returnStatus !== 'refund_completed') {
    const returnDate = getReturnStatusDate(order, returnStatus)

    const label = `Return ${formatOrderStatus(returnStatus)}`
    if (!returnDate) return label
    return `${label} on ${formatDate(returnDate)}`
  }

  const resolvedDate =
    order?.uiStatus === ORDER_UI_STATUS.DELIVERED
      ? order?.deliveredAt
      : order?.uiStatus === ORDER_UI_STATUS.OUT_FOR_DELIVERY
        ? order?.outForDeliveryAt || order?.shippedAt
        : order?.uiStatus === ORDER_UI_STATUS.SHIPPED
        ? order?.shippedAt || order?.outForDeliveryAt
        : order?.uiStatus === ORDER_UI_STATUS.CANCELLED
          ? order?.cancelledAt
          : order?.uiStatus === ORDER_UI_STATUS.RETURNED
            ? order?.returnRequest?.resolvedAt || order?.returnRequest?.requestedAt
            : null

  if (!resolvedDate) return meta.label
  return `${meta.label} on ${formatDate(resolvedDate)}`
}

export const getItemMoreLabel = (order) => {
  const total = order?.items?.length || 0
  if (total <= 1) return ''
  return `+ ${total - 1} more item${total - 1 > 1 ? 's' : ''}`
}

export const getItemReturnWindow = (order, item, referenceDate = new Date()) => {
  const deliveredAt = toDate(order?.deliveredAt)
  if (!deliveredAt) {
    return {
      isEligible: false,
      isExpired: false,
      deadline: null,
      daysLeft: null,
      message: 'Return is available only after delivery.',
    }
  }

  const windowDays = toNumber(item?.returnWindow, DEFAULT_RETURN_WINDOW_DAYS)
  const deadline = addDays(deliveredAt, windowDays)
  const current = startOfDay(referenceDate)
  const remainingMs = startOfDay(deadline).getTime() - current.getTime()
  const daysLeft = Math.ceil(remainingMs / ONE_DAY_MS)

  if (order?.returnRequest) {
    return {
      isEligible: false,
      isExpired: false,
      deadline,
      daysLeft,
      message: `Return request ${formatOrderStatus(order.returnRequest.status)}`,
    }
  }

  if (order?.uiStatus !== ORDER_UI_STATUS.DELIVERED) {
    return {
      isEligible: false,
      isExpired: false,
      deadline,
      daysLeft,
      message: 'Return is available once the order is delivered.',
    }
  }

  if (daysLeft < 0) {
    return {
      isEligible: false,
      isExpired: true,
      deadline,
      daysLeft: 0,
      message: `Return window expired on ${formatDate(deadline)}.`,
    }
  }

  return {
    isEligible: true,
    isExpired: false,
    deadline,
    daysLeft,
    message: `Return window closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
  }
}

export const canCancelOrder = (order) => {
  const status = String(order?.status || '').toLowerCase()
  return ['pending', 'processing', 'placed', 'accepted'].includes(status)
}

export const canTrackShipment = (order) => {
  const status = String(order?.status || '').toLowerCase()
  return ['shipped', 'out_for_delivery'].includes(status) && Boolean(order?.shipping?.trackingUrl)
}

export const canWriteReview = (order) => {
  return [ORDER_UI_STATUS.DELIVERED, ORDER_UI_STATUS.RETURNED].includes(order?.uiStatus)
}

export const canBuyAgain = (order) => {
  return [ORDER_UI_STATUS.DELIVERED, ORDER_UI_STATUS.CANCELLED, ORDER_UI_STATUS.RETURNED].includes(order?.uiStatus)
}

export const buildOrderTimeline = (order) => {
  if (Array.isArray(order?.timeline) && order.timeline.length) {
    return order.timeline
      .filter((event) => Boolean(event?.timestamp))
      .map((event) => ({
      key: `${event.status}-${event.timestamp}`,
      label: formatOrderStatus(event.status),
      dateText: event.timestamp ? formatDateTime(event.timestamp) : 'Pending',
      message: event.message || '',
      state: 'completed',
      statusKey: event.status,
    }))
  }

  const stages = [
    { key: 'placed', label: 'Order Placed', timestamp: order?.createdAt, message: 'Order confirmed and payment received.' },
    { key: 'accepted', label: 'Accepted', timestamp: order?.acceptedAt, message: 'Seller accepted your order.' },
    { key: 'packed', label: 'Packed', timestamp: order?.packedAt, message: 'Items packed and ready for dispatch.' },
    { key: 'shipped', label: 'Shipped', timestamp: order?.shippedAt, message: 'Package handed over to courier.' },
    { key: 'out_for_delivery', label: 'Out for Delivery', timestamp: order?.outForDeliveryAt, message: 'Package is out for delivery.' },
    { key: 'delivered', label: 'Delivered', timestamp: order?.deliveredAt, message: 'Package delivered successfully.' },
  ]

  const statusToIndex = {
    pending: 0,
    placed: 0,
    processing: 1,
    accepted: 1,
    packed: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
  }

  const statusKey = String(order?.status || '').toLowerCase()
  const currentIndex = statusToIndex[statusKey]

  const baseTimeline = stages
    .filter((stage, index) => {
      if (stage.timestamp) return true
      if (!Number.isFinite(currentIndex)) return false
      return index <= currentIndex
    })
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      dateText: stage.timestamp ? formatDateTime(stage.timestamp) : formatDateTime(order?.updatedAt || order?.createdAt),
      message: stage.message,
      state: 'completed',
      statusKey: stage.key,
    }))

  const normalizedKeys = new Set(baseTimeline.map((event) => event.key))

  if (order?.returnRequest) {
    if (!normalizedKeys.has('return_requested') && order.returnRequest.requestedAt) {
      baseTimeline.push({
        key: 'return_requested',
        label: 'Return Requested',
        dateText: formatDateTime(order.returnRequest.requestedAt),
        message: order.returnRequest.reason || 'Return request raised.',
        state: 'completed',
        statusKey: 'return_requested',
      })
    }

    if (!normalizedKeys.has('return_accepted') && order.returnRequest.acceptedAt) {
      baseTimeline.push({
        key: 'return_accepted',
        label: 'Return Accepted',
        dateText: formatDateTime(order.returnRequest.acceptedAt),
        message: 'Seller approved your return request and pickup OTP was generated.',
        state: 'completed',
        statusKey: 'return_accepted',
      })
    }

    if (!normalizedKeys.has('return_picked') && order.returnRequest.pickedAt) {
      baseTimeline.push({
        key: 'return_picked',
        label: 'Item Picked',
        dateText: formatDateTime(order.returnRequest.pickedAt),
        message: 'Pickup agent collected the return item after OTP verification.',
        state: 'completed',
        statusKey: 'return_picked',
      })
    }

    if (!normalizedKeys.has('return_received') && order.returnRequest.receivedAt) {
      baseTimeline.push({
        key: 'return_received',
        label: 'Item Received',
        dateText: formatDateTime(order.returnRequest.receivedAt),
        message: 'Seller has received your returned item.',
        state: 'completed',
        statusKey: 'return_received',
      })
    }

    if (!normalizedKeys.has('return_refund_completed') && order.returnRequest.refundCompletedAt) {
      baseTimeline.push({
        key: 'return_refund_completed',
        label: 'Refund Completed',
        dateText: formatDateTime(order.returnRequest.refundCompletedAt),
        message: order.returnRequest.adminNote || 'Refund has been completed for this return.',
        state: 'completed',
        statusKey: 'return_refund_completed',
      })
    }

    if (!normalizedKeys.has('return_resolved') && order.returnRequest.status && order.returnRequest.status === 'rejected' && order.returnRequest.resolvedAt) {
      baseTimeline.push({
        key: 'return_resolved',
        label: `Return ${formatOrderStatus(order.returnRequest.status)}`,
        dateText: formatDateTime(order.returnRequest.resolvedAt),
        message: order.returnRequest.adminNote || 'Return request has been updated.',
        state: 'completed',
        statusKey: 'return_resolved',
      })
    }
  }

  if (['cancelled', 'rejected'].includes(statusKey) && !normalizedKeys.has('cancelled')) {
    baseTimeline.push({
      key: 'cancelled',
      label: statusKey === 'rejected' ? 'Rejected' : 'Cancelled',
      dateText: order?.cancelledAt ? formatDateTime(order.cancelledAt) : formatDateTime(order?.updatedAt || order?.createdAt),
      message: order?.cancellationReason || order?.rejectedReason || 'Order was cancelled.',
      state: 'completed',
      statusKey: 'cancelled',
    })
  }

  return baseTimeline
}
