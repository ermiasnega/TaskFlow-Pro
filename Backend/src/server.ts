import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { authRouter } from "./routes/auth.routes.js";
import { taskRouter } from "./routes/task.routes.js";

export const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "taskflow-backend" }));
app.get("/api/config", (_req, res) => res.json({ name: "TaskFlow", auth: "jwt+bcrypt", database: "mongodb" }));
app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);

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
