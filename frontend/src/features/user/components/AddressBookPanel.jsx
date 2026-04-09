import { Alert, Badge, Button, Card, Spinner } from '@/shared/ui'
import { formatFullAddress, labelToTitle } from '@/features/user/utils/address.utils'

const AddressBookPanel = ({
  addresses,
  loading,
  error,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  return (
    <Card className="space-y-sm">
      <h2 className="text-lg font-semibold text-text-primary">Address Book</h2>
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <div className="flex justify-center py-lg"><Spinner /></div>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-text-secondary">No addresses saved yet.</p>
      ) : (
        <div className="space-y-sm">
          {addresses.map((address) => (
            <div key={address._id} className="rounded-md border border-border bg-surface-3 p-sm sm:p-md">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={address.isDefault ? 'success' : 'default'}>{labelToTitle(address.label)}</Badge>
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-elevated hover:bg-surface-2"
                    aria-label="Open address options"
                    onClick={() => setOpenMenuId((current) => (current === address._id ? '' : address._id))}
                  >
                    <span className="flex flex-col items-center gap-0.5" aria-hidden="true">
                      <span className="h-1 w-1 rounded-full bg-text-secondary" />
                      <span className="h-1 w-1 rounded-full bg-text-secondary" />
                      <span className="h-1 w-1 rounded-full bg-text-secondary" />
                    </span>
                  </button>
                  {openMenuId === address._id ? (
                    <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-border bg-surface-elevated p-1 shadow-soft">
                      <button
                        type="button"
                        className="w-full rounded px-2 py-1.5 text-left text-xs text-text-primary hover:bg-surface-3"
                        onClick={() => onEdit(address)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="w-full rounded px-2 py-1.5 text-left text-xs text-danger hover:bg-danger-soft"
                        onClick={() => onDelete(address._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-2">
                <p className="my-1.5 flex flex-wrap items-center gap-x-8 gap-y-1 py-2 text-sm font-semibold text-text-primary">
                  <span>{address.fullName || '-'}</span>
                  <span>{address.phone || ''}</span>
                </p>
                <p className="text-sm text-text-secondary">{formatFullAddress(address)}</p>
              </div>

              <div className="mt-3 flex items-center justify-end">
                {address.isDefault ? (
                  <span className="text-xs font-medium text-success">Default</span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onSetDefault(address._id)}>
                    Set Default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default AddressBookPanel
