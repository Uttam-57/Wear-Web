import { Link } from 'react-router-dom'

export default function SellerProductPreviewHeader({ storeRoute }) {
  return (
    <header className="space-y-sm rounded-xl border border-border bg-surface-elevated px-md py-sm shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <Link to={storeRoute} className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to store
        </Link>
      </div>
    </header>
  )
}
