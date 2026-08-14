import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card, EmptyState, FilterTabs, FloatingActionButton, Icon, LoadingIndicator, ScreenHeader, StatusBadge } from "@/components/taskflow";
import { TaskFlowTheme as T } from "@/constants/theme";
import { getApiErrorMessage, listTasks, updateTaskFavorite, updateTaskStatus, type Task, type TaskStatus } from "@/lib/taskflow-auth";

const tabs = ["All", "In Progress", "Pending", "Completed"];
const statusForTab: Record<string, "all" | TaskStatus> = { All: "all", "In Progress": "in-progress", Pending: "pending", Completed: "completed" };

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"createdAt" | "dueDate" | "priority">("createdAt");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTasks(await listTasks({ status: statusForTab[activeTab], search, sort, order: sort === "createdAt" ? "desc" : "asc", favorite: favoritesOnly ? true : undefined })); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [activeTab, favoritesOnly, search, sort]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(task: Task) {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    try { const updated = await updateTaskStatus(task.id, nextStatus); setTasks((current) => current.map((item) => item.id === updated.id ? updated : item)); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  async function toggleFavorite(task: Task) {
    try { const updated = await updateTaskFavorite(task.id, !task.favorite); setTasks((current) => favoritesOnly ? current.filter((item) => item.id !== updated.id) : current.map((item) => item.id === updated.id ? updated : item)); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  return <ScreenContainer containerClassName="bg-background" className="px-4 pt-3">
    <View style={styles.page}>
      <ScreenHeader title="My Tasks" subtitle={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`} rightIcon="search-outline" />
      <View style={styles.searchWrap}><Icon name="search-outline" size={18} color={T.colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search tasks" placeholderTextColor={T.colors.muted} style={styles.searchInput} /></View>
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <View style={styles.controls}><Pressable onPress={() => setFavoritesOnly((value) => !value)} style={[styles.control, favoritesOnly && styles.controlActive]}><Icon name={favoritesOnly ? "star" : "star-outline"} size={15} color={favoritesOnly ? T.colors.warning : T.colors.muted} /><Text style={[styles.controlText, favoritesOnly && styles.controlTextActive]}>Favorites</Text></Pressable><Pressable onPress={() => setSort((value) => value === "createdAt" ? "dueDate" : value === "dueDate" ? "priority" : "createdAt")} style={styles.control}><Icon name="swap-vertical-outline" size={15} color={T.colors.muted} /><Text style={styles.controlText}>{sort === "createdAt" ? "Newest" : sort === "dueDate" ? "Due date" : "Priority"}</Text></Pressable></View>
      {error ? <Card style={styles.errorCard}><Text style={styles.error}>{error}</Text><Pressable onPress={load}><Text style={styles.retry}>Try again</Text></Pressable></Card> : null}
      {loading ? <LoadingIndicator label="Loading tasks" /> : <FlatList data={tasks} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<EmptyState title="No tasks found" message={favoritesOnly ? "Favorite a task to see it here." : "Create a task to start organizing your day."} action={<Pressable onPress={() => router.push("/task/form")}><Text style={styles.addLink}>Add task</Text></Pressable>} />} renderItem={({ item }) => <TaskRow task={item} onPress={() => router.push({ pathname: "/task/[id]", params: { id: item.id } })} onToggle={() => toggleStatus(item)} onFavorite={() => toggleFavorite(item)} />} />}
      <View style={styles.fabWrap}><FloatingActionButton onPress={() => router.push("/task/form")} /></View>
    </View>
  </ScreenContainer>;
}

function TaskRow({ task, onPress, onToggle, onFavorite }: { task: Task; onPress: () => void; onToggle: () => void; onFavorite: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <Pressable onPress={onToggle} hitSlop={8} style={[styles.checkbox, task.status === "completed" && styles.checkboxDone]}>{task.status === "completed" ? <Icon name="checkmark" size={15} color={T.colors.text} /> : null}</Pressable>
    <View style={styles.rowBody}><Text style={[styles.rowTitle, task.status === "completed" && styles.doneTitle]} numberOfLines={1}>{task.title}</Text><View style={styles.rowMeta}><StatusBadge status={task.status} /><Text style={styles.category}>{task.project} · {task.category}</Text></View></View>
    <View style={styles.rowActions}><Pressable onPress={onFavorite} hitSlop={8}><Icon name={task.favorite ? "star" : "star-outline"} size={18} color={task.favorite ? T.colors.warning : T.colors.muted} /></Pressable><Text style={styles.due}>{task.time || (task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date")}</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, searchWrap: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.raisedSurface, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9, marginBottom: 14 }, searchInput: { color: T.colors.text, flex: 1, fontSize: 13 }, controls: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 10 }, control: { flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.navySurface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }, controlActive: { borderColor: T.colors.warning, backgroundColor: `${T.colors.warning}18` }, controlText: { color: T.colors.muted, fontSize: 11, fontWeight: "600" }, controlTextActive: { color: T.colors.warning }, list: { gap: 8, paddingTop: 4, paddingBottom: 110, flexGrow: 1 }, row: { minHeight: 78, borderRadius: 14, borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.navySurface, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] }, checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: T.colors.secondary, alignItems: "center", justifyContent: "center" }, checkboxDone: { backgroundColor: T.colors.success, borderColor: T.colors.success }, rowBody: { flex: 1, gap: 7 }, rowTitle: { color: T.colors.text, fontSize: 13, fontWeight: "700" }, doneTitle: { textDecorationLine: "line-through", color: T.colors.muted }, rowMeta: { flexDirection: "row", alignItems: "center", gap: 7 }, category: { color: T.colors.muted, fontSize: 10, flexShrink: 1 }, rowActions: { alignItems: "flex-end", justifyContent: "space-between", alignSelf: "stretch" }, due: { color: T.colors.muted, fontSize: 10, marginTop: 7 }, fabWrap: { position: "absolute", right: 0, bottom: 18 }, errorCard: { marginTop: 12 }, error: { color: T.colors.warning, fontSize: 13 }, retry: { color: T.colors.primaryGlow, marginTop: 10, fontWeight: "700" }, addLink: { color: T.colors.primaryGlow, fontSize: 13, fontWeight: "700", marginTop: 10 },
});
