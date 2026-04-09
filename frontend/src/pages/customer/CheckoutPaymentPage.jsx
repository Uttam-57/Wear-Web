import { Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Alert, Button, Card, PageHeader, PageLoadingState } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import { env } from '@/shared/config/env'
import useCheckoutPaymentPage from '@/features/checkout/hooks/useCheckoutPaymentPage'
import CheckoutStepHeader from '@/features/checkout/components/CheckoutStepHeader'
import CheckoutOrderSummarySidebar from '@/features/checkout/components/CheckoutOrderSummarySidebar'
import CheckoutPaymentMethodPanel from '@/features/checkout/components/CheckoutPaymentMethodPanel'
import { formatAddressPreview } from '@/features/checkout/utils/checkout.utils'

const stripePromise = env.STRIPE_PUBLISHABLE_KEY ? loadStripe(env.STRIPE_PUBLISHABLE_KEY) : null

const CheckoutPaymentContent = () => {
  const stripe = useStripe()
  const elements = useElements()

  const {
    loading,
    summary,
    selectedAddress,
    paymentMethod,
    pageError,
    processing,
    paymentError,
    setPaymentMethod,
    handleChangeAddress,
    handlePlaceOrder,
  } = useCheckoutPaymentPage()

  if (loading) {
    return <PageLoadingState />
  }

  const stripeReady = Boolean(stripe && elements)
  const cardUnavailable = !stripePromise
  const placeOrderDisabled = (
    processing ||
    !selectedAddress ||
    paymentMethod !== 'card' ||
    !stripeReady ||
    cardUnavailable ||
    summary.totalAmount <= 0
  )

  return (
    <div className="page-shell space-y-md pb-28 lg:pb-xl">
      <PageHeader
        overline="Secure Checkout"
        title="Payment"
      />

      <CheckoutStepHeader activeStep="payment" />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {cardUnavailable ? (
        <Alert variant="warning">Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY to enable card payment.</Alert>
      ) : null}

      <section className="grid gap-md lg:grid-cols-[1.55fr,1fr]">
        <div className="space-y-md">
          <Card className="space-y-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-text-primary">Delivery Address</h2>
              <Button size="sm" variant="secondary" onClick={handleChangeAddress}>Change</Button>
            </div>

            {selectedAddress ? (
              <div className="rounded-md border border-success/30 bg-success-soft/70 p-sm text-sm">
                <p className="font-semibold text-text-primary">{selectedAddress.fullName}</p>
                <p className="text-text-secondary">{formatAddressPreview(selectedAddress)}</p>
                <p className="text-text-secondary">Phone: {selectedAddress.phone}</p>
              </div>
            ) : (
              <Alert variant="warning">No delivery address selected.</Alert>
            )}
          </Card>

          <CheckoutPaymentMethodPanel
            selectedMethod={paymentMethod}
            stripeReady={stripeReady}
            paymentError={paymentError}
            onMethodChange={setPaymentMethod}
          />

          <p className="rounded-md border border-border bg-surface-secondary px-sm py-2 text-xs text-text-secondary">
            By placing this order, you agree to WearWeb terms and conditions.
          </p>
        </div>

        <CheckoutOrderSummarySidebar
          summary={summary}
          actionLabel={processing ? 'Processing...' : `Pay ${formatPrice(summary.totalAmount)}`}
          actionDisabled={placeOrderDisabled}
          actionLoading={processing}
          onAction={() => handlePlaceOrder(stripe, elements)}
        />
      </section>
    </div>
  )
}

export default function CheckoutPaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPaymentContent />
    </Elements>
  )
}
