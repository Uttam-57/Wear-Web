import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSellerAnalytics } from '@/features/analytics/api'
import { getSellerProfile } from '@/features/user/api'
import {
  getSellerWallet,
  getSellerWalletTransactions,
  requestSellerWalletPayout,
} from '@/features/wallet/seller/api/sellerWallet.api'
import {
  WALLET_LEDGER_PAGE_SIZE,
  WALLET_MIN_PAYOUT_AMOUNT,
  WALLET_TRANSACTION_FILTERS,
} from '@/features/wallet/seller/constants/sellerWallet.constants'
import {
  buildOptimisticWithdrawalTransaction,
  hasSellerBankDetails,
  normalizeWalletTransaction,
  validatePayoutAmount,
} from '@/features/wallet/seller/utils/sellerWallet.utils'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'

const getInitialSummary = () => ({
  pendingWithdrawals: 0,
  totalWithdrawn: 0,
  totalEarnings: 0,
})

const DEFAULT_PAYOUT_AMOUNT = String(WALLET_MIN_PAYOUT_AMOUNT)
const SELLER_WALLET_PAGE_CACHE_TTL_MS = 5 * 60 * 1000
let sellerWalletPageCache = null

const getSellerWalletPageCache = () => {
  if (!sellerWalletPageCache) return null
  if (Date.now() - sellerWalletPageCache.updatedAt > SELLER_WALLET_PAGE_CACHE_TTL_MS) {
    sellerWalletPageCache = null
    return null
  }
  return sellerWalletPageCache
}

const setSellerWalletPageCache = (payload) => {
  sellerWalletPageCache = {
    ...payload,
    updatedAt: Date.now(),
  }
}

export default function useSellerWalletPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const cachedWalletState = getSellerWalletPageCache()

  const [loading, setLoading] = useState(() => !cachedWalletState)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(() => cachedWalletState?.error || '')

  const [balance, setBalance] = useState(() => Number(cachedWalletState?.balance || 0))
  const [summary, setSummary] = useState(() => cachedWalletState?.summary || getInitialSummary())
  const [transactions, setTransactions] = useState(() => cachedWalletState?.transactions || [])

  const [page, setPage] = useState(() => Number(cachedWalletState?.page || 1))
  const [totalPages, setTotalPages] = useState(() => Number(cachedWalletState?.totalPages || 1))

  const [filterType, setFilterType] = useState(() => cachedWalletState?.filterType || WALLET_TRANSACTION_FILTERS.ALL)
  const [searchTerm, setSearchTerm] = useState(() => cachedWalletState?.searchTerm || '')

  const [bankDetails, setBankDetails] = useState(() => cachedWalletState?.bankDetails || null)

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState(DEFAULT_PAYOUT_AMOUNT)
  const [submittingPayout, setSubmittingPayout] = useState(false)

  const hasLoadedRef = useRef(false)

  const loadWalletPage = useCallback(
    async ({ pageNumber = 1, silent = false } = {}) => {
      if (silent) {
        setRefreshing(true)
      } else {
        if (!cachedWalletState) setLoading(true)
      }

      try {
        const [walletData, transactionsData, analyticsData, profileData] = await Promise.all([
          getSellerWallet(),
          getSellerWalletTransactions({ page: pageNumber, limit: WALLET_LEDGER_PAGE_SIZE }),
          getSellerAnalytics({ period: '7d' }),
          getSellerProfile(),
        ])

        const normalizedTransactions = Array.isArray(transactionsData?.transactions)
          ? transactionsData.transactions.map((transaction) => normalizeWalletTransaction(transaction))
          : []

        setBalance(Number((walletData?.availableToWithdraw ?? walletData?.balance) || 0))
        setTransactions(normalizedTransactions)
        setTotalPages(Math.max(1, Number(transactionsData?.pagination?.totalPages || 1)))
        setBankDetails(profileData?.bankDetails || null)
        setSummary({
          pendingWithdrawals: Number(analyticsData?.wallet?.pendingWithdrawalAmount || 0),
          totalWithdrawn: Number(analyticsData?.wallet?.totalWithdrawnInWindow || 0),
          totalEarnings: Number(analyticsData?.revenue?.totalEarned || 0),
        })

        setError('')
      } catch (requestError) {
        setError(getApiError(requestError, 'Unable to load wallet data right now.'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    const silent = hasLoadedRef.current
    loadWalletPage({ pageNumber: page, silent }).catch(() => {})
    hasLoadedRef.current = true
  }, [loadWalletPage, page])

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return transactions.filter((entry) => {
      if (
        filterType !== WALLET_TRANSACTION_FILTERS.ALL
        && entry.flow !== filterType
      ) {
        return false
      }

      if (!query) return true

      const haystack = [
        entry.reference,
        entry.typeLabel,
        entry.description,
        entry.orderReference,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [filterType, searchTerm, transactions])

  const hasBank = useMemo(() => hasSellerBankDetails(bankDetails), [bankDetails])

  const parsedPayoutAmount = Number(payoutAmount || 0)
  const payoutValidationError = useMemo(() => {
    if (!payoutAmount) return 'Enter a valid payout amount.'
    return validatePayoutAmount({ amount: parsedPayoutAmount, balance })
  }, [balance, parsedPayoutAmount, payoutAmount])

  const canOpenPayout = balance >= WALLET_MIN_PAYOUT_AMOUNT
  const canSubmitPayout = hasBank && !payoutValidationError && !submittingPayout

  const refresh = useCallback(() => {
    return loadWalletPage({ pageNumber: page, silent: true })
  }, [loadWalletPage, page])

  const openPayoutModal = useCallback(() => {
    setPayoutAmount(DEFAULT_PAYOUT_AMOUNT)
    setIsPayoutModalOpen(true)
  }, [])

  const closePayoutModal = useCallback(() => {
    if (submittingPayout) return
    setIsPayoutModalOpen(false)
  }, [submittingPayout])

  const updatePayoutAmount = useCallback((value) => {
    const digitsOnly = String(value || '').replace(/[^0-9]/g, '')
    setPayoutAmount(digitsOnly)
  }, [])

  const submitPayoutRequest = useCallback(async () => {
    if (!canSubmitPayout) return

    setSubmittingPayout(true)

    try {
      const result = await requestSellerWalletPayout({ amount: parsedPayoutAmount })
      const nextBalance = Number(result?.availableToWithdraw ?? result?.balance ?? Math.max(0, balance - parsedPayoutAmount))

      setBalance(nextBalance)
      setSummary((previous) => ({
        ...previous,
        pendingWithdrawals: Number(previous.pendingWithdrawals || 0) + parsedPayoutAmount,
      }))

      const optimisticRow = buildOptimisticWithdrawalTransaction({
        amount: parsedPayoutAmount,
        accountNumber: bankDetails?.accountNumber,
      })

      setTransactions((previous) => [optimisticRow, ...previous].slice(0, WALLET_LEDGER_PAGE_SIZE))
      setIsPayoutModalOpen(false)

      pushToast({
        type: 'success',
        title: 'Withdrawal requested',
        message: `Withdrawal request for ₹${parsedPayoutAmount.toLocaleString('en-IN')} submitted and sent for admin approval.`,
      })

      setPage(1)
      await loadWalletPage({ pageNumber: 1, silent: true })
    } catch (requestError) {
      pushToast({
        type: 'danger',
        title: 'Payout failed',
        message: getApiError(requestError, 'Unable to request payout right now.'),
      })
    } finally {
      setSubmittingPayout(false)
    }
  }, [
    balance,
    bankDetails?.accountNumber,
    canSubmitPayout,
    loadWalletPage,
    parsedPayoutAmount,
    pushToast,
  ])

  useEffect(() => {
    setSellerWalletPageCache({
      error,
      balance,
      summary,
      transactions,
      page,
      totalPages,
      filterType,
      searchTerm,
      bankDetails,
    })
  }, [error, balance, summary, transactions, page, totalPages, filterType, searchTerm, bankDetails])

  return {
    loading,
    refreshing,
    error,
    balance,
    summary,
    transactions,
    filteredTransactions,
    page,
    totalPages,
    filterType,
    searchTerm,
    bankDetails,
    hasBank,
    isPayoutModalOpen,
    payoutAmount,
    payoutValidationError,
    submittingPayout,
    canOpenPayout,
    canSubmitPayout,
    setPage,
    setFilterType,
    setSearchTerm,
    refresh,
    openPayoutModal,
    closePayoutModal,
    updatePayoutAmount,
    submitPayoutRequest,
  }
}
