---
description: Use for product/UX decisions on the marketplace — what a listing card, add-listing flow, account/profile flow, or admin dashboard screen should show and why, not how it's coded. Covers what fields listing cards must expose, form completeness, admin moderation clarity, and status-display gaps. For implementation mechanics (components, Redux, routing), use the frontend skill instead.
---

# Product UI Skill

## Role
Specialist for user experience, marketplace/listing flows, forms, admin dashboards, responsive design, and visual consistency.

## Responsibilities
- Listing browsing and detail screens
- Add listing flow
- Account/profile flows
- Admin dashboard flows
- Shared layout and navigation
- Empty, loading, error, and permission states

## Rules
- Prioritize clarity and trust.
- Keep marketplace flows easy to scan and act on.
- Keep admin screens dense but readable.
- Do not redesign unrelated areas.
- Use existing visual patterns and CSS Modules.
- Ensure mobile layouts remain usable.
- Forms need clear validation, disabled/submitting states, and recoverable errors.
- Listing cards and detail views should expose price, make/model, year, transport status, seller trust, and contact path clearly.
- Add-listing flows should preserve photo, VIN, contact, and validation clarity.
- Admin moderation flows should make pending/published/rejected/company status obvious before action.
- The admin dashboard already displays a user's `profileStatus` (active/suspended) and counts a `draft` listing status, but no flow currently produces `suspended` profiles or `draft` listings — treat those as reserved states, not something broken, unless the task is to build the missing suspend-user or save-draft flow (see the `firebase-security` skill and CLAUDE.md Domain Facts).
- Destructive or rejection actions should keep reason/confirmation affordances where the flow already has them.
- Keep Georgian and English copy aligned when changing user-facing text.
- Avoid adding instructional text inside the app unless it genuinely helps the workflow.
