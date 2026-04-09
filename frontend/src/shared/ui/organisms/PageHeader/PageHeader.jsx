import { cn } from '@/shared/utils/cn'

const PageHeader = ({
  overline,
  title,
  subtitle,
  className,
  overlineClassName,
  titleClassName,
  subtitleClassName,
}) => {
  return (
    <div className={cn('space-y-xs', className)}>
      {overline ? (
        <p className={cn('text-xs font-semibold uppercase tracking-wide text-text-secondary', overlineClassName)}>
          {overline}
        </p>
      ) : null}

      {title ? <h1 className={cn('section-title', titleClassName)}>{title}</h1> : null}
      {subtitle ? <p className={cn('section-subtitle', subtitleClassName)}>{subtitle}</p> : null}
    </div>
  )
}

export default PageHeader
