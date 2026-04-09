import { ALLOWED_EXTENSIONS, ALLOWED_FILE_TYPES, STEP_FIELDS } from '@/features/seller/profileSetup/constants'

export const isValidOptionalUrl = (value) => {
  if (!value?.trim()) return true

  try {
    const parsed = new URL(value.trim())
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const isAllowedImageFile = (file) => {
  if (ALLOWED_FILE_TYPES.has(file.type)) return true
  const lowerName = String(file.name || '').toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export const flattenCategoryTree = (nodes, lineage = []) => {
  if (!Array.isArray(nodes)) return []

  return nodes
    .flatMap((node) => {
      const currentName = String(node?.name || '').trim()
      const nextLineage = currentName ? [...lineage, currentName] : lineage
      const currentItem = {
        id: String(node?._id || ''),
        label: nextLineage.join(' / ') || 'Unnamed category',
      }

      const children = flattenCategoryTree(node?.children || [], nextLineage)
      return [currentItem, ...children]
    })
    .filter((item) => item.id)
}

export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read selected file'))
    reader.readAsDataURL(file)
  })
}

export const mapBackendField = (fieldPath) => {
  const map = {
    'location.country': 'locationCountry',
    'location.state': 'locationState',
    'location.district': 'locationDistrict',
    'location.addressLine': 'locationAddressLine',
    'bankDetails.accountHolderName': 'accountHolderName',
    'bankDetails.accountNumber': 'accountNumber',
    'bankDetails.ifscCode': 'ifscCode',
  }

  return map[fieldPath] || fieldPath
}

export const normalizeIfPresent = (value) => {
  const next = String(value || '').trim()
  return next || undefined
}

export const getStepForErrors = (errors) => {
  if (STEP_FIELDS[1].some((field) => errors[field])) return 1
  if (STEP_FIELDS[2].some((field) => errors[field])) return 2
  return 3
}

export const getFieldStep = (field) => {
  if (field === 'companyProof') return 2
  if (field.startsWith('location') || field === 'gstNumber') return 2
  if (field.startsWith('account') || field === 'ifscCode') return 3
  return 1
}
