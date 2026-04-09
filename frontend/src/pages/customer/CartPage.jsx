import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Spinner } from '@/shared/ui'
import useUIStore from '@/shared/uiSlice'
import useCartPage from '@/features/cart/hooks/useCartPage'
import CartBulkActions from '@/features/cart/components/molecules/CartBulkActions'
import CartItemCard from '@/features/cart/components/organisms/CartItemCard'
import CartSavedItemsSection from '@/features/cart/components/organisms/CartSavedItemsSection'
import CartPriceSummary from '@/features/cart/components/organisms/CartPriceSummary'
import CartEmptyState from '@/features/cart/components/organisms/CartEmptyState'
import CartMobileStickyBar from '@/features/cart/components/organisms/CartMobileStickyBar'
import CartConfirmDialog from '@/features/cart/components/organisms/CartConfirmDialog'

export default function CartPage() {
  const navigate = useNavigate()
  const pushToast = useUIStore((state) => state.pushToast)
  const [confirmState, setConfirmState] = useState(null)

  const {
    loading,
    busy,
    items,
    savedItems,
    summary,
    selectedIds,
    pendingItemIds,
    savedExpanded,
    setSavedExpanded,
    selectableCount,
    isAllSelected,
    toggleSelect,
    toggleSelectAll,
    changeQuantity,
    removeCartLine,
    saveForLater,
    removeSelected,
    moveSelectedToWishlist,
    moveSavedToCart,
    removeSavedItem,
  } = useCartPage()

  const totalCartItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const openRemoveSelectedDialog = () => {
    if (!selectedIds.length) return

    setConfirmState({
      type: 'remove-selected',
      title: 'Remove selected items',
      message: `Remove ${selectedIds.length} selected item(s) from your cart?`,
      action: removeSelected,
      confirmLabel: 'Remove',
    })
  }

  const openMoveSelectedDialog = () => {
    if (!selectedIds.length) return

    setConfirmState({
      type: 'move-selected',
      title: 'Move selected items',
      message: `Move ${selectedIds.length} selected item(s) to wishlist?`,
      action: moveSelectedToWishlist,
      confirmLabel: 'Move',
    })
  }

  const handlePlaceOrder = () => {
    if (!summary.canCheckout) {
      pushToast({
        type: 'warning',
        title: 'Action needed',
        message: 'Remove out-of-stock items to continue.',
      })
      return
    }

    const checkoutVariantIds = items
      .filter((item) => selectedIds.includes(item.id) && !item.isOutOfStock)
      .map((item) => item.variantId)

    if (!checkoutVariantIds.length) {
      pushToast({
        type: 'warning',
        title: 'No items selected',
        message: 'Select at least one in-stock cart item to continue.',
      })
      return
    }

    navigate(ROUTES.CHECKOUT, {
      state: {
        variantIds: checkoutVariantIds,
      },
    })
  }

  return (
    <div className="page-shell space-y-md pb-28 lg:pb-xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-text-secondary">Shopping Cart</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="section-title">Shopping Cart ({totalCartItems})</h1>
          <p className="section-subtitle">Review items, adjust quantity, and continue to checkout.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-sm">
          <CartEmptyState />

          <CartSavedItemsSection
            savedItems={savedItems}
            expanded={savedExpanded}
            onToggle={() => setSavedExpanded((prev) => !prev)}
            onMoveToCart={moveSavedToCart}
            onRemove={removeSavedItem}
            pendingItemIds={pendingItemIds}
          />
        </div>
      ) : (
        <section className="grid gap-md lg:grid-cols-[1.8fr,1fr]">
          <div className="space-y-sm">
            <CartBulkActions
              allSelected={isAllSelected}
              selectableCount={selectableCount}
              selectedCount={selectedIds.length}
              onToggleAll={toggleSelectAll}
              onRemoveSelected={openRemoveSelectedDialog}
              onMoveSelectedToWishlist={openMoveSelectedDialog}
              disabled={busy}
            />

            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                checked={selectedIds.includes(item.id)}
                pending={pendingItemIds.includes(item.id)}
                onToggle={(checked) => toggleSelect(item.id, checked)}
                onQuantityChange={(quantity) => changeQuantity(item, quantity)}
                onSaveForLater={() => saveForLater(item)}
                onRemove={() => removeCartLine(item)}
                onNotify={() => pushToast({
                  type: 'info',
                  title: 'Notify me',
                  message: 'You will be notified when this item is back in stock.',
                })}
                onMaxReached={() => pushToast({
                  type: 'warning',
                  title: 'Max stock reached',
                  message: 'You reached the maximum available stock for this variant.',
                })}
              />
            ))}

            <button
              type="button"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
              onClick={openRemoveSelectedDialog}
              disabled={!selectedIds.length || busy}
            >
              Remove Selected
            </button>

            <div>
              <Link to={ROUTES.PRODUCTS} className="text-sm font-semibold text-primary hover:text-primary-hover">
                Continue Shopping -&gt;
              </Link>
            </div>

            <CartSavedItemsSection
              savedItems={savedItems}
              expanded={savedExpanded}
              onToggle={() => setSavedExpanded((prev) => !prev)}
              onMoveToCart={moveSavedToCart}
              onRemove={removeSavedItem}
              pendingItemIds={pendingItemIds}
            />
          </div>

          <CartPriceSummary
            summary={summary}
            busy={busy}
            cartIsEmpty={items.length === 0}
            onPlaceOrder={handlePlaceOrder}
          />
        </section>
      )}

      <CartMobileStickyBar
        summary={summary}
        busy={busy}
        cartIsEmpty={items.length === 0}
        onPlaceOrder={handlePlaceOrder}
      />

      <CartConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel || 'Confirm'}
        loading={busy}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState?.action) return
          await confirmState.action()
          setConfirmState(null)
        }}
      />
    </div>
  )
}
