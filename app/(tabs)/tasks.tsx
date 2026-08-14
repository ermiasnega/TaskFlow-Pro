import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card, FilterTabs, FloatingActionButton, ScreenHeader, TaskCard } from '@/components/taskflow';
import { TaskFlowTheme as T } from '@/constants/theme';

export default function TasksScreen() {
  return <ScreenContainer className="px-4 pt-3"><View style={styles.page}><ScreenHeader title="All Tasks" leftIcon="menu-outline" rightIcon="search-outline" /><FilterTabs tabs={['All', 'In Progress', 'Pending', 'Completed']} active="All" /><Card style={styles.summary}><Text style={styles.summaryTitle}>24 tasks in your workspace</Text><Text style={styles.summaryText}>Keep momentum by completing one focused task at a time.</Text></Card><ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}><TaskCard title="Design new landing page" status="in-progress" time="10:00 AM" category="Work  ·  UI/UX" /><TaskCard title="Fix navigation bug" status="completed" time="08:30 AM" category="Work  ·  Development" /><TaskCard title="Prepare UI/UX case study" status="pending" time="02:00 PM" category="Work  ·  Design" /><TaskCard title="Workout — 45 minutes" status="in-progress" time="06:30 PM" category="Personal" /></ScrollView><View style={styles.fab}><FloatingActionButton /></View></View></ScreenContainer>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, summary: { marginTop: 16, marginBottom: 14, padding: 14 }, summaryTitle: { color: T.colors.text, fontSize: 14, fontWeight: '700' }, summaryText: { color: T.colors.muted, fontSize: 11, marginTop: 5 }, list: { gap: 9, paddingBottom: 90 }, fab: { position: 'absolute', right: 0, bottom: 18 } });
