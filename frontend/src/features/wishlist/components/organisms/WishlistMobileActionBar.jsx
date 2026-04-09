import { Button } from '@/shared/ui'

const WishlistMobileActionBar = ({ selectedCount, busy, onAddSelected }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 p-sm backdrop-blur lg:hidden">
      <div className="mx-auto max-w-7xl px-sm">
        <Button
          fullWidth
          loading={busy}
          disabled={selectedCount === 0 || busy}
          onClick={onAddSelected}
        >
          Add Selected to Cart
        </Button>
      </div>
    </div>
  )
}

export default WishlistMobileActionBar
