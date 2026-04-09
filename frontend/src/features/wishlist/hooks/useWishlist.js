import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { fetchWishlist, addWishlistProduct, removeWishlistProduct } from '@/features/wishlist/api/wishlist.api'
import useWishlistStore from '@/features/wishlist/wishlistSlice'

const useWishlist = () => {
  const { loading, error, run } = useAsync([])
  const products = useWishlistStore((s) => s.products)
  const setProducts = useWishlistStore((s) => s.setProducts)

  const refresh = useCallback(() => {
    return run(() => fetchWishlist()).then((items) => {
      const normalized = items || []
      setProducts(normalized)
      return normalized
    })
  }, [run, setProducts])

  const add = useCallback(
    async (productId) => {
      await run(() => addWishlistProduct(productId))
      return refresh()
    },
    [run, refresh]
  )

  const remove = useCallback(
    async (productId) => {
      await run(() => removeWishlistProduct(productId))
      return refresh()
    },
    [run, refresh]
  )

  return {
    products,
    loading,
    error,
    refresh,
    add,
    remove,
  }
}

export default useWishlist
