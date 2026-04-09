import { Alert, Button, Checkbox, FormField } from '@/shared/ui'

const labelOptions = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
]

const CheckoutAddressFormModal = ({
  open,
  isEditing,
  form,
  errors,
  submitError,
  submitting,
  pincodeLookupLoading,
  locationLoading,
  onClose,
  onSubmit,
  onChange,
  onPincodeChange,
  onPincodeLookup,
  onUseCurrentLocation,
  onToggleDefault,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        aria-label="Close address form"
      />

      <div className="absolute left-1/2 top-1/2 max-h-[90vh] w-[96vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-md shadow-card sm:p-lg">
        <div className="mb-md flex items-start justify-between gap-md">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h2>
            <p className="text-xs text-text-secondary">All fields marked with * are required.</p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-text-secondary hover:bg-surface-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {submitError ? <Alert>{submitError}</Alert> : null}

        <form className="mt-md space-y-sm" onSubmit={onSubmit}>
          <FormField
            label="Full Name *"
            value={form.fullName}
            onChange={onChange('fullName')}
            error={errors.fullName}
            maxLength={100}
            required
          />

          <FormField
            label="Phone Number *"
            value={form.phone}
            onChange={onChange('phone')}
            error={errors.phone}
            placeholder="e.g. +919876543210"
            maxLength={16}
            required
          />

          <div className="grid gap-sm sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <FormField
              label="Pincode *"
              value={form.pincode}
              onChange={onPincodeChange}
              error={errors.pincode}
              inputMode="numeric"
              maxLength={6}
              required
            />
            <Button type="button" variant="secondary" loading={pincodeLookupLoading} onClick={onPincodeLookup}>
              Lookup
            </Button>
            <Button type="button" variant="secondary" loading={locationLoading} onClick={onUseCurrentLocation}>
              Detect Location
            </Button>
          </div>

          <FormField
            label="Address Line 1 (Street) *"
            value={form.street}
            onChange={onChange('street')}
            error={errors.street}
            maxLength={200}
            required
          />

          <FormField
            label="Address Line 2 (Building / Area)"
            value={form.building}
            onChange={onChange('building')}
            error={errors.building}
            maxLength={100}
          />

          <FormField
            label="Landmark"
            value={form.landmark}
            onChange={onChange('landmark')}
            error={errors.landmark}
            maxLength={100}
          />

          <div className="grid gap-sm sm:grid-cols-2">
            <FormField
              label="City / District *"
              value={form.locality}
              onChange={onChange('locality')}
              error={errors.locality}
              maxLength={100}
              required
            />
            <FormField
              label="State *"
              value={form.state}
              onChange={onChange('state')}
              error={errors.state}
              maxLength={60}
              required
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">Address Type</p>
            <div className="flex flex-wrap gap-2">
              {labelOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-secondary px-sm py-2 text-sm text-text-secondary"
                >
                  <input
                    type="radio"
                    name="addressLabel"
                    value={option.value}
                    checked={form.label === option.value}
                    onChange={onChange('label')}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.label ? <p className="mt-1 text-xs text-danger">{errors.label}</p> : null}
          </div>

          <Checkbox
            checked={Boolean(form.isDefault)}
            onChange={(event) => onToggleDefault(event.target.checked)}
            label="Make this my default address"
          />

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-sm">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEditing ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutAddressFormModal
