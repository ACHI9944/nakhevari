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
- Listing statuses: `pending`, `published`, `rejected`, `draft`. Listings are always created as `pending`; `moderateListing` only transitions `pending` → `published`/`rejected`. Nothing currently sets a listing to `draft` — it exists in `firestore.rules`/`storage.rules` and the admin dashboard's filters/counts/badges as a reserved future state, so an always-zero `draft` count is expected, not a bug.
- Company verification statuses: `pending`, `verified`, `rejected`, `not_required`.
- User profile statuses: `profileStatus` is `active` or `suspended`. The `users/{userId}` Firestore update rule requires `resource.data.profileStatus == 'active'`, so a suspended profile is permanently locked out of self-service profile edits by design (see the `firebase-security` skill). No code currently sets `profileStatus` to `suspended` — there is no admin "suspend user" callable yet, only the rule-level gate and the translated label. Treat this as a half-built feature, not a bug, unless asked to build the missing admin action.
- Admin access is represented with a Firebase Auth custom claim: `admin: true`.
- Admin-facing Firestore queries must stay capped with `limit()` — see `adminListingsFetchCap` in `src/services/listings/listingService.js`. An earlier unbounded admin query was a real performance regression; don't reintroduce the pattern elsewhere.
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

## Specialist Skills
This file loads automatically on every session. The skills below are specialist deep-dives that load on demand — invoke (or let Claude auto-invoke) the smallest relevant set for the task; don't pull in every skill by default.

- Frontend/UI implementation: `frontend` skill
- Firebase Cloud Functions/backend work: `backend-functions` skill
- Auth, admin access, permissions, and sensitive data: `firebase-security` skill
- Code review, regression risk, and verification: `qa-reviewer` skill
- Product UX, listing flows, forms, and admin dashboard polish: `product-ui` skill
- Georgian/English copy, translations, and user-facing text: `i18n-content` skill
- Automated tests (Vitest unit tests, Firestore rules emulator tests): `testing` skill

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

- Run Firestore rules tests against the emulator (needs Java 21+, see the `testing` skill):
  `npm run test:rules`

There are currently no explicit backend test scripts in `functions/package.json`.

## Verification Routing
- Frontend-only change: prefer `npm run typecheck` and `npm run lint`.
- Broad frontend or build-sensitive change: run `npm run build`.
- Change to `src/utils/` or `src/services/` logic: run `npm run test`, and add/update a test in `tests/utils/` when practical.
- Firebase rules/security change: inspect `firestore.rules`, `storage.rules`, and the matching client/backend access path, and run `npm run test:rules`.
- Callable function contract change: inspect the frontend wrapper in `src/services/` and the export in `functions/index.js`.
- Admin, profile, moderation, or company verification change: use the relevant specialist skill before editing.

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
