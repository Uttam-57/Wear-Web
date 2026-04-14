import rateLimit from "express-rate-limit";

const limitConfigs = {
  login: { windowMs: 15 * 60 * 1000, max: 5, message: "Too many login attempts. Try again after 15 minutes" },
  forgotPassword: { windowMs: 60 * 60 * 1000, max: 3, message: "Too many reset attempts. Try again after 1 hour" },
  resetPassword: { windowMs: 60 * 60 * 1000, max: 8, message: "Too many password reset attempts. Try again after 1 hour" },
  refreshToken: { windowMs: 60 * 1000, max: 10, message: "Too many token refresh attempts. Try again shortly" },
  register: { windowMs: 60 * 60 * 1000, max: 10, message: "Too many registration attempts. Try again after 1 hour" },
  otpRequest: { windowMs: 10 * 60 * 1000, max: 8, message: "Too many OTP requests. Try again shortly" },
  otpVerify: { windowMs: 10 * 60 * 1000, max: 15, message: "Too many OTP verification attempts. Try again shortly" },
  general: { windowMs: 60 * 1000, max: 100, message: "Too many requests. Please slow down" },
};

export const rateLimiter = (type = "general") => {
  if (process.env.NODE_ENV === "test") return (req, res, next) => next();
  const config = limitConfigs[type] || limitConfigs.general;
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res,next) => {
      res.status(429).json({
        success: false,
        errorCode: "TOO_MANY_REQUESTS",
        message: config.message,
      });
    },
  });
};