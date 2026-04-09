import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button, PasswordField } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import useResetPassword from '@/features/auth/hooks/useResetPassword'

// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordForm — organism
//
// Three states:
//   no-token  — invalid/missing URL token → show error, link to forgot-password
//   default   — password + confirm fields
//   success   — password reset, redirect to login in 3s
// ─────────────────────────────────────────────────────────────────────────────
const ResetPasswordForm = () => {
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { submit, loading, errors, apiError, success, token } = useResetPassword()

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({ newPassword, confirmPassword })
  }

  // ── No token in URL ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div>
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-danger" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary mb-1">
          Invalid reset link
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          This reset link is missing or invalid. Please request a new one.
        </p>
        <Button as={Link} to={ROUTES.FORGOT_PASSWORD} variant="primary" size="lg" fullWidth>
          Request new link
        </Button>
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div>
        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary mb-1">
          Password reset!
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Your password has been updated. Redirecting you to login shortly...
        </p>
      </div>
    )
  }

  // ── Default state — form ───────────────────────────────────────────────────
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-text-primary mb-1">
        Set a new<br />password
      </h1>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Min 8 characters with uppercase, number, and special character.
      </p>

      {apiError && (
        <div role="alert" className="mb-5 px-md py-sm rounded-md bg-red-50 border border-red-100 text-sm text-danger">
          {apiError}{' '}
          {apiError.includes('expired') && (
            <Link to={ROUTES.FORGOT_PASSWORD} className="font-semibold underline">
              Request new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-md mb-lg">
          <PasswordField
            id="reset-new"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 chars, uppercase, number, special"
            autoComplete="new-password"
            showStrength
            error={errors.newPassword}
            required
          />

          <PasswordField
            id="reset-confirm"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Reset Password
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-lg">
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-text-primary hover:text-primary transition-colors"
        >
          ← Back to login
        </Link>
      </p>
    </div>
  )
}

export default ResetPasswordForm