import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CardElement } from '@stripe/react-stripe-js'
import useCartStore from '@/features/cart/cartSlice'
import useUIStore from '@/shared/uiSlice'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import {
  confirmCheckoutPayment,
  fetchCheckoutAddresses,
  fetchCheckoutCart,
  initiateCheckoutPayment,
  placeCheckoutOrder,
} from '@/features/checkout/api/checkout.api'
import {
  readSavedItems,
  writeSavedItems,
} from '@/features/cart/utils/cartPage.utils'
import {
  clearCheckoutDraft,
  computeCheckoutSummary,
  createCheckoutItemsFromCart,
  getDefaultAddressId,
  readCheckoutDraft,
} from '@/features/checkout/utils/checkout.utils'

const asIdList = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((id) => String(id)).filter(Boolean)
}

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms)
})

const toSavedItemKey = (item) => String(item?.id || item?.variantId || '')

const mergeSavedItems = (previousSavedItems = [], currentSavedItems = []) => {
  const mergedByKey = new Map()

  previousSavedItems.forEach((item) => {
    const key = toSavedItemKey(item)
    if (key) mergedByKey.set(key, item)
  })

  currentSavedItems.forEach((item) => {
    const key = toSavedItemKey(item)
    if (key) mergedByKey.set(key, item)
  })

  return Array.from(mergedByKey.values())
}

const restoreMissingSavedItems = (savedSnapshot = []) => {
  const currentSavedItems = readSavedItems()
  const currentKeys = new Set(currentSavedItems.map(toSavedItemKey).filter(Boolean))

  const hasMissingSavedItem = savedSnapshot.some((item) => !currentKeys.has(toSavedItemKey(item)))
  if (!hasMissingSavedItem) return

  writeSavedItems(mergeSavedItems(savedSnapshot, currentSavedItems))
}

const useCheckoutPaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pushToast = useUIStore((state) => state.pushToast)
  const setCart = useCartStore((state) => state.setCart)

  const [loading, setLoading] = useState(true)
  const [checkoutItems, setCheckoutItems] = useState([])
  const [variantIds, setVariantIds] = useState([])
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [pageError, setPageError] = useState('')

  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const [createdOrderIds, setCreatedOrderIds] = useState([])
  const [paymentInitData, setPaymentInitData] = useState(null)

  const selectedAddress = useMemo(
    () => addresses.find((address) => address._id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  )

  const summary = useMemo(() => computeCheckoutSummary(checkoutItems), [checkoutItems])

  const loadPaymentPage = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const [cart, fetchedAddresses] = await Promise.all([
        fetchCheckoutCart(),
        fetchCheckoutAddresses(),
      ])

      const cartItems = cart?.items || []
      if (!cartItems.length) {
        clearCheckoutDraft()
        pushToast({ type: 'warning', title: 'Cart is empty', message: 'Add items to continue checkout.' })
        navigate(ROUTES.CART, { replace: true })
        return
      }

      const draft = readCheckoutDraft()
      const routeVariantIds = asIdList(location.state?.variantIds)
      const draftVariantIds = asIdList(draft?.variantIds)
      const requestedVariantIds = routeVariantIds.length ? routeVariantIds : draftVariantIds

      if (!requestedVariantIds.length) {
        clearCheckoutDraft()
        pushToast({
          type: 'warning',
          title: 'Select checkout items',
          message: 'Please select the cart items you want to order.',
        })
        navigate(ROUTES.CART, { replace: true })
        return
      }

      const nextItems = createCheckoutItemsFromCart(cartItems, requestedVariantIds)

      if (!nextItems.length) {
        clearCheckoutDraft()
        pushToast({
          type: 'warning',
          title: 'Selected items unavailable',
          message: 'Your selected checkout items are no longer in cart. Please reselect.',
        })
        navigate(ROUTES.CART, { replace: true })
        return
      }

      const nextVariantIds = nextItems.map((item) => item.variantId)
      if (!nextVariantIds.length) {
        pushToast({ type: 'warning', title: 'No checkout items', message: 'Please review your cart again.' })
        navigate(ROUTES.CART, { replace: true })
        return
      }

      setCheckoutItems(nextItems)
      setVariantIds(nextVariantIds)
      setAddresses(fetchedAddresses)

      const preferredAddressId = location.state?.addressId || draft?.addressId || ''
      const defaultAddressId = getDefaultAddressId(fetchedAddresses)

      const resolvedAddressId = preferredAddressId && fetchedAddresses.some((address) => address._id === preferredAddressId)
        ? preferredAddressId
        : defaultAddressId

      if (!resolvedAddressId) {
        pushToast({ type: 'warning', title: 'Address required', message: 'Please select a delivery address first.' })
        navigate(ROUTES.CHECKOUT, {
          replace: true,
          state: { variantIds: nextVariantIds },
        })
        return
      }

      setSelectedAddressId(resolvedAddressId)
    } catch (err) {
      setPageError(getApiError(err, 'Unable to load payment page.'))
    } finally {
      setLoading(false)
    }
  }, [location.state, navigate, pushToast])

  useEffect(() => {
    loadPaymentPage().catch(() => {})
  }, [loadPaymentPage])

  const createOrdersIfNeeded = useCallback(async () => {
    if (createdOrderIds.length) return createdOrderIds

    const orders = await placeCheckoutOrder({
      variantIds,
      addressId: selectedAddressId,
    })

    const orderIds = (orders || []).map((order) => String(order?._id || '')).filter(Boolean)
    if (!orderIds.length) {
      throw new Error('Order could not be created. Please try again.')
    }

    setCreatedOrderIds(orderIds)
    return orderIds
  }, [createdOrderIds, selectedAddressId, variantIds])

  const createPaymentIntentIfNeeded = useCallback(async (orderIds) => {
    if (paymentInitData?.clientSecret) return paymentInitData

    const data = await initiateCheckoutPayment({
      orderIds,
      addressId: selectedAddressId,
      paymentMethod,
    })

    if (!data?.clientSecret) {
      throw new Error('Unable to initiate payment.')
    }

    setPaymentInitData(data)
    return data
  }, [paymentInitData, selectedAddressId, paymentMethod])

  const confirmPaymentOnServer = useCallback(async ({ purchaseId, paymentIntentId }) => {
    if (!purchaseId || !paymentIntentId) return

    const retryDelays = [0, 600, 1200]

    for (const delayMs of retryDelays) {
      if (delayMs) {
        await wait(delayMs)
      }

      try {
        await confirmCheckoutPayment({ purchaseId, paymentIntentId })
        return
      } catch {
        // retry
      }
    }
  }, [])

  const syncCartAfterPaymentSuccess = useCallback(async () => {
    const checkoutVariantIds = new Set(variantIds.map((id) => String(id)))
    if (!checkoutVariantIds.size) return

    const retryDelays = [0, 600, 1200, 1800]

    for (const delayMs of retryDelays) {
      if (delayMs) {
        await wait(delayMs)
      }

      let freshCart = null
      try {
        freshCart = await fetchCheckoutCart({ cache: false, dedupe: false, force: true })
      } catch {
        continue
      }

      setCart(freshCart)

      const stillPresent = (freshCart?.items || []).some((item) =>
        checkoutVariantIds.has(String(item?.variantId || ''))
      )

      if (!stillPresent) {
        return
      }
    }
  }, [setCart, variantIds])

  const handlePlaceOrder = useCallback(async (stripe, elements) => {
    setPaymentError('')
    const savedSnapshot = readSavedItems()

    if (paymentMethod !== 'card') {
      setPaymentError('Only card payment is currently available in this build.')
      return
    }

    if (!stripe || !elements) {
      setPaymentError('Payment gateway is still loading. Please wait a moment.')
      return
    }

    if (!selectedAddressId) {
      setPaymentError('Please choose a delivery address before payment.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card input is not ready yet. Please try again.')
      return
    }

    setProcessing(true)

    try {
      const orderIds = await createOrdersIfNeeded()
      const initData = await createPaymentIntentIfNeeded(orderIds)

      const { error, paymentIntent } = await stripe.confirmCardPayment(initData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: selectedAddress?.fullName,
            phone: selectedAddress?.phone,
            address: {
              line1: selectedAddress?.street,
              city: selectedAddress?.city || selectedAddress?.district,
              state: selectedAddress?.state,
              postal_code: selectedAddress?.pincode,
              country: 'IN',
            },
          },
        },
      })

      if (error) {
        setPaymentError(error.message || 'Payment failed. Please try another card.')
        return
      }

      if (paymentIntent?.status !== 'succeeded') {
        setPaymentError('Payment did not complete successfully. Please try again.')
        return
      }

      await confirmPaymentOnServer({
        purchaseId: initData.purchaseId,
        paymentIntentId: paymentIntent.id,
      })

      clearCheckoutDraft()
      await syncCartAfterPaymentSuccess().catch(() => {})

      const firstOrderId = orderIds[0]
      const query = new URLSearchParams({
        orderIds: orderIds.join(','),
        purchaseId: initData.purchaseId || '',
        paymentIntentId: paymentIntent.id || '',
      })

      pushToast({
        type: 'success',
        title: 'Payment successful',
        message: 'Your order is being finalized.',
      })

      navigate(`${ROUTES.CHECKOUT_CONFIRMATION.replace(':orderId', firstOrderId)}?${query.toString()}`, {
        replace: true,
      })
    } catch (err) {
      const message = getApiError(err, 'Payment processing failed. Please try again.')
      setPaymentError(message)

      if (err?.response?.status === 410) {
        pushToast({
          type: 'warning',
          title: 'Cart changed',
          message: 'Some items changed during checkout. Please review your cart again.',
        })
        navigate(ROUTES.CART)
      }
    } finally {
      restoreMissingSavedItems(savedSnapshot)
      setProcessing(false)
    }
  }, [
    createOrdersIfNeeded,
    createPaymentIntentIfNeeded,
    confirmPaymentOnServer,
    navigate,
    paymentMethod,
    pushToast,
    selectedAddress,
    selectedAddressId,
    syncCartAfterPaymentSuccess,
  ])

  const handleChangeAddress = () => {
    navigate(ROUTES.CHECKOUT, {
      state: {
        variantIds,
        addressId: selectedAddressId,
      },
    })
  }

  return {
    loading,
    checkoutItems,
    summary,
    addresses,
    selectedAddress,
    selectedAddressId,
    paymentMethod,
    pageError,
    processing,
    paymentError,

    setPaymentMethod,
    handleChangeAddress,
    handlePlaceOrder,
  }
}

export default useCheckoutPaymentPage
