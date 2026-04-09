export const WALLET_LEDGER_PAGE_SIZE = 10

export const WALLET_MIN_PAYOUT_AMOUNT = 1000
export const WALLET_DAILY_PAYOUT_LIMIT = 200000

export const WALLET_TRANSACTION_FILTERS = {
  ALL: 'all',
  CREDIT: 'credit',
  DEBIT: 'debit',
}

export const WALLET_TRANSACTION_FILTER_OPTIONS = [
  { value: WALLET_TRANSACTION_FILTERS.ALL, label: 'All Transactions' },
  { value: WALLET_TRANSACTION_FILTERS.CREDIT, label: 'Credits' },
  { value: WALLET_TRANSACTION_FILTERS.DEBIT, label: 'Debits' },
]
