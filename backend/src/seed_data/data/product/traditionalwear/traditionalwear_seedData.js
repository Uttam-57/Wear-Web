import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

const MEN_TRADITIONALWEAR_PRODUCT_CATALOG = buildCatalogSeries({
  count: 50,
  categoryNames: ['Mens Kurta', 'Mens Kurta Pajama Sets', 'Mens Sherwani', 'Mens Nehru Jackets'],
  titleWords: ['Royal', 'Ceremony', 'Regal', 'Utsav', 'Heritage', 'Wedding'],
  brands: ['Manyavar', 'Kisah', 'House of Pataudi', 'Ethnix', 'Fabindia', 'Sojanya'],
  imagePool: [
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1200&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=1200&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1593032465171-8b61c8c687ef?w=1200&q=80',
  ],
  basePrice: 2599,
  sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'],
  specOptions: {
    material: ['Silk Blend', 'Jacquard', 'Cotton Silk', 'Brocade', 'Linen Blend'],
    work: ['Embroidery', 'Zari', 'Printed', 'Woven', 'Thread Work'],
    fit: ['Slim', 'Regular', 'Relaxed'],
    occasion: ['Festive', 'Wedding', 'Ceremony', 'Party'],
    set_includes: ['Single Piece', '2 Piece Set', '3 Piece Set'],
    sleeve: ['Full Sleeve', 'Half Sleeve', 'Sleeveless'],
  },
  descriptionFragments: [
    'Traditional ensemble designed for ceremonies with elevated handcrafted detail.',
    'Cultural wear crafted for standout festive styling and long-hour comfort.',
    'Occasion-ready traditional piece blending heritage motifs with modern tailoring.',
  ],
  extraTags: ['traditionalwear', 'menswear', 'wearweb'],
  gender: 'men',
});

const WOMEN_TRADITIONALWEAR_APPAREL_PRODUCT_CATALOG = buildCatalogSeries({
  count: 40,
  categoryNames: ['Womens Kurta', 'Womens Kurta Sets', 'Womens Ethnic Gowns'],
  titleWords: ['Grace', 'Festive', 'Heritage', 'Royal', 'Elegance', 'Ceremony'],
  brands: ['Biba', 'Libas', 'Anouk', 'Indya', 'W for Woman'],
  imagePool: [
    'https://images.unsplash.com/photo-1611303644828-45a1f7cfbc70?w=1200&q=80',
    'https://images.unsplash.com/photo-1610189012215-45853f4f2d8f?w=1200&q=80',
    'https://images.unsplash.com/photo-1610024062303-e355e94c7a8f?w=1200&q=80',
    'https://images.unsplash.com/photo-1614251056216-f748f76cd228?w=1200&q=80',
  ],
  basePrice: 2199,
  sizeOptions: ['XS', 'S', 'M', 'L', 'XL'],
  specOptions: {
    material: ['Silk Blend', 'Cotton Blend', 'Viscose', 'Georgette', 'Brocade'],
    work: ['Embroidery', 'Zari', 'Printed', 'Woven', 'Thread Work'],
    fit: ['Slim', 'Regular', 'Relaxed'],
    occasion: ['Festive', 'Wedding', 'Ceremony', 'Party'],
    set_includes: ['Single Piece', '2 Piece Set', '3 Piece Set'],
    sleeve: ['Full Sleeve', 'Half Sleeve', 'Sleeveless'],
  },
  descriptionFragments: [
    'Traditional festive wear with elegant drape and artisan-inspired details.',
    'Celebration-ready silhouette crafted for comfort and heritage styling.',
    'Ethnic wear designed for wedding and occasion wardrobes.',
  ],
  extraTags: ['traditionalwear', 'womenswear', 'wearweb'],
  gender: 'women',
});

const WOMEN_TRADITIONALWEAR_SAREE_PRODUCT_CATALOG = buildCatalogSeries({
  count: 10,
  categoryNames: ['Womens Sarees'],
  titleWords: ['Grace', 'Festive', 'Heritage', 'Royal', 'Elegance', 'Ceremony'],
  brands: ['Biba', 'Libas', 'Anouk', 'Indya', 'W for Woman'],
  imagePool: [
    'https://images.unsplash.com/photo-1611303644828-45a1f7cfbc70?w=1200&q=80',
    'https://images.unsplash.com/photo-1610189012215-45853f4f2d8f?w=1200&q=80',
    'https://images.unsplash.com/photo-1610024062303-e355e94c7a8f?w=1200&q=80',
    'https://images.unsplash.com/photo-1614251056216-f748f76cd228?w=1200&q=80',
  ],
  basePrice: 2299,
  sizeOptions: ['Free Size'],
  specOptions: {
    material: ['Silk Blend', 'Cotton Blend', 'Viscose', 'Georgette', 'Brocade'],
    work: ['Embroidery', 'Zari', 'Printed', 'Woven', 'Thread Work'],
    fit: ['Regular'],
    occasion: ['Festive', 'Wedding', 'Ceremony', 'Party'],
    set_includes: ['Single Piece', '2 Piece Set'],
    sleeve: ['Not Applicable'],
  },
  descriptionFragments: [
    'Traditional festive wear with elegant drape and artisan-inspired details.',
    'Celebration-ready silhouette crafted for comfort and heritage styling.',
    'Ethnic wear designed for wedding and occasion wardrobes.',
  ],
  extraTags: ['traditionalwear', 'womenswear', 'wearweb'],
  gender: 'women',
});

export const TRADITIONALWEAR_PRODUCT_CATALOG = [
  ...MEN_TRADITIONALWEAR_PRODUCT_CATALOG,
  ...WOMEN_TRADITIONALWEAR_APPAREL_PRODUCT_CATALOG,
  ...WOMEN_TRADITIONALWEAR_SAREE_PRODUCT_CATALOG,
];
