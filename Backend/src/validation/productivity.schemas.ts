import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#9A6BFF"),
  icon: z.string().trim().max(40).default("folder-outline"),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();

export const reminderCreateSchema = z.object({
  taskId: z.string().min(1),
  reminderTime: z.string().datetime({ offset: true }),
  recurrence: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
  enabled: z.boolean().default(true),
});
export const reminderUpdateSchema = reminderCreateSchema.partial();

export const calendarQuerySchema = z.object({ date: z.string().date() });
export const searchQuerySchema = z.object({ q: z.string().trim().max(120).default("") });

export type ReminderCreateInput = z.infer<typeof reminderCreateSchema>;
