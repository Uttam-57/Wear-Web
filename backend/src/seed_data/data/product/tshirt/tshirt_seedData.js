import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

const ADULT_TSHIRT_PRODUCT_CATALOG = buildCatalogSeries({
  count: 40,
  categoryNames: ['Solid T-Shirts', 'Graphic T-Shirts', 'Polo T-Shirts', 'Oversized T-Shirts'],
  titleWords: ['Core', 'Street', 'Comfort', 'Athletic', 'Weekend', 'Graphic', 'Minimal'],
  brands: ['Levis', 'HRX', 'U.S. Polo Assn.', 'Bewakoof', 'Puma'],
  imagePool: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1618354691267-3f3225ea236c?w=1200&q=80',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1200&q=80',
  ],
  basePrice: 899,
  sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'],
  specOptions: {
    material: ['Cotton', 'Cotton Blend', 'Polyester'],
    pattern: ['Solid', 'Graphic', 'Printed', 'Color Block'],
    fit: ['Slim', 'Regular', 'Relaxed', 'Oversized'],
    occasion: ['Casual', 'Sports', 'Daily Wear'],
    neck: ['Round Neck', 'V-Neck', 'Polo Collar'],
    sleeve: ['Half Sleeve', 'Full Sleeve'],
  },
  descriptionFragments: [
    'Soft-knit t-shirt built for comfort and repeat everyday use.',
    'Modern t-shirt with trend-led visuals and breathable fabric feel.',
    'Performance-minded tee balancing movement ease and style.',
    'Versatile t-shirt cut to pair with jeans, joggers, and shorts.',
  ],
  extraTags: ['t-shirt', 'casualwear', 'wearweb'],
  gender: 'unisex',
});

const KIDS_TSHIRT_PRODUCT_CATALOG = buildCatalogSeries({
  count: 10,
  categoryNames: ['Kids T-Shirts'],
  titleWords: ['Play', 'Bright', 'Happy', 'Weekend', 'Cool'],
  brands: ['Allen Solly Junior', 'Hopscotch', 'United Colors Kids'],
  imagePool: [
    'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80',
  ],
  basePrice: 649,
  sizeOptions: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
  specOptions: {
    material: ['Cotton', 'Cotton Blend'],
    pattern: ['Solid', 'Graphic', 'Printed', 'Color Block'],
    fit: ['Regular', 'Relaxed'],
    occasion: ['Casual', 'Sports', 'Daily Wear'],
    neck: ['Round Neck', 'Polo Collar'],
    sleeve: ['Half Sleeve', 'Full Sleeve'],
  },
  descriptionFragments: [
    'Kid-friendly t-shirt built for comfort and active movement.',
    'Play-ready tee with soft fabric and durable stitching.',
    'Lightweight kids t-shirt designed for all-day wear.',
  ],
  extraTags: ['kids', 't-shirt', 'casualwear', 'wearweb'],
  gender: 'unisex',
});

export const TSHIRT_PRODUCT_CATALOG = [
  ...ADULT_TSHIRT_PRODUCT_CATALOG,
  ...KIDS_TSHIRT_PRODUCT_CATALOG,
];
