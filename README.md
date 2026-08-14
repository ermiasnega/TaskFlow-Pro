# TaskFlow

TaskFlow is a production-oriented task management foundation built from the supplied mobile UI reference. Iteration 1 establishes the Expo navigation foundation, reusable mobile design system, Express/Mongoose backend structure, and React/Vite admin shell.

## Repository Structure

| Directory | Purpose |
|---|---|
| `Mobile/` | Expo mobile application, navigation, assets, and reusable TaskFlow design system. |
| `Backend/` | Express + TypeScript API foundation, server internals, Mongoose model, JWT guard, bcrypt helper, and starter routes. |
| `Admin/` | React + Vite dashboard foundation with TaskFlow styling and Recharts dependency. |

The repository root contains only project metadata and the three application workspaces. Hidden tooling directories created by the local development environment are not application folders.

## Run Commands

From the repository root, `pnpm dev` runs the managed Expo web preview and the existing project server. `pnpm dev:backend` runs the Express API on port 4000, and `pnpm dev:admin` runs the Vite admin dashboard on port 5173. Inside `Admin/`, `pnpm build` creates the production dashboard bundle. Inside `Backend/`, `pnpm build` compiles the API to `dist/`.

For native mobile testing, use `pnpm ios` or `pnpm android` from the root when the corresponding simulator or device is available. The relocated Expo project is contained in `Mobile/` and is typechecked with `pnpm check` from the root.

## Design System

The shared `TaskFlowTheme` centralizes the midnight background, navy and raised surfaces, purple gradient action colors, blue secondary accent, green completed state, orange pending state, typography scale, spacing, radii, and shadows. `Mobile/components/taskflow.tsx` provides reusable buttons, cards, task cards, status badges, input fields, filter tabs, headers, floating action buttons, bottom navigation, loading indicators, empty states, modals, and icons.

## Configuration Still Required

The backend accepts `MONGODB_URI` and `JWT_SECRET` through `Backend/.env`; no database is connected unless `MONGODB_URI` is supplied. The starter API currently exposes health/config endpoints and reserves authenticated task routes for Iteration 2. The Expo app configuration and generated TaskFlow icon assets live under `Mobile/`. The admin dashboard currently uses local presentation data until API wiring is introduced.

## Verification Scope

The foundation is intended to be typechecked independently for the `Mobile/`, `Backend/`, and `Admin/` workspaces. This iteration intentionally does not implement complete authentication, database CRUD, cloud synchronization, or full application workflows.

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

The Mobile workspace now includes the branded splash/loading state, welcome onboarding, login, registration, forgot-password, reset-password, automatic session restoration, protected tab navigation, and logout. Sessions use SecureStore on native platforms and localStorage on web. All authentication requests use Axios against the real Backend API.

The Backend workspace exposes `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and protected `GET /api/auth/me`. User passwords are hashed with bcrypt, access tokens use JWT, and user records are stored with Mongoose in MongoDB. In development, forgot-password returns a reset token so the flow can be verified without an email provider; production email delivery remains a later integration.

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
