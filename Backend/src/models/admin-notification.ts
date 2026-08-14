import mongoose, { InferSchemaType } from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 140 },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    audience: { type: String, enum: ["all", "admins", "users"], default: "all", index: true },
    status: { type: String, enum: ["draft", "sent"], default: "draft", index: true },
    delivery: {
      targeted: { type: Number, default: 0, min: 0 },
      delivered: { type: Number, default: 0, min: 0 },
      failed: { type: Number, default: 0, min: 0 },
    },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

adminNotificationSchema.index({ createdAt: -1 });
export type AdminNotificationDocument = InferSchemaType<typeof adminNotificationSchema> & mongoose.Document;
export const AdminNotification = mongoose.models.AdminNotification || mongoose.model("AdminNotification", adminNotificationSchema);
