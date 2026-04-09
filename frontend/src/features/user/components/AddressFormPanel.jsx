import { Alert, Button, Card, FormField } from '@/shared/ui'

const AddressFormPanel = ({
  form,
  editingId,
  submitError,
  locationLoading,
  submitting,
  onSubmit,
  onUpdateField,
  onPincodeChange,
  onPincodeBlur,
  onUseCurrentLocation,
  onCancel,
}) => {
  return (
    <Card className="space-y-sm">
      <h2 className="text-lg font-semibold text-text-primary">{editingId ? 'Edit Address' : 'Add Address'}</h2>
      <form className="space-y-sm" onSubmit={onSubmit}>
        {submitError ? <Alert>{submitError}</Alert> : null}
        <select value={form.label} onChange={onUpdateField('label')} className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm">
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="other">Other</option>
        </select>
        <FormField label="Full Name" value={form.fullName} onChange={onUpdateField('fullName')} required />
        <FormField label="Contact Number" value={form.phone} onChange={onUpdateField('phone')} placeholder="e.g. +919876543210" required />
        <FormField label="Street" value={form.street} onChange={onUpdateField('street')} required />
        <Button type="button" size="sm" variant="secondary" loading={locationLoading} onClick={onUseCurrentLocation}>
          Use Current Location
        </Button>
        <FormField label="Building" value={form.building} onChange={onUpdateField('building')} />
        <FormField label="Landmark" value={form.landmark} onChange={onUpdateField('landmark')} />
        <FormField label="Pincode" value={form.pincode} onChange={onPincodeChange} onBlur={onPincodeBlur} inputMode="numeric" maxLength={6} required />
        <FormField label="State" value={form.state} onChange={onUpdateField('state')} required />
        <FormField label="City / District / Town" value={form.locality} onChange={onUpdateField('locality')} required />
        <div className="flex gap-2">
          <Button type="submit" fullWidth loading={submitting}>{editingId ? 'Update Address' : 'Save Address'}</Button>
          {editingId ? <Button type="button" variant="secondary" fullWidth onClick={onCancel}>Cancel</Button> : null}
        </div>
      </form>
    </Card>
  )
}

export default AddressFormPanel
