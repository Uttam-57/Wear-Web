import { Link } from 'react-router-dom'
import { Alert, Button, Card, PageHeader, PageLoadingState, PageMessageState } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { formatPrice } from '@/shared/utils/formatters'
import useCheckoutPage from '@/features/checkout/hooks/useCheckoutPage'
import CheckoutStepHeader from '@/features/checkout/components/CheckoutStepHeader'
import CheckoutAddressSelector from '@/features/checkout/components/CheckoutAddressSelector'
import CheckoutAddressFormModal from '@/features/checkout/components/CheckoutAddressFormModal'
import CheckoutOrderSummarySidebar from '@/features/checkout/components/CheckoutOrderSummarySidebar'
import CheckoutMobileStickyBar from '@/features/checkout/components/CheckoutMobileStickyBar'
import CheckoutOrderItemsGrid from '@/features/checkout/components/CheckoutOrderItemsGrid'

export default function CheckoutPage() {
  const {
    loading,
    checkoutItems,
    summary,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    addressListError,
    expectedDeliveryText,
    addressModalOpen,
    editingAddressId,
    addressForm,
    addressFormErrors,
    addressSubmitError,
    addressSubmitting,
    pincodeLookupLoading,
    locationLoading,
    deleteTargetAddress,
    setDeleteTargetAddress,
    openAddAddressModal,
    openEditAddressModal,
    closeAddressModal,
    updateAddressFormField,
    setAddressDefaultFlag,
    handleAddressPincodeChange,
    handleAddressPincodeLookup,
    handleUseCurrentLocation,
    submitAddressForm,
    confirmDeleteAddress,
    continueLoading,
    canContinue,
    continueToPayment,
  } = useCheckoutPage()

  if (loading) {
    return <PageLoadingState />
  }

  if (!checkoutItems.length) {
    return (
      <PageMessageState
        message="No checkout items found. Please review your cart."
        alertVariant="warning"
        action={<Button as={Link} to={ROUTES.CART}>Back to Cart</Button>}
      />
    )
  }

  return (
    <div className="page-shell space-y-md pb-28 lg:pb-xl">
      <PageHeader
        overline="Secure Checkout"
        title="Review Delivery and Order Details"
      />

      <CheckoutStepHeader activeStep="review" />

      {addressListError ? <Alert>{addressListError}</Alert> : null}

      <section className="grid gap-md lg:grid-cols-[1.55fr,1fr]">
        <div className="space-y-md">
          <CheckoutAddressSelector
            addresses={addresses}
            loading={false}
            error=""
            selectedAddressId={selectedAddressId}
            onSelect={setSelectedAddressId}
            onAddNew={openAddAddressModal}
            onEdit={openEditAddressModal}
            onDelete={setDeleteTargetAddress}
          />

          <Card className="space-y-sm">
            <h2 className="text-lg font-semibold text-text-primary">2. Order Review</h2>

            <div className="rounded-md border border-success/30 bg-success-soft px-sm py-2 text-sm text-success">
              ✓ {summary.totalItems} item(s) ready for delivery
            </div>

            <div className="space-y-1 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">Expected Delivery</p>
              <p>{expectedDeliveryText}</p>
            </div>

            <CheckoutOrderItemsGrid
              items={checkoutItems}
              expectedDeliveryText={expectedDeliveryText}
            />

            <div className="space-y-2 border-t border-border pt-sm">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>Total Amount</span>
                <span className="font-semibold text-text-primary">{formatPrice(summary.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>

        <CheckoutOrderSummarySidebar
          summary={summary}
          actionLabel="Continue to Payment"
          actionDisabled={!canContinue}
          actionLoading={continueLoading}
          onAction={continueToPayment}
        />
      </section>

      <CheckoutMobileStickyBar
        summary={summary}
        actionLabel="Continue"
        actionDisabled={!canContinue}
        actionLoading={continueLoading}
        onAction={continueToPayment}
      />

      <CheckoutAddressFormModal
        open={addressModalOpen}
        isEditing={Boolean(editingAddressId)}
        form={addressForm}
        errors={addressFormErrors}
        submitError={addressSubmitError}
        submitting={addressSubmitting}
        pincodeLookupLoading={pincodeLookupLoading}
        locationLoading={locationLoading}
        onClose={closeAddressModal}
        onSubmit={submitAddressForm}
        onChange={updateAddressFormField}
        onPincodeChange={handleAddressPincodeChange}
        onPincodeLookup={handleAddressPincodeLookup}
        onUseCurrentLocation={handleUseCurrentLocation}
        onToggleDefault={setAddressDefaultFlag}
      />

      {deleteTargetAddress ? (
        <div className="fixed inset-0 z-[130]">
          <button
            type="button"
            className="absolute inset-0 bg-text-primary/50"
            onClick={() => setDeleteTargetAddress(null)}
            aria-label="Close delete dialog"
          />

          <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">Delete Address?</h2>
            <p className="mt-2 text-sm text-text-secondary">This action cannot be undone.</p>
            <p className="mt-2 text-sm text-text-primary">{deleteTargetAddress.fullName}</p>
            <p className="text-sm text-text-secondary">{deleteTargetAddress.street}, {deleteTargetAddress.city || deleteTargetAddress.district}</p>

            <div className="mt-md flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTargetAddress(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDeleteAddress}>Delete</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
