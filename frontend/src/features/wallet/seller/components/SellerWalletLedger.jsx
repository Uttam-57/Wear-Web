import { Link } from 'react-router-dom'
import {
  WALLET_TRANSACTION_FILTER_OPTIONS,
} from '@/features/wallet/seller/constants/sellerWallet.constants'
import {
  formatWalletDateTime,
} from '@/features/wallet/seller/utils/sellerWallet.utils'
import { ROUTES } from '@/shared/constants/routes'
import { Badge, Card, Input, Pagination } from '@/shared/ui'
import SellerWalletEmptyState from '@/features/wallet/seller/components/SellerWalletEmptyState'

export default function SellerWalletLedger({
  transactions,
  hasServerRows,
  filterType,
  searchTerm,
  page,
  totalPages,
  onFilterChange,
  onSearchChange,
  onPageChange,
}) {
  const showEmpty = transactions.length === 0
  const isFiltered = Boolean(searchTerm.trim()) || filterType !== 'all'

  return (
    <Card className="space-y-sm">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Transaction History</h2>
          <p className="text-sm text-text-secondary">Track wallet credits, debits, and payout activity.</p>
        </div>
      </div>

      <div className="grid gap-sm md:grid-cols-[220px,1fr]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Filter</span>
          <select
            value={filterType}
            onChange={(event) => onFilterChange(event.target.value)}
            className="h-[42px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm text-text-primary"
          >
            {WALLET_TRANSACTION_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Search</span>
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search order reference, transaction ID, or notes"
            aria-label="Search transactions"
          />
        </label>
      </div>

      {showEmpty ? (
        <SellerWalletEmptyState isFiltered={isFiltered || hasServerRows} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((entry) => (
                <tr key={entry.id} className="border-b border-border/70 align-top text-sm text-text-primary">
                  <td className="px-2 py-sm">
                    <p className="font-medium text-text-primary">{formatWalletDateTime(entry.createdAt)}</p>
                    <p className="text-xs text-text-secondary">{entry.reference}</p>
                  </td>

                  <td className="px-2 py-sm">
                    <p className="font-medium text-text-primary">{entry.typeLabel}</p>
                    {entry.orderReference ? (
                      <Link
                        className="text-xs font-medium text-primary hover:text-primary-hover"
                        to={`${ROUTES.SELLER_ORDERS}?q=${encodeURIComponent(entry.orderReference)}`}
                      >
                        {entry.orderReference}
                      </Link>
                    ) : null}
                    <p className="text-xs text-text-secondary">{entry.description}</p>
                  </td>

                  <td className="px-2 py-sm">
                    <span className={`font-semibold ${entry.flow === 'credit' ? 'text-success' : 'text-text-primary'}`}>
                      {entry.flow === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>

                  <td className="px-2 py-sm">
                    <Badge variant={entry.status.badgeVariant}>{entry.status.label}</Badge>
                  </td>

                  <td className="px-2 py-sm text-right">
                    <span className={`font-semibold ${entry.flow === 'credit' ? 'text-success' : 'text-danger'}`}>
                      {entry.displayAmount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isFiltered ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </Card>
  )
}
