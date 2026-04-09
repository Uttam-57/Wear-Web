import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Button, Card } from '@/shared/ui'

export default function UnauthorizedPage() {
  return (
    <div className="page-shell py-2xl">
      <Card className="mx-auto max-w-xl space-y-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">403 Access denied</p>
        <h1 className="font-display text-4xl text-text-primary">You are not allowed to access this page.</h1>
        <p className="text-text-secondary">If you think this is a mistake, login with the right role or contact support.</p>
        <div className="flex items-center justify-center gap-sm">
          <Button as={Link} to={ROUTES.HOME}>Go Home</Button>
          <Button as={Link} to={ROUTES.LOGIN} variant="secondary">Login</Button>
        </div>
      </Card>
    </div>
  )
}
