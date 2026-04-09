import { useCallback, useState } from 'react'
import { logger } from '@/shared/utils/logger'

const ASYNC_STATE_CACHE_TTL_MS = 5 * 60 * 1000
const asyncStateCache = new Map()

const getCachedState = (cacheKey, persistMs = ASYNC_STATE_CACHE_TTL_MS) => {
  if (!cacheKey) return null

  const cached = asyncStateCache.get(cacheKey)
  if (!cached) return null

  if (persistMs > 0 && Date.now() - cached.updatedAt > persistMs) {
    asyncStateCache.delete(cacheKey)
    return null
  }

  return cached
}

const useAsync = (defaultValue = null, options = {}) => {
  const cacheKey = options?.cacheKey || ''
  const persistMs = Number(options?.persistMs || ASYNC_STATE_CACHE_TTL_MS)

  const initialCachedState = getCachedState(cacheKey, persistMs)

  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState(initialCachedState?.error || '')
  const [dataState, setDataState] = useState(
    initialCachedState?.data ?? defaultValue
  )

  const persistState = useCallback((nextPartial) => {
    if (!cacheKey) return

    const previous = asyncStateCache.get(cacheKey) || {}
    asyncStateCache.set(cacheKey, {
      ...previous,
      ...nextPartial,
      updatedAt: Date.now(),
    })
  }, [cacheKey])

  const setData = useCallback((valueOrUpdater) => {
    setDataState((previous) => {
      const nextData = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(previous)
        : valueOrUpdater

      persistState({ data: nextData, error: '' })
      return nextData
    })
  }, [persistState])

  const setError = useCallback((valueOrUpdater) => {
    setErrorState((previous) => {
      const nextError = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(previous)
        : valueOrUpdater

      persistState({ error: nextError })
      return nextError
    })
  }, [persistState])

  const run = useCallback(async (promiseFactory) => {
    setLoading(true)
    setError('')
    try {
      const result = await promiseFactory()
      setData(result)
      return result
    } catch (err) {
      logger.warn('useAsync run failed', {
        message: err?.response?.data?.message || err?.message,
        status: err?.response?.status,
      })
      setError(err?.response?.data?.message || err?.message || 'Request failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data: dataState,
    setData,
    loading,
    setLoading,
    error: errorState,
    setError,
    run,
  }
}

export default useAsync
