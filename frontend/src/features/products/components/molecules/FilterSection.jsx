import { useState } from 'react'

const FilterSection = ({ title, action, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="space-y-2 border-b border-border pb-md">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex flex-1 items-center justify-between gap-2 text-left"
          aria-expanded={isOpen}
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{title}</h3>
          <span className="text-sm font-semibold text-text-muted">{isOpen ? '-' : '+'}</span>
        </button>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {isOpen ? <div className="space-y-2">{children}</div> : null}
    </section>
  )
}

export default FilterSection
