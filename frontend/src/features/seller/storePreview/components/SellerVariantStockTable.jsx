export default function SellerVariantStockTable({ rows, totalStock }) {
  return (
    <section className="space-y-sm rounded-xl border border-border bg-surface-elevated p-md shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-lg font-semibold text-text-primary">Exact stock per variant</h2>
        <p className="text-sm text-text-secondary">Total stock: <span className="font-semibold text-text-primary">{totalStock} units</span></p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-sm py-2 font-medium">Colour</th>
              <th className="px-sm py-2 font-medium">Size</th>
              <th className="px-sm py-2 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border/70 text-text-primary">
                <td className="px-sm py-2">{row.colorName}</td>
                <td className="px-sm py-2">{row.size}</td>
                <td className="px-sm py-2">{row.stock > 0 ? `${row.stock} units` : 'Out of stock'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
