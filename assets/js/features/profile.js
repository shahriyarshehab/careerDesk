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

// ===== Subject Manager Modal Controllers =====
function openSubjectManagerModal() {
  const modal = document.getElementById('subjectManagerModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
    renderSubjectManager();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    const input = document.getElementById('newSubjectInput');
    if (input) setTimeout(() => input.focus(), 80);
  }
}

function closeSubjectManagerModal() {
  const modal = document.getElementById('subjectManagerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

const closeSubjectManagerModalBtn = document.getElementById('closeSubjectManagerModalBtn');
if (closeSubjectManagerModalBtn) {
  closeSubjectManagerModalBtn.addEventListener('click', closeSubjectManagerModal);
}

function renderSubjectManager() {
  const container = document.getElementById('subjectManagerList');
  const cockpitContainer = document.getElementById('cockpitSubjectManagerList');
  const deletedSection = document.getElementById('deletedSubjectSection');
  const cockpitDeletedSection = document.getElementById('cockpitDeletedSubjectSection');
  const deletedContainer = document.getElementById('deletedSubjectList');
  const cockpitDeletedContainer = document.getElementById('cockpitDeletedSubjectList');
  const countBadge = document.getElementById('subjectCountBadge');
  const cockpitCountBadge = document.getElementById('cockpitSubjectCountBadge');

  if (!container && !cockpitContainer) return;

  const activeSubjects = masterSubjectList(false);
  const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
  const allSubjects = masterSubjectList(true);
  const deletedSubjects = allSubjects.filter(s => deletedSet.has(canonicalSubjectName(s).toLowerCase()));

  const countText = `${activeSubjects.length} Active`;
  if (countBadge) countBadge.textContent = countText;
  if (cockpitCountBadge) cockpitCountBadge.textContent = countText;

  let activeHtml = '';
  if (!activeSubjects.length) {
    activeHtml = '<p style="color:var(--text-soft); font-size:13px; margin:8px 0; text-align:center;">No active subjects found. Click "Reset Defaults" or add a new subject above.</p>';
  } else {
    activeHtml = activeSubjects.map(s => {
      const stats = getSubjectStats(s);
      const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(s) : { color: '#6366f1', icon: 'book-open' };
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

      const currentTrack = typeof getUserTrack === 'function' ? getUserTrack() : null;
      const currentLang = currentTrack ? (currentTrack.subjectLanguage || 'en') : 'en';
      const displayName = typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(s, currentLang) : s;
      const altName = currentLang === 'bn' ? '' : (meta.bn || '');

      return `
        <div class="subject-manager-row">
          <div class="subject-info">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="track-subj-icon-badge" style="color:${meta.color}; background:${meta.color}18; width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
              </span>
              <span class="subject-manager-name">${escapeHtml(displayName)}</span>
              ${altName && altName !== displayName ? `<span style="font-size:11.5px; color:var(--text-soft); font-weight:500;">(${escapeHtml(altName)})</span>` : ''}
            </div>
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

  if (container) container.innerHTML = activeHtml;
  if (cockpitContainer) cockpitContainer.innerHTML = activeHtml;

  let deletedHtml = '';
  if (deletedSubjects.length > 0) {
    deletedHtml = deletedSubjects.map(s => {
      const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(s) : { color: '#6366f1', icon: 'book-open' };
      return `
        <div class="subject-manager-row subject-deleted">
          <div class="subject-info">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="track-subj-icon-badge" style="color:var(--text-soft); opacity:0.6; background:rgba(255,255,255,0.05); width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
              </span>
              <span class="subject-manager-name">${escapeHtml(s)}</span>
            </div>
            <span style="font-size:11px; color:var(--text-soft); display:flex; align-items:center; gap:6px; margin-top:2px;">
              <span>Hidden from pickers</span> &bull; 
              <span style="color:#f43f5e; font-weight:600; font-size:10.5px; background:rgba(244,63,94,0.08); padding:1px 6px; border-radius:4px; border:1px solid rgba(244,63,94,0.2);">Deleted data cannot restore</span>
            </span>
          </div>
          <div class="btn-group subject-row-actions">
            <button class="pill subject-restore-btn" data-restore-subject="${escapeAttr(s)}" type="button" title="Restore this subject">
              ${ICON.undo} <span>Restore</span>
            </button>
            <button class="pill danger subject-hard-delete-btn" data-perm-delete-subject="${escapeAttr(s)}" type="button" title="Permanently delete subject (deleted data cannot restore)">
              ${ICON.trash} <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (deletedSection && deletedContainer) {
    if (deletedSubjects.length > 0) {
      deletedSection.style.display = 'block';
      deletedContainer.innerHTML = deletedHtml;
    } else {
      deletedSection.style.display = 'none';
      deletedContainer.innerHTML = '';
    }
  }

  if (cockpitDeletedSection && cockpitDeletedContainer) {
    if (deletedSubjects.length > 0) {
      cockpitDeletedSection.style.display = 'block';
      cockpitDeletedContainer.innerHTML = deletedHtml;
    } else {
      cockpitDeletedSection.style.display = 'none';
      cockpitDeletedContainer.innerHTML = '';
    }
  }

  syncSubjectLanguageSwitch();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

}

/* The subject-language switch lives in the Subject Manager header and reflects the
   saved track preference, so every list here renders in the same language. */
function syncSubjectLanguageSwitch() {
  const switcher = document.getElementById('subjectLangSwitcher');
  if (!switcher) return;
  const lang = (typeof getUserTrack === 'function' ? (getUserTrack().subjectLanguage || 'en') : 'en');
  switcher.querySelectorAll('.track-lang-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('solid', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

// Global click delegation for Subject Manager actions (Open, Close, Rename, Delete, Restore)
document.addEventListener('click', (e) => {
  // In-page navigation to Master Subject Manager tab
  const openTrackBtn = e.target.closest('#btnOpenSubjectManagerFromHero, #btnOpenSubjectManagerFromGuest, #btnOpenSubjectManagerFromTrack, .manage-subjects-link');
  if (openTrackBtn) {
    e.preventDefault();
    if (typeof activateTab === 'function') {
      activateTab('settings', true);
      setTimeout(() => {
        const card = document.getElementById('profileSubjectsCockpitCard');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
    return;
  }

  // Open Subject Manager modal explicitly
  const openModalBtn = e.target.closest('#btnOpenSubjectManagerModal, .btn-open-subject-manager');
  if (openModalBtn) {
    e.preventDefault();
    openSubjectManagerModal();
    return;
  }

  // Close modal button
  if (e.target.closest('#closeSubjectManagerModalBtn')) {
    e.preventDefault();
    closeSubjectManagerModal();
    return;
  }

  // Backdrop click on Subject Manager modal
  if (e.target && e.target.id === 'subjectManagerModal') {
    closeSubjectManagerModal();
    return;
  }

  // Delete subject
  const delBtn = e.target.closest('.subject-delete-btn');
  if (delBtn) {
    e.preventDefault();
    const subj = delBtn.dataset.subject;
    if (subj) {
      deleteSubject(subj);
      renderSubjectManager();
    }
    return;
  }

  // Rename subject
  const renameBtn = e.target.closest('.subject-rename-btn');
  if (renameBtn) {
    e.preventDefault();
    const oldName = renameBtn.dataset.renameSubject;
    if (oldName) {
      const newName = prompt(`Rename subject "${oldName}" across all routine, tracker, and syllabus data:`, oldName);
      if (newName && newName.trim() && newName.trim() !== oldName) {
        renameSubject(oldName, newName.trim());
        renderSubjectManager();
      }
    }
    return;
  }

  // Restore subject
  const restoreBtn = e.target.closest('.subject-restore-btn');
  if (restoreBtn) {
    e.preventDefault();
    const subj = restoreBtn.dataset.restoreSubject;
    if (subj) {
      restoreSubject(subj);
      renderSubjectManager();
    }
    return;
  }

  // Permanently delete subject (Modal)
  const permDelBtn = e.target.closest('.subject-hard-delete-btn, [data-perm-delete-subject]');
  if (permDelBtn) {
    e.preventDefault();
    const subj = permDelBtn.getAttribute('data-perm-delete-subject');
    if (subj && typeof permanentlyDeleteSubject === 'function') {
      permanentlyDeleteSubject(subj);
      renderSubjectManager();
    }
    return;
  }
});

// ESC key closes Subject Manager modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('subjectManagerModal');
    if (modal && (modal.style.display === 'flex' || modal.classList.contains('open'))) {
      closeSubjectManagerModal();
    }
  }
});

// Add new subject button in modal
const modalAddSubjBtn = document.getElementById('addSubjectBtn');
const modalSubjInput = document.getElementById('newSubjectInput');
if (modalAddSubjBtn && modalSubjInput) {
  modalAddSubjBtn.addEventListener('click', () => {
    const name = modalSubjInput.value.trim();
    if (!name) { modalSubjInput.focus(); return; }
    const added = (typeof addSubject === 'function' ? addSubject(name) : name) || name;
    modalSubjInput.value = '';
    renderSubjectManager();
    showToast(`"${added}" added to active subjects.`);
  });
  modalSubjInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      modalAddSubjBtn.click();
    }
  });
}

// Reset default subjects button in modal
const resetDefSubjBtn = document.getElementById('resetDefaultSubjectsBtn');
if (resetDefSubjBtn) {
  resetDefSubjBtn.addEventListener('click', () => {
    const ok = confirm('Reset all custom, deleted, and permanently deleted subjects to standard defaults? Existing logged study sessions and routine blocks are preserved.');
    if (!ok) return;
    state.customSubjects = [];
    state.deletedSubjects = [];
    state.permanentlyDeletedSubjects = [];
    saveData();
    syncAllSubjectSelects();
    renderSubjectManager();
    showToast('Subjects reset to defaults.');
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
          customQuotes: Array.isArray(rawState.customQuotes) ? rawState.customQuotes : [],
          quoteIdx: typeof rawState.quoteIdx === 'number' ? rawState.quoteIdx : 0,
          quoteSource: rawState.quoteSource || 'all',
          theme: rawState.theme === 'light' ? 'light' : 'dark',
          sessions: Array.isArray(rawState.sessions) ? rawState.sessions : [],
          activeSession: rawState.activeSession || null,
          dailyTargetMinutes: typeof rawState.dailyTargetMinutes === 'number' ? rawState.dailyTargetMinutes : 240,
          syllabus: Array.isArray(rawState.syllabus) ? rawState.syllabus : [],
          flashcards: Array.isArray(rawState.flashcards) ? rawState.flashcards : [],
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

// Firestore Real-Time Sync Button (Settings Data Card)
const btnSyncFirestoreNow = document.getElementById('btnSyncFirestoreNow');
if (btnSyncFirestoreNow) {
  btnSyncFirestoreNow.addEventListener('click', async () => {
    const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    if (!user) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      if (typeof showToast === 'function') showToast('Please sign in to sync your study data with cloud.', true);
      return;
    }
    if (typeof syncUserDataToFirestore === 'function') {
      await syncUserDataToFirestore(null, false);
    } else if (typeof uploadBackupToCloud === 'function') {
      uploadBackupToCloud(false);
    }
  });
}

// ===== Delete Cloud Data & User Reset Modal Controller =====

let _deleteCloudAccountsList = [];

function handleDeleteCloudUserSelectionChange() {
  const userSelect = document.getElementById('deleteCloudUserSelect');
  const customUidRow = document.getElementById('deleteCloudCustomUidRow');
  const customUidInput = document.getElementById('deleteCloudCustomUid');
  const avatarEl = document.getElementById('deleteCloudAvatar');
  const nameEl = document.getElementById('deleteCloudTargetName');
  const emailEl = document.getElementById('deleteCloudTargetEmail');
  const uidEl = document.getElementById('deleteCloudTargetUid');
  const authNoticeEl = document.getElementById('deleteCloudAuthNotice');
  const chkCloud = document.getElementById('chkDeleteCloudRecords');
  const chkLocal = document.getElementById('chkDeleteLocalRecords');
  const lblSignOut = document.getElementById('lblDeleteSignOut');
  const chkSignOut = document.getElementById('chkDeleteSignOut');
  const confirmBtnText = document.getElementById('confirmDeleteCloudBtnText');

  if (!userSelect) return;
  const selectedVal = userSelect.value;

  if (selectedVal === 'custom') {
    if (customUidRow) customUidRow.style.display = 'block';
    const customVal = customUidInput ? customUidInput.value.trim() : '';
    if (avatarEl) avatarEl.innerHTML = '<i data-lucide="user" style="width:20px; height:20px;"></i>';
    if (nameEl) nameEl.textContent = customVal ? `Target: ${customVal}` : 'Custom Account';
    if (emailEl) emailEl.textContent = 'Specified by identifier';
    if (uidEl) uidEl.textContent = customVal ? `UID / ID: ${customVal}` : 'Enter UID or email above';

    // Check if custom UID matches active auth user
    const firebaseAuthUser = (typeof getSafeFirebaseAuthUser === 'function') ? getSafeFirebaseAuthUser() : null;
    const isAuth = !!(firebaseAuthUser && (firebaseAuthUser.uid === customVal || (firebaseAuthUser.email && firebaseAuthUser.email.toLowerCase() === customVal.toLowerCase())));

    if (authNoticeEl) {
      if (isAuth) {
        authNoticeEl.style.background = 'rgba(16,185,129,0.1)';
        authNoticeEl.style.borderColor = 'rgba(16,185,129,0.25)';
        authNoticeEl.style.color = '#10b981';
        authNoticeEl.innerHTML = `<i data-lucide="shield-check" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Authenticated Active Session:</strong> Remote Firestore cloud deletion is authorized by security rules.`;
        if (chkCloud) { chkCloud.disabled = false; chkCloud.checked = true; }
      } else {
        authNoticeEl.style.background = 'rgba(245,158,11,0.1)';
        authNoticeEl.style.borderColor = 'rgba(245,158,11,0.25)';
        authNoticeEl.style.color = '#f59e0b';
        authNoticeEl.innerHTML = `<i data-lucide="alert-triangle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Unauthenticated Remote UID:</strong> Firestore security rules strictly require active login as this user to erase remote cloud records. Local caches on this device will be purged. To delete remote cloud data, log in as this user.`;
        if (chkCloud) { chkCloud.disabled = false; chkCloud.checked = false; }
      }
    }
    if (lblSignOut) lblSignOut.style.display = isAuth ? 'flex' : 'none';
    if (confirmBtnText) confirmBtnText.textContent = 'Delete Target User Data';
  } else if (selectedVal === 'ALL_LOCAL') {
    if (customUidRow) customUidRow.style.display = 'none';
    if (avatarEl) avatarEl.innerHTML = '<i data-lucide="alert-triangle" style="width:20px; height:20px; color:#f43f5e;"></i>';
    if (nameEl) nameEl.textContent = 'All Local Accounts & Workspaces';
    if (emailEl) emailEl.textContent = 'All cached user sessions and data bundles on this device';
    if (uidEl) uidEl.textContent = 'Scope: Entire Local Storage';

    if (authNoticeEl) {
      authNoticeEl.style.background = 'rgba(244,63,94,0.1)';
      authNoticeEl.style.borderColor = 'rgba(244,63,94,0.25)';
      authNoticeEl.style.color = '#f43f5e';
      authNoticeEl.innerHTML = `<i data-lucide="alert-triangle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Device-Wide Reset:</strong> All offline user bundles, local snapshots, and username registrations will be wiped from this browser. Remote cloud databases are untouched.`;
    }
    if (chkCloud) { chkCloud.checked = false; chkCloud.disabled = true; }
    if (chkLocal) { chkLocal.checked = true; chkLocal.disabled = true; }
    if (lblSignOut) lblSignOut.style.display = 'flex';
    if (chkSignOut) chkSignOut.checked = true;
    if (confirmBtnText) confirmBtnText.textContent = 'Wipe All Local Accounts on Device';
  } else {
    if (customUidRow) customUidRow.style.display = 'none';
    const acc = _deleteCloudAccountsList.find(a => a.uid === selectedVal) || {
      uid: selectedVal,
      displayName: 'Selected User',
      email: '',
      isActive: false,
      isAuthenticated: false
    };

    const initial = (acc.displayName || 'U').trim().charAt(0).toUpperCase();
    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = acc.displayName || 'CareerDesk User';
    if (emailEl) emailEl.textContent = acc.email || 'No email provided';
    if (uidEl) uidEl.textContent = `UID: ${acc.uid}`;

    if (authNoticeEl) {
      if (acc.isAuthenticated) {
        authNoticeEl.style.background = 'rgba(16,185,129,0.1)';
        authNoticeEl.style.borderColor = 'rgba(16,185,129,0.25)';
        authNoticeEl.style.color = '#10b981';
        authNoticeEl.innerHTML = `<i data-lucide="shield-check" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Cloud Access Verified:</strong> Authenticated as this UID in Firebase. Remote Firestore documents &amp; snapshots can be deleted directly.`;
        if (chkCloud) { chkCloud.disabled = false; chkCloud.checked = true; }
      } else {
        authNoticeEl.style.background = 'rgba(245,158,11,0.1)';
        authNoticeEl.style.borderColor = 'rgba(245,158,11,0.25)';
        authNoticeEl.style.color = '#f59e0b';
        authNoticeEl.innerHTML = `<i data-lucide="alert-triangle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Not Authenticated as this UID:</strong> Firestore security rules require an active sign-in with this UID to delete its cloud document. Local storage will be purged now. To delete cloud data, sign in as this user first.`;
        if (chkCloud) { chkCloud.disabled = false; chkCloud.checked = false; }
      }
    }

    if (chkLocal) { chkLocal.disabled = false; chkLocal.checked = true; }
    if (lblSignOut) lblSignOut.style.display = acc.isActive ? 'flex' : 'none';
    if (chkSignOut) chkSignOut.checked = acc.isActive;
    if (confirmBtnText) confirmBtnText.textContent = `Delete Data for ${acc.displayName || 'User'}`;
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function openDeleteCloudModal(preselectedUid = null) {
  if (!deleteCloudModal) return;
  deleteCloudModal.style.display = 'flex';
  setTimeout(() => deleteCloudModal.classList.add('open'), 10);

  const userSelect = document.getElementById('deleteCloudUserSelect');
  const customUidRow = document.getElementById('deleteCloudCustomUidRow');
  const customUidInput = document.getElementById('deleteCloudCustomUid');
  const progressBox = document.getElementById('deleteCloudProgressBox');
  const confirmBtn = document.getElementById('confirmDeleteCloudBtn');

  if (progressBox) progressBox.style.display = 'none';
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
  }

  _deleteCloudAccountsList = (typeof getKnownUserAccounts === 'function')
    ? getKnownUserAccounts()
    : [];

  const activeUser = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;

  if (userSelect) {
    let optsHtml = '';
    if (_deleteCloudAccountsList.length === 0 && activeUser) {
      optsHtml += `<option value="${escapeAttr(activeUser.uid)}" selected>${escapeHtml(activeUser.displayName || 'Active User')} (${escapeHtml(activeUser.email || activeUser.uid.slice(0, 8))}) • [Active Session]</option>`;
    } else {
      _deleteCloudAccountsList.forEach(acc => {
        const activeLabel = acc.isActive ? ' • [Active Session]' : '';
        const authLabel = acc.isAuthenticated ? ' (Cloud Auth ✓)' : ' (Local Cache)';
        const display = `${escapeHtml(acc.displayName)} (${escapeHtml(acc.email || acc.uid.slice(0, 8))})${activeLabel}${authLabel}`;
        const isSelected = preselectedUid ? (preselectedUid === acc.uid) : acc.isActive;
        optsHtml += `<option value="${escapeAttr(acc.uid)}" ${isSelected ? 'selected' : ''}>${display}</option>`;
      });
    }

    optsHtml += `<option value="ALL_LOCAL">⚠️ All Local Accounts &amp; Workspaces on this Device</option>`;
    optsHtml += `<option value="custom">✏️ Target Specific Custom UID / Email...</option>`;

    userSelect.innerHTML = optsHtml;

    userSelect.onchange = handleDeleteCloudUserSelectionChange;
    if (customUidInput) {
      customUidInput.oninput = handleDeleteCloudUserSelectionChange;
    }

    handleDeleteCloudUserSelectionChange();
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeDeleteCloudModal() {
  if (deleteCloudModal) {
    deleteCloudModal.classList.remove('open');
    setTimeout(() => {
      if (!deleteCloudModal.classList.contains('open')) {
        deleteCloudModal.style.display = 'none';
      }
    }, 200);
  }
}

// Backward compatibility wrapper
async function deleteUserCloudData() {
  const activeUser = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
  const uid = activeUser ? activeUser.uid : 'active_user';
  if (typeof deleteCloudDataForUser === 'function') {
    return await deleteCloudDataForUser(uid, { deleteCloud: true, deleteLocal: true, signOut: true });
  }
}

const btnDeleteCloudData = document.getElementById('btnDeleteCloudData');
const deleteCloudModal = document.getElementById('deleteCloudModal');
const closeDeleteCloudModalBtn = document.getElementById('closeDeleteCloudModalBtn');
const cancelDeleteCloudModalBtn = document.getElementById('cancelDeleteCloudModalBtn');
const confirmDeleteCloudBtn = document.getElementById('confirmDeleteCloudBtn');

if (btnDeleteCloudData) {
  btnDeleteCloudData.addEventListener('click', () => openDeleteCloudModal());
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
    const userSelect = document.getElementById('deleteCloudUserSelect');
    const customUidInput = document.getElementById('deleteCloudCustomUid');
    let selectedUid = userSelect ? userSelect.value : 'active_user';

    if (selectedUid === 'custom') {
      selectedUid = customUidInput ? customUidInput.value.trim() : '';
      if (!selectedUid) {
        showToast('Please enter a target UID or email', true);
        if (customUidInput) customUidInput.focus();
        return;
      }
    }

    const chkCloud = document.getElementById('chkDeleteCloudRecords');
    const chkLocal = document.getElementById('chkDeleteLocalRecords');
    const chkSignOut = document.getElementById('chkDeleteSignOut');

    const deleteCloud = chkCloud ? chkCloud.checked : true;
    const deleteLocal = chkLocal ? chkLocal.checked : true;
    const signOut = chkSignOut ? chkSignOut.checked : true;

    const confirmMsg = (selectedUid === 'ALL_LOCAL')
      ? 'Are you sure you want to delete ALL local user workspaces and accounts on this device? This cannot be undone.'
      : `Are you sure you want to permanently delete data for this user?\n\nThis cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    const progressBox = document.getElementById('deleteCloudProgressBox');
    const progressText = document.getElementById('deleteCloudProgressText');

    if (progressBox) progressBox.style.display = 'block';
    if (confirmDeleteCloudBtn) {
      confirmDeleteCloudBtn.disabled = true;
      confirmDeleteCloudBtn.style.opacity = '0.6';
    }

    try {
      if (typeof deleteCloudDataForUser === 'function') {
        const result = await deleteCloudDataForUser(selectedUid, {
          deleteCloud,
          deleteLocal,
          signOut,
          onProgress: (msg) => {
            if (progressText) progressText.textContent = msg;
          }
        });

        if (result.cloudError && result.cloudError.message === 'NOT_AUTHENTICATED_FOR_UID') {
          showToast('Local records purged. Firestore cloud wipe requires active sign-in as this UID.', true);
        } else if (result.cloudError) {
          showToast('Local records purged. Cloud error: ' + (result.cloudError.message || 'Error'), true);
        } else if (result.cloudSuccess) {
          showToast('User cloud documents and local data permanently deleted! ✓');
        } else {
          showToast('User data deleted successfully. ✓');
        }
      } else {
        await deleteUserCloudData();
      }

      closeDeleteCloudModal();
    } catch (err) {
      console.error('[CareerDesk] Deletion error:', err);
      showToast('Error deleting data: ' + (err.message || 'Error'), true);
    } finally {
      if (confirmDeleteCloudBtn) {
        confirmDeleteCloudBtn.disabled = false;
        confirmDeleteCloudBtn.style.opacity = '1';
      }
      if (progressBox) progressBox.style.display = 'none';
    }
  });
}

// ===== Reset all data (Guarded) =====
const resetAllBtnEl = document.getElementById('resetAllBtn');
if (resetAllBtnEl) {
  resetAllBtnEl.addEventListener('click', async () => {
    const ok = window.confirm('Are you sure? All routines, syllabus, flashcards, and tracker sessions will be deleted. This cannot be undone.');
    if (!ok) return;
    const keepTheme = state.theme;
    state = typeof getDefaultState === 'function' ? getDefaultState() : {
      routine: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
      sessions: [], activeSession: null, dailyTargetMinutes: 240,
      syllabus: [], flashcards: [],
      deletedSubjects: [], customSubjects: [], deletedQuotes: []
    };
    state.theme = keepTheme;
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



// =========================================================================
// PROFILE & SETTINGS COCKPIT CONTROLLER
// =========================================================================

function switchProfileCockpitTab(tabKey) {
  const validTabs = ['overview', 'security'];
  const targetKey = validTabs.includes(tabKey) ? tabKey : 'overview';

  // 1. Update navigation buttons
  const navBtns = document.querySelectorAll('#profileCockpitNav .cockpit-nav-btn');
  navBtns.forEach(btn => {
    const isTarget = btn.dataset.cockpitTab === targetKey;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // 2. Switch visible pane
  const paneMap = {
    overview: 'cockpitPaneOverview',
    security: 'cockpitPaneSecurity'
  };

  Object.entries(paneMap).forEach(([key, paneId]) => {
    const pane = document.getElementById(paneId);
    if (pane) {
      const isTarget = key === targetKey;
      pane.style.display = isTarget ? 'block' : 'none';
      pane.classList.toggle('active', isTarget);
    }
  });

  // 3. Save selection
  try {
    localStorage.setItem('careerdesk_profile_cockpit_tab', targetKey);
  } catch (e) { }

  // 4. Trigger pane renderers
  if (targetKey === 'overview' && typeof renderProfileAspirantHub === 'function') {
    renderProfileAspirantHub();
  } else if (targetKey === 'security' && typeof renderSecurityVaultUI === 'function') {
    renderSecurityVaultUI();
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
window.switchProfileCockpitTab = switchProfileCockpitTab;

// Bind Cockpit Event Listeners
document.addEventListener('click', (e) => {
  // 1. Cockpit Nav Tab Clicks
  const navBtn = e.target.closest('#profileCockpitNav .cockpit-nav-btn');
  if (navBtn) {
    e.preventDefault();
    const tabKey = navBtn.dataset.cockpitTab;
    if (tabKey) switchProfileCockpitTab(tabKey);
    return;
  }

  // 2. Cockpit Add Subject Button
  if (e.target.closest('#cockpitAddSubjectBtn')) {
    e.preventDefault();
    const input = document.getElementById('cockpitNewSubjectInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const added = typeof addSubject === 'function' ? addSubject(name) : name;
    input.value = '';
    renderSubjectManager();
    if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
    if (typeof showToast === 'function') showToast(`Subject "${added || name}" added successfully!`);
    return;
  }

  // 2b. Subject display language switch (English / বাংলা)
  const langBtn = e.target.closest('#subjectLangSwitcher .track-lang-btn');
  if (langBtn) {
    e.preventDefault();
    const lang = langBtn.getAttribute('data-lang');
    if (typeof setSubjectLanguage === 'function') {
      setSubjectLanguage(lang);
    } else {
      const track = getUserTrack();
      track.subjectLanguage = lang === 'bn' ? 'bn' : 'en';
      saveUserTrack(track);
    }
    syncSubjectLanguageSwitch();
    renderSubjectManager();
    return;
  }

  // 3. Reset Defaults Cockpit Button
  if (e.target.closest('#btnResetDefaultSubjectsCockpit')) {
    e.preventDefault();
    const ok = confirm('Reset subjects to standard Bangladesh curriculum defaults? (Custom added subjects will be retained)');
    if (!ok) return;
    if (typeof resetDefaultSubjects === 'function') {
      resetDefaultSubjects();
    } else {
      state.deletedSubjects = [];
      saveData();
      syncAllSubjectSelects();
    }
    renderSubjectManager();
    if (typeof showToast === 'function') showToast('Standard curriculum subjects restored.');
    return;
  }

});

// Cockpit Subject Input Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target && e.target.id === 'cockpitNewSubjectInput') {
    e.preventDefault();
    const addBtn = document.getElementById('cockpitAddSubjectBtn');
    if (addBtn) addBtn.click();
  }
});

// Auto-initialize profile track card and cockpit tab on load
function initProfileCockpit() {
  const savedTab = localStorage.getItem('careerdesk_profile_cockpit_tab') || 'overview';
  switchProfileCockpitTab(savedTab);
}
window.initProfileCockpit = initProfileCockpit;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initProfileCockpit();
    }, 100);
  });
} else {
  setTimeout(() => {
    initProfileCockpit();
  }, 100);
}
