/* CareerDesk — 3-position Study Chain wheel, driven by routine + tracker data */
(function () {
  'use strict';
  let refreshTimer = null;
  let selectedIndex = null;

  function localDateKey(date) {
    if (typeof dateKey === 'function') return dateKey(date.getTime());
    return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  }
  function safeText(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function subjectKey(value) {
    const raw = String(value || '').trim();
    return typeof canonicalSubjectName === 'function' ? canonicalSubjectName(raw).toLowerCase() : raw.toLowerCase();
  }
  function displaySubject(value) {
    return typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(String(value || '')) : (String(value || '').trim() || 'Study block');
  }
  function timeLabel(value) {
    if (!value) return 'Time not set';
    if (typeof formatTime12 === 'function') return formatTime12(value);
    const parts = String(value).split(':');
    if (parts.length < 2) return value;
    const h = Number(parts[0]);
    return (h % 12 || 12) + ':' + parts[1] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function minutesOf(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ''))) return null;
    const parts = value.split(':').map(Number);
    return parts[0] < 24 && parts[1] < 60 ? parts[0]*60+parts[1] : null;
  }
  function clockAt(base, minutes) {
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes/60), minutes%60).getTime();
  }
  function renderStudyChain() {
    const hero = document.querySelector('.study-chain-hero');
    const list = document.getElementById('studyChainList');
    if (!hero || !list || typeof state === 'undefined') return;
    const now = new Date();
    const nowMs = now.getTime();
    const nowMinutes = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
    const today = localDateKey(now);
    const routine = Array.isArray(state.routine) ? state.routine : [];
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const todaySessions = sessions.filter(s => s && Number.isFinite(Number(s.start)) && localDateKey(new Date(Number(s.start))) === today);
    const rows = routine.filter(r => r && r.date === today && String(r.subject || '').trim())
      .map(r => ({...r, start:minutesOf(r.startTime), end:minutesOf(r.endTime)}))
      .filter(r => r.start !== null && r.end !== null && r.end > r.start)
      .sort((a,b)=>a.start-b.start || a.end-b.end);

    const clock = hero.querySelector('.study-chain-clock');
    if (clock) clock.textContent = '◷ ' + now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    const plannedMinutes = rows.reduce((sum,r)=>sum+r.end-r.start,0);
    const stats = hero.querySelectorAll('.study-chain-stat strong');
    const labels = hero.querySelectorAll('.study-chain-stat span');
    if (stats[0]) stats[0].textContent = String(rows.length);
    if (stats[1]) { const h=Math.floor(plannedMinutes/60),m=plannedMinutes%60; stats[1].textContent=h?(m?h+'h '+m+'m':h+'h'):m+' min'; }
    if (stats[2]) stats[2].textContent = todaySessions.reduce((sum,s)=>sum+Math.max(0,Number(s.duration)||0),0)+'m';
    if (labels[0]) labels[0].textContent = 'Today’s blocks';
    if (labels[1]) labels[1].textContent = 'Planned time';
    if (labels[2]) labels[2].textContent = 'Tracker logged';

    const prevBtn = hero.querySelector('[data-chain-move="-1"]');
    const nextBtn = hero.querySelector('[data-chain-move="1"]');
    if (!rows.length) {
      selectedIndex = null;
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      list.innerHTML='<div class="study-chain-empty"><span class="study-chain-empty-icon">＋</span><div><strong>No timed blocks for today</strong><p>Add subjects and start/end times in Daily Study Routine to build your chain.</p></div></div>';
      return;
    }

    const trackerMinutesFor = row => {
      const startMs = clockAt(now,row.start), endMs = clockAt(now,row.end);
      let total = todaySessions.filter(s => {
        const a=Number(s.start), b=Number(s.end || s.start);
        return subjectKey(s.subject)===subjectKey(row.subject) && a < endMs && b > startMs;
      }).reduce((sum,s)=>sum+Math.max(0,Number(s.duration)||0),0);
      const active = state.activeSession;
      if (active && subjectKey(active.subject)===subjectKey(row.subject) && Number.isFinite(Number(active.start))) {
        const overlap = Math.max(0,Math.min(nowMs,endMs)-Math.max(Number(active.start),startMs))/60000;
        total += overlap;
      }
      return Math.min(row.end-row.start, total);
    };

    // Center on the currently running routine block; otherwise the next block,
    // or the final block when today's schedule has already ended.
    const runningIndex = rows.findIndex(r=>nowMinutes>=r.start && nowMinutes<r.end);
    const nextIndex = rows.findIndex(r=>r.start>nowMinutes);
    const suggestedIndex = runningIndex >= 0 ? runningIndex : (nextIndex >= 0 ? nextIndex : rows.length-1);
    if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= rows.length) selectedIndex = suggestedIndex;
    // Follow the live schedule automatically until the user navigates the wheel.
    if (!hero.dataset.chainManuallyMoved) selectedIndex = suggestedIndex;
    selectedIndex = Math.max(0,Math.min(rows.length-1,selectedIndex));

    if (prevBtn) prevBtn.disabled = selectedIndex <= 0;
    if (nextBtn) nextBtn.disabled = selectedIndex >= rows.length-1;
    const visible = [];
    for (let i=Math.max(0,selectedIndex-1); i<=Math.min(rows.length-1,selectedIndex+1); i++) visible.push({row:rows[i],index:i});
    list.innerHTML = visible.map(({row,index}) => {
      const duration=row.end-row.start;
      const tracked=trackerMinutesFor(row);
      const isPast=nowMinutes>=row.end;
      const isRunning=nowMinutes>=row.start && nowMinutes<row.end;
      const isCenter=index===selectedIndex;
      const enoughTracked=tracked >= duration*0.9;
      const status=isPast ? (enoughTracked?'COMPLETE':'NOT COMPLETE') : isRunning ? 'ACTIVE NOW' : (row.start>nowMinutes?'UP NEXT':'UPCOMING');
      const cls=(isPast?(enoughTracked?'complete':'incomplete'):isRunning?'active':'future')+(isCenter?' wheel-center':'')+(index===selectedIndex-1?' wheel-past':'')+(index===selectedIndex+1?' wheel-next':'');
      const node=isPast?(enoughTracked?'✓':'!'):isRunning?'●':String(index+1);
      const durationLabel=duration>=60?(Math.floor(duration/60)+'h'+(duration%60?' '+duration%60+'m':'')):duration+'m';
      const task=String(row.task||'').trim();
      const progress=Math.max(0,Math.min(100,Math.round(tracked/duration*100)));
      const trackerLine='Tracker '+Math.round(tracked)+'/'+duration+' min';
      const progressHtml='<div class="study-chain-progress"><span style="width:'+progress+'%"></span></div><div class="study-chain-progress-label"><span>'+trackerLine+'</span><span>'+progress+'%</span></div>';
      return '<article class="study-chain-item '+cls+'" data-chain-index="'+index+'" aria-current="'+(isCenter?'step':'false')+'">'+
        '<div class="study-chain-wheel-top"><span class="study-chain-node" aria-hidden="true">'+node+'</span><span class="study-chain-position">'+(isCenter?'02 · FOCUS':index<selectedIndex?'01 · PAST':'03 · FUTURE')+'</span></div>'+
        '<div class="study-chain-item-main"><div class="study-chain-subject">'+safeText(displaySubject(row.subject))+'</div>'+
        '<span class="study-chain-time">'+safeText(timeLabel(row.startTime)+' – '+timeLabel(row.endTime))+' · '+durationLabel+'</span>'+
        (task?'<div class="study-chain-task">'+safeText(task)+'</div>':'')+
        '<span class="study-chain-status">'+status+'</span>'+progressHtml+'</div></article>';
    }).join('');
  }

  function moveWheel(direction) {
    const hero=document.querySelector('.study-chain-hero');
    if (!hero || typeof state==='undefined') return;
    const now=new Date(), today=localDateKey(now);
    const rows=(Array.isArray(state.routine)?state.routine:[]).filter(r=>r && r.date===today)
      .map(r=>({...r,start:minutesOf(r.startTime),end:minutesOf(r.endTime)}))
      .filter(r=>r.start!==null&&r.end!==null&&r.end>r.start).sort((a,b)=>a.start-b.start);
    if (!rows.length) return;
    if (selectedIndex===null) selectedIndex=rows.findIndex(r=>now.getHours()*60+now.getMinutes()<r.end);
    if (selectedIndex<0) selectedIndex=rows.length-1;
    selectedIndex=Math.max(0,Math.min(rows.length-1,selectedIndex+direction));
    hero.dataset.chainManuallyMoved='true';
    renderStudyChain();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const hero=document.querySelector('.study-chain-hero');
    if(hero) hero.querySelectorAll('[data-chain-move]').forEach(btn=>btn.addEventListener('click',()=>moveWheel(Number(btn.dataset.chainMove))));
    refresh();
  });
  function refresh() {
    renderStudyChain();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer=setInterval(renderStudyChain,15000);
  }
  if (document.readyState!=='loading') {
    const hero=document.querySelector('.study-chain-hero');
    if(hero) hero.querySelectorAll('[data-chain-move]').forEach(btn=>btn.addEventListener('click',()=>moveWheel(Number(btn.dataset.chainMove))));
    refresh();
  }
  ['input','change','click'].forEach(type=>document.addEventListener(type,event=>{
    if(event.target && event.target.closest && event.target.closest('#routineCardWrap')) setTimeout(renderStudyChain,0);
  }));
  window.renderStudyChain=renderStudyChain;
  window.addEventListener('focus',renderStudyChain);
})();