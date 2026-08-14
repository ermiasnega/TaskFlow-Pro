import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Category } from "../models/category.js";
import { Task } from "../models/task.js";
import { searchQuerySchema } from "../validation/productivity.schemas.js";

export const searchRouter = Router();
searchRouter.use(requireAuth);

function mapTask(task: any) { const value = typeof task.toObject === "function" ? task.toObject() : task; return { ...value, id: String(value._id), _id: undefined, userId: undefined }; }

searchRouter.get("/", async (req: AuthRequest, res) => {
  const parsed = searchQuerySchema.safeParse(req.query); if (!parsed.success) return res.status(400).json({ message: "Invalid search query" });
  const q = parsed.data.q;
  if (!q) return res.json({ tasks: [], projects: [], categories: [] });
  try {
    const filter = { userId: req.userId, $or: [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, { project: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }] };
    const [tasks, projects, categories] = await Promise.all([
      Task.find(filter).sort({ updatedAt: -1 }).limit(25),
      Task.distinct("project", { userId: req.userId, project: { $regex: q, $options: "i" } }),
      Category.find({ userId: req.userId, name: { $regex: q, $options: "i" } }).sort({ name: 1 }).limit(25),
    ]);
    return res.json({ tasks: tasks.map(mapTask), projects, categories: categories.map((category) => ({ id: String(category._id), name: category.name, color: category.color, icon: category.icon })) });
  } catch (error) { console.error("search error", error); return res.status(500).json({ message: "Unable to search TaskFlow" }); }
});
