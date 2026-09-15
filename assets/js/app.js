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
  if (!tabName) return 'routine';
  if (tabName === 'quiz') return 'flashcards';
  if (tabName === 'exams') return 'countdown';
  return tabName;
}

function activateTab(rawTabName, persist = false) {
  const tabName = normalizeTabName(rawTabName);
  const targetPanel = document.getElementById('panel-' + tabName);
  if (!targetPanel) return;

  document.querySelectorAll('.tab-btn').forEach(b => {
    const bTab = normalizeTabName(b.dataset.tab);
    const isActive = bTab === tabName;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + tabName);
  });

  if (persist) {
    try { localStorage.setItem(ACTIVE_TAB_KEY, tabName); } catch (e) { }
    try { if (window.location.hash !== '#' + tabName) history.replaceState(null, '', '#' + tabName); } catch (e) { }
  }

  if (tabName === 'settings') {
    renderSubjectManager();
    renderQuoteManager();
    syncQuoteSettings();
  }

  if (tabName === 'tracker') {
    renderTrackerAll();
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
  const initialTab = normalizeTabName(hashTab || savedTab || 'routine');
  if (initialTab) activateTab(initialTab, false);
} catch (e) { }

window.addEventListener('hashchange', () => {
  const rawTab = window.location.hash ? window.location.hash.replace('#', '') : 'routine';
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
    { id: 'tab-routine', category: 'Navigation', icon: 'calendar-days', title: 'Go to Routine', subtitle: 'View daily study schedule', action: () => activateTab('routine', true) },
    { id: 'tab-notes', category: 'Navigation', icon: 'notebook-pen', title: 'Go to Smart Notes', subtitle: 'Study notes, formulas & tags', action: () => activateTab('notes', true) },
    { id: 'tab-tracker', category: 'Navigation', icon: 'timer', title: 'Go to Tracker & Focus', subtitle: 'Pomodoro timer & activity stats', action: () => activateTab('tracker', true) },
    { id: 'tab-quiz', category: 'Navigation', icon: 'brain', title: 'Go to Quiz & Cards', subtitle: 'Practice flashcards & MCQs', action: () => activateTab('flashcards', true) },
    { id: 'tab-countdown', category: 'Navigation', icon: 'calendar-clock', title: 'Go to Exam Targets', subtitle: 'Exam countdowns & milestones', action: () => activateTab('countdown', true) },
    { id: 'tab-syllabus', category: 'Navigation', icon: 'list-checks', title: 'Go to Syllabus', subtitle: 'BCS syllabus & topic progress', action: () => activateTab('syllabus', true) },
    { id: 'tab-settings', category: 'Navigation', icon: 'settings', title: 'Go to Settings', subtitle: 'Theme, backups & options', action: () => activateTab('settings', true) },
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
        const addBtn = document.getElementById('inlineAddRowBtn');
        if (addBtn) addBtn.click();
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

  checkFirstTimeUser();

  if (window.lucide) {
    lucide.createIcons();
  }
})();
