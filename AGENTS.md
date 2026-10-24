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
├── index.html
├── assets/
│   ├── css/                 # Modular stylesheets and layout overrides
│   ├── data/                # Question-bank JSON
│   ├── icons/
│   └── js/
│       ├── master.js        # Ordered script loader
│       ├── core.js          # Shared state, storage, and utilities
│       ├── app.js           # Router and bootstrap
│       ├── features/        # User-facing feature modules
│       ├── integrations/    # Firebase and security modules
│       └── lucide.min.js
├── docs/architecture/       # Graphify report and visualizations
├── scripts/build_graphify.py
├── AGENTS.md
├── .github/copilot-instructions.md
└── README.md
```

### Key File Roles:
- **`index.html`**: Semantic single-page layout. Loads the CSS manifest, final layout overrides, and JS manifest.
- **`assets/css/master.css`**: Master Stylesheet Project File. Uses `@import` to load all modular CSS stylesheets.
- **`assets/js/master.js`**: Master JavaScript Project File. Central manifest that synchronously loads all modular JS engines.
- **`assets/js/core.js`**: Central storage adapter, state initialization (`getDefaultState`), global utilities (`escapeHtml`, `escapeAttr`, `toBnDigits`, `dateKey`), and the Unified Subject Control System (`masterSubjectList`, `canonicalSubjectName`, `renameSubject`, `syncAllSubjectSelects`).
- **`assets/js/features/`**: Routine, tracker, quotes, countdown, syllabus, questions, MCQ, profile, home, and group-chat modules.
- **`assets/js/integrations/`**: Security and optional Firebase integrations.
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
1. **Syntax Integrity**: Run `node --check assets/js/master.js` and syntax-check feature and integration modules under `assets/js/`.
2. **Headless Browser Verification**: For UI layout, mobile responsive behavior, or timer testing, execute automated CDP scripts using headless Chrome (located in `scratch/`) and verify screenshots.
3. **Cross-Tab Consistency**: Verify that changing subjects or state in one tab propagates correctly to all dependent components.
