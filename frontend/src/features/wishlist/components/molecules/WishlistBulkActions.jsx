import { Button, Checkbox } from '@/shared/ui'

const WishlistBulkActions = ({
  selectableCount,
  selectedCount,
  allSelected,
  disabled = false,
  onToggleAll,
  onAddSelectedToCart,
  onRemoveSelected,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary p-sm sm:flex-row sm:items-center sm:justify-between">
      <Checkbox
        id="wishlist-select-all"
        checked={allSelected}
        onChange={(event) => onToggleAll(event.target.checked)}
        label="Select All"
        disabled={selectableCount === 0 || disabled}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={selectedCount === 0 || disabled}
          onClick={onAddSelectedToCart}
        >
          Add Selected to Cart
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={selectedCount === 0 || disabled}
          onClick={onRemoveSelected}
        >
          Remove Selected
        </Button>
      </div>
    </div>
  )
}

export default WishlistBulkActions
