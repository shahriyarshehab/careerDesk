/* ==========================================================================
   CareerDesk — MCQ Question Bank Pools (Default, Curated & Extended)
   ========================================================================== */

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
