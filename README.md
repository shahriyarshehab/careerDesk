# CareerDesk

CareerDesk is a no-build, browser-first study and exam-prep dashboard for focused learning, tracking, and competitive exam preparation. It keeps everything local-first, syncs with Firebase only when needed, and runs directly in the browser without a framework or build step.

## Why CareerDesk

CareerDesk combines the tools a serious aspirant needs in one place:

- Daily study routine with date-based planning and autosave
- Focus timer and study tracking
- MCQ practice and timed exam mode
- Syllabus tracking and topic progress
- Flashcards and review flows
- Exam countdowns and target planning
- Optional Firebase cloud backup and sync

## Core idea

This project is built as a single-page app with shared state rather than independent framework components. Most logic runs from a central state model in `assets/js/core.js`, while feature modules share the same app data and subject system.

The app is intentionally local-first and privacy-aware:

- primary data is stored in browser localStorage
- Firebase is optional and acts as a sync/backup layer
- subject changes are global across routine, tracker, syllabus, quizzes, and flashcards

## Features

### Study workflow

- Daily and monthly routine views
- Auto-saved schedule entries
- Session timer with break tracking
- Daily goal tracking and consistency metrics
- Subject-based study organization

### Exam preparation

- BCS-style MCQ practice
- Timed exam mode with scoring logic
- Mistake bank and revision flow
- Question pool and custom import support
- The bundled 1,000-question bank loads only when the Quiz tab is opened.
- Target exam countdowns

### Knowledge management

- Flashcard-based review
- Unified subject manager and soft-delete behavior

### Privacy and sync

- Local-first storage with backward-compatible migration logic
- Optional Firebase auth + Firestore sync
- Cloud snapshot and backup support
- User data isolation and clear sync boundaries

## Tech stack

- HTML5
- CSS3 with custom design tokens and glassmorphism styling
- Vanilla JavaScript (ES6+)
- Firebase (optional cloud sync/auth)
- Browser localStorage for primary data persistence

No Node build tooling, bundler, or framework is required for normal use.

## Project structure

```text
careerDesk/
├── index.html                     # SPA shell and page panels
├── assets/
│   ├── css/                       # Base, shared components, feature styles, master manifest
│   ├── data/                      # Bundled question banks and sample data
│   ├── icons/                     # App icon assets
│   └── js/
│       ├── master.js              # Ordered module loader
│       ├── core.js                # Shared state, storage, subjects, utilities
│       ├── app.js                 # Bootstrap, routing, modals, global UI
│       ├── features/              # Dashboard, routine, tracker, MCQ, syllabus, etc.
│       ├── integrations/          # Firebase sync/configuration and security
│       └── lucide.min.js          # Bundled icon library
├── .github/
│   └── copilot-instructions.md
├── AGENTS.md                      # Contributor and agent architecture guide
├── .cursorrules                   # Editor guidance
├── package.json                   # Local static-server command
├── serve.js                       # Zero-build development server
├── firebase.json                  # Optional hosting configuration
├── firestore.rules                # Optional cloud database rules
├── firestore.indexes.json         # Optional cloud database indexes
├── .firebaserc                    # Firebase project alias
├── SECURITY.md
├── BUG_REPORT.md
├── LICENSE
└── README.md
```

## Getting started

### Option 1: recommended local server

```bash
npm start
```

Open `http://localhost:3000`. This uses the repository's lightweight static server.

### Option 2: Python static server

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. A local server is recommended for browser APIs and data-file loading.

## Validation commands

This repository does not define a dedicated test or lint script. The practical project-level checks are:

```bash
node --check assets/js/master.js
node --check assets/js/core.js
node --check assets/js/app.js
```

When iterating on a single file, target just that file:

```bash
node --check assets/js/features/tracker.js
```

To validate all application JavaScript modules in PowerShell:

```powershell
Get-ChildItem assets\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Firebase setup (optional)

If you want to enable the optional cloud sync layer:

```bash
firebase login
firebase use careerdesk
firebase deploy
```

## Key conventions

This project has a few important repository-specific conventions:

- localStorage is the primary persistence layer
- subject names are global and must stay synchronized across modules
- rename and delete flows should preserve historical data and avoid hard-deletes where possible
- use the shared `core` helpers and avoid duplicating subject logic
- keep the app zero-build and browser-native
- use standard English digits for UI counters, timers, and percentages

## Application modules

`index.html` loads the CSS manifest and JavaScript manifest. `assets/js/master.js` loads the browser modules in dependency order:

- `core.js` initializes shared state, local persistence, common helpers, and the unified subject system.
- `app.js` initializes the application shell, shared dialogs, and keyboard shortcuts; `features/navigation.js` owns tab routing.
- `features/` contains dashboard, routine, focus tracker, syllabus, MCQ, profile, countdown, quotes, group-chat, and navigation modules.
- `integrations/` contains optional Firebase sync and configuration plus client-side security features.

The main application state is stored locally under `jobprep-dashboard-data-v2`. Firebase sync is optional and should not be required for normal local use.

## Important files to know

- `index.html` — app shell and entry page
- `assets/js/master.js` — script loading order
- `assets/js/core.js` — shared storage, state defaults, and global utilities
- `assets/js/app.js` — app bootstrap, tab/router setup, command palette
- `assets/js/features/` — feature modules for the dashboard, study tools, and exam preparation
- `assets/js/integrations/` — Firebase sync/configuration and security logic

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Contributing

This project is intentionally simple and browser-first. Prefer small, surgical changes and validate them with syntax checks and a quick browser smoke test before finalizing.
