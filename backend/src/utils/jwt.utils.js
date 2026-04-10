import jwt from "jsonwebtoken";
import AppError from "./appError.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const parseSameSite = (value, fallback) => {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["lax", "strict", "none"].includes(normalized)) return normalized;
  return fallback;
};

const isProduction = process.env.NODE_ENV === "production";
const refreshCookieSameSite = parseSameSite(
  process.env.REFRESH_COOKIE_SAME_SITE,
  isProduction ? "none" : "lax"
);
const refreshCookieSecure = parseBoolean(
  process.env.REFRESH_COOKIE_SECURE,
  isProduction || refreshCookieSameSite === "none"
);
const refreshCookieDomain = process.env.REFRESH_COOKIE_DOMAIN || undefined;

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
  secure: refreshCookieSecure,
  sameSite: refreshCookieSameSite,
  maxAge: SEVEN_DAYS_MS,
  path: "/",
  ...(refreshCookieDomain ? { domain: refreshCookieDomain } : {}),
};

export const clearRefreshTokenCookieOptions = {
  httpOnly: true,
  secure: refreshCookieSecure,
  sameSite: refreshCookieSameSite,
  path: "/",
  ...(refreshCookieDomain ? { domain: refreshCookieDomain } : {}),
};