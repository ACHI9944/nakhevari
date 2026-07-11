# Admin moderation setup

The admin UI is available at `/admin`. Access is controlled by the Firebase Auth
custom claim `admin: true`; the `role` field in a Firestore user profile does not
grant administrator access.

## Deploy

Cloud Functions require the Firebase project to use the Blaze plan. From the
project root, deploy the backend, rules, and frontend together:

```sh
firebase deploy --only functions,firestore:rules,hosting
```

## Grant the first admin

Find the user's UID in Firebase Authentication. Use Application Default
Credentials or a service-account key that is stored outside this repository:

```sh
cd functions
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json \
  node scripts/set-admin.js FIREBASE_USER_UID
```

The script preserves existing custom claims. After the claim is granted, the user
must sign out and sign in again so Firebase issues a fresh ID token.

Never commit a service-account key to the repository.

## Moderation workflow

Only `pending` listings can be changed to `published` or `rejected`. Rejections
require a reason. Every successful action creates an immutable document in
`listingModerationEvents`; client applications cannot create or modify those
events directly.
