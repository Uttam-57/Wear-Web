/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import useAuthStore from '@/features/auth/authSlice'
import { ROLES, USER_STATUS } from '@/shared/constants/app'
import { ROUTES } from '@/shared/constants/routes'
import MainLayout from '@/shared/layouts/MainLayout'
import AuthLayout from '@/shared/layouts/AuthLayout'
import SellerLayout from '@/shared/layouts/SellerLayout'
import SellerTopBarLayout from '@/shared/layouts/SellerTopBarLayout'
import AdminLayout from '@/shared/layouts/AdminLayout'
import RouteErrorBoundary from '@/shared/ui/organisms/RouteErrorBoundary'

const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ProductsPage = lazy(() => import('@/pages/public/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/public/ProductDetailPage'))
const UnauthorizedPage = lazy(() => import('@/pages/public/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))

const LoginPage = lazy(() => import('@/pages/guest/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/guest/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/guest/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/guest/ResetPasswordPage'))

const CartPage = lazy(() => import('@/pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/customer/CheckOutPage'))
const CheckoutPaymentPage = lazy(() => import('@/pages/customer/CheckoutPaymentPage'))
const CheckoutConfirmationPage = lazy(() => import('@/pages/customer/CheckoutConfirmationPage'))
const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'))
const NotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'))
const WishlistPage = lazy(() => import('@/pages/customer/WishlistPage'))
const AddressesPage = lazy(() => import('@/pages/customer/AddressesPage'))

const SellerDashboardPage = lazy(() => import('@/pages/seller/SellerDashboardPage'))
const SellerNotificationsPage = lazy(() => import('@/pages/seller/SellerNotificationsPage'))
const SellerOrdersPage = lazy(() => import('@/pages/seller/SellerOrdersPage'))
const SellerWalletPage = lazy(() => import('@/pages/seller/SellerWalletPage'))
const SellerAnalyticsPage = lazy(() => import('@/pages/seller/SellerAnalyticsPage'))
const SellerPendingPage = lazy(() => import('@/pages/seller/SellerPendingPage'))
const SellerProfileSetupPage = lazy(() => import('@/pages/seller/SellerProfileSetupPage'))
const SellerStorePreviewPage = lazy(() => import('@/pages/seller/SellerStorePreviewPage'))
const SellerAddProductPage = lazy(() => import('@/pages/seller/SellerAddProductPage'))
const SellerEditProductPage = lazy(() => import('@/pages/seller/SellerEditProductPage'))
const SellerStoreProductPreviewPage = lazy(() => import('@/pages/seller/SellerStoreProductPreviewPage'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminUserDetailPage = lazy(() => import('@/pages/admin/AdminUserDetailPage'))
const AdminSellersPage = lazy(() => import('@/pages/admin/AdminSellersPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminPayoutsPage = lazy(() => import('@/pages/admin/AdminPayoutsPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))

const ProtectedRoute = ({ allowedRoles }) => {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return <Outlet />
}

const resolveAuthenticatedLanding = (user) => {
  if (user?.role === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD
  if (user?.role === ROLES.SELLER) {
    return user?.status === USER_STATUS.PENDING ? ROUTES.SELLER_PENDING : ROUTES.SELLER_DASHBOARD
  }
  return ROUTES.HOME
}

const HomeAccessRoute = () => {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn || user?.role === ROLES.CUSTOMER) {
    return <HomePage />
  }

  return <Navigate to={resolveAuthenticatedLanding(user)} replace />
}

const GuestRoute = () => {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) return <Outlet />

  return <Navigate to={resolveAuthenticatedLanding(user)} replace />
}

const SellerApprovedRoute = () => {
  const { user } = useAuthStore()

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (user.status === USER_STATUS.PENDING) return <Navigate to={ROUTES.SELLER_PENDING} replace />

  return <Outlet />
}

const SellerProductsRedirectRoute = () => {
  const { user } = useAuthStore()
  const sellerId = user?._id

  if (!sellerId) {
    return <Navigate to={ROUTES.SELLER_DASHBOARD} replace />
  }

  return (
    <Navigate
      to={ROUTES.SELLER_PUBLIC_STORE.replace(':sellerId', String(sellerId))}
      replace
    />
  )
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.HOME, element: <HomeAccessRoute /> },
      { path: ROUTES.PRODUCTS, element: <ProductsPage /> },
      { path: ROUTES.PRODUCT_DETAIL, element: <ProductDetailPage /> },
      { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
    ],
  },
  {
    element: <GuestRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: ROUTES.CART, element: <CartPage /> },
          { path: ROUTES.CHECKOUT, element: <CheckoutPage /> },
          { path: ROUTES.CHECKOUT_PAYMENT, element: <CheckoutPaymentPage /> },
          { path: ROUTES.CHECKOUT_CONFIRMATION, element: <CheckoutConfirmationPage /> },
          { path: ROUTES.ORDERS, element: <OrdersPage /> },
          { path: ROUTES.ORDER_DETAIL, element: <OrderDetailPage /> },
          { path: ROUTES.NOTIFICATIONS, element: <NotificationsPage /> },
          { path: ROUTES.PROFILE, element: <ProfilePage /> },
          { path: ROUTES.WISHLIST, element: <WishlistPage /> },
          { path: ROUTES.ADDRESSES, element: <AddressesPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.SELLER]} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.SELLER_PROFILE_SETUP, element: <SellerProfileSetupPage /> },
      { path: ROUTES.SELLER_PENDING, element: <SellerPendingPage /> },
      {
        element: <SellerApprovedRoute />,
        children: [
          {
            element: <SellerTopBarLayout />,
            children: [
              { path: ROUTES.SELLER_PUBLIC_STORE, element: <SellerStorePreviewPage /> },
              { path: ROUTES.SELLER_PUBLIC_STORE_ADD_PRODUCT, element: <SellerAddProductPage /> },
              { path: ROUTES.SELLER_PUBLIC_STORE_EDIT_PRODUCT, element: <SellerEditProductPage /> },
              { path: ROUTES.SELLER_PUBLIC_STORE_PRODUCT, element: <SellerStoreProductPreviewPage /> },
            ],
          },
          {
            element: <SellerLayout />,
            children: [
              { path: ROUTES.SELLER_DASHBOARD, element: <SellerDashboardPage /> },
              { path: ROUTES.SELLER_PRODUCTS, element: <SellerProductsRedirectRoute /> },
              { path: ROUTES.SELLER_NOTIFICATIONS, element: <SellerNotificationsPage /> },
              { path: ROUTES.SELLER_ORDERS, element: <SellerOrdersPage /> },
              { path: ROUTES.SELLER_WALLET, element: <SellerWalletPage /> },
              { path: ROUTES.SELLER_ANALYTICS, element: <SellerAnalyticsPage /> },
              { path: ROUTES.SELLER_PROFILE, element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: ROUTES.ADMIN_DASHBOARD, element: <AdminDashboardPage /> },
          { path: ROUTES.ADMIN_USERS, element: <AdminUsersPage /> },
          { path: ROUTES.ADMIN_USER_DETAIL, element: <AdminUserDetailPage /> },
          { path: ROUTES.ADMIN_SELLERS, element: <AdminSellersPage /> },
          { path: ROUTES.ADMIN_SELLERS_PENDING, element: <AdminSellersPage /> },
          { path: ROUTES.ADMIN_CATEGORIES, element: <AdminCategoriesPage /> },
          { path: ROUTES.ADMIN_PRODUCTS, element: <AdminProductsPage /> },
          { path: ROUTES.ADMIN_ORDERS, element: <AdminOrdersPage /> },
          { path: ROUTES.ADMIN_PAYOUTS, element: <AdminPayoutsPage /> },
          { path: ROUTES.ADMIN_ANALYTICS, element: <AdminAnalyticsPage /> },
          { path: ROUTES.ADMIN_PROFILE, element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
])
