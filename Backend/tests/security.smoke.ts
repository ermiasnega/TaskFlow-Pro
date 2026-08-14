import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, timeout: 15000, validateStatus: () => true });
const suffix = crypto.randomUUID();
const email = `security-${suffix}@example.com`;
const password = "TaskFlow-Security-9!";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.create({ name: "Security Smoke", email, password: await bcrypt.hash(password, 12), role: "user" });
  await mongoose.disconnect();
  const login = await api.post("/auth/login", { email, password });
  assert.equal(login.status, 200);
  const userHeaders = { Authorization: `Bearer ${login.data.token}` };
  const expired = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET!, { expiresIn: -1 });
  assert.equal((await api.get("/tasks", { headers: { Authorization: `Bearer ${expired}` } })).status, 401);
  assert.equal((await api.get("/admin/dashboard", { headers: userHeaders })).status, 403);
  assert.equal((await api.post("/tasks", { title: { $ne: null } }, { headers: userHeaders })).status, 400);
  const corsProbe = await api.get("/health", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(corsProbe.status, 403); assert.notEqual(corsProbe.headers["access-control-allow-origin"], "https://untrusted.example");
  for (let index = 0; index < 40; index += 1) await api.post("/auth/login", { email: "invalid@example.com" });
  assert.equal((await api.post("/auth/login", { email: "invalid@example.com" })).status, 429);
  await mongoose.connect(process.env.MONGODB_URI!); await User.deleteOne({ _id: user._id }); await mongoose.disconnect();
  console.log(JSON.stringify({ ok: true, checks: ["expired JWT rejected", "normal user denied Admin", "Mongo-style query operator rejected", "untrusted CORS origin denied", "auth rate limit enforced"] }));
}
main().catch(async (error) => { console.error(error.response?.data ?? error); await mongoose.disconnect().catch(() => undefined); process.exitCode = 1; });
