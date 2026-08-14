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
