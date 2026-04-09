import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import {
  confirmSellerOrderDelivery,
  fetchSellerOrders,
  rejectSellerOrder,
  requestSellerReturnPickupOtp,
  updateSellerOrderStatus,
  updateSellerReturnStatus,
} from '@/features/orders/seller/api/sellerOrders.api'
import {
  SELLER_ORDER_DATE_FILTERS,
  SELLER_ORDER_PANEL_TABS,
  SELLER_ORDER_STATUS_TABS,
  applySellerOrderFilters,
  buildSellerReturnsRows,
  countSellerOrdersByStatusTab,
  inferStatusTabFromQueryStatus,
  normalizeSellerOrder,
  normalizeSellerOrders,
  paginateSellerOrders,
} from '@/features/orders/seller/utils/sellerOrders.utils'

const PAGE_SIZE = 8

const isValidPanelTab = (value) => {
  return Object.values(SELLER_ORDER_PANEL_TABS).includes(value)
}

const isValidStatusTab = (value) => {
  return Object.values(SELLER_ORDER_STATUS_TABS).includes(value)
}

const isValidDateFilter = (value) => {
  return Object.values(SELLER_ORDER_DATE_FILTERS).includes(value)
}

const toPositiveInt = (value, fallback = 1) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) return fallback
  return number
}

export default function useSellerOrdersPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [deliveryOtp, setDeliveryOtp] = useState({
    orderId: '',
    value: '',
  })
  const [returnPickupOtp, setReturnPickupOtp] = useState({
    orderId: '',
    value: '',
  })
  const [rejectState, setRejectState] = useState({
    open: false,
    orderId: '',
    reason: '',
    submitting: false,
  })

  const panelTab = useMemo(() => {
    const tab = String(searchParams.get('tab') || SELLER_ORDER_PANEL_TABS.ORDERS)
    return isValidPanelTab(tab) ? tab : SELLER_ORDER_PANEL_TABS.ORDERS
  }, [searchParams])

  const searchTerm = useMemo(() => String(searchParams.get('search') || ''), [searchParams])

  const statusTab = useMemo(() => {
    const explicit = String(searchParams.get('statusTab') || '')
    if (isValidStatusTab(explicit)) return explicit

    const inferred = inferStatusTabFromQueryStatus(searchParams.get('status'))
    return isValidStatusTab(inferred) ? inferred : SELLER_ORDER_STATUS_TABS.ALL
  }, [searchParams])

  const dateFilter = useMemo(() => {
    const value = String(searchParams.get('date') || SELLER_ORDER_DATE_FILTERS.ALL)
    return isValidDateFilter(value) ? value : SELLER_ORDER_DATE_FILTERS.ALL
  }, [searchParams])

  const page = useMemo(() => toPositiveInt(searchParams.get('page'), 1), [searchParams])
  const selectedOrderId = useMemo(() => String(searchParams.get('order') || ''), [searchParams])

  const updateParams = useCallback((updates = {}) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  const loadOrders = useCallback(async (softRefresh = false) => {
    if (softRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const payload = await fetchSellerOrders()
      setOrders(normalizeSellerOrders(payload))
      setError('')
    } catch (err) {
      setError(getApiError(err, 'Unable to load seller orders right now.'))
    } finally {
      if (softRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadOrders(false).catch(() => {})
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    return applySellerOrderFilters(orders, { searchTerm, statusTab, dateFilter })
  }, [orders, searchTerm, statusTab, dateFilter])

  const pagination = useMemo(() => {
    return paginateSellerOrders(filteredOrders, page, PAGE_SIZE)
  }, [filteredOrders, page])

  useEffect(() => {
    if (pagination.page !== page) {
      updateParams({ page: pagination.page })
    }
  }, [page, pagination.page, updateParams])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return orders.find((entry) => entry.id === selectedOrderId) || null
  }, [orders, selectedOrderId])

  useEffect(() => {
    if (selectedOrderId && !selectedOrder) {
      updateParams({ order: null })
    }
  }, [selectedOrder, selectedOrderId, updateParams])

  useEffect(() => {
    if (!selectedOrder) {
      setDeliveryOtp({ orderId: '', value: '' })
      return
    }

    if (selectedOrder.status !== 'out_for_delivery') {
      setDeliveryOtp({ orderId: '', value: '' })
      return
    }

    setDeliveryOtp((previous) => {
      if (previous.orderId === selectedOrder.id) return previous
      return { orderId: selectedOrder.id, value: '' }
    })
  }, [selectedOrder])

  useEffect(() => {
    const rawStatus = String(selectedOrder?.returnRequest?.status || '').toLowerCase()
    const returnStatus = rawStatus === 'approved' ? 'accepted' : rawStatus
    if (!selectedOrder || returnStatus !== 'accepted') {
      setReturnPickupOtp({ orderId: '', value: '' })
      return
    }

    setReturnPickupOtp((previous) => {
      if (previous.orderId === selectedOrder.id) return previous
      return { orderId: selectedOrder.id, value: '' }
    })
  }, [selectedOrder])

  const statusCounts = useMemo(() => {
    return countSellerOrdersByStatusTab(orders)
  }, [orders])

  const returnRows = useMemo(() => {
    return buildSellerReturnsRows(orders)
  }, [orders])

  const setPanelTab = useCallback((nextTab) => {
    if (!isValidPanelTab(nextTab)) return

    if (nextTab === SELLER_ORDER_PANEL_TABS.RETURNS) {
      updateParams({ tab: nextTab, order: null, page: 1 })
      return
    }

    updateParams({ tab: nextTab })
  }, [updateParams])

  const setStatusTab = useCallback((nextTab) => {
    if (!isValidStatusTab(nextTab)) return
    updateParams({ statusTab: nextTab, status: null, page: 1 })
  }, [updateParams])

  const setDateFilter = useCallback((nextFilter) => {
    if (!isValidDateFilter(nextFilter)) return
    updateParams({ date: nextFilter, page: 1 })
  }, [updateParams])

  const setSearchTerm = useCallback((value) => {
    updateParams({ search: value?.trim() || null, page: 1 })
  }, [updateParams])

  const setPage = useCallback((nextPage) => {
    updateParams({ page: toPositiveInt(nextPage, 1) })
  }, [updateParams])

  const openOrderDetail = useCallback((orderId) => {
    updateParams({
      tab: SELLER_ORDER_PANEL_TABS.ORDERS,
      order: orderId,
    })
  }, [updateParams])

  const openReturnDetail = useCallback((orderId) => {
    updateParams({
      tab: SELLER_ORDER_PANEL_TABS.RETURNS,
      order: orderId,
    })
  }, [updateParams])

  const closeOrderDetail = useCallback(() => {
    updateParams({ order: null })
  }, [updateParams])

  const upsertOrder = useCallback((incomingOrder) => {
    const normalized = normalizeSellerOrder(incomingOrder)

    setOrders((previous) => {
      const exists = previous.some((entry) => entry.id === normalized.id)
      if (!exists) return previous

      return previous.map((entry) => {
        if (entry.id !== normalized.id) return entry
        return normalized
      })
    })
  }, [])

  const submitStatusUpdate = useCallback(async ({ orderId, status, successMessage }) => {
    if (!orderId || !status) return

    setActionLoading(orderId)

    try {
      const updated = await updateSellerOrderStatus({ orderId, status })
      upsertOrder(updated)
      pushToast({
        type: 'success',
        title: 'Order Updated',
        message: successMessage || 'Order status was updated successfully.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'Update Failed',
        message: getApiError(err, 'Unable to update order status right now.'),
      })
    } finally {
      setActionLoading('')
    }
  }, [pushToast, upsertOrder])

  const setDeliveryOtpValue = useCallback((orderId, value) => {
    const safeOtp = String(value || '').replace(/\D/g, '').slice(0, 6)
    setDeliveryOtp({ orderId, value: safeOtp })
  }, [])

  const setReturnPickupOtpValue = useCallback((orderId, value) => {
    const safeOtp = String(value || '').replace(/\D/g, '').slice(0, 6)
    setReturnPickupOtp({ orderId, value: safeOtp })
  }, [])

  const submitDeliveryOtp = useCallback(async (orderId) => {
    const otp = String(deliveryOtp.value || '').trim()

    if (!orderId) return
    if (!/^\d{6}$/.test(otp)) {
      pushToast({
        type: 'warning',
        title: 'Invalid OTP',
        message: 'Please enter a valid 6-digit OTP.',
      })
      return
    }

    setActionLoading(orderId)

    try {
      const updated = await confirmSellerOrderDelivery({ orderId, otp })
      upsertOrder(updated)
      setDeliveryOtp({ orderId: '', value: '' })
      pushToast({
        type: 'success',
        title: 'Delivery Confirmed',
        message: 'Order delivery has been confirmed successfully.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'OTP Verification Failed',
        message: getApiError(err, 'Unable to confirm delivery with this OTP.'),
      })
    } finally {
      setActionLoading('')
    }
  }, [deliveryOtp.value, pushToast, upsertOrder])

  const submitReturnStatusUpdate = useCallback(async ({ orderId, status, requiresOtp = false, successMessage }) => {
    if (!orderId || !status) return

    const otp = String(returnPickupOtp.value || '').trim()

    if (requiresOtp && !/^\d{6}$/.test(otp)) {
      pushToast({
        type: 'warning',
        title: 'Invalid OTP',
        message: 'Please enter a valid 6-digit pickup OTP.',
      })
      return
    }

    setActionLoading(orderId)

    try {
      const updated = await updateSellerReturnStatus({
        orderId,
        status,
        otp: requiresOtp ? otp : undefined,
      })

      upsertOrder(updated)

      if (status === 'picked') {
        setReturnPickupOtp({ orderId: '', value: '' })
      }

      pushToast({
        type: 'success',
        title: 'Return Updated',
        message: successMessage || 'Return status was updated successfully.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'Update Failed',
        message: getApiError(err, 'Unable to update return status right now.'),
      })
    } finally {
      setActionLoading('')
    }
  }, [pushToast, returnPickupOtp.value, upsertOrder])

  const resendReturnPickupOtp = useCallback(async (orderId) => {
    if (!orderId) return

    setActionLoading(orderId)

    try {
      await requestSellerReturnPickupOtp({ orderId })
      pushToast({
        type: 'success',
        title: 'OTP Sent',
        message: 'Return pickup OTP has been sent to customer email.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'OTP Request Failed',
        message: getApiError(err, 'Unable to send pickup OTP right now.'),
      })
    } finally {
      setActionLoading('')
    }
  }, [pushToast])

  const openRejectModal = useCallback((orderId) => {
    setRejectState({
      open: true,
      orderId,
      reason: '',
      submitting: false,
    })
  }, [])

  const closeRejectModal = useCallback(() => {
    setRejectState({
      open: false,
      orderId: '',
      reason: '',
      submitting: false,
    })
  }, [])

  const setRejectReason = useCallback((value) => {
    setRejectState((previous) => ({ ...previous, reason: value }))
  }, [])

  const submitRejectOrder = useCallback(async () => {
    const orderId = rejectState.orderId
    const reason = rejectState.reason.trim()

    if (!orderId) return
    if (reason.length < 5) return

    setRejectState((previous) => ({ ...previous, submitting: true }))

    try {
      const updated = await rejectSellerOrder({ orderId, reason })
      upsertOrder(updated)
      closeRejectModal()
      pushToast({
        type: 'success',
        title: 'Order Rejected',
        message: 'Order was rejected and stock has been restored.',
      })
    } catch (err) {
      setRejectState((previous) => ({ ...previous, submitting: false }))
      pushToast({
        type: 'danger',
        title: 'Rejection Failed',
        message: getApiError(err, 'Unable to reject this order right now.'),
      })
    }
  }, [closeRejectModal, pushToast, rejectState.orderId, rejectState.reason, upsertOrder])

  const refresh = useCallback(() => {
    return loadOrders(true)
  }, [loadOrders])

  return {
    loading,
    refreshing,
    error,
    panelTab,
    statusTab,
    statusCounts,
    dateFilter,
    searchTerm,
    orders,
    filteredOrders,
    listRows: pagination.items,
    page: pagination.page,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    selectedOrder,
    selectedOrderId,
    returnRows,
    actionLoading,
    deliveryOtp,
    returnPickupOtp,
    rejectState,
    setPanelTab,
    setStatusTab,
    setDateFilter,
    setSearchTerm,
    setPage,
    openOrderDetail,
    openReturnDetail,
    closeOrderDetail,
    submitStatusUpdate,
    setDeliveryOtpValue,
    submitDeliveryOtp,
    setReturnPickupOtpValue,
    submitReturnStatusUpdate,
    resendReturnPickupOtp,
    openRejectModal,
    closeRejectModal,
    setRejectReason,
    submitRejectOrder,
    refresh,
  }
}
