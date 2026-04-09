const COLOR_POOL = [
  { colorName: 'Jet Black', colorCode: '#111111', baseColor: 'Black' },
  { colorName: 'Cloud White', colorCode: '#F3F4F6', baseColor: 'White' },
  { colorName: 'Navy Blue', colorCode: '#1E3A8A', baseColor: 'Blue' },
  { colorName: 'Forest Green', colorCode: '#166534', baseColor: 'Green' },
  { colorName: 'Charcoal Grey', colorCode: '#4B5563', baseColor: 'Grey' },
  { colorName: 'Sand Beige', colorCode: '#D6D3D1', baseColor: 'Beige' },
  { colorName: 'Coffee Brown', colorCode: '#7C2D12', baseColor: 'Brown' },
  { colorName: 'Wine Red', colorCode: '#7F1D1D', baseColor: 'Red' },
  { colorName: 'Steel Silver', colorCode: '#C0C0C0', baseColor: 'Silver' },
];

const pick = (items, index) => items[index % items.length];

const normalizeTag = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const buildSpecifications = (specOptions, index) => {
  const specs = {};
  Object.entries(specOptions).forEach(([key, options], offset) => {
    specs[key] = pick(options, index + offset);
  });
  return specs;
};

const buildVariants = ({ sizes, basePrice, index }) => {
  if (sizes.length === 1 && sizes[0] === 'Free Size') {
    const color = pick(COLOR_POOL, index);
    return [{
      ...color,
      size: 'Free Size',
      price: basePrice + ((index * 43) % 600),
      stock: 8 + ((index * 5) % 30),
      discount: [5, 10, 15, 20][index % 4],
    }];
  }

  const localSizes = [
    pick(sizes, index),
    pick(sizes, index + 1),
    pick(sizes, index + 2),
  ];

  return localSizes.map((size, offset) => {
    const color = pick(COLOR_POOL, index + offset);
    return {
      ...color,
      size,
      price: basePrice + ((index * 47 + offset * 29) % 900),
      stock: 12 + ((index * 7 + offset * 5) % 35),
      discount: [8, 10, 12, 15, 18, 20, 25][(index + offset) % 7],
    };
  });
};

export const buildCatalogSeries = ({
  count,
  categoryNames,
  titleWords,
  brands,
  imagePool,
  basePrice,
  specOptions,
  sizeOptions,
  descriptionFragments,
  extraTags = [],
  gender,
}) => {
  const products = [];

  for (let index = 0; index < count; index += 1) {
    const categoryName = pick(categoryNames, index);
    const brand = pick(brands, index);
    const titleWord = pick(titleWords, index);
    const fragment = pick(descriptionFragments, index);

    products.push({
      categoryName,
      name: `${titleWord} ${categoryName} ${String(index + 1).padStart(2, '0')}`,
      brand,
      description: `${fragment} Designed for ${categoryName.toLowerCase()} styling with comfort-driven finishing and durable make.`,
      highlights: [
        `${pick(['Premium fabric', 'Balanced comfort', 'Reliable craftsmanship'], index)}`,
        `${pick(['Everyday durability', 'Modern silhouette', 'Style-forward details'], index + 1)}`,
        `${pick(['Value pricing', 'Easy maintenance', 'Season-ready palette'], index + 2)}`,
      ],
      tags: Array.from(new Set([
        normalizeTag(categoryName),
        normalizeTag(brand),
        ...extraTags.map(normalizeTag),
      ].filter(Boolean))),
      images: [
        pick(imagePool, index),
        pick(imagePool, index + 1),
      ],
      variants: buildVariants({ sizes: sizeOptions, basePrice, index }),
      specifications: buildSpecifications(specOptions, index),
      gender,
    });
  }

  return products;
};
