import {
  COMPLETED_STATUSES,
  PENDING_ACTION_STATUSES,
  SELLER_ORDER_DATE_FILTERS,
  SELLER_ORDER_STATUS_TABS,
} from '@/features/orders/seller/utils/sellerOrder.constants'
import { startOfDay, toDate } from '@/features/orders/seller/utils/sellerOrders.normalizers'

const matchesDateFilter = (order, dateFilter) => {
  if (!dateFilter || dateFilter === SELLER_ORDER_DATE_FILTERS.ALL) return true

  const createdDate = toDate(order?.createdAt)
  if (!createdDate) return false

  const today = startOfDay(new Date())
  const orderDay = startOfDay(createdDate)

  if (dateFilter === SELLER_ORDER_DATE_FILTERS.TODAY) {
    return orderDay.getTime() === today.getTime()
  }

  if (dateFilter === SELLER_ORDER_DATE_FILTERS.LAST_7_DAYS) {
    const start = new Date(today)
    start.setDate(start.getDate() - 7)
    return orderDay >= start
  }

  if (dateFilter === SELLER_ORDER_DATE_FILTERS.LAST_30_DAYS) {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return orderDay >= start
  }

  return true
}

const matchesStatusTab = (order, statusTab) => {
  if (!statusTab || statusTab === SELLER_ORDER_STATUS_TABS.ALL) return true

  const status = String(order?.status || '').toLowerCase()

  if (statusTab === SELLER_ORDER_STATUS_TABS.PENDING_ACTION) {
    return PENDING_ACTION_STATUSES.has(status)
  }

  if (statusTab === SELLER_ORDER_STATUS_TABS.COMPLETED) {
    return COMPLETED_STATUSES.has(status)
  }

  return true
}

const matchesSearch = (order, searchTerm) => {
  const term = String(searchTerm || '').trim().toLowerCase()
  if (!term) return true

  const inOrderNumber = String(order?.orderNumber || '').toLowerCase().includes(term)
  if (inOrderNumber) return true

  const inCustomer = String(order?.customer?.name || '').toLowerCase().includes(term)
  if (inCustomer) return true

  return (order?.items || []).some((item) => String(item?.productName || '').toLowerCase().includes(term))
}

export const applySellerOrderFilters = (orders = [], filters = {}) => {
  const {
    searchTerm = '',
    statusTab = SELLER_ORDER_STATUS_TABS.ALL,
    dateFilter = SELLER_ORDER_DATE_FILTERS.ALL,
  } = filters

  return (orders || []).filter((order) => {
    return matchesSearch(order, searchTerm)
      && matchesStatusTab(order, statusTab)
      && matchesDateFilter(order, dateFilter)
  })
}

export const countSellerOrdersByStatusTab = (orders = []) => {
  const counts = {
    all: 0,
    pending_action: 0,
    completed: 0,
  }

  ;(orders || []).forEach((order) => {
    counts.all += 1

    const status = String(order?.status || '').toLowerCase()
    if (PENDING_ACTION_STATUSES.has(status)) counts.pending_action += 1
    if (COMPLETED_STATUSES.has(status)) counts.completed += 1
  })

  return counts
}

export const paginateSellerOrders = (orders = [], page = 1, pageSize = 8) => {
  const safePageSize = Math.max(1, Number(pageSize) || 8)
  const totalItems = orders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (safePage - 1) * safePageSize

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    items: orders.slice(start, start + safePageSize),
  }
}

export const buildSellerReturnsRows = (orders = []) => {
  return (orders || [])
    .filter((order) => Boolean(order?.returnRequest))
    .map((order) => {
      const firstItem = order?.items?.[0]
      const extraCount = Math.max(0, (order?.items?.length || 0) - 1)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order?.customer?.name || 'Customer',
        productName: firstItem?.productName || 'Order item',
        variantText: `Size: ${firstItem?.size || '-'}, ${firstItem?.colorName || '-'}`,
        moreLabel: extraCount > 0 ? `+ ${extraCount} more` : '',
        reason: order?.returnRequest?.reason || 'No reason shared',
        status: String(order?.returnRequest?.status || 'requested').toLowerCase(),
      }
    })
}
