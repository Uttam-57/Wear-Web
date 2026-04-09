import { SORT_OPTIONS } from '@/features/products/utils/productBrowse.utils'

const ProductsResultsHeader = ({
  total = 0,
  title,
  sort,
  view,
  onSortChange,
  onViewChange,
}) => {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-md shadow-soft">
      <p className="text-sm text-text-secondary">Showing {total} products{title ? ` in "${title}"` : ''}</p>

      <div className="mt-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="sortProducts" className="text-sm text-text-secondary">Sort by:</label>
          <select
            id="sortProducts"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="rounded-md border border-border bg-surface px-sm py-2 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="inline-flex rounded-md border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={`rounded px-sm py-1 text-sm ${view === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-tertiary'}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={`rounded px-sm py-1 text-sm ${view === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-tertiary'}`}
          >
            List
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductsResultsHeader
