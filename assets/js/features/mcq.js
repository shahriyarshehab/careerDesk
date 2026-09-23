/* ==========================================================================
   CareerDesk — BCS 1,000 MCQ Engine & Mistake Bank System
   Features:
   - 100% True Random Question Generation from 1,000 authentic BCS items
   - Randomized Option Choices (A, B, C, D) per question
   - Practice Mode: Instant feedback (+1.0 / -0.5), explanations, auto-mistake logging
   - 20-Question Timed Exam Mode: 15-min countdown, question navigator, comprehensive review
   - Mistake Bank: Targeted remediation, drill practice, and full management
   ========================================================================== */

const EXAM_QUESTION_COUNT = 20;
const EXAM_DURATION_SECONDS = 900; // 15 Minutes
// Note: MISTAKES_KEY is declared in core.js ('jobprep_mistakes_list')
const MCQ_STATS_KEY = 'careerdesk_mcq_session_stats';

// BCS 10 Subjects with metadata
const BCS_SUBJECT_META = {
  "বাংলা সাহিত্য": { icon: "book-open", color: "#6366f1", label: "বাংলা সাহিত্য" },
  "বাংলা ব্যাকরণ": { icon: "feather", color: "#8b5cf6", label: "বাংলা ব্যাকরণ" },
  "English": { icon: "languages", color: "#3b82f6", label: "English" },
  "বাংলাদেশ বিষয়াবলী": { icon: "map-pin", color: "#10b981", label: "বাংলাদেশ বিষয়াবলী" },
  "আন্তর্জাতিক বিষয়াবলী": { icon: "globe", color: "#06b6d4", label: "আন্তর্জাতিক বিষয়াবলী" },
  "সাধারণ বিজ্ঞান": { icon: "flask-conical", color: "#ec4899", label: "সাধারণ বিজ্ঞান" },
  "কম্পিউটার ও আইসিটি": { icon: "monitor", color: "#0ea5e9", label: "কম্পিউটার ও আইসিটি" },
  "গণিত": { icon: "calculator", color: "#f59e0b", label: "গণিত" },
  "ভূগোল ও পরিবেশ": { icon: "trees", color: "#10b981", label: "ভূগোল ও পরিবেশ" },
  "নৈতিকতা ও সুশাসন": { icon: "scale", color: "#64748b", label: "নৈতিকতা ও সুশাসন" }
};

const PREFIX_LETTERS = ["A", "B", "C", "D"];

// State Variables
let currentMCQMode = 'practice'; // 'practice' | 'exam'
let currentSelectedSubject = 'all';

// Practice Mode State
let practicePool = [];         // Shuffled queue of candidate questions
let practiceIndex = 0;         // Pointer in practicePool
let practiceAnswers = {};      // { [practiceIndex]: { selectedIndex, isCorrect } }
let practiceStats = { correct: 0, wrong: 0 };

// Exam Mode State
let examPool = [];             // 20 randomly drawn questions
let examIndex = 0;             // Pointer 0..19
let examAnswers = {};          // { [examIndex]: { selectedIndex } }
let examFlagged = {};          // { [examIndex]: boolean }
let examTimerInterval = null;
let examTimeRemaining = EXAM_DURATION_SECONDS;

// Mistakes Bank State
let mistakes = [];

// ==========================================================================
// 1. Storage & Helper Utilities
// ==========================================================================

function loadMistakes() {
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    mistakes = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(mistakes)) mistakes = [];
  } catch (e) {
    mistakes = [];
  }
  window.mistakes = mistakes;
  updateMistakeBadge();
}

function saveMistakes() {
  try {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
    if (typeof window.scheduleFirestoreSync === 'function') {
      window.scheduleFirestoreSync();
    }
  } catch (e) { }
  window.mistakes = mistakes;
  updateMistakeBadge();
}

function updateMistakeBadge() {
  const badge = document.getElementById("headerMistakeCountBadge");
  if (badge) {
    badge.textContent = String(mistakes.length);
    badge.style.display = mistakes.length > 0 ? "inline-block" : "none";
  }
}

// Fisher-Yates True Shuffle
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Prepare question with randomized options (A, B, C, D) while maintaining correct answer
function prepareQuestionWithOptionsShuffled(rawQ) {
  if (!rawQ || !Array.isArray(rawQ.options)) return rawQ;

  const optionsWithMeta = rawQ.options.map((optText, idx) => ({
    text: optText,
    isCorrect: idx === rawQ.correct
  }));

  const shuffledOptions = shuffleArray(optionsWithMeta);
  const correctIdx = shuffledOptions.findIndex(o => o.isCorrect);

  return {
    ...rawQ,
    originalId: rawQ.id,
    options: shuffledOptions.map(o => o.text),
    correct: correctIdx >= 0 ? correctIdx : 0
  };
}

const CUSTOM_MCQ_KEY = 'custom_bcs_questions_v3';

function getStoredQuestions() {
  try {
    const raw = localStorage.getItem(CUSTOM_MCQ_KEY) || localStorage.getItem('jobprep_custom_quiz_questions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
window.getStoredQuestions = getStoredQuestions;

function saveStoredQuestions(questions) {
  try {
    localStorage.setItem(CUSTOM_MCQ_KEY, JSON.stringify(questions));
    if (typeof window.scheduleFirestoreSync === 'function') {
      window.scheduleFirestoreSync();
    }
  } catch (e) { }
}

// Get Master Questions Bank (Curated BCS Bank + Custom Stored Questions)
function getMasterQuestions() {
  let base = [];
  if (typeof bcs1000QuestionBank !== 'undefined' && Array.isArray(bcs1000QuestionBank) && bcs1000QuestionBank.length > 0) {
    base = bcs1000QuestionBank;
  } else if (typeof defaultQuestions !== 'undefined' && Array.isArray(defaultQuestions)) {
    base = defaultQuestions;
  }
  const custom = getStoredQuestions();
  if (custom.length > 0) {
    return [...custom, ...base];
  }
  return base;
}

// Get Candidate Questions for the active subject filter
function getCandidateQuestions(subject = currentSelectedSubject) {
  const allMaster = getMasterQuestions();
  if (!subject || subject === 'all') {
    return allMaster;
  }

  const target = subject.trim().toLowerCase();
  return allMaster.filter(q => {
    const s = String(q.subject || '').trim();
    if (s.toLowerCase() === target) return true;
    if (typeof canonicalSubjectName === 'function') {
      return canonicalSubjectName(s).toLowerCase() === target;
    }
    return false;
  });
}

// ==========================================================================
// 2. Practice Mode Architecture (True Random Pool Engine)
// ==========================================================================

function buildPracticePool(subject = currentSelectedSubject, keepStats = false) {
  const candidates = getCandidateQuestions(subject);
  if (candidates.length === 0) {
    practicePool = [];
    practiceIndex = 0;
    return;
  }

  // Shuffle candidate questions randomly so questions are never serial
  const shuffledCandidates = shuffleArray(candidates);
  practicePool = shuffledCandidates.map(q => prepareQuestionWithOptionsShuffled(q));
  practiceIndex = 0;
  practiceAnswers = {};

  if (!keepStats) {
    practiceStats = { correct: 0, wrong: 0 };
  }
}

function jumpToRandomPracticeQuestion() {
  const candidates = getCandidateQuestions(currentSelectedSubject);
  if (candidates.length === 0) return;

  // Pick a random question that isn't the current one if possible
  let randomIndex = Math.floor(Math.random() * candidates.length);
  const currentQ = practicePool[practiceIndex];
  if (candidates.length > 1 && currentQ && candidates[randomIndex].id === currentQ.originalId) {
    randomIndex = (randomIndex + 1) % candidates.length;
  }

  const freshQ = prepareQuestionWithOptionsShuffled(candidates[randomIndex]);
  // Append after current index and advance immediately
  practicePool.splice(practiceIndex + 1, 0, freshQ);
  practiceIndex++;
  renderMCQQuestion();
  updateMCQStatsBar();
}

function advancePracticeQuestion() {
  if (practiceIndex < practicePool.length - 1) {
    practiceIndex++;
    renderMCQQuestion();
    updateMCQStatsBar();
  } else {
    // Reached end of current pool: re-shuffle and seamlessly continue
    const candidates = getCandidateQuestions(currentSelectedSubject);
    const reshuffled = shuffleArray(candidates).map(q => prepareQuestionWithOptionsShuffled(q));
    practicePool = practicePool.concat(reshuffled);
    practiceIndex++;
    renderMCQQuestion();
    updateMCQStatsBar();
    showToast("Re-shuffled 1,000 questions pool for continuous practice!", false);
  }
}

function previousPracticeQuestion() {
  if (practiceIndex > 0) {
    practiceIndex--;
    renderMCQQuestion();
    updateMCQStatsBar();
  }
}

// ==========================================================================
// 3. 20-Question Model Test Exam Mode
// ==========================================================================

function start20QuestionExam() {
  currentMCQMode = 'exam';
  examAnswers = {};
  examFlagged = {};
  examIndex = 0;
  examTimeRemaining = EXAM_DURATION_SECONDS;

  // Draw 20 purely random questions from current candidates (or all 1,000)
  const candidates = getCandidateQuestions(currentSelectedSubject);
  const count = Math.min(candidates.length, EXAM_QUESTION_COUNT);

  if (count < 5) {
    showToast(`At least 5 questions are required to start an exam (found ${count}).`, true);
    currentMCQMode = 'practice';
    return;
  }

  const shuffled = shuffleArray(candidates).slice(0, count);
  examPool = shuffled.map(q => prepareQuestionWithOptionsShuffled(q));

  // Toggle UI Elements
  const modeBanner = document.getElementById("mode-banner");
  const paletteContainer = document.getElementById("mcq-palette-container");
  const filterBar = document.getElementById("filter-bar");
  const btnPractice = document.getElementById("btnModePractice");
  const btnExam = document.getElementById("start-exam-20-btn");
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const modeBadge = document.getElementById("mcqCurrentModeBadge");

  if (modeBanner) modeBanner.style.display = "flex";
  if (paletteContainer) paletteContainer.style.display = "block";
  if (filterBar) filterBar.style.display = "none";
  if (btnPractice) btnPractice.classList.remove("active", "solid");
  if (btnExam) btnExam.classList.add("active", "solid");
  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";
  if (modeBadge) modeBadge.textContent = "20-Q Exam Mode";

  // Start Timer Countdown
  clearInterval(examTimerInterval);
  updateExamTimerDisplay();
  examTimerInterval = setInterval(() => {
    examTimeRemaining--;
    updateExamTimerDisplay();
    if (examTimeRemaining <= 0) {
      clearInterval(examTimerInterval);
      showToast("Time is up! Evaluating your model test...", false);
      submitExamEvaluation();
    }
  }, 1000);

  renderMCQQuestion();
  updateMCQStatsBar();
  renderExamPalette();
}

function updateExamTimerDisplay() {
  const timerEl = document.getElementById("exam-timer");
  if (!timerEl) return;
  const mins = Math.floor(Math.max(0, examTimeRemaining) / 60);
  const secs = Math.max(0, examTimeRemaining) % 60;
  timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function openExamSubmitConfirmation() {
  const modal = document.getElementById("examSubmitModal");
  if (!modal) {
    submitExamEvaluation();
    return;
  }

  const total = examPool.length;
  const answered = Object.keys(examAnswers).length;
  const unanswered = Math.max(0, total - answered);
  const flagged = Object.values(examFlagged).filter(Boolean).length;

  const elAns = document.getElementById("modalTallyAnswered");
  const elUnans = document.getElementById("modalTallyUnanswered");
  const elFlag = document.getElementById("modalTallyFlagged");

  if (elAns) elAns.textContent = String(answered);
  if (elUnans) elUnans.textContent = String(unanswered);
  if (elFlag) elFlag.textContent = String(flagged);

  modal.classList.add("open");
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeExamSubmitModal() {
  const modal = document.getElementById("examSubmitModal");
  if (modal) modal.classList.remove("open");
}

function submitExamEvaluation() {
  closeExamSubmitModal();
  clearInterval(examTimerInterval);

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  const total = examPool.length;

  examPool.forEach((q, idx) => {
    const userAns = examAnswers[idx];
    if (userAns && typeof userAns.selectedIndex === 'number') {
      const isRight = (userAns.selectedIndex === q.correct);
      userAns.isCorrect = isRight;
      if (isRight) {
        correctCount++;
      } else {
        wrongCount++;
        // Auto-save wrong question to Mistake Bank
        recordMistake({
          id: q.originalId || q.id || `mcq_${Date.now()}_${idx}`,
          q: q.question,
          subject: q.subject || "BCS Preliminary",
          yourAns: q.options[userAns.selectedIndex] || "",
          correctAns: q.options[q.correct] || "",
          explain: q.explanation || "No explanation provided."
        });
      }
    } else {
      skippedCount++;
    }
  });

  // Standard BCS Preliminary scoring: +1.0 for correct, -0.5 for wrong
  const rawScore = (correctCount * 1.0) - (wrongCount * 0.5);
  const netScore = Math.max(0, rawScore);

  renderExamSummary(correctCount, wrongCount, skippedCount, netScore, total);
}

function renderExamSummary(correctCount, wrongCount, skippedCount, netScore, total) {
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const modeBanner = document.getElementById("mode-banner");
  const paletteContainer = document.getElementById("mcq-palette-container");

  if (quizCard) quizCard.style.display = "none";
  if (paletteContainer) paletteContainer.style.display = "none";
  if (modeBanner) modeBanner.style.display = "none";
  if (!summaryCard) return;

  summaryCard.style.display = "block";

  const attempted = correctCount + wrongCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const percentage = total > 0 ? Math.round((netScore / total) * 100) : 0;
  const flaggedCount = Object.values(examFlagged).filter(Boolean).length;

  let gradeBadge = "";
  let gradeColor = "";
  if (netScore >= 16) {
    gradeBadge = "🌟 Outstanding! (Top Tier Aspirant)";
    gradeColor = "#10b981";
  } else if (netScore >= 12) {
    gradeBadge = "✓ Passed Preliminary Cutoff";
    gradeColor = "#3b82f6";
  } else if (netScore >= 9) {
    gradeBadge = "⚠️ Marginal Score (More practice recommended)";
    gradeColor = "#f59e0b";
  } else {
    gradeBadge = "✕ Below Qualifying Cutoff";
    gradeColor = "#f43f5e";
  }

  let reviewItemsHtml = "";
  examPool.forEach((q, idx) => {
    const userAns = examAnswers[idx];
    const isAnswered = Boolean(userAns && typeof userAns.selectedIndex === 'number');
    const isCorrect = isAnswered && userAns.selectedIndex === q.correct;
    const isSkipped = !isAnswered;
    const isFlagged = Boolean(examFlagged[idx]);

    let cardClass = isSkipped ? "review-card-skipped" : (isCorrect ? "review-card-correct" : "review-card-wrong");
    let statusPill = isSkipped
      ? `<span class="review-status-pill pill-skipped" style="background:rgba(148,163,184,0.15); color:var(--text-soft); font-size:11px; padding:3px 8px; border-radius:6px;">— Skipped (0.0)</span>`
      : (isCorrect
        ? `<span class="review-status-pill pill-correct" style="background:rgba(16,185,129,0.15); color:#10b981; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">✓ Correct (+1.0)</span>`
        : `<span class="review-status-pill pill-wrong" style="background:rgba(244,63,94,0.15); color:#f43f5e; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">✕ Incorrect (-0.5)</span>`);

    let optionsRowsHtml = "";
    q.options.forEach((optText, optIdx) => {
      let optClass = "review-opt-row";
      let optTag = "";
      if (optIdx === q.correct) {
        optClass += " opt-correct";
        optTag = `<span style="font-size:11.5px; color:#10b981; font-weight:700; margin-left:auto;">✓ Correct Answer</span>`;
      } else if (isAnswered && optIdx === userAns.selectedIndex && !isCorrect) {
        optClass += " opt-wrong";
        optTag = `<span style="font-size:11.5px; color:#f43f5e; font-weight:700; margin-left:auto;">✕ Your Choice</span>`;
      }
      optionsRowsHtml += `
        <div class="${optClass}" style="display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; margin-bottom:6px; background:var(--surface); border:1px solid var(--border);">
          <span style="font-weight:700; width:22px; height:22px; border-radius:6px; background:var(--surface-strong); display:flex; align-items:center; justify-content:center; font-size:12px;">${PREFIX_LETTERS[optIdx]}</span>
          <span style="font-size:13.5px; color:var(--text);">${escapeHtml(optText)}</span>
          ${optTag}
        </div>
      `;
    });

    reviewItemsHtml += `
      <div class="review-card glass ${cardClass}" data-review-status="${isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'wrong')}" data-flagged="${isFlagged ? 'true' : 'false'}" style="padding:16px 18px; border-radius:12px; margin-bottom:14px; border:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="q-badge" style="font-size:11px; padding:2px 8px; border-radius:6px;">${escapeHtml(q.subject || "BCS Preliminary")}</span>
            <span style="font-weight:700; font-size:13px; color:var(--text-soft);">Question ${idx + 1} of ${total}</span>
            ${isFlagged ? `<span style="font-size:11px; color:#f59e0b; background:rgba(245,158,11,0.15); padding:2px 6px; border-radius:4px; font-weight:600;">Flagged</span>` : ''}
          </div>
          <div>${statusPill}</div>
        </div>
        <div style="font-size:15px; font-weight:700; color:var(--text); line-height:1.4; margin-bottom:12px;">
          ${idx + 1}. ${escapeHtml(q.question)}
        </div>
        <div class="review-options-list" style="margin-bottom:12px;">
          ${optionsRowsHtml}
        </div>
        <div style="font-size:13px; color:var(--text-soft); line-height:1.5; background:rgba(99,102,241,0.06); padding:10px 14px; border-radius:8px; border-left:3px solid var(--accent1);">
          <strong style="color:var(--accent1);"><i data-lucide="lightbulb" style="width:13px; height:13px; vertical-align:middle;"></i> Explanation &amp; Shortcut:</strong>
          <div style="margin-top:4px;">${escapeHtml(q.explanation || "No explanation provided.")}</div>
        </div>
      </div>
    `;
  });

  summaryCard.innerHTML = `
    <div class="exam-summary-wrapper" style="padding:10px 0;">
      <div style="text-align:center; margin-bottom:20px;">
        <div style="display:inline-block; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700; background:${gradeColor}18; color:${gradeColor}; border:1px solid ${gradeColor}50; margin-bottom:8px;">
          ${gradeBadge}
        </div>
        <h2 style="font-family:var(--font-display); font-size:1.4rem; margin:0 0 6px; color:var(--text);">
          BCS 20-Question Model Test Results
        </h2>
        <p style="font-size:13px; color:var(--text-soft); margin:0;">
          BCS Preliminary Negative Marking Applied (+1.0 / -0.5)
        </p>
      </div>

      <div class="glass" style="padding:20px; border-radius:14px; text-align:center; margin-bottom:18px; border:1px solid var(--border);">
        <div style="font-family:var(--font-display); font-size:2.4rem; font-weight:800; color:${gradeColor}; line-height:1;">
          ${netScore.toFixed(2)} <span style="font-size:1.1rem; color:var(--text-soft); font-weight:600;">/ ${total}.00</span>
        </div>
        <div style="font-size:13px; color:var(--text-soft); margin-top:8px;">
          Net Score &bull; Accuracy: <b style="color:var(--text);">${accuracy}%</b> &bull; Score Rate: <b style="color:var(--text);">${percentage}%</b>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:22px;">
        <div class="glass" style="padding:12px; border-radius:12px; text-align:center; border:1px solid var(--border);">
          <div style="font-weight:800; font-size:1.4rem; color:#10b981;">${correctCount}</div>
          <div style="font-size:11px; text-transform:uppercase; color:var(--text-soft); font-weight:700;">✓ Correct (+${(correctCount * 1.0).toFixed(1)})</div>
        </div>
        <div class="glass" style="padding:12px; border-radius:12px; text-align:center; border:1px solid var(--border);">
          <div style="font-weight:800; font-size:1.4rem; color:#f43f5e;">${wrongCount}</div>
          <div style="font-size:11px; text-transform:uppercase; color:var(--text-soft); font-weight:700;">✕ Wrong (-${(wrongCount * 0.5).toFixed(1)})</div>
        </div>
        <div class="glass" style="padding:12px; border-radius:12px; text-align:center; border:1px solid var(--border);">
          <div style="font-weight:800; font-size:1.4rem; color:var(--text-soft);">${skippedCount}</div>
          <div style="font-size:11px; text-transform:uppercase; color:var(--text-soft); font-weight:700;">— Skipped (0.0)</div>
        </div>
      </div>

      <div class="btn-group" style="justify-content:center; margin-bottom:26px;">
        <button class="pill solid btn-exam20" id="summaryRetakeExamBtn" type="button" style="padding:10px 22px; font-weight:700;">
          <i data-lucide="zap"></i> <span>Start New 20-Q Exam</span>
        </button>
        <button class="pill" id="summaryBackPracticeBtn" type="button" style="padding:10px 20px;">
          <i data-lucide="book-open"></i> <span>Back to Practice Mode</span>
        </button>
        ${wrongCount > 0 ? `
          <button class="pill danger" id="summaryViewMistakesBtn" type="button" style="padding:10px 20px;">
            <i data-lucide="alert-circle"></i> <span>Review Mistakes (${wrongCount})</span>
          </button>
        ` : ''}
      </div>

      <div class="exam-review-section">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border); padding-bottom:10px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--text);">Question Review &amp; Explanations</h3>
            <span style="font-size:12px; color:var(--text-soft);">Complete solutions for all 20 questions</span>
          </div>
          <div class="review-filter-chips" style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="pill subtle active" data-review-filter="all" style="font-size:11.5px; padding:4px 10px;">All (${total})</button>
            <button class="pill subtle" data-review-filter="correct" style="font-size:11.5px; padding:4px 10px; color:#10b981;">✓ Correct (${correctCount})</button>
            <button class="pill subtle" data-review-filter="wrong" style="font-size:11.5px; padding:4px 10px; color:#f43f5e;">✕ Wrong (${wrongCount})</button>
            <button class="pill subtle" data-review-filter="skipped" style="font-size:11.5px; padding:4px 10px;">— Skipped (${skippedCount})</button>
            ${flaggedCount > 0 ? `<button class="pill subtle" data-review-filter="flagged" style="font-size:11.5px; padding:4px 10px; color:#f59e0b;">Flagged (${flaggedCount})</button>` : ''}
          </div>
        </div>

        <div class="exam-review-list">
          ${reviewItemsHtml}
        </div>
      </div>
    </div>
  `;

  // Review Filter handling
  const filterPills = summaryCard.querySelectorAll("[data-review-filter]");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active", "solid"));
      pill.classList.add("active", "solid");
      const filterVal = pill.getAttribute("data-review-filter");
      summaryCard.querySelectorAll(".review-card").forEach(card => {
        if (filterVal === "all") {
          card.style.display = "block";
        } else if (filterVal === "correct") {
          card.style.display = card.getAttribute("data-review-status") === "correct" ? "block" : "none";
        } else if (filterVal === "wrong") {
          card.style.display = card.getAttribute("data-review-status") === "wrong" ? "block" : "none";
        } else if (filterVal === "skipped") {
          card.style.display = card.getAttribute("data-review-status") === "skipped" ? "block" : "none";
        } else if (filterVal === "flagged") {
          card.style.display = card.getAttribute("data-flagged") === "true" ? "block" : "none";
        }
      });
    });
  });

  const retakeBtn = document.getElementById("summaryRetakeExamBtn");
  if (retakeBtn) retakeBtn.addEventListener("click", start20QuestionExam);

  const backBtn = document.getElementById("summaryBackPracticeBtn");
  if (backBtn) backBtn.addEventListener("click", switchToPracticeMode);

  const viewMistakesBtn = document.getElementById("summaryViewMistakesBtn");
  if (viewMistakesBtn) {
    viewMistakesBtn.addEventListener("click", () => {
      const mistakeTab = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
      if (mistakeTab) mistakeTab.click();
    });
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function switchToPracticeMode() {
  clearInterval(examTimerInterval);
  currentMCQMode = 'practice';

  const modeBanner = document.getElementById("mode-banner");
  const paletteContainer = document.getElementById("mcq-palette-container");
  const filterBar = document.getElementById("filter-bar");
  const btnPractice = document.getElementById("btnModePractice");
  const btnExam = document.getElementById("start-exam-20-btn");
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const modeBadge = document.getElementById("mcqCurrentModeBadge");

  if (modeBanner) modeBanner.style.display = "none";
  if (paletteContainer) paletteContainer.style.display = "none";
  if (filterBar) filterBar.style.display = "flex";
  if (btnPractice) btnPractice.classList.add("active", "solid");
  if (btnExam) btnExam.classList.remove("active", "solid");
  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";
  if (modeBadge) modeBadge.textContent = "Practice Mode";

  if (!practicePool.length) {
    buildPracticePool(currentSelectedSubject);
  }

  renderMCQQuestion();
  updateMCQStatsBar();
}

function renderExamPalette() {
  const container = document.getElementById("mcq-palette-container");
  const grid = document.getElementById("mcq-palette-grid");
  if (!container || !grid || currentMCQMode !== 'exam') return;

  grid.innerHTML = "";
  examPool.forEach((q, idx) => {
    const isCurrent = (idx === examIndex);
    const isAnswered = Boolean(examAnswers[idx] && typeof examAnswers[idx].selectedIndex === 'number');
    const isFlagged = Boolean(examFlagged[idx]);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "palette-chip" +
      (isCurrent ? " current" : "") +
      (isAnswered ? " answered" : "") +
      (isFlagged ? " flagged" : "");
    chip.textContent = String(idx + 1);
    chip.title = `Question ${idx + 1}${isFlagged ? " (Flagged)" : (isAnswered ? " (Answered)" : "")}`;
    chip.addEventListener("click", () => {
      examIndex = idx;
      renderMCQQuestion();
      updateMCQStatsBar();
      renderExamPalette();
    });
    grid.appendChild(chip);
  });
}

function toggleExamFlagCurrent() {
  if (currentMCQMode !== 'exam') return;
  examFlagged[examIndex] = !examFlagged[examIndex];
  renderMCQQuestion();
  renderExamPalette();
}

// ==========================================================================
// 4. Core Question & Option Rendering Engine
// ==========================================================================

function getCurrentActiveQuestion() {
  if (currentMCQMode === 'exam') {
    return examPool[examIndex] || null;
  }
  return practicePool[practiceIndex] || null;
}

function renderMCQQuestion() {
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const qSubject = document.getElementById("q-subject");
  const qSourceTag = document.getElementById("q-source-tag");
  const qCounterBadge = document.getElementById("q-counter-badge");
  const qFlagBtn = document.getElementById("qFlagBtn");
  const qFlagText = document.getElementById("qFlagText");
  const qText = document.getElementById("q-text");
  const optionsContainer = document.getElementById("options-container");
  const explanationBox = document.getElementById("explanation-box");
  const explanationText = document.getElementById("explanation-text");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (!quizCard) return;
  quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";

  const q = getCurrentActiveQuestion();
  if (!q) {
    if (qText) qText.textContent = "No questions found for this subject.";
    if (optionsContainer) optionsContainer.innerHTML = "";
    if (explanationBox) explanationBox.classList.remove("show");
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  // Render Question Meta
  const subj = q.subject || "BCS Preliminary";
  const meta = BCS_SUBJECT_META[subj] || (typeof getSubjectMeta === 'function' ? getSubjectMeta(subj) : { icon: 'book-open' });

  if (qSubject) {
    qSubject.innerHTML = `<i data-lucide="${meta.icon || 'book-open'}" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i> <span>${escapeHtml(subj)}</span>`;
  }
  if (qSourceTag) {
    qSourceTag.textContent = "BCS Question Pool";
  }

  // Counter Badge & Flag Controls
  if (currentMCQMode === 'exam') {
    if (qCounterBadge) {
      qCounterBadge.innerHTML = `<i data-lucide="hash" style="width:12px; height:12px; vertical-align:middle;"></i> Question ${examIndex + 1} of ${examPool.length}`;
    }
    if (qFlagBtn && qFlagText) {
      qFlagBtn.style.display = "inline-flex";
      const isFlagged = Boolean(examFlagged[examIndex]);
      qFlagBtn.classList.toggle("flagged", isFlagged);
      qFlagText.textContent = isFlagged ? "Flagged" : "Mark for Review";
      qFlagBtn.title = isFlagged ? "Click to remove review flag" : "Mark this question to review before submitting";
    }
  } else {
    if (qCounterBadge) {
      qCounterBadge.innerHTML = `<i data-lucide="shuffle" style="width:12px; height:12px; vertical-align:middle;"></i> Random Q #${practiceIndex + 1}`;
    }
    if (qFlagBtn && qFlagText) {
      qFlagBtn.style.display = "inline-flex";
      const isBookmarked = mistakes.some(m => m.q === q.question || String(m.id) === String(q.originalId || q.id));
      qFlagBtn.classList.toggle("flagged", isBookmarked);
      qFlagText.textContent = isBookmarked ? "Saved in Mistakes" : "Save to Mistakes";
      qFlagBtn.title = isBookmarked ? "Question is recorded in your Mistake Bank" : "Bookmark this question into your Mistake Bank";
    }
  }

  // Question Text
  if (qText) {
    const qNumberPrefix = currentMCQMode === 'exam' ? `${examIndex + 1}. ` : `${practiceIndex + 1}. `;
    qText.textContent = qNumberPrefix + q.question;
  }

  // Render Options
  if (optionsContainer) {
    optionsContainer.innerHTML = "";

    if (currentMCQMode === 'exam') {
      // EXAM MODE: Neutral selection, no instant answers
      const recorded = examAnswers[examIndex];
      const selectedIdx = recorded ? recorded.selectedIndex : undefined;

      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isSelected = (selectedIdx === optIdx);
        btn.className = "quiz-opt-btn" + (isSelected ? " selected-exam" : "");
        btn.innerHTML = `
          <div style="display:flex; align-items:center; gap:12px; width:100%;">
            <span style="font-weight:700; width:26px; height:26px; border-radius:8px; background:var(--surface-strong); display:flex; align-items:center; justify-content:center; font-size:12.5px; flex-shrink:0;">${PREFIX_LETTERS[optIdx]}</span>
            <span style="font-size:14px; line-height:1.4; flex-grow:1;">${escapeHtml(optText)}</span>
            ${isSelected ? '<span style="font-size:11.5px; color:var(--accent1); font-weight:700; margin-left:auto;">Selected</span>' : ''}
          </div>
        `;
        btn.onclick = () => selectOption(optIdx);
        optionsContainer.appendChild(btn);
      });

      if (explanationBox) explanationBox.classList.remove("show");

    } else {
      // PRACTICE MODE: Instant feedback and explanations
      const recorded = practiceAnswers[practiceIndex];

      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-opt-btn";

        let statusTag = "";
        if (recorded !== undefined) {
          btn.disabled = true;
          if (optIdx === q.correct) {
            btn.classList.add("correct");
            statusTag = `<span style="color:#10b981; font-weight:700; font-size:12px; margin-left:auto;">✓ Correct</span>`;
          } else if (optIdx === recorded.selectedIndex && !recorded.isCorrect) {
            btn.classList.add("wrong");
            statusTag = `<span style="color:#f43f5e; font-weight:700; font-size:12px; margin-left:auto;">✕ Your Choice</span>`;
          }
        } else {
          btn.onclick = () => selectOption(optIdx);
        }

        btn.innerHTML = `
          <div style="display:flex; align-items:center; gap:12px; width:100%;">
            <span style="font-weight:700; width:26px; height:26px; border-radius:8px; background:var(--surface-strong); display:flex; align-items:center; justify-content:center; font-size:12.5px; flex-shrink:0;">${PREFIX_LETTERS[optIdx]}</span>
            <span style="font-size:14px; line-height:1.4; flex-grow:1;">${escapeHtml(optText)}</span>
            ${statusTag}
          </div>
        `;
        optionsContainer.appendChild(btn);
      });

      // Explanation Box
      if (recorded !== undefined && explanationBox && explanationText) {
        if (recorded.isCorrect) {
          explanationText.innerHTML = `
            <div style="color:#10b981; font-weight:700; font-size:13px; margin-bottom:6px;">✓ Correct (+1.0 point earned)</div>
            <div>${escapeHtml(q.explanation || "No explanation provided.")}</div>
          `;
        } else {
          const chosenText = escapeHtml(q.options[recorded.selectedIndex] || "");
          const rightText = escapeHtml(q.options[q.correct] || "");
          explanationText.innerHTML = `
            <div style="color:#f43f5e; font-weight:700; font-size:13px; margin-bottom:6px;">✕ Incorrect (-0.5 negative marking) &bull; Auto-saved to Mistake Bank</div>
            <div style="font-size:13px; margin-bottom:6px;">
              <strong>Your Choice:</strong> <span style="color:#f43f5e;">${chosenText}</span> &nbsp;|&nbsp;
              <strong>Correct Answer:</strong> <span style="color:#10b981;">${rightText}</span>
            </div>
            <div><strong>Explanation:</strong> ${escapeHtml(q.explanation || "No explanation provided.")}</div>
          `;
        }
        explanationBox.classList.add("show");
      } else if (explanationBox) {
        explanationBox.classList.remove("show");
      }
    }
  }

  // Navigation Buttons
  if (prevBtn) {
    if (currentMCQMode === 'exam') {
      prevBtn.style.display = examIndex > 0 ? "inline-flex" : "none";
    } else {
      prevBtn.style.display = practiceIndex > 0 ? "inline-flex" : "none";
    }
  }

  if (nextBtn) {
    nextBtn.style.display = "inline-flex";
    if (currentMCQMode === 'exam') {
      if (examIndex === examPool.length - 1) {
        nextBtn.innerHTML = `<span>Finish &amp; Submit</span> <i data-lucide="check-circle"></i>`;
      } else {
        nextBtn.innerHTML = `<span>Next Question</span> <i data-lucide="arrow-right"></i>`;
      }
    } else {
      nextBtn.innerHTML = `<i data-lucide="shuffle"></i> <span>Next Random Question</span> <i data-lucide="arrow-right"></i>`;
    }
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function selectOption(selectedIdx) {
  const q = getCurrentActiveQuestion();
  if (!q) return;

  if (currentMCQMode === 'exam') {
    // Record Exam Answer
    examAnswers[examIndex] = { selectedIndex: selectedIdx };
    renderMCQQuestion();
    renderExamPalette();
    updateMCQStatsBar();
    return;
  }

  // PRACTICE MODE: Check if already answered
  if (practiceAnswers[practiceIndex] !== undefined) return;

  const isCorrect = (selectedIdx === q.correct);
  practiceAnswers[practiceIndex] = { selectedIndex: selectedIdx, isCorrect };

  if (isCorrect) {
    practiceStats.correct++;
  } else {
    practiceStats.wrong++;
    // Auto-record to Mistake Bank
    recordMistake({
      id: q.originalId || q.id || `mcq_${Date.now()}`,
      q: q.question,
      subject: q.subject || "BCS Preliminary",
      yourAns: q.options[selectedIdx] || "",
      correctAns: q.options[q.correct] || "",
      explain: q.explanation || "No explanation provided."
    });
  }

  renderMCQQuestion();
  updateMCQStatsBar();
}

function recordMistake(item) {
  if (!item || !item.q) return;
  const exists = mistakes.some(m => m.q === item.q || (item.id && String(m.id) === String(item.id)));
  if (!exists) {
    mistakes.unshift({
      id: item.id || `m_${Date.now()}`,
      q: item.q,
      subject: item.subject || "General",
      yourAns: item.yourAns || "",
      correctAns: item.correctAns || "",
      explain: item.explain || "No explanation provided.",
      date: new Date().toLocaleDateString()
    });
    saveMistakes();
    renderMistakes();
  }
}

function toggleFlagOrBookmark() {
  if (currentMCQMode === 'exam') {
    toggleExamFlagCurrent();
    return;
  }

  // In Practice Mode: Bookmark current question to Mistake Bank
  const q = getCurrentActiveQuestion();
  if (!q) return;

  const existingIdx = mistakes.findIndex(m => m.q === q.question || String(m.id) === String(q.originalId || q.id));
  if (existingIdx !== -1) {
    mistakes.splice(existingIdx, 1);
    saveMistakes();
    renderMistakes();
    showToast("Question removed from Mistake Bank");
  } else {
    recordMistake({
      id: q.originalId || q.id,
      q: q.question,
      subject: q.subject,
      yourAns: "Bookmarked for practice",
      correctAns: q.options[q.correct] || "",
      explain: q.explanation || "No explanation provided."
    });
    showToast("Question saved to Mistake Bank for revision!");
  }
  renderMCQQuestion();
}

// ==========================================================================
// 5. Dashboard Stats Bar Updates
// ==========================================================================

function updateMCQStatsBar() {
  const currentIndexEl = document.getElementById("current-index");
  const progressBar = document.getElementById("mcqProgressBar");
  const correctCountEl = document.getElementById("correct-count");
  const wrongCountEl = document.getElementById("wrong-count");
  const scoreValEl = document.getElementById("score-val");

  if (currentMCQMode === 'exam') {
    const total = examPool.length || EXAM_QUESTION_COUNT;
    const answeredCount = Object.keys(examAnswers).length;
    const remainingCount = Math.max(0, total - answeredCount);

    if (currentIndexEl) currentIndexEl.textContent = `${examIndex + 1} / ${total}`;
    if (progressBar) {
      const pct = Math.min(100, Math.round(((examIndex + 1) / total) * 100));
      progressBar.style.width = `${pct}%`;
    }
    if (correctCountEl) {
      correctCountEl.textContent = String(answeredCount);
      const lbl = correctCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Answered";
    }
    if (wrongCountEl) {
      wrongCountEl.textContent = String(remainingCount);
      const lbl = wrongCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Remaining";
    }
    if (scoreValEl) {
      scoreValEl.textContent = "Locked";
      const lbl = scoreValEl.nextElementSibling;
      if (lbl) lbl.textContent = "Results on Submit";
    }
  } else {
    const totalCandidates = getCandidateQuestions(currentSelectedSubject).length || 1000;
    const studiedCount = practiceIndex + 1;

    if (currentIndexEl) currentIndexEl.textContent = `${studiedCount} / ${totalCandidates}`;
    if (progressBar) {
      const pct = Math.min(100, Math.max(1, Math.round((studiedCount / totalCandidates) * 100)));
      progressBar.style.width = `${pct}%`;
    }
    if (correctCountEl) {
      correctCountEl.textContent = String(practiceStats.correct);
      const lbl = correctCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Correct (+1.0)";
    }
    if (wrongCountEl) {
      wrongCountEl.textContent = String(practiceStats.wrong);
      const lbl = wrongCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Incorrect (-0.5)";
    }
    const netMarks = (practiceStats.correct * 1.0) - (practiceStats.wrong * 0.5);
    if (scoreValEl) {
      scoreValEl.textContent = netMarks.toFixed(2);
      const lbl = scoreValEl.nextElementSibling;
      if (lbl) lbl.textContent = "Net Score";
    }
  }
}

// ==========================================================================
// 6. Category Filter Bar (10 BCS Subjects + All)
// ==========================================================================

function renderMCQFilterBar() {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;

  const allMaster = getMasterQuestions();
  const subjectCounts = {};
  allMaster.forEach(q => {
    const s = String(q.subject || '').trim();
    if (s) subjectCounts[s] = (subjectCounts[s] || 0) + 1;
  });

  const allCount = allMaster.length || 1000;
  let html = `
    <button type="button" class="filter-pill ${currentSelectedSubject === 'all' ? 'active' : ''}" data-subject="all">
      <i data-lucide="layers" style="width:13px; height:13px;"></i>
      <span>All Subjects (${allCount})</span>
    </button>
  `;

  Object.keys(BCS_SUBJECT_META).forEach(subj => {
    const meta = BCS_SUBJECT_META[subj];
    const count = subjectCounts[subj] || 0;
    const isActive = (currentSelectedSubject === subj);
    html += `
      <button type="button" class="filter-pill ${isActive ? 'active' : ''}" data-subject="${escapeAttr(subj)}">
        <i data-lucide="${meta.icon}" style="width:13px; height:13px;"></i>
        <span>${escapeHtml(subj)} (${count})</span>
      </button>
    `;
  });

  filterBar.innerHTML = html;

  filterBar.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const targetSubj = pill.getAttribute("data-subject") || 'all';
      currentSelectedSubject = targetSubj;
      filterBar.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      // Rebuild random pool for selected subject
      buildPracticePool(currentSelectedSubject);
      renderMCQQuestion();
      updateMCQStatsBar();
    });
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// ==========================================================================
// 7. Mistake Bank Management
// ==========================================================================

function renderMistakes() {
  const list = document.getElementById("mistakeBankList");
  if (!list) return;

  updateMistakeBadge();

  if (!mistakes.length) {
    list.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:var(--text-soft);">
        <i data-lucide="check-circle" style="width:40px; height:40px; color:#10b981; margin-bottom:10px; display:inline-block;"></i>
        <div style="font-weight:700; font-size:15px; color:var(--text); margin-bottom:4px;">No mistakes recorded!</div>
        <p style="font-size:13px; margin:0;">Great job! As you practice quizzes, missed questions will appear here for targeted remediation.</p>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    return;
  }

  let html = "";
  mistakes.forEach((m, idx) => {
    const meta = BCS_SUBJECT_META[m.subject] || { icon: 'alert-circle' };
    html += `
      <div class="mistake-card glass" style="padding:16px 18px; margin-bottom:12px; border-radius:12px; border:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:10px;">
          <h4 style="margin:0; font-size:15px; font-weight:700; color:var(--text); line-height:1.4;">${escapeHtml(m.q)}</h4>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            ${m.subject ? `<span class="q-badge" style="font-size:11px; padding:2px 8px; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="${meta.icon}" style="width:12px; height:12px;"></i> <span>${escapeHtml(m.subject)}</span></span>` : ""}
            <button class="pill danger mistake-del-btn" data-del-mistake="${idx}" title="Remove question from Mistake Bank" aria-label="Remove question" style="padding:4px 10px; font-size:11px;">
              <i data-lucide="trash-2" style="width:12px; height:12px;"></i> <span>Remove</span>
            </button>
          </div>
        </div>
        <div class="mistake-ans-row" style="display:flex; gap:14px; margin-bottom:8px; flex-wrap:wrap; font-size:13px;">
          <span style="color:#f43f5e; font-weight:600;">Your Choice: ${escapeHtml(m.yourAns || "None")}</span>
          <span style="color:#10b981; font-weight:600;">Correct Answer: ${escapeHtml(m.correctAns || "N/A")}</span>
        </div>
        <div style="font-size:13px; color:var(--text-soft); line-height:1.5; background:rgba(99,102,241,0.06); padding:8px 12px; border-radius:8px; border-left:3px solid var(--accent1);">
          <strong>Explanation:</strong> ${escapeHtml(m.explain || "No explanation recorded.")}
        </div>
      </div>
    `;
  });

  list.innerHTML = html;

  list.querySelectorAll("[data-del-mistake]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-del-mistake]");
      if (!targetBtn) return;
      const i = parseInt(targetBtn.getAttribute("data-del-mistake"), 10);
      if (isNaN(i)) return;
      mistakes.splice(i, 1);
      saveMistakes();
      renderMistakes();
      showToast("Question removed from Mistake Bank");
    });
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function practiceAllMistakes() {
  if (!mistakes.length) {
    showToast("No mistakes recorded to practice!", true);
    return;
  }

  // Switch to quiz subview
  const quizTab = document.querySelector("#quizFlashSwitch [data-view='quiz']");
  if (quizTab) quizTab.click();

  // Find candidate questions matching the mistake texts
  const allMaster = getMasterQuestions();
  const mistakeQuestions = [];

  mistakes.forEach(m => {
    const found = allMaster.find(q => q.question === m.q || String(q.id) === String(m.id));
    if (found) {
      mistakeQuestions.push(found);
    } else {
      mistakeQuestions.push({
        id: m.id,
        subject: m.subject || "Mistake Bank",
        question: m.q,
        options: [m.correctAns, m.yourAns, "None of the above", "Both are applicable"],
        correct: 0,
        explanation: m.explain
      });
    }
  });

  currentMCQMode = 'practice';
  practicePool = shuffleArray(mistakeQuestions).map(q => prepareQuestionWithOptionsShuffled(q));
  practiceIndex = 0;
  practiceAnswers = {};
  practiceStats = { correct: 0, wrong: 0 };

  switchToPracticeMode();
  showToast(`Loaded ${practicePool.length} mistakes for targeted practice!`);
}

function clearAllMistakes() {
  if (!mistakes.length) {
    showToast("Mistake bank is already empty.");
    return;
  }
  if (window.confirm("Are you sure you want to clear all recorded mistakes?")) {
    mistakes = [];
    saveMistakes();
    renderMistakes();
    showToast("Mistake bank cleared successfully.");
  }
}

// ==========================================================================
// 8. Bootstrap & Event Listeners
// ==========================================================================

function initMCQEngine() {
  loadMistakes();

  // Subview Switcher (MCQ Quiz vs Mistake Bank)
  const quizFlashSwitch = document.getElementById("quizFlashSwitch");
  if (quizFlashSwitch) {
    quizFlashSwitch.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      quizFlashSwitch.querySelectorAll(".chip").forEach(c => c.classList.remove("active", "solid"));
      chip.classList.add("active", "solid");
      const view = chip.dataset.view;

      const subQuiz = document.getElementById("subview-quiz");
      const subMistakes = document.getElementById("subview-mistakes");

      if (subQuiz) subQuiz.style.display = (view === "quiz") ? "block" : "none";
      if (subMistakes) subMistakes.style.display = (view === "mistakes") ? "block" : "none";

      if (view === "mistakes") {
        renderMistakes();
      }
    });
  }

  // Mode Buttons
  const btnPractice = document.getElementById("btnModePractice");
  if (btnPractice) {
    btnPractice.addEventListener("click", () => {
      if (currentMCQMode === 'exam') {
        if (window.confirm("Switch to Practice Mode? Current 20-Q Exam will be terminated.")) {
          switchToPracticeMode();
        }
      } else {
        switchToPracticeMode();
      }
    });
  }

  const startExam20Btn = document.getElementById("start-exam-20-btn");
  if (startExam20Btn) {
    startExam20Btn.addEventListener("click", start20QuestionExam);
  }

  // Quick Tools
  const randomQuestionBtn = document.getElementById("randomQuestionBtn");
  if (randomQuestionBtn) {
    randomQuestionBtn.addEventListener("click", () => {
      if (currentMCQMode === 'exam') {
        showToast("Random Question button is only active during Practice Mode.", true);
        return;
      }
      jumpToRandomPracticeQuestion();
    });
  }

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (currentMCQMode === 'exam') {
        if (window.confirm("Restart exam with fresh questions?")) {
          start20QuestionExam();
        }
      } else {
        buildPracticePool(currentSelectedSubject);
        renderMCQQuestion();
        updateMCQStatsBar();
        showToast("Question pool re-shuffled and stats reset!");
      }
    });
  }

  // Question Card Actions
  const qFlagBtn = document.getElementById("qFlagBtn");
  if (qFlagBtn) {
    qFlagBtn.addEventListener("click", toggleFlagOrBookmark);
  }

  const prevBtn = document.getElementById("prev-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentMCQMode === 'exam') {
        if (examIndex > 0) {
          examIndex--;
          renderMCQQuestion();
          updateMCQStatsBar();
          renderExamPalette();
        }
      } else {
        previousPracticeQuestion();
      }
    });
  }

  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentMCQMode === 'exam') {
        if (examIndex < examPool.length - 1) {
          examIndex++;
          renderMCQQuestion();
          updateMCQStatsBar();
          renderExamPalette();
        } else {
          openExamSubmitConfirmation();
        }
      } else {
        advancePracticeQuestion();
      }
    });
  }

  // Exam Finish & Modal Submit
  const finishEarlyBtn = document.getElementById("finishEarlyBtn");
  if (finishEarlyBtn) {
    finishEarlyBtn.addEventListener("click", openExamSubmitConfirmation);
  }

  const btnConfirmSubmit = document.getElementById("btnConfirmSubmitExam");
  if (btnConfirmSubmit) {
    btnConfirmSubmit.addEventListener("click", submitExamEvaluation);
  }

  const btnCancelSubmit = document.getElementById("btnCancelSubmitExam");
  if (btnCancelSubmit) {
    btnCancelSubmit.addEventListener("click", closeExamSubmitModal);
  }

  const examModal = document.getElementById("examSubmitModal");
  if (examModal) {
    examModal.addEventListener("click", (e) => {
      if (e.target === examModal) closeExamSubmitModal();
    });
  }

  // Mistake Bank Action Buttons
  const practiceMistakesQuizBtn = document.getElementById("practiceMistakesQuizBtn");
  if (practiceMistakesQuizBtn) {
    practiceMistakesQuizBtn.addEventListener("click", practiceAllMistakes);
  }

  const clearMistakesBtn = document.getElementById("clearMistakesBtn");
  if (clearMistakesBtn) {
    clearMistakesBtn.addEventListener("click", clearAllMistakes);
  }

  // Summary Card Action Buttons
  const retake20Btn = document.getElementById("retake-20-btn");
  if (retake20Btn) {
    retake20Btn.addEventListener("click", start20QuestionExam);
  }

  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) {
    restartBtn.addEventListener("click", switchToPracticeMode);
  }

  // Manage Questions Modal Controls
  const btnOpenManageQuestions = document.getElementById("btnOpenManageQuestions");
  if (btnOpenManageQuestions) {
    btnOpenManageQuestions.addEventListener("click", openManageQuestionsModal);
  }

  const mcqModalTabSwitch = document.getElementById("mcqModalTabSwitch");
  if (mcqModalTabSwitch) {
    mcqModalTabSwitch.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip && chip.dataset.tab) {
        setManageQuestionsTab(chip.dataset.tab);
      }
    });
  }

  const addQuestionForm = document.getElementById("add-question-form");
  if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", handleAddCustomQuestion);
  }

  const btnExportJson = document.getElementById("btn-export-mcq-json");
  if (btnExportJson) {
    btnExportJson.addEventListener("click", handleExportMCQJson);
  }

  const btnImportJson = document.getElementById("btn-import-json");
  if (btnImportJson) {
    btnImportJson.addEventListener("click", handleImportMCQJson);
  }

  // Initial Pool Build and First Render
  buildPracticePool(currentSelectedSubject);
  renderMCQFilterBar();
  renderMCQQuestion();
  updateMCQStatsBar();
}

// ==========================================================================
// 8. Custom Questions & JSON Import / Export Manager
// ==========================================================================

function openManageQuestionsModal() {
  const modal = document.getElementById('add-modal');
  if (!modal) return;

  const newSubjSel = document.getElementById('new-subject');
  if (newSubjSel) {
    const subs = (typeof masterSubjectList === 'function') ? masterSubjectList(false) : Object.keys(BCS_SUBJECT_META);
    newSubjSel.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('');
  }

  setManageQuestionsTab('create');
  modal.classList.add('open');
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
window.openManageQuestionsModal = openManageQuestionsModal;

function closeManageQuestionsModal() {
  const modal = document.getElementById('add-modal');
  if (modal) modal.classList.remove('open');
}
window.closeManageQuestionsModal = closeManageQuestionsModal;

function setManageQuestionsTab(tabName) {
  const tabSwitch = document.getElementById('mcqModalTabSwitch');
  const createPanel = document.getElementById('modal-tab-create');
  const importPanel = document.getElementById('modal-tab-import');

  if (tabSwitch) {
    tabSwitch.querySelectorAll('.chip').forEach(c => {
      const isTarget = c.dataset.tab === tabName;
      c.classList.toggle('active', isTarget);
      c.classList.toggle('solid', isTarget);
    });
  }

  if (createPanel) createPanel.style.display = (tabName === 'create') ? 'block' : 'none';
  if (importPanel) importPanel.style.display = (tabName === 'import') ? 'block' : 'none';
}

function handleAddCustomQuestion(e) {
  e.preventDefault();
  const subjEl = document.getElementById('new-subject');
  const qEl = document.getElementById('new-question');
  const opt0El = document.getElementById('opt-0');
  const opt1El = document.getElementById('opt-1');
  const opt2El = document.getElementById('opt-2');
  const opt3El = document.getElementById('opt-3');
  const correctEl = document.getElementById('new-correct');
  const expEl = document.getElementById('new-explanation');

  const subject = subjEl ? subjEl.value.trim() : 'General';
  const question = qEl ? qEl.value.trim() : '';
  const opt0 = opt0El ? opt0El.value.trim() : '';
  const opt1 = opt1El ? opt1El.value.trim() : '';
  const opt2 = opt2El ? opt2El.value.trim() : '';
  const opt3 = opt3El ? opt3El.value.trim() : '';
  const correct = correctEl ? parseInt(correctEl.value, 10) : 0;
  const explanation = expEl ? expEl.value.trim() : '';

  if (!question || !opt0 || !opt1 || !opt2 || !opt3) {
    if (typeof showToast === 'function') showToast('Please enter the question and all 4 options.', true);
    return;
  }

  const newQ = {
    id: Date.now(),
    subject,
    question,
    options: [opt0, opt1, opt2, opt3],
    correct: isNaN(correct) ? 0 : correct,
    explanation: explanation || 'Custom question.'
  };

  const currentCustom = getStoredQuestions();
  currentCustom.unshift(newQ);
  saveStoredQuestions(currentCustom);

  if (qEl) qEl.value = '';
  if (opt0El) opt0El.value = '';
  if (opt1El) opt1El.value = '';
  if (opt2El) opt2El.value = '';
  if (opt3El) opt3El.value = '';
  if (expEl) expEl.value = '';

  closeManageQuestionsModal();

  buildPracticePool(currentSelectedSubject, true);
  renderMCQFilterBar();
  renderMCQQuestion();
  updateMCQStatsBar();

  if (typeof showToast === 'function') {
    showToast('Custom question saved successfully!');
  }
}

function handleExportMCQJson() {
  const master = getMasterQuestions();
  const jsonStr = JSON.stringify(master, null, 2);

  const textarea = document.getElementById('agent-import-text');
  if (textarea) textarea.value = jsonStr;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'careerdesk-mcq-question-bank.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast(`Exported ${master.length} questions as JSON!`);
  }
}

function handleImportMCQJson() {
  const textarea = document.getElementById('agent-import-text');
  if (!textarea || !textarea.value.trim()) {
    if (typeof showToast === 'function') showToast('Please paste a valid JSON questions array.', true);
    return;
  }

  try {
    const parsed = JSON.parse(textarea.value.trim());
    if (!Array.isArray(parsed) || !parsed.length) {
      if (typeof showToast === 'function') showToast('JSON must be a non-empty array of question objects.', true);
      return;
    }

    const validQuestions = [];
    parsed.forEach((item, idx) => {
      if (item && item.question && Array.isArray(item.options) && item.options.length >= 2) {
        validQuestions.push({
          id: item.id || (Date.now() + idx),
          subject: item.subject || 'General',
          question: String(item.question).trim(),
          options: item.options.map(o => String(o).trim()),
          correct: typeof item.correct === 'number' ? item.correct : 0,
          explanation: item.explanation ? String(item.explanation).trim() : ''
        });
      }
    });

    if (!validQuestions.length) {
      if (typeof showToast === 'function') showToast('No valid questions found in JSON array.', true);
      return;
    }

    const existing = getStoredQuestions();
    const merged = [...validQuestions, ...existing];
    saveStoredQuestions(merged);

    textarea.value = '';
    closeManageQuestionsModal();

    buildPracticePool(currentSelectedSubject, true);
    renderMCQFilterBar();
    renderMCQQuestion();
    updateMCQStatsBar();

    if (typeof showToast === 'function') {
      showToast(`Successfully imported ${validQuestions.length} questions!`);
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Invalid JSON syntax: ' + err.message, true);
  }
}

// Auto-run on DOM ready or direct load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMCQEngine);
} else {
  initMCQEngine();
}

// Global exports for cross-module integration
window.mistakes = mistakes;
window.loadMistakes = loadMistakes;
window.renderMistakes = renderMistakes;
window.initMCQEngine = initMCQEngine;
window.renderMCQFilterBar = renderMCQFilterBar;
window.renderMCQQuestion = renderMCQQuestion;
window.updateMCQStatsBar = updateMCQStatsBar;
