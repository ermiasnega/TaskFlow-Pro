import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { FocusSession } from "../models/focus-session.js";
import { focusSessionCreateSchema } from "../validation/analytics.schemas.js";

export const focusRouter = Router();
focusRouter.use(requireAuth);
function owner(req: AuthRequest) { if (!req.userId) throw new Error("Authenticated user is missing"); return new Types.ObjectId(req.userId); }
function mapSession(session: any) { const value = typeof session.toObject === "function" ? session.toObject() : session; return { ...value, id: String(value._id), _id: undefined, userId: String(value.userId) }; }

focusRouter.get("/sessions", async (req: AuthRequest, res) => { try { const sessions = await FocusSession.find({ userId: owner(req) }).sort({ startedAt: -1 }).limit(100); return res.json({ items: sessions.map(mapSession) }); } catch (error) { console.error("focus sessions list error", error); return res.status(500).json({ message: "Unable to load focus sessions" }); } });

focusRouter.post("/sessions", async (req: AuthRequest, res) => { const parsed = focusSessionCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: "Please provide a valid focus session", fields: parsed.error.flatten().fieldErrors }); try { const session = await FocusSession.create({ ...parsed.data, userId: owner(req), completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : parsed.data.completed ? new Date() : null, startedAt: new Date(parsed.data.startedAt) }); return res.status(201).json({ session: mapSession(session) }); } catch (error) { console.error("focus session create error", error); return res.status(500).json({ message: "Unable to save focus session" }); } });
