# 🎯 CareerDesk — Next-Generation Career Preparation Workspace

<div align="center">

[![Live App](https://img.shields.io/badge/Live_App-careerdesk.web.app-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://careerdesk.web.app)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript ES6+](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase_Hosting_&_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Privacy](https://img.shields.io/badge/Client--Side_Privacy-Local_First-10B981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-06B6D4?style=for-the-badge)

<p align="center">
  <b>An ultra-modern, distraction-free productivity cockpit and competitive exam workspace engineered for high-performance deep work.</b><br>
  Tailored for civil service (BCS), banking, judicial, PSC, and professional competitive entrance examinations.
</p>

[🌐 Open Web App](https://careerdesk.web.app) •
[✨ Core Capabilities](#-core-capabilities--modules) •
[☁️ Cloud Sync & Storage](#️-cloud-sync--individual-storage) •
[🎨 Design System](#-design-system--adaptive-interface) •
[🏗️ Architecture](#-codebase-architecture--file-structure) •
[🚀 Local Setup](#-getting-started-locally) •
[⌨️ Shortcuts](#️-keyboard-shortcuts)

</div>

---

## ⚡ Executive Summary

**CareerDesk** is a standalone, client-side productivity suite and competitive exam preparation cockpit designed specifically for focused study sessions. Engineered with an OLED-optimized Aurora Glassmorphic aesthetic, it combines:

- **📅 Dedicated Daily Study Routine** with horizontal date slider, day-by-day & monthly schedules, and instant autosave.
- **👤 Aspirant Mission Control & Profile Hub** with real-time target metrics, consistency streak, and nearest exam countdown clock.
- **🧭 4 Core Academic Preparation Pillars** (`Bangla`, `English`, `Mathematics`, `General Knowledge`) with synchronized syllabus meters and 1-click focus launching.
- **🎯 1,000 BCS Question Bank & Adaptive MCQ Engine** with a 30-question sliding practice pool, unrevealed mistake re-queuing, mastery tracking, and 20-question timed model exams.
- **⚡ Weak-Area Revision Radar** with automated mistake capture for targeted remedial drilling.
- **🃏 Spaced-Repetition 3D Flashcards** with category filtering and fullscreen distraction-free Exam Mode.
- **📝 Tag-Based Smart Notes Board & Daily Reflection Journal** with instant full-text search, pinning, and reflection logs.
- **⏳ Target Exam Precision Countdowns** with real-time digital tickers and authority badges.
- **☁️ Firebase Cloud Sync & Point-in-Time Snapshots** with offline persistence, 1-click JSON backups, and full data deletion controls.
- **⚡ Command Palette (`Ctrl + K`)** for instant workspace navigation and keyboard shortcuts.

All of this is delivered in a **zero-dependency, native web stack** that runs instantly in any modern browser without npm packages, bundlers, compilers, or server setups.

---

## 💎 Core Philosophy & Architectural Highlights

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CAREERDESK CORE                                 │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  ⚡ Zero Dependencies│  🔒 Privacy-First    │  🎯 Unified Subject Control   │
│  No Vite, Webpack,   │  All state persists  │  4 primary pillars synchronized│
│  React or Babel      │  locally; optional   │  across Routine, Tracker,     │
│  required to run.    │  Firestore Cloud.    │  Syllabus, Quiz & Flashcards. │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Native Web Stack (Zero Build Step):**
   - Pure semantic **HTML5**, modern **Vanilla CSS3** (Custom Properties, Glassmorphism, Container Queries, Flexbox, Grid), and modern **Vanilla JavaScript (ES6+)**.
   - Open `index.html` directly from your file system or deploy statically to any CDN/hosting provider.
2. **Local-First Privacy with Offline Resilience:**
   - 100% private. All study sessions, routine entries, notes, syllabus checklists, and quiz histories stay securely inside browser `localStorage`.
   - Optional Firebase Firestore cloud synchronization with offline persistence for multi-device cross-sync.
3. **Unified Subject Control System:**
   - Standardized on **4 Primary Academic Pillars**: **`Bangla`**, **`English`**, **`Mathematics`**, and **`General Knowledge`**.
   - Any subject created, renamed, or restored in one module updates every dropdown, datalist, routine row, focus timer, flashcard filter, and quiz category across the entire application simultaneously.
4. **Standard Arabic Numerals Convention:**
   - All timer clocks, countdowns, statistics, dates, percentages, and counter badges use standard English Arabic digits (`0-9`) for clean readability across all devices.

---

## 🌟 Core Capabilities & Modules

### 1. 📅 Dedicated Daily Study Routine
* **Focused Routine View:** The homepage is dedicated exclusively to the full-width study routine, eliminating visual clutter.
* **Streamlined Header:** Clean segmented mode switcher (`[ Daily ] [ Monthly ]`) with automatic default to Today's routine.
* **Interactive Date Slider:** Horizontal day chips with active date indicators and dot badges highlighting scheduled study blocks.
* **Dynamic Time Blocks:** Inline editing for start time, end time, subject autocomplete datalist, and task description.
* **Autosaved Permanently:** All schedule changes persist instantly to local storage and sync to the cloud.

### 2. 👤 Aspirant Mission Control & Profile Hub
* **Candidate Identity Card:** Editable display name, username (`@handle`), avatar photo upload, authentication provider badge, and Sign Out action.
* **Lifetime Preparation Metrics Grid:** Real-time summary cards displaying cumulative study hours, completed sessions count, syllabus completion %, mastered MCQs count, and smart notes count.
* **Daily Focus Target:** Live progress bar showing studied hours/minutes vs. daily target (e.g., `2h 30m / 4h`).
* **Consistency Streak:** Visual flame tracker celebrating uninterrupted daily study streaks.
* **Nearest Exam Ticking Clock:** Live countdown ticker calculating days, hours, minutes, and seconds remaining until your primary target exam.
* **Motivational Quote Banner:** Prominently positioned inspirational quote with author attribution.

### 3. 🧭 Core Academic Preparation Pillars & Weak-Area Radar
* **4 Core Pillars:** Bangla (`#ec4899`), English (`#06b6d4`), Mathematics (`#10b981`), and General Knowledge (`#f59e0b`).
* **Live Completion Tracking:** Dynamic progress bars reflecting syllabus topics completed and study minutes logged today.
* **One-Click Focus Integration:** Click **"Study →"** on any pillar to automatically select the subject and open the Focus Tracker.
* **Weak-Area Revision Radar:** Real-time mistake counter badge. Clean state indicator when no mistakes are pending, or preview cards of missed concepts with a direct **"Practice Mistake Bank"** remediation button.

### 4. 🎯 1,000 BCS Question Bank & Adaptive Practice Engine
* **1,000 Curated Questions:** Comprehensive repository covering Bangla Grammar & Literature, English Language, Quantitative Aptitude, Bangladesh Affairs, International Affairs, and Everyday Science.
* **30-Item Sliding Active Pool:** Practice in manageable, focused sets of 30 questions at a time.
* **Unrevealed Retry Logic:** Incorrect answers are seamlessly re-queued without immediately spoiling the correct choice, requiring active recall before mastery.
* **Dynamic Pool Replenishment:** As questions are mastered, new items automatically slide into the active set from the 1,000-question pool.
* **20-Question Timed Model Test:** 15-minute countdown clock, live question palette, question flagging, and authentic BCS scoring (`+1.00` correct, `-0.50` penalty for wrong answers).
* **Fisher-Yates Option Shuffling:** Prevents muscle-memory bias by randomizing options on every quiz run.

### 5. ⏱️ Focus Mode & Deep Work Tracker
* **Timer Presets:** Stopwatch mode, 15m Sprint, 25m Pomodoro, 45m Deep Focus, 60m Master Block, and 5m Break.
* **Persistent Header Mini-Timer:** Floating status pill in the top header displaying active subject and live timer while browsing other tabs.
* **24-Hour Activity Analytics:** Real-time breakdown of focused study minutes, break minutes, and daily goal completion.
* **Consistency Heatmap:** 60-day visual activity matrix reflecting daily dedication.

### 6. 🃏 Spaced-Repetition 3D Flashcards
* **Smooth 3D Flip Physics:** Interactive flip card animation displaying questions, answers, and explanations.
* **Category Filtering:** Filter flashcard decks by core academic subjects.
* **Fullscreen Exam Overlay:** Distraction-free, keyboard-navigable exam environment for intensive drilling.

### 7. 📝 Categorized Smart Notes & Reflection Journal
* **Tag-Based Categorization:** Filter notes by subject or custom tags (`Math`, `English`, `General Knowledge`, `Bangla`, `Important`).
* **Note Pinning:** Pin crucial formulas and mnemonic aids to the top of the grid.
* **Full-Text Instant Search:** Real-time search across note titles and content.
* **Daily Reflection Journal:** Dedicated reflection log to record daily study takeaways, learnings, and areas for improvement.

### 8. ⏳ Exam Target Countdown Clocks
* **Precision Digital Clocks:** Real-time countdowns counting remaining days, hours, minutes, and seconds.
* **Authority Badges:** Categorized by authority (`BCS`, `Bank`, `Primary`, `PSC`, `BPSC`).
* **Custom Exam Target Creator:** Create customized target countdowns with exam date, time, and notes.

---

## ☁️ Cloud Sync & Individual Storage

CareerDesk incorporates a modern, privacy-first Cloud Sync & Storage architecture powered by **Firebase & Firestore**:

### Group Chat

Authenticated users can create public study groups, optionally provide an HTTPS group avatar URL, search and join groups, and exchange real-time messages. Group membership, message history, sender metadata, and group metadata are stored in Firestore. The feature is compatible with Firebase's free Spark plan because it does not use Cloud Storage uploads.

- **Real-Time Debounced Auto-Sync:** All changes to routines, notes, syllabus checklists, and mistake banks automatically sync to your personal Firestore document (`/users/{uid}`) with offline resilience.
- **Point-in-Time Cloud Snapshots:** Create named versioned snapshots of your complete data package and restore previous milestones directly from the cloud history drawer.
- **1-Click JSON Cloud Backup:** Export your complete cloud dataset as a single JSON file or restore from a previously downloaded backup.
- **Permanent Cloud Data Deletion:** Dedicated **"Delete Cloud Data"** action with a confirmation modal, allowing users to permanently erase all cloud-stored documents and snapshots from Firestore servers on demand.
- **Multi-Provider Authentication:** Sign in securely via Email/Password, Phone OTP, Google, or GitHub.

---

## 🎨 Design System & Adaptive Interface

CareerDesk is built on an **OLED-optimized Aurora Glassmorphism** design system with responsive layouts:

| Token / Element | Style / Description |
| :--- | :--- |
| **Dark Theme** | Surface `#0b0f19`, card surfaces `rgba(255, 255, 255, 0.04)`, borders `rgba(255, 255, 255, 0.08)` |
| **Light Theme** | Clean white cards, soft slate typography, light borders (`#e2e8f0`) |
| **Accent Gradients** | Indigo to Cyan gradient (`var(--accent1): #6366f1` to `var(--accent2): #06b6d4`) |
| **Pill Navbar** | Floating glass dock with illuminated active states and smooth micro-elevations |
| **Mobile Floating Dock** | Transforms into an ergonomic bottom dock on mobile devices (`max-width: 768px`) |
| **Sub-Nav Persistence** | Sub-navigation states (Daily/Monthly, Flashcards/Quiz/Mistakes, Study/Break) persist across reloads |

---

## 📁 Codebase Architecture & File Structure

```text
CareerDesk/
├── index.html                  # Main application single-page layout & panels
├── firebase.json               # Firebase Hosting & Firestore rules configuration
├── firestore.rules             # Firestore security rules & user data isolation
├── .firebaserc                 # Firebase project target mapping (careerdesk)
├── assets/
│   ├── css/
│   │   ├── base.css            # Design tokens, Aurora animations, header, mobile dock
│   │   ├── components.css      # Universal .btn-group, .action-group, .segmented-group
│   │   ├── routine.css         # Routine tables, calendar slider, monthly schedule
│   │   ├── quotes.css          # Motivation ticker & quote collection styling
│   │   ├── notes.css           # Notes grid, smart cards, pinning, search filtering
│   │   ├── tracker.css         # Focus timers, 24h activity log, consistency heatmap
│   │   ├── countdown.css       # Target exam countdown cards engine
│   │   ├── syllabus.css        # Curriculum categories, topic checklist, progress meters
│   │   ├── flashcards.css      # Flashcards deck, 3D flip card, fullscreen exam overlay
│   │   ├── mcq.css             # MCQ quiz engine, sliding pool, mistake bank
│   │   ├── profile.css         # User profile card, lifetime metrics, auth views
│   │   ├── settings.css        # Subject Manager, cloud sync buttons, data reset
│   │   ├── modals.css          # Command Palette (Ctrl+K), generic dialogs
│   │   └── style.css           # Master stylesheet project file (only CSS linked in index.html)
│   ├── js/
│   │   ├── master.js           # Master JavaScript project file (only script linked in index.html)
│   │   ├── core.js             # Unified subject system, state schema, storage adapter
│   │   ├── routine.js          # Routine schedules, date slider, day/month views
│   │   ├── quotes.js           # Motivation ticker, active quote management
│   │   ├── notes.js            # User study notes, tags, pinning & full-text search
│   │   ├── tracker.js          # Focus timer, 24h activity break logs, consistency heatmap
│   │   ├── countdown.js        # Target exam countdown timers engine
│   │   ├── syllabus.js         # Category & topic progress, inline edit & delete mode
│   │   ├── flashcards.js       # Spaced flashcards deck review & interactive exam mode
│   │   ├── questions.js        # 1,000 BCS & competitive curated question pool
│   │   ├── mcq.js              # 30-item sliding pool, unrevealed retry, exam mode
│   │   ├── firebase-config.js  # Firebase project credentials
│   │   ├── firebase-sync.js    # Auth, Firestore debounced auto-sync, snapshots
│   │   ├── profile.js          # Academic track (Student vs Job Seeker), curriculum subjects, cloud backup
│   │   ├── home.js             # Routine isolation & Profile Aspirant Hub renderer
│   │   ├── app.js              # Tab router, Command Palette, application bootstrap
│   │   └── lucide.min.js       # Embedded Lucide icons library
│   └── icons/                  # Curated SVG icon assets and favicon
├── AGENTS.md                   # AI Developer architecture and conventions guide
├── SECURITY.md                 # Security policy and vulnerability disclosure
├── .gitignore                  # Git ignore rules (.firebase cache, backup json files)
└── README.md                   # Project documentation (this file)
```

---

## 🚀 Getting Started Locally

No complex dependencies, bundlers, or compilation steps are needed.

### 1. Clone the repository
```bash
git clone https://github.com/shahriyarshehab/careerDesk.git
cd careerDesk
```

### 2. Launch in your browser
- **Direct File System:** Double-click `index.html` to open directly in Chrome, Edge, Firefox, or Safari.
- **VS Code Live Server:** Right-click `index.html` and select **"Open with Live Server"**.
- **Python Static Server:**
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your web browser.
- **Node Static Server:**
  ```bash
  npx serve .
  ```

### 3. Deploy to Firebase (Optional)
```bash
npm install -g firebase-tools
firebase login
firebase use careerdesk
firebase deploy
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `⌘ + K` | Global | Open Command Palette & Quick Search |
| `Escape` | Global | Dismiss active modal, exam mode, or Command Palette |
| `Enter` | Command Palette | Execute selected command or navigate to tab |
| `↑` / `↓` | Command Palette | Navigate through search results |
| `Double Click` | Syllabus Panel | Rename category title or topic name inline |
| `Escape` | Flashcards Exam | Exit fullscreen distraction-free flashcard exam |

---

## 🔒 Data Privacy & Security

- **Default Storage Key:** State is persisted in browser `localStorage` under `jobprep-dashboard-data-v2`.
- **Security Rules:** Firestore database rules strictly isolate user data under `/users/{userId}`: users can only read and modify their own documents.
- **Complete Data Autonomy:** Users retain full control with 1-click JSON export, snapshot management, and permanent cloud data deletion options.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal, educational, and commercial open-source usage.

---

<div align="center">
  <sub>Designed &amp; engineered with precision for BCS and competitive exam aspirants. Star ⭐ this repository if you find it helpful!</sub>
</div>
