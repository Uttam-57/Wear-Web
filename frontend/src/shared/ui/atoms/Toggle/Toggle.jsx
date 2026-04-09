import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

const Toggle = forwardRef(({ checked, onChange, className, ...props }, ref) => {
  return (
    <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
        {...props}
      />
      <span className="h-5 w-10 rounded-full border border-border bg-surface-3 transition peer-checked:border-primary peer-checked:bg-primary" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </label>
  )
})

Toggle.displayName = 'Toggle'

export default Toggle
