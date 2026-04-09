import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminWallets, getAdminWalletTransactions } from '@/features/wallet/admin/api/adminWallet.api'
import { getApiError } from '@/shared/services/apiClient'

const resolveSellerInfo = (value) => {
  if (!value) return { sellerId: '', sellerName: 'Unknown Seller', sellerEmail: '' }

  if (typeof value === 'string') {
    return { sellerId: value, sellerName: value, sellerEmail: '' }
  }

  const fullName = `${value.firstName || ''} ${value.lastName || ''}`.trim()
  return {
    sellerId: value._id || '',
    sellerName: fullName || value.name || value.email || value._id || 'Unknown Seller',
    sellerEmail: value.email || '',
  }
}

const normalizeTransaction = (transaction) => {
  const seller = resolveSellerInfo(transaction?.sellerId)
  const payoutStatus = String(transaction?.payoutStatus || '').trim().toLowerCase()
  const resolvedPayoutStatus = ['pending', 'approved', 'rejected'].includes(payoutStatus)
    ? payoutStatus
    : transaction?.type === 'withdrawal'
      ? 'approved'
      : ''

  return {
    id: transaction?._id,
    transactionId: String(transaction?.transactionId || '').trim() || `TXN-${String(transaction?._id || '').slice(-6).toUpperCase()}`,
    type: transaction?.type || 'unknown',
    amount: Number(transaction?.amount || 0),
    description: transaction?.description || '',
    createdAt: transaction?.createdAt,
    balanceBefore: Number(transaction?.balanceBefore || 0),
    balanceAfter: Number(transaction?.balanceAfter || 0),
    payoutStatus: resolvedPayoutStatus,
    payoutSettlementId: String(transaction?.payoutSettlementId || '').trim(),
    payoutRejectCategory: String(transaction?.payoutRejectCategory || '').trim(),
    payoutRejectDescription: String(transaction?.payoutRejectDescription || '').trim(),
    seller,
  }
}

const ADMIN_PAYOUTS_PAGE_CACHE_TTL_MS = 5 * 60 * 1000
let adminPayoutsPageCache = null

const getAdminPayoutsPageCache = () => {
  if (!adminPayoutsPageCache) return null
  if (Date.now() - adminPayoutsPageCache.updatedAt > ADMIN_PAYOUTS_PAGE_CACHE_TTL_MS) {
    adminPayoutsPageCache = null
    return null
  }
  return adminPayoutsPageCache
}

const setAdminPayoutsPageCache = (payload) => {
  adminPayoutsPageCache = {
    ...payload,
    updatedAt: Date.now(),
  }
}

export default function useAdminPayoutsPage() {
  const cachedPayoutState = getAdminPayoutsPageCache()

  const [loading, setLoading] = useState(() => !cachedPayoutState)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(() => cachedPayoutState?.error || '')

  const [wallets, setWallets] = useState(() => cachedPayoutState?.wallets || [])
  const [transactions, setTransactions] = useState(() => cachedPayoutState?.transactions || [])

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else if (!cachedPayoutState) setLoading(true)

    try {
      const [walletResult, transactionsResult] = await Promise.all([
        getAdminWallets({ page: 1, limit: 100 }),
        getAdminWalletTransactions({ page: 1, limit: 200 }),
      ])

      setWallets(walletResult.wallets || [])
      setTransactions(Array.isArray(transactionsResult.transactions)
        ? transactionsResult.transactions.map(normalizeTransaction)
        : [])
      setError('')
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load payout requests right now.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData().catch(() => {})
  }, [loadData])

  useEffect(() => {
    setAdminPayoutsPageCache({
      error,
      wallets,
      transactions,
    })
  }, [error, wallets, transactions])

  const payoutRequests = useMemo(() => {
    return transactions
      .filter((entry) => entry.type === 'withdrawal')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions])

  return {
    loading,
    refreshing,
    error,
    wallets,
    payoutRequests,
    refresh: () => loadData({ silent: true }),
  }
}
