import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, FormField, PasswordField, Checkbox } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import useLogin from '@/features/auth/hooks/useLogin'

// ─────────────────────────────────────────────────────────────────────────────
// LoginForm — organism (feature-specific component)
//
// Composes: FormField molecule, PasswordField molecule, Button atom, Checkbox atom
// Logic:    delegated entirely to useLogin hook
// Renders:  login form — no layout, no shell, no scrolling images
//           (AuthLayout handles the shell — this is just the form content)
// ─────────────────────────────────────────────────────────────────────────────
const LoginForm = () => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const { submit, loading, errors, apiError, clearErrors } = useLogin()

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({ email, password })
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-text-primary mb-1">
        Login to your<br />account
      </h1>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Welcome back — sign in to continue
      </p>

      {/* API-level error (wrong credentials, blocked, rate limit) */}
      {apiError && (
        <div
          role="alert"
          className="mb-6 px-md py-sm rounded-md bg-red-50 border border-red-100 text-sm text-danger"
        >
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-md">
          <FormField
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearErrors() }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            required
          />

          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearErrors() }}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
            required
          />
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between mt-sm mb-lg">
          <Checkbox
            id="login-remember"
            label="Remember me"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-lg">
        Don't have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-semibold text-text-primary hover:text-primary transition-colors"
        >
          Sign up now
        </Link>
      </p>
    </div>
  )
}

export default LoginForm