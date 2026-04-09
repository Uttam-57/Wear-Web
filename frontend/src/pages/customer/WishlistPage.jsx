import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Spinner } from '@/shared/ui'
import useUIStore from '@/shared/uiSlice'
import useWishlistPage from '@/features/wishlist/hooks/useWishlistPage'
import WishlistBulkActions from '@/features/wishlist/components/molecules/WishlistBulkActions'
import WishlistSortFilterBar from '@/features/wishlist/components/molecules/WishlistSortFilterBar'
import WishlistItemCard from '@/features/wishlist/components/organisms/WishlistItemCard'
import WishlistVariantModal from '@/features/wishlist/components/organisms/WishlistVariantModal'
import WishlistEmptyState from '@/features/wishlist/components/organisms/WishlistEmptyState'
import WishlistMobileActionBar from '@/features/wishlist/components/organisms/WishlistMobileActionBar'
import WishlistConfirmDialog from '@/features/wishlist/components/organisms/WishlistConfirmDialog'

export default function WishlistPage() {
  const pushToast = useUIStore((state) => state.pushToast)

  const {
    loading,
    busy,
    items,
    selectedIds,
    pendingIds,
    sortBy,
    inStockOnly,
    sortOptions,
    selectableCount,
    isAllSelected,
    setSortBy,
    setInStockOnly,
    toggleSelect,
    toggleSelectAll,
    addWithDefaultVariant,
    addWishlistItemToCart,
    removeSingle,
    removeSelected,
    addSelectedToCart,
  } = useWishlistPage()

  const [variantModalItem, setVariantModalItem] = useState(null)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  const handleAddToCart = async (item) => {
    if (!item.stock.available) {
      pushToast({
        type: 'warning',
        title: 'Out of stock',
        message: 'This product is currently out of stock.',
      })
      return
    }

    if ((item.variants || []).length <= 1) {
      await addWithDefaultVariant(item)
      return
    }

    setVariantModalItem(item)
  }

  const handleVariantConfirm = async (variant, quantity) => {
    if (!variantModalItem) return

    const success = await addWishlistItemToCart(variantModalItem, variant, quantity)
    if (success) setVariantModalItem(null)
  }

  return (
    <div className="page-shell space-y-md pb-24 lg:pb-xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-text-secondary">My Wishlist</span>
      </nav>

      <div>
        <h1 className="section-title">My Wishlist</h1>
        <p className="section-subtitle">Track favorites, monitor stock, and add variants to cart.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <WishlistEmptyState />
      ) : (
        <section className="space-y-sm">
          <WishlistBulkActions
            selectableCount={selectableCount}
            selectedCount={selectedIds.length}
            allSelected={isAllSelected}
            disabled={busy}
            onToggleAll={toggleSelectAll}
            onAddSelectedToCart={addSelectedToCart}
            onRemoveSelected={() => setConfirmRemoveOpen(true)}
          />

          <WishlistSortFilterBar
            sortBy={sortBy}
            options={sortOptions}
            inStockOnly={inStockOnly}
            onSortChange={setSortBy}
            onToggleInStock={setInStockOnly}
          />

          <div className="space-y-sm">
            {items.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                checked={selectedIds.includes(item.id)}
                pending={pendingIds.includes(item.id)}
                onToggle={(checked) => toggleSelect(item.id, checked)}
                onAddToCart={() => handleAddToCart(item)}
                onRemove={() => removeSingle(item.id)}
                onNotify={() => pushToast({
                  type: 'info',
                  title: 'Notify me',
                  message: 'You will be notified when this item is back in stock.',
                })}
              />
            ))}
          </div>
        </section>
      )}

      {variantModalItem ? (
        <WishlistVariantModal
          key={variantModalItem.id}
          open
          item={variantModalItem}
          loading={busy}
          onClose={() => setVariantModalItem(null)}
          onConfirm={handleVariantConfirm}
        />
      ) : null}

      <WishlistConfirmDialog
        open={confirmRemoveOpen}
        title="Remove selected wishlist items"
        message={`Remove ${selectedIds.length} selected item(s) from your wishlist?`}
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setConfirmRemoveOpen(false)}
        onConfirm={async () => {
          await removeSelected()
          setConfirmRemoveOpen(false)
        }}
      />

      <WishlistMobileActionBar
        selectedCount={selectedIds.length}
        busy={busy}
        onAddSelected={addSelectedToCart}
      />
    </div>
  )
}
