import Category from '../../modules/category/category.model.js';
import CategoryTemplate from '../../modules/category/categoryTemplate.model.js';
import { CATEGORY_TREE } from '../data/category/index.js';

const toSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const ensureUniqueSlug = (slug, usedSlugs) => {
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }

  let counter = 2;
  let candidate = `${slug}-${counter}`;
  while (usedSlugs.has(candidate)) {
    counter += 1;
    candidate = `${slug}-${counter}`;
  }
  usedSlugs.add(candidate);
  return candidate;
};

const insertNodeRecursive = async ({
  node,
  parentId = null,
  usedSlugs,
  categoryByName,
  summary,
}) => {
  const baseSlug = toSlug(node.name);
  const slug = ensureUniqueSlug(baseSlug, usedSlugs);

  const category = await Category.create({
    name: node.name,
    slug,
    image: node.image,
    parentId,
    status: 'active',
  });

  categoryByName.set(node.name, category);
  summary.categoryCount += 1;
  if (!parentId) summary.rootCount += 1;

  if (node.template) {
    await CategoryTemplate.create({
      categoryId: category._id,
      sizeOptions: node.template.sizeOptions,
      specFields: node.template.specFields,
    });
    summary.templateCount += 1;
    summary.leafCount += 1;
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    for (const child of node.children) {
      await insertNodeRecursive({
        node: child,
        parentId: category._id,
        usedSlugs,
        categoryByName,
        summary,
      });
    }
  }
};

export const seedCategories = async ({ clearExisting = true } = {}) => {
  if (clearExisting) {
    console.log('Clearing old categories and category templates...');
    await Promise.all([
      CategoryTemplate.deleteMany({}),
      Category.deleteMany({}),
    ]);
  }

  const usedSlugs = new Set();
  const categoryByName = new Map();
  const summary = {
    rootCount: 0,
    categoryCount: 0,
    leafCount: 0,
    templateCount: 0,
  };

  for (const rootNode of CATEGORY_TREE) {
    await insertNodeRecursive({
      node: rootNode,
      usedSlugs,
      categoryByName,
      summary,
    });
  }

  console.log(`Seeded categories -> roots: ${summary.rootCount}, total: ${summary.categoryCount}, templates: ${summary.templateCount}`);

  return {
    ...summary,
    categoryByName,
  };
};

export default seedCategories;