import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, FormField, PasswordField, Checkbox } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'
import { ROUTES } from '@/shared/constants/routes'
import useRegister from '@/features/auth/hooks/useRegister'

// ─────────────────────────────────────────────────────────────────────────────
// RegisterForm — organism
//
// Composes: FormField, PasswordField, Button, Checkbox atoms/molecules
// Logic:    delegated to useRegister hook
// Note:     role cannot be changed after registration (Auth.md 14.11) —
//           this is stated clearly in the UI
// ─────────────────────────────────────────────────────────────────────────────
const ROLES_OPTIONS = [
  { value: 'customer', icon: '🛍️', label: 'Customer', sub: 'Browse & buy' },
  { value: 'seller',   icon: '🏪', label: 'Seller',   sub: 'List & earn'  },
]

const RegisterForm = () => {
  const [role,            setRole]            = useState('customer')
  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed,          setAgreed]          = useState(false)
  const [termsError,      setTermsError]      = useState('')

  const { submit, loading, errors, apiError, clearErrors } = useRegister()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!agreed) {
      setTermsError('You must agree to the Terms of Service and Privacy Policy')
      return
    }
    setTermsError('')
    submit({ firstName, lastName, email, phone, password, confirmPassword, role })
  }

  const ce = () => { clearErrors(); setTermsError('') }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-text-primary mb-1">
        Create your<br />account
      </h1>
      <p className="text-sm text-text-muted mb-6 leading-relaxed">
        Choose your role carefully — it cannot be changed after registration.
      </p>

      {apiError && (
        <div role="alert" className="mb-5 px-md py-sm rounded-md bg-red-50 border border-red-100 text-sm text-danger">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* Role selector */}
        <fieldset className="mb-lg">
          <legend className="block text-sm font-medium text-text-secondary mb-sm">
            I want to
          </legend>
          <div className="grid grid-cols-2 gap-sm">
            {ROLES_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setRole(r.value); ce() }}
                aria-pressed={role === r.value}
                className={cn(
                  'py-sm px-sm rounded-lg border-[1.5px] text-center transition-all duration-200',
                  'hover:border-border-strong',
                  role === r.value
                    ? 'border-primary bg-primary-light'
                    : 'border-border bg-surface'
                )}
              >
                <div className="text-lg mb-xs">{r.icon}</div>
                <div className={cn('text-sm font-semibold', role === r.value ? 'text-primary' : 'text-text-primary')}>
                  {r.label}
                </div>
                <div className="text-xs text-text-muted">{r.sub}</div>
              </button>
            ))}
          </div>
          {errors.role && <p className="mt-xs text-xs text-danger">{errors.role}</p>}
        </fieldset>

        <div className="flex flex-col gap-md">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-sm">
            <FormField
              id="reg-firstname"
              label="First Name"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); ce() }}
              placeholder="Uttam"
              autoComplete="given-name"
              maxLength={50}
              error={errors.firstName}
              required
            />
            <FormField
              id="reg-lastname"
              label="Last Name"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); ce() }}
              placeholder="Shah"
              autoComplete="family-name"
              maxLength={50}
              error={errors.lastName}
              required
            />
          </div>

          <FormField
            id="reg-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); ce() }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            required
          />

          <FormField
            id="reg-phone"
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); ce() }}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            error={errors.phone}
          />

          <PasswordField
            id="reg-password"
            label="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); ce() }}
            placeholder="Min 8 chars, uppercase, number, special"
            autoComplete="new-password"
            showStrength
            error={errors.password}
            required
          />

          <PasswordField
            id="reg-confirm"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); ce() }}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
          />
        </div>

        {/* Terms */}
        <div className="mt-md mb-lg">
          <Checkbox
            id="reg-terms"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); setTermsError('') }}
            label={
              <span className="text-sm text-text-muted">
                I agree to the{' '}
                <a href="#" className="text-text-primary underline underline-offset-2">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-text-primary underline underline-offset-2">Privacy Policy</a>
              </span>
            }
          />
          {termsError && <p className="mt-xs text-xs text-danger">{termsError}</p>}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-lg">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-text-primary hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm