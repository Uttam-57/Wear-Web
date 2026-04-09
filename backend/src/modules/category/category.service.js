import slugify from "slugify";
import Category from "./category.model.js";
import CategoryTemplate from "./categoryTemplate.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/appError.js";
import logger from "../../utils/logger.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateSlug = async (name) => {
  let slug = slugify(name, { lower: true, strict: true });
  const existing = await Category.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;
  return slug;
};

const getCommissionRate = async (category) => {
  if (category.commissionRate !== null) return category.commissionRate;
  if (!category.parentId) return null;
  const parent = await Category.findById(category.parentId);
  if (!parent) return null;
  return getCommissionRate(parent);
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const getCategoryTreeService = async () => {
  logger.info("[SERVICE] getCategoryTree → fetching full nested tree");

  const categories = await Category.find({ status: "active" }).lean();

  const map = {};
  categories.forEach((cat) => {
    map[cat._id] = { ...cat, children: [] };
  });

  const tree = [];
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat._id]);
    } else {
      tree.push(map[cat._id]);
    }
  });

  logger.info(`[SERVICE] getCategoryTree → built tree with ${tree.length} root categories`);
  return tree;
};

// ─── Admin: Category CRUD ─────────────────────────────────────────────────────

export const createCategoryService = async (data) => {
  logger.info(`[SERVICE] createCategory → name: ${data.name}`);

  const slug = await generateSlug(data.name);
  const category = await Category.create({ ...data, slug });

  logger.info(`[SERVICE] createCategory → created categoryId: ${category._id}`);
  return category;
};

export const updateCategoryService = async (categoryId, data) => {
  logger.info(`[SERVICE] updateCategory → categoryId: ${categoryId} | fields: ${Object.keys(data).join(", ")}`);

  const category = await Category.findById(categoryId);
  if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
  if (category.status === "blocked") throw new AppError("Cannot update a blocked category", 400, "VALIDATION_ERROR");

  if (data.name) data.slug = await generateSlug(data.name);

  const updated = await Category.findByIdAndUpdate(
    categoryId,
    { $set: data },
    { new: true, runValidators: true }
  );

  logger.info(`[SERVICE] updateCategory → updated successfully`);
  return updated;
};

// ─── Admin: Block (bulk) ──────────────────────────────────────────────────────

export const blockCategoriesService = async (categoryIds) => {
  logger.info(`[SERVICE] blockCategories → ids: ${categoryIds.join(", ")}`);

  const categories = await Category.find({ _id: { $in: categoryIds }, status: "active" });
  if (categories.length === 0) throw new AppError("No active categories found", 404, "NOT_FOUND");

  await Category.updateMany(
    { _id: { $in: categoryIds }, status: "active" },
    { $set: { status: "blocked", blockedAt: new Date() } }
  );

  logger.info(`[SERVICE] blockCategories → ${categories.length} categories blocked`);

  const affectedSellerIds = await Product.distinct("sellerId", {
    categoryId: { $in: categoryIds },
    status: { $ne: "removed" },
  });

  // return affected category details for notification trigger (controller handles notification)
  return { categories, affectedSellerIds };
};

// ─── Admin: Delete (bulk, only after 30 days) ─────────────────────────────────

export const deleteCategoriesService = async (categoryIds) => {
  logger.info(`[SERVICE] deleteCategories → ids: ${categoryIds.join(", ")}`);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const categories = await Category.find({
    _id: { $in: categoryIds },
    status: "blocked",
    blockedAt: { $lte: thirtyDaysAgo },
  });

  if (categories.length === 0)
    throw new AppError("No categories eligible for deletion. Either not blocked or 30-day period not passed.", 400, "VALIDATION_ERROR");

  // Validate and reassign products safely before deleting categories.
  for (const cat of categories) {
    const productCount = await Product.countDocuments({ categoryId: cat._id, status: { $ne: "removed" } });

    if (!cat.parentId && productCount > 0) {
      throw new AppError(
        `Cannot delete root category "${cat.name}" while active products exist. Move products first.`,
        400,
        "VALIDATION_ERROR"
      );
    }

    if (cat.parentId && productCount > 0) {
      await Product.updateMany(
        { categoryId: cat._id, status: { $ne: "removed" } },
        { $set: { categoryId: cat.parentId } }
      );
    }
  }

  // move child categories up one level
  for (const cat of categories) {
    await Category.updateMany(
      { parentId: cat._id },
      { $set: { parentId: cat.parentId ?? null } }
    );
  }

  await Category.deleteMany({ _id: { $in: categoryIds } });

  logger.info(`[SERVICE] deleteCategories → ${categories.length} categories deleted`);
  return { deleted: categories.length };
};

// ─── Admin: Get delete preview (product + child counts) ───────────────────────

export const getDeletePreviewService = async (categoryIds) => {
  logger.info(`[SERVICE] getDeletePreview → ids: ${categoryIds.join(", ")}`);

  const categories = await Category.find({ _id: { $in: categoryIds } });
  if (categories.length === 0) throw new AppError("No categories found", 404, "NOT_FOUND");

  const preview = await Promise.all(
    categories.map(async (cat) => {
      const childCount = await Category.countDocuments({ parentId: cat._id });
      const productCount = await Product.countDocuments({ categoryId: cat._id, status: { $ne: "removed" } });
      return {
        categoryId: cat._id,
        name: cat.name,
        status: cat.status,
        blockedAt: cat.blockedAt,
        childCount,
        productCount,
        eligibleForDeletion:
          cat.status === "blocked" &&
          cat.blockedAt &&
          new Date(cat.blockedAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    })
  );

  return preview;
};

// ─── Admin: Category Template ─────────────────────────────────────────────────

export const upsertCategoryTemplateService = async (categoryId, data) => {
  logger.info(`[SERVICE] upsertCategoryTemplate → categoryId: ${categoryId}`);

  const category = await Category.findById(categoryId);
  if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");

 const template = await CategoryTemplate.findOneAndUpdate(
  { categoryId },
  { $set: { sizeOptions: data.sizeOptions, specFields: data.specFields } },
  {  new: true, upsert: true, runValidators: true }
);

  logger.info(`[SERVICE] upsertCategoryTemplate → saved successfully`);
  return template;
};

export const getCategoryTemplateService = async (categoryId) => {
  logger.info(`[SERVICE] getCategoryTemplate → categoryId: ${categoryId}`);

  const template = await CategoryTemplate.findOne({ categoryId });
  if (!template) throw new AppError("Template not found for this category", 404, "NOT_FOUND");
  return template;
};

// ─── Resolve effective commission rate ────────────────────────────────────────

export const getEffectiveCommissionService = async (categoryId) => {
  logger.info(`[SERVICE] getEffectiveCommission → categoryId: ${categoryId}`);

  const category = await Category.findById(categoryId);
  if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");

  const rate = await getCommissionRate(category);
  return { categoryId, effectiveCommissionRate: rate };
};