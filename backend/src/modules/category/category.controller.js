import * as categoryService from "./category.service.js";
import logger from "../../utils/logger.js";

// ─── Public ───────────────────────────────────────────────────────────────────

export const getCategoryTree = async (req, res, next) => {
  try {
    logger.info("[CONTROLLER] getCategoryTree → request received");
    const tree = await categoryService.getCategoryTreeService();
    res.status(200).json({
      success: true,
      message: "Category tree fetched",
      data: tree,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Category CRUD ─────────────────────────────────────────────────────

export const createCategory = async (req, res, next) => {
  try {
    logger.info("[CONTROLLER] createCategory → request received");
    const category = await categoryService.createCategoryService(req.body);
    res.status(201).json({
      success: true,
      message: "Category created",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] updateCategory → categoryId: ${req.params.id}`);
    const category = await categoryService.updateCategoryService(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Category updated",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Block (bulk) ──────────────────────────────────────────────────────

export const blockCategories = async (req, res, next) => {
  try {
    logger.info("[CONTROLLER] blockCategories → request received");
    const { categories, affectedSellerIds } = await categoryService.blockCategoriesService(req.body.categoryIds);
    logger.info(`[CONTROLLER] blockCategories → notification queue prepared for ${affectedSellerIds.length} sellers`);
    res.status(200).json({
      success: true,
      message: `${categories.length} categories blocked. Sellers will be notified.`,
      data: { blocked: categories.length, notifiedSellerCount: affectedSellerIds.length },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Delete preview ────────────────────────────────────────────────────

export const getDeletePreview = async (req, res, next) => {
  try {
    logger.info("[CONTROLLER] getDeletePreview → request received");
    const preview = await categoryService.getDeletePreviewService(req.body.categoryIds);
    res.status(200).json({
      success: true,
      message: "Delete preview fetched",
      data: preview,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Delete (bulk) ─────────────────────────────────────────────────────

export const deleteCategories = async (req, res, next) => {
  try {
    logger.info("[CONTROLLER] deleteCategories → request received");
    const result = await categoryService.deleteCategoriesService(req.body.categoryIds);
    res.status(200).json({
      success: true,
      message: `${result.deleted} categories deleted`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Category Template ─────────────────────────────────────────────────

export const upsertCategoryTemplate = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] upsertCategoryTemplate → categoryId: ${req.params.id}`);
    const template = await categoryService.upsertCategoryTemplateService(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Template saved",
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const getCategoryTemplate = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getCategoryTemplate → categoryId: ${req.params.id}`);
    const template = await categoryService.getCategoryTemplateService(req.params.id);
    res.status(200).json({
      success: true,
      message: "Template fetched",
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicCategoryTemplate = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getPublicCategoryTemplate → categoryId: ${req.params.id}`);
    const template = await categoryService.getCategoryTemplateService(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Category template fetched',
      data: { template },
    });
  } catch (err) {
    next(err);
  }
};