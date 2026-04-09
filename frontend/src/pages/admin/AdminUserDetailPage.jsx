import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Spinner } from '@/shared/ui'
import { adminDeleteUser, blockUser, getAdminUserDetail, unblockUser } from '@/features/user/api'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import { formatDateTime, formatOrderStatus, formatPrice } from '@/shared/utils/formatters'

const getStatusVariant = (status) => {
  if (status === 'active') return 'success'
  if (status === 'blocked') return 'danger'
  if (status === 'deleted') return 'danger'
  return 'warning'
}

const getFullName = (user = {}) => {
  return [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ').trim() || 'Unknown User'
}

const formatAddressText = (address = {}) => {
  const line1 = [address?.street, address?.building].filter(Boolean).join(', ')
  const line2 = [address?.landmark, address?.city || address?.district, address?.state, address?.pincode].filter(Boolean).join(', ')
  return [line1, line2, address?.country].filter(Boolean).join(' | ') || '-'
}

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [actionReason, setActionReason] = useState('')
  const [actionFeedback, setActionFeedback] = useState('')
  const [actionFeedbackVariant, setActionFeedbackVariant] = useState('info')
  const [updatingHold, setUpdatingHold] = useState(false)
  const [updatingDelete, setUpdatingDelete] = useState(false)

  const loadDetail = async () => {
    if (!id) return

    setLoading(true)
    setError('')

    try {
      const detail = await getAdminUserDetail(id)
      setUser(detail || null)
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load user details.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail().catch(() => {})
  }, [id])

  const handleToggleHold = async () => {
    if (!user?._id || user?.status === 'deleted') return

    setUpdatingHold(true)
    try {
      if (user.status === 'blocked') {
        await unblockUser(user._id)
        setActionFeedback('Account has been re-activated successfully.')
        setActionFeedbackVariant('success')
      } else {
        await blockUser(user._id, 'other', actionReason.trim() || 'Account placed on hold by admin')
        setActionFeedback('Account has been put on hold successfully.')
        setActionFeedbackVariant('warning')
      }
      await loadDetail()
    } catch (requestError) {
      setActionFeedback(getApiError(requestError, 'Unable to update hold status.'))
      setActionFeedbackVariant('danger')
    } finally {
      setUpdatingHold(false)
    }
  }

  const handleDelete = async () => {
    if (!user?._id || user?.status === 'deleted') return

    const reason = String(actionReason || '').trim()
    if (reason.length < 5) {
      setActionFeedback('Delete reason must be at least 5 characters.')
      setActionFeedbackVariant('warning')
      return
    }

    setUpdatingDelete(true)
    try {
      const result = await adminDeleteUser(user._id, reason)

      if (result?.stage === 'deleted') {
        setActionFeedback('Account has been soft deleted successfully and minimal data has been retained.')
        setActionFeedbackVariant('success')
      } else if (result?.stage === 'pending_orders') {
        setActionFeedback(`Delete request recorded. ${Number(result?.pendingOrders || 0)} pending order/return flow(s) must complete before final deletion.`)
        setActionFeedbackVariant('warning')
      } else if (result?.stage === 'wallet_pending') {
        setActionFeedback(`Delete request recorded. Wallet balance ${formatPrice(result?.walletBalance || 0)} must be settled before final deletion.`)
        setActionFeedbackVariant('warning')
      } else {
        setActionFeedback('Delete workflow updated.')
        setActionFeedbackVariant('info')
      }

      await loadDetail()
    } catch (requestError) {
      setActionFeedback(getApiError(requestError, 'Unable to process delete workflow.'))
      setActionFeedbackVariant('danger')
    } finally {
      setUpdatingDelete(false)
    }
  }

  const orders = Array.isArray(user?.orderHistory) ? user.orderHistory : []
  const sellerProfile = user?.sellerProfile || null
  const summary = useMemo(() => ({
    totalOrders: Number(user?.summary?.totalOrders || orders.length || 0),
    totalAmountPaid: Number(user?.summary?.totalAmountPaid || 0),
  }), [orders.length, user?.summary?.totalAmountPaid, user?.summary?.totalOrders])

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  if (error) {
    return (
      <div className="space-y-sm">
        <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_USERS)}>Back to Users</Button>
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-sm">
        <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_USERS)}>Back to Users</Button>
        <Alert>User not found.</Alert>
      </div>
    )
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">User Detail</h1>
          <p className="section-subtitle">Complete account context with identity, orders, and business history.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_USERS)}>Back to Users</Button>
      </div>

      <Card className="space-y-sm">
        <div className="flex flex-wrap items-start justify-between gap-sm">
          <div>
            <p className="text-lg font-semibold text-text-primary">{getFullName(user)}</p>
            <p className="text-sm text-text-secondary">{user?.email || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(user?.status)}>{user?.status || 'unknown'}</Badge>
            <Badge variant="default">{user?.role || 'user'}</Badge>
          </div>
        </div>

        <div className="grid gap-sm text-sm text-text-secondary md:grid-cols-2 xl:grid-cols-3">
          <p><span className="font-medium text-text-primary">Phone:</span> {user?.phone || '-'}</p>
          <p><span className="font-medium text-text-primary">Joined:</span> {formatDateTime(user?.createdAt)}</p>
          <p><span className="font-medium text-text-primary">Last Updated:</span> {formatDateTime(user?.updatedAt)}</p>
          <p><span className="font-medium text-text-primary">Total Orders:</span> {summary.totalOrders}</p>
          <p><span className="font-medium text-text-primary">Total Amount Paid:</span> {formatPrice(summary.totalAmountPaid)}</p>
        </div>
      </Card>

      <Card className="space-y-sm">
        <h2 className="text-sm font-semibold text-text-primary">Admin Actions</h2>
        <p className="text-xs text-text-secondary">
          Hold/unhold account from here. Delete is a staged flow: first click may mark deletion pending until orders/returns (and seller wallet) are settled; click delete again after blockers are resolved.
        </p>

        <div className="space-y-2">
          <label htmlFor="admin-action-reason" className="text-xs font-semibold uppercase tracking-wide text-text-muted">Reason / Admin Note</label>
          <textarea
            id="admin-action-reason"
            rows={3}
            value={actionReason}
            onChange={(event) => setActionReason(event.target.value)}
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
            placeholder="Write reason for hold/delete workflow"
          />
        </div>

        {actionFeedback ? <Alert variant={actionFeedbackVariant}>{actionFeedback}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={user?.status === 'blocked' ? 'secondary' : 'ghost'}
            loading={updatingHold}
            disabled={user?.status === 'deleted' || updatingDelete}
            onClick={handleToggleHold}
          >
            {user?.status === 'blocked' ? 'Unhold Account' : 'Hold Account'}
          </Button>

          <Button
            variant="danger"
            loading={updatingDelete}
            disabled={user?.status === 'deleted' || updatingHold}
            onClick={handleDelete}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {user?.role === 'seller' && user?.status === 'active' ? (
        <Card className="space-y-sm">
          <h2 className="text-sm font-semibold text-text-primary">Seller Business Details</h2>
          {!sellerProfile ? (
            <p className="text-sm text-text-secondary">Seller profile is not available.</p>
          ) : (
            <>
              <div className="grid gap-sm text-sm text-text-secondary md:grid-cols-2">
                <p><span className="font-medium text-text-primary">Company Name:</span> {sellerProfile?.companyName || '-'}</p>
                <p><span className="font-medium text-text-primary">Owner Name:</span> {sellerProfile?.ownerName || '-'}</p>
                <p><span className="font-medium text-text-primary">Company Email:</span> {sellerProfile?.companyEmail || '-'}</p>
                <p><span className="font-medium text-text-primary">Company Phone:</span> {sellerProfile?.companyPhone || '-'}</p>
                <p><span className="font-medium text-text-primary">Website:</span> {sellerProfile?.website || '-'}</p>
                <p><span className="font-medium text-text-primary">GST Number:</span> {sellerProfile?.gstNumber || '-'}</p>
                <p><span className="font-medium text-text-primary">Business Location:</span> {formatAddressText(sellerProfile?.location)}</p>
                <p><span className="font-medium text-text-primary">Major Categories:</span> {(sellerProfile?.majorCategories || []).map((category) => category?.name).filter(Boolean).join(', ') || '-'}</p>
              </div>

              <div className="rounded-md border border-border bg-surface-3 p-sm">
                <p className="text-xs uppercase tracking-wide text-text-muted">Documents</p>
                {!Array.isArray(sellerProfile?.companyProof) || sellerProfile.companyProof.length === 0 ? (
                  <p className="mt-2 text-sm text-text-secondary">No company proof documents available.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sellerProfile.companyProof.map((url, index) => (
                      <a
                        key={`${String(user?._id || 'seller')}-doc-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border px-sm py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                      >
                        View Document {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      ) : null}

      <Card className="space-y-sm">
        <h2 className="text-sm font-semibold text-text-primary">Order History</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-text-secondary">No order history found for this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-2 py-2">Order ID</th>
                  <th className="px-2 py-2">Payment ID</th>
                  <th className="px-2 py-2">Recipient / Phone</th>
                  <th className="px-2 py-2">Address</th>
                  <th className="px-2 py-2">Items</th>
                  <th className="px-2 py-2">Amount Paid</th>
                  <th className="px-2 py-2">Order Status</th>
                  <th className="px-2 py-2">Placed At</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={`${order?.orderId || 'order'}-${index}`} className="border-b border-border/70 align-top text-sm">
                    <td className="px-2 py-sm font-medium text-text-primary">{order?.orderId || '-'}</td>
                    <td className="px-2 py-sm text-text-secondary">{order?.paymentId || '-'}</td>
                    <td className="px-2 py-sm text-text-secondary">
                      <p>{order?.address?.fullName || '-'}</p>
                      <p className="text-xs">{order?.address?.phone || '-'}</p>
                    </td>
                    <td className="px-2 py-sm text-text-secondary">{formatAddressText(order?.address)}</td>
                    <td className="px-2 py-sm text-text-secondary">
                      {(order?.items || []).slice(0, 3).map((item, itemIndex) => (
                        <p key={`${order?.orderId || 'order'}-item-${itemIndex}`}>
                          {item?.productName || 'Product'} x{Number(item?.quantity || 0)}
                        </p>
                      ))}
                      {(order?.items || []).length > 3 ? <p className="text-xs">+{(order?.items || []).length - 3} more</p> : null}
                    </td>
                    <td className="px-2 py-sm text-text-secondary">{formatPrice(order?.amountPaid)}</td>
                    <td className="px-2 py-sm">
                      <Badge variant="primary">{formatOrderStatus(order?.status)}</Badge>
                    </td>
                    <td className="px-2 py-sm text-text-secondary">{formatDateTime(order?.placedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
