import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, Icon, ScreenHeader } from "@/components/taskflow";
import { TaskFlowTheme as T } from "@/constants/theme";
import { useTaskFlowAuth } from "@/lib/taskflow-auth-context";

const rows = [["color-palette-outline", "Appearance", "Dark"], ["notifications-outline", "Notifications", ""], ["timer-outline", "Focus Mode", ""], ["list-outline", "Default View", "List"], ["language-outline", "Language", "English"], ["cloud-outline", "Backup & Sync", ""], ["shield-checkmark-outline", "Privacy & Security", ""], ["information-circle-outline", "About TaskFlow", "v1.0.0"]] as const;

export default function ProfileScreen() {
  const { user, logout, loading } = useTaskFlowAuth();
  const initial = user?.name?.charAt(0).toUpperCase() ?? "T";

  async function handleLogout() {
    await logout();
    router.replace("/(auth)");
  }

  return <ScreenContainer className="px-4 pt-3"><View style={styles.page}><ScreenHeader title="Settings" leftIcon="menu-outline" rightIcon="settings-outline" /><Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View><View><Text style={styles.name}>{user?.name ?? "TaskFlow user"}</Text><Text style={styles.email}>{user?.email ?? "Your productivity workspace"}</Text></View></Card><View style={styles.list}>{rows.map(([icon, label, detail]) => <View key={label} style={styles.row}><Icon name={icon as any} size={18} color={T.colors.muted} /><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowDetail}>{detail}</Text><Icon name="chevron-forward" size={16} color={T.colors.muted} /></View>)}</View><Pressable disabled={loading} onPress={handleLogout} style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}><Text style={styles.logoutText}>{loading ? "Signing out…" : "Log out"}</Text></Pressable></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, profile: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 15 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.colors.primary, alignItems: "center", justifyContent: "center" }, avatarText: { color: T.colors.text, fontSize: 20, fontWeight: "800" }, name: { color: T.colors.text, fontSize: 15, fontWeight: "700" }, email: { color: T.colors.muted, fontSize: 11, marginTop: 4 }, list: { backgroundColor: T.colors.navySurface, borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.colors.border, paddingHorizontal: 14 }, row: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: T.colors.divider }, rowLabel: { color: T.colors.text, fontSize: 12, flex: 1 }, rowDetail: { color: T.colors.muted, fontSize: 11 }, logout: { marginTop: 22, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#6C2A4A", alignItems: "center", justifyContent: "center" }, logoutPressed: { opacity: 0.7 }, logoutText: { color: "#FF8D9B", fontSize: 14, fontWeight: "800" } });
