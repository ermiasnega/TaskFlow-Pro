import mongoose from "mongoose";

export type ReminderRecurrence = "once" | "daily" | "weekly" | "monthly";

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    reminderTime: { type: Date, required: true, index: true },
    recurrence: { type: String, enum: ["once", "daily", "weekly", "monthly"], default: "once" },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);
reminderSchema.index({ userId: 1, reminderTime: 1 });
export const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
