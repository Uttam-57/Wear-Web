export const CATEGORY_IMAGE_ADJUST_DEFAULTS = Object.freeze({
  fit: 'cover',
  positionX: 50,
  positionY: 50,
  zoom: 100,
})

export const CATEGORY_CARD_IMAGE_WIDTH = 220
export const CATEGORY_CARD_IMAGE_HEIGHT = 320
export const CATEGORY_CARD_IMAGE_ASPECT_RATIO = '5 / 4'

const clamp = (value, min, max) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(Math.max(number, min), max)
}

export const normalizeCategoryImageAdjust = (adjust = {}) => {
  const fit = adjust?.fit === 'contain' ? 'contain' : 'cover'

  return {
    fit,
    positionX: clamp(adjust?.positionX ?? CATEGORY_IMAGE_ADJUST_DEFAULTS.positionX, 0, 100),
    positionY: clamp(adjust?.positionY ?? CATEGORY_IMAGE_ADJUST_DEFAULTS.positionY, 0, 100),
    zoom: clamp(adjust?.zoom ?? CATEGORY_IMAGE_ADJUST_DEFAULTS.zoom, 100, 200),
  }
}

export const buildCategoryImageStyle = (adjust = {}) => {
  const settings = normalizeCategoryImageAdjust(adjust)

  return {
    objectFit: settings.fit,
    objectPosition: `${settings.positionX}% ${settings.positionY}%`,
    transform: `scale(${settings.zoom / 100})`,
    transformOrigin: 'center center',
  }
}
