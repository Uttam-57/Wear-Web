import { cn } from '@/shared/utils/cn'

const FilterChip = ({ label, onRemove, className }) => {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-surface-tertiary px-sm py-1 text-xs text-text-secondary', className)}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-[2px] text-text-muted transition hover:bg-surface hover:text-text-primary"
        aria-label={`Remove ${label}`}
      >
        x
      </button>
    </span>
  )
}

export default FilterChip
