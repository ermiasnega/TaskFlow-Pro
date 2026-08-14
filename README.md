# TaskFlow

## Project overview

TaskFlow is a full-stack productivity and task-management system built around the supplied dark TaskFlow mobile reference. It combines a production-oriented Expo mobile client, an Express and MongoDB API, and a separate React/Vite desktop Admin Console. The application supports authenticated task workflows, calendar planning, reminders, analytics, focus sessions, user preferences, and role-protected administration.

> **Repository convention:** The working repository intentionally preserves the established uppercase application folders `Admin/`, `Backend/`, and `Mobile/`. They are the three application workspaces requested throughout the project history; no duplicate lowercase application folders are required.

## Features

| Area | Implemented capabilities |
|---|---|
| Authentication | Registration, login, logout/session persistence, protected routes, JWT verification, bcrypt hashing, password-reset email OTP, OTP resend flow, password change, and disabled-account protection. |
| Task management | MongoDB-backed task CRUD, statuses, priorities, favorites, search, filters, sorting, due dates, notes, projects, categories, completion timestamps, and subtasks. |
| Productivity | Monthly calendar, date-specific task retrieval, categories with colors/icons and counts, reminders with recurrence, search across tasks/projects/categories, Expo notifications where supported, and Pomodoro focus sessions. |
| Analytics | Live MongoDB aggregation for completion metrics, productivity trends, category distribution, focus time, custom date ranges, and Admin-wide activity analytics. |
| Profile and settings | Profile editing, avatar, password change, notification preferences, appearance, focus mode, default view, language, backup/sync preference, privacy, and About information. |
| Admin Console | Desktop-only Admin login, JWT plus `role === "admin"` protection, dashboard metrics, users, tasks, categories, advanced analytics, notification management, system settings, search, filters, pagination, delivery status, and safeguards. |
| Production hardening | Explicit CORS allowlist, API and authentication rate limits, input validation with Zod, ownership checks, secret-pattern verification, smoke tests, and production build checks. |

## Screens

### Mobile screens

The Mobile workspace contains the splash and onboarding experience, login, registration, forgot-password and OTP reset flow, Home dashboard, All Tasks, Task Details, Add/Edit Task, Calendar, Categories, Search, Reminders, Analytics, Focus Timer, Profile, and Settings. The visual language follows the reference: dark navy surfaces, purple primary actions, blue secondary accents, green completed states, orange pending states, rounded cards, subtle borders, compact spacing, glowing highlights, floating add buttons, and bottom navigation.

### Admin screens

The Admin workspace contains `/login` and a protected desktop console with Dashboard, Users, Tasks, Categories, Analytics, Notifications, and Settings areas. The Admin UI is intentionally a desktop administration interface rather than a copy of the Mobile screens. Notification history includes title/message search, audience and status filters, bounded server-side pagination, delivery counts, and draft/send/delete actions.

## Technology stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 54, Expo Router, TypeScript, NativeWind/Tailwind tokens, Expo Secure Store, Expo Notifications, Recharts-compatible chart surfaces where applicable, and Axios. |
| Backend | Node.js, Express, TypeScript, Mongoose, MongoDB Atlas-compatible connection, JWT, bcrypt, Zod, Nodemailer, Axios, CORS, and a lightweight in-memory rate limiter. |
| Admin | React, Vite, TypeScript, Axios, Recharts, and the shared TaskFlow dark visual language. |
| Testing | Vitest, TypeScript smoke scripts executed with `tsx`, Axios/fetch HTTP assertions, MongoDB cleanup in smoke tests, and production builds. |
| Package management | pnpm with the root workspace scripts and package-local scripts under `Admin/` and `Backend/`. |

## Architecture

TaskFlow uses a three-workspace architecture. `Mobile/` is the client application and communicates with the API using authenticated Axios requests. `Backend/` exposes REST endpoints, validates request data, verifies JWTs, applies ownership and role authorization, and persists users, tasks, categories, reminders, focus sessions, notifications, and settings in MongoDB through Mongoose. `Admin/` is a separate Vite desktop client that authenticates against the same API and can access `/api/admin/*` only when the authenticated user has the `admin` role.

```text
Mobile (Expo / React Native) ─────┐
                                  ├── Backend (Express / JWT / Mongoose) ─── MongoDB
Admin (React / Vite desktop) ────┘                         │
                                                          └── SMTP for password-reset OTP
```

Every protected request carries `Authorization: Bearer <jwt>`. The Backend resolves the token subject against MongoDB, attaches the current user to the request, then applies resource ownership or the Admin role guard before running the handler.

## Folder structure

```text
TaskFlow/
├── Admin/                    # React + Vite desktop administration console
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── Backend/                  # Express + TypeScript + Mongoose API
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validation/
│   ├── tests/
│   └── package.json
├── Mobile/                   # Expo Router React Native application
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── assets/
│   └── package.json
├── README.md
├── .env.example              # variable names only; no secret values
├── .gitignore
├── package.json
└── pnpm-lock.yaml
```

Generated folders such as `node_modules/`, `dist/`, `.expo/`, logs, local environment files, and development artifacts are not application source folders and are excluded from version control.

## Installation

Use Node.js 20 or newer and pnpm. From the repository root, install the root dependencies and then install dependencies in the three workspaces:

```bash
pnpm install
pnpm --dir Backend install
pnpm --dir Admin install
pnpm --dir Mobile install
```

If the package manager reports ignored native build scripts in a fresh environment, approve only the packages required by the local build policy and rerun the install. Never commit generated dependency folders.

## Environment variables

The repository must never contain real credentials. `.env`, `.env.local`, MongoDB connection strings, JWT secrets, SMTP passwords, private keys, API keys, and credential files are ignored and must be provided through the local environment or the deployment secret manager. The environment templates contain variable names only.

### Backend variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime mode, such as `development` or `production`. |
| `PORT` | Backend HTTP port; the project default is `4000`. |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. |
| `CORS_ORIGINS` | Comma-separated exact browser origins trusted by the API. |
| `SMTP_HOST` | SMTP hostname for password-reset OTP email. |
| `SMTP_PORT` | SMTP port, commonly `465` or `587` depending on provider. |
| `SMTP_USER` | SMTP account username. |
| `SMTP_PASSWORD` | SMTP account password. |
| `SMTP_FROM_EMAIL` | Optional sender address; otherwise the SMTP user is used. |

### Client variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL for the Admin Vite client. |
| `EXPO_PUBLIC_API_URL` | Backend API base URL for Expo environments when supplied by the client configuration. |
| `TASKFLOW_API_URL` | Optional API base URL override used by smoke tests and local tooling. |

Do not paste real values into README files, source files, test fixtures, commits, screenshots, or issue reports.

## MongoDB configuration

Create a MongoDB database through MongoDB Atlas or a local MongoDB installation. Add the connection string to `MONGODB_URI`, ensure the deployment network policy permits the Backend host, and create a database user with only the permissions required by this application. The Backend connects during startup and fails clearly when `MONGODB_URI` is missing.

Mongoose models include `User`, `Task`, `Category`, `Reminder`, `FocusSession`, `AdminNotification`, and `SystemSetting`. Important task, focus-session, ownership, creation-date, completion-date, and category indexes are defined in the models to support dashboard aggregation and list queries.

## Backend startup

Run the API in development mode from the repository root:

```bash
pnpm dev:backend
```

Alternatively:

```bash
cd Backend
pnpm dev
```

The API listens on port `4000` by default. Verify it with:

```bash
curl http://127.0.0.1:4000/api/health
```

For a production build and start:

```bash
cd Backend
pnpm build
pnpm start
```

The root production bundle commands are also available through `pnpm build` and `pnpm start` when the root deployment environment is configured accordingly.

## Mobile startup

Start the Expo application from the repository root:

```bash
pnpm dev:metro
```

For a combined local development session, use:

```bash
pnpm dev
```

For native targets, use `pnpm ios` or `pnpm android` when a simulator, emulator, or connected device is available. Expo web preview uses the configured Expo port, normally `8081`. Scan the Expo QR code for a physical-device session and ensure the device can reach the configured Backend API URL.

## Admin startup

Start the desktop Admin Vite client with:

```bash
pnpm dev:admin
```

Alternatively:

```bash
cd Admin
pnpm dev
```

The Admin client normally runs on port `5173`. Build and preview it with:

```bash
cd Admin
pnpm build
pnpm preview
```

Open `/login` and sign in with a Backend account whose persisted `role` is `admin`. Normal users are rejected by the Backend even if they manually request an Admin route.

## Database seeding

There is no destructive or automatic production seed command. The application creates user and task data through authenticated API flows, and category initialization provides the default productivity categories used by the Mobile experience. For a development database, start MongoDB and the Backend, register a development account, and create data through the Mobile or API flows.

To create an administrator, use a controlled development or deployment database operation that changes the intended user’s `role` to `admin`. Do not expose an unrestricted public role-promotion endpoint. Always back up production data before any manual migration or administrative data operation.

## API endpoints

All endpoints are prefixed with `/api`. Protected endpoints require a valid Bearer JWT.

### Health and configuration

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend health check. |
| `GET` | `/config` | Non-secret application configuration metadata. |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a user and return a JWT. |
| `POST` | `/auth/login` | Authenticate credentials and return a JWT. |
| `GET` | `/auth/me` | Return the authenticated user. |
| `POST` | `/auth/forgot-password` | Send a generic-response password-reset OTP email. |
| `POST` | `/auth/verify-reset-otp` | Verify a six-digit, expiring, single-use OTP. |
| `POST` | `/auth/reset-password` | Set a new password using the verified reset token. |

### Tasks and productivity

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List owned tasks with status, favorite, search, and sort filters. |
| `GET` | `/tasks/stats` | Return live task counts and today’s tasks. |
| `GET` | `/tasks/calendar?date=YYYY-MM-DD` | Retrieve tasks for a calendar date. |
| `GET` | `/tasks/:id` | Read an owned task. |
| `POST` | `/tasks` | Create a task. |
| `PUT` | `/tasks/:id` | Update an owned task. |
| `DELETE` | `/tasks/:id` | Delete an owned task. |
| `PATCH` | `/tasks/:id/status` | Change task status and completion timestamp. |
| `PATCH` | `/tasks/:id/favorite` | Change favorite state. |
| `GET/POST/PUT/DELETE` | `/categories` and `/categories/:id` | Category listing and CRUD. |
| `GET/POST/PUT/DELETE` | `/reminders` and `/reminders/:id` | Reminder listing and CRUD. |
| `GET` | `/search?q=...` | Search tasks, projects, and categories. |
| `GET` | `/analytics/overview` | Completion overview. |
| `GET` | `/analytics/productivity` | Productivity series. |
| `GET` | `/analytics/categories` | Category distribution. |
| `GET` | `/analytics/focus-time` | Focus-time metrics. |
| `GET/POST` | `/focus/sessions` | Focus-session listing and creation. |

### Users and Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET/PUT` | `/users/profile` | Read or update the authenticated profile and preferences. |
| `PUT` | `/users/password` | Change the authenticated user password. |
| `GET` | `/admin/dashboard` | Live Admin dashboard metrics. |
| `GET/PATCH/DELETE` | `/admin/users` and `/admin/users/:id` | Admin user search, pagination, role/status actions, and deletion safeguards. |
| `GET/DELETE` | `/admin/tasks` and `/admin/tasks/:id` | Admin task registry, filtering, pagination, and deletion. |
| `GET/POST/PUT/DELETE` | `/admin/categories` and `/admin/categories/:id` | Admin category management. |
| `GET` | `/admin/analytics` | Date-filtered Admin-wide analytics. |
| `GET/POST` | `/admin/notifications/manage` | Notification history, creation, search, status/audience filters, and pagination. |
| `POST/DELETE` | `/admin/notifications/manage/:id/send` and `/admin/notifications/manage/:id` | Send or delete an Admin notification. |
| `GET/PUT` | `/admin/system-settings` | Read or update global Admin settings. |

The notification list accepts `search`, `status`, `audience`, `page`, and `limit` query parameters and returns pagination metadata. Page size is bounded by the Backend for large notification histories.

## Authentication

## Authentication and authorization

Passwords are hashed with bcrypt before persistence. Login and registration return JWTs signed with `JWT_SECRET`; the token expires after the configured application lifetime. Protected routes verify the token signature, confirm the user still exists in MongoDB, and attach the current user to the request.

The password-reset flow does not reveal whether an email exists. OTPs are hashed, expire after ten minutes, are single-use, and require a verified reset token before a password can be changed. The Mobile client persists sessions with secure device storage and supports logout.

Admin routes use both checks below:

```text
valid JWT
AND
req.authUser.role === "admin"
```

A normal user receives `403 Administrator access required` for Admin APIs. Resource routes also enforce ownership through the authenticated user ID. The Backend applies a 300-request-per-minute API limit and a 40-request-per-15-minute authentication limit per client address. CORS is restricted to configured trusted origins.

## Testing

Run the root Vitest tests:

```bash
pnpm test
```

Run workspace type checks and builds:

```bash
./node_modules/.bin/tsc --noEmit -p Mobile/tsconfig.json
./Backend/node_modules/.bin/tsc --noEmit -p Backend/tsconfig.json
pnpm --dir Admin run check
pnpm --dir Admin run build
```

Run the live MongoDB smoke suite while the Backend is running on port `4000`:

```bash
./Backend/node_modules/.bin/tsx Backend/tests/auth.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/tasks.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/productivity.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/analytics.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/profile.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/admin.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/admin.iteration8.smoke.ts
./Backend/node_modules/.bin/tsx Backend/tests/security.smoke.ts
```

The smoke tests cover authentication, invalid credentials, protected routes, password reset contracts, CRUD, completion, favorites, search/filter/sort behavior, calendar retrieval, categories, reminders, analytics, focus sessions, profile persistence, Admin management, Admin analytics, settings, normal-user denial, expired JWTs, CORS, input validation, and rate limiting. Test data is generated with unique identifiers and cleaned up after each flow.

## Deployment

Build the Backend and Admin artifacts in CI, inject secrets through the deployment platform, and run the Backend as the API service connected to MongoDB. Serve the Admin Vite `dist/` output from a static host or web server and configure `VITE_API_BASE_URL` to the HTTPS API origin. Build and distribute the Expo application through the normal Expo/EAS workflow after configuring the production API URL and mobile application settings.

Production deployment requirements are an HTTPS API origin, a restricted MongoDB network policy, a least-privilege database user, a strong randomly generated `JWT_SECRET`, working SMTP credentials for password-reset delivery, exact `CORS_ORIGINS`, secure secret storage, and monitoring for API errors, rate-limit responses, database health, and email delivery. Do not deploy with development CORS defaults or commit environment files.

GitHub synchronization is intentionally not performed by this documentation update. When repository access is authorized, verify the remote, review the diff, create a meaningful commit, push the intended branch, and confirm the remote branch contains `Admin/`, `Backend/`, `Mobile/`, `README.md`, `.gitignore`, and `package.json`.

## Current delivery status

TaskFlow’s implemented iterations include the foundation and visual system, authentication and OTP recovery, task management, calendar/categories/search/reminders, analytics and focus timer, profile/settings polish, Admin dashboard, advanced Admin analytics/notifications/settings, notification search/filter/pagination, and Iteration 9 testing/security hardening. The supplied TaskFlow reference remains the visual source of truth for the Mobile design; the Admin workspace intentionally uses a professional desktop composition built from the same colors, typography, surfaces, borders, and gradients.
