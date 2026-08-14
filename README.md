# TaskFlow

TaskFlow is a production-oriented task management foundation built from the supplied mobile UI reference. Iteration 1 establishes the monorepo shape, Expo navigation foundation, reusable mobile design system, Express/Mongoose backend structure, and React/Vite admin shell. Later iterations can add authentication flows, persistent CRUD, real charts, and complete task workflows without replacing the visual foundation.

## Repository Structure

| Directory | Purpose |
|---|---|
| `app/`, `components/`, `constants/`, `hooks/`, `lib/` | Managed Expo mobile application source. |
| `mobile/` | Mobile workspace marker and extraction boundary for future monorepo separation. |
| `backend/` | Express + TypeScript API foundation with Mongoose model, JWT guard, bcrypt helper, and starter routes. |
| `admin/` | React + Vite dashboard foundation with TaskFlow styling and Recharts dependency. |
| `design.md` | Content-specific mobile interface plan derived from the supplied reference. |
| `todo.md` | Iteration checklist and feature history. |

## Run Commands

From the repository root, use `pnpm dev` to run the managed Expo web preview and the existing project server. Use `pnpm dev:backend` to run the Express API on port 4000, and use `pnpm dev:admin` to run the Vite admin dashboard on port 5173. Inside `admin/`, `pnpm build` creates the production dashboard bundle. Inside `backend/`, `pnpm build` compiles the API to `dist/`.

For native mobile testing, use `pnpm ios` or `pnpm android` from the root when the corresponding simulator/device is available. The managed Expo preview remains the primary foundation verification path for this iteration.

## Design System

The shared `TaskFlowTheme` centralizes the midnight background, navy and raised surfaces, purple gradient action colors, blue secondary accent, green completed state, orange pending state, typography scale, spacing, radii, and shadows. `components/taskflow.tsx` provides reusable `GradientButton`, `SecondaryButton`, `Card`, `TaskCard`, `StatusBadge`, `InputField`, `FilterTabs`, `ScreenHeader`, `FloatingActionButton`, `BottomNavigation`, `LoadingIndicator`, `EmptyState`, `TaskModal`, and `Icon` components.

## Configuration Still Required

The backend is ready to accept `MONGODB_URI` and `JWT_SECRET` through `backend/.env`; no database is connected unless `MONGODB_URI` is supplied. The starter API currently exposes health/config endpoints and reserves authenticated task routes for Iteration 2. The Expo app uses the generated TaskFlow icon placeholder URL in `app.config.ts`; when the asynchronous asset generation finishes, the same file locations should contain the finalized PNG asset. The admin dashboard currently uses local presentation data until API wiring is introduced.

## Verification Scope

The foundation is intended to be typechecked independently for the Expo root, backend package, and admin package. This iteration intentionally does not implement complete authentication, database CRUD, cloud synchronization, or full application workflows.
