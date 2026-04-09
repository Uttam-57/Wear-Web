import {
  WALLET_MIN_PAYOUT_AMOUNT,
} from '@/features/wallet/seller/constants/sellerWallet.constants'
import { formatWalletMoney } from '@/features/wallet/seller/utils/sellerWallet.utils'
import { Button, Card } from '@/shared/ui'

export default function SellerWalletSummaryCards({
  balance,
  summary,
  onRequestPayout,
  canRequestPayout,
}) {
  const minPayoutHint = `Minimum payout is ₹${WALLET_MIN_PAYOUT_AMOUNT.toLocaleString('en-IN')}`

  return (
    <div className="grid gap-md xl:grid-cols-[1.1fr,1.9fr]">
      <Card className="space-y-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Available Balance</p>
        <p className="text-3xl font-display text-text-primary">{formatWalletMoney(balance)}</p>
        <Button
          className="mt-2"
          onClick={onRequestPayout}
          disabled={!canRequestPayout}
        >
          Request Payout
        </Button>
        {!canRequestPayout ? (
          <p className="text-xs text-text-muted">{minPayoutHint}</p>
        ) : null}
      </Card>

      <Card className="space-y-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Payout Summary (Last 7 Days)</p>

        <div className="grid gap-sm sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface-3 px-sm py-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending Withdrawals</p>
            <p className="mt-1 text-lg font-semibold text-warning">{formatWalletMoney(summary.pendingWithdrawals)}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-3 px-sm py-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted">Total Withdrawn</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{formatWalletMoney(summary.totalWithdrawn)}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-3 px-sm py-sm">
            <p className="text-xs uppercase tracking-wide text-text-muted">Total Earnings</p>
            <p className="mt-1 text-lg font-semibold text-success">{formatWalletMoney(summary.totalEarnings)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
