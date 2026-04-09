export const ROUTES = {
  // Public
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_SEARCH: '/products/search',

  // Guest
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Customer
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_PAYMENT: '/checkout/payment',
  CHECKOUT_CONFIRMATION: '/checkout/confirmation/:orderId',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  WISHLIST: '/wishlist',
  ADDRESSES: '/addresses',

  // Seller
  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_ORDERS: '/seller/orders',
  SELLER_NOTIFICATIONS: '/seller/notifications',
  SELLER_WALLET: '/seller/wallet',
  SELLER_ANALYTICS: '/seller/analytics',
  SELLER_PROFILE: '/seller/profile',
  SELLER_PROFILE_SETUP: '/seller/profile/setup',
  SELLER_PENDING: '/seller/pending',
  SELLER_PUBLIC_STORE: '/sellers/:sellerId/products',
  SELLER_PUBLIC_STORE_ADD_PRODUCT: '/sellers/:sellerId/products/new',
  SELLER_PUBLIC_STORE_PRODUCT: '/sellers/:sellerId/products/:id',
  SELLER_PUBLIC_STORE_EDIT_PRODUCT: '/sellers/:sellerId/products/:id/edit',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_SELLERS: '/admin/sellers',
  ADMIN_SELLERS_PENDING: '/admin/users/sellers/pending',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_PROFILE: '/admin/profile',

  // Utility
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*'
}