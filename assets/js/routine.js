/* ==========================================================================
   CareerDesk — Routine Module: Day-by-Day & Monthly Schedules
   ========================================================================== */

// ===== Routine =====
const routineCardWrap = document.getElementById('routineCardWrap');
let routineDateFilter = dateKey(Date.now());

function updateMonthYearPlaceholder() {
  const textEl = document.getElementById('routineMonthYearText');
  if (!textEl) return;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  textEl.textContent = `${months[currentViewMonth]} ${currentViewYear}`;
}

function updateRoutineTodayButtonState() {
  const btn = document.getElementById('routineGoTodayBtn');
  if (!btn) return;
  const isToday = routineDateFilter === dateKey(Date.now());
  btn.classList.toggle('is-today', isToday);
  btn.title = isToday ? "Currently viewing today's routine" : "Jump to today's routine";
}

function goToTodayRoutine() {
  const now = new Date();
  currentViewYear = now.getFullYear();
  currentViewMonth = now.getMonth();
  routineDateFilter = dateKey(now.getTime());
  const mSel = document.getElementById('monthDropdown');
  if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
  updateMonthYearPlaceholder();
  toggleMonthlyRoutineView(false);
  renderDateSlider();
  renderRoutine();
  updateRoutineTodayButtonState();
  if (typeof showToast === 'function') {
    showToast("Viewing today's routine");
  }
}

const routineGoTodayBtn = document.getElementById('routineGoTodayBtn');
if (routineGoTodayBtn) {
  routineGoTodayBtn.addEventListener('click', goToTodayRoutine);
}

function shiftRoutineMonth(delta) {
  currentViewMonth += delta;
  if (currentViewMonth < 0) {
    currentViewMonth = 11;
    currentViewYear -= 1;
  } else if (currentViewMonth > 11) {
    currentViewMonth = 0;
    currentViewYear += 1;
  }
  const sel = document.getElementById('monthDropdown');
  if (sel) {
    sel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
  }
  updateMonthYearPlaceholder();

  const now = new Date();
  if (now.getFullYear() === currentViewYear && now.getMonth() === currentViewMonth) {
    routineDateFilter = dateKey(now.getTime());
  } else {
    routineDateFilter = dateKey(new Date(currentViewYear, currentViewMonth, 1).getTime());
  }
  const mBox = document.getElementById('monthlyRoutineView');
  if (mBox && !mBox.hidden) {
    showMonthlyRoutines();
  } else {
    renderDateSlider();
    renderRoutine();
  }
}

const routinePrevMonthBtn = document.getElementById('routinePrevMonthBtn');
if (routinePrevMonthBtn) {
  routinePrevMonthBtn.addEventListener('click', () => shiftRoutineMonth(-1));
}

const routineNextMonthBtn = document.getElementById('routineNextMonthBtn');
if (routineNextMonthBtn) {
  routineNextMonthBtn.addEventListener('click', () => shiftRoutineMonth(1));
}

function initMonthDropdown() {
  const sel = document.getElementById('monthDropdown');
  if (!sel) return;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let html = '';
  const baseYear = new Date().getFullYear();
  for (let y = baseYear - 1; y <= baseYear + 2; y++) {
    for (let m = 0; m < 12; m++) {
      const val = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${months[m]} ${y}`;
      const selected = (y === currentViewYear && m === currentViewMonth) ? 'selected' : '';
      html += `<option value="${val}" ${selected}>${label}</option>`;
    }
  }
  sel.innerHTML = html;
  updateMonthYearPlaceholder();
}

const monthDropdownSel = document.getElementById('monthDropdown');
if (monthDropdownSel) {
  monthDropdownSel.addEventListener('change', (e) => {
    const [y, m] = e.target.value.split('-');
    currentViewYear = parseInt(y);
    currentViewMonth = parseInt(m) - 1;
    updateMonthYearPlaceholder();

    const now = new Date();
    if (now.getFullYear() === currentViewYear && now.getMonth() === currentViewMonth) {
      routineDateFilter = dateKey(now.getTime());
    } else {
      routineDateFilter = dateKey(new Date(currentViewYear, currentViewMonth, 1).getTime());
    }
    const mBox = document.getElementById('monthlyRoutineView');
    if (mBox && !mBox.hidden) {
      showMonthlyRoutines();
    } else {
      renderDateSlider();
      renderRoutine();
    }
  });
}

function buildDateSliderList() {
  const dates = new Set();
  // 1. Generate all days of current viewed month
  const daysInMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentViewYear, currentViewMonth, day);
    dates.add(dateKey(d.getTime()));
  }
  // 2. Ensure today is present
  dates.add(dateKey(Date.now()));
  // 3. Ensure routineDateFilter is present
  if (routineDateFilter) dates.add(routineDateFilter);
  // 4. Add any other routine dates with existing entries
  if (Array.isArray(state.routine)) {
    state.routine.forEach(r => { if (r.date) dates.add(r.date); });
  }
  return Array.from(dates).sort();
}

function renderDateSlider() {
  const box = document.getElementById('dateSlider');
  if (!box) return;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const routineDates = new Set((state.routine || []).filter(r => r.subject).map(r => r.date));
  let html = '';
  buildDateSliderList().forEach(ds => {
    const d = new Date(ds + 'T00:00:00');
    const hasDot = routineDates.has(ds) ? 'has-routine' : '';
    const isAct = routineDateFilter === ds ? 'active' : '';
    html += `<div class="date-chip ${isAct} ${hasDot}" data-date="${ds}">
      <span class="dc-day">${dayLabels[d.getDay()]}</span><span class="dc-num">${d.getDate()}</span>
    </div>`;
  });
  box.innerHTML = html;
  updateRoutineTodayButtonState();

  const activeChip = box.querySelector('.date-chip.active');
  if (activeChip) {
    setTimeout(() => {
      activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 50);
  }
}

const dateSliderBox = document.getElementById('dateSlider');
if (dateSliderBox) {
  dateSliderBox.addEventListener('click', (e) => {
    const chip = e.target.closest('.date-chip');
    if (!chip) return;
    routineDateFilter = chip.dataset.date || null;
    renderDateSlider();
    renderRoutine();
  });
}

function shiftRoutineDate(delta) {
  const base = routineDateFilter || dateKey(Date.now());
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  routineDateFilter = dateKey(d.getTime());

  if (d.getMonth() !== currentViewMonth || d.getFullYear() !== currentViewYear) {
    currentViewMonth = d.getMonth();
    currentViewYear = d.getFullYear();
    const sel = document.getElementById('monthDropdown');
    if (sel) sel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
    updateMonthYearPlaceholder();
  }

  renderDateSlider();
  renderRoutine();
}

const prevDateBtn = document.getElementById('datePrevBtn');
if (prevDateBtn) prevDateBtn.addEventListener('click', () => shiftRoutineDate(-1));

const nextDateBtn = document.getElementById('dateNextBtn');
if (nextDateBtn) nextDateBtn.addEventListener('click', () => shiftRoutineDate(1));

const ROUTINE_HEAD = '<thead><tr><th style="width:16%">Start</th><th style="width:16%">End</th><th style="width:26%">Subject</th><th>Topic / Task</th><th style="width:40px"></th></tr></thead>';

function routineRowHtml(row) {
  return `
    <tr>
      <td><input type="time" value="${row.startTime || ''}" data-field="startTime" data-id="${row.id}"></td>
      <td><input type="time" value="${row.endTime || ''}" data-field="endTime" data-id="${row.id}"></td>
      <td><input type="text" value="${escapeAttr(row.subject || '')}" placeholder="Subject" data-field="subject" data-id="${row.id}" list="appSubjectDatalist"></td>
      <td><input type="text" value="${escapeAttr(row.task || '')}" placeholder="Task description" data-field="task" data-id="${row.id}"></td>
      <td><button class="del-row" title="Delete row" data-id="${row.id}">${ICON.x}</button></td>
    </tr>
  `;
}

function renderTrackerRoutinePreview() {
  const box = document.getElementById('trackerRoutinePreview');
  if (!box) return;

  const today = state.sessions.filter(s => dateKey(s.start) === todayKey());
  const byTotal = {};
  today.forEach(s => { byTotal[s.subject] = (byTotal[s.subject] || 0) + s.duration; });
  const entries = Object.entries(byTotal).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (!entries.length) {
    box.innerHTML = '<div class="tracker-routine-title">Today\'s Subject Breakdown</div><div class="empty-state">No study sessions recorded today.</div>';
    return;
  }

  const max = Math.max(...entries.map(([, min]) => min));
  const rowsHtml = entries.map(([subj, min]) => `
    <div class="tracker-routine-item">
      <div class="tracker-routine-details">
        <div class="tracker-routine-subject-row">
          <span class="tracker-routine-subject">${escapeHtml(subj)}</span>
          <span class="tracker-routine-time">${fmtHM(min)}</span>
        </div>
        <div class="tracker-routine-progress">
          <div class="tracker-routine-track">
            <div class="tracker-routine-fill" style="width:${Math.round((min / max) * 100)}%"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  box.innerHTML = `<div class="tracker-routine-title">Today\'s Subject Breakdown</div>${rowsHtml}`;
}

function renderRoutine() {
  const wrap = document.getElementById('routineCardWrap');
  if (!wrap) return;
  if (!Array.isArray(state.routine)) state.routine = [];

  if (routineDateFilter === null) {
    const byDate = {};
    state.routine.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });
    const dates = Object.keys(byDate).sort().reverse();
    if (!dates.length) {
      wrap.innerHTML = '<div class="empty-state" style="border:none; margin:16px;">No routine entries for this date.</div>';
      return;
    }
    wrap.innerHTML = dates.map(ds => {
      const rows = byDate[ds].slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return `
        <div class="routine-date-group">
          <div class="routine-date-heading">${bnDateLabel(ds)}</div>
          <table class="routine">
            ${ROUTINE_HEAD}
            <tbody>${rows.map(routineRowHtml).join('')}</tbody>
          </table>
        </div>
      `;
    }).join('');
    return;
  }

  const todayTarget = routineDateFilter || dateKey(Date.now());
  let rows = state.routine.filter(r => r.date === todayTarget);

  if (!rows.length) {
    wrap.innerHTML = `
      <div class="routine-empty-card">
        <div class="routine-empty-icon"><i data-lucide="calendar-plus"></i></div>
        <h4>No study routine planned for this day</h4>
        <p>You can add your own custom study blocks or load the recommended BCS preliminary study routine.</p>
        <div class="routine-empty-actions">
          <button class="pill solid" id="emptyLoadDefaultsBtn" type="button"><i data-lucide="sparkles"></i> Load Recommended Routine</button>
          <button class="pill" id="emptyAddBlockBtn" type="button"><i data-lucide="plus"></i> Add Study Block</button>
        </div>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    renderTrackerRoutinePreview();
    return;
  }

  rows.sort((a, b) => {
    const timeA = a.startTime || '99:99';
    const timeB = b.startTime || '99:99';
    return timeA.localeCompare(timeB) || a.id - b.id;
  });

  wrap.innerHTML = `<table class="routine">${ROUTINE_HEAD}<tbody>${rows.map(routineRowHtml).join('')}</tbody></table>`;
  renderTrackerRoutinePreview();
}

function bnDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.closest('#routineCardWrap') && t.dataset.field) {
    if (!Array.isArray(state.routine)) state.routine = [];
    const row = state.routine.find(r => String(r.id) === t.dataset.id);
    if (row) {
      row[t.dataset.field] = t.value;
      if (t.dataset.field === 'subject') {
        const val = t.value.trim();
        if (val && typeof addSubject === 'function') {
          addSubject(val);
        } else {
          syncAllSubjectSelects();
        }
      }
      saveData();
    }
  }
});

document.addEventListener('click', (e) => {
  const delBtn = e.target.closest('.del-row');
  if (delBtn && delBtn.closest('#routineCardWrap')) {
    if (!window.confirm('Are you sure you want to delete this routine slot?')) return;
    if (!Array.isArray(state.routine)) state.routine = [];
    state.routine = state.routine.filter(r => String(r.id) !== delBtn.dataset.id);
    saveData();
    renderRoutine();
    renderDateSlider();
    syncAllSubjectSelects();
    return;
  }

  if (e.target && (e.target.id === 'inlineAddRowBtn' || e.target.closest('#inlineAddRowBtn'))) {
    const date = routineDateFilter || dateKey(Date.now());
    if (!Array.isArray(state.routine)) state.routine = [];
    state.routine.push({
      id: Date.now(),
      date: date,
      startTime: '',
      endTime: '',
      subject: '',
      task: ''
    });
    saveData();
    renderRoutine();
    syncAllSubjectSelects();
    showToast('New time slot added to routine');
    return;
  }

  if (e.target && (e.target.id === 'resetRoutineBtn' || e.target.closest('#resetRoutineBtn'))) {
    const date = routineDateFilter || dateKey(Date.now());
    if (!Array.isArray(state.routine)) state.routine = [];
    state.routine = state.routine.filter(r => r.date !== date);
    state.routine.push(...buildDefaultRoutine(date));
    saveData();
    renderDateSlider();
    renderRoutine();
    syncAllSubjectSelects();
    showToast('Default routine loaded for today');
    return;
  }
});

function toggleMonthlyRoutineView(forceOpen) {
  const mBox = document.getElementById('monthlyRoutineView');
  const dateNav = document.querySelector('.date-slider-row');
  const cardWrap = document.getElementById('routineCardWrap');
  const routineActions = document.querySelector('.routine-actions');
  const routineSaveNote = document.getElementById('routineSaveNote');
  const titleEl = document.querySelector('.routine-hero-copy .section-title');
  const leadEl = document.querySelector('.routine-hero-copy .routine-lead');
  const mBtn = document.getElementById('monthlyRoutineBtn');
  const dBtn = document.getElementById('dbdRoutineBtn') || document.getElementById('todayRoutineBtn');
  const todayBtn = document.getElementById('routineGoTodayBtn');
  const monthPlaceholder = document.getElementById('routineMonthPlaceholder');
  const monthSelectWrap = document.getElementById('routineMonthSelectWrap');

  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : (mBox && mBox.hidden);

  if (shouldOpen) {
    if (mBox) mBox.hidden = false;
    if (dateNav) dateNav.hidden = true;
    if (cardWrap) cardWrap.hidden = true;
    if (routineActions) routineActions.hidden = true;
    if (routineSaveNote) routineSaveNote.hidden = true;
    if (mBtn) mBtn.classList.add('active');
    if (dBtn) dBtn.classList.remove('active');
    if (todayBtn) todayBtn.style.display = 'none';
    if (monthPlaceholder) monthPlaceholder.style.display = 'none';
    if (monthSelectWrap) monthSelectWrap.style.display = 'inline-flex';
    if (titleEl) titleEl.textContent = 'Monthly Study Overview';
    if (leadEl) leadEl.textContent = 'Review all scheduled study sessions across the selected month.';
    showMonthlyRoutines();
  } else {
    if (mBox) mBox.hidden = true;
    if (dateNav) dateNav.hidden = false;
    if (cardWrap) cardWrap.hidden = false;
    if (routineActions) routineActions.hidden = false;
    if (routineSaveNote) routineSaveNote.hidden = false;
    if (mBtn) mBtn.classList.remove('active');
    if (dBtn) dBtn.classList.add('active');
    if (todayBtn) todayBtn.style.display = 'inline-flex';
    if (monthPlaceholder) monthPlaceholder.style.display = 'inline-flex';
    if (monthSelectWrap) monthSelectWrap.style.display = 'none';
    if (titleEl) titleEl.textContent = 'Daily Study Routine';
    if (leadEl) leadEl.textContent = 'Plan your next study block and keep your momentum moving.';
    updateMonthYearPlaceholder();
    updateRoutineTodayButtonState();
    renderDateSlider();
    renderRoutine();
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function showMonthlyRoutines() {
  const box = document.getElementById('monthlyRoutineView');
  if (!box) return;
  const prefix = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}-`;
  const byDate = (state.routine || []).filter(r => r.date && r.date.startsWith(prefix) && r.subject).reduce((map, row) => {
    (map[row.date] ||= []).push(row); return map;
  }, {});
  const dates = Object.keys(byDate).sort();
  box.hidden = false;
  box.innerHTML = dates.length ? dates.map((date, idx) => {
    const rows = byDate[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    return `<article class="monthly-routine-card" data-month-date="${date}" style="animation-delay: ${idx * 35}ms;">
      <div class="monthly-routine-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <i data-lucide="calendar" style="width:16px; height:16px; color:var(--accent1);"></i>
          <strong>${bnDateLabel(date)}</strong>
          <span class="badge" style="font-size:11px; padding:2px 8px; border-radius:12px; background:var(--surface-strong); border:1px solid var(--border); color:var(--text-soft); font-weight:600;">${rows.length} ${rows.length === 1 ? 'block' : 'blocks'}</span>
        </div>
        <div class="monthly-routine-actions btn-group">
          <button class="pill action-btn-edit" data-month-edit="${date}" title="Open this date in daily routine editor" aria-label="Edit Date Routine">${ICON.edit} <span>Open &amp; Edit</span></button>
          <button class="pill danger action-btn-del" data-month-delete="${date}" title="Delete Routine for this date" aria-label="Delete Date Routine">${ICON.trash} <span>Delete</span></button>
        </div>
      </div>
      <table class="mini-routine">
        <thead>
          <tr style="color:var(--text-muted); font-size:11.5px; text-transform:uppercase; letter-spacing:0.04em;">
            <th style="text-align:left; padding:6px 4px; font-weight:600; width:25%;">Time</th>
            <th style="text-align:left; padding:6px 4px; font-weight:600; width:30%;">Subject</th>
            <th style="text-align:left; padding:6px 4px; font-weight:600;">Topic / Tasks</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td style="font-family:var(--font-mono); font-size:12px; color:var(--accent2);">${escapeHtml(r.startTime || '--:--')} – ${escapeHtml(r.endTime || '--:--')}</td>
            <td style="font-weight:600; color:var(--text);">${escapeHtml(r.subject || 'No Subject')}</td>
            <td style="color:var(--text-soft);">${escapeHtml(r.task || '—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </article>`;
  }).join('') : `
    <div class="empty-state glass" style="text-align:center; padding:36px 20px; border:1px dashed var(--border); border-radius:16px; margin: 10px 0;">
      <div style="width:48px; height:48px; border-radius:50%; background:rgba(99,102,241,0.12); color:var(--accent1); display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
        <i data-lucide="calendar-x" style="width:24px; height:24px;"></i>
      </div>
      <h4 style="margin:0 0 6px; font-size:16px; color:var(--text);">No routines scheduled for this month</h4>
      <p style="margin:0 0 16px; color:var(--text-soft); font-size:13px;">You have no study blocks planned for ${document.getElementById('monthDropdown')?.selectedOptions[0]?.text || 'this month'}.</p>
      <button class="pill solid" id="monthlyBackToDailyBtn" type="button" style="display:inline-flex; align-items:center; gap:8px;">
        <i data-lucide="arrow-left"></i> Back to Day by Day Routine
      </button>
    </div>
  `;
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

const dbdRoutineBtn = document.getElementById('dbdRoutineBtn');
if (dbdRoutineBtn) {
  dbdRoutineBtn.addEventListener('click', () => {
    toggleMonthlyRoutineView(false);
  });
}

const todayRoutineBtn = document.getElementById('todayRoutineBtn');
if (todayRoutineBtn) {
  todayRoutineBtn.addEventListener('click', () => {
    goToTodayRoutine();
  });
}

const monthlyRoutineBtn = document.getElementById('monthlyRoutineBtn');
if (monthlyRoutineBtn) {
  monthlyRoutineBtn.addEventListener('click', () => {
    const mBox = document.getElementById('monthlyRoutineView');
    const isOpen = mBox && !mBox.hidden;
    toggleMonthlyRoutineView(!isOpen);
  });
}

// Handle empty routine buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('#emptyLoadDefaultsBtn')) {
    const todayTarget = routineDateFilter || dateKey(Date.now());
    const defaults = buildDefaultRoutine(todayTarget);
    if (!Array.isArray(state.routine)) state.routine = [];
    state.routine.push(...defaults);
    saveData();
    renderRoutine();
    if (typeof showToast === 'function') showToast('Recommended BCS routine loaded for today!');
  } else if (e.target.closest('#emptyAddBlockBtn')) {
    const inlineAdd = document.getElementById('inlineAddRowBtn');
    if (inlineAdd) inlineAdd.click();
  }
});

const monthlyRoutineView = document.getElementById('monthlyRoutineView');
if (monthlyRoutineView) {
  monthlyRoutineView.addEventListener('click', (e) => {
    const edit = e.target.closest('[data-month-edit]');
    const del = e.target.closest('[data-month-delete]');
    const back = e.target.closest('#monthlyBackToDailyBtn');
    if (back) {
      toggleMonthlyRoutineView(false);
      return;
    }
    if (edit) {
      const d = new Date(edit.dataset.monthEdit + 'T00:00:00');
      routineDateFilter = edit.dataset.monthEdit;
      currentViewYear = d.getFullYear();
      currentViewMonth = d.getMonth();
      const mSel = document.getElementById('monthDropdown');
      if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
      toggleMonthlyRoutineView(false);
    }
    if (del && window.confirm('Delete all routines for this date?')) {
      state.routine = state.routine.filter(r => r.date !== del.dataset.monthDelete);
      saveData();
      renderDateSlider();
      renderRoutine();
      showMonthlyRoutines();
    }
  });
}

