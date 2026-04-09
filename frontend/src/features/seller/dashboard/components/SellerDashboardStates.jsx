import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'

export function SellerNoProductsState() {
  return (
    <Card className="text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Catalog Empty</p>
      <h2 className="mt-2 text-2xl font-display text-text-primary">You have not listed any products yet</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Start selling by adding your first product.
      </p>
      <div className="mt-sm">
        <Button as={Link} to={ROUTES.SELLER_PRODUCTS}>
          Add Your First Product
        </Button>
      </div>
    </Card>
  )
}

export function SellerNoOrdersState() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary">Recent Orders</h2>
      <p className="mt-2 text-sm text-text-secondary">
        No orders yet. Your orders will appear here once customers start purchasing.
      </p>
    </Card>
  )
}

export function SellerBlockedState({ blockedInfo }) {
  return (
    <div className="space-y-md">
      <div>
        <h1 className="section-title">Seller Account Blocked</h1>
        <p className="section-subtitle">Your seller account is currently restricted.</p>
      </div>

      <Card className="space-y-sm">
        <p className="text-sm text-text-secondary">Reason: {blockedInfo?.reason || 'Policy violation review in progress'}</p>
        <p className="text-sm text-text-secondary">Message: {blockedInfo?.message || 'Please contact support for more information.'}</p>
        <div className="flex flex-wrap gap-sm">
          <Button as="a" href="mailto:support@wearweb.com">Contact Support</Button>
          <Button as={Link} to={ROUTES.HOME} variant="secondary">Back to Home</Button>
        </div>
      </Card>
    </div>
  )
}
