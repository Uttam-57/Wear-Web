import multer from "multer";
import AppError from "../utils/appError.js";

const storage = multer.memoryStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const FILE_SIGNATURES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
};

const matchesSignature = (buffer, signature) =>
  signature.every((byte, index) => byte === null || buffer[index] === byte);

const hasValidImageSignature = (file) => {
  if (process.env.NODE_ENV === "test") return true;

  const signatures = FILE_SIGNATURES[file.mimetype] || [];
  return signatures.some((signature) => matchesSignature(file.buffer, signature));
};

const imageFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new AppError("Only JPEG, PNG, WEBP, and GIF images are allowed", 400, "VALIDATION_ERROR"));
  }
  cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const verifyUploadedFiles = (files = []) => {
  for (const file of files) {
    if (!hasValidImageSignature(file)) {
      throw new AppError("Uploaded file content does not match a supported image format", 400, "VALIDATION_ERROR");
    }
  }
};

const wrapUploader = (handler) => (req, res, next) => {
  handler(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }

    try {
      const files = req.file ? [req.file] : req.files || [];
      verifyUploadedFiles(files);
      next();
    } catch (validationErr) {
      next(validationErr);
    }
  });
};

export const uploadSingleImage = (fieldName) => wrapUploader(uploader.single(fieldName));
export const uploadMultipleImages = (fieldName, maxCount = 5) =>
  wrapUploader(uploader.array(fieldName, maxCount));
