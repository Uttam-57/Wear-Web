import mongoose from "mongoose";

const normalizeMediaItem = (item) => {
    if (typeof item === "string") {
        return { url: item, publicId: null };
    }

    if (item && typeof item === "object") {
        return {
            url: item.url,
            publicId: item.publicId ?? null,
        };
    }

    return item;
};

const normalizeMediaArray = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map(normalizeMediaItem);
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_COLORS = [
    "Red", "Pink", "Orange", "Yellow", "Green",
    "Blue", "Purple", "Brown", "Black", "White",
    "Grey", "Beige", "Gold", "Silver", "Multicolor",
];

export const PRODUCT_STATUS = {
    ACTIVE: "active",
    HELD: "held",
    REMOVED: "removed",
};

export const GENDER_OPTIONS = ["men", "women", "boys", "girls", "unisex"];

export const DESCRIPTION_BLOCK_TYPES = ["heading", "paragraph", "bullets", "image", "video"];

// ─── Variant Subdocument ──────────────────────────────────────────────────────

const variantSchema = new mongoose.Schema(
    {
        colorName: {
            type: String,
            required: true,
            trim: true,
        },
        colorCode: {
            type: String,
            required: true,
            trim: true,
            match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color code"],
        },
        baseColor: {
            type: String,
            required: true,
            enum: BASE_COLORS,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: [0, "Price cannot be negative"],
        },
        stock: {
            type: Number,
            required: true,
            min: [0, "Stock cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Stock must be a whole number",
            },
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100"],
        },
        sku: {
            type: String,
            trim: true,
            default: null,
        },
        minOrderQty: {
            type: Number,
            default: 1,
            min: [1, "Minimum order quantity must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Minimum order quantity must be a whole number",
            },
        },
    },
    { _id: true }
);

// ─── Color Images Subdocument ─────────────────────────────────────────────────

const colorImageSchema = new mongoose.Schema(
    {
        colorName: {
            type: String,
            required: true,
            trim: true,
        },
        images: {
            type: [{ url: { type: String, required: true }, publicId: { type: String, default: null }, _id: false }],
            default: [],
            set: normalizeMediaArray,
            validate: {
                validator: (arr) => arr.length <= 3,
                message: "Maximum 3 images allowed per color",
            },
        },
        usePrimary: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

// ─── Description Block Subdocument ────────────────────────────────────────────

const descriptionBlockSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: DESCRIPTION_BLOCK_TYPES,
        },
        content: {
            type: String,
            default: null,  // used for heading, paragraph, image, video
        },
        items: {
            type: [String],
            default: [],    // used for bullets type only
        },
    },
    { _id: false }
);

// ─── Specification Subdocument ────────────────────────────────────────────────

const specificationSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        value: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

// ─── Product Schema ───────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
    {
        // ── Ownership ──────────────────────────────────────────────────────────
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        // ── Core Info ──────────────────────────────────────────────────────────
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, "Product name cannot exceed 200 characters"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        brand: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "Brand name cannot exceed 100 characters"],
        },
        gender: {
            type: String,
            required: true,
            set: (val) => typeof val === "string" ? val.toLowerCase() : val,
            enum: GENDER_OPTIONS,
        },
        tags: {
            type: [String],
            default: [],
        },
        highlights: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: "Maximum 5 highlights allowed",
            },
        },

        // ── Media ──────────────────────────────────────────────────────────────
      // ── Media ──────────────────────────────────────────────────────────────
        images: {
            type: [{ url: { type: String, required: true }, publicId: { type: String, default: null }, _id: false }],
            required: true,
            set: normalizeMediaArray,
            validate: [
                { validator: (arr) => arr.length >= 1, message: "At least 1 image is required" },
                { validator: (arr) => arr.length <= 5, message: "Maximum 5 images allowed" },
            ],
        },
        colorImages: {
            type: [colorImageSchema],
            default: [],
        },
        video: {
            type: String,
            default: null,
        },

        // ── Variants ───────────────────────────────────────────────────────────
        variants: {
            type: [variantSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length >= 1,
                message: "At least 1 variant is required",
            },
        },

        // ── Denormalized Color Fields (for filtering) ──────────────────────────
        colorNames: {
            type: [String],
            default: [],
        },
        baseColors: {
            type: [String],
            default: [],
        },

        // ── Description ────────────────────────────────────────────────────────
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "Short description cannot exceed 500 characters"],
        },
        descriptionBlocks: {
            type: [descriptionBlockSchema],
            default: [],
        },

        // ── Specifications ─────────────────────────────────────────────────────
        specifications: {
            type: [specificationSchema],
            default: [],
        },

        // ── Manufacturer ───────────────────────────────────────────────────────
        manufacturerDetails: {
            name: { type: String, trim: true, default: null },
            address: { type: String, trim: true, default: null },
            countryOfOrigin: { type: String, trim: true, default: null },
            importerName: { type: String, trim: true, default: null },
            packerDetails: { type: String, trim: true, default: null },
        },

        // ── Shipping ───────────────────────────────────────────────────────────
        shippingInfo: {
            weight: { type: Number, default: null, min: 0 },    // grams
            length: { type: Number, default: null, min: 0 },    // cm
            breadth: { type: Number, default: null, min: 0 },   // cm
            height: { type: Number, default: null, min: 0 },    // cm
        },

        // ── Purchase Options ───────────────────────────────────────────────────
        isCODAvailable: {
            type: Boolean,
            default: true,
        },
        packInfo: {
            isPack: { type: Boolean, default: false },
            packOf: { type: Number, default: 1, min: 1 },
        },
        returnPolicy: {
            returnable: { type: Boolean, default: true },
            returnWindow: { type: Number, default: 7, min: 0 },  // days
        },

        // ── Ratings ────────────────────────────────────────────────────────────
        avgRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ── Status ─────────────────────────────────────────────────────────────
        hasBrokenMedia: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: Object.values(PRODUCT_STATUS),
            default: PRODUCT_STATUS.ACTIVE,
        },
        previousStatus: {
            type: String,
            enum: [...Object.values(PRODUCT_STATUS), null],
            default: null,
        },
        heldAt: {
            type: Date,
            default: null,
        },
        holdInfo: {
            source: {
                type: String,
                enum: ['admin', 'seller', 'account_deletion', 'account_block', null],
                default: null,
            },
            code: {
                type: String,
                default: null,
            },
            message: {
                type: String,
                default: null,
            },
        },
    },
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

productSchema.index({ sellerId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ baseColors: 1 });
productSchema.index({ name: "text", tags: "text" });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ avgRating: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

// Effective price per variant after discount
variantSchema.virtual("effectivePrice").get(function () {
    return this.price - (this.price * this.discount) / 100;
});

// ─── Model ────────────────────────────────────────────────────────────────────

const Product = mongoose.model("Product", productSchema);

export default Product;
