import dns from "dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import app from "./app.js";
import { startScheduler } from './utils/scheduler.js';
import { startAnalyticsScheduler } from './modules/analytics/analytics.scheduler.js'

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("─────────────────────────────────────");
      console.log("🚀 Server started");
      console.log(`   Port : http://localhost:${PORT}`);
      console.log(`   Env  : ${process.env.NODE_ENV}`);
      console.log("─────────────────────────────────────");
    });
  })
  .catch((err) => {
    logger.error("─────────────────────────────────────");
    logger.error("❌ Server failed to start");
    logger.error(`   Reason : ${err.message}`);
    logger.error(`   Env    : ${process.env.NODE_ENV}`);
    logger.error("─────────────────────────────────────");
    process.exit(1);
  });

startScheduler();
startAnalyticsScheduler();