import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    duration: { type: Number, required: true, min: 1, max: 24 * 60 },
    completed: { type: Boolean, default: false, index: true },
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
focusSessionSchema.index({ userId: 1, startedAt: -1 });
focusSessionSchema.index({ completed: 1, startedAt: -1 });
export const FocusSession = mongoose.models.FocusSession || mongoose.model("FocusSession", focusSessionSchema);
