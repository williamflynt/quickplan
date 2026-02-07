const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Mar 5" — compact label for axis ticks. */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${MONTH_SHORT[Number(m) - 1]} ${Number(d)}`
}

/** "2026-03-05" — full ISO for tooltips/nodes. */
export function formatDateFull(iso: string): string {
  return iso
}

/** "Mar 5 – Mar 12" — compact range for tooltips. */
export function formatDateRange(start: string, end: string): string {
  return `${formatDateShort(start)} – ${formatDateShort(end)}`
}
