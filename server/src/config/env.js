import dotenv from "dotenv";

dotenv.config();

const parseList = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change-me-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  corsOrigins: parseList(process.env.CORS_ORIGINS || process.env.CLIENT_URL),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  witApiToken: process.env.WIT_API_TOKEN || "",
  witApiVersion: process.env.WIT_API_VERSION || "20230215",
};

export const isProduction = env.nodeEnv === "production";
