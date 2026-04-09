import { cn } from '@/shared/utils/cn'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  as: Comp = 'button',
  type = 'button',
  ...props
}) => {
  const base = cn(
    'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'disabled:cursor-not-allowed disabled:opacity-60'
  )

  const variants = {
    primary: 'border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover',
    secondary: 'border-border bg-surface-elevated text-text-primary hover:border-border-strong hover:bg-surface-3',
    ghost: 'border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-3',
    danger: 'border-danger bg-danger text-white hover:bg-danger/90',
  }

  const sizes = {
    sm: 'px-sm py-1.5 text-xs',
    md: 'px-md py-2 text-sm',
    lg: 'px-lg py-2.5 text-sm',
  }

  const componentProps = {
    className: cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className),
    disabled: disabled || loading,
    ...props,
  }

  if (Comp === 'button') {
    componentProps.type = type
  }

  return (
    <Comp {...componentProps}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      <span>{children}</span>
    </Comp>
  )
}

export default Button
