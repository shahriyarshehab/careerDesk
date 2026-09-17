/* ==========================================================================
   CareerDesk — MCQ Quiz Engine & Mistake Bank System
   ========================================================================== */

const EXAM_QUESTION_COUNT = 20;
const ACTIVE_POOL_LIMIT = 30;

let userMCQProgress = {
  answers: {},          // { [qId]: { selectedIndex, isCorrect, timesCorrect, timesAnswered, lastAnswered } }
  masteredIds: [],      // IDs of questions answered correctly 2 times (removed from active list)
  activePoolIds: [],    // IDs of currently active questions (strictly up to 30 items)
  removedSubjects: [],  // Removed subjects from the subject list
  addedExtendedIndex: 0
};

function loadMCQProgress() {
  try {
    const raw = localStorage.getItem(MCQ_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      userMCQProgress.answers = parsed.answers || {};
      userMCQProgress.masteredIds = Array.isArray(parsed.masteredIds) ? parsed.masteredIds.map(String) : [];
      userMCQProgress.activePoolIds = Array.isArray(parsed.activePoolIds) ? parsed.activePoolIds.map(String) : [];
      userMCQProgress.removedSubjects = Array.isArray(parsed.removedSubjects) ? parsed.removedSubjects : [];
      userMCQProgress.addedExtendedIndex = typeof parsed.addedExtendedIndex === "number" ? parsed.addedExtendedIndex : 0;
    }
  } catch (e) {
    userMCQProgress = { answers: {}, masteredIds: [], activePoolIds: [], removedSubjects: [], addedExtendedIndex: 0 };
  }
}

function saveMCQProgress() {
  try {
    localStorage.setItem(MCQ_PROGRESS_KEY, JSON.stringify(userMCQProgress));
    if (typeof window.scheduleFirestoreSync === 'function') {
      window.scheduleFirestoreSync();
    }
  } catch (e) { }
}

function getStoredQuestions() {
  try {
    const data = localStorage.getItem(MCQ_CUSTOM_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredQuestions(qList) {
  try {
    localStorage.setItem(MCQ_CUSTOM_KEY, JSON.stringify(qList));
    if (typeof window.scheduleFirestoreSync === 'function') {
      window.scheduleFirestoreSync();
    }
  } catch (e) { }
}

// Auto-Shuffle function (Fisher-Yates) for options while tracking correct answer and unique slot ID
function autoShuffleOptions(q) {
  if (!q || !Array.isArray(q.options)) return q;
  const optionsWithMeta = q.options.map((opt, idx) => ({
    text: opt,
    isCorrect: (idx === q.correct)
  }));

  for (let i = optionsWithMeta.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsWithMeta[i], optionsWithMeta[j]] = [optionsWithMeta[j], optionsWithMeta[i]];
  }

  return {
    ...q,
    _slotId: q._slotId || ('slot_' + (q.id !== undefined ? q.id : 'temp') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
    options: optionsWithMeta.map(o => o.text),
    correct: optionsWithMeta.findIndex(o => o.isCorrect)
  };
}

// Get unique session answer key for a question slot
function getQuestionSlotKey(q, idx = currentMCQIndex) {
  if (is20ExamMode) return String(idx !== undefined ? idx : currentMCQIndex);
  if (q && q._slotId) return q._slotId;
  return String(idx !== undefined ? idx : (q && q.id !== undefined ? q.id : 'slot_0'));
}

loadMCQProgress();

// Get complete unified master question bank (1,000 BCS questions + custom user questions)
function getMasterQuestionBank() {
  const bank = (typeof bcs1000QuestionBank !== 'undefined' && Array.isArray(bcs1000QuestionBank) && bcs1000QuestionBank.length > 0)
    ? bcs1000QuestionBank
    : (typeof defaultQuestions !== 'undefined' && Array.isArray(defaultQuestions) ? defaultQuestions : []);
  const custom = getStoredQuestions();

  const seen = new Set();
  const all = [];
  [...bank, ...custom].forEach((q, idx) => {
    const id = q.id !== undefined ? String(q.id) : ('q_' + idx);
    const key = q.question ? q.question.trim() : id;
    if (!seen.has(key)) {
      seen.add(key);
      all.push({ ...q, id: q.id !== undefined ? q.id : id });
    }
  });
  return all;
}

// Manage the active 30 items pool from the 1,000 question bank
function replenishActivePool(filterSubject = 'all') {
  const allMaster = getMasterQuestionBank();
  const masteredSet = new Set((userMCQProgress.masteredIds || []).map(String));
  const removedSubjectsSet = new Set((userMCQProgress.removedSubjects || []).map(s => String(s).toLowerCase()));

  // 1. Clean existing activePoolIds: keep only valid, unmastered, unremoved IDs
  let currentActive = (userMCQProgress.activePoolIds || []).map(String).filter(id => {
    if (masteredSet.has(id)) return false;
    const q = allMaster.find(item => String(item.id) === id);
    if (!q) return false;
    if (removedSubjectsSet.has(String(q.subject || '').toLowerCase())) return false;
    return true;
  });

  // 2. Identify candidate questions from the 1,000 bank
  let candidates = allMaster.filter(q => {
    const strId = String(q.id);
    if (masteredSet.has(strId)) return false;
    if (removedSubjectsSet.has(String(q.subject || '').toLowerCase())) return false;
    return true;
  });

  if (filterSubject === 'custom') {
    candidates = candidates.filter(q => q.isCustom || q.isAutoAdded);
  } else if (filterSubject && filterSubject !== 'all') {
    const target = filterSubject.toLowerCase();
    candidates = candidates.filter(q => {
      const s = String(q.subject || '').toLowerCase();
      const canon = typeof canonicalSubjectName === 'function' ? canonicalSubjectName(q.subject).toLowerCase() : s;
      return s === target || canon === target;
    });
  }

  // 3. For 'all' subjects: fill activePoolIds up to ACTIVE_POOL_LIMIT (30)
  if (!filterSubject || filterSubject === 'all') {
    const activeSet = new Set(currentActive);
    for (const q of candidates) {
      if (currentActive.length >= ACTIVE_POOL_LIMIT) break;
      const strId = String(q.id);
      if (!activeSet.has(strId)) {
        activeSet.add(strId);
        currentActive.push(strId);
      }
    }
    userMCQProgress.activePoolIds = currentActive;
    saveMCQProgress();

    const qMap = new Map(allMaster.map(q => [String(q.id), q]));
    return currentActive.map(id => qMap.get(id)).filter(Boolean);
  } else {
    // For a specific subject: ensure matching items up to 30
    const matchingActive = currentActive.filter(id => {
      const q = allMaster.find(item => String(item.id) === id);
      if (!q) return false;
      if (filterSubject === 'custom') return q.isCustom || q.isAutoAdded;
      const s = String(q.subject || '').toLowerCase();
      const canon = typeof canonicalSubjectName === 'function' ? canonicalSubjectName(q.subject).toLowerCase() : s;
      return s === filterSubject.toLowerCase() || canon === filterSubject.toLowerCase();
    });

    const activeSet = new Set(matchingActive);
    for (const q of candidates) {
      if (matchingActive.length >= ACTIVE_POOL_LIMIT) break;
      const strId = String(q.id);
      if (!activeSet.has(strId)) {
        activeSet.add(strId);
        matchingActive.push(strId);
        if (!currentActive.includes(strId) && currentActive.length < ACTIVE_POOL_LIMIT) {
          currentActive.push(strId);
        }
      }
    }
    userMCQProgress.activePoolIds = currentActive;
    saveMCQProgress();

    const qMap = new Map(allMaster.map(q => [String(q.id), q]));
    return matchingActive.map(id => qMap.get(id)).filter(Boolean);
  }
}

// Return active pool (up to 30 items)
function getActiveQuestionsPool(subject = 'all') {
  return replenishActivePool(subject);
}

let allQuestions = getActiveQuestionsPool('all');
let activeExamPool = [...allQuestions];
let currentMCQIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let sessionAnswered = {};
let is20ExamMode = false;
let examTimerInterval = null;
let timeRemaining = 900; // 15 minutes = 900s
let autoNextTimeout = null;
let autoAdvanceCountdownInterval = null;

// Streak & Audio & Exam Flagging States
let mcqStreak = 0;
let mcqBestStreak = parseInt(localStorage.getItem('jobprep_mcq_best_streak') || '0', 10);
let mcqSoundEnabled = localStorage.getItem('jobprep_mcq_sound') !== 'false';
let mcqAutoAdvanceEnabled = localStorage.getItem('jobprep_mcq_autoadvance') !== 'false';
let flaggedQuestions = {};

const prefixList = ["A", "B", "C", "D"];

let mistakes = [];

function loadMistakes() {
  try {
    const data = localStorage.getItem(MISTAKES_KEY);
    mistakes = data ? JSON.parse(data) : [];
  } catch (e) { mistakes = []; }
}

function saveMistakes() {
  try {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
    if (typeof window.scheduleFirestoreSync === 'function') {
      window.scheduleFirestoreSync();
    }
  } catch (e) { }
}

// Pure Web Audio API Synthesizer (No external sound files required)
function playMCQAudio(type) {
  if (!mcqSoundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window._mcqAudioCtx) {
      window._mcqAudioCtx = new AudioCtx();
    }
    const ctx = window._mcqAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    if (type === 'correct') {
      // High-pitched cheerful two-tone chime (D5 -> A5 -> D6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.42);
    } else if (type === 'streak') {
      // Triumphant 3-step ascending arpeggio (C5 -> E5 -> C6)
      [523.25, 659.25, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.16, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.32);
      });
    } else if (type === 'mastered') {
      // Sparkly harp chime for question graduation
      [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.4);
      });
    } else if (type === 'wrong') {
      // Soft low tone buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (e) { /* ignore if audio blocked */ }
}

// Floating +1.0 animation
function spawnFloatingPoints(targetEl, text) {
  if (!targetEl) return;
  try {
    const rect = targetEl.getBoundingClientRect();
    const floatEl = document.createElement("div");
    floatEl.className = "mcq-floating-points";
    floatEl.textContent = text;
    floatEl.style.left = (rect.left + rect.width / 2 - 20) + "px";
    floatEl.style.top = (rect.top + window.scrollY - 10) + "px";
    document.body.appendChild(floatEl);
    setTimeout(() => { floatEl.remove(); }, 850);
  } catch (e) { }
}

// Exam Question Navigator Palette
function renderMCQPalette() {
  const container = document.getElementById("mcq-palette-container");
  const grid = document.getElementById("mcq-palette-grid");
  if (!container || !grid) return;

  if (!is20ExamMode) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  grid.innerHTML = "";

  activeExamPool.forEach((q, idx) => {
    const qKey = getQuestionSlotKey(q, idx);
    const isCurrent = (idx === currentMCQIndex);
    const isAnswered = (sessionAnswered[qKey] && sessionAnswered[qKey].selectedIndex !== undefined);
    const isFlagged = Boolean(flaggedQuestions[qKey]);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "palette-chip" +
      (isCurrent ? " current" : "") +
      (isAnswered ? " answered" : "") +
      (isFlagged ? " flagged" : "");
    chip.textContent = String(idx + 1);
    chip.title = `Question ${idx + 1}${isFlagged ? " (Flagged)" : (isAnswered ? " (Answered)" : "")}`;
    chip.addEventListener("click", () => {
      goToMCQQuestion(idx);
    });
    grid.appendChild(chip);
  });
}

function goToMCQQuestion(idx) {
  clearTimeout(autoNextTimeout);
  clearInterval(autoAdvanceCountdownInterval);
  if (idx < 0 || idx >= activeExamPool.length) return;
  currentMCQIndex = idx;
  renderMCQQuestion();
  updateMCQStats();
}

function toggleFlagCurrentQuestion() {
  if (!activeExamPool[currentMCQIndex]) return;
  const q = activeExamPool[currentMCQIndex];
  const qKey = getQuestionSlotKey(q, currentMCQIndex);
  flaggedQuestions[qKey] = !flaggedQuestions[qKey];

  const flagBtn = document.getElementById("qFlagBtn");
  const flagText = document.getElementById("qFlagText");
  if (flagBtn) flagBtn.classList.toggle("flagged", Boolean(flaggedQuestions[qKey]));
  if (flagText) flagText.textContent = flaggedQuestions[qKey] ? "Flagged for Review" : "Mark for Review";

  renderMCQPalette();
}

function updateMCQStats() {
  const currentIndexEl = document.getElementById("current-index");
  const progressBar = document.getElementById("mcqProgressBar");
  const correctCountEl = document.getElementById("correct-count");
  const wrongCountEl = document.getElementById("wrong-count");
  const scoreValEl = document.getElementById("score-val");
  const streakCountEl = document.getElementById("mcqStreakCount");
  const bestStreakEl = document.getElementById("mcqBestStreak");
  const streakCard = document.getElementById("mcqStreakCard");
  const masteryBadge = document.getElementById("mcqMasteryBadge");
  const resetMasteredBtn = document.getElementById("resetMasteredBtn");
  const modeBadge = document.getElementById("mcqCurrentModeBadge");

  if (bestStreakEl) bestStreakEl.textContent = mcqBestStreak;
  if (streakCountEl) streakCountEl.textContent = mcqStreak;
  if (streakCard) streakCard.classList.toggle("active-streak", mcqStreak >= 2);

  if (modeBadge) {
    modeBadge.textContent = is20ExamMode ? "20-Q Exam Mode" : "Practice Mode";
  }

  if (is20ExamMode) {
    const answeredCount = Object.keys(sessionAnswered).length;
    const totalQs = activeExamPool.length || EXAM_QUESTION_COUNT;
    if (currentIndexEl) currentIndexEl.textContent = `${currentMCQIndex + 1} / ${totalQs}`;
    if (progressBar) {
      const pct = Math.min(100, Math.round(((currentMCQIndex + 1) / totalQs) * 100));
      progressBar.style.width = pct + "%";
    }
    if (correctCountEl) {
      correctCountEl.textContent = answeredCount;
      const lbl = correctCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Answered";
    }
    if (wrongCountEl) {
      wrongCountEl.textContent = Math.max(0, totalQs - answeredCount);
      const lbl = wrongCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Remaining";
    }
    if (scoreValEl) {
      scoreValEl.textContent = "Locked";
      const lbl = scoreValEl.nextElementSibling;
      if (lbl) lbl.textContent = "Results on Submit";
    }
  } else {
    const totalQs = activeExamPool.length;
    if (currentIndexEl) currentIndexEl.textContent = totalQs ? `${currentMCQIndex + 1} / ${totalQs}` : "0 / 0";
    if (progressBar) {
      const pct = totalQs ? Math.min(100, Math.round(((currentMCQIndex + 1) / totalQs) * 100)) : 0;
      progressBar.style.width = pct + "%";
    }
    if (correctCountEl) {
      correctCountEl.textContent = correctAnswers;
      const lbl = correctCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Correct (+1.0)";
    }
    if (wrongCountEl) {
      wrongCountEl.textContent = wrongAnswers;
      const lbl = wrongCountEl.nextElementSibling;
      if (lbl) lbl.textContent = "Incorrect (-0.5)";
    }
    const totalMarks = (correctAnswers * 1.0) - (wrongAnswers * 0.5);
    if (scoreValEl) {
      scoreValEl.textContent = totalMarks.toFixed(2);
      const lbl = scoreValEl.nextElementSibling;
      if (lbl) lbl.textContent = "Net Score";
    }
  }

  const masteredCount = (userMCQProgress.masteredIds || []).length;
  if (masteryBadge) {
    masteryBadge.innerHTML = `${ICON.trophy} ${masteredCount} / 1,000 Mastered`;
    masteryBadge.title = `${masteredCount} mastered out of 1,000 questions (Active Pool: ${activeExamPool.length} items)`;
  }
  if (resetMasteredBtn) {
    resetMasteredBtn.style.display = masteredCount > 0 ? "inline-flex" : "none";
    resetMasteredBtn.innerHTML = `${ICON.rotccw} Restore Mastered (${masteredCount})`;
  }

  renderMCQPalette();
}

// Graduate mastered question: removes from active 30 items and replenishes 1 new question from 1,000 bank
function graduateMasteredQuestion(questionId) {
  const strId = String(questionId);
  const masteredSet = new Set((userMCQProgress.masteredIds || []).map(String));
  if (!masteredSet.has(strId)) {
    userMCQProgress.masteredIds.push(strId);
  }

  // Remove from activePoolIds
  userMCQProgress.activePoolIds = (userMCQProgress.activePoolIds || []).map(String).filter(id => id !== strId);

  // Replenish with a fresh unmastered question from the 1,000 bank
  const allMaster = getMasterQuestionBank();
  const currentActiveSet = new Set(userMCQProgress.activePoolIds);
  const updatedMasteredSet = new Set(userMCQProgress.masteredIds.map(String));
  const removedSubjectsSet = new Set((userMCQProgress.removedSubjects || []).map(s => String(s).toLowerCase()));

  let replacement = null;
  // If user is currently filtering by a subject, prefer picking replacement from that subject
  if (currentSelectedSubject && currentSelectedSubject !== 'all' && currentSelectedSubject !== 'custom') {
    const target = currentSelectedSubject.toLowerCase();
    replacement = allMaster.find(q => {
      const qId = String(q.id);
      if (currentActiveSet.has(qId) || updatedMasteredSet.has(qId)) return false;
      const s = String(q.subject || '').toLowerCase();
      const canon = typeof canonicalSubjectName === 'function' ? canonicalSubjectName(q.subject).toLowerCase() : s;
      return (s === target || canon === target) && !removedSubjectsSet.has(s);
    });
  }

  // Fallback to any unmastered question across the entire 1,000 bank
  if (!replacement) {
    replacement = allMaster.find(q => {
      const qId = String(q.id);
      if (currentActiveSet.has(qId) || updatedMasteredSet.has(qId)) return false;
      const s = String(q.subject || '').toLowerCase();
      return !removedSubjectsSet.has(s);
    });
  }

  if (replacement) {
    userMCQProgress.activePoolIds.push(String(replacement.id));
  }

  saveMCQProgress();

  // Update in-memory pools
  allQuestions = allQuestions.filter(q => String(q.id) !== strId);
  activeExamPool = activeExamPool.filter(q => String(q.id) !== strId);

  if (replacement) {
    const shuffled = autoShuffleOptions(replacement);
    allQuestions.push(replacement);
    activeExamPool.push(shuffled);
  }

  return replacement;
}

function advanceToNextMCQQuestion() {
  clearTimeout(autoNextTimeout);
  clearInterval(autoAdvanceCountdownInterval);
  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;

  const currentQ = activeExamPool[currentMCQIndex];
  if (currentQ && (currentQ._markedForMasteryRemoval || currentQ._markedForDeletion)) {
    const qId = currentQ.id;
    const replacement = graduateMasteredQuestion(qId);
    updateMCQStats();

    if (currentMCQIndex >= activeExamPool.length) {
      currentMCQIndex = Math.max(0, activeExamPool.length - 1);
    }
    if (activeExamPool.length === 0) {
      showMCQSummary();
      return;
    }
    renderMCQQuestion();
    return;
  }

  if (currentMCQIndex < activeExamPool.length - 1) {
    currentMCQIndex++;
    renderMCQQuestion();
  } else {
    if (is20ExamMode) {
      openExamSubmitModal();
      return;
    }
    showMCQSummary();
  }
}

function renderMCQQuestion() {
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";

  const qSubject = document.getElementById("q-subject");
  const qSourceTag = document.getElementById("q-source-tag");
  const qText = document.getElementById("q-text");
  const optionsContainer = document.getElementById("options-container");
  const explanationBox = document.getElementById("explanation-box");
  const explanationText = document.getElementById("explanation-text");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const currentIndexEl = document.getElementById("current-index");
  const historyBadge = document.getElementById("q-history-badge");
  const qFlagBtn = document.getElementById("qFlagBtn");
  const qFlagText = document.getElementById("qFlagText");
  const autoNextPill = document.getElementById("qAutoNextPill");
  const streakBanner = document.getElementById("mcq-streak-banner");

  if (!quizCard) return;
  clearTimeout(autoNextTimeout);
  clearInterval(autoAdvanceCountdownInterval);
  if (streakBanner) streakBanner.style.display = "none";

  if (activeExamPool.length === 0) {
    if (qText) qText.innerHTML = "<strong>All questions in this subject are Mastered!</strong><br><small style=\"color:var(--text-soft); font-weight:normal;\">You have answered all questions correctly twice. Click 'Restore Mastered' above or pick another subject.</small>";
    if (optionsContainer) optionsContainer.innerHTML = "";
    if (explanationBox) explanationBox.classList.remove("show");
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (currentIndexEl) currentIndexEl.textContent = "0 / 0";
    if (historyBadge) historyBadge.textContent = "Mastered!";
    return;
  }

  if (nextBtn) nextBtn.style.display = "inline-flex";

  if (currentMCQIndex < 0) currentMCQIndex = 0;
  if (currentMCQIndex >= activeExamPool.length) currentMCQIndex = activeExamPool.length - 1;

  const q = activeExamPool[currentMCQIndex];
  if (currentIndexEl) currentIndexEl.textContent = (currentMCQIndex + 1) + " / " + activeExamPool.length;
  if (qSubject) {
    const subjName = q.subject || "BCS Preliminary";
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(subjName) : { icon: 'target' };
    qSubject.innerHTML = `<i data-lucide="${meta.icon || 'target'}" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i><span>${escapeHtml(subjName)}</span>`;
  }
  if (qSourceTag) qSourceTag.textContent = q.isCustom ? "Custom Question" : "BCS Preliminary Standard";
  if (qText) qText.textContent = (currentMCQIndex + 1) + ". " + q.question;
  if (optionsContainer) optionsContainer.innerHTML = "";
  if (explanationBox) explanationBox.classList.remove("show");

  if (prevBtn) prevBtn.style.display = currentMCQIndex > 0 ? "inline-flex" : "none";
  if (nextBtn) {
    if (is20ExamMode) {
      if (currentMCQIndex === activeExamPool.length - 1) {
        nextBtn.innerHTML = `Finish &amp; Submit ${ICON.checkCircle}`;
      } else {
        nextBtn.innerHTML = `Next ${ICON.arrowR}`;
      }
    } else {
      nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;
    }
  }

  const qKey = getQuestionSlotKey(q, currentMCQIndex);
  const qId = String(q.id !== undefined ? q.id : currentMCQIndex);

  // Flag button state
  if (qFlagBtn) {
    qFlagBtn.style.display = is20ExamMode ? "inline-flex" : "none";
    const isFlagged = Boolean(flaggedQuestions[qKey]);
    qFlagBtn.classList.toggle("flagged", isFlagged);
    if (qFlagText) {
      qFlagText.textContent = isFlagged ? "Flagged for Review" : "Mark for Review";
    }
  }

  const markMasteredBtn = document.getElementById("qMarkMasteredBtn");
  if (markMasteredBtn) {
    markMasteredBtn.style.display = is20ExamMode ? "none" : "inline-flex";
  }

  if (is20ExamMode) {
    // IN 20-QUESTION EXAM MODE
    if (explanationBox) explanationBox.classList.remove("show");
    if (historyBadge) historyBadge.style.display = "none";
    if (autoNextPill) autoNextPill.style.display = "none";

    const userChoice = (sessionAnswered[qKey] && sessionAnswered[qKey].selectedIndex !== undefined)
      ? sessionAnswered[qKey].selectedIndex
      : undefined;

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      const isSel = (userChoice === idx);
      btn.className = "option-btn" + (isSel ? " selected-exam" : "");
      btn.type = "button";
      btn.innerHTML = `
        <div class="opt-left">
          <span class="opt-prefix">${prefixList[idx] || (idx + 1)}</span>
          <span class="opt-text">${escapeHtml(opt)}</span>
        </div>
        <div class="opt-status-tag">
          ${isSel ? '<span style="font-size:11px; color:var(--accent1); font-weight:700;">Selected</span>' : ''}
        </div>
      `;
      btn.onclick = () => selectMCQOption(idx, q);
      if (optionsContainer) optionsContainer.appendChild(btn);
    });
  } else {
    // IN QUESTION BANK PRACTICE MODE
    if (historyBadge) historyBadge.style.display = "inline-flex";
    if (autoNextPill) {
      autoNextPill.style.display = "inline-flex";
      autoNextPill.innerHTML = `${ICON.zap} Auto-Next: ${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}`;
    }

    const rememberedAnswer = sessionAnswered[qKey];
    const prevStat = userMCQProgress.answers[qId] || { timesCorrect: 0 };
    const timesCorrect = prevStat.timesCorrect || 0;

    // Update Question Mastery Badge
    if (historyBadge) {
      if (timesCorrect >= 2) {
        historyBadge.className = "q-history-badge mastered";
        historyBadge.innerHTML = `${ICON.trophy} Mastered (2/2) ⭐⭐`;
      } else if (timesCorrect === 1) {
        historyBadge.className = "q-history-badge has-correct";
        historyBadge.innerHTML = `⭐ 1/2 Right (1 more to master)`;
      } else {
        historyBadge.className = "q-history-badge";
        historyBadge.textContent = "Mastery: 0/2";
      }
    }

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";

      let statusTagHtml = "";

      if (rememberedAnswer !== undefined) {
        btn.disabled = true;
        if (idx === q.correct) {
          btn.classList.add(rememberedAnswer.selectedIndex === q.correct ? "selected-correct" : "highlight-correct");
          statusTagHtml = `${ICON.checkCircle} <span style="color:#10b981;">Correct</span>`;
        } else if (idx === rememberedAnswer.selectedIndex && !rememberedAnswer.isCorrect) {
          btn.classList.add("selected-wrong");
          statusTagHtml = `${ICON.xCircle} <span style="color:#f43f5e;">Your Answer</span>`;
        }
      } else {
        btn.onclick = () => selectMCQOption(idx, q);
      }

      btn.innerHTML = `
        <div class="opt-left">
          <span class="opt-prefix">${prefixList[idx] || (idx + 1)}</span>
          <span class="opt-text">${escapeHtml(opt)}</span>
        </div>
        <div class="opt-status-tag">${statusTagHtml}</div>
      `;

      if (optionsContainer) optionsContainer.appendChild(btn);
    });

    if (rememberedAnswer !== undefined && explanationText && explanationBox) {
      if (rememberedAnswer.isCorrect) {
        let expHtml = escapeHtml(q.explanation || "No explanation provided.");
        expHtml += `<div style="margin-top:10px; padding:8px 12px; background:rgba(16,185,129,0.12); border-radius:8px; border:1px solid rgba(16,185,129,0.25); color:#10b981; font-weight:600; font-size:12.5px;">
          ✓ Correct! In the BCS Leitner model, answering correctly twice graduates the question to Mastered.
        </div>`;
        explanationText.innerHTML = expHtml;
      } else {
        const yourText = escapeHtml(q.options[rememberedAnswer.selectedIndex] || "");
        const correctText = escapeHtml(q.options[q.correct] || "");
        explanationText.innerHTML = `
          <div class="wrong-feedback-badge">${ICON.xCircle} Incorrect</div>
          <div style="margin-bottom:8px; font-size:13px; line-height:1.6;">
            <strong>Your Answer:</strong> <span style="color:#f43f5e; font-weight:600;">${yourText}</span> &nbsp;|&nbsp; 
            <strong>Correct Answer:</strong> <span style="color:#10b981; font-weight:600;">${correctText}</span>
          </div>
          <div style="margin-bottom:8px;"><strong>Explanation &amp; Shortcut:</strong> ${escapeHtml(q.explanation || "No explanation provided.")}</div>
          <div class="mistake-saved-badge">${ICON.flag} Saved to Mistake Bank &bull; Re-queued to answer again</div>
        `;
      }
      explanationBox.classList.add("show");
    }
  }

  renderMCQPalette();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function selectMCQOption(selectedIndex, q) {
  clearTimeout(autoNextTimeout);
  clearInterval(autoAdvanceCountdownInterval);
  const slotKey = getQuestionSlotKey(q, currentMCQIndex);
  const qId = String(q.id !== undefined ? q.id : currentMCQIndex);
  const optionsContainer = document.getElementById("options-container");
  const streakBanner = document.getElementById("mcq-streak-banner");
  const explanationBox = document.getElementById("explanation-box");
  const explanationText = document.getElementById("explanation-text");
  const nextBtn = document.getElementById("next-btn");

  if (is20ExamMode) {
    // IN 20-QUESTION EXAM MODE:
    // Neutral recording without immediate spoilers
    sessionAnswered[slotKey] = { selectedIndex };

    if (optionsContainer) {
      Array.from(optionsContainer.children).forEach((btn, idx) => {
        const isSel = (idx === selectedIndex);
        btn.classList.toggle("selected-exam", isSel);
        const tag = btn.querySelector(".opt-status-tag");
        if (tag) tag.innerHTML = isSel ? '<span style="font-size:11px; color:var(--accent1); font-weight:700;">Selected</span>' : '';
      });
    }

    updateMCQStats();
    renderMCQPalette();

    // Smooth advance after 380ms
    autoNextTimeout = setTimeout(() => {
      advanceToNextMCQQuestion();
    }, 380);
    return;
  }

  // IN PRACTICE / STUDY MODE:
  const isCorrect = (selectedIndex === q.correct);
  sessionAnswered[slotKey] = { selectedIndex, isCorrect };

  // Update persistent progress
  const prev = userMCQProgress.answers[qId] || { timesCorrect: 0, timesAnswered: 0 };
  let newTimesCorrect = prev.timesCorrect || 0;
  if (isCorrect) newTimesCorrect++;
  const newTimesAnswered = (prev.timesAnswered || 0) + 1;

  userMCQProgress.answers[qId] = {
    selectedIndex,
    isCorrect,
    timesCorrect: newTimesCorrect,
    timesAnswered: newTimesAnswered,
    lastAnswered: Date.now()
  };

  let justMastered = false;

  // Highlight all option buttons with status icons
  if (optionsContainer) {
    Array.from(optionsContainer.children).forEach((btn, idx) => {
      btn.disabled = true;
      const tag = btn.querySelector(".opt-status-tag");
      if (idx === q.correct) {
        btn.classList.add(selectedIndex === q.correct ? "selected-correct" : "highlight-correct");
        if (tag) tag.innerHTML = `${ICON.checkCircle} <span style="color:#10b981;">Correct</span>`;
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add("selected-wrong");
        if (tag) tag.innerHTML = `${ICON.xCircle} <span style="color:#f43f5e;">Your Choice</span>`;
      }
    });
  }

  if (isCorrect) {
    correctAnswers++;
    mcqStreak++;
    if (mcqStreak > mcqBestStreak) {
      mcqBestStreak = mcqStreak;
      try { localStorage.setItem('jobprep_mcq_best_streak', String(mcqBestStreak)); } catch (e) { }
    }

    // Audio feedback
    playMCQAudio(mcqStreak >= 3 ? 'streak' : 'correct');

    // Floating points animation
    if (optionsContainer && optionsContainer.children[selectedIndex]) {
      spawnFloatingPoints(optionsContainer.children[selectedIndex], "+1.0");
    }

    // Check mastery (2-correct Leitner rule)
    if (newTimesCorrect >= 2) {
      const strId = String(q.id !== undefined ? q.id : qId);
      if (!userMCQProgress.masteredIds.map(String).includes(strId)) {
        userMCQProgress.masteredIds.push(q.id !== undefined ? q.id : qId);
        justMastered = true;
        playMCQAudio('mastered');
      }
      q._markedForMasteryRemoval = true;
    }

    // Dynamic Streak / Correct Banner
    if (streakBanner) {
      let streakTitle = "✓ Correct! (+1.0 point earned)";
      if (justMastered) {
        streakTitle = `🏆 Awesome! Question Mastered (2/2)!`;
      } else if (mcqStreak >= 10) {
        streakTitle = `👑 ${mcqStreak} Streak! Top of the leaderboard!`;
      } else if (mcqStreak >= 5) {
        streakTitle = `⚡ ${mcqStreak} Streak! Unstoppable speed!`;
      } else if (mcqStreak >= 3) {
        streakTitle = `🔥 ${mcqStreak} Streak! Great momentum!`;
      } else if (mcqStreak === 2) {
        streakTitle = `🔥 2 Streak! Keep going!`;
      }

      streakBanner.innerHTML = `
        <div class="streak-banner-title">
          ${justMastered ? ICON.trophy : (mcqStreak >= 3 ? ICON.flame : ICON.checkCircle)}
          <span>${streakTitle}</span>
        </div>
        <div class="streak-banner-controls">
          ${mcqAutoAdvanceEnabled ? `
            <span class="auto-advance-note" id="autoAdvanceNote" style="font-size:12px; color:var(--text-soft);">
              Next question: <b id="countdownSecs">1.5s</b>
            </span>
            <button class="pill subtle" id="pauseCountdownBtn" type="button" style="font-size:11.5px; padding:3px 10px;">
              ${ICON.pause} Pause
            </button>
          ` : ''}
          <button class="pill solid" id="bannerNextBtn" type="button" style="font-size:12px; padding:4px 12px;">
            Next Question ${ICON.arrowR}
          </button>
        </div>
      `;
      streakBanner.style.display = "flex";

      const bannerNextBtn = document.getElementById("bannerNextBtn");
      if (bannerNextBtn) {
        bannerNextBtn.addEventListener("click", () => {
          clearTimeout(autoNextTimeout);
          clearInterval(autoAdvanceCountdownInterval);
          advanceToNextMCQQuestion();
        });
      }

      const pauseBtn = document.getElementById("pauseCountdownBtn");
      if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
          clearTimeout(autoNextTimeout);
          clearInterval(autoAdvanceCountdownInterval);
          const note = document.getElementById("autoAdvanceNote");
          if (note) note.textContent = "Auto-advance paused";
          pauseBtn.remove();
        });
      }
    }

    if (mcqAutoAdvanceEnabled) {
      let timeLeft = 1.5;
      clearInterval(autoAdvanceCountdownInterval);
      autoAdvanceCountdownInterval = setInterval(() => {
        timeLeft -= 0.1;
        const cdEl = document.getElementById("countdownSecs");
        if (cdEl) cdEl.textContent = Math.max(0, timeLeft).toFixed(1) + "s";
        if (timeLeft <= 0) {
          clearInterval(autoAdvanceCountdownInterval);
        }
      }, 100);

      autoNextTimeout = setTimeout(() => {
        clearInterval(autoAdvanceCountdownInterval);
        advanceToNextMCQQuestion();
      }, 1500);
    }

  } else {
    // WRONG ANSWER HANDLING
    clearTimeout(autoNextTimeout);
    clearInterval(autoAdvanceCountdownInterval);
    wrongAnswers++;
    mcqStreak = 0;
    playMCQAudio('wrong');

    if (streakBanner) {
      streakBanner.innerHTML = `
        <div class="streak-banner-title" style="color:#f43f5e;">
          ${ICON.xCircle}
          <span>Incorrect! Saved to Mistake Bank &bull; Re-queued to answer again</span>
        </div>
        <div class="streak-banner-controls">
          <button class="pill solid" id="bannerNextBtn" type="button" style="font-size:12px; padding:4px 12px;">
            Next Question ${ICON.arrowR}
          </button>
        </div>
      `;
      streakBanner.style.display = "flex";

      const bannerNextBtn = document.getElementById("bannerNextBtn");
      if (bannerNextBtn) {
        bannerNextBtn.addEventListener("click", () => {
          advanceToNextMCQQuestion();
        });
      }
    }

    // Re-queue question 3-4 spots later in practice pool with fresh _slotId and re-shuffled options
    const laterIdx = activeExamPool.findIndex((item, idx) => idx > currentMCQIndex && String(item.id) === String(q.id));
    if (laterIdx === -1 && !is20ExamMode && activeExamPool.length > 2) {
      const insertPos = Math.min(activeExamPool.length, currentMCQIndex + 4);
      const reattemptQ = autoShuffleOptions({
        ...q,
        _slotId: 'reattempt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        _isReattempt: true
      });
      activeExamPool.splice(insertPos, 0, reattemptQ);
    }

    // Automatically log to Mistake Bank
    const exists = mistakes.some(m => (m.q === q.question || String(m.id) === String(q.id)));
    if (!exists) {
      mistakes.unshift({
        id: q.id || ("mcq_" + Date.now()),
        q: q.question,
        subject: q.subject,
        yourAns: q.options[selectedIndex] || "",
        correctAns: q.options[q.correct] || "",
        explain: q.explanation || "No explanation provided.",
        date: new Date().toLocaleDateString()
      });
      saveMistakes();
      renderMistakes();
    }

    if (nextBtn) nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;
  }

  saveMCQProgress();
  updateMCQStats();

  // Update history badge in real time
  const historyBadge = document.getElementById("q-history-badge");
  if (historyBadge) {
    if (newTimesCorrect >= 2) {
      historyBadge.className = "q-history-badge mastered";
      historyBadge.innerHTML = `${ICON.trophy} Mastered (2/2) ⭐⭐`;
    } else if (newTimesCorrect === 1) {
      historyBadge.className = "q-history-badge has-correct";
      historyBadge.innerHTML = `⭐ 1/2 Right (1 more to master)`;
    } else {
      historyBadge.className = "q-history-badge";
      historyBadge.textContent = "Mastery: 0/2";
    }
  }

  // Explanation Box display
  if (explanationText && explanationBox) {
    if (isCorrect) {
      let expHtml = escapeHtml(q.explanation || "No explanation provided.");
      if (justMastered) {
        expHtml += `<div style="margin-top:10px; padding:10px 14px; background:rgba(16,185,129,0.15); border-radius:8px; border:1px solid #10b981; color:#10b981; font-weight:700; font-size:13px; line-height:1.5;">
          🏆 <strong>Mastered &amp; Graduated!</strong> You answered this question correctly twice.
        </div>`;
        showToast("Question Mastered! Answered correctly twice — saved to mastery.", false);
      } else if (newTimesCorrect === 1) {
        expHtml += `<div style="margin-top:8px; color:#10b981; font-weight:700; font-size:12.5px;">✓ Correct (1/2)! 1 more correct answer to master this question.</div>`;
      }
      explanationText.innerHTML = expHtml;
    } else {
      const yourText = escapeHtml(q.options[selectedIndex] || "");
      const correctText = escapeHtml(q.options[q.correct] || "");
      explanationText.innerHTML = `
        <div class="wrong-feedback-badge">${ICON.xCircle} Incorrect</div>
        <div style="margin-bottom:8px; font-size:13px; line-height:1.6;">
          <strong>Your Answer:</strong> <span style="color:#f43f5e; font-weight:600;">${yourText}</span> &nbsp;|&nbsp; 
          <strong>Correct Answer:</strong> <span style="color:#10b981; font-weight:600;">${correctText}</span>
        </div>
        <div><strong>Explanation &amp; Shortcut:</strong> ${escapeHtml(q.explanation || "No explanation provided.")}</div>
        <div class="mistake-saved-badge">${ICON.flag} Saved to Mistake Bank &bull; Re-queued to answer again</div>
      `;
    }
    explanationBox.classList.add("show");
  }

  checkSessionCompletion();
}

function checkSessionCompletion() {
  const answeredCount = activeExamPool.filter((q, idx) => {
    const slotKey = getQuestionSlotKey(q, idx);
    return Boolean(sessionAnswered[slotKey]);
  }).length;

  if (answeredCount >= activeExamPool.length && activeExamPool.length > 0) {
    setTimeout(() => {
      const freshQuestions = replenishActivePool(currentSelectedSubject);
      if (freshQuestions && freshQuestions.length > 0) {
        allQuestions = freshQuestions;
        activeExamPool = freshQuestions.map(q => autoShuffleOptions(q));
        currentMCQIndex = 0;
        sessionAnswered = {};
        updateMCQStats();
        renderMCQQuestion();
        showToast(`Loaded ${activeExamPool.length} questions from the 1,000 question bank.`, false);
      }
    }, 1200);
  }
}

function openExamSubmitModal() {
  const modal = document.getElementById("examSubmitModal");
  if (!modal) {
    showMCQSummary();
    return;
  }
  const total = activeExamPool.length || EXAM_QUESTION_COUNT;
  const answered = Object.keys(sessionAnswered).length;
  const unanswered = Math.max(0, total - answered);
  const flagged = Object.values(flaggedQuestions).filter(Boolean).length;

  const elAns = document.getElementById("modalTallyAnswered");
  const elUnans = document.getElementById("modalTallyUnanswered");
  const elFlag = document.getElementById("modalTallyFlagged");

  if (elAns) elAns.textContent = answered;
  if (elUnans) elUnans.textContent = unanswered;
  if (elFlag) elFlag.textContent = flagged;

  modal.classList.add("open");
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function setup20QuestionExam() {
  clearTimeout(autoNextTimeout);
  is20ExamMode = true;
  const modeBanner = document.getElementById("mode-banner");
  const filterBar = document.getElementById("filter-bar");
  const examTimerEl = document.getElementById("exam-timer");
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const paletteContainer = document.getElementById("mcq-palette-container");
  const btnPractice = document.getElementById("btnModePractice");
  const btnExam20 = document.getElementById("start-exam-20-btn");

  if (modeBanner) modeBanner.classList.add("active");
  if (paletteContainer) paletteContainer.style.display = "block";
  if (filterBar) filterBar.style.display = "none";
  if (btnPractice) btnPractice.classList.remove("active");
  if (btnExam20) btnExam20.classList.add("active");
  flaggedQuestions = {};

  // Refresh active pool excluding mastered
  allQuestions = getActiveQuestionsPool(currentSelectedSubject || 'all');

  const examCount = Math.min(allQuestions.length, EXAM_QUESTION_COUNT);
  if (examCount < 5) {
    is20ExamMode = false;
    if (modeBanner) modeBanner.classList.remove("active");
    if (paletteContainer) paletteContainer.style.display = "none";
    if (filterBar) filterBar.style.display = "flex";
    if (btnPractice) btnPractice.classList.add("active");
    if (btnExam20) btnExam20.classList.remove("active");
    showToast(`At least 5 questions are required to start an exam (available: ${examCount}).`, true);
    return;
  }

  // Shuffle all active questions and pick up to examCount (default 20)
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  const rawExam = shuffled.slice(0, examCount);

  // Auto-shuffle options for each question
  activeExamPool = rawExam.map(q => autoShuffleOptions(q));

  currentMCQIndex = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  sessionAnswered = {};
  updateMCQStats();

  // 15-minute countdown
  timeRemaining = 900;
  clearInterval(examTimerInterval);
  if (examTimerEl) examTimerEl.textContent = "15:00";
  examTimerInterval = setInterval(() => {
    timeRemaining--;
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    if (examTimerEl) {
      examTimerEl.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    }
    if (timeRemaining <= 0) {
      clearInterval(examTimerInterval);
      showToast("Time is up! Review your exam results.");
      showMCQSummary();
    }
  }, 1000);

  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";
  renderMCQQuestion();
}

function showMCQSummary() {
  clearTimeout(autoNextTimeout);
  clearInterval(examTimerInterval);
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const paletteContainer = document.getElementById("mcq-palette-container");
  const modeBanner = document.getElementById("mode-banner");

  if (quizCard) quizCard.style.display = "none";
  if (summaryCard) summaryCard.style.display = "block";
  if (paletteContainer) paletteContainer.style.display = "none";
  if (modeBanner) modeBanner.classList.remove("active");

  let examCorrect = 0;
  let examWrong = 0;
  let examSkipped = 0;
  const newlyMasteredQuestions = [];

  // Evaluate each question in the active exam pool
  activeExamPool.forEach((q, idx) => {
    const slotKey = getQuestionSlotKey(q, idx);
    const qKey = String(q.id !== undefined ? q.id : idx);
    const userAns = sessionAnswered[slotKey] || sessionAnswered[qKey];

    if (!userMCQProgress.answers[qKey]) {
      userMCQProgress.answers[qKey] = { timesCorrect: 0, timesWrong: 0, lastAnswered: null };
    }

    if (userAns && userAns.selectedIndex !== undefined) {
      const isCorrect = (userAns.selectedIndex === q.correct);
      userAns.isCorrect = isCorrect;

      if (isCorrect) {
        examCorrect++;
        const currentTimes = userMCQProgress.answers[qKey].timesCorrect || 0;
        const newTimes = currentTimes + 1;
        userMCQProgress.answers[qKey].timesCorrect = newTimes;
        userMCQProgress.answers[qKey].lastAnswered = Date.now();
        userMCQProgress.answers[qKey].isCorrect = true;

        // 2-Times-Right Leitner Rule:
        // If candidate answers right twice (>= 2 times), auto-delete / graduate from exam pool for this user
        if (newTimes >= 2) {
          const strId = String(q.id !== undefined ? q.id : qKey);
          if (!userMCQProgress.masteredIds.map(String).includes(strId)) {
            userMCQProgress.masteredIds.push(q.id !== undefined ? q.id : qKey);
            newlyMasteredQuestions.push(q);
          }
        }
      } else {
        examWrong++;
        userMCQProgress.answers[qKey].timesWrong = (userMCQProgress.answers[qKey].timesWrong || 0) + 1;
        userMCQProgress.answers[qKey].timesCorrect = 0; // Reset consecutive mastery requirement
        userMCQProgress.answers[qKey].lastAnswered = Date.now();
        userMCQProgress.answers[qKey].isCorrect = false;

        // Automatically record into Mistake Bank for weak-area practice
        const exists = mistakes.some(m => (m.q === q.question || String(m.id) === String(q.id)));
        if (!exists) {
          mistakes.unshift({
            id: q.id || ("mcq_" + Date.now() + "_" + idx),
            q: q.question,
            subject: q.subject || "General",
            options: q.options,
            correct: q.correct,
            correctAns: q.options[q.correct] || "",
            yourAns: q.options[userAns.selectedIndex] || "",
            explain: q.explanation || "No explanation provided.",
            date: new Date().toLocaleDateString()
          });
        }
      }
    } else {
      examSkipped++;
    }
  });

  // Auto-graduate newly mastered questions from the active 30 pool and replenish from 1,000 bank
  if (newlyMasteredQuestions.length > 0) {
    newlyMasteredQuestions.forEach(mq => {
      graduateMasteredQuestion(mq.id);
    });
  }

  correctAnswers = examCorrect;
  wrongAnswers = examWrong;

  // Persist progress and mistakes
  saveMCQProgress();
  saveMistakes();
  renderMistakes();
  updateMCQStats();

  // Standard BCS Preliminary scoring: +1.0 for right, -0.5 for wrong
  const rawScore = (examCorrect * 1.0) - (examWrong * 0.5);
  const netMarks = Math.max(0, rawScore);
  const totalQuestions = activeExamPool.length;
  const attemptedCount = examCorrect + examWrong;
  const accuracy = attemptedCount > 0 ? Math.round((examCorrect / attemptedCount) * 100) : 0;
  const percentage = totalQuestions > 0 ? Math.round((netMarks / totalQuestions) * 100) : 0;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  let gradeBadge = "";
  let gradeColor = "";
  if (netMarks >= 16) {
    gradeBadge = "🌟 Outstanding! (Top Tier)";
    gradeColor = "#10b981";
  } else if (netMarks >= 12) {
    gradeBadge = "✓ Passed Preliminary Cutoff";
    gradeColor = "#3b82f6";
  } else if (netMarks >= 9) {
    gradeBadge = "⚠️ Marginal Score (Practice needed)";
    gradeColor = "#f59e0b";
  } else {
    gradeBadge = "❌ Below Qualifying Cutoff";
    gradeColor = "#f43f5e";
  }

  let reviewItemsHtml = "";
  activeExamPool.forEach((q, idx) => {
    const slotKey = getQuestionSlotKey(q, idx);
    const qKey = String(q.id !== undefined ? q.id : idx);
    const userAns = sessionAnswered[slotKey] || sessionAnswered[qKey];
    const selectedIdx = userAns ? userAns.selectedIndex : undefined;
    const isCorrect = (selectedIdx === q.correct);
    const isSkipped = (selectedIdx === undefined);
    const isFlagged = Boolean(flaggedQuestions[slotKey] || flaggedQuestions[qKey]);
    const stat = userMCQProgress.answers[qKey] || { timesCorrect: 0 };
    const timesCorrect = stat.timesCorrect || 0;
    const isMastered = userMCQProgress.masteredIds.map(String).includes(String(q.id !== undefined ? q.id : qKey));

    let cardStatusClass = isSkipped ? "review-card-skipped" : (isCorrect ? "review-card-correct" : "review-card-wrong");
    let statusPillHtml = isSkipped
      ? `<span class="review-status-pill pill-skipped">— Skipped (0.0)</span>`
      : (isCorrect
        ? `<span class="review-status-pill pill-correct">✓ Correct (+1.0)</span>`
        : `<span class="review-status-pill pill-wrong">✕ Incorrect (-0.5)</span>`);

    let flagPillHtml = isFlagged
      ? `<span class="review-status-pill pill-flagged" style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); font-size:11px;">${ICON.flag} Flagged</span>`
      : "";

    let masteryPillHtml = "";
    if (isMastered) {
      masteryPillHtml = `<span class="q-history-badge mastered" style="font-size:11px;">🏆 Mastered (2/2) &bull; Auto-Removed</span>`;
    } else if (timesCorrect === 1) {
      masteryPillHtml = `<span class="q-history-badge has-correct" style="font-size:11px;">✓ 1/2 Right &bull; 1 more right to remove</span>`;
    } else {
      masteryPillHtml = `<span class="q-history-badge" style="font-size:11px;">Mastery: 0/2</span>`;
    }

    let optionsRowsHtml = "";
    q.options.forEach((opt, optIdx) => {
      let optRowClass = "review-opt-row";
      let optTag = "";

      if (optIdx === q.correct) {
        optRowClass += " opt-correct";
        optTag = `<span class="review-opt-tag">✓ Correct Answer</span>`;
      } else if (optIdx === selectedIdx && !isCorrect) {
        optRowClass += " opt-wrong";
        optTag = `<span class="review-opt-tag">✕ Your Choice</span>`;
      }

      optionsRowsHtml += `
        <div class="${optRowClass}">
          <span class="opt-prefix">${prefixList[optIdx] || (optIdx + 1)}</span>
          <span>${escapeHtml(opt)}</span>
          ${optTag}
        </div>
      `;
    });

    reviewItemsHtml += `
      <div class="review-card glass ${cardStatusClass}" data-review-status="${isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'wrong')}" data-flagged="${isFlagged ? 'true' : 'false'}">
        <div class="review-card-top">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="q-badge" style="font-size:11px;">${escapeHtml(q.subject || "General")}</span>
            <span style="font-weight:700; font-size:13.5px; color:var(--text-soft);">Question ${idx + 1}</span>
            ${masteryPillHtml}
            ${flagPillHtml}
          </div>
          <div>${statusPillHtml}</div>
        </div>
        <div class="review-q-title">${idx + 1}. ${escapeHtml(q.question)}</div>
        <div class="review-options-list">
          ${optionsRowsHtml}
        </div>
        <div class="review-explanation">
          <strong><i data-lucide="lightbulb" style="width:14px; height:14px; vertical-align:middle;"></i> Explanation &amp; Shortcut:</strong>
          <div style="margin-top:4px;">${escapeHtml(q.explanation || "No explanation provided.")}</div>
        </div>
      </div>
    `;
  });

  summaryCard.innerHTML = `
    <div class="exam-summary-wrapper">
      <div class="exam-summary-header">
        <div class="exam-result-badge" style="background:${gradeColor}18; color:${gradeColor}; border:1px solid ${gradeColor}50;">
          ${gradeBadge}
        </div>
        <h2 class="summary-title" style="margin-top:12px; margin-bottom:6px;">
          ${is20ExamMode ? "BCS 20-Question Model Test Completed!" : "MCQ Session Completed!"}
        </h2>
        <p style="color:var(--text-soft); font-size:13.5px; margin:0;">
          Standard BCS Preliminary Negative Marking Applied (+1.0 / -0.5)
        </p>
      </div>

      <div class="exam-score-hero glass">
        <div class="score-main-value">
          <span class="score-number" style="color:${gradeColor};">${netMarks.toFixed(2)}</span>
          <span class="score-total">/ ${totalQuestions}.00</span>
        </div>
        <div class="score-meta-text">
          Net Score &bull; Accuracy: <b>${accuracy}%</b> &bull; Score Rate: <b>${percentage}%</b>
        </div>
      </div>

      <div class="exam-stat-grid">
        <div class="exam-stat-box stat-correct">
          <div class="stat-num">${examCorrect}</div>
          <div class="stat-lbl">✓ Correct (+${(examCorrect * 1.0).toFixed(1)})</div>
        </div>
        <div class="exam-stat-box stat-wrong">
          <div class="stat-num">${examWrong}</div>
          <div class="stat-lbl">✕ Wrong (-${(examWrong * 0.5).toFixed(1)})</div>
        </div>
        <div class="exam-stat-box stat-skipped">
          <div class="stat-num">${examSkipped}</div>
          <div class="stat-lbl">— Skipped (0.0)</div>
        </div>
        <div class="exam-stat-box stat-mastered">
          <div class="stat-num">${userMCQProgress.masteredIds.length}</div>
          <div class="stat-lbl">🏆 Mastered Total</div>
        </div>
      </div>

      ${newlyMasteredQuestions.length > 0 ? `
        <div class="mastered-celebration-banner glass">
          <div style="font-size:24px;">🎉</div>
          <div>
            <div style="font-weight:700; color:#10b981; font-size:15px;">
              ${newlyMasteredQuestions.length} Question(s) Mastered &amp; Auto-Removed from Exam!
            </div>
            <div style="font-size:13px; color:var(--text-soft); margin-top:3px; line-height:1.5;">
              You answered these question(s) correctly twice. As requested, they are automatically removed from future exams for this user so you can focus on new and weak questions.
            </div>
          </div>
        </div>
      ` : `
        <div class="mastered-info-banner glass" style="padding:12px 18px; border-radius:12px; margin-bottom:22px; font-size:13px; color:var(--text-soft); display:flex; align-items:center; gap:12px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.2);">
          <div style="font-size:18px;">💡</div>
          <div><strong>Leitner Auto-Delete Rule:</strong> Any question answered correctly 2 times is automatically removed from future exam pools for your profile.</div>
        </div>
      `}

      <div class="summary-actions" style="margin: 20px 0 28px; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
        <button class="pill solid btn-exam20" id="summary-retake-20-btn" style="padding:10px 22px; font-weight:700;">
          ${ICON.zap} Retake 20 Questions
        </button>
        <button class="pill" id="summary-return-bank-btn" style="padding:10px 20px;">
          ${ICON.undo} Question Bank
        </button>
        ${examWrong > 0 ? `
          <button class="pill danger" id="summary-view-mistakes-btn" style="padding:10px 20px;">
            ${ICON.x} Review Mistake Bank (${examWrong})
          </button>
        ` : ''}
      </div>

      <div class="exam-review-section">
        <div class="exam-review-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border); padding-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="margin:0; font-size:16.5px; font-weight:700; color:var(--text);">
              Detailed Question Review (${totalQuestions} Questions)
            </h3>
            <span style="font-size:12.5px; color:var(--text-soft);">Solutions, Keys &amp; Explanations</span>
          </div>
          <div class="review-filter-chips" style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="pill subtle review-filter-pill active" data-review-filter="all" style="font-size:11.5px; padding:4px 10px;">All (${totalQuestions})</button>
            <button class="pill subtle review-filter-pill" data-review-filter="correct" style="font-size:11.5px; padding:4px 10px; color:#10b981;">✓ Correct (${examCorrect})</button>
            <button class="pill subtle review-filter-pill" data-review-filter="wrong" style="font-size:11.5px; padding:4px 10px; color:#f43f5e;">✕ Wrong (${examWrong})</button>
            <button class="pill subtle review-filter-pill" data-review-filter="skipped" style="font-size:11.5px; padding:4px 10px;">— Skipped (${examSkipped})</button>
            ${flaggedCount > 0 ? `<button class="pill subtle review-filter-pill" data-review-filter="flagged" style="font-size:11.5px; padding:4px 10px; color:#f59e0b;">Flagged (${flaggedCount})</button>` : ''}
          </div>
        </div>

        <div class="exam-review-list">
          ${reviewItemsHtml}
        </div>
      </div>
    </div>
  `;

  const reviewFilterPills = summaryCard.querySelectorAll(".review-filter-pill");
  reviewFilterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      reviewFilterPills.forEach(p => p.classList.remove("active", "solid"));
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

  const retakeBtn = document.getElementById("summary-retake-20-btn");
  const returnBankBtn = document.getElementById("summary-return-bank-btn");
  const mistakesBtn = document.getElementById("summary-view-mistakes-btn");

  if (retakeBtn) retakeBtn.addEventListener("click", setup20QuestionExam);
  if (returnBankBtn) returnBankBtn.addEventListener("click", resetMCQQuiz);
  if (mistakesBtn) {
    mistakesBtn.addEventListener("click", () => {
      const mistakeChip = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
      if (mistakeChip) {
        mistakeChip.click();
      }
    });
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function resetMCQQuiz() {
  clearTimeout(autoNextTimeout);
  clearInterval(examTimerInterval);
  is20ExamMode = false;
  const modeBanner = document.getElementById("mode-banner");
  const filterBar = document.getElementById("filter-bar");
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  const paletteContainer = document.getElementById("mcq-palette-container");
  const btnPractice = document.getElementById("btnModePractice");
  const btnExam20 = document.getElementById("start-exam-20-btn");

  if (modeBanner) modeBanner.classList.remove("active");
  if (paletteContainer) paletteContainer.style.display = "none";
  if (btnPractice) btnPractice.classList.add("active");
  if (btnExam20) btnExam20.classList.remove("active");
  flaggedQuestions = {};

  currentSelectedSubject = "all";
  if (filterBar) {
    filterBar.style.display = "flex";
    renderMCQFilterBar();
  }

  allQuestions = getActiveQuestionsPool();
  activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
  currentMCQIndex = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  sessionAnswered = {};
  updateMCQStats();

  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";
  renderMCQQuestion();
}

function getDistinctMCQSubjects() {
  const bank = getMasterQuestionBank();
  const set = new Set();
  bank.forEach(q => {
    if (q.subject && typeof q.subject === 'string') {
      const trimmed = q.subject.trim();
      if (trimmed) set.add(trimmed);
    }
  });
  return Array.from(set);
}

let currentSelectedSubject = "all";

function renderMCQFilterBar() {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;

  if (!userMCQProgress || typeof userMCQProgress !== 'object') {
    userMCQProgress = { answers: {}, masteredIds: [], activePoolIds: [], removedSubjects: [], addedExtendedIndex: 0 };
  }
  if (!Array.isArray(userMCQProgress.removedSubjects)) {
    userMCQProgress.removedSubjects = [];
  }
  const removedSet = new Set((userMCQProgress.removedSubjects || []).map(s => String(s).toLowerCase()));

  // Collect distinct subjects from the 1,000 question bank and custom questions
  const distinctSubs = getDistinctMCQSubjects();
  const visibleSubjects = distinctSubs.filter(s => !removedSet.has(s.toLowerCase()));

  let html = `
    <button class="filter-pill ${currentSelectedSubject === 'all' ? 'active' : ''}" data-subject="all">
      <i data-lucide="layers" style="width:13px; height:13px;"></i> <span>All Subjects (30 Active)</span>
    </button>
  `;

  visibleSubjects.forEach(s => {
    const isActive = currentSelectedSubject === s;
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(s) : { icon: 'book-open' };
    html += `
      <button class="filter-pill ${isActive ? 'active' : ''}" data-subject="${escapeAttr(s)}">
        <i data-lucide="${meta.icon || 'book-open'}" style="width:13px; height:13px;"></i>
        <span class="pill-label">${escapeHtml(s)}</span>
        <span class="pill-del-btn" data-del-subject="${escapeAttr(s)}" title="Remove ${escapeAttr(s)}">${ICON.x}</span>
      </button>
    `;
  });

  html += `
    <button class="filter-pill ${currentSelectedSubject === 'custom' ? 'active' : ''}" data-subject="custom">
      <i data-lucide="sparkles" style="width:13px; height:13px;"></i> <span>Custom Questions</span>
    </button>
  `;

  if (userMCQProgress.removedSubjects.length > 0) {
    html += `
      <button class="restore-subjects-btn" id="restoreSubjectsBtn" title="Click to restore removed subjects">
        ${ICON.rotccw} Restore Subjects (${userMCQProgress.removedSubjects.length})
      </button>
    `;
  }

  filterBar.innerHTML = html;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function filterMCQPoolBySubject(selectedSubject) {
  currentSelectedSubject = selectedSubject;
  allQuestions = getActiveQuestionsPool(selectedSubject);
  activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
  currentMCQIndex = 0;
  sessionAnswered = {};
  const quizCard = document.getElementById("quiz-card");
  const summaryCard = document.getElementById("summary-card");
  if (quizCard) quizCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "none";
  renderMCQQuestion();
  updateMCQStats();
}

function renderMistakes() {
  const list = document.getElementById("mistakeBankList");
  if (!list) return;
  list.innerHTML = "";

  if (!mistakes.length) {
    list.innerHTML = '<div class="empty-state">No mistakes recorded yet. Practice quizzes to identify weak areas!</div>';
    return;
  }

  mistakes.forEach((m, idx) => {
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(m.subject) : { icon: 'alert-circle' };
    const card = document.createElement("div");
    card.className = "mistake-card glass";
    card.style.cssText = "padding:16px 18px; margin-bottom:12px; border-radius:12px; border:1px solid var(--border);";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:10px;">
        <h4 style="margin:0; font-size:15px; font-weight:700; color:var(--text); line-height:1.4;">${escapeHtml(m.q)}</h4>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          ${m.subject ? `<span class="q-badge" style="font-size:11px; padding:2px 8px; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="${meta.icon || 'alert-circle'}" style="width:12px; height:12px;"></i> <span>${escapeHtml(m.subject)}</span></span>` : ""}
          <button class="pill danger mistake-del-btn" data-del-mistake="${idx}" title="Remove question from Mistake Bank" aria-label="Remove question">${ICON.trash} <span>Remove</span></button>
        </div>
      </div>
      <div class="mistake-ans-row" style="display:flex; gap:12px; margin-bottom:8px; flex-wrap:wrap; font-size:13.5px;">
        <span class="mistake-wrong" style="color:#f43f5e; font-weight:600;">Your Answer: ${escapeHtml(m.yourAns || "None")}</span>
        <span class="mistake-correct" style="color:#10b981; font-weight:600;">Correct: ${escapeHtml(m.correctAns || "N/A")}</span>
      </div>
      <div style="font-size:13px; color:var(--text-soft); line-height:1.5; background:rgba(99,102,241,0.06); padding:8px 12px; border-radius:8px; border-left:3px solid var(--accent1);">
        <strong>Explanation:</strong> ${escapeHtml(m.explain || "No explanation recorded.")}
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll("[data-del-mistake]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-del-mistake]");
      if (!targetBtn) return;
      const i = parseInt(targetBtn.getAttribute("data-del-mistake"), 10);
      if (isNaN(i)) return;
      if (window.confirm("Remove this question from your Mistake Bank?")) {
        mistakes.splice(i, 1);
        saveMistakes();
        renderMistakes();
        showToast("Mistake item removed");
      }
    });
  });
}

function initMCQEngine() {
  const startExam20Btn = document.getElementById("start-exam-20-btn");
  const retake20Btn = document.getElementById("retake-20-btn");
  const resetBtn = document.getElementById("reset-btn");
  const restartBtn = document.getElementById("restart-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const filterBar = document.getElementById("filter-bar");
  const resetMasteredBtn = document.getElementById("resetMasteredBtn");
  const btnModePractice = document.getElementById("btnModePractice");
  const mcqSoundToggleBtn = document.getElementById("mcqSoundToggleBtn");
  const mcqAutoAdvanceToggle = document.getElementById("mcqAutoAdvanceToggle");
  const qFlagBtn = document.getElementById("qFlagBtn");
  const finishEarlyBtn = document.getElementById("finishEarlyBtn");
  const btnCancelSubmit = document.getElementById("btnCancelSubmitExam");
  const btnConfirmSubmit = document.getElementById("btnConfirmSubmitExam");

  const addModal = document.getElementById("add-modal");
  const openAddModalBtn = document.getElementById("open-add-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const closeModalCancelBtn = document.getElementById("closeModalCancelBtn");
  const addForm = document.getElementById("add-question-form");
  const modalTabSwitch = document.getElementById("mcqModalTabSwitch");
  const tabCreate = document.getElementById("modal-tab-create");
  const tabImport = document.getElementById("modal-tab-import");

  const btnImportJson = document.getElementById("btn-import-json");
  const btnExportMcqJson = document.getElementById("btn-export-mcq-json");
  const agentImportText = document.getElementById("agent-import-text");

  if (btnModePractice) {
    btnModePractice.addEventListener("click", () => {
      if (is20ExamMode) {
        if (window.confirm("Switch to Practice Mode? Current 20-question exam will be closed.")) {
          resetMCQQuiz();
        }
      } else {
        resetMCQQuiz();
      }
    });
  }

  if (mcqSoundToggleBtn) {
    mcqSoundToggleBtn.innerHTML = mcqSoundEnabled ? ICON.volume2 : ICON.volumeX;
    mcqSoundToggleBtn.title = mcqSoundEnabled ? "Sound Feedback: Enabled" : "Sound Feedback: Muted";
    mcqSoundToggleBtn.addEventListener("click", () => {
      mcqSoundEnabled = !mcqSoundEnabled;
      try { localStorage.setItem('jobprep_mcq_sound', mcqSoundEnabled ? '1' : '0'); } catch (e) { }
      mcqSoundToggleBtn.innerHTML = mcqSoundEnabled ? ICON.volume2 : ICON.volumeX;
      mcqSoundToggleBtn.title = mcqSoundEnabled ? "Sound Feedback: Enabled" : "Sound Feedback: Muted";
      showToast(mcqSoundEnabled ? "Audio feedback enabled" : "Audio feedback muted");
    });
  }

  if (mcqAutoAdvanceToggle) {
    mcqAutoAdvanceToggle.innerHTML = `${ICON.zap} Auto: <b>${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}</b>`;
    mcqAutoAdvanceToggle.addEventListener("click", () => {
      mcqAutoAdvanceEnabled = !mcqAutoAdvanceEnabled;
      try { localStorage.setItem('jobprep_mcq_autoadvance', mcqAutoAdvanceEnabled ? '1' : '0'); } catch (e) { }
      mcqAutoAdvanceToggle.innerHTML = `${ICON.zap} Auto: <b>${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}</b>`;
      const autoNextPill = document.getElementById("qAutoNextPill");
      if (autoNextPill) {
        autoNextPill.innerHTML = `${ICON.zap} Auto-Next: ${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}`;
      }
      showToast(mcqAutoAdvanceEnabled ? "Auto-advance enabled (1.5s countdown)" : "Auto-advance paused");
    });
  }

  if (qFlagBtn) {
    qFlagBtn.addEventListener("click", () => {
      toggleFlagCurrentQuestion();
    });
  }

  if (finishEarlyBtn) {
    finishEarlyBtn.addEventListener("click", () => {
      openExamSubmitModal();
    });
  }

  if (btnCancelSubmit) {
    btnCancelSubmit.addEventListener("click", () => {
      const modal = document.getElementById("examSubmitModal");
      if (modal) modal.classList.remove("open");
    });
  }

  if (btnConfirmSubmit) {
    btnConfirmSubmit.addEventListener("click", () => {
      const modal = document.getElementById("examSubmitModal");
      if (modal) modal.classList.remove("open");
      showMCQSummary();
    });
  }

  if (startExam20Btn) startExam20Btn.addEventListener("click", setup20QuestionExam);
  if (retake20Btn) retake20Btn.addEventListener("click", setup20QuestionExam);
  if (resetBtn) resetBtn.addEventListener("click", resetMCQQuiz);
  if (restartBtn) restartBtn.addEventListener("click", resetMCQQuiz);

  // Restore Mastered Questions handler
  if (resetMasteredBtn) {
    resetMasteredBtn.addEventListener("click", () => {
      const count = (userMCQProgress.masteredIds || []).length;
      if (window.confirm(`Restore all ${count} mastered questions back to your active practice list?`)) {
        userMCQProgress.masteredIds = [];
        userMCQProgress.activePoolIds = [];
        saveMCQProgress();
        allQuestions = getActiveQuestionsPool(currentSelectedSubject);
        activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
        currentMCQIndex = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        sessionAnswered = {};
        updateMCQStats();
        renderMCQQuestion();
        showToast("All mastered questions restored! Loaded 30 active questions from the 1,000 bank.");
      }
    });
  }

  // Explicit Mark Mastered button handler
  const markMasteredBtn = document.getElementById("qMarkMasteredBtn");
  if (markMasteredBtn) {
    markMasteredBtn.addEventListener("click", () => {
      clearTimeout(autoNextTimeout);
      clearInterval(autoAdvanceCountdownInterval);
      const q = activeExamPool[currentMCQIndex];
      if (!q) return;
      graduateMasteredQuestion(q.id);
      playMCQAudio('mastered');
      showToast("Question Mastered! Auto-removed & new question added from 1,000 bank.");
      updateMCQStats();
      if (currentMCQIndex >= activeExamPool.length) {
        currentMCQIndex = Math.max(0, activeExamPool.length - 1);
      }
      if (activeExamPool.length === 0) {
        showMCQSummary();
      } else {
        renderMCQQuestion();
      }
    });
  }



  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      advanceToNextMCQQuestion();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      clearTimeout(autoNextTimeout);
      if (currentMCQIndex > 0) {
        currentMCQIndex--;
        renderMCQQuestion();
      }
    });
  }

  // Filter handling & Subject Deletion with confirmation
  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      clearTimeout(autoNextTimeout);

      // 1. Delete button clicked
      const delBtn = e.target.closest("[data-del-subject]");
      if (delBtn) {
        e.stopPropagation();
        e.preventDefault();
        const targetSubj = delBtn.getAttribute("data-del-subject");
        if (!targetSubj) return;

        if (window.confirm(`Are you sure you want to remove "${targetSubj}" from the subject list?\n\n(This subject's questions will be hidden from practice. You can restore it anytime.)`)) {
          if (!userMCQProgress.removedSubjects) userMCQProgress.removedSubjects = [];
          if (!userMCQProgress.removedSubjects.includes(targetSubj)) {
            userMCQProgress.removedSubjects.push(targetSubj);
          }
          saveMCQProgress();

          if (currentSelectedSubject === targetSubj) {
            currentSelectedSubject = "all";
          }

          allQuestions = getActiveQuestionsPool();
          filterMCQPoolBySubject(currentSelectedSubject);
          renderMCQFilterBar();
          showToast(`Subject "${targetSubj}" removed from list`);
        }
        return;
      }

      // 2. Restore subjects button clicked
      const restoreBtn = e.target.closest("#restoreSubjectsBtn");
      if (restoreBtn) {
        e.stopPropagation();
        e.preventDefault();
        const listStr = (userMCQProgress.removedSubjects || []).join(", ");
        if (window.confirm(`Restore all removed subjects (${listStr}) back to the subject list?`)) {
          userMCQProgress.removedSubjects = [];
          saveMCQProgress();
          allQuestions = getActiveQuestionsPool();
          filterMCQPoolBySubject(currentSelectedSubject);
          renderMCQFilterBar();
          showToast("All subjects restored successfully!");
        }
        return;
      }

      // 3. Normal subject selection
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;

      const selectedSubject = pill.getAttribute("data-subject");
      if (!selectedSubject) return;

      currentSelectedSubject = selectedSubject;
      filterMCQPoolBySubject(selectedSubject);
      renderMCQFilterBar();
    });
  }

  // Modal Events
  if (openAddModalBtn && addModal) {
    openAddModalBtn.addEventListener("click", () => addModal.classList.add("open"));
  }
  if (closeModalBtn && addModal) {
    closeModalBtn.addEventListener("click", () => addModal.classList.remove("open"));
  }
  if (closeModalCancelBtn && addModal) {
    closeModalCancelBtn.addEventListener("click", () => addModal.classList.remove("open"));
  }

  if (addModal) {
    addModal.addEventListener("click", (e) => {
      if (e.target === addModal) addModal.classList.remove("open");
    });
  }

  // Modal Tab Switch (Add vs Import)
  if (modalTabSwitch) {
    modalTabSwitch.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      modalTabSwitch.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const tab = chip.getAttribute("data-tab");
      if (tabCreate) tabCreate.style.display = tab === "create" ? "block" : "none";
      if (tabImport) tabImport.style.display = tab === "import" ? "block" : "none";
    });
  }

  // JSON Importer
  if (btnImportJson && agentImportText) {
    btnImportJson.addEventListener("click", () => {
      const raw = agentImportText.value.trim();
      if (!raw) {
        showToast("Please paste a JSON array of questions", true);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const stored = getStoredQuestions();
          let count = 0;
          parsed.forEach(item => {
            if (item.question && Array.isArray(item.options)) {
              const newQ = {
                id: "imported_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                subject: item.subject || "General Knowledge",
                question: item.question,
                options: item.options,
                correct: typeof item.correct === "number" ? item.correct : 0,
                explanation: item.explanation || "No explanation provided.",
                isCustom: true
              };
              stored.push(newQ);
              allQuestions.push(newQ);
              count++;
            }
          });
          saveStoredQuestions(stored);
          showToast(`Successfully imported ${count} questions!`);
          if (addModal) addModal.classList.remove("open");
          agentImportText.value = "";
          if (!is20ExamMode) {
            activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
            renderMCQQuestion();
          }
        } else {
          showToast("Invalid format: expected JSON array [ ... ]", true);
        }
      } catch (err) {
        showToast("JSON Parse Error: " + err.message, true);
      }
    });
  }

  // JSON Exporter
  if (btnExportMcqJson) {
    btnExportMcqJson.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(allQuestions, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bcs-mcq-question-bank.json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      showToast("MCQ Question Bank exported as JSON!");
    });
  }

  // Custom Add Form
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const rawSubj = (document.getElementById("new-subject")?.value || 'General Knowledge').trim();
      const subject = (typeof addSubject === 'function' ? addSubject(rawSubj) : rawSubj) || rawSubj;
      const question = document.getElementById("new-question").value.trim();
      const opt0 = document.getElementById("opt-0").value.trim();
      const opt1 = document.getElementById("opt-1").value.trim();
      const opt2 = document.getElementById("opt-2").value.trim();
      const opt3 = document.getElementById("opt-3").value.trim();
      const correct = parseInt(document.getElementById("new-correct").value, 10);
      const explanation = document.getElementById("new-explanation").value.trim() || "No explanation provided.";

      if (!question || !opt0 || !opt1 || !opt2 || !opt3) {
        showToast("Please fill in question and all 4 options", true);
        return;
      }

      const newQ = {
        id: "custom_" + Date.now(),
        subject: subject,
        isCustom: true,
        question: question,
        options: [opt0, opt1, opt2, opt3],
        correct: correct,
        explanation: explanation
      };

      const currentCustom = getStoredQuestions();
      currentCustom.push(newQ);
      saveStoredQuestions(currentCustom);

      if (userMCQProgress.removedSubjects && userMCQProgress.removedSubjects.includes(subject)) {
        userMCQProgress.removedSubjects = userMCQProgress.removedSubjects.filter(s => s !== subject);
        saveMCQProgress();
      }

      allQuestions = getActiveQuestionsPool();
      if (!is20ExamMode) {
        activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
        currentMCQIndex = activeExamPool.length - 1;
        renderMCQQuestion();
      }
      renderMCQFilterBar();

      addForm.reset();
      if (addModal) addModal.classList.remove("open");
      showToast("Custom MCQ question added successfully!");
    });
  }

  // Initial shuffle and load
  allQuestions = getActiveQuestionsPool();
  activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
  renderMCQFilterBar();
  renderMCQQuestion();
  updateMCQStats();
}

const clearMistakesBtn = document.getElementById("clearMistakesBtn");
if (clearMistakesBtn) {
  clearMistakesBtn.addEventListener("click", () => {
    if (window.confirm("Are you sure you want to clear all recorded mistakes?")) {
      mistakes = [];
      saveMistakes();
      renderMistakes();
      showToast("Mistake bank cleared successfully");
    }
  });
}

const quizFlashSwitch = document.getElementById("quizFlashSwitch");
if (quizFlashSwitch) {
  quizFlashSwitch.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    quizFlashSwitch.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const view = chip.dataset.view;
    try { localStorage.setItem('careerdesk_subnav_quiz', view); } catch (err) { }

    const subFlash = document.getElementById("subview-flashcards");
    const subQuiz = document.getElementById("subview-quiz");
    const subMistakes = document.getElementById("subview-mistakes");

    if (subFlash) subFlash.style.display = view === "flashcards" ? "block" : "none";
    if (subQuiz) subQuiz.style.display = view === "quiz" ? "block" : "none";
    if (subMistakes) subMistakes.style.display = view === "mistakes" ? "block" : "none";
  });

  // Restore saved sub-nav view
  try {
    const savedQuizSubnav = localStorage.getItem('careerdesk_subnav_quiz');
    if (savedQuizSubnav && ['flashcards', 'quiz', 'mistakes'].includes(savedQuizSubnav)) {
      const savedChip = quizFlashSwitch.querySelector(`[data-view="${savedQuizSubnav}"]`);
      if (savedChip) {
        savedChip.click();
      }
    }
  } catch (err) { }
}


