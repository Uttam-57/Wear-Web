import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '@/features/auth/api'
import useAuthStore from '@/features/auth/authSlice'
import { getSellerProfile } from '@/features/user/api'
import { ROLES, USER_STATUS } from '@/shared/constants/app'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import { Alert, Button, Card, Spinner } from '@/shared/ui'

const toReadableReason = (reason) => {
  if (!reason) return 'Not specified'
  return String(reason)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function SellerPendingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const rejectionReason = user?.rejectionInfo?.reason
  const rejectionMessage = user?.rejectionInfo?.message
  const isRejected = Boolean(rejectionReason || rejectionMessage)

  const subtitle = useMemo(() => {
    if (isRejected) return 'Action required'
    return 'Seller review in progress'
  }, [isRejected])

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    if (user.role !== ROLES.SELLER) {
      navigate(ROUTES.UNAUTHORIZED, { replace: true })
      return
    }

    if (user.status !== USER_STATUS.PENDING) {
      navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
      return
    }

    let active = true

    const ensureProfileReady = async () => {
      setLoading(true)
      setProfileError('')

      try {
        const profile = await getSellerProfile()
        if (!active) return

        if (!profile?.profileComplete) {
          navigate(ROUTES.SELLER_PROFILE_SETUP, { replace: true })
          return
        }

        setContactEmail(location.state?.submittedEmail || profile?.companyEmail || user?.email || '')
      } catch (error) {
        if (!active) return

        if (error?.response?.status === 404) {
          navigate(ROUTES.SELLER_PROFILE_SETUP, { replace: true })
          return
        }

        setProfileError(getApiError(error, 'Unable to fetch seller profile status right now'))
      } finally {
        if (active) setLoading(false)
      }
    }

    ensureProfileReady()

    return () => {
      active = false
    }
  }, [location.state, navigate, user])

  const handleLogout = async () => {
    try {
      await logoutApi(false)
    } catch {
      // Keep local logout even if request fails.
    }

    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-elevated/90 backdrop-blur">
        <div className="page-shell flex items-center justify-between py-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Wear Web</p>
            <p className="text-sm font-semibold text-text-primary">Seller Approval Center</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main className="page-shell py-2xl">
        <Card className="mx-auto max-w-3xl space-y-md text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{subtitle}</p>

          <div className="text-5xl" aria-hidden="true">{isRejected ? 'X' : '...'} </div>

          <h1 className="text-3xl font-display text-text-primary">
            {isRejected ? 'Profile Review Rejected' : 'Profile Submitted Successfully'}
          </h1>

          {profileError ? <Alert>{profileError}</Alert> : null}

          {!isRejected ? (
            <>
              <p className="mx-auto max-w-2xl text-sm text-text-secondary">
                Thanks for completing your seller setup. Our admin team is reviewing your details and proof documents.
                This usually takes 24-48 hours.
              </p>
              <p className="text-sm text-text-secondary">
                We will notify <span className="font-semibold text-text-primary">{contactEmail || 'your registered email'}</span> when your store is approved.
              </p>
            </>
          ) : (
            <>
              <p className="mx-auto max-w-2xl text-sm text-text-secondary">
                We could not approve your seller profile in its current state. Please update your details and submit again.
              </p>
              <div className="rounded-lg border border-danger/30 bg-danger-soft p-md text-left">
                <p className="text-sm font-semibold text-danger">Reason: {toReadableReason(rejectionReason)}</p>
                <p className="mt-1 text-sm text-danger">Admin Note: {rejectionMessage || 'Please review your uploaded details and resubmit.'}</p>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-center gap-sm pt-sm">
            <Button
              onClick={() => navigate(ROUTES.SELLER_PROFILE_SETUP, { replace: true })}
              variant={isRejected ? 'primary' : 'secondary'}
            >
              {isRejected ? 'Edit Profile Details' : 'Review Submitted Details'}
            </Button>
            <Button onClick={() => navigate(ROUTES.HOME)} variant="ghost">Back to Home</Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
