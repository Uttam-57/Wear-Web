import AddressBookPanel from '@/features/user/components/AddressBookPanel'
import AddressFormPanel from '@/features/user/components/AddressFormPanel'
import useAddressPageController from '@/features/user/hooks/useAddressPageController'
import { PageHeader } from '@/shared/ui'

export default function AddressesPage() {
  const {
    addresses,
    editingId,
    error,
    form,
    loading,
    locationLoading,
    openMenuId,
    setOpenMenuId,
    submitError,
    submitting,
    updateFormField,
    handleEdit,
    handlePincodeChange,
    handlePincodeLookup,
    handleSubmit,
    handleUseCurrentLocation,
    remove,
    resetForm,
    setDefault,
  } = useAddressPageController()

  return (
    <div className="page-shell space-y-lg">
      <PageHeader
        title="Saved Addresses"
        subtitle="Manage up to five delivery addresses."
      />

      <div className="grid gap-lg lg:grid-cols-[1fr,360px]">
        <AddressBookPanel
          addresses={addresses}
          loading={loading}
          error={error}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={handleEdit}
          onDelete={(id) => {
            setOpenMenuId('')
            remove(id).catch(() => {})
          }}
          onSetDefault={(id) => setDefault(id).catch(() => {})}
        />

        <AddressFormPanel
          form={form}
          editingId={editingId}
          submitError={submitError}
          locationLoading={locationLoading}
          submitting={submitting}
          onSubmit={handleSubmit}
          onUpdateField={updateFormField}
          onPincodeChange={handlePincodeChange}
          onPincodeBlur={() => handlePincodeLookup().catch(() => {})}
          onUseCurrentLocation={handleUseCurrentLocation}
          onCancel={resetForm}
        />
      </div>
    </div>
  )
}
