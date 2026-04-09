import { create } from 'zustand'

const getInitialTheme = () => {
  const stored = localStorage.getItem('wearweb_theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const useUIStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('wearweb_theme', theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('wearweb_theme', next)
    set({ theme: next })
  },

  activeModal: null,
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  toasts: [],
  pushToast: (toast) => {
    const id = crypto.randomUUID()
    const payload = {
      id,
      type: toast.type || 'info',
      title: toast.title || 'Notice',
      message: toast.message || '',
      ttl: toast.ttl || 3200,
    }
    set((state) => ({ toasts: [...state.toasts, payload] }))
    if (payload.ttl > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, payload.ttl)
    }
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))

export default useUIStore