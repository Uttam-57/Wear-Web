import { useCallback, useEffect, useMemo, useState } from 'react'
import useCart from '@/features/cart/hooks/useCart'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import useUIStore from '@/shared/uiSlice'
import { getProductById } from '@/features/products/api/products.api'
import { addWishlistProduct } from '@/features/wishlist/api/wishlist.api'
import { removeCartItemsBulk } from '@/features/cart/api/cart.api'
import {
  buildCartSummary,
  readSavedItems,
  sanitizeQuantity,
  toCartItemViewModel,
  toSavedItem,
  toSavedItemCartPayload,
  toSavedItemViewModel,
  writeSavedItems,
} from '@/features/cart/utils/cartPage.utils'

const byProductId = async (productIds = []) => {
  const uniqueIds = Array.from(new Set((productIds || []).filter(Boolean)))
  if (!uniqueIds.length) return {}

  const requests = await Promise.allSettled(uniqueIds.map((id) => getProductById(id)))

  return requests.reduce((acc, result, index) => {
    const id = uniqueIds[index]
    if (result.status === 'fulfilled' && result.value?._id) {
      acc[id] = result.value
      return acc
    }

    acc[id] = null
    return acc
  }, {})
}

const useCartPage = () => {
  const pushToast = useUIStore((state) => state.pushToast)

  const {
    refresh: refreshCart,
    updateQuantity,
    removeItem,
    addItem,
  } = useCart()

  const { refresh: refreshWishlist } = useWishlist()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState([])
  const [savedItems, setSavedItems] = useState(() => readSavedItems())
  const [productsById, setProductsById] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingItemIds, setPendingItemIds] = useState([])
  const [savedExpanded, setSavedExpanded] = useState(true)

  const markPending = useCallback((itemId, active) => {
    setPendingItemIds((prev) => {
      const has = prev.includes(itemId)
      if (active && !has) return [...prev, itemId]
      if (!active && has) return prev.filter((id) => id !== itemId)
      return prev
    })
  }, [])

  const hydrateAndSetCart = useCallback((cartItems = [], productMap = {}) => {
    const nextItems = (cartItems || []).map((item) => {
      const product = productMap[String(item.productId)]
      return toCartItemViewModel(item, product)
    })
    setItems(nextItems)
    return nextItems
  }, [])

  const refreshPage = useCallback(async ({ adjustLimitedStock = true } = {}) => {
    setBusy(true)

    try {
      const cart = await refreshCart()
      const cartItems = cart?.items || []
      const catalog = await byProductId([
        ...cartItems.map((item) => String(item.productId)),
        ...savedItems.map((item) => String(item.productId)),
      ])

      setProductsById((prev) => ({ ...prev, ...catalog }))
      let nextItems = hydrateAndSetCart(cartItems, catalog)

      if (adjustLimitedStock) {
        const toAdjust = nextItems.filter((item) => !item.isOutOfStock && item.stock > 0 && item.quantity > item.stock)

        if (toAdjust.length > 0) {
          await Promise.all(toAdjust.map((item) => updateQuantity(item.variantId, item.stock).catch(() => null)))

          pushToast({
            type: 'warning',
            title: 'Stock adjusted',
            message: 'One or more item quantities were reduced to available stock.',
          })

          const latestCart = await refreshCart()
          const latestItems = latestCart?.items || []
          const latestCatalog = await byProductId([
            ...latestItems.map((item) => String(item.productId)),
            ...savedItems.map((item) => String(item.productId)),
          ])

          setProductsById((prev) => ({ ...prev, ...latestCatalog }))
          nextItems = hydrateAndSetCart(latestItems, latestCatalog)
        }
      }

      return nextItems
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }, [hydrateAndSetCart, pushToast, refreshCart, savedItems, updateQuantity])

  useEffect(() => {
    refreshPage().catch(() => {
      pushToast({
        type: 'danger',
        title: 'Could not load cart',
        message: 'Please refresh the page and try again.',
      })
    })
  }, [pushToast, refreshPage])

  useEffect(() => {
    const missingProductIds = savedItems
      .map((item) => String(item.productId))
      .filter((productId) => !Object.prototype.hasOwnProperty.call(productsById, productId))

    if (!missingProductIds.length) return

    byProductId(missingProductIds)
      .then((catalog) => {
        setProductsById((prev) => ({ ...prev, ...catalog }))
      })
      .catch(() => {})
  }, [productsById, savedItems])

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id && !item.isOutOfStock)))
  }, [items])

  const savedViewItems = useMemo(() => {
    return savedItems.map((item) => toSavedItemViewModel(item, productsById[String(item.productId)] || null))
  }, [productsById, savedItems])

  const selectableItems = useMemo(() => items.filter((item) => !item.isOutOfStock), [items])

  const summary = useMemo(() => buildCartSummary(items), [items])

  const isAllSelected = selectableItems.length > 0 && selectedIds.length === selectableItems.length

  const setSavedItemsState = useCallback((next) => {
    setSavedItems((prev) => {
      const normalized = typeof next === 'function' ? next(prev) : next
      return writeSavedItems(normalized)
    })
  }, [])

  const toggleSelect = useCallback((itemId, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(itemId)) return prev
        return [...prev, itemId]
      }
      return prev.filter((id) => id !== itemId)
    })
  }, [])

  const toggleSelectAll = useCallback((checked) => {
    if (!checked) {
      setSelectedIds([])
      return
    }

    setSelectedIds(selectableItems.map((item) => item.id))
  }, [selectableItems])

  const changeQuantity = useCallback(async (item, requestedQuantity) => {
    if (!item?.variantId) return

    const safeQuantity = sanitizeQuantity(requestedQuantity, item.maxQuantity, item.quantity)
    if (safeQuantity === item.quantity) return

    markPending(item.id, true)

    try {
      await updateQuantity(item.variantId, safeQuantity)
      await refreshPage({ adjustLimitedStock: false })
      pushToast({ type: 'success', title: 'Quantity updated', message: 'Cart quantity was updated.' })
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not update quantity right now.'
      pushToast({ type: 'danger', title: 'Update failed', message })
      await refreshPage({ adjustLimitedStock: false }).catch(() => {})
    } finally {
      markPending(item.id, false)
    }
  }, [markPending, pushToast, refreshPage, updateQuantity])

  const removeCartLine = useCallback(async (item) => {
    if (!item?.variantId) return

    markPending(item.id, true)

    try {
      await removeItem(item.variantId)
      setSelectedIds((prev) => prev.filter((id) => id !== item.id))
      await refreshPage({ adjustLimitedStock: false })
      pushToast({ type: 'info', title: 'Item removed', message: 'Item removed from cart.' })
    } catch {
      pushToast({ type: 'danger', title: 'Could not remove', message: 'Try again in a moment.' })
    } finally {
      markPending(item.id, false)
    }
  }, [markPending, pushToast, refreshPage, removeItem])

  const saveForLater = useCallback(async (item) => {
    if (!item?.variantId) return

    const existingSaved = readSavedItems()
    const alreadySaved = existingSaved.some((saved) => saved.variantId === item.variantId)

    if (!alreadySaved) {
      setSavedItemsState([...existingSaved, toSavedItem(item)])
    }

    markPending(item.id, true)

    try {
      await removeItem(item.variantId)
      setSelectedIds((prev) => prev.filter((id) => id !== item.id))
      await refreshPage({ adjustLimitedStock: false })
      pushToast({ type: 'success', title: 'Saved for later', message: 'Item moved to saved items.' })
    } catch {
      if (!alreadySaved) {
        setSavedItemsState(existingSaved)
      }
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not save this item for later.' })
    } finally {
      markPending(item.id, false)
    }
  }, [markPending, pushToast, refreshPage, removeItem, setSavedItemsState])

  const moveSavedToCart = useCallback(async (savedItem) => {
    if (!savedItem?.productId || !savedItem?.variantId) return

    markPending(savedItem.id, true)

    try {
      await addItem(toSavedItemCartPayload(savedItem))
      setSavedItemsState((prev) => prev.filter((item) => item.id !== savedItem.id))
      await refreshPage({ adjustLimitedStock: false })
      pushToast({ type: 'success', title: 'Moved to cart', message: 'Item moved to your active cart.' })
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not move item to cart.'
      pushToast({ type: 'danger', title: 'Action failed', message })
    } finally {
      markPending(savedItem.id, false)
    }
  }, [addItem, markPending, pushToast, refreshPage, setSavedItemsState])

  const removeSavedItem = useCallback((savedItemId) => {
    setSavedItemsState((prev) => prev.filter((item) => item.id !== savedItemId))
    pushToast({ type: 'info', title: 'Removed', message: 'Item removed from saved items.' })
  }, [pushToast, setSavedItemsState])

  const removeSelected = useCallback(async () => {
    const ids = [...selectedIds]
    if (!ids.length) return

    setBusy(true)

    try {
      await removeCartItemsBulk(ids)
      setSelectedIds([])
      await refreshPage({ adjustLimitedStock: false })
      pushToast({ type: 'success', title: 'Removed selected', message: `${ids.length} item(s) removed from cart.` })
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not remove selected items.' })
    } finally {
      setBusy(false)
    }
  }, [pushToast, refreshPage, selectedIds])

  const moveSelectedToWishlist = useCallback(async () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id))
    if (!selectedItems.length) return

    setBusy(true)

    try {
      await Promise.all(selectedItems.map((item) => addWishlistProduct(item.productId).catch(() => null)))
      await removeCartItemsBulk(selectedItems.map((item) => item.id))
      await refreshWishlist().catch(() => null)
      setSelectedIds([])
      await refreshPage({ adjustLimitedStock: false })

      pushToast({
        type: 'success',
        title: 'Moved to wishlist',
        message: `${selectedItems.length} item(s) moved to wishlist.`,
      })
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not move selected items to wishlist.' })
    } finally {
      setBusy(false)
    }
  }, [items, pushToast, refreshPage, refreshWishlist, selectedIds])

  return {
    loading,
    busy,
    items,
    savedItems: savedViewItems,
    summary,
    selectedIds,
    pendingItemIds,
    savedExpanded,
    setSavedExpanded,
    selectableCount: selectableItems.length,
    isAllSelected,
    toggleSelect,
    toggleSelectAll,
    refreshPage,
    changeQuantity,
    removeCartLine,
    saveForLater,
    removeSelected,
    moveSelectedToWishlist,
    moveSavedToCart,
    removeSavedItem,
  }
}

export default useCartPage
