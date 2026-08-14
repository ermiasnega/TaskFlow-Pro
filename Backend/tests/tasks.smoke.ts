import mongoose from "mongoose";
import { User } from "../src/models/user.js";

const baseUrl = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const email = `task-crud-${Date.now()}@example.com`;
const password = "TaskFlow-CRUD-Verify!";

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  const body = await response.json();
  return { status: response.status, body };
}

async function main() {
  const registered = await request("/auth/register", { method: "POST", body: JSON.stringify({ name: "Task CRUD Tester", email, password }) });
  if (registered.status !== 201) throw new Error(`register failed: ${JSON.stringify(registered.body)}`);
  const token = registered.body.token as string;
  const headers = { Authorization: `Bearer ${token}` };
  const payload = { title: "Verify task persistence", description: "CRUD smoke test", status: "pending", priority: "high", category: "Testing", project: "TaskFlow", dueDate: new Date().toISOString().slice(0, 10), time: "10:00 AM", estimatedTime: "30 minutes", favorite: false, notes: "Keep this test deterministic", subtasks: [{ title: "Create task", completed: false }] };

  const created = await request("/tasks", { method: "POST", headers, body: JSON.stringify(payload) });
  if (created.status !== 201) throw new Error(`create failed: ${JSON.stringify(created.body)}`);
  const id = created.body.task.id as string;

  const listed = await request("/tasks?search=persistence&sort=title&order=asc", { headers });
  if (listed.status !== 200 || !listed.body.items.some((item: { id: string }) => item.id === id)) throw new Error(`list failed: ${JSON.stringify(listed.body)}`);
  const detail = await request(`/tasks/${id}`, { headers });
  if (detail.status !== 200 || detail.body.task.title !== payload.title) throw new Error(`detail failed: ${JSON.stringify(detail.body)}`);
  const updated = await request(`/tasks/${id}`, { method: "PUT", headers, body: JSON.stringify({ description: "Updated description" }) });
  if (updated.status !== 200 || updated.body.task.description !== "Updated description") throw new Error(`update failed: ${JSON.stringify(updated.body)}`);
  const favorite = await request(`/tasks/${id}/favorite`, { method: "PATCH", headers, body: JSON.stringify({ favorite: true }) });
  if (favorite.status !== 200 || favorite.body.task.favorite !== true) throw new Error(`favorite failed: ${JSON.stringify(favorite.body)}`);
  const completed = await request(`/tasks/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status: "completed" }) });
  if (completed.status !== 200 || completed.body.task.status !== "completed" || !completed.body.task.completedAt) throw new Error(`status failed: ${JSON.stringify(completed.body)}`);
  const stats = await request("/tasks/stats", { headers });
  if (stats.status !== 200 || stats.body.stats.completed < 1) throw new Error(`stats failed: ${JSON.stringify(stats.body)}`);
  const deleted = await request(`/tasks/${id}`, { method: "DELETE", headers });
  if (deleted.status !== 200) throw new Error(`delete failed: ${JSON.stringify(deleted.body)}`);

  await mongoose.connect(process.env.MONGODB_URI as string);
  await User.deleteOne({ email });
  await mongoose.disconnect();
  console.log(JSON.stringify({ register: registered.status, create: created.status, list: listed.status, detail: detail.status, update: updated.status, favorite: favorite.status, complete: completed.status, stats: stats.status, delete: deleted.status }));
}

main().catch(async (error) => {
  console.error(error);
  try { await mongoose.connect(process.env.MONGODB_URI as string); await User.deleteOne({ email }); await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
