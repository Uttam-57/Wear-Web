import { cn } from '@/shared/utils/cn'

/**
 * Badge atom — pure UI, zero logic
 *
 * variant: 'default' | 'success' | 'warning' | 'danger' | 'primary'
 * size:    'sm' | 'md'
 *
 * Used by: OrderStatusBadge, seller status, product hold status
 */
const Badge = ({ children, variant = 'default', size = 'md', className, ...props }) => {
  const variants = {
    default: 'bg-surface-3 text-text-secondary border border-border',
    primary: 'bg-primary-soft text-primary border border-primary/20',
    success: 'bg-success-soft text-success border border-success/20',
    warning: 'bg-warning-soft text-warning border border-warning/20',
    danger:  'bg-danger-soft text-danger border border-danger/20',
  }

  const sizes = {
    sm: 'px-xs py-[2px] text-xs',
    md: 'px-sm py-xs text-xs',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge