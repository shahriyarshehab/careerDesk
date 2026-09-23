/* ==========================================================================
   CareerDesk — Master JavaScript Engine (Project Manifest & Loader)
   
   Centrally manages and links all modular application subsystems in strict
   dependency order. Only this master file needs to be linked in index.html.
   ========================================================================== */

(function () {
  'use strict';

  // Master module manifest in exact execution sequence
  const MODULES = [
    'assets/js/lucide.min.js',
    'assets/js/core/core.js',
    'assets/js/features/routine.js',
    'assets/js/features/quotes.js',
    'assets/js/features/notes.js',
    'assets/js/features/tracker.js',
    'assets/js/features/countdown.js',
    'assets/js/features/syllabus.js',
    'assets/js/features/flashcards.js',
    'assets/js/features/questions.js',
    'assets/js/features/mcq.js',
    'assets/js/integrations/security.js',
    'assets/js/integrations/firebase-config.js',
    'assets/js/integrations/firebase-sync.js',
    'assets/js/features/profile.js',
    'assets/js/features/home.js',
    'assets/js/features/groupchat.js',
    'assets/js/app/app.js'
  ];

  // Write script tags into document stream to ensure 100% synchronous order
  // Works seamlessly on local filesystem (file:///), localhost, and production hosting
  MODULES.forEach(function (src) {
    document.write('<script src="' + src + '"><\/script>');
  });
})();
