# CareerDesk

CareerDesk is a browser-first study and career-preparation workspace. It combines study planning, focus tracking, exam practice, syllabus progress, flashcards, and optional cloud backup in a single-page application.

This README is the high-level project map for contributors and AI coding agents. Read it before making changes; consult `AGENTS.md` for detailed repository-specific rules and `.github/copilot-instructions.md` for the coding workflow.

## Project summary

| Area | Design |
| --- | --- |
| Runtime | Static HTML, CSS, and vanilla JavaScript |
| Browser entry | `index.html` |
| First-party runtime styles | `assets/dist/careerdesk.css` |
| First-party runtime scripts | `assets/dist/careerdesk.js` |
| Editable styles/scripts | Modular files under `assets/css/` and `assets/js/` |
| Bundle builder | `scripts/build.js`, using Node.js built-ins only |
| Persistence | Browser storage, local-first |
| Optional cloud | Firebase Authentication and Firestore |

The browser loads one first-party CSS bundle and one first-party app JavaScript bundle. Firebase's third-party compatibility SDKs remain separate external scripts. Source remains modular for safe maintenance. There is no framework, third-party bundler dependency, or runtime package dependency.

## Features

- Daily and monthly routine planning with autosave.
- Focus timer, session history, break tracking, daily targets, and dashboard summaries.
- MCQ practice, timed exam mode, question-bank filters, and mistake review.
- Flashcards and custom question-bank support.
- Syllabus topic tracking and unified subject management.
- Exam countdowns, quotes, profile settings, and theme controls.
- Optional Firebase authentication, cloud backup, and synchronization.

Question-bank data is loaded when needed by the quiz flow rather than embedded in the HTML shell.

## Runtime and source layout

```text
CareerDesk/
├── index.html
├── assets/
│   ├── css/                    # Editable modular stylesheet sources
│   ├── data/                   # Question banks and static data
│   ├── dist/
│   │   ├── careerdesk.css      # Generated runtime stylesheet; do not edit
│   │   └── careerdesk.js       # Generated runtime script; do not edit
│   ├── icons/                  # App icons
│   └── js/
│       ├── core.js             # Shared state, persistence, utilities, subjects
│       ├── app.js              # Application bootstrap and global interactions
│       ├── features/           # Routine, tracker, quiz, syllabus, dashboard, etc.
│       ├── integrations/       # Firebase configuration/sync and security
│       └── lucide.min.js       # Icon runtime
├── scripts/
│   └── build.js                # Ordered source manifests and bundle builder
├── test.js                     # Automated project checks
├── AGENTS.md                   # Detailed architecture and contributor guidance
├── .github/copilot-instructions.md
├── package.json
├── server.js                   # Local development server
├── firebase.json               # Optional Firebase Hosting configuration
├── firestore.rules             # Optional Firestore rules
├── firestore.indexes.json
├── SECURITY.md
├── BUG_REPORT.md
└── README.md
```

### Startup sequence

1. `index.html` loads the app shell, fonts, Firebase compatibility SDKs, and the two generated bundles.
2. `scripts/build.js` concatenates the CSS sources in the declared order. That order is intentional and controls the cascade.
3. The same build script concatenates JavaScript sources in dependency order. They are classic scripts sharing browser globals; the builder does not wrap them in modules or local scopes.
4. `assets/js/core.js` initializes shared state and helpers. Feature and integration scripts follow. `assets/js/app.js` runs last to bootstrap routing and global UI behavior.

Generated bundles include source-boundary comments to make them traceable. **Always edit the modular source files, then rebuild. Never make hand edits in `assets/dist/`.**

## Application architecture

### Shared state and local persistence

`assets/js/core.js` owns the global app state, safe defaults, storage adapter, migration logic, shared utilities, and subject system. The primary browser storage key is:

```text
jobprep-dashboard-data-v2
```

Core state includes:

- Routine records (`date`, start/end time, subject, task).
- Focus sessions and the currently active session.
- Daily study target.
- Syllabus categories and topic completion.
- Flashcards and their categories.
- Custom and soft-deleted subjects.
- Theme and quote preferences/customization.

`getDefaultState()` must provide defaults for new fields. Migrations must preserve existing user data and storage keys must remain backward-compatible.

Additional local-storage keys:

| Key | Purpose |
| --- | --- |
| `jobprep_exams_list` | Exam countdown targets |
| `jobprep_mistakes_bank_v2` | Saved mistakes for targeted review |
| `custom_bcs_questions_v3` | User-curated or imported questions |
| `jobprep_break_minutes_today` | Break minutes for the current day |

### Unified subjects

Subjects are shared identifiers across routines, tracker sessions, syllabus, flashcards, and quizzes. Use the shared helpers in `assets/js/core.js`:

- `masterSubjectList(includeDeleted)` gathers the unified subject list.
- `canonicalSubjectName(name)` normalizes aliases and casing.
- `renameSubject(oldName, newName)` updates all dependent state collections.
- `syncAllSubjectSelects()` refreshes subject controls.

Deleting a subject should soft-delete it so historical records remain meaningful. Any change to subject behavior must keep all consuming modules synchronized.

### Feature and integration modules

- `assets/js/features/routine.js` — planning and routine views.
- `assets/js/features/tracker.js` — focus timer, sessions, and tracking UI.
- `assets/js/features/mcq.js` — quiz/exam experience and question-bank interactions.
- `assets/js/features/syllabus.js` — syllabus and topic progress.
- `assets/js/features/countdown.js` — exam target dates.
- `assets/js/features/quotes.js` — quote display and management.
- `assets/js/features/profile.js` and `desk-hero.js` — profile and desk surfaces.
- `assets/js/features/dashboard.js` and `home.js` — dashboard content and summaries.
- `assets/js/features/navigation.js` — tab routing.
- `assets/js/integrations/` — optional Firebase and client-side security.

All feature modules operate on shared app state; avoid introducing separate persistence stores for existing concepts.

## Bundle maintenance

The source file lists and their order live in `scripts/build.js`. When adding, removing, or reordering a module, update that manifest deliberately. Preserve JavaScript ordering because modules depend on globals initialized by earlier files. Preserve CSS ordering because later styles are intentional overrides.

Build both runtime files with:

```bash
npm run build
```

The build:

- checks that every listed source exists;
- adds comments naming each source file;
- writes `assets/dist/careerdesk.css` and `assets/dist/careerdesk.js`;
- rejects invalid concatenated JavaScript syntax before updating the bundles.

Commit or deploy the generated bundle files along with source changes so static hosting has the runtime assets. No dependency installation is required.

## Development and validation

Requirements: Node.js for the build/test scripts; a browser for interactive testing.

```bash
npm run build
npm test
npm start
```

`npm test` rebuilds the bundles and validates JavaScript syntax, bundle/source coverage, required HTML anchors, question-bank schema, core-state defaults, and shared UI classes. `npm start` serves the app at `http://localhost:3000`. For a minimal alternative:

```bash
python -m http.server 8000
```

Use a local server rather than `file://` for browser APIs and data-file loading. For UI, responsive, or timer changes, smoke-test the relevant flow in a browser in addition to automated checks.

## Privacy and Firebase

CareerDesk is local-first: ordinary use stores data in the browser. Firebase is an optional backup and synchronization layer, not a prerequisite for local functionality. Firebase configuration and sync behavior live under `assets/js/integrations/`; deployment configuration is in `firebase.json`, `firestore.rules`, and `firestore.indexes.json`.

Do not commit Firebase credentials, private keys, or other secrets. Deploy cloud resources only when intentionally changing Firebase behavior.

## Instructions for contributors and AI agents

1. Read this README and `AGENTS.md` before changing architecture or shared state.
2. Edit modular source files, not generated bundles; run `npm run build` after source changes.
3. Keep the existing browser-native runtime and avoid adding frameworks or runtime dependencies.
4. Treat local storage as the source of truth for local behavior; preserve existing user data and schema compatibility.
5. Use the shared subject helpers for subject changes and preserve soft-delete/history behavior.
6. Use standard English digits (`0-9`) for timers, dates, counters, percentages, and statistics.
7. Use `ICON` SVG values in JavaScript-generated markup and `<i data-lucide="...">` in static HTML.
8. Keep mobile navigation, accessibility labels, theme support, and responsive behaviors intact.
9. Run `npm test`; browser-test visual or interactive changes.
10. Avoid deleting source, data, icon, or configuration files unless they are demonstrably unused.

For detailed design conventions, storage schemas, and cross-module rules, see `AGENTS.md`. For security-specific expectations, see `SECURITY.md`.

## License

MIT. See `LICENSE`.
