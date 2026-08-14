import { Router } from "express";
import { Types } from "mongoose";
import { requireAdmin } from "../middleware/admin.js";
import type { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/user.js";
import { Task } from "../models/task.js";
import { FocusSession } from "../models/focus-session.js";
import { AdminNotification } from "../models/admin-notification.js";
import { SystemSetting } from "../models/system-setting.js";

export const advancedAdminRouter = Router();
advancedAdminRouter.use(requireAdmin);

function range(req: AuthRequest) {
  const period = String(req.query.period ?? "month");
  const now = new Date();
  const end = req.query.end ? new Date(String(req.query.end)) : now;
  const start = req.query.start ? new Date(String(req.query.start)) : new Date(now);
  if (!req.query.start) {
    if (period === "week") start.setDate(now.getDate() - 6);
    else if (period === "year") start.setFullYear(now.getFullYear() - 1);
    else start.setMonth(now.getMonth() - 1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error("Invalid analytics range");
  return { start, end, period };
}
function dayKey(value: Date | string) { return new Date(value).toISOString().slice(0, 10); }
function objectId(value: unknown) { return Types.ObjectId.isValid(String(value)) ? new Types.ObjectId(String(value)) : null; }

advancedAdminRouter.get("/analytics", async (req: AuthRequest, res) => {
  try {
    const { start, end, period } = range(req);
    const taskRange = { createdAt: { $gte: start, $lte: end } };
    const weekStart = new Date(end); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(end); monthStart.setHours(0, 0, 0, 0); monthStart.setDate(monthStart.getDate() - 29);
    const completedRange = { completedAt: { $gte: start, $lte: end }, status: "completed" };
    const [createdDaily, completedDaily, focusDaily, categories, weeklyActiveTaskUsers, monthlyActiveTaskUsers, mostActive, totalTasks, completedTasks, focus, dailyUsers] = await Promise.all([
      Task.aggregate([{ $match: taskRange }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Task.aggregate([{ $match: completedRange }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      FocusSession.aggregate([{ $match: { completed: true, startedAt: { $gte: start, $lte: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, value: { $sum: "$duration" } } }, { $sort: { _id: 1 } }]),
      Task.aggregate([{ $match: taskRange }, { $group: { _id: { $ifNull: ["$category", "Other"] }, value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 10 }]),
      Task.distinct("userId", { createdAt: { $gte: weekStart, $lte: end } }),
      Task.distinct("userId", { createdAt: { $gte: monthStart, $lte: end } }),
      Task.aggregate([{ $match: taskRange }, { $group: { _id: "$userId", tasks: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } }, { $sort: { tasks: -1 } }, { $limit: 10 }]),
      Task.countDocuments(taskRange),
      Task.countDocuments(completedRange),
      FocusSession.aggregate([{ $match: { completed: true, startedAt: { $gte: start, $lte: end } } }, { $group: { _id: null, minutes: { $sum: "$duration" }, sessions: { $sum: 1 } } }]),
      Task.aggregate([{ $match: taskRange }, { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, user: "$userId" } } }, { $group: { _id: "$_id.date", users: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    const ids = mostActive.map((item) => item._id).filter(Boolean);
    const users = await User.find({ _id: { $in: ids } }).select("name email avatar").lean();
    const userMap = Object.fromEntries(users.map((user) => [String(user._id), user]));
    const daily = new Map<string, { date: string; tasksCreated: number; tasksCompleted: number; focusMinutes: number; activeUsers: number }>();
    for (const item of [...createdDaily, ...completedDaily, ...focusDaily, ...dailyUsers]) {
      const date = String(item._id);
      const row = daily.get(date) ?? { date, tasksCreated: 0, tasksCompleted: 0, focusMinutes: 0, activeUsers: 0 };
      if (item.value !== undefined && createdDaily.includes(item)) row.tasksCreated = Number(item.value);
      if (item.value !== undefined && completedDaily.includes(item)) row.tasksCompleted = Number(item.value);
      if (item.value !== undefined && focusDaily.includes(item)) row.focusMinutes = Number(item.value);
      if (item.users !== undefined) row.activeUsers = Number(item.users);
      daily.set(date, row);
    }
    const total = Number(totalTasks);
    return res.json({ range: { start, end, period }, metrics: { dailyActiveUsers: dailyUsers.reduce((max, item) => Math.max(max, Number(item.users)), 0), weeklyActiveUsers: weeklyActiveTaskUsers.length, monthlyActiveUsers: monthlyActiveTaskUsers.length, tasksCreated: total, tasksCompleted: Number(completedTasks), completionRate: total ? Math.round((Number(completedTasks) / total) * 100) : 0, focusMinutes: Number(focus[0]?.minutes ?? 0), focusSessions: Number(focus[0]?.sessions ?? 0) }, series: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)), categories: categories.map((item) => ({ name: String(item._id), value: Number(item.value) })), mostActiveUsers: mostActive.map((item) => ({ user: userMap[String(item._id)]?.name ?? userMap[String(item._id)]?.email ?? "Unknown user", tasks: Number(item.tasks), completed: Number(item.completed) })) });
  } catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "Unable to load advanced analytics" }); }
});

advancedAdminRouter.get("/notifications/manage", async (req, res) => { try { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 10)); const filter: Record<string, any> = {}; const search = String(req.query.search ?? "").trim(); const status = String(req.query.status ?? ""); const audience = String(req.query.audience ?? ""); if (search) { const escaped = search.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&"); filter.$or = [{ title: { $regex: escaped, $options: "i" } }, { message: { $regex: escaped, $options: "i" } }]; } if (["draft", "sent"].includes(status)) filter.status = status; if (["all", "admins", "users"].includes(audience)) filter.audience = audience; const [items, total] = await Promise.all([AdminNotification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("createdBy", "name email").lean(), AdminNotification.countDocuments(filter)]); return res.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }, filters: { search, status, audience } }); } catch { return res.status(500).json({ message: "Unable to load notifications" }); } });
advancedAdminRouter.post("/notifications/manage", async (req: AuthRequest, res) => { const title = String(req.body.title ?? "").trim(); const message = String(req.body.message ?? "").trim(); const audience = ["all", "admins", "users"].includes(req.body.audience) ? req.body.audience : "all"; if (!title || !message) return res.status(400).json({ message: "Title and message are required" }); try { const item = await AdminNotification.create({ title, message, audience, createdBy: new Types.ObjectId(req.authUser!.id) }); return res.status(201).json({ notification: item }); } catch { return res.status(500).json({ message: "Unable to create notification" }); } });
advancedAdminRouter.post("/notifications/manage/:id/send", async (req: AuthRequest, res) => { try { const item = await AdminNotification.findById(req.params.id); if (!item) return res.status(404).json({ message: "Notification not found" }); const filter = item.audience === "admins" ? { role: "admin", isDisabled: { $ne: true } } : item.audience === "users" ? { role: "user", isDisabled: { $ne: true } } : { isDisabled: { $ne: true } }; const targeted = await User.countDocuments(filter); item.status = "sent"; item.sentAt = new Date(); item.delivery = { targeted, delivered: targeted, failed: 0 }; await item.save(); return res.json({ notification: item }); } catch { return res.status(500).json({ message: "Unable to send notification" }); } });
advancedAdminRouter.delete("/notifications/manage/:id", async (req, res) => { try { const item = await AdminNotification.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: "Notification not found" }); return res.json({ message: "Notification deleted" }); } catch { return res.status(500).json({ message: "Unable to delete notification" }); } });

advancedAdminRouter.get("/system-settings", async (_req, res) => { try { const item = await SystemSetting.findOne({ key: "global" }).lean(); return res.json({ settings: item ?? null }); } catch { return res.status(500).json({ message: "Unable to load system settings" }); } });
advancedAdminRouter.put("/system-settings", async (req: AuthRequest, res) => { try { const allowed = ["application", "defaultTask", "categories", "notifications", "permissions"]; const updates: Record<string, unknown> = {}; for (const key of allowed) if (req.body[key] && typeof req.body[key] === "object") for (const [field, value] of Object.entries(req.body[key])) updates[`${key}.${field}`] = value; const settings = await SystemSetting.findOneAndUpdate({ key: "global" }, { $set: { ...updates, updatedBy: new Types.ObjectId(req.authUser!.id) } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean(); return res.json({ settings }); } catch { return res.status(400).json({ message: "Unable to update system settings" }); } });
