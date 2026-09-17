/* ==========================================================================
   CareerDesk — Main Application Entry: Themes, Modals, Tabs Router & Init
   ========================================================================== */

// ===== Theme settings =====
function setTheme(newTheme) {
  state.theme = newTheme;
  document.documentElement.setAttribute('data-theme', state.theme);
  syncThemeButtons();
  saveData();
}
function syncThemeButtons() {
  const darkBtn = document.getElementById('themeDarkBtn');
  const lightBtn = document.getElementById('themeLightBtn');
  if (darkBtn && lightBtn) {
    const isDark = state.theme === 'dark';
    darkBtn.classList.toggle('active', isDark);
    darkBtn.classList.toggle('active-theme', isDark);
    lightBtn.classList.toggle('active', !isDark);
    lightBtn.classList.toggle('active-theme', !isDark);
  }
  syncWatchControls();
}
const darkBtn = document.getElementById('themeDarkBtn');
if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
const lightBtn = document.getElementById('themeLightBtn');
if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

// ===== Fullscreen & Theme watch controls =====
function syncWatchControls() {
  const themeBtn = document.getElementById('watchThemeToggle');
  const fullscreenBtn = document.getElementById('watchFullscreenToggle');
  if (themeBtn) {
    const isDark = state.theme === 'dark';
    const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeBtn.title = themeLabel;
    themeBtn.setAttribute('aria-label', themeLabel);
    themeBtn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
  }
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

const watchThemeToggle = document.getElementById('watchThemeToggle');
if (watchThemeToggle) {
  watchThemeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
}

const watchFullscreenToggle = document.getElementById('watchFullscreenToggle');
if (watchFullscreenToggle) watchFullscreenToggle.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', syncWatchControls);
syncWatchControls();

// ===== Generic modal handling =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) { closeModal(closeBtn.dataset.close); return; }
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) { e.target.classList.remove('open'); }
});

// ===== Tabs =====

function normalizeTabName(tabName) {
  if (!tabName) return 'home';
  if (tabName === 'dashboard' || tabName === 'routine') return 'home';
  if (tabName === 'flashcards' || tabName === 'quiz' || tabName === 'mcq') return 'quiz';
  if (tabName === 'exams') return 'countdown';
  if (tabName === 'settings' || tabName === 'auth' || tabName === 'login' || tabName === 'signup' || tabName === 'register') return 'profile';
  return tabName;
}

function activateTab(rawTabName, persist = false) {
  const tabName = normalizeTabName(rawTabName);
  const targetPanel = document.getElementById('panel-' + tabName) || 
                      (tabName === 'profile' ? document.getElementById('panel-settings') : null) ||
                      (tabName === 'quiz' ? document.getElementById('panel-flashcards') : null);
  if (!targetPanel) return;

  document.querySelectorAll('.tab-btn').forEach(b => {
    const bTab = normalizeTabName(b.dataset.tab);
    const isActive = bTab === tabName;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.panel').forEach(p => {
    const isTarget = p === targetPanel;
    p.classList.toggle('active', isTarget);
  });

  if (rawTabName !== 'routine') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  if (persist) {
    try { localStorage.setItem(ACTIVE_TAB_KEY, tabName); } catch (e) { }
    try { if (window.location.hash !== '#' + tabName) history.replaceState(null, '', '#' + tabName); } catch (e) { }
  }

  if (tabName === 'home') {
    if (typeof renderHomeDashboard === 'function') {
      renderHomeDashboard();
    }
    if (rawTabName === 'routine') {
      setTimeout(() => {
        const routineSec = document.getElementById('homeRoutineSection');
        if (routineSec) routineSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }

  if (tabName === 'profile' || tabName === 'settings') {
    try { if (typeof renderUserProfileUI === 'function') renderUserProfileUI(); } catch (e) { console.error('[CareerDesk] renderUserProfileUI error:', e); }
    try { if (typeof renderProfileTrackCard === 'function') renderProfileTrackCard(); } catch (e) { console.error('[CareerDesk] renderProfileTrackCard error:', e); }
    try { if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub(); } catch (e) { console.error('[CareerDesk] renderProfileAspirantHub error:', e); }
    try { renderSubjectManager(); } catch (e) { console.error('[CareerDesk] renderSubjectManager error:', e); }
    try { renderQuoteManager(); } catch (e) { console.error('[CareerDesk] renderQuoteManager error:', e); }
    try { syncQuoteSettings(); } catch (e) { console.error('[CareerDesk] syncQuoteSettings error:', e); }

    // If navigated via #login or #signup directly, pop open the auth modal
    if (rawTabName === 'login' || rawTabName === 'signup') {
      if (typeof openAuthModal === 'function') {
        openAuthModal(rawTabName === 'signup' ? 'signup' : 'login');
      }
    }
  }

  if (tabName === 'tracker') {
    renderTrackerAll();
  }

  if (tabName === 'quiz') {
    if (typeof renderMCQFilterBar === 'function') renderMCQFilterBar();
    if (typeof renderMCQQuestion === 'function') renderMCQQuestion();
    if (typeof updateMCQStatsBar === 'function') updateMCQStatsBar();
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab, true));
});

try {
  const hashTab = window.location.hash ? window.location.hash.replace('#', '') : null;
  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  const initialTab = normalizeTabName(hashTab || savedTab || 'home');
  if (initialTab) activateTab(initialTab, false);
} catch (e) { }

window.addEventListener('hashchange', () => {
  const rawTab = window.location.hash ? window.location.hash.replace('#', '') : 'home';
  activateTab(normalizeTabName(rawTab), false);
});


// ===== Quick Command Palette (Ctrl + K / Cmd + K) =====
function initCommandPalette() {
  const modal = document.getElementById('commandPaletteModal');
  const input = document.getElementById('paletteSearchInput');
  const results = document.getElementById('paletteResults');
  const btn = document.getElementById('commandPaletteBtn');
  const closeBtn = document.getElementById('closePaletteBtn');
  if (!modal || !input || !results) return;

  let selectedIndex = 0;
  let currentItems = [];

  const staticCommands = [
    { id: 'tab-home', category: 'Navigation', icon: 'home', title: 'Go to Home & Routine', subtitle: 'Mission Control, stats & daily study schedule', action: () => activateTab('home', true) },
    { id: 'tab-routine', category: 'Navigation', icon: 'calendar-days', title: 'Jump to Study Routine', subtitle: 'View & edit daily study schedule on Home', action: () => activateTab('routine', true) },
    { id: 'tab-notes', category: 'Navigation', icon: 'notebook-pen', title: 'Go to Smart Notes', subtitle: 'Study notes, formulas & tags', action: () => activateTab('notes', true) },
    { id: 'tab-tracker', category: 'Navigation', icon: 'timer', title: 'Go to Tracker & Focus', subtitle: 'Pomodoro timer & activity stats', action: () => activateTab('tracker', true) },
    { id: 'tab-quiz', category: 'Navigation', icon: 'brain', title: 'Go to BCS & Govt MCQ Quiz', subtitle: 'Practice randomized MCQs & model tests', action: () => activateTab('quiz', true) },
    { id: 'tab-countdown', category: 'Navigation', icon: 'calendar-clock', title: 'Go to Exam Targets', subtitle: 'Exam countdowns & milestones', action: () => activateTab('countdown', true) },
    { id: 'tab-syllabus', category: 'Navigation', icon: 'list-checks', title: 'Go to Syllabus', subtitle: 'BCS syllabus & topic progress', action: () => activateTab('syllabus', true) },
    { id: 'tab-profile', category: 'Navigation', icon: 'user', title: 'Go to User Profile', subtitle: 'Cloud backup, sync & settings', action: () => activateTab('profile', true) },
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
      id: 'act-add-note', category: 'Actions', icon: 'plus', title: 'Add New Note', subtitle: 'Quickly open new note form',
      action: () => {
        activateTab('notes', true);
        const tBtn = document.getElementById('toggleNoteFormBtn');
        if (tBtn) tBtn.click();
        const nInput = document.getElementById('noteTitle');
        if (nInput) nInput.focus();
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
      id: 'act-theme', category: 'Actions', icon: 'sun-moon', title: 'Toggle Dark / Light Theme', subtitle: 'Switch color theme',
      action: () => {
        setTheme(state.theme === 'dark' ? 'light' : 'dark');
      }
    },
    {
      id: 'act-fullscreen', category: 'Actions', icon: 'maximize', title: 'Toggle Fullscreen', subtitle: 'Distraction-free fullscreen view',
      action: () => {
        toggleFullscreen();
      }
    }
  ];

  function openPalette() {
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('open');
    input.value = '';
    selectedIndex = 0;
    renderItems('');
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    modal.classList.remove('open');
    setTimeout(() => {
      if (!modal.classList.contains('open')) {
        modal.style.display = 'none';
      }
    }, 150);
    input.blur();
  }

  function renderItems(query) {
    const q = query.trim().toLowerCase();
    let matched = [];

    if (!q) {
      matched = [...staticCommands];
    } else {
      matched = staticCommands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q));

      if (Array.isArray(state.notes)) {
        state.notes.forEach(note => {
          const t = (note.title || '').toLowerCase();
          const b = (note.body || '').toLowerCase();
          const tag = (note.tag || '').toLowerCase();
          if (t.includes(q) || b.includes(q) || tag.includes(q)) {
            matched.push({
              id: 'note-' + note.id,
              category: 'Notes',
              icon: 'notebook-pen',
              title: note.title || 'Untitled Note',
              subtitle: (note.tag ? `[${note.tag}] ` : '') + (note.body || '').slice(0, 45) + '...',
              action: () => {
                activateTab('notes', true);
                setTimeout(() => {
                  const el = document.querySelector(`[data-note-id="${note.id}"]`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.outline = '2px solid var(--accent1)';
                    setTimeout(() => el.style.outline = '', 2000);
                  }
                }, 100);
              }
            });
          }
        });
      }

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
      results.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">No matching commands or notes found.</div>';
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
        <div class="palette-item ${isSel}" data-index="${idx}">
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

  if (btn) btn.addEventListener('click', openPalette);
  if (closeBtn) closeBtn.addEventListener('click', closePalette);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePalette();
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (modal.classList.contains('open')) closePalette();
      else openPalette();
    }
  });
}

// ===== Init =====
(async function init() {
  await loadData();
  document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  await initAutoSync();
  syncThemeButtons();
  initMonthDropdown();
  renderDateSlider();
  renderRoutine();
  renderQuote();
  renderQuoteManager();
  syncQuoteSettings();
  startQuoteRotation();
  renderNotes();
  renderTrackerAll();
  renderCategories();
  syncAllSubjectSelects();
  renderFlashcards();

  loadExams();
  renderExams();
  setInterval(renderExams, 1000);
  update24hActivityUI();
  loadMistakes();

  initMCQEngine();
  renderMistakes();
  initCommandPalette();
  renderStudyHeatmap();
  syncMiniTimerWidget();

  tickInterval = setInterval(() => { tickTimer(); }, 1000);

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

  // Feature #13: Daily Reflection Journal
  initDailyJournal();

  // Feature #4: MCQ Quick Subject Pre-Filter
  initMCQQuickFilter();
})();

/* ==========================================================================
   Feature #14 — Keyboard Shortcuts Panel
   ========================================================================== */
function initKeyboardShortcutsPanel() {
  const modal = document.getElementById('keyboardShortcutsModal');
  const body = document.getElementById('shortcutsModalBody');
  const closeBtn = document.getElementById('closeShortcutsModal');
  const triggerBtn = document.getElementById('shortcutsHelpBtn');
  if (!modal || !body) return;

  const SHORTCUT_GROUPS = [
    {
      group: 'Navigation',
      shortcuts: [
        { keys: ['Alt', '1'], desc: 'Go to Home & Daily Routine' },
        { keys: ['Alt', '2'], desc: 'Go to Smart Notes' },
        { keys: ['Alt', '3'], desc: 'Go to Tracker & Focus' },
        { keys: ['Alt', '4'], desc: 'Go to Quiz & Flashcards' },
        { keys: ['Alt', '5'], desc: 'Go to Exam Targets' },
        { keys: ['Alt', '6'], desc: 'Go to Syllabus' },
        { keys: ['Alt', '7'], desc: 'Go to Profile & Settings' },
      ]
    },
    {
      group: 'Quick Actions',
      shortcuts: [
        { keys: ['Ctrl', 'K'], desc: 'Open Command Palette' },
        { keys: ['?'], desc: 'Open Keyboard Shortcuts Panel' },
        { keys: ['F'], desc: 'Toggle Fullscreen' },
        { keys: ['T'], desc: 'Toggle Dark / Light Theme' },
      ]
    },
    {
      group: 'Study Timer',
      shortcuts: [
        { keys: ['Space'], desc: 'Start / Stop focus timer (when on Tracker tab)' },
        { keys: ['Escape'], desc: 'Close any open modal or overlay' },
      ]
    }
  ];

  function renderShortcutsBody() {
    body.innerHTML = SHORTCUT_GROUPS.map(grp => `
      <div style="margin-bottom:18px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; color:var(--text-muted); margin-bottom:10px;">${escapeHtml(grp.group)}</div>
        <div style="display:flex; flex-direction:column; gap:7px;">
          ${grp.shortcuts.map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:9px; background:var(--surface); border:1px solid var(--border);">
              <span style="font-size:13px; color:var(--text);">${escapeHtml(s.desc)}</span>
              <div style="display:flex; gap:4px; flex-shrink:0;">
                ${s.keys.map(k => `<kbd style="font-family:var(--font-mono); font-size:11px; font-weight:700; padding:3px 7px; border-radius:6px; border:1px solid var(--border); background:var(--surface-strong); color:var(--text); box-shadow:0 1px 3px rgba(0,0,0,0.12);">${escapeHtml(k)}</kbd>`).join('<span style="font-size:12px; color:var(--text-muted); align-self:center;">+</span>')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function openShortcuts() {
    renderShortcutsBody();
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }

  function closeShortcuts() {
    modal.classList.remove('open');
    setTimeout(() => { if (!modal.classList.contains('open')) modal.style.display = 'none'; }, 180);
  }

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
      const tabMap = { '1': 'home', '2': 'notes', '3': 'tracker', '4': 'flashcards', '5': 'countdown', '6': 'syllabus', '7': 'profile' };
      if (tabMap[e.key]) { e.preventDefault(); activateTab(tabMap[e.key], true); }
    }
  });
}

/* ==========================================================================
   Feature #13 — Daily Reflection Journal
   ========================================================================== */
const JOURNAL_KEY = 'careerdesk_daily_journal_v1';

function getJournalData() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveJournalData(data) {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(data)); } catch (e) {}
}

function initDailyJournal() {
  const toggleBtn = document.getElementById('toggleJournalBtn');
  const journalWrap = document.getElementById('journalWrap');
  const textarea = document.getElementById('journalTextarea');
  const saveBtn = document.getElementById('journalSaveBtn');
  const dateLabel = document.getElementById('journalDateLabel');
  const statusEl = document.getElementById('journalSaveStatus');
  const viewAllBtn = document.getElementById('journalViewAllBtn');
  const historyWrap = document.getElementById('journalHistoryWrap');
  const historyList = document.getElementById('journalHistoryList');
  if (!toggleBtn || !journalWrap || !textarea) return;

  const todayKey = dateKey(Date.now());

  function loadTodayEntry() {
    const journal = getJournalData();
    const todayEntry = journal[todayKey] || '';
    textarea.value = todayEntry;
    if (dateLabel) {
      const now = new Date();
      dateLabel.textContent = '— ' + now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (statusEl) {
      statusEl.textContent = todayEntry ? 'Entry saved for today.' : '';
    }
  }

  function renderJournalHistory() {
    if (!historyList) return;
    const journal = getJournalData();
    const entries = Object.entries(journal)
      .filter(([key]) => key !== todayKey && journal[key] && journal[key].trim())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14); // Last 14 days

    if (!entries.length) {
      historyList.innerHTML = '<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:10px 0;">No past journal entries found.</div>';
      return;
    }
    historyList.innerHTML = entries.map(([dateStr, text]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div style="padding:12px 14px; border-radius:10px; border:1px solid var(--border); background:var(--surface);">
          <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:6px;">${escapeHtml(label)}</div>
          <div style="font-size:13px; color:var(--text); line-height:1.6; white-space:pre-wrap;">${escapeHtml(text)}</div>
        </div>`;
    }).join('');
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = journalWrap.style.display !== 'none';
    journalWrap.style.display = isOpen ? 'none' : 'block';
    toggleBtn.classList.toggle('active-open', !isOpen);
    if (!isOpen) {
      loadTodayEntry();
      textarea.focus();
      if (window.lucide) lucide.createIcons();
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const journal = getJournalData();
      journal[todayKey] = textarea.value.trim();
      saveJournalData(journal);
      if (statusEl) {
        statusEl.textContent = 'Saved at ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      showToast('Journal entry saved!');
    });
  }

  if (viewAllBtn && historyWrap) {
    viewAllBtn.addEventListener('click', () => {
      const isOpen = historyWrap.style.display !== 'none';
      historyWrap.style.display = isOpen ? 'none' : 'block';
      viewAllBtn.innerHTML = isOpen ? '<i data-lucide="list"></i> Past Entries' : '<i data-lucide="chevron-up"></i> Hide';
      if (!isOpen) renderJournalHistory();
      if (window.lucide) lucide.createIcons();
    });
  }

  loadTodayEntry();
}

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

