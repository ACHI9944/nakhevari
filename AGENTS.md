# Project Rules

## Project Overview
This project is a React + Vite web application with Firebase client services and Firebase Cloud Functions.

Frontend:
- React 19
- Vite
- React Router
- Redux Toolkit
- Firebase client SDK
- CSS Modules and shared theme styles
- i18next/react-i18next for translations

Backend:
- Firebase Cloud Functions
- Node.js 22
- Firebase Admin SDK
- Firestore-backed admin, user, listing, and company workflows
- Firebase region: `europe-west1`

## Domain Facts
- Public callable functions are exported from `functions/index.js`; the file path does not define the public function name.
- Current callable functions: `moderateListing`, `backfillListingSearchFields`, `listAdmins`, `setAdminAccess`, `listProfiles`, `updateCompanyVerification`.
- Firestore collections in active use: `users`, `listings`, `listingModerationEvents`, `adminAccessEvents`, `companyVerificationEvents`.
- Listing statuses: `pending`, `published`, `rejected`, `draft`.
- Company verification statuses: `pending`, `verified`, `rejected`, `not_required`.
- Admin access is represented with a Firebase Auth custom claim: `admin: true`.
- Firebase rules live in `firestore.rules` and `storage.rules`.
- Firebase Hosting serves `dist/`; do not edit `dist/` directly.

## Core Working Rules
- Read the relevant existing files before changing code.
- Prefer the project's current patterns over introducing new architecture.
- Keep changes scoped to the user's request.
- Do not rewrite unrelated code, formatting, or structure.
- Do not edit generated/build output such as `dist/`.
- Do not make database, Firestore schema, auth, role, or permission changes without calling them out clearly.
- Do not introduce new dependencies unless there is a strong reason.
- Preserve existing Georgian/English/i18n behavior when touching user-facing text.
- When adding visible text, check whether it belongs in the translation resources.
- Keep UI consistent with the existing CSS Modules and theme system.
- Avoid changing public Firebase callable/function contracts unless necessary.

## Important Paths
- Frontend app entry: `src/main.tsx`
- App shell: `src/app/`
- Routes: `src/navigation/`
- Screens: `src/screens/`
- Shared components: `src/components/`
- Client services: `src/services/`
- Redux store: `src/store/`
- Firebase config: `src/config/firebase.js`
- Theme/styles: `src/theme/`, `src/styles/`, `src/index.css`
- Translations: `src/translations/`
- Cloud Functions: `functions/`
- Functions shared helpers: `functions/lib/`

## Specialized Agent Guides
Codex automatically loads this `AGENTS.md` file. The files in `.agents/` are specialist guides and should be read only when they match the task.

- Frontend/UI implementation: `.agents/frontend.md`
- Firebase Cloud Functions/backend work: `.agents/backend-functions.md`
- Auth, admin access, permissions, and sensitive data: `.agents/firebase-security.md`
- Code review, regression risk, and verification: `.agents/qa-reviewer.md`
- Product UX, listing flows, forms, and admin dashboard polish: `.agents/product-ui.md`
- Georgian/English copy, translations, and user-facing text: `.agents/i18n-content.md`
- Automated tests (Vitest unit tests, Firestore rules emulator tests): `.agents/testing.md`

Use the smallest relevant set of specialist guides for the task. Do not load every specialist guide by default.

## Commands
Use these commands when relevant:

- Start frontend dev server:
  `npm run dev`

- Build frontend:
  `npm run build`

- Typecheck frontend:
  `npm run typecheck`

- Lint frontend:
  `npm run lint`

- Run unit tests (`src/utils/`):
  `npm run test`

- Run Firestore rules tests against the emulator (needs Java 21+, see `.agents/testing.md`):
  `npm run test:rules`

There are currently no explicit backend test scripts in `functions/package.json`.

## Verification Routing
- Frontend-only change: prefer `npm run typecheck` and `npm run lint`.
- Broad frontend or build-sensitive change: run `npm run build`.
- Change to `src/utils/` or `src/services/` logic: run `npm run test`, and add/update a test in `tests/utils/` when practical.
- Firebase rules/security change: inspect `firestore.rules`, `storage.rules`, and the matching client/backend access path, and run `npm run test:rules`.
- Callable function contract change: inspect the frontend wrapper in `src/services/` and the export in `functions/index.js`.
- Admin, profile, moderation, or company verification change: read the relevant specialist guide from `.agents/` before editing.

## Frontend Rules
- Use existing screen/component folder conventions.
- Prefer CSS Modules for component-specific styles.
- Use shared components from `src/components/` where appropriate.
- Keep screen logic readable; extract only when it reduces real complexity.
- Keep Redux state changes predictable and colocated with existing slices.
- Keep Firebase calls inside service modules when possible.
- Avoid direct Firebase access from UI components if a service already exists.
- Keep loading, empty, error, and permission states explicit in UI flows.

## Backend / Firebase Functions Rules
- Keep callable/function handlers small and readable.
- Reuse helpers from `functions/lib/` before creating new helpers.
- Use the shared `REGION` from `functions/lib/config.js`.
- Validate inputs at the function boundary.
- Check authentication and role/admin permissions before reading or mutating protected data.
- Return predictable response shapes.
- Avoid leaking internal errors or sensitive user/admin data.
- Be careful with Firestore paths and collection names; verify existing usage first.
- For sensitive admin actions, preserve or add audit events when the existing flow has them.

## Data and Security Rules
- Treat user profile, admin access, listing moderation, and company verification flows as sensitive.
- Before changing authorization logic, inspect both frontend service usage and Cloud Function logic.
- Avoid client-side-only enforcement for sensitive actions.
- Keep admin-only behavior enforced in Cloud Functions or Firestore rules, not only in React screens.
- Do not log secrets, tokens, private user data, or full auth objects.

## UI / Product Rules
- This appears to be a marketplace/listings product; prioritize clarity, trust, and efficient browsing.
- Keep layouts responsive on mobile and desktop.
- Avoid decorative redesigns unless the user asks for design work.
- Maintain existing visual language, spacing, and component behavior.
- Forms should have clear validation, disabled/submitting states, and recoverable errors.
- Admin screens should prioritize scanning, filtering, and action clarity.

## Quality Rules
- For frontend changes, run `npm run typecheck` and `npm run lint` when practical.
- For broader changes, run `npm run build`.
- If verification cannot be run, explain why.
- For bug fixes, consider the smallest regression check that proves the fix.
- For reviews, report risks and bugs first, with file/line references.

## Git / Workspace Rules
- This workspace may not always be a git repository.
- Do not revert user changes.
- Do not run destructive commands unless explicitly requested.
- If unrelated local changes exist, ignore them.
- If user changes conflict with the requested work, explain the conflict before proceeding.
