import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (mongoUri = env.mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
