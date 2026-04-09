import AppError from "../../utils/appError.js";
import { uploadProductMediaService } from "./product.service.js";

const JSON_FIELDS = new Set([
  "images",
  "variants",
  "colorImages",
  "descriptionBlocks",
  "specifications",
  "tags",
  "highlights",
  "manufacturerDetails",
  "shippingInfo",
  "packInfo",
  "returnPolicy",
]);

const SCALAR_FIELDS = new Set([
  "isCODAvailable",
  "avgRating",
  "totalReviews",
  "heldAt",
]);

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[::1\]$/i,
  /^::1$/i,
  /^fc/i,
  /^fd/i,
];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const tryParseField = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed)
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const normalizeTopLevelBody = (body = {}) => {
  const normalized = { ...body };

  for (const [key, value] of Object.entries(normalized)) {
    if (JSON_FIELDS.has(key) || SCALAR_FIELDS.has(key)) {
      normalized[key] = tryParseField(value);
    }
  }

  return normalized;
};

const validateRemoteUrl = (rawUrl) => {
  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError("Invalid media URL", 400, "VALIDATION_ERROR");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("Only http and https media URLs are allowed", 400, "VALIDATION_ERROR");
  }

  const hostname = parsed.hostname.trim().toLowerCase();
  if (!hostname) {
    throw new AppError("Invalid media URL", 400, "VALIDATION_ERROR");
  }

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname)) || hostname.endsWith(".local")) {
    throw new AppError("Private or local media URLs are not allowed", 400, "VALIDATION_ERROR");
  }

  return parsed.toString();
};

const uploadRemoteMedia = async (value) => {
  const url = validateRemoteUrl(value);
  return uploadProductMediaService([url], "products");
};

const normalizeSingleMedia = async (item) => {
  if (typeof item === "string") {
    const [uploaded] = await uploadRemoteMedia(item);
    return uploaded;
  }

  if (isPlainObject(item)) {
    if (typeof item.url !== "string" || !item.url.trim()) {
      throw new AppError("Each media item must include a valid url", 400, "VALIDATION_ERROR");
    }

    if (item.publicId) {
      return {
        url: item.url,
        publicId: item.publicId,
      };
    }

    const [uploaded] = await uploadRemoteMedia(item.url);
    return uploaded;
  }

  throw new AppError("Invalid media input format", 400, "VALIDATION_ERROR");
};

const normalizeMediaList = async (items) => {
  if (items === undefined) return undefined;

  const input = Array.isArray(items) ? items : [items];
  const normalized = [];

  for (const item of input) {
    normalized.push(await normalizeSingleMedia(item));
  }

  return normalized;
};

const normalizeColorImages = async (colorImages) => {
  if (colorImages === undefined) return undefined;
  if (!Array.isArray(colorImages)) {
    throw new AppError("colorImages must be an array", 400, "VALIDATION_ERROR");
  }

  const normalized = [];
  for (const entry of colorImages) {
    if (!isPlainObject(entry)) {
      throw new AppError("Each colorImages entry must be an object", 400, "VALIDATION_ERROR");
    }

    normalized.push({
      ...entry,
      images: await normalizeMediaList(entry.images ?? []),
    });
  }

  return normalized;
};

export const normalizeProductPayload = async (req, res, next) => {
  try {
    req.body = normalizeTopLevelBody(req.body);

    const uploadedFiles = req.files?.length
      ? await uploadProductMediaService(req.files, "products")
      : [];

    const directImages = await normalizeMediaList(req.body.images);
    const normalizedColorImages = await normalizeColorImages(req.body.colorImages);

    if (directImages !== undefined || uploadedFiles.length > 0) {
      req.body.images = [...(directImages || []), ...uploadedFiles];
    }

    if (normalizedColorImages !== undefined) {
      req.body.colorImages = normalizedColorImages;
    }

    next();
  } catch (err) {
    next(err);
  }
};
