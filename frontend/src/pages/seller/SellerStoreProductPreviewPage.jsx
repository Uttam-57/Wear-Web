import { useState } from 'react'
import { Alert, Button, Card, Spinner } from '@/shared/ui'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductImageGallery from '@/features/products/components/organisms/ProductImageGallery'
import ProductPurchasePanel from '@/features/products/components/organisms/ProductPurchasePanel'
import ProductTabsSection from '@/features/products/components/organisms/ProductTabsSection'
import useSellerStoreProductPreviewPage from '@/features/seller/storePreview/hooks/useSellerStoreProductPreviewPage'
import SellerProductPreviewHeader from '@/features/seller/storePreview/components/SellerProductPreviewHeader'
import SellerVariantStockTable from '@/features/seller/storePreview/components/SellerVariantStockTable'
import SellerProductReviewList from '@/features/seller/storePreview/components/SellerProductReviewList'
import useAuthStore from '@/features/auth/authSlice'
import useUIStore from '@/shared/uiSlice'
import { ROUTES } from '@/shared/constants/routes'
import { deleteSellerProduct, holdSellerProduct, unholdSellerProduct } from '@/features/products/api/products.api'

export default function SellerStoreProductPreviewPage() {
  const navigate = useNavigate()
  const { sellerId } = useParams()
  const user = useAuthStore((state) => state.user)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const pushToast = useUIStore((state) => state.pushToast)
  const [quantity, setQuantity] = useState(1)
  const [deleting, setDeleting] = useState(false)
  const [updatingHold, setUpdatingHold] = useState(false)

  const {
    loading,
    error,
    product,
    hasAccess,
    storeRoute,
    colorOptions,
    sizeOptions,
    selectedColor,
    selectedSize,
    selectedVariant,
    onSelectColor,
    onSelectSize,
    totalStock,
    exactStockRows,
    reviews,
    reviewsLoading,
    reviewsError,
    canLoadMoreReviews,
    onLoadMoreReviews,
    refreshProduct,
  } = useSellerStoreProductPreviewPage()

  if (!hasAccess) {
    return (
      <div className="mx-auto w-full max-w-[1024px] px-md py-xl">
        <Alert variant="warning">This preview is available only for your own product.</Alert>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  if (error) {
    return <div className="mx-auto w-full max-w-[1024px] px-md py-xl"><Alert>{error}</Alert></div>
  }

  if (!product) {
    return <div className="mx-auto w-full max-w-[1024px] px-md py-xl"><Alert>Product not found.</Alert></div>
  }

  const productStatus = String(product?.status || '').toLowerCase()
  const isHeldProduct = productStatus === 'held'
  const holdSource = String(product?.holdInfo?.source || '').toLowerCase()
  const heldByAdmin = isHeldProduct && holdSource === 'admin'
  const heldBySeller = isHeldProduct && holdSource === 'seller'

  const editProductRoute = ROUTES.SELLER_PUBLIC_STORE_EDIT_PRODUCT
    .replace(':sellerId', String(sellerId || ''))
    .replace(':id', String(product?._id || ''))

  const holdReasonMessage = isHeldProduct
    ? (product?.holdInfo?.message || (
      holdSource === 'account_deletion'
        ? 'This product is held because your account deletion request is in progress.'
        : holdSource === 'account_block'
          ? 'This product is held because your seller account is currently blocked.'
          : 'This product is currently held and unavailable in public listings.'
    ))
    : ''

  const holdSourceLabel = holdSource === 'admin'
    ? 'Admin Hold'
    : holdSource === 'account_deletion'
      ? 'Account Deletion Hold'
      : holdSource === 'account_block'
        ? 'Account Block Hold'
        : 'System Hold'

  const holdTitle = holdSource === 'account_deletion'
    ? 'Product is held due to account deletion request'
    : holdSource === 'account_block'
      ? 'Product is held because the seller account is blocked'
      : holdSource === 'admin'
        ? 'Product is held by admin review'
        : 'Product is currently on hold'

  const holdHelperText = holdSource === 'account_deletion'
    ? 'This hold prevents new purchases while your account deletion process is active.'
    : holdSource === 'account_block'
      ? 'This hold remains until account restrictions are resolved.'
      : holdSource === 'admin'
        ? 'You can edit or delete this product to correct issues and relist later.'
        : 'This product is temporarily unavailable for public purchase.'

  const handleDeleteProduct = async () => {
    if (!product?._id || deleting) return
    const allowed = window.confirm('Delete this product permanently? This action cannot be undone.')
    if (!allowed) return

    setDeleting(true)
    try {
      await deleteSellerProduct(product._id)
      pushToast({ type: 'success', title: 'Product deleted', message: 'The product was removed from your store.' })
      navigate(storeRoute, { replace: true })
    } catch {
      pushToast({ type: 'danger', title: 'Delete failed', message: 'Could not delete this product right now.' })
    } finally {
      setDeleting(false)
    }
  }

  const handleHoldProduct = async () => {
    if (!product?._id || updatingHold) return
    const allowed = window.confirm('Put this product on hold? It will be hidden from public listing.')
    if (!allowed) return

    setUpdatingHold(true)
    try {
      await holdSellerProduct(product._id, 'Held by seller')
      pushToast({ type: 'success', title: 'Product held', message: 'The product was put on hold successfully.' })
      await refreshProduct()
    } catch {
      pushToast({ type: 'danger', title: 'Hold failed', message: 'Could not hold this product right now.' })
    } finally {
      setUpdatingHold(false)
    }
  }

  const handleUnholdProduct = async () => {
    if (!product?._id || updatingHold) return
    const allowed = window.confirm('Unhold this product and make it active again?')
    if (!allowed) return

    setUpdatingHold(true)
    try {
      await unholdSellerProduct(product._id)
      pushToast({ type: 'success', title: 'Product unheld', message: 'The product is active again.' })
      await refreshProduct()
    } catch {
      pushToast({ type: 'danger', title: 'Unhold failed', message: 'Could not unhold this product right now.' })
    } finally {
      setUpdatingHold(false)
    }
  }

  if (isHeldProduct) {
    return (
      <div className="space-y-md">
        <SellerProductPreviewHeader storeRoute={storeRoute} />

        <div className="flex min-h-[60vh] items-center justify-center px-xs">
          <Card className="w-full max-w-[760px] space-y-md border border-warning/45 bg-warning-soft p-lg shadow-card">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">{holdSourceLabel}</p>
              <h2 className="text-2xl font-semibold text-warning">{holdTitle}</h2>
              <p className="text-sm text-warning">{holdReasonMessage}</p>
              <p className="text-sm text-text-secondary">{holdHelperText}</p>
            </div>

            <div className="rounded-lg border border-warning/40 bg-surface-elevated p-md">
              <p className="text-sm text-text-secondary">Product</p>
              <p className="text-base font-semibold text-text-primary">{product?.name || 'Untitled product'}</p>
            </div>

            {heldByAdmin ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button as={Link} to={editProductRoute} variant="secondary" size="sm">Edit product</Button>
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteProduct}>Delete product</Button>
              </div>
            ) : heldBySeller ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="secondary" size="sm" loading={updatingHold} onClick={handleUnholdProduct}>Unhold product</Button>
                <Button as={Link} to={editProductRoute} variant="secondary" size="sm">Edit product</Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button as={Link} to={storeRoute} variant="secondary" size="sm">Back to store products</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-md">
        <SellerProductPreviewHeader storeRoute={storeRoute} />

        <section className="rounded-xl border border-warning/45 bg-warning-soft p-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-warning">Seller actions</p>
            <div className="flex items-center gap-2">
              <Button as={Link} to={editProductRoute} variant="secondary" size="sm">Edit product</Button>
              <Button variant="ghost" size="sm" loading={updatingHold} onClick={handleHoldProduct}>Hold product</Button>
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteProduct}>Delete product</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-lg lg:grid-cols-[1fr,1fr]">
          <ProductImageGallery product={product} selectedColorName={selectedColor} />

          <div id="seller-preview-action-panel">
            <ProductPurchasePanel
            product={product}
            selectedVariant={selectedVariant}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            colorOptions={colorOptions}
            sizeOptions={sizeOptions}
            quantity={quantity}
            setQuantity={setQuantity}
            onSelectColor={onSelectColor}
            onSelectSize={onSelectSize}
            onAddToCart={() => {}}
            onBuyNow={() => {}}
            onToggleWishlist={() => {}}
            isWishlisted={false}
            isLoggedIn={isLoggedIn}
            user={user}
            showManageProductButton={false}
            />
          </div>
        </section>

        <SellerVariantStockTable rows={exactStockRows} totalStock={totalStock} />

        <ProductTabsSection
          product={product}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          canLoadMoreReviews={canLoadMoreReviews}
          onLoadMoreReviews={onLoadMoreReviews}
          includeReviews={false}
        />

        <SellerProductReviewList
          reviews={reviews}
          totalReviews={Number(product?.totalReviews || 0)}
          averageRating={Number(product?.avgRating || 0)}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          canLoadMoreReviews={canLoadMoreReviews}
          onLoadMoreReviews={onLoadMoreReviews}
        />

        <Card className="space-y-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-muted">Seller-only inventory insight</h3>
          <p className="text-sm text-text-secondary">
            Total stock across all variants: <span className="font-semibold text-text-primary">{totalStock} units</span>
          </p>
          <p className="text-sm text-text-secondary">
            Selected variant stock: <span className="font-semibold text-text-primary">{Number(selectedVariant?.stock || 0)} units</span>
          </p>
        </Card>
    </div>
  )
}
