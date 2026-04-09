import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, FormField } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import useForgotPassword from '@/features/auth/hooks/useForgotPassword'

// ─────────────────────────────────────────────────────────────────────────────
// ForgotPasswordForm — organism
//
// Two states:
//   default — email input form
//   sent    — success message (always shown regardless of email existence)
//             Auth.md 14.3: never reveal if email exists
// ─────────────────────────────────────────────────────────────────────────────
const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const { submit, loading, sent, errors, apiError } = useForgotPassword()

  const handleSubmit = (e) => {
    e.preventDefault()
    submit(email)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div>
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-surface-tertiary border border-border flex items-center justify-center mb-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-primary" aria-hidden="true">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary mb-1">
          Check your email
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          If an account exists with that email, you'll receive a reset link shortly.
          The link is valid for 1 hour.
        </p>

        <Button
          as={Link}
          to={ROUTES.LOGIN}
          variant="primary"
          size="lg"
          fullWidth
        >
          Back to login
        </Button>
      </div>
    )
  }

  // ── Default state — email form ─────────────────────────────────────────────
  return (
    <div>
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-surface-tertiary border border-border flex items-center justify-center mb-lg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-primary" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <circle cx="12" cy="17" r=".5" fill="currentColor"/>
        </svg>
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-text-primary mb-1">
        Forgot your<br />password?
      </h1>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Enter your email and we'll send a reset link valid for 1 hour.
      </p>

      {apiError && (
        <div role="alert" className="mb-5 px-md py-sm rounded-md bg-red-50 border border-red-100 text-sm text-danger">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-lg">
          <FormField
            id="forgot-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Send Reset Link
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

export default ForgotPasswordForm