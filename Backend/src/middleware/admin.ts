import type { NextFunction, Response } from "express";
import { requireAuth, type AuthRequest } from "./auth.js";

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => {
    if (req.authUser?.role !== "admin") return res.status(403).json({ message: "Administrator access required" });
    return next();
  });
}
