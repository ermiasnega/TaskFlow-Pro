import mongoose, { type InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    notificationPreferences: {
      taskReminders: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      focusNotifications: { type: Boolean, default: true },
      productivityNotifications: { type: Boolean, default: true },
    },
    settings: {
      appearance: { type: String, enum: ["dark", "light", "system"], default: "dark" },
      focusMode: { type: Boolean, default: true },
      defaultView: { type: String, enum: ["list", "calendar"], default: "list" },
      language: { type: String, default: "English" },
      backupSync: { type: Boolean, default: false },
    },
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },
    passwordResetVerificationHash: { type: String, select: false },
    passwordResetVerificationExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & mongoose.Document;
export const User = mongoose.models.User || mongoose.model("User", userSchema);
