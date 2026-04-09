import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'

const CartSavedItemsSection = ({
  savedItems,
  expanded,
  onToggle,
  onMoveToCart,
  onRemove,
  pendingItemIds = [],
}) => {
  if (!savedItems.length) return null

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-soft">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-b border-border bg-surface-secondary px-md py-sm text-left"
        onClick={onToggle}
      >
        <span className="text-sm font-semibold text-text-primary">Saved for Later ({savedItems.length})</span>
        <span className="text-xs font-semibold text-text-secondary">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded ? (
        <div className="space-y-sm p-sm sm:p-md">
          {savedItems.map((item) => {
            const pending = pendingItemIds.includes(item.id)

            return (
              <article key={item.id} className="rounded-lg border border-border bg-surface-secondary p-sm">
                <div className="grid grid-cols-[72px,1fr] gap-sm sm:grid-cols-[90px,1fr]">
                  <img src={item.image} alt={item.name} className="h-[100px] w-full rounded-md object-cover" />

                  <div className="space-y-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{item.name}</h3>
                    <p className="text-xs text-text-secondary">Size: {item.size} | Color: {item.colorName}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{formatPrice(item.effectivePrice)}</span>
                      {item.discount > 0 ? (
                        <>
                          <span className="text-xs text-text-muted line-through">{formatPrice(item.price)}</span>
                          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">{item.discount}% OFF</span>
                        </>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onMoveToCart(item)}
                        disabled={pending || item.isOutOfStock}
                      >
                        Move to Cart
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)} disabled={pending}>
                        Remove
                      </Button>
                    </div>

                    {item.isOutOfStock ? (
                      <p className="text-xs font-medium text-warning">This variant is currently out of stock.</p>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default CartSavedItemsSection
