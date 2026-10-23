# Graph Report - careerDesk  (2026-10-23)

## Corpus Check
- 18 files · ~87,553 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 546 nodes · 1245 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Cloud Auth & Firestore Sync
- Core State & Master Subjects
- Peer Group Chat
- Focus Timer & 24h Heatmap
- MCQ Quiz & Exam Engine
- Motivational Quotes & Wallpaper
- Profile & Academic Curriculum
- Routine & Calendar Schedule
- WebCrypto AES-GCM & PIN Security
- App Shell & Router
- Exam Countdown Engine
- Syllabus Checklist Tracker
- Dashboard & Hero Hub
- BCS Question Bank Repository

## God Nodes (most connected - your core abstractions)
1. `renderUserProfileUI()` - 27 edges
2. `initMCQEngine()` - 24 edges
3. `getCachedAuthUser()` - 21 edges
4. `groupChatDb()` - 20 edges
5. `signInWithEmailPassword()` - 19 edges
6. `renderMembersPanel()` - 17 edges
7. `initFirebaseApp()` - 16 edges
8. `groupChatAuthUser()` - 15 edges
9. `selectGroup()` - 15 edges
10. `renderMCQQuestion()` - 15 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "Cloud Auth & Firestore Sync"
Cohesion: 0.06
Nodes (98): applyCustomProfileOverrides(), applyRemoteChange(), bindInlinePasswordToggle(), bindInlineRecaptchaFallback(), buildCloudDataBundle(), checkCloudInitialSync(), cleanupRealtimeSync(), closeAuthModal() (+90 more)

### Community 1 - "Core State & Master Subjects"
Cohesion: 0.07
Nodes (52): addSubject(), BANGLADESH_CURRICULUM_DATA, canonicalSubjectName(), connectAutoSyncFile(), currentViewMonth, currentViewYear, dateKey() (+44 more)

### Community 2 - "Peer Group Chat"
Cohesion: 0.12
Nodes (53): clearGroupChatInvite(), closeGroupChatCreateModal(), createGroup(), deleteGroup(), destroyGroupChatListeners(), destroyMessageListener(), GROUP_CHAT_EMOJI_GROUPS, groupChatAuthUser() (+45 more)

### Community 3 - "Focus Timer & 24h Heatmap"
Cohesion: 0.07
Nodes (47): addBreakEntry(), addTodayBreakMinutes(), breakReasonRow, breakReasonSelect, buildReviewBuckets(), cancelModal, closeCancelModalBtn, confirmCancelBtn (+39 more)

### Community 4 - "MCQ Quiz & Exam Engine"
Cohesion: 0.13
Nodes (48): advancePracticeQuestion(), BCS_SUBJECT_META, buildPracticePool(), clearAllMistakes(), closeExamSubmitModal(), closeManageQuestionsModal(), examAnswers, examFlagged (+40 more)

### Community 5 - "Motivational Quotes & Wallpaper"
Cohesion: 0.09
Nodes (41): addQuoteBtn, BILINGUAL_QUOTES, cancelEditModalBtn, closeEditModalBtn, closeEditQuoteModal(), currentPool(), deleteQuoteEntry(), editModalEl (+33 more)

### Community 6 - "Profile & Academic Curriculum"
Cohesion: 0.08
Nodes (29): attachTrackCardListeners(), btnCreateSnapshotNow, btnDeleteCloudData, btnSyncFirestoreNow, cancelDeleteCloudModalBtn, closeDeleteCloudModalBtn, closeSubjectManagerModalBtn, confirmDeleteCloudBtn (+21 more)

### Community 7 - "Routine & Calendar Schedule"
Cohesion: 0.12
Nodes (31): bnDateLabel(), buildDateSliderList(), dateSliderBox, dbdRoutineBtn, formatTime12(), goToTodayRoutine(), initMonthDropdown(), monthDropdownSel (+23 more)

### Community 8 - "WebCrypto AES-GCM & PIN Security"
Cohesion: 0.16
Nodes (29): base64ToBuffer(), bufferToBase64(), closeSetPinModal(), closeVaultPassphraseModal(), computeSha256(), decryptVaultPayload(), deriveKeyFromPassphrase(), encryptVaultPayload() (+21 more)

### Community 9 - "App Shell & Router"
Cohesion: 0.10
Nodes (23): activateTab(), darkBtn, fullscreenToggleSettings, getJournalData(), initCommandPalette(), openPalette(), renderItems(), initDailyJournal() (+15 more)

### Community 11 - "Exam Countdown Engine"
Cohesion: 0.24
Nodes (8): addExamBtn, exams, examWrap, initEditExamListeners(), parseExamTargetMs(), renderExams(), saveExams(), toggleExamBtn

### Community 12 - "Syllabus Checklist Tracker"
Cohesion: 0.31
Nodes (8): addCategoryBtn, categoryList, openCategoryIds, renderCategories(), renderSyllabusOverall(), saveSyllabusAndRefresh(), syllabusTotals(), topicDeleteModeCategories

### Community 13 - "Dashboard & Hero Hub"
Cohesion: 0.43
Nodes (4): bindProfileAspirantHubEvents(), renderProfileAspirantHub(), startHomeExamCountdown(), startProfileExamCountdown()

## Knowledge Gaps
- **121 isolated node(s):** `darkBtn`, `lightBtn`, `fullscreenToggleSettings`, `watchThemeToggle`, `watchFullscreenToggle` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 165 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `connectAutoSyncFile()` connect `Core State & Master Subjects` to `Profile & Academic Curriculum`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `initMCQEngine()` (e.g. with `mcq.js` and `clearAllMistakes()`) actually correct?**
  _`initMCQEngine()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `darkBtn`, `lightBtn`, `fullscreenToggleSettings` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Cloud Auth & Firestore Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.05768194070080863 - nodes in this community are weakly interconnected._
- **Should `Core State & Master Subjects` be split into smaller, more focused modules?**
  _Cohesion score 0.0715846994535519 - nodes in this community are weakly interconnected._
- **Should `Peer Group Chat` be split into smaller, more focused modules?**
  _Cohesion score 0.11818181818181818 - nodes in this community are weakly interconnected._
- **Should `Focus Timer & 24h Heatmap` be split into smaller, more focused modules?**
  _Cohesion score 0.06823529411764706 - nodes in this community are weakly interconnected._