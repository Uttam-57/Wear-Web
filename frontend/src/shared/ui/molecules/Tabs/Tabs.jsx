import { useMemo, useState } from 'react'
import { cn } from '@/shared/utils/cn'

const Tabs = ({ items = [], defaultValue, value, onChange, variant = 'line', fullWidth = false }) => {
  const fallbackValue = useMemo(() => defaultValue || items[0]?.value || '', [defaultValue, items])
  const [internalValue, setInternalValue] = useState(fallbackValue)

  const selected = value ?? internalValue

  const handleChange = (next) => {
    if (value === undefined) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <div className="space-y-md">
      <div
        className={cn(
          'flex gap-2 overflow-x-auto border-border pb-1',
          variant === 'line' ? 'border-b' : '',
          fullWidth ? 'w-full' : ''
        )}
      >
        {items.map((item) => {
          const active = item.value === selected
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleChange(item.value)}
              className={cn(
                'whitespace-nowrap rounded-md px-sm py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div>
        {items.map((item) => (
          <section key={item.value} className={cn(item.value === selected ? 'block' : 'hidden')}>
            {item.content}
          </section>
        ))}
      </div>
    </div>
  )
}

export default Tabs
