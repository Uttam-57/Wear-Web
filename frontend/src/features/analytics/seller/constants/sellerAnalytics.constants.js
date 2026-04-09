export const SELLER_ANALYTICS_PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

export const SELLER_ANALYTICS_EMPTY_CHART_MESSAGE = 'Not enough data in this time period to generate a chart.'
export const SELLER_ANALYTICS_EMPTY_LIST_MESSAGE = 'No records found for this time period.'

export const ORDER_STATUS_SEGMENT_STYLES = {
  delivered: { label: 'Delivered', color: '#14915E' },
  processing: { label: 'Processing', color: '#0B4575' },
  cancelled: { label: 'Cancelled', color: '#C53B44' },
  returned: { label: 'Returned', color: '#6F42C1' },
  pending: { label: 'Pending', color: '#D48A1B' },
}
