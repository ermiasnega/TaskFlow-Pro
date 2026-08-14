import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TaskFlowTheme as T } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 20, color = T.colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function GradientButton({ label, onPress, icon, disabled = false }: { label: string; onPress?: () => void; icon?: IconName; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed, disabled && styles.disabled]}>
    <LinearGradient colors={[T.colors.primaryGlow, T.colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
      {icon && <Icon name={icon} size={17} color={T.colors.text} />}
      <Text style={styles.buttonLabel}>{label}</Text>
    </LinearGradient>
  </Pressable>;
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress?: () => void; icon?: IconName }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
    {icon && <Icon name={icon} size={16} color={T.colors.secondary} />}
    <Text style={styles.secondaryLabel}>{label}</Text>
  </Pressable>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export type TaskStatus = 'completed' | 'pending' | 'in-progress';
export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = { completed: ['Completed', T.colors.success], pending: ['Pending', T.colors.warning], 'in-progress': ['In Progress', T.colors.secondary] } as const;
  const [label, color] = config[status];
  return <View style={[styles.badge, { backgroundColor: `${color}22` }]}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.badgeText, { color }]}>{label}</Text></View>;
}

export function TaskCard({ title, status, time, category, onPress }: { title: string; status: TaskStatus; time: string; category: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
    <View style={[styles.taskRail, { backgroundColor: status === 'completed' ? T.colors.success : status === 'pending' ? T.colors.warning : T.colors.secondary }]} />
    <View style={styles.taskCopy}><Text style={styles.taskTitle}>{title}</Text><StatusBadge status={status} /><Text style={styles.taskCategory}>{category}</Text></View>
    <View style={styles.taskMeta}><Text style={styles.taskTime}>{time}</Text><Icon name="star-outline" size={16} color={T.colors.muted} /></View>
  </Pressable>;
}

export function InputField({ label, placeholder, value, onChangeText, multiline = false }: { label: string; placeholder: string; value?: string; onChangeText?: (value: string) => void; multiline?: boolean }) {
  return <View style={styles.inputWrap}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={T.colors.muted} multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}

export function FilterTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange?: (tab: string) => void }) {
  return <View style={styles.tabs}>{tabs.map((tab) => <Pressable key={tab} onPress={() => onChange?.(tab)} style={[styles.tab, active === tab && styles.activeTab]}><Text style={[styles.tabText, active === tab && styles.activeTabText]}>{tab}</Text></Pressable>)}</View>;
}

export function ScreenHeader({ title, subtitle, leftIcon = 'menu-outline', rightIcon = 'notifications-outline', onRightPress }: { title: string; subtitle?: string; leftIcon?: IconName; rightIcon?: IconName; onRightPress?: () => void }) {
  return <View style={styles.header}><View style={styles.headerLeft}><Icon name={leftIcon} size={22} color={T.colors.text} /><View><Text style={styles.headerTitle}>{title}</Text>{subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}</View></View><Pressable onPress={onRightPress} style={styles.iconButton}><Icon name={rightIcon} size={20} color={T.colors.text} /></Pressable></View>;
}

export function FloatingActionButton({ onPress }: { onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}><LinearGradient colors={[T.colors.primaryGlow, T.colors.primary]} style={styles.fabGradient}><Icon name="add" size={26} color={T.colors.text} /></LinearGradient></Pressable>;
}

export function BottomNavigation({ active = 'Home', onChange }: { active?: string; onChange?: (label: string) => void }) {
  const items: { label: string; icon: IconName }[] = [{ label: 'Home', icon: 'home-outline' }, { label: 'Tasks', icon: 'list-outline' }, { label: 'Calendar', icon: 'calendar-outline' }, { label: 'Analytics', icon: 'bar-chart-outline' }, { label: 'Profile', icon: 'person-outline' }];
  return <View style={styles.bottomNav}>{items.map((item) => <Pressable key={item.label} onPress={() => onChange?.(item.label)} style={styles.navItem}><Icon name={item.icon} size={20} color={active === item.label ? T.colors.primaryGlow : T.colors.muted} /><Text style={[styles.navText, active === item.label && styles.navTextActive]}>{item.label}</Text></Pressable>)}</View>;
}

export function LoadingIndicator({ label = 'Loading' }: { label?: string }) { return <View style={styles.centerState}><ActivityIndicator color={T.colors.primaryGlow} /><Text style={styles.mutedText}>{label}</Text></View>; }
export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) { return <View style={styles.centerState}><View style={styles.emptyIcon}><Icon name="checkmark-done-outline" size={28} color={T.colors.primaryGlow} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.mutedText}>{message}</Text>{action}</View>; }
export function TaskModal({ visible, onClose, children }: PropsWithChildren<{ visible: boolean; onClose: () => void }>) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHandle} />{children}<SecondaryButton label="Close" onPress={onClose} /></View></View></Modal>; }

const styles = StyleSheet.create({
  pressable: { borderRadius: T.radius.md, overflow: 'hidden' }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.45 }, gradientButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: T.radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonLabel: { color: T.colors.text, fontSize: 14, fontWeight: '700' }, secondaryButton: { minHeight: 44, borderRadius: T.radius.md, borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.raisedSurface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryLabel: { color: T.colors.text, fontSize: 13, fontWeight: '600' }, card: { backgroundColor: T.colors.navySurface, borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.colors.border, padding: 16, ...T.shadows.card }, badge: { alignSelf: 'flex-start', borderRadius: T.radius.pill, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 }, dot: { width: 6, height: 6, borderRadius: 3 }, badgeText: { fontSize: 10, fontWeight: '700' }, taskCard: { backgroundColor: T.colors.navySurface, borderRadius: T.radius.md, borderWidth: 1, borderColor: T.colors.border, padding: 12, flexDirection: 'row', minHeight: 76, overflow: 'hidden' }, taskRail: { width: 3, borderRadius: 2, marginRight: 11 }, taskCopy: { flex: 1, gap: 6 }, taskTitle: { color: T.colors.text, fontSize: 13, fontWeight: '600' }, taskCategory: { color: T.colors.muted, fontSize: 10 }, taskMeta: { alignItems: 'flex-end', justifyContent: 'space-between' }, taskTime: { color: T.colors.muted, fontSize: 10 }, inputWrap: { gap: 7 }, inputLabel: { color: T.colors.text, fontSize: 12, fontWeight: '600' }, input: { backgroundColor: T.colors.raisedSurface, borderWidth: 1, borderColor: T.colors.border, borderRadius: T.radius.md, color: T.colors.text, minHeight: 46, paddingHorizontal: 13, fontSize: 13 }, multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }, tabs: { flexDirection: 'row', backgroundColor: T.colors.navySurface, borderRadius: T.radius.md, padding: 4, gap: 4 }, tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' }, activeTab: { backgroundColor: T.colors.primary }, tabText: { color: T.colors.muted, fontSize: 10, fontWeight: '600' }, activeTabText: { color: T.colors.text }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }, headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerTitle: { color: T.colors.text, fontSize: 16, fontWeight: '700' }, headerSubtitle: { color: T.colors.muted, fontSize: 11, marginTop: 2 }, iconButton: { padding: 8 }, fab: { width: 54, height: 54, borderRadius: 27, ...T.shadows.glow, overflow: 'hidden' }, fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' }, bottomNav: { height: 72, backgroundColor: T.colors.navySurface, borderTopWidth: 1, borderTopColor: T.colors.border, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 }, navItem: { alignItems: 'center', gap: 4, minWidth: 52 }, navText: { color: T.colors.muted, fontSize: 9 }, navTextActive: { color: T.colors.primaryGlow, fontWeight: '700' }, centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 }, mutedText: { color: T.colors.muted, fontSize: 12, textAlign: 'center' }, emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: `${T.colors.primary}22` }, emptyTitle: { color: T.colors.text, fontSize: 16, fontWeight: '700' }, modalBackdrop: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }, modalCard: { backgroundColor: T.colors.navySurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: T.colors.border, padding: 20, gap: 16 }, modalHandle: { width: 40, height: 4, backgroundColor: T.colors.border, borderRadius: 2, alignSelf: 'center' },
});
