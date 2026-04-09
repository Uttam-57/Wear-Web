import { cn } from '@/shared/utils/cn'

const OptionCheck = ({
  checked,
  type = 'checkbox',
  label,
  hint,
  onChange,
  disabled = false,
  leftAdornment,
}) => {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-sm', disabled && 'cursor-not-allowed opacity-50')}>
      <span className="flex items-center gap-2 text-text-secondary">
        <input
          type={type}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="accent-primary"
        />
        {leftAdornment}
        <span>{label}</span>
      </span>
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </label>
  )
}

export default OptionCheck
