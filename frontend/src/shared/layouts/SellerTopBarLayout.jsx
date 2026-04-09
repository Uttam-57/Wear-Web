import { Outlet, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import useAuthStore from '@/features/auth/authSlice'
import { logout as logoutApi } from '@/features/auth/api'
import SellerTopBar from '@/features/seller/layout/components/SellerTopBar'
import useSellerShellData from '@/features/seller/layout/hooks/useSellerShellData'

export default function SellerTopBarLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const {
    storeName,
    sellerEmail,
    sellerId,
    shellData,
  } = useSellerShellData()

  const handleLogout = async () => {
    try {
      await logoutApi(false)
    } catch {
      // Keep local logout even if API request fails.
    }
    logout()
    navigate(ROUTES.LOGIN)
  }

  const handleViewPublicStore = () => {
    if (!sellerId) {
      navigate(ROUTES.HOME)
      return
    }

    window.open(`/sellers/${sellerId}/products`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-surface">
      <SellerTopBar
        storeName={storeName}
        sellerEmail={sellerEmail}
        notifications={shellData.notifications}
        unreadCount={shellData.unreadCount}
        onViewPublicStore={handleViewPublicStore}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-[1520px] px-md py-md md:px-lg">
        <Outlet />
      </main>
    </div>
  )
}
