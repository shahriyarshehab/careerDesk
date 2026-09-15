/* ==========================================================================
   CareerDesk — Exam Countdown Engine: Target Dates & Time Remaining
   ========================================================================== */

// ==========================================
// EXAM COUNTDOWN ENGINE
// ==========================================
let exams = [];

function loadExams() {
  try {
    const data = localStorage.getItem(EXAMS_KEY);
    if (data) {
      exams = JSON.parse(data);
    } else {
      const now = new Date();
      const bcs47 = new Date(now.getFullYear(), now.getMonth() + 2, 15, 10, 0);
      const bankExam = new Date(now.getFullYear(), now.getMonth() + 1, 5, 9, 30);
      exams = [
        { id: 1, name: '47th BCS Preliminary Exam', category: 'BCS', targetDate: bcs47.toISOString() },
        { id: 2, name: 'Combined Bank Senior Officer', category: 'Banking', targetDate: bankExam.toISOString() }
      ];
      saveExams();
    }
  } catch (e) { exams = []; }
}

function saveExams() {
  try {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  } catch (e) { }
}

function renderExams() {
  const grid = document.getElementById('countdownGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!exams.length) {
    grid.innerHTML = '<div class="empty-state">No active exam countdowns. Click "+ New Exam Target" above to track an upcoming test!</div>';
    return;
  }

  const now = Date.now();
  exams.forEach(ex => {
    const targetTime = new Date(ex.targetDate).getTime();
    const diff = targetTime - now;

    let days = 0, hours = 0, mins = 0, secs = 0;
    let isExpired = false;

    if (diff <= 0) {
      isExpired = true;
    } else {
      days = Math.floor(diff / (1000 * 60 * 60 * 24));
      hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      secs = Math.floor((diff % (1000 * 60)) / 1000);
    }

    const card = document.createElement('div');
    card.className = 'countdown-card glass';
    card.innerHTML = `
      <div class="countdown-head">
        <h3>${escapeHtml(ex.name)}</h3>
        <div class="countdown-head-actions">
          <span class="countdown-tag">${escapeHtml(ex.category || 'Exam')}</span>
          <button class="countdown-del-btn" data-id="${ex.id}" title="Delete">${ICON.x}</button>
        </div>
      </div>
      ${isExpired ? `
        <div style="padding: 16px 0; text-align:center; color: var(--accent3); font-weight:700;">Exam Date Passed / Target Reached!</div>
      ` : `
        <div class="countdown-timer-row">
          <div class="time-box"><span class="time-num">${days}</span><span class="time-lbl">days</span></div>
          <div class="time-box"><span class="time-num">${hours}</span><span class="time-lbl">h</span></div>
          <div class="time-box"><span class="time-num">${mins}</span><span class="time-lbl">m</span></div>
          <div class="time-box"><span class="time-num">${secs}</span><span class="time-lbl">s</span></div>
        </div>
      `}
    `;
    grid.appendChild(card);
  });
}

document.addEventListener('click', (e) => {
  const delBtn = e.target.closest('.countdown-del-btn');
  if (delBtn) {
    const id = delBtn.dataset.id;
    const ex = exams.find(x => String(x.id) === String(id));
    const exName = ex && ex.name ? `"${ex.name}"` : 'this exam target';
    if (!window.confirm(`Are you sure you want to delete exam target ${exName}?`)) return;
    exams = exams.filter(ex => String(ex.id) !== String(id));
    saveExams();
    renderExams();
    showToast('Exam target deleted');
  }
});

const toggleExamBtn = document.getElementById('toggleExamFormBtn');
const examWrap = document.getElementById('examFormWrap');
if (toggleExamBtn && examWrap) {
  toggleExamBtn.addEventListener('click', () => {
    const isOpen = examWrap.style.display !== 'none';
    examWrap.style.display = isOpen ? 'none' : 'block';
    toggleExamBtn.innerHTML = isOpen ? `${ICON.plus} New Exam Target` : `${ICON.x} Close Form`;
    toggleExamBtn.classList.toggle('active-open', !isOpen);
  });
}

const addExamBtn = document.getElementById('addExamTargetBtn');
if (addExamBtn) {
  addExamBtn.addEventListener('click', () => {
    const nameEl = document.getElementById('examNameInput');
    const catEl = document.getElementById('examCatInput');
    const dateEl = document.getElementById('examDateInput');
    const name = nameEl.value.trim();
    const cat = catEl.value.trim();
    const dateVal = dateEl.value;

    if (!name || !dateVal) {
      showToast('Please enter both exam name and target date.', true);
      return;
    }

    exams.push({
      id: Date.now(),
      name: name,
      category: cat || 'Exam',
      targetDate: new Date(dateVal).toISOString()
    });

    nameEl.value = ''; dateEl.value = '';
    saveExams();
    renderExams();

    if (examWrap && toggleExamBtn) {
      examWrap.style.display = 'none';
      toggleExamBtn.innerHTML = '<span class="btn-icon">+</span> New Exam Target';
      toggleExamBtn.classList.remove('active-open');
    }
    showToast('New exam countdown target added!');
  });
}

