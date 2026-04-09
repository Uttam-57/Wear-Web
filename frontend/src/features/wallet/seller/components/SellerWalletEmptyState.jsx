export default function SellerWalletEmptyState({ isFiltered = false }) {
  if (isFiltered) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-3 px-md py-xl text-center">
        <p className="text-sm font-medium text-text-primary">No matching transactions</p>
        <p className="mt-1 text-sm text-text-secondary">Try a different search term or filter.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-3 px-md py-xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted" aria-hidden="true">Wallet</p>
      <p className="mt-sm text-sm font-medium text-text-primary">No transactions yet</p>
      <p className="mx-auto mt-1 max-w-xl text-sm text-text-secondary">
        Your wallet will be credited automatically once delivered orders pass the return window.
      </p>
    </div>
  )
}
