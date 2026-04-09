import xss from "xss";

// Recursively sanitize all string values in an object
const sanitizeObject = (obj) => {
  if (typeof obj === "string") return xss(obj.trim());
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj; // numbers, booleans, null — untouched
};

const sanitizeInPlace = (target) => {
  if (!target || typeof target !== "object" || Array.isArray(target)) return;
  const sanitized = sanitizeObject(target);
  for (const key of Object.keys(target)) {
    target[key] = sanitized[key];
  }
};

export const sanitizeInput = (req, res, next) => {
  // Stripe webhook requires untouched raw body for signature verification.
  if (req.originalUrl.startsWith('/payment/webhook')) return next();

  if (Buffer.isBuffer(req.body)) return next();

  if (req.body) req.body = sanitizeObject(req.body);
  sanitizeInPlace(req.query);
  sanitizeInPlace(req.params);
  next();
};