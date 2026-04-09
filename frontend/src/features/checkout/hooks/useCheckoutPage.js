import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useUIStore from '@/shared/uiSlice'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import {
  createCheckoutAddress,
  deleteCheckoutAddress,
  fetchCheckoutAddresses,
  fetchCheckoutCart,
  lookupCheckoutAddressByPincode,
  reverseGeocodeCheckoutAddress,
  setCheckoutDefaultAddress,
  updateCheckoutAddress,
} from '@/features/checkout/api/checkout.api'
import {
  clearCheckoutDraft,
  computeCheckoutSummary,
  createCheckoutItemsFromCart,
  getDefaultAddressId,
  getExpectedDeliveryText,
  initialCheckoutAddressForm,
  normalizePincode,
  readCheckoutDraft,
  saveCheckoutDraft,
  toAddressPayload,
  validateCheckoutAddressForm,
} from '@/features/checkout/utils/checkout.utils'

const toVariantIds = (items = []) => items.map((item) => String(item.variantId || item.id || '')).filter(Boolean)

const toSelectionFromRoute = (state) => {
  if (!Array.isArray(state?.variantIds)) return []
  return state.variantIds.map((id) => String(id)).filter(Boolean)
}

const useCheckoutPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pushToast = useUIStore((state) => state.pushToast)

  const [loading, setLoading] = useState(true)
  const [checkoutItems, setCheckoutItems] = useState([])
  const [selectedVariantIds, setSelectedVariantIds] = useState([])

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressListError, setAddressListError] = useState('')

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState('')
  const [addressForm, setAddressForm] = useState(initialCheckoutAddressForm)
  const [addressFormErrors, setAddressFormErrors] = useState({})
  const [addressSubmitError, setAddressSubmitError] = useState('')
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [deleteTargetAddress, setDeleteTargetAddress] = useState(null)

  const [continueLoading, setContinueLoading] = useState(false)

  const summary = useMemo(() => computeCheckoutSummary(checkoutItems), [checkoutItems])
  const expectedDeliveryText = useMemo(() => getExpectedDeliveryText(7), [])

  const refreshAddresses = useCallback(
    async (preferredAddressId = '') => {
      const nextAddresses = await fetchCheckoutAddresses()
      setAddresses(nextAddresses)

      const preferredStillExists = nextAddresses.some((address) => address._id === preferredAddressId)
      if (preferredAddressId && preferredStillExists) {
        setSelectedAddressId(preferredAddressId)
      } else {
        setSelectedAddressId((current) => {
          if (current && nextAddresses.some((address) => address._id === current)) return current
          return getDefaultAddressId(nextAddresses)
        })
      }

      return nextAddresses
    },
    []
  )

  const loadCheckout = useCallback(async () => {
    setLoading(true)
    setAddressListError('')

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
      const routeSelection = toSelectionFromRoute(location.state)
      const draftSelection = Array.isArray(draft?.variantIds) ? draft.variantIds.map(String) : []
      const requestedSelection = routeSelection.length ? routeSelection : draftSelection

      if (!requestedSelection.length) {
        clearCheckoutDraft()
        pushToast({
          type: 'warning',
          title: 'Select checkout items',
          message: 'Please select the cart items you want to order.',
        })
        navigate(ROUTES.CART, { replace: true })
        return
      }

      const nextItems = createCheckoutItemsFromCart(cartItems, requestedSelection)

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

      setCheckoutItems(nextItems)
      setSelectedVariantIds(toVariantIds(nextItems))

      setAddresses(fetchedAddresses)
      const preferredAddressId = location.state?.addressId || draft?.addressId || ''
      const defaultAddressId = getDefaultAddressId(fetchedAddresses)

      if (preferredAddressId && fetchedAddresses.some((address) => address._id === preferredAddressId)) {
        setSelectedAddressId(preferredAddressId)
      } else {
        setSelectedAddressId(defaultAddressId)
      }
    } catch (err) {
      setAddressListError(getApiError(err, 'Unable to load checkout details.'))
    } finally {
      setLoading(false)
    }
  }, [location.state, navigate, pushToast])

  useEffect(() => {
    loadCheckout().catch(() => {})
  }, [loadCheckout])

  const openAddAddressModal = () => {
    setEditingAddressId('')
    setAddressForm(initialCheckoutAddressForm)
    setAddressFormErrors({})
    setAddressSubmitError('')
    setAddressModalOpen(true)
  }

  const openEditAddressModal = (address) => {
    setEditingAddressId(address._id)
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      pincode: address.pincode || '',
      street: address.street || '',
      building: address.building || '',
      landmark: address.landmark || '',
      locality: address.city || address.district || '',
      state: address.state || '',
      label: address.label || 'home',
      isDefault: Boolean(address.isDefault),
    })
    setAddressFormErrors({})
    setAddressSubmitError('')
    setAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    if (addressSubmitting) return
    setAddressModalOpen(false)
    setEditingAddressId('')
    setAddressForm(initialCheckoutAddressForm)
    setAddressFormErrors({})
    setAddressSubmitError('')
  }

  const updateAddressFormField = (field) => (event) => {
    const value = event?.target?.value
    setAddressForm((prev) => ({ ...prev, [field]: value }))
    setAddressFormErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleAddressPincodeChange = (event) => {
    const pincode = normalizePincode(event.target.value)
    setAddressForm((prev) => ({ ...prev, pincode }))
    setAddressFormErrors((prev) => {
      if (!prev.pincode) return prev
      const next = { ...prev }
      delete next.pincode
      return next
    })
  }

  const setAddressDefaultFlag = (checked) => {
    setAddressForm((prev) => ({ ...prev, isDefault: Boolean(checked) }))
  }

  const handleAddressPincodeLookup = async () => {
    const pincode = normalizePincode(addressForm.pincode)

    if (pincode.length !== 6) {
      setAddressFormErrors((prev) => ({ ...prev, pincode: 'Enter a valid 6 digit pincode.' }))
      return
    }

    setPincodeLookupLoading(true)
    try {
      const lookup = await lookupCheckoutAddressByPincode(pincode)
      setAddressForm((prev) => ({
        ...prev,
        pincode,
        state: String(lookup?.state || '').trim() || prev.state,
        locality: String(lookup?.locality || '').trim() || prev.locality,
      }))
    } catch (err) {
      setAddressSubmitError(getApiError(err, 'Could not resolve this pincode.'))
    } finally {
      setPincodeLookupLoading(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setAddressSubmitError('Current location is not supported in this browser.')
      return
    }

    setLocationLoading(true)
    setAddressSubmitError('')

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        )
      })

      const lookup = await reverseGeocodeCheckoutAddress({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      })

      setAddressForm((prev) => ({
        ...prev,
        street: prev.street || String(lookup?.street || '').trim(),
        state: String(lookup?.state || '').trim() || prev.state,
        locality: String(lookup?.locality || '').trim() || prev.locality,
        pincode: normalizePincode(lookup?.pincode || prev.pincode),
      }))
    } catch (err) {
      if (err?.code === 1) {
        setAddressSubmitError('Location permission denied. Please allow location access and try again.')
      } else {
        setAddressSubmitError(getApiError(err, 'Unable to fetch your current location.'))
      }
    } finally {
      setLocationLoading(false)
    }
  }

  const submitAddressForm = async (event) => {
    event.preventDefault()

    const validation = validateCheckoutAddressForm(addressForm)
    if (!validation.isValid) {
      setAddressFormErrors(validation.errors)
      return
    }

    setAddressSubmitting(true)
    setAddressSubmitError('')

    try {
      const payload = toAddressPayload(addressForm)
      let targetAddressId = editingAddressId

      if (editingAddressId) {
        await updateCheckoutAddress(editingAddressId, payload)
      } else {
        const createdAddress = await createCheckoutAddress(payload)
        targetAddressId = createdAddress?._id || ''
      }

      if (addressForm.isDefault && targetAddressId) {
        await setCheckoutDefaultAddress(targetAddressId)
      }

      await refreshAddresses(targetAddressId)
      closeAddressModal()

      pushToast({
        type: 'success',
        title: editingAddressId ? 'Address updated' : 'Address added',
        message: editingAddressId
          ? 'Delivery address updated successfully.'
          : 'Address added successfully.',
      })
    } catch (err) {
      setAddressSubmitError(getApiError(err, 'Unable to save address.'))
    } finally {
      setAddressSubmitting(false)
    }
  }

  const confirmDeleteAddress = async () => {
    if (!deleteTargetAddress?._id) return

    const deletingId = deleteTargetAddress._id
    setDeleteTargetAddress(null)

    try {
      await deleteCheckoutAddress(deletingId)
      const nextAddresses = await refreshAddresses('')

      if (selectedAddressId === deletingId) {
        const nextDefaultId = getDefaultAddressId(nextAddresses)
        setSelectedAddressId(nextDefaultId)
      }

      pushToast({ type: 'info', title: 'Address deleted', message: 'Address removed from your account.' })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'Delete failed',
        message: getApiError(err, 'Could not delete this address.'),
      })
    }
  }

  const continueToPayment = async () => {
    if (!selectedAddressId) {
      pushToast({ type: 'warning', title: 'Select address', message: 'Please select a delivery address.' })
      return
    }

    if (!selectedVariantIds.length) {
      pushToast({ type: 'warning', title: 'No items selected', message: 'Please review your cart items first.' })
      navigate(ROUTES.CART)
      return
    }

    setContinueLoading(true)

    try {
      const draft = {
        variantIds: selectedVariantIds,
        addressId: selectedAddressId,
        totalAmount: summary.totalAmount,
        totalItems: summary.totalItems,
      }

      saveCheckoutDraft(draft)

      navigate(ROUTES.CHECKOUT_PAYMENT, {
        state: {
          variantIds: selectedVariantIds,
          addressId: selectedAddressId,
          totalAmount: summary.totalAmount,
        },
      })
    } finally {
      setContinueLoading(false)
    }
  }

  return {
    loading,
    checkoutItems,
    summary,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    addressListError,
    expectedDeliveryText,

    addressModalOpen,
    editingAddressId,
    addressForm,
    addressFormErrors,
    addressSubmitError,
    addressSubmitting,
    pincodeLookupLoading,
    locationLoading,
    deleteTargetAddress,
    setDeleteTargetAddress,

    openAddAddressModal,
    openEditAddressModal,
    closeAddressModal,
    updateAddressFormField,
    setAddressDefaultFlag,
    handleAddressPincodeChange,
    handleAddressPincodeLookup,
    handleUseCurrentLocation,
    submitAddressForm,
    confirmDeleteAddress,

    continueLoading,
    canContinue: Boolean(selectedAddressId && checkoutItems.length),
    continueToPayment,
  }
}

export default useCheckoutPage
