import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export interface AuthRequest extends Request {
  userId?: string;
  authUser?: { id: string; name: string; email: string; avatar: string; role: "user" | "admin" };
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    if (!payload.sub) return res.status(401).json({ message: "Invalid token" });
    const user = (await User.findById(payload.sub).lean()) as {
      _id: unknown;
      name: string;
      email: string;
      avatar?: string;
      role: string;
    } | null;
    if (!user) return res.status(401).json({ message: "User not found" });
    req.userId = String(user._id);
    req.authUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? "",
      role: user.role as "user" | "admin",
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
