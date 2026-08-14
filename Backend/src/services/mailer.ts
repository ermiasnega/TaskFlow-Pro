import nodemailer from "nodemailer";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: required("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: { user: required("SMTP_USER"), pass: required("SMTP_PASSWORD") },
  });
}

export async function sendPasswordResetOtp(to: string, otp: string) {
  const from = process.env.SMTP_FROM_EMAIL || required("SMTP_USER");
  await getTransport().sendMail({
    from: `TaskFlow Security <${from}>`,
    to,
    subject: "Your TaskFlow password reset code",
    text: `Your TaskFlow password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;background:#0d1020;color:#eef0ff;padding:32px"><h2 style="color:#a78bfa">TaskFlow</h2><p>Use this one-time code to reset your password:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#c4b5fd">${otp}</p><p>This code expires in 10 minutes and can only be used once.</p><p style="color:#a7adc6;font-size:13px">If you did not request a password reset, you can safely ignore this email.</p></div>`,
  });
}
