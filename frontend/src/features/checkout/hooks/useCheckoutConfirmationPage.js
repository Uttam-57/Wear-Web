import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getApiError } from '@/shared/services/apiClient'
import {
  confirmCheckoutPayment,
  fetchCheckoutOrderById,
  fetchCheckoutPaymentHistory,
} from '@/features/checkout/api/checkout.api'

const toId = (value) => String(value || '')

const getOrderIdsFromQuery = (searchParams, fallbackOrderId) => {
  const queryValue = String(searchParams.get('orderIds') || '')
  const parsed = queryValue
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const withFallback = [fallbackOrderId, ...parsed].filter(Boolean)
  return Array.from(new Set(withFallback))
}

const toOrderLineItems = (orders = []) => {
  return (orders || []).flatMap((order) => {
    return (order.items || []).map((item) => ({
      orderId: toId(order._id),
      variantId: toId(item?.variantId),
      productName: item?.snapshot?.productName || 'Product',
      colorName: item?.snapshot?.colorName || '-',
      size: item?.snapshot?.size || '-',
      quantity: Number(item?.quantity || 0),
      effectivePrice: Number(item?.snapshot?.effectivePrice || 0),
      subtotal: Number(item?.subtotal || 0),
      image: item?.snapshot?.images?.[0]?.url || item?.snapshot?.images?.[0] || '',
    }))
  })
}

const getPaymentMatch = (paymentHistory = [], orders = [], preferredPurchaseId = '') => {
  const purchaseIds = new Set(
    orders
      .map((order) => toId(order.purchaseId))
      .filter(Boolean)
  )

  if (preferredPurchaseId) {
    const byPreferredId = paymentHistory.find(
      (entry) => toId(entry?.purchase?.purchaseId) === toId(preferredPurchaseId)
    )
    if (byPreferredId) return byPreferredId
  }

  if (purchaseIds.size) {
    const byPurchase = paymentHistory.find((entry) => purchaseIds.has(toId(entry?.purchase?.purchaseId)))
    if (byPurchase) return byPurchase
  }

  const orderIdSet = new Set(orders.map((order) => toId(order._id)))
  return paymentHistory.find((entry) => {
    const entryOrderIds = Array.isArray(entry?.purchase?.orderIds)
      ? entry.purchase.orderIds.map((order) => toId(order?._id || order))
      : []
    return entryOrderIds.some((orderId) => orderIdSet.has(orderId))
  }) || null
}

const useCheckoutConfirmationPage = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const purchaseIdFromQuery = searchParams.get('purchaseId') || ''
  const paymentIntentIdFromQuery = searchParams.get('paymentIntentId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [payment, setPayment] = useState(null)

  const loadConfirmation = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (purchaseIdFromQuery && paymentIntentIdFromQuery) {
        await confirmCheckoutPayment({
          purchaseId: purchaseIdFromQuery,
          paymentIntentId: paymentIntentIdFromQuery,
        }).catch(() => null)
      }

      const allOrderIds = getOrderIdsFromQuery(searchParams, orderId)
      const [ordersResult, paymentHistory] = await Promise.all([
        Promise.all(allOrderIds.map((id) => fetchCheckoutOrderById(id))),
        fetchCheckoutPaymentHistory().catch(() => []),
      ])

      const safeOrders = ordersResult.filter(Boolean)
      if (!safeOrders.length) {
        throw new Error('Order not found.')
      }

      setOrders(safeOrders)

      const preferredPurchaseId = searchParams.get('purchaseId') || ''
      const paymentMatch = getPaymentMatch(paymentHistory || [], safeOrders, preferredPurchaseId)
      setPayment(paymentMatch)
    } catch (err) {
      setError(getApiError(err, 'Unable to load confirmation details.'))
    } finally {
      setLoading(false)
    }
  }, [orderId, paymentIntentIdFromQuery, purchaseIdFromQuery, searchParams])

  useEffect(() => {
    loadConfirmation().catch(() => {})
  }, [loadConfirmation])

  const primaryOrder = useMemo(() => orders[0] || null, [orders])

  const lineItems = useMemo(() => toOrderLineItems(orders), [orders])

  const totals = useMemo(() => {
    const itemsTotal = Number(
      lineItems.reduce((sum, item) => sum + (item.effectivePrice * item.quantity), 0).toFixed(2)
    )

    const orderTotal = Number(
      orders.reduce((sum, order) => sum + Number(order?.totalAmount || 0), 0).toFixed(2)
    )

    return {
      itemsTotal,
      totalPaid: orderTotal,
      totalItems: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      discount: 0,
      deliveryCharges: 0,
    }
  }, [lineItems, orders])

  return {
    loading,
    error,
    orders,
    primaryOrder,
    lineItems,
    totals,
    payment,
  }
}

export default useCheckoutConfirmationPage
