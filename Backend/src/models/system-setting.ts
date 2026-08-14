import mongoose, { InferSchemaType } from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    application: {
      name: { type: String, default: "TaskFlow" },
      maintenanceMode: { type: Boolean, default: false },
      supportEmail: { type: String, default: "" },
    },
    defaultTask: {
      priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
      status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
      estimatedTime: { type: String, default: "30m" },
    },
    categories: {
      allowUserCreation: { type: Boolean, default: true },
      requireColor: { type: Boolean, default: true },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
      dailySummaryEnabled: { type: Boolean, default: true },
    },
    permissions: {
      allowUserSelfRegistration: { type: Boolean, default: true },
      allowAdminPromotion: { type: Boolean, default: false },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export type SystemSettingDocument = InferSchemaType<typeof systemSettingSchema> & mongoose.Document;
export const SystemSetting = mongoose.models.SystemSetting || mongoose.model("SystemSetting", systemSettingSchema);
