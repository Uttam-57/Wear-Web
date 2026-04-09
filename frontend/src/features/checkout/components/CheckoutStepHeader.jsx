import { cn } from '@/shared/utils/cn'

const STEPS = [
  { key: 'address', label: 'Address' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
]

const getStepIndex = (activeStep) => {
  const index = STEPS.findIndex((step) => step.key === activeStep)
  return index === -1 ? 0 : index
}

const CheckoutStepHeader = ({ activeStep = 'address' }) => {
  const activeIndex = getStepIndex(activeStep)

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-sm sm:p-md">
      <div className="hidden items-center gap-2 sm:flex">
        {STEPS.map((step, index) => {
          const done = index < activeIndex
          const active = index === activeIndex

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-success bg-success-soft text-success',
                  active && 'border-primary bg-primary-soft text-primary',
                  !done && !active && 'border-border bg-surface-secondary text-text-muted'
                )}
              >
                {done ? '✓' : index + 1}
              </div>
              <p className={cn('text-sm font-medium', active ? 'text-text-primary' : 'text-text-secondary')}>
                {step.label}
              </p>
              {index < STEPS.length - 1 ? <div className="h-px flex-1 bg-border" /> : null}
            </div>
          )
        })}
      </div>

      <div className="sm:hidden">
        <div className="mb-2 flex items-center gap-2">
          {STEPS.map((step, index) => {
            const done = index < activeIndex
            const active = index === activeIndex

            return (
              <span
                key={step.key}
                className={cn(
                  'h-2.5 flex-1 rounded-full',
                  done && 'bg-success',
                  active && 'bg-primary',
                  !done && !active && 'bg-border'
                )}
              />
            )
          })}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Step {activeIndex + 1} of {STEPS.length}: {STEPS[activeIndex].label}
        </p>
      </div>
    </div>
  )
}

export default CheckoutStepHeader
