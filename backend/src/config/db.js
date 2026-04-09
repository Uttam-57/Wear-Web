import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  if (!process.env.MONGO_URI_APP) {
    throw new Error("MONGO_URI_APP is not defined in environment variables");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI_APP, { family: 4 });
    logger.info(`[DB] Connected → ${conn.connection.host}`);
  } catch (error) {
    logger.error(`[DB] Connection failed → ${error.message}`);
    throw error; // bubble up to server.js to handle process.exit
  }
};

export default connectDB;