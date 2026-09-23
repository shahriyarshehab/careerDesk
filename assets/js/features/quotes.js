/* ==========================================================================
   CareerDesk — Quotes Module: Motivation Ticker, Carousel & Wallpaper
   ========================================================================== */

const ownQuotes = [
  'Discipline is the bridge between goals and accomplishment.',
  'Small daily improvements over time lead to stunning results.',
  'Push yourself because no one else is going to do it for you.',
  'Success does not come from what you do occasionally; it comes from what you do consistently.',
  'Focus on the process, and the results will take care of themselves.',
  'Your future is created by what you do today, not tomorrow.',
  'Hard work beats talent when talent fails to work hard.',
  'Study while others are sleeping; prepare while others are playing.',
  'Do not decrease the goal. Increase the effort.',
  'Every expert was once a beginner.',
  'Believe you can and you are halfway there.',
  'It always seems impossible until it is done.',
  'The secret of getting ahead is getting started.',
  'The harder you work for something, the greater you will feel when you achieve it.',
  'Wake up with determination. Go to bed with satisfaction.',
  'Do something today that your future self will thank you for.'
];

const famousQuotes = [
  { q: 'Believe you can and you are halfway there.', a: 'Theodore Roosevelt' },
  { q: 'Success is the sum of small efforts, repeated day in and day out.', a: 'Robert Collier' },
  { q: 'The best way to predict the future is to create it.', a: 'Abraham Lincoln' },
  { q: 'Do not let what you cannot do interfere with what you can do.', a: 'John Wooden' },
  { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
  { q: 'Start where you are. Use what you have. Do what you can.', a: 'Arthur Ashe' },
  { q: 'There are no secrets to success. It is the result of preparation, hard work, and learning from failure.', a: 'Colin Powell' },
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { q: 'There is no substitute for hard work.', a: 'Thomas Edison' },
  { q: 'Success is the progressive realization of a worthy goal.', a: 'Earl Nightingale' },
  { q: 'A person who never made a mistake never tried anything new.', a: 'Albert Einstein' },
  { q: 'Education is the most powerful weapon which you can use to change the world.', a: 'Nelson Mandela' },
  { q: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', a: 'Aristotle' },
  { q: 'The way to get started is to quit talking and begin doing.', a: 'Walt Disney' },
  { q: 'Whether you think you can or think you cannot, you are right.', a: 'Henry Ford' },
  { q: 'Success is not final, failure is not fatal: It is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: 'I have failed over and over again in my life. And that is why I succeed.', a: 'Michael Jordan' },
  { q: 'The future belongs to those who believe in the beauty of their dreams.', a: 'Eleanor Roosevelt' },
  { q: 'It does not matter how slowly you go as long as you do not stop.', a: 'Confucius' },
  { q: 'Whatever the mind of man can conceive and believe, it can achieve.', a: 'Napoleon Hill' }
];

const BILINGUAL_QUOTES = [
  {
    en: "Discipline is the bridge between goals and accomplishment.",
    bn: "শৃঙ্খলা হলো লক্ষ্য এবং অর্জনের মধ্যে সেতুবন্ধন।",
    author: "Jim Rohn"
  },
  {
    en: "Small daily improvements over time lead to stunning results.",
    bn: "প্রতিদিনের ছোট ছোট উন্নতি একসময় অবিশ্বাস্য সাফল্য এনে দেয়।",
    author: "Robin Sharma"
  },
  {
    en: "Push yourself because no one else is going to do it for you.",
    bn: "নিজেকে নিজেই তাগিদ দিন, কারণ অন্য কেউ আপনার হয়ে স্বপ্ন পূরণ করবে না।",
    author: "CareerDesk"
  },
  {
    en: "Success does not come from what you do occasionally; it comes from what you do consistently.",
    bn: "সাফল্য কখনো কখনো করা কাজ থেকে আসে না; এটি আসে নিয়মিত অনুশীলনের মাধ্যমে।",
    author: "Marie Forleo"
  },
  {
    en: "Focus on the process, and the results will take care of themselves.",
    bn: "প্রক্রিয়া এবং অভ্যাসে মনোযোগ দিন, ফলাফল নিজের থেকেই ধরা দেবে।",
    author: "CareerDesk"
  },
  {
    en: "Your future is created by what you do today, not tomorrow.",
    bn: "আপনার ভবিষ্যৎ গড়ে উঠবে আজকের কাজের মাধ্যমে, আগামীকালের ওপর নয়।",
    author: "Robert Kiyosaki"
  },
  {
    en: "Hard work beats talent when talent fails to work hard.",
    bn: "পরিশ্রম সবসময় প্রতিভাকে হারিয়ে দেয়, যখন প্রতিভা কঠোর পরিশ্রম করতে ব্যর্থ হয়।",
    author: "Tim Notke"
  },
  {
    en: "Study while others are sleeping; prepare while others are playing.",
    bn: "অন্যরা যখন ঘুমাচ্ছে তখন আপনি পড়ুন; অন্যরা যখন অলস সময় কাটাচ্ছে তখন আপনি প্রস্তুতি নিন।",
    author: "William Arthur Ward"
  },
  {
    en: "Do not decrease the goal. Increase the effort.",
    bn: "লক্ষ্য ছোট করবেন না; নিজের প্রচেষ্টাকে বহুগুণ বাড়িয়ে দিন।",
    author: "Grant Cardone"
  },
  {
    en: "Every expert was once a beginner.",
    bn: "প্রতিটি দক্ষ মানুষই জীবনের শুরুতে একজন অনভিজ্ঞ শিক্ষার্থী ছিলেন।",
    author: "Helen Hayes"
  },
  {
    en: "Believe you can and you are halfway there.",
    bn: "বিশ্বাস করুন আপনি পারবেন, তবেই আপনার পথচলার অর্ধেক কাজ সম্পন্ন হয়ে যাবে।",
    author: "Theodore Roosevelt"
  },
  {
    en: "It always seems impossible until it is done.",
    bn: "যতক্ষণ পর্যন্ত কাজ সম্পন্ন না হয়, ততক্ষণ পর্যন্ত এটি অসম্ভব বলেই মনে হয়।",
    author: "Nelson Mandela"
  },
  {
    en: "The secret of getting ahead is getting started.",
    bn: "এগিয়ে যাওয়ার একমাত্র গোপন চাবিকাঠি হলো কাজ অবিলম্বে শুরু করে দেওয়া।",
    author: "Mark Twain"
  },
  {
    en: "Wake up with determination. Go to bed with satisfaction.",
    bn: "দৃঢ় সংকল্প নিয়ে সকালে ঘুম থেকে উঠুন, রাতে পরম তৃপ্তি নিয়ে ঘুমাতে যান।",
    author: "George Horace Lorimer"
  },
  {
    en: "The only way to do great work is to love what you do.",
    bn: "মহৎ কাজ করার একমাত্র উপায় হলো আপনি যা করেন তাকে অন্তর থেকে ভালোবাসা।",
    author: "Steve Jobs"
  },
  {
    en: "Start where you are. Use what you have. Do what you can.",
    bn: "আপনি যেখানে আছেন সেখান থেকেই শুরু করুন। যা আছে তা ব্যবহার করুন। যা পারেন তা করে যান।",
    author: "Arthur Ashe"
  },
  {
    en: "Education is the most powerful weapon which you can use to change the world.",
    bn: "শিক্ষাই হলো সবচেয়ে শক্তিশালী অস্ত্র, যা দিয়ে আপনি সারা পৃথিবীকে বদলে দিতে পারেন।",
    author: "Nelson Mandela"
  },
  {
    en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    bn: "আমরা প্রতিদিন যা বারবার করি, তাই আমাদের পরিচয়। উৎকর্ষতা কোনো কাজ নয়, এটি একটি অভ্যাস।",
    author: "Aristotle"
  },
  {
    en: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    bn: "সাফল্যই শেষ কথা নয়, ব্যর্থতাও কোনো সমাপ্তি নয়: লড়াই চালিয়ে যাওয়ার সাহসই আসল বিষয়।",
    author: "Winston Churchill"
  },
  {
    en: "It does not matter how slowly you go as long as you do not stop.",
    bn: "আপনি কতটা ধীরে এগোচ্ছেন তা মুখ্য নয়, যতক্ষণ না আপনি থেমে যাচ্ছেন।",
    author: "Confucius"
  },
  {
    en: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.",
    bn: "সাফল্যের কোনো গোপন রহস্য নেই। এটি হলো প্রস্তুতি, কঠোর পরিশ্রম এবং ভুল থেকে শেখার ফলাফল।",
    author: "Colin Powell"
  },
  {
    en: "There is no substitute for hard work.",
    bn: "কঠোর পরিশ্রমের কোনো বিকল্প নেই।",
    author: "Thomas Edison"
  },
  {
    en: "Your pace is allowed to be slow. Your direction must stay clear.",
    bn: "আপনার গতি ধীর হতে পারে, কিন্তু আপনার দিকনির্দেশনা স্পষ্ট থাকা চাই।",
    author: "CareerDesk"
  },
  {
    en: "One focused hour can change the shape of an entire day.",
    bn: "একটি মনোযোগী ঘণ্টা পুরো দিনের গতিপথ বদলে দিতে পারে।",
    author: "CareerDesk"
  },
  {
    en: "Make progress visible, then make it repeatable.",
    bn: "অগ্রগতিকে দৃশ্যমান করুন, তারপর সেটিকে অভ্যাসে পরিণত করুন।",
    author: "CareerDesk"
  },
  {
    en: "You do not need a perfect plan. You need the next honest step.",
    bn: "আপনার নিখুঁত পরিকল্পনা দরকার নেই; দরকার পরবর্তী সৎ পদক্ষেপটি।",
    author: "CareerDesk"
  }
];



// ===== Quotes Manager =====
const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const quoteIntervals = [10, 30, 60, 120, 300, 600, 900, 1800, 3600];
let quoteRotationTimer = null;
let editingQuoteId = null;

function quoteManagerEntries() {
  const deleted = new Set(state.deletedQuotes || []);

  // 1. User's custom quotes
  const customEntries = (state.customQuotes || []).map(q => ({
    id: String(q.id),
    text: q.text,
    author: q.author || null,
    source: 'custom'
  })).filter(e => !deleted.has(e.id));

  // 2. Curated routine quotes
  const ownEntries = ownQuotes.map((q, i) => ({
    id: `builtin-own-${i}`,
    text: typeof q === 'string' ? q : q.text,
    author: 'CareerDesk',
    source: 'builtin'
  })).filter(e => !deleted.has(e.id));

  // 3. Famous figures quotes
  const famousEntries = famousQuotes.map((q, i) => ({
    id: `builtin-famous-${i}`,
    text: q.q,
    author: q.a,
    source: 'famous'
  })).filter(e => !deleted.has(e.id));

  return [...customEntries, ...ownEntries, ...famousEntries];
}

function currentPool() {
  const entries = quoteManagerEntries();
  if (!entries.length) {
    return [{ q: 'ছোট ছোট প্রতিদিনের চেষ্টাই একদিন বড় সাফল্য তৈরি করে।', a: 'CareerDesk' }];
  }
  return entries.map(e => ({ q: e.text, a: e.author }));
}

function renderQuote() {
  const pool = currentPool();
  if (!pool.length) return;
  if (state.quoteIdx >= pool.length) state.quoteIdx = 0;
  const item = pool[state.quoteIdx];
  if (quoteTextEl) quoteTextEl.textContent = item.q;
  if (quoteAuthorEl) quoteAuthorEl.textContent = item.a ? '— ' + item.a : 'CareerDesk • Daily practice';
  updateTicker(item.a ? item.q + ' — ' + item.a : item.q);

  // Sync with Profile Hero quote card
  const heroText = document.getElementById('profileHeroQuoteText') || document.getElementById('profileHeroQuoteTextGuest');
  const heroAuthor = document.getElementById('profileHeroQuoteAuthor') || document.getElementById('profileHeroQuoteAuthorGuest');
  const cleanQ = typeof cleanQuoteText === 'function' ? cleanQuoteText(item.q) : (item.q || '').replace(/^["'“”]+|["'“”]+$/g, '').trim();
  const cleanA = typeof cleanQuoteAuthor === 'function' ? cleanQuoteAuthor(item.a) : (item.a ? item.a.replace(/^[—\-]\s*/, '').trim() : 'CareerDesk');
  if (heroText) heroText.textContent = `“${cleanQ}”`;
  if (heroAuthor) heroAuthor.textContent = `— ${cleanA}`;
}

function renderQuoteManager() {
  const list = document.getElementById('quoteManagerList');
  const countBadge = document.getElementById('quoteCountBadge');
  if (!list) return;

  const entries = quoteManagerEntries();
  if (countBadge) countBadge.textContent = String(entries.length);

  if (!entries.length) {
    list.innerHTML = `
      <div class="quote-empty-state">
        <svg style="width:28px; height:28px; opacity:0.6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 7 1 8 3 8z"/>
          <path d="M17 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 7 1 8 3 8z"/>
        </svg>
        <span>No active quotes found. Add a quote below to start rotation.</span>
      </div>`;
    return;
  }

  list.innerHTML = entries.map(entry => {
    const badgeClass = entry.source === 'custom' ? 'badge-custom' : (entry.source === 'famous' ? 'badge-famous' : 'badge-builtin');
    const badgeText = entry.source === 'custom' ? 'Custom' : (entry.source === 'famous' ? 'Famous' : 'Curated');
    const authorText = entry.author ? escapeHtml(entry.author) : 'CareerDesk';

    return `
      <div class="quote-item-card" data-quote-id="${escapeAttr(entry.id)}">
        <div class="quote-item-body">
          <div class="quote-item-text">${escapeHtml(entry.text)}</div>
          <div class="quote-item-meta">
            <span class="quote-item-author">— ${authorText}</span>
            <span class="quote-item-badge ${badgeClass}">${badgeText}</span>
          </div>
        </div>
        <div class="quote-item-actions btn-group">
          <button class="quote-action-btn edit-btn" data-edit-quote="${escapeAttr(entry.id)}" type="button" title="Edit Quote">
            ${ICON.edit} <span>Edit</span>
          </button>
          <button class="quote-action-btn delete-btn" data-delete-quote="${escapeAttr(entry.id)}" type="button" title="Delete Quote">
            ${ICON.trash} <span>Delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateTicker(text) {
  const el = document.getElementById('tickerText');
  if (!el) return;
  el.classList.add('fade');
  setTimeout(() => { el.textContent = text; el.classList.remove('fade'); }, 220);
}

function nextQuote() {
  const pool = currentPool();
  if (!pool.length) return;
  state.quoteIdx = (state.quoteIdx + 1) % pool.length;
  renderQuote();
}

function startQuoteRotation() {
  clearInterval(quoteRotationTimer);
  const interval = typeof state.quoteCarouselInterval === 'number' && state.quoteCarouselInterval >= 5
    ? state.quoteCarouselInterval
    : 300;
  state.quoteCarouselInterval = interval;
  quoteRotationTimer = setInterval(nextQuote, interval * 1000);
}

function syncQuoteSettings() {
  const intervalSelect = document.getElementById('quoteIntervalSelect');
  if (intervalSelect) {
    const current = typeof state.quoteCarouselInterval === 'number' ? state.quoteCarouselInterval : 300;
    let opt = intervalSelect.querySelector(`option[value="${current}"]`);
    if (opt) {
      intervalSelect.value = String(current);
    } else {
      const newOpt = document.createElement('option');
      newOpt.value = String(current);
      newOpt.textContent = current < 60 ? `${current} Seconds` : `${Math.round(current / 60)} Minutes`;
      intervalSelect.appendChild(newOpt);
      intervalSelect.value = String(current);
    }
  }
}

// Alias for compatibility
function startQuoteCarousel() { startQuoteRotation(); }
function syncCarouselControls() { syncQuoteSettings(); }

const quoteIntervalSelect = document.getElementById('quoteIntervalSelect');
if (quoteIntervalSelect) {
  quoteIntervalSelect.addEventListener('change', (event) => {
    const val = parseInt(event.target.value, 10) || 300;
    state.quoteCarouselInterval = val;
    startQuoteRotation();
    saveData();
    const label = val < 60 ? `${val} seconds` : `${Math.round(val / 60)} minutes`;
    showToast(`Quotes rotation interval set to ${label}`);
  });
}

// ===== Toggle & Add New Quote (Settings) =====
const toggleQuoteFormBtn = document.getElementById('toggleQuoteFormBtn');
const quoteAddBox = document.getElementById('quoteAddBox');
if (toggleQuoteFormBtn && quoteAddBox) {
  toggleQuoteFormBtn.addEventListener('click', () => {
    const isOpen = quoteAddBox.style.display !== 'none';
    quoteAddBox.style.display = isOpen ? 'none' : 'block';
    toggleQuoteFormBtn.innerHTML = isOpen ? `${ICON.plus} <span>New Quote</span>` : `${ICON.x} <span>Close</span>`;
    toggleQuoteFormBtn.classList.toggle('active-open', !isOpen);
    if (!isOpen) {
      const input = document.getElementById('customQuoteInput');
      if (input) input.focus();
    }
  });
}

const addQuoteBtn = document.getElementById('addQuoteBtn');
if (addQuoteBtn) {
  addQuoteBtn.addEventListener('click', () => {
    const input = document.getElementById('customQuoteInput');
    const authorInput = document.getElementById('customQuoteAuthorInput');
    const text = input ? input.value.trim() : '';
    const author = authorInput ? authorInput.value.trim() || null : null;
    if (!text) {
      showToast('Please enter a quote text', true);
      if (input) input.focus();
      return;
    }
    if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
    state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
    state.quoteIdx = 0;
    if (input) input.value = '';
    if (authorInput) authorInput.value = '';
    if (quoteAddBox && toggleQuoteFormBtn) {
      quoteAddBox.style.display = 'none';
      toggleQuoteFormBtn.innerHTML = `${ICON.plus} <span>New Quote</span>`;
      toggleQuoteFormBtn.classList.remove('active-open');
    }
    renderQuoteManager();
    renderQuote();
    saveData();
    showToast('New quote added to your rotation');
  });
}

// Quote list actions (Edit & Delete delegation)
const quoteManagerList = document.getElementById('quoteManagerList');
if (quoteManagerList) {
  quoteManagerList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-quote]');
    const deleteBtn = e.target.closest('[data-delete-quote]');
    if (editBtn) {
      openEditQuoteModal(editBtn.dataset.editQuote);
    }
    if (deleteBtn) {
      deleteQuoteEntry(deleteBtn.dataset.deleteQuote);
    }
  });
}

function openEditQuoteModal(id) {
  const entry = quoteManagerEntries().find(item => item.id === id);
  if (!entry) return;
  editingQuoteId = id;
  const modal = document.getElementById('editQuoteModal');
  const textInput = document.getElementById('editQuoteTextInput');
  const authorInput = document.getElementById('editQuoteAuthorInput');
  if (textInput) textInput.value = entry.text || '';
  if (authorInput) authorInput.value = entry.author || '';
  if (modal) {
    modal.style.display = 'flex';
    if (textInput) textInput.focus();
  }
}

function closeEditQuoteModal() {
  const modal = document.getElementById('editQuoteModal');
  if (modal) modal.style.display = 'none';
  editingQuoteId = null;
}

function saveEditedQuote() {
  if (!editingQuoteId) return;
  const textInput = document.getElementById('editQuoteTextInput');
  const authorInput = document.getElementById('editQuoteAuthorInput');
  const text = textInput ? textInput.value.trim() : '';
  const author = authorInput ? authorInput.value.trim() || null : null;
  if (!text) {
    showToast('Quote text cannot be empty', true);
    return;
  }

  if (editingQuoteId.startsWith('builtin-')) {
    if (!Array.isArray(state.deletedQuotes)) state.deletedQuotes = [];
    if (!state.deletedQuotes.includes(editingQuoteId)) {
      state.deletedQuotes.push(editingQuoteId);
    }
    if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
    state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
  } else {
    const target = (state.customQuotes || []).find(item => String(item.id) === editingQuoteId);
    if (target) {
      target.text = text;
      target.author = author;
    } else {
      if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
      state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
    }
  }

  closeEditQuoteModal();
  saveData();
  renderQuoteManager();
  renderQuote();
  showToast('Quote updated successfully');
}

function deleteQuoteEntry(id) {
  const entry = quoteManagerEntries().find(item => item.id === id);
  const preview = entry ? `"${entry.text.slice(0, 35)}${entry.text.length > 35 ? '...' : ''}"` : 'this quote';
  if (!window.confirm(`Delete ${preview}?\n\nIt will be removed from your routine rotation.`)) return;

  if (id.startsWith('builtin-')) {
    if (!Array.isArray(state.deletedQuotes)) state.deletedQuotes = [];
    if (!state.deletedQuotes.includes(id)) {
      state.deletedQuotes.push(id);
    }
  } else {
    state.customQuotes = (state.customQuotes || []).filter(item => String(item.id) !== id);
  }

  saveData();
  renderQuoteManager();
  renderQuote();
  showToast('Quote deleted');
}

// Modal event listeners
const closeEditModalBtn = document.getElementById('closeEditQuoteModal');
const cancelEditModalBtn = document.getElementById('cancelEditQuoteBtn');
const saveEditModalBtn = document.getElementById('saveEditQuoteBtn');
const editModalEl = document.getElementById('editQuoteModal');

if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditQuoteModal);
if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeEditQuoteModal);
if (saveEditModalBtn) saveEditModalBtn.addEventListener('click', saveEditedQuote);
if (editModalEl) {
  editModalEl.addEventListener('click', (e) => {
    if (e.target === editModalEl) closeEditQuoteModal();
  });
}

/* ==========================================================================
   BILINGUAL MOTIVATIONAL TYPEWRITER ENGINE (English -> Bangla with Duration)
   Realistic human cadence + silky smooth layout-stable transitions
   ========================================================================== */

let quoteTypewriterTimeout = null;
let quoteHoldTimeout = null;
let quoteHoldStartTime = 0;
let quoteHoldRemaining = 0;
let quoteHoldDuration = 5500; // 5.5 seconds comfortable reading duration
let quoteIsPaused = false;
let quoteIsHovered = false;
let quoteActiveLang = 'en'; // 'en' | 'bn'
let quoteActiveIndex = 0;
let quoteCharIndex = 0;
let quotePhase = 'typing'; // 'typing' | 'holding' | 'transitioning'

function getGraphemeArray(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment);
    } catch (e) { }
  }
  return Array.from(String(text || ''));
}

function getRealisticTypingDelay(currentChar, nextChar) {
  // Realistic human cadence: 55ms to 85ms base
  let delay = Math.floor(Math.random() * 30) + 60;

  // Space between words: thoughtful human breath
  if (currentChar === ' ') {
    delay += Math.floor(Math.random() * 30) + 40; // ~100ms - 130ms
  }
  // Soft punctuation (comma, semicolon, colon, dash)
  else if (currentChar === ',' || currentChar === ';' || currentChar === ':' || currentChar === '-' || currentChar === '—') {
    delay += Math.floor(Math.random() * 60) + 220; // ~280ms - 340ms
  }
  // Sentence ending punctuation (period, exclamation, question mark, Bengali Dari '।')
  else if (currentChar === '.' || currentChar === '!' || currentChar === '?' || currentChar === '।') {
    delay += Math.floor(Math.random() * 80) + 360; // ~420ms - 500ms
  }

  return delay;
}

function getBilingualQuotesPool() {
  const pool = (typeof BILINGUAL_QUOTES !== 'undefined' && Array.isArray(BILINGUAL_QUOTES)) ? BILINGUAL_QUOTES : [];
  const custom = (state && Array.isArray(state.customQuotes)) ? state.customQuotes : [];
  const deleted = new Set((state && state.deletedQuotes) || []);

  const activeCustom = custom.filter(c => !deleted.has(String(c.id))).map(c => ({
    en: c.text,
    bn: c.bn || c.text,
    author: c.author || 'Custom'
  }));

  const combined = [...pool, ...activeCustom];
  return combined.length > 0 ? combined : [{ en: "Small daily improvements over time lead to stunning results.", bn: "প্রতিদিনের ছোট ছোট উন্নতি একসময় অবিশ্বাস্য সাফল্য এনে দেয়।", author: "CareerDesk" }];
}

function stopQuoteTypewriter() {
  if (quoteTypewriterTimeout) {
    clearTimeout(quoteTypewriterTimeout);
    quoteTypewriterTimeout = null;
  }
  if (quoteHoldTimeout) {
    clearTimeout(quoteHoldTimeout);
    quoteHoldTimeout = null;
  }
}

function renderQuoteFrame() {
  stopQuoteTypewriter();

  if (quoteIsPaused) return;

  const textEl = document.getElementById('profileQuoteTypedText');
  const langTextEl = document.getElementById('profileQuoteLangText');
  const langBadgeEl = document.getElementById('profileQuoteLangBadge');
  const authorEl = document.getElementById('profileQuoteAuthorPill');
  const cursorEl = document.getElementById('profileQuoteCursor');
  const progressFill = document.getElementById('profileQuoteProgressFill');

  if (!textEl) return;

  const pool = getBilingualQuotesPool();
  const currentQuote = pool[((quoteActiveIndex % pool.length) + pool.length) % pool.length];
  if (!currentQuote) return;

  // Determine current text
  const rawText = (quoteActiveLang === 'en' ? currentQuote.en : currentQuote.bn) || currentQuote.en || '';
  const cleanText = typeof cleanQuoteText === 'function' ? cleanQuoteText(rawText) : rawText.trim();
  // Update language badge & author
  if (langTextEl) langTextEl.textContent = quoteActiveLang === 'en' ? 'EN' : 'BN';
  if (langBadgeEl) {
    langBadgeEl.classList.toggle('bangla', quoteActiveLang === 'bn');
    langBadgeEl.title = quoteActiveLang === 'en' ? 'Language: English (Click for বাংলা)' : 'Language: বাংলা (Click for English)';
  }
  if (authorEl) {
    const authorName = typeof cleanQuoteAuthor === 'function' ? cleanQuoteAuthor(currentQuote.author) : (currentQuote.author || 'CareerDesk');
    authorEl.textContent = `— ${authorName}`;
  }

  textEl.textContent = cleanText;
  textEl.classList.remove('quote-text-fade-out');
  textEl.classList.remove('quote-text-reveal');
  void textEl.offsetWidth;
  textEl.classList.add('quote-text-reveal');
  quotePhase = 'holding';
  quoteCharIndex = 0;
  if (cursorEl) cursorEl.classList.add('quote-cursor-hidden');
  if (progressFill) {
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    progressFill.style.opacity = '1';
  }
  quoteHoldRemaining = quoteHoldDuration;
  startQuoteHoldTimer();
}

// Kept as a compatibility alias for existing pause/resume callers.
function stepQuoteTypewriter() {
  renderQuoteFrame();
}

function startQuoteHoldTimer() {
  const progressFill = document.getElementById('profileQuoteProgressFill');
  if (progressFill) {
    progressFill.style.transition = `width ${quoteHoldRemaining}ms linear`;
    progressFill.style.width = '100%';
  }
  quoteHoldStartTime = Date.now();

  quoteHoldTimeout = setTimeout(() => {
    // Graceful smooth fade transition to next language or next quote
    smoothTransitionNext(false);
  }, quoteHoldRemaining);
}

function pauseQuoteHoldTimer() {
  if (quoteHoldTimeout) {
    clearTimeout(quoteHoldTimeout);
    quoteHoldTimeout = null;
    const elapsed = Date.now() - quoteHoldStartTime;
    quoteHoldRemaining = Math.max(0, quoteHoldRemaining - elapsed);
    const progressFill = document.getElementById('profileQuoteProgressFill');
    if (progressFill) {
      const computedWidth = window.getComputedStyle(progressFill).width;
      progressFill.style.transition = 'none';
      progressFill.style.width = computedWidth;
    }
  }
}

function resumeQuoteHoldTimer() {
  if (quotePhase === 'holding' && !quoteIsPaused && !quoteIsHovered) {
    startQuoteHoldTimer();
  }
}

function smoothTransitionNext(forceNextQuote = false) {
  stopQuoteTypewriter();
  quotePhase = 'transitioning';

  const textEl = document.getElementById('profileQuoteTypedText');
  const authorEl = document.getElementById('profileQuoteAuthorPill');
  const cursorEl = document.getElementById('profileQuoteCursor');
  const progressFill = document.getElementById('profileQuoteProgressFill');

  if (progressFill) {
    progressFill.style.transition = 'opacity 0.25s ease';
    progressFill.style.opacity = '0';
  }

  if (textEl) textEl.classList.add('quote-text-fade-out');
  if (authorEl) authorEl.classList.add('quote-text-fade-out');
  if (cursorEl) cursorEl.classList.add('quote-cursor-hidden');

  setTimeout(() => {
    const pool = getBilingualQuotesPool();
    if (forceNextQuote) {
      quoteActiveLang = 'en';
      quoteActiveIndex = (quoteActiveIndex + 1) % pool.length;
    } else {
      if (quoteActiveLang === 'en') {
        quoteActiveLang = 'bn';
      } else {
        quoteActiveLang = 'en';
        quoteActiveIndex = (quoteActiveIndex + 1) % pool.length;
      }
    }

    quoteCharIndex = 0;
    quotePhase = 'holding';

    if (textEl) {
      textEl.textContent = '';
      textEl.classList.remove('quote-text-fade-out');
    }
    if (authorEl) {
      authorEl.classList.remove('quote-text-fade-out');
    }
    if (cursorEl) cursorEl.classList.add('quote-cursor-hidden');

    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
      progressFill.style.opacity = '1';
    }

    quoteTypewriterTimeout = setTimeout(renderQuoteFrame, 340);
  }, 320);
}

function toggleQuoteTypewriterPause() {
  quoteIsPaused = !quoteIsPaused;
  const pauseBtns = document.querySelectorAll('#btnToggleQuotePause');

  if (quoteIsPaused) {
    if (quotePhase === 'holding') pauseQuoteHoldTimer();
    stopQuoteTypewriter();
    pauseBtns.forEach(btn => {
      btn.innerHTML = '<i data-lucide="play" style="width:13px;height:13px;"></i>';
      btn.title = 'Resume quote typing animation';
    });
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  } else {
    pauseBtns.forEach(btn => {
      btn.innerHTML = '<i data-lucide="pause" style="width:13px;height:13px;"></i>';
      btn.title = 'Pause quote typing animation';
    });
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    if (quotePhase === 'holding') {
      resumeQuoteHoldTimer();
    } else {
      stepQuoteTypewriter();
    }
  }
}

function skipToNextQuoteTypewriter() {
  smoothTransitionNext(true);
}

function toggleQuoteLanguageManual() {
  stopQuoteTypewriter();
  quotePhase = 'transitioning';

  const textEl = document.getElementById('profileQuoteTypedText');
  const authorEl = document.getElementById('profileQuoteAuthorPill');
  const cursorEl = document.getElementById('profileQuoteCursor');

  if (textEl) textEl.classList.add('quote-text-fade-out');
  if (authorEl) authorEl.classList.add('quote-text-fade-out');
  if (cursorEl) cursorEl.classList.add('quote-cursor-hidden');

  setTimeout(() => {
    quoteActiveLang = quoteActiveLang === 'en' ? 'bn' : 'en';
    quoteCharIndex = 0;
    quotePhase = 'holding';

    if (textEl) {
      textEl.textContent = '';
      textEl.classList.remove('quote-text-fade-out');
    }
    if (authorEl) {
      authorEl.classList.remove('quote-text-fade-out');
    }
    if (cursorEl) cursorEl.classList.add('quote-cursor-hidden');

    const progressFill = document.getElementById('profileQuoteProgressFill');
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }

    quoteTypewriterTimeout = setTimeout(renderQuoteFrame, 260);
  }, 300);
}

function initProfileQuoteTypewriter() {
  const container = document.getElementById('profileHeroQuoteTicker');
  const textEl = document.getElementById('profileQuoteTypedText');
  if (!container || !textEl) return;

  stopQuoteTypewriter();

  // Wire all Pause Buttons
  document.querySelectorAll('#btnToggleQuotePause').forEach(btn => {
    if (!btn._bound) {
      btn._bound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQuoteTypewriterPause();
      });
    }
  });

  // Wire all Next/Cycle Buttons (signed-in & guest)
  document.querySelectorAll('.btn-cycle-profile-hero-quote, #btnCycleProfileHeroQuote, #btnCycleProfileHeroQuoteGuest').forEach(btn => {
    if (!btn._bound) {
      btn._bound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipToNextQuoteTypewriter();
      });
    }
  });

  // Wire all Language Badges
  document.querySelectorAll('#profileQuoteLangBadge').forEach(badge => {
    if (!badge._bound) {
      badge._bound = true;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQuoteLanguageManual();
      });
    }
  });

  // Hover Pause/Resume
  if (container && !container._boundHover) {
    container._boundHover = true;
    container.addEventListener('mouseenter', () => {
      quoteIsHovered = true;
      if (quotePhase === 'holding' && !quoteIsPaused) pauseQuoteHoldTimer();
    });
    container.addEventListener('mouseleave', () => {
      quoteIsHovered = false;
      if (quotePhase === 'holding' && !quoteIsPaused) resumeQuoteHoldTimer();
    });
  }

  // Start typing from beginning if fresh
  quoteCharIndex = 0;
  quotePhase = 'holding';
  textEl.textContent = '';
  renderQuoteFrame();
}

window.initProfileQuoteTypewriter = initProfileQuoteTypewriter;
window.skipToNextQuoteTypewriter = skipToNextQuoteTypewriter;
window.toggleQuoteTypewriterPause = toggleQuoteTypewriterPause;


