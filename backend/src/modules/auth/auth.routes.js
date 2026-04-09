import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  activeSessions,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const router = express.Router();

// Public routes
router.post("/register", rateLimiter("register"), validate(registerSchema), register);
router.post("/login", rateLimiter("login"), validate(loginSchema), login);
router.post("/forgot-password", rateLimiter("forgotPassword"), validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", rateLimiter("resetPassword"), validate(resetPasswordSchema), resetPassword);
router.post("/refresh-token", rateLimiter("refreshToken"), refreshToken);

// Protected routes
router.post("/logout", authenticate, logout);
router.get('/sessions', authenticate, activeSessions);

export default router;