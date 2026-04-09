import { cn } from '@/shared/utils/cn'

const variants = {
  danger: 'border-danger bg-danger text-white',
  neutral: 'border-border-strong bg-surface-elevated text-text-primary',
  success: 'border-success bg-success text-white',
  warning: 'border-warning bg-warning text-white',
}

const ProductBadge = ({ children, variant = 'neutral', className }) => {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide', variants[variant], className)}>
      {children}
    </span>
  )
}

export default ProductBadge
