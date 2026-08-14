import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Category } from "../models/category.js";
import { Task } from "../models/task.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../validation/productivity.schemas.js";

export const categoryRouter = Router();
categoryRouter.use(requireAuth);

const defaults = [
  ["Work", "#4B8DFF", "briefcase-outline"],
  ["Personal", "#9A6BFF", "person-outline"],
  ["Study", "#F4A340", "book-outline"],
  ["Health", "#3DDB82", "heart-outline"],
  ["Finance", "#4BC0C8", "wallet-outline"],
  ["Other", "#8D98AE", "ellipsis-horizontal-circle-outline"],
] as const;

function owner(req: AuthRequest) { if (!req.userId) throw new Error("Authenticated user is missing"); return new Types.ObjectId(req.userId); }
function mapCategory(category: any, count = 0) { const value = typeof category.toObject === "function" ? category.toObject() : category; return { ...value, id: String(value._id), _id: undefined, userId: undefined, taskCount: count }; }

async function ensureDefaults(userId: Types.ObjectId) {
  await Promise.all(defaults.map(([name, color, icon]) => Category.updateOne({ userId, name }, { $setOnInsert: { userId, name, color, icon } }, { upsert: true })));
}

categoryRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = owner(req); await ensureDefaults(userId);
    const [categories, counts] = await Promise.all([
      Category.find({ userId }).sort({ name: 1 }),
      Task.aggregate([{ $match: { userId } }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    return res.json({ items: categories.map((category) => mapCategory(category, countMap.get(category.name) ?? 0)) });
  } catch (error) { console.error("category list error", error); return res.status(500).json({ message: "Unable to load categories" }); }
});

categoryRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: "Invalid category", fields: parsed.error.flatten().fieldErrors });
  try { const category = await Category.create({ ...parsed.data, userId: owner(req) }); return res.status(201).json({ category: mapCategory(category) }); }
  catch (error: any) { if (error?.code === 11000) return res.status(409).json({ message: "A category with this name already exists" }); console.error("category create error", error); return res.status(500).json({ message: "Unable to create category" }); }
});

categoryRouter.put("/:id", async (req: AuthRequest, res) => {
  const parsed = categoryUpdateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: "Invalid category", fields: parsed.error.flatten().fieldErrors });
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Category not found" });
  try {
    const current = await Category.findOne({ _id: String(req.params.id), userId: owner(req) }); if (!current) return res.status(404).json({ message: "Category not found" });
    const category = await Category.findOneAndUpdate({ _id: current._id, userId: owner(req) }, { $set: parsed.data }, { new: true, runValidators: true });
    if (parsed.data.name && parsed.data.name !== current.name) await Task.updateMany({ userId: owner(req), category: current.name }, { $set: { category: parsed.data.name } });
    return res.json({ category: mapCategory(category) });
  } catch (error: any) { if (error?.code === 11000) return res.status(409).json({ message: "A category with this name already exists" }); console.error("category update error", error); return res.status(500).json({ message: "Unable to update category" }); }
});

categoryRouter.delete("/:id", async (req: AuthRequest, res) => {
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Category not found" });
  try { const deleted = await Category.findOneAndDelete({ _id: String(req.params.id), userId: owner(req) }); if (!deleted) return res.status(404).json({ message: "Category not found" }); return res.json({ message: "Category deleted successfully" }); }
  catch (error) { console.error("category delete error", error); return res.status(500).json({ message: "Unable to delete category" }); }
});
