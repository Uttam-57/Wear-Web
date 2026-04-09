import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

export const ACCESSORY_PRODUCT_CATALOG = buildCatalogSeries({
  count: 30,
  categoryNames: ['Rings', 'Belts', 'Wallets', 'Jewellery'],
  titleWords: ['Classic', 'Urban', 'Premium', 'Heritage', 'Minimal', 'Signature'],
  brands: ['Fastrack', 'Titan', 'Tommy Hilfiger', 'Hidesign', 'Carlton London', 'Lavie'],
  imagePool: [
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80',
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80',
    'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80',
    'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80',
  ],
  basePrice: 899,
  sizeOptions: ['Free Size'],
  specOptions: {
    material: ['Leather', 'Faux Leather', 'Sterling Silver', 'Stainless Steel', 'Canvas'],
    type: ['Casual', 'Formal', 'Festive', 'Daily Wear'],
    occasion: ['Casual', 'Office', 'Party', 'Festive'],
    closure: ['Buckle', 'Zip', 'Magnet', 'Slip-In', 'Clasp'],
    care: ['Dry Cloth', 'Keep Dry', 'Store Flat', 'Avoid Perfume Contact'],
  },
  descriptionFragments: [
    'Refined accessory crafted for elevated everyday looks.',
    'Contemporary accessory with premium finish and practical usability.',
    'Versatile styling piece made to pair with smart and casual outfits.',
  ],
  extraTags: ['accessory', 'fashion', 'style'],
  gender: 'unisex',
});
