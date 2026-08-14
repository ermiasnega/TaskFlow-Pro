import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import axios from "axios";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import { AdminNotification } from "../src/models/admin-notification.js";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, timeout: 15000, validateStatus: () => true });
const suffix = crypto.randomUUID();
const adminEmail = `admin8-${suffix}@example.com`;
const userEmail = `user8-${suffix}@example.com`;
const password = "TaskFlow-Admin-8!";
const adminPaths = [
  "/admin/dashboard",
  "/admin/users?page=1&limit=5",
  "/admin/tasks?page=1&limit=5",
  "/admin/categories",
  "/admin/notifications",
  "/admin/settings",
  "/admin/analytics?period=week",
  "/admin/notifications/manage",
  "/admin/system-settings",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const admin = await User.create({ name: "Iteration 8 Admin", email: adminEmail, password: await bcrypt.hash(password, 12), role: "admin" });
  const user = await User.create({ name: "Iteration 8 User", email: userEmail, password: await bcrypt.hash(password, 12), role: "user" });
  await mongoose.disconnect();
  const adminLogin = await api.post("/auth/login", { email: adminEmail, password });
  const userLogin = await api.post("/auth/login", { email: userEmail, password });
  assert.equal(adminLogin.status, 200); assert.equal(userLogin.status, 200);
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };
  const userHeaders = { Authorization: `Bearer ${userLogin.data.token}` };
  for (const path of adminPaths) {
    assert.equal((await api.get(path)).status, 401, `unauthenticated access should fail for ${path}`);
    assert.equal((await api.get(path, { headers: userHeaders })).status, 403, `normal user access should fail for ${path}`);
  }
  const analytics = await api.get("/admin/analytics?period=week", { headers: adminHeaders });
  assert.equal(analytics.status, 200); assert.ok("metrics" in analytics.data); assert.ok("series" in analytics.data);
  const created = await api.post("/admin/notifications/manage", { title: "Iteration 8 test", message: "Delivery verification", audience: "users" }, { headers: adminHeaders });
  assert.equal(created.status, 201); const notificationId = created.data.notification._id;
  const extraOne = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra one", message: "Pagination verification one", audience: "admins" }, { headers: adminHeaders });
  const extraTwo = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra two", message: "Pagination verification two", audience: "all" }, { headers: adminHeaders });
  const extraThree = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra three", message: "Pagination verification three", audience: "users" }, { headers: adminHeaders });
  const extraFour = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra four", message: "Pagination verification four", audience: "admins" }, { headers: adminHeaders });
  const extraFive = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra five", message: "Pagination verification five", audience: "all" }, { headers: adminHeaders });
  const extraSix = await api.post("/admin/notifications/manage", { title: "Iteration 8 extra six", message: "Pagination verification six", audience: "users" }, { headers: adminHeaders });
  assert.equal(extraOne.status, 201); assert.equal(extraTwo.status, 201); assert.equal(extraThree.status, 201); assert.equal(extraFour.status, 201); assert.equal(extraFive.status, 201); assert.equal(extraSix.status, 201);
  const filtered = await api.get("/admin/notifications/manage?search=Iteration%208%20test&status=draft&audience=users&limit=1&page=1", { headers: adminHeaders });
  assert.equal(filtered.status, 200); assert.equal(filtered.data.items.length, 1); assert.equal(filtered.data.pagination.total, 1); assert.equal(filtered.data.pagination.limit, 5);
  const paged = await api.get("/admin/notifications/manage?search=Iteration%208&limit=1&page=2", { headers: adminHeaders });
  assert.equal(paged.status, 200); assert.equal(paged.data.pagination.limit, 5); assert.ok(paged.data.pagination.pages >= 2); assert.ok(paged.data.items.length <= 5);
  const sent = await api.post(`/admin/notifications/manage/${notificationId}/send`, {}, { headers: adminHeaders });
  assert.equal(sent.status, 200); assert.equal(sent.data.notification.status, "sent");
  assert.ok(Number(sent.data.notification.delivery.targeted) >= 1);
  const listed = await api.get("/admin/notifications/manage", { headers: adminHeaders }); assert.equal(listed.status, 200); assert.ok(listed.data.items.some((item: any) => item._id === notificationId));
  const current = await api.get("/admin/system-settings", { headers: adminHeaders }); assert.equal(current.status, 200);
  const updated = await api.put("/admin/system-settings", { application: { supportEmail: "admin8@example.com" }, permissions: { allowAdminPromotion: false } }, { headers: adminHeaders }); assert.equal(updated.status, 200); assert.equal(updated.data.settings.application.supportEmail, "admin8@example.com");
  const deleted = await api.delete(`/admin/notifications/manage/${notificationId}`, { headers: adminHeaders }); assert.equal(deleted.status, 200);
  await mongoose.connect(process.env.MONGODB_URI!);
  await AdminNotification.deleteMany({ createdBy: admin._id });
  await User.deleteMany({ _id: { $in: [admin._id, user._id] } });
  await mongoose.disconnect();
  console.log(JSON.stringify({ ok: true, checks: ["JWT required", "normal user denied for every new Admin endpoint", "advanced analytics", "notification search/filter/pagination", "notification create/send/list/delete", "system settings read/update"] }));
}
main().catch(async (error) => { console.error(error.response?.data ?? error); await mongoose.disconnect().catch(() => undefined); process.exitCode = 1; });
