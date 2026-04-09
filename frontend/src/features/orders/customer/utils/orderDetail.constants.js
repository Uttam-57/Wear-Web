export const CANCEL_REASON_OPTIONS = [
  { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
  { value: 'better_price', label: 'Found better price elsewhere' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'delivery_delay', label: 'Delayed delivery' },
  { value: 'other', label: 'Other' },
]

export const RETURN_REASON_OPTIONS = [
  { value: 'size_issue', label: "Size doesn't fit" },
  { value: 'damaged', label: 'Product damaged or defective' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'quality_issue', label: 'Product quality not as expected' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
]

export const paymentStatusMeta = (status) => {
  const value = String(status || '').toLowerCase()
  if (['completed', 'paid', 'succeeded'].includes(value)) return { label: 'Paid', variant: 'success' }
  if (value === 'failed') return { label: 'Failed', variant: 'danger' }
  if (value === 'refunded') return { label: 'Refunded', variant: 'warning' }
  return { label: 'Pending', variant: 'warning' }
}
