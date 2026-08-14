import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Task } from "../models/task.js";
import { FocusSession } from "../models/focus-session.js";
import { analyticsQuerySchema } from "../validation/analytics.schemas.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

function owner(req: AuthRequest) { if (!req.userId) throw new Error("Authenticated user is missing"); return new Types.ObjectId(req.userId); }
function rangeFromQuery(period: string, start?: string, end?: string) {
  if (period === "custom" && start && end) return { start: new Date(start), end: new Date(end) };
  const now = new Date(); const endDate = new Date(now); const startDate = new Date(now);
  if (period === "week") startDate.setDate(now.getDate() - 6);
  else if (period === "year") startDate.setFullYear(now.getFullYear() - 1);
  else startDate.setMonth(now.getMonth() - 1);
  startDate.setHours(0, 0, 0, 0); endDate.setHours(23, 59, 59, 999);
  return { start: startDate, end: endDate };
}
function previousRange(start: Date, end: Date) { const length = end.getTime() - start.getTime(); return { start: new Date(start.getTime() - length), end: new Date(start.getTime()) }; }
function dateKey(value: Date) { return value.toISOString().slice(0, 10); }

analyticsRouter.get("/overview", async (req: AuthRequest, res) => {
  const parsed = analyticsQuerySchema.safeParse(req.query); if (!parsed.success) return res.status(400).json({ message: "Invalid analytics range", fields: parsed.error.flatten().fieldErrors });
  try {
    const { start, end } = rangeFromQuery(parsed.data.period, parsed.data.start, parsed.data.end); const match = { userId: owner(req), createdAt: { $gte: start, $lte: end } }; const taskMatch = { userId: owner(req), $or: [{ createdAt: { $gte: start, $lte: end } }, { completedAt: { $gte: start, $lte: end } }] };
    const [statusCounts, createdCount, focus, previousCompleted] = await Promise.all([Task.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]), Task.countDocuments(match), FocusSession.aggregate([{ $match: { userId: owner(req), completed: true, startedAt: { $gte: start, $lte: end } } }, { $group: { _id: null, minutes: { $sum: "$duration" } } }]), Task.countDocuments({ ...taskMatch, status: "completed" })]);
    const counts = Object.fromEntries(statusCounts.map((item) => [item._id, Number(item.count)])); const total = Object.values(counts).reduce((sum: number, value: any) => sum + value, 0); const completed = counts.completed ?? 0; const completionRate = total ? Math.round((completed / total) * 100) : 0; const previous = previousRange(start, end); const previousCompletedCount = await Task.countDocuments({ userId: owner(req), status: "completed", completedAt: { $gte: previous.start, $lte: previous.end } }); const productivityChange = previousCompletedCount ? Math.round(((previousCompleted - previousCompletedCount) / previousCompletedCount) * 100) : previousCompleted ? 100 : 0;
    return res.json({ range: { start, end, period: parsed.data.period }, stats: { completed, inProgress: counts["in-progress"] ?? 0, pending: counts.pending ?? 0, total, completionRate, tasksCreated: createdCount, totalFocusMinutes: focus[0]?.minutes ?? 0, productivityChange } });
  } catch (error) { console.error("analytics overview error", error); return res.status(500).json({ message: "Unable to load analytics overview" }); }
});

analyticsRouter.get("/productivity", async (req: AuthRequest, res) => {
  const parsed = analyticsQuerySchema.safeParse(req.query); if (!parsed.success) return res.status(400).json({ message: "Invalid analytics range" });
  try { const { start, end } = rangeFromQuery(parsed.data.period, parsed.data.start, parsed.data.end); const [completed, focus] = await Promise.all([Task.aggregate([{ $match: { userId: owner(req), status: "completed", completedAt: { $gte: start, $lte: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, tasksCompleted: { $sum: 1 } } }, { $sort: { _id: 1 } }]), FocusSession.aggregate([{ $match: { userId: owner(req), completed: true, startedAt: { $gte: start, $lte: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, focusMinutes: { $sum: "$duration" } } }, { $sort: { _id: 1 } }])]); const points = new Map<string, { date: string; tasksCompleted: number; focusMinutes: number }>(); for (const item of completed) points.set(item._id, { date: item._id, tasksCompleted: Number(item.tasksCompleted), focusMinutes: 0 }); for (const item of focus) points.set(item._id, { ...(points.get(item._id) ?? { date: item._id, tasksCompleted: 0 }), focusMinutes: Number(item.focusMinutes) }); return res.json({ range: { start, end, period: parsed.data.period }, points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)) }); } catch (error) { console.error("analytics productivity error", error); return res.status(500).json({ message: "Unable to load productivity analytics" }); }
});

analyticsRouter.get("/categories", async (req: AuthRequest, res) => {
  const parsed = analyticsQuerySchema.safeParse(req.query); if (!parsed.success) return res.status(400).json({ message: "Invalid analytics range" });
  try { const { start, end } = rangeFromQuery(parsed.data.period, parsed.data.start, parsed.data.end); const items = await Task.aggregate([{ $match: { userId: owner(req), createdAt: { $gte: start, $lte: end } } }, { $group: { _id: { $ifNull: ["$category", "Other"] }, count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } }, { $sort: { count: -1 } }]); return res.json({ range: { start, end, period: parsed.data.period }, categories: items.map((item) => ({ name: item._id, count: Number(item.count), completed: Number(item.completed) })) }); } catch (error) { console.error("analytics categories error", error); return res.status(500).json({ message: "Unable to load category analytics" }); }
});

analyticsRouter.get("/focus-time", async (req: AuthRequest, res) => {
  const parsed = analyticsQuerySchema.safeParse(req.query); if (!parsed.success) return res.status(400).json({ message: "Invalid analytics range" });
  try { const { start, end } = rangeFromQuery(parsed.data.period, parsed.data.start, parsed.data.end); const daily = await FocusSession.aggregate([{ $match: { userId: owner(req), completed: true, startedAt: { $gte: start, $lte: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, minutes: { $sum: "$duration" }, sessions: { $sum: 1 } } }, { $sort: { _id: 1 } }]); const totalMinutes = daily.reduce((sum, item) => sum + Number(item.minutes), 0); return res.json({ range: { start, end, period: parsed.data.period }, totalMinutes, sessions: daily.reduce((sum, item) => sum + Number(item.sessions), 0), daily: daily.map((item) => ({ date: item._id, minutes: Number(item.minutes), sessions: Number(item.sessions) })) }); } catch (error) { console.error("analytics focus time error", error); return res.status(500).json({ message: "Unable to load focus-time analytics" }); }
});
