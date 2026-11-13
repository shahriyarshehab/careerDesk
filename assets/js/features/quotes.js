/* ==========================================================================
   CareerDesk — Quotes Module: Motivation Ticker, Carousel & Wallpaper
   ========================================================================== */

/* --------------------------------------------------------------------------
   Curated quote pool — single source of truth for every quote surface:
   - Home motivational ticker / carousel (English text)
   - Settings quote manager (English text)
   - Profile hero typewriter (English -> বাংলা)
   -------------------------------------------------------------------------- */
const CURATED_QUOTES = [
  {
    en: 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.',
    bn: 'শিক্ষাই ভবিষ্যতের পাসপোর্ট, কারণ আগামীকাল তাদেরই যারা আজই প্রস্তুতি নেয়।',
    author: 'Malcolm X'
  },
  {
    en: 'The beautiful thing about learning is that no one can take it away from you.',
    bn: 'শেখার সবচেয়ে সুন্দর দিক হলো, অর্জিত জ্ঞান কেউ আপনার কাছ থেকে কেড়ে নিতে পারে না।',
    author: 'B.B. King'
  },
  {
    en: "Believe you can and you're halfway there.",
    bn: 'নিজের ওপর বিশ্বাস রাখুন, তাতেই অর্ধেক পথ পেরিয়ে যাবেন।',
    author: 'Theodore Roosevelt'
  },
  {
    en: "Hard work beats talent when talent doesn't work hard.",
    bn: 'পরিশ্রম প্রতিভাকে হারিয়ে দেয়, যখন প্রতিভা কঠোর পরিশ্রম করতে চায় না।',
    author: 'Tim Notke'
  },
  {
    en: "It always seems impossible until it's done.",
    bn: 'কাজটি সম্পন্ন হওয়ার আগ পর্যন্ত সবকিছুই অসম্ভব বলেই মনে হয়।',
    author: 'Nelson Mandela'
  },
  {
    en: 'A person who never made a mistake never tried anything new.',
    bn: 'যে ব্যক্তি কখনো ভুল করেনি, সে কখনো নতুন কিছু করার চেষ্টাও করেনি।',
    author: 'Albert Einstein'
  },
  {
    en: "You don't have to see the whole staircase, just take the first step.",
    bn: 'গোটা সিঁড়িটা দেখতে হবে না, শুধু প্রথম ধাপটি ফেলুন।',
    author: 'Martin Luther King Jr.'
  },
  {
    en: 'Doubt kills more dreams than failure ever will.',
    bn: 'ব্যর্থতার চেয়ে সন্দেহই বেশি স্বপ্ন নষ্ট করে।',
    author: 'Suzy Kassem'
  },
  {
    en: 'There are no shortcuts to any place worth going.',
    bn: 'যে গন্তব্যে পৌঁছানোর মতো মূল্য আছে, সেখানে পৌঁছানোর কোনো শর্টকাট নেই।',
    author: 'Beverly Sills'
  },
  {
    en: 'Success is not final; failure is not fatal: It is the courage to continue that counts.',
    bn: 'সাফল্যই শেষ কথা নয়, ব্যর্থতাও প্রাণঘাতী নয়; লড়াই চালিয়ে যাওয়ার সাহসই আসল।',
    author: 'Winston S. Churchill'
  },
  {
    en: "Whether you think you can or think you can't, you're right.",
    bn: 'আপনি পারেন বলে ভাবুন বা না পারেন বলে ভাবুন — দুটোতেই আপনি সঠিক।',
    author: 'Henry Ford'
  },
  {
    en: 'Success is the sum of small efforts, repeated day-in and day-out.',
    bn: 'প্রতিদিনের ছোট ছোট প্রচেষ্টার যোগফলই একদিন সাফল্য হয়ে ধরা দেয়।',
    author: 'Robert Collier'
  },
  {
    en: 'The only way to do great work is to love what you do.',
    bn: 'মহৎ কাজ করার একমাত্র উপায় হলো যা করছেন তা অন্তর থেকে ভালোবাসা।',
    author: 'Steve Jobs'
  },
  {
    en: "Opportunities don't happen. You create them.",
    bn: 'সুযোগ নিজে থেকে আসে না; আপনাকে তা তৈরি করতে হয়।',
    author: 'Chris Grosser'
  },
  {
    en: 'Action breeds confidence and courage. If you want to conquer fear, do not sit at home and think about it. Go out and get busy.',
    bn: 'কর্মই আত্মবিশ্বাস ও সাহস সৃষ্টি করে। ভয়কে জয় করতে চাইলে ঘরে বসে ভাবনার সময় নষ্ট করবেন না; বেরিয়ে পড়ুন এবং কাজে লেগে যান।',
    author: 'Dale Carnegie'
  },
  {
    en: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    bn: 'আমরা যা বারবার করি, তাই আমাদের পরিচয়। তাই উৎকর্ষ কোনো একক কাজ নয়, এটি একটি অভ্যাস।',
    author: 'Aristotle'
  },
  {
    en: 'The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.',
    bn: 'সাফল্যের প্রথম ধাপ শুরু হয় তখনই, যখন আপনি যে পরিবেশে আছেন তার বন্দি হতে অস্বীকার করেন।',
    author: 'Mark Caine'
  }
];

// ===== Quotes Manager =====
const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const QUOTE_ROTATION_INTERVAL_MS = 300000;
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

  // 2. Curated bilingual quotes (English text is listed here)
  const curatedEntries = CURATED_QUOTES.map((q, i) => ({
    id: `builtin-curated-${i}`,
    text: q.en,
    author: q.author,
    source: 'curated'
  })).filter(e => !deleted.has(e.id));

  return [...customEntries, ...curatedEntries];
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
    const badgeClass = entry.source === 'custom' ? 'badge-custom' : 'badge-builtin';
    const badgeText = entry.source === 'custom' ? 'Custom' : 'Curated';
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
  quoteRotationTimer = setInterval(nextQuote, QUOTE_ROTATION_INTERVAL_MS);
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
  const pool = (typeof CURATED_QUOTES !== 'undefined' && Array.isArray(CURATED_QUOTES))
    ? CURATED_QUOTES.filter((q, i) => !((state && state.deletedQuotes) || []).includes(`builtin-curated-${i}`))
    : [];
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

/* --------------------------------------------------------------------------
   Dashboard quote card: author portrait replaces the static quote icon.
   Portraits are hard-coded Wikimedia images (public domain / CC) so they stay
   stable without a lookup API. Authors with no known portrait use `null` and
   fall back to the generic author avatar in .quote-author-avatar-fallback.
   -------------------------------------------------------------------------- */
const AUTHOR_PHOTOS = {
  'Malcolm X': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Malcolm_X_1964_press_photo_%28cropped%29_%28lighting_diff%29.jpg/330px-Malcolm_X_1964_press_photo_%28cropped%29_%28lighting_diff%29.jpg',
  'B.B. King': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Bbking.jpg/330px-Bbking.jpg',
  'Theodore Roosevelt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Theodore_Roosevelt_by_the_Pach_Bros_%284x5_cropped%29_%283%29.jpg/330px-Theodore_Roosevelt_by_the_Pach_Bros_%284x5_cropped%29_%283%29.jpg',
  'Tim Notke': null,
  'Nelson Mandela': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/330px-Nelson_Mandela_1994.jpg',
  'Albert Einstein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head_cleaned.jpg/330px-Albert_Einstein_Head_cleaned.jpg',
  'Martin Luther King Jr.': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Martin_Luther_King%2C_Jr._and_Lyndon_Johnson_%28cropped%29.jpg/330px-Martin_Luther_King%2C_Jr._and_Lyndon_Johnson_%28cropped%29.jpg',
  'Suzy Kassem': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Suzy-kassem.jpg',
  'Beverly Sills': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Beverly_Sills_by_Van_Vechten.jpg',
  'Winston S. Churchill': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Winston_Churchill_As_Prime_Minister_1940-1945_MH26392.jpg/330px-Winston_Churchill_As_Prime_Minister_1940-1945_MH26392.jpg',
  'Henry Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Henry_Ford_portrait_1915_original_%283x4_cropped%29.png/330px-Henry_Ford_portrait_1915_original_%283x4_cropped%29.png',
  'Robert Collier': null,
  'Steve Jobs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg/330px-Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg',
  'Chris Grosser': null,
  'Dale Carnegie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Dale_Carnegie_%281937%29.jpg/330px-Dale_Carnegie_%281937%29.jpg',
  'Aristotle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/330px-Aristotle_Altemps_Inv8575.jpg',
  'Mark Caine': null
};

function updateQuoteAuthorAvatar(author) {
  const badge = document.getElementById('homeQuoteAuthorAvatar');
  if (!badge) return;

  const name = String(author || 'CareerDesk').trim() || 'CareerDesk';
  if (badge.dataset.author === name) return;
  badge.dataset.author = name;
  badge.title = name;

  const fallback = badge.querySelector('.quote-author-avatar-fallback');
  const existing = badge.querySelector('img');
  const src = Object.prototype.hasOwnProperty.call(AUTHOR_PHOTOS, name) ? AUTHOR_PHOTOS[name] : null;

  if (!src) {
    if (existing) existing.remove();
    if (fallback) fallback.style.display = '';
    return;
  }

  if (fallback) fallback.style.display = 'none';
  if (existing && existing.getAttribute('src') === src) return;
  const img = existing || document.createElement('img');
  img.alt = name;
  img.decoding = 'async';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    img.remove();
    if (fallback) fallback.style.display = '';
  }, { once: true });
  img.src = src;
  if (!existing) badge.prepend(img);
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

  updateQuoteAuthorAvatar(currentQuote.author);

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

