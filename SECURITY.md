# Security Policy

## Supported versions

Security fixes are targeted at the latest version on the `main` branch. Older deployments may require manual updates and Firebase Console changes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner through GitHub's private vulnerability reporting feature, if enabled. If private reporting is unavailable, contact the maintainer through a verified contact channel rather than publishing exploit details in an issue.

Include:
- affected file, feature, or deployment;
- steps to reproduce and expected versus actual behavior;
- potential impact and any safe proof-of-concept details.

Do not include real user emails, passwords, access tokens, service-account keys, or private study data in a report.

## Response expectations

The maintainer should acknowledge a report within 7 calendar days and provide an initial assessment or next-step update within 14 calendar days where reasonably possible. Timelines may vary with severity and reproduction needs.

## Secret handling

Never commit Firebase service-account credentials or registered App Check debug tokens. If a credential or debug token is exposed, revoke or rotate it in the provider console and review relevant access logs. Firebase client configuration values are not substitutes for Firestore Security Rules or App Check enforcement.
