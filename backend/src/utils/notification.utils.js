import Notification from '../modules/notification/notification.model.js';
import logger from './logger.js';

/**
 * Creates a notification document. Fire-and-forget — never throws.
 * Callers must NOT await this function.
 *
 * @param {object} params
 * @param {string} params.userId     - Recipient user ObjectId string
 * @param {string} params.type       - NOTIFICATION_TYPES enum value
 * @param {string} params.message    - Human-readable message (max 300 chars)
 * @param {string} [params.refId]    - Optional reference document ObjectId string
 * @param {string} [params.refModel] - Optional reference model name
 */
export const createNotification = async ({ userId, type, message, refId, refModel }) => {
  try {
    await Notification.create({
      userId,
      type,
      message,
      ...(refId && { refId }),
      ...(refModel && { refModel }),
    });
  } catch (err) {
    logger.error(`createNotification failed [type=${type}] [userId=${userId}]: ${err.message}`);
  }
};