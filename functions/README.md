# Backend Functions

This folder is the Firebase Cloud Functions backend for the app.

## Structure

```txt
functions/
  index.js                 Public exports used by Firebase
  lib/                     Shared backend helpers
    auth.js                Admin/auth checks
    config.js              Shared backend constants
    firebase.js            Firebase Admin SDK setup
  admins/                  Admin management functions
  companies/               Company verification functions
  listings/                Listing moderation functions
  users/                   User/profile admin functions
  scripts/                 Local maintenance scripts
```

## How Calls Work

The frontend calls a function by the name exported from `index.js`.

```js
exports.setAdminAccess = setAdminAccess
```

Frontend:

```js
httpsCallable(functions, 'setAdminAccess')
```

The file path does not define the public name. The export in `index.js` does.

## Adding A Function

1. Pick the domain folder, such as `listings/` or `admins/`.
2. Create a file named after the action, for example `archiveListing.js`.
3. Use shared helpers from `lib/` for Firebase, config, and permissions.
4. Export the callable from `functions/index.js`.
5. Add a frontend wrapper in `src/services/` instead of calling it directly from screens.

## Guidelines

- Keep `index.js` as a short export list.
- Keep business logic inside domain folders.
- Put repeated setup and permission checks in `lib/`.
- Do admin-only permission checks inside backend functions, not only in the UI.
- Write audit events for sensitive admin actions.
