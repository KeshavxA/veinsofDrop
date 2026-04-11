/**
 * Whole-blood / RBC donation rules (ABO + Rh) — who can donate to a given patient.
 * Values must match select options: "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
 */

const VALID_TYPES = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

/** Map: patient (recipient) need → donor blood types that can supply RBCs */
const DONOR_TYPES_FOR_RECIPIENT = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

const KNOWN_TYPES = ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']

export function normalizeBloodType(value) {
  if (value == null || typeof value !== 'string') return ''
  const t = value.trim().toUpperCase().replace(/\s+/g, '')
  if (KNOWN_TYPES.includes(t)) return t
  return ''
}

export function getDonorTypesForRecipient(recipientBloodType) {
  const key = normalizeBloodType(recipientBloodType)
  if (!key || !VALID_TYPES.has(key)) return null
  return new Set(DONOR_TYPES_FOR_RECIPIENT[key] || [])
}

export function donorCanHelpRecipient(donorBloodType, recipientBloodType) {
  const allowed = getDonorTypesForRecipient(recipientBloodType)
  if (!allowed) return false
  const d = normalizeBloodType(donorBloodType)
  if (!d || !VALID_TYPES.has(d)) return false
  return allowed.has(d)
}
