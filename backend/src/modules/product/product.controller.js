import {
    createProductService,
    uploadProductMediaService,
    getSellerProductsService,
    getSellerProductByIdService,
    getProductByIdService,
    browseProductsService,
    searchProductsService,
    suggestProductsService,
    updateProductService,
    deleteProductService,
    adminGetProductsService,
    holdProductService,
    unholdProductService,
    sellerHoldProductService,
    sellerUnholdProductService,
    removeProductService,
} from "./product.service.js";
import logger from "../../utils/logger.js";

// ─── Seller Controllers ───────────────────────────────────────────────────────

export const createProduct = async (req, res, next) => {
    try {
        logger.info("[CONTROLLER] createProduct → request received");
        const product = await createProductService(req.user.userId, req.body);
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const getSellerProducts = async (req, res, next) => {
    try {
        logger.info("[CONTROLLER] getSellerProducts → request received");
        const result = await getSellerProductsService(req.user.userId, req.query);
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const getSellerProductById = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] getSellerProductById → request received, productId: ${req.params.id}`);
        const product = await getSellerProductByIdService(req.user.userId, req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product fetched successfully',
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] updateProduct → request received, productId: ${req.params.id}`);
        const product = await updateProductService(req.user.userId, req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] deleteProduct → request received, productId: ${req.params.id}`);
        await deleteProductService(req.user.userId, req.params.id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: null,
        });
    } catch (err) {
        next(err);
    }
};

// ─── Public Controllers ───────────────────────────────────────────────────────

export const browseProducts = async (req, res, next) => {
    try {
        logger.info("[CONTROLLER] browseProducts → request received");

        // Standard filter keys — anything else is treated as a spec filter
        const standardKeys = new Set([
            "q", "categoryId", "gender", "baseColor", "brand", "size",
            "stockStatus", "minPrice", "maxPrice", "returnable", "isCODAvailable",
            "sortBy", "page", "limit",
        ]);

        const specFilters = {};
        for (const [key, value] of Object.entries(req.query)) {
            if (!standardKeys.has(key)) {
                specFilters[key] = value;
            }
        }

        const result = await browseProductsService({ ...req.parsedQuery, specFilters });
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const searchProducts = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] searchProducts → request received, q: ${req.query.q}`);
        const result = await searchProductsService(req.parsedQuery);
        res.status(200).json({
            success: true,
            message: "Search results fetched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const suggestProducts = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] suggestProducts → request received, q: ${req.query.q}`);
        const result = await suggestProductsService(req.parsedQuery);
        res.status(200).json({
            success: true,
            message: "Suggestions fetched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] getProductById → request received, productId: ${req.params.id}`);
        const product = await getProductByIdService(req.params.id);
        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

// ─── Admin Controllers ────────────────────────────────────────────────────────

export const adminGetProducts = async (req, res, next) => {
    try {
        logger.info("[CONTROLLER] adminGetProducts → request received");
        const result = await adminGetProductsService(req.query);
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const holdProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] holdProduct → request received, productId: ${req.params.id}`);
        const product = await holdProductService(req.params.id, req.body?.reason);
        res.status(200).json({
            success: true,
            message: "Product placed on hold successfully",
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const removeProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] removeProduct → request received, productId: ${req.params.id}`);
        const product = await removeProductService(req.params.id);
        res.status(200).json({
            success: true,
            message: "Product removed successfully",
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const uploadProductMedia = async (req, res, next) => {
    try {
        logger.info("[CONTROLLER] uploadProductMedia → request received");
        const files = await uploadProductMediaService(req.files || []);
        res.status(200).json({
            success: true,
            message: "Product media uploaded successfully",
            data: { files },
        });
    } catch (err) {
        next(err);
    }
};

export const sellerHoldProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] sellerHoldProduct → request received, productId: ${req.params.id}`);
        const product = await sellerHoldProductService(req.user.userId, req.params.id, req.body?.reason);
        res.status(200).json({
            success: true,
            message: 'Product placed on hold successfully',
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const sellerUnholdProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] sellerUnholdProduct → request received, productId: ${req.params.id}`);
        const product = await sellerUnholdProductService(req.user.userId, req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product unheld successfully',
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};

export const unholdProduct = async (req, res, next) => {
    try {
        logger.info(`[CONTROLLER] unholdProduct → request received, productId: ${req.params.id}`);
        const product = await unholdProductService(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product unheld successfully',
            data: { product },
        });
    } catch (err) {
        next(err);
    }
};