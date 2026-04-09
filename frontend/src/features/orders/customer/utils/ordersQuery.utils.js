import { ORDER_UI_STATUS } from '@/features/orders/utils/orders.utils'

export const ORDER_FILTERS = [
  { value: ORDER_UI_STATUS.PENDING, label: 'Pending' },
  { value: ORDER_UI_STATUS.PROCESSING, label: 'Processing' },
  { value: ORDER_UI_STATUS.SHIPPED, label: 'Shipped' },
  { value: ORDER_UI_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { value: ORDER_UI_STATUS.DELIVERED, label: 'Delivered' },
  { value: ORDER_UI_STATUS.CANCELLED, label: 'Cancelled' },
  { value: ORDER_UI_STATUS.RETURNED, label: 'Returned' },
]

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Amount: High to Low' },
  { value: 'amount_asc', label: 'Amount: Low to High' },
]

const toYmd = (date) => {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const buildDateRangeParams = (period, now = new Date()) => {
  const today = new Date(now)
  if (period === 'last_30_days') {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return { startDate: toYmd(start), endDate: toYmd(today) }
  }

  if (period === 'last_6_months') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 6)
    return { startDate: toYmd(start), endDate: toYmd(today) }
  }

  if (String(period || '').startsWith('year_')) {
    const year = Number(String(period).slice(5))
    if (!Number.isFinite(year)) return {}
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    }
  }

  return {}
}

const mapUiStatusToQueryStatus = (status = 'all') => {
  const map = {
    [ORDER_UI_STATUS.PENDING]: ['pending', 'placed'],
    [ORDER_UI_STATUS.PROCESSING]: ['processing', 'accepted', 'packed'],
    [ORDER_UI_STATUS.SHIPPED]: ['shipped'],
    [ORDER_UI_STATUS.OUT_FOR_DELIVERY]: ['out_for_delivery'],
    [ORDER_UI_STATUS.DELIVERED]: ['delivered'],
    [ORDER_UI_STATUS.CANCELLED]: ['cancelled', 'rejected'],
    [ORDER_UI_STATUS.RETURNED]: ['returned'],
  }

  if (!status || status === 'all') return []
  return map[status] || []
}

export const buildOrdersQueryParams = ({ selectedStatus, timePeriod, search, sortBy, queryLimit }) => {
  const sortMap = {
    recent: '-createdAt',
    oldest: 'createdAt',
    amount_desc: '-totalAmount',
    amount_asc: 'totalAmount',
  }

  const params = {
    page: 1,
    limit: queryLimit,
    sort: sortMap[sortBy] || '-createdAt',
  }

  const statusValues = mapUiStatusToQueryStatus(selectedStatus)
  if (statusValues.length) {
    params.status = statusValues.join(',')
  }

  const { startDate, endDate } = buildDateRangeParams(timePeriod)
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate

  if (search) params.search = search

  return params
}
