# CareerDesk — Deployment Build

The `main` branch contains the static, built version of CareerDesk:

- `index.html` — app shell.
- `assets/dist/careerdesk.css` — compiled first-party styles.
- `assets/dist/careerdesk.js` — compiled first-party application scripts.
- `assets/data/` and `assets/icons/` — runtime data and static assets.

The editable source, build script, tests, and full project documentation are on the [`source`](https://github.com/shahriyarshehab/careerDesk/tree/source) branch. Make changes there; do not edit the generated bundles manually.

Firebase's compatibility SDKs are loaded from Google's CDN. Firebase Hosting and Firestore deployment configuration is retained in this branch.

This deployment is static and can be served from the repository root or deployed with the included Firebase configuration.
