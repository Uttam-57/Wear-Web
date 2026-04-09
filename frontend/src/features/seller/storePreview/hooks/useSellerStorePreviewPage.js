import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '@/features/auth/authSlice'
import useSellerProfile from '@/features/user/hooks/useSellerProfile'
import useCategoryTree from '@/features/category/hooks/useCategoryTree'
import useAsync from '@/shared/hooks/useAsync'
import { ROUTES } from '@/shared/constants/routes'
import { listSellerStorePreviewProducts } from '@/features/seller/storePreview/api/storePreview.api'
import {
  buildStoreSummary,
  decorateStoreProducts,
  getStoreInitials,
} from '@/features/seller/storePreview/utils/storePreview.utils'

const PAGE_SIZE = 12

const STATUS_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'active', label: 'Active products' },
  { value: 'held', label: 'Held products' },
  { value: 'stock-alert', label: 'Stock less than 10' },
  { value: 'out-of-stock', label: 'Out of stock' },
]

const SORT_OPTIONS = [
  { value: 'stock-alert-first', label: 'Stock alert first' },
  { value: 'active-first', label: 'Active first' },
  { value: 'held-first', label: 'Held first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

const joinLocation = (...parts) => {
  return parts.map((value) => String(value || '').trim()).filter(Boolean).join(', ')
}

const flattenCategoryMap = (categories = []) => {
  const map = {}

  const walk = (node) => {
    if (!node?._id) return
    map[node._id] = node
    ;(node.children || []).forEach(walk)
  }

  categories.forEach(walk)
  return map
}

const toTitleCase = (value = '') => {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getCategoryId = (product) => String(product?.categoryId?._id || product?.categoryId || '')

const getGenderValue = (product) => String(product?.gender || '').toLowerCase()

const getBrandValue = (product) => String(product?.brand || '').trim().toLowerCase()

const getCreatedTime = (product) => new Date(product?.createdAt || 0).getTime()

const getStatusValue = (product) => String(product?.status || '').toLowerCase()

const getVariants = (product) => Array.isArray(product?.variants) ? product.variants : []

const isStockAlert = (product) => {
  return getVariants(product).some((variant) => {
    const stock = Number(variant?.stock || 0)
    return stock > 0 && stock < 10
  })
}

const isOutOfStock = (product) => {
  const total = getVariants(product).reduce((sum, variant) => sum + Number(variant?.stock || 0), 0)
  return total <= 0
}

const sortProducts = (products, sortBy) => {
  const list = [...products]

  if (sortBy === 'active-first') {
    return list.sort((a, b) => {
      const aRank = getStatusValue(a) === 'active' ? 0 : 1
      const bRank = getStatusValue(b) === 'active' ? 0 : 1
      if (aRank !== bRank) return aRank - bRank
      return getCreatedTime(b) - getCreatedTime(a)
    })
  }

  if (sortBy === 'held-first') {
    return list.sort((a, b) => {
      const aRank = getStatusValue(a) === 'held' ? 0 : 1
      const bRank = getStatusValue(b) === 'held' ? 0 : 1
      if (aRank !== bRank) return aRank - bRank
      return getCreatedTime(b) - getCreatedTime(a)
    })
  }

  if (sortBy === 'stock-alert-first') {
    return list.sort((a, b) => {
      const aRank = isStockAlert(a) ? 0 : 1
      const bRank = isStockAlert(b) ? 0 : 1
      if (aRank !== bRank) return aRank - bRank
      return getCreatedTime(b) - getCreatedTime(a)
    })
  }

  if (sortBy === 'oldest') {
    return list.sort((a, b) => getCreatedTime(a) - getCreatedTime(b))
  }

  return list.sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
}

export default function useSellerStorePreviewPage() {
  const navigate = useNavigate()
  const { sellerId } = useParams()

  const user = useAuthStore((state) => state.user)
  const { categories } = useCategoryTree()

  const { sellerProfile, refresh: refreshSellerProfile } = useSellerProfile()

  const {
    data,
    loading,
    error,
    run,
  } = useAsync({ products: [], total: 0, page: 1, limit: 1 })

  const routeSellerId = String(sellerId || '')
  const authSellerId = String(user?._id || '')
  const isOwnerPreview = Boolean(routeSellerId) && (!authSellerId || routeSellerId === authSellerId)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSort, setSelectedSort] = useState('stock-alert-first')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  const refreshProducts = useCallback(() => {
    return run(() => listSellerStorePreviewProducts({ page: 1, limit: 250 }))
  }, [run])

  useEffect(() => {
    if (!isOwnerPreview) return
    refreshSellerProfile().catch(() => {})
    refreshProducts().catch(() => {})
  }, [isOwnerPreview, refreshProducts, refreshSellerProfile])

  const decoratedProducts = useMemo(() => {
    return decorateStoreProducts(data?.products || [])
  }, [data?.products])

  const summary = useMemo(() => buildStoreSummary(decoratedProducts), [decoratedProducts])
  const categoryMap = useMemo(() => flattenCategoryMap(categories), [categories])

  const list = useMemo(() => {
    const filtered = decoratedProducts.filter((product) => {
      if (selectedCategory && getCategoryId(product) !== selectedCategory) return false
      if (selectedGender && getGenderValue(product) !== selectedGender) return false
      if (selectedBrand && getBrandValue(product) !== selectedBrand) return false

      if (selectedStatus === 'active' && getStatusValue(product) !== 'active') return false
      if (selectedStatus === 'held' && getStatusValue(product) !== 'held') return false
      if (selectedStatus === 'stock-alert' && !isStockAlert(product)) return false
      if (selectedStatus === 'out-of-stock' && !isOutOfStock(product)) return false

      return true
    })

    return sortProducts(filtered, selectedSort)
  }, [
    decoratedProducts,
    selectedBrand,
    selectedCategory,
    selectedGender,
    selectedSort,
    selectedStatus,
  ])

  const totalProducts = list.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage)
  }, [currentPage, page])

  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return list.slice(start, start + PAGE_SIZE)
  }, [currentPage, list])

  const categoryOptions = useMemo(() => {
    const counts = new Map()
    decoratedProducts.forEach((product) => {
      const id = getCategoryId(product)
      if (!id) return
      counts.set(id, (counts.get(id) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        label: categoryMap[value]?.name || value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [categoryMap, decoratedProducts])

  const genderOptions = useMemo(() => {
    const counts = new Map()
    decoratedProducts.forEach((product) => {
      const value = getGenderValue(product)
      if (!value) return
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, label: toTitleCase(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [decoratedProducts])

  const brandOptions = useMemo(() => {
    const counts = new Map()
    decoratedProducts.forEach((product) => {
      const value = getBrandValue(product)
      if (!value) return
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, label: toTitleCase(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [decoratedProducts])

  const resetFilters = () => {
    setSelectedCategory('')
    setSelectedGender('')
    setSelectedBrand('')
    setSelectedStatus('all')
    setSelectedSort('stock-alert-first')
    setPage(1)
  }

  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    setPage(1)
  }

  const handleGenderChange = (value) => {
    setSelectedGender(value)
    setPage(1)
  }

  const handleBrandChange = (value) => {
    setSelectedBrand(value)
    setPage(1)
  }

  const handleStatusChange = (value) => {
    setSelectedStatus(value)
    setPage(1)
  }

  const handleSortChange = (value) => {
    setSelectedSort(value)
    setPage(1)
  }

  const handleViewChange = (value) => setView(value)

  const handlePageChange = (nextPage) => setPage(nextPage)

  const storeName = sellerProfile?.companyName
    || user?.storeName
    || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    || 'Seller Store'

  const location = joinLocation(
    sellerProfile?.address?.city,
    sellerProfile?.address?.state,
    sellerProfile?.address?.country || 'India'
  )

  const subtitle = sellerProfile?.businessDescription
    || `Premium performance apparel${location ? ` - ${location}` : ''}`

  return {
    loading,
    error,
    isOwnerPreview,
    storeName,
    storeInitials: getStoreInitials(storeName),
    subtitle,
    location,
    summary,
    categoryOptions,
    genderOptions,
    brandOptions,
    statusOptions: STATUS_OPTIONS,
    sortOptions: SORT_OPTIONS,
    selectedCategory,
    selectedGender,
    selectedBrand,
    selectedStatus,
    selectedSort,
    view,
    onCategoryChange: handleCategoryChange,
    onGenderChange: handleGenderChange,
    onBrandChange: handleBrandChange,
    onStatusChange: handleStatusChange,
    onSortChange: handleSortChange,
    onViewChange: handleViewChange,
    onResetFilters: resetFilters,
    list: pagedList,
    totalProducts,
    totalPages,
    page: currentPage,
    onPageChange: handlePageChange,
    onEditStoreInfo: () => navigate(ROUTES.SELLER_PROFILE),
  }
}
