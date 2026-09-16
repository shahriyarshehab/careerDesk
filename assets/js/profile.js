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

// ===== JSON export / import (Legacy fallback, guarded) =====
const exportDataBtnEl = document.getElementById('exportDataBtn');
if (exportDataBtnEl) {
  exportDataBtnEl.addEventListener('click', async () => {
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
}

const importDataInputEl = document.getElementById('importDataInput');
if (importDataInputEl) {
  importDataInputEl.addEventListener('change', (e) => {
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
          routine: Array.isArray(rawState.routine) ? migrateRoutine(rawState.routine) : [],
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
}

// Export JSON Shortcut Button (Settings)
const exportSettingsBtn = document.getElementById('exportDataBtnSettings');
if (exportSettingsBtn) {
  exportSettingsBtn.addEventListener('click', () => {
    document.getElementById('exportDataBtn')?.click();
  });
}

// Firestore Real-Time Sync Button (Settings Data Card)
const btnSyncFirestoreNow = document.getElementById('btnSyncFirestoreNow');
if (btnSyncFirestoreNow) {
  btnSyncFirestoreNow.addEventListener('click', async () => {
    if (typeof syncUserDataToFirestore === 'function') {
      await syncUserDataToFirestore(null, false);
    } else if (typeof uploadBackupToCloud === 'function') {
      uploadBackupToCloud(false);
    }
  });
}

// Cloud Backup Shortcut Buttons (Settings Data Card - backwards compatibility)
const uploadCloudDataCardBtn = document.getElementById('btnUploadCloudFromDataCard');
if (uploadCloudDataCardBtn) {
  uploadCloudDataCardBtn.addEventListener('click', () => {
    if (typeof syncUserDataToFirestore === 'function') {
      syncUserDataToFirestore(null, false);
    } else if (typeof uploadBackupToCloud === 'function') {
      uploadBackupToCloud(true);
    }
  });
}

const restoreCloudDataCardBtn = document.getElementById('btnRestoreCloudFromDataCard');
if (restoreCloudDataCardBtn) {
  restoreCloudDataCardBtn.addEventListener('click', () => {
    if (typeof collectUserDataFromFirestore === 'function') {
      collectUserDataFromFirestore();
    } else if (typeof restoreBackupFromCloud === 'function') {
      restoreBackupFromCloud();
    }
  });
}

// ===== Delete Cloud Data by User with Confirmation Modal =====
async function deleteUserCloudData() {
  const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
  if (!user) {
    if (typeof showToast === 'function') showToast('Please sign in to delete cloud data.', true);
    return;
  }
  try {
    if (typeof initFirebaseApp === 'function') initFirebaseApp();
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      // 1. Delete all backups in subcollection
      try {
        const snaps = await db.collection('users').doc(user.uid).collection('backups').get();
        for (const snapDoc of snaps.docs) {
          try { await snapDoc.ref.delete(); } catch(e) {}
        }
      } catch(e) {}
      // 2. Delete user doc in Firestore
      try {
        await db.collection('users').doc(user.uid).delete();
      } catch(e) {}
    }
    try {
      localStorage.removeItem(FIREBASE_LAST_SYNC_KEY);
      localStorage.removeItem('careerdesk_cloud_snapshots_cache');
    } catch(e) {}
    if (typeof showToast === 'function') showToast('Cloud data deleted permanently from servers.');
    if (typeof renderUserProfileUI === 'function') renderUserProfileUI();
    if (typeof renderCloudSnapshotsList === 'function') renderCloudSnapshotsList();
  } catch (err) {
    console.error('Error deleting cloud data:', err);
    if (typeof showToast === 'function') showToast('Error deleting cloud data: ' + (err.message || 'Error'), true);
  }
}

const btnDeleteCloudData = document.getElementById('btnDeleteCloudData');
const deleteCloudModal = document.getElementById('deleteCloudModal');
const closeDeleteCloudModalBtn = document.getElementById('closeDeleteCloudModalBtn');
const cancelDeleteCloudModalBtn = document.getElementById('cancelDeleteCloudModalBtn');
const confirmDeleteCloudBtn = document.getElementById('confirmDeleteCloudBtn');

function openDeleteCloudModal() {
  if (deleteCloudModal) deleteCloudModal.style.display = 'flex';
}
function closeDeleteCloudModal() {
  if (deleteCloudModal) deleteCloudModal.style.display = 'none';
}

if (btnDeleteCloudData) {
  btnDeleteCloudData.addEventListener('click', openDeleteCloudModal);
}
if (closeDeleteCloudModalBtn) {
  closeDeleteCloudModalBtn.addEventListener('click', closeDeleteCloudModal);
}
if (cancelDeleteCloudModalBtn) {
  cancelDeleteCloudModalBtn.addEventListener('click', closeDeleteCloudModal);
}
if (deleteCloudModal) {
  deleteCloudModal.addEventListener('click', (e) => {
    if (e.target === deleteCloudModal) closeDeleteCloudModal();
  });
}
if (confirmDeleteCloudBtn) {
  confirmDeleteCloudBtn.addEventListener('click', async () => {
    closeDeleteCloudModal();
    await deleteUserCloudData();
  });
}

// ===== Reset all data (Guarded) =====
const resetAllBtnEl = document.getElementById('resetAllBtn');
if (resetAllBtnEl) {
  resetAllBtnEl.addEventListener('click', async () => {
    const ok = window.confirm('Are you sure? All routines, notes, syllabus, flashcards, and tracker sessions will be deleted. This cannot be undone.');
    if (!ok) return;
    const keepTheme = state.theme;
    state = {
      routine: [], notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
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
}

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

// ==========================================================================
// Academic & Career Track / Bangladesh Curriculum & Subject Management Hub
// ==========================================================================

function renderProfileTrackCard() {
  const container = document.getElementById('profileTrackCard');
  if (!container) return;

  const track = typeof getUserTrack === 'function' ? getUserTrack() : { role: 'job_seeker', studentClass: 'ssc_science', jobType: 'govt' };
  const isStudent = track.role === 'student';
  const isJobSeeker = !isStudent;
  const currentClassId = track.studentClass || 'ssc_science';
  const currentJobType = track.jobType || 'govt';

  const activeSubjects = typeof masterSubjectList === 'function' ? masterSubjectList(false) : [];
  const activeSet = new Set(activeSubjects.map(s => canonicalSubjectName(s).toLowerCase()));

  // Find class curriculum data if student
  const classObj = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes)
    ? (BANGLADESH_CURRICULUM_DATA.classes.find(c => c.id === currentClassId) || BANGLADESH_CURRICULUM_DATA.classes[3])
    : { name: 'SSC Science', short: 'SSC', badge: 'Secondary Science', subjects: ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Higher Mathematics', 'ICT'] };
  const classSubjects = classObj.subjects || [];

  // Job Seeker subjects
  const primaryJobSubs = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker)
    ? BANGLADESH_CURRICULUM_DATA.jobSeeker.primarySubjects
    : [
        { name: 'Bangla', bn: 'বাংলা (সাহিত্য ও ব্যাকরণ)', desc: 'সাহিত্য, ব্যাকরণ ও ভাষা প্রয়োগ' },
        { name: 'English', bn: 'English Language & Literature', desc: 'Grammar, High-yield Vocabulary & Literature' },
        { name: 'Mathematics', bn: 'গণিত ও গাণিতিক যুক্তি', desc: 'পাটিগণিত, বীজগণিত, জ্যামিতি ও বিশ্লেষণ' },
        { name: 'General Knowledge', bn: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', desc: 'বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক ঘটনাবলি ও সাম্প্রতিক' }
      ];

  const optionalJobSubs = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker)
    ? BANGLADESH_CURRICULUM_DATA.jobSeeker.optionalSubjects
    : [
        { name: 'Computer & ICT', bn: 'কম্পিউটার ও তথ্যপ্রযুক্তি', desc: 'কম্পিউটার সংগঠন, সাইবার নিরাপত্তা ও ইন্টারনেট' },
        { name: 'General Science', bn: 'সাধারণ বিজ্ঞান', desc: 'দৈনন্দিন বিজ্ঞান, পদার্থ, রসায়ন ও জীববিদ্যা' },
        { name: 'Mental Ability', bn: 'মানসিক দক্ষতা', desc: 'যুক্তি ও বিশ্লেষণমূলক সমস্যা সমাধান' },
        { name: 'Geography & Environment', bn: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', desc: 'বাংলাদেশ ও বৈশ্বিক প্রাকৃতিক ভূগোল' },
        { name: 'Ethics & Good Governance', bn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', desc: 'রাষ্ট্রনীতি, সুশাসন ও মূল্যবোধ' }
      ];

  let contentHtml = '';

  if (isStudent) {
    // Student View: Class Selector & Bangladesh Curriculum Subjects
    contentHtml = `
      <div class="track-selection-box">
        <div class="track-row-header">
          <div>
            <strong class="track-section-label">Select Education Level / Class (Bangladesh Curriculum)</strong>
            <p class="track-section-desc">Class subjects automatically calibrate your routine, syllabus checklist, and revision decks.</p>
          </div>
          <span class="track-class-badge">${escapeHtml(classObj.badge || 'NCTB Curriculum')}</span>
        </div>

        <div class="track-class-controls">
          <select id="profileClassSelect" class="track-custom-select" aria-label="Select Bangladesh Curriculum Class">
            ${((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).map(c => `
              <option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>
                ${escapeHtml(c.name)}
              </option>
            `).join('')}
          </select>
          <button type="button" class="pill theme-action-btn" id="btnActivateAllClassSubjects" title="Activate all standard subjects for this class">
            <i data-lucide="check-check"></i> <span>Activate All Class Subjects</span>
          </button>
        </div>
      </div>

      <div class="track-subjects-section">
        <div class="track-sub-header">
          <h4 class="track-sub-title">
            <i data-lucide="book-open" style="color:var(--accent1); width:16px; height:16px;"></i>
            <span>Class Subjects (${escapeHtml(classObj.short)}): Manage Active Subjects</span>
          </h4>
          <span class="track-active-count">${classSubjects.filter(s => activeSet.has(canonicalSubjectName(s).toLowerCase())).length} of ${classSubjects.length} Active</span>
        </div>

        <div class="track-subjects-grid">
          ${classSubjects.map(subName => {
            const canon = canonicalSubjectName(subName);
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { bn: canon, color: '#6366f1' };
            const isActive = activeSet.has(canon.toLowerCase());
            return `
              <label class="track-subject-chip ${isActive ? 'active' : ''}">
                <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                <span class="track-chip-indicator" style="--subj-dot-color: ${meta.color};"></span>
                <div class="track-chip-text">
                  <strong class="track-chip-en">${escapeHtml(canon)}</strong>
                  <span class="track-chip-bn">${escapeHtml(meta.bn)}</span>
                </div>
                <span class="track-chip-status">${isActive ? 'Active' : 'Off'}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    // Job Seeker View: Govt vs Non-Govt & Exactly 4 Primary Core Subjects
    contentHtml = `
      <div class="track-selection-box">
        <div class="track-row-header">
          <div>
            <strong class="track-section-label">Target Job Sector</strong>
            <p class="track-section-desc">Choose between competitive Government cadre/non-cadre jobs or corporate and private positions.</p>
          </div>
          <span class="track-class-badge">${currentJobType === 'govt' ? '🏛️ Public Sector / BCS' : '🏢 Private / MNC'}</span>
        </div>

        <div class="track-sector-toggle-row segmented-group" style="display:inline-flex; width:100%; max-width:480px; margin-top:6px;">
          <button type="button" class="pill track-sector-btn ${currentJobType === 'govt' ? 'active solid' : ''}" data-job-type="govt" style="flex:1; justify-content:center;">
            <i data-lucide="landmark"></i> <span>Govt. Jobs (BCS / Bank / Primary)</span>
          </button>
          <button type="button" class="pill track-sector-btn ${currentJobType === 'non_govt' ? 'active solid' : ''}" data-job-type="non_govt" style="flex:1; justify-content:center;">
            <i data-lucide="briefcase"></i> <span>Non-Govt. (Private / IT / MNC)</span>
          </button>
        </div>
      </div>

      <!-- THE 4 PRIMARY CORE SUBJECTS (Highlighted prominently) -->
      <div class="track-primary-section">
        <div class="track-primary-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="track-gold-star">★</span>
            <h4 class="track-sub-title" style="margin:0;">The 4 Primary Core Subjects</h4>
          </div>
          <span class="track-primary-badge">Universal Foundation</span>
        </div>
        <p class="track-primary-desc">
          For all competitive job examinations in Bangladesh, these 4 foundational pillars carry the vast majority of marks and evaluation weightage.
        </p>

        <div class="track-primary-grid">
          ${primaryJobSubs.map((p, idx) => {
            const canon = canonicalSubjectName(p.name);
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { bn: canon, color: '#f59e0b' };
            const isActive = activeSet.has(canon.toLowerCase());
            return `
              <div class="track-primary-card ${isActive ? 'active' : ''}" style="--pillar-accent:${meta.color};">
                <div class="track-primary-card-top">
                  <div class="track-primary-num">${idx + 1}</div>
                  <div class="track-primary-titles">
                    <strong class="track-primary-name">${escapeHtml(p.name)}</strong>
                    <span class="track-primary-bn">${escapeHtml(p.bn)}</span>
                  </div>
                  <label class="track-switch-wrap" title="Toggle active status">
                    <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                    <span class="track-switch-slider"></span>
                  </label>
                </div>
                <p class="track-primary-details">${escapeHtml(p.desc)}</p>
                <div class="track-primary-footer">
                  <span class="track-primary-status-pill ${isActive ? 'pill-active' : 'pill-off'}">${isActive ? '✓ Included in Planner' : 'Inactive'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Optional & Specialized Subjects -->
      <div class="track-subjects-section" style="margin-top:16px;">
        <div class="track-sub-header">
          <h4 class="track-sub-title">
            <i data-lucide="layers" style="color:var(--accent2); width:16px; height:16px;"></i>
            <span>Specialized &amp; Optional Subjects</span>
          </h4>
          <span class="track-active-count">Optional Add-ons</span>
        </div>

        <div class="track-subjects-grid">
          ${optionalJobSubs.map(sub => {
            const canon = canonicalSubjectName(sub.name);
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { bn: canon, color: '#38bdf8' };
            const isActive = activeSet.has(canon.toLowerCase());
            return `
              <label class="track-subject-chip ${isActive ? 'active' : ''}">
                <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                <span class="track-chip-indicator" style="--subj-dot-color: ${meta.color};"></span>
                <div class="track-chip-text">
                  <strong class="track-chip-en">${escapeHtml(canon)}</strong>
                  <span class="track-chip-bn">${escapeHtml(sub.bn)}</span>
                </div>
                <span class="track-chip-status">${isActive ? 'Active' : 'Off'}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="track-header-banner">
      <div class="track-title-wrap">
        <div class="track-icon-badge">
          <i data-lucide="${isStudent ? 'graduation-cap' : 'briefcase'}"></i>
        </div>
        <div>
          <h3 class="track-main-title">Target Track &amp; Curriculum Manager</h3>
          <p class="track-main-subtitle">Choose whether you are a Student or Job Seeker to manage your active subjects seamlessly.</p>
        </div>
      </div>

      <div class="track-role-switch segmented-group">
        <button type="button" class="pill track-role-btn ${isStudent ? 'active solid' : ''}" data-role="student">
          <i data-lucide="graduation-cap"></i> <span>Student (শিক্ষার্থী)</span>
        </button>
        <button type="button" class="pill track-role-btn ${isJobSeeker ? 'active solid' : ''}" data-role="job_seeker">
          <i data-lucide="briefcase"></i> <span>Job Seeker (চাকরি প্রার্থী)</span>
        </button>
      </div>
    </div>

    <div class="track-content-body">
      ${contentHtml}

      <div class="track-custom-add-box">
        <div style="display:flex; align-items:center; gap:8px;">
          <i data-lucide="plus-circle" style="color:var(--accent1); width:16px; height:16px;"></i>
          <span style="font-size:13px; font-weight:600; color:var(--text);">Add Any Custom Subject:</span>
        </div>
        <div class="track-custom-input-group">
          <input type="text" id="trackCustomSubjectInput" placeholder="e.g. Higher Math, Chemistry, Finance..." class="track-custom-input">
          <button type="button" class="pill solid" id="btnTrackAddCustomSubject">
            <i data-lucide="plus"></i> <span>Add Subject</span>
          </button>
        </div>
      </div>
    </div>
  `;

  attachTrackCardListeners(container, track);

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function attachTrackCardListeners(container, track) {
  container.querySelectorAll('.track-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      if (role === track.role) return;
      track.role = role;
      if (role === 'student') {
        const classObj = ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).find(c => c.id === track.studentClass) || BANGLADESH_CURRICULUM_DATA?.classes?.[3];
        if (classObj && Array.isArray(classObj.subjects)) {
          classObj.subjects.forEach(s => addSubject(s));
        }
      } else {
        ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker?.primarySubjects) || []).forEach(p => addSubject(p.name));
      }
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`Switched track to ${role === 'student' ? 'Student' : 'Job Seeker'}`);
    });
  });

  const classSelect = container.querySelector('#profileClassSelect');
  if (classSelect) {
    classSelect.addEventListener('change', () => {
      track.studentClass = classSelect.value;
      const classObj = ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).find(c => c.id === track.studentClass);
      if (classObj && Array.isArray(classObj.subjects)) {
        classObj.subjects.forEach(s => addSubject(s));
      }
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`Class set to ${classObj ? classObj.short : 'Selected Class'}`);
    });
  }

  const activateAllBtn = container.querySelector('#btnActivateAllClassSubjects');
  if (activateAllBtn) {
    activateAllBtn.addEventListener('click', () => {
      const classObj = ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).find(c => c.id === track.studentClass);
      if (classObj && Array.isArray(classObj.subjects)) {
        classObj.subjects.forEach(s => addSubject(s));
        if (typeof saveUserTrack === 'function') saveUserTrack(track);
        if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
        renderProfileTrackCard();
        if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
        if (typeof showToast === 'function') showToast(`All ${classObj.subjects.length} subjects activated!`);
      }
    });
  }

  container.querySelectorAll('.track-sector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-job-type');
      track.jobType = type;
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      renderProfileTrackCard();
      if (typeof showToast === 'function') showToast(`Target set to ${type === 'govt' ? 'Government Jobs' : 'Non-Government / Private'}`);
    });
  });

  container.querySelectorAll('.track-subject-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const subj = cb.getAttribute('data-subject');
      if (!subj) return;
      const canonical = canonicalSubjectName(subj);
      if (cb.checked) {
        if (typeof addSubject === 'function') addSubject(canonical);
        if (typeof showToast === 'function') showToast(`"${canonical}" activated`);
      } else {
        if (!Array.isArray(state.deletedSubjects)) state.deletedSubjects = [];
        if (!state.deletedSubjects.some(s => canonicalSubjectName(s).toLowerCase() === canonical.toLowerCase())) {
          state.deletedSubjects.push(canonical);
        }
        if (typeof saveData === 'function') saveData();
        if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
        if (typeof showToast === 'function') showToast(`"${canonical}" hidden from active subjects`);
      }
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
    });
  });

  const addCustomBtn = container.querySelector('#btnTrackAddCustomSubject');
  const customInput = container.querySelector('#trackCustomSubjectInput');
  if (addCustomBtn && customInput) {
    const handleAdd = () => {
      const name = customInput.value.trim();
      if (!name) { customInput.focus(); return; }
      const added = typeof addSubject === 'function' ? addSubject(name) : name;
      customInput.value = '';
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`"${added || name}" added to your subjects!`);
    };
    addCustomBtn.addEventListener('click', handleAdd);
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });
  }
}

window.renderProfileTrackCard = renderProfileTrackCard;

// Auto-initialize profile track card on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderProfileTrackCard, 100);
  });
} else {
  setTimeout(renderProfileTrackCard, 100);
}

