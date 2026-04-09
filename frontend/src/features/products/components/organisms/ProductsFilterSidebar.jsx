import { useMemo, useState } from 'react'
import { Button } from '@/shared/ui'
import FilterChip from '@/features/products/components/atoms/FilterChip'
import FilterSection from '@/features/products/components/molecules/FilterSection'
import OptionCheck from '@/features/products/components/molecules/OptionCheck'
import {
  DISCOUNT_OPTIONS,
  PRICE_PRESETS,
  normalizeColorCode,
  stringifyCsv,
  toTitleCase,
} from '@/features/products/utils/productBrowse.utils'

const flattenCategories = (categories = [], depth = 0) => {
  const result = []

  categories.forEach((category) => {
    result.push({
      ...category,
      depth,
    })

    if (Array.isArray(category.children) && category.children.length) {
      result.push(...flattenCategories(category.children, depth + 1))
    }
  })

  return result
}

const DEFAULT_GENDERS = ['men', 'women', 'unisex', 'boys', 'girls']
const DEFAULT_COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Grey', 'Brown', 'Beige']
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

const ProductsFilterSidebar = ({
  state,
  categories,
  meta,
  categoryTemplate,
  restrictToRelevant = false,
  activeFilterTokens,
  onClearAll,
  onRemoveToken,
  onToggleCategory,
  onClearCategories,
  onToggleArrayFilter,
  onSetPrice,
  onSetDiscount,
  onSetSpecFilter,
  onApplyFilters,
}) => {
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [manualPrice, setManualPrice] = useState({ min: state.minPrice, max: state.maxPrice })

  const categoryList = useMemo(() => flattenCategories(categories), [categories])

  const useDefaults = !restrictToRelevant

  const genderOptions = (meta?.genderOptions && meta.genderOptions.length)
    ? meta.genderOptions
    : useDefaults
      ? DEFAULT_GENDERS.map((value) => ({ value, count: 0 }))
      : []

  const colorOptions = (meta?.colorOptions && meta.colorOptions.length)
    ? meta.colorOptions
    : useDefaults
      ? DEFAULT_COLORS.map((value) => ({ value, colorCode: value, count: 0 }))
      : []

  const sizeOptions = (meta?.sizeOptions && meta.sizeOptions.length)
    ? meta.sizeOptions
    : useDefaults
      ? DEFAULT_SIZES.map((value) => ({ value, count: 0 }))
      : []
  const brandOptions = meta?.brandOptions || []

  const visibleBrandOptions = showAllBrands ? brandOptions : brandOptions.slice(0, 5)

  const specFields = (meta?.specFields?.length ? meta.specFields : (categoryTemplate?.specFields || []))
    .filter((field) => field?.key)

  return (
    <aside className="space-y-md">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Filters</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold uppercase tracking-wide text-primary hover:text-primary-hover"
        >
          Clear all
        </button>
      </div>

      {activeFilterTokens.length > 0 ? (
        <section className="space-y-2 rounded-lg border border-border bg-surface-tertiary p-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Applied ({activeFilterTokens.length})</p>
            <button type="button" onClick={onClearAll} className="text-xs text-primary hover:text-primary-hover">
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeFilterTokens.map((token) => (
              <FilterChip
                key={`${token.key}-${token.value}`}
                label={token.label}
                onRemove={() => onRemoveToken(token)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <FilterSection title="Category">
        <label className="flex cursor-pointer items-center justify-between rounded-md px-1 py-1 text-sm text-text-secondary">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.categoryIds.length === 0}
              onChange={onClearCategories}
              className="accent-primary"
            />
            <span>All Categories</span>
          </span>
        </label>

        <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
          {categoryList.map((category) => {
            return (
              <label key={category._id} className="flex cursor-pointer items-center justify-between rounded-md px-1 py-1 text-sm text-text-secondary">
                <span className="flex items-center gap-2" style={{ paddingLeft: `${category.depth * 12}px` }}>
                  <input
                    type="checkbox"
                    checked={state.categoryIds.includes(category._id)}
                    onChange={(event) => onToggleCategory(category._id, event.target.checked)}
                    className="accent-primary"
                  />
                  <span>{category.name}</span>
                </span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      {genderOptions.length > 0 || state.gender.length > 0 ? (
        <FilterSection title="Gender">
          {genderOptions.map((item) => (
            <OptionCheck
              key={item.value}
              checked={state.gender.includes(item.value)}
              label={toTitleCase(item.value)}
              onChange={(event) => onToggleArrayFilter('gender', item.value, event.target.checked)}
            />
          ))}
        </FilterSection>
      ) : null}

      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={manualPrice.min}
            onChange={(event) => setManualPrice((prev) => ({ ...prev, min: event.target.value }))}
            placeholder="Min"
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            value={manualPrice.max}
            onChange={(event) => setManualPrice((prev) => ({ ...prev, max: event.target.value }))}
            placeholder="Max"
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => onSetPrice({ minPrice: manualPrice.min, maxPrice: manualPrice.max })}
        >
          Apply Price
        </Button>

        <div className="space-y-1 pt-1">
          {PRICE_PRESETS.map((preset) => (
            <OptionCheck
              key={preset.label}
              type="radio"
              checked={state.minPrice === preset.min && state.maxPrice === preset.max}
              label={preset.label}
              onChange={() => {
                setManualPrice({ min: preset.min, max: preset.max })
                onSetPrice({ minPrice: preset.min, maxPrice: preset.max })
              }}
            />
          ))}
        </div>
      </FilterSection>

      {colorOptions.length > 0 || state.baseColors.length > 0 ? (
        <FilterSection title="Color">
          {colorOptions.map((item) => (
            <OptionCheck
              key={item.value}
              checked={state.baseColors.includes(item.value)}
              label={item.value}
              leftAdornment={<span className="inline-block h-4 w-4 rounded-full border border-border" style={{ backgroundColor: normalizeColorCode(item.colorCode || item.value) }} />}
              onChange={(event) => onToggleArrayFilter('baseColors', item.value, event.target.checked)}
            />
          ))}
        </FilterSection>
      ) : null}

      {sizeOptions.length > 0 || state.sizes.length > 0 ? (
        <FilterSection title="Size">
          {sizeOptions.map((item) => (
            <OptionCheck
              key={item.value}
              checked={state.sizes.includes(item.value)}
              label={item.value}
              onChange={(event) => onToggleArrayFilter('sizes', item.value, event.target.checked)}
            />
          ))}
        </FilterSection>
      ) : null}

      {brandOptions.length > 0 || state.brands.length > 0 ? (
        <FilterSection
          title="Brand"
          action={brandOptions.length > 5 ? (
            <button
              type="button"
              className="text-xs text-primary hover:text-primary-hover"
              onClick={() => setShowAllBrands((prev) => !prev)}
            >
              {showAllBrands ? 'Show Less' : 'Show More'}
            </button>
          ) : null}
        >
          {visibleBrandOptions.map((item) => (
            <OptionCheck
              key={item.value}
              checked={state.brands.includes(item.value)}
              label={item.value}
              onChange={(event) => onToggleArrayFilter('brands', item.value, event.target.checked)}
            />
          ))}
        </FilterSection>
      ) : null}

      <FilterSection title="Discount">
        <OptionCheck
          type="radio"
          checked={!state.discount}
          label="Any"
          onChange={() => onSetDiscount('')}
        />
        {DISCOUNT_OPTIONS.map((value) => (
          <OptionCheck
            key={value}
            type="radio"
            checked={state.discount === `gte:${value}`}
            label={`${value}% or more`}
            onChange={() => onSetDiscount(`gte:${value}`)}
          />
        ))}
      </FilterSection>

      {specFields.map((field) => {
        const selected = state.specs[field.key] || []
        const optionsFromResults = (meta?.specOptions?.[field.key] || []).map((item) => item.value)
        const templateOptions = Array.isArray(field.filterOptions) ? field.filterOptions : []
        const options = Array.from(new Set([...templateOptions, ...optionsFromResults, ...selected].filter(Boolean)))

        if (!options.length) return null

        return (
          <FilterSection key={field.key} title={field.label}>
            {options.map((option) => (
              <OptionCheck
                key={option}
                checked={selected.includes(option)}
                label={option}
                onChange={(event) => {
                  const next = event.target.checked
                    ? Array.from(new Set([...selected, option]))
                    : selected.filter((item) => item !== option)
                  onSetSpecFilter(field.key, next)
                }}
              />
            ))}
          </FilterSection>
        )
      })}

      <Button fullWidth onClick={onApplyFilters} className="md:hidden">
        Apply ({activeFilterTokens.length || 0})
      </Button>

      {Object.keys(state.specs).length > 0 ? (
        <p className="text-xs text-text-muted">Spec query: {Object.entries(state.specs).map(([key, values]) => `${key}=${stringifyCsv(values)}`).join(' | ')}</p>
      ) : null}
    </aside>
  )
}

export default ProductsFilterSidebar
