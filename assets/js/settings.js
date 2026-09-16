/* ==========================================================================
   CareerDesk — Settings Module: Subject Manager, Backup, Restore & Reset
   ========================================================================== */

// ===== Subject Manager (Settings Panel) =====
function getSubjectStats(s) {
  const canonicalS = canonicalSubjectName(s).toLowerCase();
  const sessions = (state.sessions || []).filter(sess => canonicalSubjectName(sess.subject).toLowerCase() === canonicalS);
  const totalMin = sessions.reduce((acc, sess) => acc + (sess.duration || 0), 0);
  const routineCount = (state.routine || []).filter(r => canonicalSubjectName(r.subject).toLowerCase() === canonicalS).length;
  const syllabusCat = (state.syllabus || []).find(c => canonicalSubjectName(c.name).toLowerCase() === canonicalS);
  const topicsCount = syllabusCat ? (syllabusCat.topics || []).length : 0;
  const topicsDone = syllabusCat ? (syllabusCat.topics || []).filter(t => t.done).length : 0;
  const cardCount = (state.flashcards || []).filter(f => canonicalSubjectName(f.category).toLowerCase() === canonicalS).length;

  return {
    sessionCount: sessions.length,
    totalMin,
    routineCount,
    topicsCount,
    topicsDone,
    cardCount
  };
}

function renderSubjectManager() {
  const container = document.getElementById('subjectManagerList');
  const deletedSection = document.getElementById('deletedSubjectSection');
  const deletedContainer = document.getElementById('deletedSubjectList');
  const countBadge = document.getElementById('subjectCountBadge');
  if (!container) return;

  const activeSubjects = masterSubjectList(false);
  const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
  const allSubjects = masterSubjectList(true);
  const deletedSubjects = allSubjects.filter(s => deletedSet.has(canonicalSubjectName(s).toLowerCase()));

  if (countBadge) {
    countBadge.textContent = `${activeSubjects.length} Active`;
  }

  if (!activeSubjects.length) {
    container.innerHTML = '<p style="color:var(--text-soft); font-size:13px; margin:8px 0;">No active subjects found. Click "Reset Defaults" or add a new subject above.</p>';
  } else {
    container.innerHTML = activeSubjects.map(s => {
      const stats = getSubjectStats(s);
      const statPills = [];
      if (stats.totalMin > 0) {
        statPills.push(`<span class="subj-stat-pill" title="Total study logged">${ICON.clock} ${fmtHM(stats.totalMin)}</span>`);
      } else if (stats.sessionCount > 0) {
        statPills.push(`<span class="subj-stat-pill" title="Sessions logged">${stats.sessionCount} sessions</span>`);
      }
      if (stats.routineCount > 0) {
        statPills.push(`<span class="subj-stat-pill" title="Routine blocks scheduled">${stats.routineCount} routine blocks</span>`);
      }
      if (stats.topicsCount > 0) {
        statPills.push(`<span class="subj-stat-pill" title="Syllabus topics (${stats.topicsDone}/${stats.topicsCount} done)">${stats.topicsDone}/${stats.topicsCount} topics</span>`);
      }
      if (stats.cardCount > 0) {
        statPills.push(`<span class="subj-stat-pill" title="Quiz / Flashcards">${stats.cardCount} cards</span>`);
      }

      const statsHtml = statPills.length
        ? `<div class="subject-stats-badges">${statPills.join('')}</div>`
        : '<span style="font-size:11.5px; color:var(--text-soft); opacity:0.7;">No logged activity</span>';

      return `
        <div class="subject-manager-row">
          <div class="subject-info">
            <span class="subject-manager-name">${escapeHtml(s)}</span>
            ${statsHtml}
          </div>
          <div class="btn-group subject-row-actions">
            <button class="pill subtle subject-rename-btn" data-rename-subject="${escapeAttr(s)}" type="button" title="Rename this subject everywhere">
              ${ICON.edit} <span>Rename</span>
            </button>
            <button class="pill danger subject-delete-btn" data-subject="${escapeAttr(s)}" type="button" title="Hide/Delete this subject">
              ${ICON.trash} <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (deletedSection && deletedContainer) {
    if (deletedSubjects.length > 0) {
      deletedSection.style.display = 'block';
      deletedContainer.innerHTML = deletedSubjects.map(s => `
        <div class="subject-manager-row subject-deleted">
          <div class="subject-info">
            <span class="subject-manager-name">${escapeHtml(s)}</span>
          </div>
          <button class="pill subject-restore-btn" data-restore-subject="${escapeAttr(s)}" type="button" title="Restore this subject to active list">
            ${ICON.undo} <span>Restore</span>
          </button>
        </div>
      `).join('');
    } else {
      deletedSection.style.display = 'none';
      deletedContainer.innerHTML = '';
    }
  }
}


// Quick link to manage subjects in settings
const manageSubjLink = document.querySelector('.manage-subjects-link');
if (manageSubjLink) {
  manageSubjLink.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab('settings', true);
    setTimeout(() => {
      const el = document.getElementById('subjectManagerList');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  });
}

// Subject Manager delegated click handlers (Rename, Delete)
const subjManagerListEl = document.getElementById('subjectManagerList');
if (subjManagerListEl) {
  subjManagerListEl.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.subject-delete-btn');
    if (delBtn) {
      deleteSubject(delBtn.dataset.subject);
      return;
    }
    const renameBtn = e.target.closest('.subject-rename-btn');
    if (renameBtn) {
      const oldName = renameBtn.dataset.renameSubject;
      const newName = prompt(`Rename subject "${oldName}" across all routine, tracker, and syllabus data:`, oldName);
      if (newName && newName.trim() && newName.trim() !== oldName) {
        renameSubject(oldName, newName.trim());
      }
      return;
    }
  });
}

// Deleted Subject List restore button
const deletedListEl = document.getElementById('deletedSubjectList');
if (deletedListEl) {
  deletedListEl.addEventListener('click', (e) => {
    const restoreBtn = e.target.closest('.subject-restore-btn');
    if (restoreBtn) {
      restoreSubject(restoreBtn.dataset.restoreSubject);
    }
  });
}


// ===== Auto Backup File Connect Listener =====
const connectBtn = document.getElementById('connectAutoSyncBtn');
if (connectBtn) {
  connectBtn.addEventListener('click', connectAutoSyncFile);
}

// ===== JSON export / import =====
document.getElementById('exportDataBtn').addEventListener('click', async () => {
  const exportBundle = {
    ...state,
    exams: exams || [],
    mistakes: mistakes || [],
    customMCQQuestions: (typeof getStoredQuestions === "function" ? getStoredQuestions() : []),
    mcqProgress: (typeof userMCQProgress !== "undefined" ? userMCQProgress : null),
    todayBreakMinutes: getTodayBreakMinutes()
  };
  const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'careerdesk-data.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  await writeToAutoBackupFile();
  showToast('Data exported successfully as JSON!');
});

document.getElementById('importDataInput').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      let imported = JSON.parse(ev.target.result);

      // Handle Zero-Knowledge Encrypted .vault files
      if (imported && imported.__careerdesk_vault && typeof decryptVaultPayload === 'function') {
        const pass = prompt('This backup is encrypted with Zero-Knowledge AES-GCM-256.\nEnter your secret passphrase:');
        if (!pass) {
          e.target.value = '';
          return;
        }
        imported = await decryptVaultPayload(imported, pass);
        sessionStorage.setItem('careerdesk_active_vault_pass', pass);
      }

      // Anti-Prototype Pollution scrubbing
      if (typeof scrubPrototypePollution === 'function') {
        imported = scrubPrototypePollution(imported);
      }

      const rawState = imported.state || imported;

      const ok = window.confirm('This will replace all current data with the backup file data. Proceed?');
      if (!ok) { e.target.value = ''; return; }

      state = {
        routine: Array.isArray(rawState.routine) && rawState.routine.length ? migrateRoutine(rawState.routine) : buildDefaultRoutine(dateKey(Date.now())),
        notes: Array.isArray(rawState.notes) ? rawState.notes : [],
        customQuotes: Array.isArray(rawState.customQuotes) ? rawState.customQuotes : [],
        quoteIdx: typeof rawState.quoteIdx === 'number' ? rawState.quoteIdx : 0,
        quoteSource: rawState.quoteSource || 'all',
        theme: rawState.theme === 'light' ? 'light' : 'dark',
        sessions: Array.isArray(rawState.sessions) ? rawState.sessions : [],
        activeSession: rawState.activeSession || null,
        dailyTargetMinutes: typeof rawState.dailyTargetMinutes === 'number' ? rawState.dailyTargetMinutes : 240,
        syllabus: Array.isArray(rawState.syllabus) ? rawState.syllabus : [],
        flashcards: Array.isArray(rawState.flashcards) ? rawState.flashcards : [],
        quoteCarouselEnabled: typeof rawState.quoteCarouselEnabled === 'boolean' ? rawState.quoteCarouselEnabled : true,
        quoteCarouselInterval: typeof rawState.quoteCarouselInterval === 'number' ? rawState.quoteCarouselInterval : 300,
        deletedSubjects: Array.isArray(rawState.deletedSubjects) ? rawState.deletedSubjects : [],
        customSubjects: Array.isArray(rawState.customSubjects) ? rawState.customSubjects : [],
        deletedQuotes: Array.isArray(rawState.deletedQuotes) ? rawState.deletedQuotes : []
      };

      const examsList = Array.isArray(imported.exams) ? imported.exams : (Array.isArray(rawState.exams) ? rawState.exams : null);
      if (examsList) {
        exams = examsList;
        saveExams();
      }
      if (Array.isArray(imported.mistakes)) {
        mistakes = imported.mistakes;
        if (typeof saveMistakes === 'function') saveMistakes();
      }
      if (Array.isArray(imported.customMCQQuestions) && typeof saveStoredQuestions === 'function') {
        saveStoredQuestions(imported.customMCQQuestions);
      }
      if (imported.mcqProgress && typeof saveMCQProgress === 'function') {
        userMCQProgress = imported.mcqProgress;
        saveMCQProgress();
      }
      if (typeof imported.todayBreakMinutes === 'number') {
        localStorage.setItem('jobprep_break_minutes_today', String(imported.todayBreakMinutes));
      }

      await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
      await writeToAutoBackupFile();
      showToast('🛡️ Backup restored successfully!');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      console.error('Import Error:', err);
      showToast(err.message || 'Invalid backup file', true);
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

// Export JSON Shortcut Button (Settings)
const exportSettingsBtn = document.getElementById('exportDataBtnSettings');
if (exportSettingsBtn) {
  exportSettingsBtn.addEventListener('click', () => {
    document.getElementById('exportDataBtn').click();
  });
}

// Cloud Backup Shortcut Buttons (Settings Data Card)
const uploadCloudDataCardBtn = document.getElementById('btnUploadCloudFromDataCard');
if (uploadCloudDataCardBtn) {
  uploadCloudDataCardBtn.addEventListener('click', () => {
    if (typeof uploadBackupToCloud === 'function') {
      uploadBackupToCloud(true);
    } else {
      showToast('Cloud sync module is initializing...', true);
    }
  });
}

const restoreCloudDataCardBtn = document.getElementById('btnRestoreCloudFromDataCard');
if (restoreCloudDataCardBtn) {
  restoreCloudDataCardBtn.addEventListener('click', () => {
    if (typeof restoreBackupFromCloud === 'function') {
      restoreBackupFromCloud();
    } else {
      showToast('Cloud sync module is initializing...', true);
    }
  });
}

// ===== Reset all data =====
document.getElementById('resetAllBtn').addEventListener('click', async () => {
  const ok = window.confirm('Are you sure? All routines, notes, syllabus, flashcards, and tracker sessions will be deleted. This cannot be undone.');
  if (!ok) return;
  const keepTheme = state.theme;
  state = {
    routine: buildDefaultRoutine(dateKey(Date.now())), notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
    sessions: [], activeSession: null, dailyTargetMinutes: 240,
    syllabus: [], flashcards: [],
    quoteCarouselEnabled: true, quoteCarouselInterval: 300,
    deletedSubjects: [], customSubjects: [], deletedQuotes: []
  };
  try {
    localStorage.removeItem(EXAMS_KEY);
    localStorage.removeItem(MISTAKES_KEY);
    localStorage.removeItem('jobprep_break_minutes_today');
    localStorage.removeItem('custom_bcs_questions_v3');
    localStorage.removeItem('jobprep_custom_quiz_questions');
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) { }
  await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
  await writeToAutoBackupFile();
  showToast('All data has been reset.');
  setTimeout(() => location.reload(), 800);
});

// ===== Toggle & Add Custom Subject (Settings) =====
const toggleSubjectBtn = document.getElementById('toggleSubjectFormBtn');
const subjectAddForm = document.getElementById('subjectAddForm');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const newSubjectInput = document.getElementById('newSubjectInput');

if (toggleSubjectBtn && subjectAddForm) {
  toggleSubjectBtn.addEventListener('click', () => {
    const isOpen = subjectAddForm.style.display !== 'none';
    subjectAddForm.style.display = isOpen ? 'none' : 'flex';
    toggleSubjectBtn.innerHTML = isOpen ? `${ICON.plus} <span>New Subject</span>` : `${ICON.x} <span>Close</span>`;
    toggleSubjectBtn.classList.toggle('active-open', !isOpen);
    if (!isOpen && newSubjectInput) {
      newSubjectInput.focus();
    }
  });
}

if (addSubjectBtn && newSubjectInput) {
  addSubjectBtn.addEventListener('click', () => {
    const name = newSubjectInput.value.trim();
    if (!name) { newSubjectInput.focus(); return; }
    const added = (typeof addSubject === 'function' ? addSubject(name) : name) || name;
    newSubjectInput.value = '';
    if (subjectAddForm && toggleSubjectBtn) {
      subjectAddForm.style.display = 'none';
      toggleSubjectBtn.innerHTML = `${ICON.plus} <span>New Subject</span>`;
      toggleSubjectBtn.classList.remove('active-open');
    }
    showToast(`"${added}" added to subject list.`);
  });
  newSubjectInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addSubjectBtn.click();
  });
}

