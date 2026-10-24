/* ==========================================================================
   CareerDesk — Study Tracker & Focus Engine: Timers, Heatmap & Analytics
   ========================================================================== */

// ===== Tracker =====
const sessionSubjectSel = document.getElementById('sessionSubject');
const sessionCustomInput = document.getElementById('sessionCustomSubject');
const timerDisplay = document.getElementById('timerDisplay');
const timerSub = document.getElementById('timerSub');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const targetHoursInput = document.getElementById('targetHours');

// ==========================================
// FIRST-TIME USER ONBOARDING SUBJECT WIZARD
// ==========================================

// Guard: Ensure state is initialized before accessing DOM elements
if (typeof state === 'undefined') {
   console.warn('⚠️ State not yet initialized. Core.js must load before tracker.js');
}

const CURRICULUM_SUBJECT_CHOICES = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker && BANGLADESH_CURRICULUM_DATA.jobSeeker.primarySubjects) || [
  { name: 'Bangla', bn: 'বাংলা ভাষা ও সাহিত্য', desc: 'প্রাচীন, মধ্য ও আধুনিক যুগ, ব্যাকরণ ও সাহিত্য' },
  { name: 'English', bn: 'English Language & Literature', desc: 'Grammar, Vocabulary, Comprehension & Literature' },
  { name: 'Mathematics', bn: 'গণিত ও গাণিতিক যুক্তি', desc: 'পাটিগণিত, বীজগণিত, জ্যামিতি ও বিশ্লেষণ' },
  { name: 'General Knowledge', bn: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', desc: 'ইতিহাস, মুক্তিযুদ্ধ, বিজ্ঞান, আইসিটি ও আন্তর্জাতিক' }
];

function openOnboardingModal(isReset = false) {
  const modal = document.getElementById('onboardingModal');
  const grid = document.getElementById('onboardingSubjectGrid');
  if (!modal || !grid) return;

  let activeSet;
  if (isReset) {
    activeSet = new Set(CURRICULUM_SUBJECT_CHOICES.map(c => canonicalSubjectName(c.name).toLowerCase()));
  } else {
    const currentActive = masterSubjectList(false);
    if (currentActive.length > 0 && Array.isArray(state.deletedSubjects) && state.deletedSubjects.length > 0) {
      activeSet = new Set(currentActive.map(s => canonicalSubjectName(s).toLowerCase()));
    } else {
      activeSet = new Set(CURRICULUM_SUBJECT_CHOICES.map(c => canonicalSubjectName(c.name).toLowerCase()));
    }
  }

  grid.innerHTML = CURRICULUM_SUBJECT_CHOICES.map(item => {
    const canonical = canonicalSubjectName(item.name).toLowerCase();
    const isChecked = activeSet.has(canonical);
    return `
      <label class="onboarding-subject-item ${isChecked ? 'selected' : ''}" data-subject-name="${escapeAttr(item.name)}">
        <input type="checkbox" class="onboarding-checkbox" value="${escapeAttr(item.name)}" ${isChecked ? 'checked' : ''}>
        <div class="onboarding-item-info">
          <span class="onboarding-item-title">${escapeHtml(item.name)}</span>
          <span class="onboarding-item-alias">${escapeHtml(item.bn)}</span>
          <span class="onboarding-item-desc">${escapeHtml(item.desc)}</span>
        </div>
      </label>
    `;
  }).join('');

  updateOnboardingSelectedCount();

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('open');
  }, 20);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeOnboardingModal() {
  const modal = document.getElementById('onboardingModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 250);
}

function updateOnboardingSelectedCount() {
  const grid = document.getElementById('onboardingSubjectGrid');
  const badge = document.getElementById('onboardingSelectedCount');
  if (!grid || !badge) return;
  const checkedCount = grid.querySelectorAll('.onboarding-checkbox:checked').length;
  const totalCount = CURRICULUM_SUBJECT_CHOICES.length;
  badge.textContent = `${checkedCount} of ${totalCount}`;
}

// Click delegation on onboarding items
const onboardingGrid = document.getElementById('onboardingSubjectGrid');
if (onboardingGrid) {
  onboardingGrid.addEventListener('change', (e) => {
    if (e.target.classList.contains('onboarding-checkbox')) {
      const item = e.target.closest('.onboarding-subject-item');
      if (item) item.classList.toggle('selected', e.target.checked);
      updateOnboardingSelectedCount();
    }
  });
}

// Select All button
const onboardingSelectAllBtn = document.getElementById('onboardingSelectAllBtn');
if (onboardingSelectAllBtn) {
  onboardingSelectAllBtn.addEventListener('click', () => {
    const grid = document.getElementById('onboardingSubjectGrid');
    if (!grid) return;
    grid.querySelectorAll('.onboarding-checkbox').forEach(cb => {
      cb.checked = true;
      const item = cb.closest('.onboarding-subject-item');
      if (item) item.classList.add('selected');
    });
    updateOnboardingSelectedCount();
  });
}

// Deselect All button
const onboardingClearAllBtn = document.getElementById('onboardingClearAllBtn');
if (onboardingClearAllBtn) {
  onboardingClearAllBtn.addEventListener('click', () => {
    const grid = document.getElementById('onboardingSubjectGrid');
    if (!grid) return;
    grid.querySelectorAll('.onboarding-checkbox').forEach(cb => {
      cb.checked = false;
      const item = cb.closest('.onboarding-subject-item');
      if (item) item.classList.remove('selected');
    });
    updateOnboardingSelectedCount();
  });
}

// Confirm selection button
const confirmOnboardingBtn = document.getElementById('confirmOnboardingSubjectsBtn');
if (confirmOnboardingBtn) {
  confirmOnboardingBtn.addEventListener('click', () => {
    const grid = document.getElementById('onboardingSubjectGrid');
    if (!grid) return;
    const checkedInputs = Array.from(grid.querySelectorAll('.onboarding-checkbox:checked'));
    if (checkedInputs.length === 0) {
      showToast('Please select at least one subject to get started', true);
      return;
    }

    const selectedNames = checkedInputs.map(cb => cb.value.trim());
    const selectedCanonicals = new Set(selectedNames.map(s => canonicalSubjectName(s).toLowerCase()));

    if (!Array.isArray(state.deletedSubjects)) state.deletedSubjects = [];
    if (!Array.isArray(state.customSubjects)) state.customSubjects = [];

    // Collect all known subjects across system to ensure unselected items are removed
    const allKnown = masterSubjectList(true);
    CURRICULUM_SUBJECT_CHOICES.forEach(c => {
      if (!allKnown.some(s => canonicalSubjectName(s).toLowerCase() === canonicalSubjectName(c.name).toLowerCase())) {
        allKnown.push(c.name);
      }
    });

    allKnown.forEach(sub => {
      const subCanonical = canonicalSubjectName(sub).toLowerCase();
      const isSelected = selectedCanonicals.has(subCanonical);
      if (!isSelected) {
        if (!state.deletedSubjects.some(d => canonicalSubjectName(d).toLowerCase() === subCanonical)) {
          state.deletedSubjects.push(sub);
        }
        state.customSubjects = state.customSubjects.filter(c => canonicalSubjectName(c).toLowerCase() !== subCanonical);
      } else {
        state.deletedSubjects = state.deletedSubjects.filter(d => canonicalSubjectName(d).toLowerCase() !== subCanonical);
        const isDefault = DEFAULT_SUBJECTS.some(d => canonicalSubjectName(d).toLowerCase() === subCanonical);
        if (!isDefault && !state.customSubjects.some(c => canonicalSubjectName(c).toLowerCase() === subCanonical)) {
          state.customSubjects.push(sub);
        }
      }
    });

    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch (e) { }

    saveData();
    syncAllSubjectSelects();
    renderSubjectManager();
    renderRoutine();
    renderTrackerAll();
    renderCategories();

    closeOnboardingModal();
    showToast(`${selectedNames.length} subjects configured for your dashboard!`);
  });
}



function checkFirstTimeUser() {
  try {
    // First-time popup disabled: mark onboarding as done so no interrupting popup appears
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) { }
}

function refreshTimerSub() {
  if (state.activeSession || window.isCustomCountdownActive) return;
  const sub = document.getElementById('timerSub');
  if (!sub) return;
  if (timerMode === 'break') {
    const reason = document.getElementById('breakReason')?.value || 'Refreshment';
    sub.innerHTML = `<strong>${selectedDuration}-minute ${escapeHtml(reason.toLowerCase())}</strong> break — recharge before your next focus block`;
    return;
  }
  const subject = currentSubjectValue() || 'General';
  if (selectedDuration === 0) {
    sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — Stopwatch mode — click Start to track time`;
  } else {
    sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — ${selectedDuration} minute focus session`;
  }
}

if (sessionSubjectSel) {
  sessionSubjectSel.addEventListener('change', () => {
    if (sessionCustomInput) {
      sessionCustomInput.style.display = sessionSubjectSel.value === '__custom__' ? 'block' : 'none';
      if (sessionSubjectSel.value !== '__custom__') {
        sessionCustomInput.value = '';
      }
    }
    refreshTimerSub();
  });
}
if (sessionCustomInput) {
  sessionCustomInput.addEventListener('input', refreshTimerSub);
}
const breakReasonSelect = document.getElementById('breakReason');
if (breakReasonSelect) breakReasonSelect.addEventListener('change', refreshTimerSub);

function currentSubjectValue() {
  if (!sessionSubjectSel) return '';
  if (sessionSubjectSel.value === '__custom__' && sessionCustomInput) return sessionCustomInput.value.trim();
  return sessionSubjectSel.value;
}

if (startBtn) {
  startBtn.addEventListener('click', () => {
    // Countdown mode (selectedDuration > 0) is fully handled by the document-level
    // capture listener below. This handler is exclusively for stopwatch mode (duration = 0).
    if (selectedDuration !== 0) return;
    if (!timerMode) return;
    const subj = currentSubjectValue();
    if (!subj) {
      if (sessionCustomInput) {
        sessionCustomInput.style.display = 'block';
        sessionCustomInput.focus();
      }
      showToast('Please enter or select a study subject', true);
      return;
    }
    const canonical = (typeof addSubject === 'function' ? addSubject(subj) : subj) || subj;
    state.activeSession = { subject: canonical, start: Date.now() };
    saveData();
    renderTrackerAll();
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    // Only handle the stopwatch (selectedDuration === 0) case here.
    // Countdown stop is handled by the document-level capture listener below.
    if (selectedDuration !== 0) return;
    if (!state.activeSession) return;
    const end = Date.now();
    const elapsedMs = Math.max(0, end - Number(state.activeSession.start));
    if (elapsedMs < STOPWATCH_MIN_DURATION_MS) {
      state.activeSession = null;
      saveData();
      renderTrackerAll();
      showToast('Stopwatch session under 1 minute was not counted.');
      return;
    }
    const durationMin = Math.round(elapsedMs / 60000);
    state.sessions.push({ id: Date.now(), subject: state.activeSession.subject, start: state.activeSession.start, end, duration: durationMin });
    state.activeSession = null;
    saveData();
    renderTrackerAll();
    showToast('Stopwatch session saved!');
  });
}

function setDailyTarget(hours) {
  if (getRoutineGoalMinutes(todayKey())) return;
  const v = parseFloat(hours);
  state.dailyTargetMinutes = isNaN(v) || v < 0 ? 240 : Math.round(v * 60);
  renderProgress();
  saveData();
}
if (targetHoursInput) {
  targetHoursInput.addEventListener('change', () => setDailyTarget(targetHoursInput.value));
  targetHoursInput.addEventListener('input', () => setDailyTarget(targetHoursInput.value));
}
function tickTimer() {
  const now = new Date();
  const refreshKey = `${dateKey(now.getTime())}:${now.getHours()}:${now.getMinutes()}`;
  if (refreshKey !== lastSubjectBarsRefreshKey) renderSubjectBars();

  if (window.isCustomCountdownActive || (window.selectedTimerDuration && window.selectedTimerDuration > 0)) {
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
    return;
  }
  const orb = document.getElementById('clockOrb');
  if (!timerDisplay) return;
  if (!state.activeSession) {
    timerDisplay.textContent = '00:00:00';
    if (timerSub && !timerSub.textContent.trim()) {
      timerSub.innerHTML = 'Select a subject and duration to begin focus session';
    }
    if (orb) orb.classList.remove('active');
    syncMiniTimerWidget();
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
    return;
  }
  if (orb) orb.classList.add('active');
  const secs = Math.floor((Date.now() - state.activeSession.start) / 1000);
  timerDisplay.textContent = fmtClock(secs);
  if (timerSub) {
    timerSub.innerHTML = '<span class="timer-dot"></span> Studying <strong>' + escapeHtml(state.activeSession.subject) + '</strong> in progress';
  }
  syncMiniTimerWidget();
  renderTodaySessions();
  if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
}

function renderTodaySessions() {
  const box = document.getElementById('todaySessions');
  if (!box) return;
  const studyEntries = state.sessions
    .filter(s => dateKey(s.start) === todayKey())
    .map(s => ({ ...s, entryType: 'study' }));
  const breakEntries = getTodayBreakEntries()
    .map(entry => ({ ...entry, entryType: 'break', subject: entry.reason || 'Break' }));
  const liveEntries = [];
  if (state.activeSession) {
    liveEntries.push({
      id: 'active-study',
      start: state.activeSession.start,
      duration: Math.max(0, Math.floor((Date.now() - state.activeSession.start) / 60000)),
      subject: state.activeSession.subject,
      entryType: 'active-study'
    });
  }
  if (window.isCustomCountdownActive && timerMode === 'break') {
    liveEntries.push({
      id: 'active-break',
      start: Date.now() - Math.max(0, (selectedDuration * 60) - customCountdownSecs) * 1000,
      duration: Math.max(0, Math.floor(((selectedDuration * 60) - customCountdownSecs) / 60)),
      subject: document.getElementById('breakReason')?.value || 'Refreshment',
      entryType: 'active-break'
    });
  }
  const list = [...studyEntries, ...breakEntries, ...liveEntries].sort((a, b) => b.start - a.start);
  if (!list.length) { box.innerHTML = ''; return; }
  box.innerHTML = list.map(s => {
    const st = new Date(s.start), en = s.end ? new Date(s.end) : new Date();
    const timeStr = st.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' – ' + en.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const goal = getRoutineGoalMinutes(todayKey()) || state.dailyTargetMinutes || 240;
    const pct = Math.min(100, Math.max(8, Math.round((s.duration / Math.max(1, goal)) * 100)));
    const isBreak = s.entryType === 'break' || s.entryType === 'active-break';
    const isActive = s.entryType === 'active-study' || s.entryType === 'active-break';
    const label = isBreak ? `${escapeHtml(s.subject)} Break` : escapeHtml(s.subject);
    return `<div class="session-item">
      <div class="session-item-header">
        <div class="s-subject">${label}${isActive ? ' <span class="timer-dot"></span>' : ''}</div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="s-badge">${isActive ? 'Live' : fmtHM(s.duration)}</span>
          ${!isActive && !isBreak ? `<button class="s-del-btn" title="Delete session" data-delsession="${s.id}">${ICON.x}</button>` : ''}
        </div>
      </div>
      <div class="s-progress">
        <div class="s-progress-track">
          <div class="s-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="s-meta">${timeStr}</div>
    </div>`;
  }).join('');
}

const todaySessionsBox = document.getElementById('todaySessions');
if (todaySessionsBox) {
  todaySessionsBox.addEventListener('click', (e) => {
    const del = e.target.closest('[data-delsession]');
    if (del) {
      const id = del.dataset.delsession;
      state.sessions = state.sessions.filter(s => String(s.id) !== id);
      saveData();
      renderTrackerAll();
      showToast('Session deleted');
    }
  });
}

function renderProgress() {
  const todayTotal = state.sessions.filter(s => dateKey(s.start) === todayKey()).reduce((a, s) => a + s.duration, 0);
  const routineGoal = getRoutineGoalMinutes(todayKey());
  const target = routineGoal || state.dailyTargetMinutes || 240;
  const pct = Math.min(100, Math.round((todayTotal / target) * 100));

  const progressFill = document.getElementById('progressFill');
  const progressLabelLeft = document.getElementById('progressLabelLeft');
  const progressLabelRight = document.getElementById('progressLabelRight');
  const goalLabel = document.getElementById('trackerGoalLabel');
  const streakLine = document.getElementById('streakLine');
  const verdict = document.getElementById('verdictBox');

  if (progressFill) progressFill.style.width = pct + '%';
  if (progressLabelLeft) progressLabelLeft.textContent = fmtHM(todayTotal) + ' studied';
  if (progressLabelRight) progressLabelRight.textContent = pct + '%';
  if (goalLabel) goalLabel.textContent = routineGoal ? "Today's Routine Goal" : 'Daily Goal';
  if (targetHoursInput) {
    targetHoursInput.value = (target / 60).toString();
    targetHoursInput.readOnly = !!routineGoal;
    targetHoursInput.title = routineGoal ? 'Automatically set from today’s timed routine blocks' : 'Set a daily goal when no timed routine is scheduled';
  }
  if (verdict) {
    if (todayTotal === 0) {
      verdict.textContent = 'No study logged yet today — start your first session, you can do it!';
    } else if (pct >= 100) {
      verdict.textContent = routineGoal ? 'Today’s routine goal completed! Outstanding effort.' : 'Daily target completed! Outstanding effort today.';
    } else if (pct >= 75) {
      verdict.textContent = 'Almost there — just a little more focus to reach your goal.';
    } else if (pct >= 40) {
      verdict.textContent = 'Good start, keep up the momentum with another session.';
    } else {
      verdict.textContent = 'Study time is low today — jump into another focused session now.';
    }
  }

  let streak = 0;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateKey(d.getTime());
    const total = state.sessions.filter(s => dateKey(s.start) === key).reduce((a, s) => a + s.duration, 0);
    const dayGoal = getRoutineGoalMinutes(key) || state.dailyTargetMinutes || 240;
    if (total >= dayGoal) streak++; else break;
  }
  if (pct >= 100) streak++;
  if (streakLine) {
    streakLine.textContent = streak > 0
      ? 'Target Streak: ' + streak + (streak === 1 ? ' day' : ' days')
      : 'Start your study streak today!';
  }
}

function getRoutineGoalMinutes(date = todayKey()) {
  if (!Array.isArray(state.routine)) return 0;
  return state.routine.reduce((total, item) => {
    if (!item || item.date !== date) return total;
    const start = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(item.startTime || ''));
    const end = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(item.endTime || ''));
    if (!start || !end) return total;
    const startMinute = Number(start[1]) * 60 + Number(start[2]);
    const endMinute = Number(end[1]) * 60 + Number(end[2]);
    return total + (endMinute > startMinute ? endMinute - startMinute : 0);
  }, 0);
}


let lastSubjectBarsRefreshKey = '';

function renderSubjectBars() {
  const box = document.getElementById('subjectBars');
  if (!box) return;
  const now = new Date();
  lastSubjectBarsRefreshKey = `${dateKey(now.getTime())}:${now.getHours()}:${now.getMinutes()}`;
  const plan = typeof window.getTodayStudyPlanProgress === 'function'
    ? window.getTodayStudyPlanProgress()
    : [];
  if (plan.length) {
    const subjects = new Map();
    plan.forEach(block => {
      const subject = typeof canonicalSubjectName === 'function'
        ? canonicalSubjectName(block.subject || 'Study block')
        : (block.subject || 'Study block');
      const key = subject.trim().toLowerCase();
      const entry = subjects.get(key) || {
        subject,
        plannedMinutes: 0,
        trackedMinutes: 0,
        blocks: []
      };
      entry.plannedMinutes += block.duration;
      entry.trackedMinutes += block.trackedMinutes;
      entry.blocks.push(block);
      subjects.set(key, entry);
    });

    const plannedSubjects = new Set(subjects.keys());
    const unplannedSubjects = new Map();
    (Array.isArray(state.sessions) ? state.sessions : [])
      .filter(session => session && dateKey(session.start) === todayKey())
      .forEach(session => {
        const subject = typeof canonicalSubjectName === 'function'
          ? canonicalSubjectName(session.subject || 'General')
          : (session.subject || 'General');
        const key = subject.trim().toLowerCase();
        if (plannedSubjects.has(key)) return;
        unplannedSubjects.set(key, {
          subject,
          trackedMinutes: (unplannedSubjects.get(key)?.trackedMinutes || 0) + Math.max(0, Number(session.duration) || 0)
        });
      });
    const activeStudy = typeof window.getActiveTrackerStudySession === 'function'
      ? window.getActiveTrackerStudySession()
      : null;
    if (activeStudy && Number.isFinite(Number(activeStudy.start))) {
      const subject = typeof canonicalSubjectName === 'function'
        ? canonicalSubjectName(activeStudy.subject || 'General')
        : (activeStudy.subject || 'General');
      const key = subject.trim().toLowerCase();
      if (!plannedSubjects.has(key)) {
        const elapsedMinutes = Math.max(0, (now.getTime() - Number(activeStudy.start)) / 60000);
        unplannedSubjects.set(key, {
          subject,
          trackedMinutes: (unplannedSubjects.get(key)?.trackedMinutes || 0) + elapsedMinutes
        });
      }
    }

    const entries = [...subjects.values()].map(entry => {
      const completeCount = entry.blocks.filter(block => block.status === 'complete').length;
      const hasIncompleteBlock = entry.blocks.some(block => block.status === 'not-complete');
      const hasActiveBlock = entry.blocks.some(block => block.status === 'in-progress');
      const hasUpcomingBlock = entry.blocks.some(block => block.status === 'upcoming');
      let status = 'time-not-set';
      if (hasIncompleteBlock) status = 'not-complete';
      else if (hasActiveBlock) status = 'in-progress';
      else if (hasUpcomingBlock) status = 'upcoming';
      else if (entry.blocks.every(block => block.status === 'complete')) status = 'complete';
      return { ...entry, completeCount, status };
    });
    const chartEntries = [
      ...entries,
      ...[...unplannedSubjects.values()].map(entry => ({ ...entry, status: 'unplanned' }))
    ].sort((a, b) => b.trackedMinutes - a.trackedMinutes || a.subject.localeCompare(b.subject));

    const max = Math.max(...chartEntries.map(entry => entry.plannedMinutes || entry.trackedMinutes), 1);
    const statusLabels = {
      complete: 'Complete',
      'not-complete': 'Not complete',
      'in-progress': 'In progress',
      upcoming: 'Upcoming',
      'time-not-set': 'Time not set',
      unplanned: 'No plan'
    };
    box.innerHTML = chartEntries.map(entry => {
      const progress = entry.plannedMinutes
        ? Math.min(100, Math.round((entry.trackedMinutes / entry.plannedMinutes) * 100))
        : 0;
      const details = entry.blocks?.length
        ? `${entry.completeCount}/${entry.blocks.length} blocks complete · ${fmtHM(Math.round(entry.trackedMinutes))} / ${fmtHM(entry.plannedMinutes)}`
        : `${fmtHM(Math.round(entry.trackedMinutes))} tracked · no planned block`;
      const plannedWidth = Math.round(((entry.plannedMinutes || entry.trackedMinutes) / max) * 100);
      const trackedWidth = Math.round((entry.trackedMinutes / max) * 100);
      return `
        <div class="subj-bar-row subj-plan-row">
          <div class="subj-bar-label">
            <span>${escapeHtml(entry.subject)}</span>
            <span class="subj-plan-status subj-plan-status--${entry.status}">${statusLabels[entry.status]}</span>
          </div>
          <div class="subj-bar-track" role="progressbar" aria-label="${escapeAttr(entry.subject)} study plan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
            <span class="subj-plan-track" style="width:${plannedWidth}%"></span>
            <span class="subj-plan-fill" style="width:${trackedWidth}%"></span>
          </div>
          <div class="subj-plan-details">${details}</div>
        </div>
      `;
    }).join('');
    return;
  }

  const today = state.sessions.filter(s => dateKey(s.start) === todayKey());
  const byTotal = {};
  today.forEach(s => { byTotal[s.subject] = (byTotal[s.subject] || 0) + s.duration; });
  const activeStudy = typeof window.getActiveTrackerStudySession === 'function'
    ? window.getActiveTrackerStudySession()
    : null;
  if (activeStudy?.subject) {
    const elapsedMinutes = Math.max(0, (Date.now() - Number(activeStudy.start)) / 60000);
    byTotal[activeStudy.subject] = (byTotal[activeStudy.subject] || 0) + elapsedMinutes;
  }
  const entries = Object.entries(byTotal).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { box.innerHTML = '<div class="empty-state">No study sessions logged today yet.</div>'; return; }
  const max = Math.max(...entries.map(e => e[1]));
  box.innerHTML = entries.map(([subj, min]) => `
    <div class="subj-bar-row">
      <div class="subj-bar-label"><span>${escapeHtml(subj)}</span><span>${fmtHM(min)}</span></div>
      <div class="subj-bar-track"><div class="subj-bar-fill" style="width:${Math.round((min / max) * 100)}%"></div></div>
    </div>
  `).join('');
}

window.renderTrackerSubjectBars = renderSubjectBars;

// ===== Customizable review period =====
let reviewPeriod = 'week';
let reviewCustomStart = null, reviewCustomEnd = null;

function getReviewRange() {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  let start;
  if (reviewPeriod === 'week') {
    start = new Date(today); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    return { start, end: today, granularity: 'day' };
  }
  if (reviewPeriod === 'month') {
    start = new Date(today); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
    return { start, end: today, granularity: 'week' };
  }
  if (reviewPeriod === 'year') {
    start = new Date(today); start.setMonth(start.getMonth() - 11); start.setDate(1); start.setHours(0, 0, 0, 0);
    return { start, end: today, granularity: 'month' };
  }
  const s = reviewCustomStart ? new Date(reviewCustomStart + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1);
  const e = reviewCustomEnd ? new Date(reviewCustomEnd + 'T23:59:59') : today;
  const days = Math.round((e - s) / 86400000) + 1;
  const granularity = days <= 31 ? 'day' : (days <= 120 ? 'week' : 'month');
  return { start: s, end: e, granularity };
}

function buildReviewBuckets() {
  const { start, end, granularity } = getReviewRange();
  const buckets = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (granularity === 'day') {
    let cur = new Date(start);
    while (cur <= end) {
      const key = dateKey(cur.getTime());
      const total = state.sessions.filter(s => dateKey(s.start) === key).reduce((a, s) => a + s.duration, 0);
      buckets.push({ label: dayLabels[cur.getDay()], total, isToday: dateKey(Date.now()) === key });
      cur.setDate(cur.getDate() + 1);
    }
  } else if (granularity === 'week') {
    let cur = new Date(start); let wk = 1;
    while (cur <= end) {
      const wkStart = new Date(cur);
      const wkEnd = new Date(cur); wkEnd.setDate(wkEnd.getDate() + 6); wkEnd.setHours(23, 59, 59, 999);
      const cappedEnd = wkEnd < end ? wkEnd : end;
      const total = state.sessions.filter(s => { const d = new Date(s.start); return d >= wkStart && d <= cappedEnd; }).reduce((a, s) => a + s.duration, 0);
      buckets.push({ label: 'Wk ' + wk, total, isToday: false });
      cur.setDate(cur.getDate() + 7); wk++;
    }
  } else {
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59);
      const total = state.sessions.filter(s => { const d = new Date(s.start); return d >= mStart && d <= mEnd; }).reduce((a, s) => a + s.duration, 0);
      const now = new Date();
      buckets.push({ label: monthLabels[cur.getMonth()], total, isToday: cur.getFullYear() === now.getFullYear() && cur.getMonth() === now.getMonth() });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return buckets;
}

function renderWeekChart() {
  const box = document.getElementById('weekChart');
  const target = getRoutineGoalMinutes(todayKey()) || state.dailyTargetMinutes || 1;
  const buckets = buildReviewBuckets();
  let maxVal = Math.max(1, target, ...buckets.map(b => b.total));
  box.innerHTML = buckets.map(b => {
    const h = Math.max(4, Math.round((b.total / maxVal) * 100));
    return `<div class="review-bar-col">
      <div class="review-bar ${b.total >= target && b.total > 0 ? 'met' : ''}" style="height:${h}%" title="${fmtHM(b.total)}"></div>
      <div class="review-bar-label">${b.label}${b.isToday ? ' •' : ''}</div>
    </div>`;
  }).join('');

  const { start, end } = getReviewRange();
  const fmt = (d) => d.getDate() + '/' + (d.getMonth() + 1);
  document.getElementById('reviewRangeLabel').textContent = fmt(start) + ' – ' + fmt(end);
}

document.getElementById('reviewPeriodSwitch').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  document.querySelectorAll('#reviewPeriodSwitch .chip').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  reviewPeriod = e.target.dataset.period;
  document.getElementById('reviewCustomRange').style.display = reviewPeriod === 'custom' ? 'flex' : 'none';
  renderWeekChart();
});
document.getElementById('reviewCustomApplyBtn').addEventListener('click', () => {
  reviewCustomStart = document.getElementById('reviewCustomStart').value || null;
  reviewCustomEnd = document.getElementById('reviewCustomEnd').value || null;
  renderWeekChart();
});

// ===== GitHub-style Study Activity Heatmap =====
function renderStudyHeatmap() {
  const grid = document.getElementById('studyHeatmapGrid');
  if (!grid) return;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dailyMinutes = {};
  const dailySessionsCount = {};

  if (Array.isArray(state.sessions)) {
    state.sessions.forEach(s => {
      if (!s.start) return;
      const dk = dateKey(s.start);
      const mins = s.duration || 0;
      dailyMinutes[dk] = (dailyMinutes[dk] || 0) + mins;
      dailySessionsCount[dk] = (dailySessionsCount[dk] || 0) + 1;
    });
  }

  if (state.activeSession && state.activeSession.start) {
    const todayDk = dateKey(Date.now());
    const elapsedMs = Date.now() - Number(state.activeSession.start);
    if (elapsedMs >= STOPWATCH_MIN_DURATION_MS) {
      const liveMins = Math.floor(elapsedMs / 60000);
      dailyMinutes[todayDk] = (dailyMinutes[todayDk] || 0) + liveMins;
      dailySessionsCount[todayDk] = (dailySessionsCount[todayDk] || 0) + 1;
    }
  }

  const allMins = Object.values(dailyMinutes).reduce((a, b) => a + b, 0);
  const totalHoursStr = (allMins / 60).toFixed(1) + 'h';
  const activeDaysCount = Object.keys(dailyMinutes).filter(k => dailyMinutes[k] > 0).length;

  let streak = 0;
  let checkDate = new Date();
  const todayKeyStr = dateKey(checkDate.getTime());
  if (dailyMinutes[todayKeyStr] > 0) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (dailyMinutes[dateKey(checkDate.getTime())] > 0) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const streakEl = document.getElementById('heatmapStreakDays');
  const totalEl = document.getElementById('heatmapTotalHours');
  const activeEl = document.getElementById('heatmapActiveDays');
  if (streakEl) streakEl.textContent = streak;
  if (totalEl) totalEl.textContent = totalHoursStr;
  if (activeEl) activeEl.textContent = activeDaysCount;

  const currentDayOfWeek = today.getDay();
  const numWeeks = 18;
  const totalDays = numWeeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + (6 - currentDayOfWeek) + 1);
  startDate.setHours(0, 0, 0, 0);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let html = '';
  let cur = new Date(startDate);

  for (let w = 0; w < numWeeks; w++) {
    let colHtml = '<div class="heatmap-col">';
    const colMonth = cur.getDate() <= 7 ? monthNames[cur.getMonth()] : '';
    colHtml += `<div class="heatmap-col-header">${colMonth}</div>`;

    for (let d = 0; d < 7; d++) {
      const dk = dateKey(cur.getTime());
      const isFuture = cur.getTime() > today.getTime();
      const mins = dailyMinutes[dk] || 0;
      const count = dailySessionsCount[dk] || 0;

      let lvl = 0;
      if (mins > 0 && mins < 60) lvl = 1;
      else if (mins >= 60 && mins < 120) lvl = 2;
      else if (mins >= 120 && mins < 240) lvl = 3;
      else if (mins >= 240) lvl = 4;

      const dateFormatted = cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      const title = isFuture ? '' : `${dateFormatted}: ${mins > 0 ? `${timeStr} studied (${count} session${count > 1 ? 's' : ''})` : 'No study recorded'}`;

      if (isFuture) {
        colHtml += `<div class="heatmap-cell" style="opacity:0.06; pointer-events:none;"></div>`;
      } else {
        colHtml += `<div class="heatmap-cell lvl-${lvl}" data-date="${dk}" title="${title}"></div>`;
      }

      cur.setDate(cur.getDate() + 1);
    }
    colHtml += '</div>';
    html += colHtml;
  }

  grid.innerHTML = html;
}

function renderTrackerAll() {
  renderSubjectSelect();
  renderSubjectManager();
  tickTimer();
  refreshTimerSub();
  const isRunning = !!state.activeSession || !!window.isCustomCountdownActive;
  startBtn.style.display = isRunning ? 'none' : 'inline-flex';
  stopBtn.style.display = isRunning ? 'inline-flex' : 'none';
  renderTodaySessions();
  renderProgress();
  renderSubjectBars();
  renderWeekChart();
  renderTrackerRoutinePreview();
  update24hActivityUI();
  renderStudyHeatmap();
  syncMiniTimerWidget();
  if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  if (document.getElementById('panel-home')?.classList.contains('active') && typeof window.renderDashboard === 'function') {
    window.renderDashboard();
  }
}


// ==========================================
// UNIFIED TIMER & 24H BREAK TRACKER
// ==========================================
let selectedDuration = 0;
let timerMode = 'study';
let customCountdownInterval = null;
let customCountdownSecs = 0;
let customCountdownSubject = '';
const STOPWATCH_MIN_DURATION_MS = 60000;
window.selectedTimerDuration = 0;
window.isCustomCountdownActive = false;
window.getActiveTrackerStudySession = function () {
  const now = Date.now();
  if (timerMode === 'break') return null;
  if (state.activeSession) {
    if (now - Number(state.activeSession.start) < STOPWATCH_MIN_DURATION_MS) return null;
    return { subject: state.activeSession.subject, start: Number(state.activeSession.start), end: now };
  }
  if (!window.isCustomCountdownActive || selectedDuration <= 0) return null;
  const elapsedMs = Math.max(0, (selectedDuration * 60 - customCountdownSecs) * 1000);
  return { subject: customCountdownSubject || currentSubjectValue(), start: now - elapsedMs, end: now };
};


function getTodayBreakMinutes() {
  try {
    const raw = localStorage.getItem(BREAK_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return (parsed && parsed.date === todayKey()) ? (parsed.minutes || 0) : 0;
  } catch (e) { return 0; }
}

function addTodayBreakMinutes(mins) {
  try {
    const current = getTodayBreakMinutes();
    const updated = current + mins;
    localStorage.setItem(BREAK_STORAGE_KEY, JSON.stringify({ date: todayKey(), minutes: updated }));
    update24hActivityUI();
  } catch (e) { }
}

function addBreakEntry(minutes, reason, startTime = Date.now()) {
  if (!minutes) return;
  try {
    const raw = localStorage.getItem(BREAK_ENTRIES_KEY);
    const entries = raw ? JSON.parse(raw) : [];
    entries.push({
      id: Date.now(),
      start: startTime,
      end: Date.now(),
      duration: minutes,
      reason: reason || 'Refreshment'
    });
    localStorage.setItem(BREAK_ENTRIES_KEY, JSON.stringify(entries.slice(-100)));
  } catch (e) { }
}

function getTodayBreakEntries() {
  try {
    const raw = localStorage.getItem(BREAK_ENTRIES_KEY);
    const entries = raw ? JSON.parse(raw) : [];
    return Array.isArray(entries) ? entries.filter(entry => dateKey(entry.start) === todayKey()) : [];
  } catch (e) { return []; }
}

function update24hActivityUI() {
  const studyVal = document.getElementById('actStudyVal');
  const breakVal = document.getElementById('actBreakVal');
  const ratioVal = document.getElementById('actRatioVal');
  if (!studyVal || !breakVal || !ratioVal) return;

  let studyMinutes = 0;
  const today = todayKey();
  if (Array.isArray(state.sessions)) {
    state.sessions.forEach(s => {
      if (dateKey(s.start || s.date) === today) {
        studyMinutes += (s.duration || s.durationMinutes || 0);
      }
    });
  }

  const breakMinutes = getTodayBreakMinutes();
  const totalActivityMinutes = studyMinutes + breakMinutes;
  const totalDayMinutes = 24 * 60;
  const pct = Math.min(100, Math.round((totalActivityMinutes / totalDayMinutes) * 100));

  const sH = Math.floor(studyMinutes / 60);
  const sM = studyMinutes % 60;
  studyVal.textContent = `${sH}h ${sM}m`;
  breakVal.textContent = `${breakMinutes}m`;

  const totH = (totalActivityMinutes / 60).toFixed(1);
  ratioVal.textContent = `${pct}% (${totH}h / 24h)`;
}

const durationSelector = document.getElementById('timerDurationSelector');
const timerModeSelector = document.getElementById('timerModeSelector');
const studySubjectRow = document.getElementById('studySubjectRow');
const breakReasonRow = document.getElementById('breakReasonRow');

function syncTimerModeFields() {
  const hasMode = timerMode === 'study' || timerMode === 'break';
  window.trackerTimerMode = timerMode;
  if (studySubjectRow) studySubjectRow.hidden = timerMode !== 'study';
  const quickSubjectContainer = document.getElementById('quickSubjectContainer');
  if (quickSubjectContainer) quickSubjectContainer.hidden = timerMode !== 'study';
  if (breakReasonRow) breakReasonRow.hidden = timerMode !== 'break';
  if (durationSelector) durationSelector.hidden = !hasMode;
  const studyOpts = document.getElementById('studyDurationOptions');
  const breakOpts = document.getElementById('breakDurationOptions');
  if (studyOpts) studyOpts.hidden = timerMode !== 'study';
  if (breakOpts) breakOpts.hidden = timerMode !== 'break';
  if (startBtn) {
    startBtn.textContent = timerMode === 'break' ? 'Start Break' : 'Start Studying';
    startBtn.disabled = !hasMode;
  }
  if (stopBtn) stopBtn.textContent = timerMode === 'break' ? 'Finish Break' : 'Finish Session';
  if (!hasMode) {
    const sub = document.getElementById('timerSub');
    if (sub) sub.textContent = 'Choose Study or Break to begin';
  } else {
    refreshTimerSub();
  }
  if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
}

syncTimerModeFields();
if (timerModeSelector) {
  timerModeSelector.querySelectorAll('.timer-mode-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.mode === timerMode);
  });
  timerModeSelector.addEventListener('click', (e) => {
    const modeChip = e.target.closest('.timer-mode-chip');
    if (!modeChip || state.activeSession || window.isCustomCountdownActive) return;
    timerMode = modeChip.dataset.mode === 'break' ? 'break' : 'study';
    try { localStorage.setItem('careerdesk_subnav_tracker', timerMode); } catch (err) { }
    timerModeSelector.querySelectorAll('.timer-mode-chip').forEach(chip => chip.classList.toggle('active', chip === modeChip));
    syncTimerModeFields();
    const studyOptEl = document.getElementById('studyDurationOptions');
    const breakOptEl = document.getElementById('breakDurationOptions');
    if (studyOptEl) studyOptEl.hidden = timerMode !== 'study';
    if (breakOptEl) breakOptEl.hidden = timerMode !== 'break';
    const firstDuration = document.querySelector(`#${timerMode === 'break' ? 'breakDurationOptions' : 'studyDurationOptions'} .timer-dur-chip`);
    if (firstDuration) firstDuration.click();
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  });

  // Restore saved tracker sub-nav
  try {
    const savedTrackerMode = localStorage.getItem('careerdesk_subnav_tracker');
    if (savedTrackerMode && (savedTrackerMode === 'study' || savedTrackerMode === 'break') && !state.activeSession) {
      const targetModeChip = timerModeSelector.querySelector(`[data-mode="${savedTrackerMode}"]`);
      if (targetModeChip) targetModeChip.click();
    }
  } catch (err) { }
}

if (durationSelector) {
  durationSelector.addEventListener('click', (e) => {
    const chip = e.target.closest('.timer-dur-chip');
    if (!chip) return;

    if (!timerMode) return;

    if (state.activeSession || window.isCustomCountdownActive) {
      showToast('Cannot change duration while a session is active. Finish current session first.', true);
      return;
    }

    durationSelector.querySelectorAll('.timer-dur-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    selectedDuration = parseInt(chip.dataset.duration, 10) || 0;
    window.selectedTimerDuration = selectedDuration;

    const display = document.getElementById('timerDisplay');
    const sub = document.getElementById('timerSub');
    const subject = currentSubjectValue() || 'General';
    const reason = document.getElementById('breakReason')?.value || 'Refreshment';

    if (timerMode === 'break') {
      customCountdownSecs = selectedDuration * 60;
      if (display) display.textContent = `${String(selectedDuration).padStart(2, '0')}:00`;
      if (sub) sub.innerHTML = `<strong>${selectedDuration}-minute ${escapeHtml(reason.toLowerCase())}</strong> break — recharge before your next focus block`;
    } else if (selectedDuration === 0) {
      if (display) display.textContent = '00:00:00';
      if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — Stopwatch mode active`;
    } else {
      customCountdownSecs = selectedDuration * 60;
      const mStr = String(selectedDuration).padStart(2, '0');
      if (display) display.textContent = `${mStr}:00`;
      if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — ${selectedDuration} min focus session`;
    }
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  });
}

const cancelModal = document.getElementById('cancelSessionModal');
const resumeBtn = document.getElementById('resumeSessionBtn');
const confirmCancelBtn = document.getElementById('confirmCancelSessionBtn');

function openCancelModal(remSeconds) {
  if (!cancelModal) return;
  const m = Math.floor(remSeconds / 60);
  const s = remSeconds % 60;
  const textEl = document.getElementById('cancelModalBodyText');
  const subject = currentSubjectValue() || 'General';

  if (textEl && timerMode === 'break') {
    textEl.innerHTML = `Your <strong>${selectedDuration}-minute break</strong> has <strong>${m}m ${s}s</strong> remaining.<br><br>Ending it now will still count the elapsed break time.`;
  } else if (textEl) {
    textEl.innerHTML = `Your <strong>${escapeHtml(subject)}</strong> focus session of <strong>${selectedDuration} minutes</strong> has <strong>${m}m ${s}s</strong> remaining!<br><br>If you exit now, this session will not count toward your daily study target.`;
  }
  cancelModal.classList.add('open');
}

function closeCancelModal() {
  if (cancelModal) cancelModal.classList.remove('open');
}

if (resumeBtn) resumeBtn.addEventListener('click', closeCancelModal);
const closeCancelModalBtn = document.getElementById('closeCancelModalBtn');
if (closeCancelModalBtn) closeCancelModalBtn.addEventListener('click', closeCancelModal);
if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener('click', () => {
    closeCancelModal();
    stopCustomCountdown(false);
  });
}

function startCustomCountdown() {
  if (timerMode !== 'break') {
    const subj = currentSubjectValue();
    if (!subj) {
      if (sessionCustomInput) {
        sessionCustomInput.style.display = 'block';
        sessionCustomInput.focus();
      }
      showToast('Please enter or select a study subject', true);
      return;
    }
    customCountdownSubject = subj;
    if (typeof addSubject === 'function') addSubject(subj);
  } else {
    customCountdownSubject = '';
  }
  window.isCustomCountdownActive = true;
  const display = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const orb = document.getElementById('clockOrb');
  const sub = document.getElementById('timerSub');

  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  if (orb) orb.classList.add('active');

  if (sub) {
    if (timerMode === 'break') {
      const reason = document.getElementById('breakReason')?.value || 'Refreshment';
      sub.innerHTML = `<span class="timer-dot"></span> Taking a <strong>${escapeHtml(reason.toLowerCase())}</strong> break (${selectedDuration}m)`;
    } else {
      const subj = currentSubjectValue() || 'General';
      sub.innerHTML = `<span class="timer-dot"></span> Focusing on <strong>${escapeHtml(subj)}</strong> (${selectedDuration}m)`;
    }
  }

  customCountdownInterval = setInterval(() => {
    if (customCountdownSecs > 0) {
      customCountdownSecs--;
      const m = String(Math.floor(customCountdownSecs / 60)).padStart(2, '0');
      const s = String(customCountdownSecs % 60).padStart(2, '0');
      if (display) display.textContent = `${m}:${s}`;
      renderTodaySessions();
      renderProgress();
      syncMiniTimerWidget();
      if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
    } else {
      clearInterval(customCountdownInterval);
      stopCustomCountdown(true);
    }
  }, 1000);

  syncMiniTimerWidget();
  if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  renderSubjectBars();
}

function stopCustomCountdown(isCompleted = false) {
  clearInterval(customCountdownInterval);
  window.isCustomCountdownActive = false;

  const display = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const orb = document.getElementById('clockOrb');

  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
  if (orb) orb.classList.remove('active');
  syncMiniTimerWidget();

  const subject = customCountdownSubject || currentSubjectValue() || 'General';
  const reason = document.getElementById('breakReason')?.value || 'Refreshment';

  if (timerMode === 'break') {
    const elapsedBreakSeconds = Math.max(0, (selectedDuration * 60) - customCountdownSecs);
    const elapsedBreakMinutes = elapsedBreakSeconds > 0 ? Math.max(1, Math.round(elapsedBreakSeconds / 60)) : 0;
    if (isCompleted) {
      addTodayBreakMinutes(selectedDuration);
      addBreakEntry(selectedDuration, reason, Date.now() - (selectedDuration * 60000));
      showToast(`${selectedDuration}-minute ${reason.toLowerCase()} break completed and added to break time!`);
    } else {
      if (elapsedBreakMinutes > 0) {
        addTodayBreakMinutes(elapsedBreakMinutes);
        addBreakEntry(elapsedBreakMinutes, reason, Date.now() - elapsedBreakSeconds * 1000);
        showToast(`${elapsedBreakMinutes}m of ${reason.toLowerCase()} break counted.`);
      } else {
        showToast('Break ended before any time was recorded');
      }
    }
    customCountdownSecs = selectedDuration * 60;
    if (display) display.textContent = `${String(selectedDuration).padStart(2, '0')}:00`;
  } else {
    if (isCompleted) {
      state.sessions.push({
        id: Date.now(),
        start: Date.now() - (selectedDuration * 60000),
        end: Date.now(),
        subject: subject,
        duration: selectedDuration
      });
      saveData();
      renderTrackerAll();
      showToast(`${selectedDuration}m ${subject} study session completed and added to daily goal!`);
    } else {
      showToast('Session cancelled — not counted towards daily goal', true);
    }
    customCountdownSecs = selectedDuration * 60;
    const mStr = String(selectedDuration).padStart(2, '0');
    if (display) display.textContent = `${mStr}:00`;
  }

  update24hActivityUI();
  renderTodaySessions();
  refreshTimerSub();
  customCountdownSubject = '';
  if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  renderSubjectBars();
}

document.addEventListener('click', (e) => {
  if (selectedDuration === 0) return;

  const startBtnClicked = e.target && (e.target.id === 'startBtn' || (e.target.closest && e.target.closest('#startBtn')));
  const stopBtnClicked = e.target && (e.target.id === 'stopBtn' || (e.target.closest && e.target.closest('#stopBtn')));

  if (startBtnClicked) {
    e.stopImmediatePropagation();
    startCustomCountdown();
  } else if (stopBtnClicked) {
    e.stopImmediatePropagation();
    // Both study and break sessions show a cancel confirmation modal when time remains.
    // The modal already has mode-specific text via openCancelModal().
    if (customCountdownSecs > 0) {
      openCancelModal(customCountdownSecs);
    } else {
      stopCustomCountdown(false);
    }
  }
}, true);


// ===== Mini Floating Header Timer Widget =====
function syncMiniTimerWidget() {
  const widget = document.getElementById('headerMiniTimer');
  if (!widget) return;
  const timeEl = document.getElementById('miniTimerTime');
  const subjEl = document.getElementById('miniTimerSubject');

  if (window.isCustomCountdownActive && typeof customCountdownSecs === 'number') {
    widget.style.display = 'inline-flex';
    const m = String(Math.floor(customCountdownSecs / 60)).padStart(2, '0');
    const s = String(customCountdownSecs % 60).padStart(2, '0');
    if (timeEl) timeEl.textContent = `${m}:${s}`;
    if (subjEl) {
      subjEl.textContent = timerMode === 'break' ? 'Break' : (typeof currentSubjectValue === 'function' ? (currentSubjectValue() || 'Focus') : 'Focus');
    }
  } else if (state && state.activeSession && state.activeSession.start) {
    widget.style.display = 'inline-flex';
    const secs = Math.floor((Date.now() - state.activeSession.start) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (timeEl) {
      timeEl.textContent = m >= 60
        ? `${Math.floor(m / 60)}h ${m % 60}m`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    if (subjEl) subjEl.textContent = state.activeSession.subject || 'Focus';
  } else {
    widget.style.display = 'none';
  }
}

const headerMiniTimerEl = document.getElementById('headerMiniTimer');
if (headerMiniTimerEl) {
  headerMiniTimerEl.addEventListener('click', (e) => {
    if (e.target.closest('#miniTimerStopBtn')) {
      e.stopPropagation();
      if (window.isCustomCountdownActive && typeof stopCustomCountdown === 'function') {
        stopCustomCountdown(false);
      } else if (state && state.activeSession) {
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) stopBtn.click();
      }
      syncMiniTimerWidget();
      return;
    }
    activateTab('tracker', true);
  });
}
