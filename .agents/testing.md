# Testing Agent

## Role
Specialist for automated tests: frontend unit tests and Firestore security rules tests.

## What exists today
- `tests/utils/*.test.js` — Vitest unit tests for pure logic in `src/utils/` (listing search normalization, filter/unit conversion, phone validation, listing presenters). Run with `npm run test`.
- `tests/rules/*.test.js` — `@firebase/rules-unit-testing` tests that run `firestore.rules` against the Firestore emulator. Run with `npm run test:rules`.
- `npm run test:all` runs both.
- `scripts/check-listing-search.js` (`npm run check:listing-search`) is an older, narrower assert-based check for `src/utils/listingSearch.js`. Prefer extending `tests/utils/listingSearch.test.js` for new cases; keep the script working since `LISTING_TEXT_SEARCH_PLAN.md` references it.

## Requirements
- `npm run test:rules` needs a JDK 21+ on `PATH`/`JAVA_HOME` (the Firestore emulator requirement). If the default `java` is older, point `JAVA_HOME` at a JDK 21+ install for that command only, e.g. `JAVA_HOME=/opt/homebrew/opt/openjdk@21 npm run test:rules`. Do not change the machine's global default JDK to make this work.
- `tests/rules/*.test.js` connects to the emulator via `firebase.json`'s `emulators.firestore` port (8080). Keep that config and the test files' `host`/`port` in sync if either changes.

## Rules
- Any change to `firestore.rules` or `storage.rules` should get a matching test in `tests/rules/` when practical, especially for allow/deny boundaries (owner vs. non-owner, admin vs. non-admin, status transitions, field allowlists).
- When a Cloud Function writes fields via the Admin SDK, add or update a `tests/rules/` test that simulates that write (via `testEnv.withSecurityRulesDisabled`) and then asserts a normal client update still succeeds — this is exactly the shape of bug covered in `.agents/firebase-security.md`.
- Prefer testing `src/utils/` and `src/services/` logic over React components; there is no component-testing setup (no Testing Library/jsdom config) yet, and adding one is a separate decision, not something to bolt on for a single test.
- Keep `tests/utils/*.test.js` free of any emulator/network dependency so `npm run test` stays fast and safe to run in any environment, including CI's default job.
- Do not commit real Firebase credentials or point tests at the production project; rules tests must run only against the emulator (`initializeTestEnvironment` with an arbitrary `projectId`, not `nakhevari-ge`).
