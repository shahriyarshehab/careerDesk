/* ==========================================================================
   CareerDesk — Main Application Entry: Themes, Modals, Tabs Router & Init
   ========================================================================== */

// ===== Theme settings =====
// One glass theme ships with the app, in a dark and a light mode: anything
// other than 'light' resolves to the dark default, so no stale value (a saved
// theme name, an old link) can put the app in a theme that no longer exists.
function setTheme(newTheme) {
  state.theme = newTheme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  syncThemeButtons();
  saveData();
}
function syncThemeButtons() {
  const currentTheme = state.theme || 'dark';
  const darkBtn = document.getElementById('themeDarkBtn');
  const lightBtn = document.getElementById('themeLightBtn');
  if (darkBtn && lightBtn) {
    const isDark = currentTheme !== 'light';
    darkBtn.classList.toggle('active', isDark);
    darkBtn.classList.toggle('active-theme', isDark);
    darkBtn.setAttribute('aria-pressed', String(isDark));
    lightBtn.classList.toggle('active', !isDark);
    lightBtn.classList.toggle('active-theme', !isDark);
    lightBtn.setAttribute('aria-pressed', String(!isDark));
  }
  syncWatchControls();
}
const darkBtn = document.getElementById('themeDarkBtn');
if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
const lightBtn = document.getElementById('themeLightBtn');
if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

// ===== Fullscreen & Theme watch controls =====
function syncWatchControls() {
  const fullscreenBtn = document.getElementById('watchFullscreenToggle');
  if (fullscreenBtn) {
    const isFull = !!document.fullscreenElement;
    const fullscreenLabel = isFull ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreenBtn.title = fullscreenLabel;
    fullscreenBtn.setAttribute('aria-label', fullscreenLabel);
    fullscreenBtn.innerHTML = `<i data-lucide="${isFull ? 'minimize' : 'maximize'}"></i>`;
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
  } else {
    document.exitFullscreen().catch(() => { });
  }
}

const fullscreenToggleSettings = document.getElementById('fullscreenToggleSettings');
if (fullscreenToggleSettings) fullscreenToggleSettings.addEventListener('click', toggleFullscreen);

const watchFullscreenToggle = document.getElementById('watchFullscreenToggle');
if (watchFullscreenToggle) watchFullscreenToggle.addEventListener('click', toggleFullscreen);

// Zoom toggle
const zoomBtn = document.getElementById('zoomToggleBtn');
if (zoomBtn) {
  zoomBtn.addEventListener('click', () => {
    document.body.classList.toggle('zoomed');
  });
}
document.addEventListener('fullscreenchange', syncWatchControls);
syncWatchControls();

// ===== Generic modal handling =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    el.classList.add('open');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    el.style.display = 'none';
  }
}
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) { closeModal(closeBtn.dataset.close); return; }
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) { e.target.classList.remove('open'); }
});

// ===== Quick Command Palette (Alt + /) =====
function initCommandPalette() {
  const input = document.getElementById('paletteSearchInput');
  const results = document.getElementById('paletteResults');
  const container = document.getElementById('commandPaletteBtn');
  const resultsPanel = document.getElementById('commandPaletteResults');
  if (!container || !input || !results || !resultsPanel) return;

  let selectedIndex = 0;
  let currentItems = [];

  const staticCommands = [
    { id: 'tab-home', category: 'Navigation', icon: 'layout-dashboard', title: 'Go to Dashboard', subtitle: 'Overview, analytics & quick stats', action: () => activateTab('home', true) },
    { id: 'tab-routine', category: 'Navigation', icon: 'calendar-check', title: 'Go to Rutine', subtitle: 'Daily study schedule', action: () => activateTab('routine', true) },
    { id: 'tab-tracker', category: 'Navigation', icon: 'timer', title: 'Go to Tracker & Focus', subtitle: 'Pomodoro timer & activity stats', action: () => activateTab('tracker', true) },
    { id: 'tab-quiz', category: 'Navigation', icon: 'brain', title: 'Go to BCS & Govt MCQ Quiz', subtitle: 'Practice randomized MCQs & model tests', action: () => activateTab('quiz', true) },
    { id: 'tab-countdown', category: 'Navigation', icon: 'calendar-clock', title: 'Go to Exam Targets', subtitle: 'Exam countdowns & milestones', action: () => activateTab('countdown', true) },
    { id: 'tab-syllabus', category: 'Navigation', icon: 'list-checks', title: 'Go to Syllabus', subtitle: 'BCS syllabus & topic progress', action: () => activateTab('syllabus', true) },
    { id: 'tab-subjects', category: 'Navigation', icon: 'layers', title: 'Open Subject Manager', subtitle: 'Manage subjects from Settings', action: () => { activateTab('settings', true); setTimeout(() => document.getElementById('profileSubjectsCockpitCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); } },
    { id: 'tab-profile', category: 'Navigation', icon: 'user', title: 'Go to User Profile', subtitle: 'Personal profile, study track & subjects', action: () => activateTab('profile', true) },
    { id: 'tab-settings', category: 'Navigation', icon: 'settings-2', title: 'Go to Settings & Sync', subtitle: 'Workspace preferences, cloud sync & backups', action: () => activateTab('settings', true) },
    { id: 'tab-groupchat', category: 'Navigation', icon: 'messages-square', title: 'Go to Group Chat', subtitle: 'Join public study groups and chat in real time', action: () => activateTab('groupchat', true) },
    {
      id: 'act-pomodoro', category: 'Actions', icon: 'zap', title: 'Start 25m Pomodoro Focus', subtitle: 'Start 25-min deep focus session',
      action: () => {
        activateTab('tracker', true);
        const dur25 = document.querySelector('.chip[data-duration="25"]');
        if (dur25) dur25.click();
        const sBtn = document.getElementById('startBtn');
        if (sBtn && sBtn.style.display !== 'none') sBtn.click();
      }
    },
    {
      id: 'act-stop-timer', category: 'Actions', icon: 'square', title: 'Stop Active Timer', subtitle: 'End current session or countdown',
      action: () => {
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn && stopBtn.style.display !== 'none') stopBtn.click();
        else if (window.isCustomCountdownActive && typeof stopCustomCountdown === 'function') stopCustomCountdown(false);
      }
    },

    {
      id: 'act-add-routine', category: 'Actions', icon: 'calendar-plus', title: 'Add Study Block', subtitle: 'Insert new study session into today',
      action: () => {
        activateTab('routine', true);
        setTimeout(() => {
          const addBtn = document.getElementById('inlineAddRowBtn');
          if (addBtn) addBtn.click();
        }, 150);
      }
    },
    {
      id: 'act-theme-dark', category: 'Themes', icon: 'moon', title: 'Theme: Dark', subtitle: 'Default navy glassmorphism with indigo & cyan',
      action: () => setTheme('dark')
    },
    {
      id: 'act-theme-light', category: 'Themes', icon: 'sun', title: 'Theme: Light', subtitle: 'Daytime frosted glass with crisp borders',
      action: () => setTheme('light')
    },
    {
      id: 'act-fullscreen', category: 'Actions', icon: 'maximize', title: 'Toggle Fullscreen', subtitle: 'Distraction-free fullscreen view',
      action: () => {
        toggleFullscreen();
      }
    }
  ];

  function showPalette() {
    resultsPanel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    selectedIndex = 0;
    renderItems(input.value);
    positionResultsPanel();
  }

  function openPalette() {
    showPalette();
    input.focus();
  }

  function closePalette() {
    resultsPanel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.blur();
  }

  function togglePalette() {
    if (resultsPanel.hidden) openPalette();
    else closePalette();
  }

  function positionResultsPanel() {
    const searchBounds = container.getBoundingClientRect();
    resultsPanel.style.setProperty('left', `${searchBounds.left}px`, 'important');
    resultsPanel.style.setProperty('top', `${searchBounds.bottom + 8}px`, 'important');
    resultsPanel.style.setProperty('width', `${searchBounds.width}px`, 'important');
    resultsPanel.style.setProperty('right', 'auto', 'important');
    resultsPanel.style.setProperty('transform', 'none', 'important');
  }

  function renderItems(query) {
    const q = query.trim().toLowerCase();
    let matched = [];

    if (!q) {
      matched = [...staticCommands];
    } else {
      matched = staticCommands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q));


      if (Array.isArray(state.syllabus)) {
        state.syllabus.forEach(cat => {
          if (Array.isArray(cat.topics)) {
            cat.topics.forEach(topic => {
              if (topic.name && topic.name.toLowerCase().includes(q)) {
                matched.push({
                  id: 'topic-' + topic.id,
                  category: 'Syllabus: ' + cat.name,
                  icon: 'list-checks',
                  title: topic.name,
                  subtitle: topic.done ? '✓ Completed' : 'Pending',
                  action: () => {
                    activateTab('syllabus', true);
                    setTimeout(() => {
                      const el = document.querySelector(`[data-topic="${topic.id}"]`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                });
              }
            });
          }
        });
      }
    }

    currentItems = matched;
    if (selectedIndex >= currentItems.length) selectedIndex = 0;

    if (!currentItems.length) {
      results.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">No matching commands or topics found.</div>';
      return;
    }

    let html = '';
    let lastCat = '';
    currentItems.forEach((item, idx) => {
      if (item.category !== lastCat) {
        html += `<div class="palette-section-title">${escapeHtml(item.category)}</div>`;
        lastCat = item.category;
      }
      const isSel = idx === selectedIndex ? 'selected' : '';
      html += `
        <div class="palette-item ${isSel}" data-index="${idx}" role="option" aria-selected="${idx === selectedIndex}">
          <div class="palette-item-left">
            <span class="palette-item-icon"><i data-lucide="${item.icon}"></i></span>
            <div>
              <span class="palette-item-title">${escapeHtml(item.title)}</span>
              <span class="palette-item-subtitle">${escapeHtml(item.subtitle)}</span>
            </div>
          </div>
          ${item.id.startsWith('tab-') ? '<span class="palette-item-shortcut">Tab</span>' : ''}
        </div>
      `;
    });

    results.innerHTML = html;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    const selEl = results.querySelector('.palette-item.selected');
    if (selEl) selEl.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', (e) => {
    selectedIndex = 0;
    renderItems(e.target.value);
  });
  input.addEventListener('focus', showPalette);
  container.addEventListener('click', (e) => {
    if (e.target.closest('#shortcutsHelpBtn')) return;
    if (e.target !== input) input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        renderItems(input.value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        renderItems(input.value);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItems[selectedIndex]) {
        const act = currentItems[selectedIndex].action;
        closePalette();
        if (act) act();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  });

  results.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.palette-item');
    if (itemEl && itemEl.dataset.index) {
      const idx = parseInt(itemEl.dataset.index);
      if (currentItems[idx]) {
        const act = currentItems[idx].action;
        closePalette();
        if (act) act();
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const isEditing = target?.closest('input, textarea, select, [contenteditable="true"]');
    const isPaletteShortcut = e.key === '/' || e.key === '?' || e.code === 'Slash';
    if (!e.defaultPrevented && e.altKey && !e.ctrlKey && !e.metaKey && isPaletteShortcut && !isEditing) {
      e.preventDefault();
      togglePalette();
    }
  });

  window.addEventListener('resize', () => {
    if (!resultsPanel.hidden) positionResultsPanel();
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && !resultsPanel.contains(e.target)) closePalette();
  });
}

// ===== Init =====
(async function init() {
  await loadData();
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');
    if (urlTheme && ['dark', 'light'].includes(urlTheme)) {
      state.theme = urlTheme;
    }
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  await initAutoSync();
  syncThemeButtons();
  initMonthDropdown();
  renderDateSlider();
  renderRoutine();
  renderQuote();
  renderQuoteManager();
  startQuoteRotation();
  renderTrackerAll();
  renderCategories();
  syncAllSubjectSelects();
  if (typeof renderFlashcards === 'function') renderFlashcards();

  loadExams();
  renderExams();
  update24hActivityUI();
  loadMistakes();

  initMCQEngine();
  renderMistakes();
  initCommandPalette();
  renderStudyHeatmap();
  syncMiniTimerWidget();
  updateTopbarClock();

  // Unified application 1-second heartbeat (synchronizes study timer and target countdowns)
  tickInterval = setInterval(() => {
    tickTimer();
    renderExams();
    updateTopbarClock();
  }, 1000);

  if (typeof renderHomeDashboard === 'function') {
    renderHomeDashboard();
  }

  if (typeof renderUserProfileUI === 'function') {
    renderUserProfileUI();
  }

  if (typeof renderProfileAspirantHub === 'function') {
    renderProfileAspirantHub();
  }

  checkFirstTimeUser();

  if (window.lucide) {
    lucide.createIcons();
  }

  // Feature #14: Keyboard Shortcuts Panel
  initKeyboardShortcutsPanel();


  // Topbar Profile Logo Button (navigates to Profile & Desk)
  const topbarProfileBtn = document.getElementById('topbarProfileBtn');
  if (topbarProfileBtn) {
    topbarProfileBtn.addEventListener('click', () => {
      if (typeof activateTab === 'function') {
        activateTab('profile', true);
      }
    });
  }
  if (typeof syncTopbarProfileAvatar === 'function') {
    syncTopbarProfileAvatar();
  }

  // Feature #4: MCQ Quick Subject Pre-Filter
  initMCQQuickFilter();
})();

const topbarClockTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit'
});
function updateTopbarClock() {
  const timeEl = document.getElementById('topbarClockTime');
  if (!timeEl) return;

  const now = new Date();
  timeEl.dateTime = now.toISOString();
  timeEl.textContent = topbarClockTimeFormatter.format(now);
}

/* ==========================================================================
   Feature #14 — Keyboard Shortcuts Panel
   ========================================================================== */
function initKeyboardShortcutsPanel() {
  const modal = document.getElementById('keyboardShortcutsModal');
  const body = document.getElementById('shortcutsModalBody');
  const closeBtn = document.getElementById('closeShortcutsModal');
  const triggerBtn = document.getElementById('shortcutsHelpBtn');
  const searchInput = document.getElementById('shortcutSearchInput');
  const searchClear = document.getElementById('shortcutSearchClear');
  if (!modal || !body) return;

  const SHORTCUT_GROUPS = [
    {
      group: 'Navigation',
      icon: 'compass',
      shortcuts: [
        { keys: ['Alt', '1'], desc: 'Go to Home & Daily Routine', run: () => activateTab('home', true) },
        { keys: ['Alt', '2'], desc: 'Go to Tracker & Focus', run: () => activateTab('tracker', true) },
        { keys: ['Alt', '3'], desc: 'Go to Quiz & Flashcards', run: () => activateTab('quiz', true) },
        { keys: ['Alt', '4'], desc: 'Go to Exam Targets', run: () => activateTab('countdown', true) },
        { keys: ['Alt', '5'], desc: 'Go to Syllabus', run: () => activateTab('syllabus', true) },
        { keys: ['Alt', '6'], desc: 'Go to Profile', run: () => activateTab('profile', true) },
        { keys: ['Alt', '7'], desc: 'Go to Settings & Sync', run: () => activateTab('settings', true) },
      ]
    },
    {
      group: 'Quick Actions',
      icon: 'zap',
      shortcuts: [
        { keys: ['Alt', '/'], desc: 'Open Command Palette', run: () => document.getElementById('paletteSearchInput')?.focus() },
        { keys: ['?'], desc: 'Open Keyboard Shortcuts Panel', run: () => openShortcuts() },
        {
          keys: ['F'], desc: 'Toggle Fullscreen',
          run: () => { if (typeof toggleFullscreen === 'function') toggleFullscreen(); }
        },
        {
          keys: ['T'], desc: 'Toggle Dark / Light Theme',
          run: () => setTheme((document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark')
        },
      ]
    },
    {
      group: 'Study Timer',
      icon: 'timer',
      shortcuts: [
        {
          keys: ['Space'], desc: 'Start / Stop focus timer (when on Tracker tab)',
          run: () => {
            activateTab('tracker', true);
            setTimeout(() => {
              const start = document.getElementById('startBtn');
              const stop = document.getElementById('stopBtn');
              if (start && start.offsetParent !== null) start.click();
              else if (stop && stop.offsetParent !== null) stop.click();
            }, 80);
          }
        },
        { keys: ['Escape'], desc: 'Close any open modal or overlay', run: () => {} },
      ]
    }
  ];

  /* Rows are runnable: clicking one performs what the keys would do, then the
     panel closes. Matching is by the original group/shortcut index so filtering
     never shifts the action attached to a row. */
  const matchesQuery = (shortcut, query) => !query
    || [shortcut.desc, ...shortcut.keys].join(' ').toLowerCase().includes(query);

  function renderShortcutsBody() {
    const query = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
    const groups = SHORTCUT_GROUPS
      .map((grp, gi) => ({
        group: grp.group,
        icon: grp.icon,
        gi,
        shortcuts: grp.shortcuts
          .map((s, si) => ({ ...s, si }))
          .filter(s => matchesQuery(s, query))
      }))
      .filter(grp => grp.shortcuts.length);

    if (!groups.length) {
      body.innerHTML = `
        <div class="shortcut-empty">
          <i data-lucide="search-x" aria-hidden="true"></i>
          <p>No shortcut matches <b>“${escapeHtml(query)}”</b></p>
          <span>Try a key such as <kbd class="keycap keycap-inline">Alt</kbd> or a word like “theme”.</span>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    body.innerHTML = groups.map(grp => `
      <section class="shortcut-group">
        <div class="shortcut-group-head">
          <span class="shortcut-group-icon" aria-hidden="true"><i data-lucide="${grp.icon}"></i></span>
          <span class="shortcut-group-title">${escapeHtml(grp.group)}</span>
          <span class="shortcut-group-count">${grp.shortcuts.length}</span>
        </div>
        <div class="shortcut-list">
          ${grp.shortcuts.map(s => `
            <button type="button" class="shortcut-row" data-group="${grp.gi}" data-shortcut="${s.si}" title="Run this shortcut">
              <span class="shortcut-desc">${escapeHtml(s.desc)}</span>
              <span class="shortcut-keys">
                ${s.keys.map((k, i) => `${i ? '<span class="shortcut-plus" aria-hidden="true">+</span>' : ''}<kbd class="keycap">${escapeHtml(k)}</kbd>`).join('')}
              </span>
            </button>
          `).join('')}
        </div>
      </section>
    `).join('');
    if (window.lucide) lucide.createIcons();
  }

  function openShortcuts() {
    if (searchInput) {
      searchInput.value = '';
      if (searchClear) searchClear.hidden = true;
    }
    renderShortcutsBody();
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('open');
    if (window.lucide) lucide.createIcons();
    if (searchInput) setTimeout(() => { if (modal.classList.contains('open')) searchInput.focus(); }, 60);
  }

  function closeShortcuts() {
    modal.classList.remove('open');
    setTimeout(() => { if (!modal.classList.contains('open')) modal.style.display = 'none'; }, 180);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchClear) searchClear.hidden = !searchInput.value;
      renderShortcutsBody();
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (searchInput.value) {
        searchInput.value = '';
        if (searchClear) searchClear.hidden = true;
        renderShortcutsBody();
      } else {
        closeShortcuts();
      }
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.hidden = true;
      renderShortcutsBody();
      searchInput.focus();
    });
  }

  body.addEventListener('click', e => {
    const row = e.target.closest('.shortcut-row');
    if (!row) return;
    const grp = SHORTCUT_GROUPS[Number(row.dataset.group)];
    const shortcut = grp && grp.shortcuts[Number(row.dataset.shortcut)];
    if (!shortcut) return;
    closeShortcuts();
    if (typeof shortcut.run === 'function') setTimeout(() => shortcut.run(), 120);
  });

  if (triggerBtn) triggerBtn.addEventListener('click', openShortcuts);
  if (closeBtn) closeBtn.addEventListener('click', closeShortcuts);
  modal.addEventListener('click', e => { if (e.target === modal) closeShortcuts(); });

  // Global keyboard shortcuts
  window.addEventListener('keydown', e => {
    // Don't fire inside input/textarea/select
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    // ? = open shortcuts panel
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (modal.classList.contains('open')) closeShortcuts();
      else openShortcuts();
    }
    // F = toggle fullscreen
    if (e.key === 'f' || e.key === 'F') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleFullscreen(); }
    }
    // T = toggle theme
    if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setTheme(state.theme === 'dark' ? 'light' : 'dark'); }
    }
    // Escape = close open modals
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal) { openModal.classList.remove('open'); setTimeout(() => { openModal.style.display = 'none'; }, 180); }
    }
    // Alt + Number = navigate tabs
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const tabMap = { '1': 'home', '2': 'tracker', '3': 'quiz', '4': 'countdown', '5': 'syllabus', '6': 'profile', '7': 'settings' };
      if (tabMap[e.key]) { e.preventDefault(); activateTab(tabMap[e.key], true); }
    }
  });
}

// Remove legacy Daily Journal entries from older versions of CareerDesk.
try { localStorage.removeItem('careerdesk_daily_journal_v1'); } catch (e) {}

/* ==========================================================================
   Feature #4 — MCQ Quick Subject Pre-Filter
   ========================================================================== */
function initMCQQuickFilter() {
  const selectEl = document.getElementById('mcqQuickSubjectSelect');
  const countLabel = document.getElementById('mcqFilterCountLabel');
  const quickFilter = document.getElementById('mcqQuickFilter');
  if (!selectEl) return;

  function populateSubjectOptions() {
    const subjects = typeof getDistinctMCQSubjects === 'function'
      ? getDistinctMCQSubjects()
      : (typeof masterSubjectList === 'function' ? masterSubjectList(false) : []);
    selectEl.innerHTML = '<option value="all">All Subjects (30 Active / 1,000 Bank)</option>' +
      subjects.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('') +
      '<option value="custom">Custom Questions</option>';
  }

  function updateCountLabel(selectedSubject) {
    if (!countLabel) return;
    const masteredCount = (typeof userMCQProgress !== 'undefined' && Array.isArray(userMCQProgress.masteredIds))
      ? userMCQProgress.masteredIds.length : 0;
    const activeCount = (typeof activeExamPool !== 'undefined') ? activeExamPool.length : 30;
    countLabel.textContent = `${activeCount} Active / 1,000 Bank • ${masteredCount} Mastered`;
  }

  selectEl.addEventListener('change', () => {
    const selected = selectEl.value;
    updateCountLabel(selected);
    // Sync with the existing filter bar in practice mode
    if (typeof filterMCQPoolBySubject === 'function') {
      // Update active filter pill to match
      const filterBar = document.getElementById('filter-bar');
      if (filterBar) {
        filterBar.querySelectorAll('.filter-pill').forEach(pill => {
          pill.classList.toggle('active', pill.dataset.subject === selected);
        });
      }
      filterMCQPoolBySubject(selected);
    }
    showToast(`Filter set: ${selected === 'all' ? 'All Subjects' : (selected === 'custom' ? 'Custom Questions' : selected)}`);
  });

  // Hide when exam mode is active
  if (quickFilter) {
    const observer = new MutationObserver(() => {
      const modeBanner = document.getElementById('mode-banner');
      const isExam = modeBanner && modeBanner.classList.contains('active');
      quickFilter.style.display = isExam ? 'none' : 'flex';
    });
    const modeBanner = document.getElementById('mode-banner');
    if (modeBanner) observer.observe(modeBanner, { attributes: true, attributeFilter: ['class'] });
  }

  // Populate after all subjects are loaded
  setTimeout(() => {
    populateSubjectOptions();
    updateCountLabel('all');
  }, 400);
}
