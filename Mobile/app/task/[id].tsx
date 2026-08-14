import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card, GradientButton, Icon, LoadingIndicator, SecondaryButton, StatusBadge } from "@/components/taskflow";
import { TaskFlowTheme as T } from "@/constants/theme";
import { deleteTask, getApiErrorMessage, getTask, updateTask, updateTaskFavorite, updateTaskStatus, type Task } from "@/lib/taskflow-auth";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try { setTask(await getTask(id)); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ScreenContainer><LoadingIndicator label="Loading task" /></ScreenContainer>;
  if (!task) return <ScreenContainer className="px-5"><View style={styles.empty}><Text style={styles.error}>{error || "Task not found"}</Text><SecondaryButton label="Go back" onPress={() => router.back()} /></View></ScreenContainer>;
  const currentTask = task;

  async function setStatus() {
    try { setTask(await updateTaskStatus(currentTask.id, currentTask.status === "completed" ? "pending" : "completed")); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  async function setFavorite() {
    try { setTask(await updateTaskFavorite(currentTask.id, !currentTask.favorite)); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  async function toggleSubtask(index: number) {
    const subtasks = currentTask.subtasks.map((subtask, position) => position === index ? { ...subtask, completed: !subtask.completed } : subtask);
    try { setTask(await updateTask(currentTask.id, { subtasks })); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  function confirmDelete() {
    Alert.alert("Delete task?", "This action cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteTask(currentTask.id); router.replace("/(tabs)/tasks"); } catch (requestError) { setError(getApiErrorMessage(requestError)); } } }]);
  }

  return <ScreenContainer containerClassName="bg-background" className="px-5 pt-4">
    <View style={styles.page}>
      <View style={styles.topbar}><Pressable onPress={() => router.back()} hitSlop={10}><Icon name="chevron-back" size={24} color={T.colors.text} /></Pressable><Text style={styles.topTitle}>Task Details</Text><Pressable onPress={setFavorite} hitSlop={10}><Icon name={currentTask.favorite ? "star" : "star-outline"} size={22} color={currentTask.favorite ? T.colors.warning : T.colors.text} /></Pressable></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{currentTask.title}</Text>
        <View style={styles.statusRow}><StatusBadge status={currentTask.status} /><Text style={styles.priority}>{currentTask.priority.toUpperCase()} PRIORITY</Text></View>
        {currentTask.description ? <Text style={styles.description}>{currentTask.description}</Text> : <Text style={styles.muted}>No description added.</Text>}
        <Card style={styles.infoCard}><Info label="Category" value={currentTask.category} icon="pricetag-outline" /><Info label="Project" value={currentTask.project} icon="folder-outline" /><Info label="Due date" value={currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : "No due date"} icon="calendar-outline" /><Info label="Time" value={currentTask.time || "Not set"} icon="time-outline" /><Info label="Estimated time" value={currentTask.estimatedTime || "Not set"} icon="hourglass-outline" /></Card>
        {currentTask.notes ? <Card style={styles.section}><Text style={styles.sectionTitle}>Notes</Text><Text style={styles.body}>{currentTask.notes}</Text></Card> : null}
        <Card style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Subtasks</Text><Text style={styles.count}>{currentTask.subtasks.length}</Text></View>{currentTask.subtasks.length ? currentTask.subtasks.map((subtask, index) => <Pressable key={subtask._id || `${subtask.title}-${index}`} onPress={() => toggleSubtask(index)} style={styles.subtask}><View style={[styles.subtaskBox, subtask.completed && styles.subtaskDone]}>{subtask.completed ? <Icon name="checkmark" size={13} color={T.colors.text} /> : null}</View><Text style={[styles.subtaskText, subtask.completed && styles.subtaskCompleted]}>{subtask.title}</Text></Pressable>) : <Text style={styles.muted}>No subtasks added.</Text>}</Card>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}><GradientButton label={currentTask.status === "completed" ? "Mark pending" : "Complete task"} icon={currentTask.status === "completed" ? "refresh-outline" : "checkmark-circle-outline"} onPress={setStatus} /><SecondaryButton label="Edit task" icon="create-outline" onPress={() => router.push({ pathname: "/task/form", params: { id: currentTask.id } })} /><Pressable onPress={confirmDelete} style={styles.delete}><Icon name="trash-outline" size={17} color={T.colors.warning} /><Text style={styles.deleteText}>Delete task</Text></Pressable></View>
      </ScrollView>
    </View>
  </ScreenContainer>;
}

function Info({ label, value, icon }: { label: string; value: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }) { return <View style={styles.info}><Icon name={icon} size={17} color={T.colors.primaryGlow} /><View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>; }

const styles = StyleSheet.create({ page: { flex: 1 }, topbar: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, topTitle: { color: T.colors.text, fontSize: 16, fontWeight: "800" }, scroll: { paddingBottom: 40 }, title: { color: T.colors.text, fontSize: 27, lineHeight: 33, fontWeight: "800", marginBottom: 12 }, statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 }, priority: { color: T.colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }, description: { color: T.colors.text, fontSize: 14, lineHeight: 22, marginBottom: 20 }, muted: { color: T.colors.muted, fontSize: 13, lineHeight: 20 }, infoCard: { gap: 16, marginBottom: 14 }, info: { flexDirection: "row", alignItems: "center", gap: 11 }, infoLabel: { color: T.colors.muted, fontSize: 10, marginBottom: 3 }, infoValue: { color: T.colors.text, fontSize: 13, fontWeight: "700" }, section: { marginBottom: 14, gap: 13 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: T.colors.text, fontSize: 15, fontWeight: "800" }, count: { color: T.colors.primaryGlow, fontSize: 12, fontWeight: "800" }, body: { color: T.colors.muted, fontSize: 13, lineHeight: 20 }, subtask: { flexDirection: "row", alignItems: "center", gap: 10 }, subtaskBox: { width: 20, height: 20, borderWidth: 1.5, borderColor: T.colors.secondary, borderRadius: 6, alignItems: "center", justifyContent: "center" }, subtaskDone: { backgroundColor: T.colors.success, borderColor: T.colors.success }, subtaskText: { color: T.colors.text, fontSize: 13, flex: 1 }, subtaskCompleted: { color: T.colors.muted, textDecorationLine: "line-through" }, actions: { gap: 10, marginTop: 8 }, delete: { minHeight: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, deleteText: { color: T.colors.warning, fontSize: 13, fontWeight: "700" }, error: { color: T.colors.warning, fontSize: 13, marginBottom: 10 }, empty: { flex: 1, justifyContent: "center", gap: 16 },
});
