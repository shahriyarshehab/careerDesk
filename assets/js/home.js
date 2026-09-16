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

  // 1. Time-Sensitive Greeting & Formatted Date
  let userName = 'Aspirant';
  try {
    const custom = (typeof getCustomProfile === 'function') ? getCustomProfile() : null;
    const authUser = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    if (custom && custom.displayName) {
      userName = custom.displayName.trim().split(' ')[0];
    } else if (authUser && authUser.displayName) {
      userName = authUser.displayName.trim().split(' ')[0];
    } else {
      const rawCustom = localStorage.getItem('careerdesk_custom_profile_v1');
      const rawUser = localStorage.getItem('careerdesk_auth_user_cache');
      if (rawCustom) {
        const c = JSON.parse(rawCustom);
        if (c && c.displayName) userName = c.displayName.trim().split(' ')[0];
      } else if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.displayName) userName = u.displayName.trim().split(' ')[0];
      }
    }
  } catch (e) { }

  const hour = now.getHours();
  let greeting = `Good Morning, ${userName}!`;
  if (hour >= 12 && hour < 17) greeting = `Good Afternoon, ${userName}!`;
  else if (hour >= 17 && hour < 22) greeting = `Good Evening, ${userName}!`;
  else if (hour >= 22 || hour < 5) greeting = `Night Focus, ${userName}!`;

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

  // 6. Four Core Subject Pillars Data
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

  // 7. Mistake Bank Data
  if (typeof loadMistakes === 'function' && (!mistakes || !mistakes.length)) {
    loadMistakes();
  }
  const pendingMistakes = mistakes || [];

  // 8. Daily Motivation Quote
  let activeQuote = {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  };
  if (state.customQuotes && state.customQuotes.length > 0) {
    const idx = (state.quoteIdx || 0) % state.customQuotes.length;
    activeQuote = state.customQuotes[idx] || activeQuote;
  }

  // BUILD HTML
  container.innerHTML = `
    <div class="home-container">
      <!-- 1. HERO MISSION BRIEFING -->
      <section class="home-hero">
        <div class="home-hero-header">
          <div class="home-hero-greeting-wrap">
            <span class="home-hero-kicker">
              <span class="home-hero-kicker-dot"></span>
              Mission Control &bull; Daily Briefing
            </span>
            <h1 class="home-hero-title">${escapeHtml(greeting)}</h1>
            <p class="home-hero-sub">Welcome to your command dashboard. Every minute of structured preparation compounds into exam mastery.</p>
          </div>
          <div class="home-hero-date-badge">
            <i data-lucide="calendar"></i>
            <span>${escapeHtml(formattedDate)}</span>
          </div>
        </div>

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
      </section>

      <!-- 2. QUICK ACTION COCKPIT -->
      <section class="home-cockpit">
        <div class="home-section-head">
          <span class="home-section-title"><i data-lucide="layout-grid"></i> 1-Tap Action Cockpit</span>
        </div>
        <div class="home-cockpit-grid">
          <!-- Action 1: Focus Timer -->
          <div class="home-cockpit-card" id="cockpitStartFocus" style="--cockpit-color:#06b6d4; --cockpit-bg:rgba(6, 182, 212, 0.12); --cockpit-glow:rgba(6, 182, 212, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="timer"></i></div>
            <div class="home-cockpit-name">Focus Timer</div>
            <div class="home-cockpit-desc">Start deep study session</div>
          </div>

          <!-- Action 2: 20-Q Model Test -->
          <div class="home-cockpit-card" id="cockpitModelTest" style="--cockpit-color:#c084fc; --cockpit-bg:rgba(192, 132, 252, 0.12); --cockpit-glow:rgba(192, 132, 252, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="zap"></i></div>
            <div class="home-cockpit-name">Model Test</div>
            <div class="home-cockpit-desc">20-Q timed exam mode</div>
          </div>

          <!-- Action 3: Flashcards -->
          <div class="home-cockpit-card" id="cockpitFlashcards" style="--cockpit-color:#6366f1; --cockpit-bg:rgba(99, 102, 241, 0.12); --cockpit-glow:rgba(99, 102, 241, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="layers"></i></div>
            <div class="home-cockpit-name">Flashcards</div>
            <div class="home-cockpit-desc">Active recall flip deck</div>
          </div>

          <!-- Action 4: Mistake Bank -->
          <div class="home-cockpit-card" id="cockpitMistakes" style="--cockpit-color:#f43f5e; --cockpit-bg:rgba(244, 63, 94, 0.12); --cockpit-glow:rgba(244, 63, 94, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="alert-circle"></i></div>
            <div class="home-cockpit-name">Mistake Bank</div>
            <div class="home-cockpit-desc">Fix weak-area concepts</div>
          </div>

          <!-- Action 5: Quick Note -->
          <div class="home-cockpit-card" id="cockpitQuickNote" style="--cockpit-color:#f59e0b; --cockpit-bg:rgba(245, 158, 11, 0.12); --cockpit-glow:rgba(245, 158, 11, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="notebook-pen"></i></div>
            <div class="home-cockpit-name">Smart Notes</div>
            <div class="home-cockpit-desc">Record key revision notes</div>
          </div>

          <!-- Action 6: Motivational Poster -->
          <div class="home-cockpit-card" id="cockpitMotivation" style="--cockpit-color:#10b981; --cockpit-bg:rgba(16, 185, 129, 0.12); --cockpit-glow:rgba(16, 185, 129, 0.25);">
            <div class="home-cockpit-icon"><i data-lucide="image"></i></div>
            <div class="home-cockpit-name">Daily Poster</div>
            <div class="home-cockpit-desc">Export 1080p HD wallpaper</div>
          </div>
        </div>
      </section>

      <!-- 3. TWO-COLUMN ADAPTIVE DASHBOARD -->
      <div class="home-columns-grid">
        <!-- LEFT COLUMN: ROUTINE & PRIMARY PILLARS -->
        <div class="home-column">
          <!-- Today's Routine Timeline -->
          <div class="home-widget">
            <div class="home-widget-header">
              <div class="home-widget-title-wrap">
                <i data-lucide="calendar-days"></i>
                <h3 class="home-widget-title">Today's Focus Timeline</h3>
              </div>
              <button type="button" class="home-widget-action" id="homeViewFullRoutineBtn">
                Full Routine <i data-lucide="arrow-right"></i>
              </button>
            </div>

            <div class="home-timeline-list" id="homeTimelineList">
              ${todayRoutine.length === 0 ? `
                <div class="empty-state" style="padding: 24px 16px; margin:0;">
                  <p style="margin:0 0 12px; font-size:13.5px; color:var(--text-soft);">No routine scheduled for today. Create your study blocks to stay on track.</p>
                  <button type="button" class="pill" id="homePlanRoutineNowBtn"><i data-lucide="calendar-plus"></i> Plan Today's Routine</button>
                </div>
              ` : todayRoutine.map(r => {
                const isLive = r.startTime && r.endTime && r.startTime <= nowTimeStr && nowTimeStr <= r.endTime;
                return `
                  <div class="home-timeline-item ${isLive ? 'live-now' : ''}">
                    <div class="home-timeline-left">
                      <span class="home-timeline-time">${escapeHtml(r.startTime)} - ${escapeHtml(r.endTime)}</span>
                      <div class="home-timeline-info">
                        <span class="home-timeline-subject-tag">
                          <span class="home-timeline-dot"></span>
                          ${escapeHtml(r.subject || 'General')}
                        </span>
                        <span class="home-timeline-task" title="${escapeAttr(r.task || '')}">${escapeHtml(r.task || 'Study Session')}</span>
                      </div>
                    </div>
                    <div class="home-timeline-right">
                      ${isLive ? `<span class="home-live-badge"><span class="home-live-pulse"></span> LIVE NOW</span>` : ''}
                      <button type="button" class="pill ${isLive ? '' : 'subtle'} home-timeline-btn" data-focus-task="${escapeAttr(r.subject)}">
                        <i data-lucide="${isLive ? 'play' : 'arrow-right'}"></i>
                        <span>${isLive ? 'Focus Now' : 'Study'}</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Four Primary Pillars Radar -->
          <div class="home-widget">
            <div class="home-widget-header">
              <div class="home-widget-title-wrap">
                <i data-lucide="compass"></i>
                <h3 class="home-widget-title">Core Preparation Pillars</h3>
              </div>
              <button type="button" class="home-widget-action" id="homeViewSyllabusBtn">
                Syllabus Map <i data-lucide="arrow-right"></i>
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

        <!-- RIGHT COLUMN: WEAK-AREA RADAR & MOTIVATION SPOTLIGHT -->
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
              <div class="empty-state" style="padding: 20px 14px; margin:0 0 14px;">
                <p style="margin:0 0 10px; font-size:13px; color:var(--text-soft);">Mistake Bank is clean! Take practice model tests to identify weak spots.</p>
                <button type="button" class="pill" id="homeTakeQuizBtn"><i data-lucide="zap"></i> Start Model Quiz</button>
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

          <!-- Daily Motivation Spotlight -->
          <div class="home-widget">
            <div class="home-widget-header">
              <div class="home-widget-title-wrap">
                <i data-lucide="sparkles"></i>
                <h3 class="home-widget-title">Daily Motivation Spotlight</h3>
              </div>
              <button type="button" class="home-widget-action" id="homeExportWallpaperAction">
                <i data-lucide="image"></i> Wallpaper
              </button>
            </div>

            <div class="home-quote-card">
              <p class="home-quote-text">"${escapeHtml(activeQuote.text || '')}"</p>
              <p class="home-quote-author">&mdash; ${escapeHtml(activeQuote.author || 'CareerDesk Aspirant')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Start live ticking countdown for nearest exam
  startHomeExamCountdown(nearestExam);

  // Bind all interactive click handlers
  bindHomeDashboardEvents();

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
      activateTab('routine', true);
    });
  }

  // Plan Routine Now empty state button
  const homePlanRoutineNowBtn = document.getElementById('homePlanRoutineNowBtn');
  if (homePlanRoutineNowBtn) {
    homePlanRoutineNowBtn.addEventListener('click', () => {
      activateTab('routine', true);
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

  // Wallpaper action in spotlight
  const homeExportWallpaperAction = document.getElementById('homeExportWallpaperAction');
  if (homeExportWallpaperAction) {
    homeExportWallpaperAction.addEventListener('click', () => {
      if (typeof openModal === 'function') {
        openModal('quoteModal');
      }
    });
  }
}
