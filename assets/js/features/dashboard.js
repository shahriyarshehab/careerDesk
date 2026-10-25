/* ==========================================================================
   CareerDesk — Dashboard Overview JS Engine (Figma Prototype node-id=3-2)
   Populates Hero, 4 KPI progress cards, Today's Study Plan, and Focus Timer
   ========================================================================== */

(function () {
  'use strict';

  const PLAN_COMPLETION_RATIO = 0.9;

  /* ── State & Variables ─────────────────────────────────────────────────── */
  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function pad(n) { return String(n).padStart(2, '0'); }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function formatMins(mins) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function minutesFromTimeStr(str) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(str || ''));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function subjectKey(value) {
    const subject = String(value || '').trim();
    return typeof canonicalSubjectName === 'function' ? canonicalSubjectName(subject).toLowerCase() : subject.toLowerCase();
  }

  function routineForDate(date) {
    return (Array.isArray(state.routine) ? state.routine : [])
      .filter(item => item && item.date === date);
  }

  function plannedMinutesFor(routine) {
    return routine.reduce((total, item) => {
      const start = minutesFromTimeStr(item.startTime);
      const end = minutesFromTimeStr(item.endTime);
      return total + (start !== null && end !== null && end > start ? end - start : 0);
    }, 0);
  }

  function trackedMinutesFor(item, startMinute, endMinute, sessions, now) {
    if (startMinute === null || endMinute === null || endMinute <= startMinute) return 0;
    const blockStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, startMinute).getTime();
    const blockEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, endMinute).getTime();
    const key = subjectKey(item.subject);
    const intervals = sessions.reduce((matches, session) => {
      if (subjectKey(session.subject) !== key) return matches;
      const sessionStart = Number(session.start);
      const sessionEnd = Number(session.end) || sessionStart + Math.max(0, Number(session.duration) || 0) * 60000;
      if (!Number.isFinite(sessionStart) || !Number.isFinite(sessionEnd) || sessionEnd <= sessionStart) return matches;
      const start = Math.max(sessionStart, blockStart);
      const end = Math.min(sessionEnd, blockEnd);
      if (end > start) matches.push({ start, end });
      return matches;
    }, []);

    const active = typeof window.getActiveTrackerStudySession === 'function'
      ? window.getActiveTrackerStudySession()
      : state.activeSession;
    if (active && subjectKey(active.subject) === key) {
      const sessionStart = Number(active.start);
      const sessionEnd = Number(active.end) || now.getTime();
      const start = Math.max(sessionStart, blockStart);
      const end = Math.min(sessionEnd, blockEnd);
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push({ start, end });
    }

    intervals.sort((a, b) => a.start - b.start);
    let tracked = 0;
    let current = null;
    intervals.forEach(interval => {
      if (!current || interval.start > current.end) {
        if (current) tracked += current.end - current.start;
        current = { ...interval };
      } else {
        current.end = Math.max(current.end, interval.end);
      }
    });
    if (current) tracked += current.end - current.start;
    return Math.min(endMinute - startMinute, tracked / 60000);
  }

  function getTodayStudyPlanProgress(now = new Date()) {
    const today = todayKey();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];

    return routineForDate(today).map(item => {
      const startMinute = minutesFromTimeStr(item.startTime);
      const endMinute = minutesFromTimeStr(item.endTime);
      const duration = startMinute !== null && endMinute !== null && endMinute > startMinute
        ? endMinute - startMinute
        : 0;
      const trackedMinutes = trackedMinutesFor(item, startMinute, endMinute, sessions, now);
      let status = 'upcoming';

      if (!duration) {
        status = 'time-not-set';
      } else if (nowMinutes >= endMinute) {
        status = trackedMinutes / duration >= PLAN_COMPLETION_RATIO ? 'complete' : 'not-complete';
      } else if (nowMinutes >= startMinute) {
        status = 'in-progress';
      }

      return {
        ...item,
        duration,
        trackedMinutes,
        progress: duration ? Math.min(100, Math.round((trackedMinutes / duration) * 100)) : 0,
        status
      };
    });
  }

  window.getTodayStudyPlanProgress = getTodayStudyPlanProgress;

  /* ── 2. Render Metrics & KPI Cards ─────────────────────────────────────── */
  function renderMetrics() {
    if (typeof state === 'undefined') return;
    const today = todayKey();

    // 1. Study Time Today
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const todaySessions = sessions.filter(s => {
      const d = new Date(s.start);
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` === today;
    });
    const studiedMins = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const todayRoutine = routineForDate(today);
    const routineGoal = plannedMinutesFor(todayRoutine);
    const targetMins = routineGoal || state.dailyTargetMinutes || 240;
    const targetPct = Math.min(100, Math.round((studiedMins / targetMins) * 100));

    const studyTodayEl = document.getElementById('dbKpiStudyToday');
    const studySubEl = document.getElementById('dbKpiStudySub');
    const studyBarEl = document.getElementById('dbKpiStudyProgressBar');
    const targetSummaryEl = document.getElementById('dbTargetGoalSummary');
    if (studyTodayEl) studyTodayEl.textContent = formatMins(studiedMins);
    if (studySubEl) studySubEl.textContent = `${routineGoal ? 'Routine goal' : 'Daily goal'}: ${formatMins(targetMins)} (${targetPct}%)`;
    if (studyBarEl) studyBarEl.style.width = `${targetPct}%`;
    if (targetSummaryEl) targetSummaryEl.textContent = `${routineGoal ? 'Routine' : 'Daily'} Goal: ${formatMins(targetMins)}`;

    // 2. Tasks / Routine Completed
    const now = new Date();
    let completedCount = 0;

    const todayPlanProgress = getTodayStudyPlanProgress(now);
    todayPlanProgress.forEach(block => {
      if (block.status === 'complete') completedCount++;
    });

    const tasksRatioEl = document.getElementById('dbKpiTasksRatio');
    const tasksSubEl = document.getElementById('dbKpiTasksSub');
    const tasksBarEl = document.getElementById('dbKpiTasksProgressBar');

    if (tasksRatioEl) {
      tasksRatioEl.textContent = todayRoutine.length > 0 ? `${completedCount} of ${todayRoutine.length}` : '0 of 0';
    }
    if (tasksSubEl) {
      const remaining = Math.max(0, todayRoutine.length - completedCount);
      tasksSubEl.textContent = remaining > 0 ? `${remaining} remaining today` : (todayRoutine.length > 0 ? 'All tasks complete!' : "No tasks scheduled");
    }
    if (tasksBarEl) {
      const taskPct = todayRoutine.length > 0 ? Math.round((completedCount / todayRoutine.length) * 100) : 0;
      tasksBarEl.style.width = `${taskPct}%`;
    }

    // 3. Current Streak
    const streak = calculateStreak();
    const streakEl = document.getElementById('dbKpiStreak');
    const streakBarEl = document.getElementById('dbKpiStreakProgressBar');
    if (streakEl) streakEl.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    if (streakBarEl) {
      const streakPct = Math.min(100, streak * 15);
      streakBarEl.style.width = `${streakPct}%`;
    }

    // 4. Focus Score (Points from focus minutes + quiz accuracy)
    let quizPoints = 0;
    try {
      const raw = localStorage.getItem('jobprep_quiz_stats');
      if (raw) {
        const stats = JSON.parse(raw);
        quizPoints = (stats.totalCorrect || 0) * 10;
      }
    } catch (_) {}
    const focusScore = Math.round(studiedMins * 2.5 + quizPoints);
    const scoreEl = document.getElementById('dbKpiFocusScore');
    const scoreBarEl = document.getElementById('dbKpiScoreProgressBar');
    if (scoreEl) scoreEl.textContent = String(focusScore);
    if (scoreBarEl) {
      const scorePct = Math.min(100, Math.round((focusScore / 600) * 100));
      scoreBarEl.style.width = `${scorePct}%`;
    }
  }

  function calculateStreak() {
    const sessions = state.sessions || [];
    if (!sessions.length) return 0;

    const daySet = new Set();
    sessions.forEach(s => {
      const d = new Date(s.start);
      daySet.add(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    });

    let count = 0;
    const cursor = new Date();
    while (true) {
      const k = `${cursor.getFullYear()}-${pad(cursor.getMonth()+1)}-${pad(cursor.getDate())}`;
      if (!daySet.has(k)) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  /* ── 3. Render Today's Study Plan ──────────────────────────────────────── */
  function renderStudyPlan() {
    const timelineEl = document.getElementById('dbTodayPlanTimeline');
    if (!timelineEl) return;
    timelineEl.setAttribute('aria-busy', 'false');

    const now = new Date();
    const today = todayKey();
    const previousScrollTop = timelineEl.scrollTop;
    const routine = getTodayStudyPlanProgress(now)
      .sort((a, b) => (minutesFromTimeStr(a.startTime) ?? 1440) - (minutesFromTimeStr(b.startTime) ?? 1440));
    if (!routine.length) {
      timelineEl.innerHTML = `
        <div class="db-empty-plan">
          <i data-lucide="calendar-plus"></i>
          <p>No sessions scheduled for today</p>
          <button class="db-action-link" type="button" onclick="activateTab('routine', true)">
            <i data-lucide="plus"></i> <span>Add to Routine</span>
          </button>
        </div>`;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    timelineEl.innerHTML = routine.map(item => {
      const startMins = minutesFromTimeStr(item.startTime);
      const endMins = minutesFromTimeStr(item.endTime);
      const duration = item.duration;
      const trackedMinutes = item.trackedMinutes;
      const progress = item.progress;
      const statusClass = {
        complete: 'db-status--done',
        'not-complete': 'db-status--missed',
        'in-progress': 'db-status--active',
        upcoming: 'db-status--upcoming',
        'time-not-set': 'db-status--upcoming'
      }[item.status];
      const statusText = {
        complete: 'Complete',
        'not-complete': 'Not complete',
        'in-progress': 'In Progress · Tracker',
        upcoming: 'Upcoming',
        'time-not-set': 'Time not set'
      }[item.status];

      const subjectName = typeof canonicalSubjectName === 'function' ? canonicalSubjectName(item.subject || 'Study block') : (item.subject || 'Study block');
      const safeSubject = typeof escapeHtml === 'function' ? escapeHtml(subjectName) : subjectName;
      const taskText = item.task ? (typeof escapeHtml === 'function' ? escapeHtml(item.task) : item.task) : 'Standard review session';
      const timeLabel = startMins === null || endMins === null ? 'Time not set' : `${item.startTime} – ${item.endTime}`;
      const progressLabel = duration ? `${Math.round(trackedMinutes)} / ${duration} min tracked` : 'Add a time to track progress';

      const isActive = statusClass === 'db-status--active';
      return `
        <button class="db-plan-row${isActive ? ' is-active' : ''}" type="button"${isActive ? ` data-tracker-subject="${typeof escapeAttr === 'function' ? escapeAttr(subjectName) : subjectName}" aria-label="Open Tracker for ${safeSubject}" title="Track ${safeSubject} in Tracker"` : ` onclick="activateTab('routine', true)" title="Open this block in Routine"`}>
          <div class="db-plan-time-badge">${timeLabel}</div>
          <div class="db-plan-info">
            <span class="db-plan-subject">${safeSubject}</span>
            <span class="db-plan-task">${taskText}</span>
            <div class="db-plan-progress" role="progressbar" aria-label="${safeSubject} tracked time" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
              <span style="width:${progress}%"></span>
            </div>
            <span class="db-plan-progress-label">${progressLabel}</span>
          </div>
          <span class="db-status-pill ${statusClass}">${statusText}</span>
        </button>`;
    }).join('');
    timelineEl.querySelectorAll('[data-tracker-subject]').forEach(button => {
      button.addEventListener('click', () => {
        activateTab('tracker', true);
        const subjectSelect = document.getElementById('sessionSubject');
        if (!subjectSelect) return;

        const subject = button.dataset.trackerSubject;
        let option = Array.from(subjectSelect.options).find(item => subjectKey(item.value) === subjectKey(subject));
        if (!option) {
          option = document.createElement('option');
          option.value = subject;
          option.textContent = subject;
          subjectSelect.appendChild(option);
        }
        subjectSelect.value = option.value;
        subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    timelineEl.scrollTop = previousScrollTop;
  }

  /* ── 4. Dashboard controls for the shared Tracker timer ────────────────── */
  function initFocusTimer() {
    const card = document.getElementById('dbTimerCard');
    if (!card) return;

    const trackerSubject = document.getElementById('sessionSubject');
    const dashboardSubject = document.getElementById('dbTimerSubjectSelect');
    const trackerCustom = document.getElementById('sessionCustomSubject');
    const dashboardCustom = document.getElementById('dbTimerCustomSubject');
    const trackerBreak = document.getElementById('breakReason');
    const dashboardBreak = document.getElementById('dbTimerBreakReason');
    let hasManualSubjectSelection = false;
    let applyingRoutineSubject = false;
    let lastLivePlanRefreshKey = '';

    function syncSubjects() {
      if (!trackerSubject || !dashboardSubject) return;
      const options = Array.from(trackerSubject.options)
        .map(option => `<option value="${typeof escapeAttr === 'function' ? escapeAttr(option.value) : option.value}">${typeof escapeHtml === 'function' ? escapeHtml(option.textContent) : option.textContent}</option>`)
        .join('');
      if (dashboardSubject.innerHTML !== options) dashboardSubject.innerHTML = options;
      dashboardSubject.value = trackerSubject.value;
      if (dashboardCustom && trackerCustom) {
        dashboardCustom.value = trackerCustom.value;
        dashboardCustom.hidden = trackerCustom.hidden || trackerCustom.style.display === 'none';
      }
    }

    function selectCurrentRoutineSubject() {
      if (!trackerSubject || hasManualSubjectSelection || state.activeSession || (window.trackerTimerMode || 'study') !== 'study') return;

      const now = new Date();
      const nowMinute = now.getHours() * 60 + now.getMinutes();
      const currentBlock = routineForDate(todayKey()).find(item => {
        const start = minutesFromTimeStr(item.startTime);
        const end = minutesFromTimeStr(item.endTime);
        return start !== null && end !== null && end > start && nowMinute >= start && nowMinute < end;
      });
      if (!currentBlock || !currentBlock.subject) return;

      const subject = typeof canonicalSubjectName === 'function'
        ? canonicalSubjectName(currentBlock.subject)
        : currentBlock.subject;
      let option = Array.from(trackerSubject.options).find(item => subjectKey(item.value) === subjectKey(subject));
      if (!option) {
        option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        trackerSubject.appendChild(option);
      }
      if (trackerSubject.value === option.value) return;

      applyingRoutineSubject = true;
      trackerSubject.value = option.value;
      trackerSubject.dispatchEvent(new Event('change', { bubbles: true }));
      applyingRoutineSubject = false;
      syncSubjects();
    }

    function clickTrackerDuration(duration) {
      const mode = window.trackerTimerMode || 'study';
      const group = mode === 'break' ? 'breakDurationOptions' : 'studyDurationOptions';
      const button = document.querySelector(`#${group} .timer-dur-chip[data-duration="${duration}"]`);
      if (button) button.click();
    }

    card.querySelectorAll('[data-dashboard-timer-mode]').forEach(button => {
      button.addEventListener('click', () => {
        const modeButton = document.querySelector(`#timerModeSelector [data-mode="${button.dataset.dashboardTimerMode}"]`);
        if (modeButton) modeButton.click();
      });
    });

    card.querySelectorAll('[data-dashboard-timer-duration]').forEach(button => {
      button.addEventListener('click', () => clickTrackerDuration(button.dataset.dashboardTimerDuration));
    });

    if (dashboardSubject && trackerSubject) {
      dashboardSubject.addEventListener('change', () => {
        hasManualSubjectSelection = true;
        trackerSubject.value = dashboardSubject.value;
        trackerSubject.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
      });
      trackerSubject.addEventListener('change', () => {
        if (!applyingRoutineSubject) hasManualSubjectSelection = true;
        if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
      });
    }
    if (dashboardCustom && trackerCustom) {
      dashboardCustom.addEventListener('input', () => {
        trackerCustom.value = dashboardCustom.value;
        trackerCustom.dispatchEvent(new Event('input', { bubbles: true }));
      });
      trackerCustom.addEventListener('input', () => {
        if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
      });
    }
    if (dashboardBreak && trackerBreak) {
      dashboardBreak.addEventListener('change', () => {
        trackerBreak.value = dashboardBreak.value;
        trackerBreak.dispatchEvent(new Event('change', { bubbles: true }));
      });
      trackerBreak.addEventListener('change', () => {
        if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
      });
    }

    const start = document.getElementById('dbTimerStartBtn');
    const stop = document.getElementById('dbTimerStopBtn');
    const openTracker = document.getElementById('dbTimerOpenTracker');
    if (start) start.addEventListener('click', () => document.getElementById('startBtn')?.click());
    if (stop) stop.addEventListener('click', () => document.getElementById('stopBtn')?.click());
    if (openTracker) openTracker.addEventListener('click', () => activateTab('tracker', true));

    window.syncDashboardTrackerTimer = function () {
      syncSubjects();
      selectCurrentRoutineSubject();
      syncSubjects();
      if (dashboardBreak && trackerBreak) dashboardBreak.value = trackerBreak.value;

      const actualDisplay = document.getElementById('timerDisplay');
      const display = document.getElementById('dbTimerDigits');
      const actualStart = document.getElementById('startBtn');
      const actualStop = document.getElementById('stopBtn');
      const mode = window.trackerTimerMode || 'study';
      const running = !!(state.activeSession || window.isCustomCountdownActive);

      if (display && actualDisplay) display.textContent = actualDisplay.textContent;
      if (typeof window.updateCareerDeskTimerRings === 'function') {
        const durationSeconds = Number(window.selectedTimerDuration || 0) * 60;
        const countdownActive = !!window.isCustomCountdownActive && durationSeconds > 0;
        const stopwatchActive = !!state.activeSession && mode !== 'break';
        const ringTotal = countdownActive ? durationSeconds : 60;
        const countdownMatch = /^([0-9]{1,3}):([0-5][0-9])$/.exec(actualDisplay?.textContent?.trim() || '');
        const displayedCountdown = countdownMatch ? Number(countdownMatch[1]) * 60 + Number(countdownMatch[2]) : 0;
        const ringRemaining = countdownActive
          ? displayedCountdown
          : stopwatchActive ? Math.max(0, 60 - (Math.floor((Date.now() - Number(state.activeSession.start)) / 1000) % 60)) : 0;
        window.updateCareerDeskTimerRings(ringRemaining, ringTotal, countdownActive || stopwatchActive);
      }
      if (start) {
        start.hidden = running;
        start.disabled = actualStart ? actualStart.disabled : false;
        const startLabel = start.querySelector('span');
        if (startLabel) startLabel.textContent = mode === 'break' ? 'Start Break' : 'Start Studying';
      }
      if (stop) {
        stop.hidden = !running;
        const stopLabel = stop.querySelector('span');
        if (stopLabel) stopLabel.textContent = mode === 'break' ? 'Finish Break' : 'Finish Session';
      }

      card.querySelectorAll('[data-dashboard-timer-mode]').forEach(button => {
        button.classList.toggle('active', button.dataset.dashboardTimerMode === mode);
      });
      card.querySelectorAll('[data-dashboard-timer-duration]').forEach(button => {
        const activeMode = mode === 'break' ? 'breakDurationOptions' : 'studyDurationOptions';
        const actualButton = document.querySelector(`#${activeMode} .timer-dur-chip.active`);
        button.classList.toggle('active', button.dataset.dashboardTimerDuration === (actualButton?.dataset.duration || selectedDuration));
      });
      card.querySelectorAll('[data-dashboard-study-control]').forEach(control => {
        control.hidden = mode === 'break';
      });
      card.querySelectorAll('[data-dashboard-break-control]').forEach(control => {
        control.hidden = mode !== 'break';
      });

      const dashboard = document.getElementById('panel-home');
      const activeStudy = typeof window.getActiveTrackerStudySession === 'function'
        ? window.getActiveTrackerStudySession()
        : null;
      const refreshKey = activeStudy
        ? `${subjectKey(activeStudy.subject)}:${Math.floor(Date.now() / 60000)}`
        : '';
      if (dashboard?.classList.contains('active') && refreshKey !== lastLivePlanRefreshKey) {
        lastLivePlanRefreshKey = refreshKey;
        renderStudyPlan();
      }

    };

    syncSubjects();
    selectCurrentRoutineSubject();
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  }

  /* ── 6. Master Render & Initialization ────────────────────────────────── */
  function renderDashboard() {
    renderMetrics();
    renderStudyPlan();
    if (typeof window.renderTrackerSubjectBars === 'function') window.renderTrackerSubjectBars();
    if (typeof window.syncDashboardTrackerTimer === 'function') window.syncDashboardTrackerTimer();
  }

  function init() {
    initFocusTimer();
    renderDashboard();

    // Refresh only while the dashboard is open to avoid background work.
    setInterval(() => {
      const dashboard = document.getElementById('panel-home');
      if (dashboard && dashboard.classList.contains('active')) {
        renderDashboard();
      }
    }, 60000);
  }

  // Export to window for global invocation
  window.renderDashboard = renderDashboard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 120));
  } else {
    setTimeout(init, 120);
  }

})();
