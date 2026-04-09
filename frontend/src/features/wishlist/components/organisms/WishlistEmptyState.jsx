import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'

const WishlistEmptyState = () => {
  return (
    <Card className="space-y-md py-xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-3xl text-danger">
        W
      </div>

      <div>
        <h2 className="text-xl font-semibold text-text-primary">Your Wishlist is Empty</h2>
        <p className="mt-2 text-sm text-text-secondary">Save your favorite items here and buy them later.</p>
      </div>

      <Button as={Link} to={ROUTES.PRODUCTS}>Start Shopping</Button>
    </Card>
  )
}

export default WishlistEmptyState
