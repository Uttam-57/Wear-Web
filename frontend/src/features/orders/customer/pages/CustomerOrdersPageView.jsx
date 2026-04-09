import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import { Alert, Button, Card, Input, PageHeader, Spinner } from '@/shared/ui'
import { formatDate, formatPrice } from '@/shared/utils/formatters'
import { getDefaultProductFallback } from '@/shared/constants/media'
import { downloadOrderInvoiceBlob, fetchCustomerOrders } from '@/features/orders/api/orders.api'
import {
  buildOrdersQueryParams,
  ORDER_FILTERS,
  SORT_OPTIONS,
} from '@/features/orders/customer/utils/ordersQuery.utils'
import {
  ORDER_UI_STATUS,
  applyClientOrderFilters,
  buildTimePeriodOptions,
  countOrdersByStatus,
  getExpectedDeliveryDate,
  getItemMoreLabel,
  getStatusText,
  normalizeOrders,
} from '@/features/orders/utils/orders.utils'

const PAGE_SIZE = 10
const QUERY_LIMIT = 200
const CUSTOMER_ORDERS_PAGE_CACHE_TTL_MS = 5 * 60 * 1000

let customerOrdersPageCache = null

const getCustomerOrdersPageCache = () => {
  if (!customerOrdersPageCache) return null
  if (Date.now() - customerOrdersPageCache.updatedAt > CUSTOMER_ORDERS_PAGE_CACHE_TTL_MS) {
    customerOrdersPageCache = null
    return null
  }
  return customerOrdersPageCache
}

const setCustomerOrdersPageCache = (payload) => {
  customerOrdersPageCache = {
    ...payload,
    updatedAt: Date.now(),
  }
}

const FALLBACK_IMAGE = getDefaultProductFallback(500, 80)

const OrdersFilterPanel = ({
  selectedStatus,
  onStatusChange,
  counts,
  timePeriod,
  onTimePeriodChange,
  onClearFilters,
  timePeriodOptions,
}) => {
  return (
    <div className="space-y-sm">
      <Card className="space-y-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Order Status</p>
        </div>

        <div className="space-y-2">
          <label className="flex w-full cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="radio"
              name="order_status"
              checked={selectedStatus === 'all'}
              onChange={() => onStatusChange('all')}
              className="h-4 w-4 border-border accent-primary"
            />
            <span>All Orders ({counts.all || 0})</span>
          </label>

          {ORDER_FILTERS.map((filter) => (
            <label key={filter.value} className="flex w-full cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="radio"
                name="order_status"
                checked={selectedStatus === filter.value}
                onChange={() => onStatusChange(filter.value)}
                className="h-4 w-4 border-border accent-primary"
              />
              <span>{filter.label} ({counts[filter.value] || 0})</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="space-y-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Time Period</p>
        </div>

        <div className="space-y-2">
          {timePeriodOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="radio"
                name="order_time_period"
                checked={timePeriod === option.value}
                onChange={() => onTimePeriodChange(option.value)}
                className="h-4 w-4 border-border accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Button variant="secondary" fullWidth onClick={onClearFilters}>Clear Filters</Button>
    </div>
  )
}

const OrderItemRow = ({ item }) => {
  return (
    <div className="grid gap-sm border-b border-border/70 py-sm last:border-b-0 sm:grid-cols-[84px,1fr] sm:items-start">
      <img
        src={item.imageUrl || FALLBACK_IMAGE}
        alt={item.productName}
        className="h-24 w-20 rounded-lg border border-border object-cover"
        loading="lazy"
      />

      <div className="space-y-1">
        <p className="text-md font-semibold text-text-primary">{item.productName}</p>
        <p className="text-sm text-text-secondary">Size: {item.size} | Color: {item.colorName}</p>
        <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
        <p className="text-sm text-text-secondary">Total: {formatPrice(item.subtotal)}</p>
      </div>
    </div>
  )
}

const OrderCard = ({
  order,
  expanded,
  onToggleExpand,
  downloadingInvoice,
  onDownloadInvoice,
}) => {
  const statusText = getStatusText(order)
  const firstItem = order.items[0]
  const extraItemsLabel = getItemMoreLabel(order)
  const expectedDeliveryDate = getExpectedDeliveryDate(order)
  const returnStatus = String(order?.returnRequest?.status || '').toLowerCase()
  const normalizedReturnStatus = returnStatus === 'approved' ? 'accepted' : returnStatus
  const hasActiveReturn = Boolean(order?.returnRequest && normalizedReturnStatus && normalizedReturnStatus !== 'refund_completed')
  const isDelivered = order.uiStatus === ORDER_UI_STATUS.DELIVERED
  const isCancelled = order.uiStatus === ORDER_UI_STATUS.CANCELLED
  const isReturned = order.uiStatus === ORDER_UI_STATUS.RETURNED

  const returnDateByStatus =
    normalizedReturnStatus === 'rejected'
      ? order?.returnRequest?.rejectedAt || order?.returnRequest?.resolvedAt
      : normalizedReturnStatus === 'received'
        ? order?.returnRequest?.receivedAt
        : normalizedReturnStatus === 'picked'
          ? order?.returnRequest?.pickedAt
          : normalizedReturnStatus === 'accepted'
            ? order?.returnRequest?.acceptedAt
            : order?.returnRequest?.requestedAt

  const statusDate =
    hasActiveReturn
      ? returnDateByStatus ||
        order?.returnRequest?.receivedAt ||
        order?.returnRequest?.pickedAt ||
        order?.returnRequest?.acceptedAt ||
        order?.returnRequest?.requestedAt
      : isDelivered
      ? order.deliveredAt
      : isCancelled
          ? order.cancelledAt
          : isReturned
            ? order.returnRequest?.refundCompletedAt || order.returnRequest?.resolvedAt || order.returnRequest?.requestedAt
            : expectedDeliveryDate

  const statusDateLabel =
    hasActiveReturn
      ? 'Return Update'
      : isDelivered
      ? 'Delivered Date'
      : isCancelled
        ? 'Cancelled Date'
        : isReturned
          ? 'Returned Date'
          : 'Expected Delivery'

  return (
    <Card className="space-y-sm">
      <div className="grid gap-0.5 sm:grid-cols-[1fr,220px]">
        <div className="space-y-sm border-b border-border/70 pb-sm sm:border-b-0 sm:pb-0">
          {expanded ? (
            <div className="space-y-1">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid gap-sm sm:grid-cols-[110px,1fr] sm:items-start">
              <img
                src={firstItem?.imageUrl || FALLBACK_IMAGE}
                alt={firstItem?.productName || 'Order item'}
                className="h-[120px] w-[100px] rounded-lg border border-border object-cover"
                loading="lazy"
              />

              <div className="space-y-1">
                <p className="text-md font-semibold text-text-primary">{firstItem?.productName || 'Item'}</p>
                <p className="text-sm text-text-secondary">Size: {firstItem?.size || '-'}, Color: {firstItem?.colorName || '-'}</p>
                <p className="text-sm text-text-secondary">Qty: {firstItem?.quantity || 1}</p>
                <p className="text-sm text-text-secondary">
                  Item Total: {formatPrice(firstItem?.subtotal || 0)}
                </p>
                {extraItemsLabel ? (
                  <button
                    type="button"
                    onClick={onToggleExpand}
                    className="text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {extraItemsLabel}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-0.5 sm:pl-0.5">
          <p className="text-md font-semibold text-text-primary">{statusText}</p>
          {statusDate ? (
            <p className="text-sm text-text-secondary">
              {statusDateLabel}: {formatDate(statusDate)}
            </p>
          ) : null}
          <p className="text-sm text-text-secondary">Placed Date: {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-sm">
        <div className="flex flex-wrap items-center gap-2">
          {!expanded && order.items.length > 1 ? (
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>View All Items</Button>
          ) : null}

          {expanded && order.items.length > 1 ? (
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>Show Less</Button>
          ) : null}

          <Button as={Link} to={ROUTES.ORDER_DETAIL.replace(':id', order.id)} variant="secondary" size="sm">
            View Details
          </Button>

          {order.uiStatus === ORDER_UI_STATUS.DELIVERED ? (
            <Button
              variant="secondary"
              size="sm"
              loading={downloadingInvoice}
              onClick={onDownloadInvoice}
            >
              Download Invoice
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-text-muted">
          {order.uiStatus === ORDER_UI_STATUS.CANCELLED
            ? 'Cancelled orders do not include invoices.'
            : order.uiStatus === ORDER_UI_STATUS.RETURNED
              ? 'Returned orders do not include invoices.'
              : null}
        </p>
      </div>
    </Card>
  )
}

export default function OrdersPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const cachedOrdersPageState = getCustomerOrdersPageCache()

  const [loading, setLoading] = useState(() => !cachedOrdersPageState)
  const [error, setError] = useState(() => cachedOrdersPageState?.error || '')
  const [orders, setOrders] = useState(() => cachedOrdersPageState?.orders || [])
  const [allOrdersForCount, setAllOrdersForCount] = useState(() => cachedOrdersPageState?.allOrdersForCount || [])

  const [selectedStatus, setSelectedStatus] = useState(() => cachedOrdersPageState?.selectedStatus || 'all')
  const [timePeriod, setTimePeriod] = useState(() => cachedOrdersPageState?.timePeriod || 'last_30_days')
  const [sortBy, setSortBy] = useState(() => cachedOrdersPageState?.sortBy || 'recent')
  const [searchInput, setSearchInput] = useState(() => cachedOrdersPageState?.searchInput || '')
  const [search, setSearch] = useState(() => cachedOrdersPageState?.search || '')
  const [visibleCount, setVisibleCount] = useState(() => cachedOrdersPageState?.visibleCount || PAGE_SIZE)

  const [expandedIds, setExpandedIds] = useState(() => cachedOrdersPageState?.expandedIds || [])
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState('')

  const timePeriodOptions = useMemo(() => buildTimePeriodOptions(new Date()), [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const loadOrderCounts = useCallback(async ({ background = false } = {}) => {
    try {
      const result = await fetchCustomerOrders({ page: 1, limit: QUERY_LIMIT, sort: '-createdAt' })
      setAllOrdersForCount(normalizeOrders(result.orders))
    } catch {
      if (!background) {
        setAllOrdersForCount([])
      }
    }
  }, [])

  const loadOrders = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setLoading(true)
      setError('')
    }

    try {
      const params = buildOrdersQueryParams({
        selectedStatus,
        timePeriod,
        search,
        sortBy,
          queryLimit: QUERY_LIMIT,
      })

      const result = await fetchCustomerOrders(params)
      const normalizedOrders = normalizeOrders(result.orders)
      setOrders(normalizedOrders)

      if (!background) {
        setVisibleCount(PAGE_SIZE)
        setExpandedIds([])
      }
    } catch (err) {
      if (!background) {
        setError(getApiError(err, 'Unable to load your orders right now.'))
      }
    } finally {
      if (!background) {
        setLoading(false)
      }
    }
  }, [search, selectedStatus, sortBy, timePeriod])

  useEffect(() => {
    loadOrders().catch(() => {})
  }, [loadOrders])

  useEffect(() => {
    loadOrderCounts().catch(() => {})
  }, [loadOrderCounts])

  useEffect(() => {
    setCustomerOrdersPageCache({
      loading,
      error,
      orders,
      allOrdersForCount,
      selectedStatus,
      timePeriod,
      sortBy,
      searchInput,
      search,
      visibleCount,
      expandedIds,
    })
  }, [
    loading,
    error,
    orders,
    allOrdersForCount,
    selectedStatus,
    timePeriod,
    sortBy,
    searchInput,
    search,
    visibleCount,
    expandedIds,
  ])

  const filteredOrders = useMemo(() => {
    return applyClientOrderFilters(orders, {
      selectedStatuses: selectedStatus === 'all' ? [] : [selectedStatus],
      timePeriod,
      search,
      sortBy,
      referenceDate: new Date(),
    })
  }, [orders, search, selectedStatus, sortBy, timePeriod])

  const counts = useMemo(() => {
    const source = allOrdersForCount.length ? allOrdersForCount : orders
    return countOrdersByStatus(source)
  }, [allOrdersForCount, orders])

  const visibleOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount)
  }, [filteredOrders, visibleCount])

  const hasMore = filteredOrders.length > visibleCount
  const hasAnyOrder = counts.all > 0 || orders.length > 0

  const handleStatusChange = (status) => {
    setSelectedStatus(status || 'all')
  }

  const handleClearFilters = () => {
    setSelectedStatus('all')
    setTimePeriod('last_30_days')
    setSortBy('recent')
    setSearchInput('')
    setSearch('')
    setVisibleCount(PAGE_SIZE)
  }

  const handleToggleExpand = (orderId) => {
    setExpandedIds((prev) => {
      if (prev.includes(orderId)) return prev.filter((id) => id !== orderId)
      return [...prev, orderId]
    })
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const handleDownloadInvoice = async (order) => {
    if (order.uiStatus !== ORDER_UI_STATUS.DELIVERED) {
      pushToast({
        type: 'info',
        title: 'Invoice unavailable',
        message: 'Invoice is available only after successful delivery.',
      })
      return
    }

    setDownloadingInvoiceId(order.id)

    try {
      const blob = await downloadOrderInvoiceBlob(order.id)
      if (!(blob instanceof Blob)) {
        throw new Error('Invoice download is not available right now.')
      }

      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${order.orderNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      pushToast({
        type: 'warning',
        title: 'Invoice unavailable',
        message: getApiError(err, 'Invoice is not available for this order yet.'),
      })
    } finally {
      setDownloadingInvoiceId('')
    }
  }

  return (
    <div className="page-shell space-y-md pb-xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to={ROUTES.PROFILE} className="hover:text-primary">My Account</Link>
        <span>/</span>
        <span className="text-text-secondary">My Orders</span>
      </nav>

      <PageHeader title="My Orders" subtitle="Track, manage, and review every purchase in one place." />

      <section className="grid gap-md lg:grid-cols-[280px,1fr]">
        <aside>
          <OrdersFilterPanel
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            counts={counts}
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
            onClearFilters={handleClearFilters}
            timePeriodOptions={timePeriodOptions}
          />
        </aside>

        <div className="space-y-sm">
          <Card className="space-y-sm">
            <div className="grid gap-sm md:grid-cols-[1fr,220px] md:items-center">
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by product name"
                aria-label="Search orders"
              />

              <div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-xl"><Spinner size="lg" /></div>
          ) : null}

          {!loading && error ? <Alert>{error}</Alert> : null}

          {!loading && !error && !hasAnyOrder ? (
            <Card className="space-y-sm py-xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-tertiary text-xl text-text-secondary">
                O
              </div>
              <h2 className="text-lg font-semibold text-text-primary">You have not placed any orders yet</h2>
              <p className="text-sm text-text-secondary">Start shopping to see your orders here.</p>
              <div>
                <Button as={Link} to={ROUTES.PRODUCTS}>Start Shopping</Button>
              </div>
            </Card>
          ) : null}

          {!loading && !error && hasAnyOrder && filteredOrders.length === 0 ? (
            <Card className="space-y-sm py-xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-tertiary text-xl text-text-secondary">
                F
              </div>
              <h2 className="text-lg font-semibold text-text-primary">No orders found</h2>
              <p className="text-sm text-text-secondary">Try adjusting your filters or search term.</p>
              <div>
                <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>
              </div>
            </Card>
          ) : null}

          {!loading && !error && visibleOrders.length > 0 ? (
            <div className="space-y-sm">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedIds.includes(order.id)}
                  onToggleExpand={() => handleToggleExpand(order.id)}
                  downloadingInvoice={downloadingInvoiceId === order.id}
                  onDownloadInvoice={() => handleDownloadInvoice(order)}
                />
              ))}

              <Card className="flex flex-wrap items-center justify-between gap-sm">
                <p className="text-sm text-text-secondary">
                  Showing {Math.min(visibleCount, filteredOrders.length)} of {filteredOrders.length} orders
                </p>

                {hasMore ? (
                  <Button variant="secondary" onClick={handleLoadMore}>Load More Orders</Button>
                ) : (
                  <p className="text-xs text-text-muted">You reached the end of your orders.</p>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
