import { API_ENDPOINTS } from '@/shared/constants/api'
import { queryGet, queryPut } from '@/shared/services/dataClient'

const unwrapData = (response) => response?.data?.data || response?.data || {}

export const getAdminWallets = async ({ page = 1, limit = 20 } = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.ADMIN_WALLETS,
    { params: { page, limit } },
    { ttlMs: 5 * 60 * 1000, tags: ['wallet:admin'] }
  )

  const data = unwrapData(response)
  return {
    wallets: Array.isArray(data?.wallets) ? data.wallets : [],
    pagination: data?.pagination || { page, limit, total: 0, totalPages: 1 },
  }
}

export const getAdminWalletTransactions = async ({ page = 1, limit = 100 } = {}) => {
  const response = await queryGet(
    API_ENDPOINTS.ADMIN_WALLET_TRANSACTIONS,
    { params: { page, limit } },
    { ttlMs: 5 * 60 * 1000, tags: ['wallet:admin'] }
  )

  const data = unwrapData(response)
  return {
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    pagination: data?.pagination || { page, limit, total: 0, totalPages: 1 },
  }
}

export const processAdminPayoutRequest = async ({
  payoutRequestId,
  action,
  rejectCategory,
  rejectDescription,
  settlementTransactionId,
}) => {
  const response = await queryPut(
    `${API_ENDPOINTS.ADMIN_WALLET_PAYOUT_PROCESS}/${payoutRequestId}/payout`,
    {
      action,
      rejectCategory: rejectCategory || undefined,
      rejectDescription: rejectDescription || undefined,
      settlementTransactionId: settlementTransactionId || undefined,
    },
    {},
    { invalidateTags: ['wallet:admin', 'wallet:seller', 'wallet:seller:transactions', 'analytics:seller'] }
  )

  const data = unwrapData(response)
  return data?.transaction || data || null
}
