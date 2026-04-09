import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import { Alert, Button, Card, PageHeader, Pagination, Spinner } from '@/shared/ui'
import {
  clearAllNotifications,
  listNotifications,
  markAllNotificationsRead,
} from '@/features/notifications/api/notifications.api'

const PAGE_SIZE = 20

const formatRelativeTime = (value) => {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const minutes = Math.round(diffMs / 60000)

  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')

  const days = Math.round(hours / 24)
  return rtf.format(days, 'day')
}

const toPreview = (message, max = 140) => {
  const text = String(message || '').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

export default function NotificationsCenter({ homeRoute }) {
  const pushToast = useUIStore((state) => state.pushToast)

  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState([])

  const loadPage = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const result = await listNotifications({ page, limit: PAGE_SIZE })
      setNotifications(result.notifications)
      setPagination(result.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 })
    } catch (err) {
      setError(getApiError(err, 'Unable to load notifications right now.'))
      setNotifications([])
      setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPage(1).catch(() => {})
  }, [loadPage])

  const unreadCount = useMemo(() => {
    return notifications.filter((entry) => !entry?.isRead).length
  }, [notifications])

  const toggleExpanded = (id) => {
    setExpandedIds((previous) => {
      if (previous.includes(id)) return previous.filter((entry) => entry !== id)
      return [...previous, id]
    })
  }

  const handleMarkAllRead = async () => {
    setBusy(true)

    try {
      await markAllNotificationsRead()
      setNotifications((previous) => previous.map((entry) => ({ ...entry, isRead: true })))
      pushToast({
        type: 'success',
        title: 'Marked as read',
        message: 'All notifications are marked as read.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'Action failed',
        message: getApiError(err, 'Unable to mark notifications as read.'),
      })
    } finally {
      setBusy(false)
    }
  }

  const handleClearAll = async () => {
    setBusy(true)

    try {
      await clearAllNotifications()
      setNotifications([])
      setExpandedIds([])
      setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
      pushToast({
        type: 'success',
        title: 'Notifications cleared',
        message: 'All notifications were removed from storage.',
      })
    } catch (err) {
      pushToast({
        type: 'danger',
        title: 'Action failed',
        message: getApiError(err, 'Unable to clear notifications right now.'),
      })
    } finally {
      setBusy(false)
    }
  }

  const handlePageChange = (nextPage) => {
    loadPage(nextPage).catch(() => {})
    setExpandedIds([])
  }

  return (
    <div className="page-shell space-y-md pb-xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={homeRoute} className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-text-secondary">Notifications</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-sm">
        <PageHeader
          title="Notifications"
          subtitle="View all updates and order alerts in one place."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger" onClick={handleClearAll} disabled={busy || !notifications.length}>
          Clear All Notifications
        </Button>
        <Button variant="secondary" onClick={handleMarkAllRead} loading={busy} disabled={!unreadCount}>
          Mark All Read
        </Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
      ) : (
        <Card className="space-y-sm">
          {!notifications.length ? (
            <p className="rounded-md border border-dashed border-border bg-surface-tertiary p-md text-sm text-text-secondary">
              No notifications available.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const id = String(notification?._id || '')
                const expanded = expandedIds.includes(id)
                const message = String(notification?.message || 'You have a new update.')

                return (
                  <button
                    key={id || notification?.createdAt}
                    type="button"
                    onClick={() => toggleExpanded(id)}
                    className="w-full rounded-md border border-border bg-surface-3 p-sm text-left hover:bg-surface-tertiary"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <p className={`text-sm ${notification?.isRead ? 'text-text-secondary' : 'font-medium text-text-primary'}`}>
                        {expanded ? message : toPreview(message)}
                      </p>
                      {!notification?.isRead ? <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" /> : null}
                    </div>

                    <p className="mt-1 text-xs text-text-muted">{formatRelativeTime(notification?.createdAt || notification?.updatedAt)}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{expanded ? 'Show less' : 'Click to expand'}</p>
                  </button>
                )
              })}
            </div>
          )}

          <Pagination
            currentPage={Number(pagination?.page || 1)}
            totalPages={Number(pagination?.totalPages || 1)}
            onPageChange={handlePageChange}
            disabled={busy || loading}
          />
        </Card>
      )}
    </div>
  )
}