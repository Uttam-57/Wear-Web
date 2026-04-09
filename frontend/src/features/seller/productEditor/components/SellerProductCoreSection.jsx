import { Card, FormField } from '@/shared/ui'
import { GENDER_OPTIONS } from '@/features/seller/productEditor/utils/productEditor.utils'

export default function SellerProductCoreSection({ form, errors, onFieldChange }) {
  return (
    <Card className="space-y-md">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Core Information</h2>
        <p className="text-xs text-text-secondary">These fields power public listing, search and detail page clarity.</p>
      </div>

      <div className="grid gap-md md:grid-cols-2">
        <FormField
          label="Product name"
          required
          value={form.name}
          error={errors.name}
          onChange={(event) => onFieldChange('name', event.target.value)}
          placeholder="Classic Performance T-Shirt"
        />

        <FormField
          label="Brand"
          required
          value={form.brand}
          error={errors.brand}
          onChange={(event) => onFieldChange('brand', event.target.value)}
          placeholder="Wear Web"
        />

        <label className="space-y-1 text-sm text-text-secondary">
          <span>Gender</span>
          <select
            value={form.gender}
            onChange={(event) => onFieldChange('gender', event.target.value)}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.gender ? <p className="text-xs text-danger">{errors.gender}</p> : null}
        </label>

        <FormField
          label="Video URL (optional)"
          value={form.video}
          onChange={(event) => onFieldChange('video', event.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-md md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
            placeholder="Short description shown on product cards and detail hero section"
          />
          {errors.description ? <p className="text-xs text-danger">{errors.description}</p> : null}
        </label>

        <div className="space-y-sm">
          <label className="space-y-1 text-sm text-text-secondary">
            <span>Tags (comma separated)</span>
            <textarea
              value={form.tagsText}
              onChange={(event) => onFieldChange('tagsText', event.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
              placeholder="athleisure, breathable, summer"
            />
          </label>

          <label className="space-y-1 text-sm text-text-secondary">
            <span>Highlights (max 5; comma or new line)</span>
            <textarea
              value={form.highlightsText}
              onChange={(event) => onFieldChange('highlightsText', event.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
              placeholder="Moisture wicking\nLightweight fit"
            />
          </label>
        </div>
      </div>
    </Card>
  )
}
