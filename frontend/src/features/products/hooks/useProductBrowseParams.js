import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_LIMIT,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  parseCsv,
  stringifyCsv,
} from '@/features/products/utils/productBrowse.utils'

const SPEC_PARAM_REGEX = /^specs\[(.+)\]$/

const parsePositiveNumber = (value, fallback, max = Number.POSITIVE_INFINITY) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

const normalizeSearchTerm = (value = '') => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''

  return trimmed
    .replace(/\btshirts\b/gi, 't-shirts')
    .replace(/\btshirt\b/gi, 't-shirt')
}

const normalizeSpecFilters = (searchParams) => {
  const result = {}

  searchParams.forEach((value, key) => {
    const match = SPEC_PARAM_REGEX.exec(key)
    if (!match || !value) return

    const specKey = match[1]
    result[specKey] = parseCsv(value)
  })

  return result
}

const useProductBrowseParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasQParam = searchParams.has('q')

  const state = useMemo(() => {
    const search = searchParams.get('search') || searchParams.get('q') || ''
    const categoryIds = parseCsv(searchParams.get('category') || searchParams.get('categoryId'))
    const gender = parseCsv(searchParams.get('gender'))
    const baseColors = parseCsv(searchParams.get('baseColors') || searchParams.get('baseColor'))
    const sizes = parseCsv(searchParams.get('sizes') || searchParams.get('size'))
    const brands = parseCsv(searchParams.get('brands') || searchParams.get('brand'))

    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const discount = searchParams.get('discount') || ''

    const page = parsePositiveNumber(searchParams.get('page'), 1)
    const limit = parsePositiveNumber(searchParams.get('limit'), DEFAULT_LIMIT, 50)
    const sort = searchParams.get('sort') || searchParams.get('sortBy') || DEFAULT_SORT
    const view = searchParams.get('view') || DEFAULT_VIEW

    const specs = normalizeSpecFilters(searchParams)

    return {
      search,
      category: categoryIds[0] || '',
      categoryIds,
      gender,
      baseColors,
      sizes,
      brands,
      minPrice,
      maxPrice,
      discount,
      page,
      limit,
      sort,
      view,
      specs,
    }
  }, [searchParams])

  const upsertParams = (next, options = { resetPage: false, replace: false }) => {
    const merged = new URLSearchParams(searchParams)

    Object.entries(next || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        merged.delete(key)
        return
      }

      if (Array.isArray(value)) {
        const serialized = stringifyCsv(value)
        if (!serialized) merged.delete(key)
        else merged.set(key, serialized)
        return
      }

      merged.set(key, String(value))
    })

    if (options.resetPage) merged.set('page', '1')

    setSearchParams(merged, { replace: options.replace })
  }

  const replaceAllParams = (nextEntries = {}) => {
    const next = new URLSearchParams()
    Object.entries(nextEntries).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (Array.isArray(value)) {
        const serialized = stringifyCsv(value)
        if (serialized) next.set(key, serialized)
        return
      }
      next.set(key, String(value))
    })

    setSearchParams(next)
  }

  const clearAll = () => {
    const keep = {
      [hasQParam ? 'q' : 'search']: state.search,
      sort: state.sort,
      limit: DEFAULT_LIMIT,
      view: state.view,
    }
    replaceAllParams(keep)
  }

  const setArrayFilter = (key, value, checked) => {
    const current = parseCsv(searchParams.get(key))
    const next = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value)

    upsertParams({ [key]: next }, { resetPage: true })
  }

  const setSpecFilter = (specKey, values) => {
    upsertParams({ [`specs[${specKey}]`]: values }, { resetPage: true })
  }

  const removeFilterToken = (token) => {
    if (!token?.key) return

    if (token.type === 'array') {
      const current = parseCsv(searchParams.get(token.key))
      const next = current.filter((item) => item !== token.value)
      upsertParams({ [token.key]: next }, { resetPage: true })
      return
    }

    upsertParams({ [token.key]: '' }, { resetPage: true })
  }

  const queryForApi = useMemo(() => {
    const query = {
      page: state.page,
      limit: state.limit,
      sortBy: state.sort,
    }

    if (state.search) query.q = normalizeSearchTerm(state.search)

    // For single-value selections, let backend filter and paginate accurately.
    // Multi-value selections are handled client-side in the page component.
    if (state.categoryIds.length === 1) query.category = state.categoryIds[0]
    if (state.gender.length === 1) query.gender = state.gender[0]
    if (state.baseColors.length === 1) query.baseColors = state.baseColors[0]
    if (state.sizes.length === 1) query.sizes = state.sizes[0]
    if (state.brands.length === 1) query.brands = state.brands[0]

    if (state.minPrice) query.minPrice = state.minPrice
    if (state.maxPrice) query.maxPrice = state.maxPrice

    Object.entries(state.specs || {}).forEach(([specKey, values]) => {
      if (!Array.isArray(values) || values.length !== 1) return
      query[`specs[${specKey}]`] = values[0]
    })

    return query
  }, [
    state.baseColors,
    state.brands,
    state.categoryIds,
    state.gender,
    state.limit,
    state.maxPrice,
    state.minPrice,
    state.page,
    state.search,
    state.sizes,
    state.sort,
    state.specs,
  ])

  return {
    state,
    searchParams,
    queryForApi,
    upsertParams,
    replaceAllParams,
    clearAll,
    setArrayFilter,
    setSpecFilter,
    removeFilterToken,
  }
}

export default useProductBrowseParams
