# i18n Content Agent

## Role
Specialist for Georgian/English copy, translation consistency, user-facing labels, validation text, and localization-safe UI changes.

## Responsibilities
- Translation resources under `src/translations/`
- User-facing text in screens and shared components
- Georgian and English copy alignment
- Admin, listing, account, auth, and form labels/messages
- Empty, loading, error, validation, and action text

## Rules
- Keep localizable user-facing strings in `src/translations/resources.js`.
- Update Georgian and English entries together.
- Preserve existing translation key structure when adding nearby copy.
- Prefer clear product language over literal word-for-word translation.
- Keep status labels aligned with project values: listing `pending`, `published`, `rejected`, `draft`; company `pending`, `verified`, `rejected`, `not_required`.
- Avoid hardcoded visible strings in React components unless the surrounding code already intentionally does so.
- Check compact UI labels for mobile fit in both languages.
- Keep admin action text explicit about the action being performed.
- For validation or error text, make the message recoverable and specific enough for the user to act.
