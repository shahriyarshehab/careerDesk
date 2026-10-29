/* ==========================================================================
   CareerDesk — Desk hero: reading-room backdrop, live focus ring, mini calendar
   The ring reads today's focus minutes against the routine goal and pulses while
   a tracker session is running; the calendar shows the current month with today
   highlighted. Both are shortcuts into the Tracker and Routine panels.
   ========================================================================== */

let deskHeroTickTimer = null;
let deskHeroCalendarKey = '';

function deskSafeState() {
  return (typeof state !== 'undefined' && state) ? state : null;
}

function deskFocusMinutesToday() {
  const appState = deskSafeState();
  if (!appState) return 0;
  const key = todayKey();
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
  const key = todayKey();
  const logged = (appState.sessions || []).filter(session => session && dateKey(Number(session.start)) === key).length;
  const live = (appState.activeSession && dateKey(Number(appState.activeSession.start)) === key) ? 1 : 0;
  return logged + live;
}

function deskGoalMinutes() {
  const routineGoal = typeof getRoutineGoalMinutes === 'function' ? getRoutineGoalMinutes(todayKey()) : 0;
  if (routineGoal > 0) return routineGoal;
  const appState = deskSafeState();
  const target = appState ? Number(appState.dailyTargetMinutes) : 240;
  return Number.isFinite(target) && target > 0 ? target : 240;
}

/* --------------------------------------------------------------------------
   Time of day
   The room is lit by the hour: moonlight at night, rose at dawn, daylight
   through the working day and amber at dusk. The phase is stamped on the hero
   as data-phase and CSS re-points the room palette from it.
   -------------------------------------------------------------------------- */
const DESK_PHASES = ['night', 'dawn', 'day', 'dusk'];
let deskPhaseApplied = '';

function deskPhaseForHour(hour) {
  const h = Number(hour);
  if (!Number.isFinite(h)) return 'night';
  if (h >= 21 || h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  return 'dusk';
}

function deskPhase() {
  return deskPhaseForHour(new Date().getHours());
}

function applyDeskPhase() {
  const hero = document.getElementById('deskHero');
  if (!hero) return;
  const phase = deskPhase();
  if (deskPhaseApplied === phase && hero.getAttribute('data-phase') === phase) return;
  deskPhaseApplied = phase;
  hero.setAttribute('data-phase', phase);
}
window.deskPhase = deskPhase;
window.applyDeskPhase = applyDeskPhase;

/* The room shows a plain digital time; there is no dial to keep in sync. */
function renderDeskClock() {
  const timeEl = document.getElementById('deskClockTime');
  const dateEl = document.getElementById('deskClockDate');
  if (!timeEl) return;

  const now = new Date();
  timeEl.textContent = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);
  timeEl.dateTime = now.toISOString();
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).format(now);
  }
}
window.renderDeskClock = renderDeskClock;

function deskGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/* --------------------------------------------------------------------------
   Running subject
   The middle of the room follows the routine: a live tracker session wins,
   then the block covering the current minute, then the next block today.
   -------------------------------------------------------------------------- */
function deskTimeToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function deskRunningBlock() {
  const appState = deskSafeState();
  if (!appState) return null;

  const active = appState.activeSession;
  if (active && active.subject && Number.isFinite(Number(active.start))) {
    return {
      status: 'tracker',
      subject: String(active.subject),
      task: '',
      startTime: '',
      endTime: '',
      startedAt: Number(active.start)
    };
  }

  const key = todayKey();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const blocks = (appState.routine || [])
    .filter(row => row && row.date === key)
    .map(row => ({ row, start: deskTimeToMinutes(row.startTime), end: deskTimeToMinutes(row.endTime) }))
    .filter(block => block.start !== null && block.end !== null)
    .sort((a, b) => a.start - b.start);

  const running = blocks.find(block => {
    const end = block.end <= block.start ? block.end + 1440 : block.end;
    const nowPoint = block.end <= block.start && nowMinutes < block.start ? nowMinutes + 1440 : nowMinutes;
    return nowPoint >= block.start && nowPoint < end;
  });
  if (running) {
    return {
      status: 'now',
      subject: String(running.row.subject || '').trim(),
      task: String(running.row.task || '').trim(),
      startTime: running.row.startTime,
      endTime: running.row.endTime
    };
  }

  const next = blocks.find(block => block.start > nowMinutes);
  if (next) {
    return {
      status: 'next',
      subject: String(next.row.subject || '').trim(),
      task: String(next.row.task || '').trim(),
      startTime: next.row.startTime,
      endTime: next.row.endTime
    };
  }

  return null;
}

function deskStatusTime(block) {
  if (!block) return '';
  if (block.status === 'tracker') {
    const since = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      .format(new Date(block.startedAt));
    return 'Focus since ' + since;
  }
  const start = typeof formatTime12 === 'function' ? formatTime12(block.startTime) : block.startTime;
  const end = typeof formatTime12 === 'function' ? formatTime12(block.endTime) : block.endTime;
  if (block.status === 'next') return 'Starts at ' + start;
  return start + ' – ' + end;
}

function renderDeskSubject() {
  const eyebrowEl = document.getElementById('deskHeroGreeting');
  const titleEl = document.getElementById('deskRunningSubject');
  const subEl = document.getElementById('deskRunningTask');
  const metaEl = document.getElementById('deskRunningMeta');
  if (!titleEl || !subEl) return;

  const name = deskDisplayName();
  const greeting = deskGreeting();
  const block = deskRunningBlock();

  if (eyebrowEl) {
    eyebrowEl.textContent = name ? `${greeting}, ${name}` : greeting;
  }

  if (block && block.subject) {
    titleEl.textContent = block.subject;
    subEl.textContent = block.task || (block.status === 'tracker' ? 'Focus session' : 'Routine block');
    if (metaEl) metaEl.textContent = deskStatusTime(block);
    return;
  }

  titleEl.textContent = 'No block running';
  subEl.textContent = 'Your routine is clear for now.';
  if (metaEl) metaEl.textContent = 'Add a routine block or start a focus session.';
}
window.deskRunningBlock = deskRunningBlock;

function deskDisplayName() {
  try {
    const custom = typeof getCustomProfile === 'function' ? getCustomProfile() : null;
    const name = custom && (custom.displayName || custom.username);
    if (name && String(name).trim()) return String(name).trim().split(' ')[0];
  } catch (error) { }
  return '';
}

/* Swift, cheap path used by the one-second tick: only the ring and the chips. */
function tickDeskRing() {
  const ringValue = document.getElementById('deskRingValue');
  const pctEl = document.getElementById('deskRingPct');
  const captionEl = document.getElementById('deskRingCaption');
  const hero = document.getElementById('deskHero');
  if (!ringValue || !pctEl || !hero) return;

  const appState = deskSafeState();
  const minutes = deskFocusMinutesToday();
  const goal = deskGoalMinutes();
  const pct = goal > 0 ? Math.max(0, Math.min(100, Math.round((minutes / goal) * 100))) : 0;
  const running = !!(appState && appState.activeSession);

  applyDeskPhase();
  hero.classList.toggle('is-active', running);
  ringValue.style.width = pct + '%';
  ringValue.style.opacity = minutes > 0 ? '1' : '0.4';
  pctEl.textContent = pct + '%';

  if (captionEl) {
    if (running) {
      const elapsed = Math.max(0, Date.now() - Number(appState.activeSession.start));
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      captionEl.textContent = `Focus ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else if (minutes >= 1) {
      captionEl.textContent = fmtHM(minutes) + ' focused';
    } else {
      captionEl.textContent = 'Focus idle';
    }
  }

  renderDeskClock();
  renderDeskSubject();

  const chips = document.getElementById('deskHeroChips');
  if (chips) {
    const block = deskRunningBlock();
    const status = block
      ? (block.status === 'tracker' ? { icon: 'radio', text: 'Tracker active', live: true }
        : block.status === 'now' ? { icon: 'play-circle', text: 'Running now', live: true }
          : { icon: 'calendar-clock', text: 'Up next', live: false })
      : { icon: 'moon', text: 'Nothing scheduled', live: false };
    const chipList = [
      { icon: status.icon, text: status.text, tone: status.live ? 'live' : '' },
      { icon: 'clock', text: `${fmtHM(minutes)} / ${fmtHM(goal)}` },
      { icon: 'timer', text: `${deskSessionCountToday()} session${deskSessionCountToday() === 1 ? '' : 's'}` }
    ];
    chips.innerHTML = chipList.map(chip => `
      <span class="desk-chip${chip.tone ? ' desk-chip--' + chip.tone : ''}">
        <i data-lucide="${chip.icon}" aria-hidden="true"></i>${escapeHtml(chip.text)}
      </span>
    `).join('');
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }
}

function renderDeskCalendar() {
  const grid = document.getElementById('deskCalGrid');
  const monthEl = document.getElementById('deskCalMonth');
  const todayEl = document.getElementById('deskCalToday');
  if (!grid) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthKey = year + '-' + month;
  if (monthKey === deskHeroCalendarKey && grid.childElementCount) return;
  deskHeroCalendarKey = monthKey;

  if (monthEl) {
    monthEl.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(now);
  }
  if (todayEl) todayEl.textContent = String(today).padStart(2, '0');

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    .map(label => `<span class="desk-cal-dow" aria-hidden="true">${label}</span>`);

  for (let blank = 0; blank < firstWeekday; blank++) {
    cells.push('<span class="desk-cal-cell is-empty" aria-hidden="true"></span>');
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today;
    cells.push(`<span class="desk-cal-cell${isToday ? ' is-today' : ''}"${isToday ? ' aria-current="date"' : ''}>${day}</span>`);
  }
  grid.innerHTML = cells.join('');
}

function syncTopbarProfileAvatar(name, photo) {
  const topbarBtn = document.getElementById('topbarProfileBtn');
  if (!topbarBtn) return;
  const topbarImg = document.getElementById('topbarAvatarImg');
  const topbarInitial = document.getElementById('topbarAvatarInitial');
  const topbarFallback = document.getElementById('topbarAvatarFallback');

  let resolvedName = name;
  let resolvedPhoto = photo;
  if (resolvedName === undefined || resolvedPhoto === undefined) {
    let user = null;
    let custom = null;
    try { user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null; } catch (e) { }
    try { custom = typeof getCustomProfile === 'function' ? getCustomProfile() : null; } catch (e) { }
    resolvedName = (user && user.displayName)
      || (custom && (custom.displayName || custom.username))
      || 'Guest Aspirant';
    resolvedPhoto = (user && user.photoURL) || (custom && custom.photoURL) || '';
  }

  const label = (resolvedName && resolvedName !== 'Guest Aspirant') ? resolvedName : 'Profile & Desk';
  topbarBtn.title = label;
  topbarBtn.setAttribute('aria-label', 'Open Profile: ' + label);

  if (resolvedPhoto) {
    if (topbarImg) {
      if (topbarImg.getAttribute('src') !== resolvedPhoto) topbarImg.src = resolvedPhoto;
      topbarImg.hidden = false;
      topbarImg.onerror = () => {
        topbarImg.hidden = true;
        if (topbarInitial) topbarInitial.hidden = false;
        if (topbarFallback) topbarFallback.hidden = true;
      };
    }
    if (topbarInitial) topbarInitial.hidden = true;
    if (topbarFallback) topbarFallback.hidden = true;
  } else if (resolvedName && resolvedName !== 'Guest Aspirant') {
    if (topbarImg) {
      topbarImg.hidden = true;
      topbarImg.removeAttribute('src');
    }
    const char = (String(resolvedName).trim().charAt(0) || 'A').toUpperCase();
    if (topbarInitial) {
      topbarInitial.hidden = false;
      topbarInitial.textContent = char;
    }
    if (topbarFallback) topbarFallback.hidden = true;
  } else {
    if (topbarImg) {
      topbarImg.hidden = true;
      topbarImg.removeAttribute('src');
    }
    if (topbarInitial) topbarInitial.hidden = true;
    if (topbarFallback) topbarFallback.hidden = false;
  }
}
window.syncTopbarProfileAvatar = syncTopbarProfileAvatar;

/* The avatar is the only remnant of the retired profile card: it shows the
   signed-in photo (or the initial) inside the room and opens the account modal. */
function renderDeskAvatar() {
  let user = null;
  let custom = null;
  try { user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null; } catch (error) { }
  try { custom = typeof getCustomProfile === 'function' ? getCustomProfile() : null; } catch (error) { }

  const name = (user && user.displayName)
    || (custom && (custom.displayName || custom.username))
    || 'Guest Aspirant';
  const photo = (user && user.photoURL) || (custom && custom.photoURL) || '';

  syncTopbarProfileAvatar(name, photo);

  const btn = document.getElementById('deskAvatarBtn');
  const img = document.getElementById('deskAvatarImg');
  const initial = document.getElementById('deskAvatarInitial');
  const nameEl = document.getElementById('deskProfileName');
  if (!btn || !img || !initial) return;

  if (photo) {
    if (img.getAttribute('src') !== photo) img.src = photo;
    img.hidden = false;
    img.onerror = () => { img.hidden = true; initial.hidden = false; };
    initial.hidden = true;
  } else {
    img.hidden = true;
    img.removeAttribute('src');
    initial.hidden = false;
    initial.textContent = (String(name).trim().charAt(0) || 'A').toUpperCase();
  }

  if (nameEl) nameEl.textContent = name;
  btn.title = name;
  btn.setAttribute('aria-label', 'Account: ' + name);

  const popName = document.getElementById('deskPopoverName');
  const popEmail = document.getElementById('deskPopoverEmail');
  const popAvatar = document.getElementById('deskPopoverAvatar');
  if (popName) popName.textContent = name;
  if (popEmail) popEmail.textContent = (user && user.email) || 'Local workspace — not signed in';
  if (popAvatar) {
    const initial = (String(name).trim().charAt(0) || 'A').toUpperCase();
    popAvatar.textContent = photo ? '' : initial;
    popAvatar.style.backgroundImage = photo ? `url("${String(photo).replace(/"/g, '%22')}")` : 'none';
  }
}
window.renderDeskAvatar = renderDeskAvatar;

/* --------------------------------------------------------------------------
   Profile popover
   The small portrait in the bottom-right corner opens a compact identity card
   with today's numbers and the account actions, instead of another full modal.
   -------------------------------------------------------------------------- */
function renderDeskProfilePopover() {
  renderDeskAvatar();

  const focusEl = document.getElementById('deskPopoverFocus');
  const sessionsEl = document.getElementById('deskPopoverSessions');
  const goalEl = document.getElementById('deskPopoverGoal');
  const accountBtn = document.getElementById('deskPopoverAccountBtn');
  const signOutBtn = document.getElementById('deskPopoverSignOutBtn');
  const user = (typeof getCachedAuthUser === 'function') ? getCachedAuthUser() : null;

  if (focusEl) focusEl.textContent = fmtHM(deskFocusMinutesToday());
  if (sessionsEl) sessionsEl.textContent = String(deskSessionCountToday());
  if (goalEl) goalEl.textContent = fmtHM(deskGoalMinutes());

  if (accountBtn) accountBtn.hidden = !!user;
  if (signOutBtn) signOutBtn.hidden = !user;
}

function isDeskProfilePopoverOpen() {
  const popover = document.getElementById('deskProfilePopover');
  return !!popover && !popover.hidden;
}

function openDeskProfilePopover() {
  const popover = document.getElementById('deskProfilePopover');
  const btn = document.getElementById('deskAvatarBtn');
  if (!popover) return;
  renderDeskProfilePopover();
  popover.hidden = false;
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeDeskProfilePopover() {
  const popover = document.getElementById('deskProfilePopover');
  const btn = document.getElementById('deskAvatarBtn');
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
window.openDeskProfilePopover = openDeskProfilePopover;
window.closeDeskProfilePopover = closeDeskProfilePopover;

function renderDeskHero() {
  const hero = document.getElementById('deskHero');
  if (!hero) return;

  renderDeskAvatar();
  applyDeskPhase();
  renderDeskClock();
  syncDeskFullscreenBtn();

  renderDeskSubject();
  renderDeskCalendar();
  tickDeskRing();
}

/* ==========================================================================
   Desk mode
   Clicking Desk turns the reading room into the whole screen: the old profile
   cards step aside and the left rail collapses. Browser fullscreen is not part
   of the switch — the room's Full screen button owns that. Any other tab or
   Esc brings the app chrome back.
   ========================================================================== */
let deskModeActive = false;

function isDeskMode() {
  return deskModeActive;
}

function enterDeskMode() {
  if (deskModeActive) return;
  deskModeActive = true;
  document.body.classList.add('desk-mode');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  renderDeskHero();
}

function exitDeskMode() {
  if (!deskModeActive) return;
  deskModeActive = false;
  document.body.classList.remove('desk-mode');
  closeDeskProfilePopover();
  if (document.fullscreenElement && document.exitFullscreen) {
    const exit = document.exitFullscreen();
    if (exit && typeof exit.catch === 'function') exit.catch(() => { });
  }
}

function setDeskMode(enabled) {
  if (enabled) enterDeskMode();
  else exitDeskMode();
}
window.enterDeskMode = enterDeskMode;
window.exitDeskMode = exitDeskMode;
window.isDeskMode = isDeskMode;

/* --------------------------------------------------------------------------
   Fullscreen toggle
   One button in the room: it takes the browser fullscreen and, once the room
   fills the screen, the same button turns into the way out (Esc also works).
   -------------------------------------------------------------------------- */
function syncDeskFullscreenBtn() {
  const btn = document.getElementById('deskFullscreenBtn');
  if (!btn) return;
  const active = !!document.fullscreenElement;
  btn.classList.toggle('is-fullscreen', active);
  btn.title = active ? 'Exit full screen (Esc)' : 'Full screen';
  btn.setAttribute('aria-label', active ? 'Exit full screen' : 'Enter full screen');
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
}
window.syncDeskFullscreenBtn = syncDeskFullscreenBtn;

function toggleDeskFullscreen() {
  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      const exit = document.exitFullscreen();
      if (exit && typeof exit.catch === 'function') exit.catch(() => { });
    }
    return;
  }

  // The room needs its takeover styling before the browser takes the screen;
  // both calls stay inside the click so the browser keeps the user gesture.
  if (!deskModeActive) enterDeskMode();
  if (document.documentElement.requestFullscreen) {
    const request = document.documentElement.requestFullscreen();
    if (request && typeof request.catch === 'function') request.catch(() => { });
  }
}
window.toggleDeskFullscreen = toggleDeskFullscreen;

function bindDeskMode() {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#deskFullscreenBtn')) {
      toggleDeskFullscreen();
      return;
    }

    if (target.closest('[data-tab="profile"]')) {
      enterDeskMode();
    }
  });

  document.addEventListener('careerdesk:tabchange', event => {
    if (event.detail !== 'profile') exitDeskMode();
  });

  document.addEventListener('fullscreenchange', () => {
    // Leaving fullscreen only leaves fullscreen: the room keeps its takeover
    // until another tab is opened.
    syncDeskFullscreenBtn();
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !deskModeActive) return;
    // While fullscreen, Esc belongs to the browser; a second Esc leaves the room.
    if (document.fullscreenElement) return;
    exitDeskMode();
  });
}

function initDeskHero() {
  const hero = document.getElementById('deskHero');
  if (!hero) return;

  renderDeskHero();
  bindDeskMode();

  const ring = document.getElementById('deskFocusRing');
  if (ring && !ring.dataset.bound) {
    ring.dataset.bound = 'true';
    ring.addEventListener('click', () => {
      if (typeof activateTab === 'function') activateTab('tracker', true);
    });
  }

  const calendar = document.getElementById('deskMiniCalendar');
  if (calendar && !calendar.dataset.bound) {
    calendar.dataset.bound = 'true';
    calendar.addEventListener('click', () => {
      if (typeof activateTab === 'function') activateTab('routine', true);
    });
  }

  const avatar = document.getElementById('deskAvatarBtn');
  if (avatar && !avatar.dataset.bound) {
    avatar.dataset.bound = 'true';
    avatar.addEventListener('click', event => {
      event.stopPropagation();
      if (isDeskProfilePopoverOpen()) closeDeskProfilePopover();
      else openDeskProfilePopover();
    });
  }

  const popover = document.getElementById('deskProfilePopover');
  if (popover && !popover.dataset.bound) {
    popover.dataset.bound = 'true';

    const accountBtn = document.getElementById('deskPopoverAccountBtn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => {
        closeDeskProfilePopover();
        if (typeof openAuthModal === 'function') openAuthModal('login');
      });
    }

    const settingsBtn = document.getElementById('deskPopoverSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        closeDeskProfilePopover();
        if (typeof activateTab === 'function') activateTab('settings', true);
      });
    }

    const signOutBtn = document.getElementById('deskPopoverSignOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        const confirmed = window.confirm('Sign out and clear this device\'s local workspace data? Your synced cloud copy stays available after signing back in.');
        if (!confirmed) return;
        closeDeskProfilePopover();
        if (typeof signOutUser === 'function') {
          await signOutUser();
          renderDeskHero();
        }
      });
    }
  }

  if (!document.body.dataset.deskPopoverBound) {
    document.body.dataset.deskPopoverBound = 'true';
    document.addEventListener('click', event => {
      if (!isDeskProfilePopoverOpen()) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && (target.closest('#deskProfilePopover') || target.closest('#deskAvatarBtn'))) return;
      closeDeskProfilePopover();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isDeskProfilePopoverOpen()) closeDeskProfilePopover();
    });
  }

  document.addEventListener('careerdesk:tabchange', event => {
    closeDeskProfilePopover();
    if (event.detail === 'profile') renderDeskHero();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.getElementById('panel-profile')?.classList.contains('active')) renderDeskHero();
  });

  if (!deskHeroTickTimer) {
    deskHeroTickTimer = setInterval(() => {
      const panel = document.getElementById('panel-profile');
      if (!panel || !panel.classList.contains('active') || document.hidden) return;
      tickDeskRing();
    }, 1000);
  }
}
window.renderDeskHero = renderDeskHero;
window.initDeskHero = initDeskHero;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initDeskHero, 120));
} else {
  setTimeout(initDeskHero, 120);
}
