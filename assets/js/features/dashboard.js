/* ==========================================================================
   CareerDesk — Dashboard Overview JS Engine (Figma Prototype node-id=3-2)
   Populates Hero, 4 KPI progress cards, Today's Study Plan, and Focus Timer
   ========================================================================== */

(function () {
  'use strict';

  /* ── State & Variables ─────────────────────────────────────────────────── */
  let timerInterval = null;
  let timerSecondsLeft = 25 * 60;
  let timerTotalSeconds = 25 * 60;
  let timerIsRunning = false;
  let timerSelectedDuration = 25; // in minutes (0 for stopwatch)
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 82; // ~515.22px

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
    if (!str || !str.includes(':')) return 0;
    const parts = str.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  /* ── 1. Live Clock & Greeting ──────────────────────────────────────────── */
  function initClock() {
    const clockEl = document.getElementById('dbLiveClock');
    const dateEl = document.getElementById('dbLiveDate');
    if (!clockEl) return;

    function tick() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      clockEl.textContent = `${pad(h12)}:${pad(m)} ${ampm}`;
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        });
      }
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ── 1b. Sync Navbar User Profile ──────────────────────────────────────── */
  function syncNavUser() {
    const nameEl = document.getElementById('navUserName');
    const initEl = document.getElementById('navUserInitial');
    if (!nameEl || typeof state === 'undefined') return;
    const name = (typeof state.profile?.name === 'string' && state.profile.name.trim())
      ? state.profile.name.trim()
      : 'Shahriyar';
    nameEl.textContent = name.split(' ')[0];
    if (initEl) initEl.textContent = name.charAt(0).toUpperCase();
  }

  /* ── 2. Render Metrics & KPI Cards ─────────────────────────────────────── */
  function renderMetrics() {
    if (typeof state === 'undefined') return;
    const today = todayKey();

    // 1. Study Time Today
    const todaySessions = (state.sessions || []).filter(s => {
      const d = new Date(s.start);
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` === today;
    });
    const studiedMins = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const targetMins = state.dailyTargetMinutes || 240;
    const targetPct = Math.min(100, Math.round((studiedMins / targetMins) * 100));

    const studyTodayEl = document.getElementById('dbKpiStudyToday');
    const studySubEl = document.getElementById('dbKpiStudySub');
    const studyBarEl = document.getElementById('dbKpiStudyProgressBar');
    const topStudyEl = document.getElementById('dbTopHeaderStudy');

    if (studyTodayEl) studyTodayEl.textContent = formatMins(studiedMins);
    if (studySubEl) studySubEl.textContent = `Goal: ${formatMins(targetMins)} (${targetPct}%)`;
    if (studyBarEl) studyBarEl.style.width = `${targetPct}%`;
    if (topStudyEl) topStudyEl.textContent = `${formatMins(studiedMins)} today`;

    // 2. Tasks / Routine Completed
    const todayRoutine = (state.routine || []).filter(r => r.date === today);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    let completedCount = 0;

    todayRoutine.forEach(r => {
      const endMins = minutesFromTimeStr(r.endTime);
      if (endMins && endMins < nowMinutes) {
        completedCount++;
      }
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
      const streakPct = Math.min(100, Math.max(15, streak * 15));
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
    if (scoreEl) scoreEl.textContent = focusScore > 0 ? focusScore : '425';
    if (scoreBarEl) {
      const scorePct = Math.min(100, Math.max(25, Math.round((focusScore / 600) * 100)));
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

    const today = todayKey();
    const routine = (state.routine || []).filter(r => r.date === today);

    if (!routine.length) {
      timelineEl.innerHTML = `
        <div class="db-empty-plan">
          <i data-lucide="calendar-plus"></i>
          <p style="margin:0; font-size:13px; font-weight:600; color:var(--text-soft);">No sessions scheduled for today</p>
          <button class="db-action-link" type="button" onclick="activateTab('routine', true)" style="margin-top:6px;">
            <i data-lucide="plus"></i> <span>Add to Routine</span>
          </button>
        </div>`;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }

    // Sort by startTime
    const sorted = [...routine].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    timelineEl.innerHTML = sorted.map(item => {
      const startMins = minutesFromTimeStr(item.startTime);
      const endMins = minutesFromTimeStr(item.endTime);

      let statusClass = 'db-status--upcoming';
      let statusText = 'Upcoming';

      if (endMins && endMins < nowMins) {
        statusClass = 'db-status--done';
        statusText = 'Completed';
      } else if (startMins && endMins && nowMins >= startMins && nowMins <= endMins) {
        statusClass = 'db-status--active';
        statusText = 'In Progress';
      }

      const subjectName = typeof canonicalSubjectName === 'function' ? canonicalSubjectName(item.subject || 'Study block') : (item.subject || 'Study block');
      const taskText = item.task ? (typeof escapeHtml === 'function' ? escapeHtml(item.task) : item.task) : 'Standard review session';

      return `
        <div class="db-plan-row" onclick="activateTab('routine', true)" style="cursor:pointer;" title="Click to view in Routine">
          <div class="db-plan-time-badge">${item.startTime || '--:--'} - ${item.endTime || '--:--'}</div>
          <div class="db-plan-info">
            <span class="db-plan-subject">${typeof escapeHtml === 'function' ? escapeHtml(subjectName) : subjectName}</span>
            <span class="db-plan-task">${taskText}</span>
          </div>
          <span class="db-status-pill ${statusClass}">${statusText}</span>
        </div>`;
    }).join('');

    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  /* ── 4. Interactive Focus Timer Widget ─────────────────────────────────── */
  function initFocusTimer() {
    const circle = document.getElementById('dbTimerCircle');
    const digits = document.getElementById('dbTimerDigits');
    const startBtn = document.getElementById('dbTimerStartBtn');
    const resetBtn = document.getElementById('dbTimerResetBtn');
    const modeBtns = document.querySelectorAll('.db-timer-mode-btn');
    const btnText = document.getElementById('dbTimerBtnText');
    const btnIcon = document.getElementById('dbTimerBtnIcon');

    if (!circle || !digits || !startBtn) return;

    function updateRing() {
      if (timerSelectedDuration === 0) {
        // Stopwatch mode: animate pulsing stroke
        circle.style.strokeDashoffset = '0';
        return;
      }
      const fraction = timerSecondsLeft / timerTotalSeconds;
      const offset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
      circle.style.strokeDashoffset = String(offset);
    }

    function updateDisplay() {
      const m = Math.floor(timerSecondsLeft / 60);
      const s = timerSecondsLeft % 60;
      digits.textContent = `${pad(m)}:${pad(s)}`;
      updateRing();
    }

    function startTimer() {
      if (timerIsRunning) return;
      timerIsRunning = true;
      startBtn.classList.add('running');
      if (btnText) btnText.textContent = 'Pause';
      if (btnIcon) btnIcon.setAttribute('data-lucide', 'pause');
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

      timerInterval = setInterval(() => {
        if (timerSelectedDuration === 0) {
          // Stopwatch counts up
          timerSecondsLeft++;
          updateDisplay();
        } else {
          // Countdown counts down
          if (timerSecondsLeft > 0) {
            timerSecondsLeft--;
            updateDisplay();
          } else {
            // Completed!
            pauseTimer();
            if (typeof showToast === 'function') {
              showToast('🎉 Focus session completed! Great work.');
            }
            // Log session if state is available
            logCompletedSession(timerSelectedDuration);
            resetTimer();
          }
        }
      }, 1000);
    }

    function pauseTimer() {
      timerIsRunning = false;
      clearInterval(timerInterval);
      timerInterval = null;
      startBtn.classList.remove('running');
      if (btnText) btnText.textContent = 'Resume';
      if (btnIcon) btnIcon.setAttribute('data-lucide', 'play');
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function resetTimer() {
      pauseTimer();
      timerSecondsLeft = timerTotalSeconds;
      if (btnText) btnText.textContent = 'Start Focus';
      updateDisplay();
    }

    function logCompletedSession(mins) {
      if (typeof state === 'undefined' || !mins) return;
      if (!Array.isArray(state.sessions)) state.sessions = [];
      const now = Date.now();
      state.sessions.push({
        id: now,
        subject: 'General Study',
        start: now - mins * 60000,
        end: now,
        duration: mins
      });
      if (typeof saveData === 'function') saveData();
      renderMetrics();
    }

    startBtn.addEventListener('click', () => {
      if (timerIsRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', resetTimer);
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dur = Number(btn.dataset.dur);
        timerSelectedDuration = dur;
        timerTotalSeconds = dur === 0 ? 0 : dur * 60;
        timerSecondsLeft = timerTotalSeconds;
        const modeLabel = document.getElementById('dbTimerModeLabel');
        if (modeLabel) {
          modeLabel.textContent = dur === 0 ? 'Stopwatch' : (dur === 50 ? 'Deep Work' : (dur === 15 ? 'Short Break' : 'Pomodoro'));
        }
        resetTimer();
      });
    });

    updateDisplay();
  }

  /* ── 6. Master Render & Initialization ────────────────────────────────── */
  function renderDashboard() {
    syncNavUser();
    renderMetrics();
    renderStudyPlan();
  }

  function init() {
    initClock();
    initFocusTimer();
    renderDashboard();

    // Re-render whenever the active tab becomes home/dashboard
    document.addEventListener('careerdesk:tabchange', e => {
      if (e.detail === 'home') renderDashboard();
    });

    // Auto-update plan and stats every 60 seconds while visible
    setInterval(() => {
      if (document.getElementById('dashboardOverview')) {
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
