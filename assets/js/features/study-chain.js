/* CareerDesk — compact live Study Chain, driven by routine + tracker data */
(function () {
  'use strict';
  let refreshTimer = null;

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
  function renderStudyChain() {
    const hero = document.querySelector('.study-chain-hero');
    const list = document.getElementById('studyChainList');
    if (!hero || !list || typeof state === 'undefined') return;
    const now = new Date();
    const nowMinutes = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
    const today = localDateKey(now);
    const routine = Array.isArray(state.routine) ? state.routine : [];
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const todaySessions = sessions.filter(s => s && Number.isFinite(Number(s.start)) && localDateKey(new Date(Number(s.start))) === today);
    const rows = routine.filter(r => r && r.date === today && String(r.subject || '').trim())
      .map(r => ({...r, start:minutesOf(r.startTime), end:minutesOf(r.endTime)}))
      .filter(r => r.start !== null && r.end !== null && r.end > r.start)
      .sort((a,b) => a.start-b.start || a.end-b.end);

    const clock = hero.querySelector('.study-chain-clock');
    if (clock) clock.textContent = '◷ ' + now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    const plannedMinutes = rows.reduce((sum,r)=>sum+r.end-r.start,0);
    const elapsedMinutes = rows.reduce((sum,r)=>sum+Math.max(0,Math.min(r.end,nowMinutes)-r.start),0);
    const stats = hero.querySelectorAll('.study-chain-stat strong');
    const labels = hero.querySelectorAll('.study-chain-stat span');
    if (stats[0]) stats[0].textContent = String(rows.length);
    if (stats[1]) { const h=Math.floor(plannedMinutes/60),m=plannedMinutes%60; stats[1].textContent=h?(m?h+'h '+m+'m':h+'h'):m+' min'; }
    if (stats[2]) stats[2].textContent = todaySessions.reduce((sum,s)=>sum+Math.max(0,Number(s.duration)||0),0)+'m';
    if (labels[0]) labels[0].textContent = 'Today’s blocks';
    if (labels[1]) labels[1].textContent = 'Planned time';
    if (labels[2]) labels[2].textContent = 'Tracker logged';

    if (!rows.length) {
      list.innerHTML='<div class="study-chain-empty"><span class="study-chain-empty-icon">＋</span><div><strong>No timed blocks for today</strong><p>Add subjects and start/end times in Daily Study Routine to build your chain.</p></div></div>';
      return;
    }
    const trackerMinutesFor = row => todaySessions.filter(s => {
      const a=Number(s.start), b=Number(s.end || s.start);
      const sameSubject=subjectKey(s.subject)===subjectKey(row.subject);
      return sameSubject && a < new Date(now.getFullYear(),now.getMonth(),now.getDate(),Math.floor(row.end/60),row.end%60).getTime()
        && b > new Date(now.getFullYear(),now.getMonth(),now.getDate(),Math.floor(row.start/60),row.start%60).getTime();
    }).reduce((sum,s)=>sum+Math.max(0,Number(s.duration)||0),0);
    let activeAssigned=false;
    const nextIndex=rows.findIndex(r=>r.start>nowMinutes);
    list.innerHTML=rows.map((row,index)=>{
      const done=nowMinutes>=row.end;
      const inTime=nowMinutes>=row.start && nowMinutes<row.end;
      const tracked=trackerMinutesFor(row);
      let status='LATER',cls='upcoming',node=String(index+1),progress=0;
      if(done){status=tracked?'DONE · TRACKED':'COMPLETED';cls='done';node='✓';progress=100;}
      else if(inTime&&!activeAssigned){status='ACTIVE NOW';cls='active';node='●';activeAssigned=true;progress=Math.floor((nowMinutes-row.start)/(row.end-row.start)*100);}
      else if(inTime){status='IN PROGRESS';cls='upcoming';progress=Math.floor((nowMinutes-row.start)/(row.end-row.start)*100);}
      else if(index===nextIndex){status='UP NEXT';cls='next';}
      const duration=row.end-row.start;
      const durationLabel=duration>=60?(Math.floor(duration/60)+'h'+(duration%60?' '+duration%60+'m':'')):duration+'m';
      const task=String(row.task||'').trim();
      const progressHtml=(cls==='active'||status==='IN PROGRESS')?'<div class="study-chain-progress"><span style="width:'+Math.max(0,Math.min(100,progress))+'%"></span></div><div class="study-chain-progress-label"><span>'+ (tracked?'Tracker: '+tracked+'m logged':'Time elapsed')+'</span><span>'+Math.max(0,Math.min(100,progress))+'%</span></div>':'';
      const trackedHtml=tracked && status!=='ACTIVE NOW' && status!=='IN PROGRESS'?'<div class="study-chain-task">Tracker logged: '+tracked+' min</div>':'';
      return '<div class="study-chain-item '+cls+'"'+(status==='ACTIVE NOW'?' aria-current="step"':'')+'><span class="study-chain-node" aria-hidden="true">'+node+'</span><div class="study-chain-item-main"><div class="study-chain-subject">'+safeText(displaySubject(row.subject))+'</div><span class="study-chain-time">'+safeText(timeLabel(row.startTime)+' – '+timeLabel(row.endTime))+' · '+durationLabel+'</span>'+(task?'<div class="study-chain-task">'+safeText(task)+'</div>':'')+trackedHtml+progressHtml+'</div><span class="study-chain-status">'+status+'</span></div>';
    }).join('');
  }
  function refresh() {
    renderStudyChain();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer=setInterval(renderStudyChain,15000);
  }
  document.addEventListener('DOMContentLoaded',refresh);
  if (document.readyState!=='loading') refresh();
  ['input','change','click'].forEach(type=>document.addEventListener(type,event=>{
    if(event.target && event.target.closest && event.target.closest('#routineCardWrap')) setTimeout(renderStudyChain,0);
  }));
  window.renderStudyChain=renderStudyChain;
  // Tracker saves and routine renders use this shared refresh hook when available.
  window.addEventListener('focus',renderStudyChain);
})();