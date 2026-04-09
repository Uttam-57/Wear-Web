import { Link } from 'react-router-dom'
import ProductShowcaseCard from '@/features/products/components/ProductShowcaseCard'
import HomeSection from '@/features/home/components/HomeSection'
import useHomePageData from '@/features/home/hooks/useHomePageData'
import { HERO_SLIDES, GENDER_TILES } from '@/features/home/constants/homePage.constants'
import { ROUTES } from '@/shared/constants/routes'
import {
  buildCategoryImageStyle,
  CATEGORY_CARD_IMAGE_ASPECT_RATIO,
} from '@/shared/utils/categoryImageAdjust'
import { Button, Card, Spinner } from '@/shared/ui'

export default function HomePage() {
  const {
    activeSlide,
    categoriesLoading,
    categoryRoots,
    defaultHeroAction,
    handleAddToCart,
    handleWishlistToggle,
    hotDeals,
    isCustomer,
    isSeller,
    newArrivals,
    quickCategoryCards,
    sectionsError,
    sectionsLoading,
    sellerRecentProducts,
    setActiveSlide,
    trendingNow,
    wishlistSet,
  } = useHomePageData()

  const activeHeroSlide = HERO_SLIDES[activeSlide] || HERO_SLIDES[0]

  const renderProductGrid = (list, emptyText) => {
    const maxTwoRowsProducts = (list || []).slice(0, 8)

    if (sectionsLoading) {
      return <div className="flex justify-center py-xl"><Spinner /></div>
    }

    if (sectionsError) {
      return <Card className="p-md text-sm text-danger">{sectionsError}</Card>
    }

    if (!maxTwoRowsProducts.length) {
      return <Card className="p-md text-sm text-text-secondary">{emptyText}</Card>
    }

    return (
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {maxTwoRowsProducts.map((product) => (
          <ProductShowcaseCard
            key={product._id}
            product={product}
            showWishlist={!isSeller}
            showAddToCart={!isSeller}
            isWishlisted={wishlistSet.has(product._id)}
            onToggleWishlist={handleWishlistToggle}
            onAddToCart={handleAddToCart}
            addToCartLabel={isCustomer ? 'Add to cart' : 'Login to add'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-xl pb-2xl">
      <section className="page-shell">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-card">
          <div className="absolute inset-0">
            <img
              key={activeHeroSlide.title}
              src={activeHeroSlide.image}
              srcSet={activeHeroSlide.imageSet}
              sizes={activeHeroSlide.sizes}
              alt={activeHeroSlide.title}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
          </div>

          <div className="relative flex min-h-[340px] flex-col justify-between p-lg md:min-h-[400px] md:p-xl">
            <div className="space-y-md">
              <span className="inline-flex w-fit rounded-full border border-white/40 bg-white/15 px-sm py-1 text-xs font-semibold uppercase tracking-wide text-white">
                WearWeb Multi-vendor Fashion
              </span>
              <h1 className="max-w-2xl text-balance font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                {HERO_SLIDES[activeSlide].title}
              </h1>
              <p className="max-w-2xl text-sm text-white/85 md:text-base">
                {HERO_SLIDES[activeSlide].subtitle}
              </p>
            </div>

            <div className="space-y-sm">
              <div className="flex flex-wrap gap-sm">
                <Button as={Link} to={defaultHeroAction.to} size="lg">
                  {defaultHeroAction.label}
                </Button>
                <Button as={Link} to={`${ROUTES.PRODUCTS}?gender=women`} size="lg" variant="secondary">
                  Shop Women
                </Button>
                <Button as={Link} to={`${ROUTES.PRODUCTS}?sortBy=newest`} size="lg" variant="ghost" className="border-white/50 text-white hover:bg-white/20 hover:text-white">
                  New Arrivals
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={index === activeSlide ? 'h-2.5 w-2.5 rounded-full bg-white' : 'h-2.5 w-2.5 rounded-full bg-white/50'}
                    style={{
                      transform: `scaleX(${index === activeSlide ? 3.2 : 1})`,
                      transformOrigin: 'left center',
                      transition: 'transform 220ms ease, background-color 220ms ease',
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeSection title="Shop by Gender" subtitle="Jump into curated collections with one click.">
        <div className="grid gap-md md:grid-cols-3">
          {GENDER_TILES.map((tile) => (
            <Link
              key={tile.gender}
              to={`${ROUTES.PRODUCTS}?gender=${tile.gender}`}
              className="group relative overflow-hidden rounded-xl border border-border shadow-soft"
            >
              <img
                src={tile.image}
                srcSet={tile.imageSet}
                sizes={tile.sizes}
                alt={tile.label}
                loading="lazy"
                decoding="async"
                className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-md bottom-md text-white">
                <p className="text-lg font-display font-semibold">{tile.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </HomeSection>

      <HomeSection title="Browse by Category" subtitle="Main blocks designed for quick navigation across catalog.">
        {categoriesLoading ? (
          <div className="flex justify-center py-lg"><Spinner /></div>
        ) : (
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickCategoryCards.map((category) => (
              <Link
                key={category.id}
                to={category.link}
                className="group overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
              >
                {category.image ? (
                  <div className="w-full" style={{ aspectRatio: CATEGORY_CARD_IMAGE_ASPECT_RATIO }}>
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full transition duration-300"
                      style={buildCategoryImageStyle(category.imageAdjust)}
                    />
                  </div>
                ) : (
                  <div
                    className="bg-gradient-to-br from-primary-soft/70 via-surface-tertiary to-surface"
                    style={{ aspectRatio: CATEGORY_CARD_IMAGE_ASPECT_RATIO }}
                  />
                )}
                <div className="space-y-2 p-md">
                  <h3 className="text-lg font-display text-text-primary group-hover:text-primary">{category.name}</h3>
                  <p className="text-sm text-text-secondary">Explore</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </HomeSection>

      <HomeSection
        title="Just Launched"
        subtitle="Fresh products sorted by newest launches."
        actionLabel="View all"
        actionTo={`${ROUTES.PRODUCTS}?sortBy=arrival`}
      >
        {renderProductGrid(newArrivals, 'No new arrivals available yet.')}
      </HomeSection>

      <HomeSection
        title="Trending Now"
        subtitle="Most reviewed products right now."
        actionLabel="Explore trending"
        actionTo={`${ROUTES.PRODUCTS}?sortBy=rating`}
      >
        {renderProductGrid(trendingNow, 'Trending products will appear here as review data grows.')}
      </HomeSection>

      <HomeSection
        title="Hot Deals"
        subtitle="Discounts above 20% selected for today."
        actionLabel="Shop deals"
        actionTo={ROUTES.PRODUCTS}
      >
        {renderProductGrid(hotDeals, 'No deep discount deals are active right now.')}
      </HomeSection>

      <HomeSection title="Shop by Category" subtitle="Browse nested subcategories under each main category.">
        {categoriesLoading ? (
          <div className="flex justify-center py-lg"><Spinner /></div>
        ) : !categoryRoots.length ? (
          <Card className="text-sm text-text-secondary">Category tree is not available right now.</Card>
        ) : (
          <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
            {categoryRoots.slice(0, 6).map((root) => (
              <Card key={root._id} className="space-y-sm">
                <div className="flex items-center justify-between gap-sm">
                  <h3 className="text-lg font-display text-text-primary">{root.name}</h3>
                  <Link to={`${ROUTES.PRODUCTS}?categoryId=${root._id}`} className="text-xs font-semibold text-primary hover:text-primary-hover">
                    View all
                  </Link>
                </div>

                {Array.isArray(root.children) && root.children.length ? (
                  <div className="space-y-2 text-sm">
                    {root.children.slice(0, 5).map((child) => (
                      <Link
                        key={child._id}
                        to={`${ROUTES.PRODUCTS}?categoryId=${child._id}`}
                        className="flex items-center justify-between rounded-md border border-border bg-surface px-sm py-2 text-text-secondary hover:border-primary hover:text-primary"
                      >
                        <span>{child.name}</span>
                        <span className="text-xs text-text-muted">Explore</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">Subcategories will appear as category tree expands.</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </HomeSection>

      {isSeller ? (
        <HomeSection
          title="Your Recent Products"
          subtitle="Latest products from your catalog."
          actionLabel="Manage catalog"
          actionTo={ROUTES.SELLER_PRODUCTS}
        >
          {sectionsLoading ? (
            <div className="flex justify-center py-lg"><Spinner /></div>
          ) : sellerRecentProducts.length ? (
            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {sellerRecentProducts.map((product) => (
                <ProductShowcaseCard
                  key={product._id}
                  product={product}
                  showWishlist={false}
                  showAddToCart={false}
                  exploreLabel="Manage"
                  detailTo={ROUTES.SELLER_PRODUCTS}
                />
              ))}
            </div>
          ) : (
            <Card className="text-sm text-text-secondary">
              No recent products found. Start by adding your first product listing.
            </Card>
          )}
        </HomeSection>
      ) : null}
    </div>
  )
}
