export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  if (!phone) return false
  const normalized = phone.replace(/[\s()-]/g, '')
  return /^(\+?\d{10,15})$/.test(normalized)
}

export function isValidPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(password)
}

export function isValidFileType(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return allowed.includes(file.type)
}

export function isValidFileSize(file) {
  return file.size <= 5 * 1024 * 1024
}

export function isObjectId(id = '') {
  return /^[a-f\d]{24}$/i.test(String(id))
}