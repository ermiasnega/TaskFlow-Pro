import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card, EmptyState, FloatingActionButton, Icon, LoadingIndicator, ScreenHeader, StatusBadge, TaskCard } from "@/components/taskflow";
import { TaskFlowTheme as T } from "@/constants/theme";
import { getStoredUser, getTaskStats, type Task, type TaskStats } from "@/lib/taskflow-auth";

const emptyStats: TaskStats = { all: 0, completed: 0, inProgress: 0, pending: 0 };

export default function HomeScreen() {
  const [stats, setStats] = useState<TaskStats>(emptyStats);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [userName, setUserName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [summary, user] = await Promise.all([getTaskStats(), getStoredUser()]);
      setStats(summary.stats); setTodayTasks(summary.todayTasks); setUserName(user?.name?.split(" ")[0] || "there");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load your dashboard"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = [
    ["All Tasks", stats.all, "list-outline", T.colors.secondary],
    ["Completed", stats.completed, "checkmark-circle-outline", T.colors.success],
    ["In Progress", stats.inProgress, "time-outline", T.colors.warning],
    ["Pending", stats.pending, "ellipse-outline", T.colors.primaryGlow],
  ] as const;

  return <ScreenContainer containerClassName="bg-background" className="px-4 pt-3">
    <View style={styles.page}>
      <ScreenHeader title="TaskFlow" subtitle={`Hello, ${userName}!`} rightIcon="notifications-outline" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Let's get things done</Text>
        <Text style={styles.subheading}>Stay organized and boost your productivity.</Text>
        <Card style={styles.overview}>
          <View style={styles.overviewHeader}><Text style={styles.sectionTitle}>Tasks Overview</Text><Text style={styles.overviewPeriod}>Live from MongoDB</Text></View>
          {loading ? <View style={styles.loadingRow}><LoadingIndicator label="Loading statistics" /></View> : <View style={styles.metrics}>{metrics.map(([label, value, icon, color]) => <View key={label} style={styles.metric}><View style={styles.metricTop}><Text style={styles.metricLabel}>{label}</Text><Icon name={icon} size={18} color={color} /></View><Text style={styles.metricValue}>{value}</Text></View>)}</View>}
        </Card>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Today's Tasks</Text><Pressable onPress={() => router.push("/(tabs)/tasks")}><Text style={styles.viewAll}>View all</Text></Pressable></View>
        {error ? <Card><Text style={styles.error}>{error}</Text><Pressable onPress={load}><Text style={styles.retry}>Try again</Text></Pressable></Card> : todayTasks.length === 0 && !loading ? <EmptyState title="No tasks due today" message="Create a task and keep your day moving." action={<Pressable onPress={() => router.push("/task/form")}><Text style={styles.addLink}>Add your first task</Text></Pressable>} /> : <View style={styles.taskList}>{todayTasks.map((task) => <TaskCard key={task.id} title={task.title} status={task.status} time={task.time || (task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Today")} category={`${task.project} · ${task.category}`} onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })} />)}</View>}
      </ScrollView>
      <View style={styles.fabWrap}><FloatingActionButton onPress={() => router.push("/task/form")} /></View>
    </View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, scroll: { paddingBottom: 100 }, greeting: { color: T.colors.text, fontSize: 24, fontWeight: "800", marginTop: 3 }, subheading: { color: T.colors.muted, fontSize: 12, marginTop: 5, marginBottom: 18 }, overview: { backgroundColor: "#20204B", borderColor: "#3D3B8B", padding: 14, marginBottom: 22 }, overviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }, sectionTitle: { color: T.colors.text, fontSize: 15, fontWeight: "700" }, overviewPeriod: { color: T.colors.text, fontSize: 10, opacity: 0.8 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, metric: { width: "48%", backgroundColor: "#171A39AA", borderRadius: 11, padding: 10 }, metricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, metricLabel: { color: T.colors.muted, fontSize: 10 }, metricValue: { color: T.colors.text, fontSize: 20, fontWeight: "800", marginTop: 6 }, loadingRow: { minHeight: 130 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, viewAll: { color: T.colors.primaryGlow, fontSize: 11, fontWeight: "600" }, taskList: { gap: 8 }, fabWrap: { position: "absolute", right: 0, bottom: 18 }, error: { color: T.colors.warning, fontSize: 13, lineHeight: 19 }, retry: { color: T.colors.primaryGlow, fontWeight: "700", marginTop: 12 }, addLink: { color: T.colors.primaryGlow, fontWeight: "700", fontSize: 13, marginTop: 8 },
});
