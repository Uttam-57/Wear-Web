import { formatOrderStatus } from '@/shared/utils/formatters'
import {
  PENDING_ACTION_STATUSES,
  SELLER_ORDER_STATUS_TABS,
} from '@/features/orders/seller/utils/sellerOrder.constants'
import { toNumber } from '@/features/orders/seller/utils/sellerOrders.normalizers'

export const getSellerOrderStatusMeta = (status) => {
  const key = String(status || '').toLowerCase()

  if (['placed', 'accepted', 'packed'].includes(key)) {
    return {
      label: formatOrderStatus(key),
      badgeVariant: 'warning',
      group: SELLER_ORDER_STATUS_TABS.PENDING_ACTION,
    }
  }

  if (['shipped', 'out_for_delivery'].includes(key)) {
    return {
      label: formatOrderStatus(key),
      badgeVariant: 'primary',
      group: SELLER_ORDER_STATUS_TABS.ALL,
    }
  }

  if (key === 'delivered') {
    return {
      label: 'Delivered',
      badgeVariant: 'success',
      group: SELLER_ORDER_STATUS_TABS.COMPLETED,
    }
  }

  if (['cancelled', 'rejected'].includes(key)) {
    return {
      label: formatOrderStatus(key),
      badgeVariant: 'danger',
      group: SELLER_ORDER_STATUS_TABS.COMPLETED,
    }
  }

  return {
    label: formatOrderStatus(key || 'placed'),
    badgeVariant: 'default',
    group: SELLER_ORDER_STATUS_TABS.ALL,
  }
}

export const getSellerOrderActionModel = (status) => {
  const key = String(status || '').toLowerCase()

  if (key === 'placed') {
    return {
      primaryLabel: 'Accept Order',
      nextStatus: 'accepted',
      showReject: true,
      infoText: '',
    }
  }

  if (key === 'accepted') {
    return {
      primaryLabel: 'Mark as Packed',
      nextStatus: 'packed',
      showReject: false,
      infoText: '',
    }
  }

  if (key === 'packed') {
    return {
      primaryLabel: 'Mark as Shipped',
      nextStatus: 'shipped',
      showReject: false,
      infoText: '',
    }
  }

  if (key === 'shipped') {
    return {
      primaryLabel: 'Out for Delivery',
      nextStatus: 'out_for_delivery',
      showReject: false,
      infoText: '',
    }
  }

  if (key === 'out_for_delivery') {
    return {
      primaryLabel: 'Mark as Delivered',
      nextStatus: '',
      showReject: false,
      infoText: 'Enter customer OTP below and then mark as delivered.',
    }
  }

  if (key === 'rejected') {
    return {
      primaryLabel: '',
      nextStatus: '',
      showReject: false,
      infoText: 'Order has been rejected and stock was restored.',
    }
  }

  if (key === 'cancelled') {
    return {
      primaryLabel: '',
      nextStatus: '',
      showReject: false,
      infoText: 'Order was cancelled.',
    }
  }

  return {
    primaryLabel: '',
    nextStatus: '',
    showReject: false,
    infoText: 'No action required.',
  }
}

export const getSellerReturnActionModel = (returnRequest) => {
  const raw = String(returnRequest?.status || 'requested').toLowerCase()
  const key = raw === 'approved' ? 'accepted' : raw

  if (key === 'requested') {
    return {
      primaryLabel: 'Accept Return',
      nextStatus: 'accepted',
      secondaryLabel: 'Reject Return',
      secondaryStatus: 'rejected',
      requiresOtp: false,
      infoText: 'Approve the return request to start pickup workflow.',
    }
  }

  if (key === 'accepted') {
    return {
      primaryLabel: 'Mark Item Picked',
      nextStatus: 'picked',
      secondaryLabel: 'Resend Pickup OTP',
      secondaryStatus: 'request_pickup_otp',
      requiresOtp: true,
      infoText: 'Enter customer pickup OTP to mark this return as picked.',
    }
  }

  if (key === 'picked') {
    return {
      primaryLabel: 'Mark Item Received',
      nextStatus: 'received',
      secondaryLabel: '',
      secondaryStatus: '',
      requiresOtp: false,
      infoText: 'Confirm when the returned item reaches your warehouse.',
    }
  }

  if (key === 'received') {
    return {
      primaryLabel: 'Complete Refund',
      nextStatus: 'refund_completed',
      secondaryLabel: '',
      secondaryStatus: '',
      requiresOtp: false,
      infoText: 'Completes refund flow and applies wallet deduction if applicable.',
    }
  }

  if (key === 'refund_completed') {
    return {
      primaryLabel: '',
      nextStatus: '',
      secondaryLabel: '',
      secondaryStatus: '',
      requiresOtp: false,
      infoText: 'Refund has been completed for this return.',
    }
  }

  if (key === 'rejected') {
    return {
      primaryLabel: '',
      nextStatus: '',
      secondaryLabel: '',
      secondaryStatus: '',
      requiresOtp: false,
      infoText: 'Return request was rejected.',
    }
  }

  return {
    primaryLabel: '',
    nextStatus: '',
    secondaryLabel: '',
    secondaryStatus: '',
    requiresOtp: false,
    infoText: 'No return action required.',
  }
}

export const getSellerOrderRowActionLabel = (status) => {
  const key = String(status || '').toLowerCase()
  if (key === 'out_for_delivery') return 'Enter OTP'
  return PENDING_ACTION_STATUSES.has(key) ? 'Process' : 'View'
}

export const getSellerOrderItemPreview = (order) => {
  const firstItem = order?.items?.[0]
  const extraCount = Math.max(0, (order?.items?.length || 0) - 1)

  return {
    title: firstItem?.productName || 'Order item',
    variant: `Size: ${firstItem?.size || '-'}, ${firstItem?.colorName || '-'}`,
    moreLabel: extraCount > 0 ? `+ ${extraCount} more item${extraCount > 1 ? 's' : ''}` : '',
  }
}

export const getSellerOrderPaymentSummary = (order) => {
  const subtotal = toNumber(order?.subtotal, 0)
  const total = toNumber(order?.totalAmount, subtotal)
  const shipping = Math.max(0, Number((total - subtotal).toFixed(2)))

  return {
    subtotal,
    shipping,
    total,
    paymentLabel: order?.payment?.label || 'Pending',
    paymentVariant: order?.payment?.badgeVariant || 'warning',
    paymentMethod: order?.payment?.method || 'Card',
  }
}

export const getSellerReturnStatusMeta = (status) => {
  const key = String(status || '').toLowerCase()

  if (key === 'requested') {
    return { label: 'Pending', badgeVariant: 'warning' }
  }

  if (key === 'accepted') {
    return { label: 'Accepted', badgeVariant: 'primary' }
  }

  if (key === 'picked') {
    return { label: 'Picked', badgeVariant: 'primary' }
  }

  if (key === 'received') {
    return { label: 'Received', badgeVariant: 'success' }
  }

  if (key === 'refund_completed') {
    return { label: 'Refund Completed', badgeVariant: 'success' }
  }

  if (key === 'approved') {
    return { label: 'Accepted', badgeVariant: 'primary' }
  }

  if (key === 'rejected') {
    return { label: 'Rejected', badgeVariant: 'danger' }
  }

  return { label: formatOrderStatus(key), badgeVariant: 'default' }
}

export const inferStatusTabFromQueryStatus = (statusQuery) => {
  const values = String(statusQuery || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (!values.length) return SELLER_ORDER_STATUS_TABS.ALL

  if (values.some((value) => ['pending', 'processing', 'placed', 'accepted', 'packed'].includes(value))) {
    return SELLER_ORDER_STATUS_TABS.PENDING_ACTION
  }

  if (values.some((value) => ['delivered', 'cancelled', 'rejected'].includes(value))) {
    return SELLER_ORDER_STATUS_TABS.COMPLETED
  }

  return SELLER_ORDER_STATUS_TABS.ALL
}
