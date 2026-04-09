import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

export const SHIRT_PRODUCT_CATALOG = buildCatalogSeries({
  count: 50,
  categoryNames: ['Plain Shirts', 'Checked Shirts', 'Striped Shirts', 'Linen Shirts', 'Formal Shirts'],
  titleWords: ['Classic', 'Executive', 'Refined', 'Smart', 'Everyday', 'Heritage', 'Urban'],
  brands: ['Van Heusen', 'Louis Philippe', 'Arrow', 'Park Avenue', 'Peter England', 'Roadster'],
  imagePool: [
    'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=1200&q=80',
    'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80',
    'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=1200&q=80',
    'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80',
  ],
  basePrice: 1499,
  sizeOptions: ['38', '39', '40', '42', '44'],
  specOptions: {
    material: ['Cotton', 'Cotton Blend', 'Linen', 'Viscose'],
    pattern: ['Solid', 'Checked', 'Striped', 'Printed'],
    fit: ['Slim', 'Regular', 'Relaxed'],
    occasion: ['Casual', 'Formal', 'Party', 'Daily Wear'],
    sleeve: ['Full Sleeve', 'Half Sleeve'],
    collar: ['Spread', 'Button Down', 'Mandarin', 'Cutaway'],
  },
  descriptionFragments: [
    'Tailored shirt profile with breathable construction and all-day polish.',
    'Structured shirt crafted for smart-casual and office-ready rotations.',
    'Comfort-first shirt with elevated detailing and clean silhouette.',
    'Modern shirting essential designed for dependable daily wear.',
  ],
  extraTags: ['shirt', 'menswear', 'wearweb'],
  gender: 'men',
});
