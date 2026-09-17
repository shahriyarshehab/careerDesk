/* ==========================================================================
   CareerDesk — Flashcards Module: Deck Review & Interactive Exam Mode
   ========================================================================== */

// ===== Flashcards =====
const flashGrid = document.getElementById('flashGrid');
const flashCategorySel = document.getElementById('flashCategory');
const flashFilterSel = document.getElementById('flashFilterCategory');
const editFlashModal = document.getElementById('editFlashModal');
const editFlashId = document.getElementById('editFlashId');
const editFlashFront = document.getElementById('editFlashFront');
const editFlashBack = document.getElementById('editFlashBack');
const editFlashCategory = document.getElementById('editFlashCategory');
const closeEditFlashModal = document.getElementById('closeEditFlashModal');
const cancelEditFlashBtn = document.getElementById('cancelEditFlashBtn');
const saveEditFlashBtn = document.getElementById('saveEditFlashBtn');
const flashModeBanner = document.getElementById('flashModeBanner');

let flashcardMode = null; // null | 'edit' | 'delete'

function exitFlashcardMode() {
  flashcardMode = null;
  updateFlashcardModeUI();
}

function updateFlashcardModeUI() {
  const editBtn = document.getElementById('toggle-edit-card-btn');
  const delBtn = document.getElementById('toggle-delete-card-btn');

  if (editBtn) editBtn.classList.toggle('active', flashcardMode === 'edit');
  if (delBtn) delBtn.classList.toggle('active', flashcardMode === 'delete');

  if (flashGrid) {
    flashGrid.classList.toggle('edit-mode', flashcardMode === 'edit');
    flashGrid.classList.toggle('delete-mode', flashcardMode === 'delete');
  }

  if (flashModeBanner) {
    if (flashcardMode === 'edit') {
      flashModeBanner.className = 'flash-mode-banner flash-edit-banner';
      flashModeBanner.style.display = 'flex';
      flashModeBanner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; color:#c084fc;">${ICON.edit}</span>
          <span><strong>Edit Mode Active:</strong> Click the edit button on any flashcard to modify it.</span>
        </div>
        <button class="pill" id="exitFlashModeBtn" type="button" style="font-size:11px; padding:3px 10px; cursor:pointer;">Done</button>
      `;
      const exitBtn = document.getElementById('exitFlashModeBtn');
      if (exitBtn) exitBtn.addEventListener('click', exitFlashcardMode);
    } else if (flashcardMode === 'delete') {
      flashModeBanner.className = 'flash-mode-banner flash-del-banner';
      flashModeBanner.style.display = 'flex';
      flashModeBanner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; color:#f43f5e;">${ICON.trash}</span>
          <span><strong>Delete Mode Active:</strong> Click the red trash button on any flashcard to delete it.</span>
        </div>
        <button class="pill" id="exitFlashModeBtn" type="button" style="font-size:11px; padding:3px 10px; cursor:pointer;">Done</button>
      `;
      const exitBtn = document.getElementById('exitFlashModeBtn');
      if (exitBtn) exitBtn.addEventListener('click', exitFlashcardMode);
    } else {
      flashModeBanner.style.display = 'none';
      flashModeBanner.innerHTML = '';
    }
  }
}

function renderFlashCategoryOptions() {
  const allSubjs = typeof masterSubjectList === 'function' ? masterSubjectList(false) : subjectList();

  const opts = allSubjs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('');
  if (flashCategorySel) flashCategorySel.innerHTML = '<option value="">No Category</option>' + opts;
  if (flashFilterSel) flashFilterSel.innerHTML = '<option value="all">All Subjects</option>' + opts;
  if (editFlashCategory) editFlashCategory.innerHTML = '<option value="">No Category</option>' + opts;
}

function renderFlashcards() {
  const filter = (flashFilterSel && flashFilterSel.value) ? flashFilterSel.value : 'all';
  const list = filter === 'all' ? state.flashcards : state.flashcards.filter(f => {
    if (!f.category) return false;
    return f.category === filter || (typeof canonicalSubjectName === 'function' && canonicalSubjectName(f.category) === filter);
  });
  const countBadge = document.getElementById('flashCountBadge');
  if (countBadge) {
    countBadge.innerHTML = `${ICON.layers} <span>${list.length} ${list.length === 1 ? 'Card' : 'Cards'}</span>`;
  }

  if (!list.length) {
    flashGrid.innerHTML = '<div class="empty-state">No flashcards in this category. Click "Sync MCQs" or "Add Card" above.</div>';
    updateFlashcardModeUI();
    return;
  }
  flashGrid.innerHTML = list.map(f => {
    const meta = f.category && typeof getSubjectMeta === 'function' ? getSubjectMeta(f.category) : { icon: 'layers' };
    return `
      <div class="flash-card" data-id="${f.id}">
        <div class="flash-card-actions">
          <button type="button" class="card-edit-btn" data-edit="${f.id}" title="Edit Flashcard" aria-label="Edit Flashcard">${ICON.edit}</button>
          <button type="button" class="card-del-btn" data-del="${f.id}" title="Delete Flashcard" aria-label="Delete Flashcard">${ICON.trash}</button>
        </div>
        <div class="flash-card-inner">
          <div class="flash-face flash-front">
            ${f.category ? `<span class="flash-card-tag" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="${meta.icon || 'layers'}" style="width:12px; height:12px;"></i> <span>${escapeHtml(f.category)}</span></span>` : ''}
            <div style="font-weight:600; padding:0 6px;">${escapeHtml(f.front)}</div>
            <div style="position:absolute; bottom:8px; font-size:10.5px; opacity:0.6;">Click to reveal</div>
          </div>
          <div class="flash-face flash-back">
            <div style="font-size:13px; line-height:1.6; white-space:pre-wrap; max-height:100%; overflow-y:auto; padding:4px;">${escapeHtml(f.back)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateFlashcardModeUI();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function openEditFlashcardModal(id) {
  const card = state.flashcards.find(f => String(f.id) === String(id));
  if (!card || !editFlashModal) return;

  if (editFlashId) editFlashId.value = card.id;
  if (editFlashFront) editFlashFront.value = card.front || '';
  if (editFlashBack) editFlashBack.value = card.back || '';
  renderFlashCategoryOptions();
  if (editFlashCategory) editFlashCategory.value = card.category || '';

  editFlashModal.style.display = 'flex';
  if (editFlashFront) editFlashFront.focus();
}

function hideEditFlashcardModal() {
  if (editFlashModal) editFlashModal.style.display = 'none';
}

if (closeEditFlashModal) closeEditFlashModal.addEventListener('click', hideEditFlashcardModal);
if (cancelEditFlashBtn) cancelEditFlashBtn.addEventListener('click', hideEditFlashcardModal);
if (editFlashModal) {
  editFlashModal.addEventListener('click', (e) => {
    if (e.target === editFlashModal) hideEditFlashcardModal();
  });
}

if (saveEditFlashBtn) {
  saveEditFlashBtn.addEventListener('click', () => {
    const id = editFlashId ? editFlashId.value : null;
    const card = state.flashcards.find(f => String(f.id) === String(id));
    if (!card) {
      hideEditFlashcardModal();
      return;
    }
    const front = (editFlashFront?.value || '').trim();
    const back = (editFlashBack?.value || '').trim();
    if (!front || !back) {
      showToast('Please provide both question and answer', true);
      return;
    }
    card.front = front;
    card.back = back;
    card.category = editFlashCategory?.value || 'General';

    hideEditFlashcardModal();
    renderFlashcards();
    renderFlashCategoryOptions();
    syncAllSubjectSelects();
    saveData();
    showToast('Flashcard updated successfully!');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editFlashModal && editFlashModal.style.display === 'flex') {
    hideEditFlashcardModal();
  }
});

if (flashGrid) {
  flashGrid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      e.stopPropagation();
      openEditFlashcardModal(editBtn.dataset.edit);
      return;
    }

    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this flashcard?')) {
        state.flashcards = state.flashcards.filter(f => String(f.id) !== delBtn.dataset.del);
        renderFlashcards();
        renderFlashCategoryOptions();
        saveData();
        showToast('Flashcard deleted');
      }
      return;
    }

    if (e.target.closest('.flash-card-actions')) return;

    const card = e.target.closest('.flash-card');
    if (card) card.classList.toggle('flipped');
  });
}

// ===== Flashcards Form Toggle =====
const toggleFlashBtn = document.getElementById('add-flashcard-btn') || document.getElementById('toggleFlashFormBtn');
const flashWrap = document.getElementById('flashFormWrap');
if (toggleFlashBtn && flashWrap) {
  toggleFlashBtn.addEventListener('click', () => {
    const isOpen = flashWrap.style.display !== 'none';
    flashWrap.style.display = isOpen ? 'none' : 'block';
    toggleFlashBtn.classList.toggle('active', !isOpen);
    toggleFlashBtn.classList.toggle('active-open', !isOpen);
    if (!isOpen) {
      const front = document.getElementById('flashFront');
      if (front) front.focus();
    }
  });
}

const toggleEditCardBtn = document.getElementById('toggle-edit-card-btn');
if (toggleEditCardBtn) {
  toggleEditCardBtn.addEventListener('click', () => {
    flashcardMode = (flashcardMode === 'edit') ? null : 'edit';
    updateFlashcardModeUI();
  });
}

const shuffleFlashcardsBtn = document.getElementById('shuffle-flashcards-btn');
if (shuffleFlashcardsBtn) {
  shuffleFlashcardsBtn.addEventListener('click', () => {
    if (!state.flashcards || state.flashcards.length <= 1) {
      showToast('Need at least 2 flashcards to shuffle', true);
      return;
    }
    state.flashcards = shuffle(state.flashcards);
    saveData();
    renderFlashcards();
    showToast('Flashcards shuffled!');
  });
}

const toggleDeleteCardBtn = document.getElementById('toggle-delete-card-btn');
if (toggleDeleteCardBtn) {
  toggleDeleteCardBtn.addEventListener('click', () => {
    flashcardMode = (flashcardMode === 'delete') ? null : 'delete';
    updateFlashcardModeUI();
  });
}

const addFlashBtnEl = document.getElementById('addFlashBtn');
if (addFlashBtnEl) {
  addFlashBtnEl.addEventListener('click', () => {
    const frontEl = document.getElementById('flashFront');
    const backEl = document.getElementById('flashBack');
    const front = frontEl ? frontEl.value.trim() : '';
    const back = backEl ? backEl.value.trim() : '';
    if (!front || !back) {
      showToast('Please provide both question and answer', true);
      return;
    }
    state.flashcards.push({ id: Date.now(), front, back, category: (flashCategorySel && flashCategorySel.value) ? flashCategorySel.value : 'General' });
    if (frontEl) frontEl.value = '';
    if (backEl) backEl.value = '';
    renderFlashCategoryOptions();
    syncAllSubjectSelects();
    renderFlashcards();
    saveData();

    if (flashWrap && toggleFlashBtn) {
      flashWrap.style.display = 'none';
      toggleFlashBtn.classList.remove('active');
      toggleFlashBtn.classList.remove('active-open');
    }
    showToast('Flashcard created successfully!');
  });
}

// ===== Sync Flashcards directly from BCS MCQs =====
function syncFlashcardsFromMCQs() {
  const mcqPool = (typeof allQuestions !== 'undefined' && Array.isArray(allQuestions) && allQuestions.length > 0)
    ? allQuestions
    : (typeof defaultQuestions !== 'undefined' ? defaultQuestions : []);

  if (!mcqPool.length) {
    showToast('No MCQ questions available to sync from', true);
    return;
  }

  let addedCount = 0;
  mcqPool.forEach(q => {
    const qText = (q.question || '').trim();
    if (!qText) return;
    const exists = state.flashcards.some(f => f.front.trim() === qText);
    if (!exists) {
      const correctOpt = (Array.isArray(q.options) && q.options[q.correct] !== undefined)
        ? q.options[q.correct]
        : 'See explanation';
      const exp = (q.explanation && q.explanation.trim()) ? q.explanation.trim() : 'Authentic BCS High-Yield Concept.';

      state.flashcards.push({
        id: 'mcq_fc_' + (q.id || (Date.now() + Math.random().toString(36).substr(2, 4))),
        front: qText,
        back: `✓ Correct Answer: ${correctOpt}\n\n💡 Explanation: ${exp}`,
        category: (typeof canonicalSubjectName === 'function' ? canonicalSubjectName(q.subject) : q.subject) || 'General Knowledge'
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    renderFlashCategoryOptions();
    syncAllSubjectSelects();
    renderFlashcards();
    saveData();
    showToast(`Added ${addedCount} flashcards directly from BCS & Govt MCQ Bank!`);
  } else {
    showToast('All MCQ questions are already synced to your flashcard deck.');
  }
}

const syncFlashcardsBtn = document.getElementById('syncFlashcardsBtn');
if (syncFlashcardsBtn) {
  syncFlashcardsBtn.addEventListener('click', syncFlashcardsFromMCQs);
}

if (flashFilterSel) {
  flashFilterSel.addEventListener('change', renderFlashcards);
}

// ===== Interactive Flashcard Exam Mode =====
const examOverlay = document.getElementById('examOverlay');
let examState = null;


document.getElementById('startExamBtn').addEventListener('click', () => {
  const filter = flashFilterSel.value || 'all';
  const pool = filter === 'all' ? state.flashcards : state.flashcards.filter(f => f.category === filter);
  if (!pool.length) {
    showToast('No flashcards found! Click "Sync from MCQs" to instantly load cards.', true);
    return;
  }
  examState = { cards: shuffle(pool), idx: 0, correct: 0, wrong: 0, flipped: false, finished: false, userAnswer: '' };
  renderExam();
  examOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
});

function renderExam() {
  if (!examState) return;
  if (examState.finished) {
    const total = examState.correct + examState.wrong;
    const pct = total ? Math.round((examState.correct / total) * 100) : 0;
    examOverlay.innerHTML = `
      <div class="exam-modal-card glass" style="text-align:center;">
        <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
        <div class="exam-result-icon">${ICON.star}</div>
        <h2 style="font-size:24px; font-weight:800; margin:0 0 6px;">Flashcard Exam Completed!</h2>
        <div style="font-size:36px; font-weight:800; color:var(--accent1); margin:10px 0;">${pct}%</div>
        <p style="color:var(--text-soft); font-size:14px; margin-bottom:24px;">
          ${examState.correct} Correct &nbsp;•&nbsp; ${examState.wrong} Needs Review &nbsp;•&nbsp; Total ${total} Cards
        </p>
        <div class="exam-actions" style="justify-content:center;">
          <button class="pill solid" id="examRestartBtn">${ICON.rotccw} Retake Exam</button>
          <button class="pill" id="examExitBtn">${ICON.arrowL} Return to Deck</button>
        </div>
      </div>
    `;
    document.getElementById('examCloseBtn').addEventListener('click', closeExam);
    document.getElementById('examExitBtn').addEventListener('click', closeExam);
    document.getElementById('examRestartBtn').addEventListener('click', () => {
      document.getElementById('startExamBtn').click();
    });
    return;
  }

  const card = examState.cards[examState.idx];
  const totalCards = examState.cards.length;
  const progressPct = Math.round(((examState.idx + 1) / totalCards) * 100);

  if (!examState.flipped) {
    examOverlay.innerHTML = `
      <div class="exam-modal-card glass">
        <div class="exam-card-header">
          <span class="exam-card-tag">${escapeHtml(card.category || 'General')}</span>
          <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
        </div>

        <div class="exam-progress-wrap">
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-soft); font-weight:600;">
            <span>Card ${examState.idx + 1} of ${totalCards}</span>
            <span>${ICON.check} ${examState.correct}  •  ${ICON.x} ${examState.wrong}</span>
          </div>
          <div class="exam-progress-bar">
            <div class="exam-progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
        </div>

        <div class="exam-question-box glass">
          ${escapeHtml(card.front)}
        </div>

        <input type="text" class="exam-answer-input" id="examAnswerInput" placeholder="Type your answer (or skip directly to answer)..." autocomplete="off">

        <div class="exam-actions">
          <button class="pill" id="examSkipRevealBtn">${ICON.eye} Show Answer</button>
          <button class="pill solid" id="examSubmitBtn">Submit &amp; Reveal ${ICON.arrowR}</button>
        </div>
      </div>
    `;

    document.getElementById('examCloseBtn').addEventListener('click', closeExam);
    const input = document.getElementById('examAnswerInput');
    if (input) input.focus();

    const reveal = () => {
      examState.userAnswer = input ? input.value.trim() : '';
      examState.flipped = true;
      renderExam();
    };

    document.getElementById('examSubmitBtn').addEventListener('click', reveal);
    document.getElementById('examSkipRevealBtn').addEventListener('click', reveal);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') reveal();
      });
    }
    return;
  }

  // Back / Revealed Answer State
  examOverlay.innerHTML = `
    <div class="exam-modal-card glass">
      <div class="exam-card-header">
        <span class="exam-card-tag">${escapeHtml(card.category || 'General')}</span>
        <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
      </div>

      <div class="exam-progress-wrap">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-soft); font-weight:600;">
          <span>Card ${examState.idx + 1} of ${totalCards}</span>
          <span>${ICON.check} ${examState.correct}  •  ${ICON.x} ${examState.wrong}</span>
        </div>
        <div class="exam-progress-bar">
          <div class="exam-progress-bar-fill" style="width:${progressPct}%"></div>
        </div>
      </div>

      <div class="exam-question-box glass" style="min-height:75px; font-size:16px;">
        ${escapeHtml(card.front)}
      </div>

      ${examState.userAnswer ? `
        <div class="exam-user-recap">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-soft); margin-bottom:2px;">Your Answer:</div>
          <div style="font-weight:600; color:var(--text);">${escapeHtml(examState.userAnswer)}</div>
        </div>
      ` : ''}

      <div class="exam-verified-answer">
        <div class="exam-verified-label">Verified Right Answer &amp; Explanation:</div>
        <div style="white-space:pre-wrap; font-weight:500;">${escapeHtml(card.back)}</div>
      </div>

      <div class="exam-actions">
        <button class="pill danger btn-exam-rate" id="examWrongBtn">${ICON.x} Needs Review</button>
        <button class="pill solid btn-exam-rate btn-rate-correct" id="examCorrectBtn">${ICON.check} Got It Right!</button>
      </div>
    </div>
  `;

  document.getElementById('examCloseBtn').addEventListener('click', closeExam);
  document.getElementById('examCorrectBtn').addEventListener('click', () => advanceExam(true));
  document.getElementById('examWrongBtn').addEventListener('click', () => advanceExam(false));

  // Keyboard shortcuts for snappy exam flow (1 = Got it, 2 = Needs review)
  const keyHandler = (e) => {
    if (e.key === '1' || e.key === 'Enter') {
      window.removeEventListener('keydown', keyHandler);
      advanceExam(true);
    } else if (e.key === '2') {
      window.removeEventListener('keydown', keyHandler);
      advanceExam(false);
    }
  };
  window.addEventListener('keydown', keyHandler, { once: true });
}

function advanceExam(isCorrect) {
  if (isCorrect) examState.correct++; else examState.wrong++;
  if (examState.idx + 1 >= examState.cards.length) {
    examState.finished = true;
  } else {
    examState.idx++;
    examState.flipped = false;
    examState.userAnswer = '';
  }
  renderExam();
}

function closeExam() {
  examOverlay.style.display = 'none';
  examOverlay.innerHTML = '';
  examState = null;
  document.body.style.overflow = '';
}

