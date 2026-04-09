const buildUnsplashImage = (photoId, width, quality = 70) => {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&fm=webp&w=${width}&q=${quality}`
}

const buildUnsplashSrcSet = (photoId, widths, quality = 70) => {
  return widths.map((width) => `${buildUnsplashImage(photoId, width, quality)} ${width}w`).join(', ')
}

export const HERO_SLIDES = [
  {
    title: 'Spring Looks Are Live',
    subtitle: 'Fresh outfits from trusted sellers with quick delivery options.',
    image: buildUnsplashImage('photo-1464863979621-258859e62245', 1280, 68),
    imageSet: buildUnsplashSrcSet('photo-1464863979621-258859e62245', [768, 1024, 1280, 1600], 68),
    sizes: '100vw',
  },
  {
    title: 'Streetwear That Moves',
    subtitle: 'Build your look with trending drops for men, women, and unisex styles.',
    image: buildUnsplashImage('photo-1483985988355-763728e1935b', 1280, 68),
    imageSet: buildUnsplashSrcSet('photo-1483985988355-763728e1935b', [768, 1024, 1280, 1600], 68),
    sizes: '100vw',
  },
  {
    title: 'Seller Picks of the Week',
    subtitle: 'Explore high-rated products and new arrivals curated for everyday wear.',
    image: buildUnsplashImage('photo-1445205170230-053b83016050', 1280, 68),
    imageSet: buildUnsplashSrcSet('photo-1445205170230-053b83016050', [768, 1024, 1280, 1600], 68),
    sizes: '100vw',
  },
]

export const GENDER_TILES = [
  {
    label: 'Shop Men',
    gender: 'men',
    image: buildUnsplashImage('photo-1490578474895-699cd4e2cf59', 960, 68),
    imageSet: buildUnsplashSrcSet('photo-1490578474895-699cd4e2cf59', [480, 720, 960], 68),
    sizes: '(min-width: 768px) 33vw, 100vw',
  },
  {
    label: 'Shop Women',
    gender: 'women',
    image: buildUnsplashImage('photo-1487412720507-e7ab37603c6f', 960, 68),
    imageSet: buildUnsplashSrcSet('photo-1487412720507-e7ab37603c6f', [480, 720, 960], 68),
    sizes: '(min-width: 768px) 33vw, 100vw',
  },
  {
    label: 'Shop Unisex',
    gender: 'unisex',
    image: buildUnsplashImage('photo-1529139574466-a303027c1d8b', 960, 68),
    imageSet: buildUnsplashSrcSet('photo-1529139574466-a303027c1d8b', [480, 720, 960], 68),
    sizes: '(min-width: 768px) 33vw, 100vw',
  },
]

export const CATEGORY_FALLBACKS = [
  { id: 'men', name: "Men's Fashion", query: 'men fashion' },
  { id: 'women', name: "Women's Fashion", query: 'women fashion' },
  { id: 'kids', name: 'Kids Wear', query: 'kids wear' },
  { id: 'accessories', name: 'Accessories', query: 'accessories' },
  { id: 'footwear', name: 'Footwear', query: 'footwear' },
  { id: 'activewear', name: 'Activewear', query: 'activewear' },
]
