import { cn } from '@/shared/utils/cn'

export const Title = ({ children, level = 2, className = '' }) => {
  const Tag = `h${Math.min(6, Math.max(1, level))}`

  const scale = {
    1: 'text-4xl md:text-5xl font-semibold',
    2: 'text-3xl md:text-4xl font-semibold',
    3: 'text-2xl md:text-3xl font-semibold',
    4: 'text-xl md:text-2xl font-semibold',
    5: 'text-lg md:text-xl font-semibold',
    6: 'text-base md:text-lg font-semibold',
  }

  return <Tag className={cn('font-display tracking-tight text-text-primary', scale[level], className)}>{children}</Tag>
}

export const Text = ({ children, variant = 'body', className = '' }) => {
  const variants = {
    body: 'text-base text-text-secondary',
    small: 'text-sm text-text-muted',
    strong: 'text-sm font-semibold text-text-primary',
    error: 'text-sm text-danger',
    success: 'text-sm text-success',
  }

  return <p className={cn(variants[variant], className)}>{children}</p>
}

const Typography = { Title, Text }

export default Typography
