import mongoose, { type InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },
    passwordResetVerificationHash: { type: String, select: false },
    passwordResetVerificationExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & mongoose.Document;
export const User = mongoose.models.User || mongoose.model("User", userSchema);
