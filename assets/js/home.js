/* ==========================================================================
   CareerDesk — Mission Control Homepage Dashboard Engine
   ========================================================================== */

let homeCountdownInterval = null;

/**
 * Main render function for the Mission Control Homepage Dashboard
 */
function renderHomeDashboard() {
  const container = document.getElementById('panel-home');
  if (!container) return;

  const now = new Date();
  const today = dateKey(now.getTime());

  // 1. User Identity & Time-Sensitive Greeting
  let displayName = 'Aspirant';
  let username = 'aspirant';
  let photoURL = '';
  let isGuest = true;

  try {
    const authUser = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    const custom = (typeof getCustomProfile === 'function') ? getCustomProfile() : null;

    if (authUser) {
      isGuest = false;
      displayName = authUser.displayName || 'Aspirant';
      username = authUser.username || (typeof getEffectiveUsername === 'function' ? getEffectiveUsername(authUser) : (authUser.email ? authUser.email.split('@')[0] : 'aspirant'));
      photoURL = authUser.photoURL || '';
    } else if (custom) {
      if (custom.displayName) displayName = custom.displayName;
      if (custom.username) username = custom.username;
      if (custom.photoURL) photoURL = custom.photoURL;
    }
  } catch (e) { }

  const firstName = displayName.trim().split(' ')[0] || 'Aspirant';
  const hour = now.getHours();
  let greeting = `Good Morning, ${firstName}!`;
  if (hour >= 12 && hour < 17) greeting = `Good Afternoon, ${firstName}!`;
  else if (hour >= 17 && hour < 22) greeting = `Good Evening, ${firstName}!`;
  else if (hour >= 22 || hour < 5) greeting = `Night Focus, ${firstName}!`;

  const initials = (displayName || 'A').trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', dateOptions);

  // 2. Study Goal Progress Today
  const todaySessions = (state.sessions || []).filter(s => dateKey(s.start) === today);
  const studiedMinsToday = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const targetMins = state.dailyTargetMinutes || 240;
  const goalPct = Math.min(100, Math.round((studiedMinsToday / targetMins) * 100));

  const studiedH = Math.floor(studiedMinsToday / 60);
  const studiedM = studiedMinsToday % 60;
  const targetH = Math.floor(targetMins / 60);
  const targetM = targetMins % 60;

  // 3. Study Streak Calculation
  let streak = 0;
  for (let i = 1; i <= 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d.getTime());
    const dayTotal = (state.sessions || []).filter(s => dateKey(s.start) === key).reduce((a, s) => a + (s.duration || 0), 0);
    if (dayTotal >= targetMins) streak++;
    else break;
  }
  if (studiedMinsToday >= targetMins) streak++;

  // 4. Upcoming Target Exam
  if (typeof loadExams === 'function' && (!exams || !exams.length)) {
    loadExams();
  }
  const upcomingExams = (exams || []).filter(e => new Date(e.targetDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  const nearestExam = upcomingExams[0] || null;

  // 5. Today's Routine Schedule
  const nowTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const todayRoutine = (state.routine || []).filter(r => r.date === today)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // 6. Next In Routine calculation
  let nextRoutineHtml = '';
  if (todayRoutine.length > 0) {
    const upcoming = todayRoutine.find(r => (r.endTime || '23:59') >= nowTimeStr);
    if (upcoming) {
      const isCurrent = (upcoming.startTime <= nowTimeStr && upcoming.endTime >= nowTimeStr);
      nextRoutineHtml = `
        <div class="home-next-routine-strip">
          <div class="home-next-routine-left">
            <span class="home-next-routine-badge ${isCurrent ? 'live' : ''}">
              <i data-lucide="${isCurrent ? 'radio' : 'clock'}"></i>
              <span>${isCurrent ? 'Now' : 'Next Up'}</span>
            </span>
            <span class="home-next-routine-desc">
              <strong style="color:var(--text);">${escapeHtml(upcoming.subject)}</strong>
              <span style="opacity:0.5; margin:0 4px;">•</span>
              <span style="font-family:var(--font-mono); font-size:12px;">${escapeHtml(upcoming.startTime)} - ${escapeHtml(upcoming.endTime)}</span>
              <span style="opacity:0.5; margin:0 4px;">—</span>
              <span>${escapeHtml(upcoming.task || 'Scheduled Study Block')}</span>
            </span>
          </div>
          <button type="button" class="home-next-routine-btn" data-focus-routine-subject="${escapeAttr(upcoming.subject)}">
            <i data-lucide="play" style="width:13px;height:13px;"></i> <span>Start Focus</span>
          </button>
        </div>
      `;
    } else {
      nextRoutineHtml = `
        <div class="home-next-routine-strip">
          <div class="home-next-routine-left">
            <span class="home-next-routine-badge" style="background:rgba(16,185,129,0.15); color:#10b981;">
              <i data-lucide="check-circle-2"></i>
              <span>Done</span>
            </span>
            <span class="home-next-routine-desc">
              All ${todayRoutine.length} scheduled routine blocks for today are finished! Great work!
            </span>
          </div>
          <button type="button" class="home-next-routine-btn" id="homeJumpRoutineBtn" style="background:rgba(255,255,255,0.08); color:var(--text);">
            <i data-lucide="calendar" style="width:13px;height:13px;"></i> <span>View Routine</span>
          </button>
        </div>
      `;
    }
  } else {
    nextRoutineHtml = `
      <div class="home-next-routine-strip">
        <div class="home-next-routine-left">
          <span class="home-next-routine-badge">
            <i data-lucide="calendar-plus"></i>
            <span>Schedule</span>
          </span>
          <span class="home-next-routine-desc">
            No routine tasks scheduled for today yet. Build your daily plan to stay focused.
          </span>
        </div>
        <button type="button" class="home-next-routine-btn" id="homeJumpRoutineBtn">
          <i data-lucide="plus" style="width:13px;height:13px;"></i> <span>Plan Schedule</span>
        </button>
      </div>
    `;
  }

  // 7. Four Core Subject Pillars Data
  const primaryPillars = [
    { name: 'Bangla', bn: 'বাংলা', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
    { name: 'English', bn: 'ইংরেজি', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
    { name: 'Mathematics', bn: 'গণিত', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { name: 'General Knowledge', bn: 'সাধারণ জ্ঞান', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
  ];

  const pillarStats = primaryPillars.map(p => {
    const canonPillar = canonicalSubjectName(p.name).toLowerCase();
    
    // Syllabus progress
    let totalTopics = 0;
    let doneTopics = 0;
    (state.syllabus || []).forEach(cat => {
      const canonCat = canonicalSubjectName(cat.name).toLowerCase();
      if (canonCat === canonPillar || canonCat.includes(canonPillar) || canonPillar.includes(canonCat)) {
        (cat.topics || []).forEach(t => {
          totalTopics++;
          if (t.done) doneTopics++;
        });
      }
    });
    const syllabusPct = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

    // Study minutes today
    const pSessions = todaySessions.filter(s => {
      const sCanon = canonicalSubjectName(s.subject).toLowerCase();
      return sCanon === canonPillar || sCanon.includes(canonPillar) || canonPillar.includes(sCanon);
    });
    const studiedMins = pSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      ...p,
      totalTopics,
      doneTopics,
      syllabusPct,
      studiedMins
    };
  });

  // 8. Mistake Bank Data
  if (typeof loadMistakes === 'function' && (!mistakes || !mistakes.length)) {
    loadMistakes();
  }
  const pendingMistakes = mistakes || [];

  // 9. Daily Motivation Quote
  let activeQuote = {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  };
  if (state.customQuotes && state.customQuotes.length > 0) {
    const idx = (state.quoteIdx || 0) % state.customQuotes.length;
    activeQuote = state.customQuotes[idx] || activeQuote;
  }

  const heroWrap = document.getElementById('homeHeroWrap');
  const cockpitWrap = document.getElementById('homeCockpitWrap');
  const columnsWrap = document.getElementById('homeColumnsWrap');

  // If container wrappers don't exist yet, fallback to full container injection
  if (!heroWrap || !cockpitWrap || !columnsWrap) {
    return;
  }

  // 1. HERO MISSION BRIEFING & USER COMMAND CENTER
  heroWrap.innerHTML = `
    <section class="home-hero">
      <!-- User Command Hub / Mission Briefing -->
      <div class="home-user-command-row">
        <div class="home-user-profile-meta">
          <div class="home-user-avatar-wrap">
            ${photoURL ? `
              <img src="${escapeAttr(photoURL)}" alt="${escapeAttr(displayName)}" class="home-user-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="home-user-avatar-fallback" style="display:none;">${escapeHtml(initials)}</div>
            ` : `
              <div class="home-user-avatar-fallback">${isGuest ? '<i data-lucide="user" style="width:20px;height:20px;"></i>' : escapeHtml(initials)}</div>
            `}
            <span class="home-user-avatar-dot ${isGuest ? 'guest' : ''}" title="${isGuest ? 'Guest Mode' : 'Online &amp; Cloud Synced'}"></span>
          </div>
          <div class="home-user-text-info">
            <div class="home-user-greeting-line">
              <span class="home-user-greeting-name">${escapeHtml(greeting)}</span>
              ${!isGuest ? `<span class="home-user-handle-pill">@${escapeHtml(username)}</span>` : ''}
            </div>
            <div class="home-user-subrow">
              <span class="home-user-cloud-badge">
                <span class="home-cloud-pulse-dot ${isGuest ? 'guest' : ''}"></span>
                <span>${isGuest ? 'New here? Create account or sign in to sync data' : 'Cloud Synced'}</span>
              </span>
              <span style="color:var(--border); font-size:11px;">•</span>
              <span style="font-size:12px; color:var(--text-soft); font-family:var(--font-mono);">${escapeHtml(formattedDate)}</span>
            </div>
          </div>
        </div>

        <div class="home-user-actions-cluster">
          ${isGuest ? `
            <button type="button" class="pill solid" id="homeGuestAuthCta" style="background:linear-gradient(135deg, var(--accent1), var(--accent2)); font-weight:700;">
              <i data-lucide="sparkles"></i> <span>Sign In / Register</span>
            </button>
          ` : `
            <button type="button" class="pill solid" id="homeQuickFocusBtn" style="font-weight:700;">
              <i data-lucide="play"></i> <span>Quick Focus</span>
            </button>
            <button type="button" class="pill subtle" id="homeProfileBtn" title="View Profile &amp; Settings">
              <i data-lucide="user"></i> <span>Profile</span>
            </button>
          `}
        </div>
      </div>

      <!-- Up Next In Schedule Strip -->
      ${nextRoutineHtml}

      <!-- Dynamic Daily Statistics Cards -->
      <div class="home-hero-stats">
        <!-- Daily Goal Progress -->
        <div class="home-stat-card" id="homeGoalCard" style="cursor:pointer;" title="Click to view Tracker &amp; Focus">
          <div class="home-stat-header">
            <span class="home-stat-label">Daily Study Target</span>
            <span class="home-stat-icon"><i data-lucide="target"></i></span>
          </div>
          <div class="home-stat-value">${studiedH}h ${studiedM}m <span style="font-size:14px; font-weight:600; color:var(--text-soft);">/ ${targetH}h${targetM ? ' ' + targetM + 'm' : ''}</span></div>
          <div class="home-stat-meta">${goalPct}% completed today</div>
          <div class="home-stat-progress-bar">
            <div class="home-stat-progress-fill" style="width: ${goalPct}%;"></div>
          </div>
        </div>

        <!-- Target Streak -->
        <div class="home-stat-card" id="homeStreakCard" style="cursor:pointer;" title="Click to view Study Heatmap">
          <div class="home-stat-header">
            <span class="home-stat-label">Consistency Streak</span>
            <span class="home-stat-icon streak-icon"><i data-lucide="flame"></i></span>
          </div>
          <div class="home-stat-value">${streak} ${streak === 1 ? 'Day' : 'Days'}</div>
          <div class="home-stat-meta">${streak > 0 ? 'Consistent daily momentum active' : 'Hit today\'s goal to build your streak'}</div>
          <div class="home-stat-progress-bar">
            <div class="home-stat-progress-fill" style="width: ${Math.min(100, Math.max(12, streak * 10))}%; background: linear-gradient(90deg, #f59e0b, #ef4444);"></div>
          </div>
        </div>

        <!-- Nearest Exam Target -->
        <div class="home-stat-card" id="homeExamCard" style="cursor:pointer;" title="Click to view Exam Countdowns">
          <div class="home-stat-header">
            <span class="home-stat-label">Target Exam Target</span>
            <span class="home-stat-icon exam-icon"><i data-lucide="calendar-clock"></i></span>
          </div>
          <div class="home-stat-value" id="homeExamCountdownTime" style="font-family:var(--font-mono); font-size:19px; letter-spacing:0.2px;">
            ${nearestExam ? 'Loading...' : 'None Set'}
          </div>
          <div class="home-stat-meta" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${nearestExam ? escapeHtml(nearestExam.name) : 'Click to set target exam date'}
          </div>
          <div class="home-stat-progress-bar">
            <div class="home-stat-progress-fill" style="width: 100%; background: linear-gradient(90deg, #f43f5e, #c084fc);"></div>
          </div>
        </div>
      </div>

      <!-- Integrated Sleek Motivation Strip -->
      <div class="home-motivation-strip" id="quoteTicker">
        <div class="home-motivation-content">
          <span class="home-motivation-dot"></span>
          <span class="home-motivation-text" id="tickerText">"${escapeHtml(activeQuote.text || '')}"</span>
          <span class="home-motivation-author">&mdash; ${escapeHtml(activeQuote.author || 'CareerDesk')}</span>
        </div>
        <button type="button" class="home-motivation-wallpaper-btn" id="homeExportWallpaperAction" title="Export 1080p HD Motivation Wallpaper">
          <i data-lucide="image"></i> <span>Wallpaper</span>
        </button>
      </div>
    </section>
  `;

  // 2. QUICK ACTION COCKPIT (Cleaned up / Reserved)
  if (cockpitWrap) cockpitWrap.innerHTML = '';

  // 3. TWO-COLUMN BALANCED ADAPTIVE DASHBOARD
  columnsWrap.innerHTML = `
    <div class="home-columns-grid">
      <!-- LEFT COLUMN: PRIMARY PREPARATION PILLARS -->
      <div class="home-column">
        <!-- Four Primary Pillars Radar -->
        <div class="home-widget">
          <div class="home-widget-header">
            <div class="home-widget-title-wrap">
              <i data-lucide="compass"></i>
              <h3 class="home-widget-title">Core Preparation Pillars</h3>
            </div>
            <button type="button" class="home-widget-action" id="homeViewSyllabusBtn">
              <span>Syllabus Map</span> <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <div class="home-pillars-grid">
            ${pillarStats.map(p => `
              <div class="home-pillar-card" style="--pillar-color: ${p.color};">
                <div class="home-pillar-head">
                  <span class="home-pillar-title">
                    <span class="home-pillar-dot"></span>
                    ${escapeHtml(p.name)}
                  </span>
                  <span class="home-pillar-pct">${p.syllabusPct}%</span>
                </div>
                <div class="home-pillar-progress">
                  <div class="home-pillar-fill" style="width: ${p.syllabusPct}%;"></div>
                </div>
                <div class="home-pillar-footer">
                  <span class="home-pillar-time">
                    ${p.studiedMins > 0 ? `${p.studiedMins}m today` : `${p.doneTopics}/${p.totalTopics} topics done`}
                  </span>
                  <button type="button" class="home-pillar-study-btn" data-pillar-name="${escapeAttr(p.name)}">
                    Study &rarr;
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: WEAK-AREA RADAR & ACTIONABLE REMEDIATION -->
      <div class="home-column">
        <!-- Weak-Area Revision Radar -->
        <div class="home-widget">
          <div class="home-widget-header">
            <div class="home-widget-title-wrap">
              <i data-lucide="target"></i>
              <h3 class="home-widget-title">Weak-Area Revision Radar</h3>
            </div>
            <span class="home-mistakes-counter">
              <i data-lucide="alert-circle" style="width:12px; height:12px;"></i>
              ${pendingMistakes.length} ${pendingMistakes.length === 1 ? 'Mistake' : 'Mistakes'}
            </span>
          </div>

          ${pendingMistakes.length === 0 ? `
            <div class="empty-state" style="padding: 24px 16px; margin: 0; text-align: center;">
              <div style="width:44px; height:44px; border-radius:12px; background:rgba(16,185,129,0.12); color:#10b981; display:flex; align-items:center; justify-content:center; margin: 0 auto 12px;">
                <i data-lucide="check-circle-2" style="width:22px; height:22px;"></i>
              </div>
              <h4 style="margin:0 0 6px; font-size:14px; font-weight:700; color:var(--text);">Mistake Bank is Clean!</h4>
              <p style="margin:0 0 16px; font-size:12.5px; color:var(--text-soft); line-height:1.45;">You have no active mistake remediation items. Run timed model tests to discover weak concepts.</p>
              <button type="button" class="pill solid" id="homeTakeQuizBtn" style="padding:8px 18px; font-size:12.5px;"><i data-lucide="zap"></i> Start Model Quiz</button>
            </div>
          ` : `
            <div class="home-mistake-list">
              ${pendingMistakes.slice(0, 3).map(m => `
                <div class="home-mistake-item">
                  <div class="home-mistake-item-q">${escapeHtml(m.q || 'Question')}</div>
                  <div class="home-mistake-item-meta">
                    <span class="home-mistake-tag">${escapeHtml(m.subject || 'BCS')}</span>
                    <span>Correct: <strong>${escapeHtml(m.correctAns || 'N/A')}</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" class="pill danger" id="homeReviewMistakesBtn" style="width:100%; justify-content:center; font-size:12.5px;">
              <i data-lucide="refresh-cw"></i> Practice Mistake Bank (${pendingMistakes.length})
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Start live ticking countdown for nearest exam
  startHomeExamCountdown(nearestExam);

  // Bind all interactive click handlers
  bindHomeDashboardEvents();

  // Refresh integrated Daily Study Routine & Date Slider
  if (typeof initMonthDropdown === 'function') initMonthDropdown();
  if (typeof renderDateSlider === 'function') renderDateSlider();
  if (typeof renderRoutine === 'function') renderRoutine();
  if (typeof updateMonthYearPlaceholder === 'function') updateMonthYearPlaceholder();
  if (typeof updateRoutineTodayButtonState === 'function') updateRoutineTodayButtonState();

  // Create Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Ticking clock for nearest exam in home hero card
 */
function startHomeExamCountdown(nearestExam) {
  if (homeCountdownInterval) {
    clearInterval(homeCountdownInterval);
    homeCountdownInterval = null;
  }

  const el = document.getElementById('homeExamCountdownTime');
  if (!el) return;

  if (!nearestExam) {
    el.textContent = 'None Set';
    return;
  }

  function update() {
    const elLive = document.getElementById('homeExamCountdownTime');
    if (!elLive) return;

    const diff = new Date(nearestExam.targetDate).getTime() - Date.now();
    if (diff <= 0) {
      elLive.textContent = 'Exam Today!';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    elLive.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  update();
  homeCountdownInterval = setInterval(update, 1000);
}

/**
 * Event bindings for all Home cockpit tiles and widget buttons
 */
function bindHomeDashboardEvents() {
  // User command bar buttons
  const homeGuestAuthCta = document.getElementById('homeGuestAuthCta');
  if (homeGuestAuthCta) {
    homeGuestAuthCta.addEventListener('click', () => {
      if (typeof openAuthModal === 'function') openAuthModal('login');
    });
  }

  const homeQuickFocusBtn = document.getElementById('homeQuickFocusBtn');
  if (homeQuickFocusBtn) {
    homeQuickFocusBtn.addEventListener('click', () => {
      activateTab('tracker', true);
      const subjectInput = document.getElementById('sessionSubject');
      if (subjectInput) subjectInput.focus();
    });
  }

  const homeProfileBtn = document.getElementById('homeProfileBtn');
  if (homeProfileBtn) {
    homeProfileBtn.addEventListener('click', () => {
      activateTab('profile', true);
    });
  }

  // Jump to routine buttons
  document.querySelectorAll('#homeJumpRoutineBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('homeRoutineSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Focus routine subject button from Next-Up strip
  document.querySelectorAll('[data-focus-routine-subject]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subj = btn.getAttribute('data-focus-routine-subject');
      activateTab('tracker', true);
      if (subj) {
        const subjectSelect = document.getElementById('sessionSubject');
        if (subjectSelect) {
          subjectSelect.value = subj;
          subjectSelect.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  // Hero stat clicks
  const homeGoalCard = document.getElementById('homeGoalCard');
  if (homeGoalCard) {
    homeGoalCard.addEventListener('click', () => {
      activateTab('tracker', true);
    });
  }

  const homeStreakCard = document.getElementById('homeStreakCard');
  if (homeStreakCard) {
    homeStreakCard.addEventListener('click', () => {
      activateTab('tracker', true);
    });
  }

  const homeExamCard = document.getElementById('homeExamCard');
  if (homeExamCard) {
    homeExamCard.addEventListener('click', () => {
      activateTab('countdown', true);
    });
  }

  // Quick Action 1: Focus Timer
  const cockpitStartFocus = document.getElementById('cockpitStartFocus');
  if (cockpitStartFocus) {
    cockpitStartFocus.addEventListener('click', () => {
      activateTab('tracker', true);
      const subjectInput = document.getElementById('sessionSubject');
      if (subjectInput) subjectInput.focus();
    });
  }

  // Quick Action 2: 20-Q Model Test
  const cockpitModelTest = document.getElementById('cockpitModelTest');
  if (cockpitModelTest) {
    cockpitModelTest.addEventListener('click', () => {
      activateTab('flashcards', true);
      const quizChip = document.querySelector("#quizFlashSwitch [data-view='quiz']");
      if (quizChip) quizChip.click();
      const examRadio = document.getElementById("mcqModeExam");
      if (examRadio) {
        examRadio.checked = true;
        examRadio.dispatchEvent(new Event('change'));
      }
    });
  }

  // Quick Action 3: Flashcards
  const cockpitFlashcards = document.getElementById('cockpitFlashcards');
  if (cockpitFlashcards) {
    cockpitFlashcards.addEventListener('click', () => {
      activateTab('flashcards', true);
      const flashChip = document.querySelector("#quizFlashSwitch [data-view='flashcards']");
      if (flashChip) flashChip.click();
    });
  }

  // Quick Action 4: Mistake Bank
  const cockpitMistakes = document.getElementById('cockpitMistakes');
  if (cockpitMistakes) {
    cockpitMistakes.addEventListener('click', () => {
      activateTab('flashcards', true);
      const mistakeChip = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
      if (mistakeChip) mistakeChip.click();
    });
  }

  // Quick Action 5: Quick Note
  const cockpitQuickNote = document.getElementById('cockpitQuickNote');
  if (cockpitQuickNote) {
    cockpitQuickNote.addEventListener('click', () => {
      activateTab('notes', true);
      const noteTitleInput = document.getElementById('noteTitle');
      if (noteTitleInput) {
        setTimeout(() => noteTitleInput.focus(), 150);
      }
    });
  }

  // Quick Action 6: Motivational Poster / Wallpaper
  const cockpitMotivation = document.getElementById('cockpitMotivation');
  if (cockpitMotivation) {
    cockpitMotivation.addEventListener('click', () => {
      if (typeof openModal === 'function') {
        openModal('quoteModal');
      }
    });
  }

  // Full Routine jump button
  const homeViewFullRoutineBtn = document.getElementById('homeViewFullRoutineBtn');
  if (homeViewFullRoutineBtn) {
    homeViewFullRoutineBtn.addEventListener('click', () => {
      document.getElementById('homeRoutineSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Plan Routine Now empty state button
  const homePlanRoutineNowBtn = document.getElementById('homePlanRoutineNowBtn');
  if (homePlanRoutineNowBtn) {
    homePlanRoutineNowBtn.addEventListener('click', () => {
      document.getElementById('homeRoutineSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Focus on specific timeline task
  document.querySelectorAll('#homeTimelineList [data-focus-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subj = btn.getAttribute('data-focus-task');
      activateTab('tracker', true);
      if (subj) {
        const subjectSelect = document.getElementById('sessionSubject');
        if (subjectSelect) {
          subjectSelect.value = subj;
          subjectSelect.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  // Syllabus Map jump button
  const homeViewSyllabusBtn = document.getElementById('homeViewSyllabusBtn');
  if (homeViewSyllabusBtn) {
    homeViewSyllabusBtn.addEventListener('click', () => {
      activateTab('syllabus', true);
    });
  }

  // Study Pillar buttons
  document.querySelectorAll('[data-pillar-name]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pName = btn.getAttribute('data-pillar-name');
      activateTab('tracker', true);
      if (pName) {
        const subjectSelect = document.getElementById('sessionSubject');
        if (subjectSelect) {
          subjectSelect.value = pName;
          subjectSelect.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  // Start Model Quiz empty state button
  const homeTakeQuizBtn = document.getElementById('homeTakeQuizBtn');
  if (homeTakeQuizBtn) {
    homeTakeQuizBtn.addEventListener('click', () => {
      activateTab('flashcards', true);
      const quizChip = document.querySelector("#quizFlashSwitch [data-view='quiz']");
      if (quizChip) quizChip.click();
    });
  }

  // Review Mistakes Bank button
  const homeReviewMistakesBtn = document.getElementById('homeReviewMistakesBtn');
  if (homeReviewMistakesBtn) {
    homeReviewMistakesBtn.addEventListener('click', () => {
      activateTab('flashcards', true);
      const mistakeChip = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
      if (mistakeChip) mistakeChip.click();
    });
  }

  // Wallpaper action in motivation strip
  const homeExportWallpaperAction = document.getElementById('homeExportWallpaperAction');
  if (homeExportWallpaperAction) {
    homeExportWallpaperAction.addEventListener('click', () => {
      const tickerText = document.getElementById('tickerText')?.textContent || '';
      if (typeof exportQuoteWallpaper === 'function') {
        exportQuoteWallpaper(tickerText);
      } else if (typeof showToast === 'function') {
        showToast('Generating motivation wallpaper...');
      }
    });
  }
}
