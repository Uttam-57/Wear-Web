import mongoose from 'mongoose';
import Notification from './notification.model.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

export const listNotificationsService = async ({ userId, page, limit }) => {
  logger.info(`[SERVICE] listNotificationsService → userId: ${userId} | page: ${page} | limit: ${limit}`);
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnreadCountService = async ({ userId }) => {
  logger.info(`[SERVICE] getUnreadCountService → userId: ${userId}`);
  const count = await Notification.countDocuments({ userId, isRead: false });
  return { unreadCount: count };
};

export const markOneReadService = async ({ notificationId, userId }) => {
  logger.info(`[SERVICE] markOneReadService → userId: ${userId} | notificationId: ${notificationId}`);
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  if (notification.isRead) {
    return { notification };
  }

  notification.isRead = true;
  await notification.save();

  return { notification };
};

export const markAllReadService = async ({ userId }) => {
  logger.info(`[SERVICE] markAllReadService → userId: ${userId}`);
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  return {};
};

export const clearAllNotificationsService = async ({ userId }) => {
  logger.info(`[SERVICE] clearAllNotificationsService → userId: ${userId}`);
  await Notification.deleteMany({ userId });
  return {};
};