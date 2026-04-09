import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui'

const toneClasses = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-text-muted',
  default: 'text-text-secondary',
}

export default function SellerStatsGrid({ cards = [] }) {
  return (
    <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.id} className="space-y-sm">
          <p className="text-xs uppercase tracking-wide text-text-muted">{card.label}</p>
          <p className="text-3xl font-display text-text-primary">{card.value}</p>
          <p className={`text-sm ${toneClasses[card.metaTone] || toneClasses.default}`}>{card.meta}</p>
          {card.actionLabel && card.actionTo ? (
            <Link to={card.actionTo} className="inline-flex text-sm font-medium text-primary hover:text-primary-hover">
              {card.actionLabel}
            </Link>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
