import apiClient from '@/shared/services/apiClient'

const DEFAULT_TTL_MS = 5 * 60 * 1000

const queryCache = new Map()
const inFlightQueries = new Map()
const tagToKeys = new Map()

const normalizeValue = (value) => {
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item))
  if (value && typeof value === 'object') {
    const sorted = {}
    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = normalizeValue(value[key])
      })
    return sorted
  }
  return value
}

const toStableString = (value) => JSON.stringify(normalizeValue(value ?? {}))

const buildQueryKey = ({ method = 'GET', url, params, headers }) => {
  return [method.toUpperCase(), url, toStableString(params), toStableString(headers)].join('::')
}

const unlinkCacheKeyFromTags = (cacheKey, tags) => {
  ;(tags || []).forEach((tag) => {
    const bucket = tagToKeys.get(tag)
    if (!bucket) return

    bucket.delete(cacheKey)
    if (!bucket.size) tagToKeys.delete(tag)
  })
}

const clearCacheKey = (cacheKey) => {
  const entry = queryCache.get(cacheKey)
  if (!entry) return

  unlinkCacheKeyFromTags(cacheKey, Array.from(entry.tags || []))
  queryCache.delete(cacheKey)
}

const linkCacheKeyToTags = (cacheKey, tags = []) => {
  tags.forEach((tag) => {
    if (!tag) return

    if (!tagToKeys.has(tag)) tagToKeys.set(tag, new Set())
    tagToKeys.get(tag).add(cacheKey)
  })
}

export const invalidateQueryCacheByTags = (tags = []) => {
  tags.forEach((tag) => {
    const keys = tagToKeys.get(tag)
    if (!keys) return

    Array.from(keys).forEach((cacheKey) => clearCacheKey(cacheKey))
    tagToKeys.delete(tag)
  })
}

export const invalidateAllQueryCache = () => {
  queryCache.clear()
  inFlightQueries.clear()
  tagToKeys.clear()
}

const withInvalidation = (promise, options = {}) => {
  const invalidateTags = options.invalidateTags || []
  const invalidateAll = Boolean(options.invalidateAll)

  return promise.then((response) => {
    if (invalidateAll) invalidateAllQueryCache()
    if (invalidateTags.length) invalidateQueryCacheByTags(invalidateTags)
    return response
  })
}

export const queryGet = (url, config = {}, options = {}) => {
  const cache = options.cache !== false
  const dedupe = options.dedupe !== false || Boolean(options.force)
  const force = Boolean(options.force)
  const ttlMs = Number(options.ttlMs || DEFAULT_TTL_MS)
  const tags = options.tags || []

  const queryKey = buildQueryKey({
    method: 'GET',
    url,
    params: config?.params,
    headers: config?.headers,
  })

  const now = Date.now()
  const existing = queryCache.get(queryKey)

  if (!force && cache && existing && existing.expiresAt > now) {
    return Promise.resolve(existing.response)
  }

  if (dedupe && inFlightQueries.has(queryKey)) {
    return inFlightQueries.get(queryKey)
  }

  const requestPromise = apiClient
    .get(url, config)
    .then((response) => {
      if (cache) {
        clearCacheKey(queryKey)
        const expiresAt = Date.now() + Math.max(0, ttlMs)
        const entry = {
          response,
          expiresAt,
          tags: new Set(tags),
        }
        queryCache.set(queryKey, entry)
        linkCacheKeyToTags(queryKey, tags)
      }
      return response
    })
    .finally(() => {
      inFlightQueries.delete(queryKey)
    })

  if (dedupe) inFlightQueries.set(queryKey, requestPromise)

  return requestPromise
}

export const queryPost = (url, data, config = {}, options = {}) => {
  return withInvalidation(apiClient.post(url, data, config), options)
}

export const queryPut = (url, data, config = {}, options = {}) => {
  return withInvalidation(apiClient.put(url, data, config), options)
}

export const queryPatch = (url, data, config = {}, options = {}) => {
  return withInvalidation(apiClient.patch(url, data, config), options)
}

export const queryDelete = (url, config = {}, options = {}) => {
  return withInvalidation(apiClient.delete(url, config), options)
}
