/* ==========================================================================
   CareerDesk — Routine & Profile Aspirant Hub Engine
   ========================================================================== */

let profileCountdownInterval = null;

/**
 * Main render function for the Daily Study Routine Homepage
 * Homepage is dedicated exclusively to the full-width daily study routine.
 */
function renderHomeDashboard() {
  const container = document.getElementById('panel-home');
  if (!container) return;

  // Refresh integrated Daily Study Routine & Date Slider
  if (typeof initMonthDropdown === 'function') initMonthDropdown();
  if (typeof renderDateSlider === 'function') renderDateSlider();
  if (typeof renderRoutine === 'function') renderRoutine();
  if (typeof updateMonthYearPlaceholder === 'function') updateMonthYearPlaceholder();
  if (typeof restoreRoutineSubNav === 'function') restoreRoutineSubNav();

  // Create Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Renders the Aspirant Hub & Mission Control Dashboard on the Profile Page
 * Includes: Daily Focus Target, Streak, Nearest Target Exam Countdown,
 * 4 Core Preparation Pillars (Bangla, English, Math, GK), Weak-Area Radar,
 * and Motivational Quote Wallpaper Generator.
 */
function renderProfileAspirantHub() {
  const container = document.getElementById('profileAspirantHub');
  if (!container) return;

  const now = new Date();
  const today = dateKey(now.getTime());

  // 1. Study Goal Progress Today
  const todaySessions = (state.sessions || []).filter(s => dateKey(s.start) === today);
  const studiedMinsToday = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const targetMins = state.dailyTargetMinutes || 240;
  const goalPct = Math.min(100, Math.round((studiedMinsToday / targetMins) * 100));

  const studiedH = Math.floor(studiedMinsToday / 60);
  const studiedM = studiedMinsToday % 60;
  const targetH = Math.floor(targetMins / 60);
  const targetM = targetMins % 60;

  // 2. Study Streak Calculation
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

  // 3. Upcoming Target Exam
  if (typeof loadExams === 'function' && (!exams || !exams.length)) {
    loadExams();
  }
  const getExamMs = e => (typeof parseExamTargetMs === 'function' ? parseExamTargetMs(e.targetDate) : new Date(e.targetDate).getTime());
  const upcomingExams = (exams || []).filter(e => getExamMs(e) > Date.now())
    .sort((a, b) => getExamMs(a) - getExamMs(b));
  const nearestExam = upcomingExams[0] || null;

  // 4. Primary Core Subject Pillars Data (Adaptive to Student vs Job Seeker)
  const track = typeof getUserTrack === 'function' ? getUserTrack() : { role: 'job_seeker', subjectLanguage: 'en' };
  const currentLang = track.subjectLanguage || 'en';
  const deletedPillarSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
  let primaryPillars = [];

  if (track.role === 'student' && typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) {
    const classObj = BANGLADESH_CURRICULUM_DATA.classes.find(c => c.id === track.studentClass) || BANGLADESH_CURRICULUM_DATA.classes[3];
    const topClassSubs = (classObj.subjects || []).filter(s => !deletedPillarSet.has(canonicalSubjectName(s).toLowerCase())).slice(0, 4);
    primaryPillars = topClassSubs.map(s => {
      const canon = canonicalSubjectName(s);
      const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { bn: canon, color: '#6366f1' };
      const displayName = typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(canon, currentLang) : (currentLang === 'bn' ? meta.bn : canon);
      return {
        name: canon,
        displayName: displayName,
        bn: meta.bn,
        color: meta.color,
        bg: `${meta.color}1f`
      };
    });
  } else {
    // Exactly the 4 foundational core subjects for Job Seekers (filtered by deletedSubjects)
    primaryPillars = [
      { name: 'Bangla', displayName: currentLang === 'bn' ? 'বাংলা' : 'Bangla', bn: 'বাংলা', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
      { name: 'English', displayName: currentLang === 'bn' ? 'ইংরেজি' : 'English', bn: 'ইংরেজি', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
      { name: 'Mathematics', displayName: currentLang === 'bn' ? 'গণিত' : 'Mathematics', bn: 'গণিত', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
      { name: 'General Knowledge', displayName: currentLang === 'bn' ? 'সাধারণ জ্ঞান' : 'General Knowledge', bn: 'সাধারণ জ্ঞান', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
    ].filter(p => !deletedPillarSet.has(canonicalSubjectName(p.name).toLowerCase()));
  }

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

  // 5. Mistake Bank Data
  if (typeof loadMistakes === 'function' && (!mistakes || !mistakes.length)) {
    loadMistakes();
  }
  const pendingMistakes = mistakes || [];

  // Generate Profile Aspirant Hub HTML
  container.innerHTML = `
    <!-- ASPIRANT HUB HEADER ROW -->
    <div style="margin: 0 0 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 3px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="compass" style="width: 18px; height: 18px; color: var(--accent2);"></i>
          <span>Aspirant Mission Control</span>
        </h3>
        <span style="font-size: 12.5px; color: var(--text-soft);">Today's focus metrics, core syllabus pillars, and weak-area radar</span>
      </div>
      <div class="btn-group">
        <button type="button" class="pill subtle" id="profileViewExamsBtn" style="font-size: 12px; padding: 5px 12px;">
          <i data-lucide="calendar-clock"></i> <span>Manage Exams</span>
        </button>
        <button type="button" class="pill subtle" id="profileViewSyllabusBtn" style="font-size: 12px; padding: 5px 12px;">
          <i data-lucide="book-marked"></i> <span>Syllabus Map</span>
        </button>
      </div>
    </div>

    <!-- 1. DYNAMIC TODAY & TARGET METRICS CARDS -->
    <div class="home-hero-stats" style="margin-bottom: 20px;">
      <!-- Daily Goal Progress -->
      <div class="home-stat-card" id="profileGoalCard" style="cursor:pointer;" title="Click to view Tracker &amp; Focus">
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

      <!-- Consistency Streak -->
      <div class="home-stat-card" id="profileStreakCard" style="cursor:pointer;" title="Click to view Study Heatmap">
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

      <!-- Nearest Target Exam Countdown -->
      <div class="home-stat-card" id="profileExamCard" style="cursor:pointer;" title="Click to view Exam Countdowns">
        <div class="home-stat-header">
          <span class="home-stat-label">Nearest Target Exam</span>
          <span class="home-stat-icon exam-icon"><i data-lucide="calendar-clock"></i></span>
        </div>
        <div class="home-stat-value" id="profileExamCountdownTime" style="font-family:var(--font-mono); font-size:19px; letter-spacing:0.2px;">
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

    <!-- 2. TWO-COLUMN BALANCED WIDGETS: PILLARS & RADAR -->
    <div class="home-columns-grid">
      <!-- COLUMN 1: CORE PREPARATION PILLARS -->
      <div class="home-column">
        <div class="home-widget">
          <div class="home-widget-header">
            <div class="home-widget-title-wrap">
              <i data-lucide="compass"></i>
              <h3 class="home-widget-title">Core Preparation Pillars</h3>
            </div>
            <button type="button" class="home-widget-action" id="profilePillarsSyllabusBtn">
              <span>Syllabus Map</span> <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <div class="home-pillars-grid">
            ${pillarStats.map(p => {
              const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(p.name) : { icon: 'book-open' };
              return `
                <div class="home-pillar-card" style="--pillar-color: ${p.color};">
                  <div class="home-pillar-head">
                    <span class="home-pillar-title" style="display:inline-flex; align-items:center; gap:7px;">
                      <span class="home-pillar-icon" style="color: ${p.color}; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
                      </span>
                      <span>${escapeHtml(p.displayName || p.name)}</span>
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
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- COLUMN 2: WEAK-AREA RADAR & ACTIONABLE REMEDIATION -->
      <div class="home-column">
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
              <button type="button" class="pill solid" id="profileTakeQuizBtn" style="padding:8px 18px; font-size:12.5px;"><i data-lucide="zap"></i> Start Model Quiz</button>
            </div>
          ` : `
            <div class="home-mistake-list">
              ${pendingMistakes.slice(0, 3).map(m => {
                const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(m.subject) : { icon: 'target' };
                return `
                  <div class="home-mistake-item">
                    <div class="home-mistake-item-q">${escapeHtml(m.q || 'Question')}</div>
                    <div class="home-mistake-item-meta">
                      <span class="home-mistake-tag" style="display:inline-flex; align-items:center; gap:4px;">
                        <i data-lucide="${meta.icon || 'target'}" style="width:11px; height:11px;"></i>
                        <span>${escapeHtml(m.subject || 'BCS')}</span>
                      </span>
                      <span>Correct: <strong>${escapeHtml(m.correctAns || 'N/A')}</strong></span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <button type="button" class="pill danger" id="profileReviewMistakesBtn" style="width:100%; justify-content:center; font-size:12.5px; margin-top:8px;">
              <i data-lucide="refresh-cw"></i> Practice Mistake Bank (${pendingMistakes.length})
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Start live ticking countdown for nearest exam
  startProfileExamCountdown(nearestExam);

  // Bind interactive click handlers
  bindProfileAspirantHubEvents();

  // Create Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Live ticking clock for nearest exam
 */
function startProfileExamCountdown(nearestExam) {
  if (profileCountdownInterval) {
    clearInterval(profileCountdownInterval);
    profileCountdownInterval = null;
  }

  const el = document.getElementById('profileExamCountdownTime') || document.getElementById('homeExamCountdownTime');
  if (!el) return;

  if (!nearestExam) {
    el.textContent = 'None Set';
    return;
  }

  function update() {
    const elLive = document.getElementById('profileExamCountdownTime') || document.getElementById('homeExamCountdownTime');
    if (!elLive) return;

    const targetMs = typeof parseExamTargetMs === 'function' ? parseExamTargetMs(nearestExam.targetDate) : new Date(nearestExam.targetDate).getTime();
    const diff = targetMs - Date.now();
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
  profileCountdownInterval = setInterval(update, 1000);
}

// Backward compatibility alias
function startHomeExamCountdown(nearestExam) {
  startProfileExamCountdown(nearestExam);
}

/**
 * Event bindings for Profile Aspirant Hub tiles and action buttons
 */
function bindProfileAspirantHubEvents() {
  const profileGoalCard = document.getElementById('profileGoalCard');
  if (profileGoalCard) {
    profileGoalCard.addEventListener('click', () => {
      activateTab('tracker', true);
    });
  }

  const profileStreakCard = document.getElementById('profileStreakCard');
  if (profileStreakCard) {
    profileStreakCard.addEventListener('click', () => {
      activateTab('tracker', true);
    });
  }

  const profileExamCard = document.getElementById('profileExamCard');
  if (profileExamCard) {
    profileExamCard.addEventListener('click', () => {
      activateTab('countdown', true);
    });
  }

  const profileViewExamsBtn = document.getElementById('profileViewExamsBtn');
  if (profileViewExamsBtn) {
    profileViewExamsBtn.addEventListener('click', () => {
      activateTab('countdown', true);
    });
  }

  const profileViewSyllabusBtn = document.getElementById('profileViewSyllabusBtn');
  if (profileViewSyllabusBtn) {
    profileViewSyllabusBtn.addEventListener('click', () => {
      activateTab('syllabus', true);
    });
  }

  const profilePillarsSyllabusBtn = document.getElementById('profilePillarsSyllabusBtn');
  if (profilePillarsSyllabusBtn) {
    profilePillarsSyllabusBtn.addEventListener('click', () => {
      activateTab('syllabus', true);
    });
  }

  // Study Pillar buttons: selects subject in Tracker and switches to it
  document.querySelectorAll('#profileAspirantHub [data-pillar-name]').forEach(btn => {
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
  const profileTakeQuizBtn = document.getElementById('profileTakeQuizBtn');
  if (profileTakeQuizBtn) {
    profileTakeQuizBtn.addEventListener('click', () => {
      activateTab('flashcards', true);
      const quizChip = document.querySelector("#quizFlashSwitch [data-view='quiz']");
      if (quizChip) quizChip.click();
    });
  }

  // Review Mistakes Bank button
  const profileReviewMistakesBtn = document.getElementById('profileReviewMistakesBtn');
  if (profileReviewMistakesBtn) {
    profileReviewMistakesBtn.addEventListener('click', () => {
      activateTab('flashcards', true);
      const mistakeChip = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
      if (mistakeChip) mistakeChip.click();
    });
  }
}

// Ensure global scope
window.renderHomeDashboard = renderHomeDashboard;
window.renderProfileAspirantHub = renderProfileAspirantHub;
window.startProfileExamCountdown = startProfileExamCountdown;
window.startHomeExamCountdown = startHomeExamCountdown;
