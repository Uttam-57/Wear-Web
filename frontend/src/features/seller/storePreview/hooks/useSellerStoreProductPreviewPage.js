import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import useAuthStore from '@/features/auth/authSlice'
import useProductReviews from '@/features/products/hooks/useProductReviews'
import useAsync from '@/shared/hooks/useAsync'
import { ROUTES } from '@/shared/constants/routes'
import { getSellerStorePreviewProduct } from '@/features/seller/storePreview/api/storePreview.api'
import {
  buildColorOptions,
  buildExactStockRows,
  buildSizeOptions,
  getTotalStock,
  resolveVariantSelection,
} from '@/features/seller/storePreview/utils/storePreview.utils'

export default function useSellerStoreProductPreviewPage() {
  const { sellerId, id } = useParams()
  const user = useAuthStore((state) => state.user)

  const {
    data: product,
    loading,
    error,
    run,
  } = useAsync(null)

  const refreshProduct = useCallback(() => {
    if (!id) return Promise.resolve(null)
    return run(() => getSellerStorePreviewProduct(id))
  }, [id, run])

  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [reviewsLimit, setReviewsLimit] = useState(5)

  const {
    reviews,
    pagination,
    loading: reviewsLoading,
    error: reviewsError,
  } = useProductReviews({ productId: id, page: 1, limit: reviewsLimit })

  useEffect(() => {
    setSelectedColor('')
    setSelectedSize('')
    setReviewsLimit(5)
  }, [id])

  useEffect(() => {
    if (!id) return
    refreshProduct().catch(() => {})
  }, [id, refreshProduct])

  const routeSellerId = String(sellerId || '')
  const authSellerId = String(user?._id || '')
  const isOwnerPreview = Boolean(routeSellerId) && (!authSellerId || routeSellerId === authSellerId)

  const variants = useMemo(() => product?.variants || [], [product])
  const colorOptions = useMemo(() => buildColorOptions(variants), [variants])

  const resolvedColor = useMemo(() => {
    if (selectedColor && colorOptions.some((item) => item.colorName === selectedColor)) return selectedColor
    return colorOptions[0]?.colorName || ''
  }, [colorOptions, selectedColor])

  const sizeOptions = useMemo(() => buildSizeOptions(variants, resolvedColor), [resolvedColor, variants])

  const resolvedSize = useMemo(() => {
    if (selectedSize && sizeOptions.some((item) => item.size === selectedSize)) return selectedSize
    const inStock = sizeOptions.find((item) => item.stock > 0)
    return inStock?.size || sizeOptions[0]?.size || ''
  }, [selectedSize, sizeOptions])

  const selectedVariant = useMemo(() => {
    return resolveVariantSelection(variants, resolvedColor, resolvedSize)
  }, [resolvedColor, resolvedSize, variants])

  const isOwnProduct = useMemo(() => {
    if (!product) return true
    return String(product?.sellerId?._id || product?.sellerId || '') === authSellerId
  }, [authSellerId, product])

  const hasAccess = isOwnerPreview && isOwnProduct
  const totalStock = useMemo(() => getTotalStock(variants), [variants])
  const exactStockRows = useMemo(() => buildExactStockRows(variants), [variants])

  const storeRoute = ROUTES.SELLER_PUBLIC_STORE.replace(':sellerId', routeSellerId)

  const canLoadMoreReviews = Number(pagination?.total || 0) > reviews.length

  return {
    loading,
    error,
    product,
    hasAccess,
    storeRoute,
    colorOptions,
    sizeOptions,
    selectedColor: resolvedColor,
    selectedSize: resolvedSize,
    selectedVariant,
    onSelectColor: (colorName) => {
      setSelectedColor(colorName)
      setSelectedSize('')
    },
    onSelectSize: setSelectedSize,
    totalStock,
    exactStockRows,
    reviews,
    reviewsLoading,
    reviewsError,
    canLoadMoreReviews,
    onLoadMoreReviews: () => setReviewsLimit((previous) => previous + 5),
    refreshProduct,
  }
}
