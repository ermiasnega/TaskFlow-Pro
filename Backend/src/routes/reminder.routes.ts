import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Reminder } from "../models/reminder.js";
import { Task } from "../models/task.js";
import { reminderCreateSchema, reminderUpdateSchema } from "../validation/productivity.schemas.js";

export const reminderRouter = Router();
reminderRouter.use(requireAuth);

function owner(req: AuthRequest) { if (!req.userId) throw new Error("Authenticated user is missing"); return new Types.ObjectId(req.userId); }
function mapReminder(reminder: any) { const value = typeof reminder.toObject === "function" ? reminder.toObject() : reminder; return { ...value, id: String(value._id), _id: undefined, userId: undefined, task: value.taskId && typeof value.taskId === "object" ? { id: String(value.taskId._id), title: value.taskId.title, status: value.taskId.status } : undefined, taskId: value.taskId && typeof value.taskId === "object" ? String(value.taskId._id) : String(value.taskId) }; }

async function ownedTask(taskId: string, userId: Types.ObjectId) { return Types.ObjectId.isValid(taskId) ? Task.findOne({ _id: taskId, userId }) : null; }

reminderRouter.get("/", async (req: AuthRequest, res) => {
  try { const items = await Reminder.find({ userId: owner(req) }).populate("taskId", "title status").sort({ reminderTime: 1, createdAt: -1 }); return res.json({ items: items.map(mapReminder) }); }
  catch (error) { console.error("reminder list error", error); return res.status(500).json({ message: "Unable to load reminders" }); }
});

reminderRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = reminderCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: "Invalid reminder", fields: parsed.error.flatten().fieldErrors });
  try { if (!(await ownedTask(parsed.data.taskId, owner(req)))) return res.status(404).json({ message: "Task not found" }); const reminder = await Reminder.create({ ...parsed.data, reminderTime: new Date(parsed.data.reminderTime), userId: owner(req) }); await reminder.populate("taskId", "title status"); return res.status(201).json({ reminder: mapReminder(reminder) }); }
  catch (error) { console.error("reminder create error", error); return res.status(500).json({ message: "Unable to create reminder" }); }
});

reminderRouter.put("/:id", async (req: AuthRequest, res) => {
  const parsed = reminderUpdateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: "Invalid reminder", fields: parsed.error.flatten().fieldErrors });
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Reminder not found" });
  try {
    const data: Record<string, any> = { ...parsed.data }; if (data.reminderTime) data.reminderTime = new Date(data.reminderTime);
    if (data.taskId && !(await ownedTask(data.taskId, owner(req)))) return res.status(404).json({ message: "Task not found" });
    const reminder = await Reminder.findOneAndUpdate({ _id: String(req.params.id), userId: owner(req) }, { $set: data }, { new: true, runValidators: true }).populate("taskId", "title status");
    if (!reminder) return res.status(404).json({ message: "Reminder not found" }); return res.json({ reminder: mapReminder(reminder) });
  } catch (error) { console.error("reminder update error", error); return res.status(500).json({ message: "Unable to update reminder" }); }
});

reminderRouter.delete("/:id", async (req: AuthRequest, res) => {
  if (!Types.ObjectId.isValid(String(req.params.id))) return res.status(404).json({ message: "Reminder not found" });
  try { const deleted = await Reminder.findOneAndDelete({ _id: String(req.params.id), userId: owner(req) }); if (!deleted) return res.status(404).json({ message: "Reminder not found" }); return res.json({ message: "Reminder deleted successfully" }); }
  catch (error) { console.error("reminder delete error", error); return res.status(500).json({ message: "Unable to delete reminder" }); }
});
