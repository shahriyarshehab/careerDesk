/* ==========================================================================
   CareerDesk — Core System: Storage, State, Master Subjects & Global Utilities
   ========================================================================== */

const STORAGE_KEY = 'jobprep-dashboard-data-v2';
const EXAMS_KEY = 'jobprep_exams_list';
const MISTAKES_KEY = 'jobprep_mistakes_list';
const MCQ_CUSTOM_KEY = 'custom_bcs_questions_v3';
const MCQ_PROGRESS_KEY = 'jobprep_mcq_progress_v2';
const BREAK_STORAGE_KEY = 'jobprep_break_minutes_today';
const BREAK_ENTRIES_KEY = 'jobprep_break_entries';
const ONBOARDING_KEY = 'careerdesk_onboarding_done';
const ACTIVE_TAB_KEY = 'careerdesk-active-tab';

// Global Utility Functions
function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

function escapeHtml(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

function cleanQuoteText(str) {
  if (!str) return '';
  let s = String(str).trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith('“') && s.endsWith('”')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('‘') && s.endsWith('’'))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function cleanQuoteAuthor(author) {
  if (!author) return 'CareerDesk';
  let a = String(author).trim();
  if (a.startsWith('—') || a.startsWith('-')) {
    a = a.replace(/^[—\-]\s*/, '').trim();
  }
  return a || 'CareerDesk';
}

function toBnDigits(n) { return String(n); }

function dateKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayKey() { return dateKey(Date.now()); }
function fmtHM(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h > 0 ? (`${h}h ${m}m`) : (`${m}m`);
}
function fmtClock(secs) {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(secs % 60)).padStart(2, '0');
  return h + ':' + m + ':' + s;
}


function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Core Icons & Storage Adapter
const ICON = {
  x: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  trash: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
  pin: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
  edit: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
  undo: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  rotccw: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  trophy: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  zap: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  star: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  layers: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  arrowR: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  arrowL: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  eye: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  plus: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  target: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  bulb: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  checkCircle: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  xCircle: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  flame: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  flag: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>',
  volume2: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  volumeX: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>',
  sparkles: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  pause: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  award: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  clock: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

// window.storage only exists inside the Claude.ai artifact viewer.
// When this file runs as a standalone app (opened directly or via a local server),
// fall back to localStorage so data still persists across reloads.
const storageAdapter = {
  async get(key) {
    if (window.storage) {
      try { return await window.storage.get(key); } catch (e) { /* fall through to localStorage */ }
    }
    try {
      const v = localStorage.getItem(key);
      return v !== null ? { key, value: v } : null;
    } catch (e) { return null; }
  },
  async set(key, value) {
    if (window.storage) {
      try { return await window.storage.set(key, value); } catch (e) { /* fall through to localStorage */ }
    }
    try {
      localStorage.setItem(key, value);
      if (key === STORAGE_KEY && typeof window.scheduleFirestoreSync === 'function') {
        window.scheduleFirestoreSync();
      }
      return { key, value };
    } catch (e) { return null; }
  }
};

const DEFAULT_USER_TRACK = {
  role: 'job_seeker', // 'student' | 'job_seeker'
  studentClass: 'ssc_science',
  jobType: 'govt', // 'govt' | 'non_govt'
  activeSubjectNames: ['Bangla', 'English', 'Mathematics', 'General Knowledge'],
  subjectLanguage: 'en' // 'en' | 'bn'
};

function getUserTrack() {
  if (typeof state !== 'undefined' && state && state.userTrack && typeof state.userTrack === 'object') {
    if (!state.userTrack.subjectLanguage) {
      state.userTrack.subjectLanguage = 'en';
    }
    return state.userTrack;
  }
  try {
    const raw = localStorage.getItem('careerdesk_user_track_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.subjectLanguage) parsed.subjectLanguage = 'en';
      return parsed;
    }
  } catch (e) { }
  return { ...DEFAULT_USER_TRACK };
}

function saveUserTrack(track) {
  if (typeof state === 'undefined' || !state) return;
  state.userTrack = { ...track };
  if (!state.userTrack.subjectLanguage) {
    state.userTrack.subjectLanguage = 'en';
  }
  try {
    localStorage.setItem('careerdesk_user_track_v2', JSON.stringify(state.userTrack));
  } catch (e) { }
  saveData();
}

function getDefaultState() {
  return {
    routine: [],
    notes: [],
    customQuotes: [],
    quoteIdx: 0,
    quoteSource: "all",
    theme: "dark",
    sessions: [],
    activeSession: null,
    dailyTargetMinutes: 240,
    syllabus: [],
    flashcards: [],
    quoteCarouselEnabled: true,
    quoteCarouselInterval: 300,
    deletedSubjects: [],
    customSubjects: [],
    deletedQuotes: [],
    userTrack: { ...DEFAULT_USER_TRACK }
  };
}

function isMockFlashcard(f) {
  if (!f) return true;
  // Only purge legacy static mock cards from v1 with small numeric IDs (1-25)
  return typeof f.id === 'number' && f.id >= 1 && f.id <= 25;
}

function isMockRoutineTask(r) {
  if (!r) return true;
  // Only purge legacy static mock rows from v1 with small numeric IDs (1-5)
  return typeof r.id === 'number' && r.id >= 1 && r.id <= 5;
}

function isMockSyllabusCategory(cat) {
  if (!cat) return true;
  const mockCatNames = ['Bangla', 'English', 'Mathematics', 'General Knowledge'];
  if (cat.id >= 1 && cat.id <= 4 && mockCatNames.includes(cat.name)) {
    const mockTopicIds = [101, 102, 103, 104, 201, 202, 203, 204, 301, 302, 303, 401, 402, 403];
    if (Array.isArray(cat.topics) && cat.topics.every(t => mockTopicIds.includes(t.id))) {
      return true;
    }
  }
  return false;
}

function buildDefaultRoutine(dateStr) {
  const template = [
    { startTime: '06:30', endTime: '08:00', subject: 'Bangla', task: 'Literature & Grammar Review' },
    { startTime: '09:00', endTime: '10:30', subject: 'English', task: 'Grammar & High-Yield Vocabulary Review' },
    { startTime: '11:30', endTime: '13:00', subject: 'Mathematics', task: 'Quantitative Aptitude & Problem Solving' },
    { startTime: '15:30', endTime: '17:00', subject: 'General Knowledge', task: 'Current Affairs & Bangladesh/International' },
    { startTime: '20:00', endTime: '21:30', subject: 'Mathematics', task: 'Critical Reasoning & Problem Solving' },
  ];
  return template.map((t, i) => ({ id: Date.now() + i, date: dateStr, ...t }));
}

function buildDefaultNotes() {
  return getDefaultState().notes;
}


// Quotes Normalization & Core State Definition
function normalizeCustomQuotes(quotes) {
  if (!Array.isArray(quotes)) return [];
  return quotes.map((q, i) => {
    if (typeof q === 'string') {
      const text = q.trim();
      return text ? { id: Date.now() + i + 1000, text, author: null, source: 'custom' } : null;
    }
    if (q && typeof q === 'object') {
      const text = typeof q.text === 'string' ? q.text.trim() : (typeof q.q === 'string' ? q.q.trim() : '');
      const author = typeof q.author === 'string' ? q.author : (typeof q.a === 'string' ? q.a : null);
      if (!text) return null;
      return { id: q.id || Date.now() + i + 2000, text, author, source: q.source === 'famous' ? 'famous' : 'custom' };
    }
    return null;
  }).filter(Boolean);
}

let state = {
  routine: null, notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: 'dark',
  sessions: [], activeSession: null, dailyTargetMinutes: 240,
  syllabus: [], flashcards: [],
  quoteCarouselEnabled: true, quoteCarouselInterval: 300,
  deletedSubjects: [], customSubjects: [], deletedQuotes: [],
  userTrack: { ...DEFAULT_USER_TRACK }
};
let saveTimer = null;
let tickInterval = null;

let currentViewMonth = new Date().getMonth();
let currentViewYear = new Date().getFullYear();

function bnDate() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

async function loadData() {
  try {
    const res = await storageAdapter.get(STORAGE_KEY);
    if (res && res.value) {
      const p = JSON.parse(res.value);
      state.routine = Array.isArray(p.routine)
        ? migrateRoutine(p.routine).filter(r => r && !isMockRoutineTask(r))
        : [];
      state.notes = Array.isArray(p.notes)
        ? p.notes.filter(n => n && n.id !== 1785728326261 && n.title !== "Key Quantitative Aptitude Formulas")
        : [];
      state.customQuotes = normalizeCustomQuotes(Array.isArray(p.customQuotes) ? p.customQuotes : []);
      state.quoteIdx = typeof p.quoteIdx === 'number' ? p.quoteIdx : 0;
      state.quoteSource = p.quoteSource || 'all';
      state.theme = p.theme === 'light' ? 'light' : 'dark';
      state.sessions = Array.isArray(p.sessions) ? p.sessions : [];
      state.activeSession = p.activeSession || null;
      state.dailyTargetMinutes = typeof p.dailyTargetMinutes === 'number' ? p.dailyTargetMinutes : 240;
      state.syllabus = Array.isArray(p.syllabus)
        ? p.syllabus.filter(c => c && !isMockSyllabusCategory(c))
        : [];
      state.flashcards = Array.isArray(p.flashcards)
        ? p.flashcards.filter(f => f && !isMockFlashcard(f))
        : [];
      state.quoteCarouselEnabled = typeof p.quoteCarouselEnabled === 'boolean' ? p.quoteCarouselEnabled : true;
      state.quoteCarouselInterval = typeof p.quoteCarouselInterval === 'number' ? p.quoteCarouselInterval : 300;
      state.deletedSubjects = Array.isArray(p.deletedSubjects) ? p.deletedSubjects : [];
      state.customSubjects = Array.isArray(p.customSubjects) ? p.customSubjects : [];
      state.deletedQuotes = Array.isArray(p.deletedQuotes) ? p.deletedQuotes : [];
      state.userTrack = (p && typeof p.userTrack === 'object' && p.userTrack) ? p.userTrack : getUserTrack();
    } else {
      const def = getDefaultState();
      state = { ...state, ...def };
      saveData();
    }
  } catch (e) {
    const def = getDefaultState();
    state = { ...state, ...def };
  }
  document.documentElement.setAttribute('data-theme', state.theme);
  syncThemeButtons();
}

function migrateRoutine(rows) {
  const today = dateKey(Date.now());
  return rows.map((r, i) => {
    if (r.date && (r.startTime !== undefined)) return { id: r.id || (Date.now() + i), ...r };
    return {
      id: r.id || (Date.now() + i),
      date: r.date || today,
      startTime: r.startTime || r.time || '',
      endTime: r.endTime || '',
      subject: r.subject || '',
      task: r.task || ''
    };
  });
}

// ===== Toast Notification =====
function showToast(msg, isError = false) {
  let toast = document.getElementById('toastContainer');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastContainer';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// IndexedDB File System Handle Storage & Auto-Backup Controller
// ===== IndexedDB File System Handle Storage =====
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('JobPrepDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getStoredFileHandle() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('autoBackupHandle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
}
async function setStoredFileHandle(handle) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('handles', 'readwrite');
      const req = tx.objectStore('handles').put(handle, 'autoBackupHandle');
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) { return false; }
}

// ===== Auto Backup File System Controller =====
let autoBackupHandle = null;

async function updateAutoSyncUI() {
  const badge = document.getElementById('autoSyncStatusBadge');
  const dot = document.getElementById('autoSyncDot');
  const text = document.getElementById('autoSyncStatusText');
  if (!badge || !dot || !text) return;

  if (autoBackupHandle) {
    try {
      const options = { mode: 'readwrite' };
      if ((await autoBackupHandle.queryPermission(options)) === 'granted') {
        badge.classList.add('active');
        dot.classList.add('active');
        text.textContent = 'Auto-backup active (' + autoBackupHandle.name + ')';
        return;
      }
    } catch (e) { }
    badge.classList.remove('active');
    dot.classList.remove('active');
    text.textContent = 'Permission needed (' + autoBackupHandle.name + ')';
  } else {
    badge.classList.remove('active');
    dot.classList.remove('active');
    text.textContent = 'Not connected';
  }
}

async function initAutoSync() {
  autoBackupHandle = await getStoredFileHandle();
  updateAutoSyncUI();
}

async function writeToAutoBackupFile() {
  if (!autoBackupHandle) return;
  try {
    const options = { mode: 'readwrite' };
    if ((await autoBackupHandle.queryPermission(options)) !== 'granted') {
      if ((await autoBackupHandle.requestPermission(options)) !== 'granted') {
        updateAutoSyncUI();
        return;
      }
    }
    const writable = await autoBackupHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
    updateAutoSyncUI();
  } catch (e) {
    console.warn('Auto backup write failed:', e);
  }
}

async function connectAutoSyncFile() {
  if (!('showSaveFilePicker' in window)) {
    showToast('File System Access API is not supported in this browser. Please use Chrome or Edge.', true);
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'careerdesk-backup.json',
      types: [{
        description: 'JSON Backup File',
        accept: { 'application/json': ['.json'] }
      }]
    });
    autoBackupHandle = handle;
    await setStoredFileHandle(handle);
    await writeToAutoBackupFile();
    updateAutoSyncUI();
    showToast('Auto-backup file connected successfully! ✓');
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('Failed to connect backup file.', true);
    }
  }
}


// Save Data
function saveData() {
  clearTimeout(saveTimer);
  const note = document.getElementById('routineSaveNote');
  saveTimer = setTimeout(async () => {
    try {
      await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
      if (note) { note.textContent = 'Changes saved ✓'; setTimeout(() => { note.textContent = 'Changes are saved automatically.'; }, 1600); }
      await writeToAutoBackupFile();
      if (typeof window.scheduleFirestoreSync === 'function') {
        window.scheduleFirestoreSync();
      }
    } catch (e) {
      if (note) { note.textContent = 'Failed to save changes, please try again.'; }
    }
  }, 400);
}


// Master Subject Control System
const SUBJECT_ALIASES = {
  // English
  'english': 'English',
  'ইংরেজি': 'English',
  'english language & literature': 'English',

  // Bangla
  'bangla': 'Bangla',
  'বাংলা': 'Bangla',
  'bangla literature': 'Bangla',
  'বাংলা সাহিত্য': 'Bangla',
  'bangla grammar': 'Bangla',
  'বাংলা ব্যাকরণ': 'Bangla',

  // Mathematics
  'math': 'Mathematics',
  'maths': 'Mathematics',
  'mathematics': 'Mathematics',
  'mathmatics': 'Mathematics',
  'গণিত': 'Mathematics',
  'mathematics & mental ability': 'Mathematics',
  'mental ability': 'Mathematics',
  'analytical ability': 'Mathematics',
  'মানসিক দক্ষতা': 'Mathematics',

  // General Knowledge
  'general knowledge': 'General Knowledge',
  'general knowladge': 'General Knowledge',
  'gk': 'General Knowledge',
  'সাধারণ জ্ঞান': 'General Knowledge',
  'সাধারণ জ্ঞান / অন্যান্য': 'General Knowledge',
  'bangladesh affairs': 'General Knowledge',
  'বাংলাদেশ বিষয়াবলী': 'General Knowledge',
  'বাংলাদেশ বিষয়াবলী': 'General Knowledge',
  'international affairs': 'General Knowledge',
  'আন্তর্জাতিক বিষয়াবলী': 'General Knowledge',
  'আন্তর্জাতিক বিষয়াবলী': 'General Knowledge',

  // Specialized & Academic Subjects (NCTB Bangladesh Curriculum)
  'physics': 'Physics',
  'পদার্থবিজ্ঞান': 'Physics',
  'chemistry': 'Chemistry',
  'রসায়ন': 'Chemistry',
  'biology': 'Biology',
  'জীববিজ্ঞান': 'Biology',
  'higher math': 'Higher Mathematics',
  'higher mathematics': 'Higher Mathematics',
  'উচ্চতর গণিত': 'Higher Mathematics',
  'ict': 'ICT',
  'information and communication technology': 'ICT',
  'তথ্য ও যোগাযোগ প্রযুক্তি': 'ICT',
  'computer & ict': 'Computer & ICT',
  'কম্পিউটার ও আইসিটি': 'Computer & ICT',
  'general science': 'General Science',
  'বিজ্ঞান': 'General Science',
  'সাধারণ বিজ্ঞান': 'General Science',
  'mental ability': 'Mental Ability',
  'মানসিক দক্ষতা': 'Mental Ability',
  'geography & environment': 'Geography & Environment',
  'ভূগোল ও পরিবেশ': 'Geography & Environment',
  'ethics & good governance': 'Ethics & Good Governance',
  'নৈতিকতা ও সুশাসন': 'Ethics & Good Governance',
  'accounting': 'Accounting',
  'হিসাববিজ্ঞান': 'Accounting',
  'finance & banking': 'Finance & Banking',
  'ফিন্যান্স ও ব্যাংকিং': 'Finance & Banking',
  'business entrepreneurship': 'Business Entrepreneurship',
  'ব্যবসায় উদ্যোগ': 'Business Entrepreneurship',
  'business organization': 'Business Organization',
  'ব্যবসায় সংগঠন': 'Business Organization',
  'economics': 'Economics',
  'অর্থনীতি': 'Economics',
  'history': 'History',
  'ইতিহাস': 'History',
  'geography': 'Geography',
  'ভূগোল': 'Geography',
  'civics': 'Civics',
  'পৌরনীতি': 'Civics',
  'পৌরনীতি ও সুশাসন': 'Civics',
  'sociology': 'Sociology',
  'সমাজবিজ্ঞান': 'Sociology',
  'logic': 'Logic',
  'যুক্তিবিদ্যা': 'Logic',
  'bgs': 'BGS',
  'বাংলাদেশ ও বিশ্বপরিচয়': 'BGS',
  'agriculture': 'Agriculture',
  'কৃষি শিক্ষা': 'Agriculture',
  'religion': 'Religion',
  'ধর্ম ও নৈতিক শিক্ষা': 'Religion'
};

function canonicalSubjectName(subject) {
  const value = String(subject || '').trim();
  return SUBJECT_ALIASES[value.toLowerCase()] || value;
}

function uniqueSubjectNames(subjects) {
  const seen = new Set();
  return subjects.map(canonicalSubjectName).filter(subject => {
    const key = subject.toLowerCase();
    if (!subject || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const DEFAULT_SUBJECTS = [
  'Bangla',
  'English',
  'Mathematics',
  'General Knowledge'
];

const BANGLADESH_CURRICULUM_DATA = {
  classes: [
    {
      id: 'class_6',
      name: 'Class 6 (ষষ্ঠ শ্রেণি)',
      short: 'Class 6',
      badge: 'Junior Secondary',
      subjects: ['Bangla', 'English', 'Mathematics', 'General Science', 'BGS', 'ICT', 'Religion', 'Agriculture']
    },
    {
      id: 'class_7',
      name: 'Class 7 (সপ্তম শ্রেণি)',
      short: 'Class 7',
      badge: 'Junior Secondary',
      subjects: ['Bangla', 'English', 'Mathematics', 'General Science', 'BGS', 'ICT', 'Religion', 'Agriculture']
    },
    {
      id: 'class_8',
      name: 'Class 8 / JSC (অষ্টম শ্রেণি)',
      short: 'Class 8',
      badge: 'Junior School Cert.',
      subjects: ['Bangla', 'English', 'Mathematics', 'General Science', 'BGS', 'ICT', 'Religion']
    },
    {
      id: 'ssc_science',
      name: 'SSC / Class 9-10 — Science (বিজ্ঞান)',
      short: 'SSC Science',
      badge: 'Secondary Science',
      subjects: ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Higher Mathematics', 'BGS', 'ICT', 'Religion']
    },
    {
      id: 'ssc_business',
      name: 'SSC / Class 9-10 — Business Studies (ব্যবসায় শিক্ষা)',
      short: 'SSC Business',
      badge: 'Secondary Commerce',
      subjects: ['Bangla', 'English', 'Mathematics', 'Accounting', 'Business Entrepreneurship', 'Finance & Banking', 'General Science', 'ICT', 'Religion']
    },
    {
      id: 'ssc_humanities',
      name: 'SSC / Class 9-10 — Humanities (মানবিক)',
      short: 'SSC Humanities',
      badge: 'Secondary Arts',
      subjects: ['Bangla', 'English', 'Mathematics', 'History', 'Geography', 'Civics', 'General Science', 'Economics', 'ICT', 'Religion']
    },
    {
      id: 'hsc_science',
      name: 'HSC / Class 11-12 — Science (বিজ্ঞান)',
      short: 'HSC Science',
      badge: 'Higher Secondary Science',
      subjects: ['Bangla', 'English', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Higher Mathematics']
    },
    {
      id: 'hsc_business',
      name: 'HSC / Class 11-12 — Business Studies (ব্যবসায় শিক্ষা)',
      short: 'HSC Business',
      badge: 'Higher Secondary Commerce',
      subjects: ['Bangla', 'English', 'ICT', 'Accounting', 'Business Organization', 'Finance & Banking']
    },
    {
      id: 'hsc_humanities',
      name: 'HSC / Class 11-12 — Humanities (মানবিক)',
      short: 'HSC Humanities',
      badge: 'Higher Secondary Arts',
      subjects: ['Bangla', 'English', 'ICT', 'Civics', 'Economics', 'Sociology', 'Logic', 'History']
    },
    {
      id: 'university_admission',
      name: 'University / Admission Test (ভর্তি পরীক্ষা)',
      short: 'Admission',
      badge: 'Higher Education',
      subjects: ['Bangla', 'English', 'General Knowledge', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Accounting', 'ICT']
    }
  ],
  jobSeeker: {
    // Exactly 4 primary core subjects as requested
    primarySubjects: [
      { name: 'Bangla', bn: 'বাংলা (সাহিত্য ও ব্যাকরণ)', desc: 'সাহিত্য, ব্যাকরণ, বাক্য গঠন ও প্রয়োগরীতি' },
      { name: 'English', bn: 'English Language & Literature', desc: 'Grammar, High-yield Vocabulary, Reading & Literature' },
      { name: 'Mathematics', bn: 'গণিত ও গাণিতিক যুক্তি', desc: 'পাটিগণিত, বীজগণিত, জ্যামিতি ও বিশ্লেষণ' },
      { name: 'General Knowledge', bn: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', desc: 'বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক ঘটনাবলি ও সাম্প্রতিক তথ্য' }
    ],
    optionalSubjects: [
      { name: 'Computer & ICT', bn: 'কম্পিউটার ও তথ্যপ্রযুক্তি', desc: 'কম্পিউটার সংগঠন, সাইবার নিরাপত্তা ও ইন্টারনেট' },
      { name: 'General Science', bn: 'সাধারণ বিজ্ঞান', desc: 'দৈনন্দিন বিজ্ঞান, পদার্থ, রসায়ন ও জীববিদ্যা' },
      { name: 'Mental Ability', bn: 'মানসিক দক্ষতা', desc: 'যুক্তি ও বিশ্লেষণমূলক সমস্যা সমাধান' },
      { name: 'Geography & Environment', bn: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', desc: 'বাংলাদেশ ও বৈশ্বিক প্রাকৃতিক ভূগোল' },
      { name: 'Ethics & Good Governance', bn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', desc: 'রাষ্ট্রনীতি, সুশাসন ও মূল্যবোধ' }
    ]
  }
};

const SUBJECT_METADATA = {
  'Bangla': { bn: 'বাংলা', color: '#ec4899', icon: 'book-open' },
  'English': { bn: 'ইংরেজি', color: '#06b6d4', icon: 'languages' },
  'Mathematics': { bn: 'গণিত', color: '#10b981', icon: 'calculator' },
  'General Knowledge': { bn: 'সাধারণ জ্ঞান', color: '#f59e0b', icon: 'globe' },
  'Physics': { bn: 'পদার্থবিজ্ঞান', color: '#8b5cf6', icon: 'atom' },
  'Chemistry': { bn: 'রসায়ন', color: '#14b8a6', icon: 'flask-conical' },
  'Biology': { bn: 'জীববিজ্ঞান', color: '#22c55e', icon: 'dna' },
  'Higher Mathematics': { bn: 'উচ্চতর গণিত', color: '#6366f1', icon: 'sigma' },
  'General Science': { bn: 'সাধারণ বিজ্ঞান', color: '#3b82f6', icon: 'microscope' },
  'ICT': { bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', color: '#38bdf8', icon: 'cpu' },
  'Computer & ICT': { bn: 'কম্পিউটার ও আইসিটি', color: '#0ea5e9', icon: 'monitor' },
  'BGS': { bn: 'বাংলাদেশ ও বিশ্বপরিচয়', color: '#f97316', icon: 'compass' },
  'Religion': { bn: 'ধর্ম ও নৈতিক শিক্ষা', color: '#a855f7', icon: 'heart' },
  'Agriculture': { bn: 'কৃষি শিক্ষা', color: '#84cc16', icon: 'sprout' },
  'Accounting': { bn: 'হিসাববিজ্ঞান', color: '#059669', icon: 'file-text' },
  'Finance & Banking': { bn: 'ফিন্যান্স ও ব্যাংকিং', color: '#0284c7', icon: 'coins' },
  'Business Entrepreneurship': { bn: 'ব্যবসায় উদ্যোগ', color: '#d97706', icon: 'rocket' },
  'Business Organization': { bn: 'ব্যবসায় সংগঠন', color: '#ca8a04', icon: 'building-2' },
  'History': { bn: 'ইতিহাস', color: '#e11d48', icon: 'landmark' },
  'Geography': { bn: 'ভূগোল', color: '#10b981', icon: 'map' },
  'Geography & Environment': { bn: 'ভূগোল ও পরিবেশ', color: '#10b981', icon: 'trees' },
  'Civics': { bn: 'পৌরনীতি ও নাগরিকতা', color: '#64748b', icon: 'shield' },
  'Economics': { bn: 'অর্থনীতি', color: '#eab308', icon: 'trending-up' },
  'Sociology': { bn: 'সমাজবিজ্ঞান', color: '#06b6d4', icon: 'users' },
  'Logic': { bn: 'যুক্তিবিদ্যা', color: '#a855f7', icon: 'lightbulb' },
  'Mental Ability': { bn: 'মানসিক দক্ষতা', color: '#d946ef', icon: 'brain' },
  'Ethics & Good Governance': { bn: 'নৈতিকতা ও সুশাসন', color: '#475569', icon: 'scale' }
};

function getSubjectMeta(subj) {
  const canon = canonicalSubjectName(subj);
  if (SUBJECT_METADATA[canon]) return SUBJECT_METADATA[canon];

  // Smart heuristic inference for custom/user-created subjects
  const lower = String(canon).toLowerCase();
  let icon = 'book-open';
  let color = '#6366f1';

  if (lower.includes('math') || lower.includes('গণিত') || lower.includes('অঙ্ক') || lower.includes('calcu')) {
    icon = 'calculator'; color = '#10b981';
  } else if (lower.includes('eng') || lower.includes('ইংরেজি') || lower.includes('vocab') || lower.includes('gram') || lower.includes('lang')) {
    icon = 'languages'; color = '#06b6d4';
  } else if (lower.includes('bang') || lower.includes('বাংলা') || lower.includes('সাহিত্য')) {
    icon = 'book-open'; color = '#ec4899';
  } else if (lower.includes('phys') || lower.includes('পদার্থ')) {
    icon = 'atom'; color = '#8b5cf6';
  } else if (lower.includes('chem') || lower.includes('রসায়ন')) {
    icon = 'flask-conical'; color = '#14b8a6';
  } else if (lower.includes('bio') || lower.includes('জীব')) {
    icon = 'dna'; color = '#22c55e';
  } else if (lower.includes('sci') || lower.includes('বিজ্ঞান')) {
    icon = 'microscope'; color = '#3b82f6';
  } else if (lower.includes('gk') || lower.includes('জ্ঞান') || lower.includes('affair') || lower.includes('বিশ্ব') || lower.includes('world')) {
    icon = 'globe'; color = '#f59e0b';
  } else if (lower.includes('ict') || lower.includes('comp') || lower.includes('তথ্য') || lower.includes('আইসিটি') || lower.includes('code') || lower.includes('prog') || lower.includes('tech')) {
    icon = 'monitor'; color = '#0ea5e9';
  } else if (lower.includes('law') || lower.includes('আইন') || lower.includes('moral') || lower.includes('ethic') || lower.includes('সুশাসন') || lower.includes('বিচার')) {
    icon = 'scale'; color = '#475569';
  } else if (lower.includes('bank') || lower.includes('finan') || lower.includes('অর্থ') || lower.includes('হিসাব') || lower.includes('account') || lower.includes('tax')) {
    icon = 'coins'; color = '#0284c7';
  } else if (lower.includes('med') || lower.includes('health') || lower.includes('চিকিৎসা') || lower.includes('ডাক্তার') || lower.includes('নাব')) {
    icon = 'activity'; color = '#ef4444';
  } else if (lower.includes('art') || lower.includes('ড্রয়িং') || lower.includes('চিত্র') || lower.includes('সঙ্গীত') || lower.includes('music')) {
    icon = 'palette'; color = '#d946ef';
  } else if (lower.includes('geo') || lower.includes('ভূগোল') || lower.includes('পরিবেশ') || lower.includes('earth') || lower.includes('climate')) {
    icon = 'trees'; color = '#10b981';
  } else if (lower.includes('hist') || lower.includes('ইতিহাস') || lower.includes('মুক্তিযুদ্ধ') || lower.includes('war')) {
    icon = 'landmark'; color = '#e11d48';
  } else if (lower.includes('biz') || lower.includes('business') || lower.includes('উদ্যোগ') || lower.includes('manage')) {
    icon = 'rocket'; color = '#d97706';
  }

  return { bn: canon, color, icon };
}

function addSubject(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed || trimmed === '__custom__' || trimmed.toLowerCase() === 'all') return null;
  const canonical = canonicalSubjectName(trimmed);
  if (Array.isArray(state.deletedSubjects)) {
    state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== canonical.toLowerCase());
  }
  if (!Array.isArray(state.customSubjects)) state.customSubjects = [];
  if (!state.customSubjects.some(c => canonicalSubjectName(c).toLowerCase() === canonical.toLowerCase())) {
    state.customSubjects.push(canonical);
  }
  saveData();
  syncAllSubjectSelects();
  return canonical;
}

function masterSubjectList(includeDeleted = false) {
  const fromRoutine = (state.routine || []).map(r => r.subject).filter(Boolean);
  const fromSessions = (state.sessions || []).map(s => s.subject).filter(Boolean);
  const fromCustom = Array.isArray(state.customSubjects) ? state.customSubjects : [];
  const fromSyllabus = (state.syllabus || []).map(c => c.name).filter(Boolean);
  const fromFlashcards = (state.flashcards || []).map(f => f.category).filter(Boolean);
  const fromDeleted = Array.isArray(state.deletedSubjects) ? state.deletedSubjects : [];

  const all = uniqueSubjectNames([
    ...DEFAULT_SUBJECTS,
    ...fromCustom,
    ...fromSyllabus,
    ...fromRoutine,
    ...fromSessions,
    ...fromFlashcards,
    ...(includeDeleted ? fromDeleted : [])
  ]);

  if (includeDeleted) return all;
  const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
  return all.filter(s => !deletedSet.has(canonicalSubjectName(s).toLowerCase()));
}

function getSubjectDisplayName(subject, lang = null) {
  if (!subject) return '';
  const canon = canonicalSubjectName(subject);
  const currentLang = lang || (typeof getUserTrack === 'function' ? (getUserTrack().subjectLanguage || 'en') : 'en');
  if (currentLang === 'bn') {
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : null;
    return (meta && meta.bn) ? meta.bn : canon;
  }
  return canon;
}
window.getSubjectDisplayName = getSubjectDisplayName;

function setSubjectLanguage(lang) {
  const cleanLang = (lang === 'bn' || lang === 'bangla') ? 'bn' : 'en';
  const track = getUserTrack();
  track.subjectLanguage = cleanLang;
  saveUserTrack(track);
  syncAllSubjectSelects();
  if (typeof renderProfileTrackCard === 'function') renderProfileTrackCard();
  if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
  if (typeof renderRoutine === 'function') renderRoutine();
  if (typeof renderCategories === 'function') renderCategories();
  if (typeof renderTrackerRoutinePreview === 'function') renderTrackerRoutinePreview();
  if (typeof renderMCQFilterBar === 'function') renderMCQFilterBar();
  if (typeof showToast === 'function') {
    showToast(`Subject language set to ${cleanLang === 'bn' ? 'বাংলা (Bangla)' : 'English'}`);
  }
}
window.setSubjectLanguage = setSubjectLanguage;

function subjectList() {
  return masterSubjectList(false);
}

function renderSubjectSelect() {
  const sel = document.getElementById('sessionSubject');
  const datalist = document.getElementById('appSubjectDatalist');
  const subs = subjectList();
  const currentLang = typeof getUserTrack === 'function' ? (getUserTrack().subjectLanguage || 'en') : 'en';

  // 1. Sync global datalist for Routine and Syllabus
  if (datalist) {
    const optionsMap = new Map();
    subs.forEach(s => {
      const canon = canonicalSubjectName(s);
      const display = getSubjectDisplayName(s, currentLang);
      optionsMap.set(display.toLowerCase(), display);
      if (display !== canon) {
        optionsMap.set(canon.toLowerCase(), canon);
      }
    });
    datalist.innerHTML = Array.from(optionsMap.values()).map(v => `<option value="${escapeAttr(v)}"></option>`).join('');
  }

  // 2. Populate Tracker dropdown
  if (sel) {
    const previousValue = sel.value || (state.activeSession ? state.activeSession.subject : '') || '';
    const previousCustomValue = sessionCustomInput ? sessionCustomInput.value : '';

    sel.innerHTML = subs.map(s => {
      const canon = canonicalSubjectName(s);
      const display = getSubjectDisplayName(s, currentLang);
      const label = display;
      return `<option value="${escapeAttr(canon)}">${escapeHtml(label)}</option>`;
    }).join('')
      + '<option value="__custom__">+ Add New Subject</option>';

    let nextValue = '';
    if (previousValue === '__custom__' || (previousCustomValue && previousValue === '')) {
      nextValue = '__custom__';
    } else if (previousValue && subs.map(canonicalSubjectName).includes(canonicalSubjectName(previousValue))) {
      nextValue = canonicalSubjectName(previousValue);
    } else if (subs.length) {
      nextValue = canonicalSubjectName(subs[0]);
    }

    if (nextValue) {
      sel.value = nextValue;
    }

    if (sessionCustomInput) {
      sessionCustomInput.style.display = sel.value === '__custom__' ? 'block' : 'none';
      if (sel.value === '__custom__') {
        sessionCustomInput.value = previousCustomValue || '';
      } else {
        sessionCustomInput.value = '';
      }
    }
  }
}


// Cascading Subject Mutation (Rename, Delete, Restore, Sync)
function renameSubject(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  const oldCanonical = canonicalSubjectName(oldName).toLowerCase();

  // 1. Routine
  if (Array.isArray(state.routine)) {
    state.routine.forEach(r => {
      if (canonicalSubjectName(r.subject).toLowerCase() === oldCanonical) {
        r.subject = newName;
      }
    });
  }

  // 2. Sessions
  if (Array.isArray(state.sessions)) {
    state.sessions.forEach(s => {
      if (canonicalSubjectName(s.subject).toLowerCase() === oldCanonical) {
        s.subject = newName;
      }
    });
  }

  // 3. Active session
  if (state.activeSession && canonicalSubjectName(state.activeSession.subject).toLowerCase() === oldCanonical) {
    state.activeSession.subject = newName;
  }

  // 4. Custom subjects
  if (Array.isArray(state.customSubjects)) {
    const idx = state.customSubjects.findIndex(c => canonicalSubjectName(c).toLowerCase() === oldCanonical);
    if (idx !== -1) {
      state.customSubjects[idx] = newName;
    } else {
      state.customSubjects.push(newName);
    }
  } else {
    state.customSubjects = [newName];
  }

  // 5. Syllabus categories
  if (Array.isArray(state.syllabus)) {
    state.syllabus.forEach(cat => {
      if (canonicalSubjectName(cat.name).toLowerCase() === oldCanonical) {
        cat.name = newName;
      }
    });
  }

  // 6. Flashcards
  if (Array.isArray(state.flashcards)) {
    state.flashcards.forEach(fc => {
      if (canonicalSubjectName(fc.category).toLowerCase() === oldCanonical) {
        fc.category = newName;
      }
    });
  }

  // 7. Deleted subjects
  if (Array.isArray(state.deletedSubjects)) {
    state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== oldCanonical);
  }

  saveData();
  syncAllSubjectSelects();
  renderRoutine();
  renderCategories();
  if (typeof renderFlashcards === 'function') renderFlashcards();
  renderTrackerRoutinePreview();
  showToast(`Renamed "${oldName}" to "${newName}" across all data.`);
}

function deleteSubject(subj) {
  if (!subj) return;
  const canonical = canonicalSubjectName(subj);
  const confirmed = confirm(`Permanently remove subject "${subj}" for your profile?\n\nThis will remove it from all subject pickers, curriculum cards, and auto-generated lists. (Your past study sessions and routine entries will be safely preserved in history).`);
  if (!confirmed) return;

  if (!Array.isArray(state.deletedSubjects)) state.deletedSubjects = [];
  if (!state.deletedSubjects.some(s => canonicalSubjectName(s).toLowerCase() === canonical.toLowerCase())) {
    state.deletedSubjects.push(canonical);
  }

  // Remove from custom subjects if present
  if (Array.isArray(state.customSubjects)) {
    state.customSubjects = state.customSubjects.filter(c => canonicalSubjectName(c).toLowerCase() !== canonical.toLowerCase());
  }

  saveData();
  syncAllSubjectSelects();
  if (typeof renderProfileTrackCard === 'function') renderProfileTrackCard();
  if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
  showToast(`"${subj}" permanently removed from your active curriculum.`);
}

function restoreSubject(subj) {
  if (!subj) return;
  const canonical = canonicalSubjectName(subj).toLowerCase();
  if (Array.isArray(state.deletedSubjects)) {
    state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== canonical);
  }
  saveData();
  syncAllSubjectSelects();
  if (typeof renderProfileTrackCard === 'function') renderProfileTrackCard();
  if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
  showToast(`"${subj}" restored to active subjects.`);
}

function syncAllSubjectSelects() {
  renderSubjectSelect();
  if (typeof renderFlashCategoryOptions === 'function') renderFlashCategoryOptions();
  renderSubjectManager();
  if (typeof renderMCQFilterBar === 'function') {
    renderMCQFilterBar();
  }
  const newSubjSel = document.getElementById('new-subject');
  if (newSubjSel) {
    const subs = subjectList();
    const curVal = newSubjSel.value;
    newSubjSel.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('');
    if (curVal && subs.includes(curVal)) newSubjSel.value = curVal;
  }
}

