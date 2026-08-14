import { z } from "zod";

const dateString = z.string().datetime({ offset: true });
export const analyticsQuerySchema = z.object({
  period: z.enum(["week", "month", "year", "custom"]).default("month"),
  start: dateString.optional(),
  end: dateString.optional(),
}).superRefine((value, context) => {
  if (value.period === "custom" && (!value.start || !value.end)) context.addIssue({ code: "custom", path: ["start"], message: "Custom analytics requires start and end dates" });
  if (value.start && value.end && new Date(value.start) >= new Date(value.end)) context.addIssue({ code: "custom", path: ["end"], message: "End date must be after start date" });
});

export const focusSessionCreateSchema = z.object({
  duration: z.number().int().min(1).max(24 * 60),
  completed: z.boolean().default(true),
  startedAt: dateString,
  completedAt: dateString.nullable().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
