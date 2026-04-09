export const getOrderActionDateMeta = ({ order, expectedDeliveryDate }) => {
  if (!order) {
    return {
      label: 'Expected Delivery',
      value: expectedDeliveryDate,
    }
  }

  const returnStatus = String(order.returnRequest?.status || '').toLowerCase()
  if (returnStatus && returnStatus !== 'refund_completed') {
    return {
      label: `Return ${returnStatus.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}`,
      value:
        order.returnRequest?.receivedAt
        || order.returnRequest?.pickedAt
        || order.returnRequest?.acceptedAt
        || order.returnRequest?.requestedAt,
    }
  }

  if (order.uiStatus === 'delivered') {
    return {
      label: 'Delivered Date',
      value: order.deliveredAt,
    }
  }

  if (order.uiStatus === 'cancelled') {
    return {
      label: 'Cancelled Date',
      value: order.cancelledAt,
    }
  }

  if (order.uiStatus === 'returned') {
    return {
      label: 'Returned Date',
      value: order.returnRequest?.refundCompletedAt || order.returnRequest?.resolvedAt || order.returnRequest?.requestedAt,
    }
  }

  return {
    label: 'Expected Delivery',
    value: expectedDeliveryDate,
  }
}

export const getReasonLabel = (options, value) => {
  return options.find((option) => option.value === value)?.label || 'Other'
}

export const getOrderAmountSaved = (order) => {
  if (!order) return 0
  return Math.max(0, Number(order.pricing.discount || 0))
}
