import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "@/constants/oauth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
  createdAt?: string;
  updatedAt?: string;
};

type AuthResponse = { token: string; user: AuthUser };
type ApiMessage = { message: string; resetToken?: string };

const TOKEN_KEY = "taskflow.jwt";
const USER_KEY = "taskflow.user";

export const authApi = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

async function readValue(key: string) {
  if (Platform.OS === "web") return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken() { return readValue(TOKEN_KEY); }

export async function saveSession(response: AuthResponse) {
  await writeValue(TOKEN_KEY, response.token);
  await writeValue(USER_KEY, JSON.stringify(response.user));
}

export async function clearSession() {
  await removeValue(TOKEN_KEY);
  await removeValue(USER_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const value = await readValue(USER_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export async function register(payload: { name: string; email: string; password: string }) {
  const { data } = await authApi.post<AuthResponse>("/auth/register", payload);
  await saveSession(data);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await authApi.post<AuthResponse>("/auth/login", payload);
  await saveSession(data);
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await authApi.post<ApiMessage>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await authApi.post<ApiMessage>("/auth/reset-password", { token, password });
  return data;
}

export async function getMe(token: string) {
  const { data } = await authApi.get<{ user: AuthUser }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const fields = error.response?.data?.fields;
    if (fields && typeof fields === "object") {
      const first = Object.values(fields).flat()[0];
      if (typeof first === "string") return first;
    }
    return error.response?.data?.message ?? "Something went wrong. Please try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
