export const ANALYTICS_TIMEZONE = process.env.ANALYTICS_TIMEZONE || 'Asia/Kolkata'

export const formatDateKey = (date, timezone = ANALYTICS_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '1970'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

export function resolveDateRange(query) {
  const { period, from, to } = query

  if (from || to) {
    return {
      start: from ? new Date(from) : new Date(0),
      end: to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date(),
    }
  }

  const now = new Date()
  if (period === 'all') {
    return { start: new Date(0), end: now }
  }

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return { start, end: now }
}

export const getDailyBuckets = (start, end) => {
  const buckets = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(23, 59, 59, 999)

  while (cursor <= endDay) {
    buckets.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return buckets
}
