import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card, GradientButton, Icon, InputField, SecondaryButton } from "@/components/taskflow";
import { TaskFlowTheme as T } from "@/constants/theme";
import { createTask, getApiErrorMessage, getTask, updateTask, type Task, type TaskInput, type TaskPriority, type TaskStatus } from "@/lib/taskflow-auth";

const statuses: TaskStatus[] = ["pending", "in-progress", "completed"];
const priorities: TaskPriority[] = ["low", "medium", "high"];

export default function TaskFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);
  const [task, setTask] = useState<Partial<Task> & { title: string }>({ title: "", description: "", status: "pending", priority: "medium", category: "General", project: "Personal", dueDate: null, time: "", estimatedTime: "", notes: "", subtasks: [] });
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTask(id).then(setTask).catch((requestError) => setError(getApiErrorMessage(requestError))).finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof Task>(key: K, value: Task[K]) { setTask((current) => ({ ...current, [key]: value })); }

  function addSubtask() {
    if (!subtaskTitle.trim()) return;
    update("subtasks", [...(task.subtasks || []), { title: subtaskTitle.trim(), completed: false }]);
    setSubtaskTitle("");
  }

  async function save() {
    if (!task.title.trim()) return setError("Add a task title");
    setSaving(true); setError(null);
    const payload: TaskInput = { title: task.title.trim(), description: task.description || "", status: task.status || "pending", priority: task.priority || "medium", category: task.category || "General", project: task.project || "Personal", dueDate: task.dueDate || null, time: task.time || "", estimatedTime: task.estimatedTime || "", notes: task.notes || "", subtasks: task.subtasks || [] };
    try { if (id) await updateTask(id, payload); else await createTask(payload); router.replace(id ? { pathname: "/task/[id]", params: { id } } : "/(tabs)/tasks"); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  if (loading) return <ScreenContainer><View style={styles.loading}><Text style={styles.muted}>Loading task…</Text></View></ScreenContainer>;

  return <ScreenContainer containerClassName="bg-background" className="px-5 pt-4">
    <View style={styles.page}>
      <View style={styles.topbar}><Pressable onPress={() => router.back()} hitSlop={10}><Icon name="chevron-back" size={24} color={T.colors.text} /></Pressable><Text style={styles.topTitle}>{editing ? "Edit Task" : "Add Task"}</Text><View style={{ width: 24 }} /></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <InputField label="Title" placeholder="What needs to get done?" value={task.title} onChangeText={(value) => update("title", value)} />
        <InputField label="Description" placeholder="Add some context" value={task.description || ""} onChangeText={(value) => update("description", value)} multiline />
        <View style={styles.field}><Text style={styles.label}>Status</Text><View style={styles.choices}>{statuses.map((value) => <Choice key={value} label={value === "in-progress" ? "In Progress" : value[0].toUpperCase() + value.slice(1)} active={task.status === value} onPress={() => update("status", value)} />)}</View></View>
        <View style={styles.field}><Text style={styles.label}>Priority</Text><View style={styles.choices}>{priorities.map((value) => <Choice key={value} label={value[0].toUpperCase() + value.slice(1)} active={task.priority === value} onPress={() => update("priority", value)} />)}</View></View>
        <View style={styles.two}><View style={styles.half}><InputField label="Category" placeholder="Work" value={task.category || ""} onChangeText={(value) => update("category", value)} /></View><View style={styles.half}><InputField label="Project" placeholder="Personal" value={task.project || ""} onChangeText={(value) => update("project", value)} /></View></View>
        <View style={styles.two}><View style={styles.half}><InputField label="Due date" placeholder="YYYY-MM-DD" value={task.dueDate ? String(task.dueDate).slice(0, 10) : ""} onChangeText={(value) => update("dueDate", value || null)} /></View><View style={styles.half}><InputField label="Time" placeholder="10:00 AM" value={task.time || ""} onChangeText={(value) => update("time", value)} /></View></View>
        <InputField label="Estimated time" placeholder="45 minutes" value={task.estimatedTime || ""} onChangeText={(value) => update("estimatedTime", value)} />
        <InputField label="Notes" placeholder="Anything else to remember?" value={task.notes || ""} onChangeText={(value) => update("notes", value)} multiline />
        <Card style={styles.subtasks}><Text style={styles.label}>Subtasks</Text><View style={styles.subtaskAdd}><View style={styles.subtaskInput}><InputField label="" placeholder="Add a subtask" value={subtaskTitle} onChangeText={setSubtaskTitle} /></View><Pressable onPress={addSubtask} style={styles.addButton}><Icon name="add" size={20} color={T.colors.text} /></Pressable></View>{(task.subtasks || []).map((item, index) => <View key={`${item.title}-${index}`} style={styles.subtaskLine}><Icon name="ellipse-outline" size={14} color={T.colors.primaryGlow} /><Text style={styles.subtaskText}>{item.title}</Text><Pressable onPress={() => update("subtasks", (task.subtasks || []).filter((_, position) => position !== index))}><Icon name="close" size={16} color={T.colors.muted} /></Pressable></View>)}</Card>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GradientButton label={editing ? "Save Changes" : "Create Task"} icon="checkmark" onPress={save} disabled={saving} />
        <SecondaryButton label="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </View>
  </ScreenContainer>;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ page: { flex: 1 }, topbar: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, topTitle: { color: T.colors.text, fontSize: 16, fontWeight: "800" }, scroll: { gap: 16, paddingBottom: 36 }, field: { gap: 8 }, label: { color: T.colors.text, fontSize: 12, fontWeight: "700" }, choices: { flexDirection: "row", gap: 8 }, choice: { flex: 1, borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.raisedSurface, borderRadius: 11, paddingVertical: 11, alignItems: "center" }, choiceActive: { borderColor: T.colors.primaryGlow, backgroundColor: `${T.colors.primary}35` }, choiceText: { color: T.colors.muted, fontSize: 11, fontWeight: "700" }, choiceTextActive: { color: T.colors.text }, two: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, subtasks: { gap: 12 }, subtaskAdd: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, subtaskInput: { flex: 1 }, addButton: { width: 46, height: 46, borderRadius: 12, backgroundColor: T.colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 1 }, subtaskLine: { flexDirection: "row", alignItems: "center", gap: 9 }, subtaskText: { color: T.colors.text, flex: 1, fontSize: 13 }, error: { color: T.colors.warning, fontSize: 13, lineHeight: 19 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, muted: { color: T.colors.muted },
});
