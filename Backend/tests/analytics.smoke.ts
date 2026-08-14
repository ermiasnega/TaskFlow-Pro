import assert from "node:assert/strict";
import crypto from "node:crypto";
import axios from "axios";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, validateStatus: () => true });
const email = `analytics-${crypto.randomUUID()}@example.com`;

async function main() {
  const register = await api.post("/auth/register", { name: "Analytics Smoke", email, password: "TaskFlow-Analytics-9!" }); assert.equal(register.status, 201, JSON.stringify(register.data));
  const headers = { Authorization: `Bearer ${register.data.token}` };
  const task = await api.post("/tasks", { title: "Analytics completed task", description: "real metrics", status: "pending", priority: "medium", category: "Work", project: "Analytics", dueDate: new Date().toISOString(), time: "09:00", estimatedTime: "25m", favorite: false, notes: "", subtasks: [] }, { headers }); assert.equal(task.status, 201, JSON.stringify(task.data)); const taskId = task.data.task.id as string;
  const completed = await api.patch(`/tasks/${taskId}/status`, { status: "completed" }, { headers }); assert.equal(completed.status, 200, JSON.stringify(completed.data));
  const focus = await api.post("/focus/sessions", { duration: 25, completed: true, startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), completedAt: new Date().toISOString() }, { headers }); assert.equal(focus.status, 201, JSON.stringify(focus.data));
  const [overview, productivity, categories, focusTime, sessions] = await Promise.all([api.get("/analytics/overview?period=month", { headers }), api.get("/analytics/productivity?period=month", { headers }), api.get("/analytics/categories?period=month", { headers }), api.get("/analytics/focus-time?period=month", { headers }), api.get("/focus/sessions", { headers })]);
  assert.equal(overview.status, 200, JSON.stringify(overview.data)); assert.ok(overview.data.stats.total >= 1); assert.ok(overview.data.stats.completed >= 1); assert.equal(typeof overview.data.stats.completionRate, "number");
  assert.equal(productivity.status, 200, JSON.stringify(productivity.data)); assert.ok(Array.isArray(productivity.data.points));
  assert.equal(categories.status, 200, JSON.stringify(categories.data)); assert.ok(categories.data.categories.some((item: any) => item.name === "Work"));
  assert.equal(focusTime.status, 200, JSON.stringify(focusTime.data)); assert.ok(focusTime.data.totalMinutes >= 25);
  assert.equal(sessions.status, 200, JSON.stringify(sessions.data)); assert.ok(sessions.data.items.some((item: any) => item.id === focus.data.session.id));
  await api.delete(`/tasks/${taskId}`, { headers });
  console.log(JSON.stringify({ ok: true, checks: ["analytics overview", "productivity", "categories", "focus-time", "focus sessions"] }));
}
main().catch((error) => { console.error(error.response?.data ?? error); process.exitCode = 1; });
