// Local-date helpers. Dates are stored as YYYY-MM-DD strings in the user's local time.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function addDays(iso: string, days: number) {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function formatDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** e.g. "Monday, 23 November" */
export function formatLongDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShortDay(iso: string) {
  return parseIsoDate(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

export function formatRelativeTime(isoTimestamp: string) {
  const diffMin = Math.round((Date.now() - new Date(isoTimestamp).getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const hours = Math.round(diffMin / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} d ago`
}
