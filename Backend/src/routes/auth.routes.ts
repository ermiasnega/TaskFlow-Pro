import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validation/auth.schemas.js";

export const authRouter = Router();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "7d" });
}

function publicUser(user: { _id: unknown; name: string; email: string; avatar?: string; role: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? "",
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validationError(error: unknown) {
  return { message: "Please check the highlighted fields", fields: error };
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));

  try {
    const exists = await User.exists({ email: parsed.data.email });
    if (exists) return res.status(409).json({ message: "An account with this email already exists" });
    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({ ...parsed.data, password });
    return res.status(201).json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ message: "Unable to create your account" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));

  try {
    const user = await User.findOne({ email: parsed.data.email }).select("+password");
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Unable to sign you in" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));

  try {
    const user = await User.findOne({ email: parsed.data.email });
    if (!user) return res.json({ message: "If an account exists, reset instructions have been sent" });

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const response: { message: string; resetToken?: string } = {
      message: "If an account exists, reset instructions have been sent",
    };
    if (process.env.NODE_ENV !== "production") response.resetToken = token;
    return res.json(response);
  } catch (error) {
    console.error("forgot-password error", error);
    return res.status(500).json({ message: "Unable to start password reset" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));

  try {
    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(400).json({ message: "This reset link is invalid or expired" });

    user.password = await bcrypt.hash(parsed.data.password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("reset-password error", error);
    return res.status(500).json({ message: "Unable to reset your password" });
  }
});

authRouter.get("/me", requireAuth, (req: AuthRequest, res) => res.json({ user: req.authUser }));
