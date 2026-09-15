# 🎯 CareerDesk — Next-Generation Career Preparation Workspace

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript ES6+](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Architecture](https://img.shields.io/badge/Zero--Dependencies-Native_Web-6366F1?style=for-the-badge)
![Privacy](https://img.shields.io/badge/100%25_Client--Side-Local_Storage-10B981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-06B6D4?style=for-the-badge)

<p align="center">
  <b>An ultra-modern, distraction-free productivity cockpit and exam prep engine engineered for high-performance deep work.</b><br>
  Curated for competitive civil service (BCS), banking, judicial, PSC, and professional entrance examinations.
</p>

[✨ Live Features](#-core-features--modules) •
[🎨 Design System](#-futuristic-design-system--navigation) •
[🏗️ Architecture](#-codebase-architecture--file-structure) •
[🚀 Quick Start](#-getting-started-locally) •
[⌨️ Shortcuts](#️-keyboard-shortcuts)

</div>

---

## ⚡ Executive Summary

**CareerDesk** is a standalone, client-side productivity suite and competitive exam preparation workspace designed from the ground up for focused study sessions. Engineered with a glassmorphic Cyberpunk/Aurora aesthetic, it integrates:

- **📅 Daily Routine Scheduling** with calendar date slider & monthly overview
- **⏱️ Focus Pomodoro & Deep Work Engine** with 24-hour activity analytics and consistency heatmap
- **🗂️ Unified 4-Pillar Subject Control** (`Bangla`, `English`, `Mathematics`, `General Knowledge` + Custom Subjects)
- **📚 Interactive Syllabus Checklist** with multi-level topic completion metrics
- **🧠 Timed 20-Question MCQ Exam Simulation** with negative marking & automated Mistake Bank
- **🃏 3D Spaced-Repetition Flashcards** with distraction-free Fullscreen Exam Mode
- **📝 Tag-Based Smart Notes Board** with instant search & formula pinning
- **⏳ Target Exam Countdowns** with real-time tickers and authority badges
- **💬 Motivation Carousel & 1080p Wallpaper Studio** with HTML5 Canvas export
- **⚡ Command Palette (`Ctrl + K`)** for instant workspace navigation

All of this is delivered in a **zero-dependency, native web architecture** that runs instantly in any modern browser without npm packages, bundlers, compilers, or backend dependencies.

---

## 💎 Core Philosophy & Engineering Highlights

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CAREERDESK CORE                                 │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  ⚡ Zero Dependencies│  🔒 100% Client-Side │  🎯 Unified Subject Control   │
│  No Vite, Webpack,   │  All state persists  │  4 primary pillars synchronized│
│  React or Node.js    │  in LocalStorage &   │  across Routine, Tracker,     │
│  required to run.    │  native disk backup. │  Syllabus, Quiz & Flashcards. │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Native Web Stack (Zero Build Tools):**
   - Pure semantic **HTML5**, modern **Vanilla CSS3** (CSS Custom Properties, Glassmorphism, Container Queries, Flexbox, CSS Grid), and modern **Vanilla JavaScript (ES6+)**.
   - Open `index.html` directly from your file system or a lightweight static file server.
2. **Total Client-Side Privacy & Offline Capability:**
   - 100% private. No external tracking, telemetry, or server database. All study sessions, routine entries, notes, syllabus checklists, and quiz histories stay securely inside your browser's `localStorage`.
   - Native File System Access API integration provides automated continuous disk synchronization to your local backup file (`careerdesk-backup.json`).
3. **Unified Subject Control System:**
   - Standardized on **4 Primary Academic Pillars**: **`Bangla`**, **`English`**, **`Mathematics`**, and **`General Knowledge`**.
   - Seamlessly expandable with user-created custom subjects.
   - Any subject created, renamed, or deleted in one module updates **every single dropdown, datalist, routine row, focus timer, flashcard filter, and quiz category across the entire application simultaneously**.
4. **Authentic Competitive Exam Rules:**
   - Standard 20-question timed model tests with BCS marking scheme: `+1.00` for correct answers, `-0.50` negative marking penalty for incorrect choices.
   - Fisher-Yates algorithm dynamically randomizes answer positions on every launch to eliminate positional muscle-memory bias.

---

## 🌟 Core Features & Modules

### 1. 📅 Interactive Study Routine
* **Day-by-Day Calendar Slider:** Smooth horizontal date picker with visual indicator dots highlighting scheduled study days.
* **Inline Dynamic Table:** Real-time editing for start time, end time, subject autocomplete datalist, and task notes.
* **Monthly Overview Modal:** Switch between daily focus and a birds-eye monthly calendar view.
* **Recommended BCS Routine Loader:** One-click instant population of a balanced preliminary preparation schedule.

### 2. ⏱️ Focus Mode & Study Tracker
* **Digital Stopwatch & Countdown Presets:** Jump between Stopwatch mode, 15m Sprint, 25m Pomodoro, 45m Deep Focus, 60m Master Block, or 5m Refreshment Break.
* **Header Mini-Timer Widget:** Floating persistent status capsule in the top header displaying active subject and live elapsed time when browsing other tabs.
* **24-Hour Activity Analytics:** Real-time metrics breakdown displaying total focused hours, logged break time, and daily goal completion.
* **Consistency Heatmap:** 60-day visual activity matrix celebrating consistency streaks.

### 3. 🗂️ Centralized Subject Manager
* **4 Core Pillars:** Pre-configured for `Bangla`, `English`, `Mathematics`, and `General Knowledge`.
* **Instant Dynamic Sync:** Add a subject anywhere (Focus dropdown, Routine table, Syllabus category, or Quiz form), and all selectors update immediately.
* **Cascading Global Rename:** Renaming a subject propagates across routine rows, historical sessions, active timers, syllabus categories, and flashcards.
* **Soft Delete & Restore:** Hide unused subjects without deleting past study statistics, with a 1-tap restore section.

### 4. 📚 Syllabus Progress Checklist
* **Hierarchical Organization:** Group learning objectives into subject categories and granular topic cards.
* **Dynamic Completion Tracking:** Category-specific and overall progress meters with real-time percentage badges.
* **Universal Action Groups:** Clean hover-expanding segmented buttons for adding topics, inline category editing, and deletion options (*Delete Subject* or *Interactive Topic Delete Mode*).
* **Double-Click Inline Editing:** Double-click any category title or topic name to rename on the fly.

### 5. 🧠 BCS & Competitive MCQ Engine & Mistake Bank
* **Curated Question Banks:** Hundreds of authentic high-yield questions covering Grammar, Literature, Quantitative Aptitude, Bangladesh Affairs, International Affairs, and Everyday Science.
* **Timed 20-Question Exam Simulation:** 15-minute countdown clock, live question palette, question flagging for review, and instant results calculation.
* **Dynamic Option Shuffling:** Automatic Fisher-Yates option randomization prevents positional memorization.
* **Automated Mistake Bank:** Incorrectly answered questions automatically save to the Mistake Bank with detailed explanations, shortcut techniques, and answer comparison.
* **JSON Question Importer / Exporter:** 1-click export of the entire question pool and easy JSON import for user-curated question sets.

### 6. 🃏 3D Spaced-Repetition Flashcards
* **Smooth 3D Flip Physics:** Interactive card-flip animation revealing answers, citations, and explanations.
* **Category Filtering:** Filter flashcards by master academic subjects.
* **Fullscreen Exam Mode:** Distraction-free, keyboard-navigable exam overlay mode for intensive flashcard drilling.
* **1-Click MCQ Sync:** Instantly generate flashcards directly from the MCQ question pool.

### 7. 📝 Categorized Smart Notes Board
* **Tag-Based Filtering:** Filter notes by custom tags (`Math`, `English`, `General Knowledge`, `Bangla`, `High-Yield Formulas`).
* **Card Pinning:** Pin essential formulas and mnemonic acronyms to the top of the grid.
* **Instant Full-Text Search:** Real-time query filtering across titles and note bodies.

### 8. ⏳ Exam Target Countdown Clocks
* **Live Precision Clocks:** Real-time digital tickers counting remaining days, hours, minutes, and seconds.
* **Authority Badges:** Categorize exams by authority (`BCS`, `Bank`, `Primary`, `PSC`, `BPSC`).
* **Custom Exam Target Creator:** Add upcoming target exams with date and session notes.

### 9. 💬 Daily Motivation & 1080p Wallpaper Studio
* **Inspirational Quote Ticker:** Smooth quote carousel with customizable intervals (10 seconds to 1 hour).
* **Quote Management:** Add custom personal quotes and filter between curated and custom quotes.
* **1080p HD Wallpaper Generator:** HTML5 Canvas engine that renders and exports bespoke 1920x1080 desktop wallpapers featuring motivational quotes and theme gradients.

### 10. ⚡ Command Palette & Productivity Tools
* **Global Command Palette (`Ctrl + K` / `⌘ + K`):** Jump between tabs, search notes, inspect syllabus topics, or trigger actions with keyboard navigation.
* **Web Audio API Synthesizer:** Pure synthesized audio feedback for correct answers, score milestones, and streaks (zero external MP3 files).

---

## 🎨 Futuristic Design System & Navigation

CareerDesk features an **OLED-optimized Cyberpunk & Aurora Glassmorphism** design system with a digital HUD aesthetic.

### Holographic Interactive Navbar
The navigation menu uses a floating glass visor architecture. On hover, each tab illuminates with its distinct **neon holographic accent and drop-shadow halo**:

| Tab | Theme | Neon Hover Signature |
| :--- | :--- | :--- |
| **Routine** | Cyber Sky | `#38bdf8` (Electric Cyan glow) |
| **Notes** | Solar Amber | `#fbbf24` (Golden Circuit glow) |
| **Tracker** | Quantum Mint | `#34d399` (Neon Emerald glow) |
| **Quiz** | Hyper Violet | `#c084fc` (Psychic Magenta glow) |
| **Exams** | Laser Crimson | `#fb7185` (Hyperdrive Rose glow) |
| **Syllabus** | Matrix Indigo | `#818cf8` (Deep Sapphire glow) |
| **Settings** | Prism Cyan | `#67e8f9` (Rotating Titanium Gears glow) |

- **Elevated Micro-Motion:** Inactive icons smoothly elevate (`translateY(-1px) scale(1.18)`).
- **Tactile Active Indicator:** The active tab features a high-contrast gradient capsule with an internal light beam.
- **Android 16 Bottom Dock:** On mobile screens (`max-width: 720px`), the navigation transforms into an ergonomic floating bottom dock with touch feedback.

---

## 📁 Codebase Architecture & File Structure

The project is structured into clear, decoupled modular components for both styles and scripts:

```text
CareerDesk/
├── index.html                  # Semantic single-page layout & modular HTML panels
├── assets/
│   ├── css/
│   │   ├── base.css            # Design tokens, Aurora animations, header, responsive dock
│   │   ├── components.css      # Universal .btn-group, .action-group, .segmented-group
│   │   ├── routine.css         # Routine tables, calendar slider, monthly schedule
│   │   ├── quotes.css          # Quote ticker, carousel, wallpaper studio
│   │   ├── notes.css           # Notes grid, smart cards, pinning, search filtering
│   │   ├── tracker.css         # Focus timers, 24h activity log, consistency heatmap
│   │   ├── countdown.css       # Target exam countdown cards engine
│   │   ├── syllabus.css        # Curriculum categories, topic checklist, progress meters
│   │   ├── flashcards.css      # Flashcards deck, 3D flip card, fullscreen exam overlay
│   │   ├── mcq.css             # MCQ quiz engine, floating scores, mistake bank
│   │   ├── settings.css        # Subject Manager, auto-sync, backup & restore
│   │   ├── modals.css          # Command Palette (Ctrl+K), generic dialogs
│   │   └── style.css           # Master stylesheet index (@import aggregator)
│   ├── js/
│   │   ├── core.js             # Unified subject system, state schema, storage adapter
│   │   ├── routine.js          # Routine schedules, date slider, day/month views
│   │   ├── quotes.js           # Motivation ticker, wallpaper generator, quote collection
│   │   ├── notes.js            # User study notes, tags, pinning & full-text search
│   │   ├── tracker.js          # Focus timer, 24h activity break logs, consistency heatmap
│   │   ├── countdown.js        # Target exam countdown timers engine
│   │   ├── syllabus.js         # Category & topic progress, inline edit & delete mode
│   │   ├── flashcards.js       # Spaced flashcards deck review & interactive exam mode
│   │   ├── questions-data.js   # BCS & competitive curated question banks (1,400+ lines)
│   │   ├── mcq.js              # MCQ quiz engine, 20-Q exam mode, sound, mistake bank
│   │   ├── settings.js         # Settings panel, Subject Manager UI, JSON backup/restore
│   │   ├── app.js              # Theme switcher, modals, command palette, application bootstrap
│   │   └── lucide.min.js       # Embedded Lucide icons library
│   └── icons/                  # Curated SVG icon assets
├── AGENTS.md                   # AI Agent architecture and conventions blueprint
├── .gitignore                  # Git ignore rules (build artifacts, backup json files)
└── README.md                   # Complete developer & user documentation (this file)
```

---

## 🚀 Getting Started Locally

No Node.js runtime, build tools, bundlers, or package installations are required.

### 1. Clone the repository
```bash
git clone https://github.com/shahriyarshehab/CareerDesk.git
cd CareerDesk
```

### 2. Launch in your browser
- **Direct File System:** Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.
- **VS Code Live Server:** Right-click `index.html` and choose **"Open with Live Server"**.
- **Python Static Server:**
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your web browser.
- **Node Static Server (Optional):**
  ```bash
  npx serve .
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

## 🔒 Data Privacy & Storage Specification

- State is persisted in `localStorage` under the key:
  ```javascript
  const STORAGE_KEY = 'jobprep-dashboard-data-v2';
  ```
- Auxiliary LocalStorage stores:
  - `jobprep_exams_list`: Target countdown exams
  - `jobprep_mistakes_bank_v2`: Missed MCQ questions for targeted review
  - `custom_bcs_questions_v3`: User-imported custom question pools
  - `jobprep_break_minutes_today`: Break minutes logged for today
- **Automatic File Backup:** Using the File System Access API via `Settings -> Link Local Backup File`, CareerDesk can automatically write your latest state to `careerdesk-backup.json` on disk whenever you make changes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal, educational, and commercial open-source usage.

---

<div align="center">
  <sub>Engineered with precision for competitive exam aspirants. Star ⭐ this repository if you find it helpful!</sub>
</div>
