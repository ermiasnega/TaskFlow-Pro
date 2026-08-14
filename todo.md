# TaskFlow TODO

- [x] Establish monorepo structure for `mobile/`, `backend/`, and `admin/`
- [x] Configure root workspace scripts and shared ignore rules
- [x] Apply TaskFlow dark navy, purple, blue, green, and orange theme tokens
- [x] Create reusable mobile buttons, cards, task cards, badges, inputs, tabs, navigation, headers, icons, modals, loaders, and empty states
- [x] Build mobile navigation foundation with Home, Tasks, Calendar, Analytics, and Profile tabs
- [x] Add foundation screens for Home, Tasks, Calendar, Analytics, and Profile
- [x] Create basic Express backend entrypoint, configuration, routes, models, middleware, JWT/bcrypt auth placeholders, and Mongoose connection
- [x] Create basic React/Vite admin shell with shared visual language and chart dependency
- [x] Generate and apply TaskFlow app branding assets
- [x] Run mobile typecheck/lint/tests and verify preview
- [x] Run backend and admin checks
- [x] Document commands and remaining configuration in README.md

- [ ] Create private GitHub repository `TaskFlow-Pro` and push the current TaskFlow foundation

- [ ] Locate the user-created `TaskFlow-Pro` remote and push the current TaskFlow foundation

- [x] Restructure repository root to only `Admin/`, `Backend/`, and `Mobile/` application folders
- [x] Update workspace scripts, Expo paths, documentation, and GitHub structure for the three-folder layout

- [x] Iteration 2: Add splash and welcome onboarding screens in Mobile
- [x] Iteration 2: Add login, register, forgot-password, reset-password, logout, and protected navigation flows
- [x] Iteration 2: Add Backend User model with MongoDB/Mongoose, bcrypt password hashing, JWT auth, validation, and auth routes
- [x] Iteration 2: Connect Mobile authentication to the real Backend with secure token persistence and automatic session checks
- [x] Iteration 2: Test registration, login, invalid credentials, logout, protected routes, and auth loading/error states
- [ ] Iteration 2: Update documentation and synchronize the three-folder structure to GitHub

- [x] Add production email provider configuration for real reset-password OTP delivery
- [x] Replace reset-token recovery with hashed, expiring, single-use OTP verification in Backend
- [x] Update Mobile reset-password UI to request, enter, and verify OTP before changing password
- [x] Test real-email OTP flow, invalid/expired/reused codes, and document setup

- [x] Add a Resend OTP button with a 60-second countdown to the Mobile OTP verification screen

- [ ] Synchronize the latest TaskFlow source and OTP resend changes to the existing GitHub repository

- [x] Iteration 3: Add MongoDB Task model with ownership, metadata, subtasks, favorites, and completion timestamps
- [x] Iteration 3: Implement authenticated task CRUD, status, favorite, filtering, sorting, search, and statistics APIs
- [x] Iteration 3: Replace Home dashboard placeholders with live MongoDB statistics and today’s tasks
- [x] Iteration 3: Implement live Tasks list with filters, search, sorting, favorite and completion controls
- [x] Iteration 3: Implement task details and real add/edit/delete/complete/favorite flows
- [x] Iteration 3: Test task CRUD and update documentation while preserving Admin/Backend/Mobile structure
