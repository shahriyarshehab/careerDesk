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

// ===== Wallpaper export (1920x1080 desktop ratio) =====
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    try {
      await document.fonts.load('700 60px "Baloo Da 2"');
      await document.fonts.load('400 30px "Hind Siliguri"');
      await document.fonts.ready;
    } catch (e) { }

    const canvas = document.getElementById('exportCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const dark = state.theme === 'dark';

    const grad = ctx.createLinearGradient(0, 0, W, H);
    if (dark) { grad.addColorStop(0, '#151233'); grad.addColorStop(1, '#0A2A3A'); }
    else { grad.addColorStop(0, '#EDE9FF'); grad.addColorStop(1, '#DFF7F1'); }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    function blob(x, y, r, color, alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    blob(W * 0.12, H * 0.12, 420, dark ? '#8B7CFF' : '#6E56FF', 0.5);
    blob(W * 0.9, H * 0.9, 400, dark ? '#33E0C7' : '#12B8A3', 0.45);

    const pool = currentPool();
    const item = pool[state.quoteIdx] || pool[0];

    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? '#EAEEF9' : '#171A2B';
    ctx.font = '700 58px "Baloo Da 2", sans-serif';
    wrapText(ctx, item.q, W / 2, H / 2 - 30, W - 320, 78);

    ctx.fillStyle = dark ? '#9BA5C0' : '#5B6178';
    ctx.font = '400 30px "Hind Siliguri", sans-serif';
    ctx.fillText(item.a ? ('— ' + item.a) : ('CareerDesk  •  ' + bnDate()), W / 2, H - 90);

    canvas.toBlob((blobFile) => {
      const url = URL.createObjectURL(blobFile);
      const a = document.createElement('a');
      a.href = url; a.download = 'careerdesk-wallpaper.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });
}

function wrapText(ctx, text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(' ');
  let lines = [], current = '';
  words.forEach(word => {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
    else current = test;
  });
  if (current) lines.push(current);
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
}

/**
 * Generates and downloads a 1920x1080 HD Wallpaper directly
 */
async function exportQuoteWallpaper(customText, customAuthor) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const W = 1920, H = 1080;
    const dark = (typeof state !== 'undefined' && state.theme === 'light') ? false : true;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    if (dark) {
      grad.addColorStop(0, '#0b0f19');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#082f49');
    } else {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.5, '#eef2ff');
      grad.addColorStop(1, '#e0f2fe');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    function blob(x, y, r, color, alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    blob(W * 0.15, H * 0.2, 520, dark ? '#6366f1' : '#818cf8', 0.4);
    blob(W * 0.85, H * 0.8, 550, dark ? '#06b6d4' : '#22d3ee', 0.35);

    const text = customText || (state && state.customQuotes && state.customQuotes[0]?.text) || "Small daily improvements over time lead to stunning results.";
    const by = customAuthor || (state && state.customQuotes && state.customQuotes[0]?.author) || "Robin Sharma";

    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? '#f8fafc' : '#0f172a';
    ctx.font = '700 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const words = text.split(' ');
    let lines = [], current = '';
    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > (W - 360) && current) { lines.push(current); current = word; }
      else current = test;
    });
    if (current) lines.push(current);
    const startY = H / 2 - ((lines.length - 1) * 75) / 2;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * 75));

    ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('— ' + by, W / 2, startY + lines.length * 75 + 30);

    ctx.fillStyle = dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('CareerDesk • Mission Control', W / 2, H - 60);

    canvas.toBlob((blobFile) => {
      if (!blobFile) return;
      const url = URL.createObjectURL(blobFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'careerdesk-wallpaper.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (typeof showToast === 'function') showToast('1080p HD Wallpaper generated & downloaded!');
    }, 'image/png');
  } catch (err) {
    console.error('Wallpaper export error:', err);
  }
}


