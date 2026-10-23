/* ==========================================================================
   CareerDesk — Notes Module: Quick Notes, Categorization & Pinning
   ========================================================================== */

// ===== Notes =====
const notesGrid = document.getElementById('notesGrid');
const noteSearch = document.getElementById('noteSearch');
const noteFilterTag = document.getElementById('noteFilterTag');
const NOTE_COLLAPSE_CHAR_LIMIT = 500;
const NOTE_TITLE_MAX_LENGTH = 100;

let currentEditingNoteId = null;

function filteredNotes() {
  const searchEl = document.getElementById('noteSearch') || noteSearch;
  const filterEl = document.getElementById('noteFilterTag') || noteFilterTag;
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const tag = filterEl ? filterEl.value : 'all';
  if (!Array.isArray(state.notes)) state.notes = [];
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
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {})
  });
  return `${dateStr}, ${timeStr}`;
}

function renderNotes() {
  const grid = document.getElementById('notesGrid') || notesGrid;
  if (!grid) return;
  const list = filteredNotes();
  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">No notes found. Tap the <strong style="color:var(--accent1); font-size:16px;">+</strong> button at the bottom-right to create a note.</div>';
    return;
  }
  list.forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card glass' + (n.pinned ? ' pinned' : '');
    card.dataset.noteId = n.id;
    const d = new Date(n.ts);
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(n.tag || 'General') : { icon: 'tag' };
    const noteBody = n.body || '';
    const canCollapse = Array.from(noteBody).length > NOTE_COLLAPSE_CHAR_LIMIT;
    const bodyId = `note-body-${escapeAttr(n.id)}`;
    card.innerHTML = `
      <div class="note-top">
        <div class="note-title-wrap">
          <h3 class="note-title">${escapeHtml(n.title || 'Untitled')}</h3>
          <span class="note-tag" style="display:inline-flex; align-items:center; gap:4px;">
            <i data-lucide="${meta.icon || 'tag'}" style="width:11px; height:11px;"></i>
            <span>${escapeHtml(n.tag || 'General')}</span>
          </span>
        </div>
        <button class="pin-btn ${n.pinned ? 'pin-active' : ''}" title="${n.pinned ? 'Unpin note' : 'Pin note'}" aria-label="Pin note" data-id="${n.id}">
          ${ICON.pin}
        </button>
      </div>
      <p id="${bodyId}" class="note-body-text${canCollapse ? ' is-collapsed' : ''}">${escapeHtml(noteBody)}</p>
      ${canCollapse ? `<button class="note-expand-btn" type="button" data-id="${escapeAttr(n.id)}" aria-controls="${bodyId}" aria-expanded="false">See more</button>` : ''}
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

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

notesGrid?.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  if (btn.classList.contains('note-expand-btn')) {
    const noteBody = btn.closest('.note-card')?.querySelector('.note-body-text');
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    noteBody?.classList.toggle('is-collapsed', isExpanded);
    btn.setAttribute('aria-expanded', String(!isExpanded));
    btn.textContent = isExpanded ? 'See more' : 'See less';
  } else if (btn.classList.contains('del-btn')) {
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
  openNoteComposeModal(id);
}

// ===== Note Compose Modal & FAB Operations =====
function openNoteComposeModal(editId = null) {
  currentEditingNoteId = editId ? String(editId) : null;
  const modalTitleLabel = document.getElementById('noteModalTitleLabel');
  const titleEl = document.getElementById('noteModalTitle');
  const tagEl = document.getElementById('noteModalTag');
  const bodyEl = document.getElementById('noteModalBody');
  const countEl = document.getElementById('noteModalTitleCount');

  // Populate or sync tags with masterSubjectList or default tags
  if (tagEl) {
    const defaultTags = ['General', 'English', 'Math', 'Bangla', 'General Knowledge', 'Important'];
    let merged = defaultTags;
    if (typeof masterSubjectList === 'function') {
      const subs = masterSubjectList();
      merged = Array.from(new Set([...defaultTags, ...subs]));
    }
    const currentVal = tagEl.value;
    tagEl.innerHTML = merged.map(t => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join('');
    if (currentVal && merged.includes(currentVal)) {
      tagEl.value = currentVal;
    }
  }

  if (currentEditingNoteId) {
    const note = (state.notes || []).find(n => String(n.id) === currentEditingNoteId);
    if (modalTitleLabel) modalTitleLabel.textContent = 'Edit Note';
    if (titleEl) titleEl.value = note ? (note.title || '') : '';
    if (tagEl && note) tagEl.value = note.tag || 'General';
    if (bodyEl) bodyEl.value = note ? (note.body || '') : '';
  } else {
    if (modalTitleLabel) modalTitleLabel.textContent = 'Create Note';
    if (titleEl) titleEl.value = '';
    const currentFilter = document.getElementById('noteFilterTag')?.value;
    if (tagEl) tagEl.value = (currentFilter && currentFilter !== 'all') ? currentFilter : 'General';
    if (bodyEl) bodyEl.value = '';
  }

  if (countEl && titleEl) {
    countEl.textContent = `${titleEl.value.length} / ${NOTE_TITLE_MAX_LENGTH}`;
  }

  if (typeof openModal === 'function') {
    openModal('noteComposeModal');
  } else {
    const modalEl = document.getElementById('noteComposeModal');
    if (modalEl) {
      modalEl.style.display = 'flex';
      modalEl.classList.add('open');
    }
  }

  setTimeout(() => {
    if (titleEl) titleEl.focus();
  }, 100);
}

function closeNoteComposeModal() {
  currentEditingNoteId = null;
  if (typeof closeModal === 'function') {
    closeModal('noteComposeModal');
  } else {
    const modalEl = document.getElementById('noteComposeModal');
    if (modalEl) {
      modalEl.classList.remove('open');
      modalEl.style.display = 'none';
    }
  }
}

function saveNoteCompose() {
  const titleEl = document.getElementById('noteModalTitle');
  const tagEl = document.getElementById('noteModalTag');
  const bodyEl = document.getElementById('noteModalBody');

  const title = titleEl ? titleEl.value.trim().slice(0, NOTE_TITLE_MAX_LENGTH) : '';
  const body = bodyEl ? bodyEl.value.trim() : '';
  const tag = tagEl ? tagEl.value : 'General';

  if (!title && !body) {
    if (typeof showToast === 'function') showToast('Please enter a note title or content');
    return;
  }

  if (!Array.isArray(state.notes)) state.notes = [];

  if (currentEditingNoteId) {
    const existing = state.notes.find(n => String(n.id) === currentEditingNoteId);
    if (existing) {
      existing.title = title || 'Untitled';
      existing.body = body;
      existing.tag = tag;
      existing.ts = Date.now();
    }
    if (typeof showToast === 'function') showToast('Note updated successfully!');
  } else {
    state.notes.push({
      id: Date.now(),
      title: title || 'Untitled',
      body,
      tag,
      pinned: false,
      ts: Date.now()
    });
    if (typeof showToast === 'function') showToast('Note saved successfully!');
  }

  closeNoteComposeModal();
  renderNotes();
  saveData();
}

// FAB Button to Open Composer
const notesFabBtn = document.getElementById('notesFabBtn');
if (notesFabBtn) {
  notesFabBtn.addEventListener('click', () => openNoteComposeModal());
}

// Modal Save Button
const saveNoteComposeBtn = document.getElementById('saveNoteComposeBtn');
if (saveNoteComposeBtn) {
  saveNoteComposeBtn.addEventListener('click', saveNoteCompose);
}

// Character counter for note modal title
const noteModalTitle = document.getElementById('noteModalTitle');
if (noteModalTitle) {
  noteModalTitle.addEventListener('input', () => {
    const countEl = document.getElementById('noteModalTitleCount');
    if (countEl) countEl.textContent = `${noteModalTitle.value.length} / ${NOTE_TITLE_MAX_LENGTH}`;
  });
}

// Ctrl + Enter shortcut inside note composer modal
const noteComposeModal = document.getElementById('noteComposeModal');
if (noteComposeModal) {
  noteComposeModal.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveNoteCompose();
    }
  });
}

// Search and Filter Listeners
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
