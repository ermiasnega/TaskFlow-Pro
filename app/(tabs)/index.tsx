import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card, FloatingActionButton, Icon, ScreenHeader, StatusBadge, TaskCard } from '@/components/taskflow';
import { TaskFlowTheme as T } from '@/constants/theme';

const tasks = [
  { title: 'Design new landing page', status: 'in-progress' as const, time: '10:00 AM', category: 'Work  ·  UI/UX' },
  { title: 'Fix navigation bug', status: 'completed' as const, time: '08:30 AM', category: 'Work  ·  Development' },
  { title: 'Prepare UI/UX case study', status: 'pending' as const, time: '02:00 PM', category: 'Work  ·  Design' },
  { title: 'Read Chapter 4 — Clean Code', status: 'pending' as const, time: '04:00 PM', category: 'Personal' },
];

export default function HomeScreen() {
  return <ScreenContainer containerClassName="bg-background" className="px-4 pt-3">
    <View style={styles.page}><ScreenHeader title="TaskFlow" subtitle="Hello, Ermiya!" rightIcon="notifications-outline" />
      <Text style={styles.greeting}>Let's get things done</Text><Text style={styles.subheading}>Stay organized and boost your productivity.</Text>
      <Card style={styles.overview}><View style={styles.overviewHeader}><Text style={styles.sectionTitle}>Tasks Overview</Text><Text style={styles.overviewPeriod}>This Week  ˅</Text></View><View style={styles.metrics}>{[['All Tasks','24', 'list-outline', T.colors.secondary], ['Completed','16','checkmark-circle-outline',T.colors.success], ['In Progress','5','time-outline',T.colors.warning], ['Pending','3','ellipse-outline',T.colors.primaryGlow]].map(([label, value, icon, color]) => <View key={label} style={styles.metric}><View style={styles.metricTop}><Text style={styles.metricLabel}>{label}</Text><Icon name={icon as any} size={18} color={color as string} /></View><Text style={styles.metricValue}>{value}</Text></View>)}</View></Card>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Today's Tasks</Text><Text style={styles.viewAll}>View all</Text></View>
      <ScrollView contentContainerStyle={styles.taskList} showsVerticalScrollIndicator={false}>{tasks.map((task) => <TaskCard key={task.title} {...task} />)}</ScrollView>
      <View style={styles.fabWrap}><FloatingActionButton /></View>
    </View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, greeting: { color: T.colors.text, fontSize: 24, fontWeight: '800', marginTop: 3 }, subheading: { color: T.colors.muted, fontSize: 12, marginTop: 5, marginBottom: 18 }, overview: { backgroundColor: '#20204B', borderColor: '#3D3B8B', padding: 14, marginBottom: 22 }, overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, sectionTitle: { color: T.colors.text, fontSize: 15, fontWeight: '700' }, overviewPeriod: { color: T.colors.text, fontSize: 10, opacity: 0.8 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48%', backgroundColor: '#171A39AA', borderRadius: 11, padding: 10 }, metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, metricLabel: { color: T.colors.muted, fontSize: 10 }, metricValue: { color: T.colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 }, sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, viewAll: { color: T.colors.primaryGlow, fontSize: 11, fontWeight: '600' }, taskList: { gap: 8, paddingBottom: 90 }, fabWrap: { position: 'absolute', right: 0, bottom: 18 } });
