import logger from '../../utils/logger.js';
import {
  listNotificationsService,
  getUnreadCountService,
  markOneReadService,
  markAllReadService,
  clearAllNotificationsService,
} from './notification.service.js';

export const listNotifications = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] listNotifications → userId: ${req.user.userId} | page: ${req.parsedQuery.page} | limit: ${req.parsedQuery.limit}`);
    const { page, limit } = req.parsedQuery;
    const result = await listNotificationsService({ userId: req.user.userId, page, limit });
    res.status(200).json({
      success: true,
      message: 'Notifications fetched',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getUnreadCount → userId: ${req.user.userId}`);
    const result = await getUnreadCountService({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      message: 'Unread count fetched',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const markOneRead = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] markOneRead → userId: ${req.user.userId} | notificationId: ${req.params.id}`);
    const result = await markOneReadService({
      notificationId: req.params.id,
      userId: req.user.userId,
    });
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] markAllRead → userId: ${req.user.userId}`);
    await markAllReadService({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

export const clearAllNotifications = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] clearAllNotifications → userId: ${req.user.userId}`);
    await clearAllNotificationsService({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};