import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Reminder, ReminderRecurrence } from "@/lib/taskflow-auth";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
}

export async function requestReminderPermissions() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("task-reminders", { name: "Task reminders", importance: Notifications.AndroidImportance.HIGH });
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

function triggerFor(reminderTime: Date, recurrence: ReminderRecurrence): Notifications.NotificationTriggerInput {
  if (recurrence === "once") return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime };
  if (recurrence === "daily") return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reminderTime.getHours(), minute: reminderTime.getMinutes() };
  if (recurrence === "weekly") return { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: reminderTime.getDay() + 1, hour: reminderTime.getHours(), minute: reminderTime.getMinutes() };
  return { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: reminderTime.getDate(), hour: reminderTime.getHours(), minute: reminderTime.getMinutes() };
}

export async function scheduleReminderNotification(reminder: Pick<Reminder, "id" | "taskId" | "reminderTime" | "recurrence" | "enabled">, taskTitle: string) {
  if (Platform.OS === "web" || !reminder.enabled) return null;
  const allowed = await requestReminderPermissions(); if (!allowed) return null;
  return Notifications.scheduleNotificationAsync({ content: { title: "TaskFlow reminder", body: taskTitle, data: { reminderId: reminder.id, taskId: reminder.taskId }, sound: undefined }, trigger: triggerFor(new Date(reminder.reminderTime), reminder.recurrence) });
}

export async function cancelReminderNotification(notificationId: string | null | undefined) { if (Platform.OS !== "web" && notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId); }
