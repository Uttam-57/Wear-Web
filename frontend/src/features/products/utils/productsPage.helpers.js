import { toTitleCase } from '@/features/products/utils/productBrowse.utils'

export const flattenCategories = (categories = []) => {
  const map = {}

  const walk = (node) => {
    if (!node?._id) return
    map[node._id] = node
    ;(node.children || []).forEach(walk)
  }

  categories.forEach(walk)
  return map
}

export const buildCategoryIndexes = (categories = []) => {
  const byId = {}
  const parentById = new Map()
  const childrenById = new Map()

  const walk = (node, parentId = null) => {
    if (!node?._id) return

    const id = String(node._id)
    byId[id] = node
    parentById.set(id, parentId ? String(parentId) : null)

    const childIds = (node.children || []).map((child) => String(child._id)).filter(Boolean)
    childrenById.set(id, childIds)

    ;(node.children || []).forEach((child) => walk(child, id))
  }

  categories.forEach((node) => walk(node, null))

  return {
    byId,
    parentById,
    childrenById,
  }
}

export const findRootCategoryId = (categoryId, parentById) => {
  if (!categoryId) return ''

  const visited = new Set()
  let cursor = String(categoryId)

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor)
    const parent = parentById.get(cursor)
    if (!parent) return cursor
    cursor = parent
  }

  return ''
}

export const collectDescendantIds = (rootId, childrenById) => {
  const result = new Set()
  const stack = rootId ? [String(rootId)] : []

  while (stack.length) {
    const current = stack.pop()
    if (!current || result.has(current)) continue

    result.add(current)
    const children = childrenById.get(current) || []
    children.forEach((childId) => {
      if (!result.has(childId)) stack.push(childId)
    })
  }

  return result
}

export const filterCategoryTreeByIds = (categories = [], allowedIds = new Set()) => {
  const visit = (node) => {
    if (!node?._id) return null

    const children = (node.children || [])
      .map(visit)
      .filter(Boolean)

    const includeSelf = allowedIds.has(String(node._id))
    if (!includeSelf && children.length === 0) return null

    return {
      ...node,
      children,
    }
  }

  return categories.map(visit).filter(Boolean)
}

export const collectLeafCategoryIds = (startId, childrenById) => {
  const leaves = new Set()
  if (!startId) return leaves

  const stack = [String(startId)]
  while (stack.length) {
    const current = stack.pop()
    if (!current) continue

    const children = childrenById.get(current) || []
    if (!children.length) {
      leaves.add(current)
      continue
    }

    children.forEach((childId) => stack.push(String(childId)))
  }

  return leaves
}

export const buildSelectedCategoryScope = (selectedCategoryIds = [], childrenById = new Map(), parentById = new Map()) => {
  const allIds = new Set()

  selectedCategoryIds.forEach((categoryId) => {
    const normalizedId = String(categoryId || '')
    if (!normalizedId) return

    collectDescendantIds(normalizedId, childrenById).forEach((id) => allIds.add(id))

    let cursor = normalizedId
    while (cursor) {
      allIds.add(cursor)
      cursor = parentById.get(cursor)
    }
  })

  return allIds
}

const ACCESSORY_CATEGORY_HINTS = ['accessory', 'accessories', 'wallet', 'belt', 'ring', 'earring', 'jewel', 'jewelry', 'jewellery', 'bracelet', 'chain']
const ACCESSORY_EXCLUDE_HINTS = ['watch', 'shoe', 'sneaker', 'shirt', 't-shirt', 't shirt', 'kurta', 'saree', 'dress']

const normalizeLookupText = (value = '') => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

export const resolveAccessoryRootCategoryId = (byId = {}, parentById = new Map()) => {
  const rootScores = new Map()

  Object.values(byId).forEach((category) => {
    const categoryId = String(category?._id || '')
    if (!categoryId) return

    const normalizedName = normalizeLookupText(category?.name)
    if (!normalizedName) return

    let score = 0
    if (normalizedName.includes('accessory') || normalizedName.includes('accessories')) score += 5

    ACCESSORY_CATEGORY_HINTS.forEach((hint) => {
      if (normalizedName.includes(hint)) score += 1
    })

    ACCESSORY_EXCLUDE_HINTS.forEach((hint) => {
      if (normalizedName.includes(hint)) score -= 2
    })

    if (score <= 0) return

    const rootId = findRootCategoryId(categoryId, parentById)
    if (!rootId) return

    rootScores.set(rootId, (rootScores.get(rootId) || 0) + score)
  })

  let bestRootId = ''
  let bestScore = -1

  rootScores.forEach((score, rootId) => {
    if (score > bestScore) {
      bestScore = score
      bestRootId = rootId
    }
  })

  return bestRootId
}

export const buildActiveFilterTokens = (state) => {
  const tokens = []

  ;(state.categoryIds || []).forEach((item) => tokens.push({ key: 'category', value: item, label: item, type: 'array' }))

  state.gender.forEach((item) => tokens.push({ key: 'gender', value: item, label: toTitleCase(item), type: 'array' }))
  state.baseColors.forEach((item) => tokens.push({ key: 'baseColors', value: item, label: item, type: 'array' }))
  state.sizes.forEach((item) => tokens.push({ key: 'sizes', value: item, label: item, type: 'array' }))
  state.brands.forEach((item) => tokens.push({ key: 'brands', value: item, label: item, type: 'array' }))

  if (state.minPrice) tokens.push({ key: 'minPrice', value: state.minPrice, label: `Min INR ${state.minPrice}`, type: 'single' })
  if (state.maxPrice) tokens.push({ key: 'maxPrice', value: state.maxPrice, label: `Max INR ${state.maxPrice}`, type: 'single' })

  if (state.discount) {
    tokens.push({ key: 'discount', value: state.discount, label: `Discount ${state.discount.replace('gte:', '>= ')}%`, type: 'single' })
  }

  Object.entries(state.specs).forEach(([key, values]) => {
    values.forEach((value) => tokens.push({ key: `specs[${key}]`, value, label: `${toTitleCase(key)}: ${value}`, type: 'array' }))
  })

  return tokens
}
