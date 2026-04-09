import { useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

const Drawer = ({
  open,
  title,
  onClose,
  side = 'left',
  widthClass = 'w-[86%] max-w-[360px]',
  children,
}) => {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const isRight = side === 'right'

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/40"
        onClick={onClose}
        aria-label="Close drawer"
      />

      <section
        className={cn(
          'absolute top-0 h-full border-border bg-surface-elevated shadow-card transition-transform duration-300',
          widthClass,
          isRight ? 'right-0 border-l animate-fade-up' : 'left-0 border-r animate-fade-up'
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-md py-sm">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-sm py-1 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
          >
            Close
          </button>
        </header>

        <div className="h-[calc(100%-52px)] overflow-y-auto p-md">
          {children}
        </div>
      </section>
    </div>
  )
}

export default Drawer
