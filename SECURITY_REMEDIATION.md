# CareerDesk Security Remediation — 2026-10-22

This branch contains source-level hardening changes from the code audit. It has not been deployed and has not been tested against the live Firebase project.

## Changes in this branch

- Removed the App Check debug token from the checked-in Firebase config.
- Removed the hard-coded fallback debug token. Local development now asks the Firebase SDK to generate a debug token; register it privately in Firebase Console only when needed.
- Removed the production-hosting code path that deliberately skipped App Check initialization. Verify the reCAPTCHA Enterprise site key and test the production deployment before enabling enforcement.
- Stopped retaining an email-verification password in module-level JavaScript state.
- Hardened Notes rendering against absent DOM containers and invalid timestamps, escaped note IDs in generated attributes, and used the resolved grid element consistently.

## Required Firebase Console work (not performed by this repository change)

1. In Firebase Console → App Check → Apps, inspect registered debug tokens. Revoke any token that was exposed in source control, then register a fresh local-only token if required. Firebase's official guidance says debug tokens must not be committed and exposed tokens should be deleted.
2. Confirm the production reCAPTCHA Enterprise provider/site key is correctly configured. Review App Check metrics before enabling enforcement to avoid locking out legitimate clients.
3. Review the `usernames` collection and current `firestore.rules`. The current app resolves a username to an email before Firebase Authentication, while the registry document stores email and UID. Simply denying unauthenticated reads would break username-based sign-in. Before tightening this rule, migrate username-to-email resolution to a trusted server endpoint (for example, a callable Cloud Function) and change public registry documents to contain no email address. Then change rules to deny unauthenticated reads and add emulator tests for both authenticated and unauthenticated access.

## Validation still required

- Run JavaScript syntax checks and browser smoke tests for Notes, email verification, sign-in, and cloud sync.
- Run Firestore Rules unit tests with the Firebase Emulator Suite.
- Test backup restore and local/cloud conflict cases with representative data.
- Confirm App Check initialization works on the actual production hostname before deploying.
