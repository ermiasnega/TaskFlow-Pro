import { z } from "zod";

const nullableDate = z.union([z.string().datetime({ offset: true }), z.string().date(), z.null()]).optional();
const subtask = z.object({ title: z.string().trim().min(1).max(160), completed: z.boolean().default(false) });

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(2000).optional().default(""),
  status: z.enum(["pending", "in-progress", "completed"]).optional().default("pending"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  category: z.string().trim().max(80).optional().default("General"),
  project: z.string().trim().max(120).optional().default("Personal"),
  dueDate: nullableDate,
  time: z.string().trim().max(32).optional().default(""),
  estimatedTime: z.string().trim().max(32).optional().default(""),
  favorite: z.boolean().optional().default(false),
  notes: z.string().trim().max(2000).optional().default(""),
  subtasks: z.array(subtask).max(50).optional().default([]),
});

export const taskUpdateSchema = taskCreateSchema.partial();
export const taskStatusSchema = z.object({ status: z.enum(["pending", "in-progress", "completed"]) });
export const taskFavoriteSchema = z.object({ favorite: z.boolean() });
export const taskListQuerySchema = z.object({
  status: z.enum(["all", "pending", "in-progress", "completed"]).optional().default("all"),
  search: z.string().trim().max(120).optional().default(""),
  favorite: z.enum(["true", "false"]).optional(),
  sort: z.enum(["dueDate", "createdAt", "priority", "title"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
