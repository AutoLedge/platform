const currencyFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' })
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

/** "$4,500.00" — always unsigned. */
export function formatCurrency(amount: number) {
  return currencyFormat.format(Math.abs(amount))
}

/** "+$4,500.00" / "−$79.99" (U+2212 minus sign, matching the designs). */
export function formatSignedCurrency(amount: number) {
  return `${amount < 0 ? '−' : '+'}${formatCurrency(amount)}`
}

/** "Oct 20, 2026" */
export function formatDate(date: Date) {
  return dateFormat.format(date)
}

/** "10:42 AM" */
export function formatTime(date: Date) {
  return timeFormat.format(date)
}

/**
 * Parses "2026-10-20" or "2026-10-20T10:42" as a LOCAL date. `new Date("2026-10-20")`
 * would be read as UTC midnight and show the previous day in North American time zones.
 */
export function parseLocalDate(value: string) {
  const [datePart, timePart = '00:00'] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}
