import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Card, Input, Button, Badge, Pagination, Spinner } from '@/shared/ui'
import useAdminUsers from '@/features/user/hooks/useAdminUsers'
import { ROUTES } from '@/shared/constants/routes'
import { formatDateTime } from '@/shared/utils/formatters'
import { getApiError } from '@/shared/services/apiClient'

const statusVariant = (status) => {
  if (status === 'active') return 'success'
  if (status === 'blocked') return 'danger'
  return 'warning'
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const usersState = useAdminUsers()
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState('')
  const refreshUsers = usersState.refreshUsers
  const refreshPendingSellers = usersState.refreshPendingSellers

  const resolveQuickFilterParams = (value) => {
    if (value === 'active_customer') return { status: 'active', role: 'customer' }
    if (value === 'active_seller') return { status: 'active', role: 'seller' }
    if (value === 'hold_customer') return { status: 'blocked', role: 'customer' }
    if (value === 'hold_seller') return { status: 'blocked', role: 'seller' }
    if (value === 'deleted') return { status: 'deleted' }
    return {}
  }

  const loadUsers = async ({ nextPage = page, keyword = search, filterValue = quickFilter } = {}) => {
    setLoadingUsers(true)
    try {
      await refreshUsers({
        page: nextPage,
        limit: 20,
        search: keyword || undefined,
        ...resolveQuickFilterParams(filterValue),
      })
      setError('')
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load users.'))
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers({ nextPage: 1 }).catch(() => {})
    refreshPendingSellers().catch(() => {})
  }, [refreshPendingSellers])

  const users = usersState.users
  const pagination = usersState.pagination
  const pendingCount = usersState.pendingSellers.length

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="section-title">Users and Sellers</h1>
        <p className="section-subtitle">Search, review, block, and unblock customer or seller accounts.</p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Seller Approval Queue</p>
          <p className="mt-1 text-2xl font-display text-text-primary">{pendingCount} Pending</p>
          <p className="text-xs text-text-secondary">Review pending sellers, verify profile details, and approve or reject applications.</p>
        </div>
        <Button onClick={() => navigate(ROUTES.ADMIN_SELLERS_PENDING)}>Open Approval Queue</Button>
      </Card>

      <Card className="space-y-sm">
        <form
          className="flex flex-wrap items-center gap-sm"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            loadUsers({ nextPage: 1 }).catch(() => {})
          }}
        >
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name or email"
            className="flex-1"
          />
          <Button type="submit" loading={loadingUsers}>Find</Button>
          <select
            value={quickFilter}
            onChange={(event) => {
              const nextFilter = event.target.value
              setQuickFilter(nextFilter)
              setPage(1)
              loadUsers({ nextPage: 1, filterValue: nextFilter }).catch(() => {})
            }}
            className="h-[42px] min-w-[220px] rounded-md border border-border bg-surface-elevated px-sm text-sm"
          >
            <option value="all">All Users</option>
            <option value="active_customer">Active Customer</option>
            <option value="active_seller">Active Seller</option>
            <option value="hold_customer">Hold Customer</option>
            <option value="hold_seller">Hold Seller</option>
            <option value="deleted">Deleted</option>
          </select>
        </form>

        {error ? <Alert>{error}</Alert> : null}

        {loadingUsers || usersState.loading ? (
          <div className="flex justify-center py-lg"><Spinner /></div>
        ) : (
          <div className="space-y-2">
            {users.length === 0 ? <p className="text-sm text-text-secondary">No users found for current filters.</p> : null}
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_USER_DETAIL.replace(':id', String(user._id)))}
                className="flex w-full flex-wrap items-center justify-between gap-sm rounded-md border border-border bg-surface-3 px-sm py-2 text-left transition-colors hover:bg-surface-elevated"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-text-secondary">{user.email} • Joined {formatDateTime(user.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                  <Badge variant="default">{user.role}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          currentPage={Number(pagination?.page || page)}
          totalPages={Number(pagination?.totalPages || 1)}
          disabled={loadingUsers || usersState.loading}
          onPageChange={(nextPage) => {
            setPage(nextPage)
            loadUsers({ nextPage }).catch(() => {})
          }}
        />
      </Card>
    </div>
  )
}
