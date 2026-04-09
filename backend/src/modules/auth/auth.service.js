import User from "../user/user.model.js";
import PasswordReset from "./passwordReset.model.js";
import AppError from "../../utils/appError.js";
import crypto from "crypto";
import logger from '../../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
} from "../../utils/jwt.utils.js";
import { sendEmail, passwordResetTemplate } from '../../utils/email.utils.js';

const MAX_ACTIVE_DEVICE_SESSIONS = 3;

const getClientIpAddress = (req) => {
  const forwardedFor = req?.headers?.['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : req?.ip;
  return String(ip || req?.socket?.remoteAddress || '').replace('::ffff:', '');
};

const detectDeviceName = (userAgent = '') => {
  const ua = String(userAgent).toLowerCase();

  const browser = ua.includes('edg/')
    ? 'Edge'
    : ua.includes('chrome/')
      ? 'Chrome'
      : ua.includes('firefox/')
        ? 'Firefox'
        : ua.includes('safari/') && !ua.includes('chrome/')
          ? 'Safari'
          : 'Browser';

  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('android')
      ? 'Android'
      : ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')
        ? 'iOS'
        : ua.includes('mac os') || ua.includes('macintosh')
          ? 'macOS'
          : ua.includes('linux')
            ? 'Linux'
            : 'Unknown OS';

  const type = ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')
    ? 'Mobile'
    : ua.includes('ipad') || ua.includes('tablet')
      ? 'Tablet'
      : 'Desktop';

  return `${type} • ${browser} on ${os}`;
};

const getClientInfo = (req) => {
  const userAgent = req?.get?.('user-agent') || '';
  return {
    userAgent,
    ipAddress: getClientIpAddress(req),
    deviceName: detectDeviceName(userAgent),
  };
};

// Helper: build token payload
const buildTokenPayload = (user, sessionId) => ({
  userId: user._id,
  role: user.role,
  ...(sessionId ? { sessionId } : {}),
});

// Helper: issue tokens + set cookie
const issueTokens = (user, res, sessionId) => {
  const resolvedSessionId = sessionId || crypto.randomUUID();
  const payload = buildTokenPayload(user, resolvedSessionId);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
  return { accessToken, refreshToken, sessionId: resolvedSessionId };
};

// Register
export const registerService = async (data, res, req) => {
  const { firstName, middleName, lastName, email, phone, password, role } = data;
 logger.info(`[SERVICE] register → checking email: ${data.email}`);
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new AppError("Email already in use", 409, "CONFLICT");

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) throw new AppError("Phone number already in use", 409, "CONFLICT");
  }
 logger.info(`[SERVICE] register → email clear, creating user`);
  const user = new User({
    firstName,
    middleName: middleName || null,
    lastName,
    email,
    ...(phone ? { phone } : {}),  // do change bcz of frontend
    
    password,
    role,
    refreshTokens: [],
  });

  const { accessToken, refreshToken, sessionId } = issueTokens(user, res);
  user.addRefreshToken(refreshToken, {
    sessionId,
    ...getClientInfo(req),
  });
  await user.save();
  logger.info(`[SERVICE] register → user created, tokens issued`);
  return {
    accessToken,
    user: {
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName ?? null,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      profilePhoto: user.profilePhoto,
      role: user.role,
      status: user.status,
    },
  };
};

// Login
export const loginService = async (data, res, req) => {
  const { email, password } = data;

  logger.info(`[SERVICE] login → finding user: ${data.email}`);
  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user) throw new AppError("Invalid email or password", 401, "UNAUTHORIZED");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid email or password", 401, "UNAUTHORIZED");

  if (user.status === "blocked") throw new AppError("Your account has been blocked", 403, "ACCOUNT_BLOCKED");
  if (user.status === "deleted") throw new AppError("This account has been deleted", 403, "ACCOUNT_DELETED");

  // Re-login from the same browser should replace the existing cookie-bound session.
  const existingRefreshToken = req?.cookies?.refreshToken;
  if (existingRefreshToken) {
    user.removeRefreshToken(existingRefreshToken);
  }

  if ((user.refreshTokens || []).length >= MAX_ACTIVE_DEVICE_SESSIONS) {
    throw new AppError(
      "Device limit reached (max 3). Logout from another device to continue",
      403,
      "DEVICE_LIMIT_REACHED"
    );
  }

  logger.info(`[SERVICE] login → password matched, issuing tokens`);
  const { accessToken, refreshToken, sessionId } = issueTokens(user, res);
  user.addRefreshToken(refreshToken, {
    sessionId,
    ...getClientInfo(req),
  });
  await user.save();

  return {
    accessToken,
    user: {
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName ?? null,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      profilePhoto: user.profilePhoto,
      role: user.role,
      status: user.status,
    },
  };
};

// Logout
export const logoutService = async (userId, refreshToken, allDevices, res) => {
  logger.info(`[SERVICE] logout → userId: ${userId} | allDevices: ${allDevices}`);
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  if (allDevices) {
    user.removeAllRefreshTokens();
  } else {
    user.removeRefreshToken(refreshToken);
  }

  await user.save();
  logger.info(`[SERVICE] logout → tokens cleared`);
  res.clearCookie("refreshToken", clearRefreshTokenCookieOptions);
};

// Refresh Token
export const refreshTokenService = async (refreshToken, res, req) => {
  logger.info(`[SERVICE] refresh-token → verifying token`);
  if (!refreshToken) throw new AppError("No refresh token provided", 401, "UNAUTHORIZED");

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.userId).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 401, "UNAUTHORIZED");

  const currentSession = user.refreshTokens.find((t) => t.token === refreshToken);
  if (!currentSession) {
    // Possible token reuse attack — clear all sessions
    user.removeAllRefreshTokens();
    await user.save();
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED");
  }

  if (user.status === "blocked") throw new AppError("Your account has been blocked", 403, "ACCOUNT_BLOCKED");
  if (user.status === "deleted") throw new AppError("This account has been deleted", 403, "ACCOUNT_DELETED");

  // Rotate tokens
  const sessionId = currentSession.sessionId || decoded.sessionId || crypto.randomUUID();
  const sessionMeta = {
    sessionId,
    ...getClientInfo(req),
    lastUsedAt: new Date(),
  };

  const newAccessToken = generateAccessToken(buildTokenPayload(user, sessionId));
  const newRefreshToken = generateRefreshToken(buildTokenPayload(user, sessionId));
  res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);

  const replaced = user.replaceRefreshTokenBySession(sessionId, newRefreshToken, sessionMeta);
  if (!replaced) {
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(newRefreshToken, sessionMeta);
  }

  await user.save();
 logger.info(`[SERVICE] refresh-token → token rotated successfully`);
  return { accessToken: newAccessToken };
};

// Active sessions
export const listActiveSessionsService = async (userId, currentRefreshToken) => {
  logger.info(`[SERVICE] listActiveSessions → userId: ${userId}`);
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const sessions = (user.refreshTokens || [])
    .map((session) => ({
      sessionId: session.sessionId,
      deviceName: session.deviceName || 'Unknown device',
      ipAddress: session.ipAddress || '',
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt || session.createdAt,
      isCurrent: session.token === currentRefreshToken,
    }))
    .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));

  return {
    maxDevices: MAX_ACTIVE_DEVICE_SESSIONS,
    activeDevices: sessions.length,
    sessions,
  };
};

// ─── REPLACE forgotPasswordService with this ─────────────────────────────────
export const forgotPasswordService = async (email) => {
  logger.info(`[SERVICE] forgot-password → ${email}`);
  const user = await User.findOne({ email });

  // Always return success — never reveal if email exists
  if (!user) return;

  await PasswordReset.deleteMany({ userId: user._id });

  const { plainToken, tokenHash } = PasswordReset.generateToken();
  logger.info(`[SERVICE] forgot-password → reset token generated`);

  await PasswordReset.create({
    userId: user._id,
    tokenHash,
    type: 'email',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${plainToken}`;
  await sendEmail(user.email, 'Reset Your WearWeb Password', passwordResetTemplate(resetLink));
  if (process.env.NODE_ENV === 'test') return { plainToken };
};
// Reset Password
export const resetPasswordService = async (plainToken, newPassword) => {
  logger.info(`[SERVICE] reset-password → verifying token`);
  const tokenHash = PasswordReset.hashToken(plainToken);
    

  const resetRecord = await PasswordReset.findOne({ tokenHash }).select("+tokenHash");
 

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    throw new AppError("Reset token is invalid or has expired", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(resetRecord.userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();
  
   logger.info(`[SERVICE] reset-password → password updated, sessions cleared`);
  await PasswordReset.deleteOne({ _id: resetRecord._id });
};