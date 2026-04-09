import Product, { PRODUCT_STATUS } from "./product.model.js";
import AppError from "../../utils/appError.js";
import logger from "../../utils/logger.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../../config/cloudinary.js";
import { createNotification } from '../../utils/notification.utils.js';
import {
    deriveColorFields,
    escapeRegExp,
    generateSlug,
    resolveCategoryAndTemplate,
    resolveCategoryScopeIds,
    validateSpecifications,
    validateVariantSizes,
} from './product.helpers.js';

// ─── Create Product ───────────────────────────────────────────────────────────

export const createProductService = async (sellerId, data) => {
    logger.info(`[SERVICE] createProductService → sellerId: ${sellerId}, name: ${data.name}`);

    const { category, template } = await resolveCategoryAndTemplate(data.categoryId);
    logger.info(`[SERVICE] createProductService → category resolved: ${category.name}`);

    validateVariantSizes(data.variants, template);
    validateSpecifications(data.specifications, template);

    const slug = await generateSlug(data.name, sellerId);
    const { colorNames, baseColors } = deriveColorFields(data.variants);

    const product = await Product.create({
        ...data,
        sellerId,
        slug,
        colorNames,
        baseColors,
        status: PRODUCT_STATUS.ACTIVE,
    });

    logger.info(`[SERVICE] createProductService → product created, id: ${product._id}`);
    return product;
};

// ─── Get Seller's Own Products ────────────────────────────────────────────────

export const getSellerProductsService = async (sellerId, query) => {
    logger.info(`[SERVICE] getSellerProductsService → sellerId: ${sellerId}`);

    const { status, page = 1, limit = 20 } = query;
    const filter = { sellerId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Product.countDocuments(filter),
    ]);

    logger.info(`[SERVICE] getSellerProductsService → found ${products.length} products`);
    return { products, total, page, limit };
};

export const getSellerProductByIdService = async (sellerId, productId) => {
    logger.info(`[SERVICE] getSellerProductByIdService → sellerId: ${sellerId}, productId: ${productId}`);

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
        throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    return product;
};

// ─── Get Single Product (Public) ──────────────────────────────────────────────

export const getProductByIdService = async (productId) => {
    logger.info(`[SERVICE] getProductByIdService → productId: ${productId}`);

    const product = await Product.findOne({
        _id: productId,
        status: PRODUCT_STATUS.ACTIVE,
    })
        .populate("categoryId", "name slug image")
        .populate("sellerId", "firstName lastName");

    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    logger.info(`[SERVICE] getProductByIdService → product found: ${product.name}`);
    return product;
};

// ─── Browse All Products (Public) ────────────────────────────────────────────

export const browseProductsService = async (query) => {
    logger.info(`[SERVICE] browseProductsService → query: ${JSON.stringify(query)}`);

    const {
        q, categoryId, gender, baseColor, brand, size,
        stockStatus, minPrice, maxPrice, returnable, isCODAvailable,
        sortBy, page = 1, limit = 20,
        specFilters,    // object of { key: value } pairs from dynamic category filters
    } = query;

    const filter = { status: PRODUCT_STATUS.ACTIVE };

    if (q) {
        const pattern = new RegExp(escapeRegExp(q), "i");
        filter.$or = [
            { name: pattern },
            { brand: pattern },
            { tags: { $elemMatch: { $regex: pattern } } },
        ];
    }

    if (categoryId) {
        const categoryScopeIds = await resolveCategoryScopeIds(categoryId);
        if (categoryScopeIds.length === 0) {
            return { products: [], total: 0, page, limit };
        }
        filter.categoryId = { $in: categoryScopeIds };
    }
    if (gender) filter.gender = gender;
    if (baseColor) filter.baseColors = baseColor;
    if (brand) filter.brand = new RegExp(brand, "i");
    if (returnable !== undefined) filter["returnPolicy.returnable"] = returnable;
    if (isCODAvailable !== undefined) filter.isCODAvailable = isCODAvailable;

    // Size + price filter — must match within a single variant using $elemMatch
    if (size || minPrice !== undefined || maxPrice !== undefined || stockStatus === "in_stock" || stockStatus === "out_of_stock") {
        const variantMatch = {};
        if (size) variantMatch.size = size;
        if (minPrice !== undefined) variantMatch.price = { ...variantMatch.price, $gte: minPrice };
        if (maxPrice !== undefined) variantMatch.price = { ...variantMatch.price, $lte: maxPrice };

        if (stockStatus === "in_stock") {
            variantMatch.stock = { $gt: 0 };
        }

        if (stockStatus === "out_of_stock") {
            variantMatch.stock = { $lte: 0 };
            filter.$and = filter.$and || [];
            filter.$and.push({
                variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } },
            });
        }

        filter.variants = { $elemMatch: variantMatch };
    }

    // Dynamic spec filters — e.g. { material: 'Cotton', fit: 'Slim' }
    if (specFilters && Object.keys(specFilters).length > 0) {
        filter.$and = filter.$and || [];
        for (const [key, value] of Object.entries(specFilters)) {
            filter.$and.push({
                specifications: { $elemMatch: { key, value } },
            });
        }
    }

    // Sort
    const sortMap = {
        price_asc: { "variants.price": 1 },
        price_desc: { "variants.price": -1 },
        rating: { avgRating: -1 },
        review: { avgRating: -1 },
        newest: { createdAt: -1 },
        arrival: { createdAt: -1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);

    logger.info(`[SERVICE] browseProductsService → found ${products.length} of ${total} products`);
    return { products, total, page, limit };
};

// ─── Search Products (Public) ─────────────────────────────────────────────────

export const searchProductsService = async ({ q, page = 1, limit = 20 }) => {
    logger.info(`[SERVICE] searchProductsService(Atlas) → query: "${q}"`);

    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $search: {
                index: "default",
                compound: {
                    filter: [
                        { equals: { path: "status", value: PRODUCT_STATUS.ACTIVE } },
                    ],
                    should: [
                        {
                            autocomplete: {
                                path: "name",
                                query: q,
                                tokenOrder: "sequential",
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                        {
                            autocomplete: {
                                path: "brand",
                                query: q,
                                tokenOrder: "sequential",
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                        {
                            text: {
                                path: ["name", "brand", "tags", "specifications.value"],
                                query: q,
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                    ],
                    minimumShouldMatch: 1,
                },
            },
        },
        {
            $facet: {
                products: [
                    {
                        $project: {
                            _id: 1,
                            sellerId: 1,
                            categoryId: 1,
                            name: 1,
                            slug: 1,
                            brand: 1,
                            gender: 1,
                            tags: 1,
                            highlights: 1,
                            images: 1,
                            colorImages: 1,
                            video: 1,
                            variants: 1,
                            colorNames: 1,
                            baseColors: 1,
                            description: 1,
                            descriptionBlocks: 1,
                            specifications: 1,
                            manufacturerDetails: 1,
                            shippingInfo: 1,
                            isCODAvailable: 1,
                            packInfo: 1,
                            returnPolicy: 1,
                            avgRating: 1,
                            totalReviews: 1,
                            status: 1,
                            previousStatus: 1,
                            heldAt: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            score: { $meta: "searchScore" },
                        },
                    },
                    { $sort: { score: -1, createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                total: [{ $count: "count" }],
            },
        },
        {
            $project: {
                products: 1,
                total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
            },
        },
    ];

    const [result] = await Product.aggregate(pipeline);
    const products = result?.products || [];
    const total = Number(result?.total || 0);

    logger.info(`[SERVICE] searchProductsService(Atlas) → found ${products.length} results`);
    return { products, total, page, limit };
};

export const suggestProductsService = async ({ q, limit = 7 }) => {
    logger.info(`[SERVICE] suggestProductsService(Atlas) → query: "${q}", limit: ${limit}`);

    const safeLimit = Math.max(1, Math.min(limit, 7));
    const categoryLimit = Math.min(5, safeLimit);
    const productLimit = safeLimit;

    const productPipeline = [
        {
            $search: {
                index: "default",
                compound: {
                    filter: [
                        { equals: { path: "status", value: PRODUCT_STATUS.ACTIVE } },
                    ],
                    should: [
                        {
                            autocomplete: {
                                path: "name",
                                query: q,
                                tokenOrder: "sequential",
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                        {
                            autocomplete: {
                                path: "brand",
                                query: q,
                                tokenOrder: "sequential",
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                        {
                            text: {
                                path: ["name", "brand", "tags"],
                                query: q,
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                    ],
                    minimumShouldMatch: 1,
                },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                brand: 1,
                imageUrl: { $arrayElemAt: ["$images.url", 0] },
                score: { $meta: "searchScore" },
            },
        },
        { $sort: { score: -1 } },
        {
            $group: {
                _id: "$name",
                productId: { $first: "$_id" },
                name: { $first: "$name" },
                brand: { $first: "$brand" },
                imageUrl: { $first: "$imageUrl" },
                score: { $first: "$score" },
            },
        },
        { $sort: { score: -1 } },
        { $limit: productLimit },
        {
            $project: {
                _id: 0,
                type: { $literal: "product" },
                label: "$name",
                value: "$name",
                productId: 1,
                brand: 1,
                imageUrl: 1,
            },
        },
    ];

    const categoryPipeline = [
        {
            $search: {
                index: "default",
                compound: {
                    filter: [
                        { equals: { path: "status", value: "active" } },
                    ],
                    should: [
                        {
                            autocomplete: {
                                path: "name",
                                query: q,
                                tokenOrder: "sequential",
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                        {
                            text: {
                                path: ["name", "slug"],
                                query: q,
                                fuzzy: { maxEdits: 1, prefixLength: 1, maxExpansions: 50 },
                            },
                        },
                    ],
                    minimumShouldMatch: 1,
                },
            },
        },
        {
            $project: {
                _id: 0,
                type: { $literal: "category" },
                label: "$name",
                value: "$name",
                categoryId: "$_id",
                slug: 1,
                imageUrl: "$image",
                score: { $meta: "searchScore" },
            },
        },
        { $sort: { score: -1, label: 1 } },
        { $limit: categoryLimit },
        {
            $project: {
                type: 1,
                label: 1,
                value: 1,
                categoryId: 1,
                slug: 1,
                imageUrl: 1,
            },
        },
    ];

    const productSuggestions = await Product.aggregate(productPipeline);

    let categorySuggestions = [];
    try {
        categorySuggestions = await Category.aggregate(categoryPipeline);
    } catch (error) {
        logger.warn(`[SERVICE] suggestProductsService(Atlas) → category suggestion fallback: ${error.message}`);
    }

    const seen = new Set();
    const merged = [];

    // Priority order: categories first, then products.
    // Also dedupe by value text so product rows don't crowd out a matching category intent.
    [...categorySuggestions, ...productSuggestions].forEach((item) => {
        const key = String(item.value || "").trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        merged.push(item);
    });

    const suggestions = merged.slice(0, safeLimit);
    return {
        suggestions,
        total: suggestions.length,
    };
};

// ─── Update Product (Seller) ──────────────────────────────────────────────────

export const updateProductService = async (sellerId, productId, data) => {
    logger.info(`[SERVICE] updateProductService → sellerId: ${sellerId}, productId: ${productId}`);

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status === PRODUCT_STATUS.REMOVED) {
        throw new AppError("Cannot update a removed product", 400, "VALIDATION_ERROR");
    }

    // If categoryId is being changed, re-validate against new template
    const targetCategoryId = data.categoryId || product.categoryId;
    const { template } = await resolveCategoryAndTemplate(targetCategoryId);

    if (data.variants) {
        validateVariantSizes(data.variants, template);
    }
    if (data.specifications) {
        validateSpecifications(data.specifications, template);
    }

    // Regenerate slug if name changed
    if (data.name && data.name !== product.name) {
        data.slug = await generateSlug(data.name, sellerId);
    }

    // Re-derive color fields if variants changed
    if (data.variants) {
        const { colorNames, baseColors } = deriveColorFields(data.variants);
        data.colorNames = colorNames;
        data.baseColors = baseColors;
    }
    if (data.images) {
        for (const image of product.images) {
            if (image.publicId) await deleteFromCloudinary(image.publicId);
        }
    }
    if (data.colorImages) {
        for (const colorImg of product.colorImages) {
            for (const image of colorImg.images) {
                if (image.publicId) await deleteFromCloudinary(image.publicId);
            }
        }
    }

    const updated = await Product.findOneAndUpdate(
        { _id: productId, sellerId },
        { $set: data },
        { new: true, runValidators: true }
    );

    logger.info(`[SERVICE] updateProductService → product updated: ${productId}`);
    return updated;
};

// ─── Delete Product (Seller) ──────────────────────────────────────────────────

export const deleteProductService = async (sellerId, productId) => {
    logger.info(`[SERVICE] deleteProductService → sellerId: ${sellerId}, productId: ${productId}`);

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status === PRODUCT_STATUS.REMOVED) {
        throw new AppError("Product is already removed", 400, "VALIDATION_ERROR");
    }
    // Delete all product images from Cloudinary
    for (const image of product.images) {
        if (image.publicId) await deleteFromCloudinary(image.publicId);
    }
    for (const colorImg of product.colorImages) {
        for (const image of colorImg.images) {
            if (image.publicId) await deleteFromCloudinary(image.publicId);
        }
    }
    await Product.deleteOne({ _id: productId, sellerId });

    logger.info(`[SERVICE] deleteProductService → product deleted: ${productId}`);
};

// ─── Get All Products (Admin) ─────────────────────────────────────────────────

export const adminGetProductsService = async (query) => {
    logger.info(`[SERVICE] adminGetProductsService → query: ${JSON.stringify(query)}`);

    const { status, sellerId, page = 1, limit = 20 } = query;
    const filter = {};
    if (status) filter.status = status;
    if (sellerId) filter.sellerId = sellerId;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate("sellerId", "firstName lastName email"),
        Product.countDocuments(filter),
    ]);

    logger.info(`[SERVICE] adminGetProductsService → found ${products.length} products`);
    return { products, total, page, limit };
};

// ─── Hold Product (Admin) ─────────────────────────────────────────────────────

export const holdProductService = async (productId, reason = '') => {
    logger.info(`[SERVICE] holdProductService → productId: ${productId}`);

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status === PRODUCT_STATUS.HELD) {
        throw new AppError("Product is already on hold", 400, "VALIDATION_ERROR");
    }
    if (product.status === PRODUCT_STATUS.REMOVED) {
        throw new AppError("Cannot hold a removed product", 400, "VALIDATION_ERROR");
    }

    product.previousStatus = product.status;
    product.status = PRODUCT_STATUS.HELD;
    product.heldAt = new Date();
    product.holdInfo = {
        source: 'admin',
        code: 'ADMIN_HOLD',
        message: String(reason || '').trim() || 'Held by admin for review',
    };
    await product.save();

    createNotification({
      userId: product.sellerId.toString(),
      type: 'PRODUCT_HELD',
      message: `Your product "${product.name}" has been placed on hold by admin and is no longer visible.`,
      refId: product._id.toString(),
      refModel: 'Product',
    });

    logger.info(`[SERVICE] holdProductService → product held: ${productId}`);
    return product;
};

export const unholdProductService = async (productId) => {
    logger.info(`[SERVICE] unholdProductService → productId: ${productId}`);

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status !== PRODUCT_STATUS.HELD) {
        throw new AppError("Only held products can be unheld", 400, "VALIDATION_ERROR");
    }

    const source = String(product?.holdInfo?.source || '').toLowerCase();
    if (source === 'account_block' || source === 'account_deletion') {
        throw new AppError("Account-level hold cannot be lifted per product. Unhold the account first.", 400, "VALIDATION_ERROR");
    }

    product.status = PRODUCT_STATUS.ACTIVE;
    product.previousStatus = null;
    product.heldAt = null;
    product.holdInfo = { source: null, code: null, message: null };
    await product.save();

    logger.info(`[SERVICE] unholdProductService → product unheld: ${productId}`);
    return product;
};

export const sellerHoldProductService = async (sellerId, productId, reason = '') => {
    logger.info(`[SERVICE] sellerHoldProductService → sellerId: ${sellerId} | productId: ${productId}`);

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status === PRODUCT_STATUS.HELD) {
        throw new AppError("Product is already on hold", 400, "VALIDATION_ERROR");
    }
    if (product.status === PRODUCT_STATUS.REMOVED) {
        throw new AppError("Cannot hold a removed product", 400, "VALIDATION_ERROR");
    }

    product.previousStatus = product.status;
    product.status = PRODUCT_STATUS.HELD;
    product.heldAt = new Date();
    product.holdInfo = {
        source: 'seller',
        code: 'SELLER_HOLD',
        message: String(reason || '').trim() || 'Held by seller',
    };
    await product.save();

    logger.info(`[SERVICE] sellerHoldProductService → product held by seller: ${productId}`);
    return product;
};

export const sellerUnholdProductService = async (sellerId, productId) => {
    logger.info(`[SERVICE] sellerUnholdProductService → sellerId: ${sellerId} | productId: ${productId}`);

    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status !== PRODUCT_STATUS.HELD) {
        throw new AppError("Only held products can be unheld", 400, "VALIDATION_ERROR");
    }

    const source = String(product?.holdInfo?.source || '').toLowerCase();
    if (source && source !== 'seller') {
        throw new AppError("This hold was not created by seller and cannot be removed from seller panel", 403, "FORBIDDEN");
    }

    product.status = PRODUCT_STATUS.ACTIVE;
    product.previousStatus = null;
    product.heldAt = null;
    product.holdInfo = { source: null, code: null, message: null };
    await product.save();

    logger.info(`[SERVICE] sellerUnholdProductService → product unheld by seller: ${productId}`);
    return product;
};

// ─── Remove Product (Admin) ───────────────────────────────────────────────────

export const removeProductService = async (productId) => {
    logger.info(`[SERVICE] removeProductService → productId: ${productId}`);

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (product.status === PRODUCT_STATUS.REMOVED) {
        throw new AppError("Product is already removed", 400, "VALIDATION_ERROR");
    }

    product.previousStatus = product.status;
    product.status = PRODUCT_STATUS.REMOVED;
    await product.save();

    logger.info(`[SERVICE] removeProductService → product removed: ${productId}`);
    return product;
};

// ─── Hide All Seller Products (called when seller is blocked) ─────────────────

export const hideSellerProductsService = async (sellerId, holdInfo = {}) => {
    logger.info(`[SERVICE] hideSellerProductsService → sellerId: ${sellerId}`);

    const resolvedSource = holdInfo?.source || 'account_block';
    const resolvedCode = holdInfo?.code || (resolvedSource === 'account_deletion' ? 'ACCOUNT_DELETION_REQUEST' : 'ACCOUNT_BLOCKED');
    const resolvedMessage = holdInfo?.message || (resolvedSource === 'account_deletion'
        ? 'Product is on hold due to account deletion request'
        : 'Product is on hold because seller account is blocked');

    // Only update active products — preserve already held/removed status
    const result = await Product.updateMany(
        { sellerId, status: PRODUCT_STATUS.ACTIVE },
        {
            $set: {
                previousStatus: PRODUCT_STATUS.ACTIVE,
                status: PRODUCT_STATUS.HELD,
                heldAt: new Date(),
                holdInfo: {
                    source: resolvedSource,
                    code: resolvedCode,
                    message: resolvedMessage,
                },
            },
        }
    );

    logger.info(`[SERVICE] hideSellerProductsService → ${result.modifiedCount} products hidden`);
};

// ─── Restore All Seller Products (called when seller is unblocked) ────────────

export const restoreSellerProductsService = async (sellerId) => {
    logger.info(`[SERVICE] restoreSellerProductsService → sellerId: ${sellerId}`);

    // Only restore products that were active before seller was blocked
    const result = await Product.updateMany(
        { sellerId, status: PRODUCT_STATUS.HELD, previousStatus: PRODUCT_STATUS.ACTIVE },
        {
            $set: {
                status: PRODUCT_STATUS.ACTIVE,
                previousStatus: null,
                heldAt: null,
                holdInfo: {
                    source: null,
                    code: null,
                    message: null,
                },
            },
        }
    );

    logger.info(`[SERVICE] restoreSellerProductsService → ${result.modifiedCount} products restored`);
};

const toDataUri = (file) => {
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
};

const isUploadFile = (item) =>
    item &&
    typeof item === "object" &&
    Buffer.isBuffer(item.buffer) &&
    typeof item.mimetype === "string";

const normalizeMediaSource = (item) => {
    if (typeof item === "string") {
        return item;
    }

    if (isUploadFile(item)) {
        return toDataUri(item);
    }

    throw new AppError("Each media input must be a file or image URL", 400, "VALIDATION_ERROR");
};

export const uploadProductMediaService = async (mediaItems = [], folder = "products") => {
    logger.info(`[SERVICE] uploadProductMediaService → items: ${Array.isArray(mediaItems) ? mediaItems.length : 0} | folder: ${folder}`);
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        throw new AppError("At least one image file or URL is required", 400, "VALIDATION_ERROR");
    }

    const uploads = await Promise.all(
        mediaItems.map((item) =>
            uploadToCloudinary(normalizeMediaSource(item), folder, { resource_type: "image" })
        )
    );

    return uploads;
};
