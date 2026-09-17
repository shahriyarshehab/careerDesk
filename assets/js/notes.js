/* ==========================================================================
   CareerDesk — Notes Module: Quick Notes, Categorization & Pinning
   ========================================================================== */

// ===== Notes =====
const notesGrid = document.getElementById('notesGrid');
const noteSearch = document.getElementById('noteSearch');
const noteFilterTag = document.getElementById('noteFilterTag');

function filteredNotes() {
  const q = noteSearch.value.trim().toLowerCase();
  const tag = noteFilterTag.value;
  return state.notes.filter(n => {
    const matchesTag = tag === 'all' || n.tag === tag;
    const matchesQ = !q || (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q);
    return matchesTag && matchesQ;
  }).sort((a, b) => (b.pinned - a.pinned) || (b.ts - a.ts));
}

function formatKeepDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();

  const isToday = d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth() &&
                  d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getFullYear() === yesterday.getFullYear() &&
                      d.getMonth() === yesterday.getMonth() &&
                      d.getDate() === yesterday.getDate();

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderNotes() {
  const list = filteredNotes();
  notesGrid.innerHTML = '';
  if (!list.length) {
    notesGrid.innerHTML = '<div class="empty-state">No notes found. Create a new note using the button above.</div>';
    return;
  }
  list.forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card glass' + (n.pinned ? ' pinned' : '');
    card.dataset.noteId = n.id;
    const d = new Date(n.ts);
    card.innerHTML = `
      <div class="note-top">
        <div class="note-title-wrap">
          <h3 class="note-title">${escapeHtml(n.title || 'Untitled')}</h3>
          <span class="note-tag">${escapeHtml(n.tag || 'General')}</span>
        </div>
        <button class="pin-btn ${n.pinned ? 'pin-active' : ''}" title="${n.pinned ? 'Unpin note' : 'Pin note'}" aria-label="Pin note" data-id="${n.id}">
          ${ICON.pin}
        </button>
      </div>
      <p class="note-body-text">${escapeHtml(n.body || '')}</p>
      <div class="note-footer">
        <time class="note-date" datetime="${new Date(n.ts).toISOString()}" title="${d.toLocaleString('en-US')}">
          <span class="note-date-icon">${ICON.clock}</span>
          <span>${formatKeepDate(n.ts)}</span>
        </time>
        <div class="note-actions btn-group">
          <button class="note-action-btn edit-btn" title="Edit note" aria-label="Edit note" data-id="${n.id}">
            ${ICON.edit} <span>Edit</span>
          </button>
          <button class="note-action-btn del-btn" title="Delete note" aria-label="Delete note" data-id="${n.id}">
            ${ICON.trash} <span>Delete</span>
          </button>
        </div>
      </div>
    `;
    notesGrid.appendChild(card);
  });
}

notesGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  if (btn.classList.contains('del-btn')) {
    const n = state.notes.find(n => String(n.id) === id);
    const title = n && n.title ? `"${n.title}"` : 'this note';
    if (!window.confirm(`Are you sure you want to delete ${title}?`)) return;
    const card = btn.closest('.note-card');
    if (card) {
      card.style.transition = 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.transform = 'scale(0.92) translateY(6px)';
      card.style.opacity = '0';
      setTimeout(() => {
        state.notes = state.notes.filter(n => String(n.id) !== id);
        renderNotes(); saveData();
        showToast('Note deleted');
      }, 200);
    } else {
      state.notes = state.notes.filter(n => String(n.id) !== id);
      renderNotes(); saveData();
      showToast('Note deleted');
    }
  } else if (btn.classList.contains('pin-btn')) {
    const n = state.notes.find(n => String(n.id) === id);
    if (n) { n.pinned = !n.pinned; renderNotes(); saveData(); }
  } else if (btn.classList.contains('edit-btn')) {
    startEdit(id);
  }
});

function startEdit(id) {
  const n = state.notes.find(n => String(n.id) === id);
  if (!n) return;
  const card = [...notesGrid.children].find(c => c.querySelector(`[data-id="${id}"]`));
  if (!card) return;
  card.innerHTML = `
    <div class="note-edit-area">
      <input type="text" value="${escapeHtml(n.title || '')}" id="edit-title-${id}">
      <textarea rows="4" id="edit-body-${id}">${escapeHtml(n.body || '')}</textarea>
      <div class="quote-actions" style="justify-content:flex-start;">
        <button class="pill solid" data-save="${id}">Save</button>
        <button class="pill" data-cancel="${id}">Cancel</button>
      </div>
    </div>
  `;
  card.querySelector(`[data-save="${id}"]`).addEventListener('click', () => {
    n.title = document.getElementById(`edit-title-${id}`).value.trim();
    n.body = document.getElementById(`edit-body-${id}`).value.trim();
    renderNotes(); saveData();
  });
  card.querySelector(`[data-cancel="${id}"]`).addEventListener('click', renderNotes);
}

// ===== Notes Form Toggle =====
const toggleNoteBtn = document.getElementById('toggleNoteFormBtn');
const noteWrap = document.getElementById('noteFormWrap');
if (toggleNoteBtn && noteWrap) {
  toggleNoteBtn.addEventListener('click', () => {
    const isOpen = noteWrap.style.display !== 'none';
    noteWrap.style.display = isOpen ? 'none' : 'block';
    toggleNoteBtn.innerHTML = isOpen ? `${ICON.plus} New Note` : `${ICON.x} Close Form`;
    toggleNoteBtn.classList.toggle('active-open', !isOpen);
    if (!isOpen) {
      const input = document.getElementById('noteTitle');
      if (input) input.focus();
    }
  });
}

const addNoteBtn = document.getElementById('addNoteBtn');
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    const titleEl = document.getElementById('noteTitle');
    const bodyEl = document.getElementById('noteBody');
    const tagEl = document.getElementById('noteTag');
    const title = titleEl ? titleEl.value.trim() : '';
    const body = bodyEl ? bodyEl.value.trim() : '';
    if (!title && !body) return;
    state.notes.push({ id: Date.now(), title, body, tag: tagEl ? tagEl.value : 'General', pinned: false, ts: Date.now() });
    if (titleEl) titleEl.value = '';
    if (bodyEl) bodyEl.value = '';
    renderNotes(); saveData();

    if (noteWrap && toggleNoteBtn) {
      noteWrap.style.display = 'none';
      toggleNoteBtn.innerHTML = `${ICON.plus} New Note`;
      toggleNoteBtn.classList.remove('active-open');
    }
    showToast('Note saved successfully!');
  });
}

const noteSearchClearBtn = document.getElementById('noteSearchClearBtn');
if (noteSearch) {
  noteSearch.addEventListener('input', () => {
    if (noteSearchClearBtn) {
      noteSearchClearBtn.style.display = noteSearch.value.length ? 'inline-flex' : 'none';
    }
    renderNotes();
  });
}
if (noteSearchClearBtn && noteSearch) {
  noteSearchClearBtn.addEventListener('click', () => {
    noteSearch.value = '';
    noteSearchClearBtn.style.display = 'none';
    noteSearch.focus();
    renderNotes();
  });
}
if (noteFilterTag) {
  noteFilterTag.addEventListener('change', renderNotes);
}

