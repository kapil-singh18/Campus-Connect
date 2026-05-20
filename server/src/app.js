import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import clubsRoutes from "./routes/clubs.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import publicRoutes from "./routes/public.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import announcementsRoutes from "./routes/announcements.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env, isProduction } from "./config/env.js";
import { apiRateLimiter } from "./middleware/security.js";

const localLoopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const isAllowedLocalOrigin = (origin) => {
  if (!origin || isProduction) {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return (protocol === "http:" || protocol === "https:") && localLoopbackHosts.has(hostname);
  } catch {
    return false;
  }
};

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(apiRateLimiter);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
