import { Link } from 'react-router-dom'
import {
  WALLET_DAILY_PAYOUT_LIMIT,
  WALLET_MIN_PAYOUT_AMOUNT,
} from '@/features/wallet/seller/constants/sellerWallet.constants'
import {
  formatWalletMoney,
  maskAccountNumber,
} from '@/features/wallet/seller/utils/sellerWallet.utils'
import { ROUTES } from '@/shared/constants/routes'
import { Button, Input } from '@/shared/ui'

export default function SellerRequestPayoutModal({
  open,
  availableBalance,
  payoutAmount,
  payoutError,
  bankDetails,
  hasBank,
  submitting,
  canSubmit,
  onAmountChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-md py-lg" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface-elevated p-lg shadow-card">
        <div className="flex items-start justify-between gap-sm">
          <div>
            <h3 className="text-xl font-display text-text-primary">Request Bank Payout</h3>
            <p className="mt-1 text-sm text-text-secondary">Withdraw available earnings to your bank account.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-surface px-sm py-1 text-sm text-text-secondary hover:text-text-primary"
            aria-label="Close payout modal"
          >
            Close
          </button>
        </div>

        <div className="mt-md space-y-md">
          <div className="rounded-lg border border-border bg-surface-3 px-sm py-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted">Available Balance</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{formatWalletMoney(availableBalance)}</p>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium text-text-primary">Payout Amount (INR)</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-text-secondary">₹</span>
              <Input
                value={payoutAmount}
                onChange={(event) => onAmountChange(event.target.value)}
                placeholder="Enter payout amount"
                className="pl-8"
                hasError={Boolean(payoutError)}
              />
            </div>
            <p className="text-xs text-text-muted">
              Min: ₹{WALLET_MIN_PAYOUT_AMOUNT.toLocaleString('en-IN')} | Max Daily: ₹{WALLET_DAILY_PAYOUT_LIMIT.toLocaleString('en-IN')}
            </p>
            {payoutError ? <p className="text-xs text-danger">{payoutError}</p> : null}
          </label>

          <div className="space-y-sm">
            <p className="text-sm font-medium text-text-primary">Transfer To</p>

            {hasBank ? (
              <div className="rounded-lg border border-border bg-surface-3 px-sm py-sm">
                <p className="text-sm font-medium text-text-primary">{bankDetails?.accountHolderName || 'Account Holder'}</p>
                <p className="text-xs text-text-secondary">Acct: {maskAccountNumber(bankDetails?.accountNumber)}</p>
                <p className="text-xs text-text-secondary">IFSC: {String(bankDetails?.ifscCode || '').toUpperCase()}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-danger/50 bg-danger-soft px-sm py-sm">
                <p className="text-sm font-medium text-danger">No bank details found</p>
                <p className="mt-1 text-xs text-danger">
                  Add your bank account details before requesting a payout.
                </p>
              </div>
            )}

            <Link className="text-sm font-medium text-primary hover:text-primary-hover" to={ROUTES.SELLER_PROFILE}>
              Edit Bank Details in Profile
            </Link>
          </div>
        </div>

        <div className="mt-lg flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} loading={submitting} disabled={!canSubmit}>
            Request Payout
          </Button>
        </div>
      </div>
    </div>
  )
}
