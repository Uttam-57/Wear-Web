import {z} from "zod";

const imageAdjustSchema = z.object({
    fit: z.enum(["cover", "contain"]).optional(),
    positionX: z.number().min(0).max(100).optional(),
    positionY: z.number().min(0).max(100).optional(),
    zoom: z.number().min(100).max(200).optional(),
}).optional();

// ─── Create Category ──────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
    name: z.string().min(1).max(100).trim(),
    image: z.string().url(),
    imageAdjust: imageAdjustSchema,
    parentId: z.string().nullable().optional(),
    commissionRate: z.number().min(0).max(100).nullable().optional(),
});

// ─── Update Category ──────────────────────────────────────────────────────────

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(100).trim().optional(),
    image: z.string().url().optional(),
    imageAdjust: imageAdjustSchema,
    commissionRate: z.number().min(0).max(100).nullable().optional(),
});

// ─── Block Categories (bulk) ──────────────────────────────────────────────────

export const blockCategoriesSchema = z.object({
    categoryIds: z.array(z.string()).min(1, "At least one category required"),
});

// ─── Delete Categories (bulk) ─────────────────────────────────────────────────

export const deleteCategoriesSchema = z.object({
    categoryIds: z.array(z.string()).min(1, "At least one category required"),
});

// ─── Create / Update Category Template ───────────────────────────────────────

export const categoryTemplateSchema = z.object({
    sizeOptions: z.array(z.string()).default([]),
    specFields: z.array(
        z.object({
            label: z.string().min(1).transform(val => val.trim()),
            key: z.string().min(1).transform(val => val.trim().toLowerCase()),
            filterOptions: z.array(z.string()).default([]),
        })
    )
    .default([]),
});