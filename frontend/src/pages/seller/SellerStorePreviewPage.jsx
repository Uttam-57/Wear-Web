import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Card, Pagination, Spinner } from '@/shared/ui'
import useSellerStorePreviewPage from '@/features/seller/storePreview/hooks/useSellerStorePreviewPage'
import SellerStoreSummaryHeader from '@/features/seller/storePreview/components/SellerStoreSummaryHeader'
import SellerStoreFiltersBar from '@/features/seller/storePreview/components/SellerStoreFiltersBar'
import ProductCard from '@/features/products/components/molecules/ProductCard'
import { ROUTES } from '@/shared/constants/routes'

export default function SellerStorePreviewPage() {
  const { sellerId } = useParams()

  const {
    loading,
    error,
    isOwnerPreview,
    storeName,
    storeInitials,
    subtitle,
    summary,
    categoryOptions,
    genderOptions,
    brandOptions,
    statusOptions,
    sortOptions,
    selectedCategory,
    selectedGender,
    selectedBrand,
    selectedStatus,
    selectedSort,
    onCategoryChange,
    onGenderChange,
    onBrandChange,
    onStatusChange,
    onSortChange,
    onViewChange,
    onResetFilters,
    list,
    totalProducts,
    totalPages,
    view,
    page,
    onPageChange,
    onEditStoreInfo,
  } = useSellerStorePreviewPage()

  if (!isOwnerPreview) {
    return (
      <div className="mx-auto w-full max-w-[1024px] px-md py-xl">
        <Alert variant="warning">This seller preview is available only for your own store.</Alert>
      </div>
    )
  }

  const toDetailRoute = (productId) => {
    return ROUTES.SELLER_PUBLIC_STORE_PRODUCT
      .replace(':sellerId', String(sellerId || ''))
      .replace(':id', String(productId || ''))
  }

  const addProductRoute = ROUTES.SELLER_PUBLIC_STORE_ADD_PRODUCT
    .replace(':sellerId', String(sellerId || ''))

  const buildStatusBadges = (product) => {
    const badges = []
    const status = String(product?.status || '').toLowerCase()

    if (status === 'active') badges.push({ label: 'Active', variant: 'success' })
    if (status === 'held') badges.push({ label: 'Held', variant: 'warning' })

    const hasStockAlert = Array.isArray(product?.variants)
      && product.variants.some((variant) => {
        const stock = Number(variant?.stock || 0)
        return stock > 0 && stock < 10
      })

    if (status !== 'held' && hasStockAlert) badges.push({ label: 'Stock Alert', variant: 'warning' })

    return badges
  }

  return (
    <div className="space-y-md">
        <SellerStoreSummaryHeader
          storeInitials={storeInitials}
          storeName={storeName}
          subtitle={subtitle}
          summary={summary}
          onEditStoreInfo={onEditStoreInfo}
        />

        <div className="flex flex-wrap items-start justify-between gap-sm">
          <div>
            <h2 className="section-title">Product Card Preview</h2>
            <p className="section-subtitle">Seller-focused filters for status, stock alerts, and merchandising checks.</p>
          </div>

          <Button as={Link} to={addProductRoute} variant="secondary" size="sm">
            + Add New Product
          </Button>
        </div>

        <SellerStoreFiltersBar
          categoryOptions={categoryOptions}
          genderOptions={genderOptions}
          brandOptions={brandOptions}
          statusOptions={statusOptions}
          sortOptions={sortOptions}
          selectedCategory={selectedCategory}
          selectedGender={selectedGender}
          selectedBrand={selectedBrand}
          selectedStatus={selectedStatus}
          selectedSort={selectedSort}
          view={view}
          onCategoryChange={onCategoryChange}
          onGenderChange={onGenderChange}
          onBrandChange={onBrandChange}
          onStatusChange={onStatusChange}
          onSortChange={onSortChange}
          onViewChange={onViewChange}
          onReset={onResetFilters}
        />

        {loading ? (
          <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
        ) : error ? (
          <Card className="border-danger bg-danger-soft text-sm text-danger">{error}</Card>
        ) : list.length === 0 ? (
          <Card className="space-y-sm p-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-text-muted">0</div>
            <h2 className="text-lg font-semibold text-text-primary">No products found matching current seller filters</h2>
            <div>
              <Button onClick={onResetFilters}>Reset Filters</Button>
            </div>
          </Card>
        ) : (
          <>
            <div className={view === 'list' ? 'space-y-sm' : 'grid gap-md sm:grid-cols-2 xl:grid-cols-4'}>
              {list.map((product) => {
                return (
                <ProductCard
                  key={product._id}
                  product={product}
                  view={view === 'list' ? 'list' : 'grid'}
                  showWishlist={false}
                  showAddToCart={false}
                  detailTo={toDetailRoute(product._id)}
                  statusBadges={buildStatusBadges(product)}
                />
                )
              })}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
    </div>
  )
}
