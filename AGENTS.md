# 🤖 AGENTS.md — CareerDesk AI Developer & Agent Guide

Welcome, AI coding assistant. This file contains the complete architectural blueprint, data schemas, design system rules, and engineering conventions for **CareerDesk**. Whenever you are working on this codebase, adhere strictly to these principles.

---

## 🎯 1. Project Philosophy & Core Constraints

1. **Zero-Dependency Native Web Stack:**
   - **No build tools, bundlers, or compilation steps** (No Webpack, Vite, React, Vue, TypeScript, or Babel).
   - Standard semantic **HTML5**, modern **Vanilla CSS3** (Custom Properties, Flexbox, Grid, Glassmorphism), and modern **Vanilla JavaScript** (ES6+).
   - Any modern browser can open `index.html` directly from the filesystem or via a simple static file server.
2. **100% Client-Side Privacy:**
   - No external database or backend server. All state is persisted locally via browser `localStorage` with an adapter fallback mechanism and optional File System Access API disk sync.
3. **Numerals & Localization Convention:**
   - **Always use standard English Arabic digits (`0-9`)** for all timer clocks, countdowns, statistics, dates, percentages, and counter badges.
   - Bengali script is strictly reserved for quotes, Bengali language subject names (e.g., *বাংলা সাহিত্য*, *বাংলা ব্যাকরণ*), and question explanations.
4. **Data Integrity & Backward Compatibility:**
   - When introducing new state fields, always provide safe defaults in `getDefaultState()` and ensure existing user data in `localStorage` is never overwritten, reset, or corrupted.

---

## 📁 2. Codebase Structure & File Responsibilities

```text
CareerDesk/
├── index.html              # Main application single-page layout & UI panels
├── assets/
│   ├── css/
│   │   ├── base.css        # Theme variables, reset, typography, header, mobile dock navbar
│   │   ├── components.css  # Universal .btn-group, .action-group, .segmented-group, .micro-btn
│   │   ├── home.css        # Daily Study Routine hero card, date slider, and monthly view styling
│   │   ├── routine.css     # Routine tables, calendar date slider, monthly schedule
│   │   ├── quotes.css      # Motivation ticker, wallpaper generator, quotes manager
│   │   ├── notes.css       # Quick notes grid, cards, pinning, search filtering
│   │   ├── tracker.css     # Timers, 24h activity log, consistency heatmap, onboarding
│   │   ├── countdown.css   # Target exam countdown cards engine
│   │   ├── syllabus.css    # Curriculum categories, topic checklist, progress bars
│   │   ├── mcq.css         # BCS MCQ engine, options, floating points, mistake bank
│   │   ├── profile.css     # User profile card, academic track, subject manager & cloud sync
│   │   ├── security.css    # PIN lock screen overlay, tamper indicators & crypto modal styling
│   │   ├── modals.css      # Command Palette (Ctrl+K), generic modals & dialogs
│   │   └── master.css      # Master stylesheet project manifest (only CSS linked by index.html)
│   ├── data/
│   │   ├── bcs-mcq-question-bank-1000.json # Complete 1,000 authentic BCS questions dataset
│   │   └── careerdesk-backup.json          # Complete sample backup schema package
│   ├── js/
│   │   ├── master.js       # Master JavaScript project file & loader (only script linked by index.html)
│   │   ├── core.js         # Master subject control, data schema, localStorage adapter & utilities
│   │   ├── routine.js      # Routine schedules, date slider, day-by-day & monthly views
│   │   ├── quotes.js       # Quote ticker, carousel, quotes manager & canvas wallpaper export
│   │   ├── notes.js        # Quick notes, categorization tags, pinning & search
│   │   ├── tracker.js      # Focus timer, 24h activity break tracker, heatmap & goals
│   │   ├── countdown.js    # Target exam countdown timers engine
│   │   ├── syllabus.js     # Category & topic progress tracking, inline edit & delete mode
│   │   ├── questions.js    # Curated question banks and BCS question pool
│   │   ├── mcq.js          # MCQ practice engine, 20-Q exam mode, sound, mistake bank & custom question manager
│   │   ├── security.js     # Privacy PIN lock, WebCrypto AES-GCM encryption & data integrity checks
│   │   ├── profile.js      # Profile track manager, Bangladesh class curriculum, subjects & cloud backups
│   │   ├── home.js         # Routine and profile aspirant metrics hub
│   │   ├── app.js          # Theme, fullscreen, modals, tabs router, command palette & init
│   │   ├── firebase-config.js # Client-side Firebase configuration
│   │   ├── firebase-sync.js # Cloud authentication & Firestore real-time sync
│   │   └── lucide.min.js   # Embedded Lucide icons library
│   └── icons/              # Curated SVG icon assets and preview showcase gallery
├── AGENTS.md               # AI Agent architecture and conventions guide (this file)
├── .cursorrules            # Cursor AI agent instructions
├── .github/
│   └── copilot-instructions.md # GitHub Copilot custom instructions
└── README.md               # End-user documentation
```

### Key File Roles:
- **`index.html`**: Semantic single-page layout. Links **only** `assets/css/master.css` in head and `assets/js/master.js` at body end.
- **`assets/css/master.css`**: Master Stylesheet Project File. Uses `@import` to load all modular CSS stylesheets.
- **`assets/js/master.js`**: Master JavaScript Project File. Central manifest that synchronously loads all modular JS engines.
- **`assets/js/core.js`**: Central storage adapter, state initialization (`getDefaultState`), global utilities (`escapeHtml`, `escapeAttr`, `toBnDigits`, `dateKey`), and the Unified Subject Control System (`masterSubjectList`, `canonicalSubjectName`, `renameSubject`, `syncAllSubjectSelects`).
- **`assets/js/routine.js`**: Manages day-by-day and monthly routine views, calendar sliders, task editing, and time blocks.
- **`assets/js/quotes.js`**: Handles motivational quote rotations, the quote manager, interval carousels, and 1920x1080 canvas wallpaper generation.
- **`assets/js/notes.js`**: Manages user study notes with tags, full-text search, and pinning.
- **`assets/js/tracker.js`**: Real-time study timer, 24h break logs, activity heatmap, and target hours.
- **`assets/js/countdown.js`**: Target exam countdown cards, date differentials, and exam target creation.
- **`assets/js/syllabus.js`**: Interactive curriculum tracking, progress bars, topic completion toggles, and deletion modes.
- **`assets/js/flashcards.js`**: Backward-compatible stubs for legacy flashcard references.
- **`assets/js/questions.js`**: Dedicated static repository containing default questions, AI-curated pool, and extended BCS question pools.
- **`assets/js/mcq.js`**: Real-time MCQ quiz practice engine, 20-question timed exam mode, audio sound effects, mistake bank remediation, custom question creation, and JSON question import/export.
- **`assets/js/security.js`**: Zero-knowledge AES-GCM-256 WebCrypto encryption, privacy PIN lock overlay, and tamper verification.
- **`assets/js/profile.js`**: Profile track manager (Student vs Job Seeker), Bangladesh class curriculum, subjects & cloud backups.
- **`assets/js/home.js`**: Routine and profile aspirant metrics hub.
- **`assets/js/app.js`**: Application router (`activateTab`), modal controllers, fullscreen toggles, Command Palette (`Ctrl+K`), and bootstrap `init()`.
- **`assets/js/lucide.min.js`**: Replaces `<i data-lucide="...">` with SVG icons on startup. In dynamically generated JS templates, use the inline `ICON` object from `core.js`.

---

## 💾 3. State Management & Data Schema

State is stored in `localStorage` under the key:
```javascript
const STORAGE_KEY = 'jobprep-dashboard-data-v2';
```

### State Object Schema:
```typescript
interface AppState {
  routine: Array<{
    id: number;
    date: string;         // 'YYYY-MM-DD'
    startTime: string;    // 'HH:mm'
    endTime: string;      // 'HH:mm'
    subject: string;      // Subject name (matches masterSubjectList)
    task: string;         // Task description
  }>;
  notes: Array<{
    id: number;
    title: string;
    body: string;
    tag: string;          // 'General' | 'Math' | 'English' | 'GK' | etc.
    pinned: boolean;
    ts: number;
  }>;
  sessions: Array<{
    id: number;
    subject: string;
    start: number;        // Epoch timestamp ms
    end: number;          // Epoch timestamp ms
    duration: number;     // Elapsed minutes
  }>;
  activeSession: {
    subject: string;
    start: number;
  } | null;
  dailyTargetMinutes: number; // Default: 240 (4 hours)
  syllabus: Array<{
    id: number;
    name: string;         // Category / Subject name
    topics: Array<{
      id: number;
      name: string;
      done: boolean;
    }>;
  }>;
  flashcards: Array<{
    id: number;
    front: string;
    back: string;
    category: string;
  }>;
  customSubjects: string[];    // User-added subjects
  deletedSubjects: string[];   // Inactive/hidden subjects
  theme: 'dark' | 'light';
  customQuotes: Array<{ id: number; text: string; author: string | null; source: string }>;
  quoteIdx: number;
  quoteSource: 'all' | 'curated' | 'custom';
  quoteCarouselEnabled: boolean;
  quoteCarouselInterval: number; // in seconds
  deletedQuotes: number[];
}
```

### Associated Auxiliary Keys in LocalStorage:
- `jobprep_exams_list`: Array of exam target countdown objects.
- `jobprep_mistakes_bank_v2`: Array of missed MCQ questions for targeted review.
- `custom_bcs_questions_v3`: Array of user-curated or AI-imported questions.
- `jobprep_break_minutes_today`: Logged break minutes for the current day.

---

## 🔄 4. Unified Subject Control System

All subjects across **Routine**, **Tracker & Focus**, **Syllabus**, and **Quizzes/Flashcards** share a synchronized repository:

1. **Master Subject Gathering (`masterSubjectList(includeDeleted)`)**:
   - Combines: `DEFAULT_SUBJECTS` + `state.customSubjects` + `state.syllabus categories` + `state.routine subjects` + `state.sessions subjects` + `state.flashcards categories`.
   - Normalizes via `canonicalSubjectName(s)` to prevent casing duplicates.
   - Filters out any subject in `state.deletedSubjects` unless `includeDeleted = true`.
2. **Global Synchronization (`syncAllSubjectSelects()`)**:
   - Updates `<datalist id="appSubjectDatalist">` (used by Routine table and Syllabus inputs).
   - Populates Tracker dropdown `#sessionSubject` and Quick Select Chips `#quickSubjectChips`.
   - Refreshes Flashcard & Quiz category select elements.
   - Refreshes Settings `#subjectManagerList` and Inactive `#deletedSubjectList`.
3. **Cascading Subject Rename (`renameSubject(oldName, newName)`)**:
   - Must update `state.routine`, `state.sessions`, `state.activeSession`, `state.customSubjects`, `state.syllabus`, and `state.flashcards` simultaneously, save data, and trigger `syncAllSubjectSelects()`.
4. **Soft Delete & Restore**:
   - Deleting a subject adds its canonical name to `state.deletedSubjects` (preserving all past sessions and historical logs).
   - Restoring a subject removes it from `state.deletedSubjects` and re-activates it everywhere.

---

## 🎨 5. UI Design System & Component Conventions

### Color Palette & Theme Tokens
- Dark Mode: Surface background `#0b0f19`, cards `rgba(255, 255, 255, 0.04)`, border `rgba(255, 255, 255, 0.08)`, strong surface `#0f172a`.
- Light Mode: Controlled via `html[data-theme="light"]`. Clean white cards, light borders (`#e2e8f0`), soft slate text.
- Accent Gradients: Primary cyan/indigo gradient (`var(--accent1): #6366f1`, `var(--accent2): #06b6d4`).

### Universal Component Classes (`assets/css/components.css`)
- **`.btn-group`**: Universal segmented button group with unified `border-radius: 9px`, subtle outer border, and seamless child divider borders.
- **`.action-group` & `.action-group-btn`**: Universal hover-expanding action groups (used in Category, Flashcard, Routine, Notes, Quotes, and Subject rows). Resting state is clean and icon-only; expands text smoothly on hover (`max-width: 0 -> 105px; opacity: 0 -> 1`).
- **`.segmented-group` & `.segmented-toggle-group`**: Segmented pill mode switches with high-contrast active gradient (`var(--accent1)` to `var(--accent2)`) and micro-shadow. Used for Practice/Exam mode, Flashcard/Quiz switcher, and Routine view modes.
- **`.micro-btn`**: 28px/8px glass capsules with colored micro-glows on hover (`.danger`, `.edit`, `.subtle`). Used for delete/close buttons across tables and lists.

### Segmented Button Groups (`.btn-group`) & Action Groups
- Segmented controls (Add Topic, Edit, Delete) share unified border-radius and borders.
- On mobile devices (`max-width: 768px`), secondary action buttons collapse into 32x32px square icon buttons (`.pill span { display: none !important; }`).
- **Critical Exception**: Dropdown menu items inside `.cat-del-menu` must keep both text and icons visible at all times! Always scope span-hiding to `.category-action-group .cat-group-btn span`.

### Icon Standards
- Dynamic HTML generated in JavaScript: Use the centralized `ICON` inline SVG object (e.g., `${ICON.trash}`, `${ICON.edit}`, `${ICON.x}`).
- Static HTML markup: Use `<i data-lucide="..."></i>` and trigger `lucide.createIcons()`.

---

## 🧪 6. Testing & Quality Verification

Before committing changes:
1. **Syntax Integrity**: Run `node --check assets/js/*.js` (e.g. `node --check assets/js/master.js`) to ensure zero syntax or bundling errors.
2. **Headless Browser Verification**: For UI layout, mobile responsive behavior, or timer testing, execute automated CDP scripts using headless Chrome (located in `scratch/`) and verify screenshots.
3. **Cross-Tab Consistency**: Verify that changing subjects or state in one tab propagates correctly to all dependent components.
