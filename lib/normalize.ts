export function cleanRegistration(value: unknown) {
  return String(value ?? '').trim().replace(/^'+/, '').replace(/\s+/g, '')
}
export function cleanPhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}
export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}
export function cleanDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0,10)
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0,10)
}
