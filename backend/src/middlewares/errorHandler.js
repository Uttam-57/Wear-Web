import logger from '../utils/logger.js';

const SENSITIVE_KEYS = [
  "password",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "authorization",
  "otp",
];

const shouldMask = (key) => {
  const keyLower = String(key || "").toLowerCase();
  return SENSITIVE_KEYS.some((k) => keyLower.includes(k.toLowerCase()));
};

const sanitizeBody = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeBody);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = shouldMask(key) ? "***" : sanitizeBody(nested);
    }
    return out;
  }
  return value;
};

const errorHandler = (err, req, res, next) => {
  // ─── Default values ────────────────────────────────────────────────────────

  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || "SERVER_ERROR";
  let message = err.message || "Something went Wrong";
  let errors = [];

  // ─── Mongoose: duplicate key (email/phone already exists) ──────────────────

  if (err.code === 11000) {
    statusCode = 409;
    errorCode = "CONFLICT";
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`;
  }

  // ─── Mongoose: validation error ────────────────────────────────────────────

  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation Failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose: invalid ObjectId ────────────────────────────────────────────

  if (err.name === "CastError") {
    statusCode = 404;
    errorCode = "NOT_FOUND";
    message = "Resource not found";
  }

  // ─── JWT: expired token ────────────────────────────────────────────────────

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    message = "Access token expired";
  }

  // ─── Zod: validation error ─────────────────────────────────────────────────

  if (err.name === "ZodError") {
    err.isOperational = true;
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation failed";
    errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // ─── Log unexpected errors (non-operational) ───────────────────────────────

  if (!err.isOperational) {
    logger.error("─────────────────────────────────────");
    logger.error("UNEXPECTED ERROR");
    logger.error(`Route  : ${req.method} ${req.originalUrl}`);
    logger.error(`Message: ${err.message}`);
    logger.error(`Stack  : ${err.stack}`);
    logger.error(`Body   : ${JSON.stringify(sanitizeBody(req.body))}`);
    logger.error("─────────────────────────────────────");
  } else {
    logger.warn("─────────────────────────────────────");
    logger.warn("⚠️  OPERATIONAL ERROR");
    logger.warn(`Route   : ${req.method} ${req.originalUrl}`);
    logger.warn(`Status  : ${statusCode}`);
    logger.warn(`Code    : ${errorCode}`);
    logger.warn(`Message : ${message}`);
    if (req.user?.userId) logger.warn(`UserId  : ${req.user.userId}`);
    if (errors.length > 0) logger.warn(`Fields  : ${errors.map(e => `${e.field} → ${e.message}`).join(", ")}`);
    logger.warn("─────────────────────────────────────");
  }

  // ─── Send response ─────────────────────────────────────────────────────────

  const response = {
    success: false,
    errorCode,
    message,
  };

  // only include errors array for validation errors (per blueprint)
  if (errors.length > 0) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;