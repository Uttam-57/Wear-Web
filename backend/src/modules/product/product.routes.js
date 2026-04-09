import express from "express";
import {
    createProduct,
    uploadProductMedia,
    getSellerProducts,
    getSellerProductById,
    updateProduct,
    deleteProduct,
    browseProducts,
    searchProducts,
    suggestProducts,
    getProductById,
    adminGetProducts,
    holdProduct,
    unholdProduct,
    sellerHoldProduct,
    sellerUnholdProduct,
    removeProduct,
} from "./product.controller.js";
import {
    authenticate,
    authorize,
    requireSellerApproved,
    requireSellerProfileComplete,
} from "../../middlewares/auth.middleware.js";
import { uploadMultipleImages } from "../../middlewares/upload.middleware.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { normalizeProductPayload } from "./product.request.middleware.js";
import {
    createProductSchema,
    updateProductSchema,
    filterProductSchema,
    searchProductSchema,
    suggestProductSchema,
} from "./product.validation.js";

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get(
    "/products",
    rateLimiter("general"),
    validate(filterProductSchema, "query"),
    browseProducts
);

router.get(
    "/products/search",
    rateLimiter("general"),
    validate(searchProductSchema, "query"),
    searchProducts
);

router.get(
    "/products/suggestions",
    rateLimiter("general"),
    validate(suggestProductSchema, "query"),
    suggestProducts
);

// NOTE: /products/search must be defined before /products/:id
// otherwise Express matches "search" as the :id param
router.get(
    "/products/:id",
    rateLimiter("general"),
    getProductById
);

// ─── Seller Routes ────────────────────────────────────────────────────────────

router.post(
    "/seller/products/media/upload",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    requireSellerProfileComplete,
    uploadMultipleImages("files", 5),
    uploadProductMedia
);

router.post(
    "/seller/products",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    requireSellerProfileComplete,
    uploadMultipleImages("files", 5),
    normalizeProductPayload,
    validate(createProductSchema),
    createProduct
);

router.get(
    "/seller/products",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    getSellerProducts
);

router.get(
    "/seller/products/:id",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    getSellerProductById
);

router.put(
    "/seller/products/:id",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    requireSellerProfileComplete,
    uploadMultipleImages("files", 5),
    normalizeProductPayload,
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    "/seller/products/:id",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    deleteProduct
);

router.put(
    "/seller/products/:id/hold",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    sellerHoldProduct
);

router.put(
    "/seller/products/:id/unhold",
    rateLimiter("general"),
    authenticate,
    authorize("seller"),
    requireSellerApproved,
    sellerUnholdProduct
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.get(
    "/admin/products",
    rateLimiter("general"),
    authenticate,
    authorize("admin"),
    adminGetProducts
);

router.put(
    "/admin/products/:id/hold",
    rateLimiter("general"),
    authenticate,
    authorize("admin"),
    holdProduct
);

router.put(
    "/admin/products/:id/unhold",
    rateLimiter("general"),
    authenticate,
    authorize("admin"),
    unholdProduct
);

router.delete(
    "/admin/products/:id",
    rateLimiter("general"),
    authenticate,
    authorize("admin"),
    removeProduct
);

export default router;
