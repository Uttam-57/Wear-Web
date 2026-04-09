export const INDIA_COUNTRY = 'India'

export const initialAddressForm = {
  fullName: '',
  phone: '',
  label: 'home',
  street: '',
  building: '',
  landmark: '',
  locality: '',
  state: '',
  pincode: '',
}

export const normalizePincode = (value) => (value || '').replace(/\D/g, '').slice(0, 6)

export const labelToTitle = (value) => {
  if (!value) return 'Other'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const getAddressLocality = (address) => {
  return (address.city || address.district || '').trim()
}

export const formatFullAddress = (address) => {
  const locality = getAddressLocality(address)

  return [
    address.street,
    address.building,
    address.landmark,
    locality,
    address.state,
    address.pincode,
  ]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(', ')
}
