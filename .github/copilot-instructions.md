Project: Honeycomb Dev — quick AI contributor guide

Keep guidance concise and focused on discoverable patterns, commands, and concrete examples.

- Project type: React + TypeScript app bootstrapped with Create React App (entry: `src/index.tsx`, root component: `src/App.tsx`).
- Run locally: `npm install` then `npm start` (scripts are in top-level `package.json`). Tests: `npm test`. Build: `npm run build`.
- Note: `honeycomb-project-v1/README.md` mentions Vite, but current `package.json` uses `react-scripts` (CRA). Prefer the `npm start` / `react-scripts` workflow.

Architecture & conventions
- UI is organized into `src/components/` (reusable UI pieces) and `src/pages/` (route-backed pages). Examples: `components/Navbar.tsx`, `pages/DashboardPage.tsx`.
- Routing: `react-router-dom` is used. Routes are declared in `src/App.tsx`. Dashboard routes are under `/dashboard` (dashboard home and `/dashboard/calendar`).
- State patterns: the app uses local React state and Context providers for cross-cutting UI state. Example: `src/components/NewJobModalContext.tsx` exposes `useNewJobModal()`; call `useNewJobModal().open()` to open the New Job modal. App-level state (customers) is lifted in `src/App.tsx` and passed into `NewJobModalProvider`.
- Styling: CSS Modules are used across components — look for `*.module.css` files next to components (e.g. `AddTask.module.css`). Keep new component styles scoped with `ComponentName.module.css`.
- No backend client found: there are no centralized API clients (no `fetch` / `axios` usages detected). If you add network integration, create `src/lib/api.ts` and keep side effects out of UI components.

Dependencies & integration points
- Major libs in `package.json`: React 19, TypeScript, `react-router-dom`, `recharts` (charts), `@dnd-kit/core` (drag & drop), `date-fns`, `react-icons`.
- Where to change third-party usage: inspect `src/components/*` for concrete integrations (charts and DnD appear where job lists and boards are implemented).

Testing & tooling
- Tests use Create React App test runner (Jest via `react-scripts test`). See `src/setupTests.ts` for test setup.
- Linting: default CRA ESLint config is present via `eslintConfig` in `package.json` (extends `react-app`).

Code style & language
- TypeScript is enabled; keep typing for component props and context where practical (follow patterns in `NewJobModalContext.tsx`).
- Component files are `.tsx`; keep helper modules in plain `.ts` under `src/lib` or `src/utils` (create if missing).
- The codebase contains Turkish comments and strings in some files (e.g. `App.tsx`). Be mindful of language when editing UX text.

How to extend or modify
- Adding a new page: create `src/pages/MyPage.tsx`, a `MyPage.module.css`, and add a `<Route path="/my" element={<MyPage />} />` in `src/App.tsx`.
- Adding global/shared state: prefer Context providers (pattern: `NewJobModalProvider`) and keep provider props explicit (e.g. `customers`, `onAddCustomer`).
- Adding network APIs: add `src/lib/api.ts` that exports small functions used by components; call them from effect hooks or in action handlers, not during render.

Examples taken from repo
- Open New Job modal: `const modal = useNewJobModal(); modal.open();` (`src/components/NewJobModalContext.tsx`).
- Customer state is lifted in `src/App.tsx` via `handleAddCustomer` and passed into `NewJobModalProvider`.
- Styling example: component `Navbar` uses `Navbar.module.css` placed next to `Navbar.tsx`.

If something is unclear
- If a task requires backend details, ask where the API will be hosted and whether to add environment variables (CRA uses `.env` naming like `REACT_APP_...`).
- If you're unsure whether to use Vite or CRA for changes, prefer the existing `react-scripts` scripts unless the maintainer requests migration.

Please review and tell me any missing developer workflows or conventions to include.
