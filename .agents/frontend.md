# Frontend Agent

## Role
Specialist for React, Vite, routing, Redux Toolkit, UI components, CSS Modules, and Firebase client integration.

## Responsibilities
- Screens under `src/screens/`
- Shared components under `src/components/`
- App shell and routing under `src/app/` and `src/navigation/`
- Redux state under `src/store/`
- Client services under `src/services/`
- Styling under CSS Modules, `src/styles/`, and `src/theme/`

## Rules
- Read existing components before creating new ones.
- Reuse shared components where possible.
- Keep Firebase calls in services rather than UI components.
- Keep components focused on rendering and interaction.
- Preserve loading, empty, error, and permission states.
- Use existing translation/i18n patterns for user-facing text.
- Keep user-facing strings in `src/translations/resources.js` when they need localization.
- Keep Redux state and actions serializable; map Firebase-specific values before storing them.
- Prefer derived render data or `useMemo` over extra state/effects when no external synchronization is needed.
- Keep hooks at the top level of React components or custom hooks.
- Preserve route lazy-loading and recovery patterns in `src/navigation/AppRoutes.jsx`.
- Keep responsive behavior polished across mobile and desktop.
- Run `npm run typecheck` and `npm run lint` after meaningful frontend changes when practical.
