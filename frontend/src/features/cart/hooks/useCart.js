import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import useCartStore from '@/features/cart/cartSlice'
import { fetchCart, addToCart, updateCartQuantity, removeCartItem, clearCart } from '@/features/cart/api/cart.api'

const useCart = () => {
  const { loading, error, run } = useAsync(null)
  const setCart = useCartStore((s) => s.setCart)
  const clearStoreCart = useCartStore((s) => s.clearCart)

  const refresh = useCallback(() => {
    return run(() => fetchCart()).then((cart) => {
      setCart(cart)
      return cart
    })
  }, [run, setCart])

  const addItem = useCallback(
    (payload) => run(() => addToCart(payload)).then((cart) => {
      setCart(cart)
      return cart
    }),
    [run, setCart]
  )

  const updateQuantity = useCallback(
    (variantId, quantity) => run(() => updateCartQuantity(variantId, quantity)).then((cart) => {
      setCart(cart)
      return cart
    }),
    [run, setCart]
  )

  const removeItem = useCallback(
    (variantId) => run(() => removeCartItem(variantId)).then((cart) => {
      setCart(cart)
      return cart
    }),
    [run, setCart]
  )

  const clear = useCallback(
    () => run(() => clearCart()).then((cart) => {
      if (cart?.items) {
        setCart(cart)
      } else {
        clearStoreCart()
      }
    }),
    [run, setCart, clearStoreCart]
  )

  return {
    loading,
    error,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }
}

export default useCart
