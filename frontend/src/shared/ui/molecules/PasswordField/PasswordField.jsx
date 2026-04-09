import { useId, useState } from 'react'
import Label from '@/shared/ui/atoms/Label'
import Input from '@/shared/ui/atoms/Input'
import { cn } from '@/shared/utils/cn'

/**
 * PasswordField molecule — Label + password Input + show/hide toggle + optional strength bar
 *
 * Composes: Label atom + Input atom
 * Used by: LoginForm, RegisterForm, ResetPasswordForm
 *
 * id:           string  — links label to input
 * label:        string  — label text
 * required:     boolean
 * error:        string  — error message
 * showStrength: boolean — shows strength bar (registration/reset only, not login)
 */

// Pure function — no side effects, no imports needed from validators
// Password rules mirror backend: 8+ chars, uppercase, number, special char
const getStrength = (password) => {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[@$!%*?&#]/.test(password)) score++
  return score
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR  = ['', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-success']
const STRENGTH_TEXT   = ['', 'text-danger', 'text-warning', 'text-warning', 'text-success']

const PasswordField = ({
  id,
  label = 'Password',
  required = false,
  error,
  showStrength = false,
  value = '',
  className,
  ...inputProps
}) => {
  const [show, setShow] = useState(false)
  const autoId = useId()
  const fieldId = id || autoId
  const strength = showStrength ? getStrength(value) : 0

  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}

      {/* Input + show/hide button */}
      <div className="relative">
        <Input
          id={fieldId}
          type={show ? 'text' : 'password'}
          value={value}
          hasError={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          aria-invalid={!!error}
          className="pr-16"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-md top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      {/* Strength bar — only shown when showStrength=true and user is typing */}
      {showStrength && value.length > 0 && (
        <div className="mt-xs">
          <div className="flex gap-1 mb-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  i <= strength ? STRENGTH_COLOR[strength] : 'bg-border'
                )}
              />
            ))}
          </div>
          {strength > 0 && (
            <p className={cn('text-xs font-medium', STRENGTH_TEXT[strength])}>
              {STRENGTH_LABEL[strength]}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PasswordField