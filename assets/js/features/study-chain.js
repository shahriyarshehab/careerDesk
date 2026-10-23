/* ==========================================================================
   CareerDesk — Live Study Chain
   Builds the home-page chain from the same state.routine data as the routine table.
   ========================================================================== */
(function () {
  'use strict';

  let refreshTimer = null;

  function localDateKey(date) {
    if (typeof dateKey === 'function') return dateKey(date.getTime());
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function safeText(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function displaySubject(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Untitled study block';
    return typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(raw) : raw;
  }

  function timeLabel(value) {
    if (!value) return 'Time not set';
    if (typeof formatTime12 === 'function') return formatTime12(value);
    const parts = String(value).split(':');
    if (parts.length < 2) return value;
    const h = Number(parts[0]);
    const m = parts[1];
    if (!Number.isFinite(h)) return value;
    return (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }

  function minutesOf(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ''))) return null;
    const parts = value.split(':').map(Number);
    if (parts[0] > 23 || parts[1] > 59) return null;
    return parts[0] * 60 + parts[1];
  }

  function renderStudyChain() {
    const hero = document.querySelector('.study-chain-hero');
    const list = document.getElementById('studyChainList');
    if (!hero || !list) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const today = localDateKey(now);
    const rows = (Array.isArray(window.state?.routine) ? window.state.routine : [])
      .filter(row => row && row.date === today && String(row.subject || '').trim())
      .map(row => ({
        ...row,
        start: minutesOf(row.startTime),
        end: minutesOf(row.endTime)
      }))
      .filter(row => row.start !== null && row.end !== null && row.end > row.start)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const clock = hero.querySelector('.study-chain-clock');
    if (clock) {
      clock.textContent = '◷ ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const stats = hero.querySelectorAll('.study-chain-stat strong');
    const plannedMinutes = rows.reduce((sum, row) => sum + (row.end - row.start), 0);
    const elapsedMinutes = rows.reduce((sum, row) => sum + Math.max(0, Math.min(row.end, nowMinutes) - row.start), 0);
    const overallPct = plannedMinutes ? Math.min(100, Math.round(elapsedMinutes / plannedMinutes * 100)) : 0;
    if (stats[0]) stats[0].textContent = String(rows.length);
    if (stats[1]) {
      const hours = Math.floor(plannedMinutes / 60);
      const mins = plannedMinutes % 60;
      stats[1].textContent = hours ? (mins ? hours + 'h ' + mins + 'm' : hours + ' hr' + (hours === 1 ? '' : 's')) : mins + ' min';
    }
    if (stats[2]) stats[2].textContent = overallPct + '%';
    const statLabels = hero.querySelectorAll('.study-chain-stat span');
    if (statLabels[1]) statLabels[1].textContent = 'Planned study time';
    if (statLabels[2]) statLabels[2].textContent = 'Daily time elapsed';

    if (!rows.length) {
      list.innerHTML = '<div class="study-chain-empty"><span class="study-chain-empty-icon">＋</span><div><strong>No timed study blocks for today</strong><p>Add subjects and start/end times in the Daily Study Routine table to build your chain.</p></div></div>';
      return;
    }

    let activeAssigned = false;
    const nextIndex = rows.findIndex(row => row.start > nowMinutes);
    list.innerHTML = rows.map((row, index) => {
      const isDone = nowMinutes >= row.end;
      const isInTime = nowMinutes >= row.start && nowMinutes < row.end;
      let status = 'UP NEXT';
      let stateClass = '';
      let node = String(index + 1);
      let progress = 0;

      if (isDone) {
        status = 'COMPLETED';
        stateClass = 'done';
        node = '✓';
        progress = 100;
      } else if (isInTime && !activeAssigned) {
        status = 'ACTIVE NOW';
        stateClass = 'active';
        node = '↗';
        activeAssigned = true;
        progress = Math.max(0, Math.min(100, Math.floor((nowMinutes - row.start) / (row.end - row.start) * 100)));
      } else if (isInTime) {
        status = 'IN PROGRESS';
        stateClass = 'upcoming';
        progress = Math.max(0, Math.min(100, Math.floor((nowMinutes - row.start) / (row.end - row.start) * 100)));
      } else if (index === nextIndex) {
        status = 'UP NEXT';
        stateClass = 'next';
      } else {
        status = 'LATER';
        stateClass = 'upcoming';
      }

      const duration = row.end - row.start;
      const timeText = timeLabel(row.startTime) + ' – ' + timeLabel(row.endTime);
      const task = String(row.task || '').trim();
      const progressMarkup = (stateClass === 'active' || status === 'IN PROGRESS')
        ? '<div class="study-chain-progress"><span style="width:' + progress + '%"></span></div><div class="study-chain-progress-label"><span>' + (status === 'ACTIVE NOW' ? 'Session in progress' : 'Overlapping session') + '</span><span>' + progress + '%</span></div>'
        : '';
      const durationLabel = duration >= 60
        ? (Math.floor(duration / 60) + 'h' + (duration % 60 ? ' ' + (duration % 60) + 'm' : ''))
        : duration + 'm';

      return '<div class="study-chain-item ' + stateClass + '"' + (status === 'ACTIVE NOW' ? ' aria-current="step"' : '') + '>' +
        '<span class="study-chain-node" aria-hidden="true">' + node + '</span>' +
        '<div class="study-chain-item-main"><div class="study-chain-subject">' + safeText(displaySubject(row.subject)) + '</div>' +
        '<span class="study-chain-time">' + safeText(timeText) + ' · ' + durationLabel + '</span>' +
        (task ? '<div class="study-chain-task">' + safeText(task) + '</div>' : '') + progressMarkup + '</div>' +
        '<span class="study-chain-status">' + status + '</span></div>';
    }).join('');
  }

  function scheduleRefresh() {
    renderStudyChain();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(renderStudyChain, 15000);
  }

  document.addEventListener('DOMContentLoaded', scheduleRefresh);
  // Master loader injects scripts after DOMContentLoaded, so initialize immediately too.
  if (document.readyState !== 'loading') scheduleRefresh();

  // Re-render after routine table edits, additions, deletions, and resets.
  document.addEventListener('input', event => {
    if (event.target && event.target.closest && event.target.closest('#routineCardWrap')) {
      setTimeout(renderStudyChain, 0);
    }
  });
  document.addEventListener('change', event => {
    if (event.target && event.target.closest && event.target.closest('#routineCardWrap')) {
      setTimeout(renderStudyChain, 0);
    }
  });
  document.addEventListener('click', event => {
    if (event.target && event.target.closest && event.target.closest('#routineCardWrap')) {
      setTimeout(renderStudyChain, 0);
    }
  });

  // Other modules can request a refresh after restoring cloud/local data.
  window.renderStudyChain = renderStudyChain;
})();