import ProductCard from '@/features/products/components/molecules/ProductCard'

const SimilarProductsSection = ({ products = [], onToggleWishlist, wishlistedIds = [] }) => {
  const visibleProducts = products.filter((product) => String(product?.status || 'active').toLowerCase() === 'active')

  if (!visibleProducts.length) return null

  return (
    <section className="space-y-sm">
      <h2 className="text-xl font-display text-text-primary">You May Also Like</h2>
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            view="grid"
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistedIds.includes(product._id)}
          />
        ))}
      </div>
    </section>
  )
}

export default SimilarProductsSection
