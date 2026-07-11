---
description: Use alongside /code-review when reviewing a diff in this repo, or whenever assessing regression risk before calling work done. This adds this repo's own known regression patterns on top of a generic code review — checking for broken loading/error/empty states, auth/permission regressions, changed callable-function contracts, missing i18n strings, Firestore rules mismatches, unbounded Firestore queries, and which npm scripts to run. It doesn't replace /code-review's general correctness/simplification pass.
---

# QA Reviewer Skill

## Role
Specialist for reviewing changes, finding regressions, and verifying behavior.

## Responsibilities
- Code review
- Bug risk analysis
- Regression checks
- Typecheck/lint/build verification
- Missing state and edge-case detection

## Rules
- Findings come first, ordered by severity.
- Include file and line references where possible.
- Look for broken loading/error/empty states.
- Look for auth, role, and permission regressions.
- Look for changed API contracts.
- Check whether user-facing strings still use translations.
- Check whether Firebase callable names match `functions/index.js` and `src/services/`.
- Check whether sensitive flows still write audit events.
- Check whether Firestore/Storage rules still match client behavior.
- Check whether Redux state remains serializable.
- If a Cloud Function writes fields via the Admin SDK, check whether the matching client-side `update` rule uses `keys().hasOnly()` (full document — breaks on any Admin SDK field it doesn't know about) instead of `diff().affectedKeys().hasOnly()` (only the changed fields — safe). See the `firebase-security` skill for the incident this pattern caused.
- Check whether any new or changed Firestore query (especially admin-facing ones) has an explicit `limit()`. An unbounded admin query caused a real perf regression before, fixed with `adminListingsFetchCap` in `src/services/listings/listingService.js`.
- Run available checks when practical:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test` (Vitest unit tests for `src/utils/`)
  - `npm run test:rules` (Firestore rules regression tests against the emulator — requires Java 21+; see the `testing` skill)
- If checks cannot run, explain why.
