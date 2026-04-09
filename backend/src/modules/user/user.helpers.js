import crypto from 'crypto'
import AppError from '../../utils/appError.js'

export const toDataUri = (file) => {
  const base64 = file.buffer.toString('base64')
  return `data:${file.mimetype};base64,${base64}`
}

export const INDIA_COUNTRY = 'India'

export const resolveLocality = (address = {}) => {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state_district ||
    address.suburb ||
    address.district ||
    ''
  ).trim()
}

export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new AppError('Address lookup service is unavailable right now', 502, 'BAD_GATEWAY')
  }
  return response.json()
}

export const normalizeAddressPayload = (data = {}) => {
  const payload = { ...data }
  const locality = String(payload.locality || '').trim()

  if (locality) {
    payload.city = locality
    payload.district = locality
  }

  delete payload.locality

  if (!payload.country) {
    payload.country = INDIA_COUNTRY
  }

  return payload
}

export const buildDeletedEmail = (userId) => `deleted+${String(userId)}.${Date.now()}@wearweb.local`
export const buildRandomPassword = () => `${crypto.randomBytes(24).toString('hex')}Aa1!`

export const extractCloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null

  const marker = '/upload/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return null

  const assetPath = url.slice(markerIndex + marker.length).split('?')[0]
  const withoutVersion = assetPath.replace(/^v\d+\//, '')
  const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, '')
  return withoutExtension || null
}
