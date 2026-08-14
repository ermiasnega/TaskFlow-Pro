import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatar: z.string().max(500).optional(),
  notificationPreferences: z.object({ taskReminders: z.boolean().optional(), dailySummary: z.boolean().optional(), focusNotifications: z.boolean().optional(), productivityNotifications: z.boolean().optional() }).partial().optional(),
  settings: z.object({ appearance: z.enum(["dark", "light", "system"]).optional(), focusMode: z.boolean().optional(), defaultView: z.enum(["list", "calendar"]).optional(), language: z.string().trim().min(2).max(20).optional(), backupSync: z.boolean().optional() }).partial().optional(),
});

export const passwordChangeSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(72), confirmPassword: z.string().min(1) }).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
