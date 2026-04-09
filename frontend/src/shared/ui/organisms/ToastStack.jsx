import useUIStore from '@/shared/uiSlice'
import { cn } from '@/shared/utils/cn'

const palette = {
  info: 'border-primary/25 bg-primary-soft text-primary',
  success: 'border-success/25 bg-success-soft text-success',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  danger: 'border-danger/25 bg-danger-soft text-danger',
}

const ToastStack = () => {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,92vw)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-md border px-md py-sm shadow-card animate-fade-up',
            palette[toast.type] || palette.info
          )}
        >
          <div className="flex items-start justify-between gap-sm">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-xs text-text-secondary">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded px-1 text-xs text-text-muted hover:text-text-primary"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
