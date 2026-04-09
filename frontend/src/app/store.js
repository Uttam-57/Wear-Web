export { default as useAuthStore } from '../features/auth/authSlice'
export { default as useCartStore } from '../features/cart/cartSlice'
export { default as useWishlistStore } from '../features/wishlist/wishlistSlice'
export { default as useNotificationStore } from '../features/notifications/notificationSlice'
export { default as useUIStore } from '../shared/uiSlice'

// Default export is authStore — used by apiClient interceptor
export { default } from '../features/auth/authSlice'