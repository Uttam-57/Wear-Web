export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  AUTH_SESSIONS: '/auth/sessions',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  PROFILE: '/users/profile',
  ACCOUNT_DELETE: '/users/account',
  PROFILE_PHOTO: '/users/profile/photo',
  CHANGE_PASSWORD: '/users/change-password',
  ADDRESSES: '/users/addresses',
  ADDRESS_LOOKUP_PINCODE: '/users/addresses/lookup/pincode',
  ADDRESS_LOOKUP_REVERSE_GEOCODE: '/users/addresses/lookup/reverse-geocode',
  SELLER_PROFILE_SETUP: '/users/seller/profile/setup',
  SELLER_PROFILE: '/users/seller/profile',
  ADMIN_USERS: '/users/admin/users',
  ADMIN_SELLERS_PENDING: '/users/admin/sellers/pending',

  // Category
  CATEGORIES: '/categories',
  CATEGORY_TEMPLATE_PUBLIC: '/categories',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_TEMPLATE: '/admin/categories',

  // Products
  PRODUCTS: '/products',
  PRODUCT_SEARCH: '/products/search',
  PRODUCT_SUGGESTIONS: '/products/suggestions',
  PRODUCT_BY_ID: '/products',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_PRODUCT_BY_ID: '/seller/products',
  SELLER_MEDIA_UPLOAD: '/seller/products/media/upload',
  ADMIN_PRODUCTS: '/admin/products',

  // Cart
  CART: '/cart',

  // Wishlist
  WISHLIST: '/wishlist',

  // Orders
  ORDERS: '/orders',
  SELLER_ORDERS: '/seller/orders',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_RETURNS: '/admin/returns',

  // Payment
  PAYMENT_INITIATE: '/payment/initiate',
  PAYMENT_CONFIRM: '/payment/confirm',
  PAYMENT_HISTORY: '/payment/history',

  // Wallet
  WALLET: '/wallet',
  WALLET_WITHDRAW: '/wallet/withdraw',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  ADMIN_WALLETS: '/wallet/admin/wallets',
  ADMIN_WALLET_TRANSACTIONS: '/wallet/admin/transactions',
  ADMIN_WALLET_PAYOUT_PROCESS: '/wallet/admin/transactions',

  // Reviews
  REVIEWS: '/products',
  ADMIN_REVIEWS: '/reviews',

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD: '/notifications/unread-count',

  // Analytics
  SELLER_ANALYTICS: '/seller/analytics',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Admin Users
  ADMIN_USERS_LEGACY: '/users/admin/users',
}