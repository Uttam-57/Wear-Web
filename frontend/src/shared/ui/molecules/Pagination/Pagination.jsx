import Button from '@/shared/ui/atoms/Button'
import { cn } from '@/shared/utils/cn'

/**
 * Pagination molecule — page navigation controls
 *
 * Composes: Button atom
 * Used by: ProductsPage, AdminUsersPage, OrdersPage
 *
 * currentPage: number — 1-based current page
 * totalPages:  number — total number of pages
 * onPageChange: fn(page) — called with new page number
 * disabled:    boolean — disables all controls while loading
 */
const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false, className }) => {
  if (totalPages <= 1) return null

  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  // Build visible page numbers — show max 5 around current
  const getPages = () => {
    const pages = []
    const delta = 2
    const left  = Math.max(1, currentPage - delta)
    const right = Math.min(totalPages, currentPage + delta)

    if (left > 1) { pages.push(1); if (left > 2) pages.push('...') }
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages) }

    return pages
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-xs flex-wrap', className)}
    >
      {/* Previous */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPrev || disabled}
        aria-label="Previous page"
      >
        ← Prev
      </Button>

      {/* Page numbers */}
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-sm text-text-muted text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'w-8 h-8 rounded-md text-sm font-medium transition-colors duration-150',
              'disabled:cursor-not-allowed',
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-surface-3'
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNext || disabled}
        aria-label="Next page"
      >
        Next →
      </Button>
    </nav>
  )
}

export default Pagination