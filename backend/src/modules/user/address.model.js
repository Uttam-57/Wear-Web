import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxLength: [100, "Full name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, "Invalid phone number"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxLength: [60, "Country name cannot exceed 60 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxLength: [60, "State cannot exceed 60 characters"],
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxLength: [60, "District cannot exceed 60 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxLength: [60, "City cannot exceed 60 characters"],
    },
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      maxLength: [200, "Street cannot exceed 200 characters"],
    },
    building: {
      type: String,
      trim: true,
      default: null,
      maxLength: [100, "Building cannot exceed 100 characters"],
    },
    landmark: {
      type: String,
      trim: true,
      default: null,
      maxLength: [100, "Landmark cannot exceed 100 characters"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^\d{4,10}$/, "Invalid pincode"],
    },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;