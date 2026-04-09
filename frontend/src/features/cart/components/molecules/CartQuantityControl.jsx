import { useState } from 'react'
import { cn } from '@/shared/utils/cn'

const CartQuantityControl = ({
  value,
  max,
  disabled = false,
  loading = false,
  onCommit,
  onMaxReached,
}) => {
  const [draft, setDraft] = useState(String(value || 1))

  const parsedDraft = Number(draft)
  const canDecrease = !disabled && !loading && Number(value) > 1
  const canIncrease = !disabled && !loading && Number(value) < Number(max || value)

  const commit = () => {
    if (disabled || loading) return

    if (!Number.isInteger(parsedDraft)) {
      setDraft(String(value))
      return
    }

    if (parsedDraft < 1) {
      setDraft(String(value))
      return
    }

    if (parsedDraft > Number(max || value)) {
      setDraft(String(max || value))
      if (typeof onMaxReached === 'function') onMaxReached()
      return
    }

    if (parsedDraft !== Number(value)) {
      onCommit(parsedDraft)
      return
    }

    setDraft(String(value))
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-medium text-text-muted">Qty:</span>
      <div className="inline-flex items-center rounded-md border border-border bg-surface-secondary">
        <button
          type="button"
          className={cn(
            'h-8 w-8 rounded-l-md text-sm font-semibold text-text-primary transition-colors',
            canDecrease ? 'hover:bg-surface-tertiary' : 'cursor-not-allowed opacity-50'
          )}
          onClick={() => canDecrease && onCommit(Number(value) - 1)}
          disabled={!canDecrease}
          aria-label="Decrease quantity"
        >
          -
        </button>

        <input
          type="number"
          min={1}
          max={Math.max(1, Number(max || 1))}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
          }}
          className="h-8 w-11 border-x border-border bg-transparent px-1 text-center text-sm font-semibold text-text-primary outline-none"
          disabled={disabled || loading}
          aria-label="Quantity input"
        />

        <button
          type="button"
          className={cn(
            'h-8 w-8 rounded-r-md text-sm font-semibold text-text-primary transition-colors',
            canIncrease ? 'hover:bg-surface-tertiary' : 'cursor-not-allowed opacity-50'
          )}
          onClick={() => {
            if (canIncrease) {
              onCommit(Number(value) + 1)
              return
            }
            if (!disabled && !loading && typeof onMaxReached === 'function') onMaxReached()
          }}
          disabled={!canIncrease}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default CartQuantityControl
