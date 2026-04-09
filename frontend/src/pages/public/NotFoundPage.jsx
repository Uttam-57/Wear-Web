import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Button, Card } from '@/shared/ui'

export default function NotFoundPage() {
  return (
    <div className="page-shell py-2xl">
      <Card className="mx-auto max-w-xl space-y-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">404</p>
        <h1 className="font-display text-4xl text-text-primary">The page you are looking for does not exist.</h1>
        <p className="text-text-secondary">Try returning to the storefront and continue shopping from there.</p>
        <Button as={Link} to={ROUTES.HOME}>Back to Home</Button>
      </Card>
    </div>
  )
}
