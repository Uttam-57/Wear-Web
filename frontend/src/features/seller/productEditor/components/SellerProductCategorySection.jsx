import { Card } from '@/shared/ui'

export default function SellerProductCategorySection({
  rootCategoryOptions,
  subCategoryOptions,
  rootCategoryId,
  subCategoryId,
  onRootChange,
  onSubChange,
  categoryError,
}) {
  return (
    <Card className="space-y-sm">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Category</h2>
        <p className="text-xs text-text-secondary">Choose root category first, then optional sub-category.</p>
      </div>

      <div className="grid gap-sm md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span>Root category</span>
          <select
            value={rootCategoryId}
            onChange={(event) => onRootChange(event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            <option value="">Select root category</option>
            {rootCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Sub category (optional)</span>
          <select
            value={subCategoryId}
            onChange={(event) => onSubChange(event.target.value)}
            disabled={!rootCategoryId || subCategoryOptions.length === 0}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary disabled:opacity-60"
          >
            <option value="">None</option>
            {subCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {categoryError ? <p className="text-xs text-danger">{categoryError}</p> : null}
    </Card>
  )
}
