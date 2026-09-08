# 🎯 CareerDesk — Career Preparation Workspace

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Production-06B6D4?style=for-the-badge)

**CareerDesk** is an ultra-modern, all-in-one productivity suite and exam preparation workspace engineered for competitive exam aspirants (Civil Service / BCS, Banking, Teaching, PSC, and professional entrance exams). 

Built with a glassmorphic Cyberpunk/Aurora aesthetic, CareerDesk integrates daily routine scheduling, deep-work Pomodoro tracking, a centralized subject manager, syllabus checklist, timed MCQ exam simulation, interactive flashcards, mistake diagnosis, exam countdowns, and HD desktop wallpaper generation into a lightning-fast, zero-dependency client application.

---

## 📸 Overview & Highlights

- **⚡ Zero Build Dependencies:** Pure native Web stack (HTML5, CSS3, modern ES6+ JavaScript). Runs instantly in any browser.
- **📱 Fully Responsive & Mobile-First:** Floating pill navigation bar, touch-friendly segmented controls, and compact responsive layouts.
- **🎨 Deep Aurora Glassmorphism:** Tailored dark and light themes with smooth fluid transitions, glowing dials, and frosted glass panels.
- **🔒 100% Client-Side Privacy:** Your study data stays entirely in your browser using persistent local storage and local backup sync.

---

## 🌟 Core Features & Modules

### 1. 📅 Interactive Study Routine
* **Date-Based Scheduling:** Seamless calendar slider and month selector to plan, review, and track study routines for any day.
* **Inline Table Editing:** Edit start/end times, subjects (with autocomplete datalist), and specific topics directly inside the routine table.
* **Monthly Overview Modal:** Toggle between single-day focus and full monthly aggregated view with date navigation auto-hiding.
* **One-Click Routine Reset:** Instant default curriculum template loader for balanced daily preparation.

### 2. ⏱️ Focus Mode & Study Tracker
* **Glowing Clock Orb:** Minimalist digital stopwatch and countdown timer with animated pulse indicator.
* **Quick Interval Presets:** Switch instantly between Stopwatch, 15m, 25m Pomodoro, 45m Deep Work, 60m Focus, or 5m Refreshment Break.
* **Quick Subject Chips Bar:** One-tap horizontal chip selector for fast subject switching with glowing gradient highlights.
* **Header Mini-Timer:** Floating mini-timer in the top header widget that displays active subject and elapsed time while browsing other tabs.
* **24-Hour Activity Analytics:** Real-time breakdown of today's study hours, total break duration, and active study percentage.
* **Subject Breakdown Progress:** Visual distribution bar and today's subject progress cards.

### 3. 🗂️ Centralized Subject Manager (Settings)
* **Single Master Subject Source:** Routine, Tracker, Syllabus, and Flashcards now share a synchronized subject repository.
* **Live Statistics:** Subject cards display logged study time, session counts, routine block counts, syllabus progress, and card counts.
* **Global Rename:** Renaming a subject in Settings propagates the update across all routine slots, historical sessions, active timers, syllabus categories, and flashcards with full data integrity.
* **Delete, Hide & Restore:** Safely hide subjects without deleting past study records, with an Inactive/Hidden section for 1-tap restore.
* **Curriculum Defaults Reset:** Restore all standard subjects (Bangla, English, Math, Science, ICT, Bangladesh & International Affairs) in one click.
* **Global Datalist Autocomplete:** Typing or clicking subject fields in Routine or Syllabus automatically suggests active subjects.

### 4. 📚 Syllabus Progress Checklist
* **Hierarchical Organization:** Group learning objectives into subject categories and granular topic cards.
* **Interactive Completion Progress:** Live progress percentages and animated progress meters for each category and overall syllabus.
* **Refined Category Action Group:** Segmented button controls for Add Topic, Edit Category, and a 2-option Delete Menu (*Delete Subject* or *Interactive Topic Delete Mode*).
* **Double-Click Inline Editing:** Double-click any category title or topic name to rename it on the fly.

### 5. 📝 Categorized Smart Notes
* **Tag-Based Filtering:** Organize notes by tags (Math, English, General, Bangla, Important, High-Yield formulas).
* **Pin Critical Notes:** Pin essential formulas, mnemonic acronyms, and high-yield notes to the top of the board.
* **Live Search & Filter:** Instant search query filtering across note titles and content.
* **Inline Quick Edit:** Clean inline editing interface without modal clutter.

### 6. 🧠 BCS & Competitive MCQ Engine & Mistake Bank
* **Authentic MCQ Bank:** Over 55+ authentic questions curated from BCS Preliminary, PSC, and combined bank recruitment exams.
* **Dynamic Option Shuffling:** Uses the Fisher-Yates shuffle to randomize options dynamically while keeping answer keys accurate, preventing positional muscle-memory bias.
* **Timed 20-Question Exam Simulation:** 15-minute countdown timer with authentic BCS marking scheme (+1.00 for correct, -0.50 for incorrect penalty) and detailed score summary.
* **Explanations & Shortcuts:** Instant explanations and mathematical shortcut techniques revealed for every question.
* **Automated Mistake Bank:** Incorrectly answered questions are automatically logged into the Mistake Bank with category tags, comparison of your answer vs. correct answer, and reasoning for targeted revision.
* **AI Harvester & JSON Import:** Harvest high-yield questions or import custom quiz banks.

### 7. 🃏 3D Spaced-Repetition Flashcards
* **Smooth 3D Flip Animation:** Click to reveal answer and detailed explanation.
* **Category Filtering:** Filter cards by master subject categories.
* **MCQ to Flashcard Sync:** Convert high-yield questions directly into flashcards.

### 8. ⏳ Live Exam Target Countdowns
* **Live Countdown Clocks:** Real-time ticker showing remaining days, hours, minutes, and seconds until exam day.
* **Target Categories:** Assign authority badges (e.g., BCS, BPSC, Combined 5 Banks, Primary).
* **Custom Exam Dates:** Add and manage unlimited target exams.

### 9. 💬 Quote Carousel & 1080p Wallpaper Generator
* **Inspirational Quote Ticker:** Automatic ticker rotating motivational quotes with customizable intervals (30s to 1 hour).
* **Quotes Manager:** Add, edit, or delete personal quotes and choose between Curated, Custom, or All quotes.
* **1080p Desktop Wallpaper Export:** Generate and download custom 1920x1080 HD wallpapers via HTML5 Canvas with custom themes and quotes.

### 10. ⚡ Command Palette & Productivity
* **Quick Search (Ctrl+K / ⌘K):** Search across notes, syllabus topics, tabs, and actions with arrow-key navigation.
* **Auto-Sync & Backup:** Export/import full workspace backups in JSON, plus native File System Access API support for automatic disk sync.

---

## 🛠️ Technology Stack & Architecture

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantic | Accessible, WAI-ARIA roles, clean landmarks |
| **Styling** | Vanilla CSS3 | Custom properties, glassmorphism, Aurora glow, responsive media queries |
| **Scripting** | Vanilla JavaScript (ES6+) | Object-oriented modular state architecture, no frameworks, zero runtime bloat |
| **Icons** | Lucide Icons | Scalable, lightweight vector icon suite |
| **Typography** | Google Fonts | *Plus Jakarta Sans* & *Outfit* |
| **Storage** | LocalStorage + File System API | Fast persistent storage with local JSON export/import & automated disk backup |
| **Graphics** | HTML5 Canvas API | 1920x1080 HD wallpaper generation & export |

---

## 📁 Directory Structure

```text
CareerDesk/
├── index.html              # Main application single-page layout
├── assets/
│   ├── css/
│   │   └── style.css       # Unified design system, glassmorphic UI, animations, mobile CSS
│   ├── js/
│   │   ├── script.js       # Core application engine, state management, timers, analytics
│   │   └── lucide.min.js   # Embedded Lucide icons library
│   └── icons/              # Curated SVG icons and preview gallery
├── AGENTS.md               # AI coding assistant architecture & conventions specification
└── README.md               # Project documentation
```

---

## 🚀 Getting Started Locally

No Node.js runtime, build tools, or package installations are required.

### 1. Clone the repository
```bash
git clone https://github.com/shahriyarshehab/CareerDesk.git
cd CareerDesk
```

### 2. Launch in Browser
- **Direct open:** Double-click `index.html` in your file explorer.
- **VS Code Live Server:** Right-click `index.html` and choose **"Open with Live Server"**.
- **Python local server:**
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your web browser.

---

## ⌨️ Useful Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `⌘ + K` | Open Command Palette & Quick Search |
| `Escape` | Close active modals / Command Palette |
| `Enter` | Submit inputs / select active command palette item |
| `Double Click` | Edit topic or category name in Syllabus |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and educational use.
