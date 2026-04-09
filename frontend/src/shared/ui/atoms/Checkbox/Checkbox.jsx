import { cn } from '@/shared/utils/cn'

const Checkbox = ({ id, checked, onChange, label, className, ...props }) => {
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-2', className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-primary"
        {...props}
      />
      {label ? <span className="text-sm text-text-secondary">{label}</span> : null}
    </label>
  )
}

export default Checkbox
