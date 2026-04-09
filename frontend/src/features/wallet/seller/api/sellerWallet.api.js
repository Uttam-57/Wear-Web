import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet, queryPost } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || {}

export const getSellerWallet = async () => {
  const response = await queryGet(
    API_ENDPOINTS.WALLET,
    {},
    { ttlMs: 5 * 60 * 1000, tags: ['wallet:seller'] }
  )

  return unwrapData(response)
}

export const getSellerWalletTransactions = async ({ page = 1, limit = 10 } = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.WALLET_TRANSACTIONS,
    { params: { page, limit } },
    { ttlMs: 5 * 60 * 1000, tags: ['wallet:seller:transactions'] }
  )

  return unwrapData(response)
}

export const requestSellerWalletPayout = async ({ amount }) => {
  const response = await queryPost(
    API_ENDPOINTS.WALLET_WITHDRAW,
    { amount },
    {},
    { invalidateTags: ['wallet:seller', 'wallet:seller:transactions', 'analytics:seller'] }
  )

  return unwrapData(response)
}
