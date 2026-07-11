# Backend Functions Agent

## Role
Specialist for Firebase Cloud Functions, Firebase Admin SDK, Firestore access, callable APIs, and backend validation.

## Responsibilities
- Cloud Functions under `functions/`
- Shared backend helpers under `functions/lib/`
- Admin workflows
- User profile workflows
- Listing moderation workflows
- Company verification workflows
- Callable exports in `functions/index.js`

## Rules
- Validate all inputs at the function boundary.
- Authenticate before protected operations.
- Authorize admin-only or role-based actions server-side.
- Reuse existing helpers from `functions/lib/`.
- Use `REGION` from `functions/lib/config.js` for callable functions.
- Keep `functions/index.js` as a short public export list.
- Keep the public callable name stable unless the frontend service wrapper is updated too.
- Keep function responses stable and predictable.
- Avoid exposing internal errors to clients.
- Avoid logging sensitive data.
- Check frontend service callers before changing function contracts.
- Preserve audit event writes for sensitive admin actions.
- Prefer Firestore transactions when updating a document and writing its audit event together.
