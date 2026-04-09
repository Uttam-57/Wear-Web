import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import  AppError  from '../utils/appError.js';
import logger from "../utils/logger.js";

dotenv.config();

let isConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isConfigured) return;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError('Cloudinary configuration is missing', 500, 'SERVER_ERROR');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isConfigured = true;
};

/**
 * Upload a file buffer or base64 string to Cloudinary.
 * @param {string} fileBuffer - base64 data URI or file path
 * @param {string} folder -  folder e.g. 'products', 'profiles', 'sellers'
 * @param {object} options - optional overrides (resource_type, transformation, etc.)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = async (fileBuffer, folder, options = {}) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        url: `https://res.cloudinary.com/test/wearweb/${folder}/${Date.now()}.jpg`,
        publicId: `wearweb/${folder}/test-${Date.now()}`,
      };
    }

    ensureCloudinaryConfigured();

    const result = await cloudinary.uploader.upload(fileBuffer, {
      folder: `wearweb/${folder}`,
      resource_type: 'auto',
      ...options,
    });

    logger.info(`[CLOUDINARY] Uploaded to ${folder} → ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    logger.error(`[CLOUDINARY] Upload failed → ${err.message}`);
    throw new AppError('File upload failed', 500, 'SERVER_ERROR');
  }
};

/**
 * Delete a file from Cloudinary by its public ID.
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (process.env.NODE_ENV === 'test') return;
    ensureCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId);
    logger.info(`[CLOUDINARY] Deleted → ${publicId}`);
  } catch (err) {
    logger.error(`[CLOUDINARY] Delete failed → ${err.message}`);
    throw new AppError('File delete failed', 500, 'SERVER_ERROR');
  }
};

export default cloudinary;