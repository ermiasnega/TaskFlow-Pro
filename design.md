# TaskFlow Mobile Interface Design

## Visual Source of Truth

The supplied TaskFlow reference image is the sole visual source for Iteration 1. The implementation preserves its dark navy-black canvas, violet primary actions, electric blue secondary accents, compact information density, rounded cards, thin borders, soft purple glows, bottom navigation, and mobile portrait-first composition.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Home | Greeting header, task overview card, four compact summary metrics, today’s task list, and floating add button. |
| All Tasks | Filter tabs for All, In Progress, Pending, and Completed; reusable task cards; search/filter affordances. |
| Task Details | Task title, status badge, metadata rows, subtasks, and primary completion action. |
| Add Task | Compact form for title, description, project, category, priority, due date, time, estimated time, and calendar toggle. |
| Calendar | Month grid, selected date treatment, and agenda list with colored task rails. |
| Analytics | Segmented period control, KPI cards, productivity trend chart placeholder, and completion summary. |
| Categories | Category list with icon tiles, task counts, percentages, and add affordance. |
| Focus Timer | Timer/stats tabs, Pomodoro selector, circular timer, play action, and session metrics. |
| Reminders | Upcoming/completed tabs, grouped reminder cards, and add affordance. |
| Search | Search field, filter tabs, recent searches, and task results. |
| Settings | Preference rows for appearance, notifications, focus mode, default view, language, sync, privacy, and about. |
| Welcome | Illustration area, TaskFlow brand lockup, short value statement, pagination dots, and Get Started action. |

## Key User Flows

1. User opens Home → reviews overview metrics → taps a task card → reaches Task Details.
2. User taps the floating add button → opens Add Task → completes the compact form → saves and returns to the task list.
3. User opens All Tasks → switches a status tab → reviews filtered task cards.
4. User opens Task Details → reviews subtasks → taps Mark as Completed → status changes to completed.
5. User opens Calendar → selects a date → reviews the agenda list for that date.

## Layout Rules

All screens target portrait mobile dimensions and one-handed use. Content uses safe-area-aware top spacing, 16px horizontal gutters, compact vertical rhythm, and a persistent five-item bottom navigation. Primary actions sit within thumb reach. Cards use 16–20px corner radii, 1px subtle borders, and restrained shadow/glow treatment. Floating action buttons are circular, violet, and anchored above the bottom navigation.

## Color Choices

| Token | Value | Usage |
|---|---|---|
| Midnight | `#070B16` | Main screen background |
| Navy Surface | `#0D1424` | Cards and bottom navigation |
| Raised Surface | `#121B2E` | Inputs, elevated rows, modal surfaces |
| Purple | `#7448FF` | Primary action, active tab, highlights |
| Purple Glow | `#9A6BFF` | Gradient endpoint and focused edges |
| Blue | `#4B8DFF` | Secondary accent and in-progress states |
| Green | `#3DDB82` | Completed state |
| Orange | `#F4A340` | Pending state |
| Red | `#FF5F72` | High priority and destructive state |
| White | `#F7F8FC` | Primary text |
| Muted | `#8D98AE` | Supporting text |
| Border | `#202B42` | Card and input outlines |

## Typography

Use the platform system sans-serif with a modern iOS-like hierarchy: 28–32px bold greeting/title text, 18px semibold section titles, 14–16px body text, and 10–12px compact metadata. Primary text is bright white; supporting copy uses muted blue-gray. Labels are short and information-dense.
