import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Task } from "../models/task.js";
import { taskCreateSchema, taskFavoriteSchema, taskListQuerySchema, taskStatusSchema, taskUpdateSchema } from "../validation/task.schemas.js";

export const taskRouter = Router();
taskRouter.use(requireAuth);

function userId(req: AuthRequest) {
  if (!req.userId) throw new Error("Authenticated user is missing");
  return req.userId;
}

function validationError(error: unknown) {
  return { message: "Please check the highlighted task fields", fields: error };
}

function mapTask(task: any) {
  const value = typeof task.toObject === "function" ? task.toObject() : task;
  return { ...value, id: String(value._id), _id: undefined, userId: String(value.userId) };
}

function buildDueDate(value: string | null | undefined) {
  if (value === undefined || value === null || value === "") return value === null ? null : undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeInput(input: Record<string, any>) {
  const data = { ...input };
  if (Object.prototype.hasOwnProperty.call(data, "dueDate")) data.dueDate = buildDueDate(data.dueDate);
  if (data.status === "completed") data.completedAt = new Date();
  if (data.status && data.status !== "completed") data.completedAt = null;
  return data;
}

function prioritySortValue(priority: string) {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

taskRouter.get("/stats", async (req: AuthRequest, res) => {
  try {
    const owner = new Types.ObjectId(userId(req));
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const [counts, todayTasks] = await Promise.all([
      Task.aggregate([
        { $match: { userId: owner } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.find({ userId: owner, dueDate: { $gte: start, $lt: end } }).sort({ dueDate: 1, createdAt: -1 }).limit(20),
    ]);
    const byStatus = Object.fromEntries(counts.map((item) => [item._id, item.count]));
    const all = Object.values(byStatus).reduce((sum: number, count: any) => sum + Number(count), 0);
    return res.json({ stats: { all, completed: byStatus.completed ?? 0, inProgress: byStatus["in-progress"] ?? 0, pending: byStatus.pending ?? 0 }, todayTasks: todayTasks.map(mapTask) });
  } catch (error) {
    console.error("task stats error", error);
    return res.status(500).json({ message: "Unable to load task statistics" });
  }
});

taskRouter.get("/", async (req: AuthRequest, res) => {
  const parsed = taskListQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  try {
    const { status, search, favorite, sort, order } = parsed.data;
    const filter: Record<string, any> = { userId: userId(req) };
    if (status !== "all") filter.status = status;
    if (favorite !== undefined) filter.favorite = favorite === "true";
    if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { category: { $regex: search, $options: "i" } }, { project: { $regex: search, $options: "i" } }];
    const direction = order === "asc" ? 1 : -1;
    const sortSpec: Record<string, 1 | -1> = sort === "priority" ? { createdAt: direction } : { [sort]: direction };
    let items = await Task.find(filter).sort(sortSpec);
    if (sort === "priority") items = items.sort((a, b) => (prioritySortValue(String(b.priority)) - prioritySortValue(String(a.priority))) * direction);
    return res.json({ items: items.map(mapTask) });
  } catch (error) {
    console.error("task list error", error);
    return res.status(500).json({ message: "Unable to load tasks" });
  }
});

taskRouter.get("/:id", async (req: AuthRequest, res) => {
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Task not found" });
  try {
    const task = await Task.findOne({ _id: String(req.params.id), userId: userId(req) });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json({ task: mapTask(task) });
  } catch (error) {
    console.error("task detail error", error);
    return res.status(500).json({ message: "Unable to load task" });
  }
});

taskRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  try {
    const task = await Task.create({ ...normalizeInput(parsed.data), userId: userId(req) });
    return res.status(201).json({ task: mapTask(task) });
  } catch (error) {
    console.error("task create error", error);
    return res.status(500).json({ message: "Unable to create task" });
  }
});

taskRouter.put("/:id", async (req: AuthRequest, res) => {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Task not found" });
  try {
    const task = await Task.findOneAndUpdate({ _id: String(req.params.id), userId: userId(req) }, { $set: normalizeInput(parsed.data) }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json({ task: mapTask(task) });
  } catch (error) {
    console.error("task update error", error);
    return res.status(500).json({ message: "Unable to update task" });
  }
});

taskRouter.delete("/:id", async (req: AuthRequest, res) => {
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Task not found" });
  try {
    const deleted = await Task.findOneAndDelete({ _id: String(req.params.id), userId: userId(req) });
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("task delete error", error);
    return res.status(500).json({ message: "Unable to delete task" });
  }
});

taskRouter.patch("/:id/status", async (req: AuthRequest, res) => {
  const parsed = taskStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Task not found" });
  try {
    const task = await Task.findOneAndUpdate({ _id: String(req.params.id), userId: userId(req) }, { $set: normalizeInput(parsed.data) }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json({ task: mapTask(task) });
  } catch (error) {
    console.error("task status error", error);
    return res.status(500).json({ message: "Unable to update task status" });
  }
});

taskRouter.patch("/:id/favorite", async (req: AuthRequest, res) => {
  const parsed = taskFavoriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Task not found" });
  try {
    const task = await Task.findOneAndUpdate({ _id: String(req.params.id), userId: userId(req) }, { $set: { favorite: parsed.data.favorite } }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json({ task: mapTask(task) });
  } catch (error) {
    console.error("task favorite error", error);
    return res.status(500).json({ message: "Unable to update task favorite" });
  }
});
