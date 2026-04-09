export const ORDER_UI_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

export const STATUS_UI_MAP = {
  pending: ORDER_UI_STATUS.PENDING,
  placed: ORDER_UI_STATUS.PENDING,
  processing: ORDER_UI_STATUS.PROCESSING,
  accepted: ORDER_UI_STATUS.PROCESSING,
  packed: ORDER_UI_STATUS.PROCESSING,
  shipped: ORDER_UI_STATUS.SHIPPED,
  out_for_delivery: ORDER_UI_STATUS.OUT_FOR_DELIVERY,
  delivered: ORDER_UI_STATUS.DELIVERED,
  cancelled: ORDER_UI_STATUS.CANCELLED,
  rejected: ORDER_UI_STATUS.CANCELLED,
  returned: ORDER_UI_STATUS.RETURNED,
}

export const STATUS_META = {
  [ORDER_UI_STATUS.PENDING]: {
    label: 'Pending',
    badgeVariant: 'default',
  },
  [ORDER_UI_STATUS.PROCESSING]: {
    label: 'Processing',
    badgeVariant: 'primary',
  },
  [ORDER_UI_STATUS.SHIPPED]: {
    label: 'Shipped',
    badgeVariant: 'warning',
  },
  [ORDER_UI_STATUS.OUT_FOR_DELIVERY]: {
    label: 'Out for Delivery',
    badgeVariant: 'primary',
  },
  [ORDER_UI_STATUS.DELIVERED]: {
    label: 'Delivered',
    badgeVariant: 'success',
  },
  [ORDER_UI_STATUS.CANCELLED]: {
    label: 'Cancelled',
    badgeVariant: 'danger',
  },
  [ORDER_UI_STATUS.RETURNED]: {
    label: 'Returned',
    badgeVariant: 'primary',
  },
}

export const ACTIVE_RETURN_STATUS_META = {
  requested: {
    label: 'Return Requested',
    badgeVariant: 'warning',
  },
  accepted: {
    label: 'Return Accepted',
    badgeVariant: 'primary',
  },
  picked: {
    label: 'Return Picked',
    badgeVariant: 'primary',
  },
  received: {
    label: 'Return Received',
    badgeVariant: 'success',
  },
  rejected: {
    label: 'Return Rejected',
    badgeVariant: 'danger',
  },
}
