---
description: Use when authoring or updating this repo's automated test suites — Vitest unit tests in tests/utils/ for src/utils/ logic, Firestore/Storage rules emulator tests in tests/rules/, or Cloud Functions emulator tests in tests/functions/. Covers npm run test / test:rules / test:functions requirements. This is about writing tests; for manually driving the running app to confirm a change works end-to-end, use /verify instead.
---

# Testing Skill

## Role
Specialist for automated tests: frontend unit tests, Firestore/Storage security rules tests, and Cloud Functions tests.

## What exists today
- `tests/utils/*.test.js` — Vitest unit tests for pure logic in `src/utils/` (listing search normalization, filter/unit conversion, phone validation, listing presenters). Run with `npm run test`.
- `tests/rules/*.test.js` — `@firebase/rules-unit-testing` tests that run `firestore.rules` and `storage.rules` against the Firestore/Storage emulators. Covers `users/{userId}`, `listings/{listingId}` (create/update/delete/read boundaries, image-path/array validation, seller-type/company gating), `listing-images/{userId}/{listingId}/{fileName}` storage rules, and deny-by-default checks on the audit event collections. Run with `npm run test:rules`.
- `tests/functions/*.test.js` — Vitest tests that call the exported Cloud Functions directly via `<callable>.run(request)` (the `firebase-functions` v2 test hook — bypasses the network layer but runs the real handler) against the Firestore/Auth emulators. Covers `moderateListing`, `setAdminAccess`, `updateCompanyVerification`: auth/permission checks, input validation, the not-found/failed-precondition paths, and that the resulting document + audit event are correct. `listAdmins`, `listProfiles`, and `backfillListingSearchFields` are not yet covered — add tests there if you touch that logic. Run with `npm run test:functions`.
- `npm run test:all` runs all three.
- `scripts/check-listing-search.js` (`npm run check:listing-search`) is an older, narrower assert-based check for `src/utils/listingSearch.js`. Prefer extending `tests/utils/listingSearch.test.js` for new cases; keep the script working since `LISTING_TEXT_SEARCH_PLAN.md` references it.

## Requirements
- `npm run test:rules` and `npm run test:functions` both need a JDK 21+ on `PATH`/`JAVA_HOME` (the Firestore emulator requirement). If the default `java` is older, point `JAVA_HOME` at a JDK 21+ install for that command only, e.g. `JAVA_HOME=/opt/homebrew/opt/openjdk@21 npm run test:rules`. Do not change the machine's global default JDK to make this work.
- `tests/rules/*.test.js` connects to the emulators via `firebase.json`'s `emulators.firestore` (8080) and `emulators.storage` (9199) ports. Keep that config and the test files' `host`/`port` in sync if either changes.
- `tests/functions/*.test.js` runs against the Firestore (8080) and Auth (9099) emulators. `npm run test:functions` sets `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST`/`GCLOUD_PROJECT` on the shell before invoking `firebase emulators:exec`, because the Admin SDK (`functions/lib/firebase.js`) reads those env vars at `initializeApp()` time, which happens at module import — they must be set before Vitest imports any function module, not inside a test file's `beforeAll`.
- Each `tests/rules/*.test.js` and `tests/functions/*.test.js` file should use its own arbitrary `projectId` (not `nakhevari-ge`), **except** `tests/rules/storage.rules.test.js`. Two reasons this matters:
  - Vitest runs test files concurrently by default. `testEnv.clearFirestore()`/`clearStorage()` clear *all* data for a `projectId`, so two files sharing one `projectId` race and cause spurious cross-file failures.
  - `storage.rules.test.js` is the exception: `firebase.json` sets `emulators.singleProjectMode`, and `storage.rules`' cross-service `firestore.get()`/`firestore.exists()` calls only resolve against that single configured project (`nakhevari-ge` in `.firebaserc`), not an arbitrary test `projectId`. If you add more storage-rules tests that read Firestore, keep them in this same file/project; don't reintroduce an arbitrary `projectId` there or the cross-service calls will silently no-op (looks like `!firestore.exists(...)` is always true).

## Rules
- Any change to `firestore.rules` or `storage.rules` should get a matching test in `tests/rules/` when practical, especially for allow/deny boundaries (owner vs. non-owner, admin vs. non-admin, status transitions, field allowlists).
- When a Cloud Function writes fields via the Admin SDK, add or update a `tests/rules/` test that simulates that write (via `testEnv.withSecurityRulesDisabled`) and then asserts a normal client update still succeeds — this is exactly the shape of bug covered in the `firebase-security` skill.
- Any new or changed callable in `functions/` should get a matching `tests/functions/` test: at minimum the permission-denied (non-admin) path, the invalid-argument/validation paths, and the happy path (document + audit event written correctly). Use `tests/functions/helpers.js` (`createAuthUser`, `callableRequest`, `expectHttpsError`) rather than duplicating Auth-emulator user setup per file.
- Prefer testing `src/utils/` and `src/services/` logic over React components; there is no component-testing setup (no Testing Library/jsdom config) yet, and adding one is a separate decision, not something to bolt on for a single test.
- Keep `tests/utils/*.test.js` free of any emulator/network dependency so `npm run test` stays fast and safe to run in any environment, including CI's default job.
- Do not commit real Firebase credentials or point tests at the production project; rules and functions tests must run only against the emulators, never against `nakhevari-ge` in production.
