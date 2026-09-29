import { createHash } from 'node:crypto'

export function cleanRegistration(value: unknown) {
  return String(value ?? '').trim().replace(/^'+/, '').replace(/\s+/g, '')
}

export function cleanPhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

export function hashPhone(value: unknown) {
  const phone = cleanPhone(value)
  if (phone.length !== 10) return null
  return createHash('sha256').update(phone).digest('hex')
}

export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}
