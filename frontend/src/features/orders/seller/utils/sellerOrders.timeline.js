import { formatDateTime } from '@/shared/utils/formatters'
import {
  RETURN_STATUS_PRIORITY,
  SELLER_ORDER_FLOW,
  SELLER_RETURN_FLOW,
  STATUS_PRIORITY,
} from '@/features/orders/seller/utils/sellerOrder.constants'

const getTimelineDateByStatus = (order, status) => {
  if (status === 'placed') return order?.createdAt
  if (status === 'accepted') return order?.acceptedAt
  if (status === 'packed') return order?.packedAt
  if (status === 'shipped') return order?.shippedAt
  if (status === 'out_for_delivery') return order?.outForDeliveryAt
  if (status === 'delivered') return order?.deliveredAt
  return null
}

const getReturnTimelineDateByStatus = (order, status) => {
  const request = order?.returnRequest || {}

  if (status === 'requested') return request?.requestedAt
  if (status === 'accepted') return request?.acceptedAt
  if (status === 'picked') return request?.pickedAt
  if (status === 'received') return request?.receivedAt
  if (status === 'refund_completed') return request?.refundCompletedAt
  if (status === 'rejected') return request?.rejectedAt || request?.resolvedAt
  return null
}

export const buildSellerFulfillmentTimeline = (order) => {
  const currentStatus = String(order?.status || 'placed').toLowerCase()
  const currentPriority = STATUS_PRIORITY[currentStatus] ?? -1
  const isTerminal = currentStatus === 'cancelled' || currentStatus === 'rejected'

  return SELLER_ORDER_FLOW.map((step, index) => {
    const stepPriority = STATUS_PRIORITY[step.key] ?? index

    let state = 'pending'
    if (isTerminal) {
      state = step.key === 'placed' ? 'completed' : 'pending'
    } else if (stepPriority < currentPriority) {
      state = 'completed'
    } else if (stepPriority === currentPriority) {
      state = 'current'
    }

    const dateValue = getTimelineDateByStatus(order, step.key)

    return {
      ...step,
      state,
      dateValue,
      dateLabel: dateValue ? formatDateTime(dateValue) : '',
    }
  })
}

export const buildSellerReturnTimeline = (order) => {
  const returnStatus = String(order?.returnRequest?.status || '').toLowerCase()
  if (!returnStatus) return []

  const normalizedStatus = returnStatus === 'approved' ? 'accepted' : returnStatus
  const currentPriority = RETURN_STATUS_PRIORITY[normalizedStatus] ?? -1
  const isRejected = normalizedStatus === 'rejected'

  const steps = SELLER_RETURN_FLOW.map((step) => {
    const stepPriority = RETURN_STATUS_PRIORITY[step.key] ?? -1
    let state = 'pending'

    if (isRejected) {
      state = step.key === 'requested' ? 'completed' : 'pending'
    } else if (stepPriority < currentPriority) {
      state = 'completed'
    } else if (stepPriority === currentPriority) {
      state = 'current'
    }

    const dateValue = getReturnTimelineDateByStatus(order, step.key)

    return {
      ...step,
      state,
      dateValue,
      dateLabel: dateValue ? formatDateTime(dateValue) : '',
    }
  })

  if (isRejected) {
    const rejectedDate = getReturnTimelineDateByStatus(order, 'rejected')
    steps.push({
      key: 'rejected',
      label: 'Return Rejected',
      state: 'current',
      dateValue: rejectedDate,
      dateLabel: rejectedDate ? formatDateTime(rejectedDate) : '',
    })
  }

  return steps
}
