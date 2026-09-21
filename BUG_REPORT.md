# CareerDesk Code Review: Bug Report & Fixes
**Date:** September 21, 2026  
**Reviewer:** Professional Web Design Audit  
**Status:** 7 Issues Found | 1 Critical | 2 High | 4 Medium

---

## 🔴 CRITICAL ISSUES

### 1. **Security: HTML Injection in Note Editor** 
**Severity:** 🔴 CRITICAL | **File:** `assets/js/notes.js:145`  
**Issue:** XSS vulnerability - using conditional escaping in HTML attribute context

```javascript
// ❌ VULNERABLE (Line 145)
value="${typeof escapeAttr === 'function' ? escapeAttr(n.title || '') : escapeHtml(n.title || '')}"

// ✅ CORRECT FIX
value="${escapeAttr(n.title || '')}"
```

**Impact:** Malicious users could inject HTML/JavaScript through note titles  
**Fix:** Use `escapeAttr()` for HTML attributes (it's already loaded globally)

---

## 🟠 HIGH PRIORITY ISSUES

### 2. **Memory Leak: Uncleaned Countdown Intervals**
**Severity:** 🟠 HIGH | **File:** `assets/js/home.js:356`  
**Issue:** `setInterval()` called without clearing previous intervals

```javascript
// ❌ CURRENT (Line 355-356)
update();
profileCountdownInterval = setInterval(update, 1000);

// ✅ CORRECT FIX
update();
if (profileCountdownInterval) clearInterval(profileCountdownInterval);
profileCountdownInterval = setInterval(update, 1000);
```

**Impact:** Every profile view creates new interval, accumulating memory waste  
**Symptom:** App sluggish after repeated tab switches

---

### 3. **Icon Rendering Bug: Hardcoded HTML String**
**Severity:** 🟠 HIGH | **File:** `assets/js/countdown.js:228`  
**Issue:** Using raw HTML string instead of ICON object

```javascript
// ❌ INCONSISTENT (Line 228)
toggleExamBtn.innerHTML = '<span class="btn-icon">+</span> New Exam Target';

// ✅ CORRECT FIX
toggleExamBtn.innerHTML = `${ICON.plus} <span>New Exam Target</span>`;
```

**Impact:** Icon won't match design system; breaks accessibility  
**Why:** ICON object uses proper SVG with stroke-width attributes

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. **State Guard Missing: Unsafe DOM Access Before State Init**
**Severity:** 🟡 MEDIUM | **File:** `assets/js/tracker.js:6-12`  
**Issue:** DOM elements referenced before state object guaranteed to exist

**Impact:** If tracker.js loads before core.js, referencing state causes undefined errors  
**Fix:** Added guard check at top of tracker.js ✅

---

### 5. **Accessibility: Broken Icon HTML in Toggle Buttons**
**Severity:** 🟡 MEDIUM | **File:** `assets/js/notes.js:168`  
**Issue:** Icon HTML concatenated without proper span wrapper for text

```javascript
// ❌ CURRENT (Line 168)
toggleNoteBtn.innerHTML = isOpen ? `${ICON.plus} New Note` : `${ICON.x} Close Form`;

// ✅ CORRECT FIX
toggleNoteBtn.innerHTML = isOpen ? `${ICON.plus} <span>New Note</span>` : `${ICON.x} <span>Close Form</span>`;
```

**Impact:** Mobile CSS hides text but icon visible; screen readers fail  
**Why:** Mobile CSS: `.pill span { display: none !important; }`

---

### 6. **Performance: Redundant DOM Queries**
**Severity:** 🟡 MEDIUM | **File:** `assets/js/core.js:868`  
**Issue:** `renderSubjectSelect()` queries datalist without clearing

```javascript
// ❌ CURRENT
if (datalist) {
   const optionsMap = new Map();
   subs.forEach(s => { // Previous options still in DOM

// ✅ FIX
if (datalist) {
   datalist.innerHTML = ''; // Clear before rebuild
   const optionsMap = new Map();
```

**Impact:** Duplicate subject options after rename; bloated DOM  
**Symptom:** Datalist shows 20+ duplicate entries

---

### 7. **Responsive Design: Hardcoded Mobile Layout**
**Severity:** 🟡 MEDIUM | **File:** `assets/css/home.css:1134`  
**Issue:** Fixed 170px width breaks on phones < 320px

```css
/* ❌ CURRENT */
.home-timeline-task {
  max-width: 170px;
}

/* ✅ FIX */
.home-timeline-task {
  max-width: calc(100% - 12px);
  min-width: 120px;
}
```

**Impact:** iPhone SE (375px) displays truncated subject names  
**Symptom:** "General Kno..." instead of "General Knowledge"

---

## 📋 SUMMARY TABLE

| # | Issue | File | Severity | Type |
|---|-------|------|----------|------|
| 1 | XSS injection | notes.js:145 | 🔴 Critical | Security |
| 2 | Memory leak | home.js:356 | 🟠 High | Performance |
| 3 | Hardcoded icons | countdown.js:228 | 🟠 High | UI/Design |
| 4 | Missing guard | tracker.js:6 | 🟡 Medium | Stability |
| 5 | Bad accessibility | notes.js:168 | 🟡 Medium | A11y |
| 6 | Stale DOM options | core.js:868 | 🟡 Medium | Performance |
| 7 | Fixed mobile width | home.css:1134 | 🟡 Medium | Responsive |

