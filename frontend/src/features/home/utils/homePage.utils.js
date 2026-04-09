export const getCategoryImage = (category) => {
  if (!category) return ''

  const image = category.image || category.imageUrl || category.thumbnail || category.icon
  if (typeof image === 'string') return image
  if (image && typeof image === 'object') {
    return image.url || image.secure_url || ''
  }

  return ''
}

export const toProductList = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.products || payload?.items || []
}

export const getProductDiscount = (product) => {
  return Math.max(...(product?.variants || []).map((variant) => Number(variant?.discount || 0)), 0)
}

export const buildCategoryTree = (categories = []) => {
  if (!categories.length) return []

  const hasNestedPayload = categories.some((category) => Array.isArray(category?.children) && category.children.length > 0)
  if (hasNestedPayload) {
    const roots = categories.filter((category) => !category?.parent && !category?.parentId)
    return roots.length ? roots : categories
  }

  const nodes = new Map()
  const roots = []

  categories.forEach((category) => {
    nodes.set(category._id, { ...category, children: [] })
  })

  nodes.forEach((node) => {
    const parentId = node.parentId || node.parent
    const parentNode = parentId ? nodes.get(parentId) : null
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}
