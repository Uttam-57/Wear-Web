import { Alert } from '@/shared/ui'
import SellerAnalyticsHeader from '@/features/analytics/seller/components/SellerAnalyticsHeader'
import SellerAnalyticsKpiGrid from '@/features/analytics/seller/components/SellerAnalyticsKpiGrid'
import SellerRevenueAreaChart from '@/features/analytics/seller/components/SellerRevenueAreaChart'
import SellerOrderStatusDonut from '@/features/analytics/seller/components/SellerOrderStatusDonut'
import SellerTopProductsTable from '@/features/analytics/seller/components/SellerTopProductsTable'
import SellerReviewSummaryCard from '@/features/analytics/seller/components/SellerReviewSummaryCard'
import SellerRatingDistributionChart from '@/features/analytics/seller/components/SellerRatingDistributionChart'
import SellerCustomerStatsCard from '@/features/analytics/seller/components/SellerCustomerStatsCard'
import SellerLowStockAlertTable from '@/features/analytics/seller/components/SellerLowStockAlertTable'
import SellerDeadStockTable from '@/features/analytics/seller/components/SellerDeadStockTable'
import useSellerAnalyticsPage from '@/features/analytics/seller/hooks/useSellerAnalyticsPage'

export default function SellerAnalyticsView() {
  const {
    period,
    periodOptions,
    customFrom,
    customTo,
    customRangeError,
    loading,
    refreshing,
    error,
    view,
    setPeriod,
    setCustomFrom,
    setCustomTo,
    refresh,
  } = useSellerAnalyticsPage()

  const isBusy = loading || refreshing

  return (
    <div className="space-y-lg animate-fade-up">
      <SellerAnalyticsHeader
        period={period}
        periodOptions={periodOptions}
        customFrom={customFrom}
        customTo={customTo}
        customRangeError={customRangeError}
        refreshing={refreshing}
        onPeriodChange={setPeriod}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        onRefresh={refresh}
      />

      {error ? <Alert>{error}</Alert> : null}

      <SellerAnalyticsKpiGrid kpis={view.kpis} loading={isBusy} />

      <div className="grid gap-md xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SellerRevenueAreaChart data={view.revenueOverTime} loading={isBusy} />
        </div>
        <SellerOrderStatusDonut segments={view.orderStatusSegments} loading={isBusy} />
      </div>

      <div className="grid gap-md xl:grid-cols-2">
        <SellerTopProductsTable
          title="Top Products by Revenue"
          rows={view.topProductsByRevenue}
          metric="revenue"
          loading={isBusy}
        />
        <SellerTopProductsTable
          title="Top Products by Units Sold"
          rows={view.topProductsByUnitsSold}
          metric="units"
          loading={isBusy}
        />
      </div>

      <div className="grid gap-md xl:grid-cols-3">
        <SellerReviewSummaryCard reviews={view.reviews} loading={isBusy} />
        <SellerRatingDistributionChart bars={view.reviews.ratingBars} loading={isBusy} />
        <SellerCustomerStatsCard customers={view.customers} loading={isBusy} />
      </div>

      <div className="grid gap-md xl:grid-cols-2">
        <SellerLowStockAlertTable rows={view.lowStock} loading={isBusy} />
        <SellerDeadStockTable rows={view.deadStock} loading={isBusy} />
      </div>
    </div>
  )
}
