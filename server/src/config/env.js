import dotenv from "dotenv";

dotenv.config();

const normalizeOrigin = (value) => {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

const parseList = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change-me-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: normalizeOrigin(process.env.CLIENT_URL || "http://localhost:5173"),
  corsOrigins: parseList(process.env.CORS_ORIGINS || process.env.CLIENT_URL),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  witApiToken: process.env.WIT_API_TOKEN || "",
  witApiVersion: process.env.WIT_API_VERSION || "20230215",
};

export const isProduction = env.nodeEnv === "production";

if (isProduction) {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set in production.");
  }

  if (!process.env.JWT_SECRET || env.jwtSecret === "change-me-jwt-secret") {
    throw new Error("JWT_SECRET must be set to a strong secret in production.");
  }

  if (!process.env.CLIENT_URL && !process.env.CORS_ORIGINS) {
    throw new Error("CLIENT_URL or CORS_ORIGINS must be set in production.");
  }
}
