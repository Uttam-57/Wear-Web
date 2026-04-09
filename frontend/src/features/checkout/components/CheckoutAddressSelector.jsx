import { Alert, Badge, Button, Card, Spinner } from '@/shared/ui'
import { formatAddressPreview, getAddressLocality } from '@/features/checkout/utils/checkout.utils'

const toLabel = (value) => {
  const label = String(value || 'other')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const CheckoutAddressSelector = ({
  addresses,
  loading,
  error,
  selectedAddressId,
  onSelect,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="space-y-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-primary">1. Select Delivery Address</h2>
        <Button size="sm" variant="secondary" onClick={onAddNew}>+ Add New Address</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-lg"><Spinner /></div>
      ) : addresses.length === 0 ? (
        <div className="rounded-md border border-border bg-surface-secondary p-md text-sm text-text-secondary">
          <p>No delivery addresses found.</p>
          <p className="mt-1">Add a new address to continue checkout.</p>
        </div>
      ) : (
        <div className="space-y-sm">
          {addresses.map((address) => {
            const selected = selectedAddressId === address._id
            const locality = getAddressLocality(address)

            return (
              <div
                key={address._id}
                className={[
                  'rounded-lg border p-sm sm:p-md',
                  selected ? 'border-primary bg-primary-soft/30' : 'border-border bg-surface-secondary',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="checkout-address"
                      checked={selected}
                      onChange={() => onSelect(address._id)}
                    />
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <Badge variant={address.isDefault ? 'success' : 'default'}>{toLabel(address.label)}</Badge>
                      {address.isDefault ? <span className="text-xs text-warning">Default</span> : null}
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(address)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => onDelete(address)}>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">{address.fullName || '-'}</p>
                  <p>{formatAddressPreview(address)}</p>
                  {locality && !String(address.street || '').includes(locality) ? <p>{locality}</p> : null}
                  <p>Phone: {address.phone || '-'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default CheckoutAddressSelector
