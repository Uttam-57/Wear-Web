import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'

const HomeSection = ({
  title,
  subtitle,
  actionLabel,
  actionTo,
  actionNode,
  className,
  headerClassName,
  children,
}) => {
  return (
    <section className={cn('page-shell space-y-md', className)}>
      <div className={cn('flex items-end justify-between gap-sm', headerClassName)}>
        <div className="space-y-1">
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>

        {actionNode || (actionLabel && actionTo ? (
          <Link to={actionTo} className="text-sm font-medium text-primary hover:text-primary-hover">
            {actionLabel}
          </Link>
        ) : null)}
      </div>

      {children}
    </section>
  )
}

export default HomeSection
