import Label from '@/shared/ui/atoms/Label'
import Input from '@/shared/ui/atoms/Input'
import { cn } from '@/shared/utils/cn'
import { useId } from 'react'

/**
 * FormField molecule — Label + Input + error message
 *
 * Composes: Label atom + Input atom
 * Used by: every auth form field, product form, profile form
 *
 * id:          string  — links label htmlFor to input id
 * label:       string  — label text
 * required:    boolean — shows * on label
 * error:       string  — error message shown below input
 * className:   string  — wrapper class override
 * All other props forwarded to Input
 */
const FormField = ({
  id,
  label,
  required = false,
  error,
  className,
  ...inputProps
}) => {
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={fieldId}
        hasError={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={!!error}
        {...inputProps}
      />
      {error && (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField