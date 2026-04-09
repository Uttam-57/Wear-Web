import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, listSellerProducts } from '@/features/products/api/products.api'
import useAuth from '@/features/auth/hooks/useAuth'
import useCart from '@/features/cart/hooks/useCart'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import useCategoryTree from '@/features/category/hooks/useCategoryTree'
import useUIStore from '@/shared/uiSlice'
import { ROUTES } from '@/shared/constants/routes'
import { CATEGORY_FALLBACKS, HERO_SLIDES } from '@/features/home/constants/homePage.constants'
import { buildCategoryTree, getCategoryImage, getProductDiscount, toProductList } from '@/features/home/utils/homePage.utils'

const HOME_SECTION_ERROR = 'Unable to load homepage highlights right now. Please refresh in a moment.'

const useHomePageData = () => {
  const navigate = useNavigate()
  const { categories, loading: categoriesLoading } = useCategoryTree()
  const { isCustomer, isSeller } = useAuth()
  const { addItem } = useCart()
  const {
    products: wishlistProducts,
    refresh: refreshWishlist,
    add: addWishlist,
    remove: removeWishlist,
  } = useWishlist()
  const pushToast = useUIStore((state) => state.pushToast)

  const [newArrivals, setNewArrivals] = useState([])
  const [trendingNow, setTrendingNow] = useState([])
  const [hotDeals, setHotDeals] = useState([])
  const [sellerRecentProducts, setSellerRecentProducts] = useState([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sectionsError, setSectionsError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isCustomer) return
    refreshWishlist().catch(() => {})
  }, [isCustomer, refreshWishlist])

  useEffect(() => {
    let mounted = true

    const loadSections = async () => {
      setSectionsLoading(true)
      setSectionsError('')

      try {
        const arrivalsPromise = getProducts({ sortBy: 'arrival', limit: 8, page: 1 })
        const trendingPromise = getProducts({ sortBy: 'rating', limit: 8, page: 1 })
        const dealsPoolPromise = getProducts({ sortBy: 'arrival', limit: 24, page: 1 })
        const sellerRecentPromise = isSeller
          ? listSellerProducts({ sortBy: 'newest', limit: 5, page: 1 })
          : Promise.resolve([])

        const [arrivalsResult, trendingResult, dealsPoolResult, sellerResult] = await Promise.allSettled([
          arrivalsPromise,
          trendingPromise,
          dealsPoolPromise,
          sellerRecentPromise,
        ])

        if (!mounted) return

        const arrivalsPayload = arrivalsResult.status === 'fulfilled' ? arrivalsResult.value : { products: [] }
        const trendingPayload = trendingResult.status === 'fulfilled' ? trendingResult.value : { products: [] }
        const dealsPoolPayload = dealsPoolResult.status === 'fulfilled' ? dealsPoolResult.value : { products: [] }
        const sellerPayload = sellerResult.status === 'fulfilled' ? sellerResult.value : []

        const arrivalsList = toProductList(arrivalsPayload).slice(0, 8)
        const trendingList = toProductList(trendingPayload).slice(0, 8)
        const dealsPoolList = toProductList(dealsPoolPayload)
        const fallbackTrending = [...arrivalsList].sort((a, b) => Number(b?.totalReviews || 0) - Number(a?.totalReviews || 0))

        setNewArrivals(arrivalsList)
        setTrendingNow(trendingList.length ? trendingList : fallbackTrending)
        setHotDeals(
          dealsPoolList
            .map((product) => ({ ...product, __maxDiscount: getProductDiscount(product) }))
            .filter((product) => product.__maxDiscount >= 20)
            .sort((a, b) => b.__maxDiscount - a.__maxDiscount)
            .slice(0, 12)
            .map((product) => {
              const normalized = { ...product }
              delete normalized.__maxDiscount
              return normalized
            })
        )
        setSellerRecentProducts(toProductList(sellerPayload).slice(0, 5))

        if (!arrivalsList.length && !trendingList.length && !dealsPoolList.length) {
          setSectionsError(HOME_SECTION_ERROR)
        }
      } catch {
        if (!mounted) return
        setSectionsError(HOME_SECTION_ERROR)
      } finally {
        if (mounted) setSectionsLoading(false)
      }
    }

    loadSections()

    return () => {
      mounted = false
    }
  }, [isSeller])

  const categoryRoots = useMemo(() => {
    return buildCategoryTree(categories || [])
  }, [categories])

  const quickCategoryCards = useMemo(() => {
    if (categoryRoots.length) {
      return categoryRoots.slice(0, 8).map((category) => ({
        id: category._id,
        name: category.name,
        image: getCategoryImage(category),
        imageAdjust: category?.imageAdjust || null,
        link: `${ROUTES.PRODUCTS}?categoryId=${category._id}`,
      }))
    }

    return CATEGORY_FALLBACKS.map((category) => ({
      id: category.id,
      name: category.name,
      image: '',
      imageAdjust: null,
      link: `${ROUTES.PRODUCTS}?q=${encodeURIComponent(category.query)}`,
    }))
  }, [categoryRoots])

  const wishlistSet = useMemo(() => {
    return new Set((wishlistProducts || []).map((item) => item.productId))
  }, [wishlistProducts])

  const defaultHeroAction = isSeller
    ? { label: 'Manage Your Products', to: ROUTES.SELLER_PRODUCTS }
    : { label: 'Shop Men', to: `${ROUTES.PRODUCTS}?gender=men` }

  const requireLogin = () => {
    navigate(ROUTES.LOGIN)
  }

  const handleWishlistToggle = async (product) => {
    if (!isCustomer) {
      requireLogin()
      return
    }

    try {
      if (wishlistSet.has(product._id)) {
        await removeWishlist(product._id)
        pushToast({ type: 'info', title: 'Wishlist updated', message: 'Product removed from your wishlist.' })
      } else {
        await addWishlist(product._id)
        pushToast({ type: 'success', title: 'Wishlist updated', message: 'Product added to your wishlist.' })
      }
    } catch {
      pushToast({ type: 'danger', title: 'Wishlist failed', message: 'Please try again in a moment.' })
    }
  }

  const handleAddToCart = async (product, variant) => {
    if (!isCustomer) {
      requireLogin()
      return
    }

    if (!variant?._id) return

    try {
      await addItem({
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
      })
      pushToast({ type: 'success', title: 'Added to cart', message: 'Item is ready in your cart.' })
    } catch {
      pushToast({ type: 'danger', title: 'Cart update failed', message: 'Please try adding this item again.' })
    }
  }

  return {
    activeSlide,
    setActiveSlide,
    categoryRoots,
    categoriesLoading,
    defaultHeroAction,
    handleAddToCart,
    handleWishlistToggle,
    hotDeals,
    isCustomer,
    isSeller,
    newArrivals,
    quickCategoryCards,
    sectionsError,
    sectionsLoading,
    sellerRecentProducts,
    trendingNow,
    wishlistSet,
  }
}

export default useHomePageData
