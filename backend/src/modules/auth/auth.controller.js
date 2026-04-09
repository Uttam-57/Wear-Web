import logger from '../../utils/logger.js';
import {
  registerService,
  loginService,
  logoutService,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  listActiveSessionsService,
} from "./auth.service.js";

// POST /auth/register
export const register = async (req, res, next) => {
  try {
    logger.info(`[AUTH] add user/register → ${req.body.email}`);
    const result = await registerService(req.body, res, req);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
export const login = async (req, res, next) => {
  try {
    logger.info(`[AUTH] login → ${req.body.email}`);
    const result = await loginService(req.body, res, req);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
export const logout = async (req, res, next) => {
  try {
    logger.info(`[AUTH] logout → userId: ${req.user.userId}`);
    const refreshToken = req.cookies.refreshToken;
    const allDevices = req.body.allDevices === true;
    await logoutService(req.user.userId, refreshToken, allDevices, res);
    res.status(200).json({
      success: true,
      message: allDevices ? "Logged out from all devices" : "Logged out successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh-token
export const refreshToken = async (req, res, next) => {
  try {
    logger.info(`[AUTH] refresh-token`);
    const token = req.cookies.refreshToken;
    const result = await refreshTokenService(token, res, req);
    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    logger.info(`[AUTH] forgot-password → ${req.body.email}`);
    const result = await forgotPasswordService(req.body.email);
    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent",
      data: result || null,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    logger.info(`[AUTH] reset-password`);
    await resetPasswordService(req.body.token, req.body.password);
    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/sessions
export const activeSessions = async (req, res, next) => {
  try {
    logger.info(`[AUTH] active-sessions → userId: ${req.user.userId}`);
    const currentRefreshToken = req.cookies.refreshToken;
    const result = await listActiveSessionsService(req.user.userId, currentRefreshToken);
    res.status(200).json({
      success: true,
      message: 'Active sessions fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};