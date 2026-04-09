import slugify from 'slugify';

import Category from '../../modules/category/category.model.js';
import CategoryTemplate from '../../modules/category/categoryTemplate.model.js';
import Product from '../../modules/product/product.model.js';
import User from '../../modules/user/user.model.js';
import SellerProfile from '../../modules/user/sellerProfile.model.js';

import { PRODUCT_CATALOG } from '../data/product/index.js';

const mapSpecsObjectToArray = (specifications) =>
  Object.entries(specifications).map(([key, value]) => ({ key, value }));

const BRAND_POOL = [
  'Roadster',
  'Levis',
  'Nike',
  'Puma',
  'Titan',
  'Mast & Harbour',
  'HRX',
  'Van Heusen',
  'U.S. Polo Assn.',
  'Bewakoof',
  'Libas',
  'Mochi',
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80',
  'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1200&q=80',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80',
  'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80',
];

const COLOR_POOL = [
  { colorName: 'Jet Black', colorCode: '#111111', baseColor: 'Black' },
  { colorName: 'Cloud White', colorCode: '#F3F4F6', baseColor: 'White' },
  { colorName: 'Navy Blue', colorCode: '#1E3A8A', baseColor: 'Blue' },
  { colorName: 'Forest Green', colorCode: '#166534', baseColor: 'Green' },
  { colorName: 'Charcoal Grey', colorCode: '#4B5563', baseColor: 'Grey' },
  { colorName: 'Rust Orange', colorCode: '#C2410C', baseColor: 'Orange' },
  { colorName: 'Wine Red', colorCode: '#7F1D1D', baseColor: 'Red' },
  { colorName: 'Sand Beige', colorCode: '#D6D3D1', baseColor: 'Beige' },
  { colorName: 'Coffee Brown', colorCode: '#7C2D12', baseColor: 'Brown' },
  { colorName: 'Rose Gold', colorCode: '#B76E79', baseColor: 'Gold' },
  { colorName: 'Steel Silver', colorCode: '#C0C0C0', baseColor: 'Silver' },
  { colorName: 'Berry Pink', colorCode: '#DB2777', baseColor: 'Pink' },
  { colorName: 'Sun Yellow', colorCode: '#EAB308', baseColor: 'Yellow' },
  { colorName: 'Royal Purple', colorCode: '#7C3AED', baseColor: 'Purple' },
  { colorName: 'Play Mix', colorCode: '#6366F1', baseColor: 'Multicolor' },
];

const REVIEW_RATINGS = [2.6, 2.9, 3.2, 3.5, 3.8, 4.1, 4.4, 4.7];

const buildSlug = (name, sellerId, index) => {
  const base = slugify(name, { lower: true, strict: true });
  return `${base}-${String(sellerId).slice(-6)}-${index + 1}`;
};

const pick = (list, index) => list[index % list.length];

const inferGenderFromCategory = (categoryName = '') => {
  const lookup = categoryName.toLowerCase();
  if (lookup.includes('women')) return 'women';
  if (lookup.includes('men')) return 'men';
  if (lookup.includes('kids') || lookup.includes('boys') || lookup.includes('girls')) return 'unisex';
  if (
    lookup.includes('ring') ||
    lookup.includes('belt') ||
    lookup.includes('wallet') ||
    lookup.includes('jewel') ||
    lookup.includes('accessor')
  ) {
    return 'unisex';
  }
  if (
    lookup.includes('kurta') ||
    lookup.includes('sherwani') ||
    lookup.includes('nehru') ||
    lookup.includes('dhoti') ||
    lookup.includes('waistcoat') ||
    lookup.includes('blazer') ||
    lookup.includes('trouser') ||
    lookup.includes('suit')
  ) {
    return 'men';
  }
  if (
    lookup.includes('saree') ||
    lookup.includes('dress') ||
    lookup.includes('heels') ||
    lookup.includes('flats') ||
    lookup.includes('women')
  ) {
    return 'women';
  }
  if (
    lookup.includes('shirt') ||
    lookup.includes('t-shirt') ||
    lookup.includes('shoes') ||
    lookup.includes('sneakers') ||
    lookup.includes('watch')
  ) {
    return 'men';
  }
  return 'unisex';
};

const inferProductGender = (productSeed) => {
  if (productSeed.gender) return productSeed.gender;

  if (productSeed.categoryName) {
    const categoryGender = inferGenderFromCategory(productSeed.categoryName);
    if (categoryGender) return categoryGender;
  }

  const lookup = `${productSeed.categoryName} ${productSeed.name} ${(productSeed.tags ?? []).join(' ')}`.toLowerCase();

  if (lookup.includes('boys')) return 'boys';
  if (lookup.includes('girls')) return 'girls';
  if (lookup.includes('kids')) return 'unisex';
  if (lookup.includes('women')) return 'women';
  if (lookup.includes('men')) return 'men';
  if (
    lookup.includes('saree') ||
    lookup.includes('dress') ||
    lookup.includes('heels') ||
    lookup.includes('flats') ||
    lookup.includes('women')
  ) {
    return 'women';
  }
  if (
    lookup.includes('kurta') ||
    lookup.includes('sherwani') ||
    lookup.includes('nehru') ||
    lookup.includes('dhoti') ||
    lookup.includes('waistcoat') ||
    lookup.includes('blazer') ||
    lookup.includes('trouser') ||
    lookup.includes('formal suit') ||
    lookup.includes('men')
  ) {
    return 'men';
  }
  if (
    lookup.includes('formal shirt') ||
    lookup.includes('checked shirt') ||
    lookup.includes('plain shirt') ||
    lookup.includes('running shoes')
  ) {
    return 'men';
  }

  return 'unisex';
};

const buildGeneratedSpecifications = (template, seedIndex) => {
  const specifications = {};
  const specFields = Array.isArray(template?.specFields) ? template.specFields : [];

  specFields.forEach((field, index) => {
    const options = Array.isArray(field.filterOptions) ? field.filterOptions.filter(Boolean) : [];
    const selectedValue = options.length > 0 ? pick(options, seedIndex + index) : 'Standard';
    specifications[field.key] = selectedValue;
  });

  return specifications;
};

const buildGeneratedVariants = (template, seedIndex, makeOutOfStock) => {
  const sizes = Array.isArray(template?.sizeOptions) && template.sizeOptions.length > 0
    ? template.sizeOptions
    : ['Free Size'];

  const variantCount = sizes.includes('Free Size') && sizes.length === 1 ? 1 : Math.min(3, sizes.length);
  const variants = [];

  for (let index = 0; index < variantCount; index += 1) {
    const color = pick(COLOR_POOL, seedIndex + index);
    const size = pick(sizes, seedIndex + index);
    const price = 699 + ((seedIndex * 173 + index * 89) % 4800);
    const discount = [0, 10, 12, 15, 20, 25][(seedIndex + index) % 6];
    const stock = makeOutOfStock ? 0 : 4 + ((seedIndex * 5 + index * 7) % 30);

    variants.push({
      ...color,
      size,
      price,
      stock,
      discount,
    });
  }

  return variants;
};

const buildGeneratedProductSeed = ({ categoryName, template, seedIndex }) => {
  const descriptors = ['Classic', 'Daily', 'Premium', 'Urban', 'Signature', 'Smart'];
  const descriptor = pick(descriptors, seedIndex);
  const brand = pick(BRAND_POOL, seedIndex);
  const makeOutOfStock = seedIndex % 11 === 0;

  return {
    categoryName,
    name: `${descriptor} ${categoryName} ${seedIndex + 1}`,
    brand,
    description: `${categoryName} designed for everyday comfort and reliable quality with a modern look.`,
    highlights: ['Quality-tested material', 'Comfort focused fit', 'Designed for daily wear'],
    tags: categoryName.toLowerCase().split(/\s+/).concat(['fashion', 'wearweb']),
    images: [
      pick(FALLBACK_IMAGES, seedIndex),
      pick(FALLBACK_IMAGES, seedIndex + 1),
    ],
    variants: buildGeneratedVariants(template, seedIndex, makeOutOfStock),
    specifications: buildGeneratedSpecifications(template, seedIndex),
    gender: inferGenderFromCategory(categoryName),
  };
};

const buildManufacturerDetails = (productSeed, index) => {
  return {
    name: `${productSeed.brand} Manufacturing Unit ${String((index % 6) + 1).padStart(2, '0')}`,
    address: `Plot ${100 + (index % 48)}, Industrial Estate, Surat, Gujarat, India`,
    countryOfOrigin: 'India',
    importerName: `${productSeed.brand} Imports Pvt. Ltd.`,
    packerDetails: `${productSeed.brand} Packaging Center, Ahmedabad`,
  };
};

const buildShippingInfo = (variants, index) => {
  const isFootwear = variants.some((variant) => String(variant.size).toUpperCase().includes('UK'));
  const isWatch = variants.every((variant) => String(variant.size).toLowerCase() === 'free size');

  if (isWatch) {
    return {
      weight: 220 + (index % 70),
      length: 12,
      breadth: 9,
      height: 7,
    };
  }

  if (isFootwear) {
    return {
      weight: 650 + (index % 160),
      length: 32,
      breadth: 22,
      height: 12,
    };
  }

  return {
    weight: 320 + (index % 130),
    length: 28,
    breadth: 20,
    height: 5,
  };
};

const buildDescriptionBlocks = (productSeed) => {
  const highlights = Array.isArray(productSeed.highlights) ? productSeed.highlights.filter(Boolean) : [];

  return [
    {
      type: 'heading',
      content: 'Product Story',
      items: [],
    },
    {
      type: 'paragraph',
      content: productSeed.description,
      items: [],
    },
    {
      type: 'bullets',
      content: null,
      items: highlights.length ? highlights : ['Designed for daily comfort', 'Quality tested and durable'],
    },
  ];
};

const validateProductAgainstTemplate = ({ productSeed, template, categoryName }) => {
  const allowedSizes = new Set(template.sizeOptions ?? []);
  const allowedSpecKeys = new Set((template.specFields ?? []).map((field) => field.key));

  for (const variant of productSeed.variants) {
    if (!allowedSizes.has(variant.size)) {
      throw new Error(
        `Invalid size "${variant.size}" for product "${productSeed.name}" in category "${categoryName}". Allowed: ${[...allowedSizes].join(', ')}`
      );
    }
  }

  for (const key of Object.keys(productSeed.specifications)) {
    if (!allowedSpecKeys.has(key)) {
      throw new Error(
        `Invalid specification key "${key}" for product "${productSeed.name}" in category "${categoryName}". Allowed: ${[...allowedSpecKeys].join(', ')}`
      );
    }
  }
};

export const seedProducts = async ({ clearExisting = true } = {}) => {
  if (clearExisting) {
    console.log('Clearing old products...');
    await Product.deleteMany({});
  }

  const templates = await CategoryTemplate.find({}).lean();
  const templateCategoryIds = templates.map((template) => template.categoryId);
  const categories = await Category.find({ _id: { $in: templateCategoryIds } }).select('_id name slug');
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));
  const leafCategoryEntries = templates
    .map((template) => ({ template, category: categoryById.get(String(template.categoryId)) }))
    .filter((entry) => Boolean(entry.category));

  const catalogByCategoryName = PRODUCT_CATALOG.reduce((acc, item) => {
    const existing = acc.get(item.categoryName) || [];
    existing.push(item);
    acc.set(item.categoryName, existing);
    return acc;
  }, new Map());

  const missingCatalogLeafCategories = leafCategoryEntries
    .filter(({ category }) => !catalogByCategoryName.has(category.name))
    .map(({ category }) => category.name);

  if (missingCatalogLeafCategories.length > 0) {
    console.log(`Generating fallback products for missing leaf categories: ${missingCatalogLeafCategories.join(', ')}`);
  }

  const completedSellerProfiles = await SellerProfile.find({ profileComplete: true }).select('userId');
  const completedSellerIds = completedSellerProfiles.map((profile) => profile.userId);
  const sellers = await User.find({ _id: { $in: completedSellerIds }, role: 'seller', status: 'active' }).select('_id firstName');

  if (sellers.length === 0) {
    throw new Error('No approved sellers with completed profile found. Seed users first.');
  }

  const existingSlugs = new Set((await Product.find({}, { slug: 1, _id: 0 }).lean()).map((product) => product.slug));

  const resolvedSeeds = [];
  let generatedSeedCount = 0;
  let generatedSeedCursor = 0;

  for (const { category, template } of leafCategoryEntries) {
    const catalogSeeds = catalogByCategoryName.get(category.name) || [];
    const minProductsPerLeaf = 2;
    const targetCount = Math.max(minProductsPerLeaf, catalogSeeds.length);

    for (let localIndex = 0; localIndex < targetCount; localIndex += 1) {
      let productSeed = catalogSeeds[localIndex];

      if (!productSeed) {
        productSeed = buildGeneratedProductSeed({
          categoryName: category.name,
          template,
          seedIndex: generatedSeedCursor,
        });
        generatedSeedCount += 1;
        generatedSeedCursor += 1;
      }

      resolvedSeeds.push({
        productSeed,
        category,
        template,
      });
    }
  }

  const createdProducts = [];
  for (let index = 0; index < resolvedSeeds.length; index += 1) {
    const { productSeed, category, template } = resolvedSeeds[index];

    validateProductAgainstTemplate({
      productSeed,
      template,
      categoryName: productSeed.categoryName,
    });

    const seller = sellers[index % sellers.length];
    let slug = buildSlug(productSeed.name, seller._id, index);
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${buildSlug(productSeed.name, seller._id, index)}-${suffix}`;
      suffix += 1;
    }
    existingSlugs.add(slug);

    const variants = productSeed.variants.map((variant) => ({
      ...variant,
      minOrderQty: 1,
    }));
    const colorNames = [...new Set(variants.map((variant) => variant.colorName))];
    const baseColors = [...new Set(variants.map((variant) => variant.baseColor))];
    const totalReviews = index % 6 === 0 ? 0 : 6 + ((index * 11) % 160);
    const avgRating = totalReviews > 0 ? pick(REVIEW_RATINGS, index) : 0;
    const now = Date.now();
    const createdAt = new Date(now - ((index % 75) * 24 * 60 * 60 * 1000) - ((index % 17) * 60 * 60 * 1000));
    const manufacturerDetails = buildManufacturerDetails(productSeed, index);
    const shippingInfo = buildShippingInfo(variants, index);
    const descriptionBlocks = buildDescriptionBlocks(productSeed);
    const isPack = index % 7 === 0;

    const product = await Product.create({
      name: productSeed.name,
      slug,
      sellerId: seller._id,
      categoryId: category._id,
      brand: productSeed.brand,
      gender: inferProductGender(productSeed),
      tags: productSeed.tags,
      highlights: productSeed.highlights,
      images: productSeed.images.map((url) => ({ url, publicId: null })),
      variants,
      colorNames,
      baseColors,
      description: productSeed.description,
      descriptionBlocks,
      specifications: mapSpecsObjectToArray(productSeed.specifications),
      manufacturerDetails,
      shippingInfo,
      isCODAvailable: index % 4 !== 0,
      packInfo: {
        isPack,
        packOf: isPack ? 2 + (index % 3) : 1,
      },
      returnPolicy: {
        returnable: index % 5 !== 0,
        returnWindow: index % 3 === 0 ? 10 : 7,
      },
      avgRating,
      totalReviews,
      status: 'active',
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000),
    });

    createdProducts.push(product);
  }

  console.log(`Seeded ${createdProducts.length} products across ${leafCategoryEntries.length} leaf categories (generated: ${generatedSeedCount}).`);
  return {
    productCount: createdProducts.length,
    categoryCountUsed: leafCategoryEntries.length,
    generatedProducts: generatedSeedCount,
    missingCatalogLeafCategories,
    sellersUsed: sellers.length,
  };
};

export default seedProducts;