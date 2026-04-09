import { useEffect } from 'react'
import { Alert, Button, Spinner } from '@/shared/ui'
import SellerRequestPayoutModal from '@/features/wallet/seller/components/SellerRequestPayoutModal'
import SellerWalletLedger from '@/features/wallet/seller/components/SellerWalletLedger'
import SellerWalletSummaryCards from '@/features/wallet/seller/components/SellerWalletSummaryCards'
import useSellerWalletPage from '@/features/wallet/seller/hooks/useSellerWalletPage'

export default function SellerWalletView() {
  const {
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
  } = useSellerWalletPage()

  useEffect(() => {
    if (!isPayoutModalOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isPayoutModalOpen])

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Wallet &amp; Payouts</h1>
          <p className="section-subtitle">Manage your earnings and request bank withdrawals.</p>
        </div>

        <Button variant="secondary" onClick={refresh} loading={refreshing}>
          Refresh
        </Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <SellerWalletSummaryCards
        balance={balance}
        summary={summary}
        onRequestPayout={openPayoutModal}
        canRequestPayout={canOpenPayout}
      />

      <SellerWalletLedger
        transactions={filteredTransactions}
        hasServerRows={transactions.length > 0}
        filterType={filterType}
        searchTerm={searchTerm}
        page={page}
        totalPages={totalPages}
        onFilterChange={setFilterType}
        onSearchChange={setSearchTerm}
        onPageChange={setPage}
      />

      <SellerRequestPayoutModal
        open={isPayoutModalOpen}
        availableBalance={balance}
        payoutAmount={payoutAmount}
        payoutError={!hasBank ? 'Add bank details to continue.' : payoutValidationError}
        bankDetails={bankDetails}
        hasBank={hasBank}
        submitting={submittingPayout}
        canSubmit={canSubmitPayout}
        onAmountChange={updatePayoutAmount}
        onClose={closePayoutModal}
        onSubmit={submitPayoutRequest}
      />
    </div>
  )
}
