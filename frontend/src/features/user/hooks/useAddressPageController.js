import { useCallback, useEffect, useRef, useState } from 'react'
import useAddresses from '@/features/user/hooks/useAddresses'
import { lookupAddressByPincode, reverseGeocodeAddress } from '@/features/user/api'
import {
  INDIA_COUNTRY,
  getAddressLocality,
  initialAddressForm,
  normalizePincode,
} from '@/features/user/utils/address.utils'

const useAddressPageController = () => {
  const { addresses, loading, error, refresh, create, update, remove, setDefault } = useAddresses()

  const [form, setForm] = useState(initialAddressForm)
  const [editingId, setEditingId] = useState('')
  const [openMenuId, setOpenMenuId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const lastResolvedPincodeRef = useRef('')

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const updateFormField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const resetForm = () => {
    setForm(initialAddressForm)
    setEditingId('')
    setOpenMenuId('')
    setSubmitError('')
    lastResolvedPincodeRef.current = ''
  }

  const handleEdit = (address) => {
    setForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      label: address.label || 'home',
      street: address.street || '',
      building: address.building || '',
      landmark: address.landmark || '',
      locality: getAddressLocality(address),
      state: address.state || '',
      pincode: address.pincode || '',
    })
    setEditingId(address._id)
    setOpenMenuId('')
    setSubmitError('')
    lastResolvedPincodeRef.current = normalizePincode(address.pincode)
  }

  const handlePincodeLookup = useCallback(
    async (rawPincode = form.pincode) => {
      const pincode = normalizePincode(rawPincode)

      if (pincode.length !== 6) {
        return false
      }

      try {
        const lookup = await lookupAddressByPincode(pincode)
        const detectedState = (lookup?.state || '').trim()
        const detectedLocality = (lookup?.locality || '').trim()

        setForm((prev) => ({
          ...prev,
          pincode,
          state: detectedState || prev.state,
          locality: detectedLocality || prev.locality,
        }))

        lastResolvedPincodeRef.current = pincode
        return true
      } catch {
        lastResolvedPincodeRef.current = ''
        return false
      }
    },
    [form.pincode]
  )

  const handlePincodeChange = (e) => {
    const pincode = normalizePincode(e.target.value)
    setForm((prev) => ({ ...prev, pincode }))

    if (pincode.length === 6 && lastResolvedPincodeRef.current !== pincode) {
      handlePincodeLookup(pincode).catch(() => {})
    }
  }

  const handleUseCurrentLocation = async () => {
    setSubmitError('')

    if (!navigator.geolocation) {
      setSubmitError('Current location is not supported in this browser.')
      return
    }

    try {
      setLocationLoading(true)

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        )
      })

      const { latitude, longitude } = position.coords
      const lookup = await reverseGeocodeAddress({ lat: latitude, lon: longitude })
      const detectedStreet = (lookup?.street || '').trim()
      const detectedState = (lookup?.state || '').trim()
      const detectedLocality = (lookup?.locality || '').trim()
      const detectedPincode = normalizePincode(lookup?.pincode)

      setForm((prev) => ({
        ...prev,
        street: prev.street || detectedStreet,
        state: detectedState || prev.state,
        locality: detectedLocality || prev.locality,
        pincode: detectedPincode || prev.pincode,
      }))

      if (detectedPincode.length === 6) {
        await handlePincodeLookup(detectedPincode)
      }
    } catch (err) {
      if (err?.code === 1) {
        setSubmitError('Location permission denied. Please allow location access and try again.')
      } else if (err?.code === 3) {
        setSubmitError('Location request timed out. Please try again.')
      } else {
        setSubmitError(err?.message || 'Unable to use current location.')
      }
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const locality = form.locality.trim()

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      label: form.label,
      street: form.street.trim(),
      building: form.building.trim() || null,
      landmark: form.landmark.trim() || null,
      locality,
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      country: INDIA_COUNTRY,
    }

    try {
      setSubmitting(true)
      if (editingId) {
        await update(editingId, payload)
      } else {
        await create(payload)
      }
      resetForm()
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Unable to save address')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    addresses,
    editingId,
    error,
    form,
    loading,
    locationLoading,
    openMenuId,
    setOpenMenuId,
    submitError,
    submitting,
    updateFormField,
    handleEdit,
    handlePincodeChange,
    handlePincodeLookup,
    handleSubmit,
    handleUseCurrentLocation,
    remove,
    resetForm,
    setDefault,
  }
}

export default useAddressPageController
