import { queryDelete, queryGet, queryPost, queryPut } from '@/shared/services/dataClient'
import { API_ENDPOINTS } from '@/shared/constants/api'

const unwrapData = (res) => res.data?.data || res.data

export const getCategoryTree = () => {
  return queryGet(API_ENDPOINTS.CATEGORIES, {}, { ttlMs: 30000, tags: ['categories:tree'] })
    .then((res) => unwrapData(res).categories || unwrapData(res))
}

export const createCategory = (payload) => {
  return queryPost(
    API_ENDPOINTS.ADMIN_CATEGORIES,
    payload,
    {},
    { invalidateTags: ['categories:tree', 'categories:template'] }
  ).then(unwrapData)
}

export const updateCategory = (id, payload) => {
  return queryPut(
    `${API_ENDPOINTS.ADMIN_CATEGORIES}/${id}`,
    payload,
    {},
    { invalidateTags: ['categories:tree', 'categories:template'] }
  ).then(unwrapData)
}

export const blockCategories = (categoryIds) => {
  return queryPost(
    `${API_ENDPOINTS.ADMIN_CATEGORIES}/block`,
    { categoryIds },
    {},
    { invalidateTags: ['categories:tree', 'products:public', 'products:seller', 'products:admin'] }
  ).then(unwrapData)
}

export const previewDeleteCategories = (categoryIds) => {
  return queryPost(`${API_ENDPOINTS.ADMIN_CATEGORIES}/delete-preview`, { categoryIds }).then(unwrapData)
}

export const deleteCategories = (categoryIds) => {
  return queryDelete(
    API_ENDPOINTS.ADMIN_CATEGORIES,
    { data: { categoryIds } },
    { invalidateTags: ['categories:tree', 'categories:template', 'products:public', 'products:seller', 'products:admin'] }
  ).then(unwrapData)
}

export const setCategoryTemplate = (categoryId, payload) => {
  return queryPut(
    `${API_ENDPOINTS.ADMIN_CATEGORY_TEMPLATE}/${categoryId}/template`,
    payload,
    {},
    { invalidateTags: ['categories:template', 'products:public', 'products:seller', 'products:admin'] }
  ).then((res) => unwrapData(res).template || unwrapData(res))
}

export const getCategoryTemplate = (categoryId) => {
  return queryGet(
    `${API_ENDPOINTS.ADMIN_CATEGORY_TEMPLATE}/${categoryId}/template`,
    {},
    { ttlMs: 30000, tags: ['categories:template'] }
  ).then((res) => unwrapData(res).template || unwrapData(res))
}

export const getPublicCategoryTemplate = (categoryId) => {
  return queryGet(
    `${API_ENDPOINTS.CATEGORY_TEMPLATE_PUBLIC}/${categoryId}/template`,
    {},
    { ttlMs: 30000, tags: ['categories:template'] }
  ).then((res) => unwrapData(res).template || unwrapData(res))
}
