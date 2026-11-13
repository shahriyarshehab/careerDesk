/* ==========================================================================
   CareerDesk — Topbar Profile Controller & Desk Hub System
   Manages user identity avatars, topbar quick-account popovers, and desk statistics.
   ========================================================================== */

function deskSafeState() {
  return (typeof state !== 'undefined' && state) ? state : null;
}

function deskFocusMinutesToday() {
  const appState = deskSafeState();
  if (!appState) return 0;
  const key = typeof todayKey === 'function' ? todayKey() : dateKey(Date.now());
  let total = 0;
  (appState.sessions || []).forEach(session => {
    if (!session) return;
    const start = Number(session.start);
    if (!Number.isFinite(start) || dateKey(start) !== key) return;
    total += Number(session.duration) || 0;
  });
  const active = appState.activeSession;
  if (active && Number.isFinite(Number(active.start)) && dateKey(Number(active.start)) === key) {
    total += Math.max(0, (Date.now() - Number(active.start)) / 60000);
  }
  return total;
}

function deskSessionCountToday() {
  const appState = deskSafeState();
  if (!appState) return 0;
  const key = typeof todayKey === 'function' ? todayKey() : dateKey(Date.now());
  const logged = (appState.sessions || []).filter(session => session && dateKey(Number(session.start)) === key).length;
  const live = (appState.activeSession && dateKey(Number(appState.activeSession.start)) === key) ? 1 : 0;
  return logged + live;
}

function deskGoalMinutes() {
  const routineGoal = typeof getRoutineGoalMinutes === 'function' ? getRoutineGoalMinutes(todayKey ? todayKey() : dateKey(Date.now())) : 0;
  if (routineGoal > 0) return routineGoal;
  const appState = deskSafeState();
  const target = appState ? Number(appState.dailyTargetMinutes) : 240;
  return Number.isFinite(target) && target > 0 ? target : 240;
}

function fmtHM(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

function deskPhase() {
  const h = new Date().getHours();
  if (h >= 21 || h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  return 'dusk';
}

function applyDeskPhase() {
  // Safe no-op retained for backwards compatibility
}

window.deskPhase = deskPhase;
window.applyDeskPhase = applyDeskPhase;
window.deskFocusMinutesToday = deskFocusMinutesToday;
window.deskSessionCountToday = deskSessionCountToday;
window.deskGoalMinutes = deskGoalMinutes;
window.fmtHM = fmtHM;

/* --------------------------------------------------------------------------
   Topbar Profile Avatar Sync
   -------------------------------------------------------------------------- */
function syncTopbarProfileAvatar(name, photo) {
  const topbarBtn = document.getElementById('topbarProfileBtn');
  if (!topbarBtn) return;
  const topbarImg = document.getElementById('topbarAvatarImg');
  const topbarInitial = document.getElementById('topbarAvatarInitial');
  const topbarLogin = document.getElementById('topbarAvatarLogin');

  let user = null;
  let custom = null;
  try { user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null; } catch (e) { }
  try { custom = typeof getCustomProfile === 'function' ? getCustomProfile() : null; } catch (e) { }

  const isAuthed = !!user;

  if (!isAuthed) {
    topbarBtn.classList.add('is-login-mode');
    topbarBtn.title = 'Log in to sync workspace';
    topbarBtn.setAttribute('aria-label', 'Log in to sync workspace');

    if (topbarImg) {
      topbarImg.hidden = true;
      topbarImg.removeAttribute('src');
    }
    if (topbarInitial) topbarInitial.hidden = true;
    if (topbarLogin) topbarLogin.hidden = false;

    closeTopbarDeskPopover();
    return;
  }

  topbarBtn.classList.remove('is-login-mode');
  if (topbarLogin) topbarLogin.hidden = true;

  const resolvedName = (name !== undefined) ? name : (
    (user && user.displayName)
    || (custom && (custom.displayName || custom.username))
    || 'CareerDesk Aspirant'
  );
  const resolvedPhoto = (photo !== undefined) ? photo : (
    (user && user.photoURL) || (custom && custom.photoURL) || ''
  );

  topbarBtn.title = resolvedName;
  topbarBtn.setAttribute('aria-label', 'Account: ' + resolvedName);

  if (resolvedPhoto) {
    if (topbarImg) {
      if (topbarImg.getAttribute('src') !== resolvedPhoto) topbarImg.src = resolvedPhoto;
      topbarImg.hidden = false;
      topbarImg.onerror = () => {
        topbarImg.hidden = true;
        if (topbarInitial) {
          topbarInitial.hidden = false;
          topbarInitial.textContent = (String(resolvedName).trim().charAt(0) || 'A').toUpperCase();
        }
      };
    }
    if (topbarInitial) topbarInitial.hidden = true;
  } else {
    if (topbarImg) {
      topbarImg.hidden = true;
      topbarImg.removeAttribute('src');
    }
    const char = (String(resolvedName).trim().charAt(0) || 'A').toUpperCase();
    if (topbarInitial) {
      topbarInitial.hidden = false;
      topbarInitial.textContent = char;
    }
  }

  renderTopbarDeskPopover();
}
window.syncTopbarProfileAvatar = syncTopbarProfileAvatar;

/* --------------------------------------------------------------------------
   Topbar Popover Panel Controllers
   -------------------------------------------------------------------------- */
function renderTopbarDeskPopover() {
  const popover = document.getElementById('topbarDeskPopover');
  if (!popover) return;

  let user = null;
  let custom = null;
  try { user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null; } catch (e) { }
  try { custom = typeof getCustomProfile === 'function' ? getCustomProfile() : null; } catch (e) { }

  const name = (user && user.displayName)
    || (custom && (custom.displayName || custom.username))
    || 'CareerDesk Aspirant';
  const photo = (user && user.photoURL) || (custom && custom.photoURL) || '';
  const email = (user && user.email) || (user && user.phoneNumber) || 'Signed in';

  const nameEl = document.getElementById('topbarPopoverName');
  const emailEl = document.getElementById('topbarPopoverEmail');
  const avatarEl = document.getElementById('topbarPopoverAvatar');
  const focusEl = document.getElementById('topbarPopoverFocus');
  const sessionsEl = document.getElementById('topbarPopoverSessions');
  const goalEl = document.getElementById('topbarPopoverGoal');

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;

  if (avatarEl) {
    const initial = (String(name).trim().charAt(0) || 'A').toUpperCase();
    avatarEl.textContent = photo ? '' : initial;
    avatarEl.style.backgroundImage = photo ? `url("${String(photo).replace(/"/g, '%22')}")` : 'none';
  }

  if (focusEl) focusEl.textContent = fmtHM(deskFocusMinutesToday());
  if (sessionsEl) sessionsEl.textContent = String(deskSessionCountToday());
  if (goalEl) goalEl.textContent = fmtHM(deskGoalMinutes());
}
window.renderTopbarDeskPopover = renderTopbarDeskPopover;

function isTopbarDeskPopoverOpen() {
  const popover = document.getElementById('topbarDeskPopover');
  return !!popover && !popover.hidden;
}
window.isTopbarDeskPopoverOpen = isTopbarDeskPopoverOpen;

function openTopbarDeskPopover() {
  const popover = document.getElementById('topbarDeskPopover');
  const btn = document.getElementById('topbarProfileBtn');
  if (!popover) return;
  renderTopbarDeskPopover();
  popover.hidden = false;
  if (btn) btn.setAttribute('aria-expanded', 'true');
}
window.openTopbarDeskPopover = openTopbarDeskPopover;

function closeTopbarDeskPopover() {
  const popover = document.getElementById('topbarDeskPopover');
  const btn = document.getElementById('topbarProfileBtn');
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
window.closeTopbarDeskPopover = closeTopbarDeskPopover;

function toggleTopbarDeskPopover() {
  if (isTopbarDeskPopoverOpen()) {
    closeTopbarDeskPopover();
  } else {
    openTopbarDeskPopover();
  }
}
window.toggleTopbarDeskPopover = toggleTopbarDeskPopover;

function initTopbarProfileControl() {
  const btn = document.getElementById('topbarProfileBtn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = 'true';

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    let user = null;
    try { user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null; } catch (e) { }

    if (!user) {
      if (typeof openAuthModal === 'function') {
        openAuthModal('login');
      }
      return;
    }

    toggleTopbarDeskPopover();
  });

  const deskBtn = document.getElementById('topbarPopoverDeskBtn');
  if (deskBtn) {
    deskBtn.addEventListener('click', () => {
      closeTopbarDeskPopover();
      if (typeof activateTab === 'function') activateTab('desk', true);
    });
  }

  const settingsBtn = document.getElementById('topbarPopoverSettingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      closeTopbarDeskPopover();
      if (typeof activateTab === 'function') activateTab('settings', true);
    });
  }

  const signOutBtn = document.getElementById('topbarPopoverSignOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      const confirmed = window.confirm("Log out and clear this browser's study data? Your cloud backup stays safe.");
      if (!confirmed) return;
      closeTopbarDeskPopover();
      if (typeof signOutUser === 'function') {
        await signOutUser();
      }
      syncTopbarProfileAvatar();
    });
  }

  window.addEventListener('careerdesk-auth-state-changed', () => {
    syncTopbarProfileAvatar();
  });

  document.addEventListener('click', (event) => {
    if (!isTopbarDeskPopoverOpen()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target && (target.closest('#topbarDeskPopover') || target.closest('#topbarProfileBtn'))) return;
    closeTopbarDeskPopover();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isTopbarDeskPopoverOpen()) {
      closeTopbarDeskPopover();
    }
  });

  syncTopbarProfileAvatar();
}
window.initTopbarProfileControl = initTopbarProfileControl;

/* --------------------------------------------------------------------------
   Desk Hub Render Hook
   -------------------------------------------------------------------------- */
function renderDeskAvatar() {
  syncTopbarProfileAvatar();
}
window.renderDeskAvatar = renderDeskAvatar;

function renderDeskHero() {
  renderDeskAvatar();
  if (typeof renderProfileAspirantHub === 'function') {
    renderProfileAspirantHub();
  }
}
window.renderDeskHero = renderDeskHero;

function initDeskHero() {
  renderDeskHero();
}
window.initDeskHero = initDeskHero;

function isDeskMode() { return false; }
function enterDeskMode() {}
function exitDeskMode() {}
window.isDeskMode = isDeskMode;
window.enterDeskMode = enterDeskMode;
window.exitDeskMode = exitDeskMode;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTopbarProfileControl === 'function') initTopbarProfileControl();
    if (typeof syncTopbarProfileAvatar === 'function') syncTopbarProfileAvatar();
    setTimeout(initDeskHero, 120);
  });
} else {
  if (typeof initTopbarProfileControl === 'function') initTopbarProfileControl();
  if (typeof syncTopbarProfileAvatar === 'function') syncTopbarProfileAvatar();
  setTimeout(initDeskHero, 120);
}
