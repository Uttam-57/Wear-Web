import { cn } from '@/shared/utils/cn'

/**
 * QuantityInput molecule — increment/decrement number input
 *
 * Composes: two Button-style controls + display value
 * Used by: CartItem, ProductDetail (add to cart)
 *
 * value:     number — current quantity
 * onChange:  fn(newValue) — called with new quantity
 * min:       number — minimum allowed (default 1)
 * max:       number — maximum allowed (default 99)
 * disabled:  boolean
 */
const QuantityInput = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}) => {
  const decrement = () => { if (value > min) onChange(value - 1) }
  const increment = () => { if (value < max) onChange(value + 1) }

  const btnClass = cn(
    'w-8 h-8 flex items-center justify-center rounded-md',
    'border border-border text-text-primary text-base font-medium',
    'hover:bg-surface-tertiary transition-colors duration-150',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  )

  return (
    <div
      className={cn('inline-flex items-center gap-sm', className)}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className={btnClass}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span
        className="min-w-[2rem] text-center text-sm font-medium text-text-primary"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className={btnClass}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export default QuantityInput