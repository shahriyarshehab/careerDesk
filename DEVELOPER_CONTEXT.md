# CareerDesk Developer Context

This file is a compact working knowledge base for future agent sessions. It captures the parts of the codebase that are easiest to miss and most likely to cause regressions if changed without context.

## Repository map

```text
careerDesk/
├── app shell & docs
│   ├── index.html
│   ├── README.md
│   ├── AGENTS.md
│   ├── DEVELOPER_CONTEXT.md
│   ├── SECURITY.md
│   ├── BUG_REPORT.md
│   ├── LICENSE
│   ├── package.json
│   └── serve.js
│
├── AI / editor guidance
│   ├── .cursorrules
│   ├── .github/
│   │   └── copilot-instructions.md
│   └── .gitignore
│
├── Firebase config
│   ├── firebase.json
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── .firebaserc
│   └── .firebase/
│
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── home.css
│   │   ├── routine.css
│   │   ├── tracker.css
│   │   ├── syllabus.css
│   │   ├── mcq.css
│   │   ├── notes.css
│   │   ├── profile.css
│   │   ├── quotes.css
│   │   ├── security.css
│   │   ├── modals.css
│   │   ├── groupchat.css
│   │   └── master.css
│   │
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
│   │   └── app.js (compatibility shim if needed)
│   │
│   ├── data/
│   │   ├── bcs-mcq-question-bank-1000.json
│   │   └── careerdesk-backup.json
│   │
│   ├── icons/
│   └── images/
│
├── .vscode/
│   └── settings.json
│
└── tmp/
    └── scratch/
```

## Recommended file naming pattern

For a cleaner and more maintainable repo, group files by responsibility instead of leaving everything flat in `assets/js/`.

```text
assets/
├── css/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── home.css
│   ├── routine.css
│   ├── tracker.css
│   ├── syllabus.css
│   ├── notes.css
│   ├── mcq.css
│   ├── profile.css
│   ├── quotes.css
│   ├── security.css
│   ├── modals.css
│   └── master.css
│
├── js/
│   ├── app/
│   │   ├── app.js
│   │   ├── master.js
│   │   └── init.js
│   ├── core/
│   │   ├── storage.js
│   │   ├── state.js
│   │   ├── subjects.js
│   │   ├── icons.js
│   │   └── utils.js
│   ├── features/
│   │   ├── routine.js
│   │   ├── tracker.js
│   │   ├── syllabus.js
│   │   ├── notes.js
│   │   ├── quotes.js
│   │   ├── countdown.js
│   │   ├── mcq.js
│   │   ├── profile.js
│   │   ├── home.js
│   │   ├── flashcards.js
│   │   ├── questions.js
│   │   └── groupchat.js
│   ├── integrations/
│   │   ├── firebase-config.js
│   │   ├── firebase-sync.js
│   │   └── security.js
│   └── lucide.min.js
│
├── data/
│   ├── bcs-mcq-question-bank-1000.json
│   └── careerdesk-backup.json
│
├── icons/
└── images/
```

Good naming rules:
- `core/` = shared system logic
- `features/` = user-facing feature modules
- `integrations/` = Firebase, sync, privacy, external systems
- `app/` = bootstrap and app shell logic
- file names should be direct and descriptive (`tracker.js`, `storage.js`, `subjects.js`), not vague or versioned (`misc.js`, `helper2.js`)
- CSS should match the feature name (`routine.css` ↔ `routine.js`)

This keeps the repo clean without changing the way the app behaves.

## First read order (recommended)

If you need the fastest path to understanding the project without reading everything:

1. `README.md` — user-facing overview and setup
2. `AGENTS.md` — repo-specific rules and architecture
3. `assets/js/core/core.js` — storage, defaults, and shared subject logic
4. `assets/js/app/app.js` — app bootstrap and routing
5. `assets/js/app/master.js` — script loading order
6. The feature module relevant to the task

This is the quickest route to “understand the codebase before changing anything.”

## 1) What this app is

CareerDesk is a no-build, browser-first study and exam-prep dashboard. It is structured as a collection of vanilla JS modules that all read/write the same app state and localStorage. The app is designed to run directly in a browser with optional Firebase sync for backup and multi-device support.

The core idea: everything is local-first, and most state lives in browser storage. Feature modules are not independent apps; they are UI surfaces over one shared state object.

## 2) Primary entry points

- `index.html` — app shell and page layout
- `assets/js/master.js` — script manifest; this file loads every feature module in order
- `assets/js/core.js` — central storage model, default state, utilities, and subject management
- `assets/js/app.js` — routing, startup, modal control, command palette, bootstrap

If you only read a few files to understand the app, read these first.

## 3) Core architectural pattern

This project is not a framework app. It is a single-page app with module-level scripts that share global state.

Important patterns:
- A single shared `state` object drives the app.
- `core.js` holds default state shape and migration-safe storage logic.
- Feature modules such as `routine.js`, `tracker.js`, `syllabus.js`, `mcq.js`, `notes.js`, and `profile.js` mutate the same object.
- Subject names are treated as globally synchronized identifiers.
- LocalStorage is the source of truth for normal use; Firebase is an optional sync layer.

## 4) Storage and persistence

Main storage key:
- `jobprep-dashboard-data-v2`

Other app keys include:
- `jobprep_exams_list`
- `jobprep_mistakes_list`
- `custom_bcs_questions_v3`
- `jobprep_mcq_progress_v2`
- `jobprep_break_minutes_today`
- `careerdesk_user_track_v2`
- `careerdesk-active-tab`

Rules:
- Keep localStorage keys backward compatible.
- Do not silently overwrite user data.
- Put new fields in `getDefaultState()` and migrate carefully.
- If a feature touches persistence, validate that it still works with old saved state.

## 5) Unified subject system is global

The most important cross-cutting rule in the repo is that subjects are shared across everything.

The subject system lives in `core.js` and includes:
- `masterSubjectList()`
- `canonicalSubjectName()`
- `renameSubject()`
- `syncAllSubjectSelects()`

These functions are used to keep all of the following aligned:
- routine entries
- tracker sessions
- syllabus categories/topics
- flashcard categories
- quiz categories
- subject manager UI
- deleted/restored subject state

If a subject is renamed or soft-deleted, the change must propagate everywhere. Do not patch only one module and assume the rest will catch up.

## 6) Default state shape and behavior

`getDefaultState()` defines the app's baseline structure. This is the safe default for new users and for migration logic.

Critical default areas:
- `routine`
- `notes`
- `sessions`
- `activeSession`
- `dailyTargetMinutes`
- `syllabus`
- `flashcards`
- `customSubjects`
- `deletedSubjects`
- `theme`
- `customQuotes`
- `userTrack`
- `syncMeta`

When adding a new feature, ask whether it needs a persisted field, a default value, or a migration path.

## 7) Major module responsibilities

### `assets/js/routine.js`
- Daily study routine views and date slider
- Add/edit/delete schedule blocks
- Daily schedule autosave
- Time-based planner for study sessions

### `assets/js/tracker.js`
- Focus timer and session tracking
- Daily targets and 24h activity logs
- Break tracking and consistency heatmaps
- Study session summaries

### `assets/js/syllabus.js`
- Curriculum/checklist categories and topics
- Progress tracking
- Subject/topic completion toggles
- Delete/edit flows for categories and topics

### `assets/js/mcq.js`
- MCQ practice engine
- Timed exam mode
- Mistake bank and review
- Custom question import and management

### `assets/js/notes.js`
- Notes board
- Search, pinning, and tags
- Simple note metadata and filtering

### `assets/js/profile.js`
- User profile / aspirant data
- Academic track selection
- Subject management and cloud sync UI

### `assets/js/quotes.js`
- Motivational quotes, carousel, quote management
- Optional wallpaper export behavior

### `assets/js/security.js`
- Privacy PIN and encrypted local data handling
- WebCrypto-based protection and integrity checks

### `assets/js/firebase-config.js` and `firebase-sync.js`
- Optional Firebase auth + Firestore sync
- These should not be treated as the primary storage layer during local work

## 8) UI conventions that matter

- No framework: plain HTML/CSS/JS
- Dark/light theme is controlled through app-level theme state
- Numerals should be standard English digits (`0-9`)
- `ICON` SVG objects are used for JS-generated UI; static HTML uses `<i data-lucide="..."></i>`
- Mobile behavior uses shared glassmorphism/button group patterns
- Action-button labels are often hidden on small screens, but important dropdown items must still keep text/icons visible

## 9) Important repo-specific rules

- Keep the app as a zero-build web app; do not add React/Vite/Webpack or TypeScript unless there is explicit repo adoption.
- Prefer surgical edits over refactors.
- Treat `core.js` and `app.js` as foundational files before patching feature modules.
- Any shared concept change (subject name rules, timer logic, storage schema, sync behavior) may require multiple modules to be checked.
- Preserve historical data; soft-delete rather than hard-delete where relevant.

## 10) Validation commands

This repo does not define a dedicated lint/test script in `package.json`, so use direct validation:

- `npm start` — local static server
- `python -m http.server 8000` — alternate local server
- `node --check assets/js/master.js`
- `node --check assets/js/*.js`
- `node --check assets/js/<module>.js`

This is the expected baseline validation path for JavaScript-only changes.

## 11) Common regression hotspots

These are the areas most likely to break when making changes:
- subject rename / delete / restore flows
- localStorage state migration
- timer and session tracking logic
- MCQ mistake bank and progress logic
- theme and UI state synchronization
- Firebase sync interactions that assume local state is valid

Before changing one of these, inspect the relevant dependent modules, not just the immediate file.

## 12) Good default reading order

For a new contributor or future agent, the best reading path is:
1. `README.md`
2. `AGENTS.md`
3. `core.js`
4. `app.js`
5. `master.js`
6. one feature module that matches the task

That gives the shortest path to understanding the project without reading every file.

## 13) Module dependency map

This app loads scripts in a specific order from `master.js`:

`lucide.min.js` -> `core.js` -> `routine.js` -> `quotes.js` -> `notes.js` -> `tracker.js` -> `countdown.js` -> `syllabus.js` -> `flashcards.js` -> `questions.js` -> `mcq.js` -> `security.js` -> `firebase-config.js` -> `firebase-sync.js` -> `profile.js` -> `home.js` -> `groupchat.js` -> `app.js`

What that means in practice:
- `core.js` is the foundation and defines shared utilities and storage state.
- most modules rely on `state`, `ICON`, `syncAllSubjectSelects()`, and storage helper functions.
- UI modules often render to the DOM and then attach handlers after app bootstrap.
- `app.js` is the last bootstrapping layer, so it often triggers initialization of other modules after all scripts are loaded.

If a feature depends on a function that appears to be undefined, check whether it is defined in `core.js` or loaded earlier in the script order.

## 14) Risky edit checklist

Before changing anything in this repo, verify these points:

- Does this code touch `state` or localStorage?
- Does it mutate a subject name or subject list?
- Does it render a list that other modules also read?
- Does it depend on app startup order or DOM readiness?
- Does it interact with Firebase or cloud sync state?
- Does it update a UI element that is also generated by another module?

If the answer is yes to any of the above, inspect the related modules before editing.

## 15) Common gotchas

### Subject rename/delete bugs
This is the biggest cross-module risk.
- Renaming a subject must cascade through routine, tracker, syllabus, flashcards, and quiz category structures.
- Removing a subject should not destroy historical session data.
- Soft-delete flows are preferred; hard removal can corrupt app history.

### localStorage migration bugs
New fields should be added with default values, and old saved data should still load.
- Never assume `state` has every new property.
- Do not overwrite legacy user data on startup.

### Startup timing bugs
Because scripts load in a defined order, some functions may rely on earlier initialization.
- `core.js` functions are often expected before feature modules render.
- `app.js` may start workflows after the rest of the app is already loaded.

### Cloud sync assumptions
Firebase is optional, but sync logic often assumes the same app state shape exists locally.
- Local state should remain consistent even when sync is off or failed.
- Do not treat cloud data as a reason to skip local validation.

### DOM rendering assumptions
Modules frequently rebuild interface elements on render and then rebind event handlers.
- If a change adds or removes a selector, consider whether another module re-renders that same area.

## 16) Debug workflow for fast diagnosis

When something breaks, use this order:

1. Check whether the failure is in app state or in rendering.
2. Confirm whether localStorage data is valid and has expected keys.
3. Verify the subject list and canonical subject names.
4. Check whether the issue is caused by startup order or script load timing.
5. Inspect the central helpers in `core.js` before changing one feature module.
6. Validate with `node --check assets/js/*.js` and a browser smoke test.

This tends to resolve most issues faster than reading every module in the repo.

## 17) Short memory summary

The short version for future agents:
- CareerDesk is a shared-state vanilla JS app.
- `core.js` is the root of truth.
- subjects are global and must stay in sync.
- localStorage is the main persistence layer.
- Firebase is optional and not the primary source of truth.
- validation is syntax-first until a browser smoke test is needed.

This file is the working brain for the project: keep it updated when architecture or conventions drift.
