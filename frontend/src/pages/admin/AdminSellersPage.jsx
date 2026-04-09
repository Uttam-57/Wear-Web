import { useEffect, useMemo, useState } from 'react'
import { Card, Button, Badge, Spinner } from '@/shared/ui'
import useAdminUsers from '@/features/user/hooks/useAdminUsers'
import { formatDateTime } from '@/shared/utils/formatters'
import useUIStore from '@/shared/uiSlice'
import { getApiError } from '@/shared/services/apiClient'

const getRelativeTime = (value) => {
  if (!value) return 'Unknown'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function SellerRejectionModal({
  open,
  sellerName,
  reason,
  submitting,
  onReasonChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  const trimmedLength = String(reason || '').trim().length
  const canSubmit = trimmedLength >= 5 && !submitting

  return (
    <div className="fixed inset-0 z-[180]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/55"
        aria-label="Close seller rejection dialog"
        onClick={onCancel}
      />

      <section
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card"
      >
        <h2 className="text-lg font-semibold text-text-primary">Reject Seller: {sellerName}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Enter a rejection reason. The seller will be notified and can resubmit with corrected documents.
        </p>

        <div className="mt-md space-y-2">
          <label htmlFor="admin-seller-reject-reason" className="text-sm font-medium text-text-primary">
            Rejection reason (Required)
          </label>
          <textarea
            id="admin-seller-reject-reason"
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange?.(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-primary"
            placeholder="Explain what must be fixed before approval"
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Must be at least 5 characters.</span>
            <span>{trimmedLength} / 5</span>
          </div>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button variant="danger" loading={submitting} disabled={!canSubmit} onClick={onConfirm}>
            Confirm Rejection
          </Button>
        </div>
      </section>
    </div>
  )
}

export default function AdminSellersPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const usersState = useAdminUsers()
  const refreshPendingSellers = usersState.refreshPendingSellers
  const [activeRejectSeller, setActiveRejectSeller] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)
  const [submittingApproveId, setSubmittingApproveId] = useState('')

  useEffect(() => {
    refreshPendingSellers().catch(() => {})
  }, [refreshPendingSellers])

  const sellers = useMemo(() => usersState.pendingSellers || [], [usersState.pendingSellers])

  const handleApprove = async (sellerId) => {
    setSubmittingApproveId(sellerId)

    try {
      await usersState.approveSeller(sellerId)
      await usersState.refreshPendingSellers()
      pushToast({ type: 'success', title: 'Seller approved', message: 'Seller has been approved successfully.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Approval failed', message: getApiError(error, 'Unable to approve seller right now.') })
    } finally {
      setSubmittingApproveId('')
    }
  }

  const openRejectModal = (seller) => {
    setActiveRejectSeller(seller)
    setRejectReason('')
  }

  const closeRejectModal = () => {
    if (submittingReject) return
    setActiveRejectSeller(null)
    setRejectReason('')
  }

  const handleConfirmReject = async () => {
    const sellerId = activeRejectSeller?._id
    const reason = String(rejectReason || '').trim()
    if (!sellerId || reason.length < 5) return

    setSubmittingReject(true)
    try {
      await usersState.rejectSeller(sellerId, reason)
      await usersState.refreshPendingSellers()
      pushToast({ type: 'success', title: 'Seller rejected', message: 'Seller application has been rejected.' })
      closeRejectModal()
    } catch (error) {
      pushToast({ type: 'danger', title: 'Rejection failed', message: getApiError(error, 'Unable to reject seller right now.') })
    } finally {
      setSubmittingReject(false)
    }
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="section-title">Pending Seller Approvals</h1>
        <p className="section-subtitle">Review seller applications and approve or reject with a clear reason.</p>
      </div>

      <Card className="space-y-sm">
        {usersState.loading ? (
          <div className="flex justify-center py-lg"><Spinner /></div>
        ) : sellers.length === 0 ? (
          <p className="text-sm text-text-secondary">No pending seller approvals right now.</p>
        ) : (
          sellers.map((seller) => (
            <div key={seller._id} className="rounded-lg border border-border bg-surface-3 p-sm">
              <div className="flex flex-wrap items-start justify-between gap-sm">
                <div>
                  <p className="text-base font-semibold text-text-primary">{seller.firstName} {seller.lastName}</p>
                  <p className="text-sm text-text-secondary">Owner profile email: {seller.email}</p>
                </div>
                <Badge variant="warning">Submitted {getRelativeTime(seller.createdAt)}</Badge>
              </div>

              <div className="mt-sm grid gap-sm text-sm text-text-secondary md:grid-cols-2">
                <p><span className="font-medium text-text-primary">Phone:</span> {seller.phone || 'Not provided'}</p>
                <p><span className="font-medium text-text-primary">Submitted At:</span> {formatDateTime(seller.createdAt)}</p>
              </div>

              <div className="mt-sm rounded-md border border-dashed border-border bg-surface-elevated px-sm py-2 text-sm text-text-secondary">
                {Array.isArray(seller.companyProof) && seller.companyProof.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {seller.companyProof.map((url, index) => (
                      <a
                        key={`${seller._id}-proof-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border px-sm py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                      >
                        View Document {index + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p>
                    KYC document links are not returned by the current pending-seller API. Approval still works with current backend flow.
                  </p>
                )}
              </div>

              <div className="mt-sm flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => openRejectModal(seller)}>
                  Reject Seller
                </Button>
                <Button size="sm" loading={submittingApproveId === seller._id} onClick={() => handleApprove(seller._id)}>
                  Approve Seller
                </Button>
              </div>

            </div>
          ))
        )}
      </Card>

      <SellerRejectionModal
        open={Boolean(activeRejectSeller)}
        sellerName={`${activeRejectSeller?.firstName || ''} ${activeRejectSeller?.lastName || ''}`.trim() || 'Seller'}
        reason={rejectReason}
        submitting={submittingReject}
        onReasonChange={setRejectReason}
        onCancel={closeRejectModal}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}
