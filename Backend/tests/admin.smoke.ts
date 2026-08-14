import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import axios from "axios";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import { Task } from "../src/models/task.js";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, validateStatus: () => true });
const suffix = crypto.randomUUID();
const adminEmail = `admin-${suffix}@example.com`;
const userEmail = `member-${suffix}@example.com`;
const password = "TaskFlow-Admin-9!";

async function main() {
  console.log("stage: connect");
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("stage: connected");
  const admin = await User.create({ name: "Admin Smoke", email: adminEmail, password: await bcrypt.hash(password, 12), role: "admin" });
  console.log("stage: admin created");
  const member = await User.create({ name: "Member Smoke", email: userEmail, password: await bcrypt.hash(password, 12), role: "user" });
  await mongoose.disconnect();
  console.log("stage: login");
  const adminLogin = await api.post("/auth/login", { email: adminEmail, password }); assert.equal(adminLogin.status, 200, JSON.stringify(adminLogin.data));
  const memberLogin = await api.post("/auth/login", { email: userEmail, password }); assert.equal(memberLogin.status, 200, JSON.stringify(memberLogin.data));
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };
  const memberHeaders = { Authorization: `Bearer ${memberLogin.data.token}` };
  const denied = await api.get("/admin/dashboard", { headers: memberHeaders }); assert.equal(denied.status, 403, JSON.stringify(denied.data));
  console.log("stage: role check passed");
  const dashboard = await api.get("/admin/dashboard", { headers: adminHeaders }); assert.equal(dashboard.status, 200, JSON.stringify(dashboard.data)); assert.ok("metrics" in dashboard.data);
  const users = await api.get("/admin/users?page=1&limit=10&search=Member", { headers: adminHeaders }); assert.equal(users.status, 200, JSON.stringify(users.data)); assert.ok(users.data.pagination.total >= 1);
  const created = await api.post("/tasks", { title: "Admin smoke task", status: "pending", priority: "high", category: "Work" }, { headers: memberHeaders }); assert.equal(created.status, 201, JSON.stringify(created.data));
  const tasks = await api.get(`/admin/tasks?userId=${member._id}`, { headers: adminHeaders }); assert.equal(tasks.status, 200, JSON.stringify(tasks.data)); assert.ok(tasks.data.items.some((item: any) => item.id === created.data.task.id));
  const categories = await api.get("/admin/categories", { headers: adminHeaders }); assert.equal(categories.status, 200, JSON.stringify(categories.data));
  const notifications = await api.get("/admin/notifications", { headers: adminHeaders }); assert.equal(notifications.status, 200, JSON.stringify(notifications.data));
  const settings = await api.get("/admin/settings", { headers: adminHeaders }); assert.equal(settings.status, 200, JSON.stringify(settings.data));
  const disabled = await api.put(`/admin/users/${member._id}`, { isDisabled: true }, { headers: adminHeaders }); assert.equal(disabled.status, 200, JSON.stringify(disabled.data));
  const blocked = await api.post("/auth/login", { email: userEmail, password }); assert.equal(blocked.status, 401, JSON.stringify(blocked.data));
  await mongoose.connect(process.env.MONGODB_URI!); await Task.deleteMany({ _id: created.data.task.id }); await User.deleteMany({ _id: { $in: [admin._id, member._id] } }); await mongoose.disconnect();
  console.log(JSON.stringify({ ok: true, checks: ["non-admin forbidden", "dashboard metrics", "user search and pagination", "cross-user task registry", "category summary", "notification summary", "settings summary", "disable blocks login"] }));
}
main().catch(async (error) => { console.error(error.response?.data ?? error); await mongoose.disconnect().catch(() => undefined); process.exitCode = 1; });
