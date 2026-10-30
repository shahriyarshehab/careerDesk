/* CareerDesk — tab navigation and route activation */

function normalizeTabName(tabName) {
  if (!tabName) return 'home';
  if (tabName === 'dashboard') return 'home';
  // The Desk is the former profile panel; '#desk' is its public route.
  if (tabName === 'desk') return 'profile';
  if (tabName === 'routine' || tabName === 'rutine') return 'routine';
  if (tabName === 'flashcards' || tabName === 'quiz' || tabName === 'mcq') return 'quiz';
  if (tabName === 'exams') return 'countdown';
  // Subject manager now lives inside Settings.
  if (tabName === 'subjects') return 'settings';
  if (tabName === 'auth' || tabName === 'login' || tabName === 'signup' || tabName === 'register') return 'profile';
  return tabName;
}

/* The subjects page has a single workspace now that the curriculum track tab is
   gone; the function is kept so existing callers still land on the manager. */
function switchSubjectsWorkspaceTab(_viewName, persist = true) {
  const managerView = document.getElementById('subjectsManagerView');
  if (managerView) {
    managerView.hidden = false;
    managerView.classList.add('active');
  }

  if (persist) {
    try {
      localStorage.removeItem('careerdesk_subjects_workspace_view');
    } catch (error) { }
  }

  if (typeof renderSubjectManager === 'function') renderSubjectManager();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/* The bubble only animates real switches, not the tab restored on page load. */
let navTabBubblesEnabled = false;

function activateTab(rawTabName, persist = false) {
  const tabName = normalizeTabName(rawTabName);
  const targetPanel = document.getElementById('panel-' + tabName) ||
    (tabName === 'quiz' ? document.getElementById('panel-flashcards') : null);
  if (!targetPanel) return;

  /* Only containers whose tabs are direct siblings (sidebar rail, dock, More menu)
     get a travelling bubble; nested wrappers such as <header> are skipped. */
  const navSwitchGroups = new Map();
  document.querySelectorAll('.tab-btn').forEach(button => {
    const parent = button.parentElement;
    if (!parent || navSwitchGroups.has(parent)) return;
    const directTabs = parent.querySelectorAll(':scope > .tab-btn');
    if (directTabs.length > 1 && directTabs.length === parent.querySelectorAll('.tab-btn').length) {
      navSwitchGroups.set(parent, parent.querySelector('.tab-btn.active'));
    }
  });
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
  if (navTabBubblesEnabled && typeof slideNavTabBubble === 'function') {
    navSwitchGroups.forEach((previous, parent) => {
      slideNavTabBubble(previous, parent.querySelector('.tab-btn.active'));
    });
  }
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
      const hashName = tabName === 'profile' ? 'desk' : tabName;
      if (window.location.hash !== '#' + hashName) history.replaceState(null, '', '#' + hashName);
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
    try { if (typeof renderDeskHero === 'function') renderDeskHero(); } catch (error) { }
    try { if (typeof renderDeskAvatar === 'function') renderDeskAvatar(); } catch (error) { }
    try { if (typeof syncTopbarProfileAvatar === 'function') syncTopbarProfileAvatar(); } catch (error) { }
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
    try { if (typeof renderQuoteManager === 'function') renderQuoteManager(); } catch (error) { console.error('[CareerDesk] renderQuoteManager error:', error); }
    try { if (typeof renderSubjectManager === 'function') renderSubjectManager(); } catch (error) { console.error('[CareerDesk] renderSubjectManager error:', error); }
    if (rawTabName === 'subjects' || window.location.hash === '#subjects') {
      setTimeout(() => document.getElementById('profileSubjectsCockpitCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 140);
    }
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
  // Land on the Desk's public route even for old '#profile' links.
  if (initialTab === 'profile' && hashTab && hashTab !== 'desk') {
    history.replaceState(null, '', '#desk');
  }
} catch (error) { }
navTabBubblesEnabled = true;

window.addEventListener('hashchange', () => {
  const rawTab = window.location.hash ? window.location.hash.replace('#', '') : 'home';
  activateTab(normalizeTabName(rawTab), false);
  if (normalizeTabName(rawTab) === 'profile' && rawTab !== 'desk') {
    history.replaceState(null, '', '#desk');
  }
});
