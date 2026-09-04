// Client-side helpers for MTN MoMo phone numbers (Uganda MSISDN format).

/** Accepts 07XXXXXXXX, 7XXXXXXXX, or 2567XXXXXXXX and returns true if it looks like a valid MTN/Uganda number. */
export function isValidMomoPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits.length === 12
  if (digits.startsWith('0')) return digits.length === 10
  return digits.length === 9
}

/** Normalizes to the 2567XXXXXXXX MSISDN format the MTN MoMo API expects. */
export function toMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0')) return `256${digits.slice(1)}`
  return `256${digits}`
}
