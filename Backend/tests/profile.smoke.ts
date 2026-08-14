import assert from "node:assert/strict";
import crypto from "node:crypto";
import axios from "axios";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, validateStatus: () => true });
const email = `profile-${crypto.randomUUID()}@example.com`;
const oldPassword = "TaskFlow-Profile-9!";
const newPassword = "TaskFlow-Profile-10!";

async function main() {
  const register = await api.post("/auth/register", { name: "Profile Smoke", email, password: oldPassword }); assert.equal(register.status, 201, JSON.stringify(register.data));
  const headers = { Authorization: `Bearer ${register.data.token}` };
  const initial = await api.get("/users/profile", { headers }); assert.equal(initial.status, 200, JSON.stringify(initial.data)); assert.equal(initial.data.profile.email, email); assert.equal(initial.data.profile.stats.tasks.total, 0);
  const updated = await api.put("/users/profile", { name: "Updated Profile", avatar: "https://example.com/avatar.png", notificationPreferences: { taskReminders: false, dailySummary: true, focusNotifications: false, productivityNotifications: true }, settings: { focusMode: false, defaultView: "calendar", backupSync: true } }, { headers }); assert.equal(updated.status, 200, JSON.stringify(updated.data)); assert.equal(updated.data.profile.name, "Updated Profile"); assert.equal(updated.data.profile.notificationPreferences.taskReminders, false); assert.equal(updated.data.profile.settings.defaultView, "calendar");
  const changed = await api.put("/users/password", { currentPassword: oldPassword, newPassword, confirmPassword: newPassword }, { headers }); assert.equal(changed.status, 200, JSON.stringify(changed.data));
  const oldLogin = await api.post("/auth/login", { email, password: oldPassword }); assert.equal(oldLogin.status, 401, JSON.stringify(oldLogin.data));
  const newLogin = await api.post("/auth/login", { email, password: newPassword }); assert.equal(newLogin.status, 200, JSON.stringify(newLogin.data));
  console.log(JSON.stringify({ ok: true, checks: ["profile read", "profile update", "notification preferences", "settings persistence", "password change", "new-password login"] }));
}
main().catch((error) => { console.error(error.response?.data ?? error); process.exitCode = 1; });
