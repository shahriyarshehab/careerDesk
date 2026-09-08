# 🎯 Job Prep Dashboard (Study Management & Exam Tracker)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Job Prep Dashboard** is a sleek, ultra-modern, all-in-one study management and exam preparation web application designed for competitive exam candidates (Civil Service, Banking, Teaching, and standardized professional tests). 

It features an interactive study routine planner, subject-wise focus stopwatch & Pomodoro timers, 24-hour activity ratio tracking, syllabus progress checklist, flashcards with interactive exam mode, mistake bank, live exam target countdowns, inspirational quote slideshows, and 1080p desktop wallpaper generation.

---

## 🌟 Key Features

### 📅 1. Interactive Study Routine
* **Date-Based Routine:** Seamlessly create and review study routines for any date with an intuitive calendar slider and month picker.
* **Inline Editing:** Edit start/end times, subjects, and specific study tasks directly within the table.
* **Monthly Overview:** View, edit, or delete full monthly study history.
* **Default Template:** Load a balanced daily routine with a single click.

### 📝 2. Categorized Smart Notes
* **Subject Tags:** Organize notes by General, English, Mathematics, Bengali, General Knowledge, or Important/High-Yield tags.
* **Pin to Top:** Keep critical formulas and summaries pinned to the top of your board.
* **Live Search & Filter:** Instantly filter notes by keyword or category tag.
* **Inline Quick Edit:** Edit and update notes on the fly.

### ⏱️ 3. Study Session Tracker & Focus Mode
* **Glowing Clock Orb:** Minimalist digital stopwatch and countdown timer with animated pulse indicator.
* **Quick Interval Presets:** Switch between open stopwatch, 15m, 25m Pomodoro, 45m deep work, 60m focus, and 5m refreshment break.
* **24-Hour Activity Breakdown:** Real-time breakdown of today's study hours, total break time, and activity percentage over 24 hours.
* **Daily Goal & Streak:** Set custom daily study targets (in hours) with automatic streak calculation.
* **Analytics & 3D Review Charts:** Visualize study distribution by subject and view weekly, monthly, or yearly progress.

### ⏳ 4. Exam Target Countdowns
* **Live Timers:** Add upcoming exam dates and track remaining days, hours, minutes, and seconds in real-time.
* **Category Badges:** Label countdown targets by exam authority or category.

### 🃏 5. Flashcards, BCS & Govt Job MCQ Engine & Mistake Bank
* **3D Flip Cards:** Create concept flashcards with 3D flip animation for quick revision and spaced repetition.
* **BCS & Govt Job MCQ Bank:** Over 55+ authentic BCS Preliminary, PSC, and combined bank exam questions across Bangla Literature, Bangla Grammar, English, Mathematics, Bangladesh Affairs, International Affairs, General Science, and Computer & ICT.
* **Auto-Shuffled Options:** Options are shuffled dynamically using Fisher-Yates while maintaining answer accuracy to prevent muscle memory bias.
* **Timed 20-Question Exam Mode:** Real-time 15-minute exam countdown timer with BCS standard negative marking (+1.00 for correct, -0.50 for wrong) and detailed score analytics.
* **Instant Explanations & Shortcuts:** Revealing step-by-step solutions and shortcut techniques immediately after each question.
* **AI Question Curator & Importer:** Built-in AI question harvester (+8 high-yield questions) with JSON import/export capability.
* **Mistake Bank (Weak Areas):** Missed questions automatically synchronize into the Mistake Bank with category tags, comparison of your answer vs. correct answer, and full reasoning.

### 📚 6. Syllabus Progress Tracker
* **Categories & Topics:** Create subject categories and add granular topics.
* **Progress Percentage:** Automatically calculates completion percentage and displays dynamic progress bars.

### 🖼️ 7. Quotes & 1080p Desktop Wallpaper Generator
* **Inspirational Carousel:** Displays curated quotes from famous thinkers alongside custom user-added quotes.
* **HD Canvas Wallpaper Export:** Generate and download custom 1920x1080 desktop wallpapers in PNG format with a single click.

### 🎨 8. Ultra-Modern UI & Customization
* **Dark & Light Modes:** Tailored color palettes with smooth transitions and persistent theme selection.
* **Live Clock & Fullscreen:** Header capsule with live time indicator and fullscreen toggle.
* **Local Data Backup:** Export/import all data via JSON files, plus experimental native File System Access auto-sync.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Core** | HTML5 (Semantic Structure & Accessibility), Pure Vanilla JavaScript (ES6+) |
| **Styling & Effects** | Vanilla CSS3 (Custom Properties, Glassmorphism, Aurora Gradients, Flexbox/Grid) |
| **Typography** | Google Fonts (*Plus Jakarta Sans* & *Outfit*) |
| **Data Persistence** | Browser `localStorage` with fallback adapter architecture |
| **Canvas & Graphics** | HTML5 Canvas API for 1920x1080 HD Wallpaper Generation |

---

## 📁 Project Directory Structure

```
chakri-prostuti-dashboard/
├── index.html              # Main application markup & layout
├── assets/
│   ├── css/
│   │   └── style.css       # Unified design system, glassmorphism, & animations
│   └── js/
│       └── script.js       # State management, timers, analytics, & event handlers
└── README.md               # Project documentation
```

---

## 🚀 How to Run Locally

No build tools or Node.js runtime required.

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/your-username/chakri-prostuti-dashboard.git
   ```
2. **Open in Browser:**
   Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. **Optional (Live Server):**
   If using VS Code, right-click `index.html` and choose **"Open with Live Server"**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
