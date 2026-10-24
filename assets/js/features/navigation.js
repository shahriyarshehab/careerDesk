/* CareerDesk — tab navigation and route activation */

function normalizeTabName(tabName) {
  if (!tabName) return 'home';
  if (tabName === 'dashboard') return 'home';
  if (tabName === 'routine' || tabName === 'rutine') return 'routine';
  if (tabName === 'flashcards' || tabName === 'quiz' || tabName === 'mcq') return 'quiz';
  if (tabName === 'exams') return 'countdown';
  if (tabName === 'auth' || tabName === 'login' || tabName === 'signup' || tabName === 'register') return 'profile';
  return tabName;
}

function switchSubjectsWorkspaceTab(viewName, persist = true) {
  const activeView = viewName === 'curriculum' ? 'curriculum' : 'manager';
  document.querySelectorAll('#subjectsWorkspaceNav [data-subjects-view]').forEach(button => {
    const isActive = button.dataset.subjectsView === activeView;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  const managerView = document.getElementById('subjectsManagerView');
  const curriculumView = document.getElementById('subjectsCurriculumView');
  [[managerView, 'manager'], [curriculumView, 'curriculum']].forEach(([view, key]) => {
    if (!view) return;
    const isActive = key === activeView;
    view.hidden = !isActive;
    view.classList.toggle('active', isActive);
  });

  if (persist) {
    try {
      localStorage.setItem('careerdesk_subjects_workspace_view', activeView);
    } catch (error) {
      console.warn('[CareerDesk] Could not save subject workspace view:', error);
    }
  }

  if (activeView === 'curriculum') {
    if (typeof renderProfileTrackCard === 'function') renderProfileTrackCard();
  } else if (typeof renderSubjectManager === 'function') {
    renderSubjectManager();
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

document.addEventListener('click', event => {
  const tab = event.target.closest('#subjectsWorkspaceNav [data-subjects-view]');
  if (tab) switchSubjectsWorkspaceTab(tab.dataset.subjectsView);
});

function activateTab(rawTabName, persist = false) {
  const tabName = normalizeTabName(rawTabName);
  const targetPanel = document.getElementById('panel-' + tabName) ||
    (tabName === 'quiz' ? document.getElementById('panel-flashcards') : null);
  if (!targetPanel) return;

  document.querySelectorAll('.tab-btn').forEach(button => {
    const isActive = normalizeTabName(button.dataset.tab) === tabName;
    button.classList.toggle('active', isActive);
    if (button.getAttribute('role') === 'tab') {
      button.setAttribute('aria-selected', String(isActive));
    } else if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('active', panel === targetPanel);
  });
  document.body.classList.toggle('tab-groupchat-active', tabName === 'groupchat');
  document.dispatchEvent(new CustomEvent('careerdesk:tabchange', { detail: tabName }));

  if (rawTabName !== 'routine' && rawTabName !== 'rutine') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  if (persist) {
    try { localStorage.setItem(ACTIVE_TAB_KEY, tabName); } catch (error) { }
    try {
      if (window.location.hash !== '#' + tabName) history.replaceState(null, '', '#' + tabName);
    } catch (error) { }
  }

  if (tabName === 'home') {
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof initProfileQuoteTypewriter === 'function') initProfileQuoteTypewriter();
  }

  if (tabName === 'routine' && typeof renderHomeDashboard === 'function') {
    renderHomeDashboard();
  }

  if (tabName === 'profile') {
    try { if (typeof renderUserProfileUI === 'function') renderUserProfileUI(); } catch (error) { console.error('[CareerDesk] renderUserProfileUI error:', error); }
    try { if (typeof initProfileCockpit === 'function') initProfileCockpit(); } catch (error) { console.error('[CareerDesk] initProfileCockpit error:', error); }
    try { if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub(); } catch (error) { console.error('[CareerDesk] renderProfileAspirantHub error:', error); }
    try { if (typeof renderSecurityVaultUI === 'function') renderSecurityVaultUI(); } catch (error) { console.error('[CareerDesk] renderSecurityVaultUI error:', error); }
    try { renderQuoteManager(); } catch (error) { console.error('[CareerDesk] renderQuoteManager error:', error); }
    if ((rawTabName === 'login' || rawTabName === 'signup') && typeof openAuthModal === 'function') {
      openAuthModal(rawTabName === 'signup' ? 'signup' : 'login');
    }
  }

  if (tabName === 'settings') {
    try { if (typeof initSettingsCockpit === 'function') initSettingsCockpit(); } catch (error) { console.error('[CareerDesk] initSettingsCockpit error:', error); }
    try { if (typeof renderQuoteManager === 'function') renderQuoteManager(); } catch (error) { console.error('[CareerDesk] renderQuoteManager error:', error); }
  }

  if (tabName === 'subjects') {
    let savedView = 'manager';
    try {
      savedView = localStorage.getItem('careerdesk_subjects_workspace_view') || savedView;
    } catch (error) {
      console.warn('[CareerDesk] Could not read subject workspace view:', error);
    }
    switchSubjectsWorkspaceTab(savedView, false);
  }

  if (tabName === 'tracker') renderTrackerAll();

  if (tabName === 'groupchat' && typeof initGroupChat === 'function') {
    initGroupChat();
  } else if (tabName !== 'groupchat' && typeof destroyGroupChatListeners === 'function') {
    destroyGroupChatListeners();
  }

  if (tabName === 'quiz') {
    if (typeof loadQuestionBankForQuiz === 'function') {
      loadQuestionBankForQuiz().catch(error => {
        console.error('[CareerDesk] Could not load quiz question bank:', error);
        if (typeof showToast === 'function') {
          showToast('Quiz questions could not be loaded. Please check your connection and retry.', true);
        }
      });
    } else {
      if (typeof renderMCQFilterBar === 'function') renderMCQFilterBar();
      if (typeof renderMCQQuestion === 'function') renderMCQQuestion();
      if (typeof updateMCQStatsBar === 'function') updateMCQStatsBar();
    }
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => activateTab(button.dataset.tab, true));
});

const mobileMoreTrigger = document.getElementById('mobileMoreTrigger');
const mobileMoreMenu = document.getElementById('mobileMoreMenu');
const mobilePrimaryTabs = new Set(['home', 'routine', 'tracker', 'quiz', 'syllabus']);

function setMobileMoreMenuOpen(isOpen, restoreFocus = false) {
  if (!mobileMoreTrigger || !mobileMoreMenu) return;
  mobileMoreMenu.hidden = !isOpen;
  mobileMoreTrigger.setAttribute('aria-expanded', String(isOpen));
  if (restoreFocus) mobileMoreTrigger.focus();
}

if (mobileMoreTrigger && mobileMoreMenu) {
  mobileMoreTrigger.addEventListener('click', () => {
    setMobileMoreMenuOpen(mobileMoreMenu.hidden);
  });

  document.addEventListener('click', event => {
    if (!mobileMoreMenu.hidden &&
      !mobileMoreMenu.contains(event.target) &&
      !mobileMoreTrigger.contains(event.target)) {
      setMobileMoreMenuOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMoreMenu.hidden) {
      setMobileMoreMenuOpen(false, true);
    }
  });

  document.addEventListener('careerdesk:tabchange', event => {
    const isSecondaryTab = !mobilePrimaryTabs.has(event.detail);
    mobileMoreTrigger.classList.toggle('active', isSecondaryTab);
    if (isSecondaryTab) mobileMoreTrigger.setAttribute('aria-current', 'page');
    else mobileMoreTrigger.removeAttribute('aria-current');
    setMobileMoreMenuOpen(false);
  });
}

try {
  const hashTab = window.location.hash ? window.location.hash.replace('#', '') : null;
  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  const initialTab = normalizeTabName(hashTab || savedTab || 'home');
  if (initialTab) activateTab(initialTab, false);
} catch (error) { }

window.addEventListener('hashchange', () => {
  const rawTab = window.location.hash ? window.location.hash.replace('#', '') : 'home';
  activateTab(normalizeTabName(rawTab), false);
});
