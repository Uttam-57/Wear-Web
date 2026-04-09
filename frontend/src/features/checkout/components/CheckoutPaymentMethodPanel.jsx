import { CardElement } from '@stripe/react-stripe-js'
import { Alert, Card } from '@/shared/ui'

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#23354f',
      '::placeholder': {
        color: '#7f94b5',
      },
    },
    invalid: {
      color: '#c53b44',
    },
  },
}

const CheckoutPaymentMethodPanel = ({
  selectedMethod,
  stripeReady,
  paymentError,
  onMethodChange,
}) => {
  return (
    <Card className="space-y-sm">
      <h2 className="text-lg font-semibold text-text-primary">Select Payment Method</h2>

      <label className="block rounded-md border border-border bg-surface-secondary p-sm">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            checked={selectedMethod === 'card'}
            onChange={() => onMethodChange('card')}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">Credit / Debit Card</p>
            <p className="text-xs text-text-secondary">Pay securely with Stripe</p>
          </div>
        </div>

        {selectedMethod === 'card' ? (
          <div className="mt-sm rounded-md border border-border bg-surface-elevated p-sm">
            <CardElement options={cardElementOptions} />
            <p className="mt-2 text-xs text-text-secondary">
              Your payment details are encrypted and processed by Stripe.
            </p>
            {!stripeReady ? <p className="mt-1 text-xs text-warning">Loading payment gateway...</p> : null}
          </div>
        ) : null}
      </label>

      <label className="block rounded-md border border-border bg-surface-secondary p-sm opacity-70">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            checked={selectedMethod === 'upi'}
            onChange={() => onMethodChange('upi')}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">UPI (PhonePe / Google Pay)</p>
            <p className="text-xs text-text-secondary">Backend support added. Frontend UPI confirmation flow is pending.</p>
          </div>
        </div>
      </label>

      <label className="block rounded-md border border-border bg-surface-secondary p-sm opacity-70">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            checked={selectedMethod === 'cod'}
            onChange={() => onMethodChange('cod')}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">Cash on Delivery</p>
            <p className="text-xs text-text-secondary">Not available yet in current backend flow.</p>
          </div>
        </div>
      </label>

      {paymentError ? <Alert>{paymentError}</Alert> : null}
    </Card>
  )
}

export default CheckoutPaymentMethodPanel
