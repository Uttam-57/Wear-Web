import { z } from "zod";
import { BASE_COLORS, GENDER_OPTIONS, DESCRIPTION_BLOCK_TYPES } from "./product.model.js";

const mediaObjectSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    publicId: z.string().nullable().default(null),
});

// ─── Variant Schema ───────────────────────────────────────────────────────────

const variantSchema = z.object({
    colorName: z.string().min(1, "Color name is required").transform(val => val.trim()),
    colorCode: z
        .string()
        .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color code"),
    baseColor: z.enum(BASE_COLORS, {
        errorMap: () => ({ message: `Base color must be one of: ${BASE_COLORS.join(", ")}` }),
    }),
    size: z.string().min(1, "Size is required").transform(val => val.trim()),
    price: z.number({ required_error: "Price is required" }).min(0, "Price cannot be negative"),
    stock: z
        .number({ required_error: "Stock is required" })
        .min(0, "Stock cannot be negative")
        .int("Stock must be a whole number"),
    discount: z.number().min(0).max(100).default(0),
    sku: z.string().trim().nullable().optional(),
    minOrderQty: z.number().int().min(1).default(1),
});

// ─── Color Image Schema ───────────────────────────────────────────────────────

const colorImageSchema = z.object({
    colorName: z.string().min(1).transform(val => val.trim()),
    images: z.array(mediaObjectSchema).max(3, "Maximum 3 images per color").default([]),
    usePrimary: z.boolean().default(true),
}).refine(
    (data) => data.usePrimary || data.images.length >= 1,
    { message: "At least 1 image required when usePrimary is false" }
);

// ─── Description Block Schema ─────────────────────────────────────────────────

const descriptionBlockSchema = z.object({
    type: z.enum(DESCRIPTION_BLOCK_TYPES, {
        errorMap: () => ({ message: `Block type must be one of: ${DESCRIPTION_BLOCK_TYPES.join(", ")}` }),
    }),
    content: z.string().nullable().optional(),
    items: z.array(z.string()).default([]),
}).refine(
    (data) => {
        if (data.type === "bullets") return data.items.length >= 1;
        if (["heading", "paragraph", "image", "video"].includes(data.type)) {
            return data.content && data.content.trim().length > 0;
        }
        return true;
    },
    { message: "content is required for heading/paragraph/image/video. items required for bullets" }
);

// ─── Specification Schema ─────────────────────────────────────────────────────

const specificationSchema = z.object({
    key: z.string().min(1).transform(val => val.trim().toLowerCase()),
    value: z.string().min(1).transform(val => val.trim()),
});

// ─── Manufacturer Details Schema ──────────────────────────────────────────────

const manufacturerDetailsSchema = z.object({
    name: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    countryOfOrigin: z.string().trim().nullable().optional(),
    importerName: z.string().trim().nullable().optional(),
    packerDetails: z.string().trim().nullable().optional(),
}).optional();

// ─── Shipping Info Schema ─────────────────────────────────────────────────────

const shippingInfoSchema = z.object({
    weight: z.number().min(0).nullable().optional(),
    length: z.number().min(0).nullable().optional(),
    breadth: z.number().min(0).nullable().optional(),
    height: z.number().min(0).nullable().optional(),
}).optional();

// ─── Pack Info Schema ─────────────────────────────────────────────────────────

const packInfoSchema = z.object({
    isPack: z.boolean().default(false),
    packOf: z.number().int().min(1).default(1),
}).optional();

// ─── Return Policy Schema ─────────────────────────────────────────────────────

const returnPolicySchema = z.object({
    returnable: z.boolean().default(true),
    returnWindow: z.number().int().min(0).default(7),
}).optional();

// ─── Create Product ───────────────────────────────────────────────────────────

export const createProductSchema = z.object({
    categoryId: z.string({ required_error: "Category is required" }).min(1),
    name: z
        .string({ required_error: "Product name is required" })
        .min(1)
        .max(200)
        .transform(val => val.trim()),
    brand: z
        .string({ required_error: "Brand is required" })
        .min(1)
        .max(100)
        .transform(val => val.trim()),
    gender: z.string()
        .transform(val => val.toLowerCase())
        .pipe(z.enum(GENDER_OPTIONS, {
            errorMap: () => ({ message: `Gender must be one of: ${GENDER_OPTIONS.join(", ")}` }),
        })),
    description: z
        .string({ required_error: "Description is required" })
        .min(1)
        .max(500)
        .transform(val => val.trim()),
    images: z.array(mediaObjectSchema)
        .min(1, "At least 1 image is required")
        .max(5, "Maximum 5 images allowed"),
    colorImages: z.array(colorImageSchema).default([]),
    video: z.string().url("Video must be a valid URL").nullable().optional(),
    variants: z
        .array(variantSchema)
        .min(1, "At least 1 variant is required"),
    descriptionBlocks: z.array(descriptionBlockSchema).default([]),
    specifications: z.array(specificationSchema).default([]),
    tags: z.array(z.string().trim()).default([]),
    highlights: z
        .array(z.string().trim())
        .max(5, "Maximum 5 highlights allowed")
        .default([]),
    manufacturerDetails: manufacturerDetailsSchema,
    shippingInfo: shippingInfoSchema,
    isCODAvailable: z.boolean().default(true),
    packInfo: packInfoSchema,
    returnPolicy: returnPolicySchema,
})
    .refine(
        (data) => {
            // Every colorImage entry must match a colorName that exists in variants
            const variantColorNames = new Set(data.variants.map(v => v.colorName));
            return data.colorImages.every(ci => variantColorNames.has(ci.colorName));
        },
        { message: "Each colorImages entry must match a colorName present in variants" }
    )
    .refine(
        (data) => {
            // No duplicate color+size combination in variants
            const seen = new Set();
            for (const v of data.variants) {
                const key = `${v.colorName}__${v.size}`;
                if (seen.has(key)) return false;
                seen.add(key);
            }
            return true;
        },
        { message: "Duplicate color and size combination found in variants" }
    );

// ─── Update Product ───────────────────────────────────────────────────────────

export const updateProductSchema = z.object({
    name: z.string().min(1).max(200).transform(val => val.trim()).optional(),
    brand: z.string().min(1).max(100).transform(val => val.trim()).optional(),
    gender: z.enum(GENDER_OPTIONS).optional(),
    description: z.string().min(1).max(500).transform(val => val.trim()).optional(),
    images: z.array(mediaObjectSchema)
        .min(1, "At least 1 image is required")
        .max(5, "Maximum 5 images allowed")
        .optional(),
    colorImages: z.array(colorImageSchema).optional(),
    video: z.string().url().nullable().optional(),
    variants: z.array(variantSchema).min(1).optional(),
    descriptionBlocks: z.array(descriptionBlockSchema).optional(),
    specifications: z.array(specificationSchema).optional(),
    tags: z.array(z.string().trim()).optional(),
    highlights: z.array(z.string().trim()).max(5).optional(),
    manufacturerDetails: manufacturerDetailsSchema,
    shippingInfo: shippingInfoSchema,
    isCODAvailable: z.boolean().optional(),
    packInfo: packInfoSchema,
    returnPolicy: returnPolicySchema,
})
    .refine(
        (data) => Object.keys(data).length > 0,
        { message: "At least one field must be provided for update" }
    )
    .refine(
        (data) => {
            if (!data.colorImages || !data.variants) return true;
            const variantColorNames = new Set(data.variants.map(v => v.colorName));
            return data.colorImages.every(ci => variantColorNames.has(ci.colorName));
        },
        { message: "Each colorImages entry must match a colorName present in variants" }
    )
    .refine(
        (data) => {
            if (!data.variants) return true;
            const seen = new Set();
            for (const v of data.variants) {
                const key = `${v.colorName}__${v.size}`;
                if (seen.has(key)) return false;
                seen.add(key);
            }
            return true;
        },
        { message: "Duplicate color and size combination found in variants" }
    );

// ─── Browse / Filter Products ─────────────────────────────────────────────────

export const filterProductSchema = z.object({
    q: z.string().trim().optional(),
    categoryId: z.string().optional(),
    gender: z.string().transform(val => val.toLowerCase()).pipe(z.enum(GENDER_OPTIONS)).optional(),
    baseColor: z.enum(BASE_COLORS).optional(),
    brand: z.string().trim().optional(),
    size: z.string().trim().optional(),
    stockStatus: z.enum(["in_stock", "out_of_stock"]).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    returnable: z.coerce.boolean().optional(),
    isCODAvailable: z.coerce.boolean().optional(),
    sortBy: z.enum(["price_asc", "price_desc", "rating", "newest", "review", "arrival"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
})
    .refine(
        (data) => {
            if (data.minPrice !== undefined && data.maxPrice !== undefined) {
                return data.maxPrice >= data.minPrice;
            }
            return true;
        },
        { message: "maxPrice must be greater than or equal to minPrice" }
    );

// ─── Search Products ──────────────────────────────────────────────────────────

export const searchProductSchema = z.object({
    q: z
        .string({ required_error: "Search query is required" })
        .min(1, "Search query cannot be empty")
        .transform(val => val.trim()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const suggestProductSchema = z.object({
    q: z
        .string({ required_error: "Search query is required" })
        .min(2, "Search query must be at least 2 characters")
        .max(80, "Search query is too long")
        .transform(val => val.trim()),
    limit: z.coerce.number().int().min(1).max(7).default(7),
});