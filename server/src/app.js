import cors from "cors";
import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import clubsRoutes from "./routes/clubs.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !env.corsOrigins.length || env.corsOrigins.includes(origin)) {
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
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
