export default function OrderTimelineItem({ event, isLast }) {
  const markerClass =
    event.state === 'completed'
      ? 'border-success bg-success'
      : event.state === 'current'
        ? 'border-primary bg-primary animate-pulse'
        : 'border-border-strong bg-surface-elevated'

  const lineClass = event.state === 'pending' ? 'border-dashed border-border' : 'border-solid border-success/40'

  return (
    <div className="relative pl-8">
      <span className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${markerClass}`} />
      {!isLast ? <span className={`absolute left-[7px] top-5 h-[calc(100%-0.25rem)] border-l ${lineClass}`} /> : null}

      <div className="pb-md">
        <p className="text-sm font-semibold text-text-primary">{event.label}</p>
        <p className="text-xs text-text-secondary">{event.dateText}</p>
        {event.message ? <p className="mt-1 text-sm text-text-secondary">{event.message}</p> : null}
      </div>
    </div>
  )
}
