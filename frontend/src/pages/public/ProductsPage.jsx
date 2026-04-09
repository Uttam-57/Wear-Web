import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Drawer, Pagination, Spinner } from '@/shared/ui'
import useAuthStore from '@/features/auth/authSlice'
import useUIStore from '@/shared/uiSlice'
import useProducts from '@/features/products/hooks/useProducts'
import useProductBrowseParams from '@/features/products/hooks/useProductBrowseParams'
import useCategoryTree from '@/features/category/hooks/useCategoryTree'
import useAsync from '@/shared/hooks/useAsync'
import useWishlist from '@/features/wishlist/hooks/useWishlist'
import useCart from '@/features/cart/hooks/useCart'
import { getPublicCategoryTemplate } from '@/features/category/api/category.api'
import ProductsFilterSidebar from '@/features/products/components/organisms/ProductsFilterSidebar'
import ProductsResultsHeader from '@/features/products/components/organisms/ProductsResultsHeader'
import ProductCard from '@/features/products/components/molecules/ProductCard'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/app'
import { collectUniqueValues, DEFAULT_VIEW, toTitleCase } from '@/features/products/utils/productBrowse.utils'
import {
  buildActiveFilterTokens,
  buildCategoryIndexes,
  buildSelectedCategoryScope,
  collectDescendantIds,
  collectLeafCategoryIds,
  filterCategoryTreeByIds,
  findRootCategoryId,
  flattenCategories,
  resolveAccessoryRootCategoryId,
} from '@/features/products/utils/productsPage.helpers'

const getVariantEffectivePrice = (variant) => {
  const price = Number(variant?.price || 0)
  const discount = Number(variant?.discount || 0)
  return price - (price * discount) / 100
}

const isActiveProduct = (product) => String(product?.status || 'active').toLowerCase() === 'active'

const ACCESSORY_NAV_TERMS = new Set(['accessory', 'accessories'])

const normalizeLookupText = (value = '') => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

export default function ProductsPage() {
  const navigate = useNavigate()
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const {
    data: categoryTemplate,
    loading: templateLoading,
    setData: setCategoryTemplate,
    run: runCategoryTemplate,
  } = useAsync(null, { cacheKey: 'public:products:category-template' })
  const {
    data: relatedCategoryTemplates,
    loading: relatedTemplateLoading,
    setData: setRelatedCategoryTemplates,
    run: runRelatedCategoryTemplates,
  } = useAsync([], { cacheKey: 'public:products:related-category-templates' })

  const pushToast = useUIStore((state) => state.pushToast)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const user = useAuthStore((state) => state.user)

  const {
    products: wishlistProducts,
    refresh: refreshWishlist,
    add: addWishlist,
    remove: removeWishlist,
  } = useWishlist()
  const { addItem } = useCart()

  const {
    state,
    queryForApi,
    upsertParams,
    clearAll,
    setArrayFilter,
    setSpecFilter,
    removeFilterToken,
  } = useProductBrowseParams()

  const selectedCategoryIds = useMemo(() => {
    if (Array.isArray(state.categoryIds)) return state.categoryIds
    if (state.category) return [state.category]
    return []
  }, [state.category, state.categoryIds])
  const primaryCategoryId = selectedCategoryIds[0] || ''

  const { categories } = useCategoryTree()
  const categoryMap = useMemo(() => flattenCategories(categories), [categories])
  const categoryIndexes = useMemo(() => buildCategoryIndexes(categories), [categories])

  const { products, loading, error } = useProducts(queryForApi)

  const rawList = useMemo(() => {
    if (Array.isArray(products)) return products.filter(isActiveProduct)
    if (Array.isArray(products?.products)) return products.products.filter(isActiveProduct)
    if (Array.isArray(products?.items)) return products.items.filter(isActiveProduct)
    return []
  }, [products])

  const selectedCategoryScope = useMemo(
    () => buildSelectedCategoryScope(selectedCategoryIds, categoryIndexes.childrenById, categoryIndexes.parentById),
    [categoryIndexes.childrenById, categoryIndexes.parentById, selectedCategoryIds]
  )

  const categoryScopedList = useMemo(() => {
    if (!selectedCategoryIds.length) return rawList

    return rawList.filter((product) => {
      const categoryId = String(product?.categoryId?._id || product?.categoryId || '')
      if (!categoryId) return false
      return selectedCategoryScope.has(categoryId)
    })
  }, [rawList, selectedCategoryIds.length, selectedCategoryScope])

  const hasLocalPostFilters = useMemo(() => {
    if (selectedCategoryIds.length > 1) return true
    if (state.gender.length > 1) return true
    if (state.baseColors.length > 1) return true
    if (state.sizes.length > 1) return true
    if (state.brands.length > 1) return true

    return Object.values(state.specs || {}).some((values) => Array.isArray(values) && values.length > 1)
  }, [selectedCategoryIds.length, state.baseColors.length, state.brands.length, state.gender.length, state.sizes.length, state.specs])

  const list = useMemo(() => {
    if (!hasLocalPostFilters) return rawList

    const selectedGenders = state.gender.map((item) => String(item).toLowerCase())
    const selectedColors = state.baseColors.map((item) => String(item).toLowerCase())
    const selectedSizes = state.sizes.map((item) => String(item).toLowerCase())
    const selectedBrands = state.brands.map((item) => String(item).toLowerCase())
    const minPrice = Number(state.minPrice || 0)
    const maxPrice = Number(state.maxPrice || 0)

    const discountThreshold = state.discount
      ? Number(String(state.discount).replace(/[^0-9]/g, ''))
      : 0

    return categoryScopedList.filter((product) => {
      if (selectedGenders.length) {
        const gender = String(product?.gender || '').toLowerCase()
        if (!selectedGenders.includes(gender)) return false
      }

      const variantEffectivePrices = (product?.variants || []).map(getVariantEffectivePrice)
      const lowestEffectivePrice = variantEffectivePrices.length ? Math.min(...variantEffectivePrices) : 0
      if (minPrice > 0 && lowestEffectivePrice < minPrice) return false
      if (maxPrice > 0 && lowestEffectivePrice > maxPrice) return false

      if (selectedColors.length) {
        const baseColors = (product?.variants || []).map((variant) => String(variant?.baseColor || '').toLowerCase())
        const matchesColor = selectedColors.some((color) => baseColors.includes(color))
        if (!matchesColor) return false
      }

      if (selectedSizes.length) {
        const sizes = (product?.variants || []).map((variant) => String(variant?.size || '').toLowerCase())
        const matchesSize = selectedSizes.some((size) => sizes.includes(size))
        if (!matchesSize) return false
      }

      if (selectedBrands.length) {
        const brand = String(product?.brand || '').toLowerCase()
        if (!selectedBrands.includes(brand)) return false
      }

      if (discountThreshold > 0) {
        const maxDiscount = Math.max(...(product?.variants || []).map((variant) => Number(variant?.discount || 0)), 0)
        if (maxDiscount < discountThreshold) return false
      }

      const specEntries = product?.specifications || []
      for (const [specKey, specValues] of Object.entries(state.specs || {})) {
        if (!specValues?.length) continue

        const found = specEntries.find((spec) => spec?.key === specKey)
        if (!found || !specValues.includes(found.value)) return false
      }

      return true
    })
  }, [categoryScopedList, hasLocalPostFilters, rawList, state.baseColors, state.brands, state.discount, state.gender, state.maxPrice, state.minPrice, state.sizes, state.specs])

  const paginationMeta = products?.pagination || {}
  const totalProducts = Number(paginationMeta.total || products?.total || list.length)
  const totalPages = Number(
    paginationMeta.totalPages
    || Math.max(1, Math.ceil(totalProducts / Math.max(1, Number(paginationMeta.limit || state.limit || 1))))
  )

  const activeCategoryName = selectedCategoryIds
    .map((categoryId) => categoryMap[categoryId]?.name)
    .filter(Boolean)
    .join(', ')
  const effectiveCategoryTemplate = useMemo(() => {
    if (!primaryCategoryId) return null

    const allFields = []
    ;(categoryTemplate?.specFields || []).forEach((field) => allFields.push(field))
    ;(relatedCategoryTemplates || []).forEach((template) => {
      ;(template?.specFields || []).forEach((field) => allFields.push(field))
    })

    if (!allFields.length) return null

    const specMap = new Map()
    allFields.forEach((field) => {
      const key = String(field?.key || '').trim()
      if (!key) return

      const existing = specMap.get(key)
      const options = Array.isArray(field?.filterOptions) ? field.filterOptions : []
      if (!existing) {
        specMap.set(key, {
          key,
          label: field?.label || toTitleCase(key),
          filterOptions: Array.from(new Set(options.filter(Boolean))),
        })
        return
      }

      existing.label = existing.label || field?.label || toTitleCase(key)
      existing.filterOptions = Array.from(new Set([...existing.filterOptions, ...options].filter(Boolean)))
    })

    return {
      specFields: Array.from(specMap.values()),
    }
  }, [categoryTemplate, primaryCategoryId, relatedCategoryTemplates])
  const restrictToRelevantFilters = Boolean(selectedCategoryIds.length > 0 || state.gender.length > 0 || state.search)
  const isTemplateLoading = templateLoading || relatedTemplateLoading

  const scopedCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return []

    const allowedIds = new Set()

    if (selectedCategoryIds.length > 0) {
      selectedCategoryIds.forEach((selectedId) => {
        const rootId = findRootCategoryId(selectedId, categoryIndexes.parentById)
        collectDescendantIds(rootId, categoryIndexes.childrenById).forEach((id) => allowedIds.add(id))

        let cursor = String(selectedId)
        while (cursor) {
          allowedIds.add(cursor)
          cursor = categoryIndexes.parentById.get(cursor)
        }
      })
    } else if (restrictToRelevantFilters) {
      const rootIds = new Set()

      rawList.forEach((product) => {
        const categoryId = String(product?.categoryId?._id || product?.categoryId || '')
        if (!categoryId) return

        const rootId = findRootCategoryId(categoryId, categoryIndexes.parentById)
        if (rootId) rootIds.add(rootId)
      })

      rootIds.forEach((rootId) => {
        collectDescendantIds(rootId, categoryIndexes.childrenById).forEach((id) => allowedIds.add(id))
      })
    }

    if (allowedIds.size === 0) return categories
    return filterCategoryTreeByIds(categories, allowedIds)
  }, [categories, categoryIndexes.childrenById, categoryIndexes.parentById, rawList, restrictToRelevantFilters, selectedCategoryIds])

  const metadata = useMemo(() => {
    const colorMap = new Map()
    categoryScopedList.forEach((product) => {
      ;(product?.variants || []).forEach((variant) => {
        if (!variant?.baseColor) return
        const existing = colorMap.get(variant.baseColor)
        if (existing) {
          existing.count += 1
          if (!existing.colorCode && variant.colorCode) existing.colorCode = variant.colorCode
        } else {
          colorMap.set(variant.baseColor, {
            value: variant.baseColor,
            colorCode: variant.colorCode,
            count: 1,
          })
        }
      })
    })

    const specValuesByKey = new Map()
    categoryScopedList.forEach((product) => {
      ;(product?.specifications || []).forEach((spec) => {
        const key = String(spec?.key || '').trim()
        const value = String(spec?.value || '').trim()
        if (!key || !value) return

        if (!specValuesByKey.has(key)) specValuesByKey.set(key, new Map())
        const bucket = specValuesByKey.get(key)
        bucket.set(value, (bucket.get(value) || 0) + 1)
      })
    })

    const specFieldMap = new Map()
    ;(effectiveCategoryTemplate?.specFields || []).forEach((field) => {
      const key = String(field?.key || '').trim()
      if (!key) return

      specFieldMap.set(key, {
        key,
        label: field?.label || toTitleCase(key),
        filterOptions: Array.isArray(field?.filterOptions) ? field.filterOptions : [],
      })
    })

    specValuesByKey.forEach((_, key) => {
      if (specFieldMap.has(key)) return
      specFieldMap.set(key, {
        key,
        label: toTitleCase(key),
        filterOptions: [],
      })
    })

    const specOptions = {}
    const specFields = Array.from(specFieldMap.values()).sort((a, b) => a.label.localeCompare(b.label))
    specFields.forEach((field) => {
      const counts = specValuesByKey.get(field.key) || new Map()
      const discoveredValues = Array.from(counts.keys())
      const mergedValues = Array.from(new Set([...(field.filterOptions || []), ...discoveredValues]))
      specOptions[field.key] = mergedValues
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((value) => ({
          value,
          count: counts.get(value) || 0,
        }))
    })

    return {
      genderOptions: collectUniqueValues(categoryScopedList, (product) => [product?.gender?.toLowerCase()]),
      colorOptions: Array.from(colorMap.values()).sort((a, b) => a.value.localeCompare(b.value)),
      sizeOptions: collectUniqueValues(categoryScopedList, (product) => (product?.variants || []).map((variant) => variant?.size)),
      brandOptions: collectUniqueValues(categoryScopedList, (product) => [product?.brand]),
      specFields,
      specOptions,
    }
  }, [categoryScopedList, effectiveCategoryTemplate])

  useEffect(() => {
    if (selectedCategoryIds.length > 0) return

    const normalizedSearch = normalizeLookupText(state.search)
    if (!ACCESSORY_NAV_TERMS.has(normalizedSearch)) return

    const accessoryRootId = resolveAccessoryRootCategoryId(categoryIndexes.byId, categoryIndexes.parentById)
    if (!accessoryRootId) return

    upsertParams({ category: [accessoryRootId], q: '', search: '' }, { resetPage: true, replace: true })
  }, [categoryIndexes.byId, categoryIndexes.parentById, selectedCategoryIds.length, state.search, upsertParams])

  useEffect(() => {
    if (!primaryCategoryId) {
      setCategoryTemplate(null)
      setRelatedCategoryTemplates([])
      return
    }

    const primaryChildren = categoryIndexes.childrenById.get(String(primaryCategoryId)) || []
    if (primaryChildren.length > 0) {
      // Parent categories don't have direct templates; leaf templates are fetched separately.
      setCategoryTemplate(null)
      return
    }

    runCategoryTemplate(() => getPublicCategoryTemplate(primaryCategoryId)).catch(() => {})
  }, [categoryIndexes.childrenById, primaryCategoryId, runCategoryTemplate, setCategoryTemplate, setRelatedCategoryTemplates])

  useEffect(() => {
    if (!selectedCategoryIds.length) return

    const leafIdSet = new Set()
    selectedCategoryIds.forEach((selectedId) => {
      const leaves = Array.from(collectLeafCategoryIds(selectedId, categoryIndexes.childrenById))
      if (!leaves.length) {
        leafIdSet.add(String(selectedId))
        return
      }
      leaves.forEach((leafId) => leafIdSet.add(String(leafId)))
    })

    const leafIds = Array.from(leafIdSet)

    if (!leafIds.length) {
      setRelatedCategoryTemplates([])
      return
    }

    runRelatedCategoryTemplates(() => Promise.allSettled(leafIds.map((id) => getPublicCategoryTemplate(id)))
      .then((results) => results
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value)
      ))
      .catch(() => setRelatedCategoryTemplates([]))
  }, [categoryIndexes.childrenById, runRelatedCategoryTemplates, selectedCategoryIds, setRelatedCategoryTemplates])

  useEffect(() => {
    if (!isLoggedIn || user?.role !== ROLES.CUSTOMER) return
    refreshWishlist().catch(() => {})
  }, [isLoggedIn, refreshWishlist, user?.role])

  const activeFilterTokens = useMemo(() => {
    return buildActiveFilterTokens(state).map((token) => {
      if (token.key !== 'category') return token
      return {
        ...token,
        label: categoryMap[token.value]?.name || token.value,
      }
    })
  }, [categoryMap, state])

  const wishlistedIds = useMemo(() => {
    return (wishlistProducts || []).map((item) => String(item.productId))
  }, [wishlistProducts])

  const handleToggleWishlist = async (product) => {
    if (!isLoggedIn) {
      navigate(ROUTES.LOGIN)
      return
    }

    if (user?.role !== ROLES.CUSTOMER) {
      pushToast({ type: 'warning', title: 'Customer only', message: 'Only customers can use wishlist.' })
      return
    }

    const productId = product?._id
    if (!productId) return

    const alreadyWishlisted = wishlistedIds.includes(productId)

    try {
      if (alreadyWishlisted) {
        await removeWishlist(productId)
        pushToast({ type: 'info', title: 'Wishlist updated', message: 'Removed from wishlist.' })
      } else {
        await addWishlist(productId)
        pushToast({ type: 'success', title: 'Wishlist updated', message: 'Added to wishlist.' })
      }
    } catch {
      pushToast({ type: 'danger', title: 'Action failed', message: 'Could not update wishlist now.' })
    }
  }

  const handleAddToCart = async (product, variant) => {
    if (!isLoggedIn) {
      navigate(ROUTES.LOGIN)
      return
    }

    if (user?.role !== ROLES.CUSTOMER) {
      pushToast({ type: 'warning', title: 'Customer only', message: 'Only customers can add products to cart.' })
      return
    }

    if (!variant?._id || !product?._id) return

    try {
      await addItem({ productId: product._id, variantId: variant._id, quantity: 1 })
      pushToast({ type: 'success', title: 'Added to cart', message: 'Product added to cart.' })
    } catch {
      pushToast({ type: 'danger', title: 'Could not add', message: 'Please try again in a moment.' })
    }
  }

  const filterSidebar = (
    <ProductsFilterSidebar
      state={state}
      categories={scopedCategories}
      meta={metadata}
      categoryTemplate={effectiveCategoryTemplate}
      restrictToRelevant={restrictToRelevantFilters}
      activeFilterTokens={activeFilterTokens}
      onClearAll={clearAll}
      onRemoveToken={removeFilterToken}
      onToggleCategory={(categoryId, checked) => setArrayFilter('category', categoryId, checked)}
      onClearCategories={() => upsertParams({ category: [] }, { resetPage: true })}
      onToggleArrayFilter={(key, value, checked) => setArrayFilter(key, value, checked)}
      onSetPrice={({ minPrice, maxPrice }) => upsertParams({ minPrice, maxPrice }, { resetPage: true })}
      onSetDiscount={(discount) => upsertParams({ discount }, { resetPage: true })}
      onSetSpecFilter={setSpecFilter}
      onApplyFilters={() => setFilterDrawerOpen(false)}
    />
  )

  return (
    <div className="page-shell space-y-md pb-xl">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-text-secondary">Products</span>
        {activeCategoryName ? (
          <>
            <span>/</span>
            <span className="text-text-secondary">{activeCategoryName}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="section-title">Browse Products</h1>
          <p className="section-subtitle">Filter by category, color, size, brand, discount, and dynamic specs.</p>
        </div>

        <Button variant="secondary" className="md:hidden" onClick={() => setFilterDrawerOpen(true)}>
          Filters
        </Button>
      </div>

      <section className="grid gap-md lg:grid-cols-[300px,1fr]">
        <aside className="hidden h-fit rounded-xl border border-border bg-surface-elevated p-md shadow-soft lg:sticky lg:top-[126px] lg:block">
          {isTemplateLoading ? <div className="flex justify-center py-md"><Spinner /></div> : filterSidebar}
        </aside>

        <div className="space-y-md">
          <ProductsResultsHeader
            total={loading ? 0 : totalProducts}
            title={activeCategoryName || (state.search ? `Search: ${state.search}` : '')}
            sort={state.sort}
            view={state.view || DEFAULT_VIEW}
            onSortChange={(value) => upsertParams({ sort: value }, { resetPage: true })}
            onViewChange={(value) => upsertParams({ view: value })}
          />

          {loading ? (
            <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
          ) : error ? (
            <Card className="border-danger bg-danger-soft text-sm text-danger">{error}</Card>
          ) : list.length === 0 ? (
            <Card className="space-y-sm p-lg text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-text-muted">0</div>
              <h2 className="text-lg font-semibold text-text-primary">No products found matching your filters</h2>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>Try removing some filters</li>
                <li>Browse all categories</li>
                <li>Check your spelling</li>
              </ul>
              <div>
                <Button onClick={clearAll}>Clear All Filters</Button>
              </div>
            </Card>
          ) : (
            <>
              <div className={state.view === 'list' ? 'space-y-sm' : 'grid gap-md sm:grid-cols-2 xl:grid-cols-4'}>
                {list.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    view={state.view === 'list' ? 'list' : 'grid'}
                    isWishlisted={wishlistedIds.includes(product._id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              <Pagination
                currentPage={state.page}
                totalPages={totalPages}
                onPageChange={(nextPage) => upsertParams({ page: nextPage })}
              />
            </>
          )}
        </div>
      </section>

      <Drawer open={isFilterDrawerOpen} title="Filters" onClose={() => setFilterDrawerOpen(false)}>
        {isTemplateLoading ? <div className="flex justify-center py-md"><Spinner /></div> : filterSidebar}
      </Drawer>
    </div>
  )
}
