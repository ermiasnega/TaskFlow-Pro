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

export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSubtask = { _id?: string; title: string; completed: boolean };
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  project: string;
  dueDate: string | null;
  time: string;
  estimatedTime: string;
  favorite: boolean;
  notes: string;
  subtasks: TaskSubtask[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = Omit<Partial<Task>, "id" | "createdAt" | "updatedAt" | "completedAt"> & { title: string };
export type TaskStats = { all: number; completed: number; inProgress: number; pending: number };

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

export async function verifyResetOtp(email: string, otp: string) {
  const { data } = await authApi.post<ApiMessage>("/auth/verify-reset-otp", { email, otp });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await authApi.post<ApiMessage>("/auth/reset-password", { token, password });
  return data;
}

export async function listTasks(params: { status?: "all" | TaskStatus; search?: string; favorite?: boolean; sort?: "dueDate" | "createdAt" | "priority" | "title"; order?: "asc" | "desc" } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.favorite !== undefined) query.set("favorite", String(params.favorite));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  const token = await getStoredToken();
  const { data } = await authApi.get<{ items: Task[] }>(`/tasks${query.toString() ? `?${query.toString()}` : ""}`, { headers: { Authorization: `Bearer ${token}` } });
  return data.items;
}

export async function getTaskStats() {
  const token = await getStoredToken();
  const { data } = await authApi.get<{ stats: TaskStats; todayTasks: Task[] }>("/tasks/stats", { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function getTask(id: string) {
  const token = await getStoredToken();
  const { data } = await authApi.get<{ task: Task }>(`/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return data.task;
}

export async function createTask(payload: TaskInput) {
  const token = await getStoredToken();
  const { data } = await authApi.post<{ task: Task }>("/tasks", payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.task;
}

export async function updateTask(id: string, payload: Partial<TaskInput>) {
  const token = await getStoredToken();
  const { data } = await authApi.put<{ task: Task }>(`/tasks/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.task;
}

export async function deleteTask(id: string) {
  const token = await getStoredToken();
  const { data } = await authApi.delete<ApiMessage>(`/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const token = await getStoredToken();
  const { data } = await authApi.patch<{ task: Task }>(`/tasks/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
  return data.task;
}

export async function updateTaskFavorite(id: string, favorite: boolean) {
  const token = await getStoredToken();
  const { data } = await authApi.patch<{ task: Task }>(`/tasks/${id}/favorite`, { favorite }, { headers: { Authorization: `Bearer ${token}` } });
  return data.task;
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
