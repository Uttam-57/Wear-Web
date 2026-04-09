import axios from 'axios'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import useAuthStore from '../../app/store'

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
})

const endpointMetrics = new Map()
let requestSequence = 0

const shouldLogHttpMetrics = () => env.IS_DEV && env.HTTP_METRICS_ENABLED

const normalizePath = (url = '') => String(url).split('?')[0] || '/'

const nextRequestId = () => {
  requestSequence += 1
  return String(requestSequence).padStart(5, '0')
}

const summarizeEndpointMetric = (method, url, durationMs, status) => {
  const endpoint = `${String(method || 'GET').toUpperCase()} ${normalizePath(url)}`

  if (!endpointMetrics.has(endpoint)) {
    endpointMetrics.set(endpoint, {
      totalRequests: 0,
      failedRequests: 0,
      slowRequests: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
    })
  }

  const metric = endpointMetrics.get(endpoint)
  metric.totalRequests += 1
  metric.totalDurationMs += durationMs
  metric.maxDurationMs = Math.max(metric.maxDurationMs, durationMs)

  if (status >= 400 || status === 0) {
    metric.failedRequests += 1
  }

  if (durationMs >= env.HTTP_SLOW_THRESHOLD_MS) {
    metric.slowRequests += 1
  }

  return {
    endpoint,
    totalRequests: metric.totalRequests,
    errorRatePct: Number(((metric.failedRequests / metric.totalRequests) * 100).toFixed(1)),
    slowRatePct: Number(((metric.slowRequests / metric.totalRequests) * 100).toFixed(1)),
    avgDurationMs: Number((metric.totalDurationMs / metric.totalRequests).toFixed(1)),
    maxDurationMs: metric.maxDurationMs,
  }
}

const trackHttpResponse = (config, status, errorMessage = '') => {
  if (!shouldLogHttpMetrics() || !config) return

  const startTime = config.metadata?.startTimeMs || performance.now()
  const durationMs = Math.max(0, Math.round(performance.now() - startTime))
  const method = String(config.method || 'GET').toUpperCase()
  const url = config.url || '/'
  const requestId = config.metadata?.requestId || 'unknown'

  const endpointStats = summarizeEndpointMetric(method, url, durationMs, status)

  logger.http('response', {
    requestId,
    method,
    url,
    status,
    durationMs,
    slowThresholdMs: env.HTTP_SLOW_THRESHOLD_MS,
    errorMessage,
    endpointStats,
  })
}

apiClient.interceptors.request.use((config) => {
  config.metadata = {
    requestId: nextRequestId(),
    startTimeMs: performance.now(),
    startedAtISO: new Date().toISOString(),
  }

  const { token } = useAuthStore.getState()
  config.headers = config.headers || {}
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (shouldLogHttpMetrics()) {
    logger.http('request', {
      requestId: config.metadata.requestId,
      method: String(config.method || 'GET').toUpperCase(),
      url: config.url || '/',
      baseURL: config.baseURL || env.API_BASE_URL,
      hasBody: Boolean(config.data),
      hasParams: Boolean(config.params),
      startedAtISO: config.metadata.startedAtISO,
    })
  }

  return config
})

let refreshInFlight = null

apiClient.interceptors.response.use(
  (res) => {
    trackHttpResponse(res.config, res.status)
    return res
  },
  async (err) => {
    const original = err.config
    const status = err.response?.status || 0

    trackHttpResponse(original, status, err.response?.data?.message || err.message)

    if (status === 401 && !original?._retry && !original?.url?.includes('/auth/refresh-token')) {
      original._retry = true

      try {
        if (!refreshInFlight) {
          refreshInFlight = axios
            .post(`${env.API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true })
            .then((res) => res.data?.data?.accessToken)
            .finally(() => {
              refreshInFlight = null
            })
        }

        const newAccessToken = await refreshInFlight
        if (!newAccessToken) throw new Error('No refreshed token received')

        useAuthStore.getState().setToken(newAccessToken)
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)
      } catch (refreshErr) {
        logger.warn('Refresh token flow failed', refreshErr)
        useAuthStore.getState().logout()
      }
    }

    logger.error('API Error', {
      requestId: original?.metadata?.requestId,
      url: err.config?.url,
      status,
      code: err.code,
      message: err.response?.data?.message || err.message,
    })

    return Promise.reject(err)
  }
)

export default apiClient

export const getApiError = (err, fallback = 'Something went wrong') => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error?.message ||
    err?.message ||
    fallback
  )
}