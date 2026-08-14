import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters").max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Password is required") });
export const forgotPasswordSchema = z.object({ email });
export const verifyResetOtpSchema = z.object({ email, otp: z.string().regex(/^\d{6}$/, "Enter the six-digit code") });
export const resetPasswordSchema = z.object({ token: z.string().min(20), password });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
