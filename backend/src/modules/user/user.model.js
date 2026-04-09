import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { BLOCK_REASONS, SELLER_REJECTION_REASONS } from "../../config/constants.js";

const refreshTokenSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
        deviceName: {
            type: String,
            default: "Unknown device",
        },
        userAgent: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "",
        },
        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 7 * 24 * 60 * 60, // Expire after 7 days
        },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxLength: [55, "First name cannot exceed 55 characters"],
        },
        middleName: {
            type: String,
            default: null,
            trim: true,
            maxLength: [55, "Middle name cannot exceed 55 characters"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxLength: [55, "Last name cannot exceed 55 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            // unique: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            default: undefined,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
        },
        profilePhoto: {
            url: {
                type: String,
                default: "https://res.cloudinary.com/wearweb/image/upload/v1/wearweb/defaults/avatar.png",
            },
            publicId: {
                type: String,
                default: null,
            },
        },
        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            required: [true, "Role is required"],
        },
        status: {
            type: String,
            enum: ["pending", "active", "blocked", "deleted"],
            default: function () {
                return this.role === "seller" ? "pending" : "active";
            },
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletionMeta: {
            requestedBy: { type: String, enum: ["self", "admin"], default: null },
            reason: { type: String, default: null },
        },

        // multidevice refresh tokens
        refreshTokens: {
            type: [refreshTokenSchema],
            default: () => [],
            select: false,
        },
        // admin uses
        blockInfo: {
            reason: { type: String, enum: BLOCK_REASONS, default: null },
            message: { type: String, default: null },
            blockedAt: { type: Date, default: null },
        },
        rejectionInfo: {
            reason: { type: String, enum: SELLER_REJECTION_REASONS, default: null },
            message: { type: String, default: null },
            rejectedAt: { type: Date, default: null },
        },
    },
    { timestamps: true, }
);

// indexes

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true }); // spares: only indexes docs where phone exists
userSchema.index({ role: 1, status: 1 });

// hashpassword before save

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);

});

// ─── Instance Methods ────────────────────────────────────────────────────────

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Add a new refresh token (called on login)
userSchema.methods.addRefreshToken = function (token, metadata = {}) {
    if (!this.refreshTokens) this.refreshTokens = [];
    this.refreshTokens.push({
        token,
        sessionId: metadata.sessionId,
        deviceName: metadata.deviceName || "Unknown device",
        userAgent: metadata.userAgent || "",
        ipAddress: metadata.ipAddress || "",
        lastUsedAt: metadata.lastUsedAt || new Date(),
    });
};

// Replace token for an existing session (used during refresh token rotation)
userSchema.methods.replaceRefreshTokenBySession = function (sessionId, token, metadata = {}) {
    if (!this.refreshTokens) this.refreshTokens = [];

    const idx = this.refreshTokens.findIndex((session) => session.sessionId === sessionId);
    if (idx === -1) return false;

    this.refreshTokens[idx] = {
        ...this.refreshTokens[idx].toObject(),
        token,
        deviceName: metadata.deviceName || this.refreshTokens[idx].deviceName || "Unknown device",
        userAgent: metadata.userAgent || this.refreshTokens[idx].userAgent || "",
        ipAddress: metadata.ipAddress || this.refreshTokens[idx].ipAddress || "",
        lastUsedAt: metadata.lastUsedAt || new Date(),
    };

    return true;
};

// Remove a specific refresh token (logout current device)
userSchema.methods.removeRefreshToken = function (token) {
    if (!this.refreshTokens) this.refreshTokens = [];
    this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
};
// Remove all refresh tokens (logout all devices)
userSchema.methods.removeAllRefreshTokens = function () {
    this.refreshTokens = [];
};

const User = mongoose.model("User", userSchema);

export default User;