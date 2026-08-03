(function(){
  'use strict';

  const bnDigitMap = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
  function toBnDigits(str){ return String(str).replace(/[0-9]/g, d => bnDigitMap[d]); }

  function showToastMsg(msg, isError = false){
    let toast = document.getElementById('toastContainer');
    if(!toast){
      toast = document.createElement('div');
      toast.id = 'toastContainer';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ==========================================
  // 1. EXAM COUNTDOWN ENGINE
  // ==========================================
  const EXAMS_KEY = 'jobprep_exams_list';

  let exams = [];

  function loadExams(){
    try{
      const data = localStorage.getItem(EXAMS_KEY);
      if(data){
        exams = JSON.parse(data);
      } else {
        // Default sample exam targets
        const now = new Date();
        const bcs47 = new Date(now.getFullYear(), now.getMonth() + 2, 15, 10, 0);
        const bankExam = new Date(now.getFullYear(), now.getMonth() + 1, 5, 9, 30);
        exams = [
          { id: 1, name: '৪৭তম বিসিএস প্রিলিমিনারি', category: 'বিসিএস', targetDate: bcs47.toISOString() },
          { id: 2, name: 'কম্বাইন্ড ব্যাংক সিনিয়র অফিসার', category: 'ব্যাংক', targetDate: bankExam.toISOString() }
        ];
        saveExams();
      }
    } catch(e){ exams = []; }
  }

  function saveExams(){
    try{ localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); }catch(e){}
  }

  function renderExams(){
    const grid = document.getElementById('countdownGrid');
    if(!grid) return;
    grid.innerHTML = '';
    if(!exams.length){
      grid.innerHTML = '<div class="empty-state">কোনো পরীক্ষার তারিখ সেট করা নেই। উপরের বাটনে ক্লিক করে নতুন পরীক্ষার টার্গেট যোগ করুন।</div>';
      return;
    }

    const now = new Date().getTime();

    exams.forEach(ex => {
      const targetTime = new Date(ex.targetDate).getTime();
      const diff = targetTime - now;

      let days = 0, hours = 0, mins = 0, secs = 0;
      let isExpired = false;

      if(diff <= 0){
        isExpired = true;
      } else {
        days = Math.floor(diff / (1000 * 60 * 60 * 24));
        hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        secs = Math.floor((diff % (1000 * 60)) / 1000);
      }

      const card = document.createElement('div');
      card.className = 'countdown-card glass';
      card.innerHTML = `
        <button class="countdown-del-btn" data-id="${ex.id}" title="মুছুন">✕</button>
        <div class="countdown-head">
          <h3>${ex.name}</h3>
          <span class="countdown-tag">${ex.category || 'পরীক্ষা'}</span>
        </div>
        ${isExpired ? `
          <div style="padding: 16px 0; text-align:center; color: var(--accent3); font-weight:700;">আজ পরীক্ষা / সময় অতিক্রান্ত!</div>
        ` : `
          <div class="countdown-timer-row">
            <div class="time-box"><span class="time-num">${toBnDigits(days)}</span><span class="time-lbl">দিন</span></div>
            <div class="time-box"><span class="time-num">${toBnDigits(hours)}</span><span class="time-lbl">ঘণ্টা</span></div>
            <div class="time-box"><span class="time-num">${toBnDigits(mins)}</span><span class="time-lbl">মিনিট</span></div>
            <div class="time-box"><span class="time-num">${toBnDigits(secs)}</span><span class="time-lbl">সেকেন্ড</span></div>
          </div>
        `}
      `;
      grid.appendChild(card);
    });
  }

  // Delete Exam Target
  document.addEventListener('click', (e)=>{
    if(e.target.classList.contains('countdown-del-btn')){
      const id = e.target.dataset.id;
      exams = exams.filter(ex => String(ex.id) !== String(id));
      saveExams();
      renderExams();
      showToastMsg('পরীক্ষার টার্গেট মুছে ফেলা হয়েছে');
    }
  });

  // Add Exam Target Form
  const toggleExamBtn = document.getElementById('toggleExamFormBtn');
  const examWrap = document.getElementById('examFormWrap');
  if(toggleExamBtn && examWrap){
    toggleExamBtn.addEventListener('click', ()=>{
      const isOpen = examWrap.style.display !== 'none';
      examWrap.style.display = isOpen ? 'none' : 'block';
      toggleExamBtn.innerHTML = isOpen ? '<span class="btn-icon">+</span> নতুন পরীক্ষার টার্গেট যোগ করুন' : '✕ ফর্ম বন্ধ করুন';
      toggleExamBtn.classList.toggle('active-open', !isOpen);
    });
  }

  const addExamBtn = document.getElementById('addExamTargetBtn');
  if(addExamBtn){
    addExamBtn.addEventListener('click', ()=>{
      const nameEl = document.getElementById('examNameInput');
      const catEl = document.getElementById('examCatInput');
      const dateEl = document.getElementById('examDateInput');
      const name = nameEl.value.trim();
      const cat = catEl.value.trim();
      const dateVal = dateEl.value;

      if(!name || !dateVal){
        showToastMsg('দয়া করে পরীক্ষার নাম ও তারিখ নির্বাচন করুন', true);
        return;
      }

      exams.push({
        id: Date.now(),
        name: name,
        category: cat || 'পরীক্ষা',
        targetDate: new Date(dateVal).toISOString()
      });

      nameEl.value = ''; dateEl.value = '';
      saveExams();
      renderExams();

      if(examWrap && toggleExamBtn){
        examWrap.style.display = 'none';
        toggleExamBtn.innerHTML = '<span class="btn-icon">+</span> নতুন পরীক্ষার টার্গেট যোগ করুন';
        toggleExamBtn.classList.remove('active-open');
      }
      showToastMsg('নতুন পরীক্ষার কাউন্টডাউন টার্গেট যোগ হয়েছে!');
    });
  }


  // ==========================================
  // 2. UNIFIED SMART STUDY TIMER & 24H TRACKER
  // ==========================================
  let pomoTimerInterval = null;
  let customCountdownSecs = 0;
  let selectedDuration = 0; // 0 = Stopwatch free mode

  const BREAK_STORAGE_KEY = 'jobprep_break_minutes_today';

  function getTodayDateStr(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getTodayBreakMinutes(){
    try{
      const raw = localStorage.getItem(BREAK_STORAGE_KEY);
      if(!raw) return 0;
      const parsed = JSON.parse(raw);
      return (parsed && parsed.date === getTodayDateStr()) ? (parsed.minutes || 0) : 0;
    }catch(e){ return 0; }
  }

  function addTodayBreakMinutes(mins){
    try{
      const current = getTodayBreakMinutes();
      const updated = current + mins;
      localStorage.setItem(BREAK_STORAGE_KEY, JSON.stringify({ date: getTodayDateStr(), minutes: updated }));
      update24hActivityUI();
    }catch(e){}
  }

  function update24hActivityUI(){
    const studyVal = document.getElementById('actStudyVal');
    const breakVal = document.getElementById('actBreakVal');
    const ratioVal = document.getElementById('actRatioVal');
    if(!studyVal || !breakVal || !ratioVal) return;

    let studyMinutes = 0;
    try{
      const mainStateRaw = localStorage.getItem('jobprep-dashboard-data-v2');
      if(mainStateRaw){
        const parsedState = JSON.parse(mainStateRaw);
        const todayStr = getTodayDateStr();
        if(Array.isArray(parsedState.sessions)){
          parsedState.sessions.forEach(s => {
            const sDate = new Date(s.start || s.date);
            const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth()+1).padStart(2,'0')}-${String(sDate.getDate()).padStart(2,'0')}`;
            if(sDateStr === todayStr){
              studyMinutes += (s.duration || s.durationMinutes || 0);
            }
          });
        }
      }
    }catch(e){}

    const breakMinutes = getTodayBreakMinutes();
    const totalActivityMinutes = studyMinutes + breakMinutes;
    const totalDayMinutes = 24 * 60;
    const pct = Math.min(100, Math.round((totalActivityMinutes / totalDayMinutes) * 100));

    const sH = Math.floor(studyMinutes / 60);
    const sM = studyMinutes % 60;
    studyVal.textContent = toBnDigits(`${sH} ঘণ্টা ${sM} মিনিট`);
    breakVal.textContent = toBnDigits(`${breakMinutes} মিনিট`);

    const totH = (totalActivityMinutes / 60).toFixed(1);
    ratioVal.textContent = toBnDigits(`${pct}% (${totH} ঘণ্টা / ২৪ ঘণ্টা)`);
  }

  const durationSelector = document.getElementById('timerDurationSelector');
  if(durationSelector){
    durationSelector.addEventListener('click', (e)=>{
      const chip = e.target.closest('.timer-dur-chip');
      if(!chip) return;

      if(window.isCustomCountdownActive){
        showToastMsg('সেশন চালুরত অবস্থায় সময় পরিবর্তন করা যাবে না। সেশন শেষ করুন।', true);
        return;
      }

      durationSelector.querySelectorAll('.timer-dur-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      selectedDuration = parseInt(chip.dataset.duration, 10) || 0;
      window.selectedTimerDuration = selectedDuration;

      const display = document.getElementById('timerDisplay');
      const sub = document.getElementById('timerSub');
      const subjectSel = document.getElementById('sessionSubject');
      const subject = (subjectSel && subjectSel.value) ? subjectSel.value : 'সাধারণ';

      if(selectedDuration === 0){
        if(display) display.textContent = '00:00:00';
        if(sub) sub.innerHTML = `<strong>${subject}</strong> — স্টপওয়াচ মোডে পড়া চালু করুন`;
      } else if(selectedDuration === 5){
        customCountdownSecs = 5 * 60;
        if(display) display.textContent = '05:00';
        if(sub) sub.innerHTML = `<strong>৫ মিনিটের</strong> রিফ্রেশমেন্ট বিরতি`;
      } else {
        customCountdownSecs = selectedDuration * 60;
        const mStr = String(selectedDuration).padStart(2,'0');
        if(display) display.textContent = `${mStr}:00`;
        if(sub) sub.innerHTML = `<strong>${subject}</strong> — ${selectedDuration} মিনিটের ফোকাস সেশন`;
      }
    });
  }

  // Cancel Modal Handler
  const cancelModal = document.getElementById('cancelSessionModal');
  const resumeBtn = document.getElementById('resumeSessionBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelSessionBtn');

  function openCancelModal(remSeconds){
    if(!cancelModal) return;
    const m = Math.floor(remSeconds / 60);
    const s = remSeconds % 60;
    const textEl = document.getElementById('cancelModalBodyText');
    const subjectSel = document.getElementById('sessionSubject');
    const subject = (subjectSel && subjectSel.value) ? subjectSel.value : 'সাধারণ';

    if(textEl){
      textEl.innerHTML = `<strong>${subject}</strong> পড়ার <strong>${selectedDuration} মিনিটের</strong> ফোকাস সেশনটি সম্পন্ন হতে এখনও <strong>${toBnDigits(m)} মিনিট ${toBnDigits(s)} সেকেন্ড</strong> বাকি আছে!<br><br>এখনই উঠে গেলে এই সেশনের পড়া দৈনিক টার্গেটে যুক্ত হবে না।`;
    }
    cancelModal.classList.add('open');
  }

  function closeCancelModal(){
    if(cancelModal) cancelModal.classList.remove('open');
  }

  if(resumeBtn) resumeBtn.addEventListener('click', closeCancelModal);
  if(confirmCancelBtn){
    confirmCancelBtn.addEventListener('click', ()=>{
      closeCancelModal();
      stopCustomCountdown(false);
    });
  }

  function startCustomCountdown(){
    window.isCustomCountdownActive = true;
    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const orb = document.getElementById('clockOrb');

    if(startBtn) startBtn.style.display = 'none';
    if(stopBtn) stopBtn.style.display = 'inline-flex';
    if(orb) orb.classList.add('active');

    pomoTimerInterval = setInterval(()=>{
      if(customCountdownSecs > 0){
        customCountdownSecs--;
        const m = String(Math.floor(customCountdownSecs / 60)).padStart(2,'0');
        const s = String(customCountdownSecs % 60).padStart(2,'0');
        if(display) display.textContent = toBnDigits(`${m}:${s}`);
      } else {
        clearInterval(pomoTimerInterval);
        stopCustomCountdown(true);
      }
    }, 1000);
  }

  function stopCustomCountdown(isCompleted = false){
    clearInterval(pomoTimerInterval);
    window.isCustomCountdownActive = false;

    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const orb = document.getElementById('clockOrb');

    if(startBtn) startBtn.style.display = 'inline-flex';
    if(stopBtn) stopBtn.style.display = 'none';
    if(orb) orb.classList.remove('active');

    const subjectSel = document.getElementById('sessionSubject');
    const subject = (subjectSel && subjectSel.value) ? subjectSel.value : 'সাধারণ';

    if(selectedDuration === 5){
      if(isCompleted){
        addTodayBreakMinutes(5);
        showToastMsg('৫ মিনিটের রিফ্রেশমেন্ট বিরতি সম্পন্ন হয়েছে!');
      } else {
        showToastMsg('বিরতি বাতিল করা হয়েছে');
      }
      customCountdownSecs = 5 * 60;
      if(display) display.textContent = '05:00';
    } else {
      if(isCompleted){
        // Credit completed study duration to main localStorage state
        try{
          const mainStateRaw = localStorage.getItem('jobprep-dashboard-data-v2');
          let parsedState = mainStateRaw ? JSON.parse(mainStateRaw) : {};
          if(!Array.isArray(parsedState.sessions)) parsedState.sessions = [];
          parsedState.sessions.push({
            id: Date.now(),
            start: Date.now() - (selectedDuration * 60000),
            end: Date.now(),
            subject: subject,
            duration: selectedDuration
          });
          localStorage.setItem('jobprep-dashboard-data-v2', JSON.stringify(parsedState));
        }catch(e){}

        showToastMsg(`${selectedDuration} মিনিটের ${subject} পড়ার সেশন সম্পন্ন হয়েছে এবং টার্গেটে যুক্ত হয়েছে!`);
      } else {
        showToastMsg('সেশন বাতিল করা হয়েছে — পড়া দৈনিক টার্গেটে যুক্ত হয়নি', true);
      }
      customCountdownSecs = selectedDuration * 60;
      const mStr = String(selectedDuration).padStart(2,'0');
      if(display) display.textContent = `${mStr}:00`;
    }

    update24hActivityUI();
  }

  document.addEventListener('click', (e)=>{
    if(selectedDuration === 0) return;

    if(e.target && e.target.id === 'startBtn'){
      e.stopImmediatePropagation();
      startCustomCountdown();
    } else if(e.target && e.target.id === 'stopBtn'){
      e.stopImmediatePropagation();
      if(customCountdownSecs > 0){
        openCancelModal(customCountdownSecs);
      } else {
        stopCustomCountdown(false);
      }
    }
  }, true);


  // ==========================================
  // 3. MOCK QUIZ & MISTAKE BANK ENGINE
  // ==========================================
  const MISTAKES_KEY = 'jobprep_mistakes_list';
  const sampleQuestions = [
    {
      id: 101,
      q: 'কোনটি রবীন্দ্রনাথ ঠাকুরের রচনা নয়?',
      options: ['শেষের কবিতা', 'রক্তকরবী', 'পথের দাবী', 'চোখের বালি'],
      correct: 2,
      explain: 'পথের দাবী শরৎচন্দ্র চট্টোপাধ্যায়ের একটি বিখ্যাত রাজনৈতিক উপন্যাস।'
    },
    {
      id: 102,
      q: 'Which one is the correct spelling?',
      options: ['Bureaucracy', 'Beurocracy', 'Bureacracy', 'Beuracracy'],
      correct: 0,
      explain: 'Correct spelling is Bureaucracy (আমলাতন্ত্র).'
    },
    {
      id: 103,
      q: 'বাংলাদেশের সংবিধানের প্রথম সংশোধনী কবে গৃহীত হয়?',
      options: ['১৯৭৩ সালের ১৫ জুলাই', '১৯৭২ সালের ১৬ ডিসেম্বর', '১৯৭৪ সালের ১৮ মে', '১৯৭৫ সালের ১৫ আগস্ট'],
      correct: 0,
      explain: '১৯৭৩ সালের ১৫ জুলাই বাংলাদেশের সংবিধানের প্রথম সংশোধনী পাস হয়।'
    },
    {
      id: 104,
      q: 'log₂8 এর মান কত?',
      options: ['৩', '২', '৪', '৮'],
      correct: 0,
      explain: 'log₂8 = log₂ (2³) = 3 log₂2 = 3.'
    }
  ];

  let currentQuizIdx = 0;
  let mistakes = [];

  function loadMistakes(){
    try{
      const data = localStorage.getItem(MISTAKES_KEY);
      mistakes = data ? JSON.parse(data) : [];
    }catch(e){ mistakes = []; }
  }

  function saveMistakes(){
    try{ localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes)); }catch(e){}
  }

  function renderQuiz(){
    const box = document.getElementById('quizBox');
    if(!box) return;

    if(currentQuizIdx >= sampleQuestions.length){
      box.innerHTML = `
        <div style="text-align:center; padding: 24px;">
          <h3 style="font-family:'Baloo Da 2',sans-serif; font-size:24px; color:var(--accent2); margin-bottom:10px;">কুইজ সেশন শেষ হয়েছে!</h3>
          <p style="color:var(--text-soft); margin-bottom:20px;">আপনার ভুল উত্তরসমূহ "দুর্বলতার খাতা (Mistake Bank)" এ সংরক্ষিত হয়েছে।</p>
          <button class="pill solid" id="restartQuizBtn">পুনরায় শুরু করুন</button>
        </div>
      `;
      document.getElementById('restartQuizBtn').addEventListener('click', ()=>{
        currentQuizIdx = 0;
        renderQuiz();
      });
      return;
    }

    const qItem = sampleQuestions[currentQuizIdx];

    box.innerHTML = `
      <div class="quiz-header">
        <span style="font-size:13px; color:var(--text-soft);">প্রশ্ন ${toBnDigits(currentQuizIdx+1)} / ${toBnDigits(sampleQuestions.length)}</span>
        <span class="pill" style="font-size:12px; padding:4px 12px;">বিসিএস প্রিলিমিনারি</span>
      </div>
      <div class="quiz-question">${qItem.q}</div>
      <div class="quiz-options">
        ${qItem.options.map((opt, i) => `
          <button class="quiz-opt-btn" data-idx="${i}">
            <span>${opt}</span>
            <span class="opt-indicator"></span>
          </button>
        `).join('')}
      </div>
      <div id="quizExplainBox" style="display:none;" class="quiz-explanation"></div>
      <div style="display:flex; justify-content:flex-end;">
        <button class="pill solid" id="nextQuizBtn" style="display:none;">পরের প্রশ্ন ➔</button>
      </div>
    `;

    const optBtns = box.querySelectorAll('.quiz-opt-btn');
    const explainBox = box.querySelector('#quizExplainBox');
    const nextBtn = box.querySelector('#nextQuizBtn');

    optBtns.forEach(btn => {
      btn.addEventListener('click', ()=>{
        const selectedIdx = parseInt(btn.dataset.idx, 10);
        optBtns.forEach(b => b.style.pointerEvents = 'none');

        if(selectedIdx === qItem.correct){
          btn.classList.add('correct');
          btn.querySelector('.opt-indicator').textContent = '✓ সঠিক';
        } else {
          btn.classList.add('wrong');
          btn.querySelector('.opt-indicator').textContent = '✕ ভুল';
          optBtns[qItem.correct].classList.add('correct');
          optBtns[qItem.correct].querySelector('.opt-indicator').textContent = '✓ সঠিক উত্তর';

          if(!mistakes.some(m => m.id === qItem.id)){
            mistakes.push({
              id: qItem.id,
              q: qItem.q,
              yourAns: qItem.options[selectedIdx],
              correctAns: qItem.options[qItem.correct],
              explain: qItem.explain
            });
            saveMistakes();
            renderMistakes();
          }
        }

        explainBox.innerHTML = `<strong>ব্যাখ্যা:</strong> ${qItem.explain}`;
        explainBox.style.display = 'block';
        nextBtn.style.display = 'inline-flex';
      });
    });

    nextBtn.addEventListener('click', ()=>{
      currentQuizIdx++;
      renderQuiz();
    });
  }

  function renderMistakes(){
    const list = document.getElementById('mistakeBankList');
    if(!list) return;
    list.innerHTML = '';

    if(!mistakes.length){
      list.innerHTML = '<div class="empty-state">এখনও কোনো ভুল উত্তর রেকর্ড হয়নি। কুইজ অনুশীলন করুন!</div>';
      return;
    }

    mistakes.forEach(m => {
      const card = document.createElement('div');
      card.className = 'mistake-card';
      card.innerHTML = `
        <h4>${m.q}</h4>
        <div class="mistake-ans-row">
          <span class="mistake-wrong">আপনার উত্তর: ${m.yourAns}</span>
          <span class="mistake-correct">সঠিক উত্তর: ${m.correctAns}</span>
        </div>
        <div style="font-size:12.5px; color:var(--text-soft); margin-top:6px;">💡 ${m.explain}</div>
      `;
      list.appendChild(card);
    });
  }

  const clearMistakesBtn = document.getElementById('clearMistakesBtn');
  if(clearMistakesBtn){
    clearMistakesBtn.addEventListener('click', ()=>{
      if(window.confirm('আপনি কি নিশ্চিত যে "দুর্বলতার খাতা" খালি করতে চান?')){
        mistakes = [];
        saveMistakes();
        renderMistakes();
        showToastMsg('দুর্বলতার খাতা খালি করা হয়েছে');
      }
    });
  }

  // Combined Quiz & Flashcard Subview Switcher
  const quizFlashSwitch = document.getElementById('quizFlashSwitch');
  if(quizFlashSwitch){
    quizFlashSwitch.addEventListener('click', (e)=>{
      const chip = e.target.closest('.chip');
      if(!chip) return;
      quizFlashSwitch.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const view = chip.dataset.view;

      const subFlash = document.getElementById('subview-flashcards');
      const subQuiz = document.getElementById('subview-quiz');
      const subMistakes = document.getElementById('subview-mistakes');

      if(subFlash) subFlash.style.display = view === 'flashcards' ? 'block' : 'none';
      if(subQuiz) subQuiz.style.display = view === 'quiz' ? 'block' : 'none';
      if(subMistakes) subMistakes.style.display = view === 'mistakes' ? 'block' : 'none';
    });
  }

  // ===== Init Experimental Features =====
  document.addEventListener('DOMContentLoaded', ()=>{
    loadExams();
    renderExams();
    setInterval(renderExams, 1000); // Live countdown tick

    update24hActivityUI();
    loadMistakes();
    renderQuiz();
    renderMistakes();
  });

})();
