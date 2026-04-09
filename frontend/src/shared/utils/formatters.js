const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('en-IN', options).format(toFiniteNumber(value))
}

export function formatPrice(amount) {
  return formatNumber(amount, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })
}

export function formatDate(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatOrderStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPercent(value = 0) {
  return `${Math.round(Number(value || 0))}%`
}

export function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const level = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const amount = value / (1024 ** level)
  return `${amount.toFixed(level === 0 ? 0 : 1)} ${units[level]}`
}