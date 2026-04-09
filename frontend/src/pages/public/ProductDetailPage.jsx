import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Spinner } from '@/shared/ui'
import useAuthStore from '@/features/auth/authSlice'
import useUIStore from '@/shared/uiSlice'
import useProductDetail from '@/features/products/hooks/useProductDetail'
import useProductReviews from '@/features/products/hooks/useProductReviews'
import useProducts from '@/features/products/hooks/useProducts'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import useCart from '@/features/cart/hooks/useCart'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/app'
import ProductImageGallery from '@/features/products/components/organisms/ProductImageGallery'
import ProductPurchasePanel from '@/features/products/components/organisms/ProductPurchasePanel'
import ProductTabsSection from '@/features/products/components/organisms/ProductTabsSection'
import SimilarProductsSection from '@/features/products/components/organisms/SimilarProductsSection'
import MobileStickyCartBar from '@/features/products/components/organisms/MobileStickyCartBar'
import { getVariantPricing } from '@/features/products/utils/productBrowse.utils'

const getColorOptions = (variants = []) => {
  const map = new Map()

  variants.forEach((variant) => {
    const key = variant?.colorName
    if (!key) return

    const stock = Number(variant?.stock || 0)
    const existing = map.get(key)

    if (existing) {
      existing.totalStock += stock
      if (stock > existing.maxStock) existing.maxStock = stock
    } else {
      map.set(key, {
        colorName: key,
        colorCode: variant?.colorCode,
        totalStock: stock,
        maxStock: stock,
      })
    }
  })

  return Array.from(map.values()).map((item) => {
    const inStock = item.maxStock > 0
    let stockLabel = 'Out of Stock'

    if (item.maxStock > 5) stockLabel = 'In Stock'
    else if (item.maxStock > 0) stockLabel = 'Low Stock'

    return {
      ...item,
      inStock,
      stockLabel,
    }
  })
}

const getAvailableSizes = (variants = [], colorName = '') => {
  return variants
    .filter((variant) => variant?.colorName === colorName)
    .map((variant) => ({
      size: variant?.size,
      stock: Number(variant?.stock || 0),
      variant,
    }))
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { product, loading, error } = useProductDetail(id)

  const [reviewsLimit, setReviewsLimit] = useState(5)
  const {
    reviews,
    pagination: reviewPagination,
    loading: reviewsLoading,
    error: reviewsError,
  } = useProductReviews({ productId: id, page: 1, limit: reviewsLimit })

  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const user = useAuthStore((state) => state.user)
  const pushToast = useUIStore((state) => state.pushToast)

  const {
    products: wishlistProducts,
    refresh: refreshWishlist,
    add: addWishlist,
    remove: removeWishlist,
  } = useWishlist()
  const { addItem } = useCart()

  const variants = useMemo(() => product?.variants || [], [product])
  const colorOptions = useMemo(() => getColorOptions(variants), [variants])

  const resolvedColor = useMemo(() => {
    if (selectedColor && colorOptions.some((item) => item.colorName === selectedColor)) return selectedColor
    return colorOptions[0]?.colorName || ''
  }, [colorOptions, selectedColor])

  const sizeOptions = useMemo(() => getAvailableSizes(variants, resolvedColor), [resolvedColor, variants])

  const resolvedSize = useMemo(() => {
    if (selectedSize && sizeOptions.some((item) => item.size === selectedSize)) return selectedSize
    const inStock = sizeOptions.find((item) => item.stock > 0)
    return inStock?.size || sizeOptions[0]?.size || ''
  }, [selectedSize, sizeOptions])

  const selectedVariant = useMemo(() => {
    const exact = variants.find((variant) => variant?.colorName === resolvedColor && variant?.size === resolvedSize)
    if (exact) return exact

    const byColor = variants.find((variant) => variant?.colorName === resolvedColor)
    return byColor || variants[0] || null
  }, [resolvedColor, resolvedSize, variants])

  const selectedPricing = useMemo(() => getVariantPricing(selectedVariant), [selectedVariant])

  const similarQuery = useMemo(() => {
    if (!product?._id) return { page: 1, limit: 8, sort: 'relevance' }

    return {
      page: 1,
      limit: 8,
      sort: 'relevance',
      category: String(product?.categoryId?._id || product?.categoryId || ''),
      gender: product?.gender ? String(product.gender).toLowerCase() : '',
    }
  }, [product])

  const { products: similarProductsResponse } = useProducts(similarQuery)

  const similarProducts = useMemo(() => {
    const list = Array.isArray(similarProductsResponse)
      ? similarProductsResponse
      : similarProductsResponse?.products || similarProductsResponse?.items || []

    return list
      .filter((item) => String(item?._id) !== String(product?._id))
      .slice(0, 8)
  }, [product?._id, similarProductsResponse])

  const wishlistedIds = useMemo(() => {
    return (wishlistProducts || []).map((item) => String(item.productId))
  }, [wishlistProducts])

  const isWishlisted = wishlistedIds.includes(String(product?._id || ''))

  useEffect(() => {
    if (!isLoggedIn || user?.role !== ROLES.CUSTOMER) return
    refreshWishlist().catch(() => {})
  }, [isLoggedIn, refreshWishlist, user?.role])

  const canLoadMoreReviews = Number(reviewPagination?.total || 0) > reviews.length

  const handleSelectColor = (colorName) => {
    setSelectedColor(colorName)
    setSelectedSize('')
  }

  const handleToggleWishlist = async (targetProduct = product) => {
    if (!isLoggedIn) {
      navigate(ROUTES.LOGIN)
      return
    }

    if (user?.role !== ROLES.CUSTOMER) {
      pushToast({ type: 'warning', title: 'Customer only', message: 'Only customers can use wishlist.' })
      return
    }

    const productId = targetProduct?._id
    if (!productId) return

    try {
      if (wishlistedIds.includes(String(productId))) {
        await removeWishlist(productId)
        pushToast({ type: 'info', title: 'Wishlist updated', message: 'Removed from wishlist.' })
      } else {
        await addWishlist(productId)
        pushToast({ type: 'success', title: 'Wishlist updated', message: 'Added to wishlist.' })
      }
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not update wishlist right now.' })
    }
  }

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate(ROUTES.LOGIN)
      return
    }

    if (user?.role !== ROLES.CUSTOMER) {
      pushToast({ type: 'warning', title: 'Customer only', message: 'Only customers can purchase products.' })
      return
    }

    if (!selectedVariant?._id || !product?._id || Number(selectedVariant?.stock || 0) <= 0) return

    try {
      await addItem({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
      })
      pushToast({ type: 'success', title: 'Added to cart', message: 'Product added to your cart.' })
    } catch {
      pushToast({ type: 'danger', title: 'Could not add', message: 'Please try again in a moment.' })
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate(ROUTES.CHECKOUT)
  }

  if (loading) {
    return <div className="page-shell flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  if (error) {
    return <div className="page-shell"><Alert>{error}</Alert></div>
  }

  if (!product) {
    return <div className="page-shell"><Alert>Product not found or has been removed.</Alert></div>
  }

  const isUnavailable = ['held', 'removed'].includes(product?.status)
  const isAdmin = user?.role === ROLES.ADMIN

  if (isUnavailable && !isAdmin) {
    return <div className="page-shell"><Alert>Product not found or has been removed.</Alert></div>
  }

  return (
    <div className="page-shell space-y-lg pb-2xl">
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to={ROUTES.PRODUCTS} className="hover:text-primary">Products</Link>
        {product?.categoryId?.name ? (
          <>
            <span>/</span>
            <Link to={`${ROUTES.PRODUCTS}?category=${product.categoryId._id}`} className="hover:text-primary">{product.categoryId.name}</Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-text-secondary">{product?.name}</span>
      </nav>

      <section className="grid gap-lg lg:grid-cols-[1fr,1fr]">
        <ProductImageGallery product={product} selectedColorName={resolvedColor} />

        <div id="product-action-panel">
          <ProductPurchasePanel
            product={product}
            selectedVariant={selectedVariant}
            selectedColor={resolvedColor}
            selectedSize={resolvedSize}
            colorOptions={colorOptions}
            sizeOptions={sizeOptions}
            quantity={quantity}
            setQuantity={setQuantity}
            onSelectColor={handleSelectColor}
            onSelectSize={setSelectedSize}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={() => handleToggleWishlist(product)}
            isWishlisted={isWishlisted}
            isLoggedIn={isLoggedIn}
            user={user}
          />
        </div>
      </section>

      <ProductTabsSection
        product={product}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        reviewsError={reviewsError}
        canLoadMoreReviews={canLoadMoreReviews}
        onLoadMoreReviews={() => setReviewsLimit((prev) => prev + 5)}
      />

      {product?.sellerId ? (
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">Seller Info</h2>
          <p className="text-sm text-text-secondary">Sold by: {[product?.sellerId?.firstName, product?.sellerId?.lastName].filter(Boolean).join(' ') || 'WearWeb Seller'}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>Visit Seller Store</Button>
            <Button variant="secondary" size="sm" disabled>Contact Seller</Button>
          </div>
        </Card>
      ) : null}

      <SimilarProductsSection
        products={similarProducts}
        onToggleWishlist={handleToggleWishlist}
        wishlistedIds={wishlistedIds}
      />

      <MobileStickyCartBar
        anchorId="product-action-panel"
        visiblePrice={selectedPricing.effective}
        disabled={Number(selectedVariant?.stock || 0) <= 0 || user?.role !== ROLES.CUSTOMER}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  )
}
