import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

const Input = forwardRef(({ hasError = false, className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-surface-elevated px-md py-2 text-sm text-text-primary shadow-soft',
        'placeholder:text-text-muted transition-colors duration-150',
        'focus-visible:outline-none focus-visible:shadow-focus',
        hasError ? 'border-danger' : 'border-border hover:border-border-strong',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input
