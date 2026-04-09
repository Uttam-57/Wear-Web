import slugify from 'slugify'
import mongoose from 'mongoose'
import Product from './product.model.js'
import Category from '../category/category.model.js'
import CategoryTemplate from '../category/categoryTemplate.model.js'
import AppError from '../../utils/appError.js'

export const deriveColorFields = (variants) => {
  const colorNamesSet = new Set()
  const baseColorsSet = new Set()
  for (const v of variants) {
    colorNamesSet.add(v.colorName)
    baseColorsSet.add(v.baseColor)
  }
  return {
    colorNames: [...colorNamesSet],
    baseColors: [...baseColorsSet],
  }
}

export const generateSlug = async (name, sellerId) => {
  const base = slugify(name, { lower: true, strict: true })
  const suffix = sellerId.toString().slice(-5)
  let slug = `${base}-${suffix}`
  const exists = await Product.findOne({ slug })
  if (exists) {
    slug = `${slug}-${Date.now()}`
  }
  return slug
}

export const resolveCategoryAndTemplate = async (categoryId) => {
  const category = await Category.findById(categoryId)
  if (!category) {
    throw new AppError('Category not found', 404, 'NOT_FOUND')
  }
  if (category.status !== 'active') {
    throw new AppError('Selected category is not active', 400, 'VALIDATION_ERROR')
  }

  const template = await CategoryTemplate.findOne({ categoryId })
  return { category, template }
}

export const validateVariantSizes = (variants, template) => {
  if (!template || !template.sizeOptions || template.sizeOptions.length === 0) return
  const validSizes = new Set(template.sizeOptions)
  for (const variant of variants) {
    if (!validSizes.has(variant.size)) {
      throw new AppError(
        `Invalid size "${variant.size}". Valid sizes for this category: ${template.sizeOptions.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    }
  }
}

export const validateSpecifications = (specifications, template) => {
  if (!template || !template.specFields || template.specFields.length === 0) return

  const specMap = new Map(template.specFields.map((f) => [f.key, f.filterOptions]))

  for (const spec of specifications) {
    if (!specMap.has(spec.key)) {
      throw new AppError(
        `Invalid specification key "${spec.key}". Valid keys for this category: ${[...specMap.keys()].join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    }
    const filterOptions = specMap.get(spec.key)
    if (filterOptions && filterOptions.length > 0 && !filterOptions.includes(spec.value)) {
      throw new AppError(
        `Invalid value "${spec.value}" for specification "${spec.key}". Valid values: ${filterOptions.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    }
  }
}

export const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const resolveCategoryScopeIds = async (categoryId) => {
  if (!categoryId) return []
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid categoryId', 400, 'VALIDATION_ERROR')
  }

  const root = await Category.findOne({ _id: categoryId, status: 'active' }).select('_id').lean()
  if (!root) return []

  const resolved = [root._id]
  let frontier = [root._id]

  while (frontier.length > 0) {
    const children = await Category.find({ parentId: { $in: frontier }, status: 'active' })
      .select('_id')
      .lean()
    if (!children.length) break

    const next = children.map((child) => child._id)
    resolved.push(...next)
    frontier = next
  }

  return resolved
}
