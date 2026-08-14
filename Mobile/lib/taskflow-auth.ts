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
export type Category = { id: string; name: string; color: string; icon: string; taskCount: number };
export type ReminderRecurrence = "once" | "daily" | "weekly" | "monthly";
export type Reminder = { id: string; taskId: string; reminderTime: string; recurrence: ReminderRecurrence; enabled: boolean; createdAt: string; task?: { id: string; title: string; status: TaskStatus } };
export type SearchResults = { tasks: Task[]; projects: string[]; categories: Pick<Category, "id" | "name" | "color" | "icon">[] };
export type AnalyticsPeriod = "week" | "month" | "year" | "custom";
export type AnalyticsRange = { period: AnalyticsPeriod; start: string; end: string };
export type AnalyticsOverview = { range: AnalyticsRange; stats: { completed: number; inProgress: number; pending: number; total: number; completionRate: number; tasksCreated: number; totalFocusMinutes: number; productivityChange: number } };
export type ProductivityPoint = { date: string; tasksCompleted: number; focusMinutes: number };
export type CategoryAnalytics = { name: string; count: number; completed: number };
export type FocusTimeAnalytics = { range: AnalyticsRange; totalMinutes: number; sessions: number; daily: { date: string; minutes: number; sessions: number }[] };
export type FocusSession = { id: string; duration: number; completed: boolean; startedAt: string; completedAt: string | null; createdAt: string; updatedAt: string };

function analyticsQuery(params: { period?: AnalyticsPeriod; start?: string; end?: string } = {}) { const query = new URLSearchParams(); if (params.period) query.set("period", params.period); if (params.start) query.set("start", params.start); if (params.end) query.set("end", params.end); return query.toString() ? `?${query.toString()}` : ""; }

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

export async function getCalendarTasks(date: string) {
  const token = await getStoredToken();
  const { data } = await authApi.get<{ date: string; items: Task[] }>(`/tasks/calendar?date=${encodeURIComponent(date)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function listCategories() {
  const token = await getStoredToken();
  const { data } = await authApi.get<{ items: Category[] }>("/categories", { headers: { Authorization: `Bearer ${token}` } });
  return data.items;
}

export async function createCategory(payload: Pick<Category, "name" | "color" | "icon">) {
  const token = await getStoredToken();
  const { data } = await authApi.post<{ category: Category }>("/categories", payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<Pick<Category, "name" | "color" | "icon">>) {
  const token = await getStoredToken();
  const { data } = await authApi.put<{ category: Category }>(`/categories/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.category;
}

export async function deleteCategory(id: string) {
  const token = await getStoredToken();
  const { data } = await authApi.delete<ApiMessage>(`/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function searchTaskFlow(query: string) {
  const token = await getStoredToken();
  const { data } = await authApi.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function listReminders() {
  const token = await getStoredToken();
  const { data } = await authApi.get<{ items: Reminder[] }>("/reminders", { headers: { Authorization: `Bearer ${token}` } });
  return data.items;
}

export async function createReminder(payload: { taskId: string; reminderTime: string; recurrence: ReminderRecurrence; enabled: boolean }) {
  const token = await getStoredToken();
  const { data } = await authApi.post<{ reminder: Reminder }>("/reminders", payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.reminder;
}

export async function updateReminder(id: string, payload: Partial<{ taskId: string; reminderTime: string; recurrence: ReminderRecurrence; enabled: boolean }>) {
  const token = await getStoredToken();
  const { data } = await authApi.put<{ reminder: Reminder }>(`/reminders/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data.reminder;
}

export async function deleteReminder(id: string) {
  const token = await getStoredToken();
  const { data } = await authApi.delete<ApiMessage>(`/reminders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function getAnalyticsOverview(params: { period?: AnalyticsPeriod; start?: string; end?: string } = {}) { const token = await getStoredToken(); const { data } = await authApi.get<AnalyticsOverview>(`/analytics/overview${analyticsQuery(params)}`, { headers: { Authorization: `Bearer ${token}` } }); return data; }

export async function getAnalyticsProductivity(params: { period?: AnalyticsPeriod; start?: string; end?: string } = {}) { const token = await getStoredToken(); const { data } = await authApi.get<{ range: AnalyticsRange; points: ProductivityPoint[] }>(`/analytics/productivity${analyticsQuery(params)}`, { headers: { Authorization: `Bearer ${token}` } }); return data; }

export async function getAnalyticsCategories(params: { period?: AnalyticsPeriod; start?: string; end?: string } = {}) { const token = await getStoredToken(); const { data } = await authApi.get<{ range: AnalyticsRange; categories: CategoryAnalytics[] }>(`/analytics/categories${analyticsQuery(params)}`, { headers: { Authorization: `Bearer ${token}` } }); return data; }

export async function getAnalyticsFocusTime(params: { period?: AnalyticsPeriod; start?: string; end?: string } = {}) { const token = await getStoredToken(); const { data } = await authApi.get<FocusTimeAnalytics>(`/analytics/focus-time${analyticsQuery(params)}`, { headers: { Authorization: `Bearer ${token}` } }); return data; }

export async function listFocusSessions() { const token = await getStoredToken(); const { data } = await authApi.get<{ items: FocusSession[] }>("/focus/sessions", { headers: { Authorization: `Bearer ${token}` } }); return data.items; }

export async function createFocusSession(payload: { duration: number; completed: boolean; startedAt: string; completedAt?: string | null }) { const token = await getStoredToken(); const { data } = await authApi.post<{ session: FocusSession }>("/focus/sessions", payload, { headers: { Authorization: `Bearer ${token}` } }); return data.session; }

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
