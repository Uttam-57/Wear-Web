import { Button, Card, FormField } from '@/shared/ui'
import { BASE_COLOR_OPTIONS } from '@/features/seller/productEditor/utils/productEditor.utils'

export default function SellerProductVariantsSection({
  variants,
  variantError,
  sizeOptions,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
  onToggleVariantSize,
}) {
  const hasTemplateSizes = Array.isArray(sizeOptions) && sizeOptions.length > 0

  return (
    <Card className="space-y-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Variants</h2>
          <p className="text-xs text-text-secondary">Each variant needs color, size selection, and pricing with stock.</p>
        </div>

        <Button size="sm" variant="secondary" onClick={onAddVariant}>+ Add Variant</Button>
      </div>

      {variantError ? <p className="text-xs text-danger">{variantError}</p> : null}

      <div className="space-y-sm">
        {variants.map((variant, index) => {
          const selectedSizes = Array.isArray(variant?.selectedSizes)
            ? variant.selectedSizes
            : (variant?.size ? [variant.size] : [])

          return (
          <div key={`variant-${index}`} className="rounded-lg border border-border bg-surface-3/40 p-sm">

            <div className="mb-sm flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">Variant {index + 1}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveVariant(index)}
                disabled={variants.length <= 1}
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-4">
              <FormField
                label="Color name"
                value={variant.colorName}
                onChange={(event) => onVariantChange(index, 'colorName', event.target.value)}
                placeholder="Navy"
              />

              <FormField
                label="Color code"
                type="color"
                value={variant.colorCode || '#000000'}
                onChange={(event) => onVariantChange(index, 'colorCode', event.target.value)}
                className="max-w-[160px]"
              />

              <label className="space-y-1 text-sm text-text-secondary">
                <span>Base color</span>
                <select
                  value={variant.baseColor}
                  onChange={(event) => onVariantChange(index, 'baseColor', event.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
                >
                  {BASE_COLOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              {hasTemplateSizes ? (
                <div className="space-y-1 text-sm text-text-secondary">
                  <span>Sizes (multiple)</span>
                  <details className="relative">
                    <summary className="cursor-pointer rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary marker:content-none">
                      {selectedSizes.length ? selectedSizes.join(', ') : 'Select sizes'}
                    </summary>

                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface-elevated p-2 shadow-card">
                      <div className="space-y-1">
                        {sizeOptions.map((option) => (
                          <label key={`${index}-${option}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-surface-3">
                            <input
                              type="checkbox"
                              checked={selectedSizes.includes(option)}
                              onChange={(event) => onToggleVariantSize(index, option, event.target.checked)}
                            />
                            <span className="text-sm text-text-primary">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              ) : (
                <FormField
                  label="Size"
                  value={variant.size}
                  onChange={(event) => onVariantChange(index, 'size', event.target.value)}
                  placeholder="M"
                />
              )}

              <FormField
                label="Base Price"
                type="number"
                min="0"
                step="0.01"
                value={variant.price}
                onChange={(event) => onVariantChange(index, 'price', event.target.value)}
                placeholder="999"
              />

              <FormField
                label="Selling Price"
                type="number"
                min="0"
                step="0.01"
                value={variant.sellingPrice}
                onChange={(event) => onVariantChange(index, 'sellingPrice', event.target.value)}
                placeholder="849"
              />

              <FormField
                label="Stock"
                type="number"
                min="0"
                step="1"
                value={variant.stock}
                onChange={(event) => onVariantChange(index, 'stock', event.target.value)}
                placeholder="20"
              />

              <FormField
                label="Discount %"
                type="number"
                min="0"
                max="100"
                step="1"
                value={variant.discount}
                onChange={(event) => onVariantChange(index, 'discount', event.target.value)}
                placeholder="0"
              />

              <FormField
                label="Min Order Qty"
                type="number"
                min="1"
                step="1"
                value={variant.minOrderQty}
                onChange={(event) => onVariantChange(index, 'minOrderQty', event.target.value)}
                placeholder="1"
              />

              <FormField
                label="SKU (optional)"
                value={variant.sku}
                onChange={(event) => onVariantChange(index, 'sku', event.target.value)}
                placeholder="WW-NAVY-M-001"
              />
            </div>
          </div>
        )})}
      </div>
    </Card>
  )
}
