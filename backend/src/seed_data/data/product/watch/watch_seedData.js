import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

export const WATCH_PRODUCT_CATALOG = buildCatalogSeries({
  count: 30,
  categoryNames: ['Analog Watches', 'Smart Watches', 'Sports Watches', 'Luxury Watches'],
  titleWords: ['Classic', 'Smart', 'Active', 'Luxury', 'Urban'],
  brands: ['Titan', 'Casio', 'Fastrack', 'Noise', 'Boat'],
  imagePool: [
    'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1200&q=80',
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=1200&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
    'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=1200&q=80',
  ],
  basePrice: 2899,
  sizeOptions: ['Free Size'],
  specOptions: {
    display_type: ['Analog', 'Digital', 'Analog-Digital'],
    dial_shape: ['Round', 'Square', 'Rectangle'],
    strap_material: ['Silicone', 'Leather', 'Stainless Steel', 'Nylon'],
    water_resistance: ['30 m', '50 m', '100 m'],
    compatible_os: ['Android', 'iOS', 'Android & iOS', 'Not Applicable'],
  },
  descriptionFragments: [
    'Precision watch design tuned for style and dependable everyday utility.',
    'Comfortable wrist profile with practical features and clean finishing.',
    'Daily and occasion-ready watch made for long-term reliability.',
  ],
  extraTags: ['watch', 'wearables', 'wearweb'],
  gender: 'unisex',
});
