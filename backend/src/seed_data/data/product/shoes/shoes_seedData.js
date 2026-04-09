import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

const RUNNING_AND_SNEAKER_PRODUCT_CATALOG = buildCatalogSeries({
  count: 18,
  categoryNames: ['Running Shoes', 'Casual Sneakers'],
  titleWords: ['Stride', 'Street', 'Comfort', 'Active', 'Daily', 'Classic'],
  brands: ['Nike', 'Puma', 'Adidas', 'Hush Puppies', 'Mochi', 'Skechers'],
  imagePool: [
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80',
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80',
    'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1200&q=80',
  ],
  basePrice: 1899,
  sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
  specOptions: {
    upper_material: ['Mesh', 'Synthetic', 'Leather', 'PU', 'Canvas'],
    sole_material: ['Rubber', 'EVA', 'TPR', 'PU'],
    closure: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'],
    occasion: ['Casual', 'Sports', 'Formal', 'Party'],
    sport_type: ['Running', 'Walking', 'Training', 'Not Applicable'],
    heel_type: ['Flat', 'Block Heel', 'Stiletto', 'Not Applicable'],
  },
  descriptionFragments: [
    'Lightweight footwear made for movement, comfort, and daily reliability.',
    'Versatile shoe profile balancing support with modern street-ready styling.',
    'Durable outsole and cushioned feel designed for long wear sessions.',
  ],
  extraTags: ['shoes', 'footwear', 'wearweb'],
  gender: 'unisex',
});

const FORMAL_SHOES_PRODUCT_CATALOG = buildCatalogSeries({
  count: 10,
  categoryNames: ['Formal Shoes'],
  titleWords: ['Stride', 'Street', 'Comfort', 'Active', 'Daily', 'Classic'],
  brands: ['Nike', 'Puma', 'Adidas', 'Hush Puppies', 'Mochi', 'Skechers'],
  imagePool: [
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80',
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80',
    'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1200&q=80',
  ],
  basePrice: 2299,
  sizeOptions: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
  specOptions: {
    upper_material: ['Mesh', 'Synthetic', 'Leather', 'PU', 'Canvas'],
    sole_material: ['Rubber', 'EVA', 'TPR', 'PU'],
    closure: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'],
    occasion: ['Casual', 'Sports', 'Formal', 'Party'],
    sport_type: ['Running', 'Walking', 'Training', 'Not Applicable'],
    heel_type: ['Flat', 'Block Heel', 'Stiletto', 'Not Applicable'],
  },
  descriptionFragments: [
    'Lightweight footwear made for movement, comfort, and daily reliability.',
    'Versatile shoe profile balancing support with modern street-ready styling.',
    'Durable outsole and cushioned feel designed for long wear sessions.',
  ],
  extraTags: ['shoes', 'footwear', 'wearweb'],
  gender: 'men',
});

const FLATS_AND_HEELS_PRODUCT_CATALOG = buildCatalogSeries({
  count: 14,
  categoryNames: ['Flats', 'Heels'],
  titleWords: ['Stride', 'Street', 'Comfort', 'Active', 'Daily', 'Classic'],
  brands: ['Nike', 'Puma', 'Adidas', 'Hush Puppies', 'Mochi', 'Skechers'],
  imagePool: [
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80',
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80',
    'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1200&q=80',
  ],
  basePrice: 1799,
  sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'],
  specOptions: {
    upper_material: ['Mesh', 'Synthetic', 'Leather', 'PU', 'Canvas'],
    sole_material: ['Rubber', 'EVA', 'TPR', 'PU'],
    closure: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'],
    occasion: ['Casual', 'Sports', 'Formal', 'Party'],
    sport_type: ['Running', 'Walking', 'Training', 'Not Applicable'],
    heel_type: ['Flat', 'Block Heel', 'Stiletto', 'Not Applicable'],
  },
  descriptionFragments: [
    'Lightweight footwear made for movement, comfort, and daily reliability.',
    'Versatile shoe profile balancing support with modern street-ready styling.',
    'Durable outsole and cushioned feel designed for long wear sessions.',
  ],
  extraTags: ['shoes', 'footwear', 'wearweb'],
  gender: 'women',
});

const KIDS_SNEAKER_PRODUCT_CATALOG = buildCatalogSeries({
  count: 8,
  categoryNames: ['Kids Sneakers'],
  titleWords: ['Stride', 'Street', 'Comfort', 'Active', 'Daily', 'Classic'],
  brands: ['Nike', 'Puma', 'Adidas', 'Hush Puppies', 'Mochi', 'Skechers'],
  imagePool: [
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80',
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80',
    'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1200&q=80',
  ],
  basePrice: 1499,
  sizeOptions: ['UK 11C', 'UK 12C', 'UK 13C', 'UK 1', 'UK 2', 'UK 3'],
  specOptions: {
    upper_material: ['Mesh', 'Synthetic', 'Leather', 'PU', 'Canvas'],
    sole_material: ['Rubber', 'EVA', 'TPR', 'PU'],
    closure: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'],
    occasion: ['Casual', 'Sports', 'Formal', 'Party'],
    sport_type: ['Running', 'Walking', 'Training', 'Not Applicable'],
    heel_type: ['Flat', 'Block Heel', 'Stiletto', 'Not Applicable'],
  },
  descriptionFragments: [
    'Lightweight footwear made for movement, comfort, and daily reliability.',
    'Versatile shoe profile balancing support with modern street-ready styling.',
    'Durable outsole and cushioned feel designed for long wear sessions.',
  ],
  extraTags: ['shoes', 'footwear', 'wearweb'],
  gender: 'unisex',
});

export const SHOES_PRODUCT_CATALOG = [
  ...RUNNING_AND_SNEAKER_PRODUCT_CATALOG,
  ...FORMAL_SHOES_PRODUCT_CATALOG,
  ...FLATS_AND_HEELS_PRODUCT_CATALOG,
  ...KIDS_SNEAKER_PRODUCT_CATALOG,
];
