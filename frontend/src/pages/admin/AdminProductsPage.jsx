import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Spinner, Badge } from '@/shared/ui'
import useAdminProducts from '@/features/products/hooks/useAdminProducts'
import useUIStore from '@/shared/uiSlice'
import { getApiError } from '@/shared/services/apiClient'
import { formatPrice } from '@/shared/utils/formatters'

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'held', label: 'Held' },
  { value: 'removed', label: 'Removed' },
]

const toSellerLabel = (seller) => {
  if (!seller) return 'Unknown Seller'
  if (typeof seller === 'string') {
    if (seller.includes('@')) return seller
    return `seller-${seller.slice(-6)}`
  }

  if (seller.email) return seller.email

  const byName = `${seller.firstName || ''} ${seller.lastName || ''}`.trim()
  if (byName) return byName
  if (seller.id) return `seller-${String(seller.id).slice(-6)}`
  return 'Unknown Seller'
}

const toProductApiId = (product) => product?.id || product?.productId || ''

const toProductUniqueId = (product) => {
  if (product?.slug) return product.slug

  const firstSku = Array.isArray(product?.variants)
    ? product.variants.find((variant) => String(variant?.sku || '').trim())?.sku
    : ''

  return firstSku || ''
}

const resolveActionOptions = (status) => {
  if (status === 'active') {
    return [
      { value: 'hold', label: 'Hold Product' },
      { value: 'remove', label: 'Remove Permanently' },
    ]
  }

  if (status === 'held') {
    return [
      { value: 'unhold', label: 'Unhold Product' },
      { value: 'remove', label: 'Remove Permanently' },
    ]
  }

  return []
}

const toStock = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  return variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0)
}

function HoldProductModal({ open, productName, reason, submitting, onReasonChange, onClose, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[180]">
      <button type="button" className="absolute inset-0 bg-text-primary/55" onClick={onClose} aria-label="Close hold modal" />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">Hold Product</h2>
        <p className="mt-1 text-sm text-text-secondary">{productName}</p>

        <div className="mt-md space-y-2">
          <label htmlFor="admin-hold-reason" className="text-sm font-medium text-text-primary">Reason</label>
          <textarea
            id="admin-hold-reason"
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Held by admin for review"
            className="w-full rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
          />
        </div>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onConfirm} loading={submitting}>Confirm Hold</Button>
        </div>
      </section>
    </div>
  )
}

function RemoveProductModal({ open, productName, submitting, onClose, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[180]">
      <button type="button" className="absolute inset-0 bg-text-primary/55" onClick={onClose} aria-label="Close remove modal" />

      <section className="absolute left-1/2 top-1/2 w-[94vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-md shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">Remove Product Permanently</h2>
        <p className="mt-2 text-sm text-text-secondary">
          This action is destructive and cannot be undone. Product: {productName}
        </p>

        <div className="mt-md flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={submitting}>Remove Permanently</Button>
        </div>
      </section>
    </div>
  )
}

export default function AdminProductsPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const productsState = useAdminProducts()

  const [statusFilter, setStatusFilter] = useState('')
  const [holdTarget, setHoldTarget] = useState(null)
  const [holdReason, setHoldReason] = useState('')
  const [holding, setHolding] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [unholdingId, setUnholdingId] = useState('')

  const refresh = productsState.refresh

  useEffect(() => {
    refresh(statusFilter ? { status: statusFilter } : {}).catch(() => {})
  }, [refresh, statusFilter])

  const rows = useMemo(() => productsState.products || [], [productsState.products])

  const handleConfirmHold = async () => {
    const holdTargetId = toProductApiId(holdTarget)
    if (!holdTargetId) return
    setHolding(true)

    try {
      await productsState.holdProduct(holdTargetId, String(holdReason || '').trim() || 'Held by admin for review')
      await productsState.refresh(statusFilter ? { status: statusFilter } : {})
      setHoldTarget(null)
      setHoldReason('')
      pushToast({ type: 'success', title: 'Product held', message: 'Product has been moved to held status.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Unable to hold product', message: getApiError(error, 'Hold request failed.') })
    } finally {
      setHolding(false)
    }
  }

  const handleConfirmRemove = async () => {
    const removeTargetId = toProductApiId(removeTarget)
    if (!removeTargetId) return
    setRemoving(true)

    try {
      await productsState.removeProduct(removeTargetId)
      await productsState.refresh(statusFilter ? { status: statusFilter } : {})
      setRemoveTarget(null)
      pushToast({ type: 'success', title: 'Product removed', message: 'Product has been removed permanently.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Unable to remove product', message: getApiError(error, 'Remove request failed.') })
    } finally {
      setRemoving(false)
    }
  }

  const handleUnholdProduct = async (productId) => {
    setUnholdingId(productId)

    try {
      await productsState.unholdProduct(productId)
      await productsState.refresh(statusFilter ? { status: statusFilter } : {})
      pushToast({ type: 'success', title: 'Product unheld', message: 'Product is active again.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Unable to unhold product', message: getApiError(error, 'Unhold request failed.') })
    } finally {
      setUnholdingId('')
    }
  }

  const handleRowAction = (product, action) => {
    const productId = toProductApiId(product)
    if (!productId) return

    if (action === 'hold') {
      setHoldTarget(product)
      setHoldReason('')
      return
    }

    if (action === 'unhold') {
      handleUnholdProduct(productId)
      return
    }

    if (action === 'remove') {
      setRemoveTarget(product)
    }
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Catalog Moderation</h1>
          <p className="section-subtitle">Moderate products across all sellers with hold and removal controls.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.value || 'all'} value={item.value}>{item.label}</option>
            ))}
          </select>

          <Button variant="secondary" onClick={() => refresh(statusFilter ? { status: statusFilter } : {})}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        {productsState.loading ? (
          <div className="flex justify-center py-2xl"><Spinner /></div>
        ) : (
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-3 text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-sm py-3">Product</th>
                <th className="px-sm py-3">Seller</th>
                <th className="px-sm py-3">Price</th>
                <th className="px-sm py-3">Stock</th>
                <th className="px-sm py-3">Status</th>
                <th className="px-sm py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-sm py-lg text-center text-sm text-text-secondary">No products found for selected filters.</td>
                </tr>
              ) : rows.map((product, index) => {
                const apiProductId = toProductApiId(product)
                const productUniqueId = toProductUniqueId(product)
                const rowKey = productUniqueId || apiProductId || `product-row-${index}`
                const firstVariantPrice = Number(product?.variants?.[0]?.price || 0)
                const stock = toStock(product)
                const actionOptions = resolveActionOptions(product.status)
                const actionsDisabled = !apiProductId || unholdingId === apiProductId || holding || removing

                return (
                  <tr key={rowKey} className="border-b border-border/70 align-top text-sm">
                    <td className="px-sm py-sm">
                      <p className="font-semibold text-text-primary">{product.name}</p>
                      <p className="text-xs text-text-secondary">Product ID: {productUniqueId || 'N/A'}</p>
                    </td>
                    <td className="px-sm py-sm text-text-secondary">{toSellerLabel(product.sellerId)}</td>
                    <td className="px-sm py-sm text-text-secondary">{formatPrice(firstVariantPrice)}</td>
                    <td className="px-sm py-sm text-text-secondary">{stock}</td>
                    <td className="px-sm py-sm">
                      <Badge variant={product.status === 'active' ? 'success' : product.status === 'held' ? 'warning' : 'danger'}>
                        {product.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-sm py-sm">
                      <div className="flex justify-end">
                        {actionOptions.length > 0 ? (
                          <select
                            defaultValue=""
                            disabled={actionsDisabled}
                            onChange={(event) => {
                              const selectedAction = event.target.value
                              event.target.value = ''
                              if (!selectedAction) return
                              handleRowAction(product, selectedAction)
                            }}
                            className="min-w-[190px] rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm"
                            aria-label={`Actions for ${product.name || 'product'}`}
                          >
                            <option value="">Select action</option>
                            {actionOptions.map((action) => (
                              <option key={`${rowKey}-${action.value}`} value={action.value}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <HoldProductModal
        open={Boolean(holdTarget)}
        productName={holdTarget?.name || 'Product'}
        reason={holdReason}
        submitting={holding}
        onReasonChange={setHoldReason}
        onClose={() => { if (!holding) setHoldTarget(null) }}
        onConfirm={handleConfirmHold}
      />

      <RemoveProductModal
        open={Boolean(removeTarget)}
        productName={removeTarget?.name || 'Product'}
        submitting={removing}
        onClose={() => { if (!removing) setRemoveTarget(null) }}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
