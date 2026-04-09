import { queryGet, queryPost } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'
import {
  createAddress,
  deleteAddress,
  listAddresses,
  lookupAddressByPincode,
  reverseGeocodeAddress,
  setDefaultAddress,
  updateAddress,
} from '@/features/user/api'
import { fetchCart } from '@/features/cart/api/cart.api'

const unwrapData = (response) => response?.data?.data || response?.data || {}

export const fetchCheckoutCart = (options) => fetchCart(options)

export const fetchCheckoutAddresses = () => listAddresses()

export const createCheckoutAddress = (payload) => createAddress(payload)

export const updateCheckoutAddress = (addressId, payload) => updateAddress(addressId, payload)

export const deleteCheckoutAddress = (addressId) => deleteAddress(addressId)

export const setCheckoutDefaultAddress = (addressId) => setDefaultAddress(addressId)

export const lookupCheckoutAddressByPincode = (pincode) => lookupAddressByPincode(pincode)

export const reverseGeocodeCheckoutAddress = ({ lat, lon }) => reverseGeocodeAddress({ lat, lon })

export const placeCheckoutOrder = async ({ variantIds, addressId }) => {
  const response = await queryPost(
    API_ENDPOINTS.ORDERS,
    { variantIds, addressId },
    {},
    { invalidateTags: ['cart'] }
  )

  const data = unwrapData(response)
  return data.orders || []
}

export const initiateCheckoutPayment = async ({ orderIds, addressId, paymentMethod = 'card' }) => {
  const response = await queryPost(API_ENDPOINTS.PAYMENT_INITIATE, { orderIds, addressId, paymentMethod })
  return unwrapData(response)
}

export const confirmCheckoutPayment = async ({ purchaseId, paymentIntentId }) => {
  const response = await queryPost(API_ENDPOINTS.PAYMENT_CONFIRM, { purchaseId, paymentIntentId })
  return unwrapData(response)
}

export const fetchCheckoutOrderById = async (orderId) => {
  const response = await queryGet(`${API_ENDPOINTS.ORDERS}/${orderId}`, {}, { cache: false, dedupe: false })
  return unwrapData(response).order || null
}

export const fetchCheckoutPaymentHistory = async () => {
  const response = await queryGet(API_ENDPOINTS.PAYMENT_HISTORY, {}, { cache: false, dedupe: false })
  return unwrapData(response)
}
