# CareerDesk

CareerDesk is a no-build, browser-first study and exam-prep dashboard for focused learning, tracking, and competitive exam preparation. It keeps everything local-first, syncs with Firebase only when needed, and runs directly in the browser without a framework or build step.

## Why CareerDesk

CareerDesk combines the tools a serious aspirant needs in one place:

- Daily study routine with date-based planning and autosave
- Focus timer and study tracking
- MCQ practice and timed exam mode
- Syllabus tracking and topic progress
- Smart notes and reflection journal
- Flashcards and review flows
- Exam countdowns and target planning
- Optional Firebase cloud backup and sync

## Core idea

This project is built as a single-page app with shared state rather than independent framework components. Most logic runs from a central state model in `assets/js/core/core.js`, while feature modules share the same app data and subject system.

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
- Target exam countdowns

### Knowledge management

- Notes and pinned study content
- Reflection journal entries
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
├── index.html
├── README.md
├── AGENTS.md
├── DEVELOPER_CONTEXT.md
├── .cursorrules
├── .github/
│   └── copilot-instructions.md
├── package.json
├── serve.js
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
├── .gitignore
├── LICENSE
├── SECURITY.md
├── BUG_REPORT.md
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── home.css
│   │   ├── routine.css
│   │   ├── tracker.css
│   │   ├── syllabus.css
│   │   ├── notes.css
│   │   ├── mcq.css
│   │   ├── profile.css
│   │   ├── quotes.css
│   │   ├── security.css
│   │   ├── modals.css
│   │   ├── groupchat.css
│   │   └── master.css
│   ├── js/
│   │   ├── app/
│   │   │   ├── app.js
│   │   │   └── master.js
│   │   ├── core/
│   │   │   └── core.js
│   │   ├── features/
│   │   │   ├── routine.js
│   │   │   ├── tracker.js
│   │   │   ├── syllabus.js
│   │   │   ├── mcq.js
│   │   │   ├── notes.js
│   │   │   ├── quotes.js
│   │   │   ├── countdown.js
│   │   │   ├── profile.js
│   │   │   ├── home.js
│   │   │   ├── flashcards.js
│   │   │   ├── questions.js
│   │   │   └── groupchat.js
│   │   ├── integrations/
│   │   │   ├── firebase-config.js
│   │   │   ├── firebase-sync.js
│   │   │   └── security.js
│   │   ├── lucide.min.js
│   │   └── app.js
│   ├── data/
│   │   ├── bcs-mcq-question-bank-1000.json
│   │   └── careerdesk-backup.json
│   ├── icons/
│   └── images/
└── .vscode/
    └── settings.json
```

## Getting started

### Option 1: quick run locally

```bash
cd careerDesk
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: use the project server script

```bash
cd careerDesk
npm start
```

This runs the local static server defined in `serve.js`.

### Option 3: open directly in a browser

Open `index.html` directly in a browser. The app is designed to work as a static web app without a build step.

## Validation commands

This repository does not define a dedicated test script. The practical project-level checks are:

```bash
node --check assets/js/app/master.js
node --check assets/js/**/*.js
```

When iterating on a single file, target just that file:

```bash
node --check assets/js/features/tracker.js
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

## Important files to know

- `index.html` — app shell and entry page
- `assets/js/app/master.js` — script loading order
- `assets/js/core/core.js` — shared storage, state defaults, and global utilities
- `assets/js/app/app.js` — app bootstrap, tab/router setup, command palette
- `assets/js/features/*.js` — feature-specific modules
- `assets/js/integrations/*.js` — Firebase and security logic

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Contributing

This project is intentionally simple and browser-first. Prefer small, surgical changes and validate them with syntax checks and a quick browser smoke test before finalizing.
