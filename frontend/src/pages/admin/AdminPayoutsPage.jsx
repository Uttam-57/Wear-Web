import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Spinner } from '@/shared/ui'
import useAdminPayoutsPage from '@/features/wallet/admin/hooks/useAdminPayoutsPage'
import { processAdminPayoutRequest } from '@/features/wallet/admin/api/adminWallet.api'
import { formatDateTime, formatPrice } from '@/shared/utils/formatters'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'

const REJECT_REASON_OPTIONS = [
  { value: 'bank_details_invalid', label: 'Bank details invalid' },
  { value: 'compliance_issue', label: 'Compliance issue' },
  { value: 'duplicate_request', label: 'Duplicate request' },
  { value: 'suspected_fraud', label: 'Suspected fraud' },
  { value: 'limit_exceeded', label: 'Limit exceeded' },
  { value: 'other', label: 'Other' },
]

const resolvePayoutStatus = (request) => {
  const status = String(request?.payoutStatus || '').trim().toLowerCase()
  if (['pending', 'approved', 'rejected'].includes(status)) return status
  if (request?.type === 'withdrawal') return 'approved'
  return 'pending'
}

const resolvePayoutBadgeVariant = (status) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

const toTitleCase = (value) => {
  const raw = String(value || '').trim().replace(/_/g, ' ')
  if (!raw) return '-'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function PayoutProcessModal({
  open,
  request,
  walletBalance,
  rejectCategory,
  rejectDescription,
  settlementTransactionId,
  processing,
  onRejectCategoryChange,
  onRejectDescriptionChange,
  onSettlementTransactionIdChange,
  onClose,
  onApprove,
  onReject,
}) {
  if (!open || !request) return null

  const canReject = String(rejectCategory || '').trim() && String(rejectDescription || '').trim().length >= 5 && !processing
  const payoutStatus = resolvePayoutStatus(request)

  return (
    <div className="fixed inset-0 z-[180]">
      <button type="button" className="absolute inset-0 bg-text-primary/55" onClick={onClose} aria-label="Close payout processing modal" />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">Process Payout Request</h2>
        <p className="mt-1 text-sm text-text-secondary">Seller: {request.seller.sellerName}</p>

        <div className="mt-md space-y-1 rounded-md border border-border bg-surface-3 p-sm text-sm text-text-secondary">
          <p>Transaction ID: <span className="font-semibold text-text-primary">{request.transactionId || request.id}</span></p>
          <p>Requested amount: <span className="font-semibold text-text-primary">{formatPrice(request.amount)}</span></p>
          <p>Seller wallet balance: <span className="font-semibold text-text-primary">{formatPrice(walletBalance)}</span></p>
          <p>Created at: {formatDateTime(request.createdAt)}</p>
          <p>Status: <span className="font-semibold text-text-primary">{toTitleCase(payoutStatus)}</span></p>
          {request.payoutSettlementId ? <p>Settlement ID: {request.payoutSettlementId}</p> : null}
          {request.payoutRejectCategory ? <p>Reject reason: {toTitleCase(request.payoutRejectCategory)}</p> : null}
          {request.payoutRejectDescription ? <p>Reject note: {request.payoutRejectDescription}</p> : null}
        </div>

        <div className="mt-md space-y-2">
          <label htmlFor="admin-payout-settlement-id" className="text-sm font-medium text-text-primary">Settlement Transaction ID (optional for approve)</label>
          <input
            id="admin-payout-settlement-id"
            value={settlementTransactionId}
            onChange={(event) => onSettlementTransactionIdChange(event.target.value)}
            className="h-[40px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
            placeholder="BANK-REF-2026-0001"
          />
        </div>

        <div className="mt-md rounded-md border border-border bg-surface-3 p-sm">
          <p className="text-sm font-medium text-text-primary">Reject request</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-text-muted">Common reason</span>
              <select
                value={rejectCategory}
                onChange={(event) => onRejectCategoryChange(event.target.value)}
                className="h-[40px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
              >
                <option value="">Select reason</option>
                {REJECT_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 sm:col-span-1">
              <span className="text-xs text-text-muted">Detail description</span>
              <textarea
                rows={3}
                value={rejectDescription}
                onChange={(event) => onRejectDescriptionChange(event.target.value)}
                className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
                placeholder="Explain what needs correction for next request"
              />
            </label>
          </div>

          <p className="mt-1 text-xs text-text-muted">Description must be at least 5 characters.</p>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={processing}>Close</Button>
          <Button variant="ghost" onClick={onReject} loading={processing} disabled={!canReject || payoutStatus !== 'pending'}>Reject Request</Button>
          <Button onClick={onApprove} loading={processing} disabled={payoutStatus !== 'pending'}>Approve Request</Button>
        </div>
      </section>
    </div>
  )
}

export default function AdminPayoutsPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const { loading, refreshing, error, wallets, payoutRequests, refresh } = useAdminPayoutsPage()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const [activeRequest, setActiveRequest] = useState(null)
  const [rejectCategory, setRejectCategory] = useState('')
  const [rejectDescription, setRejectDescription] = useState('')
  const [settlementTransactionId, setSettlementTransactionId] = useState('')
  const [processing, setProcessing] = useState(false)

  const walletBalanceBySeller = useMemo(() => {
    const map = new Map()

    ;(wallets || []).forEach((wallet) => {
      const sellerId = typeof wallet?.sellerId === 'string'
        ? wallet.sellerId
        : wallet?.sellerId?._id

      if (!sellerId) return
      map.set(String(sellerId), Number(wallet?.balance || 0))
    })

    return map
  }, [wallets])

  const visiblePayoutRequests = useMemo(() => {
    const query = String(searchTerm || '').trim().toLowerCase()

    return [...(payoutRequests || [])]
      .filter((request) => {
        const payoutStatus = resolvePayoutStatus(request)

        if (statusFilter !== 'all' && payoutStatus !== statusFilter) {
          return false
        }

        if (!query) return true

        const haystack = [
          request?.transactionId,
          request?.id,
          request?.seller?.sellerName,
          request?.seller?.sellerEmail,
          request?.seller?.sellerId,
          String(request?.amount || ''),
          payoutStatus,
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
      .sort((left, right) => {
        const leftTime = new Date(left?.createdAt).getTime() || 0
        const rightTime = new Date(right?.createdAt).getTime() || 0
        return sortBy === 'oldest' ? leftTime - rightTime : rightTime - leftTime
      })
  }, [payoutRequests, searchTerm, sortBy, statusFilter])

  const closeModal = (force = false) => {
    if (processing && !force) return
    setActiveRequest(null)
    setRejectCategory('')
    setRejectDescription('')
    setSettlementTransactionId('')
  }

  const handleApprove = async () => {
    if (!activeRequest) return

    setProcessing(true)
    try {
      await processAdminPayoutRequest({
        payoutRequestId: activeRequest.id,
        action: 'approve',
        settlementTransactionId: String(settlementTransactionId || '').trim() || undefined,
      })

      pushToast({
        type: 'success',
        title: 'Payout approved',
        message: `Payout request ${activeRequest.transactionId || activeRequest.id} approved successfully.`,
      })

      await refresh()
      closeModal(true)
    } catch (requestError) {
      pushToast({
        type: 'danger',
        title: 'Approval failed',
        message: getApiError(requestError, 'Unable to approve payout request.'),
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!activeRequest) return
    if (!String(rejectCategory || '').trim()) return
    if (String(rejectDescription || '').trim().length < 5) return

    setProcessing(true)
    try {
      await processAdminPayoutRequest({
        payoutRequestId: activeRequest.id,
        action: 'reject',
        rejectCategory,
        rejectDescription: String(rejectDescription || '').trim(),
      })

      pushToast({
        type: 'warning',
        title: 'Payout rejected',
        message: `Payout request ${activeRequest.transactionId || activeRequest.id} rejected successfully.`,
      })

      await refresh()
      closeModal(true)
    } catch (requestError) {
      pushToast({
        type: 'danger',
        title: 'Rejection failed',
        message: getApiError(requestError, 'Unable to reject payout request.'),
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Payout Requests</h1>
          <p className="section-subtitle">Review seller withdrawal requests and process settlements.</p>
        </div>

        <Button variant="secondary" loading={refreshing} onClick={refresh}>Refresh</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="space-y-sm">
        <div className="flex flex-wrap items-end gap-2 border-b border-border pb-sm">
          <label className="min-w-[260px] flex-1 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-[40px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
              placeholder="Search by transaction ID, seller name, or email"
            />
          </label>

          <label className="min-w-[180px] space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-[40px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="min-w-[180px] space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-[40px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-2 py-2">Transaction ID</th>
                <th className="px-2 py-2">Seller</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Wallet Balance</th>
                <th className="px-2 py-2">Requested At</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {visiblePayoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-lg text-center text-sm text-text-secondary">
                    No payout requests found for selected search and filters.
                  </td>
                </tr>
              ) : visiblePayoutRequests.map((request) => {
                const walletBalance = walletBalanceBySeller.get(String(request.seller.sellerId || '')) || 0
                const payoutStatus = resolvePayoutStatus(request)

                return (
                  <tr key={request.id} className="border-b border-border/70 text-sm">
                    <td className="px-2 py-sm text-text-secondary">{request.transactionId || request.id}</td>
                    <td className="px-2 py-sm">
                      <p className="font-semibold text-text-primary">{request.seller.sellerName}</p>
                      <p className="text-xs text-text-secondary">{request.seller.sellerEmail || request.seller.sellerId}</p>
                    </td>
                    <td className="px-2 py-sm text-text-primary">{formatPrice(request.amount)}</td>
                    <td className="px-2 py-sm text-text-secondary">{formatPrice(walletBalance)}</td>
                    <td className="px-2 py-sm text-text-secondary">{formatDateTime(request.createdAt)}</td>
                    <td className="px-2 py-sm">
                      <Badge variant={resolvePayoutBadgeVariant(payoutStatus)}>{toTitleCase(payoutStatus)}</Badge>
                    </td>
                    <td className="px-2 py-sm text-right">
                      {payoutStatus === 'pending' ? (
                        <Button size="sm" variant="secondary" onClick={() => setActiveRequest(request)}>Process</Button>
                      ) : (
                        <span className="text-xs text-text-muted">No action</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <PayoutProcessModal
        open={Boolean(activeRequest)}
        request={activeRequest}
        walletBalance={walletBalanceBySeller.get(String(activeRequest?.seller?.sellerId || '')) || 0}
        rejectCategory={rejectCategory}
        rejectDescription={rejectDescription}
        settlementTransactionId={settlementTransactionId}
        processing={processing}
        onRejectCategoryChange={setRejectCategory}
        onRejectDescriptionChange={setRejectDescription}
        onSettlementTransactionIdChange={setSettlementTransactionId}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
