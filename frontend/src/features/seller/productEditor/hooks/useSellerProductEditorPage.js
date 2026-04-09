import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '@/features/auth/authSlice'
import useUIStore from '@/shared/uiSlice'
import useCategoryTree from '@/features/category/hooks/useCategoryTree'
import { ROUTES } from '@/shared/constants/routes'
import {
  createSellerProductFromForm,
  getCategoryTemplateForProduct,
  getSellerEditableProduct,
  updateSellerProductFromForm,
  uploadSellerProductFiles,
} from '@/features/seller/productEditor/api/productEditor.api'
import {
  buildFormFromProduct,
  buildProductPayload,
  calculateDiscountPercent,
  calculateSellingPrice,
  createEmptyDescriptionBlock,
  createEmptyVariant,
  createInitialProductForm,
  getRootCategoryOptions,
  getSubCategoryOptions,
  syncColorImageMapWithVariants,
  syncSpecificationValues,
  validateProductForm,
} from '@/features/seller/productEditor/utils/productEditor.utils'

export default function useSellerProductEditorPage(mode = 'create') {
  const navigate = useNavigate()
  const { sellerId, id } = useParams()

  const user = useAuthStore((state) => state.user)
  const pushToast = useUIStore((state) => state.pushToast)

  const { categories, loading: categoriesLoading } = useCategoryTree()

  const [form, setForm] = useState(createInitialProductForm)
  const [template, setTemplate] = useState(null)
  const [record, setRecord] = useState(null)

  const [loading, setLoading] = useState(mode === 'edit')
  const [templateLoading, setTemplateLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const toNumberOrZero = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  const formatInputNumber = (value) => {
    if (!Number.isFinite(value)) return ''
    return String(Number(value.toFixed(2)))
  }

  const applyVariantPricing = (variant, changedField) => {
    const next = { ...variant }

    const basePrice = Math.max(0, toNumberOrZero(next.price))
    const discount = Math.max(0, Math.min(100, toNumberOrZero(next.discount)))
    const hasSellingInput = String(next.sellingPrice || '').trim() !== ''

    if (changedField === 'sellingPrice') {
      const rawSelling = toNumberOrZero(next.sellingPrice)
      const sellingPrice = Math.max(0, Math.min(basePrice, rawSelling))
      next.sellingPrice = formatInputNumber(sellingPrice)
      next.discount = formatInputNumber(calculateDiscountPercent(basePrice, sellingPrice))
      return next
    }

    if (changedField === 'discount') {
      next.discount = formatInputNumber(discount)
      next.sellingPrice = formatInputNumber(calculateSellingPrice(basePrice, discount))
      return next
    }

    if (changedField === 'price') {
      if (hasSellingInput) {
        const rawSelling = toNumberOrZero(next.sellingPrice)
        const sellingPrice = Math.max(0, Math.min(basePrice, rawSelling))
        next.sellingPrice = formatInputNumber(sellingPrice)
        next.discount = formatInputNumber(calculateDiscountPercent(basePrice, sellingPrice))
      } else {
        next.discount = formatInputNumber(discount)
        next.sellingPrice = formatInputNumber(calculateSellingPrice(basePrice, discount))
      }
      return next
    }

    return next
  }

  const routeSellerId = String(sellerId || '')
  const authSellerId = String(user?._id || '')
  const hasOwnerAccess = Boolean(routeSellerId) && (!authSellerId || routeSellerId === authSellerId)

  const storeRoute = ROUTES.SELLER_PUBLIC_STORE.replace(':sellerId', routeSellerId)

  const rootCategoryOptions = useMemo(() => getRootCategoryOptions(categories), [categories])
  const subCategoryOptions = useMemo(
    () => getSubCategoryOptions(categories, form.rootCategoryId),
    [categories, form.rootCategoryId],
  )

  const selectedCategoryId = form.subCategoryId || form.rootCategoryId
  const templateSizeOptions = Array.isArray(template?.sizeOptions) ? template.sizeOptions : []
  const templateSpecFields = Array.isArray(template?.specFields) ? template.specFields : []

  useEffect(() => {
    if (mode !== 'edit' || !id || !hasOwnerAccess) {
      if (mode !== 'edit') {
        setLoading(false)
        setRecord(null)
      }
      return
    }

    let active = true
    setLoading(true)
    setError('')

    getSellerEditableProduct(id)
      .then((product) => {
        if (!active) return
        setRecord(product || null)
      })
      .catch(() => {
        if (!active) return
        setError('Could not load product details for editing.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [hasOwnerAccess, id, mode])

  useEffect(() => {
    if (mode !== 'edit') return
    if (!record) return

    setForm(buildFormFromProduct(record, categories))
    setErrors({})
  }, [categories, mode, record])

  useEffect(() => {
    if (!selectedCategoryId) {
      setTemplate(null)
      setForm((previous) => ({
        ...previous,
        specificationValues: {},
      }))
      return
    }

    let active = true
    setTemplateLoading(true)

    getCategoryTemplateForProduct(selectedCategoryId)
      .then((nextTemplate) => {
        if (!active) return
        setTemplate(nextTemplate)
        setForm((previous) => ({
          ...previous,
          specificationValues: syncSpecificationValues(previous.specificationValues, nextTemplate?.specFields || []),
        }))
      })
      .finally(() => {
        if (active) setTemplateLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedCategoryId])

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const updateVariants = (updater) => {
    setForm((previous) => {
      const nextVariants = typeof updater === 'function' ? updater(previous.variants) : updater
      return {
        ...previous,
        variants: nextVariants,
        colorImageMap: syncColorImageMapWithVariants(previous.colorImageMap, nextVariants),
      }
    })
  }

  const handleRootCategoryChange = (value) => {
    setForm((previous) => ({
      ...previous,
      rootCategoryId: value,
      subCategoryId: '',
    }))
  }

  const handleSubCategoryChange = (value) => {
    updateField('subCategoryId', value)
  }

  const addVariant = () => {
    updateVariants((previous) => [...previous, createEmptyVariant()])
  }

  const removeVariant = (index) => {
    updateVariants((previous) => {
      if (previous.length <= 1) return previous
      return previous.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateVariantField = (index, field, value) => {
    updateVariants((previous) => previous.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = {
        ...item,
        [field]: value,
      }

      return applyVariantPricing(next, field)
    }))
  }

  const toggleVariantSize = (index, size, checked) => {
    updateVariants((previous) => previous.map((item, itemIndex) => {
      if (itemIndex !== index) return item

      const current = Array.isArray(item?.selectedSizes)
        ? item.selectedSizes.map((value) => String(value).trim()).filter(Boolean)
        : []

      const normalizedSize = String(size || '').trim()
      const nextSet = new Set(current)

      if (checked) {
        nextSet.add(normalizedSize)
      } else {
        nextSet.delete(normalizedSize)
      }

      const selectedSizes = Array.from(nextSet)

      return {
        ...item,
        selectedSizes,
        size: selectedSizes[0] || '',
      }
    }))
  }

  const addDescriptionBlock = () => {
    setForm((previous) => ({
      ...previous,
      descriptionBlocks: [...(previous.descriptionBlocks || []), createEmptyDescriptionBlock()],
    }))
  }

  const removeDescriptionBlock = (index) => {
    setForm((previous) => ({
      ...previous,
      descriptionBlocks: (previous.descriptionBlocks || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const updateDescriptionBlock = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      descriptionBlocks: (previous.descriptionBlocks || []).map((item, itemIndex) => {
        if (itemIndex !== index) return item
        return {
          ...item,
          [field]: value,
        }
      }),
    }))
  }

  const updateSpecificationValue = (key, value) => {
    setForm((previous) => ({
      ...previous,
      specificationValues: {
        ...previous.specificationValues,
        [String(key || '').toLowerCase()]: value,
      },
    }))
  }

  const setColorImageUsePrimary = (colorName, usePrimary) => {
    setForm((previous) => ({
      ...previous,
      colorImageMap: {
        ...previous.colorImageMap,
        [colorName]: {
          ...(previous.colorImageMap?.[colorName] || { images: [] }),
          usePrimary,
          images: usePrimary ? [] : (previous.colorImageMap?.[colorName]?.images || []),
        },
      },
    }))
  }

  const uploadPrimaryImages = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    if ((form.images || []).length >= 5) {
      pushToast({ type: 'warning', title: 'Image limit reached', message: 'Primary images are limited to 5.' })
      return
    }

    setUploading(true)

    try {
      const uploaded = await uploadSellerProductFiles(files)
      setForm((previous) => ({
        ...previous,
        images: [...(previous.images || []), ...uploaded].slice(0, 5),
      }))
    } catch {
      pushToast({ type: 'danger', title: 'Upload failed', message: 'Could not upload product images.' })
    } finally {
      setUploading(false)
    }
  }

  const removePrimaryImage = (index) => {
    setForm((previous) => ({
      ...previous,
      images: (previous.images || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const uploadColorImages = async (colorName, fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const current = form.colorImageMap?.[colorName]
    const currentCount = Array.isArray(current?.images) ? current.images.length : 0

    if (currentCount >= 3) {
      pushToast({ type: 'warning', title: 'Image limit reached', message: 'Color images are limited to 3 per color.' })
      return
    }

    setUploading(true)

    try {
      const uploaded = await uploadSellerProductFiles(files)
      setForm((previous) => {
        const nextEntry = previous.colorImageMap?.[colorName] || { usePrimary: false, images: [] }
        return {
          ...previous,
          colorImageMap: {
            ...previous.colorImageMap,
            [colorName]: {
              ...nextEntry,
              usePrimary: false,
              images: [...(nextEntry.images || []), ...uploaded].slice(0, 3),
            },
          },
        }
      })
    } catch {
      pushToast({ type: 'danger', title: 'Upload failed', message: `Could not upload images for ${colorName}.` })
    } finally {
      setUploading(false)
    }
  }

  const removeColorImage = (colorName, index) => {
    setForm((previous) => {
      const nextEntry = previous.colorImageMap?.[colorName]
      if (!nextEntry) return previous

      return {
        ...previous,
        colorImageMap: {
          ...previous.colorImageMap,
          [colorName]: {
            ...nextEntry,
            images: (nextEntry.images || []).filter((_, itemIndex) => itemIndex !== index),
          },
        },
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateProductForm(form, mode)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      pushToast({ type: 'warning', title: 'Check required fields', message: 'Please fix highlighted product fields.' })
      return
    }

    const payload = buildProductPayload(form)

    setSubmitting(true)
    setError('')

    try {
      const saved = mode === 'edit'
        ? await updateSellerProductFromForm(id, payload)
        : await createSellerProductFromForm(payload)

      const productId = saved?._id || id
      const detailRoute = ROUTES.SELLER_PUBLIC_STORE_PRODUCT
        .replace(':sellerId', routeSellerId)
        .replace(':id', String(productId))

      pushToast({
        type: 'success',
        title: mode === 'edit' ? 'Product updated' : 'Product created',
        message: mode === 'edit'
          ? 'Your product changes are now live in preview.'
          : 'New product was added to your store.',
      })

      navigate(detailRoute, { replace: true })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Could not save product right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    mode,
    loading,
    categoriesLoading,
    templateLoading,
    submitting,
    uploading,
    error,
    errors,
    hasOwnerAccess,
    form,
    storeRoute,
    rootCategoryOptions,
    subCategoryOptions,
    templateSizeOptions,
    templateSpecFields,
    updateField,
    handleRootCategoryChange,
    handleSubCategoryChange,
    addVariant,
    removeVariant,
    updateVariantField,
    toggleVariantSize,
    addDescriptionBlock,
    removeDescriptionBlock,
    updateDescriptionBlock,
    updateSpecificationValue,
    setColorImageUsePrimary,
    uploadPrimaryImages,
    removePrimaryImage,
    uploadColorImages,
    removeColorImage,
    handleSubmit,
    onCancel: () => navigate(storeRoute),
  }
}
