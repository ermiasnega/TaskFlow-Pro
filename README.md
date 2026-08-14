# TaskFlow

TaskFlow is a production-oriented task management foundation built from the supplied mobile UI reference. Iteration 1 establishes the Expo navigation foundation, reusable mobile design system, Express/Mongoose backend structure, and React/Vite admin shell.

## Repository Structure

| Directory | Purpose |
|---|---|
| `Mobile/` | Expo mobile application, navigation, assets, and reusable TaskFlow design system. |
| `Backend/` | Express + TypeScript API foundation, server internals, Mongoose model, JWT guard, bcrypt helper, and starter routes. |
| `Admin/` | React + Vite dashboard foundation with TaskFlow styling and Recharts dependency. |

The repository root contains only project metadata and the three application workspaces. The only top-level application folders are `Admin/`, `Backend/`, and `Mobile/`; lowercase duplicates and template application folders have been removed. Hidden tooling directories created by the local development environment are not application folders.

## Run Commands

From the repository root, `pnpm dev` runs the managed Expo web preview and the existing project server. `pnpm dev:backend` runs the Express API on port 4000, and `pnpm dev:admin` runs the Vite admin dashboard on port 5173. Inside `Admin/`, `pnpm build` creates the production dashboard bundle. Inside `Backend/`, `pnpm build` compiles the API to `dist/`.

For native mobile testing, use `pnpm ios` or `pnpm android` from the root when the corresponding simulator or device is available. The relocated Expo project is contained in `Mobile/` and is typechecked with `pnpm check` from the root.

## Design System

The shared `TaskFlowTheme` centralizes the midnight background, navy and raised surfaces, purple gradient action colors, blue secondary accent, green completed state, orange pending state, typography scale, spacing, radii, and shadows. `Mobile/components/taskflow.tsx` provides reusable buttons, cards, task cards, status badges, input fields, filter tabs, headers, floating action buttons, bottom navigation, loading indicators, empty states, modals, and icons.

## Configuration Still Required

The Backend accepts `MONGODB_URI`, `JWT_SECRET`, and SMTP configuration through its environment; no database is connected unless `MONGODB_URI` is supplied. The Expo app configuration, assets, routes, and reusable TaskFlow components live under `Mobile/`. The Admin dashboard lives under `Admin/`, and the current task APIs and task-management screens are documented below.

## Verification Scope

The three workspaces are typechecked independently: `Mobile/`, `Backend/`, and `Admin/`. Authentication, production email OTP recovery, MongoDB-backed task CRUD, live dashboard statistics, task filtering, task details, and add/edit/delete/complete flows are implemented.

## GitHub

The project is maintained at [github.com/ermiasnega/TaskFlow-Pro](https://github.com/ermiasnega/TaskFlow-Pro). The intended application layout is:

```text
TaskFlow-Pro/
├── Admin/
├── Backend/
├── Mobile/
├── README.md
├── .gitignore
└── package.json
```

## Iteration 2 Authentication

The Mobile workspace includes the branded splash/loading state, welcome onboarding, login, registration, forgot-password, reset-password with real email OTP, automatic session restoration, protected tab navigation, and logout. Sessions use SecureStore on native platforms and localStorage on web. All authentication requests use Axios against the real Backend API.

The Backend workspace exposes `POST /api/auth/register`, `POST /api/auth/login`, production email OTP reset endpoints, and protected `GET /api/auth/me`. User passwords are hashed with bcrypt, access tokens use JWT, and user records are stored with Mongoose in MongoDB.

Configure `MONGODB_URI`, the built-in `JWT_SECRET`, and `EXPO_PUBLIC_API_URL` through the project’s secure environment settings. Do not commit Atlas credentials or `.env` files. Run the Backend directly with `./Backend/node_modules/.bin/tsx Backend/src/server.ts`, run Mobile checks with `./node_modules/.bin/tsc --noEmit -p Mobile/tsconfig.json`, and run the end-to-end auth verification with `./Backend/node_modules/.bin/tsx Backend/tests/auth.smoke.ts`.

## Production password reset with email OTP

Password recovery now uses a real six-digit one-time password delivered by the Backend through the configured SMTP mailbox. The OTP is stored only as a SHA-256 hash, expires after 10 minutes, and is cleared immediately after successful verification. The verification endpoint returns a short-lived, hashed reset credential; the password endpoint accepts only that verified credential, so an email address or unverified token cannot reset a password.

Configure these server-side environment variables in the Backend deployment. Do not commit them to GitHub or expose them in the Mobile bundle.

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP provider hostname, such as `smtp.gmail.com` |
| `SMTP_PORT` | Secure SMTP port, normally `465` or STARTTLS port `587` |
| `SMTP_USER` | Production sender mailbox username |
| `SMTP_PASSWORD` | SMTP password or provider App Password |
| `SMTP_FROM_EMAIL` | Verified From address used by TaskFlow messages |

For the production mailbox `ermiasnega4@gmail.com`, Gmail requires an App Password when two-step verification is enabled. The regular mailbox password should not be used as an application credential.

The Mobile client calls `POST /api/auth/forgot-password` with the email address. The Backend sends the OTP without revealing whether the account exists. The client then calls `POST /api/auth/verify-reset-otp` with the email and six-digit code. After successful verification, it calls `POST /api/auth/reset-password` with the returned reset credential and the new password. Invalid, expired, reused, or unverified values are rejected.

Run `pnpm exec vitest Backend/tests/smtp.secret.test.ts --run` to authenticate the configured SMTP mailbox. Run `pnpm exec tsc --noEmit -p Backend/tsconfig.json` and `pnpm exec tsc --noEmit -p Mobile/tsconfig.json` to check both workspaces. The end-to-end smoke script is `pnpm exec tsx Backend/tests/auth.smoke.ts`; it requires the running Backend and MongoDB environment variables.

## Iteration 3: Home Dashboard and Core Task Management

The Mobile workspace now contains a live Home dashboard and Tasks experience backed by MongoDB. Dashboard statistics and today’s tasks are loaded from `GET /api/tasks/stats`; the overview never uses the reference image’s example numbers. The Home greeting uses the authenticated user’s stored name, and the existing dark navy, purple, blue, green, and orange TaskFlow design system remains unchanged.

The Backend Task model stores the authenticated owner, title, description, status, priority, category, project, due date, time, estimated time, favorite state, notes, subtasks, timestamps, and `completedAt`. All task routes are ownership-safe and require the JWT bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List the signed-in user’s tasks with status, search, favorite, sorting, and order query parameters. |
| `GET` | `/api/tasks/stats` | Return live all/completed/in-progress/pending counts and today’s tasks. |
| `GET` | `/api/tasks/:id` | Read one owned task. |
| `POST` | `/api/tasks` | Create a task in MongoDB. |
| `PUT` | `/api/tasks/:id` | Update task fields and subtasks. |
| `DELETE` | `/api/tasks/:id` | Delete an owned task. |
| `PATCH` | `/api/tasks/:id/status` | Complete or reopen a task and maintain `completedAt`. |
| `PATCH` | `/api/tasks/:id/favorite` | Toggle the favorite state. |

Mobile routes include the Home dashboard, live Tasks list, `/task/[id]` details screen, and `/task/form` add/edit form. The list supports All, In Progress, Pending, Completed, search, favorites-only filtering, sorting, completion checkboxes, and navigation to details. Details support edit, delete, complete/reopen, favorite, and subtask completion. Add and edit forms persist real values to MongoDB.

Verification includes `pnpm exec tsc --noEmit -p Backend/tsconfig.json`, `pnpm exec tsc --noEmit -p Mobile/tsconfig.json`, and `pnpm exec tsx Backend/tests/tasks.smoke.ts`. The smoke test creates a temporary user and task, verifies create/list/detail/update/favorite/complete/stats/delete, and removes its test user afterward.


## Iteration 4: Calendar, Categories, Search, and Reminders

TaskFlow now includes MongoDB-backed productivity management features without changing the existing authentication, email OTP, or task CRUD flows. The Calendar tab supports month navigation, selected dates, and date-specific tasks loaded from `GET /api/tasks/calendar?date=YYYY-MM-DD`. Each agenda item shows its saved time, status, and category and can open the existing task detail screen.

Categories are user-owned MongoDB records. The Backend creates the default `Work`, `Personal`, `Study`, `Health`, `Finance`, and `Other` categories on first load, supports create/rename/delete operations, stores a color and icon, and returns live task counts. Category APIs are `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, and `DELETE /api/categories/:id`.

The Search screen queries tasks, projects, and categories through `GET /api/search?q=...`. Recent searches are stored locally on the device with a clear-history action; search results themselves always come from the authenticated Backend and MongoDB.

Reminders are stored in MongoDB with `userId`, `taskId`, `reminderTime`, `recurrence`, `enabled`, and timestamps. The authenticated API exposes `GET /api/reminders`, `POST /api/reminders`, `PUT /api/reminders/:id`, and `DELETE /api/reminders/:id`. The Mobile Reminders screen supports task selection, one-time/daily/weekly/monthly recurrence, editing, deletion, and enable/disable. When supported, Expo local notifications are scheduled after permission is granted and cancelled when reminders are disabled or deleted. Web preview does not schedule native notifications; use a physical device or development build for notification validation.

Iteration 4 verification uses `./Backend/node_modules/.bin/tsc --noEmit -p Backend/tsconfig.json`, `./node_modules/.bin/tsc --noEmit -p Mobile/tsconfig.json`, `pnpm --dir Admin run check`, and `./Backend/node_modules/.bin/tsx Backend/tests/productivity.smoke.ts`. The smoke test verifies the calendar query, default categories, category CRUD, cross-domain search, and full reminder CRUD using temporary authenticated MongoDB data.


## Iteration 5: Analytics and Focus Timer

TaskFlow now calculates analytics from authenticated MongoDB activity rather than placeholder values. The Analytics tab supports Week, Month, Year, and Custom date ranges and displays actual completed, in-progress, pending, total, completion percentage, tasks created, focus time, productivity change, productivity-over-time points, and category distribution. The Backend endpoints are `GET /api/analytics/overview`, `GET /api/analytics/productivity`, `GET /api/analytics/categories`, and `GET /api/analytics/focus-time`.

Focus sessions are stored in the MongoDB `FocusSession` model with user ownership, duration, completion state, start time, and completion time. The Focus Timer provides 25-minute focus sessions, 5-minute short breaks, 15-minute long breaks, start/pause/resume/reset/skip controls, completed-session counts, today’s focus time, and total focus time. A long break is recommended after every four completed focus sessions. Completed sessions are persisted through `GET /api/focus/sessions` and `POST /api/focus/sessions` and are included in the Analytics aggregations.

Iteration 5 verification uses the strict Backend, Mobile, and Admin TypeScript checks plus `./Backend/node_modules/.bin/tsx Backend/tests/analytics.smoke.ts`. The smoke test creates real authenticated MongoDB activity, verifies every analytics endpoint and focus-session persistence, and removes its temporary task afterward.


## Iteration 6: Profile, Settings, and Mobile Polish

TaskFlow now includes authenticated profile management through `GET /api/users/profile` and `PUT /api/users/profile`, including avatar URL, display name, notification preferences, appearance, focus mode, default view, language, and backup/sync preferences. Password changes use `PUT /api/users/password`, require the current password, validate the new password confirmation, and hash the replacement with bcrypt.

The Mobile Profile screen displays the real user identity, avatar or initials, MongoDB-backed task counts, completed-task productivity, and total focus minutes. It provides edit-profile, avatar, change-password, settings, and logout actions. The Settings screen persists task reminders, daily summary, focus notifications, productivity notifications, focus mode, default view, and backup/sync controls, with privacy and About TaskFlow information states.

Iteration 6 polish includes safe-area-aware layouts, keyboard avoidance for profile and task forms, scrollable small-screen content, loading and retry states, API error feedback, disabled saving controls, Android-compatible switch and keyboard behavior, and the reference-matched dark bottom navigation. Verification uses strict Backend, Mobile, and Admin checks, the three-folder structure validation, and `./Backend/node_modules/.bin/tsx Backend/tests/profile.smoke.ts`.


## Iteration 7: React Admin Dashboard

TaskFlow now includes a separate desktop React/Vite administration workspace under `Admin/`. It is not a copy of the Mobile UI: it uses a fixed sidebar, top search/navigation bar, dense data tables, workspace metric cards, responsive desktop charts, and the shared dark navy, purple, blue, green, and orange TaskFlow design system. The login entry is available at `/admin/login` when the Admin workspace is served with its Vite fallback.

Admin access is protected by the existing JWT authentication plus a Backend `requireAdmin` middleware. Only users whose persisted `role` is `admin` can access `/api/admin/*`; regular users receive HTTP 403. Disabled users are blocked from normal login, while administrators can enable, disable, promote, demote, or delete accounts. Deleting a user cascades their owned tasks, categories, reminders, and focus sessions.

The live Admin workspace provides Dashboard, Users, Tasks, Categories, Analytics, Notifications, and Settings sections. Dashboard metrics and charts aggregate MongoDB users, tasks, categories, and completed focus sessions. Users and Tasks support search, filters, pagination, role/status actions, and destructive-action confirmation. Categories support live list, task counts, create, rename, and delete operations. Notifications and Settings expose real workspace preference distributions.

Iteration 7 verification uses strict Backend and Admin checks, an Admin production build, the exact `Admin/`, `Backend/`, `Mobile/` structure validation, and `./Backend/node_modules/.bin/tsx Backend/tests/admin.smoke.ts`, which covers non-admin denial, dashboard metrics, user search/pagination, cross-user task administration, categories, notifications, settings, and disabled-account login protection.

## Iteration 8: Advanced Admin Features

The Admin workspace now includes a live advanced analytics page at `GET /api/admin/analytics`, supporting week, month, year, and custom date ranges. It reports daily, weekly, and monthly active users, tasks created and completed, completion rate, focus time, most-used categories, most-active users, and productivity trend series. The Admin UI includes filter controls, interactive Recharts visualizations with tooltips, loading states, empty states, and TaskFlow-styled data panels.

Administrators can manage broadcast notifications through `GET|POST /api/admin/notifications/manage`, `POST /api/admin/notifications/manage/:id/send`, and `DELETE /api/admin/notifications/manage/:id`. Draft and sent status, audience, target counts, delivered counts, failed counts, and timestamps are persisted in MongoDB. Global system settings are stored through `GET|PUT /api/admin/system-settings`, covering application settings, default task settings, category policy, notification configuration, and user permissions.

Every existing and new `/api/admin/*` endpoint is protected by JWT authentication and the `role === "admin"` guard. Iteration 8 verification uses `./Backend/node_modules/.bin/tsx Backend/tests/admin.iteration8.smoke.ts`; it explicitly confirms unauthenticated requests return 401, normal users return 403 for every Admin endpoint group, and administrators can complete analytics, notification create/send/list/delete, and system-settings read/update flows.

The Admin notification history now supports server-side search and filtering through `GET /api/admin/notifications/manage?search=...&status=draft|sent&audience=all|admins|users&page=1&limit=10`. The API returns matching records plus `pagination` metadata with the current page, bounded page size, total result count, and total pages. The Admin interface provides a title/message search field, status and audience filters, total-result counts, and previous/next pagination controls while preserving notification creation, sending, delivery status, and deletion.

The notification list limits each request to a maximum of 50 records to keep the interface responsive on large histories. The smoke test creates temporary records and verifies search matching, combined status/audience filtering, page-size enforcement, and multi-page results before cleaning up the test data.
