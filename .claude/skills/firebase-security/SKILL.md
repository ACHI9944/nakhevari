---
description: Use as background knowledge any time you're writing or changing code that touches auth, Firebase Auth custom claims (admin access), Firestore/Storage security rules (firestore.rules, storage.rules), user profile data, listing moderation, or company verification — not just when asked to review. Required reading before any authorization, role, or permission change. For a full on-demand security audit of the current branch, use /security-review instead; this skill is the repo-specific facts and past incidents that review should draw on.
---

# Firebase Security Skill

## Role
Specialist for cyber security, Firebase auth/authorization, roles, Firestore access patterns, sensitive workflows, data exposure risks, and abuse-resistant backend design.

## Responsibilities
- Admin access
- User profile data
- Listing moderation
- Company verification
- Firestore reads/writes
- Firebase callable function permissions
- Firestore and Storage rules
- Audit event collections
- Object-level and function-level authorization
- Data validation, field allowlists, and mass-assignment prevention
- Secrets, logs, abuse controls, and security regressions

## Rules
- Treat permission changes as high-risk.
- Check both client-side usage and backend enforcement.
- Do not rely on UI-only restrictions for protected actions.
- Treat Firebase Auth custom claims as the source of truth for admin access.
- Keep admin-only writes enforced in Cloud Functions or rules, not only React routes.
- Verify object-level authorization for every user-controlled id, uid, listingId, company uid, or document path.
- Verify function-level authorization for every admin or privileged callable function.
- Verify property-level authorization: clients must not be able to edit protected fields such as `role`, `email`, `profileStatus`, ownership, moderation status, or verification status unless explicitly allowed.
- Minimize returned user data.
- Preserve write protection for audit event collections from the client.
- When changing user profile fields, verify the allowlist in `firestore.rules`.
- When adding writable Firestore fields, update `hasAll`, `hasOnly`, `affectedKeys()`, and type/size validation together.
- Prefer `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` over `request.resource.data.keys().hasOnly([...])` on `update` rules. `keys()` inspects the *full resulting document*, not just the fields being written — if any Cloud Function writes a field via the Admin SDK that isn't in that allowlist (Admin SDK writes bypass rules and succeed regardless), every later client-side update to that document is permanently denied, even ones that never touch the new field. `diff().affectedKeys()` only constrains what the current write actually changes, so it stays correct as Admin SDK-written fields accumulate. (This exact pattern caused a real bug: `updateCompanyVerification` wrote `companyVerifiedBy`/`companyVerifiedAt`/`companyVerificationReason` via Admin SDK, and the `users/{userId}` update rule's `keys().hasOnly()` check then permanently locked verified/rejected company accounts out of editing their own profile. Fixed by dropping the `keys().hasOnly()` check and relying on the existing `diff().affectedKeys().hasOnly()` check.)
- When a Cloud Function writes fields to a document via the Admin SDK, check the matching client-side Firestore rule for that collection and confirm those fields either appear in its allowlist or that the rule uses `diff().affectedKeys()` rather than full-document `keys()`.
- `profileStatus` (`active`/`suspended`) gates all self-service profile edits: the `users/{userId}` update rule requires `resource.data.profileStatus == 'active'`, so a suspended profile can never write to its own document again. No code currently sets `profileStatus` to `suspended` — there is no admin "suspend user" callable yet. If asked to add account suspension, the rule-side gate already exists and is correct; the missing piece is an admin callable (following the `setAdminAccess`/`updateCompanyVerification` shape) plus an audit event, not a rules change.
- Audit event collections do not all share one lifecycle shape. `listingModerationEvents` and `companyVerificationEvents` are written once, inside the same Firestore transaction as the data change (see `moderateListing`, `updateCompanyVerification`). `adminAccessEvents` instead has a `status` field (`pending` → `applied`/`failed`) written in separate steps, because the paired action — `auth.setCustomUserClaims` — is a Firebase Auth Admin API call, not a Firestore write, and can't join a Firestore transaction. Don't assume a single audit-event pattern applies everywhere, and don't force a Firestore transaction around an Auth Admin SDK call.
- When changing listing image uploads, verify path, size, and MIME restrictions in `storage.rules`.
- Treat public Storage reads as intentional product decisions; call them out when touching listing images.
- Keep rejection/moderation/company-verification reasons length-limited and avoid storing sensitive private data in them.
- Avoid logging tokens, private user data, or full auth objects.
- Do not commit secrets, service account keys, `.env` values, API keys beyond intended public Firebase config, or production credentials.
- For new write-heavy or externally triggerable flows, consider abuse risk: repeated calls, storage growth, quota cost, email/SMS cost, and automated spam.
- Prefer deny-by-default rules and explicit allowlists over broad conditions.
- If a change affects security posture, state the risk, the enforcement layer, and the verification performed in the final response.
- Call out any security assumptions clearly.

## Review Checklist
- Authenticated? The operation rejects unauthenticated users when needed.
- Authorized? The user can only access their own object or an admin-approved object.
- Admin enforced server-side? Admin screens are backed by Cloud Functions or rules.
- Fields constrained? Protected fields cannot be changed through client writes or mass assignment.
- Data minimized? Sensitive profile/admin data is not returned unnecessarily.
- Rules aligned? Firestore/Storage rules match the client and function behavior.
- Audit preserved? Sensitive admin actions write audit events and clients cannot forge them.
- Logs safe? No tokens, credentials, private profile data, or full auth payloads are logged.
