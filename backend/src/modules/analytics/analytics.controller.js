import logger from '../../utils/logger.js';
import { getSellerAnalyticsService, getAdminAnalyticsService } from './analytics.service.js';

export const getSellerAnalyticsController = async (req, res, next) => {
  try {
    logger.info(`[CONTROLLER] getSellerAnalyticsController → userId: ${req.user.userId}`);
    const data = await getSellerAnalyticsService(req.user.userId, req.parsedQuery);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminAnalyticsController = async (req, res, next) => {
  try {
    logger.info('[CONTROLLER] getAdminAnalyticsController → request received');
    const data = await getAdminAnalyticsService(req.parsedQuery);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};