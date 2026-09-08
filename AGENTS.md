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
│   │   └── style.css       # Unified design system, glassmorphism, mobile dock, animations
│   ├── js/
│   │   ├── script.js       # Central application engine, state management, timers, analytics
│   │   └── lucide.min.js   # Embedded Lucide icons library
│   └── icons/              # Curated SVG icon assets and preview showcase gallery
├── AGENTS.md               # AI Agent architecture and conventions guide (this file)
├── .cursorrules            # Cursor AI agent instructions
├── .github/
│   └── copilot-instructions.md # GitHub Copilot custom instructions
└── README.md               # End-user documentation
```

### Key File Roles:
- **`index.html`**: Contains semantic panels (`#panel-routine`, `#panel-notes`, `#panel-tracker`, `#panel-flashcards`, `#panel-countdown`, `#panel-syllabus`, `#panel-settings`). Global subject autocomplete uses `<datalist id="appSubjectDatalist">`.
- **`assets/css/style.css`**: Complete design system with CSS custom properties (`--bg`, `--surface`, `--accent1`, `--accent2`, `--border`, etc.). Handles responsive layout, floating pill navigation dock, and dark/light modes.
- **`assets/js/script.js`**: Self-contained application engine enclosed in an IIFE. Manages state, routines, timers, MCQ engine, Mistake Bank, quotes rotation, canvas wallpaper generator, and subject synchronization.
- **`assets/js/lucide.min.js`**: Replaces `<i data-lucide="...">` with SVG icons on startup. In dynamically generated JS templates, use the inline `ICON` object.

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

### Segmented Button Groups (`.btn-group`)
- Segmented controls (Add Topic, Edit, Delete) share unified border-radius and borders.
- On mobile devices (`max-width: 768px`), secondary action buttons collapse into 32x32px square icon buttons (`.pill span { display: none !important; }`).
- **Critical Exception**: Dropdown menu items inside `.cat-del-menu` must keep both text and icons visible at all times! Always scope span-hiding to `.category-action-group .cat-group-btn span`.

### Icon Standards
- Dynamic HTML generated in JavaScript: Use the centralized `ICON` inline SVG object (e.g., `${ICON.trash}`, `${ICON.edit}`, `${ICON.x}`).
- Static HTML markup: Use `<i data-lucide="..."></i>` and trigger `lucide.createIcons()`.

---

## 🧪 6. Testing & Quality Verification

Before committing changes:
1. **Syntax Integrity**: Run `node --check assets/js/script.js` to ensure zero syntax or bundling errors.
2. **Headless Browser Verification**: For UI layout, mobile responsive behavior, or timer testing, execute automated CDP scripts using headless Chrome (located in `scratch/`) and verify screenshots.
3. **Cross-Tab Consistency**: Verify that changing subjects or state in one tab propagates correctly to all dependent components.
