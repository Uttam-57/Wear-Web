import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        image: {
            type: String,
            required: true,
        },
        imageAdjust: {
            fit: {
                type: String,
                enum: ["cover", "contain"],
                default: "cover",
            },
            positionX: {
                type: Number,
                min: 0,
                max: 100,
                default: 50,
            },
            positionY: {
                type: Number,
                min: 0,
                max: 100,
                default: 50,
            },
            zoom: {
                type: Number,
                min: 100,
                max: 200,
                default: 100,
            },
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        commissionRate: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active",
        },
        blockedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;