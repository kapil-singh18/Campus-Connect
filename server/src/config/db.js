import mongoose from "mongoose";
import { env, isProduction } from "./env.js";

let _mongodInstance = null;

export const connectDB = async (mongoUri = env.mongoUri) => {
  let uri = mongoUri;

  // In development, start an in-memory MongoDB if no URI provided
  if (!uri) {
    if (isProduction) {
      throw new Error("MONGODB_URI is missing. Add it to server/.env.");
    }

    // Lazy import to avoid requiring mongodb-memory-server in production
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    _mongodInstance = await MongoMemoryServer.create();
    uri = _mongodInstance.getUri();
    // eslint-disable-next-line no-console
    console.warn("No MONGODB_URI provided — started in-memory MongoDB for development.", uri);
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (_mongodInstance) {
    try {
      await _mongodInstance.stop();
    } finally {
      _mongodInstance = null;
    }
  }
};
