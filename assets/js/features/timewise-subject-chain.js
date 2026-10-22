/* CareerDesk: time-wise subject recommendation chain */
(function () {
  'use strict';
  const fallback = [
    { startTime: '06:30', endTime: '08:00', subject: 'Bangla', task: 'Literature & Grammar Review' },
    { startTime: '09:00', endTime: '10:30', subject: 'English', task: 'Grammar & Vocabulary Practice' },
    { startTime: '11:30', endTime: '13:00', subject: 'Mathematics', task: 'Quantitative Aptitude & Problem Solving' },
    { startTime: '15:30', endTime: '17:00', subject: 'General Knowledge', task: 'Current Affairs & Bangladesh Affairs' },
    { startTime: '20:00', endTime: '21:00', subject: 'English', task: 'Revision and Practice Questions' }
  ];
  const mins = t => /^\d{2}:\d{2}$/.test(String(t || '')) ? Number(t.slice(0,2))*60 + Number(t.slice(3,5)) : null;
  const esc = v => typeof escapeHtml === 'function' ? escapeHtml(String(v || '')) : String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = s => typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(s) : s;
  const today = () => typeof dateKey === 'function' ? dateKey(Date.now()) : new Date().toISOString().slice(0,10);
  function chain() {
    const rows = typeof state !== 'undefined' && Array.isArray(state.routine) ? state.routine.filter(r => r && r.date === today() && r.subject && r.startTime) : [];
    const suggestions = fallback.filter(candidate => {
      const candidateStart = mins(candidate.startTime);
      const candidateEnd = mins(candidate.endTime);
      return !rows.some(existing => {
        const existingStart = mins(existing.startTime);
        const existingEnd = mins(existing.endTime);
        if (existing.startTime === candidate.startTime) return true;
        if (candidateStart === null || candidateEnd === null || existingStart === null || existingEnd === null) return false;
        return candidateStart < existingEnd && candidateEnd > existingStart;
      });
    }).map((r,i) => ({...r, id:'suggested-'+i, date:today(), isSuggestion:true}));
    return rows.concat(suggestions).slice().sort((a,b) => String(a.startTime).localeCompare(String(b.startTime)));
  }
  function render() {
    const host = document.getElementById('timewiseSubjectChain');
    if (!host) return;
    const rows = chain(), now = new Date(), current = now.getHours()*60+now.getMinutes();
    const active = rows.findIndex(r => mins(r.startTime) !== null && mins(r.endTime) !== null && current >= mins(r.startTime) && current < mins(r.endTime));
    const next = active >= 0 ? active : rows.findIndex(r => mins(r.startTime) !== null && mins(r.startTime) > current);
    const focus = rows[next >= 0 ? next : active];
    const clock = t => typeof formatTime12 === 'function' ? formatTime12(t) : t;
    const steps = rows.map((r,i) => {
      const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(r.subject) : {color:'#6366f1'};
      const stateText = i === active ? 'Studying now' : (active < 0 && i === next) ? 'Recommended next' : i < (active >= 0 ? active : next >= 0 ? next : rows.length) ? 'Earlier in the chain' : 'Coming up';
      return `<div class="tw-chain-step ${i===active?'is-current':''} ${active<0 && i===next?'is-next':''}">
        <span class="tw-chain-node" style="--tw-subject-color:${esc(meta.color || '#6366f1')}"><i data-lucide="${i===active?'play-circle':(i===next?'arrow-right-circle':'circle')}"></i></span>
        <div class="tw-chain-copy"><div class="tw-chain-topline"><strong>${esc(label(r.subject))}</strong><span>${esc(clock(r.startTime))} – ${esc(clock(r.endTime))}</span></div>
        <p>${esc(r.task || 'Focused study and practice')}</p><small>${stateText}</small></div>
        ${r.isSuggestion ? `<button class="tw-add-slot" type="button" data-chain-start="${esc(r.startTime)}">Add</button>` : ''}</div>`;
    }).join('');
    host.innerHTML = `<div class="tw-chain-heading"><div class="tw-chain-heading-icon"><i data-lucide="git-branch"></i></div><div><h3>Time-wise Subject Chain</h3><p>Know what to study now and what comes next.</p></div><span class="tw-chain-status">${active>=0?'NOW':next>=0?'UP NEXT':'TODAY COMPLETE'}</span></div>
      <div class="tw-chain-focus"><span class="tw-focus-label">${active>=0?'STUDY THIS NOW':next>=0?'YOUR NEXT SUBJECT':'DAILY CHAIN COMPLETE'}</span><strong>${focus?esc(label(focus.subject)):'You have finished today’s chain'}</strong><p>${focus?esc(focus.task || 'Focused study and practice'):'Review what you learned or plan tomorrow’s routine.'}</p>${focus?`<span class="tw-focus-time"><i data-lucide="clock-3"></i> ${esc(clock(focus.startTime))} – ${esc(clock(focus.endTime))}</span>`:''}</div>
      <div class="tw-chain-list">${steps}</div><div class="tw-chain-footnote"><i data-lucide="lightbulb"></i> Study in focused blocks, then move to the next subject. Your existing routine takes priority.</div>`;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }
  function init() {
    const routine = document.getElementById('routineCardWrap');
    const monthly = document.getElementById('monthlyRoutineView');
    const anchor = monthly || routine;
    if (!anchor || !anchor.parentNode) return;
    if (!document.getElementById('timewiseSubjectChain')) {
      const panel = document.createElement('section');
      panel.id='timewiseSubjectChain'; panel.className='tw-subject-chain glass';
      panel.setAttribute('aria-label','Time-wise subject recommendations');
      anchor.insertAdjacentElement('afterend', panel);
    }
    render();
    const observer = new MutationObserver(render);
    observer.observe(routine,{childList:true,subtree:true});
    window.addEventListener('focus',render);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
    setInterval(render,60000);
  }
  document.addEventListener('click', e => {
    const btn=e.target.closest('.tw-add-slot'); if(!btn) return;
    const row=chain().find(item => item.isSuggestion && item.startTime === btn.dataset.chainStart); if(!row) return;
    if(!Array.isArray(state.routine)) state.routine=[];
    const start = mins(row.startTime), end = mins(row.endTime);
    const conflicts = state.routine.some(item => {
      if (item.date !== today()) return false;
      if (item.startTime === row.startTime) return true;
      const itemStart = mins(item.startTime), itemEnd = mins(item.endTime);
      return start !== null && end !== null && itemStart !== null && itemEnd !== null && start < itemEnd && end > itemStart;
    });
    if (conflicts) {
      if(typeof showToast==='function') showToast('This suggestion overlaps an existing routine slot');
      render();
      return;
    }
    state.routine.push({id:Date.now(),date:today(),startTime:row.startTime,endTime:row.endTime,subject:row.subject,task:row.task});
    if(typeof saveData==='function') saveData();
    if(typeof renderRoutine==='function') renderRoutine();
    if(typeof renderDateSlider==='function') renderDateSlider();
    if(typeof showToast==='function') showToast('Subject suggestion added to today’s routine');
    render();
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();