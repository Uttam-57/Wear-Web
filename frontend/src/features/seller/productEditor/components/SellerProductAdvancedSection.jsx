import { Card, FormField } from '@/shared/ui'

export default function SellerProductAdvancedSection({ form, onFieldChange }) {
  return (
    <Card className="space-y-md">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Manufacturer, Shipping and Policy</h2>
        <p className="text-xs text-text-secondary">Optional but recommended for trust, logistics and returns clarity.</p>
      </div>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <p className="text-sm font-medium text-text-primary">Manufacturer Details</p>

        <div className="grid gap-sm md:grid-cols-2">
          <FormField
            label="Manufacturer name"
            value={form.manufacturerName}
            onChange={(event) => onFieldChange('manufacturerName', event.target.value)}
          />
          <FormField
            label="Manufacturer address"
            value={form.manufacturerAddress}
            onChange={(event) => onFieldChange('manufacturerAddress', event.target.value)}
          />
          <FormField
            label="Country of origin"
            value={form.manufacturerCountryOfOrigin}
            onChange={(event) => onFieldChange('manufacturerCountryOfOrigin', event.target.value)}
          />
          <FormField
            label="Importer name"
            value={form.manufacturerImporterName}
            onChange={(event) => onFieldChange('manufacturerImporterName', event.target.value)}
          />
          <FormField
            label="Packer details"
            value={form.manufacturerPackerDetails}
            onChange={(event) => onFieldChange('manufacturerPackerDetails', event.target.value)}
          />
        </div>
      </section>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <p className="text-sm font-medium text-text-primary">Shipping Info</p>

        <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-4">
          <FormField
            label="Weight (g)"
            type="number"
            min="0"
            value={form.shippingWeight}
            onChange={(event) => onFieldChange('shippingWeight', event.target.value)}
          />
          <FormField
            label="Length (cm)"
            type="number"
            min="0"
            value={form.shippingLength}
            onChange={(event) => onFieldChange('shippingLength', event.target.value)}
          />
          <FormField
            label="Breadth (cm)"
            type="number"
            min="0"
            value={form.shippingBreadth}
            onChange={(event) => onFieldChange('shippingBreadth', event.target.value)}
          />
          <FormField
            label="Height (cm)"
            type="number"
            min="0"
            value={form.shippingHeight}
            onChange={(event) => onFieldChange('shippingHeight', event.target.value)}
          />
        </div>
      </section>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <p className="text-sm font-medium text-text-primary">Purchase and Return</p>

        <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={Boolean(form.isCODAvailable)}
              onChange={(event) => onFieldChange('isCODAvailable', event.target.checked)}
            />
            COD Available
          </label>

          <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={Boolean(form.isPack)}
              onChange={(event) => onFieldChange('isPack', event.target.checked)}
            />
            Is Pack Product
          </label>

          <FormField
            label="Pack Of"
            type="number"
            min="1"
            value={form.packOf}
            onChange={(event) => onFieldChange('packOf', event.target.value)}
          />

          <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={Boolean(form.returnable)}
              onChange={(event) => onFieldChange('returnable', event.target.checked)}
            />
            Returnable
          </label>

          <FormField
            label="Return Window (days)"
            type="number"
            min="0"
            value={form.returnWindow}
            onChange={(event) => onFieldChange('returnWindow', event.target.value)}
          />
        </div>
      </section>
    </Card>
  )
}
