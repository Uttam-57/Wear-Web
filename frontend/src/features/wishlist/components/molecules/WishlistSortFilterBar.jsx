import { Checkbox } from '@/shared/ui'

const WishlistSortFilterBar = ({ sortBy, options, inStockOnly, onSortChange, onToggleInStock }) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-elevated p-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="wishlist-sort" className="font-medium text-text-secondary">Sort by:</label>
        <select
          id="wishlist-sort"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          className="rounded-md border border-border bg-surface-secondary px-sm py-1.5 text-sm text-text-primary outline-none focus:border-primary"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <Checkbox
        id="wishlist-filter-stock"
        checked={inStockOnly}
        onChange={(event) => onToggleInStock(event.target.checked)}
        label="In Stock Only"
      />
    </div>
  )
}

export default WishlistSortFilterBar
