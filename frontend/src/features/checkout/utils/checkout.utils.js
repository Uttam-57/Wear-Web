import { formatDate } from '@/shared/utils/formatters'

export const CHECKOUT_DRAFT_STORAGE_KEY = 'wearweb_checkout_draft_v1'

const INDIA_COUNTRY = 'India'

const toId = (value) => String(value || '')

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getSnapshotImage = (snapshot) => {
  const firstImage = snapshot?.images?.[0]
  if (!firstImage) return ''
  if (typeof firstImage === 'string') return firstImage
  return firstImage.url || ''
}

export const createCheckoutItemsFromCart = (cartItems = [], selectedVariantIds = []) => {
  const selectedSet = new Set((selectedVariantIds || []).map((id) => String(id)))
  const shouldFilterBySelection = selectedSet.size > 0

  const filtered = (cartItems || []).filter((item) => {
    const variantId = toId(item?.variantId)
    return shouldFilterBySelection ? selectedSet.has(variantId) : Boolean(variantId)
  })

  return filtered.map((item) => {
    const quantity = Math.max(1, toNumber(item?.quantity, 1))
    const price = Math.max(0, toNumber(item?.snapshot?.price, 0))
    const effectivePrice = Math.max(0, toNumber(item?.snapshot?.effectivePrice, price))

    return {
      id: toId(item?.variantId),
      productId: toId(item?.productId),
      variantId: toId(item?.variantId),
      quantity,
      name: item?.snapshot?.productName || 'Product',
      size: item?.snapshot?.size || '-',
      colorName: item?.snapshot?.colorName || '-',
      image: getSnapshotImage(item?.snapshot),
      price,
      effectivePrice,
      subtotal: Number((effectivePrice * quantity).toFixed(2)),
      discountTotal: Number(((price - effectivePrice) * quantity).toFixed(2)),
    }
  })
}

export const computeCheckoutSummary = (items = []) => {
  const safeItems = items || []

  const totalItems = safeItems.reduce((sum, item) => sum + item.quantity, 0)
  const itemKinds = safeItems.length
  const priceBeforeDiscount = Number(
    safeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
  )
  const totalDiscount = Number(safeItems.reduce((sum, item) => sum + item.discountTotal, 0).toFixed(2))
  const deliveryCharges = 0
  const totalAmount = Number((priceBeforeDiscount - totalDiscount + deliveryCharges).toFixed(2))

  return {
    totalItems,
    itemKinds,
    priceBeforeDiscount,
    totalDiscount,
    deliveryCharges,
    totalAmount,
  }
}

export const addBusinessDays = (startDate, businessDays) => {
  const result = new Date(startDate)
  let remaining = Math.max(0, Number(businessDays) || 0)

  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      remaining -= 1
    }
  }

  return result
}

export const getExpectedDeliveryText = (businessDays = 7) => {
  const expectedDate = addBusinessDays(new Date(), businessDays)
  return `${formatDate(expectedDate)} (5-7 business days)`
}

export const getDefaultAddressId = (addresses = []) => {
  const defaultAddress = (addresses || []).find((address) => address.isDefault)
  return defaultAddress?._id || addresses?.[0]?._id || ''
}

export const normalizePhone = (value) => String(value || '').replace(/\s+/g, '')

export const normalizePincode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6)

export const initialCheckoutAddressForm = {
  fullName: '',
  phone: '',
  pincode: '',
  street: '',
  building: '',
  landmark: '',
  locality: '',
  state: '',
  label: 'home',
  isDefault: false,
}

export const toAddressPayload = (form = {}) => {
  const locality = String(form.locality || '').trim()

  return {
    fullName: String(form.fullName || '').trim(),
    phone: normalizePhone(form.phone),
    country: INDIA_COUNTRY,
    state: String(form.state || '').trim(),
    locality,
    street: String(form.street || '').trim(),
    building: String(form.building || '').trim() || null,
    landmark: String(form.landmark || '').trim() || null,
    pincode: normalizePincode(form.pincode),
    label: form.label || 'home',
  }
}

export const validateCheckoutAddressForm = (form = {}) => {
  const payload = toAddressPayload(form)
  const errors = {}

  if (!payload.fullName) {
    errors.fullName = 'Full name is required.'
  } else if (payload.fullName.length > 100) {
    errors.fullName = 'Full name cannot exceed 100 characters.'
  }

  if (!payload.phone) {
    errors.phone = 'Phone number is required.'
  } else if (!/^\+?[1-9]\d{9,14}$/.test(payload.phone)) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!payload.pincode) {
    errors.pincode = 'Pincode is required.'
  } else if (!/^\d{6}$/.test(payload.pincode)) {
    errors.pincode = 'Enter a valid 6 digit pincode.'
  }

  if (!payload.street) {
    errors.street = 'Address line is required.'
  } else if (payload.street.length > 200) {
    errors.street = 'Address line cannot exceed 200 characters.'
  }

  if (payload.building && payload.building.length > 100) {
    errors.building = 'Building cannot exceed 100 characters.'
  }

  if (payload.landmark && payload.landmark.length > 100) {
    errors.landmark = 'Landmark cannot exceed 100 characters.'
  }

  if (!payload.locality) {
    errors.locality = 'City / locality is required.'
  } else if (payload.locality.length > 100) {
    errors.locality = 'City / locality cannot exceed 100 characters.'
  }

  if (!payload.state) {
    errors.state = 'State is required.'
  } else if (payload.state.length > 60) {
    errors.state = 'State cannot exceed 60 characters.'
  }

  if (!['home', 'work', 'other'].includes(payload.label)) {
    errors.label = 'Select a valid address type.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    payload,
  }
}

export const getAddressLocality = (address = {}) => {
  return String(address.city || address.district || '').trim()
}

export const formatAddressPreview = (address = {}) => {
  const parts = [
    address.street,
    address.building,
    address.landmark,
    getAddressLocality(address),
    address.state,
    address.pincode,
  ]

  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
}

export const saveCheckoutDraft = (draft) => {
  if (!draft || typeof draft !== 'object') return
  sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
}

export const readCheckoutDraft = () => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const clearCheckoutDraft = () => {
  sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
}
