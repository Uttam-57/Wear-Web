import mongoose from "mongoose";

const specFieldSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        filterOptions: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const categoryTemplateSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            unique: true,
        },
        sizeOptions: {
            type: [String],
            default: [],
        },
        specFields: {
            type: [specFieldSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const CategoryTemplate = mongoose.model("CategoryTemplate", categoryTemplateSchema);

export default CategoryTemplate;