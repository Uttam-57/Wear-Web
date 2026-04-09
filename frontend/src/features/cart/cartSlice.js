import { create } from 'zustand'

const computeTotals = (items) => {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = items.reduce(
    (acc, item) => acc + Number(item.snapshot?.effectivePrice || item.snapshot?.price || 0) * item.quantity,
    0
  )
  return { itemCount, totalPrice }
}

const groupBySeller = (items) => {
  return items.reduce((acc, item) => {
    const sellerId = item.sellerId || 'unknown'
    if (!acc[sellerId]) acc[sellerId] = []
    acc[sellerId].push(item)
    return acc
  }, {})
}

const useCartStore = create((set, get) => ({
  cartId: null,
  items: [],
  totalPrice: 0,
  itemCount: 0,
  loading: false,

  setLoading: (loading) => set({ loading }),

  setCart: (cart) => {
    const items = cart?.items || []
    const { itemCount, totalPrice } = computeTotals(items)
    set({
      cartId: cart?._id || null,
      items,
      itemCount,
      totalPrice,
    })
  },

  groupedItems: () => groupBySeller(get().items),

  clearCart: () =>
    set({
      cartId: null,
      items: [],
      totalPrice: 0,
      itemCount: 0,
      loading: false,
    }),
}))

export default useCartStore