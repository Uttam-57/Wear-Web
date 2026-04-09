import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'

const CartEmptyState = () => {
  return (
    <Card className="space-y-md py-xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl text-primary">
        C
      </div>

      <div>
        <h2 className="text-xl font-semibold text-text-primary">Your Cart is Empty</h2>
        <p className="mt-2 text-sm text-text-secondary">Add items from your wishlist or browse our categories.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button as={Link} to={ROUTES.PRODUCTS}>Shop Now</Button>
        <Button as={Link} to={ROUTES.WISHLIST} variant="secondary">View Wishlist</Button>
      </div>
    </Card>
  )
}

export default CartEmptyState
