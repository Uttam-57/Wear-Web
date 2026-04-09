import { Alert, Spinner } from '@/shared/ui'
import { formatPrice } from '@/shared/utils/formatters'
import useSellerDashboardPage from '@/features/seller/dashboard/hooks/useSellerDashboardPage'
import SellerDashboardHeader from '@/features/seller/dashboard/components/SellerDashboardHeader'
import SellerStatsGrid from '@/features/seller/dashboard/components/SellerStatsGrid'
import SellerSalesOverviewChart from '@/features/seller/dashboard/components/SellerSalesOverviewChart'
import SellerRecentOrdersCard from '@/features/seller/dashboard/components/SellerRecentOrdersCard'
import SellerTopProductsCard from '@/features/seller/dashboard/components/SellerTopProductsCard'
import SellerLowStockAlertsCard from '@/features/seller/dashboard/components/SellerLowStockAlertsCard'
import {
  SellerBlockedState,
  SellerNoProductsState,
} from '@/features/seller/dashboard/components/SellerDashboardStates'

export default function SellerDashboardPage() {
  const {
    period,
    periodLabel,
    periodOptions,
    setPeriod,
    loading,
    refreshing,
    error,
    refresh,
    snapshot,
    isBlocked,
    blockedInfo,
    sellerProfile,
  } = useSellerDashboardPage()

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  if (isBlocked) {
    return <SellerBlockedState blockedInfo={blockedInfo} />
  }

  const statsCards = [
    {
      id: 'sales',
      label: 'Total Sales',
      value: formatPrice(snapshot.totalSales),
      meta: `${snapshot.salesChange >= 0 ? '+' : ''}${Math.round(snapshot.salesChange)}% vs last period`,
      metaTone: snapshot.salesChange >= 0 ? 'success' : 'danger',
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: snapshot.totalOrders,
      meta: `${snapshot.ordersChange >= 0 ? '+' : ''}${Math.round(snapshot.ordersChange)}% vs last period`,
      metaTone: snapshot.ordersChange >= 0 ? 'success' : 'danger',
      actionLabel: 'View All Orders',
      actionTo: '/seller/orders',
    },
    {
      id: 'products',
      label: 'Total Products',
      value: snapshot.totalProducts,
      meta: `${snapshot.outOfStockProducts} out of stock`,
      metaTone: snapshot.outOfStockProducts > 0 ? 'warning' : 'muted',
      actionLabel: 'Manage Products',
      actionTo: '/seller/products',
    },
    {
      id: 'wallet',
      label: 'Wallet Balance',
      value: formatPrice(snapshot.walletBalance),
      meta: 'Available for payout',
      metaTone: 'default',
      actionLabel: 'Request Payout',
      actionTo: '/seller/wallet?tab=payouts',
    },
    {
      id: 'pending-orders',
      label: 'Pending Orders',
      value: snapshot.pendingOrdersCount,
      meta: snapshot.pendingOrdersCount > 0 ? 'Needs attention' : 'No pending orders',
      metaTone: snapshot.pendingOrdersCount > 0 ? 'warning' : 'muted',
      actionLabel: 'View Pending',
      actionTo: '/seller/orders?status=pending,processing',
    },
    {
      id: 'returns',
      label: 'Returns',
      value: `${snapshot.pendingReturnsCount} pending review`,
      meta: snapshot.pendingReturnsCount > 0 ? 'Action required' : 'No return requests',
      metaTone: snapshot.pendingReturnsCount > 0 ? 'danger' : 'muted',
      actionLabel: 'Review Returns',
      actionTo: '/seller/orders?tab=returns',
    },
  ]

  return (
    <div className="space-y-lg">
      <SellerDashboardHeader
        storeName={sellerProfile?.companyName || 'Seller Store'}
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={setPeriod}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {error ? <Alert>{error}</Alert> : null}

      {!snapshot.hasProducts ? <SellerNoProductsState /> : null}

      <SellerStatsGrid cards={statsCards} />

      <SellerSalesOverviewChart chart={snapshot.chart} periodLabel={periodLabel} />

      <div className="grid gap-md xl:grid-cols-2">
        <SellerRecentOrdersCard orders={snapshot.recentOrders} />
        <SellerTopProductsCard products={snapshot.topProducts} />
      </div>

      <SellerLowStockAlertsCard items={snapshot.lowStockProducts} />
    </div>
  )
}
