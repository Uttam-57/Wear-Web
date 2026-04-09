import {
  WALLET_DAILY_PAYOUT_LIMIT,
  WALLET_MIN_PAYOUT_AMOUNT,
} from '@/features/wallet/seller/constants/sellerWallet.constants'
import { formatDate, formatDateTime, formatPrice } from '@/shared/utils/formatters'

const ORDER_REFERENCE_REGEX = /#([A-Z0-9-]+)/i

export const formatWalletMoney = (value) => formatPrice(Number(value || 0))

export const formatWalletDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  const now = new Date()

  const isSameDay =
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear()

  if (isSameDay) {
    return `Today, ${new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(date)}`
  }

  return formatDateTime(value)
}

export const formatWalletDate = (value) => formatDate(value)

export const maskAccountNumber = (accountNumber = '') => {
  const raw = String(accountNumber || '').replace(/\s+/g, '')
  if (!raw) return '************'
  if (raw.length <= 4) return raw
  return `${'*'.repeat(Math.max(0, raw.length - 4))}${raw.slice(-4)}`
}

export const hasSellerBankDetails = (bankDetails) => {
  if (!bankDetails) return false

  return Boolean(
    String(bankDetails.accountHolderName || '').trim()
    && String(bankDetails.accountNumber || '').trim()
    && String(bankDetails.ifscCode || '').trim()
  )
}

const extractOrderReference = (description = '') => {
  const match = String(description || '').match(ORDER_REFERENCE_REGEX)
  return match ? match[1] : ''
}

const buildStatusMeta = (type, description = '', payoutStatus = '') => {
  const descriptionLower = String(description || '').toLowerCase()
  const normalizedPayoutStatus = String(payoutStatus || '').toLowerCase()

  if (descriptionLower.includes('rejected') || descriptionLower.includes('failed')) {
    return { key: 'failed', label: 'Failed', badgeVariant: 'danger' }
  }

  if (type === 'withdrawal') {
    if (normalizedPayoutStatus === 'approved') {
      return { key: 'success', label: 'Approved', badgeVariant: 'success' }
    }
    if (normalizedPayoutStatus === 'rejected') {
      return { key: 'failed', label: 'Rejected', badgeVariant: 'danger' }
    }
    return { key: 'pending', label: 'Pending', badgeVariant: 'warning' }
  }

  return { key: 'success', label: 'Success', badgeVariant: 'success' }
}

export const getTransactionFlow = (type = '') => {
  if (type === 'credit') return 'credit'
  return 'debit'
}

export const getTransactionTypeLabel = (type = '') => {
  if (type === 'credit') return 'Order Credit'
  if (type === 'withdrawal') return 'Withdrawal Request'
  if (type === 'refund_debit') return 'Return Refund Deduction'
  return 'Wallet Transaction'
}

export const getTransactionDisplayAmount = (type = '', amount = 0) => {
  const flow = getTransactionFlow(type)
  const prefix = flow === 'credit' ? '+' : '-'
  return `${prefix} ${formatWalletMoney(amount)}`
}

export const normalizeWalletTransaction = (transaction = {}) => {
  const id = String(transaction?._id || transaction?.id || crypto.randomUUID())
  const type = String(transaction?.type || '')
  const description = String(transaction?.description || '')
  const payoutStatus = String(transaction?.payoutStatus || '').trim().toLowerCase()
  const resolvedPayoutStatus = ['pending', 'approved', 'rejected'].includes(payoutStatus)
    ? payoutStatus
    : type === 'withdrawal'
      ? 'approved'
      : ''
  const orderReference = extractOrderReference(description)
  const status = buildStatusMeta(type, description, resolvedPayoutStatus)
  const reference = String(transaction?.transactionId || '').trim()

  return {
    id,
    reference: reference || `TXN-${id.slice(-6).toUpperCase()}`,
    type,
    typeLabel: getTransactionTypeLabel(type),
    flow: getTransactionFlow(type),
    amount: Number(transaction?.amount || 0),
    displayAmount: getTransactionDisplayAmount(type, transaction?.amount || 0),
    status,
    description,
    createdAt: transaction?.createdAt || transaction?.updatedAt || null,
    orderId: transaction?.orderId ? String(transaction.orderId) : '',
    orderReference,
  }
}

export const buildOptimisticWithdrawalTransaction = ({ amount, accountNumber }) => {
  const id = `local-${crypto.randomUUID()}`
  const safeAmount = Number(amount || 0)

  return {
    id,
    reference: `TXN-${id.slice(-6).toUpperCase()}`,
    type: 'withdrawal',
    typeLabel: 'Withdrawal Request',
    flow: 'debit',
    amount: safeAmount,
    displayAmount: getTransactionDisplayAmount('withdrawal', safeAmount),
    status: { key: 'pending', label: 'Pending', badgeVariant: 'warning' },
    description: accountNumber
      ? `Bank transfer requested to account ${maskAccountNumber(accountNumber)}`
      : 'Bank transfer requested',
    createdAt: new Date().toISOString(),
    orderId: '',
    orderReference: '',
  }
}

export const validatePayoutAmount = ({ amount, balance }) => {
  const parsed = Number(amount)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Enter a valid payout amount.'
  }

  if (parsed < WALLET_MIN_PAYOUT_AMOUNT) {
    return 'Minimum withdrawal amount is ₹1,000.'
  }

  if (parsed > WALLET_DAILY_PAYOUT_LIMIT) {
    return 'Daily withdrawal limit is ₹2,00,000.'
  }

  if (parsed > Number(balance || 0)) {
    return 'Insufficient wallet balance.'
  }

  return ''
}
