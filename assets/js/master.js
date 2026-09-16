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
    'assets/js/core.js',
    'assets/js/routine.js',
    'assets/js/quotes.js',
    'assets/js/notes.js',
    'assets/js/tracker.js',
    'assets/js/countdown.js',
    'assets/js/syllabus.js',
    'assets/js/flashcards.js',
    'assets/js/questions.js',
    'assets/js/mcq.js',
    'assets/js/security.js',
    'assets/js/firebase-config.js',
    'assets/js/firebase-sync.js',
    'assets/js/profile.js',
    'assets/js/home.js',
    'assets/js/app.js'
  ];

  // Write script tags into document stream to ensure 100% synchronous order
  // Works seamlessly on local filesystem (file:///), localhost, and production hosting
  MODULES.forEach(function (src) {
    document.write('<script src="' + src + '"><\/script>');
  });
})();
