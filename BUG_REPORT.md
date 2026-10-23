# CareerDesk Code Review: Bug Report & Fixes
**Date:** September 21, 2026  
**Reviewer:** Professional Web Design Audit  
**Status:** 5 Issues Found | 0 Critical | 2 High | 3 Medium

---

## 🔴 CRITICAL ISSUES

## 🟠 HIGH PRIORITY ISSUES

### 1. **Memory Leak: Uncleaned Countdown Intervals**
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

### 2. **Icon Rendering Bug: Hardcoded HTML String**
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

### 3. **State Guard Missing: Unsafe DOM Access Before State Init**
**Severity:** 🟡 MEDIUM | **File:** `assets/js/tracker.js:6-12`  
**Issue:** DOM elements referenced before state object guaranteed to exist

**Impact:** If tracker.js loads before core.js, referencing state causes undefined errors  
**Fix:** Added guard check at top of tracker.js ✅

---

### 4. **Performance: Redundant DOM Queries**
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

### 5. **Responsive Design: Hardcoded Mobile Layout**
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
| 1 | Memory leak | home.js:356 | 🟠 High | Performance |
| 2 | Hardcoded icons | countdown.js:228 | 🟠 High | UI/Design |
| 3 | Missing guard | tracker.js:6 | 🟡 Medium | Stability |
| 4 | Stale DOM options | core.js:868 | 🟡 Medium | Performance |
| 5 | Fixed mobile width | home.css:1134 | 🟡 Medium | Responsive |

