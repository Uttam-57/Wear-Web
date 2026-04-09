import { create } from 'zustand'

const useWishlistStore = create((set, get) => ({
  products: [],
  loading: false,

  setLoading: (loading) => set({ loading }),
  setProducts: (products) => set({ products }),
  hasProduct: (productId) => get().products.some((item) => item.productId === productId),
  clearWishlist: () => set({ products: [] }),
}))

export default useWishlistStore
