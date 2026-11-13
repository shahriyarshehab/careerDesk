/**
 * test.js — CareerDesk Automated Local Test & Verification Suite
 * 
 * Zero-dependency test runner validating:
 * 1. JavaScript Syntax Integrity across the entire codebase
 * 2. Master CSS & JS Manifest file resolution
 * 3. BCS MCQ Question Bank JSON schema and encoding
 * 4. Index.html Semantic structure and Unified Subject DOM anchors
 * 5. Core state schema, storage adapter, and global utility logic
 * 6. UI Design System universal class definitions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const vm = require('vm');

const ROOT_DIR = __dirname;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

function suite(title, fn) {
  console.log(`\n📋 [SUITE] ${title}`);
  try {
    fn();
  } catch (err) {
    console.error(`  💥 Unexpected error in suite "${title}":`, err.message);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// Suite 1: JavaScript Syntax Integrity
// -----------------------------------------------------------------------------
suite('JavaScript Syntax Integrity (node --check)', () => {
  function getJsFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const fullPath = path.join(dir, name);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(getJsFiles(fullPath));
        } else if (stat.isFile() && name.endsWith('.js')) {
          results.push(fullPath);
        }
      } catch (e) {}
    }
    return results;
  }

  const jsFiles = getJsFiles(ROOT_DIR);
  assert(jsFiles.length > 0, `Discovered ${jsFiles.length} JavaScript files`);

  let allSyntaxValid = true;
  for (const file of jsFiles) {
    try {
      execSync(`node --check "${file}"`, { stdio: 'pipe' });
    } catch (err) {
      allSyntaxValid = false;
      const rel = path.relative(ROOT_DIR, file);
      assert(false, `Syntax check failed for ${rel}: ${err.message}`);
    }
  }
  if (allSyntaxValid) {
    assert(true, `All ${jsFiles.length} JavaScript files passed node --check syntax verification`);
  }
});

// -----------------------------------------------------------------------------
// Suite 2: Build Sources & Bundle Integrity
// -----------------------------------------------------------------------------
suite('Build Sources & Bundle Integrity', () => {
  const { CSS_FILES, JS_FILES } = require('./scripts/build.js');
  const cssBundlePath = path.join(ROOT_DIR, 'assets', 'dist', 'careerdesk.css');
  const jsBundlePath = path.join(ROOT_DIR, 'assets', 'dist', 'careerdesk.js');
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert(fs.existsSync(cssBundlePath), 'Generated CSS bundle exists');
  assert(fs.existsSync(jsBundlePath), 'Generated JavaScript bundle exists');
  assert(html.includes('assets/dist/careerdesk.css'), 'index.html loads the CSS bundle');
  assert(html.includes('assets/dist/careerdesk.js'), 'index.html loads the JavaScript bundle');

  const cssBundle = fs.readFileSync(cssBundlePath, 'utf8');
  const jsBundle = fs.readFileSync(jsBundlePath, 'utf8');
  let lastCssSourceOffset = -1;
  for (const sourcePath of CSS_FILES) {
    assert(fs.existsSync(path.join(ROOT_DIR, sourcePath)), `CSS source exists: ${sourcePath}`);
    const sourceOffset = cssBundle.indexOf(`Source: ${sourcePath}`);
    assert(sourceOffset > lastCssSourceOffset, `CSS bundle includes ${sourcePath} in cascade order`);
    lastCssSourceOffset = sourceOffset;
  }
  let lastJsSourceOffset = -1;
  for (const sourcePath of JS_FILES) {
    assert(fs.existsSync(path.join(ROOT_DIR, sourcePath)), `JavaScript source exists: ${sourcePath}`);
    const sourceOffset = jsBundle.indexOf(`Source: ${sourcePath}`);
    assert(sourceOffset > lastJsSourceOffset, `JavaScript bundle includes ${sourcePath} in dependency order`);
    lastJsSourceOffset = sourceOffset;
  }
});

// -----------------------------------------------------------------------------
// Suite 3: BCS MCQ Question Bank Validation
// -----------------------------------------------------------------------------
suite('BCS MCQ Question Bank Data Integrity', () => {
  const qBankPath = path.join(ROOT_DIR, 'assets', 'data', 'bcs-mcq-question-bank-1000.json');
  assert(fs.existsSync(qBankPath), 'Question bank JSON file exists');

  const rawJson = fs.readFileSync(qBankPath, 'utf8');
  let questions = [];
  try {
    questions = JSON.parse(rawJson);
    assert(Array.isArray(questions), `JSON parses into an array of length ${questions.length}`);
  } catch (err) {
    assert(false, `Question bank JSON is valid: ${err.message}`);
  }

  if (Array.isArray(questions) && questions.length > 0) {
    let schemaErrors = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (
        typeof q.id !== 'number' ||
        typeof q.subject !== 'string' || !q.subject.trim() ||
        typeof q.question !== 'string' || !q.question.trim() ||
        !Array.isArray(q.options) || q.options.length !== 4 ||
        typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3
      ) {
        schemaErrors++;
        if (schemaErrors <= 3) {
          console.error(`    Sample schema mismatch at index ${i}:`, q);
        }
      }
    }
    assert(schemaErrors === 0, `All ${questions.length} questions strictly adhere to MCQ schema`);
  }
});

// -----------------------------------------------------------------------------
// Suite 4: Semantic HTML & DOM Anchors
// -----------------------------------------------------------------------------
suite('HTML Semantic Layout & Core DOM Elements', () => {
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  assert(fs.existsSync(htmlPath), 'index.html exists');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Generated bundle links in index.html
  assert(html.includes('assets/dist/careerdesk.css'), 'index.html includes the CSS bundle');
  assert(html.includes('assets/dist/careerdesk.js'), 'index.html includes the JavaScript bundle');

  // Critical DOM anchors for Unified Subject Control System & Panels
  const requiredIds = [
    'appSubjectDatalist',
    'sessionSubject',
    'sessionCustomSubject',
    'subjectManagerList',
    'deletedSubjectList',
    'panel-home',
    'panel-routine',
    'panel-tracker',
    'panel-countdown',
    'panel-quiz',
    'panel-syllabus',
    'panel-settings'
  ];

  for (const id of requiredIds) {
    const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
    assert(hasId, `index.html contains critical element #${id}`);
  }
});

// -----------------------------------------------------------------------------
// Suite 5: Core State Schema & Global Utilities (Sandboxed VM)
// -----------------------------------------------------------------------------
suite('Core State & Utility Functions (assets/js/core.js)', () => {
  const coreJsPath = path.join(ROOT_DIR, 'assets', 'js', 'core.js');
  const coreJsCode = fs.readFileSync(coreJsPath, 'utf8');

  // Comprehensive browser/DOM mock environment
  const localStorageStore = {};
  const mockStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null),
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; },
    clear: () => { for (const k in localStorageStore) delete localStorageStore[k]; }
  };

  const mockDoc = {
    readyState: 'complete',
    documentElement: {
      setAttribute: () => {},
      getAttribute: () => null
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    createElement: () => ({
      appendChild: () => {},
      setAttribute: () => {},
      style: {},
      classList: { add: () => {}, remove: () => {} }
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  };

  const sandbox = {
    window: null,
    document: mockDoc,
    localStorage: mockStorage,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
    Date,
    Math,
    String,
    Number,
    Array,
    Object,
    Set,
    Map
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
  try {
    vm.runInContext(coreJsCode, context);
    assert(true, 'core.js executed successfully in sandboxed VM');
  } catch (err) {
    assert(false, `core.js evaluation failed: ${err.message}`);
  }

  // Verify getDefaultState()
  if (typeof sandbox.getDefaultState === 'function') {
    const defaultState = sandbox.getDefaultState();
    assert(Array.isArray(defaultState.routine), 'getDefaultState().routine is an Array');
    assert(Array.isArray(defaultState.sessions), 'getDefaultState().sessions is an Array');
    assert(Array.isArray(defaultState.syllabus), 'getDefaultState().syllabus is an Array');
    assert(Array.isArray(defaultState.flashcards), 'getDefaultState().flashcards is an Array');
    assert(Array.isArray(defaultState.customSubjects), 'getDefaultState().customSubjects is an Array');
    assert(Array.isArray(defaultState.deletedSubjects), 'getDefaultState().deletedSubjects is an Array');
    assert(typeof defaultState.dailyTargetMinutes === 'number' && defaultState.dailyTargetMinutes > 0, 'dailyTargetMinutes is a positive number');
    assert(defaultState.theme === 'dark' || defaultState.theme === 'light', 'theme defaults to valid dark/light token');
  } else {
    assert(false, 'getDefaultState is defined as a function');
  }

  // Verify escapeHtml
  if (typeof sandbox.escapeHtml === 'function') {
    const dangerous = '<script>alert("xss")&\'</script>';
    const escaped = sandbox.escapeHtml(dangerous);
    assert(!escaped.includes('<') && !escaped.includes('>') && escaped.includes('&lt;') && escaped.includes('&gt;'), 'escapeHtml sanitizes markup correctly');
  } else {
    assert(false, 'escapeHtml is defined as a function');
  }

  // Verify dateKey format (YYYY-MM-DD)
  if (typeof sandbox.dateKey === 'function') {
    const sampleDate = new Date('2026-11-07T12:00:00Z');
    const key = sandbox.dateKey(sampleDate.getTime());
    assert(/^\d{4}-\d{2}-\d{2}$/.test(key), `dateKey returns YYYY-MM-DD format (got: ${key})`);
  } else {
    assert(false, 'dateKey is defined as a function');
  }

  // Verify English Arabic Digits convention (AGENTS.md Rule #3)
  if (typeof sandbox.toBnDigits === 'function') {
    const val = sandbox.toBnDigits(12345);
    assert(val === '12345', `toBnDigits preserves standard English Arabic digits (expected "12345", got "${val}")`);
  } else {
    assert(false, 'toBnDigits is defined as a function');
  }

  // Verify canonicalSubjectName
  if (typeof sandbox.canonicalSubjectName === 'function') {
    const canonBangla = sandbox.canonicalSubjectName('বাংলা');
    assert(canonBangla === 'Bangla', `canonicalSubjectName maps Bengali alias 'বাংলা' to 'Bangla'`);
    const canonEnglish = sandbox.canonicalSubjectName('english');
    assert(canonEnglish === 'English', `canonicalSubjectName normalizes 'english' to 'English'`);
  } else {
    assert(false, 'canonicalSubjectName is defined as a function');
  }
});

// -----------------------------------------------------------------------------
// Suite 6: UI Design System Universal Classes
// -----------------------------------------------------------------------------
suite('UI Design System Universal Classes', () => {
  const componentsCssPath = path.join(ROOT_DIR, 'assets', 'css', 'components.css');
  assert(fs.existsSync(componentsCssPath), 'assets/css/components.css exists');

  const css = fs.readFileSync(componentsCssPath, 'utf8');
  const requiredClasses = [
    '.btn-group',
    '.action-group',
    '.action-group-btn',
    '.segmented-group',
    '.micro-btn'
  ];

  for (const cls of requiredClasses) {
    assert(css.includes(cls), `components.css defines ${cls}`);
  }
});

// -----------------------------------------------------------------------------
// Results Summary
// -----------------------------------------------------------------------------
console.log('\n==================================================');
console.log(`  Tests Passed: ${passedTests}`);
console.log(`  Tests Failed: ${failedTests}`);
console.log('==================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✨ All CareerDesk automated validation checks passed successfully!\n');
  process.exit(0);
}
