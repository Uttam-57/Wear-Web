import { buildCatalogSeries } from '../../../implemented/catalog.factory.js';

const MEN_FORMALWEAR_PRODUCT_CATALOG = buildCatalogSeries({
  count: 50,
  categoryNames: ['Mens Formal Suits', 'Mens Formal Blazers', 'Mens Formal Trousers', 'Mens Waistcoats'],
  titleWords: ['Executive', 'Boardroom', 'Monarch', 'Premier', 'Signature', 'Refined'],
  brands: ['Raymond', 'Louis Philippe', 'Allen Solly', 'Van Heusen', 'Blackberrys', 'Park Avenue'],
  imagePool: [
    'https://images.unsplash.com/photo-1592878904946-b3cd5c7f7b7c?w=1200&q=80',
    'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=80',
    'https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
  ],
  basePrice: 2299,
  sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'],
  specOptions: {
    material: ['Poly-Viscose', 'Wool Blend', 'Cotton Blend', 'Linen Blend'],
    pattern: ['Solid', 'Pinstripe', 'Checked', 'Textured'],
    fit: ['Slim', 'Regular', 'Tailored'],
    occasion: ['Office', 'Business', 'Wedding', 'Evening'],
    closure: ['Button', 'Hook', 'Zip'],
    care: ['Dry Clean', 'Gentle Wash', 'Steam Press'],
  },
  descriptionFragments: [
    'Sharp formalwear tailored for business days and formal occasions.',
    'Clean-cut formal silhouette with structure, comfort, and premium handfeel.',
    'Refined formal piece built for confident office and event dressing.',
    'Professional formalwear designed for repeat, all-season usability.',
  ],
  extraTags: ['formalwear', 'menswear', 'wearweb'],
  gender: 'men',
});

const WOMEN_FORMALWEAR_PRODUCT_CATALOG = buildCatalogSeries({
  count: 50,
  categoryNames: ['Womens Formal Blazers', 'Womens Formal Trousers', 'Womens Formal Shirts', 'Womens Formal Skirts'],
  titleWords: ['Elegance', 'Office', 'Tailored', 'Classic', 'Premium', 'Confident'],
  brands: ['Van Heusen Woman', 'AND', 'Allen Solly Woman', 'W for Woman', 'Biba Woman'],
  imagePool: [
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=80',
    'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=1200&q=80',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80',
  ],
  basePrice: 1999,
  sizeOptions: ['XS', 'S', 'M', 'L', 'XL'],
  specOptions: {
    material: ['Poly-Viscose', 'Cotton Blend', 'Linen Blend', 'Crepe'],
    pattern: ['Solid', 'Pinstripe', 'Checked', 'Textured'],
    fit: ['Slim', 'Regular', 'Tailored'],
    occasion: ['Office', 'Business', 'Meeting', 'Evening'],
    closure: ['Button', 'Hook', 'Zip'],
    care: ['Dry Clean', 'Gentle Wash', 'Steam Press'],
  },
  descriptionFragments: [
    'Contemporary formalwear tailored for polished office dressing.',
    'Sharp structured silhouette balancing comfort and confidence.',
    'Professional formal style with modern cuts and clean finishing.',
  ],
  extraTags: ['formalwear', 'womenswear', 'wearweb'],
  gender: 'women',
});

export const FORMALWEAR_PRODUCT_CATALOG = [
  ...MEN_FORMALWEAR_PRODUCT_CATALOG,
  ...WOMEN_FORMALWEAR_PRODUCT_CATALOG,
];
