import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";

import logger from "./utils/logger.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";

//--routes---------------------------------------------------------------------------
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import categoryRouter from "./modules/category/category.routes.js";
import productRouter from "./modules/product/product.routes.js";
import cartRoutes from './modules/cart/cart.routes.js';
import orderRouter from './modules/order/order.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import reviewRoutes from './modules/review/review.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js'
//---errorHandler---------------------------------------------------------------------
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
	.split(",")
	.map((origin) => origin.trim().replace(/\/+$/, ""))
	.filter(Boolean);

const corsOptions = {
	credentials: true,
	origin(origin, callback) {
		// Allow non-browser and same-origin requests that do not send Origin header.
		if (!origin) return callback(null, true);
		const normalizedOrigin = String(origin).trim().replace(/\/+$/, "");
		if (!allowedOrigins.length || allowedOrigins.includes(normalizedOrigin)) {
			return callback(null, true);
		}
		return callback(new Error(`CORS blocked for origin: ${origin}`));
	},
};

// ─── Stripe Webhook Raw Body (MUST be before express.json) ───────────────────
app.use('/payment/webhook', express.raw({ type: 'application/json' }));

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeInput);

// ─── Logger ───────────────────────────────────────────────────────────────────
const stream = { write: (message) => logger.http(message.trim()) };
app.use(morgan(":method :url :status :response-time ms", { stream }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/", categoryRouter);
app.use("/", productRouter);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/', orderRouter);
app.use('/payment', paymentRoutes);
app.use('/wallet', walletRoutes);
app.use('/',reviewRoutes);
app.use('/notifications', notificationRoutes);
app.use('/', analyticsRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;