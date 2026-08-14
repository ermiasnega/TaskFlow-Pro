import mongoose, { type InferSchemaType } from "mongoose";

export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    completed: { type: Boolean, default: false },
  },
  { _id: true },
);

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    category: { type: String, trim: true, maxlength: 80, default: "General" },
    project: { type: String, trim: true, maxlength: 120, default: "Personal" },
    dueDate: { type: Date, default: null, index: true },
    time: { type: String, trim: true, maxlength: 32, default: "" },
    estimatedTime: { type: String, trim: true, maxlength: 32, default: "" },
    favorite: { type: Boolean, default: false, index: true },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    subtasks: { type: [subtaskSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, status: 1, dueDate: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ category: 1 });
taskSchema.index({ createdAt: 1 });
taskSchema.index({ completedAt: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema> & mongoose.Document;
export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
