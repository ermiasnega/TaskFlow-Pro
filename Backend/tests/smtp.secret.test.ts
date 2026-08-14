import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP configuration", () => {
  it("authenticates with the configured sender mailbox", async () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    expect(host).toBeTruthy();
    expect(user).toBeTruthy();
    expect(password).toBeTruthy();

    const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });
    await expect(transport.verify()).resolves.toBe(true);
    transport.close();
  }, 20000);
});
