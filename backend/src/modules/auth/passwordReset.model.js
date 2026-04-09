import mongoose from "mongoose";
import crypto from "crypto";

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Hashed token stored in DB — plain token is sent via email/SMS
  tokenHash: {
    type: String,
    required: true,
    // select: false,
  },

  type: {
    type: String,
    enum: ["email", "otp"], // email = link-based reset, otp = SMS based
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 0, // TTL index — MongoDB auto-deletes the doc when expiresAt is reached
  },
});

// Indexes
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup
passwordResetSchema.index({ userId: 1 });

// ─── Static: hash a plain token ─────────────────────────────────────────────
// Called before storing in DB and before comparing on reset
passwordResetSchema.statics.hashToken = function (plainToken) {
  return crypto.createHash("sha256").update(plainToken).digest("hex");
};

// ─── Static: generate a plain token + its hash ──────────────────────────────
// Returns { plainToken, tokenHash }
// plainToken → sent to user via email/SMS
// tokenHash  → stored in DB
passwordResetSchema.statics.generateToken = function () {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  return { plainToken, tokenHash };
};

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);

export default PasswordReset;