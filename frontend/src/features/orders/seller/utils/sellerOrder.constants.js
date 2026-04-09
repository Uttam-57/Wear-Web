export const SELLER_ORDER_PANEL_TABS = {
  ORDERS: 'orders',
  RETURNS: 'returns',
}

export const SELLER_ORDER_STATUS_TABS = {
  ALL: 'all',
  PENDING_ACTION: 'pending_action',
  COMPLETED: 'completed',
}

export const SELLER_ORDER_DATE_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
}

export const SELLER_ORDER_DATE_OPTIONS = [
  { value: SELLER_ORDER_DATE_FILTERS.ALL, label: 'All Dates' },
  { value: SELLER_ORDER_DATE_FILTERS.TODAY, label: 'Today' },
  { value: SELLER_ORDER_DATE_FILTERS.LAST_7_DAYS, label: 'Last 7 days' },
  { value: SELLER_ORDER_DATE_FILTERS.LAST_30_DAYS, label: 'Last 30 days' },
]

export const SELLER_ORDER_FLOW = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export const SELLER_RETURN_FLOW = [
  { key: 'requested', label: 'Return Requested' },
  { key: 'accepted', label: 'Return Accepted' },
  { key: 'picked', label: 'Item Picked' },
  { key: 'received', label: 'Item Received' },
  { key: 'refund_completed', label: 'Refund Completed' },
]

export const STATUS_PRIORITY = {
  placed: 0,
  accepted: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
}

export const RETURN_STATUS_PRIORITY = {
  requested: 0,
  accepted: 1,
  picked: 2,
  received: 3,
  refund_completed: 4,
}

export const PENDING_ACTION_STATUSES = new Set(['placed', 'accepted', 'packed'])
export const COMPLETED_STATUSES = new Set(['delivered', 'cancelled', 'rejected'])
