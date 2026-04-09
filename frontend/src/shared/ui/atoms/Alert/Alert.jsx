import { cn } from '@/shared/utils/cn'

const Alert = ({ variant = 'danger', children, className }) => {
  const variants = {
    danger: 'bg-danger-soft border-danger/25 text-danger',
    success: 'bg-success-soft border-success/25 text-success',
    warning: 'bg-warning-soft border-warning/25 text-warning',
    info: 'bg-primary-soft border-primary/25 text-primary'
  }

  return (
    <div className={cn('p-4 rounded-md border text-sm', variants[variant], className)}>
      {children}
    </div>
  )
}

export default Alert