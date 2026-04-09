import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Pagination, Spinner } from '@/shared/ui'
import {
  fetchAdminOrders,
  fetchAdminReturns,
  requestAdminReturnPickupOtp,
  resolveAdminReturn,
  updateAdminOrderStatus,
} from '@/features/orders/api/orders.api'
import { formatDateTime, formatOrderStatus, formatPrice } from '@/shared/utils/formatters'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import { ROUTES } from '@/shared/constants/routes'
import ReturnActionModal from '@/features/orders/admin/components/ReturnActionModal'

const ORDER_STATUS_OPTIONS = [
  'placed',
  'accepted',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
]

const PAGE_SIZE = 20
const ORDER_FETCH_LIMIT = 100

const RETURN_ACTIONS = {
  accept: { label: 'Accept Return', status: 'accepted' },
  reject: { label: 'Reject Return', status: 'rejected' },
  picked: { label: 'Mark Picked', status: 'picked' },
  received: { label: 'Mark Received', status: 'received' },
  refund: { label: 'Complete Refund', status: 'refund_completed' },
}

const SORT_OPTIONS = [
  { value: 'timeline_desc', label: 'Timeline: Newest First' },
  { value: 'timeline_asc', label: 'Timeline: Oldest First' },
]

const STATUS_GROUP_OPTIONS = [
  { value: 'all', label: 'All Groups' },
  { value: 'successful', label: 'Successful (Green)' },
  { value: 'rejected', label: 'Rejected (Red)' },
  { value: 'processing', label: 'Processing (Blue)' },
  { value: 'pending', label: 'Pending (Yellow)' },
]

const TIME_WINDOW_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' },
]

const resolveStatusGroup = (status) => {
  const normalized = String(status || '').trim().toLowerCase()

  if (['delivered', 'refund_completed'].includes(normalized)) return 'successful'
  if (['rejected', 'cancelled', 'canceled'].includes(normalized)) return 'rejected'
  if (['requested', 'placed'].includes(normalized)) return 'pending'
  return 'processing'
}

const resolveStatusBadgeVariant = (status) => {
  const group = resolveStatusGroup(status)
  if (group === 'successful') return 'success'
  if (group === 'rejected') return 'danger'
  if (group === 'pending') return 'warning'
  return 'primary'
}

const toTimestamp = (value) => {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const resolveQuarterRange = (windowValue, now) => {
  const year = now.getFullYear()

  if (windowValue === 'q1') return { start: new Date(year, 0, 1).getTime(), end: new Date(year, 3, 1).getTime() }
  if (windowValue === 'q2') return { start: new Date(year, 3, 1).getTime(), end: new Date(year, 6, 1).getTime() }
  if (windowValue === 'q3') return { start: new Date(year, 6, 1).getTime(), end: new Date(year, 9, 1).getTime() }
  if (windowValue === 'q4') return { start: new Date(year, 9, 1).getTime(), end: new Date(year + 1, 0, 1).getTime() }

  return null
}

const matchesTimeWindow = (timestamp, windowValue) => {
  if (windowValue === 'all') return true
  if (!timestamp) return false

  const now = Date.now()
  if (windowValue === '7d') return timestamp >= now - (7 * 24 * 60 * 60 * 1000)
  if (windowValue === '30d') return timestamp >= now - (30 * 24 * 60 * 60 * 1000)

  const quarterRange = resolveQuarterRange(windowValue, new Date(now))
  if (!quarterRange) return true

  return timestamp >= quarterRange.start && timestamp < quarterRange.end
}

const resolveReturnActionButtons = (status) => {
  const normalized = String(status || 'requested').toLowerCase()

  if (normalized === 'requested') return ['accept', 'reject']
  if (normalized === 'accepted') return ['picked']
  if (normalized === 'picked') return ['received']
  if (normalized === 'received') return ['refund']
  return []
}

const getOrderItemSummary = (order) => {
  const first = order?.items?.[0]
  if (!first) return 'No items'

  const name = first?.snapshot?.productName || 'Product'
  const remaining = Math.max(0, Number(order?.items?.length || 0) - 1)
  if (remaining <= 0) return name
  return `${name} +${remaining} more`
}

const getPublicOrderNumber = (order) => {
  return String(order?.orderNumber || '').trim() || 'Unavailable'
}

const getActorId = (actor) => {
  if (!actor) return ''
  if (typeof actor === 'string') return String(actor).trim()
  if (typeof actor !== 'object') return ''
  return String(actor?._id || actor?.id || '').trim()
}

const getActorEmail = (actor) => {
  if (!actor || typeof actor !== 'object') return ''
  return String(actor?.email || '').trim()
}

const getActorName = (actor) => {
  if (!actor || typeof actor !== 'object') return ''
  return `${String(actor?.firstName || '').trim()} ${String(actor?.lastName || '').trim()}`.trim()
}

const getActorPhone = (actor) => {
  if (!actor || typeof actor !== 'object') return ''
  return String(actor?.phone || '').trim()
}

const isActorDeleted = (actor) => {
  if (!actor) return false
  if (typeof actor !== 'object') return false
  return String(actor?.status || '').trim().toLowerCase() === 'deleted'
}

export default function AdminOrdersPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])

  const [sortBy, setSortBy] = useState('timeline_desc')
  const [statusGroupFilter, setStatusGroupFilter] = useState('all')
  const [timeWindow, setTimeWindow] = useState('all')
  const [orderPage, setOrderPage] = useState(1)
  const [returnPage, setReturnPage] = useState(1)

  const [statusDrafts, setStatusDrafts] = useState({})
  const [updatingOrderId, setUpdatingOrderId] = useState('')

  const [actionContext, setActionContext] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [actionOtp, setActionOtp] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const fetchAllAdminOrders = useCallback(async () => {
    let currentPage = 1
    let totalPages = 1
    const aggregatedOrders = []

    while (currentPage <= totalPages) {
      const result = await fetchAdminOrders({ page: currentPage, limit: ORDER_FETCH_LIMIT })
      aggregatedOrders.push(...(Array.isArray(result?.orders) ? result.orders : []))
      totalPages = Number(result?.pagination?.totalPages || 1)
      currentPage += 1
    }

    return aggregatedOrders
  }, [])

  const loadPage = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [nextOrders, returnsResult] = await Promise.all([
        fetchAllAdminOrders(),
        fetchAdminReturns(),
      ])

      setOrders(nextOrders)
      setReturns(Array.isArray(returnsResult) ? returnsResult : [])

      setStatusDrafts(
        nextOrders.reduce((acc, order) => {
          acc[order._id] = order.status || 'placed'
          return acc
        }, {})
      )

      setError('')
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load admin order data.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetchAllAdminOrders])

  useEffect(() => {
    loadPage().catch(() => {})
  }, [loadPage])

  useEffect(() => {
    setOrderPage(1)
    setReturnPage(1)
  }, [sortBy, statusGroupFilter, timeWindow])

  const applyViewTransforms = useCallback((records, { getStatus, getDate }) => {
    return [...records]
      .filter((record) => {
        const recordStatus = getStatus(record)
        if (statusGroupFilter !== 'all' && resolveStatusGroup(recordStatus) !== statusGroupFilter) {
          return false
        }

        const timestamp = toTimestamp(getDate(record))
        return matchesTimeWindow(timestamp, timeWindow)
      })
      .sort((left, right) => {
        const leftTime = toTimestamp(getDate(left))
        const rightTime = toTimestamp(getDate(right))
        return sortBy === 'timeline_asc' ? leftTime - rightTime : rightTime - leftTime
      })
  }, [sortBy, statusGroupFilter, timeWindow])

  const visibleOrders = useMemo(() => {
    return applyViewTransforms(orders, {
      getStatus: (order) => order?.status || '',
      getDate: (order) => order?.createdAt,
    })
  }, [applyViewTransforms, orders])

  const visibleReturns = useMemo(() => {
    return applyViewTransforms(returns, {
      getStatus: (order) => order?.returnRequest?.status || 'requested',
      getDate: (order) => order?.returnRequest?.requestedAt || order?.createdAt,
    })
  }, [applyViewTransforms, returns])

  const orderTotalPages = useMemo(() => Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE)), [visibleOrders.length])
  const returnTotalPages = useMemo(() => Math.max(1, Math.ceil(visibleReturns.length / PAGE_SIZE)), [visibleReturns.length])

  useEffect(() => {
    if (orderPage > orderTotalPages) {
      setOrderPage(orderTotalPages)
    }
  }, [orderPage, orderTotalPages])

  useEffect(() => {
    if (returnPage > returnTotalPages) {
      setReturnPage(returnTotalPages)
    }
  }, [returnPage, returnTotalPages])

  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * PAGE_SIZE
    return visibleOrders.slice(startIndex, startIndex + PAGE_SIZE)
  }, [orderPage, visibleOrders])

  const paginatedReturns = useMemo(() => {
    const startIndex = (returnPage - 1) * PAGE_SIZE
    return visibleReturns.slice(startIndex, startIndex + PAGE_SIZE)
  }, [returnPage, visibleReturns])

  const openUserDetail = useCallback((actorOrId) => {
    const actorId = typeof actorOrId === 'string'
      ? String(actorOrId).trim()
      : getActorId(actorOrId)

    if (!actorId) return
    navigate(ROUTES.ADMIN_USER_DETAIL.replace(':id', actorId))
  }, [navigate])

  const renderActorCell = useCallback((actor, { fallbackDeleted = false } = {}) => {
    const actorId = getActorId(actor)

    const renderDeletedActor = (phone = '') => (
      <div className="space-y-1">
        <p className="text-text-secondary">Deleted</p>
        <p className="text-xs text-text-muted">Mobile: {phone || '-'}</p>
        {actorId ? (
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => openUserDetail(actorId)}
          >
            Open user detail
          </button>
        ) : null}
      </div>
    )

    if (!actor) {
      if (fallbackDeleted) return renderDeletedActor()
      return <p className="text-text-secondary">-</p>
    }

    if (typeof actor !== 'object') {
      if (actorId) return renderDeletedActor()
      if (fallbackDeleted) return renderDeletedActor()
      return <p className="text-text-secondary">-</p>
    }

    if (isActorDeleted(actor)) {
      return renderDeletedActor(getActorPhone(actor))
    }

    const email = getActorEmail(actor)
    const name = getActorName(actor)
    const phone = getActorPhone(actor)
    const primaryText = email || name || '-'

    return (
      <div className="space-y-1">
        <p className="text-text-secondary">{primaryText}</p>
        <p className="text-xs text-text-muted">Mobile: {phone || '-'}</p>
        {actorId ? (
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => openUserDetail(actorId)}
          >
            Open user detail
          </button>
        ) : null}
      </div>
    )
  }, [openUserDetail])

  const handleUpdateOrderStatus = async (order) => {
    const nextStatus = statusDrafts[order._id]
    if (!nextStatus || nextStatus === order.status) return

    setUpdatingOrderId(order._id)
    try {
      await updateAdminOrderStatus({ orderId: order._id, status: nextStatus })
      await loadPage({ silent: true })
      pushToast({ type: 'success', title: 'Order updated', message: `Order status changed to ${formatOrderStatus(nextStatus)}.` })
    } catch (requestError) {
      pushToast({ type: 'danger', title: 'Status update failed', message: getApiError(requestError, 'Unable to update order status.') })
    } finally {
      setUpdatingOrderId('')
    }
  }

  const requestPickupOtp = async (orderId) => {
    try {
      await requestAdminReturnPickupOtp(orderId)
      pushToast({ type: 'success', title: 'OTP sent', message: 'Return pickup OTP sent to customer email.' })
    } catch (requestError) {
      pushToast({ type: 'danger', title: 'OTP request failed', message: getApiError(requestError, 'Unable to request pickup OTP.') })
    }
  }

  const openActionModal = (order, action) => {
    setActionContext({ order, action })
    setActionNote('')
    setActionOtp('')
  }

  const closeActionModal = () => {
    if (submittingAction) return
    setActionContext(null)
    setActionNote('')
    setActionOtp('')
  }

  const submitReturnAction = async () => {
    if (!actionContext?.order?._id || !actionContext?.action) return

    const status = RETURN_ACTIONS[actionContext.action]?.status
    if (!status) return

    setSubmittingAction(true)
    try {
      await resolveAdminReturn({
        orderId: actionContext.order._id,
        status,
        adminNote: actionNote,
        otp: actionContext.action === 'picked' ? actionOtp : undefined,
      })

      await loadPage({ silent: true })
      pushToast({ type: 'success', title: 'Return updated', message: `Return moved to ${formatOrderStatus(status)}.` })
      closeActionModal()
    } catch (requestError) {
      pushToast({ type: 'danger', title: 'Return action failed', message: getApiError(requestError, 'Unable to resolve return action.') })
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Orders and Returns Oversight</h1>
          <p className="section-subtitle">Monitor platform orders and process customer return workflows.</p>
        </div>

        <Button variant="secondary" loading={refreshing} onClick={() => loadPage({ silent: true })}>Refresh</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="space-y-sm">
        <div className="space-y-2 border-b border-border pb-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`rounded-md px-sm py-2 text-sm font-medium ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'}`}
            >
              Orders ({visibleOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`rounded-md px-sm py-2 text-sm font-medium ${activeTab === 'returns' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'}`}
            >
              Return Requests ({visibleReturns.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-[36px] rounded-md border border-border bg-surface-elevated px-sm text-xs"
              aria-label="Sort timeline"
            >
              {SORT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <select
              value={statusGroupFilter}
              onChange={(event) => setStatusGroupFilter(event.target.value)}
              className="h-[36px] rounded-md border border-border bg-surface-elevated px-sm text-xs"
              aria-label="Filter by status group"
            >
              {STATUS_GROUP_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <select
              value={timeWindow}
              onChange={(event) => setTimeWindow(event.target.value)}
              className="h-[36px] rounded-md border border-border bg-surface-elevated px-sm text-xs"
              aria-label="Filter by time window"
            >
              {TIME_WINDOW_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="w-[24%] px-2 py-2">Order</th>
                  <th className="w-[14%] px-2 py-2">Placed At</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="w-[22%] px-2 py-2">Seller</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="w-[145px] px-2 py-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-lg text-center text-sm text-text-secondary">No orders found.</td>
                  </tr>
                ) : paginatedOrders.map((order) => (
                  <tr key={order._id} className="border-b border-border/70 align-top text-sm">
                    <td className="px-2 py-sm">
                      <p className="font-semibold text-text-primary">{getPublicOrderNumber(order)}</p>
                      <p className="text-xs text-text-secondary">{getOrderItemSummary(order)}</p>
                    </td>
                    <td className="px-2 py-sm text-text-secondary">{formatDateTime(order.createdAt)}</td>
                    <td className="px-2 py-sm">{renderActorCell(order.customerId)}</td>
                    <td className="px-2 py-sm">{renderActorCell(order.sellerId, { fallbackDeleted: true })}</td>
                    <td className="px-2 py-sm text-text-secondary">{formatPrice(order.totalAmount)}</td>
                    <td className="px-2 py-sm">
                      <Badge variant={resolveStatusBadgeVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                    </td>
                    <td className="px-2 py-sm text-right">
                      <div className="flex items-end justify-end gap-1">
                        <div className="flex flex-col items-end gap-1">
                        <select
                          value={statusDrafts[order._id] || order.status}
                          onChange={(event) => setStatusDrafts((previous) => ({ ...previous, [order._id]: event.target.value }))}
                          className="h-[32px] min-w-[128px] rounded-md border border-border bg-surface-elevated px-2 text-xs"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{formatOrderStatus(status)}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={updatingOrderId === order._id}
                          disabled={updatingOrderId === order._id}
                          onClick={() => handleUpdateOrderStatus(order)}
                        >
                          Apply
                        </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-2 py-sm">
              <Pagination
                currentPage={orderPage}
                totalPages={orderTotalPages}
                disabled={loading || refreshing}
                onPageChange={setOrderPage}
              />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="w-[30%] px-2 py-2">Order</th>
                  <th className="w-[22%] px-2 py-2">Seller</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Return Status</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Requested At</th>
                  <th className="w-[210px] px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-lg text-center text-sm text-text-secondary">No return requests found.</td>
                  </tr>
                ) : paginatedReturns.map((order) => {
                  const returnStatus = order?.returnRequest?.status || 'requested'
                  const actions = resolveReturnActionButtons(returnStatus)

                  return (
                    <tr key={order._id} className="border-b border-border/70 align-top text-sm">
                      <td className="px-2 py-sm">
                        <p className="font-semibold text-text-primary">{getPublicOrderNumber(order)}</p>
                        <p className="text-xs text-text-secondary">{getOrderItemSummary(order)}</p>
                      </td>
                      <td className="px-2 py-sm">{renderActorCell(order.sellerId, { fallbackDeleted: true })}</td>
                      <td className="px-2 py-sm">{renderActorCell(order.customerId)}</td>
                      <td className="px-2 py-sm">
                        <Badge variant={resolveStatusBadgeVariant(returnStatus)}>
                          {formatOrderStatus(returnStatus)}
                        </Badge>
                      </td>
                      <td className="px-2 py-sm text-text-secondary">{order?.returnRequest?.reason || '-'}</td>
                      <td className="px-2 py-sm text-text-secondary">{formatDateTime(order?.returnRequest?.requestedAt || order.createdAt)}</td>
                      <td className="px-2 py-sm text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {returnStatus === 'accepted' ? (
                            <Button size="sm" variant="secondary" onClick={() => requestPickupOtp(order._id)}>
                              Request Pickup OTP
                            </Button>
                          ) : null}

                          {actions.map((action) => (
                            <Button
                              key={`${order._id}-${action}`}
                              size="sm"
                              variant={action === 'reject' ? 'ghost' : 'secondary'}
                              onClick={() => openActionModal(order, action)}
                            >
                              {RETURN_ACTIONS[action].label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="px-2 py-sm">
              <Pagination
                currentPage={returnPage}
                totalPages={returnTotalPages}
                disabled={loading || refreshing}
                onPageChange={setReturnPage}
              />
            </div>
          </div>
        )}
      </Card>

      <ReturnActionModal
        open={Boolean(actionContext)}
        action={actionContext?.action}
        order={actionContext?.order}
        note={actionNote}
        otp={actionOtp}
        submitting={submittingAction}
        onNoteChange={setActionNote}
        onOtpChange={setActionOtp}
        onClose={closeActionModal}
        onConfirm={submitReturnAction}
        returnActions={RETURN_ACTIONS}
        getPublicOrderNumber={getPublicOrderNumber}
      />
    </div>
  )
}
