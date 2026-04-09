export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
export const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MAX_PROOF_FILES = 5
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export const STEP_FIELDS = {
  1: ['companyName', 'ownerName', 'companyEmail', 'companyPhone', 'website'],
  2: ['locationCountry', 'locationState', 'locationDistrict', 'locationAddressLine', 'gstNumber', 'companyProof'],
  3: ['accountHolderName', 'accountNumber', 'ifscCode'],
}

export const STEP_ITEMS = [
  { id: 1, title: 'Store Info', subtitle: 'Identity & contact' },
  { id: 2, title: 'Verification', subtitle: 'Proof & categories' },
  { id: 3, title: 'Bank', subtitle: 'Payout details' },
]

export const initialFormState = {
  companyName: '',
  ownerName: '',
  companyEmail: '',
  companyPhone: '',
  website: '',
  locationCountry: 'India',
  locationState: '',
  locationDistrict: '',
  locationAddressLine: '',
  majorCategories: [],
  gstNumber: '',
  bankToggle: false,
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  existingProofUrls: [],
}
