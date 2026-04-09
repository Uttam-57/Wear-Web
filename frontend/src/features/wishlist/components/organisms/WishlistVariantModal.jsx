import { useMemo, useState } from 'react'
import { Button } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import { buildColorGroups, getEffectivePrice } from '@/features/wishlist/utils/wishlistPage.utils'

const getInitialSelection = (variants = []) => {
  const colorGroups = buildColorGroups(variants)
  const firstAvailableColor = colorGroups.find((group) => group.variants.some((variant) => Number(variant?.stock || 0) > 0))
  const selectedColor = firstAvailableColor?.colorName || colorGroups[0]?.colorName || ''

  const sizes = variants.filter((variant) => variant?.colorName === selectedColor)
  const firstAvailableSize = sizes.find((variant) => Number(variant?.stock || 0) > 0)
  const selectedSize = firstAvailableSize?.size || sizes[0]?.size || ''

  return {
    colorGroups,
    selectedColor,
    selectedSize,
    quantity: 1,
  }
}

const WishlistVariantModal = ({ open, item, loading = false, onClose, onConfirm }) => {
  const variants = useMemo(() => item?.variants || [], [item])
  const initialSelection = useMemo(() => getInitialSelection(variants), [variants])

  const [selectedColor, setSelectedColor] = useState(() => initialSelection.selectedColor)
  const [selectedSize, setSelectedSize] = useState(() => initialSelection.selectedSize)
  const [quantity, setQuantity] = useState(() => initialSelection.quantity)

  const colorGroups = initialSelection.colorGroups

  const sizeVariants = useMemo(() => {
    if (!selectedColor) return []
    return variants.filter((variant) => variant?.colorName === selectedColor)
  }, [selectedColor, variants])

  const selectedVariant = useMemo(() => {
    if (!sizeVariants.length) return null
    return sizeVariants.find((variant) => variant?.size === selectedSize) || sizeVariants[0]
  }, [selectedSize, sizeVariants])

  if (!open || !item) return null

  const stock = Math.max(0, Number(selectedVariant?.stock || 0))
  const price = Number(selectedVariant?.price || item.price || 0)
  const discount = Number(selectedVariant?.discount || item.discount || 0)
  const effectivePrice = getEffectivePrice(price, discount)

  const canAdd = Boolean(selectedVariant?._id) && stock > 0 && quantity > 0 && quantity <= stock && !loading

  return (
    <div className="fixed inset-0 z-[150]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        aria-label="Close variant selector"
      />

      <section
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card"
      >
        <div className="mb-sm flex items-start justify-between gap-sm">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Select Variant</h2>
            <p className="mt-1 text-sm text-text-secondary">Choose color, size, and quantity before adding to cart.</p>
          </div>
          <button
            type="button"
            className="rounded-md px-sm py-1 text-sm text-text-secondary hover:bg-surface-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mb-md grid gap-sm rounded-lg border border-border bg-surface-secondary p-sm sm:grid-cols-[110px,1fr]">
          <img src={item.image} alt={item.name} className="h-[110px] w-full rounded-md object-cover" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">{item.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-text-primary">{formatPrice(effectivePrice)}</span>
              {discount > 0 ? (
                <>
                  <span className="text-sm text-text-muted line-through">{formatPrice(price)}</span>
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">{discount}% OFF</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-md">
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">Select Color</p>
            <div className="flex flex-wrap gap-2">
              {colorGroups.map((group) => {
                const selected = group.colorName === selectedColor
                return (
                  <button
                    key={group.colorName}
                    type="button"
                    onClick={() => {
                      const nextSizes = variants.filter((variant) => variant?.colorName === group.colorName)
                      const firstSize = nextSizes.find((variant) => Number(variant?.stock || 0) > 0) || nextSizes[0]
                      setSelectedColor(group.colorName)
                      setSelectedSize(firstSize?.size || '')
                      setQuantity(1)
                    }}
                    className={`inline-flex items-center gap-2 rounded-full border px-sm py-1.5 text-xs font-semibold ${selected ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface-elevated text-text-secondary'}`}
                  >
                    <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: group.colorCode || '#d6dce7' }} />
                    {group.colorName}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {sizeVariants.map((variant) => {
                const selected = variant.size === selectedSize
                const disabled = Number(variant?.stock || 0) <= 0

                return (
                  <button
                    key={`${variant.colorName}-${variant.size}`}
                    type="button"
                    onClick={() => !disabled && setSelectedSize(variant.size)}
                    disabled={disabled}
                    className={`min-w-10 rounded-md border px-sm py-1.5 text-xs font-semibold ${selected ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface-elevated text-text-secondary'} ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                  >
                    {variant.size}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">Quantity</p>
            <div className="inline-flex items-center rounded-md border border-border bg-surface-secondary">
              <button
                type="button"
                className="h-8 w-8 text-sm font-semibold text-text-primary hover:bg-surface-tertiary disabled:opacity-50"
                disabled={quantity <= 1 || loading}
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <span className="min-w-8 px-2 text-center text-sm font-semibold text-text-primary">{quantity}</span>
              <button
                type="button"
                className="h-8 w-8 text-sm font-semibold text-text-primary hover:bg-surface-tertiary disabled:opacity-50"
                disabled={quantity >= stock || loading}
                onClick={() => setQuantity((prev) => Math.min(stock, prev + 1))}
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">{stock} item(s) available</p>
          </div>
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => selectedVariant && onConfirm(selectedVariant, quantity)}
            disabled={!canAdd}
            loading={loading}
          >
            Add to Cart
          </Button>
        </div>
      </section>
    </div>
  )
}

export default WishlistVariantModal
