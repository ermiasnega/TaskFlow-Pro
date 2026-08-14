import { Router } from "express";
import { Types } from "mongoose";
import { requireAdmin } from "../middleware/admin.js";
import type { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/user.js";
import { Task } from "../models/task.js";
import { Category } from "../models/category.js";
import { FocusSession } from "../models/focus-session.js";
import { Reminder } from "../models/reminder.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);
const validPage = (value: unknown) => Math.max(1, Number(value) || 1);
const validLimit = (value: unknown) => Math.min(100, Math.max(5, Number(value) || 20));
const mapUser = (user: any, taskCount = 0) => ({ id: String(user._id), name: user.name, email: user.email, avatar: user.avatar ?? "", role: user.role, isDisabled: Boolean(user.isDisabled), createdAt: user.createdAt, updatedAt: user.updatedAt, taskCount });
const mapTask = (task: any, user?: any) => ({ id: String(task._id), title: task.title, description: task.description, status: task.status, priority: task.priority, category: task.category, project: task.project, dueDate: task.dueDate, time: task.time, favorite: task.favorite, createdAt: task.createdAt, completedAt: task.completedAt, user: user ? mapUser(user) : { id: String(task.userId) } });
function dateKey(value: Date) { return value.toISOString().slice(0, 10); }
function startOfDaysAgo(days: number) { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - days + 1); return date; }

adminRouter.get("/dashboard", async (_req, res) => {
  try {
    const start = startOfDaysAgo(30);
    const [
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      focus,
      growth,
      created,
      completed,
      categories,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isDisabled: { $ne: true } }),
      Task.countDocuments(),
      Task.countDocuments({ status: "completed" }),
      Task.countDocuments({ status: "pending" }),
      Task.countDocuments({ status: "in-progress" }),
      FocusSession.aggregate([
        { $match: { completed: true, startedAt: { $gte: start } } },
        { $group: { _id: null, sessions: { $sum: 1 }, minutes: { $sum: "$duration" } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { completedAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $ifNull: ["$category", "Other"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return res.json({
      metrics: {
        totalUsers: Number(totalUsers),
        activeUsers: Number(activeUsers),
        totalTasks: Number(totalTasks),
        completedTasks: Number(completedTasks),
        pendingTasks: Number(pendingTasks),
        inProgressTasks: Number(inProgressTasks),
        focusSessions: Number(focus[0]?.sessions ?? 0),
        totalFocusMinutes: Number(focus[0]?.minutes ?? 0),
      },
      charts: {
        userGrowth: growth.map((item) => ({ date: String(item._id), value: Number(item.count) })),
        tasksCreated: created.map((item) => ({ date: String(item._id), value: Number(item.count) })),
        tasksCompleted: completed.map((item) => ({ date: String(item._id), value: Number(item.count) })),
        categories: categories.map((item) => ({ name: String(item._id), value: Number(item.count) })),
      },
    });
  } catch (error) {
    console.error("admin dashboard error", error);
    return res.status(500).json({ message: "Unable to load admin dashboard" });
  }
});

adminRouter.get("/users", async (req: AuthRequest, res) => { try { const page = validPage(req.query.page); const limit = validLimit(req.query.limit); const filter: Record<string, any> = {}; if (req.query.search) filter.$or = [{ name: { $regex: String(req.query.search), $options: "i" } }, { email: { $regex: String(req.query.search), $options: "i" } }]; if (req.query.role === "admin" || req.query.role === "user") filter.role = req.query.role; if (req.query.status === "disabled") filter.isDisabled = true; if (req.query.status === "active") filter.isDisabled = { $ne: true }; const [items, total] = await Promise.all([User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)]); const ids = items.map((item) => item._id); const counts = await Task.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]); const countMap = Object.fromEntries(counts.map((item) => [String(item._id), Number(item.count)])); return res.json({ items: items.map((item) => mapUser(item, countMap[String(item._id)] ?? 0)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }); } catch (error) { console.error("admin users error", error); return res.status(500).json({ message: "Unable to load users" }); } });

adminRouter.get("/users/:id", async (req: AuthRequest, res) => { if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "User not found" }); try { const user = await User.findById(req.params.id).select("-password").lean() as any; if (!user) return res.status(404).json({ message: "User not found" }); const [counts, focus] = await Promise.all([Task.aggregate([{ $match: { userId: user._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]), FocusSession.aggregate([{ $match: { userId: user._id, completed: true } }, { $group: { _id: null, minutes: { $sum: "$duration" }, sessions: { $sum: 1 } } }])]); return res.json({ user: mapUser(user), stats: { tasks: counts, focusMinutes: focus[0]?.minutes ?? 0, focusSessions: focus[0]?.sessions ?? 0 } }); } catch (error) { console.error("admin user detail error", error); return res.status(500).json({ message: "Unable to load user" }); } });

adminRouter.put("/users/:id", async (req: AuthRequest, res) => { if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "User not found" }); if (String(req.params.id) === String(req.authUser?.id) && (req.body.role === "user" || req.body.isDisabled === true)) return res.status(400).json({ message: "You cannot disable or demote your own admin account" }); const updates: Record<string, any> = {}; for (const field of ["name", "email", "avatar", "role", "isDisabled"]) if (req.body[field] !== undefined) updates[field] = req.body[field]; if (updates.role && !["admin", "user"].includes(updates.role)) return res.status(400).json({ message: "Invalid role" }); try { const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select("-password").lean(); if (!user) return res.status(404).json({ message: "User not found" }); return res.json({ user: mapUser(user) }); } catch (error) { console.error("admin user update error", error); return res.status(500).json({ message: "Unable to update user" }); } });

adminRouter.delete("/users/:id", async (req: AuthRequest, res) => { if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "User not found" }); if (String(req.params.id) === String(req.authUser?.id)) return res.status(400).json({ message: "You cannot delete your own admin account" }); try { const id = new Types.ObjectId(String(req.params.id)); const user = await User.findByIdAndDelete(id); if (!user) return res.status(404).json({ message: "User not found" }); await Promise.all([Task.deleteMany({ userId: id }), Category.deleteMany({ userId: id }), Reminder.deleteMany({ userId: id }), FocusSession.deleteMany({ userId: id })]); return res.json({ message: "User and owned data deleted" }); } catch (error) { console.error("admin user delete error", error); return res.status(500).json({ message: "Unable to delete user" }); } });

adminRouter.get("/tasks", async (req: AuthRequest, res) => { try { const page = validPage(req.query.page); const limit = validLimit(req.query.limit); const filter: Record<string, any> = {}; if (req.query.search) filter.$or = [{ title: { $regex: String(req.query.search), $options: "i" } }, { project: { $regex: String(req.query.search), $options: "i" } }, { category: { $regex: String(req.query.search), $options: "i" } }]; for (const field of ["status", "priority", "category", "userId"]) if (req.query[field]) filter[field] = String(req.query[field]); if (req.query.date) { const start = new Date(`${String(req.query.date)}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 1); filter.dueDate = { $gte: start, $lt: end }; } const [items, total] = await Promise.all([Task.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Task.countDocuments(filter)]); const users = await User.find({ _id: { $in: items.map((item) => item.userId) } }).select("name email avatar role isDisabled").lean(); const userMap = Object.fromEntries(users.map((user) => [String(user._id), user])); return res.json({ items: items.map((item) => mapTask(item, userMap[String(item.userId)])), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }); } catch (error) { console.error("admin tasks error", error); return res.status(500).json({ message: "Unable to load tasks" }); } });

adminRouter.get("/tasks/:id", async (req: AuthRequest, res) => { try { const task = await Task.findById(req.params.id).lean() as any; if (!task) return res.status(404).json({ message: "Task not found" }); const user = await User.findById(task.userId).select("name email avatar role isDisabled").lean(); return res.json({ task: mapTask(task, user) }); } catch (error) { return res.status(500).json({ message: "Unable to load task" }); } });
adminRouter.delete("/tasks/:id", async (req: AuthRequest, res) => { try { const task = await Task.findByIdAndDelete(req.params.id); if (!task) return res.status(404).json({ message: "Task not found" }); return res.json({ message: "Task deleted successfully" }); } catch (error) { return res.status(500).json({ message: "Unable to delete task" }); } });

adminRouter.get("/categories", async (_req, res) => { try { const categories = await Category.aggregate([{ $group: { _id: { name: "$name", color: "$color", icon: "$icon" }, users: { $addToSet: "$userId" }, categoryIds: { $push: "$_id" } } }, { $project: { _id: 0, name: "$_id.name", color: "$_id.color", icon: "$_id.icon", userCount: { $size: "$users" }, categoryIds: 1 } }, { $sort: { name: 1 } }]); const counts = await Task.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]); const countMap = Object.fromEntries(counts.map((item) => [item._id, Number(item.count)])); return res.json({ items: categories.map((item) => ({ ...item, taskCount: countMap[item.name] ?? 0 })) }); } catch (error) { return res.status(500).json({ message: "Unable to load categories" }); } });
adminRouter.post("/categories", async (req: AuthRequest, res) => { if (!Types.ObjectId.isValid(String(req.body.userId))) return res.status(400).json({ message: "A valid userId is required" }); if (!req.body.name || !/^#[0-9A-Fa-f]{6}$/.test(req.body.color ?? "")) return res.status(400).json({ message: "Name and hex color are required" }); try { const category = await Category.create({ userId: req.body.userId, name: String(req.body.name).trim(), color: req.body.color, icon: req.body.icon ?? "folder-outline" }); return res.status(201).json({ category }); } catch (error) { return res.status(409).json({ message: "Category already exists for this user" }); } });
adminRouter.put("/categories/:id", async (req: AuthRequest, res) => { try { const category = await Category.findByIdAndUpdate(req.params.id, { $set: { ...(req.body.name ? { name: String(req.body.name).trim() } : {}), ...(req.body.color ? { color: req.body.color } : {}), ...(req.body.icon ? { icon: req.body.icon } : {}) } }, { new: true, runValidators: true }); if (!category) return res.status(404).json({ message: "Category not found" }); if (req.body.name) await Task.updateMany({ userId: category.userId, category: { $eq: req.body.previousName } }, { $set: { category: String(req.body.name).trim() } }); return res.json({ category }); } catch (error) { return res.status(500).json({ message: "Unable to update category" }); } });
adminRouter.delete("/categories/:id", async (req: AuthRequest, res) => { try { const category = await Category.findByIdAndDelete(req.params.id); if (!category) return res.status(404).json({ message: "Category not found" }); return res.json({ message: "Category deleted successfully" }); } catch (error) { return res.status(500).json({ message: "Unable to delete category" }); } });

adminRouter.get("/notifications", async (_req, res) => { try { const [total, preferences] = await Promise.all([User.countDocuments(), User.aggregate([{ $group: { _id: null, taskReminders: { $sum: { $cond: ["$notificationPreferences.taskReminders", 1, 0] } }, dailySummary: { $sum: { $cond: ["$notificationPreferences.dailySummary", 1, 0] } }, focusNotifications: { $sum: { $cond: ["$notificationPreferences.focusNotifications", 1, 0] } }, productivityNotifications: { $sum: { $cond: ["$notificationPreferences.productivityNotifications", 1, 0] } } } }])]); return res.json({ totalUsers: total, enabled: preferences[0] ?? { taskReminders: 0, dailySummary: 0, focusNotifications: 0, productivityNotifications: 0 } }); } catch (error) { return res.status(500).json({ message: "Unable to load notification settings" }); } });
adminRouter.get("/settings", async (_req, res) => { try { const [appearance, views, disabled] = await Promise.all([User.aggregate([{ $group: { _id: "$settings.appearance", count: { $sum: 1 } } }]), User.aggregate([{ $group: { _id: "$settings.defaultView", count: { $sum: 1 } } }]), User.countDocuments({ isDisabled: true })]); return res.json({ appearance, defaultViews: views, disabledUsers: disabled }); } catch (error) { return res.status(500).json({ message: "Unable to load admin settings" }); } });
