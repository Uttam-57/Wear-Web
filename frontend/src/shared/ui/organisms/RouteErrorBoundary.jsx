import { useEffect } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { logger } from '@/shared/utils/logger'

const resolveErrorMessage = (error) => {
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string' && error.data.trim()) return error.data
    return error.statusText || 'Unexpected navigation error'
  }

  if (typeof error === 'string' && error.trim()) return error
  if (error?.message) return String(error.message)

  return 'An unexpected error occurred while loading this page.'
}

export default function RouteErrorBoundary() {
  const error = useRouteError()

  useEffect(() => {
    logger.error('RouteErrorBoundary caught route error', {
      isRouteError: isRouteErrorResponse(error),
      status: isRouteErrorResponse(error) ? error.status : undefined,
      statusText: isRouteErrorResponse(error) ? error.statusText : undefined,
      data: isRouteErrorResponse(error) ? error.data : undefined,
      message: error?.message,
      stack: error?.stack,
    })
  }, [error])

  const title = isRouteErrorResponse(error) ? `Error ${error.status}` : 'Something went wrong'
  const message = resolveErrorMessage(error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-md py-xl">
      <div className="w-full max-w-xl rounded-xl border border-border bg-surface-elevated p-lg shadow-card">
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>

        <div className="mt-md flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-md py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Reload Page
          </button>

          <Link
            to={ROUTES.HOME}
            className="rounded-md border border-border bg-surface px-md py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
