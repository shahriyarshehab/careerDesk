(function () {
  const STORAGE_KEY = 'jobprep-dashboard-data-v2';

  // Inline SVG icon strings for dynamic innerHTML templates
  const ICON = {
    x: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
    pin: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
    edit: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
    undo: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    rotccw: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    trophy: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    zap: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    star: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    layers: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    arrowR: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    arrowL: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    eye: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    plus: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    target: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    bulb: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    checkCircle: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    xCircle: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    flame: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    flag: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>',
    volume2: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    volumeX: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>',
    sparkles: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
    pause: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    award: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    clock: '<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  };

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
    const today = dateKey(Date.now());
    return {
      routine: buildDefaultRoutine(today),
      notes: [
        {
          id: 1785728326261,
          title: "Key Quantitative Aptitude Formulas",
          body: "Speed = Distance / Time; Work Done = Men × Days × Hours; Compound Interest A = P(1 + r/n)^(nt).",
          tag: "Math",
          pinned: true,
          ts: Date.now()
        }
      ],
      customQuotes: [],
      quoteIdx: 0,
      quoteSource: "all",
      theme: "dark",
      sessions: [],
      activeSession: null,
      dailyTargetMinutes: 240,
      syllabus: [
        {
          id: 1,
          name: "English Language & Literature",
          topics: [
            { id: 101, name: "Parts of Speech & Identification", done: true },
            { id: 102, name: "Subject-Verb Agreement", done: true },
            { id: 103, name: "High-Yield Idioms & Phrases", done: false },
            { id: 104, name: "Literary Terms & Eras", done: false }
          ]
        },
        {
          id: 2,
          name: "Mathematics & Mental Ability",
          topics: [
            { id: 201, name: "Percentages, Profit & Loss", done: true },
            { id: 202, name: "Ratios, Proportions & Mixtures", done: false },
            { id: 203, name: "Geometry & Coordinate Basics", done: false }
          ]
        }
      ],
      flashcards: [
        { id: 1, front: "What is the synonym of 'Ephemeral'?", back: "✓ Short-lived / Transient / Fleeting\n\n💡 Explanation: 'Ephemeral' refers to anything that lasts for a very short period of time.", category: "English" },
        { id: 2, front: "What is the antonym of 'Venerate'?", back: "✓ Condemn / Despise / Disparage\n\n💡 Explanation: 'Venerate' means to treat with deep respect or reverence.", category: "English" },
        { id: 3, front: "What is the correct spelling of 'Millennium'?", back: "✓ Millennium\n\n💡 Explanation: Spelled with double 'l' and double 'n' (M-i-l-l-e-n-n-i-u-m).", category: "English" },
        { id: 4, front: "What is the meaning of the idiom 'To kick the bucket'?", back: "✓ To die\n\n💡 Explanation: An informal English idiom meaning someone has passed away.", category: "English" },
        { id: 5, front: "Which verb form follows the prepositional phrase 'Look forward to'?", back: "✓ Gerund (Verb + ing)\n\n💡 Explanation: Example: 'I look forward to meeting you.'", category: "English" },
        { id: 6, front: "‘চর্যাপদ’ মূলত কোন ছন্দে রচিত?", back: "✓ মাত্রাবৃত্ত (পাদাকুলক)\n\n💡 ব্যাখ্যা: চর্যাপদ মূলত মাত্রাবৃত্ত বা পাদাকুলক মাত্রার ছন্দে রচিত প্রাচীনতম বাংলা কাব্যগ্রন্থ।", category: "বাংলা সাহিত্য" },
        { id: 7, front: "বাংলা সাহিত্যের প্রথম ‘সার্থক’ উপন্যাস কোনটি এবং কার লেখা?", back: "✓ দুর্গেশনন্দিনী (বঙ্কিমচন্দ্র চট্টোপাধ্যায়, ১৮৬৫)\n\n💡 ব্যাখ্যা: ১৮৬৫ সালে প্রকাশিত দুর্গেশনন্দিনী বাংলা সাহিত্যের প্রথম সার্থক উপন্যাস হিসেবে স্বীকৃত।", category: "বাংলা সাহিত্য" },
        { id: 8, front: "‘গীতাঞ্জলি’ কাব্যের জন্য রবীন্দ্রনাথ ঠাকুর কত সালে নোবেল পুরস্কার লাভ করেন?", back: "✓ ১৯১৩ সালে\n\n💡 ব্যাখ্যা: ১৯১৩ সালে ‘Song Offerings’ (গীতাঞ্জলি) এর অনুবাদের জন্য তিনি সাহিত্যে এশিয়ার প্রথম নোবেল জয়ী হন।", category: "বাংলা সাহিত্য" },
        { id: 9, front: "কাজী নজরুল ইসলাম কোন বিখ্যাত পত্রিকার সম্পাদক ছিলেন?", back: "✓ ধূমকেতু (১৯২২)\n\n💡 ব্যাখ্যা: ১৯২২ সালের ১১ আগস্ট তাঁর সম্পাদনায় অর্ধ-সাপ্তাহিক ‘ধূমকেতু’ প্রকাশিত হয়।", category: "বাংলা সাহিত্য" },
        { id: 10, front: "মুনীর চৌধুরীর ‘রক্তাক্ত প্রান্তর’ নাটকটির ঐতিহাসিক পটভূমি কী?", back: "✓ পানিপথের তৃতীয় যুদ্ধ (১৭৬১)\n\n💡 ব্যাখ্যা: নাটকটি ১৭৬১ সালে সংঘটিত ঐতিহাসিক পানিপথের তৃতীয় যুদ্ধের পটভূমিতে রচিত।", category: "বাংলা সাহিত্য" },
        { id: 11, front: "‘সন্ধি’ বাংলা ব্যাকরণের কোন অংশে আলোচিত হয়?", back: "✓ ধ্বনিতত্ত্ব (Phonology)\n\n💡 ব্যাখ্যা: সন্ধি হলো পাশাপাশি অবস্থিত দুটি ধ্বনির মিলন, তাই এটি ধ্বনিতত্ত্বে আলোচিত হয়।", category: "বাংলা ব্যাকরণ" },
        { id: 12, front: "‘সূর্য’ শব্দের প্রধান কয়েকটি সমার্থক শব্দ কী কী?", back: "✓ মিহির, আদিত্য, ভাস্কর, তপন, রবি, দিনমণি, দিবাকর\n\n💡 ব্যাখ্যা: বিসিএস ও পিএসসি পরীক্ষায় ‘সূর্য’ এর সমার্থক শব্দ প্রায়শই আসে।", category: "বাংলা ব্যাকরণ" },
        { id: 13, front: "যেকোনো ত্রিভুজের তিন কোণের সমষ্টি কত ডিগ্রি?", back: "✓ ১৮০° (বা দুই সমকোণ)\n\n💡 ব্যাখ্যা: ইউক্লিডীয় জ্যামিতি অনুসারে যেকোনো ত্রিভুজের তিনটি অন্তঃস্থ কোণের যোগফল সর্বদা ১৮০ ডিগ্রি।", category: "গণিত" },
        { id: 14, front: "২০ থেকে ৩০ এর মধ্যে মৌলিক সংখ্যা (Prime numbers) কয়টি ও কী কী?", back: "✓ ২টি (২৩ এবং ২৯)\n\n💡 ব্যাখ্যা: ২০ থেকে ৩০ এর মধ্যে একমাত্র ২৩ ও ২৯ কেবল ১ এবং ঐ সংখ্যা ব্যতীত অন্য কোনো সংখ্যা দ্বারা বিভাজ্য নয়।", category: "গণিত" },
        { id: 15, front: "বৃত্তের ক্ষেত্রফল (Area) এবং পরিধির (Circumference) সূত্র কী?", back: "✓ ক্ষেত্রফল = πr², পরিধি = 2πr\n\n💡 ব্যাখ্যা: এখানে r হলো বৃত্তের ব্যাসার্ধ (Radius) এবং π ≈ ৩.১৪১৬।", category: "গণিত" },
        { id: 16, front: "x + y = 7 এবং x - y = 3 হলে, x এর মান কত?", back: "✓ x = 5\n\n💡 ব্যাখ্যা: সমীকরণ দুটি যোগ করলে: 2x = 10 ➔ x = 5 (এবং y = 2)।", category: "গণিত" },
        { id: 17, front: "মুজিবনগর সরকার কবে আনুষ্ঠানিকভাবে শপথ গ্রহণ করে?", back: "✓ ১৭ এপ্রিল ১৯৭১\n\n💡 ব্যাখ্যা: ১৯৭১ সালের ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার (বর্তমান মুজিবনগর) আম্রকাননে গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের শপথ গ্রহণ অনুষ্ঠিত হয়।", category: "বাংলাদেশ বিষয়াবলী" },
        { id: 18, front: "বাংলাদেশের জাতীয় সংসদের মোট আসন সংখ্যা কত?", back: "✓ ৩৫০টি\n\n💡 ব্যাখ্যা: সাধারণ আসন ৩০০টি এবং নারীদের জন্য সংরক্ষিত ৫০টি আসন।", category: "বাংলাদেশ বিষয়াবলী" },
        { id: 19, front: "বাংলাদেশের দীর্ঘতম ও প্রশস্ততম নদী কোনটি?", back: "✓ মেঘনা নদী\n\n💡 ব্যাখ্যা: পানি নিষ্কাশন ও প্রশস্ততার দিক থেকে মেঘনা বাংলাদেশের বৃহত্তম নদী।", category: "বাংলাদেশ বিষয়াবলী" },
        { id: 20, front: "জাতিসংঘের (United Nations) মূল সদর দপ্তর কোথায় অবস্থিত?", back: "✓ নিউ ইয়র্ক সিটি, যুক্তরাষ্ট্র\n\n💡 ব্যাখ্যা: ১৯৪৫ সালের ২৪ অক্টোবর জাতিসংঘ প্রতিষ্ঠিত হয়। এর মূল সদর দপ্তর নিউ ইয়র্কে অবস্থিত।", category: "আন্তর্জাতিক বিষয়াবলী" },
        { id: 21, front: "জাপানের মুদ্রার নাম কী?", back: "✓ ইয়েন (Japanese Yen / JPY)\n\n💡 ব্যাখ্যা: জাপানের রাজধানী টোকিও এবং সরকারি মুদ্রা ইয়েন।", category: "আন্তর্জাতিক বিষয়াবলী" },
        { id: 22, front: "বিশ্বের বৃহত্তম উষ্ণ মরুভূমি কোনটি?", back: "✓ সাহারা মরুভূমি\n\n💡 ব্যাখ্যা: আফ্রিকা মহাদেশে অবস্থিত সাহারা মরুভূমি বিশ্বের বৃহত্তম উষ্ণ মরুভূমি।", category: "আন্তর্জাতিক বিষয়াবলী" },
        { id: 23, front: "কম্পিউটারের ‘মস্তিষ্ক’ (Brain of the Computer) কাকে বলা হয়?", back: "✓ CPU (Central Processing Unit)\n\n💡 ব্যাখ্যা: সিপিইউ কম্পিউটারের সমস্ত নির্দেশনা প্রক্রিয়াকরণ ও নিয়ন্ত্রণ করে।", category: "কম্পিউটার ও আইসিটি" },
        { id: 24, front: "মানবদেহে রক্ত জমাট বাঁধতে কোন ভিটামিন সরাসরি সহায়তা করে?", back: "✓ ভিটামিন K\n\n💡 ব্যাখ্যা: ভিটামিন কে রক্তে প্রথম্বিন সংশ্লেষণে অংশ নিয়ে রক্ত তঞ্চন বা জমাট বাঁধায় সাহায্য করে।", category: "সাধারণ বিজ্ঞান" },
        { id: 25, front: "ইন্টারনেটে নিরাপদ ব্রাউজিংয়ের প্রোটোকল HTTPS এর ডিফল্ট পোর্ট নম্বর কত?", back: "✓ Port 443\n\n💡 ব্যাখ্যা: HTTPS এনক্রিপ্টেড যোগাযোগের জন্য পোর্ট ৪৪৩ এবং সাধারণ HTTP পোর্ট ৮০ ব্যবহার করে।", category: "কম্পিউটার ও আইসিটি" }
      ],
      quoteCarouselEnabled: true,
      quoteCarouselInterval: 300,
      deletedSubjects: [],
      customSubjects: [],
      deletedQuotes: []
    };
  }

  function buildDefaultRoutine(dateStr) {
    const template = [
      { startTime: '06:30', endTime: '08:00', subject: 'English', task: 'Grammar & High-Yield Vocabulary Review' },
      { startTime: '09:00', endTime: '10:30', subject: 'Mathematics', task: 'Quantitative Aptitude & Problem Solving' },
      { startTime: '11:30', endTime: '13:00', subject: 'General Knowledge', task: 'Current Affairs & Bangladesh History' },
      { startTime: '15:30', endTime: '17:00', subject: 'General Science', task: 'Everyday Science & ICT Fundamentals' },
      { startTime: '20:00', endTime: '21:30', subject: 'Analytical Ability', task: 'Critical Reasoning & Previous Exam Papers' },
    ];
    return template.map((t, i) => ({ id: Date.now() + i, date: dateStr, ...t }));
  }

  function buildDefaultNotes() {
    return getDefaultState().notes;
  }

  const ownQuotes = [
    'Discipline is the bridge between goals and accomplishment.',
    'Small daily improvements over time lead to stunning results.',
    'Push yourself because no one else is going to do it for you.',
    'Success does not come from what you do occasionally; it comes from what you do consistently.',
    'Focus on the process, and the results will take care of themselves.',
    'Your future is created by what you do today, not tomorrow.',
    'Hard work beats talent when talent fails to work hard.',
    'Study while others are sleeping; prepare while others are playing.',
    'Do not decrease the goal. Increase the effort.',
    'Every expert was once a beginner.',
    'Believe you can and you are halfway there.',
    'It always seems impossible until it is done.',
    'The secret of getting ahead is getting started.',
    'The harder you work for something, the greater you will feel when you achieve it.',
    'Wake up with determination. Go to bed with satisfaction.',
    'Do something today that your future self will thank you for.'
  ];

  const famousQuotes = [
    { q: 'Believe you can and you are halfway there.', a: 'Theodore Roosevelt' },
    { q: 'Success is the sum of small efforts, repeated day in and day out.', a: 'Robert Collier' },
    { q: 'The best way to predict the future is to create it.', a: 'Abraham Lincoln' },
    { q: 'Do not let what you cannot do interfere with what you can do.', a: 'John Wooden' },
    { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
    { q: 'Start where you are. Use what you have. Do what you can.', a: 'Arthur Ashe' },
    { q: 'There are no secrets to success. It is the result of preparation, hard work, and learning from failure.', a: 'Colin Powell' },
    { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
    { q: 'There is no substitute for hard work.', a: 'Thomas Edison' },
    { q: 'Success is the progressive realization of a worthy goal.', a: 'Earl Nightingale' },
    { q: 'A person who never made a mistake never tried anything new.', a: 'Albert Einstein' },
    { q: 'Education is the most powerful weapon which you can use to change the world.', a: 'Nelson Mandela' },
    { q: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', a: 'Aristotle' },
    { q: 'The way to get started is to quit talking and begin doing.', a: 'Walt Disney' },
    { q: 'Whether you think you can or think you cannot, you are right.', a: 'Henry Ford' },
    { q: 'Success is not final, failure is not fatal: It is the courage to continue that counts.', a: 'Winston Churchill' },
    { q: 'I have failed over and over again in my life. And that is why I succeed.', a: 'Michael Jordan' },
    { q: 'The future belongs to those who believe in the beauty of their dreams.', a: 'Eleanor Roosevelt' },
    { q: 'It does not matter how slowly you go as long as you do not stop.', a: 'Confucius' },
    { q: 'Whatever the mind of man can conceive and believe, it can achieve.', a: 'Napoleon Hill' }
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
    quoteCarouselEnabled: true, quoteCarouselInterval: 300,
    deletedSubjects: [], customSubjects: [], deletedQuotes: []
  };
  let saveTimer = null;
  let tickInterval = null;

  let currentViewMonth = new Date().getMonth();
  let currentViewYear = new Date().getFullYear();

  function bnDate() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
        state.flashcards = Array.isArray(p.flashcards) && p.flashcards.length >= 5 ? p.flashcards : getDefaultState().flashcards;
        state.quoteCarouselEnabled = typeof p.quoteCarouselEnabled === 'boolean' ? p.quoteCarouselEnabled : true;
        state.quoteCarouselInterval = typeof p.quoteCarouselInterval === 'number' ? p.quoteCarouselInterval : 300;
        state.deletedSubjects = Array.isArray(p.deletedSubjects) ? p.deletedSubjects : [];
        state.customSubjects = Array.isArray(p.customSubjects) ? p.customSubjects : [];
        state.deletedQuotes = Array.isArray(p.deletedQuotes) ? p.deletedQuotes : [];
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
    syncThemeButtons();
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
          text.textContent = 'Auto-backup active (' + autoBackupHandle.name + ')';
          return;
        }
      } catch (e) { }
      badge.classList.remove('active');
      dot.classList.remove('active');
      text.textContent = 'Permission needed (' + autoBackupHandle.name + ')';
    } else {
      badge.classList.remove('active');
      dot.classList.remove('active');
      text.textContent = 'Not connected';
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
      showToast('File System Access API is not supported in this browser. Please use Chrome or Edge.', true);
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
      showToast('Auto-backup file connected successfully! ✓');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Failed to connect backup file.', true);
      }
    }
  }

  function saveData() {
    clearTimeout(saveTimer);
    const note = document.getElementById('routineSaveNote');
    saveTimer = setTimeout(async () => {
      try {
        await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
        if (note) { note.textContent = 'Changes saved ✓'; setTimeout(() => { note.textContent = 'Changes are saved automatically.'; }, 1600); }
        await writeToAutoBackupFile();
      } catch (e) {
        if (note) { note.textContent = 'Failed to save changes, please try again.'; }
      }
    }, 400);
  }

  // ===== Theme settings =====
  function setTheme(newTheme) {
    state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', state.theme);
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
    syncWatchControls();
  }
  const darkBtn = document.getElementById('themeDarkBtn');
  if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
  const lightBtn = document.getElementById('themeLightBtn');
  if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

  // ===== Fullscreen & Theme watch controls =====
  function syncWatchControls() {
    const themeBtn = document.getElementById('watchThemeToggle');
    const fullscreenBtn = document.getElementById('watchFullscreenToggle');
    if (themeBtn) {
      const isDark = state.theme === 'dark';
      const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      themeBtn.title = themeLabel;
      themeBtn.setAttribute('aria-label', themeLabel);
      themeBtn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
    }
    if (fullscreenBtn) {
      const isFull = !!document.fullscreenElement;
      const fullscreenLabel = isFull ? 'Exit fullscreen' : 'Enter fullscreen';
      fullscreenBtn.title = fullscreenLabel;
      fullscreenBtn.setAttribute('aria-label', fullscreenLabel);
      fullscreenBtn.innerHTML = `<i data-lucide="${isFull ? 'minimize' : 'maximize'}"></i>`;
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  }

  const fullscreenToggleSettings = document.getElementById('fullscreenToggleSettings');
  if (fullscreenToggleSettings) fullscreenToggleSettings.addEventListener('click', toggleFullscreen);

  const watchThemeToggle = document.getElementById('watchThemeToggle');
  if (watchThemeToggle) {
    watchThemeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }

  const watchFullscreenToggle = document.getElementById('watchFullscreenToggle');
  if (watchFullscreenToggle) watchFullscreenToggle.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncWatchControls);
  syncWatchControls();

  // ===== Generic modal handling =====
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) { closeModal(closeBtn.dataset.close); return; }
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) { e.target.classList.remove('open'); }
  });

  // ===== Tabs =====
  const ACTIVE_TAB_KEY = 'careerdesk-active-tab';

  function normalizeTabName(tabName) {
    if (!tabName) return 'routine';
    if (tabName === 'quiz') return 'flashcards';
    if (tabName === 'exams') return 'countdown';
    return tabName;
  }

  function activateTab(rawTabName, persist = false) {
    const tabName = normalizeTabName(rawTabName);
    const targetPanel = document.getElementById('panel-' + tabName);
    if (!targetPanel) return;

    document.querySelectorAll('.tab-btn').forEach(b => {
      const bTab = normalizeTabName(b.dataset.tab);
      const isActive = bTab === tabName;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    });
    document.querySelectorAll('.panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + tabName);
    });

    if (persist) {
      try { localStorage.setItem(ACTIVE_TAB_KEY, tabName); } catch (e) { }
      try { if (window.location.hash !== '#' + tabName) history.replaceState(null, '', '#' + tabName); } catch (e) { }
    }

    if (tabName === 'settings') {
      renderSubjectManager();
      renderQuoteManager();
      syncQuoteSettings();
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab, true));
  });

  try {
    const hashTab = window.location.hash ? window.location.hash.replace('#', '') : null;
    const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
    const initialTab = normalizeTabName(hashTab || savedTab || 'routine');
    if (initialTab) activateTab(initialTab, false);
  } catch (e) { }

  window.addEventListener('hashchange', () => {
    const rawTab = window.location.hash ? window.location.hash.replace('#', '') : 'routine';
    activateTab(normalizeTabName(rawTab), false);
  });

  // ===== Mini Floating Header Timer Widget =====
  function syncMiniTimerWidget() {
    const widget = document.getElementById('headerMiniTimer');
    if (!widget) return;
    const timeEl = document.getElementById('miniTimerTime');
    const subjEl = document.getElementById('miniTimerSubject');

    if (window.isCustomCountdownActive && typeof customCountdownSecs === 'number') {
      widget.style.display = 'inline-flex';
      const m = String(Math.floor(customCountdownSecs / 60)).padStart(2, '0');
      const s = String(customCountdownSecs % 60).padStart(2, '0');
      if (timeEl) timeEl.textContent = `${m}:${s}`;
      if (subjEl) {
        subjEl.textContent = timerMode === 'break' ? 'Break' : (typeof currentSubjectValue === 'function' ? (currentSubjectValue() || 'Focus') : 'Focus');
      }
    } else if (state && state.activeSession && state.activeSession.start) {
      widget.style.display = 'inline-flex';
      const secs = Math.floor((Date.now() - state.activeSession.start) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      if (timeEl) {
        timeEl.textContent = m >= 60
          ? `${Math.floor(m / 60)}h ${m % 60}m`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      if (subjEl) subjEl.textContent = state.activeSession.subject || 'Focus';
    } else {
      widget.style.display = 'none';
    }
  }

  const headerMiniTimerEl = document.getElementById('headerMiniTimer');
  if (headerMiniTimerEl) {
    headerMiniTimerEl.addEventListener('click', (e) => {
      if (e.target.closest('#miniTimerStopBtn')) {
        e.stopPropagation();
        if (window.isCustomCountdownActive && typeof stopCustomCountdown === 'function') {
          stopCustomCountdown(false);
        } else if (state && state.activeSession) {
          const stopBtn = document.getElementById('stopBtn');
          if (stopBtn) stopBtn.click();
        }
        syncMiniTimerWidget();
        return;
      }
      activateTab('tracker', true);
    });
  }

  // ===== Routine =====
  const routineCardWrap = document.getElementById('routineCardWrap');
  let routineDateFilter = dateKey(Date.now());

  function initMonthDropdown() {
    const sel = document.getElementById('monthDropdown');
    if (!sel) return;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let html = '';
    const baseYear = new Date().getFullYear();
    for (let y = baseYear - 1; y <= baseYear + 2; y++) {
      for (let m = 0; m < 12; m++) {
        const val = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${months[m]} ${y}`;
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
      const mBox = document.getElementById('monthlyRoutineView');
      if (mBox && !mBox.hidden) {
        showMonthlyRoutines();
      } else {
        renderDateSlider();
        renderRoutine();
      }
    });
  }

  function buildDateSliderList() {
    const dates = new Set();
    // 1. Generate all days of current viewed month
    const daysInMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentViewYear, currentViewMonth, day);
      dates.add(dateKey(d.getTime()));
    }
    // 2. Ensure today is present
    dates.add(dateKey(Date.now()));
    // 3. Ensure routineDateFilter is present
    if (routineDateFilter) dates.add(routineDateFilter);
    // 4. Add any other routine dates with existing entries
    if (Array.isArray(state.routine)) {
      state.routine.forEach(r => { if (r.date) dates.add(r.date); });
    }
    return Array.from(dates).sort();
  }

  function renderDateSlider() {
    const box = document.getElementById('dateSlider');
    if (!box) return;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const routineDates = new Set((state.routine || []).filter(r => r.subject).map(r => r.date));
    let html = '';
    buildDateSliderList().forEach(ds => {
      const d = new Date(ds + 'T00:00:00');
      const hasDot = routineDates.has(ds) ? 'has-routine' : '';
      const isAct = routineDateFilter === ds ? 'active' : '';
      html += `<div class="date-chip ${isAct} ${hasDot}" data-date="${ds}">
        <span class="dc-day">${dayLabels[d.getDay()]}</span><span class="dc-num">${d.getDate()}</span>
      </div>`;
    });
    box.innerHTML = html;

    const activeChip = box.querySelector('.date-chip.active');
    if (activeChip) {
      setTimeout(() => {
        activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
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

  const ROUTINE_HEAD = '<thead><tr><th style="width:16%">Start</th><th style="width:16%">End</th><th style="width:26%">Subject</th><th>Topic / Task</th><th style="width:40px"></th></tr></thead>';

  function routineRowHtml(row) {
    return `
      <tr>
        <td><input type="time" value="${row.startTime || ''}" data-field="startTime" data-id="${row.id}"></td>
        <td><input type="time" value="${row.endTime || ''}" data-field="endTime" data-id="${row.id}"></td>
        <td><input type="text" value="${escapeAttr(row.subject || '')}" placeholder="Subject" data-field="subject" data-id="${row.id}" list="appSubjectDatalist"></td>
        <td><input type="text" value="${escapeAttr(row.task || '')}" placeholder="Task description" data-field="task" data-id="${row.id}"></td>
        <td><button class="del-row" title="Delete row" data-id="${row.id}">${ICON.x}</button></td>
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
      box.innerHTML = '<div class="tracker-routine-title">Today\'s Subject Breakdown</div><div class="empty-state">No study sessions recorded today.</div>';
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

    box.innerHTML = `<div class="tracker-routine-title">Today\'s Subject Breakdown</div>${rowsHtml}`;
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
        wrap.innerHTML = '<div class="empty-state" style="border:none; margin:16px;">No routine entries for this date.</div>';
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
      wrap.innerHTML = `
        <div class="routine-empty-card">
          <div class="routine-empty-icon"><i data-lucide="calendar-plus"></i></div>
          <h4>No study routine planned for this day</h4>
          <p>You can add your own custom study blocks or load the recommended BCS preliminary study routine.</p>
          <div class="routine-empty-actions">
            <button class="pill solid" id="emptyLoadDefaultsBtn" type="button"><i data-lucide="sparkles"></i> Load Recommended Routine</button>
            <button class="pill" id="emptyAddBlockBtn" type="button"><i data-lucide="plus"></i> Add Study Block</button>
          </div>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      renderTrackerRoutinePreview();
      return;
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
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.closest('#routineCardWrap') && t.dataset.field) {
      if (!Array.isArray(state.routine)) state.routine = [];
      const row = state.routine.find(r => String(r.id) === t.dataset.id);
      if (row) {
        row[t.dataset.field] = t.value;
        if (t.dataset.field === 'subject') {
          syncAllSubjectSelects();
        }
        saveData();
      }
    }
  });

  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.del-row');
    if (delBtn && delBtn.closest('#routineCardWrap')) {
      if (!window.confirm('Are you sure you want to delete this routine slot?')) return;
      if (!Array.isArray(state.routine)) state.routine = [];
      state.routine = state.routine.filter(r => String(r.id) !== delBtn.dataset.id);
      saveData();
      renderRoutine();
      renderDateSlider();
      syncAllSubjectSelects();
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
      syncAllSubjectSelects();
      showToast('New time slot added to routine');
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
      syncAllSubjectSelects();
      showToast('Default routine loaded for today');
      return;
    }
  });

  function toggleMonthlyRoutineView(forceOpen) {
    const mBox = document.getElementById('monthlyRoutineView');
    const dateNav = document.querySelector('.date-slider-row');
    const cardWrap = document.getElementById('routineCardWrap');
    const routineActions = document.querySelector('.routine-actions');
    const routineSaveNote = document.getElementById('routineSaveNote');
    const titleEl = document.querySelector('.routine-hero-copy .section-title');
    const leadEl = document.querySelector('.routine-hero-copy .routine-lead');
    const mBtn = document.getElementById('monthlyRoutineBtn');

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : (mBox && mBox.hidden);

    if (shouldOpen) {
      if (mBox) mBox.hidden = false;
      if (dateNav) dateNav.hidden = true;
      if (cardWrap) cardWrap.hidden = true;
      if (routineActions) routineActions.hidden = true;
      if (routineSaveNote) routineSaveNote.hidden = true;
      if (mBtn) {
        mBtn.classList.add('active');
        mBtn.title = 'Switch to daily routine view';
        mBtn.setAttribute('aria-label', 'Switch to daily routine view');
      }
      if (titleEl) titleEl.textContent = 'Monthly Study Overview';
      if (leadEl) leadEl.textContent = 'Review all scheduled study sessions across the selected month.';
      showMonthlyRoutines();
    } else {
      if (mBox) mBox.hidden = true;
      if (dateNav) dateNav.hidden = false;
      if (cardWrap) cardWrap.hidden = false;
      if (routineActions) routineActions.hidden = false;
      if (routineSaveNote) routineSaveNote.hidden = false;
      if (mBtn) {
        mBtn.classList.remove('active');
        mBtn.title = 'Toggle monthly overview list';
        mBtn.setAttribute('aria-label', 'Toggle Monthly Overview');
      }
      if (titleEl) titleEl.textContent = 'Daily Study Routine';
      if (leadEl) leadEl.textContent = 'Plan your next study block and keep your momentum moving.';
      renderDateSlider();
      renderRoutine();
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function showMonthlyRoutines() {
    const box = document.getElementById('monthlyRoutineView');
    if (!box) return;
    const prefix = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}-`;
    const byDate = (state.routine || []).filter(r => r.date && r.date.startsWith(prefix) && r.subject).reduce((map, row) => {
      (map[row.date] ||= []).push(row); return map;
    }, {});
    const dates = Object.keys(byDate).sort();
    box.hidden = false;
    box.innerHTML = dates.length ? dates.map(date => {
      const rows = byDate[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return `<article class="monthly-routine-card" data-month-date="${date}">
        <div class="monthly-routine-head">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="calendar" style="width:16px; height:16px; color:var(--accent1);"></i>
            <strong>${bnDateLabel(date)}</strong>
            <span class="badge" style="font-size:11px; padding:2px 8px; border-radius:12px; background:var(--surface-strong); border:1px solid var(--border); color:var(--text-soft); font-weight:600;">${rows.length} ${rows.length === 1 ? 'block' : 'blocks'}</span>
          </div>
          <div class="monthly-routine-actions btn-group">
            <button class="pill action-btn-edit" data-month-edit="${date}" title="Open this date in daily routine editor" aria-label="Edit Date Routine">${ICON.edit} <span>Open &amp; Edit</span></button>
            <button class="pill danger action-btn-del" data-month-delete="${date}" title="Delete Routine for this date" aria-label="Delete Date Routine">${ICON.trash} <span>Delete</span></button>
          </div>
        </div>
        <table class="mini-routine">
          <thead>
            <tr style="color:var(--text-muted); font-size:11.5px; text-transform:uppercase; letter-spacing:0.04em;">
              <th style="text-align:left; padding:6px 4px; font-weight:600; width:25%;">Time</th>
              <th style="text-align:left; padding:6px 4px; font-weight:600; width:30%;">Subject</th>
              <th style="text-align:left; padding:6px 4px; font-weight:600;">Topic / Tasks</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>
              <td style="font-family:var(--font-mono); font-size:12px; color:var(--accent2);">${escapeHtml(r.startTime || '--:--')} – ${escapeHtml(r.endTime || '--:--')}</td>
              <td style="font-weight:600; color:var(--text);">${escapeHtml(r.subject || 'No Subject')}</td>
              <td style="color:var(--text-soft);">${escapeHtml(r.task || '—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </article>`;
    }).join('') : `
      <div class="empty-state glass" style="text-align:center; padding:36px 20px; border:1px dashed var(--border); border-radius:16px; margin: 10px 0;">
        <div style="width:48px; height:48px; border-radius:50%; background:rgba(99,102,241,0.12); color:var(--accent1); display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
          <i data-lucide="calendar-x" style="width:24px; height:24px;"></i>
        </div>
        <h4 style="margin:0 0 6px; font-size:16px; color:var(--text);">No routines scheduled for this month</h4>
        <p style="margin:0 0 16px; color:var(--text-soft); font-size:13px;">You have no study blocks planned for ${document.getElementById('monthDropdown')?.selectedOptions[0]?.text || 'this month'}.</p>
        <button class="pill solid" id="monthlyBackToDailyBtn" type="button" style="display:inline-flex; align-items:center; gap:8px;">
          <i data-lucide="arrow-left"></i> Back to Daily Routine
        </button>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  const todayRoutineBtn = document.getElementById('todayRoutineBtn');
  if (todayRoutineBtn) {
    todayRoutineBtn.addEventListener('click', () => {
      const now = new Date();
      currentViewYear = now.getFullYear();
      currentViewMonth = now.getMonth();
      routineDateFilter = dateKey(now.getTime());
      const mSel = document.getElementById('monthDropdown');
      if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
      toggleMonthlyRoutineView(false);
    });
  }

  const monthlyRoutineBtn = document.getElementById('monthlyRoutineBtn');
  if (monthlyRoutineBtn) {
    monthlyRoutineBtn.addEventListener('click', () => {
      toggleMonthlyRoutineView();
    });
  }

  // Handle empty routine buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('#emptyLoadDefaultsBtn')) {
      const todayTarget = routineDateFilter || dateKey(Date.now());
      const defaults = buildDefaultRoutine(todayTarget);
      if (!Array.isArray(state.routine)) state.routine = [];
      state.routine.push(...defaults);
      saveData();
      renderRoutine();
      if (typeof showToast === 'function') showToast('Recommended BCS routine loaded for today!');
    } else if (e.target.closest('#emptyAddBlockBtn')) {
      const inlineAdd = document.getElementById('inlineAddRowBtn');
      if (inlineAdd) inlineAdd.click();
    }
  });

  const monthlyRoutineView = document.getElementById('monthlyRoutineView');
  if (monthlyRoutineView) {
    monthlyRoutineView.addEventListener('click', (e) => {
      const edit = e.target.closest('[data-month-edit]');
      const del = e.target.closest('[data-month-delete]');
      const back = e.target.closest('#monthlyBackToDailyBtn');
      if (back) {
        toggleMonthlyRoutineView(false);
        return;
      }
      if (edit) {
        const d = new Date(edit.dataset.monthEdit + 'T00:00:00');
        routineDateFilter = edit.dataset.monthEdit;
        currentViewYear = d.getFullYear();
        currentViewMonth = d.getMonth();
        const mSel = document.getElementById('monthDropdown');
        if (mSel) mSel.value = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
        toggleMonthlyRoutineView(false);
      }
      if (del && window.confirm('Delete all routines for this date?')) {
        state.routine = state.routine.filter(r => r.date !== del.dataset.monthDelete);
        saveData();
        renderDateSlider();
        renderRoutine();
        showMonthlyRoutines();
      }
    });
  }

  // ===== Quotes Manager =====
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const quoteIntervals = [10, 30, 60, 120, 300, 600, 900, 1800, 3600];
  let quoteRotationTimer = null;
  let editingQuoteId = null;

  function quoteManagerEntries() {
    const deleted = new Set(state.deletedQuotes || []);

    // 1. User's custom quotes
    const customEntries = (state.customQuotes || []).map(q => ({
      id: String(q.id),
      text: q.text,
      author: q.author || null,
      source: 'custom'
    })).filter(e => !deleted.has(e.id));

    // 2. Curated routine quotes
    const ownEntries = ownQuotes.map((q, i) => ({
      id: `builtin-own-${i}`,
      text: typeof q === 'string' ? q : q.text,
      author: 'CareerDesk',
      source: 'builtin'
    })).filter(e => !deleted.has(e.id));

    // 3. Famous figures quotes
    const famousEntries = famousQuotes.map((q, i) => ({
      id: `builtin-famous-${i}`,
      text: q.q,
      author: q.a,
      source: 'famous'
    })).filter(e => !deleted.has(e.id));

    return [...customEntries, ...ownEntries, ...famousEntries];
  }

  function currentPool() {
    const entries = quoteManagerEntries();
    if (!entries.length) {
      return [{ q: 'ছোট ছোট প্রতিদিনের চেষ্টাই একদিন বড় সাফল্য তৈরি করে।', a: 'CareerDesk' }];
    }
    return entries.map(e => ({ q: e.text, a: e.author }));
  }

  function renderQuote() {
    const pool = currentPool();
    if (!pool.length) return;
    if (state.quoteIdx >= pool.length) state.quoteIdx = 0;
    const item = pool[state.quoteIdx];
    if (quoteTextEl) quoteTextEl.textContent = item.q;
    if (quoteAuthorEl) quoteAuthorEl.textContent = item.a ? '— ' + item.a : 'CareerDesk • Daily practice';
    updateTicker(item.a ? item.q + ' — ' + item.a : item.q);
  }

  function renderQuoteManager() {
    const list = document.getElementById('quoteManagerList');
    const countBadge = document.getElementById('quoteCountBadge');
    if (!list) return;

    const entries = quoteManagerEntries();
    if (countBadge) countBadge.textContent = String(entries.length);

    if (!entries.length) {
      list.innerHTML = `
        <div class="quote-empty-state">
          <svg style="width:28px; height:28px; opacity:0.6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 7 1 8 3 8z"/>
            <path d="M17 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 7 1 8 3 8z"/>
          </svg>
          <span>No active quotes found. Add a quote below to start rotation.</span>
        </div>`;
      return;
    }

    list.innerHTML = entries.map(entry => {
      const badgeClass = entry.source === 'custom' ? 'badge-custom' : (entry.source === 'famous' ? 'badge-famous' : 'badge-builtin');
      const badgeText = entry.source === 'custom' ? 'Custom' : (entry.source === 'famous' ? 'Famous' : 'Curated');
      const authorText = entry.author ? escapeHtml(entry.author) : 'CareerDesk';

      return `
        <div class="quote-item-card" data-quote-id="${escapeAttr(entry.id)}">
          <div class="quote-item-body">
            <div class="quote-item-text">${escapeHtml(entry.text)}</div>
            <div class="quote-item-meta">
              <span class="quote-item-author">— ${authorText}</span>
              <span class="quote-item-badge ${badgeClass}">${badgeText}</span>
            </div>
          </div>
          <div class="quote-item-actions btn-group">
            <button class="quote-action-btn edit-btn" data-edit-quote="${escapeAttr(entry.id)}" type="button" title="Edit Quote">
              ${ICON.edit} <span>Edit</span>
            </button>
            <button class="quote-action-btn delete-btn" data-delete-quote="${escapeAttr(entry.id)}" type="button" title="Delete Quote">
              ${ICON.trash} <span>Delete</span>
            </button>
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

  function nextQuote() {
    const pool = currentPool();
    if (!pool.length) return;
    state.quoteIdx = (state.quoteIdx + 1) % pool.length;
    renderQuote();
  }

  function startQuoteRotation() {
    clearInterval(quoteRotationTimer);
    const interval = typeof state.quoteCarouselInterval === 'number' && state.quoteCarouselInterval >= 5
      ? state.quoteCarouselInterval
      : 300;
    state.quoteCarouselInterval = interval;
    quoteRotationTimer = setInterval(nextQuote, interval * 1000);
  }

  function syncQuoteSettings() {
    const intervalSelect = document.getElementById('quoteIntervalSelect');
    if (intervalSelect) {
      const current = typeof state.quoteCarouselInterval === 'number' ? state.quoteCarouselInterval : 300;
      let opt = intervalSelect.querySelector(`option[value="${current}"]`);
      if (opt) {
        intervalSelect.value = String(current);
      } else {
        const newOpt = document.createElement('option');
        newOpt.value = String(current);
        newOpt.textContent = current < 60 ? `${current} Seconds` : `${Math.round(current / 60)} Minutes`;
        intervalSelect.appendChild(newOpt);
        intervalSelect.value = String(current);
      }
    }
  }

  // Alias for compatibility
  function startQuoteCarousel() { startQuoteRotation(); }
  function syncCarouselControls() { syncQuoteSettings(); }

  const quoteIntervalSelect = document.getElementById('quoteIntervalSelect');
  if (quoteIntervalSelect) {
    quoteIntervalSelect.addEventListener('change', (event) => {
      const val = parseInt(event.target.value, 10) || 300;
      state.quoteCarouselInterval = val;
      startQuoteRotation();
      saveData();
      const label = val < 60 ? `${val} seconds` : `${Math.round(val / 60)} minutes`;
      showToast(`Quotes rotation interval set to ${label}`);
    });
  }

  // Add new quote
  const addQuoteBtn = document.getElementById('addQuoteBtn');
  if (addQuoteBtn) {
    addQuoteBtn.addEventListener('click', () => {
      const input = document.getElementById('customQuoteInput');
      const authorInput = document.getElementById('customQuoteAuthorInput');
      const text = input ? input.value.trim() : '';
      const author = authorInput ? authorInput.value.trim() || null : null;
      if (!text) {
        showToast('Please enter a quote text', true);
        if (input) input.focus();
        return;
      }
      if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
      state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
      state.quoteIdx = 0;
      if (input) input.value = '';
      if (authorInput) authorInput.value = '';
      renderQuoteManager();
      renderQuote();
      saveData();
      showToast('New quote added to your rotation');
    });
  }

  // Quote list actions (Edit & Delete delegation)
  const quoteManagerList = document.getElementById('quoteManagerList');
  if (quoteManagerList) {
    quoteManagerList.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-quote]');
      const deleteBtn = e.target.closest('[data-delete-quote]');
      if (editBtn) {
        openEditQuoteModal(editBtn.dataset.editQuote);
      }
      if (deleteBtn) {
        deleteQuoteEntry(deleteBtn.dataset.deleteQuote);
      }
    });
  }

  function openEditQuoteModal(id) {
    const entry = quoteManagerEntries().find(item => item.id === id);
    if (!entry) return;
    editingQuoteId = id;
    const modal = document.getElementById('editQuoteModal');
    const textInput = document.getElementById('editQuoteTextInput');
    const authorInput = document.getElementById('editQuoteAuthorInput');
    if (textInput) textInput.value = entry.text || '';
    if (authorInput) authorInput.value = entry.author || '';
    if (modal) {
      modal.style.display = 'flex';
      if (textInput) textInput.focus();
    }
  }

  function closeEditQuoteModal() {
    const modal = document.getElementById('editQuoteModal');
    if (modal) modal.style.display = 'none';
    editingQuoteId = null;
  }

  function saveEditedQuote() {
    if (!editingQuoteId) return;
    const textInput = document.getElementById('editQuoteTextInput');
    const authorInput = document.getElementById('editQuoteAuthorInput');
    const text = textInput ? textInput.value.trim() : '';
    const author = authorInput ? authorInput.value.trim() || null : null;
    if (!text) {
      showToast('Quote text cannot be empty', true);
      return;
    }

    if (editingQuoteId.startsWith('builtin-')) {
      if (!Array.isArray(state.deletedQuotes)) state.deletedQuotes = [];
      if (!state.deletedQuotes.includes(editingQuoteId)) {
        state.deletedQuotes.push(editingQuoteId);
      }
      if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
      state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
    } else {
      const target = (state.customQuotes || []).find(item => String(item.id) === editingQuoteId);
      if (target) {
        target.text = text;
        target.author = author;
      } else {
        if (!Array.isArray(state.customQuotes)) state.customQuotes = [];
        state.customQuotes.unshift({ id: Date.now(), text, author, source: 'custom' });
      }
    }

    closeEditQuoteModal();
    saveData();
    renderQuoteManager();
    renderQuote();
    showToast('Quote updated successfully');
  }

  function deleteQuoteEntry(id) {
    const entry = quoteManagerEntries().find(item => item.id === id);
    const preview = entry ? `"${entry.text.slice(0, 35)}${entry.text.length > 35 ? '...' : ''}"` : 'this quote';
    if (!window.confirm(`Delete ${preview}?\n\nIt will be removed from your routine rotation.`)) return;

    if (id.startsWith('builtin-')) {
      if (!Array.isArray(state.deletedQuotes)) state.deletedQuotes = [];
      if (!state.deletedQuotes.includes(id)) {
        state.deletedQuotes.push(id);
      }
    } else {
      state.customQuotes = (state.customQuotes || []).filter(item => String(item.id) !== id);
    }

    saveData();
    renderQuoteManager();
    renderQuote();
    showToast('Quote deleted');
  }

  // Modal event listeners
  const closeEditModalBtn = document.getElementById('closeEditQuoteModal');
  const cancelEditModalBtn = document.getElementById('cancelEditQuoteBtn');
  const saveEditModalBtn = document.getElementById('saveEditQuoteBtn');
  const editModalEl = document.getElementById('editQuoteModal');

  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditQuoteModal);
  if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeEditQuoteModal);
  if (saveEditModalBtn) saveEditModalBtn.addEventListener('click', saveEditedQuote);
  if (editModalEl) {
    editModalEl.addEventListener('click', (e) => {
      if (e.target === editModalEl) closeEditQuoteModal();
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
      ctx.fillText(item.a ? ('— ' + item.a) : ('CareerDesk  •  ' + bnDate()), W / 2, H - 90);

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
      notesGrid.innerHTML = '<div class="empty-state">No notes found. Create a new note using the button above.</div>';
      return;
    }
    list.forEach(n => {
      const card = document.createElement('div');
      card.className = 'note-card glass' + (n.pinned ? ' pinned' : '');
      const d = new Date(n.ts);
      card.innerHTML = `
        <div class="note-top">
          <div class="note-title-wrap">
            <h3 class="note-title">${escapeHtml(n.title || 'Untitled')}</h3>
            <span class="note-tag">${escapeHtml(n.tag || 'General')}</span>
          </div>
          <button class="pin-btn ${n.pinned ? 'pin-active' : ''}" title="${n.pinned ? 'Unpin note' : 'Pin note'}" aria-label="Pin note" data-id="${n.id}">
            ${ICON.pin}
          </button>
        </div>
        <p class="note-body-text">${escapeHtml(n.body || '')}</p>
        <div class="note-footer">
          <time class="note-date" datetime="${new Date(n.ts).toISOString()}">
            <span class="note-date-icon">${ICON.clock}</span>
            <span>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </time>
          <div class="note-actions btn-group">
            <button class="note-action-btn edit-btn" title="Edit note" aria-label="Edit note" data-id="${n.id}">
              ${ICON.edit} <span>Edit</span>
            </button>
            <button class="note-action-btn del-btn" title="Delete note" aria-label="Delete note" data-id="${n.id}">
              ${ICON.trash} <span>Delete</span>
            </button>
          </div>
        </div>
      `;
      notesGrid.appendChild(card);
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  notesGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.classList.contains('del-btn')) {
      const n = state.notes.find(n => String(n.id) === id);
      const title = n && n.title ? `"${n.title}"` : 'this note';
      if (!window.confirm(`Are you sure you want to delete ${title}?`)) return;
      const card = btn.closest('.note-card');
      if (card) {
        card.style.transition = 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'scale(0.92) translateY(6px)';
        card.style.opacity = '0';
        setTimeout(() => {
          state.notes = state.notes.filter(n => String(n.id) !== id);
          renderNotes(); saveData();
          showToast('Note deleted');
        }, 200);
      } else {
        state.notes = state.notes.filter(n => String(n.id) !== id);
        renderNotes(); saveData();
        showToast('Note deleted');
      }
    } else if (btn.classList.contains('pin-btn')) {
      const n = state.notes.find(n => String(n.id) === id);
      if (n) { n.pinned = !n.pinned; renderNotes(); saveData(); }
    } else if (btn.classList.contains('edit-btn')) {
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
          <button class="pill solid" data-save="${id}">Save</button>
          <button class="pill" data-cancel="${id}">Cancel</button>
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
      toggleNoteBtn.innerHTML = isOpen ? `${ICON.plus} New Note` : `${ICON.x} Close Form`;
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
      toggleNoteBtn.innerHTML = `${ICON.plus} New Note`;
      toggleNoteBtn.classList.remove('active-open');
    }
    showToast('Note saved successfully!');
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

  function toBnDigits(n) { return String(n); }

  function dateKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function todayKey() { return dateKey(Date.now()); }
  function fmtHM(mins) {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h > 0 ? (`${h}h ${m}m`) : (`${m}m`);
  }
  function fmtClock(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(secs % 60)).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  const SUBJECT_ALIASES = {
    'english': 'English',
    'ইংরেজি': 'English',
    'math': 'Mathematics',
    'mathematics': 'Mathematics',
    'গণিত': 'Mathematics',
    'বাংলা': 'Bangla',
    'bangla': 'Bangla',
    'বাংলা সাহিত্য': 'Bangla Literature',
    'bangla literature': 'Bangla Literature',
    'বাংলা ব্যাকরণ': 'Bangla Grammar',
    'bangla grammar': 'Bangla Grammar',
    'general knowledge': 'General Knowledge',
    'সাধারণ জ্ঞান': 'General Knowledge',
    'সাধারণ জ্ঞান / অন্যান্য': 'General Knowledge',
    'general science': 'General Science',
    'সাধারণ বিজ্ঞান': 'General Science',
    'bangladesh affairs': 'Bangladesh Affairs',
    'বাংলাদেশ বিষয়াবলী': 'Bangladesh Affairs',
    'বাংলাদেশ বিষয়াবলী': 'Bangladesh Affairs',
    'international affairs': 'International Affairs',
    'আন্তর্জাতিক বিষয়াবলী': 'International Affairs',
    'আন্তর্জাতিক বিষয়াবলী': 'International Affairs',
    'computer & ict': 'Computer & ICT',
    'কম্পিউটার ও আইসিটি': 'Computer & ICT'
  };

  function canonicalSubjectName(subject) {
    const value = String(subject || '').trim();
    return SUBJECT_ALIASES[value.toLowerCase()] || value;
  }

  function uniqueSubjectNames(subjects) {
    const seen = new Set();
    return subjects.map(canonicalSubjectName).filter(subject => {
      const key = subject.toLowerCase();
      if (!subject || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const DEFAULT_SUBJECTS = [
    'Bangla Literature',
    'Bangla Grammar',
    'English',
    'Mathematics',
    'Bangladesh Affairs',
    'International Affairs',
    'General Science',
    'Computer & ICT'
  ];

  function masterSubjectList(includeDeleted = false) {
    const fromRoutine = (state.routine || []).map(r => r.subject).filter(Boolean);
    const fromSessions = (state.sessions || []).map(s => s.subject).filter(Boolean);
    const fromCustom = Array.isArray(state.customSubjects) ? state.customSubjects : [];
    const fromSyllabus = (state.syllabus || []).map(c => c.name).filter(Boolean);
    const fromFlashcards = (state.flashcards || []).map(f => f.category).filter(Boolean);
    const fromDeleted = Array.isArray(state.deletedSubjects) ? state.deletedSubjects : [];

    const all = uniqueSubjectNames([
      ...DEFAULT_SUBJECTS,
      ...fromCustom,
      ...fromSyllabus,
      ...fromRoutine,
      ...fromSessions,
      ...fromFlashcards,
      ...(includeDeleted ? fromDeleted : [])
    ]);

    if (includeDeleted) return all;
    const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
    return all.filter(s => !deletedSet.has(canonicalSubjectName(s).toLowerCase()));
  }

  function subjectList() {
    return masterSubjectList(false);
  }

  function renderSubjectSelect() {
    const sel = document.getElementById('sessionSubject');
    const chipsContainer = document.getElementById('quickSubjectChips');
    const datalist = document.getElementById('appSubjectDatalist');
    const subs = subjectList();

    // 1. Sync global datalist for Routine and Syllabus
    if (datalist) {
      datalist.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}"></option>`).join('');
    }

    // 2. Populate Tracker dropdown
    if (sel) {
      const previousValue = sel.value || (state.activeSession ? state.activeSession.subject : '') || '';
      const previousCustomValue = sessionCustomInput ? sessionCustomInput.value : '';

      sel.innerHTML = subs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')
        + '<option value="__custom__">+ Add New Subject</option>';

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

    // 3. Populate Quick Select Chips in Tracker
    if (chipsContainer) {
      const currentSelected = sel ? sel.value : '';
      if (!subs.length) {
        chipsContainer.innerHTML = '<span style="font-size:12px; color:var(--text-soft); padding:4px 0;">No subjects added yet.</span>';
      } else {
        chipsContainer.innerHTML = subs.map(s => `
          <button type="button" class="chip subject-chip ${s === currentSelected ? 'active' : ''}" data-subject-chip="${escapeAttr(s)}" title="Switch to ${escapeAttr(s)}">
            ${escapeHtml(s)}
          </button>
        `).join('');
      }
    }
  }

  // ===== Subject Manager (Settings Panel) =====
  function getSubjectStats(s) {
    const canonicalS = canonicalSubjectName(s).toLowerCase();
    const sessions = (state.sessions || []).filter(sess => canonicalSubjectName(sess.subject).toLowerCase() === canonicalS);
    const totalMin = sessions.reduce((acc, sess) => acc + (sess.duration || 0), 0);
    const routineCount = (state.routine || []).filter(r => canonicalSubjectName(r.subject).toLowerCase() === canonicalS).length;
    const syllabusCat = (state.syllabus || []).find(c => canonicalSubjectName(c.name).toLowerCase() === canonicalS);
    const topicsCount = syllabusCat ? (syllabusCat.topics || []).length : 0;
    const topicsDone = syllabusCat ? (syllabusCat.topics || []).filter(t => t.done).length : 0;
    const cardCount = (state.flashcards || []).filter(f => canonicalSubjectName(f.category).toLowerCase() === canonicalS).length;

    return {
      sessionCount: sessions.length,
      totalMin,
      routineCount,
      topicsCount,
      topicsDone,
      cardCount
    };
  }

  function renderSubjectManager() {
    const container = document.getElementById('subjectManagerList');
    const deletedSection = document.getElementById('deletedSubjectSection');
    const deletedContainer = document.getElementById('deletedSubjectList');
    const countBadge = document.getElementById('subjectCountBadge');
    if (!container) return;

    const activeSubjects = masterSubjectList(false);
    const deletedSet = new Set((state.deletedSubjects || []).map(s => canonicalSubjectName(s).toLowerCase()));
    const allSubjects = masterSubjectList(true);
    const deletedSubjects = allSubjects.filter(s => deletedSet.has(canonicalSubjectName(s).toLowerCase()));

    if (countBadge) {
      countBadge.textContent = `${activeSubjects.length} Active`;
    }

    if (!activeSubjects.length) {
      container.innerHTML = '<p style="color:var(--text-soft); font-size:13px; margin:8px 0;">No active subjects found. Click "Reset Defaults" or add a new subject above.</p>';
    } else {
      container.innerHTML = activeSubjects.map(s => {
        const stats = getSubjectStats(s);
        const statPills = [];
        if (stats.totalMin > 0) {
          statPills.push(`<span class="subj-stat-pill" title="Total study logged">${ICON.clock} ${fmtHM(stats.totalMin)}</span>`);
        } else if (stats.sessionCount > 0) {
          statPills.push(`<span class="subj-stat-pill" title="Sessions logged">${stats.sessionCount} sessions</span>`);
        }
        if (stats.routineCount > 0) {
          statPills.push(`<span class="subj-stat-pill" title="Routine blocks scheduled">${stats.routineCount} routine blocks</span>`);
        }
        if (stats.topicsCount > 0) {
          statPills.push(`<span class="subj-stat-pill" title="Syllabus topics (${stats.topicsDone}/${stats.topicsCount} done)">${stats.topicsDone}/${stats.topicsCount} topics</span>`);
        }
        if (stats.cardCount > 0) {
          statPills.push(`<span class="subj-stat-pill" title="Quiz / Flashcards">${stats.cardCount} cards</span>`);
        }

        const statsHtml = statPills.length
          ? `<div class="subject-stats-badges">${statPills.join('')}</div>`
          : '<span style="font-size:11.5px; color:var(--text-soft); opacity:0.7;">No logged activity</span>';

        return `
          <div class="subject-manager-row">
            <div class="subject-info">
              <span class="subject-manager-name">${escapeHtml(s)}</span>
              ${statsHtml}
            </div>
            <div class="btn-group subject-row-actions">
              <button class="pill subtle subject-rename-btn" data-rename-subject="${escapeAttr(s)}" type="button" title="Rename this subject everywhere">
                ${ICON.edit} <span>Rename</span>
              </button>
              <button class="pill danger subject-delete-btn" data-subject="${escapeAttr(s)}" type="button" title="Hide/Delete this subject">
                ${ICON.trash} <span>Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (deletedSection && deletedContainer) {
      if (deletedSubjects.length > 0) {
        deletedSection.style.display = 'block';
        deletedContainer.innerHTML = deletedSubjects.map(s => `
          <div class="subject-manager-row subject-deleted">
            <div class="subject-info">
              <span class="subject-manager-name">${escapeHtml(s)}</span>
            </div>
            <button class="pill subject-restore-btn" data-restore-subject="${escapeAttr(s)}" type="button" title="Restore this subject to active list">
              ${ICON.undo} <span>Restore</span>
            </button>
          </div>
        `).join('');
      } else {
        deletedSection.style.display = 'none';
        deletedContainer.innerHTML = '';
      }
    }
  }

  function renameSubject(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const oldCanonical = canonicalSubjectName(oldName).toLowerCase();

    // 1. Routine
    if (Array.isArray(state.routine)) {
      state.routine.forEach(r => {
        if (canonicalSubjectName(r.subject).toLowerCase() === oldCanonical) {
          r.subject = newName;
        }
      });
    }

    // 2. Sessions
    if (Array.isArray(state.sessions)) {
      state.sessions.forEach(s => {
        if (canonicalSubjectName(s.subject).toLowerCase() === oldCanonical) {
          s.subject = newName;
        }
      });
    }

    // 3. Active session
    if (state.activeSession && canonicalSubjectName(state.activeSession.subject).toLowerCase() === oldCanonical) {
      state.activeSession.subject = newName;
    }

    // 4. Custom subjects
    if (Array.isArray(state.customSubjects)) {
      const idx = state.customSubjects.findIndex(c => canonicalSubjectName(c).toLowerCase() === oldCanonical);
      if (idx !== -1) {
        state.customSubjects[idx] = newName;
      } else {
        state.customSubjects.push(newName);
      }
    } else {
      state.customSubjects = [newName];
    }

    // 5. Syllabus categories
    if (Array.isArray(state.syllabus)) {
      state.syllabus.forEach(cat => {
        if (canonicalSubjectName(cat.name).toLowerCase() === oldCanonical) {
          cat.name = newName;
        }
      });
    }

    // 6. Flashcards
    if (Array.isArray(state.flashcards)) {
      state.flashcards.forEach(fc => {
        if (canonicalSubjectName(fc.category).toLowerCase() === oldCanonical) {
          fc.category = newName;
        }
      });
    }

    // 7. Deleted subjects
    if (Array.isArray(state.deletedSubjects)) {
      state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== oldCanonical);
    }

    saveData();
    syncAllSubjectSelects();
    renderRoutine();
    renderCategories();
    renderFlashcards();
    renderTrackerRoutinePreview();
    showToast(`Renamed "${oldName}" to "${newName}" across all data.`);
  }

  function deleteSubject(subj) {
    if (!subj) return;
    const confirmed = confirm(`Delete / hide subject "${subj}"?\n\nThis will remove it from all subject pickers (Routine, Tracker, Syllabus, Quiz). Your past study sessions and routine entries will be safely preserved.`);
    if (!confirmed) return;

    if (!Array.isArray(state.deletedSubjects)) state.deletedSubjects = [];
    const canonical = canonicalSubjectName(subj);
    if (!state.deletedSubjects.some(s => canonicalSubjectName(s).toLowerCase() === canonical.toLowerCase())) {
      state.deletedSubjects.push(canonical);
    }
    saveData();
    syncAllSubjectSelects();
    showToast(`"${subj}" removed from active subjects.`);
  }

  function restoreSubject(subj) {
    if (!subj) return;
    const canonical = canonicalSubjectName(subj).toLowerCase();
    if (Array.isArray(state.deletedSubjects)) {
      state.deletedSubjects = state.deletedSubjects.filter(s => canonicalSubjectName(s).toLowerCase() !== canonical);
    }
    saveData();
    syncAllSubjectSelects();
    showToast(`"${subj}" restored to active subjects.`);
  }

  function syncAllSubjectSelects() {
    renderSubjectSelect();
    renderFlashCategoryOptions();
    renderSubjectManager();
  }

  // Quick subject chips click handler
  const quickSubjectChipsEl = document.getElementById('quickSubjectChips');
  if (quickSubjectChipsEl) {
    quickSubjectChipsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-subject-chip]');
      if (!chip) return;
      if (state.activeSession) {
        showToast('A study session is currently active. Stop it before switching subjects.', true);
        return;
      }
      const subj = chip.dataset.subjectChip;
      const sel = document.getElementById('sessionSubject');
      if (sel) {
        sel.value = subj;
        if (sessionCustomInput) {
          sessionCustomInput.style.display = 'none';
          sessionCustomInput.value = '';
        }
      }
      quickSubjectChipsEl.querySelectorAll('.subject-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.subjectChip === subj);
      });
      refreshTimerSub();
    });
  }

  // Quick link to manage subjects in settings
  const manageSubjLink = document.querySelector('.manage-subjects-link');
  if (manageSubjLink) {
    manageSubjLink.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab('settings', true);
      setTimeout(() => {
        const el = document.getElementById('subjectManagerList');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    });
  }

  // Subject Manager delegated click handlers (Rename, Delete)
  const subjManagerListEl = document.getElementById('subjectManagerList');
  if (subjManagerListEl) {
    subjManagerListEl.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.subject-delete-btn');
      if (delBtn) {
        deleteSubject(delBtn.dataset.subject);
        return;
      }
      const renameBtn = e.target.closest('.subject-rename-btn');
      if (renameBtn) {
        const oldName = renameBtn.dataset.renameSubject;
        const newName = prompt(`Rename subject "${oldName}" across all routine, tracker, and syllabus data:`, oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
          renameSubject(oldName, newName.trim());
        }
        return;
      }
    });
  }

  // Deleted Subject List restore button
  const deletedListEl = document.getElementById('deletedSubjectList');
  if (deletedListEl) {
    deletedListEl.addEventListener('click', (e) => {
      const restoreBtn = e.target.closest('.subject-restore-btn');
      if (restoreBtn) {
        restoreSubject(restoreBtn.dataset.restoreSubject);
      }
    });
  }

  // Reset default curriculum subjects
  const resetDefaultsBtn = document.getElementById('resetDefaultSubjectsBtn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      const ok = confirm('Reset subjects to default curriculum list?\n\nThis will restore any default subjects that were hidden.');
      if (!ok) return;
      const defaultCanonicals = new Set(DEFAULT_SUBJECTS.map(s => canonicalSubjectName(s).toLowerCase()));
      if (Array.isArray(state.deletedSubjects)) {
        state.deletedSubjects = state.deletedSubjects.filter(s => !defaultCanonicals.has(canonicalSubjectName(s).toLowerCase()));
      }
      saveData();
      syncAllSubjectSelects();
      showToast('Default curriculum subjects restored.');
    });
  }

  function refreshTimerSub() {
    if (state.activeSession || window.isCustomCountdownActive) return;
    const sub = document.getElementById('timerSub');
    if (!sub) return;
    if (timerMode === 'break') {
      const reason = document.getElementById('breakReason')?.value || 'Refreshment';
      sub.innerHTML = `<strong>${selectedDuration}-minute ${escapeHtml(reason.toLowerCase())}</strong> break — recharge before your next focus block`;
      return;
    }
    const subject = currentSubjectValue() || 'General';
    if (selectedDuration === 0) {
      sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — Stopwatch mode — click Start to track time`;
    } else {
      sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — ${selectedDuration} minute focus session`;
    }
  }

  sessionSubjectSel.addEventListener('change', () => {
    sessionCustomInput.style.display = sessionSubjectSel.value === '__custom__' ? 'block' : 'none';
    if (sessionSubjectSel.value !== '__custom__') {
      sessionCustomInput.value = '';
    }
    const currentVal = sessionSubjectSel.value;
    const chipsContainer = document.getElementById('quickSubjectChips');
    if (chipsContainer) {
      chipsContainer.querySelectorAll('.subject-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.subjectChip === currentVal);
      });
    }
    refreshTimerSub();
  });
  if (sessionCustomInput) {
    sessionCustomInput.addEventListener('input', refreshTimerSub);
  }
  const breakReasonSelect = document.getElementById('breakReason');
  if (breakReasonSelect) breakReasonSelect.addEventListener('change', refreshTimerSub);

  function currentSubjectValue() {
    if (sessionSubjectSel.value === '__custom__') return sessionCustomInput.value.trim();
    return sessionSubjectSel.value;
  }

  startBtn.addEventListener('click', () => {
    if (!timerMode) return;
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
    if (!timerDisplay) return;
    if (!state.activeSession) {
      timerDisplay.textContent = '00:00:00';
      if (timerSub && !timerSub.textContent.trim()) {
        timerSub.innerHTML = 'Select a subject and duration to begin focus session';
      }
      if (orb) orb.classList.remove('active');
      syncMiniTimerWidget();
      return;
    }
    if (orb) orb.classList.add('active');
    const secs = Math.floor((Date.now() - state.activeSession.start) / 1000);
    timerDisplay.textContent = fmtClock(secs);
    if (timerSub) {
      timerSub.innerHTML = '<span class="timer-dot"></span> Studying <strong>' + escapeHtml(state.activeSession.subject) + '</strong> in progress';
    }
    syncMiniTimerWidget();
    renderTodaySessions();
  }

  function renderTodaySessions() {
    const box = document.getElementById('todaySessions');
    if (!box) return;
    const studyEntries = state.sessions
      .filter(s => dateKey(s.start) === todayKey())
      .map(s => ({ ...s, entryType: 'study' }));
    const breakEntries = getTodayBreakEntries()
      .map(entry => ({ ...entry, entryType: 'break', subject: entry.reason || 'Break' }));
    const liveEntries = [];
    if (state.activeSession) {
      liveEntries.push({
        id: 'active-study',
        start: state.activeSession.start,
        duration: Math.max(0, Math.floor((Date.now() - state.activeSession.start) / 60000)),
        subject: state.activeSession.subject,
        entryType: 'active-study'
      });
    }
    if (window.isCustomCountdownActive && timerMode === 'break') {
      liveEntries.push({
        id: 'active-break',
        start: Date.now() - Math.max(0, (selectedDuration * 60) - customCountdownSecs) * 1000,
        duration: Math.max(0, Math.floor(((selectedDuration * 60) - customCountdownSecs) / 60)),
        subject: document.getElementById('breakReason')?.value || 'Refreshment',
        entryType: 'active-break'
      });
    }
    const list = [...studyEntries, ...breakEntries, ...liveEntries].sort((a, b) => b.start - a.start);
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = list.map(s => {
      const st = new Date(s.start), en = s.end ? new Date(s.end) : new Date();
      const timeStr = st.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' – ' + en.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const pct = Math.min(100, Math.max(8, Math.round((s.duration / Math.max(1, state.dailyTargetMinutes)) * 100)));
      const isBreak = s.entryType === 'break' || s.entryType === 'active-break';
      const isActive = s.entryType === 'active-study' || s.entryType === 'active-break';
      const label = isBreak ? `${escapeHtml(s.subject)} Break` : escapeHtml(s.subject);
      return `<div class="session-item">
        <div class="session-item-header">
          <div class="s-subject">${label}${isActive ? ' <span class="timer-dot"></span>' : ''}</div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="s-badge">${isActive ? 'Live' : fmtHM(s.duration)}</span>
            ${!isActive && !isBreak ? `<button class="s-del-btn" title="Delete session" data-delsession="${s.id}">${ICON.x}</button>` : ''}
          </div>
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

  const todaySessionsBox = document.getElementById('todaySessions');
  if (todaySessionsBox) {
    todaySessionsBox.addEventListener('click', (e) => {
      const del = e.target.closest('[data-delsession]');
      if (del) {
        const id = del.dataset.delsession;
        state.sessions = state.sessions.filter(s => String(s.id) !== id);
        saveData();
        renderTrackerAll();
        showToast('Session deleted');
      }
    });
  }

  function renderProgress() {
    const todayTotal = state.sessions.filter(s => dateKey(s.start) === todayKey()).reduce((a, s) => a + s.duration, 0);
    const target = state.dailyTargetMinutes || 1;
    const pct = Math.min(100, Math.round((todayTotal / target) * 100));
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressLabelLeft').textContent = fmtHM(todayTotal) + ' studied';
    document.getElementById('progressLabelRight').textContent = pct + '%';
    targetHoursInput.value = (state.dailyTargetMinutes / 60).toString();
    const settingsTargetInput = document.getElementById('targetHoursSettings');
    if (settingsTargetInput) settingsTargetInput.value = (state.dailyTargetMinutes / 60).toString();

    const verdict = document.getElementById('verdictBox');
    if (todayTotal === 0) {
      verdict.textContent = 'No study logged yet today — start your first session, you can do it!';
    } else if (pct >= 100) {
      verdict.textContent = 'Daily target completed! Outstanding effort today.';
    } else if (pct >= 75) {
      verdict.textContent = 'Almost there — just a little more focus to reach your goal.';
    } else if (pct >= 40) {
      verdict.textContent = 'Good start, keep up the momentum with another session.';
    } else {
      verdict.textContent = 'Study time is low today — jump into another focused session now.';
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
      ? 'Target Streak: ' + streak + (streak === 1 ? ' day' : ' days')
      : 'Start your study streak today!';
  }

  function renderSubjectBars() {
    const box = document.getElementById('subjectBars');
    if (!box) return;
    const today = state.sessions.filter(s => dateKey(s.start) === todayKey());
    const byTotal = {};
    today.forEach(s => { byTotal[s.subject] = (byTotal[s.subject] || 0) + s.duration; });
    const entries = Object.entries(byTotal).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { box.innerHTML = '<div class="empty-state">No study sessions logged today yet.</div>'; return; }
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
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        buckets.push({ label: 'Wk ' + wk, total, isToday: false });
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
    const fmt = (d) => d.getDate() + '/' + (d.getMonth() + 1);
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

  // ===== GitHub-style Study Activity Heatmap =====
  function renderStudyHeatmap() {
    const grid = document.getElementById('studyHeatmapGrid');
    if (!grid) return;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dailyMinutes = {};
    const dailySessionsCount = {};

    if (Array.isArray(state.sessions)) {
      state.sessions.forEach(s => {
        if (!s.start) return;
        const dk = dateKey(s.start);
        const mins = s.duration || 0;
        dailyMinutes[dk] = (dailyMinutes[dk] || 0) + mins;
        dailySessionsCount[dk] = (dailySessionsCount[dk] || 0) + 1;
      });
    }

    if (state.activeSession && state.activeSession.start) {
      const todayDk = dateKey(Date.now());
      const liveMins = Math.max(1, Math.floor((Date.now() - state.activeSession.start) / 60000));
      dailyMinutes[todayDk] = (dailyMinutes[todayDk] || 0) + liveMins;
      dailySessionsCount[todayDk] = (dailySessionsCount[todayDk] || 0) + 1;
    }

    const allMins = Object.values(dailyMinutes).reduce((a, b) => a + b, 0);
    const totalHoursStr = (allMins / 60).toFixed(1) + 'h';
    const activeDaysCount = Object.keys(dailyMinutes).filter(k => dailyMinutes[k] > 0).length;

    let streak = 0;
    let checkDate = new Date();
    const todayKeyStr = dateKey(checkDate.getTime());
    if (dailyMinutes[todayKeyStr] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (dailyMinutes[dateKey(checkDate.getTime())] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const streakEl = document.getElementById('heatmapStreakDays');
    const totalEl = document.getElementById('heatmapTotalHours');
    const activeEl = document.getElementById('heatmapActiveDays');
    if (streakEl) streakEl.textContent = streak;
    if (totalEl) totalEl.textContent = totalHoursStr;
    if (activeEl) activeEl.textContent = activeDaysCount;

    const currentDayOfWeek = today.getDay();
    const numWeeks = 18;
    const totalDays = numWeeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + (6 - currentDayOfWeek) + 1);
    startDate.setHours(0, 0, 0, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let html = '';
    let cur = new Date(startDate);

    for (let w = 0; w < numWeeks; w++) {
      let colHtml = '<div class="heatmap-col">';
      const colMonth = cur.getDate() <= 7 ? monthNames[cur.getMonth()] : '';
      colHtml += `<div class="heatmap-col-header">${colMonth}</div>`;

      for (let d = 0; d < 7; d++) {
        const dk = dateKey(cur.getTime());
        const isFuture = cur.getTime() > today.getTime();
        const mins = dailyMinutes[dk] || 0;
        const count = dailySessionsCount[dk] || 0;

        let lvl = 0;
        if (mins > 0 && mins < 60) lvl = 1;
        else if (mins >= 60 && mins < 120) lvl = 2;
        else if (mins >= 120 && mins < 240) lvl = 3;
        else if (mins >= 240) lvl = 4;

        const dateFormatted = cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        const title = isFuture ? '' : `${dateFormatted}: ${mins > 0 ? `${timeStr} studied (${count} session${count > 1 ? 's' : ''})` : 'No study recorded'}`;

        if (isFuture) {
          colHtml += `<div class="heatmap-cell" style="opacity:0.06; pointer-events:none;"></div>`;
        } else {
          colHtml += `<div class="heatmap-cell lvl-${lvl}" data-date="${dk}" title="${title}"></div>`;
        }

        cur.setDate(cur.getDate() + 1);
      }
      colHtml += '</div>';
      html += colHtml;
    }

    grid.innerHTML = html;
  }

  function renderTrackerAll() {
    renderSubjectSelect();
    renderSubjectManager();
    tickTimer();
    refreshTimerSub();
    startBtn.style.display = state.activeSession ? 'none' : 'inline-flex';
    stopBtn.style.display = state.activeSession ? 'inline-flex' : 'none';
    renderTodaySessions();
    renderProgress();
    renderSubjectBars();
    renderWeekChart();
    renderTrackerRoutinePreview();
    update24hActivityUI();
    renderStudyHeatmap();
    syncMiniTimerWidget();
  }

  // ===== Syllabus =====
  const categoryList = document.getElementById('categoryList');
  const openCategoryIds = new Set();
  const topicDeleteModeCategories = new Set();

  function syllabusTotals() {
    let total = 0, done = 0;
    state.syllabus.forEach(cat => { cat.topics.forEach(t => { total++; if (t.done) done++; }); });
    return { total, done };
  }

  function renderSyllabusOverall() {
    const { total, done } = syllabusTotals();
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('syllabusOverallLabel').textContent = `${done} / ${total} topics completed`;
    document.getElementById('syllabusOverallPct').textContent = pct + '%';
    document.getElementById('syllabusOverallFill').style.width = pct + '%';
  }

  function renderCategories() {
    if (!state.syllabus.length) {
      categoryList.innerHTML = '<div class="empty-state">No categories yet. Add one above to begin your syllabus.</div>';
      renderSyllabusOverall();
      return;
    }
    categoryList.innerHTML = state.syllabus.map(cat => {
      const total = cat.topics.length;
      const done = cat.topics.filter(t => t.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const isTopicDelActive = topicDeleteModeCategories.has(String(cat.id));
      const topicsHtml = cat.topics.length ? (
        '<div class="topic-tile-grid">' + cat.topics.map(t => `
          <div class="topic-tile ${t.done ? 'done' : ''}" data-cat="${cat.id}" data-topic="${t.id}">
            <span class="tile-label" data-topic-label="${t.id}" data-topic-cat="${cat.id}" title="Double-click to edit">${escapeHtml(t.name)}</span>
            <button class="tile-del" data-cat="${cat.id}" data-topic="${t.id}" title="Delete Topic" aria-label="Delete Topic">${ICON.x}</button>
          </div>
        `).join('') + '</div>'
      ) : '<div class="empty-state" style="padding:20px;">No topics in this category yet.</div>';

      const topicDelBanner = isTopicDelActive ? `
        <div class="topic-del-active-banner">
          <div class="del-banner-left">
            <span class="del-pulse-dot"></span>
            <span>Topic delete mode active — click <strong>✕</strong> on any topic to remove</span>
          </div>
          <button class="pill subtle mini-exit-del-btn" data-catdel-topics="${cat.id}" type="button">Done</button>
        </div>
      ` : '';

      return `
        <div class="category-card glass open ${isTopicDelActive ? 'topic-delete-mode' : ''}" data-cat="${cat.id}">
          <div class="category-head">
            <div class="category-head-left">
              <h3 class="category-title" data-category-title="${cat.id}" title="Double-click to edit">${escapeHtml(cat.name)}</h3>
            </div>
            <div class="category-head-right">
              <span class="category-progress-text">${done}/${total} • ${pct}%</span>
              <div class="category-mini-track"><div class="category-mini-fill" style="width:${pct}%"></div></div>
              <div class="btn-group category-action-group">
                <button class="cat-group-btn cat-add-btn" data-toggle-add-topic="${cat.id}" type="button" title="Add Topic" aria-label="Add Topic">
                  ${ICON.plus} <span>Add Topic</span>
                </button>
                <button class="cat-group-btn cat-edit-btn" data-edit-category="${cat.id}" type="button" title="Edit Category" aria-label="Edit Category">
                  ${ICON.edit} <span>Edit</span>
                </button>
                <div class="cat-del-dropdown-wrap">
                  <button class="cat-group-btn cat-del-trigger ${isTopicDelActive ? 'active' : ''}" data-catdel-trigger="${cat.id}" type="button" title="Delete Options" aria-label="Delete Options">
                    ${ICON.trash} <span>Delete</span>
                  </button>
                  <div class="cat-del-menu" data-catdel-dropdown="${cat.id}" style="display:none;">
                    <button class="cat-del-menu-item item-subject" data-catdel-subject="${cat.id}" type="button">
                      ${ICON.trash}
                      <span>Delete Subject</span>
                    </button>
                    <button class="cat-del-menu-item item-topics ${isTopicDelActive ? 'active-mode' : ''}" data-catdel-topics="${cat.id}" type="button">
                      ${ICON.x}
                      <span>${isTopicDelActive ? 'Done Deleting' : 'Delete Topic'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="category-body">
            ${topicDelBanner}
            ${topicsHtml}
            <div class="add-topic-row" data-topic-form="${cat.id}" style="display:none;">
              <input type="text" placeholder="Enter topic name" data-topicinput="${cat.id}">
              <button class="pill" data-addtopic="${cat.id}">Add</button>
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
    syncAllSubjectSelects();
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
          showToast('This topic already exists in this category.', true);
        } else {
          existingCat.topics.push({ id: Date.now(), name: firstTopic, done: false });
          showToast('Topic added to existing category.');
        }
      } else {
        showToast('This category already exists.', true);
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

    // Delete trigger clicked: toggle dropdown menu
    const delTrigger = e.target.closest('[data-catdel-trigger]');
    if (delTrigger) {
      const catId = delTrigger.dataset.catdelTrigger;
      const menu = categoryList.querySelector(`[data-catdel-dropdown="${catId}"]`);
      const isCurrentlyOpen = menu && menu.style.display === 'flex';
      document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
      if (!isCurrentlyOpen && menu) {
        menu.style.display = 'flex';
        delTrigger.classList.add('menu-open');
      }
      return;
    }

    // Delete Subject option
    const subBtn = e.target.closest('[data-catdel-subject]');
    if (subBtn) {
      const catId = subBtn.dataset.catdelSubject;
      const cat = state.syllabus.find(c => String(c.id) === catId);
      const catName = cat && cat.name ? `"${cat.name}"` : 'this subject/category';
      document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
      if (!window.confirm(`Are you sure you want to delete subject ${catName} and all its topics?`)) return;
      openCategoryIds.delete(catId);
      topicDeleteModeCategories.delete(catId);
      state.syllabus = state.syllabus.filter(c => String(c.id) !== catId);
      saveSyllabusAndRefresh();
      showToast('Subject deleted');
      return;
    }

    // Delete Topic / Toggle topic delete mode option
    const topBtn = e.target.closest('[data-catdel-topics]');
    if (topBtn) {
      const catId = String(topBtn.dataset.catdelTopics);
      document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
      if (topicDeleteModeCategories.has(catId)) {
        topicDeleteModeCategories.delete(catId);
        showToast('Topic delete mode disabled');
      } else {
        topicDeleteModeCategories.add(catId);
        showToast('Topic delete mode enabled. Click ✕ on topics to delete.');
      }
      renderCategories();
      return;
    }

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
      if (cat) {
        const topic = cat.topics.find(t => String(t.id) === btn.dataset.topic);
        const topicName = topic && topic.name ? `"${topic.name}"` : 'this topic';
        if (!window.confirm(`Are you sure you want to delete topic ${topicName}?`)) return;
        cat.topics = cat.topics.filter(t => String(t.id) !== btn.dataset.topic);
        if (!cat.topics.length) {
          topicDeleteModeCategories.delete(String(cat.id));
        }
        saveSyllabusAndRefresh();
        showToast('Topic deleted');
      }
      return;
    }

    if (e.target.closest('[data-addtopic]')) {
      const btn = e.target.closest('[data-addtopic]');
      const catId = btn.dataset.addtopic;
      const input = categoryList.querySelector(`[data-topicinput="${catId}"]`);
      const name = input ? input.value.trim() : '';
      if (!name) return;
      const cat = state.syllabus.find(c => String(c.id) === catId);
      if (cat) { cat.topics.push({ id: Date.now(), name, done: false }); input.value = ''; saveSyllabusAndRefresh(); }
      return;
    }

    if (e.target.closest('[data-toggle-add-topic]')) {
      const btn = e.target.closest('[data-toggle-add-topic]');
      const catId = btn.dataset.toggleAddTopic;
      const panel = categoryList.querySelector(`[data-topic-form="${catId}"]`);
      if (panel) {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        const input = panel.querySelector('input');
        if (panel.style.display === 'flex' && input) input.focus();
      }
      return;
    }

    if (e.target.closest('[data-edit-category]')) {
      const btn = e.target.closest('[data-edit-category]');
      const catId = btn.dataset.editCategory;
      const cat = state.syllabus.find(c => String(c.id) === catId);
      if (!cat) return;
      const name = window.prompt('Enter new category name:', cat.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      cat.name = trimmed;
      saveSyllabusAndRefresh();
      return;
    }
  });

  // Global click to dismiss category delete dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cat-del-dropdown-wrap')) {
      document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
    }
  });

  categoryList.addEventListener('dblclick', (e) => {
    const label = e.target.closest('.tile-label');
    if (label) {
      const cat = state.syllabus.find(c => String(c.id) === label.dataset.topicCat);
      if (!cat) return;
      const topic = cat.topics.find(t => String(t.id) === label.dataset.topicLabel);
      if (!topic) return;
      const name = window.prompt('Enter new topic name:', topic.name);
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
      const name = window.prompt('Enter new category name:', cat.name);
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

  function renderFlashCategoryOptions() {
    const routineSubjs = subjectList();
    const flashSubjs = Array.from(new Set(state.flashcards.map(f => f.category).filter(Boolean)));
    const allSubjs = Array.from(new Set([...routineSubjs, ...flashSubjs]));

    const opts = allSubjs.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('');
    if (flashCategorySel) flashCategorySel.innerHTML = '<option value="">No Category</option>' + opts;
    if (flashFilterSel) flashFilterSel.innerHTML = '<option value="all">All Subjects</option>' + opts;
  }

  function renderFlashcards() {
    const filter = flashFilterSel.value || 'all';
    const list = filter === 'all' ? state.flashcards : state.flashcards.filter(f => f.category === filter);
    const countBadge = document.getElementById('flashCountBadge');
    if (countBadge) {
      countBadge.innerHTML = `${ICON.layers} ${list.length} ${list.length === 1 ? 'Card' : 'Cards'}`;
    }

    if (!list.length) {
      flashGrid.innerHTML = '<div class="empty-state">No flashcards in this category. Click "Sync from MCQs" or "Create Card" above.</div>';
      return;
    }
    flashGrid.innerHTML = list.map(f => `
      <div class="flash-card" data-id="${f.id}">
        <div class="flash-card-actions">
          <button data-del="${f.id}" title="Delete Card">${ICON.x}</button>
        </div>
        <div class="flash-card-inner">
          <div class="flash-face flash-front">
            ${f.category ? `<span class="flash-card-tag">${escapeHtml(f.category)}</span>` : ''}
            <div style="font-weight:600; padding:0 6px;">${escapeHtml(f.front)}</div>
            <div style="position:absolute; bottom:8px; font-size:10.5px; opacity:0.6;">Click to reveal</div>
          </div>
          <div class="flash-face flash-back">
            <div style="font-size:13px; line-height:1.6; white-space:pre-wrap; max-height:100%; overflow-y:auto; padding:4px;">${escapeHtml(f.back)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  flashGrid.addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      if (window.confirm('Are you sure you want to delete this flashcard?')) {
        state.flashcards = state.flashcards.filter(f => String(f.id) !== delBtn.dataset.del);
        renderFlashcards();
        renderFlashCategoryOptions();
        saveData();
        showToast('Flashcard deleted');
      }
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
      toggleFlashBtn.innerHTML = isOpen ? `${ICON.plus} Create Card` : `${ICON.x} Close Form`;
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
    if (!front || !back) {
      showToast('Please provide both question and answer', true);
      return;
    }
    state.flashcards.push({ id: Date.now(), front, back, category: flashCategorySel.value || 'General' });
    frontEl.value = ''; backEl.value = '';
    renderFlashCategoryOptions();
    renderFlashcards();
    saveData();

    if (flashWrap && toggleFlashBtn) {
      flashWrap.style.display = 'none';
      toggleFlashBtn.innerHTML = `${ICON.plus} Create Card`;
      toggleFlashBtn.classList.remove('active-open');
    }
    showToast('Flashcard created successfully!');
  });

  // ===== Sync Flashcards directly from BCS MCQs =====
  function syncFlashcardsFromMCQs() {
    const mcqPool = (typeof allQuestions !== 'undefined' && Array.isArray(allQuestions) && allQuestions.length > 0)
      ? allQuestions
      : (typeof defaultQuestions !== 'undefined' ? defaultQuestions : []);

    if (!mcqPool.length) {
      showToast('No MCQ questions available to sync from', true);
      return;
    }

    let addedCount = 0;
    mcqPool.forEach(q => {
      const qText = (q.question || '').trim();
      if (!qText) return;
      const exists = state.flashcards.some(f => f.front.trim() === qText);
      if (!exists) {
        const correctOpt = (Array.isArray(q.options) && q.options[q.correct] !== undefined)
          ? q.options[q.correct]
          : 'See explanation';
        const exp = (q.explanation && q.explanation.trim()) ? q.explanation.trim() : 'Authentic BCS High-Yield Concept.';

        state.flashcards.push({
          id: 'mcq_fc_' + (q.id || (Date.now() + Math.random().toString(36).substr(2, 4))),
          front: qText,
          back: `✓ Correct Answer: ${correctOpt}\n\n💡 Explanation: ${exp}`,
          category: q.subject || 'General'
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      renderFlashCategoryOptions();
      renderFlashcards();
      saveData();
      showToast(`Added ${addedCount} flashcards directly from BCS & Govt MCQ Bank!`);
    } else {
      showToast('All MCQ questions are already synced to your flashcard deck.');
    }
  }

  const syncFlashcardsBtn = document.getElementById('syncFlashcardsBtn');
  if (syncFlashcardsBtn) {
    syncFlashcardsBtn.addEventListener('click', syncFlashcardsFromMCQs);
  }

  flashFilterSel.addEventListener('change', renderFlashcards);

  // ===== Interactive Flashcard Exam Mode =====
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
    if (!pool.length) {
      showToast('No flashcards found! Click "Sync from MCQs" to instantly load cards.', true);
      return;
    }
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
        <div class="exam-modal-card glass" style="text-align:center;">
          <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
          <div class="exam-result-icon">${ICON.star}</div>
          <h2 style="font-size:24px; font-weight:800; margin:0 0 6px;">Flashcard Exam Completed!</h2>
          <div style="font-size:36px; font-weight:800; color:var(--accent1); margin:10px 0;">${pct}%</div>
          <p style="color:var(--text-soft); font-size:14px; margin-bottom:24px;">
            ${examState.correct} Correct &nbsp;•&nbsp; ${examState.wrong} Needs Review &nbsp;•&nbsp; Total ${total} Cards
          </p>
          <div class="exam-actions" style="justify-content:center;">
            <button class="pill solid" id="examRestartBtn">${ICON.rotccw} Retake Exam</button>
            <button class="pill" id="examExitBtn">${ICON.arrowL} Return to Deck</button>
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
    const totalCards = examState.cards.length;
    const progressPct = Math.round(((examState.idx + 1) / totalCards) * 100);

    if (!examState.flipped) {
      examOverlay.innerHTML = `
        <div class="exam-modal-card glass">
          <div class="exam-card-header">
            <span class="exam-card-tag">${escapeHtml(card.category || 'General')}</span>
            <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
          </div>

          <div class="exam-progress-wrap">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-soft); font-weight:600;">
              <span>Card ${examState.idx + 1} of ${totalCards}</span>
              <span>${ICON.check} ${examState.correct}  •  ${ICON.x} ${examState.wrong}</span>
            </div>
            <div class="exam-progress-bar">
              <div class="exam-progress-bar-fill" style="width:${progressPct}%"></div>
            </div>
          </div>

          <div class="exam-question-box glass">
            ${escapeHtml(card.front)}
          </div>

          <input type="text" class="exam-answer-input" id="examAnswerInput" placeholder="Type your answer (or skip directly to answer)..." autocomplete="off">

          <div class="exam-actions">
            <button class="pill" id="examSkipRevealBtn">${ICON.eye} Show Answer</button>
            <button class="pill solid" id="examSubmitBtn">Submit &amp; Reveal ${ICON.arrowR}</button>
          </div>
        </div>
      `;

      document.getElementById('examCloseBtn').addEventListener('click', closeExam);
      const input = document.getElementById('examAnswerInput');
      if (input) input.focus();

      const reveal = () => {
        examState.userAnswer = input ? input.value.trim() : '';
        examState.flipped = true;
        renderExam();
      };

      document.getElementById('examSubmitBtn').addEventListener('click', reveal);
      document.getElementById('examSkipRevealBtn').addEventListener('click', reveal);
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') reveal();
        });
      }
      return;
    }

    // Back / Revealed Answer State
    examOverlay.innerHTML = `
      <div class="exam-modal-card glass">
        <div class="exam-card-header">
          <span class="exam-card-tag">${escapeHtml(card.category || 'General')}</span>
          <button class="icon-btn exam-close" id="examCloseBtn" title="Exit Exam">${ICON.x}</button>
        </div>

        <div class="exam-progress-wrap">
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-soft); font-weight:600;">
            <span>Card ${examState.idx + 1} of ${totalCards}</span>
            <span>${ICON.check} ${examState.correct}  •  ${ICON.x} ${examState.wrong}</span>
          </div>
          <div class="exam-progress-bar">
            <div class="exam-progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
        </div>

        <div class="exam-question-box glass" style="min-height:75px; font-size:16px;">
          ${escapeHtml(card.front)}
        </div>

        ${examState.userAnswer ? `
          <div class="exam-user-recap">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-soft); margin-bottom:2px;">Your Answer:</div>
            <div style="font-weight:600; color:var(--text);">${escapeHtml(examState.userAnswer)}</div>
          </div>
        ` : ''}

        <div class="exam-verified-answer">
          <div class="exam-verified-label">Verified Right Answer &amp; Explanation:</div>
          <div style="white-space:pre-wrap; font-weight:500;">${escapeHtml(card.back)}</div>
        </div>

        <div class="exam-actions">
          <button class="pill danger btn-exam-rate" id="examWrongBtn">${ICON.x} Needs Review</button>
          <button class="pill solid btn-exam-rate btn-rate-correct" id="examCorrectBtn">${ICON.check} Got It Right!</button>
        </div>
      </div>
    `;

    document.getElementById('examCloseBtn').addEventListener('click', closeExam);
    document.getElementById('examCorrectBtn').addEventListener('click', () => advanceExam(true));
    document.getElementById('examWrongBtn').addEventListener('click', () => advanceExam(false));

    // Keyboard shortcuts for snappy exam flow (1 = Got it, 2 = Needs review)
    const keyHandler = (e) => {
      if (e.key === '1' || e.key === 'Enter') {
        window.removeEventListener('keydown', keyHandler);
        advanceExam(true);
      } else if (e.key === '2') {
        window.removeEventListener('keydown', keyHandler);
        advanceExam(false);
      }
    };
    window.addEventListener('keydown', keyHandler, { once: true });
  }

  function advanceExam(isCorrect) {
    if (isCorrect) examState.correct++; else examState.wrong++;
    if (examState.idx + 1 >= examState.cards.length) {
      examState.finished = true;
    } else {
      examState.idx++;
      examState.flipped = false;
      examState.userAnswer = '';
    }
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
    const exportBundle = {
      ...state,
      exams: exams || [],
      mistakes: mistakes || [],
      customMCQQuestions: (typeof getStoredQuestions === "function" ? getStoredQuestions() : []),
      mcqProgress: (typeof userMCQProgress !== "undefined" ? userMCQProgress : null),
      todayBreakMinutes: getTodayBreakMinutes()
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chakri-prostuti-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    await writeToAutoBackupFile();
    showToast('Data exported successfully as JSON!');
  });

  document.getElementById('importDataInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const ok = window.confirm('This will replace all current data with the backup file data. Proceed?');
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
          quoteCarouselInterval: typeof imported.quoteCarouselInterval === 'number' ? imported.quoteCarouselInterval : 300,
          deletedSubjects: Array.isArray(imported.deletedSubjects) ? imported.deletedSubjects : [],
          customSubjects: Array.isArray(imported.customSubjects) ? imported.customSubjects : [],
          deletedQuotes: Array.isArray(imported.deletedQuotes) ? imported.deletedQuotes : []
        };
        if (Array.isArray(imported.exams)) {
          exams = imported.exams;
          saveExams();
        }
        if (Array.isArray(imported.customMCQQuestions) && typeof saveStoredQuestions === "function") {
          saveStoredQuestions(imported.customMCQQuestions);
        }
        if (imported.mcqProgress && typeof saveMCQProgress === "function") {
          userMCQProgress = imported.mcqProgress;
          saveMCQProgress();
        }
        if (typeof imported.todayBreakMinutes === "number") {
          localStorage.setItem('jobprep_break_minutes_today', String(imported.todayBreakMinutes));
        }
        await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
        await writeToAutoBackupFile();
        showToast('Backup restored successfully!');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('Invalid JSON backup file', true);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Export JSON Shortcut Button (Settings)
  const exportSettingsBtn = document.getElementById('exportDataBtnSettings');
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener('click', () => {
      document.getElementById('exportDataBtn').click();
    });
  }

  // Import JSON Shortcut Button (Settings)
  const importSettingsBtn = document.getElementById('importDataBtnSettings');
  if (importSettingsBtn) {
    importSettingsBtn.addEventListener('click', () => {
      document.getElementById('importDataInput').click();
    });
  }

  // ===== Reset all data =====
  document.getElementById('resetAllBtn').addEventListener('click', async () => {
    const ok = window.confirm('Are you sure? All routines, notes, syllabus, flashcards, and tracker sessions will be deleted. This cannot be undone.');
    if (!ok) return;
    const keepTheme = state.theme;
    state = {
      routine: buildDefaultRoutine(dateKey(Date.now())), notes: [], customQuotes: [], quoteIdx: 0, quoteSource: 'all', theme: keepTheme,
      sessions: [], activeSession: null, dailyTargetMinutes: 240,
      syllabus: [], flashcards: [],
      quoteCarouselEnabled: true, quoteCarouselInterval: 300,
      deletedSubjects: [], customSubjects: [], deletedQuotes: []
    };
    try {
      localStorage.removeItem(EXAMS_KEY);
      localStorage.removeItem(MISTAKES_KEY);
      localStorage.removeItem('jobprep_break_minutes_today');
      localStorage.removeItem('custom_bcs_questions_v3');
      localStorage.removeItem('jobprep_custom_quiz_questions');
    } catch (e) { }
    await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
    await writeToAutoBackupFile();
    showToast('All data has been reset.');
    setTimeout(() => location.reload(), 800);
  });

  // ===== Add Custom Subject Button (Settings) =====
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const newSubjectInput = document.getElementById('newSubjectInput');
  if (addSubjectBtn && newSubjectInput) {
    addSubjectBtn.addEventListener('click', () => {
      const name = newSubjectInput.value.trim();
      if (!name) { newSubjectInput.focus(); return; }
      const canonical = canonicalSubjectName(name).toLowerCase();
      // Remove from deletedSubjects if it was previously deleted/hidden
      state.deletedSubjects = (state.deletedSubjects || []).filter(d => canonicalSubjectName(d).toLowerCase() !== canonical);
      // Add to custom subjects list so it persists
      if (!Array.isArray(state.customSubjects)) state.customSubjects = [];
      if (!state.customSubjects.some(c => canonicalSubjectName(c).toLowerCase() === canonical)) {
        state.customSubjects.push(name);
      }
      saveData();
      syncAllSubjectSelects();
      newSubjectInput.value = '';
      showToast(`"${name}" added to subject list.`);
    });
    newSubjectInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addSubjectBtn.click();
    });
  }

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
          { id: 1, name: '47th BCS Preliminary Exam', category: 'BCS', targetDate: bcs47.toISOString() },
          { id: 2, name: 'Combined Bank Senior Officer', category: 'Banking', targetDate: bankExam.toISOString() }
        ];
        saveExams();
      }
    } catch (e) { exams = []; }
  }

  function saveExams() {
    try {
      localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
    } catch (e) { }
  }

  function renderExams() {
    const grid = document.getElementById('countdownGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!exams.length) {
      grid.innerHTML = '<div class="empty-state">No active exam countdowns. Click "+ New Exam Target" above to track an upcoming test!</div>';
      return;
    }

    const now = Date.now();
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
        <div class="countdown-head">
          <h3>${escapeHtml(ex.name)}</h3>
          <div class="countdown-head-actions">
            <span class="countdown-tag">${escapeHtml(ex.category || 'Exam')}</span>
            <button class="countdown-del-btn" data-id="${ex.id}" title="Delete">${ICON.x}</button>
          </div>
        </div>
        ${isExpired ? `
          <div style="padding: 16px 0; text-align:center; color: var(--accent3); font-weight:700;">Exam Date Passed / Target Reached!</div>
        ` : `
          <div class="countdown-timer-row">
            <div class="time-box"><span class="time-num">${days}</span><span class="time-lbl">days</span></div>
            <div class="time-box"><span class="time-num">${hours}</span><span class="time-lbl">h</span></div>
            <div class="time-box"><span class="time-num">${mins}</span><span class="time-lbl">m</span></div>
            <div class="time-box"><span class="time-num">${secs}</span><span class="time-lbl">s</span></div>
          </div>
        `}
      `;
      grid.appendChild(card);
    });
  }

  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.countdown-del-btn');
    if (delBtn) {
      const id = delBtn.dataset.id;
      const ex = exams.find(x => String(x.id) === String(id));
      const exName = ex && ex.name ? `"${ex.name}"` : 'this exam target';
      if (!window.confirm(`Are you sure you want to delete exam target ${exName}?`)) return;
      exams = exams.filter(ex => String(ex.id) !== String(id));
      saveExams();
      renderExams();
      showToast('Exam target deleted');
    }
  });

  const toggleExamBtn = document.getElementById('toggleExamFormBtn');
  const examWrap = document.getElementById('examFormWrap');
  if (toggleExamBtn && examWrap) {
    toggleExamBtn.addEventListener('click', () => {
      const isOpen = examWrap.style.display !== 'none';
      examWrap.style.display = isOpen ? 'none' : 'block';
      toggleExamBtn.innerHTML = isOpen ? `${ICON.plus} New Exam Target` : `${ICON.x} Close Form`;
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
        showToast('Please enter both exam name and target date.', true);
        return;
      }

      exams.push({
        id: Date.now(),
        name: name,
        category: cat || 'Exam',
        targetDate: new Date(dateVal).toISOString()
      });

      nameEl.value = ''; dateEl.value = '';
      saveExams();
      renderExams();

      if (examWrap && toggleExamBtn) {
        examWrap.style.display = 'none';
        toggleExamBtn.innerHTML = '<span class="btn-icon">+</span> New Exam Target';
        toggleExamBtn.classList.remove('active-open');
      }
      showToast('New exam countdown target added!');
    });
  }

  // ==========================================
  // UNIFIED TIMER & 24H BREAK TRACKER
  // ==========================================
  let selectedDuration = 0;
  let timerMode = 'study';
  let customCountdownInterval = null;
  let customCountdownSecs = 0;
  window.selectedTimerDuration = 0;
  window.isCustomCountdownActive = false;

  const BREAK_STORAGE_KEY = 'jobprep_break_minutes_today';
  const BREAK_ENTRIES_KEY = 'jobprep_break_entries';

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

  function addBreakEntry(minutes, reason, startTime = Date.now()) {
    if (!minutes) return;
    try {
      const raw = localStorage.getItem(BREAK_ENTRIES_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      entries.push({
        id: Date.now(),
        start: startTime,
        end: Date.now(),
        duration: minutes,
        reason: reason || 'Refreshment'
      });
      localStorage.setItem(BREAK_ENTRIES_KEY, JSON.stringify(entries.slice(-100)));
    } catch (e) { }
  }

  function getTodayBreakEntries() {
    try {
      const raw = localStorage.getItem(BREAK_ENTRIES_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      return Array.isArray(entries) ? entries.filter(entry => dateKey(entry.start) === todayKey()) : [];
    } catch (e) { return []; }
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
    studyVal.textContent = `${sH}h ${sM}m`;
    breakVal.textContent = `${breakMinutes}m`;

    const totH = (totalActivityMinutes / 60).toFixed(1);
    ratioVal.textContent = `${pct}% (${totH}h / 24h)`;
  }

  const durationSelector = document.getElementById('timerDurationSelector');
  const timerModeSelector = document.getElementById('timerModeSelector');
  const studySubjectRow = document.getElementById('studySubjectRow');
  const breakReasonRow = document.getElementById('breakReasonRow');

  function syncTimerModeFields() {
    const hasMode = timerMode === 'study' || timerMode === 'break';
    if (studySubjectRow) studySubjectRow.hidden = timerMode !== 'study';
    if (breakReasonRow) breakReasonRow.hidden = timerMode !== 'break';
    if (durationSelector) durationSelector.hidden = !hasMode;
    const studyOpts = document.getElementById('studyDurationOptions');
    const breakOpts = document.getElementById('breakDurationOptions');
    if (studyOpts) studyOpts.hidden = timerMode !== 'study';
    if (breakOpts) breakOpts.hidden = timerMode !== 'break';
    if (startBtn) {
      startBtn.textContent = timerMode === 'break' ? 'Start Break' : 'Start Studying';
      startBtn.disabled = !hasMode;
    }
    if (stopBtn) stopBtn.textContent = timerMode === 'break' ? 'Finish Break' : 'Finish Session';
    if (!hasMode) {
      const sub = document.getElementById('timerSub');
      if (sub) sub.textContent = 'Choose Study or Break to begin';
    } else {
      refreshTimerSub();
    }
  }

  syncTimerModeFields();
  if (timerModeSelector) {
    timerModeSelector.querySelectorAll('.timer-mode-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.mode === timerMode);
    });
    timerModeSelector.addEventListener('click', (e) => {
      const modeChip = e.target.closest('.timer-mode-chip');
      if (!modeChip || state.activeSession || window.isCustomCountdownActive) return;
      timerMode = modeChip.dataset.mode === 'break' ? 'break' : 'study';
      timerModeSelector.querySelectorAll('.timer-mode-chip').forEach(chip => chip.classList.toggle('active', chip === modeChip));
      syncTimerModeFields();
      document.getElementById('studyDurationOptions').hidden = timerMode !== 'study';
      document.getElementById('breakDurationOptions').hidden = timerMode !== 'break';
      const firstDuration = document.querySelector(`#${timerMode === 'break' ? 'breakDurationOptions' : 'studyDurationOptions'} .timer-dur-chip`);
      if (firstDuration) firstDuration.click();
    });
  }

  if (durationSelector) {
    durationSelector.addEventListener('click', (e) => {
      const chip = e.target.closest('.timer-dur-chip');
      if (!chip) return;

      if (!timerMode) return;

      if (state.activeSession || window.isCustomCountdownActive) {
        showToast('Cannot change duration while a session is active. Finish current session first.', true);
        return;
      }

      durationSelector.querySelectorAll('.timer-dur-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      selectedDuration = parseInt(chip.dataset.duration, 10) || 0;
      window.selectedTimerDuration = selectedDuration;

      const display = document.getElementById('timerDisplay');
      const sub = document.getElementById('timerSub');
      const subject = currentSubjectValue() || 'General';
      const reason = document.getElementById('breakReason')?.value || 'Refreshment';

      if (timerMode === 'break') {
        customCountdownSecs = selectedDuration * 60;
        if (display) display.textContent = `${String(selectedDuration).padStart(2, '0')}:00`;
        if (sub) sub.innerHTML = `<strong>${selectedDuration}-minute ${escapeHtml(reason.toLowerCase())}</strong> break — recharge before your next focus block`;
      } else if (selectedDuration === 0) {
        if (display) display.textContent = '00:00:00';
        if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — Stopwatch mode active`;
      } else {
        customCountdownSecs = selectedDuration * 60;
        const mStr = String(selectedDuration).padStart(2, '0');
        if (display) display.textContent = `${mStr}:00`;
        if (sub) sub.innerHTML = `<strong>${escapeHtml(subject)}</strong> — ${selectedDuration} min focus session`;
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
    const subject = currentSubjectValue() || 'General';

    if (textEl && timerMode === 'break') {
      textEl.innerHTML = `Your <strong>${selectedDuration}-minute break</strong> has <strong>${m}m ${s}s</strong> remaining.<br><br>Ending it now will still count the elapsed break time.`;
    } else if (textEl) {
      textEl.innerHTML = `Your <strong>${escapeHtml(subject)}</strong> focus session of <strong>${selectedDuration} minutes</strong> has <strong>${m}m ${s}s</strong> remaining!<br><br>If you exit now, this session will not count toward your daily study target.`;
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
    if (timerMode !== 'break') {
      const subj = currentSubjectValue();
      if (!subj) {
        if (sessionCustomInput) {
          sessionCustomInput.style.display = 'block';
          sessionCustomInput.focus();
        }
        showToast('Please enter or select a study subject', true);
        return;
      }
    }
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
        if (display) display.textContent = `${m}:${s}`;
        renderTodaySessions();
        syncMiniTimerWidget();
      } else {
        clearInterval(customCountdownInterval);
        stopCustomCountdown(true);
      }
    }, 1000);
    syncMiniTimerWidget();
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
    syncMiniTimerWidget();

    const subject = currentSubjectValue() || 'General';
    const reason = document.getElementById('breakReason')?.value || 'Refreshment';

    if (timerMode === 'break') {
      const elapsedBreakSeconds = Math.max(0, (selectedDuration * 60) - customCountdownSecs);
      const elapsedBreakMinutes = elapsedBreakSeconds > 0 ? Math.max(1, Math.round(elapsedBreakSeconds / 60)) : 0;
      if (isCompleted) {
        addTodayBreakMinutes(selectedDuration);
        addBreakEntry(selectedDuration, reason, Date.now() - (selectedDuration * 60000));
        showToast(`${selectedDuration}-minute ${reason.toLowerCase()} break completed and added to break time!`);
      } else {
        if (elapsedBreakMinutes > 0) {
          addTodayBreakMinutes(elapsedBreakMinutes);
          addBreakEntry(elapsedBreakMinutes, reason, Date.now() - elapsedBreakSeconds * 1000);
          showToast(`${elapsedBreakMinutes}m of ${reason.toLowerCase()} break counted.`);
        } else {
          showToast('Break ended before any time was recorded');
        }
      }
      customCountdownSecs = selectedDuration * 60;
      if (display) display.textContent = `${String(selectedDuration).padStart(2, '0')}:00`;
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
        showToast(`${selectedDuration}m ${subject} study session completed and added to daily goal!`);
      } else {
        showToast('Session cancelled — not counted towards daily goal', true);
      }
      customCountdownSecs = selectedDuration * 60;
      const mStr = String(selectedDuration).padStart(2, '0');
      if (display) display.textContent = `${mStr}:00`;
    }

    update24hActivityUI();
    renderTodaySessions();
  }

  document.addEventListener('click', (e) => {
    if (selectedDuration === 0) return;

    if (e.target && e.target.id === 'startBtn') {
      e.stopImmediatePropagation();
      startCustomCountdown();
    } else if (e.target && e.target.id === 'stopBtn') {
      e.stopImmediatePropagation();
      if (timerMode === 'break') {
        stopCustomCountdown(false);
      } else if (customCountdownSecs > 0) {
        openCancelModal(customCountdownSecs);
      } else {
        stopCustomCountdown(false);
      }
    }
  }, true);

  // ==========================================
  // BCS & GOVT JOB MCQ QUESTION SYSTEM (WITH AUTO-NEXT, MASTERY & REMEDIATION)
  // ==========================================
  const MISTAKES_KEY = "jobprep_mistakes_list";
  const MCQ_CUSTOM_KEY = "custom_bcs_questions_v3";
  const MCQ_PROGRESS_KEY = "jobprep_mcq_progress_v2";
  const EXAM_QUESTION_COUNT = 20;

  const defaultQuestions = [
    {
      "id": 1,
      "subject": "বাংলা সাহিত্য",
      "question": "‘চর্যাপদ’ মূলত কোন ছন্দে রচিত?",
      "options": [
        "অক্ষরবৃত্ত",
        "মাত্রাবৃত্ত",
        "স্বরবৃত্ত",
        "গদ্যছন্দ"
      ],
      "correct": 1,
      "explanation": "চর্যাপদ মূলত মাত্রাবৃত্ত (পাদাকুলক) ছন্দে রচিত।"
    },
    {
      "id": 2,
      "subject": "বাংলা সাহিত্য",
      "question": "বাংলা সাহিত্যের প্রথম ‘সার্থক’ উপন্যাস কোনটি?",
      "options": [
        "আলালের ঘরের দুলাল",
        "দুর্গেশনন্দিনী",
        "কপালকুণ্ডলা",
        "ফুলমণি ও করুণার বৃত্তান্ত"
      ],
      "correct": 1,
      "explanation": "বঙ্কিমচন্দ্রের 'দুর্গেশনন্দিনী' (১৮৬৫) বাংলা সাহিত্যের প্রথম সার্থক উপন্যাস।"
    },
    {
      "id": 3,
      "subject": "বাংলা সাহিত্য",
      "question": "রবীন্দ্রনাথ ঠাকুর তাঁর কোন রচনাটি কাজী নজরুল ইসলামকে উৎসর্গ করেছিলেন?",
      "options": [
        "কালের যাত্রা",
        "রক্তকরবী",
        "বসন্ত",
        "তাসের দেশ"
      ],
      "correct": 2,
      "explanation": "রবীন্দ্রনাথ নজরুলকে 'বসন্ত' নাটক উৎসর্গ করেন এবং নজরুল রবীন্দ্রনাথকে 'সঞ্চিতা' কাব্যগ্রন্থ উৎসর্গ করেন।"
    },
    {
      "id": 4,
      "subject": "বাংলা সাহিত্য",
      "question": "মাইকেল মধুসূদন দত্তের ‘মেঘনাদবধ কাব্য’ কোন ছন্দে রচিত?",
      "options": [
        "পয়ার",
        "অমিত্রাক্ষর",
        "মাত্রাবৃত্ত",
        "স্বরবৃত্ত"
      ],
      "correct": 1,
      "explanation": "১৮৬১ সালে প্রকাশিত মেঘনাদবধ কাব্য অমিত্রাক্ষর ছন্দে রচিত বাংলা সাহিত্যের প্রথম সার্থক মহাকাব্য।"
    },
    {
      "id": 5,
      "subject": "বাংলা ব্যাকরণ",
      "question": "নিচের কোনটি ‘সূর্য’ শব্দের সমার্থক শব্দ?",
      "options": [
        "সুধাংশু",
        "আদিত্য",
        "বিধু",
        "শশাঙ্ক"
      ],
      "correct": 1,
      "explanation": "সূর্যের সমার্থক হলো আদিত্য, তপন, ভানু। সুধাংশু ও শশাঙ্ক চাঁদের সমার্থক।"
    },
    {
      "id": 6,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘হাতাহাতি’ কোন সমাসের উদাহরণ?",
      "options": [
        "ব্যতিহার বহুব্রীহি",
        "দ্বন্দ্ব সমাস",
        "মধ্যপদলোপী কর্মধারয়",
        "দ্বিগু সমাস"
      ],
      "correct": 0,
      "explanation": "হাতে হাতে যে যুদ্ধ = হাতাহাতি (ক্রিয়ার পারস্পরিকতায় ব্যতিহার বহুব্রীহি)।"
    },
    {
      "id": 7,
      "subject": "বাংলা ব্যাকরণ",
      "question": "নিচের কোন বানানটি শুদ্ধ?",
      "options": [
        "সমিচীন",
        "সমীচিন",
        "সমীচীন",
        "সমিচিন"
      ],
      "correct": 2,
      "explanation": "‘সমীচীন’ বানানে দুটিই দীর্ঘ-ঈ কার (স-ম-ী-চ-ী-ন)।"
    },
    {
      "id": 8,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘পাপে বিরত হও’—বাক্যে ‘পাপে’ শব্দটি কোন কারকে কোন বিভক্তি?",
      "options": [
        "কর্মে ৭মী",
        "অপাদানে ৭মী",
        "করণে ৭মী",
        "অধিকরণে ৭মী"
      ],
      "correct": 1,
      "explanation": "যা থেকে বিরত হওয়া বোঝায় তা অপাদান কারক। পাপ + এ = অপাদানে ৭মী।"
    },
    {
      "id": 9,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘গবেষণা’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?",
      "options": [
        "গো + এষণা",
        "গব + এষণা",
        "গো + ষণা",
        "গাবে + এষণা"
      ],
      "correct": 0,
      "explanation": "গো + এষণা = গবেষণা। এর আদি অর্থ ছিল গরু খোঁজা, আধুনিক অর্থ তত্ত্বানুসন্ধান।"
    },
    {
      "id": 10,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘স্কুল > ইস্কুল’—এটি কোন ধরনের ধ্বনি পরিবর্তনের উদাহরণ?",
      "options": [
        "আদি স্বরাগম",
        "মধ্য স্বরাগম",
        "অন্ত্য স্বরাগম",
        "অপিনিহিতি"
      ],
      "correct": 0,
      "explanation": "শব্দের শুরুতে স্বরধ্বনি এলে তাকে আদি স্বরাগম বলে।"
    },
    {
      "id": 11,
      "subject": "English",
      "question": "Fill in the blank: 'He is devoid _____ common sense.'",
      "options": [
        "to",
        "from",
        "of",
        "with"
      ],
      "correct": 2,
      "explanation": "'Devoid of' is an appropriate preposition meaning lacking or empty of something."
    },
    {
      "id": 12,
      "subject": "English",
      "question": "What is the meaning of the idiom 'A bolt from the blue'?",
      "options": [
        "A pleasant surprise",
        "An unexpected calamity",
        "A dark rainy day",
        "An expected danger"
      ],
      "correct": 1,
      "explanation": "'A bolt from the blue' means a sudden, unexpected and unwelcome event or disaster."
    },
    {
      "id": 13,
      "subject": "English",
      "question": "Fill in the blank: 'Neither the teacher nor the students _____ present yesterday.'",
      "options": [
        "was",
        "were",
        "is",
        "are"
      ],
      "correct": 1,
      "explanation": "With neither...nor, the verb agrees with the closer subject ('students' - plural past: were)."
    },
    {
      "id": 14,
      "subject": "English",
      "question": "Fill in the blank: 'Hardly had we reached the station _____ the train left.'",
      "options": [
        "than",
        "when",
        "then",
        "after"
      ],
      "correct": 1,
      "explanation": "Correlative pair: Hardly had ... when / No sooner had ... than."
    },
    {
      "id": 15,
      "subject": "English",
      "question": "Choose the correct option: 'It is high time we _____ our bad habits.'",
      "options": [
        "change",
        "changed",
        "will change",
        "have changed"
      ],
      "correct": 1,
      "explanation": "After 'It is high time' followed by a subject, the verb must be in past simple (V2: changed)."
    },
    {
      "id": 16,
      "subject": "English",
      "question": "Which of the following is the correct spelling?",
      "options": [
        "Questionnaire",
        "Questionaire",
        "Questionare",
        "Questionnair"
      ],
      "correct": 0,
      "explanation": "Questionnaire has double 'n' and ends in 'aire' (Question + n + aire)."
    },
    {
      "id": 17,
      "subject": "English",
      "question": "Complete the conditional: 'If he had studied attentively, he _____ GPA 5.00.'",
      "options": [
        "will get",
        "would get",
        "would have got",
        "had got"
      ],
      "correct": 2,
      "explanation": "3rd Conditional rule: If + had + V3 ---> would have / could have + V3."
    },
    {
      "id": 18,
      "subject": "English",
      "question": "Fill in the blank: 'He is senior _____ me in service.'",
      "options": [
        "than",
        "to",
        "from",
        "of"
      ],
      "correct": 1,
      "explanation": "Latin comparatives (senior, junior, superior, inferior, prior) take 'to', never 'than'."
    },
    {
      "id": 19,
      "subject": "English",
      "question": "In 'Look at the flying bird', the word 'flying' is a/an:",
      "options": [
        "Gerund",
        "Participle",
        "Verbal noun",
        "Infinitive"
      ],
      "correct": 1,
      "explanation": "A participle acts as an adjective modifying a noun ('bird'). A gerund acts as a noun."
    },
    {
      "id": 20,
      "subject": "English",
      "question": "What is the antonym of the word 'BENEVOLENT'?",
      "options": [
        "Kind",
        "Malevolent",
        "Generous",
        "Friendly"
      ],
      "correct": 1,
      "explanation": "Benevolent means kind and helpful; Malevolent means having or showing ill will/evil."
    },
    {
      "id": 21,
      "subject": "গণিত",
      "question": "x + 1/x = 3 হলে, x² + 1/x² এর মান কত?",
      "options": [
        "৫",
        "৭",
        "৯",
        "১১"
      ],
      "correct": 1,
      "explanation": "x² + 1/x² = (x + 1/x)² - 2 = 3² - 2 = 9 - 2 = 7।"
    },
    {
      "id": 22,
      "subject": "গণিত",
      "question": "বার্ষিক ১০% সরল সুদে কত বছরে ১,০০০ টাকার সুদ ৫০০ টাকা হবে?",
      "options": [
        "৩ বছর",
        "৪ বছর",
        "৫ বছর",
        "৬ বছর"
      ],
      "correct": 2,
      "explanation": "I = Pnr ⇒ n = I / (Pr) = ৫০০ / (১০০০ × ০.১) = ৫ বছর।"
    },
    {
      "id": 23,
      "subject": "গণিত",
      "question": "একটি নিরপেক্ষ ছক্কা একবার নিক্ষেপ করলে জোড় সংখ্যা আসার সম্ভাবনা কত?",
      "options": [
        "১/৬",
        "১/৩",
        "১/২",
        "২/৩"
      ],
      "correct": 2,
      "explanation": "ছক্কার ৬টি ফলের মধ্যে জোড় সংখ্যা ৩টি (২, ৪, ৬)। সম্ভাব্যতা = ৩/৬ = ১/২।"
    },
    {
      "id": 24,
      "subject": "গণিত",
      "question": "পিতা ও পুত্রের বর্তমান বয়সের অনুপাত ৭ : ২ এবং ৫ বছর পর ৮ : ৩ হলে, পিতার বর্তমান বয়স কত?",
      "options": [
        "৩০ বছর",
        "৩৫ বছর",
        "৪০ বছর",
        "৪২ বছর"
      ],
      "correct": 1,
      "explanation": "অনুপাতের পার্থক্য ১ একক = ৫ বছর। সুতরাং পিতার বর্তমান বয়স = ৭ × ৫ = ৩৫ বছর।"
    },
    {
      "id": 25,
      "subject": "গণিত",
      "question": "চিনির মূল্য ২০% বৃদ্ধি পাওয়ায় ব্যবহার শতকরা কত কমালে খরচ অপরিবর্তিত থাকবে?",
      "options": [
        "১৬%",
        "১৬ ২/৩%",
        "২০%",
        "২৫%"
      ],
      "correct": 1,
      "explanation": "হ্রাস = {২০ / (১০০ + ২০)} × ১০০% = ২০/১২০ × ১০০% = ১৬ ২/৩%।"
    },
    {
      "id": 26,
      "subject": "গণিত",
      "question": "৩০ থেকে ৫০ এর মধ্যবর্তী মৌলিক সংখ্যা কয়টি?",
      "options": [
        "৩টি",
        "৪টি",
        "৫টি",
        "৬টি"
      ],
      "correct": 2,
      "explanation": "৩১, ৩৭, ৪১, ৪৩ ও ৪৭ — মোট ৫টি মৌলিক সংখ্যা।"
    },
    {
      "id": 27,
      "subject": "গণিত",
      "question": "২^(x+১) = ৩২ হলে, x-এর মান কত?",
      "options": [
        "৩",
        "৪",
        "৫",
        "৬"
      ],
      "correct": 1,
      "explanation": "২^(x+১) = ২⁵ ⇒ x + ১ = ৫ ⇒ x = ৪।"
    },
    {
      "id": 28,
      "subject": "গণিত",
      "question": "টাকায় ৪টি লেবু কিনে টাকায় ৫টি করে বিক্রয় করলে শতকরা কত লাভ বা ক্ষতি হবে?",
      "options": [
        "২০% লাভ",
        "২০% ক্ষতি",
        "২৫% লাভ",
        "২৫% ক্ষতি"
      ],
      "correct": 1,
      "explanation": "শতকরা ক্ষতি = (৫ - ৪)/৫ × ১০০% = ২০% ক্ষতি।"
    },
    {
      "id": 29,
      "subject": "গণিত",
      "question": "একটি সমকোণী ত্রিভুজের ভূমি ৪ সেমি ও উচ্চতা ৩ সেমি হলে অতিভুজ কত?",
      "options": [
        "৫ সেমি",
        "৬ সেমি",
        "৭ সেমি",
        "৮ সেমি"
      ],
      "correct": 0,
      "explanation": "পিথাগোরাসের সূত্র: অতিভুজ = √(৩² + ৪²) = √(৯ + ১৬) = √২৫ = ৫ সেমি।"
    },
    {
      "id": 30,
      "subject": "গণিত",
      "question": "log₂ 16 এর মান কত?",
      "options": [
        "২",
        "৩",
        "৪",
        "৮"
      ],
      "correct": 2,
      "explanation": "log₂ 16 = log₂ (2⁴) = 4 log₂ 2 = 4 × 1 = 4।"
    },
    {
      "id": 31,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "সংবিধানের কোন অনুচ্ছেদে চিন্তা ও বিবেকের স্বাধীনতা এবং বাক্-স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে?",
      "options": [
        "২৭ নং",
        "৩১ নং",
        "৩৯ নং",
        "৪২ নং"
      ],
      "correct": 2,
      "explanation": "৩৯ নং অনুচ্ছেদে চিন্তা, বিবেক ও বাক-স্বাধীনতা নিশ্চিত করা হয়েছে।"
    },
    {
      "id": 32,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "১৯৭১ সালের মুজিবনগর সরকারের অর্থ, শিল্প ও বাণিজ্য মন্ত্রী কে ছিলেন?",
      "options": [
        "তাজউদ্দীন আহমদ",
        "ক্যাপ্টেন এম. মনসুর আলী",
        "এ. এইচ. এম. কামারুজ্জামান",
        "খন্দকার মোশতাক আহমদ"
      ],
      "correct": 1,
      "explanation": "ক্যাপ্টেন এম. মনসুর আলী অর্থ ও বাণিজ্য মন্ত্রী ছিলেন।"
    },
    {
      "id": 33,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের একমাত্র পাহাড়ি দ্বীপ কোনটি?",
      "options": [
        "সেন্টমার্টিন",
        "মহেশখালী",
        "কুতুবদিয়া",
        "নিঝুম দ্বীপ"
      ],
      "correct": 1,
      "explanation": "কক্সবাজারের মহেশখালী হলো বাংলাদেশের একমাত্র পাহাড়ি দ্বীপ।"
    },
    {
      "id": 34,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "ঐতিহাসিক ৭ই মার্চের ভাষণ সংবিধানের কোন তফসিলে অন্তর্ভুক্ত?",
      "options": [
        "চতুর্থ তফসিল",
        "পঞ্চম তফসিল",
        "ষষ্ঠ তফসিল",
        "সপ্তম তফসিল"
      ],
      "correct": 1,
      "explanation": "৫ম তফসিল: ৭ই মার্চের ভাষণ। ৬ষ্ঠ: ২৬শে মার্চের স্বাধীনতার ঘোষণা। ৭ম: স্বাধীনতার ঘোষণাপত্র।"
    },
    {
      "id": 35,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "১৯৭১ সালের মুক্তিযুদ্ধে সমগ্র ঢাকা কত নম্বর সেক্টরের অধীনে ছিল?",
      "options": [
        "১ নম্বর সেক্টর",
        "২ নম্বর সেক্টর",
        "৩ নম্বর সেক্টর",
        "৪ নম্বর সেক্টর"
      ],
      "correct": 1,
      "explanation": "ঢাকা ২ নম্বর সেক্টরের অধীনে ছিল, যার কমান্ডার ছিলেন মেজর খালেদ মোশাররফ ও মেজর এ টি এম হায়দার।"
    },
    {
      "id": 36,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "ইউনেস্কো কত সালে ২১শে ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস হিসেবে স্বীকৃতি দেয়?",
      "options": [
        "১৯৯৭",
        "১৯৯৯",
        "২০০০",
        "২০০১"
      ],
      "correct": 1,
      "explanation": "১৭ নভেম্বর ১৯৯৯ সালে স্বীকৃতি দেয় এবং ২০০০ সাল থেকে বিশ্বব্যাপী পালিত হচ্ছে।"
    },
    {
      "id": 37,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "পদ্মা ও যমুনা নদী কোন স্থানে মিলিত হয়েছে?",
      "options": [
        "চাঁদপুর",
        "গোয়ালন্দ",
        "ভৈরব",
        "সারদা"
      ],
      "correct": 1,
      "explanation": "পদ্মা ও যমুনা গোয়ালন্দে মিলিত হয়েছে। পদ্মা ও মেঘনা চাঁদপুরে মিলিত হয়েছে।"
    },
    {
      "id": 38,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের সঠিক অনুপাত কোনটি?",
      "options": [
        "১০ : ৬",
        "৫ : ৪",
        "৩ : ২",
        "৪ : ৩"
      ],
      "correct": 0,
      "explanation": "জাতীয় পতাকার অনুপাত ১০ : ৬ (বা ৫ : ৩)। ভবনে ব্যবহারের প্রমিত মাপ ১০ ফুট × ৬ ফুট।"
    },
    {
      "id": 39,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "মুক্তিযুদ্ধে বীরত্বের জন্য কতজনকে ‘বীরশ্রেষ্ঠ’ খেতাব প্রদান করা হয়?",
      "options": [
        "৫ জন",
        "৭ জন",
        "৮ জন",
        "১১ জন"
      ],
      "correct": 1,
      "explanation": "মুক্তিযুদ্ধে সর্বোচ্চ আত্মত্যাগের জন্য ৭ জনকে ‘বীরশ্রেষ্ঠ’ উপাধিতে ভূষিত করা হয়।"
    },
    {
      "id": 40,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের সংবিধান এ পর্যন্ত কতবার সংশোধিত হয়েছে?",
      "options": [
        "১৫ বার",
        "১৬ বার",
        "১৭ বার",
        "১৮ বার"
      ],
      "correct": 2,
      "explanation": "বাংলাদেশের সংবিধান এ পর্যন্ত ১৭ বার সংশোধিত হয়েছে।"
    },
    {
      "id": 41,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "‘ব্রেটন উডস ইনস্টিটিউট’ নামে পরিচিত কোন দুটি সংস্থা?",
      "options": [
        "IMF ও WTO",
        "IMF ও বিশ্বব্যাংক",
        "বিশ্বব্যাংক ও ADB",
        "WTO ও UNCTAD"
      ],
      "correct": 1,
      "explanation": "১৯৪৪ সালে ব্রেটন উডস সম্মেলনের মাধ্যমে IMF ও বিশ্বব্যাংক প্রতিষ্ঠিত হয়।"
    },
    {
      "id": 42,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "এশিয়া ও উত্তর আমেরিকা মহাদেশকে পৃথক করেছে কোন প্রণালী?",
      "options": [
        "বেরিং প্রণালী",
        "মালাক্কা প্রণালী",
        "জিব্রাল্টার প্রণালী",
        "হরমুজ প্রণালী"
      ],
      "correct": 0,
      "explanation": "বেরিং প্রণালী এশিয়া ও উত্তর আমেরিকাকে পৃথক করেছে।"
    },
    {
      "id": 43,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "সামরিক জোট ন্যাটো (NATO)-এর সদর দপ্তর কোন শহরে অবস্থিত?",
      "options": [
        "জেনেভা",
        "ওয়াশিংটন ডি.সি.",
        "ব্রাসেলস",
        "ভিয়েনা"
      ],
      "correct": 2,
      "explanation": "ন্যাটোর স্থায়ী সদর দপ্তর বেলজিয়ামের রাজধানী ব্রাসেলসে অবস্থিত।"
    },
    {
      "id": 44,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "ভারত ও পাকিস্তানের মধ্যকার আন্তর্জাতিক সীমারেখাকে কী বলা হয়?",
      "options": [
        "ডুরান্ড লাইন",
        "র‍্যাডক্লিফ লাইন",
        "ম্যাকমোহন লাইন",
        "১৭তম সমান্তরাল"
      ],
      "correct": 1,
      "explanation": "ভারত ও পাকিস্তানের সীমারেখা হলো র‍্যাডক্লিফ লাইন।"
    },
    {
      "id": 45,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "গ্রিনউইচ মান সময়ের (GMT) সাথে বাংলাদেশের সময়ের পার্থক্য কত?",
      "options": [
        "+৫ ঘণ্টা",
        "+৬ ঘণ্টা",
        "+৭ ঘণ্টা",
        "-৬ ঘণ্টা"
      ],
      "correct": 1,
      "explanation": "বাংলাদেশ গ্রিনউইচ সময়ের চেয়ে ৬ ঘণ্টা এগিয়ে (GMT +6)।"
    },
    {
      "id": 46,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "জাতিসংঘের বর্তমান মহাসচিব আন্তোনিও গুতেরেস কোন দেশের নাগরিক?",
      "options": [
        "স্পেন",
        "পর্তুগাল",
        "ইতালি",
        "ব্রাজিল"
      ],
      "correct": 1,
      "explanation": "আন্তোনিও গুতেরেস পর্তুগালের সাবেক প্রধানমন্ত্রী ছিলেন।"
    },
    {
      "id": 47,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "রক্তের কোন গ্রুপকে ‘সর্বজনীন গ্রহীতা’ (Universal Recipient) বলা হয়?",
      "options": [
        "O+",
        "O-",
        "AB+",
        "AB-"
      ],
      "correct": 2,
      "explanation": "AB+ রক্তে কোনো অ্যান্টিবডি থাকে না বলে একে সর্বজনীন গ্রহীতা বলা হয়।"
    },
    {
      "id": 48,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "প্রাকৃতিক গ্যাসের প্রধান উপাদান কোনটি?",
      "options": [
        "মিথেন (CH₄)",
        "ইথেন (C₂H₆)",
        "প্রোপেন (C₃H₈)",
        "বিউটেন (C₄H₁₀)"
      ],
      "correct": 0,
      "explanation": "প্রাকৃতিক গ্যাসের প্রধান উপাদান মিথেন (CH₄)।"
    },
    {
      "id": 49,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "রক্ত জমাট বাঁধতে সরাসরি সাহায্য করে কোন ভিটামিন?",
      "options": [
        "ভিটামিন A",
        "ভিটামিন D",
        "ভিটামিন K",
        "ভিটামিন E"
      ],
      "correct": 2,
      "explanation": "ভিটামিন K যকৃতে প্রোথ্রম্বিন তৈরি করে রক্ত জমাট বাঁধতে সহায়তা করে।"
    },
    {
      "id": 50,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "বায়ুমণ্ডলে সর্বাধিক পরিমাণে প্রাপ্ত গ্যাস কোনটি?",
      "options": [
        "অক্সিজেন",
        "নাইট্রোজেন",
        "কার্বন ডাই অক্সাইড",
        "আর্গন"
      ],
      "correct": 1,
      "explanation": "বায়ুমণ্ডলে নাইট্রোজেনের পরিমাণ সর্বাধিক (প্রায় ৭৮.০৯%)।"
    },
    {
      "id": 51,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "নিচের কোনটি সর্বজনীন লজিক গেট (Universal Gate)?",
      "options": [
        "AND",
        "OR",
        "NOR",
        "XOR"
      ],
      "correct": 2,
      "explanation": "সর্বজনীন গেট হলো দুটি: NAND ও NOR।"
    },
    {
      "id": 52,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "কম্পিউটারের প্রধান মেমোরি (RAM) কোন প্রকৃতির মেমোরি?",
      "options": [
        "স্থায়ী ও অনুদ্বায়ী",
        "অস্থায়ী ও উদ্বায়ী (Volatile)",
        "শুধুমাত্র পাঠযোগ্য",
        "অপটিক্যাল মেমোরি"
      ],
      "correct": 1,
      "explanation": "RAM একটি Volatile মেমোরি, বিদ্যুৎ চলে গেলে ভেতরের তথ্য মুছে যায়।"
    },
    {
      "id": 53,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "IPv4 অ্যাড্রেস কত বিটের হয়ে থাকে?",
      "options": [
        "১৬ বিট",
        "৩২ বিট",
        "৬৪ বিট",
        "১২৮ বিট"
      ],
      "correct": 1,
      "explanation": "IPv4 অ্যাড্রেস ৩২ বিট এবং IPv6 অ্যাড্রেস ১২৮ বিট হয়ে থাকে।"
    },
    {
      "id": 54,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "১ গিগাবাইট (GB) সমান কত মেগাবাইট (MB)?",
      "options": [
        "১০০০ MB",
        "১০২৪ MB",
        "৫১২ MB",
        "২০৪৮ MB"
      ],
      "correct": 1,
      "explanation": "১ GB = ১০২৪ MB (বা ২¹⁰ MB)।"
    },
    {
      "id": 55,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "HTTP-এর পূর্ণরূপ কোনটি?",
      "options": [
        "HyperText Transfer Protocol",
        "HighText Transfer Protocol",
        "HyperText Transmission Program",
        "Hyperlink Transfer Path"
      ],
      "correct": 0,
      "explanation": "HTTP এর পূর্ণরূপ HyperText Transfer Protocol।"
    }
  ];

  const aiCuratedPool = [
    {
      "subject": "বাংলা সাহিত্য",
      "question": "কাজী নজরুল ইসলামের ‘বিদ্রোহী’ কবিতাটি কোন কাব্যগ্রন্থের অন্তর্ভুক্ত?",
      "options": [
        "অগ্নিবীণা",
        "বিষের বাঁশী",
        "দোলন-চাঁপা",
        "সাম্যবাদী"
      ],
      "correct": 0,
      "explanation": "১৯২২ সালে প্রকাশিত নজরুলের প্রথম কাব্যগ্রন্থ 'অগ্নিবীণা'-র দ্বিতীয় কবিতা হলো 'বিদ্রোহী'।"
    },
    {
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘অনল’ শব্দের সঠিক সমার্থক শব্দ কোনটি?",
      "options": [
        "পাবন",
        "মারুত",
        "হুতাসন",
        "অম্বু"
      ],
      "correct": 2,
      "explanation": "অগ্নি, অনল, বহ্নি, হুতাসন হলো আগুনের সমার্থক শব্দ। মারুত অর্থ বাতাস, অম্বু অর্থ পানি।"
    },
    {
      "subject": "English",
      "question": "What is the synonym of the word 'PRAGMATIC'?",
      "options": [
        "Theoretical",
        "Practical",
        "Idealistic",
        "Vague"
      ],
      "correct": 1,
      "explanation": "Pragmatic means dealing with things sensibly and realistically based on practical rather than theoretical considerations."
    },
    {
      "subject": "গণিত",
      "question": "১ থেকে ১০০ পর্যন্ত সংখ্যাগুলোর যোগফল কত?",
      "options": [
        "৪৯৫০",
        "৫০০০",
        "৫০৫০",
        "৫১০০"
      ],
      "correct": 2,
      "explanation": "যোগফল = {n(n+1)}/2 = {১০০ × ১০১}/২ = ৫০ × ১০১ = ৫০৫০।"
    },
    {
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের একমাত্র প্রবাল দ্বীপ কোনটি?",
      "options": [
        "সেন্টমার্টিন",
        "ছেঁড়াদ্বীপ",
        "কুতুবদিয়া",
        "মহেশখালী"
      ],
      "correct": 0,
      "explanation": "সেন্টমার্টিন (নারিকেল জিঞ্জিরা) হলো বাংলাদেশের একমাত্র প্রবাল দ্বীপ।"
    },
    {
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "শান্তিতে নোবেল পুরস্কার কোন শহর থেকে প্রদান করা হয়?",
      "options": [
        "স্টকহোম (সুইডেন)",
        "অসলো (নরওয়ে)",
        "জেনেভা (সুইজারল্যান্ড)",
        "প্যারিস (ফ্রান্স)"
      ],
      "correct": 1,
      "explanation": "শান্তিতে নোবেল দেওয়া হয় নরওয়ের অসলো থেকে; বাকি সব নোবেল দেওয়া হয় সুইডেনের স্টকহোম থেকে।"
    },
    {
      "subject": "সাধারণ বিজ্ঞান",
      "question": "মানবদেহের স্বাভাবিক তাপমাত্রা কত ডিগ্রি ফারেনহাইট?",
      "options": [
        "৯৬.৪°F",
        "৯৮.৪°F",
        "৯৯.৬°F",
        "১০২°F"
      ],
      "correct": 1,
      "explanation": "সুস্থ মানুষের দেহের স্বাভাবিক তাপমাত্রা ৯৮.৪°F (বা ৩৬.৯°C)।"
    },
    {
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "কম্পিউটারের মস্তিষ্ক (Brain) কাকে বলা হয়?",
      "options": [
        "RAM",
        "ALU",
        "CPU",
        "Motherboard"
      ],
      "correct": 2,
      "explanation": "CPU (Central Processing Unit)-কে কম্পিউটারের মস্তিষ্ক বা ব্রেইন বলা হয়।"
    }
  ];

  const extendedQuestionPool = [
    {
      "id": 201,
      "subject": "বাংলা সাহিত্য",
      "question": "‘গীতাঞ্জলি’ কাব্যগ্রন্থের জন্য রবীন্দ্রনাথ ঠাকুর কোন সালে নোবেল পুরস্কার লাভ করেন?",
      "options": [
        "১৯১১",
        "১৯১২",
        "১৯১৩",
        "১৯১৪"
      ],
      "correct": 2,
      "explanation": "রবীন্দ্রনাথ ঠাকুর ১৯১৩ সালে গীতাঞ্জলি (Song Offerings) কাব্যের জন্য সাহিত্যে প্রথম এশীয় হিসেবে নোবেল পুরস্কার লাভ করেন।"
    },
    {
      "id": 202,
      "subject": "বাংলা সাহিত্য",
      "question": "মাইকেল মধুসূদন দত্তের প্রথম বাংলা নাটক কোনটি?",
      "options": [
        "পদ্মাবতী",
        "শর্মিষ্ঠা",
        "কৃষ্ণকুমারী",
        "মায়াকানন"
      ],
      "correct": 1,
      "explanation": "১৮৫৯ সালে প্রকাশিত ‘শর্মিষ্ঠা’ মাইকেল মধুসূদন দত্ত রচিত প্রথম বাংলা নাটক।"
    },
    {
      "id": 203,
      "subject": "বাংলা সাহিত্য",
      "question": "‘লালসালু’ উপন্যাসের কেন্দ্রীয় চরিত্র কোনটি?",
      "options": [
        "মজিদ",
        "খালেক ব্যাপারী",
        "রহিমা",
        "জমিলা"
      ],
      "correct": 0,
      "explanation": "সৈয়দ ওয়ালীউল্লাহ্ রচিত ‘লালসালু’ (১৯৪৮) উপন্যাসের ভণ্ড ধর্মব্যবসায়ী কেন্দ্রীয় চরিত্র হলো মজিদ।"
    },
    {
      "id": 204,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘সূর্য’ শব্দের সমার্থক শব্দ কোনটি?",
      "options": [
        "সুধাংশু",
        "আদিত্য",
        "শশাঙ্ক",
        "বিধু"
      ],
      "correct": 1,
      "explanation": "সূর্যের সমার্থক শব্দ আদিত্য, ভাস্কর, রবি, তপন। সুধাংশু ও শশাঙ্ক হলো চাঁদের সমার্থক শব্দ।"
    },
    {
      "id": 205,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘সন্ধি’ ব্যাকরণের কোন অংশের আলোচ্য বিষয়?",
      "options": [
        "রূপতত্ত্ব",
        "ধ্বনিতত্ত্ব",
        "বাক্যতত্ত্ব",
        "অর্থতত্ত্ব"
      ],
      "correct": 1,
      "explanation": "যেহেতু সন্ধি মূলত ধ্বনির মিলন, রূপান্তর বা লোপ ঘটায়, তাই এটি ব্যাকরণের ধ্বনিতত্ত্বে (Phonology) আলোচিত হয়।"
    },
    {
      "id": 206,
      "subject": "বাংলা ব্যাকরণ",
      "question": "কোন বানানটি শুদ্ধ?",
      "options": [
        "মুমূর্ষু",
        "মুমুর্ষু",
        "মুর্মুষু",
        "মুমূর্ষূ"
      ],
      "correct": 0,
      "explanation": "শুদ্ধ বানান হলো ‘মুমূর্ষু’ (হ্রস্ব উ, দীর্ঘ ঊ, হ্রস্ব উ)।"
    },
    {
      "id": 207,
      "subject": "English",
      "question": "What is the meaning of the idiom 'To bell the cat'?",
      "options": [
        "To feed a pet",
        "To take leading danger or personal risk",
        "To ring a loud alarm",
        "To make friends with enemies"
      ],
      "correct": 1,
      "explanation": "'To bell the cat' means to attempt something formidable, perilous or hazardous for the common good."
    },
    {
      "id": 208,
      "subject": "English",
      "question": "What is the noun form of the adjective 'Brief'?",
      "options": [
        "Briefly",
        "Briefness",
        "Brevity",
        "Briefhood"
      ],
      "correct": 2,
      "explanation": "The noun form of 'brief' is 'brevity', which means concise and exact use of words in writing or speech."
    },
    {
      "id": 209,
      "subject": "English",
      "question": "Who wrote the famous novel 'A Passage to India'?",
      "options": [
        "George Orwell",
        "E.M. Forster",
        "Virginia Woolf",
        "Rudyard Kipling"
      ],
      "correct": 1,
      "explanation": "'A Passage to India' (1924) is an acclaimed novel by English author E. M. Forster set against the backdrop of British Raj."
    },
    {
      "id": 210,
      "subject": "English",
      "question": "What is the synonym of the word 'CANDID'?",
      "options": [
        "Secretive",
        "Frank",
        "Deceitful",
        "Arrogant"
      ],
      "correct": 1,
      "explanation": "Candid means truthful, straightforward, sincere and frank."
    },
    {
      "id": 211,
      "subject": "গণিত",
      "question": "১ থেকে ১০০ পর্যন্ত মোট কতটি মৌলিক সংখ্যা রয়েছে?",
      "options": [
        "২১ টি",
        "২৩ টি",
        "২৫ টি",
        "২৭ টি"
      ],
      "correct": 2,
      "explanation": "১ থেকে ১০০ পর্যন্ত মোট ২৫টি মৌলিক সংখ্যা রয়েছে (৪৪২২৩২২৩২১ সূত্রানুযায়ী: ৪+৪+২+২+৩+২+২+৩+২+১ = ২৫)।"
    },
    {
      "id": 212,
      "subject": "গণিত",
      "question": "একটি সমকোণী ত্রিভুজের অতিভুজ ১৩ সেমি ও ভূমি ১২ সেমি হলে, ত্রিভুজটির লম্ব কত?",
      "options": [
        "৪ সেমি",
        "৫ সেমি",
        "৬ সেমি",
        "৭ সেমি"
      ],
      "correct": 1,
      "explanation": "পীথাগোরাসের উপপাদ্য অনুযায়ী: লম্ব = √(অতিভুজ² - ভূমি²) = √(১৩² - ১২²) = √(১৬৯ - ১৪৪) = √২৫ = ৫ সেমি।"
    },
    {
      "id": 213,
      "subject": "গণিত",
      "question": "বার্ষিক ১০% সরল সুদে কত বছরে আসল সুদে-আসলে দ্বিগুণ হবে?",
      "options": [
        "৫ বছরে",
        "৮ বছরে",
        "১০ বছরে",
        "১২ বছরে"
      ],
      "correct": 2,
      "explanation": "সুদ = আসল (১০০ টাকা)। সময় = (সুদ × ১০০) / (আসল × হার) = (১০০ × ১০০) / (১০০ × ১০) = ১০ বছর।"
    },
    {
      "id": 214,
      "subject": "গণিত",
      "question": "log₁₀(0.001) এর মান কত?",
      "options": [
        "-1",
        "-2",
        "-3",
        "3"
      ],
      "correct": 2,
      "explanation": "0.001 = 10⁻³। সুতরাং log₁₀(10⁻³) = -3 log₁₀(10) = -3 × 1 = -3।"
    },
    {
      "id": 215,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধান কোন তারিখে কার্যকর হয়?",
      "options": [
        "৪ নভেম্বর ১৯৭২",
        "১৬ ডিসেম্বর ১৯৭২",
        "২৬ মার্চ ১৯৭২",
        "১৭ এপ্রিল ১৯৭২"
      ],
      "correct": 1,
      "explanation": "বাংলাদেশের সংবিধান ১৯৭২ সালের ৪ নভেম্বর গণপরিষদে গৃহীত হয় এবং একই বছরের ১৬ ডিসেম্বর (বিজয় দিবস) থেকে কার্যকর হয়।"
    },
    {
      "id": 216,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের একমাত্র প্রবাল দ্বীপ কোনটি?",
      "options": [
        "মহেশখালী",
        "হাতিয়া",
        "সেন্টমার্টিন",
        "কুতুবদিয়া"
      ],
      "correct": 2,
      "explanation": "সেন্টমার্টিন দ্বীপ (স্থানীয় নাম নারিকেল জিঞ্জিরা) বাংলাদেশের একমাত্র প্রবাল দ্বীপ।"
    },
    {
      "id": 217,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "মুক্তিযুদ্ধকালীন বাংলাদেশকে কয়টি সেক্টরে বিভক্ত করা হয়েছিল?",
      "options": [
        "৮ টি",
        "১০ টি",
        "১১ টি",
        "৬৪ টি"
      ],
      "correct": 2,
      "explanation": "১৯৭১ সালে মুক্তিযুদ্ধের সুষ্ঠু পরিচালনার সুবিধার্থে সমগ্র বাংলাদেশকে ১১টি সেক্টর ও ৬৪টি সাব-সেক্টরে বিভক্ত করা হয়েছিল।"
    },
    {
      "id": 218,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "জাতিসংঘের বর্তমান মহাসচিব আন্তোনিও গুতেরেস কোন দেশের নাগরিক?",
      "options": [
        "স্পেন",
        "পর্তুগাল",
        "ব্রাজিল",
        "ইতালি"
      ],
      "correct": 1,
      "explanation": "আন্তোনিও গুতেরেস পর্তুগালের সাবেক প্রধানমন্ত্রী ছিলেন এবং ২০১৭ সাল থেকে জাতিসংঘের মহাসচিব হিসেবে দায়িত্ব পালন করছেন।"
    },
    {
      "id": 219,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "প্রতি বছর কোন তারিখে ‘বিশ্ব পরিবেশ দিবস’ পালিত হয়?",
      "options": [
        "২২ এপ্রিল",
        "৫ জুন",
        "১৬ সেপ্টেম্বর",
        "১ ডিসেম্বর"
      ],
      "correct": 1,
      "explanation": "পরিবেশ সুরক্ষায় সচেতনতা বৃদ্ধির লক্ষ্যে প্রতি বছর ৫ জুন বিশ্ব পরিবেশ দিবস পালন করা হয়।"
    },
    {
      "id": 220,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "আন্তর্জাতিক মুদ্রা তহবিল (IMF) এর সদর দপ্তর কোথায় অবস্থিত?",
      "options": [
        "নিউইয়র্ক",
        "জেনেভা",
        "ওয়াশিংটন ডিসি",
        "লন্ডন"
      ],
      "correct": 2,
      "explanation": "বিশ্বব্যাংক ও আন্তর্জাতিক মুদ্রা তহবিল (IMF) উভয়ের সদর দপ্তরই যুক্তরাষ্ট্রের ওয়াশিংটন ডিসিতে অবস্থিত।"
    },
    {
      "id": 221,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "মানবদেহের সর্ববৃহৎ গ্রন্থি (Largest Gland) কোনটি?",
      "options": [
        "অগ্ন্যাশয়",
        "যকৃৎ (Liver)",
        "থাইরয়েড",
        "পিটুইটারি"
      ],
      "correct": 1,
      "explanation": "যকৃৎ (Liver) মানবদেহের বৃহত্তম গ্রন্থি, যার স্বাভাবিক ওজন প্রায় ১.৫ কেজি।"
    },
    {
      "id": 222,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "রক্ত জমাট বাঁধতে কোন ভিটামিন প্রধান ভূমিকা পালন করে?",
      "options": [
        "ভিটামিন এ",
        "ভিটামিন সি",
        "ভিটামিন ডি",
        "ভিটামিন কে"
      ],
      "correct": 3,
      "explanation": "ভিটামিন K যকৃতে প্রোথ্রম্বিন তৈরি করে যা রক্ত তঞ্চন (Blood Clotting) বা রক্ত জমাট বাঁধতে অপরিহার্য।"
    },
    {
      "id": 223,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "শুষ্ক বরফ (Dry Ice) মূলত কী?",
      "options": [
        "হিমায়িত জলীয় বাষ্প",
        "কঠিন কার্বন ডাই-অক্সাইড",
        "তরল নাইট্রোজেন",
        "কঠিন মিথেন"
      ],
      "correct": 1,
      "explanation": "কঠিন কার্বন ডাই-অক্সাইডকে শুষ্ক বরফ বলা হয়, কারণ এটি গলে তরল না হয়ে সরাসরি গ্যাসে বাষ্পীভূত হয়।"
    },
    {
      "id": 224,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "কম্পিউটারের ‘মস্তিষ্ক’ (Brain of Computer) কাকে বলা হয়?",
      "options": [
        "RAM",
        "Hard Disk",
        "CPU",
        "Motherboard"
      ],
      "correct": 2,
      "explanation": "CPU (Central Processing Unit) কম্পিউটারের সকল গাণিতিক ও যৌক্তিক কার্যাবলি সম্পাদন ও নিয়ন্ত্রণ করে বলে একে কম্পিউটারের মস্তিষ্ক বলা হয়।"
    },
    {
      "id": 225,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "১ গিগাবাইট (1 GB) সমান কত মেগাবাইট (MB)?",
      "options": [
        "১০০০ MB",
        "১০২৪ MB",
        "১০৪৮ MB",
        "৫১২ MB"
      ],
      "correct": 1,
      "explanation": "বাইনারি হিসাব অনুযায়ী ১ গিগাবাইট (1 GB) = ২¹⁰ মেগাবাইট = ১০২৪ মেগাবাইট (MB)।"
    },
    {
      "id": 226,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘হাতাহাতি’ কোন সমাসের উদাহরণ?",
      "options": [
        "কর্মধারয়",
        "তৎপুরুষ",
        "ব্যতিহার বহুব্রীহি",
        "দ্বিগু"
      ],
      "correct": 2,
      "explanation": "পরস্পর এক জাতীয় ক্রিয়া সম্পাদন বোঝালে যে বহুব্রীহি সমাস হয় তাকে ব্যতিহার বহুব্রীহি বলে (যেমন: হাতে হাতে যে যুদ্ধ = হাতাহাতি)।"
    },
    {
      "id": 227,
      "subject": "English",
      "question": "Identify the correct passive voice: 'Who is calling me?'",
      "options": [
        "By whom I am called?",
        "By whom am I being called?",
        "Who was called by me?",
        "By whom was I called?"
      ],
      "correct": 1,
      "explanation": "Present continuous interrogative passive rule: By whom + am/is/are + subject + being + V3? Hence: 'By whom am I being called?'"
    },
    {
      "id": 228,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "বাংলাদেশের জাতীয় সংসদের প্রথম স্পিকার কে ছিলেন?",
      "options": [
        "শাহ আবদুল হামিদ",
        "মোহাম্মদ উল্লাহ",
        "আব্দুল মালেক উকিল",
        "ব্যারিস্টার জমির উদ্দিন সরকার"
      ],
      "correct": 0,
      "explanation": "গণপরিষদ ও বাংলাদেশের জাতীয় সংসদের প্রথম স্পিকার ছিলেন শাহ আবদুল হামিদ।"
    },
    {
      "id": 229,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "উত্তর আটলান্টিক নিরাপত্তা জোট (NATO) এর সদর দপ্তর কোথায় অবস্থিত?",
      "options": [
        "লন্ডন, যুক্তরাজ্য",
        "প্যারিস, ফ্রান্স",
        "ব্রাসেলস, বেলজিয়াম",
        "জেনেভা, সুইজারল্যান্ড"
      ],
      "correct": 2,
      "explanation": "১৯৪৯ সালে গঠিত ন্যাটো (NATO)-র সদর দপ্তর বেলজিয়ামের রাজধানী ব্রাসেলসে অবস্থিত।"
    },
    {
      "id": 230,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "ব্লুটুথ (Bluetooth) কোন প্রযুক্তির মাধ্যমে সংক্ষিপ্ত দূরত্বে ডেটা স্থানান্তর করে?",
      "options": [
        "ইনফ্রারেড রশ্মি",
        "রেডিও তরঙ্গ (Radio Waves)",
        "অপটিক্যাল ফাইবার",
        "মাইক্রোওয়েভ"
      ],
      "correct": 1,
      "explanation": "ব্লুটুথ ২.৪ গিগাহার্টজ ফ্রিকোয়েন্সির শর্ট-রেঞ্জ রেডিও তরঙ্গের (Radio Waves) মাধ্যমে ডিভাইসসমূহের মধ্যে ডেটা আদান-প্রদান করে।"
    },
    {
      "id": 231,
      "subject": "বাংলা সাহিত্য",
      "question": "‘সঞ্চিতা’ কোন জাতীয় কবির কাব্যসংকলন?",
      "options": [
        "রবীন্দ্রনাথ ঠাকুর",
        "কাজী নজরুল ইসলাম",
        "জীবনানন্দ দাশ",
        "জসীমউদ্দীন"
      ],
      "correct": 1,
      "explanation": "‘সঞ্চিতা’ কাজী নজরুল ইসলামের শ্রেষ্ঠ কবিতা ও গানের সংকলন। পক্ষান্তরে ‘সঞ্চয়িতা’ হলো রবীন্দ্রনাথ ঠাকুরের কাব্যসংকলন।"
    },
    {
      "id": 232,
      "subject": "বাংলা সাহিত্য",
      "question": "‘তিতাস একটি নদীর নাম’ উপন্যাসের লেখক কে?",
      "options": [
        "অদ্বৈত মল্লবর্মণ",
        "তারাশঙ্কর বন্দ্যোপাধ্যায়",
        "মানিক বন্দ্যোপাধ্যায়",
        "বিভূতিভূষণ বন্দ্যোপাধ্যায়"
      ],
      "correct": 0,
      "explanation": "অদ্বৈত মল্লবর্মণ রচিত কালজয়ী উপন্যাস ‘তিতাস একটি নদীর নাম’ তিতাস তীরবর্তী মালো (জেলে) সম্প্রদায়ের জীবনযাত্রাকে উপজীব্য করে রচিত।"
    },
    {
      "id": 233,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘অনুচ্ছেদ’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?",
      "options": [
        "অনু + ছেদ",
        "অনু + ছদ",
        "অনুত + ছেদ",
        "অনুঃ + ছেদ"
      ],
      "correct": 0,
      "explanation": "হ্রস্ব স্বরবর্ণের পর ‘ছ’ থাকলে সন্ধির নিয়মে তা ‘চ্ছ’ হয়: অনু + ছেদ = অনুচ্ছেদ।"
    },
    {
      "id": 234,
      "subject": "বাংলা ব্যাকরণ",
      "question": "‘যা চিরস্থায়ী নয়’— এক কথায় প্রকাশ কী হবে?",
      "options": [
        "অবিনশ্বর",
        "ক্ষণস্থায়ী",
        "নশ্বর",
        "অনিত্য"
      ],
      "correct": 2,
      "explanation": "যা চিরস্থায়ী নয় = নশ্বর (অথবা অনিত্য)। আর যা ক্ষণকাল স্থায়ী হয় = ক্ষণস্থায়ী।"
    },
    {
      "id": 235,
      "subject": "English",
      "question": "What is the meaning of the phrasal verb 'Look after'?",
      "options": [
        "To search for",
        "To examine carefully",
        "To take care of",
        "To anticipate eagerly"
      ],
      "correct": 2,
      "explanation": "'Look after' means to take care of someone or something (e.g. She looks after her elderly parents)."
    },
    {
      "id": 236,
      "subject": "English",
      "question": "Identify the correctly spelled word:",
      "options": [
        "Lieutenaunt",
        "Lieutenant",
        "Leutenant",
        "Leiutenant"
      ],
      "correct": 1,
      "explanation": "The correct British spelling is 'Lieutenant' (L-I-E-U-T-E-N-A-N-T)."
    },
    {
      "id": 237,
      "subject": "English",
      "question": "Choose the correct pronoun: 'The baby cried for ___ mother.'",
      "options": [
        "her",
        "his",
        "its",
        "their"
      ],
      "correct": 2,
      "explanation": "In standard English grammar, young babies and animals whose gender is not specified are traditionally referred to by the neuter pronoun 'its'."
    },
    {
      "id": 238,
      "subject": "গণিত",
      "question": "১ থেকে ৫০ পর্যন্ত বিজোড় সংখ্যাগুলোর সমষ্টি কত?",
      "options": [
        "৫০০",
        "৬০০",
        "৬২৫",
        "৬৫০"
      ],
      "correct": 2,
      "explanation": "১ থেকে ৫০ পর্যন্ত বিজোড় সংখ্যা আছে ২৫টি। ১ম n সংখ্যক স্বাভাবিক বিজোড় সংখ্যার যোগফল = n² = ২৫² = ৬২৫।"
    },
    {
      "id": 239,
      "subject": "গণিত",
      "question": "৩, ৯, ২৭, ৮১ ... গুণোত্তর ধারাটির পরবর্তী (৫ম) পদ কত?",
      "options": [
        "১৬২",
        "২১৬",
        "২৪৩",
        "৩২৪"
      ],
      "correct": 2,
      "explanation": "ধারাটির সাধারণ অনুপাত ৩ (প্রতিটি পদ পূর্ববর্তী পদের ৩ গুণ)। সুতরাং ৫ম পদ = ৮১ × ৩ = ২৪৩।"
    },
    {
      "id": 240,
      "subject": "গণিত",
      "question": "একটি দ্রব্য ৪০০ টাকায় ক্রয় করে ৪৪০ টাকায় বিক্রয় করলে শতকরা কত লাভ হবে?",
      "options": [
        "৮%",
        "১০%",
        "১২%",
        "১৫%"
      ],
      "correct": 1,
      "explanation": "লাভ = ৪৪০ - ৪০০ = ৪০ টাকা। শতকরা লাভ = (৪০ / ৪০০) × ১০০% = ১০%।"
    },
    {
      "id": 241,
      "subject": "বাংলাদেশ বিষয়াবলী",
      "question": "ঐতিহাসিক মুজিবনগর সরকার কোন তারিখে আনুষ্ঠানিকভাবে শপথ গ্রহণ করে?",
      "options": [
        "১০ এপ্রিল ১৯৭১",
        "১৭ এপ্রিল ১৯৭১",
        "২৫ মার্চ ১৯৭১",
        "১৬ ডিসেম্বর ১৯৭১"
      ],
      "correct": 1,
      "explanation": "১৯৭১ সালের ১০ এপ্রিল সরকার গঠিত হয় এবং ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার (মুজিবনগর) আম্রকাননে আনুষ্ঠানিকভাবে শপথ গ্রহণ করে।"
    },
    {
      "id": 242,
      "subject": "আন্তর্জাতিক বিষয়াবলী",
      "question": "জাতিসংঘের আন্তর্জাতিক বিচার আদালত (ICJ) কোথায় অবস্থিত?",
      "options": [
        "নিউইয়র্ক",
        "জেনেভা",
        "দ্য হেগ (নেদারল্যান্ডস)",
        "প্যারিস"
      ],
      "correct": 2,
      "explanation": "International Court of Justice (ICJ)-র স্থায়ী সদর দপ্তর নেদারল্যান্ডসের দ্য হেগ (The Hague) শহরের পিস প্যালেসে অবস্থিত।"
    },
    {
      "id": 243,
      "subject": "সাধারণ বিজ্ঞান",
      "question": "দৃশ্যমান আলোর মধ্যে কোন রঙের আলোর তরঙ্গদৈর্ঘ্য (Wavelength) সবচেয়ে কম?",
      "options": [
        "লাল",
        "নীল",
        "বেগুনি",
        "হলুদ"
      ],
      "correct": 2,
      "explanation": "বেনীআসহকলা বর্ণালীতে বেগুনির তরঙ্গদৈর্ঘ্য সবচেয়ে কম (প্রায় ৪০০ ন্যানোমিটার) এবং লালের তরঙ্গদৈর্ঘ্য সবচেয়ে বেশি (প্রায় ৭০০ ন্যানোমিটার)।"
    },
    {
      "id": 244,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "ওয়েব ব্রাউজিংয়ে বহুল ব্যবহৃত 'HTTP' এর পূর্ণরূপ কী?",
      "options": [
        "Hyper Text Transfer Protocol",
        "High Transmission Text Protocol",
        "Hyperlink Text Transfer Protocol",
        "Home Tool Transfer Page"
      ],
      "correct": 0,
      "explanation": "HTTP stands for Hypertext Transfer Protocol, which is the foundational protocol used by the World Wide Web."
    },
    {
      "id": 245,
      "subject": "কম্পিউটার ও আইসিটি",
      "question": "কোন ধরনের মেমোরি ভোলাটাইল (Volatile) বা বিদ্যুৎ সরবরাহ বন্ধ হলে ডেটা মুছে যায়?",
      "options": [
        "ROM",
        "RAM",
        "Hard Disk",
        "Flash Drive"
      ],
      "correct": 1,
      "explanation": "RAM (Random Access Memory) হলো অস্থায়ী বা ভোলাটাইল মেমোরি, যা কম্পিউটার বন্ধ বা বিদ্যুৎ বিচ্ছিন্ন হলে সব ডেটা হারিয়ে ফেলে।"
    }
  ];

  let userMCQProgress = {
    answers: {},          // { [qId]: { selectedIndex, isCorrect, timesCorrect, timesAnswered, lastAnswered } }
    masteredIds: [],      // IDs of questions answered correctly 2 times (removed from active list)
    removedSubjects: [],  // Removed subjects from the subject list
    addedExtendedIndex: 0
  };

  function loadMCQProgress() {
    try {
      const raw = localStorage.getItem(MCQ_PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        userMCQProgress.answers = parsed.answers || {};
        userMCQProgress.masteredIds = Array.isArray(parsed.masteredIds) ? parsed.masteredIds.map(String) : [];
        userMCQProgress.removedSubjects = Array.isArray(parsed.removedSubjects) ? parsed.removedSubjects : [];
        userMCQProgress.addedExtendedIndex = typeof parsed.addedExtendedIndex === "number" ? parsed.addedExtendedIndex : 0;
      }
    } catch (e) {
      userMCQProgress = { answers: {}, masteredIds: [], removedSubjects: [], addedExtendedIndex: 0 };
    }
  }

  function saveMCQProgress() {
    try {
      localStorage.setItem(MCQ_PROGRESS_KEY, JSON.stringify(userMCQProgress));
    } catch (e) { }
  }

  function getStoredQuestions() {
    try {
      const data = localStorage.getItem(MCQ_CUSTOM_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredQuestions(qList) {
    try {
      localStorage.setItem(MCQ_CUSTOM_KEY, JSON.stringify(qList));
    } catch (e) { }
  }

  // Auto-Shuffle function (Fisher-Yates) for options while tracking correct answer
  function autoShuffleOptions(q) {
    if (!q || !Array.isArray(q.options)) return q;
    const optionsWithMeta = q.options.map((opt, idx) => ({
      text: opt,
      isCorrect: (idx === q.correct)
    }));

    for (let i = optionsWithMeta.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsWithMeta[i], optionsWithMeta[j]] = [optionsWithMeta[j], optionsWithMeta[i]];
    }

    return {
      ...q,
      options: optionsWithMeta.map(o => o.text),
      correct: optionsWithMeta.findIndex(o => o.isCorrect)
    };
  }

  loadMCQProgress();

  // Combine default, AI, and custom questions, excluding already mastered questions and removed subjects
  function getActiveQuestionsPool() {
    const masteredSet = new Set(userMCQProgress.masteredIds.map(String));
    const removedSubjectsSet = new Set(userMCQProgress.removedSubjects || []);
    const rawAll = [...defaultQuestions, ...aiCuratedPool, ...getStoredQuestions()];

    // Deduplicate by question text
    const seen = new Set();
    const unique = [];
    rawAll.forEach(q => {
      const key = q.question.trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(q);
      }
    });

    // Filter out mastered questions (answered right 2 times) and questions from removed subjects
    return unique.filter(q => !masteredSet.has(String(q.id)) && !removedSubjectsSet.has(q.subject));
  }

  let allQuestions = getActiveQuestionsPool();
  let activeExamPool = [...allQuestions];
  let currentMCQIndex = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let sessionAnswered = {};
  let is20ExamMode = false;
  let examTimerInterval = null;
  let timeRemaining = 900; // 15 minutes = 900s
  let autoNextTimeout = null;
  let autoAdvanceCountdownInterval = null;

  // Streak & Audio & Exam Flagging States
  let mcqStreak = 0;
  let mcqBestStreak = parseInt(localStorage.getItem('jobprep_mcq_best_streak') || '0', 10);
  let mcqSoundEnabled = localStorage.getItem('jobprep_mcq_sound') !== 'false';
  let mcqAutoAdvanceEnabled = localStorage.getItem('jobprep_mcq_autoadvance') !== 'false';
  let flaggedQuestions = {};

  const prefixList = ["A", "B", "C", "D"];

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

  // Pure Web Audio API Synthesizer (No external sound files required)
  function playMCQAudio(type) {
    if (!mcqSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._mcqAudioCtx) {
        window._mcqAudioCtx = new AudioCtx();
      }
      const ctx = window._mcqAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      if (type === 'correct') {
        // High-pitched cheerful two-tone chime (D5 -> A5 -> D6)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.14);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.42);
      } else if (type === 'streak') {
        // Triumphant 3-step ascending arpeggio (C5 -> E5 -> C6)
        [523.25, 659.25, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.16, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.32);
        });
      } else if (type === 'mastered') {
        // Sparkly harp chime for question graduation
        [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.12, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.4);
        });
      } else if (type === 'wrong') {
        // Soft low tone buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch (e) { /* ignore if audio blocked */ }
  }

  // Floating +1.0 animation
  function spawnFloatingPoints(targetEl, text) {
    if (!targetEl) return;
    try {
      const rect = targetEl.getBoundingClientRect();
      const floatEl = document.createElement("div");
      floatEl.className = "mcq-floating-points";
      floatEl.textContent = text;
      floatEl.style.left = (rect.left + rect.width / 2 - 20) + "px";
      floatEl.style.top = (rect.top + window.scrollY - 10) + "px";
      document.body.appendChild(floatEl);
      setTimeout(() => { floatEl.remove(); }, 850);
    } catch (e) { }
  }

  // Exam Question Navigator Palette
  function renderMCQPalette() {
    const container = document.getElementById("mcq-palette-container");
    const grid = document.getElementById("mcq-palette-grid");
    if (!container || !grid) return;

    if (!is20ExamMode) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";
    grid.innerHTML = "";

    activeExamPool.forEach((q, idx) => {
      const qKey = String(q.id !== undefined ? q.id : idx);
      const isCurrent = (idx === currentMCQIndex);
      const isAnswered = (sessionAnswered[qKey] && sessionAnswered[qKey].selectedIndex !== undefined);
      const isFlagged = Boolean(flaggedQuestions[qKey]);

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "palette-chip" +
        (isCurrent ? " current" : "") +
        (isAnswered ? " answered" : "") +
        (isFlagged ? " flagged" : "");
      chip.textContent = String(idx + 1);
      chip.title = `Question ${idx + 1}${isFlagged ? " (Flagged)" : (isAnswered ? " (Answered)" : "")}`;
      chip.addEventListener("click", () => {
        goToMCQQuestion(idx);
      });
      grid.appendChild(chip);
    });
  }

  function goToMCQQuestion(idx) {
    clearTimeout(autoNextTimeout);
    clearInterval(autoAdvanceCountdownInterval);
    if (idx < 0 || idx >= activeExamPool.length) return;
    currentMCQIndex = idx;
    renderMCQQuestion();
    updateMCQStats();
  }

  function toggleFlagCurrentQuestion() {
    if (!activeExamPool[currentMCQIndex]) return;
    const q = activeExamPool[currentMCQIndex];
    const qKey = String(q.id !== undefined ? q.id : currentMCQIndex);
    flaggedQuestions[qKey] = !flaggedQuestions[qKey];

    const flagBtn = document.getElementById("qFlagBtn");
    const flagText = document.getElementById("qFlagText");
    if (flagBtn) flagBtn.classList.toggle("flagged", Boolean(flaggedQuestions[qKey]));
    if (flagText) flagText.textContent = flaggedQuestions[qKey] ? "Flagged for Review" : "Mark for Review";

    renderMCQPalette();
  }

  function updateMCQStats() {
    const currentIndexEl = document.getElementById("current-index");
    const progressBar = document.getElementById("mcqProgressBar");
    const correctCountEl = document.getElementById("correct-count");
    const wrongCountEl = document.getElementById("wrong-count");
    const scoreValEl = document.getElementById("score-val");
    const streakCountEl = document.getElementById("mcqStreakCount");
    const bestStreakEl = document.getElementById("mcqBestStreak");
    const streakCard = document.getElementById("mcqStreakCard");
    const masteryBadge = document.getElementById("mcqMasteryBadge");
    const resetMasteredBtn = document.getElementById("resetMasteredBtn");
    const modeBadge = document.getElementById("mcqCurrentModeBadge");

    if (bestStreakEl) bestStreakEl.textContent = mcqBestStreak;
    if (streakCountEl) streakCountEl.textContent = mcqStreak;
    if (streakCard) streakCard.classList.toggle("active-streak", mcqStreak >= 2);

    if (modeBadge) {
      modeBadge.textContent = is20ExamMode ? "20-Q Exam Mode" : "Practice Mode";
    }

    if (is20ExamMode) {
      const answeredCount = Object.keys(sessionAnswered).length;
      const totalQs = activeExamPool.length || EXAM_QUESTION_COUNT;
      if (currentIndexEl) currentIndexEl.textContent = `${currentMCQIndex + 1} / ${totalQs}`;
      if (progressBar) {
        const pct = Math.min(100, Math.round(((currentMCQIndex + 1) / totalQs) * 100));
        progressBar.style.width = pct + "%";
      }
      if (correctCountEl) {
        correctCountEl.textContent = answeredCount;
        const lbl = correctCountEl.nextElementSibling;
        if (lbl) lbl.textContent = "Answered";
      }
      if (wrongCountEl) {
        wrongCountEl.textContent = Math.max(0, totalQs - answeredCount);
        const lbl = wrongCountEl.nextElementSibling;
        if (lbl) lbl.textContent = "Remaining";
      }
      if (scoreValEl) {
        scoreValEl.textContent = "Locked";
        const lbl = scoreValEl.nextElementSibling;
        if (lbl) lbl.textContent = "Results on Submit";
      }
    } else {
      const totalQs = activeExamPool.length;
      if (currentIndexEl) currentIndexEl.textContent = totalQs ? `${currentMCQIndex + 1} / ${totalQs}` : "0 / 0";
      if (progressBar) {
        const pct = totalQs ? Math.min(100, Math.round(((currentMCQIndex + 1) / totalQs) * 100)) : 0;
        progressBar.style.width = pct + "%";
      }
      if (correctCountEl) {
        correctCountEl.textContent = correctAnswers;
        const lbl = correctCountEl.nextElementSibling;
        if (lbl) lbl.textContent = "Correct (+1.0)";
      }
      if (wrongCountEl) {
        wrongCountEl.textContent = wrongAnswers;
        const lbl = wrongCountEl.nextElementSibling;
        if (lbl) lbl.textContent = "Incorrect (-0.5)";
      }
      const totalMarks = (correctAnswers * 1.0) - (wrongAnswers * 0.5);
      if (scoreValEl) {
        scoreValEl.textContent = totalMarks.toFixed(2);
        const lbl = scoreValEl.nextElementSibling;
        if (lbl) lbl.textContent = "Net Score";
      }
    }

    const masteredCount = (userMCQProgress.masteredIds || []).length;
    if (masteryBadge) {
      masteryBadge.innerHTML = `${ICON.trophy} ${masteredCount} Mastered`;
    }
    if (resetMasteredBtn) {
      resetMasteredBtn.style.display = masteredCount > 0 ? "inline-flex" : "none";
    }

    renderMCQPalette();
  }

  // Automatically add fresh questions from extendedQuestionPool
  function autoAddFreshQuestions() {
    const masteredSet = new Set(userMCQProgress.masteredIds.map(String));
    const removedSubjectsSet = new Set(userMCQProgress.removedSubjects || []);
    const existingQuestions = new Set(allQuestions.map(q => q.question.trim()));

    // Filter available candidates from extendedQuestionPool
    const candidates = extendedQuestionPool.filter(q => {
      return !existingQuestions.has(q.question.trim()) && !masteredSet.has(String(q.id)) && !removedSubjectsSet.has(q.subject);
    });

    if (candidates.length === 0) {
      return 0;
    }

    // Add a batch of up to 10 questions
    const batch = candidates.slice(0, 10);
    const stored = getStoredQuestions();

    batch.forEach(item => {
      const newQ = {
        ...item,
        id: item.id || ("ext_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)),
        isAutoAdded: true
      };
      stored.push(newQ);
      allQuestions.push(newQ);
      activeExamPool.push(autoShuffleOptions(newQ));
    });

    saveStoredQuestions(stored);
    updateMCQStats();
    showToast(`You answered all questions! Added ${batch.length} fresh high-yield questions to your question bank.`, false);
    return batch.length;
  }

  function advanceToNextMCQQuestion() {
    clearTimeout(autoNextTimeout);
    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;

    const currentQ = activeExamPool[currentMCQIndex];
    if (currentQ && currentQ._markedForDeletion) {
      const delId = String(currentQ.id);
      allQuestions = allQuestions.filter(q => String(q.id) !== delId);
      activeExamPool = activeExamPool.filter(q => String(q.id) !== delId);
      updateMCQStats();
      if (currentMCQIndex >= activeExamPool.length) {
        currentMCQIndex = Math.max(0, activeExamPool.length - 1);
      }
      if (activeExamPool.length === 0) {
        const added = autoAddFreshQuestions();
        if (!added) {
          showMCQSummary();
          return;
        }
      }
      renderMCQQuestion();
      return;
    }

    if (currentMCQIndex < activeExamPool.length - 1) {
      currentMCQIndex++;
      renderMCQQuestion();
    } else {
      if (is20ExamMode) {
        openExamSubmitModal();
        return;
      }
      const added = autoAddFreshQuestions();
      if (added > 0) {
        currentMCQIndex++;
        renderMCQQuestion();
      } else {
        showMCQSummary();
      }
    }
  }

  function renderMCQQuestion() {
    const quizCard = document.getElementById("quiz-card");
    const summaryCard = document.getElementById("summary-card");
    if (quizCard) quizCard.style.display = "block";
    if (summaryCard) summaryCard.style.display = "none";

    const qSubject = document.getElementById("q-subject");
    const qSourceTag = document.getElementById("q-source-tag");
    const qText = document.getElementById("q-text");
    const optionsContainer = document.getElementById("options-container");
    const explanationBox = document.getElementById("explanation-box");
    const explanationText = document.getElementById("explanation-text");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const currentIndexEl = document.getElementById("current-index");
    const historyBadge = document.getElementById("q-history-badge");
    const retryBtn = document.getElementById("retry-btn");
    const qFlagBtn = document.getElementById("qFlagBtn");
    const qFlagText = document.getElementById("qFlagText");
    const autoNextPill = document.getElementById("qAutoNextPill");
    const streakBanner = document.getElementById("mcq-streak-banner");

    if (!quizCard) return;
    clearTimeout(autoNextTimeout);
    clearInterval(autoAdvanceCountdownInterval);
    if (retryBtn) retryBtn.style.display = "none";
    if (streakBanner) streakBanner.style.display = "none";

    if (activeExamPool.length === 0) {
      const added = autoAddFreshQuestions();
      if (!added) {
        if (qText) qText.innerHTML = "<strong>All questions in this subject are Mastered!</strong><br><small style=\"color:var(--text-soft); font-weight:normal;\">You have answered all questions correctly twice. Click 'Restore Mastered' above or pick another subject.</small>";
        if (optionsContainer) optionsContainer.innerHTML = "";
        if (explanationBox) explanationBox.classList.remove("show");
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        if (currentIndexEl) currentIndexEl.textContent = "0 / 0";
        if (historyBadge) historyBadge.textContent = "Mastered!";
        return;
      }
    }

    if (nextBtn) nextBtn.style.display = "inline-flex";

    if (currentMCQIndex < 0) currentMCQIndex = 0;
    if (currentMCQIndex >= activeExamPool.length) currentMCQIndex = activeExamPool.length - 1;

    const q = activeExamPool[currentMCQIndex];
    if (currentIndexEl) currentIndexEl.textContent = (currentMCQIndex + 1) + " / " + activeExamPool.length;
    if (qSubject) qSubject.textContent = q.subject || "BCS Preliminary";
    if (qSourceTag) qSourceTag.textContent = q.isCustom ? "Custom Question" : "BCS Preliminary Standard";
    if (qText) qText.textContent = (currentMCQIndex + 1) + ". " + q.question;
    if (optionsContainer) optionsContainer.innerHTML = "";
    if (explanationBox) explanationBox.classList.remove("show");

    if (prevBtn) prevBtn.style.display = currentMCQIndex > 0 ? "inline-flex" : "none";
    if (nextBtn) {
      if (is20ExamMode) {
        if (currentMCQIndex === activeExamPool.length - 1) {
          nextBtn.innerHTML = `Finish &amp; Submit ${ICON.checkCircle}`;
        } else {
          nextBtn.innerHTML = `Next ${ICON.arrowR}`;
        }
      } else {
        nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;
      }
    }

    const qKey = String(q.id !== undefined ? q.id : currentMCQIndex);

    // Flag button state
    if (qFlagBtn) {
      qFlagBtn.style.display = is20ExamMode ? "inline-flex" : "none";
      const isFlagged = Boolean(flaggedQuestions[qKey]);
      qFlagBtn.classList.toggle("flagged", isFlagged);
      if (qFlagText) {
        qFlagText.textContent = isFlagged ? "Flagged for Review" : "Mark for Review";
      }
    }

    if (is20ExamMode) {
      // IN 20-QUESTION EXAM MODE
      if (explanationBox) explanationBox.classList.remove("show");
      if (historyBadge) historyBadge.style.display = "none";
      if (autoNextPill) autoNextPill.style.display = "none";
      if (retryBtn) retryBtn.style.display = "none";

      const userChoice = (sessionAnswered[qKey] && sessionAnswered[qKey].selectedIndex !== undefined)
        ? sessionAnswered[qKey].selectedIndex
        : undefined;

      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        const isSel = (userChoice === idx);
        btn.className = "option-btn" + (isSel ? " selected-exam" : "");
        btn.type = "button";
        btn.innerHTML = `
          <div class="opt-left">
            <span class="opt-prefix">${prefixList[idx] || (idx + 1)}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </div>
          <div class="opt-status-tag">
            ${isSel ? '<span style="font-size:11px; color:var(--accent1); font-weight:700;">Selected</span>' : ''}
          </div>
        `;
        btn.onclick = () => selectMCQOption(idx, q);
        if (optionsContainer) optionsContainer.appendChild(btn);
      });
    } else {
      // IN QUESTION BANK PRACTICE MODE
      if (historyBadge) historyBadge.style.display = "inline-flex";
      if (autoNextPill) {
        autoNextPill.style.display = "inline-flex";
        autoNextPill.innerHTML = `${ICON.zap} Auto-Next: ${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}`;
      }

      const rememberedAnswer = sessionAnswered[qKey] || userMCQProgress.answers[qKey];
      const prevStat = userMCQProgress.answers[qKey] || { timesCorrect: 0 };
      const timesCorrect = prevStat.timesCorrect || 0;

      // Update Question Mastery Badge
      if (historyBadge) {
        if (timesCorrect >= 2) {
          historyBadge.className = "q-history-badge mastered";
          historyBadge.innerHTML = `${ICON.trophy} Mastered (2/2) ⭐⭐`;
        } else if (timesCorrect === 1) {
          historyBadge.className = "q-history-badge has-correct";
          historyBadge.innerHTML = `⭐ 1/2 Right (1 more to master)`;
        } else {
          historyBadge.className = "q-history-badge";
          historyBadge.textContent = "Mastery: 0/2";
        }
      }

      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.type = "button";

        let statusTagHtml = "";

        if (rememberedAnswer !== undefined) {
          btn.disabled = true;
          if (idx === q.correct) {
            btn.classList.add(rememberedAnswer.selectedIndex === q.correct ? "selected-correct" : "highlight-correct");
            statusTagHtml = `${ICON.checkCircle} <span style="color:#10b981;">Correct</span>`;
          } else if (idx === rememberedAnswer.selectedIndex && !rememberedAnswer.isCorrect) {
            btn.classList.add("selected-wrong");
            statusTagHtml = `${ICON.xCircle} <span style="color:#f43f5e;">Your Answer</span>`;
          }
        } else {
          btn.onclick = () => selectMCQOption(idx, q);
        }

        btn.innerHTML = `
          <div class="opt-left">
            <span class="opt-prefix">${prefixList[idx] || (idx + 1)}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </div>
          <div class="opt-status-tag">${statusTagHtml}</div>
        `;

        if (optionsContainer) optionsContainer.appendChild(btn);
      });

      if (rememberedAnswer !== undefined && explanationText && explanationBox) {
        if (rememberedAnswer.isCorrect) {
          let expHtml = escapeHtml(q.explanation || "No explanation provided.");
          expHtml += `<div style="margin-top:10px; padding:8px 12px; background:rgba(16,185,129,0.12); border-radius:8px; border:1px solid rgba(16,185,129,0.25); color:#10b981; font-weight:600; font-size:12.5px;">
            ✓ Correct! In the BCS Leitner model, answering correctly twice graduates the question to Mastered.
          </div>`;
          explanationText.innerHTML = expHtml;
        } else {
          if (retryBtn) retryBtn.style.display = "inline-flex";
          const yourText = escapeHtml(q.options[rememberedAnswer.selectedIndex] || "");
          const correctText = escapeHtml(q.options[q.correct] || "");
          explanationText.innerHTML = `
            <div class="wrong-feedback-badge">${ICON.xCircle} Incorrect</div>
            <div style="margin-bottom:8px; font-size:13px; line-height:1.6;">
              <strong>Your Answer:</strong> <span style="color:#f43f5e; font-weight:600;">${yourText}</span> &nbsp;|&nbsp; 
              <strong>Correct Answer:</strong> <span style="color:#10b981; font-weight:600;">${correctText}</span>
            </div>
            <div style="margin-bottom:8px;"><strong>Explanation &amp; Shortcut:</strong> ${escapeHtml(q.explanation || "No explanation provided.")}</div>
            <div class="mistake-saved-badge">${ICON.flag} Saved to Mistake Bank for review</div>
          `;
        }
        explanationBox.classList.add("show");
      }
    }

    renderMCQPalette();
  }

  function selectMCQOption(selectedIndex, q) {
    clearTimeout(autoNextTimeout);
    clearInterval(autoAdvanceCountdownInterval);
    const qKey = String(q.id !== undefined ? q.id : currentMCQIndex);
    const optionsContainer = document.getElementById("options-container");
    const streakBanner = document.getElementById("mcq-streak-banner");
    const explanationBox = document.getElementById("explanation-box");
    const explanationText = document.getElementById("explanation-text");
    const retryBtn = document.getElementById("retry-btn");
    const nextBtn = document.getElementById("next-btn");

    if (is20ExamMode) {
      // IN 20-QUESTION EXAM MODE:
      // Neutral recording without immediate spoilers
      sessionAnswered[qKey] = { selectedIndex };

      if (optionsContainer) {
        Array.from(optionsContainer.children).forEach((btn, idx) => {
          const isSel = (idx === selectedIndex);
          btn.classList.toggle("selected-exam", isSel);
          const tag = btn.querySelector(".opt-status-tag");
          if (tag) tag.innerHTML = isSel ? '<span style="font-size:11px; color:var(--accent1); font-weight:700;">Selected</span>' : '';
        });
      }

      updateMCQStats();
      renderMCQPalette();

      // Smooth advance after 380ms
      autoNextTimeout = setTimeout(() => {
        advanceToNextMCQQuestion();
      }, 380);
      return;
    }

    // IN PRACTICE / STUDY MODE:
    const isCorrect = (selectedIndex === q.correct);
    sessionAnswered[qKey] = { selectedIndex, isCorrect };

    // Update persistent progress
    const prev = userMCQProgress.answers[qKey] || { timesCorrect: 0, timesAnswered: 0 };
    let newTimesCorrect = prev.timesCorrect || 0;
    if (isCorrect) newTimesCorrect++;
    const newTimesAnswered = (prev.timesAnswered || 0) + 1;

    userMCQProgress.answers[qKey] = {
      selectedIndex,
      isCorrect,
      timesCorrect: newTimesCorrect,
      timesAnswered: newTimesAnswered,
      lastAnswered: Date.now()
    };

    let justMastered = false;

    // Highlight all option buttons with status icons
    if (optionsContainer) {
      Array.from(optionsContainer.children).forEach((btn, idx) => {
        btn.disabled = true;
        const tag = btn.querySelector(".opt-status-tag");
        if (idx === q.correct) {
          btn.classList.add(selectedIndex === q.correct ? "selected-correct" : "highlight-correct");
          if (tag) tag.innerHTML = `${ICON.checkCircle} <span style="color:#10b981;">Correct</span>`;
        } else if (idx === selectedIndex && !isCorrect) {
          btn.classList.add("selected-wrong");
          if (tag) tag.innerHTML = `${ICON.xCircle} <span style="color:#f43f5e;">Your Choice</span>`;
        }
      });
    }

    if (isCorrect) {
      correctAnswers++;
      mcqStreak++;
      if (mcqStreak > mcqBestStreak) {
        mcqBestStreak = mcqStreak;
        try { localStorage.setItem('jobprep_mcq_best_streak', String(mcqBestStreak)); } catch (e) { }
      }

      // Audio feedback
      playMCQAudio(mcqStreak >= 3 ? 'streak' : 'correct');

      // Floating points animation
      if (optionsContainer && optionsContainer.children[selectedIndex]) {
        spawnFloatingPoints(optionsContainer.children[selectedIndex], "+1.0");
      }

      if (retryBtn) retryBtn.style.display = "none";

      // Check mastery (2-correct Leitner rule)
      if (newTimesCorrect >= 2) {
        const strId = String(q.id !== undefined ? q.id : qKey);
        if (!userMCQProgress.masteredIds.map(String).includes(strId)) {
          userMCQProgress.masteredIds.push(q.id !== undefined ? q.id : qKey);
          justMastered = true;
          playMCQAudio('mastered');
        }
      }

      // Dynamic Streak / Correct Banner
      if (streakBanner) {
        let streakTitle = "✓ Correct! (+1.0 point earned)";
        if (justMastered) {
          streakTitle = `🏆 Awesome! Question Mastered (2/2)!`;
        } else if (mcqStreak >= 10) {
          streakTitle = `👑 ${mcqStreak} Streak! Top of the leaderboard!`;
        } else if (mcqStreak >= 5) {
          streakTitle = `⚡ ${mcqStreak} Streak! Unstoppable speed!`;
        } else if (mcqStreak >= 3) {
          streakTitle = `🔥 ${mcqStreak} Streak! Great momentum!`;
        } else if (mcqStreak === 2) {
          streakTitle = `🔥 2 Streak! Keep going!`;
        }

        streakBanner.innerHTML = `
          <div class="streak-banner-title">
            ${justMastered ? ICON.trophy : (mcqStreak >= 3 ? ICON.flame : ICON.checkCircle)}
            <span>${streakTitle}</span>
          </div>
          <div class="streak-banner-controls">
            ${mcqAutoAdvanceEnabled ? `
              <span class="auto-advance-note" id="autoAdvanceNote" style="font-size:12px; color:var(--text-soft);">
                Next question: <b id="countdownSecs">1.5s</b>
              </span>
              <button class="pill subtle" id="pauseCountdownBtn" type="button" style="font-size:11.5px; padding:3px 10px;">
                ${ICON.pause} Pause
              </button>
            ` : ''}
            <button class="pill solid" id="bannerNextBtn" type="button" style="font-size:12px; padding:4px 12px;">
              Next Question ${ICON.arrowR}
            </button>
          </div>
        `;
        streakBanner.style.display = "flex";

        const bannerNextBtn = document.getElementById("bannerNextBtn");
        if (bannerNextBtn) {
          bannerNextBtn.addEventListener("click", () => {
            clearTimeout(autoNextTimeout);
            clearInterval(autoAdvanceCountdownInterval);
            advanceToNextMCQQuestion();
          });
        }

        const pauseBtn = document.getElementById("pauseCountdownBtn");
        if (pauseBtn) {
          pauseBtn.addEventListener("click", () => {
            clearTimeout(autoNextTimeout);
            clearInterval(autoAdvanceCountdownInterval);
            const note = document.getElementById("autoAdvanceNote");
            if (note) note.textContent = "Auto-advance paused";
            pauseBtn.remove();
          });
        }
      }

      if (mcqAutoAdvanceEnabled) {
        let timeLeft = 1.5;
        clearInterval(autoAdvanceCountdownInterval);
        autoAdvanceCountdownInterval = setInterval(() => {
          timeLeft -= 0.1;
          const cdEl = document.getElementById("countdownSecs");
          if (cdEl) cdEl.textContent = Math.max(0, timeLeft).toFixed(1) + "s";
          if (timeLeft <= 0) {
            clearInterval(autoAdvanceCountdownInterval);
          }
        }, 100);

        autoNextTimeout = setTimeout(() => {
          clearInterval(autoAdvanceCountdownInterval);
          advanceToNextMCQQuestion();
        }, 1500);
      }

    } else {
      // WRONG ANSWER HANDLING
      clearTimeout(autoNextTimeout);
      clearInterval(autoAdvanceCountdownInterval);
      wrongAnswers++;
      mcqStreak = 0;
      playMCQAudio('wrong');

      if (streakBanner) {
        streakBanner.innerHTML = `
          <div class="streak-banner-title" style="color:#f43f5e;">
            ${ICON.xCircle}
            <span>Incorrect! See correct answer and explanation below.</span>
          </div>
          <div class="streak-banner-controls">
            <span style="font-size:12px; color:var(--text-soft);">${ICON.flag} Saved to Mistake Bank</span>
          </div>
        `;
        streakBanner.style.display = "flex";
      }

      // Re-queue question 3-4 spots later in practice pool for spaced repetition
      const laterIdx = activeExamPool.findIndex((item, idx) => idx > currentMCQIndex && String(item.id) === String(q.id));
      if (laterIdx === -1 && !is20ExamMode && activeExamPool.length > 2) {
        const insertPos = Math.min(activeExamPool.length, currentMCQIndex + 4);
        activeExamPool.splice(insertPos, 0, autoShuffleOptions({ ...q, _isReattempt: true }));
      }

      // Automatically log to Mistake Bank
      const exists = mistakes.some(m => (m.q === q.question || String(m.id) === String(q.id)));
      if (!exists) {
        mistakes.unshift({
          id: q.id || ("mcq_" + Date.now()),
          q: q.question,
          subject: q.subject,
          yourAns: q.options[selectedIndex] || "",
          correctAns: q.options[q.correct] || "",
          explain: q.explanation || "No explanation provided.",
          date: new Date().toLocaleDateString()
        });
        saveMistakes();
        renderMistakes();
      }

      if (retryBtn) retryBtn.style.display = "inline-flex";
      if (nextBtn) nextBtn.innerHTML = (currentMCQIndex === activeExamPool.length - 1) ? "View Results" : `Next ${ICON.arrowR}`;
    }

    saveMCQProgress();
    updateMCQStats();

    // Update history badge in real time
    const historyBadge = document.getElementById("q-history-badge");
    if (historyBadge) {
      if (newTimesCorrect >= 2) {
        historyBadge.className = "q-history-badge mastered";
        historyBadge.innerHTML = `${ICON.trophy} Mastered (2/2) ⭐⭐`;
      } else if (newTimesCorrect === 1) {
        historyBadge.className = "q-history-badge has-correct";
        historyBadge.innerHTML = `⭐ 1/2 Right (1 more to master)`;
      } else {
        historyBadge.className = "q-history-badge";
        historyBadge.textContent = "Mastery: 0/2";
      }
    }

    // Explanation Box display
    if (explanationText && explanationBox) {
      if (isCorrect) {
        let expHtml = escapeHtml(q.explanation || "No explanation provided.");
        if (justMastered) {
          expHtml += `<div style="margin-top:10px; padding:10px 14px; background:rgba(16,185,129,0.15); border-radius:8px; border:1px solid #10b981; color:#10b981; font-weight:700; font-size:13px; line-height:1.5;">
            🏆 <strong>Mastered &amp; Graduated!</strong> You answered this question correctly twice.
          </div>`;
          showToast("Question Mastered! Answered correctly twice — saved to mastery.", false);
        } else if (newTimesCorrect === 1) {
          expHtml += `<div style="margin-top:8px; color:#10b981; font-weight:700; font-size:12.5px;">✓ Correct (1/2)! 1 more correct answer to master this question.</div>`;
        }
        explanationText.innerHTML = expHtml;
      } else {
        const yourText = escapeHtml(q.options[selectedIndex] || "");
        const correctText = escapeHtml(q.options[q.correct] || "");
        explanationText.innerHTML = `
          <div class="wrong-feedback-badge">${ICON.xCircle} Incorrect</div>
          <div style="margin-bottom:8px; font-size:13px; line-height:1.6;">
            <strong>Your Answer:</strong> <span style="color:#f43f5e; font-weight:600;">${yourText}</span> &nbsp;|&nbsp; 
            <strong>Correct Answer:</strong> <span style="color:#10b981; font-weight:600;">${correctText}</span>
          </div>
          <div><strong>Explanation &amp; Shortcut:</strong> ${escapeHtml(q.explanation || "No explanation provided.")}</div>
          <div class="mistake-saved-badge">${ICON.flag} Saved to Mistake Bank for review</div>
        `;
      }
      explanationBox.classList.add("show");
    }

    checkSessionCompletion();
  }

  function checkSessionCompletion() {
    const answeredCount = activeExamPool.filter(q => {
      const qKey = String(q.id !== undefined ? q.id : currentMCQIndex);
      return sessionAnswered[qKey] || userMCQProgress.answers[qKey];
    }).length;

    if (answeredCount >= activeExamPool.length && activeExamPool.length > 0) {
      setTimeout(() => {
        const added = autoAddFreshQuestions();
        if (added > 0) {
          updateMCQStats();
          renderMCQQuestion();
        }
      }, 1200);
    }
  }

  function openExamSubmitModal() {
    const modal = document.getElementById("examSubmitModal");
    if (!modal) {
      showMCQSummary();
      return;
    }
    const total = activeExamPool.length || EXAM_QUESTION_COUNT;
    const answered = Object.keys(sessionAnswered).length;
    const unanswered = Math.max(0, total - answered);
    const flagged = Object.values(flaggedQuestions).filter(Boolean).length;

    const elAns = document.getElementById("modalTallyAnswered");
    const elUnans = document.getElementById("modalTallyUnanswered");
    const elFlag = document.getElementById("modalTallyFlagged");

    if (elAns) elAns.textContent = answered;
    if (elUnans) elUnans.textContent = unanswered;
    if (elFlag) elFlag.textContent = flagged;

    modal.classList.add("open");
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function setup20QuestionExam() {
    clearTimeout(autoNextTimeout);
    is20ExamMode = true;
    const modeBanner = document.getElementById("mode-banner");
    const filterBar = document.getElementById("filter-bar");
    const examTimerEl = document.getElementById("exam-timer");
    const quizCard = document.getElementById("quiz-card");
    const summaryCard = document.getElementById("summary-card");
    const paletteContainer = document.getElementById("mcq-palette-container");
    const btnPractice = document.getElementById("btnModePractice");
    const btnExam20 = document.getElementById("start-exam-20-btn");

    if (modeBanner) modeBanner.classList.add("active");
    if (paletteContainer) paletteContainer.style.display = "block";
    if (filterBar) filterBar.style.display = "none";
    if (btnPractice) btnPractice.classList.remove("active");
    if (btnExam20) btnExam20.classList.add("active");
    flaggedQuestions = {};

    // Refresh active pool excluding mastered
    allQuestions = getActiveQuestionsPool();

    // Keep replenishing until the exam can always contain exactly 20 questions.
    while (allQuestions.length < EXAM_QUESTION_COUNT) {
      const added = autoAddFreshQuestions();
      if (!added) break;
    }

    if (allQuestions.length < EXAM_QUESTION_COUNT) {
      is20ExamMode = false;
      if (modeBanner) modeBanner.classList.remove("active");
      if (paletteContainer) paletteContainer.style.display = "none";
      if (filterBar) filterBar.style.display = "flex";
      if (btnPractice) btnPractice.classList.add("active");
      if (btnExam20) btnExam20.classList.remove("active");
      showToast(`At least ${EXAM_QUESTION_COUNT} questions are required to start an exam.`, true);
      return;
    }

    // Shuffle all questions and pick up to 20
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const raw20 = shuffled.slice(0, EXAM_QUESTION_COUNT);

    // Auto-shuffle options for each question
    activeExamPool = raw20.map(q => autoShuffleOptions(q));

    currentMCQIndex = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    sessionAnswered = {};
    updateMCQStats();

    // 15-minute countdown
    timeRemaining = 900;
    clearInterval(examTimerInterval);
    if (examTimerEl) examTimerEl.textContent = "15:00";
    examTimerInterval = setInterval(() => {
      timeRemaining--;
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      if (examTimerEl) {
        examTimerEl.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
      }
      if (timeRemaining <= 0) {
        clearInterval(examTimerInterval);
        showToast("Time is up! Review your exam results.");
        showMCQSummary();
      }
    }, 1000);

    if (quizCard) quizCard.style.display = "block";
    if (summaryCard) summaryCard.style.display = "none";
    renderMCQQuestion();
  }

  function showMCQSummary() {
    clearTimeout(autoNextTimeout);
    clearInterval(examTimerInterval);
    const quizCard = document.getElementById("quiz-card");
    const summaryCard = document.getElementById("summary-card");
    const paletteContainer = document.getElementById("mcq-palette-container");
    const modeBanner = document.getElementById("mode-banner");

    if (quizCard) quizCard.style.display = "none";
    if (summaryCard) summaryCard.style.display = "block";
    if (paletteContainer) paletteContainer.style.display = "none";
    if (modeBanner) modeBanner.classList.remove("active");

    let examCorrect = 0;
    let examWrong = 0;
    let examSkipped = 0;
    const newlyMasteredQuestions = [];

    // Evaluate each question in the active exam pool
    activeExamPool.forEach((q, idx) => {
      const qKey = String(q.id !== undefined ? q.id : idx);
      const userAns = sessionAnswered[qKey];

      if (!userMCQProgress.answers[qKey]) {
        userMCQProgress.answers[qKey] = { timesCorrect: 0, timesWrong: 0, lastAnswered: null };
      }

      if (userAns && userAns.selectedIndex !== undefined) {
        const isCorrect = (userAns.selectedIndex === q.correct);
        userAns.isCorrect = isCorrect;

        if (isCorrect) {
          examCorrect++;
          const currentTimes = userMCQProgress.answers[qKey].timesCorrect || 0;
          const newTimes = currentTimes + 1;
          userMCQProgress.answers[qKey].timesCorrect = newTimes;
          userMCQProgress.answers[qKey].lastAnswered = Date.now();
          userMCQProgress.answers[qKey].isCorrect = true;

          // 2-Times-Right Leitner Rule:
          // If candidate answers right twice (>= 2 times), auto-delete / graduate from exam pool for this user
          if (newTimes >= 2) {
            const strId = String(q.id !== undefined ? q.id : qKey);
            if (!userMCQProgress.masteredIds.map(String).includes(strId)) {
              userMCQProgress.masteredIds.push(q.id !== undefined ? q.id : qKey);
              newlyMasteredQuestions.push(q);
            }
          }
        } else {
          examWrong++;
          userMCQProgress.answers[qKey].timesWrong = (userMCQProgress.answers[qKey].timesWrong || 0) + 1;
          userMCQProgress.answers[qKey].timesCorrect = 0; // Reset consecutive mastery requirement
          userMCQProgress.answers[qKey].lastAnswered = Date.now();
          userMCQProgress.answers[qKey].isCorrect = false;

          // Automatically record into Mistake Bank for weak-area practice
          const exists = mistakes.some(m => (m.q === q.question || String(m.id) === String(q.id)));
          if (!exists) {
            mistakes.unshift({
              id: q.id || ("mcq_" + Date.now() + "_" + idx),
              q: q.question,
              subject: q.subject || "General",
              options: q.options,
              correct: q.correct,
              correctAns: q.options[q.correct] || "",
              yourAns: q.options[userAns.selectedIndex] || "",
              explain: q.explanation || "No explanation provided.",
              date: new Date().toLocaleDateString()
            });
          }
        }
      } else {
        examSkipped++;
      }
    });

    correctAnswers = examCorrect;
    wrongAnswers = examWrong;

    // Persist progress and mistakes
    saveMCQProgress();
    saveMistakes();
    renderMistakes();
    updateMCQStats();

    // Standard BCS Preliminary scoring: +1.0 for right, -0.5 for wrong
    const rawScore = (examCorrect * 1.0) - (examWrong * 0.5);
    const netMarks = Math.max(0, rawScore);
    const totalQuestions = activeExamPool.length;
    const attemptedCount = examCorrect + examWrong;
    const accuracy = attemptedCount > 0 ? Math.round((examCorrect / attemptedCount) * 100) : 0;
    const percentage = totalQuestions > 0 ? Math.round((netMarks / totalQuestions) * 100) : 0;
    const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

    let gradeBadge = "";
    let gradeColor = "";
    if (netMarks >= 16) {
      gradeBadge = "🌟 Outstanding! (Top Tier)";
      gradeColor = "#10b981";
    } else if (netMarks >= 12) {
      gradeBadge = "✓ Passed Preliminary Cutoff";
      gradeColor = "#3b82f6";
    } else if (netMarks >= 9) {
      gradeBadge = "⚠️ Marginal Score (Practice needed)";
      gradeColor = "#f59e0b";
    } else {
      gradeBadge = "❌ Below Qualifying Cutoff";
      gradeColor = "#f43f5e";
    }

    let reviewItemsHtml = "";
    activeExamPool.forEach((q, idx) => {
      const qKey = String(q.id !== undefined ? q.id : idx);
      const userAns = sessionAnswered[qKey];
      const selectedIdx = userAns ? userAns.selectedIndex : undefined;
      const isCorrect = (selectedIdx === q.correct);
      const isSkipped = (selectedIdx === undefined);
      const isFlagged = Boolean(flaggedQuestions[qKey]);
      const stat = userMCQProgress.answers[qKey] || { timesCorrect: 0 };
      const timesCorrect = stat.timesCorrect || 0;
      const isMastered = userMCQProgress.masteredIds.map(String).includes(String(q.id !== undefined ? q.id : qKey));

      let cardStatusClass = isSkipped ? "review-card-skipped" : (isCorrect ? "review-card-correct" : "review-card-wrong");
      let statusPillHtml = isSkipped
        ? `<span class="review-status-pill pill-skipped">— Skipped (0.0)</span>`
        : (isCorrect
          ? `<span class="review-status-pill pill-correct">✓ Correct (+1.0)</span>`
          : `<span class="review-status-pill pill-wrong">✕ Incorrect (-0.5)</span>`);

      let flagPillHtml = isFlagged
        ? `<span class="review-status-pill pill-flagged" style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); font-size:11px;">${ICON.flag} Flagged</span>`
        : "";

      let masteryPillHtml = "";
      if (isMastered) {
        masteryPillHtml = `<span class="q-history-badge mastered" style="font-size:11px;">🏆 Mastered (2/2) &bull; Auto-Removed</span>`;
      } else if (timesCorrect === 1) {
        masteryPillHtml = `<span class="q-history-badge has-correct" style="font-size:11px;">✓ 1/2 Right &bull; 1 more right to remove</span>`;
      } else {
        masteryPillHtml = `<span class="q-history-badge" style="font-size:11px;">Mastery: 0/2</span>`;
      }

      let optionsRowsHtml = "";
      q.options.forEach((opt, optIdx) => {
        let optRowClass = "review-opt-row";
        let optTag = "";

        if (optIdx === q.correct) {
          optRowClass += " opt-correct";
          optTag = `<span class="review-opt-tag">✓ Correct Answer</span>`;
        } else if (optIdx === selectedIdx && !isCorrect) {
          optRowClass += " opt-wrong";
          optTag = `<span class="review-opt-tag">✕ Your Choice</span>`;
        }

        optionsRowsHtml += `
          <div class="${optRowClass}">
            <span class="opt-prefix">${prefixList[optIdx] || (optIdx + 1)}</span>
            <span>${escapeHtml(opt)}</span>
            ${optTag}
          </div>
        `;
      });

      reviewItemsHtml += `
        <div class="review-card glass ${cardStatusClass}" data-review-status="${isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'wrong')}" data-flagged="${isFlagged ? 'true' : 'false'}">
          <div class="review-card-top">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="q-badge" style="font-size:11px;">${escapeHtml(q.subject || "General")}</span>
              <span style="font-weight:700; font-size:13.5px; color:var(--text-soft);">Question ${idx + 1}</span>
              ${masteryPillHtml}
              ${flagPillHtml}
            </div>
            <div>${statusPillHtml}</div>
          </div>
          <div class="review-q-title">${idx + 1}. ${escapeHtml(q.question)}</div>
          <div class="review-options-list">
            ${optionsRowsHtml}
          </div>
          <div class="review-explanation">
            <strong><i data-lucide="lightbulb" style="width:14px; height:14px; vertical-align:middle;"></i> Explanation &amp; Shortcut:</strong>
            <div style="margin-top:4px;">${escapeHtml(q.explanation || "No explanation provided.")}</div>
          </div>
        </div>
      `;
    });

    summaryCard.innerHTML = `
      <div class="exam-summary-wrapper">
        <div class="exam-summary-header">
          <div class="exam-result-badge" style="background:${gradeColor}18; color:${gradeColor}; border:1px solid ${gradeColor}50;">
            ${gradeBadge}
          </div>
          <h2 class="summary-title" style="margin-top:12px; margin-bottom:6px;">
            ${is20ExamMode ? "BCS 20-Question Model Test Completed!" : "MCQ Session Completed!"}
          </h2>
          <p style="color:var(--text-soft); font-size:13.5px; margin:0;">
            Standard BCS Preliminary Negative Marking Applied (+1.0 / -0.5)
          </p>
        </div>

        <div class="exam-score-hero glass">
          <div class="score-main-value">
            <span class="score-number" style="color:${gradeColor};">${netMarks.toFixed(2)}</span>
            <span class="score-total">/ ${totalQuestions}.00</span>
          </div>
          <div class="score-meta-text">
            Net Score &bull; Accuracy: <b>${accuracy}%</b> &bull; Score Rate: <b>${percentage}%</b>
          </div>
        </div>

        <div class="exam-stat-grid">
          <div class="exam-stat-box stat-correct">
            <div class="stat-num">${examCorrect}</div>
            <div class="stat-lbl">✓ Correct (+${(examCorrect * 1.0).toFixed(1)})</div>
          </div>
          <div class="exam-stat-box stat-wrong">
            <div class="stat-num">${examWrong}</div>
            <div class="stat-lbl">✕ Wrong (-${(examWrong * 0.5).toFixed(1)})</div>
          </div>
          <div class="exam-stat-box stat-skipped">
            <div class="stat-num">${examSkipped}</div>
            <div class="stat-lbl">— Skipped (0.0)</div>
          </div>
          <div class="exam-stat-box stat-mastered">
            <div class="stat-num">${userMCQProgress.masteredIds.length}</div>
            <div class="stat-lbl">🏆 Mastered Total</div>
          </div>
        </div>

        ${newlyMasteredQuestions.length > 0 ? `
          <div class="mastered-celebration-banner glass">
            <div style="font-size:24px;">🎉</div>
            <div>
              <div style="font-weight:700; color:#10b981; font-size:15px;">
                ${newlyMasteredQuestions.length} Question(s) Mastered &amp; Auto-Removed from Exam!
              </div>
              <div style="font-size:13px; color:var(--text-soft); margin-top:3px; line-height:1.5;">
                You answered these question(s) correctly twice. As requested, they are automatically removed from future exams for this user so you can focus on new and weak questions.
              </div>
            </div>
          </div>
        ` : `
          <div class="mastered-info-banner glass" style="padding:12px 18px; border-radius:12px; margin-bottom:22px; font-size:13px; color:var(--text-soft); display:flex; align-items:center; gap:12px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.2);">
            <div style="font-size:18px;">💡</div>
            <div><strong>Leitner Auto-Delete Rule:</strong> Any question answered correctly 2 times is automatically removed from future exam pools for your profile.</div>
          </div>
        `}

        <div class="summary-actions" style="margin: 20px 0 28px; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
          <button class="pill solid btn-exam20" id="summary-retake-20-btn" style="padding:10px 22px; font-weight:700;">
            ${ICON.zap} Retake 20 Questions
          </button>
          <button class="pill" id="summary-return-bank-btn" style="padding:10px 20px;">
            ${ICON.undo} Question Bank
          </button>
          ${examWrong > 0 ? `
            <button class="pill danger" id="summary-view-mistakes-btn" style="padding:10px 20px;">
              ${ICON.x} Review Mistake Bank (${examWrong})
            </button>
          ` : ''}
        </div>

        <div class="exam-review-section">
          <div class="exam-review-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border); padding-bottom:12px; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0; font-size:16.5px; font-weight:700; color:var(--text);">
                Detailed Question Review (${totalQuestions} Questions)
              </h3>
              <span style="font-size:12.5px; color:var(--text-soft);">Solutions, Keys &amp; Explanations</span>
            </div>
            <div class="review-filter-chips" style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="pill subtle review-filter-pill active" data-review-filter="all" style="font-size:11.5px; padding:4px 10px;">All (${totalQuestions})</button>
              <button class="pill subtle review-filter-pill" data-review-filter="correct" style="font-size:11.5px; padding:4px 10px; color:#10b981;">✓ Correct (${examCorrect})</button>
              <button class="pill subtle review-filter-pill" data-review-filter="wrong" style="font-size:11.5px; padding:4px 10px; color:#f43f5e;">✕ Wrong (${examWrong})</button>
              <button class="pill subtle review-filter-pill" data-review-filter="skipped" style="font-size:11.5px; padding:4px 10px;">— Skipped (${examSkipped})</button>
              ${flaggedCount > 0 ? `<button class="pill subtle review-filter-pill" data-review-filter="flagged" style="font-size:11.5px; padding:4px 10px; color:#f59e0b;">Flagged (${flaggedCount})</button>` : ''}
            </div>
          </div>

          <div class="exam-review-list">
            ${reviewItemsHtml}
          </div>
        </div>
      </div>
    `;

    const reviewFilterPills = summaryCard.querySelectorAll(".review-filter-pill");
    reviewFilterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        reviewFilterPills.forEach(p => p.classList.remove("active", "solid"));
        pill.classList.add("active", "solid");
        const filterVal = pill.getAttribute("data-review-filter");
        summaryCard.querySelectorAll(".review-card").forEach(card => {
          if (filterVal === "all") {
            card.style.display = "block";
          } else if (filterVal === "correct") {
            card.style.display = card.getAttribute("data-review-status") === "correct" ? "block" : "none";
          } else if (filterVal === "wrong") {
            card.style.display = card.getAttribute("data-review-status") === "wrong" ? "block" : "none";
          } else if (filterVal === "skipped") {
            card.style.display = card.getAttribute("data-review-status") === "skipped" ? "block" : "none";
          } else if (filterVal === "flagged") {
            card.style.display = card.getAttribute("data-flagged") === "true" ? "block" : "none";
          }
        });
      });
    });

    const retakeBtn = document.getElementById("summary-retake-20-btn");
    const returnBankBtn = document.getElementById("summary-return-bank-btn");
    const mistakesBtn = document.getElementById("summary-view-mistakes-btn");

    if (retakeBtn) retakeBtn.addEventListener("click", setup20QuestionExam);
    if (returnBankBtn) returnBankBtn.addEventListener("click", resetMCQQuiz);
    if (mistakesBtn) {
      mistakesBtn.addEventListener("click", () => {
        const mistakeChip = document.querySelector("#quizFlashSwitch [data-view='mistakes']");
        if (mistakeChip) {
          mistakeChip.click();
        }
      });
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function resetMCQQuiz() {
    clearTimeout(autoNextTimeout);
    clearInterval(examTimerInterval);
    is20ExamMode = false;
    const modeBanner = document.getElementById("mode-banner");
    const filterBar = document.getElementById("filter-bar");
    const quizCard = document.getElementById("quiz-card");
    const summaryCard = document.getElementById("summary-card");
    const paletteContainer = document.getElementById("mcq-palette-container");
    const btnPractice = document.getElementById("btnModePractice");
    const btnExam20 = document.getElementById("start-exam-20-btn");

    if (modeBanner) modeBanner.classList.remove("active");
    if (paletteContainer) paletteContainer.style.display = "none";
    if (btnPractice) btnPractice.classList.add("active");
    if (btnExam20) btnExam20.classList.remove("active");
    flaggedQuestions = {};

    currentSelectedSubject = "all";
    if (filterBar) {
      filterBar.style.display = "flex";
      renderMCQFilterBar();
    }

    allQuestions = getActiveQuestionsPool();
    activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
    currentMCQIndex = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    sessionAnswered = {};
    updateMCQStats();

    if (quizCard) quizCard.style.display = "block";
    if (summaryCard) summaryCard.style.display = "none";
    renderMCQQuestion();
  }

  const DEFAULT_MCQ_SUBJECTS = [
    "বাংলা সাহিত্য",
    "বাংলা ব্যাকরণ",
    "English",
    "গণিত",
    "বাংলাদেশ বিষয়াবলী",
    "আন্তর্জাতিক বিষয়াবলী",
    "সাধারণ বিজ্ঞান",
    "কম্পিউটার ও আইসিটি"
  ];

  let currentSelectedSubject = "all";

  function renderMCQFilterBar() {
    const filterBar = document.getElementById("filter-bar");
    if (!filterBar) return;

    if (!userMCQProgress.removedSubjects) {
      userMCQProgress.removedSubjects = [];
    }
    const removedSet = new Set(userMCQProgress.removedSubjects);

    // Collect all unique subjects from defaults and loaded questions
    const subjectSet = new Set(DEFAULT_MCQ_SUBJECTS);
    const stored = getStoredQuestions();
    [...defaultQuestions, ...aiCuratedPool, ...stored].forEach(q => {
      if (q && q.subject && q.subject !== "all" && q.subject !== "custom") {
        subjectSet.add(q.subject);
      }
    });

    // Visible subjects exclude removed ones
    const visibleSubjects = Array.from(subjectSet).filter(s => !removedSet.has(s));

    let html = `
      <button class="filter-pill ${currentSelectedSubject === 'all' ? 'active' : ''}" data-subject="all">
        All Subjects
      </button>
    `;

    visibleSubjects.forEach(s => {
      const isActive = currentSelectedSubject === s;
      html += `
        <button class="filter-pill ${isActive ? 'active' : ''}" data-subject="${escapeAttr(s)}">
          <span class="pill-label">${escapeHtml(s)}</span>
          <span class="pill-del-btn" data-del-subject="${escapeAttr(s)}" title="Remove ${escapeAttr(s)}">${ICON.x}</span>
        </button>
      `;
    });

    html += `
      <button class="filter-pill ${currentSelectedSubject === 'custom' ? 'active' : ''}" data-subject="custom">
        Custom Questions
      </button>
    `;

    if (userMCQProgress.removedSubjects.length > 0) {
      html += `
        <button class="restore-subjects-btn" id="restoreSubjectsBtn" title="Click to restore removed subjects">
          ${ICON.rotccw} Restore Subjects (${userMCQProgress.removedSubjects.length})
        </button>
      `;
    }

    filterBar.innerHTML = html;
  }

  function filterMCQPoolBySubject(selectedSubject) {
    if (selectedSubject === "all") {
      activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
    } else if (selectedSubject === "custom") {
      activeExamPool = allQuestions.filter(q => q.isCustom || q.isAutoAdded).map(q => autoShuffleOptions(q));
    } else {
      activeExamPool = allQuestions.filter(q => q.subject === selectedSubject).map(q => autoShuffleOptions(q));
    }
    currentMCQIndex = 0;
    const quizCard = document.getElementById("quiz-card");
    const summaryCard = document.getElementById("summary-card");
    if (quizCard) quizCard.style.display = "block";
    if (summaryCard) summaryCard.style.display = "none";
    renderMCQQuestion();
    updateMCQStats();
  }

  function renderMistakes() {
    const list = document.getElementById("mistakeBankList");
    if (!list) return;
    list.innerHTML = "";

    if (!mistakes.length) {
      list.innerHTML = '<div class="empty-state">No mistakes recorded yet. Practice quizzes to identify weak areas!</div>';
      return;
    }

    mistakes.forEach((m, idx) => {
      const card = document.createElement("div");
      card.className = "mistake-card glass";
      card.style.cssText = "padding:16px 18px; margin-bottom:12px; border-radius:12px; border:1px solid var(--border);";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:10px;">
          <h4 style="margin:0; font-size:15px; font-weight:700; color:var(--text); line-height:1.4;">${escapeHtml(m.q)}</h4>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            ${m.subject ? `<span class="q-badge" style="font-size:11px; padding:2px 8px;">${escapeHtml(m.subject)}</span>` : ""}
            <button class="pill danger" data-del-mistake="${idx}" style="padding:2px 8px; font-size:11px;">Remove</button>
          </div>
        </div>
        <div class="mistake-ans-row" style="display:flex; gap:12px; margin-bottom:8px; flex-wrap:wrap; font-size:13.5px;">
          <span class="mistake-wrong" style="color:#f43f5e; font-weight:600;">Your Answer: ${escapeHtml(m.yourAns || "None")}</span>
          <span class="mistake-correct" style="color:#10b981; font-weight:600;">Correct: ${escapeHtml(m.correctAns || "N/A")}</span>
        </div>
        <div style="font-size:13px; color:var(--text-soft); line-height:1.5; background:rgba(99,102,241,0.06); padding:8px 12px; border-radius:8px; border-left:3px solid var(--accent1);">
          <strong>Explanation:</strong> ${escapeHtml(m.explain || "No explanation recorded.")}
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll("[data-del-mistake]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const i = parseInt(e.target.getAttribute("data-del-mistake"), 10);
        if (window.confirm("Remove this question from your Mistake Bank?")) {
          mistakes.splice(i, 1);
          saveMistakes();
          renderMistakes();
          showToast("Mistake item removed");
        }
      });
    });
  }

  function initMCQEngine() {
    const startExam20Btn = document.getElementById("start-exam-20-btn");
    const retake20Btn = document.getElementById("retake-20-btn");
    const resetBtn = document.getElementById("reset-btn");
    const restartBtn = document.getElementById("restart-btn");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const retryBtn = document.getElementById("retry-btn");
    const filterBar = document.getElementById("filter-bar");
    const resetMasteredBtn = document.getElementById("resetMasteredBtn");
    const btnModePractice = document.getElementById("btnModePractice");
    const mcqSoundToggleBtn = document.getElementById("mcqSoundToggleBtn");
    const mcqAutoAdvanceToggle = document.getElementById("mcqAutoAdvanceToggle");
    const qFlagBtn = document.getElementById("qFlagBtn");
    const finishEarlyBtn = document.getElementById("finishEarlyBtn");
    const btnCancelSubmit = document.getElementById("btnCancelSubmitExam");
    const btnConfirmSubmit = document.getElementById("btnConfirmSubmitExam");

    const addModal = document.getElementById("add-modal");
    const openAddModalBtn = document.getElementById("open-add-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const closeModalCancelBtn = document.getElementById("closeModalCancelBtn");
    const addForm = document.getElementById("add-question-form");
    const modalTabSwitch = document.getElementById("mcqModalTabSwitch");
    const tabCreate = document.getElementById("modal-tab-create");
    const tabImport = document.getElementById("modal-tab-import");

    const btnImportJson = document.getElementById("btn-import-json");
    const btnExportMcqJson = document.getElementById("btn-export-mcq-json");
    const agentImportText = document.getElementById("agent-import-text");

    if (btnModePractice) {
      btnModePractice.addEventListener("click", () => {
        if (is20ExamMode) {
          if (window.confirm("Switch to Practice Mode? Current 20-question exam will be closed.")) {
            resetMCQQuiz();
          }
        } else {
          resetMCQQuiz();
        }
      });
    }

    if (mcqSoundToggleBtn) {
      mcqSoundToggleBtn.innerHTML = mcqSoundEnabled ? ICON.volume2 : ICON.volumeX;
      mcqSoundToggleBtn.title = mcqSoundEnabled ? "Sound Feedback: Enabled" : "Sound Feedback: Muted";
      mcqSoundToggleBtn.addEventListener("click", () => {
        mcqSoundEnabled = !mcqSoundEnabled;
        try { localStorage.setItem('jobprep_mcq_sound', mcqSoundEnabled ? '1' : '0'); } catch (e) { }
        mcqSoundToggleBtn.innerHTML = mcqSoundEnabled ? ICON.volume2 : ICON.volumeX;
        mcqSoundToggleBtn.title = mcqSoundEnabled ? "Sound Feedback: Enabled" : "Sound Feedback: Muted";
        showToast(mcqSoundEnabled ? "Audio feedback enabled" : "Audio feedback muted");
      });
    }

    if (mcqAutoAdvanceToggle) {
      mcqAutoAdvanceToggle.innerHTML = `${ICON.zap} Auto: <b>${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}</b>`;
      mcqAutoAdvanceToggle.addEventListener("click", () => {
        mcqAutoAdvanceEnabled = !mcqAutoAdvanceEnabled;
        try { localStorage.setItem('jobprep_mcq_autoadvance', mcqAutoAdvanceEnabled ? '1' : '0'); } catch (e) { }
        mcqAutoAdvanceToggle.innerHTML = `${ICON.zap} Auto: <b>${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}</b>`;
        const autoNextPill = document.getElementById("qAutoNextPill");
        if (autoNextPill) {
          autoNextPill.innerHTML = `${ICON.zap} Auto-Next: ${mcqAutoAdvanceEnabled ? 'ON' : 'OFF'}`;
        }
        showToast(mcqAutoAdvanceEnabled ? "Auto-advance enabled (1.5s countdown)" : "Auto-advance paused");
      });
    }

    if (qFlagBtn) {
      qFlagBtn.addEventListener("click", () => {
        toggleFlagCurrentQuestion();
      });
    }

    if (finishEarlyBtn) {
      finishEarlyBtn.addEventListener("click", () => {
        openExamSubmitModal();
      });
    }

    if (btnCancelSubmit) {
      btnCancelSubmit.addEventListener("click", () => {
        const modal = document.getElementById("examSubmitModal");
        if (modal) modal.classList.remove("open");
      });
    }

    if (btnConfirmSubmit) {
      btnConfirmSubmit.addEventListener("click", () => {
        const modal = document.getElementById("examSubmitModal");
        if (modal) modal.classList.remove("open");
        showMCQSummary();
      });
    }

    if (startExam20Btn) startExam20Btn.addEventListener("click", setup20QuestionExam);
    if (retake20Btn) retake20Btn.addEventListener("click", setup20QuestionExam);
    if (resetBtn) resetBtn.addEventListener("click", resetMCQQuiz);
    if (restartBtn) restartBtn.addEventListener("click", resetMCQQuiz);

    // Restore Mastered Questions handler
    if (resetMasteredBtn) {
      resetMasteredBtn.addEventListener("click", () => {
        if (window.confirm("Restore all mastered questions back to your active practice list?")) {
          userMCQProgress.masteredIds = [];
          saveMCQProgress();
          allQuestions = getActiveQuestionsPool();
          activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
          currentMCQIndex = 0;
          updateMCQStats();
          renderMCQQuestion();
          showToast("All mastered questions restored to practice pool!");
        }
      });
    }

    // Try Again on Wrong Answer
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        clearTimeout(autoNextTimeout);
        const q = activeExamPool[currentMCQIndex];
        if (!q) return;
        const qKey = String(q.id !== undefined ? q.id : currentMCQIndex);

        // Clear session answer so user can retry
        delete sessionAnswered[qKey];
        if (userMCQProgress.answers[qKey]) {
          delete userMCQProgress.answers[qKey].selectedIndex;
          delete userMCQProgress.answers[qKey].isCorrect;
          saveMCQProgress();
        }

        // Re-enable options
        const optionsContainer = document.getElementById("options-container");
        if (optionsContainer) {
          optionsContainer.querySelectorAll(".option-btn").forEach(btn => {
            btn.disabled = false;
            btn.classList.remove("selected-wrong", "selected-correct", "highlight-correct");
          });
        }

        const explanationBox = document.getElementById("explanation-box");
        if (explanationBox) explanationBox.classList.remove("show");
        retryBtn.style.display = "none";
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        advanceToNextMCQQuestion();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        clearTimeout(autoNextTimeout);
        if (currentMCQIndex > 0) {
          currentMCQIndex--;
          renderMCQQuestion();
        }
      });
    }

    // Filter handling & Subject Deletion with confirmation
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        clearTimeout(autoNextTimeout);

        // 1. Delete button clicked
        const delBtn = e.target.closest("[data-del-subject]");
        if (delBtn) {
          e.stopPropagation();
          e.preventDefault();
          const targetSubj = delBtn.getAttribute("data-del-subject");
          if (!targetSubj) return;

          if (window.confirm(`Are you sure you want to remove "${targetSubj}" from the subject list?\n\n(This subject's questions will be hidden from practice. You can restore it anytime.)`)) {
            if (!userMCQProgress.removedSubjects) userMCQProgress.removedSubjects = [];
            if (!userMCQProgress.removedSubjects.includes(targetSubj)) {
              userMCQProgress.removedSubjects.push(targetSubj);
            }
            saveMCQProgress();

            if (currentSelectedSubject === targetSubj) {
              currentSelectedSubject = "all";
            }

            allQuestions = getActiveQuestionsPool();
            filterMCQPoolBySubject(currentSelectedSubject);
            renderMCQFilterBar();
            showToast(`Subject "${targetSubj}" removed from list`);
          }
          return;
        }

        // 2. Restore subjects button clicked
        const restoreBtn = e.target.closest("#restoreSubjectsBtn");
        if (restoreBtn) {
          e.stopPropagation();
          e.preventDefault();
          const listStr = (userMCQProgress.removedSubjects || []).join(", ");
          if (window.confirm(`Restore all removed subjects (${listStr}) back to the subject list?`)) {
            userMCQProgress.removedSubjects = [];
            saveMCQProgress();
            allQuestions = getActiveQuestionsPool();
            filterMCQPoolBySubject(currentSelectedSubject);
            renderMCQFilterBar();
            showToast("All subjects restored successfully!");
          }
          return;
        }

        // 3. Normal subject selection
        const pill = e.target.closest(".filter-pill");
        if (!pill) return;

        const selectedSubject = pill.getAttribute("data-subject");
        if (!selectedSubject) return;

        currentSelectedSubject = selectedSubject;
        filterMCQPoolBySubject(selectedSubject);
        renderMCQFilterBar();
      });
    }

    // Modal Events
    if (openAddModalBtn && addModal) {
      openAddModalBtn.addEventListener("click", () => addModal.classList.add("open"));
    }
    if (closeModalBtn && addModal) {
      closeModalBtn.addEventListener("click", () => addModal.classList.remove("open"));
    }
    if (closeModalCancelBtn && addModal) {
      closeModalCancelBtn.addEventListener("click", () => addModal.classList.remove("open"));
    }

    if (addModal) {
      addModal.addEventListener("click", (e) => {
        if (e.target === addModal) addModal.classList.remove("open");
      });
    }

    // Modal Tab Switch (Add vs Import)
    if (modalTabSwitch) {
      modalTabSwitch.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        modalTabSwitch.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const tab = chip.getAttribute("data-tab");
        if (tabCreate) tabCreate.style.display = tab === "create" ? "block" : "none";
        if (tabImport) tabImport.style.display = tab === "import" ? "block" : "none";
      });
    }

    // JSON Importer
    if (btnImportJson && agentImportText) {
      btnImportJson.addEventListener("click", () => {
        const raw = agentImportText.value.trim();
        if (!raw) {
          showToast("Please paste a JSON array of questions", true);
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const stored = getStoredQuestions();
            let count = 0;
            parsed.forEach(item => {
              if (item.question && Array.isArray(item.options)) {
                const newQ = {
                  id: "imported_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                  subject: item.subject || "General Knowledge",
                  question: item.question,
                  options: item.options,
                  correct: typeof item.correct === "number" ? item.correct : 0,
                  explanation: item.explanation || "No explanation provided.",
                  isCustom: true
                };
                stored.push(newQ);
                allQuestions.push(newQ);
                count++;
              }
            });
            saveStoredQuestions(stored);
            showToast(`Successfully imported ${count} questions!`);
            if (addModal) addModal.classList.remove("open");
            agentImportText.value = "";
            if (!is20ExamMode) {
              activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
              renderMCQQuestion();
            }
          } else {
            showToast("Invalid format: expected JSON array [ ... ]", true);
          }
        } catch (err) {
          showToast("JSON Parse Error: " + err.message, true);
        }
      });
    }

    // JSON Exporter
    if (btnExportMcqJson) {
      btnExportMcqJson.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(allQuestions, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bcs-mcq-question-bank.json";
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        showToast("MCQ Question Bank exported as JSON!");
      });
    }

    // Custom Add Form
    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const subject = document.getElementById("new-subject").value;
        const question = document.getElementById("new-question").value.trim();
        const opt0 = document.getElementById("opt-0").value.trim();
        const opt1 = document.getElementById("opt-1").value.trim();
        const opt2 = document.getElementById("opt-2").value.trim();
        const opt3 = document.getElementById("opt-3").value.trim();
        const correct = parseInt(document.getElementById("new-correct").value, 10);
        const explanation = document.getElementById("new-explanation").value.trim() || "No explanation provided.";

        if (!question || !opt0 || !opt1 || !opt2 || !opt3) {
          showToast("Please fill in question and all 4 options", true);
          return;
        }

        const newQ = {
          id: "custom_" + Date.now(),
          subject: subject,
          isCustom: true,
          question: question,
          options: [opt0, opt1, opt2, opt3],
          correct: correct,
          explanation: explanation
        };

        const currentCustom = getStoredQuestions();
        currentCustom.push(newQ);
        saveStoredQuestions(currentCustom);

        if (userMCQProgress.removedSubjects && userMCQProgress.removedSubjects.includes(subject)) {
          userMCQProgress.removedSubjects = userMCQProgress.removedSubjects.filter(s => s !== subject);
          saveMCQProgress();
        }

        allQuestions = getActiveQuestionsPool();
        if (!is20ExamMode) {
          activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
          currentMCQIndex = activeExamPool.length - 1;
          renderMCQQuestion();
        }
        renderMCQFilterBar();

        addForm.reset();
        if (addModal) addModal.classList.remove("open");
        showToast("Custom MCQ question added successfully!");
      });
    }

    // Initial shuffle and load
    allQuestions = getActiveQuestionsPool();
    activeExamPool = allQuestions.map(q => autoShuffleOptions(q));
    renderMCQFilterBar();
    renderMCQQuestion();
    updateMCQStats();
  }

  const clearMistakesBtn = document.getElementById("clearMistakesBtn");
  if (clearMistakesBtn) {
    clearMistakesBtn.addEventListener("click", () => {
      if (window.confirm("Are you sure you want to clear all recorded mistakes?")) {
        mistakes = [];
        saveMistakes();
        renderMistakes();
        showToast("Mistake bank cleared successfully");
      }
    });
  }

  const quizFlashSwitch = document.getElementById("quizFlashSwitch");
  if (quizFlashSwitch) {
    quizFlashSwitch.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      quizFlashSwitch.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const view = chip.dataset.view;

      const subFlash = document.getElementById("subview-flashcards");
      const subQuiz = document.getElementById("subview-quiz");
      const subMistakes = document.getElementById("subview-mistakes");

      if (subFlash) subFlash.style.display = view === "flashcards" ? "block" : "none";
      if (subQuiz) subQuiz.style.display = view === "quiz" ? "block" : "none";
      if (subMistakes) subMistakes.style.display = view === "mistakes" ? "block" : "none";
    });
  }


  // ===== Quick Command Palette (Ctrl + K / Cmd + K) =====
  function initCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('paletteSearchInput');
    const results = document.getElementById('paletteResults');
    const btn = document.getElementById('commandPaletteBtn');
    const closeBtn = document.getElementById('closePaletteBtn');
    if (!modal || !input || !results) return;

    let selectedIndex = 0;
    let currentItems = [];

    const staticCommands = [
      { id: 'tab-routine', category: 'Navigation', icon: 'calendar-days', title: 'Go to Routine', subtitle: 'View daily study schedule', action: () => activateTab('routine', true) },
      { id: 'tab-notes', category: 'Navigation', icon: 'notebook-pen', title: 'Go to Smart Notes', subtitle: 'Study notes, formulas & tags', action: () => activateTab('notes', true) },
      { id: 'tab-tracker', category: 'Navigation', icon: 'timer', title: 'Go to Tracker & Focus', subtitle: 'Pomodoro timer & activity stats', action: () => activateTab('tracker', true) },
      { id: 'tab-quiz', category: 'Navigation', icon: 'brain', title: 'Go to Quiz & Cards', subtitle: 'Practice flashcards & MCQs', action: () => activateTab('flashcards', true) },
      { id: 'tab-countdown', category: 'Navigation', icon: 'calendar-clock', title: 'Go to Exam Targets', subtitle: 'Exam countdowns & milestones', action: () => activateTab('countdown', true) },
      { id: 'tab-syllabus', category: 'Navigation', icon: 'list-checks', title: 'Go to Syllabus', subtitle: 'BCS syllabus & topic progress', action: () => activateTab('syllabus', true) },
      { id: 'tab-settings', category: 'Navigation', icon: 'settings', title: 'Go to Settings', subtitle: 'Theme, backups & options', action: () => activateTab('settings', true) },
      {
        id: 'act-pomodoro', category: 'Actions', icon: 'zap', title: 'Start 25m Pomodoro Focus', subtitle: 'Start 25-min deep focus session',
        action: () => {
          activateTab('tracker', true);
          const dur25 = document.querySelector('.chip[data-duration="25"]');
          if (dur25) dur25.click();
          const sBtn = document.getElementById('startBtn');
          if (sBtn && sBtn.style.display !== 'none') sBtn.click();
        }
      },
      {
        id: 'act-stop-timer', category: 'Actions', icon: 'square', title: 'Stop Active Timer', subtitle: 'End current session or countdown',
        action: () => {
          const stopBtn = document.getElementById('stopBtn');
          if (stopBtn && stopBtn.style.display !== 'none') stopBtn.click();
          else if (window.isCustomCountdownActive && typeof stopCustomCountdown === 'function') stopCustomCountdown(false);
        }
      },
      {
        id: 'act-add-note', category: 'Actions', icon: 'plus', title: 'Add New Note', subtitle: 'Quickly open new note form',
        action: () => {
          activateTab('notes', true);
          const tBtn = document.getElementById('toggleNoteFormBtn');
          if (tBtn) tBtn.click();
          const nInput = document.getElementById('noteTitle');
          if (nInput) nInput.focus();
        }
      },
      {
        id: 'act-add-routine', category: 'Actions', icon: 'calendar-plus', title: 'Add Study Block', subtitle: 'Insert new study session into today',
        action: () => {
          activateTab('routine', true);
          const addBtn = document.getElementById('inlineAddRowBtn');
          if (addBtn) addBtn.click();
        }
      },
      {
        id: 'act-theme', category: 'Actions', icon: 'sun-moon', title: 'Toggle Dark / Light Theme', subtitle: 'Switch color theme',
        action: () => {
          setTheme(state.theme === 'dark' ? 'light' : 'dark');
        }
      },
      {
        id: 'act-fullscreen', category: 'Actions', icon: 'maximize', title: 'Toggle Fullscreen', subtitle: 'Distraction-free fullscreen view',
        action: () => {
          toggleFullscreen();
        }
      }
    ];

    function openPalette() {
      modal.style.display = 'flex';
      void modal.offsetWidth;
      modal.classList.add('open');
      input.value = '';
      selectedIndex = 0;
      renderItems('');
      setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
      modal.classList.remove('open');
      setTimeout(() => {
        if (!modal.classList.contains('open')) {
          modal.style.display = 'none';
        }
      }, 150);
      input.blur();
    }

    function renderItems(query) {
      const q = query.trim().toLowerCase();
      let matched = [];

      if (!q) {
        matched = [...staticCommands];
      } else {
        matched = staticCommands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q));

        if (Array.isArray(state.notes)) {
          state.notes.forEach(note => {
            const t = (note.title || '').toLowerCase();
            const b = (note.body || '').toLowerCase();
            const tag = (note.tag || '').toLowerCase();
            if (t.includes(q) || b.includes(q) || tag.includes(q)) {
              matched.push({
                id: 'note-' + note.id,
                category: 'Notes',
                icon: 'notebook-pen',
                title: note.title || 'Untitled Note',
                subtitle: (note.tag ? `[${note.tag}] ` : '') + (note.body || '').slice(0, 45) + '...',
                action: () => {
                  activateTab('notes', true);
                  setTimeout(() => {
                    const el = document.querySelector(`[data-note-id="${note.id}"]`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.style.outline = '2px solid var(--accent1)';
                      setTimeout(() => el.style.outline = '', 2000);
                    }
                  }, 100);
                }
              });
            }
          });
        }

        if (Array.isArray(state.syllabus)) {
          state.syllabus.forEach(cat => {
            if (Array.isArray(cat.topics)) {
              cat.topics.forEach(topic => {
                if (topic.name && topic.name.toLowerCase().includes(q)) {
                  matched.push({
                    id: 'topic-' + topic.id,
                    category: 'Syllabus: ' + cat.name,
                    icon: 'list-checks',
                    title: topic.name,
                    subtitle: topic.done ? '✓ Completed' : 'Pending',
                    action: () => {
                      activateTab('syllabus', true);
                      setTimeout(() => {
                        const el = document.querySelector(`[data-topic="${topic.id}"]`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  });
                }
              });
            }
          });
        }
      }

      currentItems = matched;
      if (selectedIndex >= currentItems.length) selectedIndex = 0;

      if (!currentItems.length) {
        results.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">No matching commands or notes found.</div>';
        return;
      }

      let html = '';
      let lastCat = '';
      currentItems.forEach((item, idx) => {
        if (item.category !== lastCat) {
          html += `<div class="palette-section-title">${escapeHtml(item.category)}</div>`;
          lastCat = item.category;
        }
        const isSel = idx === selectedIndex ? 'selected' : '';
        html += `
          <div class="palette-item ${isSel}" data-index="${idx}">
            <div class="palette-item-left">
              <span class="palette-item-icon"><i data-lucide="${item.icon}"></i></span>
              <div>
                <span class="palette-item-title">${escapeHtml(item.title)}</span>
                <span class="palette-item-subtitle">${escapeHtml(item.subtitle)}</span>
              </div>
            </div>
            ${item.id.startsWith('tab-') ? '<span class="palette-item-shortcut">Tab</span>' : ''}
          </div>
        `;
      });

      results.innerHTML = html;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      const selEl = results.querySelector('.palette-item.selected');
      if (selEl) selEl.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', (e) => {
      selectedIndex = 0;
      renderItems(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentItems.length) {
          selectedIndex = (selectedIndex + 1) % currentItems.length;
          renderItems(input.value);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentItems.length) {
          selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
          renderItems(input.value);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentItems[selectedIndex]) {
          const act = currentItems[selectedIndex].action;
          closePalette();
          if (act) act();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });

    results.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.palette-item');
      if (itemEl && itemEl.dataset.index) {
        const idx = parseInt(itemEl.dataset.index);
        if (currentItems[idx]) {
          const act = currentItems[idx].action;
          closePalette();
          if (act) act();
        }
      }
    });

    if (btn) btn.addEventListener('click', openPalette);
    if (closeBtn) closeBtn.addEventListener('click', closePalette);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePalette();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (modal.classList.contains('open')) closePalette();
        else openPalette();
      }
    });
  }

  // ===== Init =====
  (async function init() {
    await loadData();
    document.documentElement.setAttribute('data-theme', state.theme || 'dark');
    await initAutoSync();
    syncThemeButtons();
    initMonthDropdown();
    renderDateSlider();
    renderRoutine();
    renderQuote();
    renderQuoteManager();
    syncQuoteSettings();
    startQuoteRotation();
    renderNotes();
    renderTrackerAll();
    renderCategories();
    syncAllSubjectSelects();
    renderFlashcards();

    loadExams();
    renderExams();
    setInterval(renderExams, 1000);
    update24hActivityUI();
    loadMistakes();

    initMCQEngine();
    renderMistakes();
    initCommandPalette();
    renderStudyHeatmap();
    syncMiniTimerWidget();

    tickInterval = setInterval(() => { tickTimer(); }, 1000);

    if (window.lucide) {
      lucide.createIcons();
    }
  })();
})();
