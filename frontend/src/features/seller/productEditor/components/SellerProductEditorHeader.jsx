import { Link } from 'react-router-dom'

export default function SellerProductEditorHeader({ mode, storeRoute }) {
  const isEdit = mode === 'edit'

  return (
    <header className="rounded-xl border border-border bg-surface-elevated px-md py-sm shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Seller Product Editor</p>
          <h1 className="text-xl font-semibold text-text-primary">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isEdit
              ? 'Update product details and keep your listing accurate.'
              : 'Create a complete listing with variants, media, and shipping details.'}
          </p>
        </div>

        <Link to={storeRoute} className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to My Public Store
        </Link>
      </div>
    </header>
  )
}
