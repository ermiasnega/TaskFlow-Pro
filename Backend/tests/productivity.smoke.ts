import assert from "node:assert/strict";
import crypto from "node:crypto";
import axios from "axios";

const baseURL = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:4000/api";
const api = axios.create({ baseURL, validateStatus: () => true });
const email = `productivity-${crypto.randomUUID()}@example.com`;
const password = "TaskFlow-Productivity-9!";

async function main() {
  const register = await api.post("/auth/register", { name: "Productivity Smoke", email, password }); assert.equal(register.status, 201, JSON.stringify(register.data));
  const token = register.data.token as string; const headers = { Authorization: `Bearer ${token}` };
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); dueDate.setHours(10, 0, 0, 0);
  const createdTask = await api.post("/tasks", { title: "Productivity smoke task", description: "calendar search reminder", status: "pending", priority: "medium", category: "Work", project: "Iteration 4", dueDate: dueDate.toISOString(), time: "10:00 AM", estimatedTime: "30m", favorite: false, notes: "smoke", subtasks: [] }, { headers }); assert.equal(createdTask.status, 201, JSON.stringify(createdTask.data)); const taskId = createdTask.data.task.id as string;
  const date = dueDate.toISOString().slice(0, 10); const calendar = await api.get(`/tasks/calendar?date=${date}`, { headers }); assert.equal(calendar.status, 200, JSON.stringify(calendar.data)); assert.ok(calendar.data.items.some((item: any) => item.id === taskId));
  const categories = await api.get("/categories", { headers }); assert.equal(categories.status, 200, JSON.stringify(categories.data)); assert.ok(categories.data.items.some((item: any) => item.name === "Work"));
  const category = await api.post("/categories", { name: "Smoke Category", color: "#123456", icon: "flask-outline" }, { headers }); assert.equal(category.status, 201, JSON.stringify(category.data)); const categoryId = category.data.category.id as string;
  const search = await api.get("/search?q=Productivity", { headers }); assert.equal(search.status, 200, JSON.stringify(search.data)); assert.ok(search.data.tasks.some((item: any) => item.id === taskId));
  const reminderTime = new Date(Date.now() + 90 * 60 * 1000).toISOString(); const reminder = await api.post("/reminders", { taskId, reminderTime, recurrence: "once", enabled: true }, { headers }); assert.equal(reminder.status, 201, JSON.stringify(reminder.data)); const reminderId = reminder.data.reminder.id as string;
  const updatedReminder = await api.put(`/reminders/${reminderId}`, { enabled: false, recurrence: "daily" }, { headers }); assert.equal(updatedReminder.status, 200, JSON.stringify(updatedReminder.data));
  const listedReminders = await api.get("/reminders", { headers }); assert.equal(listedReminders.status, 200, JSON.stringify(listedReminders.data)); assert.ok(listedReminders.data.items.some((item: any) => item.id === reminderId && item.enabled === false));
  const deletedReminder = await api.delete(`/reminders/${reminderId}`, { headers }); assert.equal(deletedReminder.status, 200, JSON.stringify(deletedReminder.data));
  const renamed = await api.put(`/categories/${categoryId}`, { name: "Renamed Smoke Category" }, { headers }); assert.equal(renamed.status, 200, JSON.stringify(renamed.data));
  const deletedCategory = await api.delete(`/categories/${categoryId}`, { headers }); assert.equal(deletedCategory.status, 200, JSON.stringify(deletedCategory.data));
  const deletedTask = await api.delete(`/tasks/${taskId}`, { headers }); assert.equal(deletedTask.status, 200, JSON.stringify(deletedTask.data));
  console.log(JSON.stringify({ ok: true, checks: ["calendar", "default categories", "category CRUD", "search", "reminder CRUD"] }));
}
main().catch((error) => { console.error(error.response?.data ?? error); process.exitCode = 1; });
