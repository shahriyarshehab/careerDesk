# GitHub Copilot instructions for CareerDesk

## Project overview

CareerDesk is a zero-build, browser-first study and career-prep SPA. It runs as a set of plain HTML/CSS/JS modules in the browser, with optional Firebase sync for cloud backup and multi-device access.

Key entry points:
- `index.html` loads the app shell and includes `assets/css/master.css` and `assets/js/app/master.js`.
- `assets/js/app/master.js` loads the feature modules in dependency order, so most app work is coordinated through shared globals and initialization.
- `assets/js/core/core.js` owns the shared app state, storage adapter, default state, and the unified subject system (`masterSubjectList`, `canonicalSubjectName`, `renameSubject`, `syncAllSubjectSelects`).
- `assets/js/app/app.js` handles tab routing, modals, command palette, and app bootstrap.
- `routine.js`, `tracker.js`, `syllabus.js`, `mcq.js`, `notes.js`, `profile.js`, and related modules all operate on the same `state` object instead of separate stores.

Primary persistence lives in browser `localStorage` under `jobprep-dashboard-data-v2`; Firebase is optional and should never be treated as the source of truth for local app behavior.

## Build, test, and lint commands

This repo does not define a dedicated test or lint script in `package.json`.

Use these commands instead:
- `npm start` — serves the app with `node serve.js` at `http://localhost:3000`.
- `python -m http.server 8000` — lightweight alternative for local browser testing.
- `node --check assets/js/app/master.js` — syntax validation for the main entry file.
- `node --check assets/js/**/*.js` — closest equivalent to a project-wide JS validation pass.
- `node --check assets/js/<module>.js` — targeted validation while iterating on one module; in the reorganized tree, use the real relative path under `assets/js/`.
- `firebase login && firebase use careerdesk && firebase deploy` — only for optional Firebase deployment or sync work.

When there is no test/lint script, prefer syntax validation and a quick browser smoke test over adding new tooling.

## High-level architecture

This app is a single-page app built around shared state rather than framework components:
- UI and layout live in `index.html` and the CSS files under `assets/css/`.
- Each feature module is independent, but they all share one app state and must stay synchronized with the global subject model.
- `core.js` drives storage migration, default state, and subject normalization; changing a storage field or a subject rule can affect several modules at once.
- Subject names are treated as global identifiers across routine entries, tracker sessions, syllabus topics, flashcards, and quiz categories.
- The app is intentionally local-first and privacy-oriented: most work and historical data remain in the browser, while Firebase sync is additional backup/snapshot functionality.
- The visual system is cross-cutting: glassmorphism cards, segmented controls, and mobile floating dock patterns are shared across modules.

When making changes, think in terms of coordinated state updates. A rename, delete/restore, or localStorage schema change can require updates in multiple modules and UI controls.

## Important repo conventions

- Zero-build stack: keep it plain HTML/CSS/ES6+ JS; do not add framework tooling, bundlers, or TypeScript unless the repo explicitly adopts them.
- Local-first persistence: keep storage keys backward compatible and avoid overwriting user data. New state fields should get safe defaults in `getDefaultState()`.
- Standard numerals only: use `0-9` in timers, counts, dates, percentages, and stats. Bengali text is reserved for localized content and explanations, not generic counters.
- Unified subject control: use `masterSubjectList()`, `canonicalSubjectName()`, and `syncAllSubjectSelects()` for any subject-related change. Renames and delete/restore flows should cascade across routine, tracker, syllabus, flashcards, and quizzes.
- Preserve historical data: soft delete subjects instead of removing them from past records so old sessions and routine entries keep their meaning.
- Use the repo’s icon conventions: inline `ICON` SVG objects for JS-generated markup and `<i data-lucide="..."></i>` for static HTML.
- Keep mobile UI patterns intact: action button labels are hidden on small screens by default, but critical dropdown items must keep their text/icons visible. The project-specific exception is scoping span hiding to `.cat-group-btn span` instead of applying it globally.
- Read and write `localStorage` carefully: the core app state is `jobprep-dashboard-data-v2`, and auxiliary stores such as exams, mistake banks, and custom question banks are managed separately.
- Prefer surgical edits over broad rewrites; the app is intentionally split into feature modules and centralized state utilities.

## Where to start for repo-specific context

- `AGENTS.md` contains the deepest repository-specific architecture and conventions.
- `.cursorrules` reinforces the same project rules for editor-based workflows.
- `README.md` is the user-facing overview and local setup reference.
- `core.js` and `app.js` are foundational files before editing feature logic.

When a shared concept changes (subject names, timers, storage schema, or sync behavior), verify the dependent modules that consume it rather than patching only one UI surface.

