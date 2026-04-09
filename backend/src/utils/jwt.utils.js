import jwt from "jsonwebtoken";
import AppError from "./appError.js";

// ─── Generate Tokens ────────────────────────────────────────────────────────

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// ─── Verify Tokens ──────────────────────────────────────────────────────────

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
    }
    throw new AppError("Invalid token", 401, "UNAUTHORIZED");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Refresh token expired, please login again", 401, "UNAUTHORIZED");
    }
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED");
  }
};

// ─── Cookie Options ─────────────────────────────────────────────────────────
// Refresh token is sent via httpOnly cookie — never accessible via JS

export const refreshTokenCookieOptions = {
  httpOnly: true,                                   // not accessible via document.cookie
  secure: process.env.NODE_ENV === "production",    // HTTPS only in production
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days in milliseconds
};

export const clearRefreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
};