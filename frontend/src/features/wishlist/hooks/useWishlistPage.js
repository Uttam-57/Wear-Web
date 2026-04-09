import { useCallback, useEffect, useMemo, useState } from 'react'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import useCart from '@/features/cart/hooks/useCart'
import useUIStore from '@/shared/uiSlice'
import { getProductById } from '@/features/products/api/products.api'
import { removeWishlistProduct, removeWishlistProductsBulk } from '@/features/wishlist/api/wishlist.api'
import {
  applyWishlistSortingAndFilter,
  makeCartPayloadFromVariant,
  pickDefaultVariant,
  toWishlistViewModel,
} from '@/features/wishlist/utils/wishlistPage.utils'

const sortOptions = [
  { label: 'Recently Added', value: 'recently' },
  { label: 'Price: Low to High', value: 'priceLow' },
  { label: 'Price: High to Low', value: 'priceHigh' },
  { label: 'Discount: High to Low', value: 'discountHigh' },
]

const isNotFound = (error) => Number(error?.response?.status) === 404

const fetchProductMap = async (productIds = []) => {
  const uniqueIds = Array.from(new Set((productIds || []).filter(Boolean)))
  if (!uniqueIds.length) return { map: {}, missingIds: [] }

  const requests = await Promise.allSettled(uniqueIds.map((id) => getProductById(id)))

  return requests.reduce((acc, result, index) => {
    const productId = uniqueIds[index]

    if (result.status === 'fulfilled') {
      acc.map[productId] = result.value
      return acc
    }

    if (isNotFound(result.reason)) {
      acc.missingIds.push(productId)
      acc.map[productId] = null
      return acc
    }

    acc.map[productId] = null
    return acc
  }, { map: {}, missingIds: [] })
}

const useWishlistPage = () => {
  const pushToast = useUIStore((state) => state.pushToast)

  const {
    products,
    refresh: refreshWishlist,
  } = useWishlist()

  const { addItem } = useCart()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [productMap, setProductMap] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingIds, setPendingIds] = useState([])
  const [sortBy, setSortBy] = useState('recently')
  const [inStockOnly, setInStockOnly] = useState(false)

  const markPending = useCallback((id, active) => {
    setPendingIds((prev) => {
      const has = prev.includes(id)
      if (active && !has) return [...prev, id]
      if (!active && has) return prev.filter((itemId) => itemId !== id)
      return prev
    })
  }, [])

  const refreshPage = useCallback(async () => {
    setBusy(true)

    try {
      const wishlistItems = await refreshWishlist()
      const wishlistList = wishlistItems || []

      const ids = wishlistList.map((item) => String(item.productId || item))
      const fetched = await fetchProductMap(ids)

      setProductMap(fetched.map)

      if (fetched.missingIds.length > 0) {
        await removeWishlistProductsBulk(fetched.missingIds).catch(() => null)
        await refreshWishlist().catch(() => null)

        pushToast({
          type: 'info',
          title: 'Wishlist refreshed',
          message: 'Unavailable products were removed from your wishlist.',
        })
      }
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }, [pushToast, refreshWishlist])

  useEffect(() => {
    refreshPage().catch(() => {
      pushToast({
        type: 'danger',
        title: 'Could not load wishlist',
        message: 'Please refresh and try again.',
      })
    })
  }, [pushToast, refreshPage])

  const baseItems = useMemo(() => {
    return (products || []).map((entry, index) => {
      const productId = String(entry?.productId || entry)
      const product = productMap[productId]
      return toWishlistViewModel({ ...entry, productId }, product, index)
    })
  }, [productMap, products])

  const visibleItems = useMemo(() => {
    return applyWishlistSortingAndFilter(baseItems, sortBy, inStockOnly)
  }, [baseItems, inStockOnly, sortBy])

  const selectableItems = useMemo(() => visibleItems.filter((item) => !item.missingProduct), [visibleItems])

  const isAllSelected = selectableItems.length > 0 && selectedIds.length === selectableItems.length

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => selectableItems.some((item) => item.id === id)))
  }, [selectableItems])

  const toggleSelect = useCallback((productId, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(productId)) return prev
        return [...prev, productId]
      }
      return prev.filter((id) => id !== productId)
    })
  }, [])

  const toggleSelectAll = useCallback((checked) => {
    if (!checked) {
      setSelectedIds([])
      return
    }

    setSelectedIds(selectableItems.map((item) => item.id))
  }, [selectableItems])

  const addWishlistItemToCart = useCallback(async (item, variant, quantity = 1) => {
    if (!item?.productId || !variant?._id) return false

    markPending(item.id, true)

    try {
      await addItem(makeCartPayloadFromVariant(item.productId, variant, quantity))
      pushToast({ type: 'success', title: 'Added to cart', message: 'Item added to your cart.' })
      return true
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not add this item to cart.'
      pushToast({ type: 'danger', title: 'Action failed', message })
      return false
    } finally {
      markPending(item.id, false)
    }
  }, [addItem, markPending, pushToast])

  const addWithDefaultVariant = useCallback(async (item) => {
    const variant = pickDefaultVariant(item?.variants || [])

    if (!variant || Number(variant?.stock || 0) <= 0) {
      pushToast({
        type: 'warning',
        title: 'Out of stock',
        message: 'This product is currently out of stock.',
      })
      return false
    }

    return addWishlistItemToCart(item, variant, 1)
  }, [addWishlistItemToCart, pushToast])

  const removeSingle = useCallback(async (productId) => {
    markPending(productId, true)

    try {
      await removeWishlistProduct(productId)
      await refreshPage()
      pushToast({ type: 'info', title: 'Removed', message: 'Item removed from wishlist.' })
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not remove item.' })
    } finally {
      markPending(productId, false)
    }
  }, [markPending, pushToast, refreshPage])

  const removeSelected = useCallback(async () => {
    const ids = [...selectedIds]
    if (!ids.length) return

    setBusy(true)

    try {
      await removeWishlistProductsBulk(ids)
      setSelectedIds([])
      await refreshPage()
      pushToast({ type: 'success', title: 'Removed selected', message: `${ids.length} item(s) removed.` })
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not remove selected items.' })
    } finally {
      setBusy(false)
    }
  }, [pushToast, refreshPage, selectedIds])

  const addSelectedToCart = useCallback(async () => {
    const targetItems = visibleItems.filter((item) => selectedIds.includes(item.id))
    if (!targetItems.length) return

    setBusy(true)

    try {
      let successCount = 0

      for (const item of targetItems) {
        const added = await addWithDefaultVariant(item)
        if (added) successCount += 1
      }

      if (successCount > 0) {
        pushToast({
          type: 'success',
          title: 'Added selected to cart',
          message: `${successCount} item(s) added with default variants.`,
        })
      }
    } finally {
      setBusy(false)
    }
  }, [addWithDefaultVariant, pushToast, selectedIds, visibleItems])

  return {
    loading,
    busy,
    items: visibleItems,
    allItems: baseItems,
    selectedIds,
    pendingIds,
    sortBy,
    inStockOnly,
    sortOptions,
    selectableCount: selectableItems.length,
    isAllSelected,
    setSortBy,
    setInStockOnly,
    toggleSelect,
    toggleSelectAll,
    refreshPage,
    addWithDefaultVariant,
    addWishlistItemToCart,
    removeSingle,
    removeSelected,
    addSelectedToCart,
  }
}

export default useWishlistPage
