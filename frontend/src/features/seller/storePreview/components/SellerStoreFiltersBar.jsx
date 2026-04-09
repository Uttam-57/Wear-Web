import { Button } from '@/shared/ui'

export default function SellerStoreFiltersBar({
  categoryOptions,
  genderOptions,
  brandOptions,
  statusOptions,
  sortOptions,
  selectedCategory,
  selectedGender,
  selectedBrand,
  selectedStatus,
  selectedSort,
  view,
  onCategoryChange,
  onGenderChange,
  onBrandChange,
  onStatusChange,
  onSortChange,
  onViewChange,
  onReset,
}) {
  return (
    <section className="space-y-sm rounded-xl border border-border bg-surface-elevated p-md shadow-soft">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1 text-sm text-text-secondary">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Gender</span>
          <select
            value={selectedGender}
            onChange={(event) => onGenderChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            <option value="">All genders</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Brand</span>
          <select
            value={selectedBrand}
            onChange={(event) => onBrandChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            <option value="">All brands</option>
            {brandOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Product state</span>
          <select
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Sort</span>
          <select
            value={selectedSort}
            onChange={(event) => onSortChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
        </div>
      </div>
    </section>
  )
}
