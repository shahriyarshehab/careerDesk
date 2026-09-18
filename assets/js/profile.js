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
    container.innerHTML = '<p style="color:var(--text-soft); font-size:13px; margin:8px 0; text-align:center;">No active subjects found. Click "Reset Defaults" or add a new subject above.</p>';
  } else {
    container.innerHTML = activeSubjects.map(s => {
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

  if (deletedSection && deletedContainer) {
    if (deletedSubjects.length > 0) {
      deletedSection.style.display = 'block';
      deletedContainer.innerHTML = deletedSubjects.map(s => {
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
              <span style="font-size:11px; color:var(--text-soft);">Hidden from subject pickers</span>
            </div>
            <button class="pill subject-restore-btn" data-restore-subject="${escapeAttr(s)}" type="button" title="Restore this subject">
              ${ICON.undo} <span>Restore</span>
            </button>
          </div>
        `;
      }).join('');
    } else {
      deletedSection.style.display = 'none';
      deletedContainer.innerHTML = '';
    }
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Also keep the embedded profile track card in sync
  const trackCard = document.getElementById('profileTrackCard');
  if (trackCard && typeof renderProfileTrackCard === 'function') {
    const curTab = localStorage.getItem('careerdesk_track_active_tab') || 'curriculum';
    if (curTab === 'subjects' || curTab === 'inactive') {
      renderProfileTrackCard();
    }
  }
}

// Global click delegation for Subject Manager actions (Open, Close, Rename, Delete, Restore)
document.addEventListener('click', (e) => {
  // In-page navigation to Master Subject Manager tab
  const openTrackBtn = e.target.closest('#btnOpenSubjectManagerFromHero, #btnOpenSubjectManagerFromGuest, #btnOpenSubjectManagerFromTrack, .manage-subjects-link');
  if (openTrackBtn) {
    e.preventDefault();
    localStorage.setItem('careerdesk_track_active_tab', 'subjects');
    localStorage.setItem('careerdesk_track_card_collapsed', 'false');
    if (typeof activateTab === 'function') {
      activateTab('profile');
    }
    renderProfileTrackCard();
    const card = document.getElementById('profileTrackCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const searchInput = card.querySelector('#trackSubjSearchInput');
        if (searchInput) searchInput.focus();
      }, 350);
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
    const ok = confirm('Reset all custom and deleted subjects to standard defaults? Existing logged study sessions and routine blocks are preserved.');
    if (!ok) return;
    state.customSubjects = [];
    state.deletedSubjects = [];
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

// Create Snapshot Button
const btnCreateSnapshotNow = document.getElementById('btnCreateSnapshotNow');
if (btnCreateSnapshotNow) {
  btnCreateSnapshotNow.addEventListener('click', async () => {
    const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    if (!user) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      if (typeof showToast === 'function') showToast('Please sign in to create cloud snapshots.', true);
      return;
    }
    if (typeof createCloudSnapshot === 'function') {
      createCloudSnapshot(null, null, false);
    }
  });
}


// Cloud Backup Shortcut Buttons (Settings Data Card - backwards compatibility)
const uploadCloudDataCardBtn = document.getElementById('btnUploadCloudFromDataCard');
if (uploadCloudDataCardBtn) {
  uploadCloudDataCardBtn.addEventListener('click', () => {
    const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    if (!user) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      if (typeof showToast === 'function') showToast('Please sign in to sync with cloud.', true);
      return;
    }
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
    const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;
    if (!user) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      if (typeof showToast === 'function') showToast('Please sign in to restore from cloud.', true);
      return;
    }
    if (typeof collectUserDataFromFirestore === 'function') {
      collectUserDataFromFirestore();
    } else if (typeof restoreBackupFromCloud === 'function') {
      restoreBackupFromCloud();
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
    const ok = window.confirm('Are you sure? All routines, notes, syllabus, flashcards, and tracker sessions will be deleted. This cannot be undone.');
    if (!ok) return;
    const keepTheme = state.theme;
    state = typeof getDefaultState === 'function' ? getDefaultState() : {
      routine: [], notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
      sessions: [], activeSession: null, dailyTargetMinutes: 240,
      syllabus: [], flashcards: [],
      quoteCarouselEnabled: true, quoteCarouselInterval: 300,
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


// ==========================================================================
// Academic & Career Track / Bangladesh Curriculum & Subject Management Hub
// ==========================================================================

// Track card edit mode & search query state
let isTrackEditMode = false;
let trackSubjSearchQuery = '';

function renderProfileTrackCard() {
  const container = document.getElementById('profileTrackCard');
  if (!container) return;

  const track = typeof getUserTrack === 'function' ? getUserTrack() : { role: 'job_seeker', studentClass: 'ssc_science', jobType: 'govt', subjectLanguage: 'en' };
  const currentLang = track.subjectLanguage || 'en';
  const isLangBn = currentLang === 'bn';
  const isLangEn = !isLangBn;
  const isStudent = track.role === 'student';
  const isJobSeeker = !isStudent;
  const currentClassId = track.studentClass || 'ssc_science';
  const currentJobType = track.jobType || 'govt';
  const isCollapsed = localStorage.getItem('careerdesk_track_card_collapsed') === 'true';

  let activeTab = localStorage.getItem('careerdesk_track_active_tab') || 'curriculum';
  if (!['curriculum', 'subjects', 'inactive'].includes(activeTab)) activeTab = 'curriculum';

  const activeSubjects = typeof masterSubjectList === 'function' ? masterSubjectList(false) : [];
  const activeSet = new Set(activeSubjects.map(s => canonicalSubjectName(s).toLowerCase()));

  const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
  const allSubjects = typeof masterSubjectList === 'function' ? masterSubjectList(true) : [];
  const deletedSubjects = allSubjects.filter(s => deletedSet.has(canonicalSubjectName(s).toLowerCase()));

  // Find class curriculum data if student (filter out user-deleted subjects so auto-generated list never shows them)
  const classObj = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes)
    ? (BANGLADESH_CURRICULUM_DATA.classes.find(c => c.id === currentClassId) || BANGLADESH_CURRICULUM_DATA.classes[3])
    : { name: 'SSC Science', short: 'SSC', badge: 'Secondary Science', subjects: ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Higher Mathematics', 'ICT'] };
  const rawClassSubjects = classObj.subjects || [];
  const classSubjects = rawClassSubjects.filter(s => !deletedSet.has(canonicalSubjectName(s).toLowerCase()));

  // Job Seeker subjects (filter out user-deleted subjects so auto-generated list never shows them)
  const rawPrimaryJobSubs = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker)
    ? BANGLADESH_CURRICULUM_DATA.jobSeeker.primarySubjects
    : [
        { name: 'Bangla', desc: 'Language, grammar, comprehension & literature' },
        { name: 'English', desc: 'Grammar, vocabulary, composition & literature' },
        { name: 'Mathematics', desc: 'Arithmetic, algebra, geometry & analytical reasoning' },
        { name: 'General Knowledge', desc: 'Bangladesh affairs, international relations & current events' }
      ];
  const primaryJobSubs = rawPrimaryJobSubs.filter(p => !deletedSet.has(canonicalSubjectName(p.name).toLowerCase()));

  const primaryEnglishDescs = {
    'Bangla': 'Language, grammar, comprehension & literature',
    'English': 'Grammar, vocabulary, composition & literature',
    'Mathematics': 'Arithmetic, algebra, geometry & analytical reasoning',
    'General Knowledge': 'Bangladesh affairs, international relations & current events'
  };

  const rawOptionalJobSubs = (typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker)
    ? BANGLADESH_CURRICULUM_DATA.jobSeeker.optionalSubjects
    : [
        { name: 'Computer & ICT' },
        { name: 'General Science' },
        { name: 'Mental Ability' },
        { name: 'Geography & Environment' },
        { name: 'Ethics & Good Governance' }
      ];
  const optionalJobSubs = rawOptionalJobSubs.filter(sub => !deletedSet.has(canonicalSubjectName(sub.name).toLowerCase()));

  // Calculate cumulative stats across all active subjects for Subject Manager tab
  let totalMinAll = 0;
  let totalRoutineAll = 0;
  let totalTopicsDoneAll = 0;
  let totalTopicsCountAll = 0;
  activeSubjects.forEach(s => {
    const st = getSubjectStats(s);
    totalMinAll += (st.totalMin || 0);
    totalRoutineAll += (st.routineCount || 0);
    totalTopicsDoneAll += (st.topicsDone || 0);
    totalTopicsCountAll += (st.topicsCount || 0);
  });

  const langSelectionBoxHtml = `
    <div class="track-selection-box track-lang-selection-box">
      <div class="track-row-header">
        <div>
          <strong class="track-section-label">Subject Display Language (বিষয় প্রদর্শনের ভাষা)</strong>
          <p class="track-section-desc">Choose whether subject titles appear in English or বাংলা (Bangla) across curriculum, routine, and planners</p>
        </div>
        <span class="track-class-badge" style="display:inline-flex; align-items:center; gap:5px;">
          <i data-lucide="languages" style="width:12px; height:12px;"></i>
          <span>${isLangBn ? 'বাংলা (Bangla)' : 'English'}</span>
        </span>
      </div>

      <div class="track-sector-toggle-row segmented-group track-sm-sector-group" style="display:inline-flex; width:auto; padding:3px; border-radius:10px; margin-top:6px;">
        <button type="button" class="pill track-lang-btn ${isLangEn ? 'active solid' : ''}" data-lang="en" style="padding:5px 14px; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
          <i data-lucide="languages" style="width:13px; height:13px;"></i> <span>English</span>
        </button>
        <button type="button" class="pill track-lang-btn ${isLangBn ? 'active solid' : ''}" data-lang="bn" style="padding:5px 14px; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
          <span style="font-size:11.5px; font-weight:700;">বাং</span> <span>বাংলা (Bangla)</span>
        </button>
      </div>
    </div>
  `;

  // Build Tab 1 (Curriculum Track)
  let curriculumHtml = '';
  if (isStudent) {
    curriculumHtml = `
      ${langSelectionBoxHtml}

      <div class="track-selection-box">
        <div class="track-row-header">
          <div>
            <strong class="track-section-label">Education Level / Class</strong>
            <p class="track-section-desc">National curriculum alignment for school and college exams</p>
          </div>
          <span class="track-class-badge">${escapeHtml(classObj.badge || 'Curriculum Track')}</span>
        </div>

        <div class="track-class-controls">
          <select id="profileClassSelect" class="track-custom-select" aria-label="Select Class Level">
            ${((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).map(c => {
              const cleanName = (c.name || '').replace(/\\s*\\([^)]*[\\u0980-\\u09FF]+[^)]*\\)/g, '').replace(/—/g, '-').trim();
              return `
                <option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>
                  ${escapeHtml(cleanName)}
                </option>
              `;
            }).join('')}
          </select>
        </div>
      </div>

      <div class="track-subjects-section">
        <div class="track-sub-header">
          <h4 class="track-sub-title">
            <i data-lucide="book-open" style="color:var(--accent1); width:16px; height:16px;"></i>
            <span>Class Subjects (${escapeHtml(classObj.short)})</span>
          </h4>
          <span class="track-active-count">${classSubjects.filter(s => activeSet.has(canonicalSubjectName(s).toLowerCase())).length} of ${classSubjects.length} Active</span>
        </div>

        <div class="track-subjects-grid">
          ${classSubjects.map(subName => {
            const canon = canonicalSubjectName(subName);
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { color: '#6366f1', icon: 'book-open' };
            const isActive = activeSet.has(canon.toLowerCase());
            const displayName = isLangBn ? (meta.bn || canon) : canon;
            const altName = isLangBn ? '' : (meta.bn || '');
            return `
              <div class="track-subject-chip ${isActive ? 'active' : ''}">
                <label style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer; min-width:0;">
                  <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                  <span class="track-chip-icon" style="color:${meta.color}; background:${meta.color}18; width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
                  </span>
                  <div class="track-chip-text" style="display:flex; align-items:baseline; gap:5px; flex-wrap:wrap;">
                    <strong class="track-chip-en">${escapeHtml(displayName)}</strong>
                    ${altName && altName !== displayName ? `<span style="font-size:11px; color:var(--text-soft); opacity:0.8;">(${escapeHtml(altName)})</span>` : ''}
                  </div>
                  <span class="track-chip-status">${isActive ? (isLangBn ? 'সক্রিয়' : 'Active') : (isLangBn ? 'বন্ধ' : 'Off')}</span>
                </label>
                ${isTrackEditMode ? `
                  <button type="button" class="micro-btn edit btn-track-subj-rename" data-subject="${escapeAttr(canon)}" title="Rename ${escapeAttr(canon)}" style="margin-left:4px;">
                    <i data-lucide="edit-2" style="width:12px; height:12px;"></i>
                  </button>
                ` : ''}
                <button type="button" class="micro-btn danger btn-track-subj-delete" data-subject="${escapeAttr(canon)}" title="Permanently delete ${escapeAttr(canon)}" style="margin-left:4px;">
                  <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    curriculumHtml = `
      ${langSelectionBoxHtml}

      <div class="track-selection-box">
        <div class="track-row-header">
          <div>
            <strong class="track-section-label">Target Job Sector</strong>
            <p class="track-section-desc">Tailors exam countdowns, routine presets, and recommended focus areas</p>
          </div>
          <span class="track-class-badge">${currentJobType === 'govt' ? 'Public Sector / BCS' : 'Private & Corporate'}</span>
        </div>

        <div class="track-sector-toggle-row segmented-group track-sm-sector-group" style="display:inline-flex; width:auto; padding:3px; border-radius:10px; margin-top:6px;">
          <button type="button" class="pill track-sector-btn ${currentJobType === 'govt' ? 'active solid' : ''}" data-job-type="govt" style="padding:5px 14px; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
            <i data-lucide="landmark" style="width:13px; height:13px;"></i> <span>Govt. / BCS</span>
          </button>
          <button type="button" class="pill track-sector-btn ${currentJobType === 'non_govt' ? 'active solid' : ''}" data-job-type="non_govt" style="padding:5px 14px; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
            <i data-lucide="briefcase" style="width:13px; height:13px;"></i> <span>Non-Govt. / Corporate</span>
          </button>
        </div>
      </div>

      <!-- THE 4 PRIMARY CORE SUBJECTS -->
      <div class="track-primary-section">
        <div class="track-primary-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4 class="track-sub-title" style="margin:0;">The 4 Primary Core Subjects</h4>
          </div>
          <span class="track-primary-badge">Universal Foundation</span>
        </div>

        <div class="track-primary-grid" style="margin-top:12px;">
          ${primaryJobSubs.map((p, idx) => {
            const canon = canonicalSubjectName(p.name);
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { color: '#f59e0b', icon: 'book-open' };
            const isActive = activeSet.has(canon.toLowerCase());
            const desc = isLangBn ? (p.desc || primaryEnglishDescs[canon]) : (primaryEnglishDescs[canon] || p.desc || 'Core foundational subject');
            const displayName = isLangBn ? (meta.bn || p.bn || canon) : canon;
            const subName = isLangBn ? '' : (meta.bn || '');
            return `
              <div class="track-primary-card ${isActive ? 'active' : ''}" style="--pillar-accent:${meta.color};">
                <div class="track-primary-card-top">
                  <div class="track-primary-icon-box" style="color:${meta.color}; background:${meta.color}18; border:1px solid ${meta.color}35;">
                    <i data-lucide="${meta.icon || 'book-open'}"></i>
                  </div>
                  <div class="track-primary-titles">
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                      <span class="track-primary-num-badge">#${idx + 1}</span>
                      <strong class="track-primary-name">${escapeHtml(displayName)}</strong>
                      ${subName && subName !== displayName ? `<span class="track-primary-alt-tag" style="font-size:11.5px; color:var(--text-soft); opacity:0.85;">(${escapeHtml(subName)})</span>` : ''}
                    </div>
                  </div>
                  <label class="track-switch-wrap" title="Toggle active status">
                    <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                    <span class="track-switch-slider"></span>
                  </label>
                </div>
                <p class="track-primary-details">${escapeHtml(desc)}</p>
                <div class="track-primary-footer">
                  <span class="track-primary-status-pill ${isActive ? 'pill-active' : 'pill-off'}">${isActive ? (isLangBn ? 'পাঠ্যক্রমে অন্তর্ভুক্ত' : 'Included in Planner') : (isLangBn ? 'নিষ্ক্রিয়' : 'Inactive')}</span>
                  ${isTrackEditMode ? `
                    <button type="button" class="micro-btn edit btn-track-subj-rename" data-subject="${escapeAttr(canon)}" title="Rename ${escapeAttr(canon)}">
                      <i data-lucide="edit-2" style="width:11px; height:11px;"></i>
                    </button>
                  ` : ''}
                  <button type="button" class="micro-btn danger btn-track-subj-delete" data-subject="${escapeAttr(canon)}" title="Permanently delete ${escapeAttr(canon)}" style="margin-left:4px;">
                    <i data-lucide="trash-2" style="width:11px; height:11px;"></i>
                  </button>
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
            const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(canon) : { color: '#38bdf8', icon: 'book-open' };
            const isActive = activeSet.has(canon.toLowerCase());
            const displayName = isLangBn ? (meta.bn || sub.bn || canon) : canon;
            const altName = isLangBn ? '' : (meta.bn || '');
            return `
              <div class="track-subject-chip ${isActive ? 'active' : ''}">
                <label style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer; min-width:0;">
                  <input type="checkbox" class="track-subject-checkbox" data-subject="${escapeAttr(canon)}" ${isActive ? 'checked' : ''}>
                  <span class="track-chip-icon" style="color:${meta.color}; background:${meta.color}18; width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
                  </span>
                  <div class="track-chip-text" style="display:flex; align-items:baseline; gap:5px; flex-wrap:wrap;">
                    <strong class="track-chip-en">${escapeHtml(displayName)}</strong>
                    ${altName && altName !== displayName ? `<span style="font-size:11px; color:var(--text-soft); opacity:0.8;">(${escapeHtml(altName)})</span>` : ''}
                  </div>
                  <span class="track-chip-status">${isActive ? (isLangBn ? 'সক্রিয়' : 'Active') : (isLangBn ? 'বন্ধ' : 'Off')}</span>
                </label>
                ${isTrackEditMode ? `
                  <button type="button" class="micro-btn edit btn-track-subj-rename" data-subject="${escapeAttr(canon)}" title="Rename ${escapeAttr(canon)}" style="margin-left:4px;">
                    <i data-lucide="edit-2" style="width:12px; height:12px;"></i>
                  </button>
                ` : ''}
                <button type="button" class="micro-btn danger btn-track-subj-delete" data-subject="${escapeAttr(canon)}" title="Permanently delete ${escapeAttr(canon)}" style="margin-left:4px;">
                  <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Build Tab 2 (Master Subject Manager - Merged Feature)
  const subjectsHtml = `
    <!-- 4 Overview Metric Cards -->
    <div class="track-metrics-grid">
      <div class="track-metric-card">
        <div class="track-metric-icon">
          <i data-lucide="layers"></i>
        </div>
        <div class="track-metric-info">
          <span class="track-metric-val">${activeSubjects.length}</span>
          <span class="track-metric-lbl">Active Subjects</span>
        </div>
      </div>

      <div class="track-metric-card">
        <div class="track-metric-icon" style="color:var(--accent1); background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.3);">
          <i data-lucide="clock"></i>
        </div>
        <div class="track-metric-info">
          <span class="track-metric-val">${fmtHM(totalMinAll)}</span>
          <span class="track-metric-lbl">Total Study Logged</span>
        </div>
      </div>

      <div class="track-metric-card">
        <div class="track-metric-icon" style="color:#10b981; background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.3);">
          <i data-lucide="calendar"></i>
        </div>
        <div class="track-metric-info">
          <span class="track-metric-val">${totalRoutineAll}</span>
          <span class="track-metric-lbl">Routine Blocks</span>
        </div>
      </div>

      <div class="track-metric-card">
        <div class="track-metric-icon" style="color:#f59e0b; background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3);">
          <i data-lucide="check-circle-2"></i>
        </div>
        <div class="track-metric-info">
          <span class="track-metric-val">${totalTopicsDoneAll}/${totalTopicsCountAll}</span>
          <span class="track-metric-lbl">Topics Completed</span>
        </div>
      </div>
    </div>

    <!-- Manager Toolbar -->
    <div class="track-manager-toolbar">
      <div class="track-search-box">
        <i data-lucide="search" class="search-icon"></i>
        <input type="text" id="trackSubjSearchInput" placeholder="Filter active subjects..." value="${escapeAttr(trackSubjSearchQuery)}">
      </div>

      <div class="track-add-inline-group">
        <input type="text" id="trackManagerNewSubjInput" placeholder="Add custom subject (e.g. Higher Math, Law)...">
        <button type="button" class="pill solid" id="btnTrackManagerAddSubj">
          <i data-lucide="plus"></i> <span>Add</span>
        </button>
      </div>

      <button type="button" class="pill subtle" id="btnTrackManagerResetDefaults" title="Reset custom and deleted subjects to standard defaults">
        <i data-lucide="rotate-ccw"></i> <span>Reset Defaults</span>
      </button>
    </div>

    <!-- Subjects Cards List -->
    <div class="track-manager-list" id="trackManagerCardsList">
      ${activeSubjects.map(s => {
        const stats = getSubjectStats(s);
        const canon = canonicalSubjectName(s);
        const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(s) : { color: '#6366f1', icon: 'book-open' };
        const isCustom = (state.customSubjects || []).some(cs => canonicalSubjectName(cs).toLowerCase() === canon.toLowerCase());
        const displayName = typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(s, currentLang) : s;
        const altName = isLangBn ? '' : (meta.bn || '');
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
          ? `<div class="track-manager-card-stats">${statPills.join('')}</div>`
          : '<span style="font-size:11.5px; color:var(--text-soft); opacity:0.75;">No logged study activity yet</span>';

        return `
          <div class="track-manager-card" data-subject-name="${escapeAttr(canon)}" style="--subj-accent:${meta.color};">
            <div class="track-manager-card-info">
              <div class="track-manager-card-title-row">
                <span class="track-manager-card-icon" style="color:${meta.color}; background:${meta.color}18; width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
                </span>
                <span class="track-manager-card-name">${escapeHtml(displayName)}</span>
                ${altName && altName !== displayName ? `<span style="font-size:11.5px; color:var(--text-soft); font-weight:500;">(${escapeHtml(altName)})</span>` : ''}
                ${isCustom ? '<span class="track-custom-tag">Custom</span>' : ''}
              </div>
              ${statsHtml}
            </div>
            <div class="btn-group subject-row-actions">
              <button class="pill subtle btn-track-manager-rename" data-rename-subject="${escapeAttr(canon)}" type="button" title="Rename this subject everywhere">
                ${ICON.edit} <span>Rename</span>
              </button>
              <button class="pill danger btn-track-manager-delete" data-subject="${escapeAttr(canon)}" type="button" title="Hide/Delete this subject">
                ${ICON.trash} <span>Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}

      <div id="trackSearchEmptyNotice" class="track-empty-box" style="display:${activeSubjects.length === 0 ? 'block' : 'none'};">
        <i data-lucide="search-x" style="width:34px; height:34px; color:var(--text-soft); margin:0 auto 8px; display:block; opacity:0.6;"></i>
        <strong style="color:var(--text); font-size:14px; display:block; margin-bottom:4px;">No matching subjects found</strong>
        <p style="font-size:12.5px; color:var(--text-soft); margin:0 0 12px;">Try a different search query or add this as a new subject above.</p>
        <button type="button" class="pill subtle" id="btnClearTrackSearch">Clear Search</button>
      </div>
    </div>
  `;

  // Build Tab 3 (Inactive / Hidden Subjects)
  const inactiveHtml = `
    ${deletedSubjects.length === 0 ? `
      <div class="track-empty-box">
        <i data-lucide="check-circle-2" style="width:38px; height:38px; color:#10b981; margin:0 auto 10px; display:block;"></i>
        <strong style="color:var(--text); font-size:15px; display:block; margin-bottom:4px;">All Subjects Active</strong>
        <p style="font-size:12.5px; color:var(--text-soft); margin:0; max-width:440px; margin:0 auto; line-height:1.5;">
          You don't have any inactive or hidden subjects. When you delete a subject from your curriculum or planner, it is kept safe here and can be restored at any time without losing study history.
        </p>
      </div>
    ` : `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <i data-lucide="info" style="color:var(--accent2); width:16px; height:16px;"></i>
          <span style="font-size:12.5px; color:var(--text-soft);">
            ${deletedSubjects.length} subjects hidden from your planner. All recorded sessions, routine blocks, and syllabus checklists remain preserved.
          </span>
        </div>
        <button type="button" class="pill subtle" id="btnTrackRestoreAll">
          <i data-lucide="undo-2"></i> <span>Restore All (${deletedSubjects.length})</span>
        </button>
      </div>

      <div class="track-manager-list">
        ${deletedSubjects.map(s => {
          const stats = getSubjectStats(s);
          const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(s) : { color: '#6366f1', icon: 'book-open' };
          return `
            <div class="track-manager-card" style="opacity:0.75; border-style:dashed; background:rgba(244,63,94,0.04); border-color:rgba(244,63,94,0.25);">
              <div class="track-manager-card-info">
                <div class="track-manager-card-title-row">
                  <span class="track-manager-card-icon" style="color:var(--text-soft); opacity:0.6; background:rgba(255,255,255,0.05); width:26px; height:26px; border-radius:7px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="${meta.icon || 'book-open'}" style="width:14px; height:14px;"></i>
                  </span>
                  <span class="track-manager-card-name" style="text-decoration:line-through; color:var(--text-soft);">${escapeHtml(s)}</span>
                  <span class="pill subtle" style="font-size:10px; padding:1px 6px; color:#f43f5e; border-color:rgba(244,63,94,0.3);">Hidden</span>
                </div>
                <span style="font-size:11.5px; color:var(--text-soft);">
                  ${stats.totalMin > 0 ? `${fmtHM(stats.totalMin)} study logged &bull; ` : ''}${stats.routineCount} routine blocks preserved
                </span>
              </div>
              <button type="button" class="pill subject-restore-btn btn-track-manager-restore" data-restore-subject="${escapeAttr(s)}" title="Restore to active subjects">
                ${ICON.undo} <span>Restore</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  container.innerHTML = `
    <div class="track-header-banner">
      <div class="track-title-wrap">
        <div class="track-icon-badge">
          <i data-lucide="${isStudent ? 'graduation-cap' : 'briefcase'}"></i>
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h3 class="track-main-title" style="margin:0;">
              <span>Target Track &amp; Curriculum Manager</span>
              <span class="track-active-pill">${activeSubjects.length} Active</span>
            </h3>
            <div class="track-header-controls" style="display:inline-flex; align-items:center; gap:6px;">
              <button type="button" class="pill subtle btn-toggle-track" id="btnToggleTrackCard" title="${isCollapsed ? 'Open Manager' : 'Hide Manager'}" style="padding:4px 10px; font-size:12px; display:inline-flex; align-items:center; gap:5px; cursor:pointer;">
                <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" style="width:13px; height:13px;"></i>
                <span>${isCollapsed ? 'Open' : 'Hide'}</span>
              </button>
              ${activeTab === 'curriculum' ? `
                <button type="button" class="pill subtle btn-track-edit-toggle ${isTrackEditMode ? 'active solid' : ''}" id="btnToggleTrackEditMode" title="${isTrackEditMode ? 'Done editing' : 'Edit track subjects'}" style="padding:4px 10px; font-size:12px; display:inline-flex; align-items:center; gap:5px; cursor:pointer;">
                  <i data-lucide="${isTrackEditMode ? 'check' : 'edit-2'}" style="width:13px; height:13px;"></i>
                  <span>${isTrackEditMode ? 'Done' : 'Edit Track'}</span>
                </button>
              ` : ''}
            </div>
          </div>
          <p class="track-main-subtitle">
            ${isStudent
              ? `Student Track &bull; ${escapeHtml(classObj.name)}`
              : `Job Seeker Track &bull; ${currentJobType === 'govt' ? 'Public Sector / BCS' : 'Private &amp; Corporate Sector'}`}
          </p>
        </div>
      </div>

      <div class="track-header-actions">
        <!-- Subject Display Language Toggle -->
        <div class="track-lang-switch segmented-group" title="Subject Display Language / বিষয় প্রদর্শনের ভাষা">
          <button type="button" class="pill track-lang-btn ${isLangEn ? 'active solid' : ''}" data-lang="en" title="English Subjects">
            <i data-lucide="languages" style="width:13px; height:13px;"></i> <span>English</span>
          </button>
          <button type="button" class="pill track-lang-btn ${isLangBn ? 'active solid' : ''}" data-lang="bn" title="বাংলা বিষয়াবলী">
            <span style="font-size:12px; font-weight:700;">বাং</span> <span>বাংলা</span>
          </button>
        </div>

        <!-- Track Role Switcher -->
        <div class="track-role-switch segmented-group">
          <button type="button" class="pill track-role-btn ${isStudent ? 'active solid' : ''}" data-role="student">
            <i data-lucide="graduation-cap"></i> <span>Student</span>
          </button>
          <button type="button" class="pill track-role-btn ${isJobSeeker ? 'active solid' : ''}" data-role="job_seeker">
            <i data-lucide="briefcase"></i> <span>Job Seeker</span>
          </button>
        </div>
      </div>
    </div>

    <div class="track-content-body" style="${isCollapsed ? 'display:none;' : ''}">
      <!-- Modern Segmented Subnavigation Bar -->
      <div class="track-subnav-bar segmented-group">
        <button type="button" class="pill track-subnav-btn ${activeTab === 'curriculum' ? 'active solid' : ''}" data-track-tab="curriculum">
          <i data-lucide="compass"></i> <span>Track Curriculum</span>
        </button>
        <button type="button" class="pill track-subnav-btn ${activeTab === 'subjects' ? 'active solid' : ''}" data-track-tab="subjects">
          <i data-lucide="layers"></i> <span>Master Subject Manager</span>
          <span class="track-tab-badge">${activeSubjects.length}</span>
        </button>
        <button type="button" class="pill track-subnav-btn ${activeTab === 'inactive' ? 'active solid' : ''}" data-track-tab="inactive">
          <i data-lucide="archive"></i> <span>Inactive / Hidden</span>
          ${deletedSubjects.length > 0 ? `<span class="track-tab-badge danger">${deletedSubjects.length}</span>` : ''}
        </button>
      </div>

      ${activeTab === 'curriculum' ? `
        ${isTrackEditMode ? `
          <div class="track-edit-banner" style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:12px; padding:10px 16px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="edit-3" style="width:16px; height:16px; color:var(--accent1);"></i>
              <span style="font-size:12.5px; font-weight:600; color:var(--text);">Edit Mode Active: Toggle checkboxes to show/hide subjects or click the pencil to rename.</span>
            </div>
            <button type="button" class="pill solid" id="btnDoneTrackEditInline" style="font-size:12px; padding:4px 12px;">Done Editing</button>
          </div>
        ` : ''}

        ${curriculumHtml}

        <div class="track-custom-add-box">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="plus-circle" style="color:var(--accent1); width:16px; height:16px;"></i>
            <span style="font-size:13px; font-weight:600; color:var(--text);">Add Custom Subject:</span>
          </div>
          <div class="track-custom-input-group">
            <input type="text" id="trackCustomSubjectInput" placeholder="e.g. Higher Math, Finance, Law..." class="track-custom-input">
            <button type="button" class="pill solid" id="btnTrackAddCustomSubject">
              <i data-lucide="plus"></i> <span>Add Subject</span>
            </button>
          </div>
        </div>

        <div class="track-jump-banner">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="bar-chart-2" style="color:var(--accent1); width:16px; height:16px;"></i>
            <span style="font-size:12.5px; color:var(--text);">Want to view study time analytics, routine blocks, and syllabus counts per subject?</span>
          </div>
          <a href="#" class="track-jump-link" id="btnJumpToSubjectManager">
            <span>Open Master Subject Manager</span>
            <i data-lucide="arrow-right" style="width:14px; height:14px;"></i>
          </a>
        </div>
      ` : activeTab === 'subjects' ? subjectsHtml : inactiveHtml}
    </div>
  `;

  attachTrackCardListeners(container, track);

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function attachTrackCardListeners(container, track) {
  // Open / Hide Card Toggle
  const toggleCardBtn = container.querySelector('#btnToggleTrackCard');
  if (toggleCardBtn) {
    toggleCardBtn.addEventListener('click', () => {
      const isCurrentlyCollapsed = localStorage.getItem('careerdesk_track_card_collapsed') === 'true';
      localStorage.setItem('careerdesk_track_card_collapsed', (!isCurrentlyCollapsed).toString());
      renderProfileTrackCard();
    });
  }

  // Subnavigation Tab Switcher (Curriculum / Subject Manager / Inactive)
  container.querySelectorAll('.track-subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-track-tab');
      if (tab) {
        localStorage.setItem('careerdesk_track_active_tab', tab);
        renderProfileTrackCard();
      }
    });
  });

  // Jump to Subject Manager shortcut in Curriculum tab
  const jumpBtn = container.querySelector('#btnJumpToSubjectManager');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('careerdesk_track_active_tab', 'subjects');
      renderProfileTrackCard();
    });
  }

  // Live Search Filtering in Subject Manager Tab
  const searchInput = container.querySelector('#trackSubjSearchInput');
  const cardsList = container.querySelector('#trackManagerCardsList');
  const emptyNotice = container.querySelector('#trackSearchEmptyNotice');
  if (searchInput && cardsList) {
    searchInput.addEventListener('input', () => {
      trackSubjSearchQuery = searchInput.value.toLowerCase().trim();
      const rows = cardsList.querySelectorAll('.track-manager-card');
      let visible = 0;
      rows.forEach(r => {
        const name = (r.getAttribute('data-subject-name') || '').toLowerCase();
        const match = !trackSubjSearchQuery || name.includes(trackSubjSearchQuery);
        r.style.display = match ? 'flex' : 'none';
        if (match) visible++;
      });
      if (emptyNotice) emptyNotice.style.display = visible === 0 ? 'block' : 'none';
    });
  }

  const clearSearchBtn = container.querySelector('#btnClearTrackSearch');
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      trackSubjSearchQuery = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  }

  // Inline Add Subject in Subject Manager Tab
  const inlineAddBtn = container.querySelector('#btnTrackManagerAddSubj');
  const inlineAddInput = container.querySelector('#trackManagerNewSubjInput');
  if (inlineAddBtn && inlineAddInput) {
    const handleAdd = () => {
      const name = inlineAddInput.value.trim();
      if (!name) { inlineAddInput.focus(); return; }
      const added = typeof addSubject === 'function' ? addSubject(name) : name;
      inlineAddInput.value = '';
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`"${added || name}" added to your subjects!`);
    };
    inlineAddBtn.addEventListener('click', handleAdd);
    inlineAddInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });
  }

  // Reset Defaults Button in Subject Manager Tab
  const resetBtn = container.querySelector('#btnTrackManagerResetDefaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const ok = confirm('Reset all custom and deleted subjects to standard defaults? Existing logged study sessions and routine blocks are preserved.');
      if (!ok) return;
      state.customSubjects = [];
      state.deletedSubjects = [];
      saveData();
      syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast('Subjects reset to defaults.');
    });
  }

  // Rename Subject in Subject Manager Tab
  container.querySelectorAll('.btn-track-manager-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const oldName = btn.getAttribute('data-rename-subject');
      if (!oldName) return;
      const newName = window.prompt(`Rename subject "${oldName}" across all routine, tracker, and syllabus data:`, oldName);
      if (newName && newName.trim() && newName.trim() !== oldName) {
        if (typeof renameSubject === 'function') {
          renameSubject(oldName, newName.trim());
          renderProfileTrackCard();
          if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
          if (typeof showToast === 'function') showToast(`Renamed "${oldName}" to "${newName.trim()}"`);
        }
      }
    });
  });

  // Delete / Hide Subject in Curriculum or Subject Manager Tab
  container.querySelectorAll('.btn-track-manager-delete, .btn-track-subj-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const subj = btn.getAttribute('data-subject');
      if (!subj) return;
      if (typeof deleteSubject === 'function') {
        deleteSubject(subj);
        renderProfileTrackCard();
        if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      }
    });
  });

  // Restore Subject in Inactive Tab
  container.querySelectorAll('.btn-track-manager-restore').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const subj = btn.getAttribute('data-restore-subject');
      if (!subj) return;
      if (typeof restoreSubject === 'function') {
        restoreSubject(subj);
        renderProfileTrackCard();
        if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      }
    });
  });

  // Restore All in Inactive Tab
  const restoreAllBtn = container.querySelector('#btnTrackRestoreAll');
  if (restoreAllBtn) {
    restoreAllBtn.addEventListener('click', () => {
      if (!Array.isArray(state.deletedSubjects) || state.deletedSubjects.length === 0) return;
      const count = state.deletedSubjects.length;
      state.deletedSubjects = [];
      saveData();
      syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`Restored all ${count} subjects!`);
    });
  }

  // Edit Mode Toggles in Curriculum Tab
  const toggleEditBtn = container.querySelector('#btnToggleTrackEditMode');
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener('click', () => {
      isTrackEditMode = !isTrackEditMode;
      renderProfileTrackCard();
    });
  }

  const inlineDoneBtn = container.querySelector('#btnDoneTrackEditInline');
  if (inlineDoneBtn) {
    inlineDoneBtn.addEventListener('click', () => {
      isTrackEditMode = false;
      renderProfileTrackCard();
    });
  }

  // Rename Subject buttons in Curriculum edit mode
  container.querySelectorAll('.btn-track-subj-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const oldName = btn.getAttribute('data-subject');
      if (!oldName) return;
      const newName = window.prompt(`Rename subject "${oldName}":`, oldName);
      if (newName && newName.trim() && newName.trim() !== oldName) {
        if (typeof renameSubject === 'function') {
          renameSubject(oldName, newName.trim());
          renderProfileTrackCard();
          if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
          if (typeof showToast === 'function') showToast(`Renamed "${oldName}" to "${newName.trim()}"`);
        }
      }
    });
  });

  // Subject Display Language Switcher buttons (English vs Bangla)
  container.querySelectorAll('.track-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (typeof setSubjectLanguage === 'function') {
        setSubjectLanguage(lang);
      } else {
        track.subjectLanguage = (lang === 'bn' || lang === 'bangla') ? 'bn' : 'en';
        if (typeof saveUserTrack === 'function') saveUserTrack(track);
        if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
        renderProfileTrackCard();
        if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
        if (typeof showToast === 'function') {
          showToast(`Subject language set to ${track.subjectLanguage === 'bn' ? 'বাংলা (Bangla)' : 'English'}`);
        }
      }
    });
  });

  // Role Switcher buttons
  container.querySelectorAll('.track-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      if (role === track.role) return;
      track.role = role;
      const deletedSet = new Set((state.deletedSubjects || []).map(d => canonicalSubjectName(d).toLowerCase()));
      if (role === 'student') {
        const classObj = ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).find(c => c.id === track.studentClass) || BANGLADESH_CURRICULUM_DATA?.classes?.[3];
        if (classObj && Array.isArray(classObj.subjects)) {
          classObj.subjects.forEach(s => {
            if (!deletedSet.has(canonicalSubjectName(s).toLowerCase())) addSubject(s);
          });
        }
      } else {
        ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.jobSeeker?.primarySubjects) || []).forEach(p => {
          if (!deletedSet.has(canonicalSubjectName(p.name).toLowerCase())) addSubject(p.name);
        });
      }
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`Switched track to ${role === 'student' ? 'Student' : 'Job Seeker'}`);
    });
  });

  // Class Level select
  const classSelect = container.querySelector('#profileClassSelect');
  if (classSelect) {
    classSelect.addEventListener('change', () => {
      track.studentClass = classSelect.value;
      const classObj = ((typeof BANGLADESH_CURRICULUM_DATA !== 'undefined' && BANGLADESH_CURRICULUM_DATA.classes) || []).find(c => c.id === track.studentClass);
      if (classObj && Array.isArray(classObj.subjects)) {
        const deletedSet = new Set((state.deletedSubjects || []).map(d => canonicalSubjectName(d).toLowerCase()));
        classObj.subjects.forEach(s => {
          if (!deletedSet.has(canonicalSubjectName(s).toLowerCase())) addSubject(s);
        });
      }
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
      renderProfileTrackCard();
      if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
      if (typeof showToast === 'function') showToast(`Class set to ${classObj ? classObj.short : 'Selected Class'}`);
    });
  }

  // Target Job Sector toggles
  container.querySelectorAll('.track-sector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-job-type');
      track.jobType = type;
      if (typeof saveUserTrack === 'function') saveUserTrack(track);
      renderProfileTrackCard();
      if (typeof showToast === 'function') showToast(`Target set to ${type === 'govt' ? 'Government Jobs' : 'Non-Government / Private'}`);
    });
  });

  // Checkbox toggle active / inactive in curriculum
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

  // Quick Add Custom Subject in Curriculum tab
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

