import { Button, Checkbox } from '@/shared/ui'

const CartBulkActions = ({
  allSelected,
  selectableCount,
  selectedCount,
  onToggleAll,
  onRemoveSelected,
  onMoveSelectedToWishlist,
  disabled = false,
}) => {
  const hasSelection = selectedCount > 0

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary p-sm sm:flex-row sm:items-center sm:justify-between">
      <Checkbox
        id="cart-select-all"
        checked={allSelected}
        onChange={(event) => onToggleAll(event.target.checked)}
        label={`Select All (${selectableCount})`}
        disabled={selectableCount === 0 || disabled}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasSelection || disabled}
          onClick={onRemoveSelected}
        >
          Remove Selected
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasSelection || disabled}
          onClick={onMoveSelectedToWishlist}
        >
          Move to Wishlist
        </Button>
      </div>
    </div>
  )
}

export default CartBulkActions
