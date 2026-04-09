import { Alert, Spinner } from '@/shared/ui'
import useSellerOrdersPage from '@/features/orders/seller/hooks/useSellerOrdersPage'
import SellerOrdersListView from '@/features/orders/seller/components/SellerOrdersListView'
import SellerOrderDetailView from '@/features/orders/seller/components/SellerOrderDetailView'
import SellerOrderRejectModal from '@/features/orders/seller/components/SellerOrderRejectModal'
import SellerReturnsListView from '@/features/orders/seller/components/SellerReturnsListView'
import { SELLER_ORDER_PANEL_TABS } from '@/features/orders/seller/utils/sellerOrders.utils'

export default function SellerOrdersPage() {
  const {
    loading,
    refreshing,
    error,
    panelTab,
    statusTab,
    statusCounts,
    dateFilter,
    searchTerm,
    listRows,
    page,
    totalPages,
    selectedOrder,
    returnRows,
    actionLoading,
    deliveryOtp,
    returnPickupOtp,
    rejectState,
    setPanelTab,
    setStatusTab,
    setDateFilter,
    setSearchTerm,
    setPage,
    openOrderDetail,
    openReturnDetail,
    closeOrderDetail,
    submitStatusUpdate,
    setDeliveryOtpValue,
    submitDeliveryOtp,
    setReturnPickupOtpValue,
    submitReturnStatusUpdate,
    resendReturnPickupOtp,
    openRejectModal,
    closeRejectModal,
    setRejectReason,
    submitRejectOrder,
    refresh,
  } = useSellerOrdersPage()

  const rejectOrder = rejectState.orderId
    ? (listRows.find((entry) => entry.id === rejectState.orderId)
      || selectedOrder
      || returnRows.find((entry) => entry.id === rejectState.orderId))
    : null

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface-elevated p-1">
        <button
          type="button"
          onClick={() => setPanelTab(SELLER_ORDER_PANEL_TABS.ORDERS)}
          className={`rounded-md px-sm py-2 text-sm font-medium transition ${panelTab === SELLER_ORDER_PANEL_TABS.ORDERS ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'}`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setPanelTab(SELLER_ORDER_PANEL_TABS.RETURNS)}
          className={`rounded-md px-sm py-2 text-sm font-medium transition ${panelTab === SELLER_ORDER_PANEL_TABS.RETURNS ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'}`}
        >
          Returns
        </button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {selectedOrder ? (
        <SellerOrderDetailView
          order={selectedOrder}
          loadingAction={actionLoading === selectedOrder.id}
          deliveryOtpValue={deliveryOtp.orderId === selectedOrder.id ? deliveryOtp.value : ''}
          returnPickupOtpValue={returnPickupOtp.orderId === selectedOrder.id ? returnPickupOtp.value : ''}
          onBack={closeOrderDetail}
          onUpdateStatus={(orderId, nextStatus, actionLabel) => {
            submitStatusUpdate({
              orderId,
              status: nextStatus,
              successMessage: `${actionLabel} completed successfully.`,
            })
          }}
          onDeliveryOtpChange={setDeliveryOtpValue}
          onSubmitDeliveryOtp={submitDeliveryOtp}
          onReturnOtpChange={setReturnPickupOtpValue}
          onSubmitReturnStatus={submitReturnStatusUpdate}
          onRequestReturnPickupOtp={resendReturnPickupOtp}
          onOpenReject={openRejectModal}
        />
      ) : null}

      {panelTab === SELLER_ORDER_PANEL_TABS.ORDERS && !selectedOrder ? (
        <SellerOrdersListView
          rows={listRows}
          loading={loading}
          refreshing={refreshing}
          statusTab={statusTab}
          statusCounts={statusCounts}
          searchTerm={searchTerm}
          dateFilter={dateFilter}
          page={page}
          totalPages={totalPages}
          onStatusTabChange={setStatusTab}
          onSearchChange={setSearchTerm}
          onDateFilterChange={setDateFilter}
          onPageChange={setPage}
          onOpenOrder={openOrderDetail}
          onRefresh={refresh}
        />
      ) : null}

      {panelTab === SELLER_ORDER_PANEL_TABS.RETURNS ? (
        <SellerReturnsListView rows={returnRows} onOpenOrder={openReturnDetail} />
      ) : null}

      <SellerOrderRejectModal
        open={rejectState.open}
        orderNumber={rejectOrder?.orderNumber || selectedOrder?.orderNumber || ''}
        reason={rejectState.reason}
        submitting={rejectState.submitting}
        onReasonChange={setRejectReason}
        onCancel={closeRejectModal}
        onConfirm={submitRejectOrder}
      />
    </div>
  )
}
