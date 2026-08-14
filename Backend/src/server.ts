import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { authRouter } from "./routes/auth.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { reminderRouter } from "./routes/reminder.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { focusRouter } from "./routes/focus.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { advancedAdminRouter } from "./routes/advanced-admin.routes.js";
import { rateLimit } from "./middleware/rate-limit.js";

export const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;

const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081").split(",").map((origin) => origin.trim()).filter(Boolean));
app.use((req, res, next) => { const origin = req.header("Origin"); if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ message: "Origin is not allowed by TaskFlow CORS policy" }); return next(); });
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "api" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "taskflow-backend" }));
app.get("/api/config", (_req, res) => res.json({ name: "TaskFlow", auth: "jwt+bcrypt", database: "mongodb" }));
app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/search", searchRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/focus", focusRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", advancedAdminRouter);

export async function connectDatabase() {
  if (!mongoUri) throw new Error("MONGODB_URI is not configured");
  if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
}

export async function start() {
  await connectDatabase();
  return app.listen(port, () => console.log(`TaskFlow API listening on port ${port}`));
}

if (process.env.NODE_ENV !== "test") {
  start().catch((error) => {
    console.error("TaskFlow API failed to start", error);
    process.exitCode = 1;
  });
}
