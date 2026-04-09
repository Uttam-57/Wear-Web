import { cn } from '@/shared/utils/cn'

const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-block animate-spin rounded-full border-2 border-primary border-t-transparent', sizes[size], className)}
    />
  )
}

export default Spinner
