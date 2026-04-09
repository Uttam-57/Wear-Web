import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Drawer } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import useAuthStore from '@/features/auth/authSlice'
import { logout as logoutApi } from '@/features/auth/api'
import SellerTopBar from '@/features/seller/layout/components/SellerTopBar'
import SellerSidebarNavigation from '@/features/seller/layout/components/SellerSidebarNavigation'
import useSellerShellData from '@/features/seller/layout/hooks/useSellerShellData'

export default function SellerLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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

  const publicStoreTo = sellerId
    ? ROUTES.SELLER_PUBLIC_STORE.replace(':sellerId', String(sellerId))
    : ROUTES.SELLER_DASHBOARD

  return (
    <div className="min-h-screen bg-surface">
      <SellerTopBar
        storeName={storeName}
        sellerEmail={sellerEmail}
        notifications={shellData.notifications}
        unreadCount={shellData.unreadCount}
        onToggleMobileNav={() => setMobileSidebarOpen(true)}
        onViewPublicStore={handleViewPublicStore}
        onLogout={handleLogout}
      />

      <div className="mx-auto flex w-full max-w-[1520px] gap-md px-md py-md md:px-lg">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-[78px] max-h-[calc(100vh-92px)] overflow-y-auto rounded-xl border border-border bg-surface/70 p-sm">
            <SellerSidebarNavigation counts={shellData} publicStoreTo={publicStoreTo} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-xl">
          <Outlet />
        </main>
      </div>

      <Drawer
        open={mobileSidebarOpen}
        title="Seller Menu"
        onClose={() => setMobileSidebarOpen(false)}
        side="left"
      >
        <SellerSidebarNavigation counts={shellData} publicStoreTo={publicStoreTo} onNavigate={() => setMobileSidebarOpen(false)} />
      </Drawer>
    </div>
  )
}
