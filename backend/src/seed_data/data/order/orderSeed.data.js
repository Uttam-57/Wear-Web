export const ORDER_SCENARIOS = [
  { status: 'placed', paymentStatus: 'pending', quantity: 1 },
  { status: 'accepted', paymentStatus: 'pending', quantity: 1 },
  { status: 'packed', paymentStatus: 'pending', quantity: 2 },
  { status: 'shipped', paymentStatus: 'paid', quantity: 1 },
  { status: 'out_for_delivery', paymentStatus: 'paid', quantity: 1 },
  { status: 'delivered', paymentStatus: 'paid', quantity: 1 },
  {
    status: 'cancelled',
    paymentStatus: 'refunded',
    quantity: 1,
    cancelledBy: 'customer',
    cancellationReason: 'Changed mind after placing the order due to size preference.',
  },
  {
    status: 'rejected',
    paymentStatus: 'failed',
    quantity: 1,
    rejectionReason: 'Seller quality check failed before packaging.',
  },
  {
    status: 'delivered',
    paymentStatus: 'paid',
    quantity: 1,
    returnRequest: {
      reason: 'Received size was tighter than expected for daily wear comfort.',
      status: 'requested',
    },
  },
  {
    status: 'delivered',
    paymentStatus: 'refunded',
    quantity: 1,
    returnRequest: {
      reason: 'Product color looked different compared with listing photos.',
      status: 'refund_completed',
      adminNote: 'Return approved after pickup quality verification.',
    },
  },
];
