import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    color: { type: String, required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/, default: "#9A6BFF" },
    icon: { type: String, trim: true, maxlength: 40, default: "folder-outline" },
  },
  { timestamps: true },
);
categorySchema.index({ userId: 1, name: 1 }, { unique: true });
export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
