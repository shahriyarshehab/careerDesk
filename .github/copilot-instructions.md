# GitHub Copilot instructions for CareerDesk

## Project overview

CareerDesk is a no-build, browser-first study and career-prep SPA. The app is intentionally structured as a set of plain HTML/CSS/JS modules that run directly in the browser, with optional Firebase sync for cloud backup and multi-device access.

Key entry points:
- `index.html` loads the app shell and includes `assets/css/master.css` and `assets/js/master.js`.
- `assets/js/master.js` bootstraps the app by loading the feature modules.
- `assets/js/core.js` owns the shared state model, localStorage adapter, and the unified subject-managing utilities (`masterSubjectList`, `canonicalSubjectName`, `renameSubject`, `syncAllSubjectSelects`).
- `assets/js/app.js` handles the tab router, command palette, and startup flow.
- The rest of the modules (`routine.js`, `tracker.js`, `syllabus.js`, `mcq.js`, `notes.js`, `profile.js`, etc.) operate on the same app state and should stay synchronized with the centralized subject system.

The app persists all primary study data in browser `localStorage` using the key `jobprep-dashboard-data-v2`, with Firebase only as an optional sync layer.

## Build, test, and validation commands

This repo does not define a dedicated test or lint script in `package.json`.

Use these commands instead:
- `npm start` — starts the local static server (`node serve.js`) on `http://localhost:3000`.
- `python -m http.server 8000` — alternate static-server option for quick local testing.
- `node --check assets/js/master.js` — quick syntax validation for the main entry script.
- `node --check assets/js/*.js` — validate all JavaScript files in the app; this is the closest equivalent to a project-wide syntax check.
- `node --check assets/js/<module>.js` — runs a single-file validation for a specific module while iterating on one piece of code.

If you need to deploy the optional Firebase setup, use the standard Firebase workflow described in the repo docs:
- `firebase login`
- `firebase use careerdesk`
- `firebase deploy`

## High-level architecture

This repository is organized around a single-page app, not a framework app:

- UI and layout live in `index.html` plus the CSS files under `assets/css/`.
- Each feature has a separate JS module, but they all share a single app state rather than independent stores.
- The central data model is driven by `core.js`, which initializes defaults and preserves backward compatibility when reading older `localStorage` values.
- Subject management is intentionally global: every subject, rename, or soft-delete must propagate across routine entries, tracker sessions, syllabus topics, flashcard categories, and quiz categories.
- The app is local-first and privacy-focused: most data remains in the browser, while Firebase sync handles optional cloud backups and snapshots.
- The design system is cross-cutting: several CSS files define shared glassmorphism patterns and action-group/button styles, and mobile behavior is intentionally tuned for a floating dock layout.

When making changes, treat the app as a coordinated state machine where UI modules and persistence are tightly coupled. A subject rename, storage schema update, or tab-state change can affect multiple modules at once.

## Key conventions specific to this codebase

- Zero-build stack: do not introduce frameworks, bundlers, TypeScript, or extra package tooling unless the repo explicitly adds them.
- Local-first persistence: keep `localStorage` keys backward compatible; new state fields should have safe defaults in the app's default-state initializer.
- English-Arabic numerals only: use `0-9` digits in clocks, stats, timers, countdowns, badges, and percentages. Bengali text is reserved for language-specific content and explanations, not UI counters.
- Unified subject control: use `masterSubjectList()`, `canonicalSubjectName()`, and `syncAllSubjectSelects()` for any subject-related change. Renames and delete/restore flows must cascade across the full app.
- Preserve historical data: soft delete subjects rather than removing them from past records; this keeps old sessions and routine history intact.
- Use the app's icon conventions: inline `ICON` SVG objects for dynamically generated HTML; use `<i data-lucide="..."></i>` in static markup.
- Keep CSS/mobile behavior consistent with the project patterns: on small screens, action-button labels are hidden in grouped controls by default, but critical dropdown items must retain text and icons. The project-specific exception is to scope span hiding to `.cat-group-btn span` rather than globally affecting all button groups.
- Read/write localStorage carefully: app data is stored under `jobprep-dashboard-data-v2`, and auxiliary keys such as exam targets, mistake banks, and custom question banks are managed separately.
- Prefer patching the existing module structure over broad rewrites; this app is intentionally split by feature and keeps shared logic centralized.

## Practical guidance for Copilot sessions

- Start from `AGENTS.md` when you need repo-specific architectural context; it contains the most complete conventions for this codebase.
- Treat `core.js` and `app.js` as foundational files before editing module-specific logic.
- When you change a shared concept (subject names, state fields, timer logic, or cloud sync behavior), verify all dependent modules that consume it.
- Keep UI behavior consistent with the Aurora glassmorphism design system and the repo’s existing segmented/action-button patterns.
- If a feature interacts with persistence, validate that it does not corrupt existing user data or break migration assumptions.

## Repo-specific references

- `README.md` contains the end-user overview and local setup guidance.
- `AGENTS.md` contains the detailed architecture and coding rules for AI contributors.
- `.cursorrules` captures the same conventions for editor-specific agent behavior.
- `package.json` defines the current runtime entry points and contains no dedicated test/lint command set.

