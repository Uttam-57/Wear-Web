import express from "express";
import * as categoryController from "./category.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  blockCategoriesSchema,
  deleteCategoriesSchema,
  categoryTemplateSchema,
} from "./category.validation.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/categories", categoryController.getCategoryTree);
router.get('/categories/:id/template', categoryController.getPublicCategoryTemplate);

// ─── Admin: Category CRUD ─────────────────────────────────────────────────────

router.post("/admin/categories", authenticate, authorize("admin"), validate(createCategorySchema), categoryController.createCategory);
router.put("/admin/categories/:id", authenticate, authorize("admin"), validate(updateCategorySchema), categoryController.updateCategory);

// ─── Admin: Block & Delete (bulk) ─────────────────────────────────────────────

router.post("/admin/categories/block", authenticate, authorize("admin"), validate(blockCategoriesSchema), categoryController.blockCategories);
router.post("/admin/categories/delete-preview", authenticate, authorize("admin"), validate(deleteCategoriesSchema), categoryController.getDeletePreview);
router.delete("/admin/categories", authenticate, authorize("admin"), validate(deleteCategoriesSchema), categoryController.deleteCategories);

// ─── Admin: Category Template ─────────────────────────────────────────────────

router.put("/admin/categories/:id/template", authenticate, authorize("admin"), validate(categoryTemplateSchema), categoryController.upsertCategoryTemplate);
router.get("/admin/categories/:id/template", authenticate, authorize("admin"), categoryController.getCategoryTemplate);

export default router;