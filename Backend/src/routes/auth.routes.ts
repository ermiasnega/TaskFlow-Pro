import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyResetOtpSchema } from "../validation/auth.schemas.js";
import { sendPasswordResetOtp } from "../services/mailer.js";

export const authRouter = Router();
const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_RESET_TTL_MS = 10 * 60 * 1000;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "7d" });
}

function publicUser(user: { _id: unknown; name: string; email: string; avatar?: string; role: string; createdAt: Date; updatedAt: Date }) {
  return { id: String(user._id), name: user.name, email: user.email, avatar: user.avatar ?? "", role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

function validationError(error: unknown) {
  return { message: "Please check the highlighted fields", fields: error };
}

function hashSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function genericResetMessage() {
  return "If an account exists, a verification code has been sent to that email address";
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
    if (!user || user.isDisabled || !(await bcrypt.compare(parsed.data.password, user.password))) return res.status(401).json({ message: "Invalid email or password" });
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
    const user = await User.findOne({ email: parsed.data.email }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt");
    if (!user) return res.json({ message: genericResetMessage() });
    const otp = createOtp();
    user.passwordResetOtpHash = hashSecret(otp);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);
    user.passwordResetVerificationHash = undefined;
    user.passwordResetVerificationExpiresAt = undefined;
    await user.save();
    await sendPasswordResetOtp(user.email, otp);
    return res.json({ message: genericResetMessage() });
  } catch (error) {
    console.error("forgot-password error", error);
    return res.status(500).json({ message: "Unable to send the verification code" });
  }
});

authRouter.post("/verify-reset-otp", async (req, res) => {
  const parsed = verifyResetOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  try {
    const user = await User.findOne({ email: parsed.data.email }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetVerificationHash +passwordResetVerificationExpiresAt");
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt || user.passwordResetOtpExpiresAt <= new Date() || hashSecret(parsed.data.otp) !== user.passwordResetOtpHash) {
      return res.status(400).json({ message: "That verification code is invalid or expired" });
    }
    const verifiedToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetVerificationHash = hashSecret(verifiedToken);
    user.passwordResetVerificationExpiresAt = new Date(Date.now() + VERIFIED_RESET_TTL_MS);
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();
    return res.json({ message: "Code verified", resetToken: verifiedToken });
  } catch (error) {
    console.error("verify-reset-otp error", error);
    return res.status(500).json({ message: "Unable to verify the code" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error.flatten().fieldErrors));
  try {
    const user = await User.findOne({ passwordResetVerificationHash: hashSecret(parsed.data.token), passwordResetVerificationExpiresAt: { $gt: new Date() } }).select("+password +passwordResetVerificationHash +passwordResetVerificationExpiresAt");
    if (!user) return res.status(400).json({ message: "Your verification has expired. Request a new code." });
    user.password = await bcrypt.hash(parsed.data.password, 12);
    user.passwordResetVerificationHash = undefined;
    user.passwordResetVerificationExpiresAt = undefined;
    await user.save();
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("reset-password error", error);
    return res.status(500).json({ message: "Unable to reset your password" });
  }
});

authRouter.get("/me", requireAuth, (req: AuthRequest, res) => res.json({ user: req.authUser }));
