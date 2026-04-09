const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfDay = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const buildOrderNumber = (order) => {
  if (order?.orderNumber) return String(order.orderNumber)

  const id = String(order?._id || '')
  if (!id) return 'ORD-0000'
  return `ORD-${id.slice(-6).toUpperCase()}`
}

const normalizeOrderItem = (item, index) => {
  const snapshot = item?.snapshot || {}
  const quantity = Math.max(1, toNumber(item?.quantity, 1))
  const unitPrice = toNumber(snapshot?.effectivePrice ?? snapshot?.price, 0)

  return {
    id: String(item?._id || `${item?.variantId || 'item'}-${index}`),
    productId: String(item?.productId || ''),
    productName: snapshot?.productName || 'Product',
    imageUrl: snapshot?.images?.[0]?.url || '',
    size: snapshot?.size || '-',
    colorName: snapshot?.colorName || '-',
    quantity,
    unitPrice,
    subtotal: toNumber(item?.subtotal, unitPrice * quantity),
  }
}

const resolveCustomerName = (order) => {
  const snapshotName = order?.addressSnapshot?.fullName
  if (snapshotName) return snapshotName

  const customerName = [order?.customer?.firstName, order?.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (customerName) return customerName
  return 'Customer'
}

const buildCustomerAddress = (order) => {
  const snapshot = order?.addressSnapshot || {}
  const lineOne = [snapshot?.building, snapshot?.street].filter(Boolean).join(', ')
  const lineTwo = [snapshot?.landmark, snapshot?.district, snapshot?.city, snapshot?.state, snapshot?.pincode]
    .filter(Boolean)
    .join(', ')

  return [lineOne, lineTwo].filter(Boolean).join('\n')
}

const resolvePaymentLabel = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'paid') return 'Paid'
  if (value === 'refunded') return 'Refunded'
  if (value === 'failed') return 'Failed'
  return 'Pending'
}

const resolvePaymentVariant = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'paid') return 'success'
  if (value === 'failed') return 'danger'
  return 'warning'
}

export const normalizeSellerOrder = (order) => {
  const items = Array.isArray(order?.items) ? order.items.map(normalizeOrderItem) : []
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalAmount = toNumber(order?.totalAmount, subtotal)

  return {
    id: String(order?._id || ''),
    orderNumber: buildOrderNumber(order),
    status: String(order?.status || 'placed').toLowerCase(),
    createdAt: order?.createdAt || null,
    updatedAt: order?.updatedAt || null,
    acceptedAt: order?.acceptedAt || null,
    packedAt: order?.packedAt || null,
    shippedAt: order?.shippedAt || null,
    outForDeliveryAt: order?.outForDeliveryAt || null,
    deliveredAt: order?.deliveredAt || null,
    cancelledAt: order?.cancelledAt || null,
    rejectedReason: order?.rejectionReason || '',
    cancellationReason: order?.cancellationReason || '',
    returnRequest: order?.returnRequest || null,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    totalAmount,
    payment: {
      status: String(order?.paymentStatus || 'pending').toLowerCase(),
      method: order?.paymentMethod || 'Card',
      label: resolvePaymentLabel(order?.paymentStatus),
      badgeVariant: resolvePaymentVariant(order?.paymentStatus),
    },
    customer: {
      name: resolveCustomerName(order),
      email: order?.customer?.email || order?.customerEmail || '-',
      phone: order?.addressSnapshot?.phone || order?.customer?.phone || '-',
      address: buildCustomerAddress(order),
    },
    source: order,
  }
}

export const normalizeSellerOrders = (orders = []) => {
  return (orders || []).map(normalizeSellerOrder)
}

export {
  toDate,
  toNumber,
  startOfDay,
}
