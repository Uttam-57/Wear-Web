import { createSellerProduct, getProductById, updateSellerProduct, uploadSellerProductMedia } from '@/features/products/api/products.api'
import { getPublicCategoryTemplate } from '@/features/category/api/category.api'

export const getSellerEditableProduct = (productId) => getProductById(productId)

export const getCategoryTemplateForProduct = async (categoryId) => {
  if (!categoryId) return null
  try {
    const template = await getPublicCategoryTemplate(categoryId)
    return template || null
  } catch {
    return null
  }
}

export const createSellerProductFromForm = (payload) => createSellerProduct(payload)

export const updateSellerProductFromForm = (productId, payload) => updateSellerProduct(productId, payload)

export const uploadSellerProductFiles = async (files) => {
  const uploaded = await uploadSellerProductMedia(files)
  return Array.isArray(uploaded) ? uploaded : []
}
