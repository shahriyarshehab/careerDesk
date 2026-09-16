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
    deletedQuotes: []
  };
}

function isMockFlashcard(f) {
  if (!f) return true;
  if (typeof f.id === 'number' && f.id >= 1 && f.id <= 25) return true;
  const mockKeywords = [
    'Ephemeral', 'Venerate', 'Millennium', 'kick the bucket', 'Look forward to',
    'চর্যাপদ', 'দুর্গেশনন্দিনী', 'গীতাঞ্জলি', 'ধূমকেতু', 'রক্তাক্ত প্রান্তর',
    'সন্ধি', 'সূর্য', 'ত্রিভুজ', 'মৌলিক সংখ্যা', 'বৃত্তের ক্ষেত্রফল', 'x + y = 7',
    'মুজিবনগর সরকার', 'জাতীয় সংসদের মোট আসন', 'মেঘনা নদী', 'জাতিসংঘের (United Nations)',
    'জাপানের মুদ্রা', 'সাহারা মরুভূমি', 'মস্তিষ্ক', 'ভিটামিন K', 'HTTPS এর ডিফল্ট পোর্ট'
  ];
  return mockKeywords.some(k => f.front && f.front.includes(k));
}

function isMockRoutineTask(r) {
  if (!r) return true;
  const mockTasks = [
    'Literature & Grammar Review',
    'Grammar & High-Yield Vocabulary Review',
    'Quantitative Aptitude & Problem Solving',
    'Current Affairs & Bangladesh/International',
    'Critical Reasoning & Problem Solving'
  ];
  return mockTasks.includes(r.task);
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
  deletedSubjects: [], customSubjects: [], deletedQuotes: []
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
  'general science': 'General Knowledge',
  'সাধারণ বিজ্ঞান': 'General Knowledge',
  'computer & ict': 'General Knowledge',
  'কম্পিউটার ও আইসিটি': 'General Knowledge',
  'geography & environment': 'General Knowledge',
  'ভূগোল ও পরিবেশ': 'General Knowledge',
  'ethics & good governance': 'General Knowledge',
  'নৈতিকতা ও সুশাসন': 'General Knowledge'
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

function subjectList() {
  return masterSubjectList(false);
}

function renderSubjectSelect() {
  const sel = document.getElementById('sessionSubject');
  const datalist = document.getElementById('appSubjectDatalist');
  const subs = subjectList();

  // 1. Sync global datalist for Routine and Syllabus
  if (datalist) {
    datalist.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}"></option>`).join('');
  }

  // 2. Populate Tracker dropdown
  if (sel) {
    const previousValue = sel.value || (state.activeSession ? state.activeSession.subject : '') || '';
    const previousCustomValue = sessionCustomInput ? sessionCustomInput.value : '';

    sel.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')
      + '<option value="__custom__">+ Add New Subject</option>';

    let nextValue = '';
    if (previousValue === '__custom__' || (previousCustomValue && previousValue === '')) {
      nextValue = '__custom__';
    } else if (previousValue && subs.includes(previousValue)) {
      nextValue = previousValue;
    } else if (subs.length) {
      nextValue = subs[0];
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
  renderFlashcards();
  renderTrackerRoutinePreview();
  showToast(`Renamed "${oldName}" to "${newName}" across all data.`);
}

function deleteSubject(subj) {
  if (!subj) return;
  const confirmed = confirm(`Delete / hide subject "${subj}"?\n\nThis will remove it from all subject pickers (Routine, Tracker, Syllabus, Quiz). Your past study sessions and routine entries will be safely preserved.`);
  if (!confirmed) return;

  if (!Array.isArray(state.deletedSubjects)) state.deletedSubjects = [];
  const canonical = canonicalSubjectName(subj);
  if (!state.deletedSubjects.some(s => canonicalSubjectName(s).toLowerCase() === canonical.toLowerCase())) {
    state.deletedSubjects.push(canonical);
  }
  saveData();
  syncAllSubjectSelects();
  showToast(`"${subj}" removed from active subjects.`);
}

function restoreSubject(subj) {
  if (!subj) return;
  const canonical = canonicalSubjectName(subj).toLowerCase();
  if (Array.isArray(state.deletedSubjects)) {
    state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== canonical);
  }
  saveData();
  syncAllSubjectSelects();
  showToast(`"${subj}" restored to active subjects.`);
}

function syncAllSubjectSelects() {
  renderSubjectSelect();
  renderFlashCategoryOptions();
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

