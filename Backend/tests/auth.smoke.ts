import mongoose from "mongoose";
import { User } from "../src/models/user.js";

const baseUrl = process.env.TASKFLOW_API_URL ?? "http://127.0.0.1:3000/api";
const email = `iteration2-${Date.now()}@example.com`;
const password = "TaskFlow-Iteration2!";

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function main() {
  const registered = await request("/auth/register", { method: "POST", body: JSON.stringify({ name: "Iteration Tester", email, password }) });
  if (registered.status !== 201) throw new Error(`register failed: ${JSON.stringify(registered.body)}`);

  const loggedIn = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (loggedIn.status !== 200) throw new Error(`login failed: ${JSON.stringify(loggedIn.body)}`);

  const invalid = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password: "wrong-password" }) });
  if (invalid.status !== 401) throw new Error(`invalid credential check failed: ${JSON.stringify(invalid.body)}`);

  const token = loggedIn.body.token as string;
  const me = await request("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  if (me.status !== 200 || me.body.user.email !== email) throw new Error(`protected /me failed: ${JSON.stringify(me.body)}`);

  const protectedWithoutToken = await request("/auth/me");
  if (protectedWithoutToken.status !== 401) throw new Error(`protected route guard failed: ${JSON.stringify(protectedWithoutToken.body)}`);

  const forgot = await request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  if (forgot.status !== 200 || !forgot.body.resetToken) throw new Error(`forgot-password failed: ${JSON.stringify(forgot.body)}`);

  const reset = await request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token: forgot.body.resetToken, password: "TaskFlow-Reset2!" }) });
  if (reset.status !== 200) throw new Error(`reset-password failed: ${JSON.stringify(reset.body)}`);

  await mongoose.connect(process.env.MONGODB_URI as string);
  await User.deleteOne({ email });
  await mongoose.disconnect();
  console.log(JSON.stringify({ register: registered.status, login: loggedIn.status, invalidLogin: invalid.status, me: me.status, protectedWithoutToken: protectedWithoutToken.status, forgotPassword: forgot.status, resetPassword: reset.status }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
