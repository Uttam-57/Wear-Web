export const CANCELLABLE_STATUSES = ['placed', 'accepted']
export const SELLER_REJECTABLE_STATUS = 'placed'
export const OTP_REQUEST_COOLDOWN_MS = 60 * 1000
export const OTP_EXPIRY_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LOCK_MS = 10 * 60 * 1000
export const RETURN_TERMINAL_STATUSES = new Set(['refund_completed', 'rejected'])

export const RETURN_ALLOWED_TRANSITIONS = {
  requested: ['accepted', 'rejected'],
  accepted: ['picked'],
  picked: ['received'],
  received: ['refund_completed'],
}

export const STATUS_TIMESTAMP_MAP = {
  accepted: 'acceptedAt',
  packed: 'packedAt',
  shipped: 'shippedAt',
  out_for_delivery: 'outForDeliveryAt',
  delivered: 'deliveredAt',
  cancelled: 'cancelledAt',
}
