(function () {
  const STORAGE_KEY = 'jobprep-dashboard-data-v2';

  // window.storage only exists inside the Claude.ai artifact viewer.
  // When this file runs as a standalone app (opened directly or via a local server),
  // fall back to localStorage so data still persists across reloads.
  const storageAdapter = {
    async get(key) {
      if (window.storage) {
        try { return await window.storage.get(key); } catch (e) { /* fall through to localStorage */ }
      }
      try {
        const v = localStorage.getItem(key);
        return v !== null ? { key, value: v } : null;
      } catch (e) { return null; }
    },
    async set(key, value) {
      if (window.storage) {
        try { return await window.storage.set(key, value); } catch (e) { /* fall through to localStorage */ }
      }
      try { localStorage.setItem(key, value); return { key, value }; } catch (e) { return null; }
    }
  };

  function getDefaultState() {
    return {
      routine: [
        { "id": 1785724321054, "date": "2026-08-03", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785724321055, "date": "2026-08-03", "startTime": "07:00", "endTime": "08:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785724321056, "date": "2026-08-03", "startTime": "08:00", "endTime": "09:00", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785724321057, "date": "2026-08-03", "startTime": "18:00", "endTime": "19:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785724321058, "date": "2026-08-03", "startTime": "19:00", "endTime": "20:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725533808, "date": "2026-08-02", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725533809, "date": "2026-08-02", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725533810, "date": "2026-08-02", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725533811, "date": "2026-08-02", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725533812, "date": "2026-08-02", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725544067, "date": "2026-08-04", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725544068, "date": "2026-08-04", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725544069, "date": "2026-08-04", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725544070, "date": "2026-08-04", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725544071, "date": "2026-08-04", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725548671, "date": "2026-08-05", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725548672, "date": "2026-08-05", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725548673, "date": "2026-08-05", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725548674, "date": "2026-08-05", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725548675, "date": "2026-08-05", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725552700, "date": "2026-08-06", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725552701, "date": "2026-08-06", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725552702, "date": "2026-08-06", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725552703, "date": "2026-08-06", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725552704, "date": "2026-08-06", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725557473, "date": "2026-08-07", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725557474, "date": "2026-08-07", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725557475, "date": "2026-08-07", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725557476, "date": "2026-08-07", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725557477, "date": "2026-08-07", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725561664, "date": "2026-08-08", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725561665, "date": "2026-08-08", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725561667, "date": "2026-08-08", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725561668, "date": "2026-08-08", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725561669, "date": "2026-08-08", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725565718, "date": "2026-08-09", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725565719, "date": "2026-08-09", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725565720, "date": "2026-08-09", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725565721, "date": "2026-08-09", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725565722, "date": "2026-08-09", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725569753, "date": "2026-08-10", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725569754, "date": "2026-08-10", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725569755, "date": "2026-08-10", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725569756, "date": "2026-08-10", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725569757, "date": "2026-08-10", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725573519, "date": "2026-08-11", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725573520, "date": "2026-08-11", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725573521, "date": "2026-08-11", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725573522, "date": "2026-08-11", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725573523, "date": "2026-08-11", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725577725, "date": "2026-08-12", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725577726, "date": "2026-08-12", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725577727, "date": "2026-08-12", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725577728, "date": "2026-08-12", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725577729, "date": "2026-08-12", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725582019, "date": "2026-08-13", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725582020, "date": "2026-08-13", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725582021, "date": "2026-08-13", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725582022, "date": "2026-08-13", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725582023, "date": "2026-08-13", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725585236, "date": "2026-08-14", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725585237, "date": "2026-08-14", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725585238, "date": "2026-08-14", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725585239, "date": "2026-08-14", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725585240, "date": "2026-08-14", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725589086, "date": "2026-08-15", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725589087, "date": "2026-08-15", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725589088, "date": "2026-08-15", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725589089, "date": "2026-08-15", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725589090, "date": "2026-08-15", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725592536, "date": "2026-08-16", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725592537, "date": "2026-08-16", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725592538, "date": "2026-08-16", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725592539, "date": "2026-08-16", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725592540, "date": "2026-08-16", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" },
        { "id": 1785725596493, "date": "2026-08-17", "startTime": "06:00", "endTime": "07:00", "subject": "বাংলা", "task": "ব্যাকরণ ও সাহিত্য রিভিশন" },
        { "id": 1785725596494, "date": "2026-08-17", "startTime": "08:00", "endTime": "09:00", "subject": "ইংরেজি", "task": "গ্রামার ও ভোকাবুলারি" },
        { "id": 1785725596495, "date": "2026-08-17", "startTime": "11:00", "endTime": "12:30", "subject": "গণিত", "task": "পাটিগণিত অনুশীলন" },
        { "id": 1785725596496, "date": "2026-08-17", "startTime": "15:00", "endTime": "16:00", "subject": "সাধারণ জ্ঞান", "task": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি" },
        { "id": 1785725596497, "date": "2026-08-17", "startTime": "20:00", "endTime": "21:00", "subject": "কম্পিউটার ও দৈনন্দিন বিজ্ঞান", "task": "পূর্বের পড়া রিভিশন" }
      ],
      notes: [
        {
          "id": 1785728326261,
          "title": "আমার সোনার বাংলা",
          "body": "আমার সোনার বাংলা",
          "tag": "সাধারণ",
          "pinned": true,
          "ts": 1785728326261
        }
      ],
      customQuotes: [],
      quoteIdx: 4,
      quoteSource: "all",
      theme: "dark",
      sessions: [
        { "id": 1785676964815, "subject": "বাংলা", "start": 1785676961358, "end": 1785676964815, "duration": 1 },
        { "id": 1785728334405, "subject": "বাংলা", "start": 1785728332448, "end": 1785728334405, "duration": 1 }
      ],
      activeSession: null,
      dailyTargetMinutes: 240,
      syllabus: [],
      flashcards: [],
      quoteCarouselEnabled: true,
      quoteCarouselInterval: 15
    };
  }

  function buildDefaultRoutine(dateStr) {
    const defState = getDefaultState();
    const rows = defState.routine.filter(r => r.date === dateStr);
    if (rows.length) return rows;
    const template = [
      { startTime: '06:00', endTime: '07:00', subject: 'বাংলা', task: 'ব্যাকরণ ও সাহিত্য রিভিশন' },
      { startTime: '08:00', endTime: '09:00', subject: 'ইংরেজি', task: 'গ্রামার ও ভোকাবুলারি' },
      { startTime: '11:00', endTime: '12:30', subject: 'গণিত', task: 'পাটিগণিত অনুশীলন' },
      { startTime: '15:00', endTime: '16:00', subject: 'সাধারণ জ্ঞান', task: 'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি' },
      { startTime: '20:00', endTime: '21:00', subject: 'কম্পিউটার ও দৈনন্দিন বিজ্ঞান', task: 'পূর্বের পড়া রিভিশন' },
    ];
    return template.map((t, i) => ({ id: Date.now() + i, date: dateStr, ...t }));
  }

  function buildDefaultNotes() {
    return getDefaultState().notes;
  }

  const ownQuotes = [
    'লক্ষ্যে পৌঁছানোর আগে থামা যাবে না।',
    'আজকের পরিশ্রমই আগামীর ফলাফল।',
    'হাজারো ব্যর্থতা একটি সফলতার গল্প তৈরি করে।',
    'ধৈর্য আর নিয়মিত অধ্যবসায়ই সাফল্যের মূল চাবিকাঠি।',
    'নিজের সাথে প্রতিযোগিতা করো, গতকালের চেয়ে আজ ভালো হও।',
    'স্বপ্ন দেখা বন্ধ করো না, প্রস্তুতি বন্ধ করো না।',
    'প্রতিটি ভোর একটি নতুন সুযোগ নিয়ে আসে।',
    'যে পরিশ্রম করে, সময় তার পক্ষেই কথা বলে।',
    'ছোট ছোট অগ্রগতিই একদিন বড় সাফল্যে রূপ নেয়।',
    'নিজেকে বিশ্বাস করো, বাকিটা প্রস্তুতি ঠিক করে দেবে।',
    'আজ যা রোপণ করবে, আগামীকাল তাই ফসল হয়ে ফিরবে।',
    'সময়ের সঙ্গে দৌড়াও, সময়ের অপেক্ষায় থেকোবিধা নাই।',
    'একটুখানি অগ্রগতিও অগ্রগতি — থেমে থেকো না।',
    'নিজের সীমাবদ্ধতাকে অজুহাত না বানিয়ে শক্তি বানাও।',
    'কঠিন পথই সবচেয়ে ভালো শিক্ষক।',
    'আজকের কষ্টটাই আগামীর গর্বের কারণ হবে।',
    'মনোযোগ ধরে রাখো, ফলাফল নিজেই কথা বলবে।',
    'প্রতিটি প্রচেষ্টা তোমাকে লক্ষ্যের কাছাকাছি নিয়ে যায়।',
  ];

  const famousQuotes = [
    { q: 'তুমি পারবে এটা বিশ্বাস করো, তাহলে অর্ধেক পথ তুমি এমনিতেই পার হয়ে যাবে।', a: 'থিওডোর রুজভেল্ট' },
    { q: 'সাফল্য আসলে প্রতিদিনের ছোট ছোট চেষ্টার সমষ্টি।', a: 'রবার্ট কলিয়ার' },
    { q: 'ভবিষ্যৎ অনুমান করার সবচেয়ে ভালো উপায় হলো নিজেই তা তৈরি করা।', a: 'আব্রাহাম লিংকন' },
    { q: 'যা তুমি করতে পারো না, তা যেন যা করতে পারো তার পথে বাধা না হয়।', a: 'জন উডেন' },
    { q: 'বড় কিছু করার একমাত্র উপায় হলো নিজের কাজকে ভালোবাসা।', a: 'স্টিভ জবস' },
    { q: 'যেখানে আছ সেখান থেকেই শুরু করো, যা আছে তাই দিয়ে কাজ করো, যতটুকু পারো ততটুকুই করো।', a: 'আর্থার অ্যাশ' },
    { q: 'প্রস্তুতি, কঠোর পরিশ্রম, আর ব্যর্থতা থেকে শেখাই সাফল্যের মূল রহস্য।', a: 'কলিন পাওয়েল' },
    { q: 'এগিয়ে যাওয়ার গোপন রহস্য হলো শুরু করা।', a: 'মার্ক টোয়েইন' },
    { q: 'কঠোর পরিশ্রমের কোনো বিকল্প নেই।', a: 'টমাস এডিসন' },
    { q: 'সাফল্য হলো একটি সার্থক লক্ষ্যের দিকে ধাপে ধাপে এগিয়ে যাওয়া।', a: 'আর্ল নাইটিঙ্গেল' },
    { q: 'যে মানুষ কখনো ভুল করেনি, সে কখনো নতুন কিছু চেষ্টাও করেনি।', a: 'আলবার্ট আইনস্টাইন' },
    { q: 'পৃথিবী বদলে দেওয়ার সবচেয়ে শক্তিশালী অস্ত্র হলো শিক্ষা।', a: 'নেলসন ম্যান্ডেলা' },
    { q: 'পরিশ্রম কখনো বৃথা যায় না।', a: 'এ.পি.জে আবদুল কালাম' },
    { q: 'ধৈর্য আর অধ্যবসায়ের এক জাদুকরী শক্তি আছে, যার সামনে সব বাধা মিলিয়ে যায়।', a: 'জন কুইন্সি অ্যাডামস' },
    { q: 'তুমি যতটা ভাবো তার চেয়েও সাহসী, যতটা মনে হয় তার চেয়েও শক্তিশালী, আর যতটা মনে করো তার চেয়েও বুদ্ধিমান।', a: 'এ. এ. মিলন' },
    { q: 'আমরা যা বারবার করি, তাই আমরা। তাই উৎকর্ষ কোনো কাজ নয়, এটা একটা অভ্যাস।', a: 'অ্যারিস্টটল' },
    { q: 'শুরু করার উপায় হলো কথা বলা বন্ধ করে কাজ শুরু করা।', a: 'ওয়াল্ট ডিজনি' },
    { q: 'তুমি পারবে ভাবো বা না পারবে ভাবো — দুটোই ঠিক।', a: 'হেনরি ফোর্ড' },
    { q: 'সাফল্য চূড়ান্ত নয়, ব্যর্থতা মারাত্মক নয় — এগিয়ে যাওয়ার সাহসটাই আসল।', a: 'উইনস্টন চার্চিল' },
    { q: 'আমি বারবার ব্যর্থ হয়েছি জীবনে, আর সেজন্যই আমি সফল হয়েছি।', a: 'মাইকেল জর্ডান' },
    { q: 'তুমি বহুবার হারতে পারো, কিন্তু হার মেনে নিতে পারো না।', a: 'মায়া অ্যাঞ্জেলো' },
    { q: 'ভবিষ্যৎ তাদেরই, যারা নিজেদের স্বপ্নের সৌন্দর্যে বিশ্বাস করে।', a: 'এলিনর রুজভেল্ট' },
    { q: 'শুরু করার জন্য সেরা হতে হয় না, কিন্তু সেরা হতে হলে শুরু করতেই হয়।', a: 'জিগ জিগলার' },
    { q: 'পড়ে যাওয়াটা বিষয় নয়, আবার উঠে দাঁড়ানোটাই আসল বিষয়।', a: 'ভিন্স লম্বার্ডি' },
    { q: 'সাফল্য মাপা হয় কতটা বাধা পেরিয়েছ তা দিয়ে, কতটা উঁচুতে পৌঁছেছ তা দিয়ে নয়।', a: 'বুকার টি. ওয়াশিংটন' },
    { q: 'তুমি কত ধীরে যাচ্ছ তা বড় কথা নয়, থামছো না এটাই আসল।', a: 'কনফুসিয়াস' },
    { q: 'মন যা কল্পনা করতে আর বিশ্বাস করতে পারে, তা অর্জনও করতে পারে।', a: 'নেপোলিয়ন হিল' },
  ];

  function normalizeCustomQuotes(quotes) {
    if (!Array.isArray(quotes)) return [];
    return quotes.map((q, i) => {
      if (typeof q === 'string') {
        const text = q.trim();
        return text ? { id: Date.now() + i + 1000, text, author: null, source: 'custom' } : null;
      }
      if (q && typeof q === 'object') {
        const text = typeof q.text === 'string' ? q.text.trim() : (typeof q.q === 'string' ? q.q.trim() : '');
        const author = typeof q.author === 'string' ? q.author : (typeof q.a === 'string' ? q.a : null);
        if (!text) return null;
        return { id: q.id || Date.now() + i + 2000, text, author, source: q.source === 'famous' ? 'famous' : 'custom' };
      }
      return null;
    }).filter(Boolean);
  }

  let state = {
    routine: null, notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: 'dark',
    sessions: [], activeSession: null, dailyTargetMinutes: 240,
    syllabus: [], flashcards: [],
    quoteCarouselEnabled: true, quoteCarouselInterval: 6
  };
  let saveTimer = null;
  let tickInterval = null;

  let currentViewMonth = new Date().getMonth();
  let currentViewYear = new Date().getFullYear();

  function bnDate() {
    const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    return days[new Date().getDay()];
  }

  async function loadData() {
    try {
      const res = await storageAdapter.get(STORAGE_KEY);
      if (res && res.value) {
        const p = JSON.parse(res.value);
        state.routine = Array.isArray(p.routine) && p.routine.length ? migrateRoutine(p.routine) : getDefaultState().routine;
        state.notes = Array.isArray(p.notes) && p.notes.length ? p.notes : getDefaultState().notes;
        state.customQuotes = normalizeCustomQuotes(Array.isArray(p.customQuotes) ? p.customQuotes : []);
        state.quoteIdx = typeof p.quoteIdx === 'number' ? p.quoteIdx : 4;
        state.quoteSource = p.quoteSource || 'all';
        state.theme = p.theme === 'light' ? 'light' : 'dark';
        state.sessions = Array.isArray(p.sessions) && p.sessions.length ? p.sessions : getDefaultState().sessions;
        state.activeSession = p.activeSession || null;
        state.dailyTargetMinutes = typeof p.dailyTargetMinutes === 'number' ? p.dailyTargetMinutes : 240;
        state.syllabus = Array.isArray(p.syllabus) ? p.syllabus : [];
        state.flashcards = Array.isArray(p.flashcards) ? p.flashcards : [];
        state.quoteCarouselEnabled = typeof p.quoteCarouselEnabled === 'boolean' ? p.quoteCarouselEnabled : true;
        state.quoteCarouselInterval = typeof p.quoteCarouselInterval === 'number' ? p.quoteCarouselInterval : 15;
      } else {
        const def = getDefaultState();
        state = { ...state, ...def };
        saveData();
      }
    } catch (e) {
      const def = getDefaultState();
      state = { ...state, ...def };
    }
    document.documentElement.setAttribute('data-theme', state.theme);
    const themeToggle = document.getElementById('themeToggle');
    const themeIconSpan = document.getElementById('themeIconSpan');
    if (themeIconSpan) {
      themeIconSpan.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    } else if (themeToggle) {
      themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    }
  }

  function migrateRoutine(rows) {
    const today = dateKey(Date.now());
    return rows.map((r, i) => {
      if (r.date && (r.startTime !== undefined)) return { id: r.id || (Date.now() + i), ...r };
      return {
        id: r.id || (Date.now() + i),
        date: r.date || today,
        startTime: r.startTime || r.time || '',
        endTime: r.endTime || '',
        subject: r.subject || '',
        task: r.task || ''
      };
    });
  }

  // ===== Toast Notification =====
  function showToast(msg, isError = false) {
    let toast = document.getElementById('toastContainer');
    if (!toast) {
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

  // ===== IndexedDB File System Handle Storage =====
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('JobPrepDB', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function getStoredFileHandle() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readonly');
        const req = tx.objectStore('handles').get('autoBackupHandle');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }
  async function setStoredFileHandle(handle) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readwrite');
        const req = tx.objectStore('handles').put(handle, 'autoBackupHandle');
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) { return false; }
  }

  // ===== Auto Backup File System Controller =====
  let autoBackupHandle = null;

  async function updateAutoSyncUI() {
    const badge = document.getElementById('autoSyncStatusBadge');
    const dot = document.getElementById('autoSyncDot');
    const text = document.getElementById('autoSyncStatusText');
    if (!badge || !dot || !text) return;

    if (autoBackupHandle) {
      try {
        const options = { mode: 'readwrite' };
        if ((await autoBackupHandle.queryPermission(options)) === 'granted') {
          badge.classList.add('active');
          dot.classList.add('active');
          text.textContent = 'অটো-ব্যাকআপ সক্রিয় (' + autoBackupHandle.name + ')';
          return;
        }
      } catch (e) { }
      badge.classList.remove('active');
      dot.classList.remove('active');
      text.textContent = 'পারমিশন প্রয়োজন (' + autoBackupHandle.name + ')';
    } else {
      badge.classList.remove('active');
      dot.classList.remove('active');
      text.textContent = 'সংযুক্ত নেই';
    }
  }

  async function initAutoSync() {
    autoBackupHandle = await getStoredFileHandle();
    updateAutoSyncUI();
  }

  async function writeToAutoBackupFile() {
    if (!autoBackupHandle) return;
    try {
      const options = { mode: 'readwrite' };
      if ((await autoBackupHandle.queryPermission(options)) !== 'granted') {
        if ((await autoBackupHandle.requestPermission(options)) !== 'granted') {
          updateAutoSyncUI();
          return;
        }
      }
      const writable = await autoBackupHandle.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      updateAutoSyncUI();
    } catch (e) {
      console.warn('Auto backup write failed:', e);
    }
  }

  async function connectAutoSyncFile() {
    if (!('showSaveFilePicker' in window)) {
      showToast('আপনার ব্রাউজারে File System Access API সমর্থিত নয়। অনুগ্রহ করে আপডেটড Chrome বা Edge ব্যবহার করুন।', true);
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'chakri-prostuti-backup.json',
        types: [{
          description: 'JSON Backup File',
          accept: { 'application/json': ['.json'] }
        }]
      });
      autoBackupHandle = handle;
      await setStoredFileHandle(handle);
      await writeToAutoBackupFile();
      updateAutoSyncUI();
      showToast('মাদার ফোল্ডারে অটো ব্যাকআপ ফাইল সফলভাবে সংযুক্ত হয়েছে! ✓');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('ফাইল সংযুক্ত করতে সমস্যা হয়েছে।', true);
      }
    }
  }

  function saveData() {
    clearTimeout(saveTimer);
    const note = document.getElementById('routineSaveNote');
    saveTimer = setTimeout(async () => {
      try {
        await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
        if (note) { note.textContent = 'সংরক্ষণ হয়েছে ✓'; setTimeout(() => { note.textContent = 'তোমার পরিবর্তন নিজে থেকেই সংরক্ষণ হয়ে যাবে।'; }, 1600); }
        await writeToAutoBackupFile();
      } catch (e) {
        if (note) { note.textContent = 'সংরক্ষণে সমস্যা হয়েছে, আবার চেষ্টা করো।'; }
      }
    }, 400);
  }

  // ===== Theme toggle =====
  function setTheme(newTheme) {
    state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', state.theme);
    const themeToggle = document.getElementById('themeToggle');
    const themeIconSpan = document.getElementById('themeIconSpan');
    if (themeIconSpan) {
      themeIconSpan.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    } else if (themeToggle) {
      themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    }
    syncThemeButtons();
    saveData();
  }
  function syncThemeButtons() {
    const darkBtn = document.getElementById('themeDarkBtn');
    const lightBtn = document.getElementById('themeLightBtn');
    if (darkBtn && lightBtn) {
      darkBtn.classList.toggle('active-theme', state.theme === 'dark');
      lightBtn.classList.toggle('active-theme', state.theme === 'light');
    }
  }
  document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('themeDarkBtn').addEventListener('click', () => setTheme('dark'));
  document.getElementById('themeLightBtn').addEventListener('click', () => setTheme('light'));

  // ===== Nav bar live clock =====
  const bnDigitMap = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  function toBnDigits(str) { return String(str).replace(/[0-9]/g, d => bnDigitMap[d]); }
  function updateNavClock() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    h = h % 12; if (h === 0) h = 12;
    const hh = String(h).padStart(2, '0');
    const clockEl = document.getElementById('navClock');
    if (clockEl) {
      const timeStr = toBnDigits(hh + ':' + m);
      const textSpan = clockEl.querySelector('.clock-time-text');
      if (textSpan) {
        textSpan.textContent = timeStr;
      } else {
        clockEl.textContent = timeStr;
      }
    }
  }

  // ===== Fullscreen toggle =====
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  fullscreenToggle.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    const icon = fullscreenToggle.querySelector('.control-icon');
    if (icon) {
      icon.textContent = isFs ? '⤢' : '⛶';
    } else {
      fullscreenToggle.textContent = isFs ? '⤢' : '⛶';
    }
    fullscreenToggle.title = isFs ? 'ফুলস্ক্রিন বন্ধ করো' : 'ফুলস্ক্রিন চালু করো';
  });
  document.getElementById('fullscreenToggleSettings').addEventListener('click', () => fullscreenToggle.click());

  // ===== Generic modal handling =====
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) { closeModal(closeBtn.dataset.close); return; }
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) { e.target.classList.remove('open'); }
  });
  // Notes, flashcards and syllabus use always-visible entry forms.

  // ===== Tabs =====
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ===== Routine =====
  const routineCardWrap = document.getElementById('routineCardWrap');
  let routineDateFilter = dateKey(Date.now());

  function initMonthDropdown() {
    const sel = document.getElementById('monthDropdown');
    if (!sel) return;
    const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    let html = '';
    const baseYear = new Date().getFullYear();
    for (let y = baseYear - 1; y <= baseYear + 2; y++) {
      for (let m = 0; m < 12; m++) {
        const val = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${bnMonths[m]} ${toBnDigits(y)}`;
        const selected = (y === currentViewYear && m === currentViewMonth) ? 'selected' : '';
        html += `<option value="${val}" ${selected}>${label}</option>`;
      }
    }
    sel.innerHTML = html;
  }

  const monthDropdownSel = document.getElementById('monthDropdown');
  if (monthDropdownSel) {
    monthDropdownSel.addEventListener('change', (e) => {
      const [y, m] = e.target.value.split('-');
      currentViewYear = parseInt(y);
      currentViewMonth = parseInt(m) - 1;

      const now = new Date();
      if (now.getFullYear() === currentViewYear && now.getMonth() === currentViewMonth) {
        routineDateFilter = dateKey(now.getTime());
      } else {
        routineDateFilter = dateKey(new Date(currentViewYear, currentViewMonth, 1).getTime());
      }
      renderDateSlider();
      renderRoutine();
    });
  }

  function buildDateSliderList() {
    if (!Array.isArray(state.routine)) return [];
    const dates = new Set(state.routine.map(r => r.date).filter(Boolean));
    dates.add(dateKey(Date.now()));
    if (routineDateFilter) dates.add(routineDateFilter);
    return Array.from(dates).sort();
  }

  function renderDateSlider() {
    const box = document.getElementById('dateSlider');
    if (!box) return;
    const dayLabels = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    let html = '';
    buildDateSliderList().forEach(ds => {
      const d = new Date(ds + 'T00:00:00');
      html += `<div class="date-chip ${routineDateFilter === ds ? 'active' : ''}" data-date="${ds}">
        <span class="dc-day">${dayLabels[d.getDay()]}</span><span class="dc-num">${toBnDigits(d.getDate())}</span>
      </div>`;
    });
    box.innerHTML = html;

    const activeChip = box.querySelector('.date-chip.active');
    if (activeChip) activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  const dateSliderBox = document.getElementById('dateSlider');
  if (dateSliderBox) {
    dateSliderBox.addEventListener('click', (e) => {
      const chip = e.target.closest('.date-chip');
      if (!chip) return;
      routineDateFilter = chip.dataset.date || null;
      renderDateSlider();
      renderRoutine();
    });
  }

  function shiftRoutineDate(delta) {
    const base = routineDateFilter || dateKey(Date.now());
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    routineDateFilter = dateKey(d.getTime());

    if (d.getMonth() !== currentViewMonth || d.getFullYear() !== currentViewYear) {
      currentViewMonth = d.getMonth();
      currentViewYear = d.getFullYear();
      const sel = document.getElementById('monthDropdown');
      if (sel) sel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
    }

    renderDateSlider();
    renderRoutine();
  }

  const prevDateBtn = document.getElementById('datePrevBtn');
  if (prevDateBtn) prevDateBtn.addEventListener('click', () => shiftRoutineDate(-1));

  const nextDateBtn = document.getElementById('dateNextBtn');
  if (nextDateBtn) nextDateBtn.addEventListener('click', () => shiftRoutineDate(1));

  const ROUTINE_HEAD = '<thead><tr><th style="width:16%">শুরু</th><th style="width:16%">শেষ</th><th style="width:26%">বিষয়</th><th>কী পড়বে</th><th style="width:40px"></th></tr></thead>';

  function routineRowHtml(row) {
    return `
      <tr>
        <td><input type="time" value="${row.startTime || ''}" data-field="startTime" data-id="${row.id}"></td>
        <td><input type="time" value="${row.endTime || ''}" data-field="endTime" data-id="${row.id}"></td>
        <td><input type="text" value="${escapeAttr(row.subject || '')}" placeholder="বিষয়" data-field="subject" data-id="${row.id}"></td>
        <td><input type="text" value="${escapeAttr(row.task || '')}" placeholder="কী পড়বে" data-field="task" data-id="${row.id}"></td>
        <td><button class="del-row" title="মুছুন" data-id="${row.id}">✕</button></td>
      </tr>
    `;
  }

  function renderTrackerRoutinePreview() {
    const box = document.getElementById('trackerRoutinePreview');
    if (!box) return;

    const today = state.sessions.filter(s => dateKey(s.start) === todayKey());
    const byTotal = {};
    today.forEach(s => { byTotal[s.subject] = (byTotal[s.subject] || 0) + s.duration; });
    const entries = Object.entries(byTotal).sort((a, b) => b[1] - a[1]).slice(0, 4);

    if (!entries.length) {
      box.innerHTML = '<div class="tracker-routine-title">আজকের বিষয়ভিত্তিক সময়</div><div class="empty-state">আজও কোনো সেশন নেই।</div>';
      return;
    }

    const max = Math.max(...entries.map(([, min]) => min));
    const rowsHtml = entries.map(([subj, min]) => `
      <div class="tracker-routine-item">
        <div class="tracker-routine-details">
          <div class="tracker-routine-subject-row">
            <span class="tracker-routine-subject">${escapeHtml(subj)}</span>
            <span class="tracker-routine-time">${fmtHM(min)}</span>
          </div>
          <div class="tracker-routine-progress">
            <div class="tracker-routine-track">
              <div class="tracker-routine-fill" style="width:${Math.round((min / max) * 100)}%"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    box.innerHTML = `<div class="tracker-routine-title">আজকের বিষয়ভিত্তিক সময়</div>${rowsHtml}`;
  }

  function renderRoutine() {
    const wrap = document.getElementById('routineCardWrap');
    if (!wrap) return;
    if (!Array.isArray(state.routine)) state.routine = [];

    if (routineDateFilter === null) {
      const byDate = {};
      state.routine.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });
      const dates = Object.keys(byDate).sort().reverse();
      if (!dates.length) {
        wrap.innerHTML = '<div class="empty-state" style="border:none; margin:16px;">এখনও কোনো রুটিন এন্ট্রি নেই।</div>';
        return;
      }
      wrap.innerHTML = dates.map(ds => {
        const rows = byDate[ds].slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        return `
          <div class="routine-date-group">
            <div class="routine-date-heading">${bnDateLabel(ds)}</div>
            <table class="routine">
              ${ROUTINE_HEAD}
              <tbody>${rows.map(routineRowHtml).join('')}</tbody>
            </table>
          </div>
        `;
      }).join('');
      return;
    }

    const todayTarget = routineDateFilter || dateKey(Date.now());
    let rows = state.routine.filter(r => r.date === todayTarget);

    if (!rows.length) {
      const defaults = buildDefaultRoutine(todayTarget);
      state.routine.push(...defaults);
      rows = defaults;
      saveData();
    }

    rows.sort((a, b) => {
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB) || a.id - b.id;
    });

    wrap.innerHTML = `<table class="routine">${ROUTINE_HEAD}<tbody>${rows.map(routineRowHtml).join('')}</tbody></table>`;
    renderTrackerRoutinePreview();
  }

  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }
  function bnDateLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return toBnDigits(d.getDate()) + '/' + toBnDigits(d.getMonth() + 1) + '/' + toBnDigits(d.getFullYear());
  }

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.closest('#routineCardWrap') && t.dataset.field) {
      if (!Array.isArray(state.routine)) state.routine = [];
      const row = state.routine.find(r => String(r.id) === t.dataset.id);
      if (row) {
        row[t.dataset.field] = t.value;
        if (t.dataset.field === 'subject') {
          renderFlashCategoryOptions();
          renderSubjectSelect();
        }
        saveData();
      }
    }
  });

  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.del-row');
    if (delBtn && delBtn.closest('#routineCardWrap')) {
      if (!Array.isArray(state.routine)) state.routine = [];
      state.routine = state.routine.filter(r => String(r.id) !== delBtn.dataset.id);
      saveData();
      renderRoutine();
      renderDateSlider();
      renderFlashCategoryOptions();
      renderSubjectSelect();
      return;
    }

    if (e.target && (e.target.id === 'inlineAddRowBtn' || e.target.closest('#inlineAddRowBtn'))) {
      const date = routineDateFilter || dateKey(Date.now());
      if (!Array.isArray(state.routine)) state.routine = [];
      state.routine.push({
        id: Date.now(),
        date: date,
        startTime: '',
        endTime: '',
        subject: '',
        task: ''
      });
      saveData();
      renderRoutine();
      renderFlashCategoryOptions();
      renderSubjectSelect();
      showToast('নতুন সময় সারিতে যোগ করা হয়েছে');
      return;
    }

    if (e.target && (e.target.id === 'resetRoutineBtn' || e.target.closest('#resetRoutineBtn'))) {
      const date = routineDateFilter || dateKey(Date.now());
      if (!Array.isArray(state.routine)) state.routine = [];
      state.routine = state.routine.filter(r => r.date !== date);
      state.routine.push(...buildDefaultRoutine(date));
      saveData();
      renderDateSlider();
      renderRoutine();
      renderFlashCategoryOptions();
      renderSubjectSelect();
      showToast('আজকের দিনের রুটিন রিসেট করা হয়েছে');
      return;
    }
  });

  function showMonthlyRoutines() {
    const box = document.getElementById('monthlyRoutineView');
    if (!box) return;
    const prefix = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}-`;
    const byDate = state.routine.filter(r => r.date && r.date.startsWith(prefix)).reduce((map, row) => {
      (map[row.date] ||= []).push(row); return map;
    }, {});
    const dates = Object.keys(byDate).sort();
    box.hidden = false;
    box.innerHTML = dates.length ? dates.map(date => {
      const rows = byDate[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return `<article class="monthly-routine-card" data-month-date="${date}">
        <div class="monthly-routine-head"><strong>${bnDateLabel(date)}</strong>
          <div class="monthly-routine-actions"><button class="pill" data-month-edit="${date}">✎ এডিট</button><button class="pill danger" data-month-delete="${date}">✕ মুছুন</button></div>
        </div><table class="mini-routine"><tbody>${rows.map(r => `<tr><td>${escapeHtml(r.startTime || '--:--')}–${escapeHtml(r.endTime || '--:--')}</td><td>${escapeHtml(r.subject || 'বিষয় নেই')}</td><td>${escapeHtml(r.task || '')}</td></tr>`).join('')}</tbody></table>
      </article>`;
    }).join('') : '<div class="empty-state">এই মাসে কোনো রুটিন সংরক্ষিত নেই।</div>';
  }

  const todayRoutineBtn = document.getElementById('todayRoutineBtn');
  if (todayRoutineBtn) {
    todayRoutineBtn.addEventListener('click', () => {
      const now = new Date(); currentViewYear = now.getFullYear(); currentViewMonth = now.getMonth(); routineDateFilter = dateKey(now.getTime());
      const mSel = document.getElementById('monthDropdown');
      if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
      const mBox = document.getElementById('monthlyRoutineView');
      if (mBox) mBox.hidden = true;
      renderDateSlider(); renderRoutine();
    });
  }

  const monthlyRoutineBtn = document.getElementById('monthlyRoutineBtn');
  if (monthlyRoutineBtn) monthlyRoutineBtn.addEventListener('click', showMonthlyRoutines);

  const monthlyRoutineView = document.getElementById('monthlyRoutineView');
  if (monthlyRoutineView) {
    monthlyRoutineView.addEventListener('click', (e) => {
      const edit = e.target.closest('[data-month-edit]'); const del = e.target.closest('[data-month-delete]');
      if (edit) {
        const d = new Date(edit.dataset.monthEdit + 'T00:00:00'); routineDateFilter = edit.dataset.monthEdit; currentViewYear = d.getFullYear(); currentViewMonth = d.getMonth();
        const mSel = document.getElementById('monthDropdown');
        if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
        monthlyRoutineView.hidden = true; renderDateSlider(); renderRoutine();
      }
      if (del && window.confirm('এই দিনের সব রুটিন মুছে ফেলতে চাও?')) { state.routine = state.routine.filter(r => r.date !== del.dataset.monthDelete); saveData(); renderDateSlider(); renderRoutine(); showMonthlyRoutines(); }
    });
  }

  // ===== Quotes =====
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const wpTagEl = document.getElementById('wpTag');

  function currentPool() {
    const own = ownQuotes.concat(state.customQuotes.map(q => q.text || '')).map(q => typeof q === 'string' ? { q, a: null } : { q: q.text || '', a: q.author || null });
    if (state.quoteSource === 'own') return own;
    if (state.quoteSource === 'famous') return famousQuotes;
    return own.concat(famousQuotes);
  }

  function quoteManagerEntries() {
    const customEntries = state.customQuotes.map(q => ({ id: q.id, text: q.text, author: q.author || null, source: 'custom' }));
    const ownEntries = ownQuotes.map((q, i) => ({ id: `own-${i}`, text: q, author: null, source: 'own' }));
    const famousEntries = famousQuotes.map((q, i) => ({ id: `famous-${i}`, text: q.q, author: q.a, source: 'famous' }));
    return [...ownEntries, ...customEntries, ...famousEntries];
  }

  function renderQuote() {
    if (!quoteTextEl || !quoteAuthorEl || !wpTagEl) return;
    const pool = currentPool();
    if (!pool.length) return;
    if (state.quoteIdx >= pool.length) state.quoteIdx = 0;
    const item = pool[state.quoteIdx];
    quoteTextEl.textContent = item.q;
    quoteAuthorEl.textContent = item.a ? '— ' + item.a : bnDate() + ' • প্রস্তুতি চলছে';
    wpTagEl.textContent = item.a ? 'বিখ্যাত ব্যক্তিদের উক্তি' : 'নিজের সংগ্রহ';
    updateTicker(item.a ? item.q + ' — ' + item.a : item.q);
    renderQuoteManager();
  }

  function renderQuoteManager() {
    const list = document.getElementById('quoteManagerList');
    if (!list) return;
    list.innerHTML = quoteManagerEntries().map(entry => {
      const isCustom = entry.source === 'custom';
      const text = entry.author ? `${escapeHtml(entry.text)} — ${escapeHtml(entry.author)}` : escapeHtml(entry.text);
      return `
        <div class="quote-manager-item">
          <div>
            <strong>${text}</strong>
            <span>${entry.source === 'famous' ? 'বিখ্যাত' : (entry.source === 'custom' ? 'নিজের যোগ করা' : 'নিজের সংগ্রহ')}</span>
          </div>
          <div class="quote-manager-actions">
            <button data-edit-quote="${entry.id}" type="button">এডিট</button>
            ${isCustom ? `<button data-delete-quote="${entry.id}" type="button">মুছুন</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateTicker(text) {
    const el = document.getElementById('tickerText');
    if (!el) return;
    el.classList.add('fade');
    setTimeout(() => { el.textContent = text; el.classList.remove('fade'); }, 220);
  }

  const sourceSwitch = document.getElementById('sourceSwitch');
  if (sourceSwitch) {
    sourceSwitch.addEventListener('click', (e) => {
      if (!e.target.classList.contains('chip')) return;
      sourceSwitch.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.quoteSource = e.target.dataset.src;
      state.quoteIdx = 0;
      renderQuote(); saveData();
    });
  }

  function nextQuote() {
    const pool = currentPool();
    if (!pool.length) return;
    let next;
    do { next = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && next === state.quoteIdx);
    state.quoteIdx = next;
    renderQuote(); saveData();
  }
  const shuffleBtn = document.getElementById('shuffleBtn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', nextQuote);
  }

  // ===== Quote auto-carousel (Settings-controlled) =====
  let quoteCarouselTimer = null;
  function startQuoteCarousel() {
    clearInterval(quoteCarouselTimer);
    if (state.quoteCarouselEnabled) {
      quoteCarouselTimer = setInterval(nextQuote, (state.quoteCarouselInterval || 6) * 1000);
    }
  }
  function syncCarouselControls() {
    const toggleBtn = document.getElementById('carouselToggleBtn');
    const intervalSel = document.getElementById('carouselIntervalSelect');
    if (toggleBtn) {
      toggleBtn.textContent = state.quoteCarouselEnabled ? 'চালু আছে' : 'বন্ধ আছে';
      toggleBtn.classList.toggle('solid', state.quoteCarouselEnabled);
    }
    if (intervalSel) {
      intervalSel.value = String(state.quoteCarouselInterval || 6);
    }
  }
  const carouselToggleBtn = document.getElementById('carouselToggleBtn');
  if (carouselToggleBtn) {
    carouselToggleBtn.addEventListener('click', () => {
      state.quoteCarouselEnabled = !state.quoteCarouselEnabled;
      syncCarouselControls();
      startQuoteCarousel();
      saveData();
    });
  }
  const carouselIntervalSelect = document.getElementById('carouselIntervalSelect');
  if (carouselIntervalSelect) {
    carouselIntervalSelect.addEventListener('change', (e) => {
      state.quoteCarouselInterval = parseInt(e.target.value, 10) || 6;
      startQuoteCarousel();
      saveData();
    });
  }

  const quoteManagerList = document.getElementById('quoteManagerList');
  if (quoteManagerList) {
    quoteManagerList.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-quote]');
      const deleteBtn = e.target.closest('[data-delete-quote]');
      if (editBtn) {
        const id = editBtn.dataset.editQuote;
        const entry = quoteManagerEntries().find(item => item.id === id);
        if (!entry) return;
        const currentText = entry.author ? `${entry.text} — ${entry.author}` : entry.text;
        const nextValue = window.prompt('উক্তি সম্পাদনা করুন:', currentText);
        if (nextValue === null) return;
        const trimmed = nextValue.trim();
        if (!trimmed) return;
        const parts = trimmed.split('—').map(item => item.trim());
        const text = parts[0] || trimmed;
        const author = parts.length > 1 ? parts[1] : null;
        if (entry.source === 'custom') {
          const target = state.customQuotes.find(item => item.id === id);
          if (target) {
            target.text = text;
            target.author = author;
          }
        } else {
          state.customQuotes.push({ id: Date.now(), text, author, source: 'custom' });
        }
        renderQuote(); saveData();
      }
      if (deleteBtn) {
        const id = deleteBtn.dataset.deleteQuote;
        state.customQuotes = state.customQuotes.filter(item => item.id !== id);
        renderQuote(); saveData();
      }
    });
  }

  const addQuoteBtn = document.getElementById('addQuoteBtn');
  if (addQuoteBtn) {
    addQuoteBtn.addEventListener('click', () => {
      const ta = document.getElementById('customQuoteInput');
      const val = ta ? ta.value.trim() : '';
      if (!val) return;
      state.customQuotes.push({ id: Date.now(), text: val, author: null, source: 'custom' });
      if (ta) ta.value = '';
      const currentSourceSwitch = document.getElementById('sourceSwitch');
      if (currentSourceSwitch) {
        currentSourceSwitch.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        const ownChip = currentSourceSwitch.querySelector('.chip[data-src="own"]');
        if (ownChip) ownChip.classList.add('active');
      }
      state.quoteSource = 'own';
      state.quoteIdx = ownQuotes.length + state.customQuotes.length - 1;
      renderQuote(); saveData();
    });
  }

  // ===== Wallpaper export (1920x1080 desktop ratio) =====
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        await document.fonts.load('700 60px "Baloo Da 2"');
        await document.fonts.load('400 30px "Hind Siliguri"');
        await document.fonts.ready;
      } catch (e) { }

      const canvas = document.getElementById('exportCanvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const dark = state.theme === 'dark';

      const grad = ctx.createLinearGradient(0, 0, W, H);
      if (dark) { grad.addColorStop(0, '#151233'); grad.addColorStop(1, '#0A2A3A'); }
      else { grad.addColorStop(0, '#EDE9FF'); grad.addColorStop(1, '#DFF7F1'); }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      function blob(x, y, r, color, alpha) {
        ctx.save(); ctx.globalAlpha = alpha;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      blob(W * 0.12, H * 0.12, 420, dark ? '#8B7CFF' : '#6E56FF', 0.5);
      blob(W * 0.9, H * 0.9, 400, dark ? '#33E0C7' : '#12B8A3', 0.45);

      const pool = currentPool();
      const item = pool[state.quoteIdx] || pool[0];

      ctx.textAlign = 'center';
      ctx.fillStyle = dark ? '#EAEEF9' : '#171A2B';
      ctx.font = '700 58px "Baloo Da 2", sans-serif';
      wrapText(ctx, item.q, W / 2, H / 2 - 30, W - 320, 78);

      ctx.fillStyle = dark ? '#9BA5C0' : '#5B6178';
      ctx.font = '400 30px "Hind Siliguri", sans-serif';
      ctx.fillText(item.a ? ('— ' + item.a) : ('চাকরি প্রস্তুতি  •  ' + bnDate()), W / 2, H - 90);

      canvas.toBlob((blobFile) => {
        const url = URL.createObjectURL(blobFile);
        const a = document.createElement('a');
        a.href = url; a.download = 'chakri-prostuti-wallpaper.png';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    });
  }

  function wrapText(ctx, text, cx, cy, maxWidth, lineHeight) {
    const words = text.split(' ');
    let lines = [], current = '';
    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
      else current = test;
    });
    if (current) lines.push(current);
    const startY = cy - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
  }

  // ===== Notes =====
  const notesGrid = document.getElementById('notesGrid');
  const noteSearch = document.getElementById('noteSearch');
  const noteFilterTag = document.getElementById('noteFilterTag');

  function filteredNotes() {
    const q = noteSearch.value.trim().toLowerCase();
    const tag = noteFilterTag.value;
    return state.notes.filter(n => {
      const matchesTag = tag === 'all' || n.tag === tag;
      const matchesQ = !q || (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q);
      return matchesTag && matchesQ;
    }).sort((a, b) => (b.pinned - a.pinned) || (b.ts - a.ts));
  }

  function renderNotes() {
    const list = filteredNotes();
    notesGrid.innerHTML = '';
    if (!list.length) {
      notesGrid.innerHTML = '<div class="empty-state">কোনো নোট পাওয়া যায়নি। উপরে লিখে নতুন নোট যোগ করো।</div>';
      return;
    }
    list.forEach(n => {
      const card = document.createElement('div');
      card.className = 'note-card glass' + (n.pinned ? ' pinned' : '');
      const d = new Date(n.ts);
      card.innerHTML = `
        <div class="note-top">
          <div>
            <h3>${escapeHtml(n.title || 'শিরোনামহীন')}</h3>
            <span class="note-tag">${escapeHtml(n.tag || 'সাধারণ')}</span>
          </div>
          <div class="note-icon-btns">
            <button class="pin-btn ${n.pinned ? 'pin-active' : ''}" title="পিন করুন" data-id="${n.id}">★</button>
            <button class="edit-btn" title="এডিট করুন" data-id="${n.id}">✎</button>
            <button class="del-btn" title="মুছুন" data-id="${n.id}">✕</button>
          </div>
        </div>
        <p>${escapeHtml(n.body || '')}</p>
        <time>${d.toLocaleDateString('bn-BD')}</time>
      `;
      notesGrid.appendChild(card);
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  notesGrid.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('del-btn')) {
      state.notes = state.notes.filter(n => String(n.id) !== id);
      renderNotes(); saveData();
    } else if (e.target.classList.contains('pin-btn')) {
      const n = state.notes.find(n => String(n.id) === id);
      if (n) { n.pinned = !n.pinned; renderNotes(); saveData(); }
    } else if (e.target.classList.contains('edit-btn')) {
      startEdit(id);
    }
  });

  function startEdit(id) {
    const n = state.notes.find(n => String(n.id) === id);
    if (!n) return;
    const card = [...notesGrid.children].find(c => c.querySelector(`[data-id="${id}"]`));
    if (!card) return;
    card.innerHTML = `
      <div class="note-edit-area">
        <input type="text" value="${escapeHtml(n.title || '')}" id="edit-title-${id}">
        <textarea rows="4" id="edit-body-${id}">${escapeHtml(n.body || '')}</textarea>
        <div class="quote-actions" style="justify-content:flex-start;">
          <button class="pill solid" data-save="${id}">সংরক্ষণ করো</button>
          <button class="pill" data-cancel="${id}">বাতিল</button>
        </div>
      </div>
    `;
    card.querySelector(`[data-save="${id}"]`).addEventListener('click', () => {
      n.title = document.getElementById(`edit-title-${id}`).value.trim();
      n.body = document.getElementById(`edit-body-${id}`).value.trim();
      renderNotes(); saveData();
    });
    card.querySelector(`[data-cancel="${id}"]`).addEventListener('click', renderNotes);
  }

  // ===== Notes Form Toggle =====
  const toggleNoteBtn = document.getElementById('toggleNoteFormBtn');
  const noteWrap = document.getElementById('noteFormWrap');
  if (toggleNoteBtn && noteWrap) {
    toggleNoteBtn.addEventListener('click', () => {
      const isOpen = noteWrap.style.display !== 'none';
      noteWrap.style.display = isOpen ? 'none' : 'block';
      toggleNoteBtn.innerHTML = isOpen ? '<span class="btn-icon">+</span> নতুন নোট লিখুন' : '✕ ফর্ম বন্ধ করুন';
      toggleNoteBtn.classList.toggle('active-open', !isOpen);
      if (!isOpen) {
        const input = document.getElementById('noteTitle');
        if (input) input.focus();
      }
    });
  }

  document.getElementById('addNoteBtn').addEventListener('click', () => {
    const titleEl = document.getElementById('noteTitle');
    const bodyEl = document.getElementById('noteBody');
    const tagEl = document.getElementById('noteTag');
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();
    if (!title && !body) return;
    state.notes.push({ id: Date.now(), title, body, tag: tagEl.value, pinned: false, ts: Date.now() });
    titleEl.value = ''; bodyEl.value = '';
    renderNotes(); saveData();

    if (noteWrap && toggleNoteBtn) {
      noteWrap.style.display = 'none';
      toggleNoteBtn.innerHTML = '<span class="btn-icon">+</span> নতুন নোট লিখুন';
      toggleNoteBtn.classList.remove('active-open');
    }
    showToast('নতুন নোট সংরক্ষিত হয়েছে!');
  });

  noteSearch.addEventListener('input', renderNotes);
  noteFilterTag.addEventListener('change', renderNotes);

  // ===== Tracker =====
  const sessionSubjectSel = document.getElementById('sessionSubject');
  const sessionCustomInput = document.getElementById('sessionCustomSubject');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerSub = document.getElementById('timerSub');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const targetHoursInput = document.getElementById('targetHours');

  function dateKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function todayKey() { return dateKey(Date.now()); }
  function fmtHM(mins) {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h > 0 ? (h + ' ঘণ্টা ' + m + ' মিনিট') : (m + ' মিনিট');
  }
  function fmtClock(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(secs % 60)).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function subjectList() {
    const defaultSubjects = ['বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান', 'দৈনন্দিন বিজ্ঞান', 'কম্পিউটার ও তথ্যপ্রযুক্তি'];
    const fromRoutine = (state.routine || []).map(r => r.subject).filter(Boolean);
    const fromSessions = (state.sessions || []).map(s => s.subject).filter(Boolean);
    return Array.from(new Set([...defaultSubjects, ...fromRoutine, ...fromSessions]));
  }

  function renderSubjectSelect() {
    const sel = document.getElementById('sessionSubject');
    if (!sel) return;
    const subs = subjectList();
    const previousValue = sel.value || (state.activeSession ? state.activeSession.subject : '') || '';
    const previousCustomValue = sessionCustomInput ? sessionCustomInput.value : '';

    sel.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')
      + '<option value="__custom__">+ নতুন বিষয়</option>';

    let nextValue = '';
    if (previousValue === '__custom__' || (previousCustomValue && previousValue === '')) {
      nextValue = '__custom__';
    } else if (previousValue && subs.includes(previousValue)) {
      nextValue = previousValue;
    } else if (subs.length) {
      nextValue = subs[0];
    }

    if (nextValue) {
      sel.value = nextValue;
    }

    if (sessionCustomInput) {
      sessionCustomInput.style.display = sel.value === '__custom__' ? 'block' : 'none';
      if (sel.value === '__custom__') {
        sessionCustomInput.value = previousCustomValue || '';
      } else {
        sessionCustomInput.value = '';
      }
    }
  }
  sessionSubjectSel.addEventListener('change', () => {
    sessionCustomInput.style.display = sessionSubjectSel.value === '__custom__' ? 'block' : 'none';
    if (sessionSubjectSel.value !== '__custom__') {
      sessionCustomInput.value = '';
    }
  });

  function currentSubjectValue() {
    if (sessionSubjectSel.value === '__custom__') return sessionCustomInput.value.trim();
    return sessionSubjectSel.value;
  }

  startBtn.addEventListener('click', () => {
    const subj = currentSubjectValue();
    if (!subj) { sessionCustomInput.style.display = 'block'; sessionCustomInput.focus(); return; }
    state.activeSession = { subject: subj, start: Date.now() };
    saveData();
    renderTrackerAll();
  });

  stopBtn.addEventListener('click', () => {
    if (!state.activeSession) return;
    const end = Date.now();
    const durationMin = Math.max(1, Math.round((end - state.activeSession.start) / 60000));
    state.sessions.push({ id: Date.now(), subject: state.activeSession.subject, start: state.activeSession.start, end, duration: durationMin });
    state.activeSession = null;
    saveData();
    renderTrackerAll();
  });


  function setDailyTarget(hours) {
    const v = parseFloat(hours);
    state.dailyTargetMinutes = isNaN(v) || v < 0 ? 240 : Math.round(v * 60);
    renderProgress();
    saveData();
  }
  targetHoursInput.addEventListener('change', () => setDailyTarget(targetHoursInput.value));
  document.getElementById('targetHoursSettings').addEventListener('change', (e) => setDailyTarget(e.target.value));

  function tickTimer() {
    if (window.isCustomCountdownActive || (window.selectedTimerDuration && window.selectedTimerDuration > 0)) return;
    const orb = document.getElementById('clockOrb');
    if (!state.activeSession) {
      timerDisplay.textContent = '00:00:00';
      timerSub.innerHTML = '';
      orb.classList.remove('active');
      return;
    }
    orb.classList.add('active');
    const secs = Math.floor((Date.now() - state.activeSession.start) / 1000);
    timerDisplay.textContent = fmtClock(secs);
    timerSub.innerHTML = '<span class="timer-dot"></span>' + escapeHtml(state.activeSession.subject) + ' পড়া চলছে';
  }

  function renderTodaySessions() {
    const box = document.getElementById('todaySessions');
    const list = state.sessions.filter(s => dateKey(s.start) === todayKey()).sort((a, b) => b.start - a.start);
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = list.map(s => {
      const st = new Date(s.start), en = new Date(s.end);
      const timeStr = st.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ' – ' + en.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const pct = Math.min(100, Math.max(8, Math.round((s.duration / Math.max(1, state.dailyTargetMinutes / 60)) * 100)));
      return `<div class="session-item">
        <div class="session-item-header">
          <div class="s-subject">${escapeHtml(s.subject)}</div>
          <div class="s-badge">${fmtHM(s.duration)}</div>
        </div>
        <div class="s-progress">
          <div class="s-progress-track">
            <div class="s-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="s-meta">${timeStr}</div>
      </div>`;
    }).join('');
  }

  function renderProgress() {
    const todayTotal = state.sessions.filter(s => dateKey(s.start) === todayKey()).reduce((a, s) => a + s.duration, 0);
    const target = state.dailyTargetMinutes || 1;
    const pct = Math.min(100, Math.round((todayTotal / target) * 100));
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressLabelLeft').textContent = fmtHM(todayTotal) + ' পড়া হয়েছে';
    document.getElementById('progressLabelRight').textContent = pct + '%';
    targetHoursInput.value = (state.dailyTargetMinutes / 60).toString();
    const settingsTargetInput = document.getElementById('targetHoursSettings');
    if (settingsTargetInput) settingsTargetInput.value = (state.dailyTargetMinutes / 60).toString();

    const verdict = document.getElementById('verdictBox');
    if (todayTotal === 0) {
      verdict.textContent = 'আজ এখনও পড়া শুরু হয়নি — শুরু করো, তুমি পারবে!';
    } else if (pct >= 100) {
      verdict.textContent = '🎉 আজকের টার্গেট পূরণ হয়েছে! দুর্দান্ত পরিশ্রম করেছ।';
    } else if (pct >= 75) {
      verdict.textContent = 'প্রায় পৌঁছে গেছ — আর একটু চেষ্টা করলেই টার্গেট পূরণ হবে।';
    } else if (pct >= 40) {
      verdict.textContent = 'ভালো শুরু হয়েছে, তবে আরও কিছুটা সময় দিতে হবে।';
    } else {
      verdict.textContent = 'আজ পড়াশোনায় সময় কম দেওয়া হয়েছে — এখনই আরেকটা সেশন শুরু করো।';
    }

    let streak = 0;
    for (let i = 1; i <= 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = dateKey(d.getTime());
      const total = state.sessions.filter(s => dateKey(s.start) === key).reduce((a, s) => a + s.duration, 0);
      if (total >= target) streak++; else break;
    }
    if (pct >= 100) streak++;
    document.getElementById('streakLine').textContent = streak > 0
      ? '🔥 টার্গেট পূরণের ধারাবাহিকতা: ' + streak + ' দিন'
      : 'ধারাবাহিকতা শুরু করো — আজই প্রথম দিন হোক!';
  }

  function renderSubjectBars() {
    const box = document.getElementById('subjectBars');
    if (!box) return;
    const today = state.sessions.filter(s => dateKey(s.start) === todayKey());
    const byTotal = {};
    today.forEach(s => { byTotal[s.subject] = (byTotal[s.subject] || 0) + s.duration; });
    const entries = Object.entries(byTotal).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { box.innerHTML = '<div class="empty-state">আজ এখনও কোনো সেশন লগ হয়নি।</div>'; return; }
    const max = Math.max(...entries.map(e => e[1]));
    box.innerHTML = entries.map(([subj, min]) => `
      <div class="subj-bar-row">
        <div class="subj-bar-label"><span>${escapeHtml(subj)}</span><span>${fmtHM(min)}</span></div>
        <div class="subj-bar-track"><div class="subj-bar-fill" style="width:${Math.round((min / max) * 100)}%"></div></div>
      </div>
    `).join('');
  }

  // ===== Customizable review period =====
  let reviewPeriod = 'week';
  let reviewCustomStart = null, reviewCustomEnd = null;

  function getReviewRange() {
    const today = new Date(); today.setHours(23, 59, 59, 999);
    let start;
    if (reviewPeriod === 'week') {
      start = new Date(today); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { start, end: today, granularity: 'day' };
    }
    if (reviewPeriod === 'month') {
      start = new Date(today); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
      return { start, end: today, granularity: 'week' };
    }
    if (reviewPeriod === 'year') {
      start = new Date(today); start.setMonth(start.getMonth() - 11); start.setDate(1); start.setHours(0, 0, 0, 0);
      return { start, end: today, granularity: 'month' };
    }
    const s = reviewCustomStart ? new Date(reviewCustomStart + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1);
    const e = reviewCustomEnd ? new Date(reviewCustomEnd + 'T23:59:59') : today;
    const days = Math.round((e - s) / 86400000) + 1;
    const granularity = days <= 31 ? 'day' : (days <= 120 ? 'week' : 'month');
    return { start: s, end: e, granularity };
  }

  function buildReviewBuckets() {
    const { start, end, granularity } = getReviewRange();
    const buckets = [];
    const dayLabels = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    const monthLabels = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুল', 'আগ', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];

    if (granularity === 'day') {
      let cur = new Date(start);
      while (cur <= end) {
        const key = dateKey(cur.getTime());
        const total = state.sessions.filter(s => dateKey(s.start) === key).reduce((a, s) => a + s.duration, 0);
        buckets.push({ label: dayLabels[cur.getDay()], total, isToday: dateKey(Date.now()) === key });
        cur.setDate(cur.getDate() + 1);
      }
    } else if (granularity === 'week') {
      let cur = new Date(start); let wk = 1;
      while (cur <= end) {
        const wkStart = new Date(cur);
        const wkEnd = new Date(cur); wkEnd.setDate(wkEnd.getDate() + 6); wkEnd.setHours(23, 59, 59, 999);
        const cappedEnd = wkEnd < end ? wkEnd : end;
        const total = state.sessions.filter(s => { const d = new Date(s.start); return d >= wkStart && d <= cappedEnd; }).reduce((a, s) => a + s.duration, 0);
        buckets.push({ label: 'স ' + toBnDigits(wk), total, isToday: false });
        cur.setDate(cur.getDate() + 7); wk++;
      }
    } else {
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
        const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59);
        const total = state.sessions.filter(s => { const d = new Date(s.start); return d >= mStart && d <= mEnd; }).reduce((a, s) => a + s.duration, 0);
        const now = new Date();
        buckets.push({ label: monthLabels[cur.getMonth()], total, isToday: cur.getFullYear() === now.getFullYear() && cur.getMonth() === now.getMonth() });
        cur.setMonth(cur.getMonth() + 1);
      }
    }
    return buckets;
  }

  function renderWeekChart() {
    const box = document.getElementById('weekChart');
    const target = state.dailyTargetMinutes || 1;
    const buckets = buildReviewBuckets();
    let maxVal = Math.max(1, target, ...buckets.map(b => b.total));
    box.innerHTML = buckets.map(b => {
      const h = Math.max(4, Math.round((b.total / maxVal) * 100));
      return `<div class="review-bar-col">
        <div class="review-bar ${b.total >= target && b.total > 0 ? 'met' : ''}" style="height:${h}%" title="${fmtHM(b.total)}"></div>
        <div class="review-bar-label">${b.label}${b.isToday ? ' •' : ''}</div>
      </div>`;
    }).join('');

    const { start, end } = getReviewRange();
    const fmt = (d) => toBnDigits(d.getDate()) + '/' + toBnDigits(d.getMonth() + 1);
    document.getElementById('reviewRangeLabel').textContent = fmt(start) + ' – ' + fmt(end);
  }

  document.getElementById('reviewPeriodSwitch').addEventListener('click', (e) => {
    if (!e.target.classList.contains('chip')) return;
    document.querySelectorAll('#reviewPeriodSwitch .chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    reviewPeriod = e.target.dataset.period;
    document.getElementById('reviewCustomRange').style.display = reviewPeriod === 'custom' ? 'flex' : 'none';
    renderWeekChart();
  });
  document.getElementById('reviewCustomApplyBtn').addEventListener('click', () => {
    reviewCustomStart = document.getElementById('reviewCustomStart').value || null;
    reviewCustomEnd = document.getElementById('reviewCustomEnd').value || null;
    renderWeekChart();
  });

  function renderTrackerAll() {
    renderSubjectSelect();
    tickTimer();
    startBtn.style.display = state.activeSession ? 'none' : 'inline-flex';
    stopBtn.style.display = state.activeSession ? 'inline-flex' : 'none';
    renderTodaySessions();
    renderProgress();
    renderSubjectBars();
    renderWeekChart();
    renderTrackerRoutinePreview();
  }

  // ===== Syllabus =====
  const categoryList = document.getElementById('categoryList');
  const openCategoryIds = new Set();

  function syllabusTotals() {
    let total = 0, done = 0;
    state.syllabus.forEach(cat => { cat.topics.forEach(t => { total++; if (t.done) done++; }); });
    return { total, done };
  }

  function renderSyllabusOverall() {
    const { total, done } = syllabusTotals();
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('syllabusOverallLabel').textContent = `${toBnDigits(done)} / ${toBnDigits(total)} টপিক শেষ হয়েছে`;
    document.getElementById('syllabusOverallPct').textContent = pct + '%';
    document.getElementById('syllabusOverallFill').style.width = pct + '%';
  }

  function renderCategories() {
    if (!state.syllabus.length) {
      categoryList.innerHTML = '<div class="empty-state">এখনও কোনো ক্যাটাগরি যোগ করা হয়নি। উপরে লিখে শুরু করো।</div>';
      renderSyllabusOverall();
      return;
    }
    categoryList.innerHTML = state.syllabus.map(cat => {
      const total = cat.topics.length;
      const done = cat.topics.filter(t => t.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const topicsHtml = cat.topics.length ? (
        '<div class="topic-tile-grid">' + cat.topics.map(t => `
          <div class="topic-tile ${t.done ? 'done' : ''}" data-cat="${cat.id}" data-topic="${t.id}">
            <span class="tile-label" data-topic-label="${t.id}" data-topic-cat="${cat.id}" title="ডাবল ক্লিক করে এডিট">${escapeHtml(t.name)}</span>
            <button class="tile-del" data-cat="${cat.id}" data-topic="${t.id}" title="মুছুন">✕</button>
          </div>
        `).join('') + '</div>'
      ) : '<div class="empty-state" style="padding:20px;">এই ক্যাটাগরিতে এখনও কোনো টপিক নেই।</div>';
      return `
        <div class="category-card glass open" data-cat="${cat.id}">
          <div class="category-head">
            <div class="category-head-left">
              <h3 class="category-title" data-category-title="${cat.id}" title="ডাবল ক্লিক করে এডিট">${escapeHtml(cat.name)}</h3>
            </div>
            <div class="category-head-right">
              <span class="category-progress-text">${toBnDigits(done)}/${toBnDigits(total)} • ${pct}%</span>
              <div class="category-mini-track"><div class="category-mini-fill" style="width:${pct}%"></div></div>
              <button class="pill subtle" data-edit-category="${cat.id}">✎ এডিট</button>
              <button class="pill subtle" data-toggle-add-topic="${cat.id}">+ টপিক যোগ</button>
              <button class="cat-del-btn" data-catdel="${cat.id}" title="ক্যাটাগরি মুছুন">✕</button>
            </div>
          </div>
          <div class="category-body">
            ${topicsHtml}
            <div class="add-topic-row" data-topic-form="${cat.id}" style="display:none;">
              <input type="text" placeholder="নতুন টপিক লেখো" data-topicinput="${cat.id}">
              <button class="pill" data-addtopic="${cat.id}">যোগ করো</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    renderSyllabusOverall();
  }

  function saveSyllabusAndRefresh() {
    saveData();
    renderCategories();
    renderFlashCategoryOptions();
  }

  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const input = document.getElementById('newCategoryInput');
    const name = input.value.trim();
    if (!name) return;
    const topicInput = document.getElementById('newTopicInput');
    const firstTopic = topicInput.value.trim();
    const normalizedName = name.toLowerCase();
    const existingCat = state.syllabus.find(c => String(c.name).trim().toLowerCase() === normalizedName);
    if (existingCat) {
      if (firstTopic) {
        const normalizedTopic = firstTopic.toLowerCase();
        const alreadyExists = existingCat.topics.some(t => String(t.name).trim().toLowerCase() === normalizedTopic);
        if (alreadyExists) {
          showToast('এই টপিক আগেই আছে।', true);
        } else {
          existingCat.topics.push({ id: Date.now(), name: firstTopic, done: false });
          showToast('টপিকটি বিদ্যমান ক্যাটাগরিতে যোগ করা হয়েছে।');
        }
      } else {
        showToast('এই ক্যাটাগরি আগে থেকেই আছে।', true);
      }
      input.value = ''; topicInput.value = '';
      saveSyllabusAndRefresh();
      return;
    }
    const id = Date.now();
    state.syllabus.push({ id, name, topics: firstTopic ? [{ id: Date.now() + 1, name: firstTopic, done: false }] : [] });
    input.value = ''; topicInput.value = '';
    saveSyllabusAndRefresh();
  });

  categoryList.addEventListener('click', (e) => {
    if (e.detail > 1) return;
    const tile = e.target.closest('.topic-tile');
    if (tile && !e.target.closest('.tile-del')) {
      const cat = state.syllabus.find(c => String(c.id) === tile.dataset.cat);
      if (cat) {
        const topic = cat.topics.find(t => String(t.id) === tile.dataset.topic);
        if (topic) { topic.done = !topic.done; saveSyllabusAndRefresh(); }
      }
      return;
    }
    if (e.target.closest('.tile-del')) {
      const btn = e.target.closest('.tile-del');
      const cat = state.syllabus.find(c => String(c.id) === btn.dataset.cat);
      if (cat) { cat.topics = cat.topics.filter(t => String(t.id) !== btn.dataset.topic); saveSyllabusAndRefresh(); }
      return;
    }
    if (e.target.dataset.catdel) {
      openCategoryIds.delete(e.target.dataset.catdel);
      state.syllabus = state.syllabus.filter(c => String(c.id) !== e.target.dataset.catdel);
      saveSyllabusAndRefresh();
      return;
    }
    if (e.target.dataset.addtopic) {
      const catId = e.target.dataset.addtopic;
      const input = categoryList.querySelector(`[data-topicinput="${catId}"]`);
      const name = input.value.trim();
      if (!name) return;
      const cat = state.syllabus.find(c => String(c.id) === catId);
      if (cat) { cat.topics.push({ id: Date.now(), name, done: false }); input.value = ''; saveSyllabusAndRefresh(); }
      return;
    }
    if (e.target.dataset.toggleAddTopic) {
      const catId = e.target.dataset.toggleAddTopic;
      const panel = categoryList.querySelector(`[data-topic-form="${catId}"]`);
      if (panel) {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        const input = panel.querySelector('input');
        if (panel.style.display === 'flex') input.focus();
      }
      return;
    }
    if (e.target.dataset.editCategory) {
      const catId = e.target.dataset.editCategory;
      const cat = state.syllabus.find(c => String(c.id) === catId);
      if (!cat) return;
      const name = window.prompt('ক্যাটাগরির নতুন নাম লিখুন:', cat.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      cat.name = trimmed;
      saveSyllabusAndRefresh();
      return;
    }
  });

  categoryList.addEventListener('dblclick', (e) => {
    const label = e.target.closest('.tile-label');
    if (label) {
      const cat = state.syllabus.find(c => String(c.id) === label.dataset.topicCat);
      if (!cat) return;
      const topic = cat.topics.find(t => String(t.id) === label.dataset.topicLabel);
      if (!topic) return;
      const name = window.prompt('টপিকের নতুন নাম লিখুন:', topic.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      topic.name = trimmed;
      saveSyllabusAndRefresh();
      return;
    }
    const title = e.target.closest('.category-title');
    if (title) {
      const cat = state.syllabus.find(c => String(c.id) === title.dataset.categoryTitle);
      if (!cat) return;
      const name = window.prompt('ক্যাটাগরির নতুন নাম লিখুন:', cat.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      cat.name = trimmed;
      saveSyllabusAndRefresh();
    }
  });

  // ===== Flashcards =====
  const flashGrid = document.getElementById('flashGrid');
  const flashCategorySel = document.getElementById('flashCategory');
  const flashFilterSel = document.getElementById('flashFilterCategory');

  function routineSubjects() {
    return Array.from(new Set((state.routine || []).map(r => r.subject).filter(Boolean)));
  }

  function renderFlashCategoryOptions() {
    const opts = routineSubjects().map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('');
    flashCategorySel.innerHTML = '<option value="">কোনো বিষয় নেই</option>' + opts;
    flashFilterSel.innerHTML = '<option value="all">সব বিষয়</option>' + opts;
  }

  function renderFlashcards() {
    const filter = flashFilterSel.value || 'all';
    const list = filter === 'all' ? state.flashcards : state.flashcards.filter(f => f.category === filter);
    if (!list.length) {
      flashGrid.innerHTML = '<div class="empty-state">এখনও কোনো ফ্ল্যাশকার্ড যোগ করা হয়নি।</div>';
      return;
    }
    flashGrid.innerHTML = list.map(f => `
      <div class="flash-card" data-id="${f.id}">
        <div class="flash-card-actions">
          <button data-del="${f.id}" title="মুছুন">✕</button>
        </div>
        <div class="flash-card-inner">
          <div class="flash-face flash-front">
            ${f.category ? `<span class="flash-card-tag">${escapeHtml(f.category)}</span>` : ''}
            ${escapeHtml(f.front)}
          </div>
          <div class="flash-face flash-back">${escapeHtml(f.back)}</div>
        </div>
      </div>
    `).join('');
  }

  flashGrid.addEventListener('click', (e) => {
    if (e.target.dataset.del) {
      state.flashcards = state.flashcards.filter(f => String(f.id) !== e.target.dataset.del);
      renderFlashcards();
      saveData();
      return;
    }
    const card = e.target.closest('.flash-card');
    if (card) card.classList.toggle('flipped');
  });

  // ===== Flashcards Form Toggle =====
  const toggleFlashBtn = document.getElementById('toggleFlashFormBtn');
  const flashWrap = document.getElementById('flashFormWrap');
  if (toggleFlashBtn && flashWrap) {
    toggleFlashBtn.addEventListener('click', () => {
      const isOpen = flashWrap.style.display !== 'none';
      flashWrap.style.display = isOpen ? 'none' : 'block';
      toggleFlashBtn.innerHTML = isOpen ? '<span class="btn-icon">+</span> নতুন ফ্ল্যাশকার্ড তৈরি করুন' : '✕ ফর্ম বন্ধ করুন';
      toggleFlashBtn.classList.toggle('active-open', !isOpen);
      if (!isOpen) {
        const front = document.getElementById('flashFront');
        if (front) front.focus();
      }
    });
  }

  document.getElementById('addFlashBtn').addEventListener('click', () => {
    const frontEl = document.getElementById('flashFront');
    const backEl = document.getElementById('flashBack');
    const front = frontEl.value.trim();
    const back = backEl.value.trim();
    if (!front || !back) return;
    state.flashcards.push({ id: Date.now(), front, back, category: flashCategorySel.value || '' });
    frontEl.value = ''; backEl.value = '';
    renderFlashcards();
    saveData();

    if (flashWrap && toggleFlashBtn) {
      flashWrap.style.display = 'none';
      toggleFlashBtn.innerHTML = '<span class="btn-icon">+</span> নতুন ফ্ল্যাশকার্ড তৈরি করুন';
      toggleFlashBtn.classList.remove('active-open');
    }
    showToast('নতুন ফ্ল্যাশকার্ড তৈরি হয়েছে!');
  });

  flashFilterSel.addEventListener('change', renderFlashcards);

  // ===== Exam mode =====
  const examOverlay = document.getElementById('examOverlay');
  let examState = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  document.getElementById('startExamBtn').addEventListener('click', () => {
    const filter = flashFilterSel.value || 'all';
    const pool = filter === 'all' ? state.flashcards : state.flashcards.filter(f => f.category === filter);
    if (!pool.length) { return; }
    examState = { cards: shuffle(pool), idx: 0, correct: 0, wrong: 0, flipped: false, finished: false, userAnswer: '' };
    renderExam();
    examOverlay.style.display = 'flex';
  });

  function renderExam() {
    if (!examState) return;
    if (examState.finished) {
      const total = examState.correct + examState.wrong;
      const pct = total ? Math.round((examState.correct / total) * 100) : 0;
      examOverlay.innerHTML = `
        <div class="exam-overlay">
          <button class="theme-toggle exam-close" id="examCloseBtn" title="বন্ধ করো">✕</button>
          <div class="exam-summary">
            <h3>${pct >= 70 ? '🎉' : '💪'} এক্সাম শেষ!</h3>
            <p>${toBnDigits(examState.correct)}টা সঠিক, ${toBnDigits(examState.wrong)}টা ভুল — মোট ${toBnDigits(total)}টার মধ্যে ${pct}%</p>
            <div class="quote-actions">
              <button class="pill solid" id="examRestartBtn">আবার শুরু করো</button>
              <button class="pill" id="examExitBtn">বন্ধ করো</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('examCloseBtn').addEventListener('click', closeExam);
      document.getElementById('examExitBtn').addEventListener('click', closeExam);
      document.getElementById('examRestartBtn').addEventListener('click', () => {
        document.getElementById('startExamBtn').click();
      });
      return;
    }
    const card = examState.cards[examState.idx];

    if (!examState.flipped) {
      examOverlay.innerHTML = `
        <div class="exam-overlay">
          <button class="theme-toggle exam-close" id="examCloseBtn" title="বন্ধ করো">✕</button>
          <div class="exam-progress">প্রশ্ন ${toBnDigits(examState.idx + 1)} / ${toBnDigits(examState.cards.length)}</div>
          <div class="exam-score-live">✅ ${toBnDigits(examState.correct)}  ✕ ${toBnDigits(examState.wrong)}</div>
          <div class="exam-question-box glass">${escapeHtml(card.front)}</div>
          <input type="text" class="exam-answer-input" id="examAnswerInput" placeholder="তোমার উত্তর লিখো...">
          <div class="exam-actions">
            <button class="pill solid" id="examSubmitBtn">উত্তর জমা দাও</button>
          </div>
        </div>
      `;
      document.getElementById('examCloseBtn').addEventListener('click', closeExam);
      const input = document.getElementById('examAnswerInput');
      input.focus();
      const submit = () => { examState.userAnswer = input.value.trim(); examState.flipped = true; renderExam(); };
      document.getElementById('examSubmitBtn').addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      return;
    }

    examOverlay.innerHTML = `
      <div class="exam-overlay">
        <button class="theme-toggle exam-close" id="examCloseBtn" title="বন্ধ করো">✕</button>
        <div class="exam-progress">প্রশ্ন ${toBnDigits(examState.idx + 1)} / ${toBnDigits(examState.cards.length)}</div>
        <div class="exam-score-live">✅ ${toBnDigits(examState.correct)}  ✕ ${toBnDigits(examState.wrong)}</div>
        <div class="exam-answer-box glass">
          <div style="margin-bottom:12px;"><strong>তোমার উত্তর:</strong><br>${examState.userAnswer ? escapeHtml(examState.userAnswer) : '(ফাঁকা রাখা হয়েছে)'}</div>
          <div><strong>সঠিক উত্তর:</strong><br>${escapeHtml(card.back)}</div>
        </div>
        <div class="exam-actions">
          <button class="pill danger" id="examWrongBtn">✕ ভুল হয়েছে</button>
          <button class="pill solid" id="examCorrectBtn">✓ সঠিক হয়েছে</button>
        </div>
      </div>
    `;
    document.getElementById('examCloseBtn').addEventListener('click', closeExam);
    document.getElementById('examCorrectBtn').addEventListener('click', () => advanceExam(true));
    document.getElementById('examWrongBtn').addEventListener('click', () => advanceExam(false));
  }

  function advanceExam(isCorrect) {
    if (isCorrect) examState.correct++; else examState.wrong++;
    if (examState.idx + 1 >= examState.cards.length) { examState.finished = true; }
    else { examState.idx++; examState.flipped = false; examState.userAnswer = ''; }
    renderExam();
  }

  function closeExam() {
    examOverlay.style.display = 'none';
    examOverlay.innerHTML = '';
    examState = null;
  }

  // ===== Auto Backup File Connect Listener =====
  const connectBtn = document.getElementById('connectAutoSyncBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectAutoSyncFile);
  }

  // ===== JSON export / import =====
  document.getElementById('exportDataBtn').addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chakri-prostuti-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    await writeToAutoBackupFile();
    showToast('ডেটা ফাইল সফলভাবে ডাউনলোড করা হয়েছে! ⬇️');
  });

  document.getElementById('importDataInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const ok = window.confirm('এই ফাইলের ডেটা দিয়ে বর্তমান সব ডেটা প্রতিস্থাপিত হবে। এগিয়ে যাবে?');
        if (!ok) { e.target.value = ''; return; }
        state = {
          routine: Array.isArray(imported.routine) && imported.routine.length ? migrateRoutine(imported.routine) : buildDefaultRoutine(dateKey(Date.now())),
          notes: Array.isArray(imported.notes) ? imported.notes : [],
          customQuotes: Array.isArray(imported.customQuotes) ? imported.customQuotes : [],
          quoteIdx: typeof imported.quoteIdx === 'number' ? imported.quoteIdx : 0,
          quoteSource: imported.quoteSource || 'all',
          theme: imported.theme === 'light' ? 'light' : 'dark',
          sessions: Array.isArray(imported.sessions) ? imported.sessions : [],
          activeSession: imported.activeSession || null,
          dailyTargetMinutes: typeof imported.dailyTargetMinutes === 'number' ? imported.dailyTargetMinutes : 240,
          syllabus: Array.isArray(imported.syllabus) ? imported.syllabus : [],
          flashcards: Array.isArray(imported.flashcards) ? imported.flashcards : [],
          quoteCarouselEnabled: typeof imported.quoteCarouselEnabled === 'boolean' ? imported.quoteCarouselEnabled : true,
          quoteCarouselInterval: typeof imported.quoteCarouselInterval === 'number' ? imported.quoteCarouselInterval : 6
        };
        await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
        await writeToAutoBackupFile();
        showToast('ডেটা সফলভাবে ইমপোর্ট করা হয়েছে! ⬆️');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('ফাইলটি পড়া যায়নি — এটি সঠিক JSON ব্যাকআপ ফাইল কিনা যাচাই করো।', true);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  });

  // ===== Reset all data =====
  document.getElementById('resetAllBtn').addEventListener('click', async () => {
    const ok = window.confirm('তুমি কি নিশ্চিত? রুটিন, নোট, সিলেবাস, ফ্ল্যাশকার্ড, ট্র্যাকার — সব ডেটা মুছে যাবে। এই কাজটি ফেরানো যাবে না।');
    if (!ok) return;
    const keepTheme = state.theme;
    state = {
      routine: buildDefaultRoutine(dateKey(Date.now())), notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
      sessions: [], activeSession: null, dailyTargetMinutes: 240,
      syllabus: [], flashcards: [],
      quoteCarouselEnabled: true, quoteCarouselInterval: 6
    };
    await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
    await writeToAutoBackupFile();
    showToast('সব ডেটা রিসেট করা হয়েছে।');
    setTimeout(() => location.reload(), 800);
  });

  // ==========================================
  // EXAM COUNTDOWN ENGINE
  // ==========================================
  const EXAMS_KEY = 'jobprep_exams_list';
  let exams = [];

  function loadExams() {
    try {
      const data = localStorage.getItem(EXAMS_KEY);
      if (data) {
        exams = JSON.parse(data);
      } else {
        const now = new Date();
        const bcs47 = new Date(now.getFullYear(), now.getMonth() + 2, 15, 10, 0);
        const bankExam = new Date(now.getFullYear(), now.getMonth() + 1, 5, 9, 30);
        exams = [
          { id: 1, name: '৪৭তম বিসিএস প্রিলিমিনারি', category: 'বিসিএস', targetDate: bcs47.toISOString() },
          { id: 2, name: 'কম্বাইন্ড ব্যাংক সিনিয়র অফিসার', category: 'ব্যাংক', targetDate: bankExam.toISOString() }
        ];
        saveExams();
      }
    } catch (e) { exams = []; }
  }

  function saveExams() {
    try { localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); } catch (e) { }
  }

  function renderExams() {
    const grid = document.getElementById('countdownGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!exams.length) {
      grid.innerHTML = '<div class="empty-state">কোনো পরীক্ষার তারিখ সেট করা নেই। উপরে লিখে নতুন পরীক্ষার টার্গেট যোগ করুন।</div>';
      return;
    }

    const now = new Date().getTime();

    exams.forEach(ex => {
      const targetTime = new Date(ex.targetDate).getTime();
      const diff = targetTime - now;

      let days = 0, hours = 0, mins = 0, secs = 0;
      let isExpired = false;

      if (diff <= 0) {
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
          <h3>${escapeHtml(ex.name)}</h3>
          <span class="countdown-tag">${escapeHtml(ex.category || 'পরীক্ষা')}</span>
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

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('countdown-del-btn')) {
      const id = e.target.dataset.id;
      exams = exams.filter(ex => String(ex.id) !== String(id));
      saveExams();
      renderExams();
      showToast('পরীক্ষার টার্গেট মুছে ফেলা হয়েছে');
    }
  });

  const toggleExamBtn = document.getElementById('toggleExamFormBtn');
  const examWrap = document.getElementById('examFormWrap');
  if (toggleExamBtn && examWrap) {
    toggleExamBtn.addEventListener('click', () => {
      const isOpen = examWrap.style.display !== 'none';
      examWrap.style.display = isOpen ? 'none' : 'block';
      toggleExamBtn.innerHTML = isOpen ? '<span class="btn-icon">+</span> নতুন পরীক্ষার টার্গেট যোগ করুন' : '✕ ফর্ম বন্ধ করুন';
      toggleExamBtn.classList.toggle('active-open', !isOpen);
    });
  }

  const addExamBtn = document.getElementById('addExamTargetBtn');
  if (addExamBtn) {
    addExamBtn.addEventListener('click', () => {
      const nameEl = document.getElementById('examNameInput');
      const catEl = document.getElementById('examCatInput');
      const dateEl = document.getElementById('examDateInput');
      const name = nameEl.value.trim();
      const cat = catEl.value.trim();
      const dateVal = dateEl.value;

      if (!name || !dateVal) {
        showToast('দয়া করে পরীক্ষার নাম ও তারিখ নির্বাচন করুন', true);
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

      if (examWrap && toggleExamBtn) {
        examWrap.style.display = 'none';
        toggleExamBtn.innerHTML = '<span class="btn-icon">+</span> নতুন পরীক্ষার টার্গেট যোগ করুন';
        toggleExamBtn.classList.remove('active-open');
      }
      showToast('নতুন পরীক্ষার কাউন্টডাউন টার্গেট যোগ হয়েছে!');
    });
  }

  // ==========================================
  // UNIFIED TIMER & 24H BREAK TRACKER
  // ==========================================
  let selectedDuration = 0;
  let customCountdownInterval = null;
  let customCountdownSecs = 0;
  window.selectedTimerDuration = 0;
  window.isCustomCountdownActive = false;

  const BREAK_STORAGE_KEY = 'jobprep_break_minutes_today';

  function getTodayBreakMinutes() {
    try {
      const raw = localStorage.getItem(BREAK_STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return (parsed && parsed.date === todayKey()) ? (parsed.minutes || 0) : 0;
    } catch (e) { return 0; }
  }

  function addTodayBreakMinutes(mins) {
    try {
      const current = getTodayBreakMinutes();
      const updated = current + mins;
      localStorage.setItem(BREAK_STORAGE_KEY, JSON.stringify({ date: todayKey(), minutes: updated }));
      update24hActivityUI();
    } catch (e) { }
  }

  function update24hActivityUI() {
    const studyVal = document.getElementById('actStudyVal');
    const breakVal = document.getElementById('actBreakVal');
    const ratioVal = document.getElementById('actRatioVal');
    if (!studyVal || !breakVal || !ratioVal) return;

    let studyMinutes = 0;
    const today = todayKey();
    if (Array.isArray(state.sessions)) {
      state.sessions.forEach(s => {
        if (dateKey(s.start || s.date) === today) {
          studyMinutes += (s.duration || s.durationMinutes || 0);
        }
      });
    }

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
  if (durationSelector) {
    durationSelector.addEventListener('click', (e) => {
      const chip = e.target.closest('.timer-dur-chip');
      if (!chip) return;

      if (state.activeSession || window.isCustomCountdownActive) {
        showToast('সেশন চালুরত অবস্থায় সময় পরিবর্তন করা যাবে না। সেশন শেষ করুন।', true);
        return;
      }

      durationSelector.querySelectorAll('.timer-dur-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      selectedDuration = parseInt(chip.dataset.duration, 10) || 0;
      window.selectedTimerDuration = selectedDuration;

      const display = document.getElementById('timerDisplay');
      const sub = document.getElementById('timerSub');
      const subject = currentSubjectValue() || 'সাধারণ';

      if (selectedDuration === 0) {
        if (display) display.textContent = '00:00:00';
        if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — স্টপওয়াচ মোডে পড়া চালু করুন`;
      } else if (selectedDuration === 5) {
        customCountdownSecs = 5 * 60;
        if (display) display.textContent = '05:00';
        if (sub) sub.innerHTML = `<strong>৫ মিনিটের</strong> রিফ্রেশমেন্ট বিরতি`;
      } else {
        customCountdownSecs = selectedDuration * 60;
        const mStr = String(selectedDuration).padStart(2, '0');
        if (display) display.textContent = `${mStr}:00`;
        if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — ${selectedDuration} মিনিটের ফোকাস সেশন`;
      }
    });
  }

  const cancelModal = document.getElementById('cancelSessionModal');
  const resumeBtn = document.getElementById('resumeSessionBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelSessionBtn');

  function openCancelModal(remSeconds) {
    if (!cancelModal) return;
    const m = Math.floor(remSeconds / 60);
    const s = remSeconds % 60;
    const textEl = document.getElementById('cancelModalBodyText');
    const subject = currentSubjectValue() || 'সাধারণ';

    if (textEl) {
      textEl.innerHTML = `<strong>${escapeHtml(subject)}</strong> পড়ার <strong>${selectedDuration} মিনিটের</strong> ফোকাস সেশনটি সম্পন্ন হতে এখনও <strong>${toBnDigits(m)} মিনিট ${toBnDigits(s)} সেকেন্ড</strong> বাকি আছে!<br><br>এখনই উঠে গেলে এই সেশনের পড়া দৈনিক টার্গেটে যুক্ত হবে না।`;
    }
    cancelModal.classList.add('open');
  }

  function closeCancelModal() {
    if (cancelModal) cancelModal.classList.remove('open');
  }

  if (resumeBtn) resumeBtn.addEventListener('click', closeCancelModal);
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      closeCancelModal();
      stopCustomCountdown(false);
    });
  }

  function startCustomCountdown() {
    window.isCustomCountdownActive = true;
    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const orb = document.getElementById('clockOrb');

    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    if (orb) orb.classList.add('active');

    customCountdownInterval = setInterval(() => {
      if (customCountdownSecs > 0) {
        customCountdownSecs--;
        const m = String(Math.floor(customCountdownSecs / 60)).padStart(2, '0');
        const s = String(customCountdownSecs % 60).padStart(2, '0');
        if (display) display.textContent = toBnDigits(`${m}:${s}`);
      } else {
        clearInterval(customCountdownInterval);
        stopCustomCountdown(true);
      }
    }, 1000);
  }

  function stopCustomCountdown(isCompleted = false) {
    clearInterval(customCountdownInterval);
    window.isCustomCountdownActive = false;

    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const orb = document.getElementById('clockOrb');

    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (orb) orb.classList.remove('active');

    const subject = currentSubjectValue() || 'সাধারণ';

    if (selectedDuration === 5) {
      if (isCompleted) {
        addTodayBreakMinutes(5);
        showToast('৫ মিনিটের রিফ্রেশমেন্ট বিরতি সম্পন্ন হয়েছে!');
      } else {
        showToast('বিরতি বাতিল করা হয়েছে');
      }
      customCountdownSecs = 5 * 60;
      if (display) display.textContent = '05:00';
    } else {
      if (isCompleted) {
        state.sessions.push({
          id: Date.now(),
          start: Date.now() - (selectedDuration * 60000),
          end: Date.now(),
          subject: subject,
          duration: selectedDuration
        });
        saveData();
        renderTrackerAll();
        showToast(`${selectedDuration} মিনিটের ${subject} পড়ার সেশন সম্পন্ন হয়েছে এবং টার্গেটে যুক্ত হয়েছে!`);
      } else {
        showToast('সেশন বাতিল করা হয়েছে — পড়া দৈনিক টার্গেটে যুক্ত হয়নি', true);
      }
      customCountdownSecs = selectedDuration * 60;
      const mStr = String(selectedDuration).padStart(2, '0');
      if (display) display.textContent = `${mStr}:00`;
    }

    update24hActivityUI();
  }

  document.addEventListener('click', (e) => {
    if (selectedDuration === 0) return;

    if (e.target && e.target.id === 'startBtn') {
      e.stopImmediatePropagation();
      startCustomCountdown();
    } else if (e.target && e.target.id === 'stopBtn') {
      e.stopImmediatePropagation();
      if (customCountdownSecs > 0) {
        openCancelModal(customCountdownSecs);
      } else {
        stopCustomCountdown(false);
      }
    }
  }, true);

  // ==========================================
  // MOCK QUIZ & MISTAKE BANK ENGINE
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
    },
    {
      id: 105,
      q: 'পৃথিবীর সবচেয়ে বড় মহাসাগর কোনটি?',
      options: ['আটলান্টিক মহাসাগর', 'ভারতীয় মহাসাগর', 'প্রশান্ত মহাসাগর', 'উত্তর মহাসাগর'],
      correct: 2,
      explain: 'প্রশান্ত মহাসাগর পৃথিবীর সবচেয়ে বড় মহাসাগর।'
    },
    {
      id: 106,
      q: 'কম্পিউটারে তথ্যের একক হিসেবে কোনটি ব্যবহৃত হয়?',
      options: ['বাইট', 'মিটার', 'কিলোওয়াট', 'গ্রাম'],
      correct: 0,
      explain: 'কম্পিউটার সিস্টেমে তথ্যের একক হিসেবে বাইট ব্যবহৃত হয়।'
    },
    {
      id: 107,
      q: 'বাংলাদেশের স্বাধীনতা দিবস কোন তারিখ?',
      options: ['১৬ ডিসেম্বর', '২৬ মার্চ', '২১ ফেব্রুয়ারি', '১০ এপ্রিল'],
      correct: 1,
      explain: 'বাংলাদেশের স্বাধীনতা দিবস ২৬ মার্চ।'
    },
    {
      id: 108,
      q: '৫ + ৭ × 2 = ?',
      options: ['১২', '১৭', '২৪', '১৯'],
      correct: 3,
      explain: '৭ × 2 = ১৪, তারপর ৫ যোগ করলে ১৯ হয়।'
    },
    {
      id: 109,
      q: 'প্রথম বাংলাদেশী নোবেল বিজয়ী কে?',
      options: ['মুহাম্মদ ইউনূস', 'অমর্ত্য সেন', 'সৈয়দ আবুল আজাদ', 'আবদুল বারী'],
      correct: 0,
      explain: 'মুহাম্মদ ইউনূস ২০০৬ সালে নোবেল শান্তি পুরস্কার পান।'
    },
    {
      id: 110,
      q: 'একটি সেকেন্ডে কত মিলিসেকেন্ড?',
      options: ['১০০০', '১০০', '১০', '১'],
      correct: 0,
      explain: 'এক সেকেন্ডে ১০০০ মিলিসেকেন্ড থাকে।'
    }
  ];

  let currentQuizIdx = 0;
  let mistakes = [];

  function loadMistakes() {
    try {
      const data = localStorage.getItem(MISTAKES_KEY);
      mistakes = data ? JSON.parse(data) : [];
    } catch (e) { mistakes = []; }
  }

  function saveMistakes() {
    try { localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes)); } catch (e) { }
  }

  function showQuizView() {
    const switchBox = document.getElementById('quizFlashSwitch');
    const quizChip = switchBox ? switchBox.querySelector('.chip[data-view="quiz"]') : null;
    if (switchBox && quizChip) {
      switchBox.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      quizChip.classList.add('active');
    }

    const subFlash = document.getElementById('subview-flashcards');
    const subQuiz = document.getElementById('subview-quiz');
    const subMistakes = document.getElementById('subview-mistakes');
    if (subFlash) subFlash.style.display = 'none';
    if (subQuiz) subQuiz.style.display = 'block';
    if (subMistakes) subMistakes.style.display = 'none';
  }

  function addCustomQuizQuestion(questionText) {
    const text = (questionText || '').trim();
    if (!text) {
      if (typeof showToast === 'function') showToast('প্রথমে প্রশ্ন লিখুন');
      return;
    }

    sampleQuestions.push({
      id: Date.now(),
      q: text,
      options: ['সত্য', 'মিথ্যা'],
      correct: 0,
      explain: 'এই প্রশ্নটি ব্যবহারকারী যোগ করেছেন।'
    });

    currentQuizIdx = sampleQuestions.length - 1;
    showQuizView();
    renderQuiz();
    if (typeof showToast === 'function') showToast('নতুন কুইজ প্রশ্ন যোগ করা হয়েছে');
  }

  function renderQuiz() {
    const box = document.getElementById('quizBox');
    if (!box) return;

    if (currentQuizIdx >= sampleQuestions.length) {
      box.innerHTML = `
        <div style="text-align:center; padding: 24px;">
          <h3 style="font-family:'Baloo Da 2',sans-serif; font-size:24px; color:var(--accent2); margin-bottom:10px;">কুইজ সেশন শেষ হয়েছে!</h3>
          <p style="color:var(--text-soft); margin-bottom:20px;">আপনার ভুল উত্তরসমূহ "দুর্বলতার খাতা (Mistake Bank)" এ সংরক্ষিত হয়েছে।</p>
          <button class="pill solid" id="restartQuizBtn">পুনরায় শুরু করুন</button>
        </div>
      `;
      document.getElementById('restartQuizBtn').addEventListener('click', () => {
        currentQuizIdx = 0;
        renderQuiz();
      });
      return;
    }

    const qItem = sampleQuestions[currentQuizIdx];

    box.innerHTML = `
      <div class="quiz-header">
        <span style="font-size:13px; color:var(--text-soft);">প্রশ্ন ${toBnDigits(currentQuizIdx + 1)} / ${toBnDigits(sampleQuestions.length)}</span>
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
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.dataset.idx, 10);
        optBtns.forEach(b => b.style.pointerEvents = 'none');

        if (selectedIdx === qItem.correct) {
          btn.classList.add('correct');
          btn.querySelector('.opt-indicator').textContent = '✓ সঠিক';
        } else {
          btn.classList.add('wrong');
          btn.querySelector('.opt-indicator').textContent = '✕ ভুল';
          optBtns[qItem.correct].classList.add('correct');
          optBtns[qItem.correct].querySelector('.opt-indicator').textContent = '✓ সঠিক উত্তর';

          if (!mistakes.some(m => m.id === qItem.id)) {
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

    nextBtn.addEventListener('click', () => {
      currentQuizIdx++;
      renderQuiz();
    });
  }

  function renderMistakes() {
    const list = document.getElementById('mistakeBankList');
    if (!list) return;
    list.innerHTML = '';

    if (!mistakes.length) {
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
  if (clearMistakesBtn) {
    clearMistakesBtn.addEventListener('click', () => {
      if (window.confirm('আপনি কি নিশ্চিত যে "দুর্বলতার খাতা" খালি করতে চান?')) {
        mistakes = [];
        saveMistakes();
        renderMistakes();
        showToast('দুর্বলতার খাতা খালি করা হয়েছে');
      }
    });
  }

  const quizFlashSwitch = document.getElementById('quizFlashSwitch');
  const addQuizQuestionBtn = document.getElementById('addQuizQuestionBtn');
  const newQuizQuestionInput = document.getElementById('newQuizQuestionInput');

  if (addQuizQuestionBtn && newQuizQuestionInput) {
    addQuizQuestionBtn.addEventListener('click', () => {
      addCustomQuizQuestion(newQuizQuestionInput.value);
      newQuizQuestionInput.value = '';
    });

    newQuizQuestionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomQuizQuestion(newQuizQuestionInput.value);
        newQuizQuestionInput.value = '';
      }
    });
  }

  if (quizFlashSwitch) {
    quizFlashSwitch.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      quizFlashSwitch.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const view = chip.dataset.view;

      const subFlash = document.getElementById('subview-flashcards');
      const subQuiz = document.getElementById('subview-quiz');
      const subMistakes = document.getElementById('subview-mistakes');

      if (subFlash) subFlash.style.display = view === 'flashcards' ? 'block' : 'none';
      if (subQuiz) subQuiz.style.display = view === 'quiz' ? 'block' : 'none';
      if (subMistakes) subMistakes.style.display = view === 'mistakes' ? 'block' : 'none';
    });
  }

  // ===== Init =====
  (async function init() {
    await loadData();
    await initAutoSync();
    updateNavClock();
    syncThemeButtons();
    syncCarouselControls();
    initMonthDropdown();
    renderDateSlider();
    renderRoutine();
    renderQuote();
    renderNotes();
    renderTrackerAll();
    renderCategories();
    renderFlashCategoryOptions();
    renderFlashcards();
    startQuoteCarousel();

    loadExams();
    renderExams();
    setInterval(renderExams, 1000);
    update24hActivityUI();
    loadMistakes();
    renderQuiz();
    renderMistakes();

    tickInterval = setInterval(() => { tickTimer(); updateNavClock(); }, 1000);
  })();
})();
