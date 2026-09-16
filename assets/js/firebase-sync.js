/* ==========================================================================
   CareerDesk — Firebase Authentication & Cloud Sync Engine
   Supports Google & GitHub Sign-In, Profile Picture & Name Editing,
   Firestore Online Backup & Local-to-Cloud Migration
   ========================================================================== */

const FIREBASE_CONFIG_KEY = 'careerdesk_firebase_config';
const FIREBASE_USER_CACHE_KEY = 'careerdesk_auth_user_cache';
const FIREBASE_LAST_SYNC_KEY = 'careerdesk_last_cloud_sync';
const FIREBASE_AUTO_SYNC_KEY = 'careerdesk_auto_cloud_sync';
const CAREERDESK_CUSTOM_PROFILE_KEY = 'careerdesk_custom_profile_v1';

let firebaseApp = null;
let currentAuthUser = null;
let isCloudSyncing = false;
let isExplicitlySignedOut = false;

// Default / fallback Firebase config template
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/**
 * Gets custom local overrides for profile name and picture
 */
function getCustomProfile() {
  try {
    const raw = localStorage.getItem(CAREERDESK_CUSTOM_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return null;
}

/**
 * Saves custom profile overrides
 */
function saveCustomProfile(profile) {
  try {
    localStorage.setItem(CAREERDESK_CUSTOM_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { }
}

/**
 * Applies custom profile name or photo over current user
 */
function applyCustomProfileOverrides(user) {
  if (!user) return user;
  const custom = getCustomProfile();
  if (custom) {
    if (custom.displayName) user.displayName = custom.displayName;
    if (typeof custom.photoURL === 'string') user.photoURL = custom.photoURL;
  }
  return user;
}

/**
 * Retrieves the stored Firebase configuration from window.FIREBASE_CONFIG or localStorage
 */
function getStoredFirebaseConfig() {
  if (typeof window !== 'undefined' && window.FIREBASE_CONFIG && typeof window.FIREBASE_CONFIG === 'object') {
    if (window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.projectId) {
      return window.FIREBASE_CONFIG;
    }
  }
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) { }
  return null;
}

/**
 * Initializes the Firebase SDK if available in the browser window
 */
function initFirebaseApp() {
  if (typeof firebase === 'undefined') {
    console.warn('[CareerDesk Firebase] Firebase SDK scripts not loaded yet.');
    return false;
  }

  if (firebase.apps && firebase.apps.length > 0) {
    firebaseApp = firebase.apps[0];
    setupAuthStateListener();
    return true;
  }

  const config = getStoredFirebaseConfig();
  if (config && config.apiKey) {
    try {
      firebaseApp = firebase.initializeApp(config);
      setupAuthStateListener();
      console.log('[CareerDesk Firebase] Initialized with custom project:', config.projectId);
      return true;
    } catch (err) {
      console.error('[CareerDesk Firebase] Init error:', err);
      return false;
    }
  }
  return false;
}

/**
 * Sets up Firebase Auth state change listener
 */
function setupAuthStateListener() {
  if (typeof firebase === 'undefined' || !firebase.auth) return;
  try {
    firebase.auth().onAuthStateChanged((user) => {
      if (user && !isExplicitlySignedOut) {
        currentAuthUser = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Aspirant',
          email: user.email || '',
          photoURL: user.photoURL || '',
          providerId: user.providerData?.[0]?.providerId || 'firebase'
        };
        applyCustomProfileOverrides(currentAuthUser);
        try {
          localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
        } catch (e) { }
      } else {
        if (isExplicitlySignedOut) {
          currentAuthUser = null;
          try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
        }
      }
      renderUserProfileUI();
    });
  } catch (err) {
    console.warn('[CareerDesk Firebase] Auth state listener error:', err);
  }
}

/**
 * Gets currently active user from memory or cache
 */
function getCachedAuthUser() {
  if (currentAuthUser) return applyCustomProfileOverrides(currentAuthUser);
  try {
    const raw = localStorage.getItem(FIREBASE_USER_CACHE_KEY);
    if (raw) {
      currentAuthUser = JSON.parse(raw);
      return applyCustomProfileOverrides(currentAuthUser);
    }
  } catch (e) { }
  return null;
}

/**
 * Sign In with Google
 */
async function signInWithGoogle() {
  isExplicitlySignedOut = false;
  if (window.location.protocol === 'file:') {
    openProtocolHelpModal('Google');
    return;
  }
  const isInitialized = initFirebaseApp();
  if (isInitialized && typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      currentAuthUser = {
        uid: user.uid,
        displayName: user.displayName || 'Aspirant',
        email: user.email || '',
        photoURL: user.photoURL || '',
        providerId: 'google.com'
      };
      applyCustomProfileOverrides(currentAuthUser);
      localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
      showToast('Signed in with Google as ' + currentAuthUser.displayName);
      renderUserProfileUI();
      setTimeout(() => checkCloudInitialSync(), 600);
      return;
    } catch (err) {
      handleAuthError(err, 'Google');
    }
  } else {
    openFirebaseConfigModal(true, 'Google');
  }
}

/**
 * Sign In with GitHub
 */
async function signInWithGithub() {
  isExplicitlySignedOut = false;
  if (window.location.protocol === 'file:') {
    openProtocolHelpModal('GitHub');
    return;
  }
  const isInitialized = initFirebaseApp();
  if (isInitialized && typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const provider = new firebase.auth.GithubAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      currentAuthUser = {
        uid: user.uid,
        displayName: user.displayName || user.reloadUserInfo?.screenName || 'GitHub Aspirant',
        email: user.email || '',
        photoURL: user.photoURL || '',
        providerId: 'github.com'
      };
      applyCustomProfileOverrides(currentAuthUser);
      localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
      showToast('Signed in with GitHub as ' + currentAuthUser.displayName);
      renderUserProfileUI();
      setTimeout(() => checkCloudInitialSync(), 600);
      return;
    } catch (err) {
      handleAuthError(err, 'GitHub');
    }
  } else {
    openFirebaseConfigModal(true, 'GitHub');
  }
}

/**
 * Sign In as Demo User (Allows immediate cloud sync preview without API keys)
 */
function signInDemoUser(providerName = 'Google') {
  isExplicitlySignedOut = false;
  currentAuthUser = {
    uid: 'demo_aspirant_' + Date.now().toString(36),
    displayName: providerName === 'GitHub' ? 'Dev Aspirant' : 'CareerDesk Aspirant',
    email: providerName === 'GitHub' ? 'aspirant@github.com' : 'aspirant@gmail.com',
    photoURL: '',
    providerId: providerName === 'GitHub' ? 'github.com' : 'google.com',
    isDemo: true
  };
  applyCustomProfileOverrides(currentAuthUser);
  try {
    localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
  } catch (e) { }
  closeFirebaseConfigModal();
  showToast('Signed in via ' + providerName + ' (Cloud Sync Enabled)');
  renderUserProfileUI();
  setTimeout(() => checkCloudInitialSync(), 500);
}

/**
 * Sign Out User
 */
async function signOutUser() {
  isExplicitlySignedOut = true;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && typeof firebase.auth === 'function') {
      await firebase.auth().signOut();
    }
  } catch (err) {
    console.warn('[CareerDesk Firebase] Signout warning:', err);
  }

  currentAuthUser = null;
  try {
    localStorage.removeItem(FIREBASE_USER_CACHE_KEY);
    localStorage.removeItem(CAREERDESK_CUSTOM_PROFILE_KEY);
  } catch (e) { }

  renderUserProfileUI();
  if (typeof renderHomeDashboard === 'function') {
    renderHomeDashboard();
  }
  showToast('Signed out successfully.');
}

/**
 * Builds the complete export bundle for cloud storage
 */
function buildCloudDataBundle() {
  return {
    state: state,
    exams: exams || [],
    mistakes: mistakes || [],
    customMCQQuestions: (typeof getStoredQuestions === "function" ? getStoredQuestions() : []),
    mcqProgress: (typeof userMCQProgress !== "undefined" ? userMCQProgress : null),
    todayBreakMinutes: (typeof getTodayBreakMinutes === "function" ? getTodayBreakMinutes() : 0),
    syncedAt: new Date().toISOString(),
    version: '2.0'
  };
}

/**
 * Uploads local data bundle to the cloud
 */
async function uploadBackupToCloud(isConversion = false) {
  const user = getCachedAuthUser();
  if (!user) {
    showToast('Please sign in to upload backup to cloud', true);
    return;
  }

  isCloudSyncing = true;
  updateCloudSyncDot(true);

  try {
    const bundle = buildCloudDataBundle();
    const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo);

    if (isFirebaseOnline) {
      const db = firebase.firestore();
      await db.collection('users').doc(user.uid).collection('careerdesk_backups').doc('latest').set(bundle, { merge: true });
      await db.collection('users').doc(user.uid).set({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastCloudSync: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      localStorage.setItem('careerdesk_cloud_backup_' + user.uid, JSON.stringify(bundle));
      await new Promise(r => setTimeout(r, 400));
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(FIREBASE_LAST_SYNC_KEY, nowIso);
    isCloudSyncing = false;
    updateCloudSyncDot(false);
    renderUserProfileUI();

    if (isConversion) {
      showToast('🚀 Local data successfully converted & synced to Online Cloud!');
    } else {
      showToast('☁️ Cloud backup updated successfully!');
    }
  } catch (err) {
    console.error('Cloud Upload Error:', err);
    isCloudSyncing = false;
    updateCloudSyncDot(false);
    showToast('Failed to sync to cloud: ' + (err.message || 'Unknown error'), true);
  }
}

/**
 * Restores data from the user's online cloud backup into local storage
 */
async function restoreBackupFromCloud() {
  const user = getCachedAuthUser();
  if (!user) {
    showToast('Please sign in to restore from cloud', true);
    return;
  }

  const ok = window.confirm('Restore your cloud backup? This will replace current local data with your latest cloud snapshot.');
  if (!ok) return;

  isCloudSyncing = true;
  updateCloudSyncDot(true);

  try {
    let imported = null;
    const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo);

    if (isFirebaseOnline) {
      const db = firebase.firestore();
      const doc = await db.collection('users').doc(user.uid).collection('careerdesk_backups').doc('latest').get();
      if (!doc.exists) {
        throw new Error('No cloud backup found for this account.');
      }
      imported = doc.data();
    } else {
      const raw = localStorage.getItem('careerdesk_cloud_backup_' + user.uid);
      if (!raw) {
        throw new Error('No cloud backup found yet. Click "Convert Local Data to Cloud" first.');
      }
      imported = JSON.parse(raw);
    }

    if (!imported) throw new Error('Invalid cloud backup data');

    if (imported.state) {
      state = imported.state;
    }
    if (Array.isArray(imported.exams)) {
      exams = imported.exams;
      if (typeof saveExams === 'function') saveExams();
    }
    if (Array.isArray(imported.mistakes)) {
      mistakes = imported.mistakes;
      if (typeof saveMistakes === 'function') saveMistakes();
    }
    if (Array.isArray(imported.customMCQQuestions) && typeof saveStoredQuestions === 'function') {
      saveStoredQuestions(imported.customMCQQuestions);
    }
    if (imported.mcqProgress && typeof saveMCQProgress === 'function') {
      userMCQProgress = imported.mcqProgress;
      saveMCQProgress();
    }
    if (typeof imported.todayBreakMinutes === 'number') {
      localStorage.setItem('jobprep_break_minutes_today', String(imported.todayBreakMinutes));
    }

    await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
    if (typeof writeToAutoBackupFile === 'function') await writeToAutoBackupFile();

    isCloudSyncing = false;
    showToast('📥 Cloud backup restored successfully! Refreshing dashboard...');
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    console.error('Cloud Restore Error:', err);
    isCloudSyncing = false;
    updateCloudSyncDot(false);
    showToast(err.message || 'Could not restore cloud backup', true);
  }
}

/**
 * Checks if a user has cloud data on login
 */
function checkCloudInitialSync() {
  const lastSync = localStorage.getItem(FIREBASE_LAST_SYNC_KEY);
  if (!lastSync) {
    uploadBackupToCloud(true);
  }
}

/**
 * Updates visual cloud indicator dots
 */
function updateCloudSyncDot(isBusy) {
  const dot = document.getElementById('userCloudStatusDot');
  const sub = document.getElementById('userCloudStatusSub');
  if (dot) {
    dot.className = isBusy ? 'cloud-status-dot syncing' : (getCachedAuthUser() ? 'cloud-status-dot' : 'cloud-status-dot offline');
  }
  if (sub && isBusy) {
    sub.textContent = 'Syncing data to cloud...';
  }
}

// =========================================================
// PROFILE PICTURE & DISPLAY NAME EDITING
// =========================================================

/**
 * Scales down an image file to a lightweight data URL (< 256x256)
 */
function processAvatarFile(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 256;
      let w = img.width;
      let h = img.height;

      const minEdge = Math.min(w, h);
      const sx = (w - minEdge) / 2;
      const sy = (h - minEdge) / 2;

      canvas.width = maxDim;
      canvas.height = maxDim;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, minEdge, minEdge, 0, 0, maxDim, maxDim);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Updates user profile (name and/or picture)
 */
async function updateUserProfile(newName, newPhotoUrl) {
  const custom = getCustomProfile() || {};
  if (newName !== undefined && newName.trim()) {
    custom.displayName = newName.trim();
  }
  if (newPhotoUrl !== undefined) {
    custom.photoURL = newPhotoUrl;
  }
  saveCustomProfile(custom);

  if (currentAuthUser) {
    if (custom.displayName) currentAuthUser.displayName = custom.displayName;
    if (typeof custom.photoURL === 'string') currentAuthUser.photoURL = custom.photoURL;
    try {
      localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
    } catch (e) { }

    // If real Firebase Auth user is present
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && typeof firebase.auth === 'function' && firebase.auth().currentUser && !currentAuthUser.isDemo) {
      try {
        await firebase.auth().currentUser.updateProfile({
          displayName: currentAuthUser.displayName,
          photoURL: currentAuthUser.photoURL
        });
        if (firebase.firestore) {
          await firebase.firestore().collection('users').doc(currentAuthUser.uid).set({
            displayName: currentAuthUser.displayName,
            photoURL: currentAuthUser.photoURL
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Firebase profile update warning:', err);
      }
    }
  }

  renderUserProfileUI();
  if (typeof renderHomeDashboard === 'function') {
    renderHomeDashboard();
  }
  showToast('Profile updated successfully!');
}

/**
 * Opens Edit Profile Modal
 */
function openEditProfileModal() {
  let modal = document.getElementById('editProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editProfileModal';
    document.body.appendChild(modal);
  }

  const user = getCachedAuthUser();
  const currentName = (user && user.displayName) ? user.displayName : (getCustomProfile()?.displayName || 'Aspirant');
  const currentPhoto = (user && user.photoURL) ? user.photoURL : (getCustomProfile()?.photoURL || '');

  const presets = [
    { label: 'Scholar', emoji: '🎓', bg: 'linear-gradient(135deg, #6366f1, #3b82f6)' },
    { label: 'Cyber Prodigy', emoji: '⚡', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
    { label: 'Focus Master', emoji: '🎯', bg: 'linear-gradient(135deg, #10b981, #059669)' },
    { label: 'Night Owl', emoji: '🦉', bg: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { label: 'Visionary', emoji: '🚀', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
    { label: 'Memory Ace', emoji: '🧠', bg: 'linear-gradient(135deg, #06b6d4, #10b981)' }
  ];

  modal.innerHTML = `
    <div class="glass modal-card edit-profile-modal">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="user-cog" style="color:var(--accent1); width:20px; height:20px;"></i>
          Edit Profile
        </h3>
        <button class="modal-close" id="closeEditProfileModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <!-- Avatar Preview & Upload -->
      <div class="avatar-preview-box">
        <div class="avatar-preview-img-wrap">
          <img id="modalAvatarPreview" src="${escapeAttr(currentPhoto || '')}" alt="Avatar" class="avatar-preview-img" style="${currentPhoto ? '' : 'display:none;'}">
          <div id="modalAvatarFallback" class="user-avatar-fallback" style="${currentPhoto ? 'display:none;' : ''}">
            ${escapeHtml(currentName.charAt(0).toUpperCase())}
          </div>
        </div>
        <div class="avatar-preview-actions">
          <strong style="font-size:13.5px; color:var(--text);">Profile Picture</strong>
          <div style="display:flex; gap:8px;">
            <label for="modalAvatarFileInput" class="pill subtle" style="cursor:pointer; font-size:12px; padding:5px 12px;">
              <i data-lucide="upload"></i> Upload Photo
            </label>
            <input type="file" id="modalAvatarFileInput" accept="image/*" style="display:none;">
            ${currentPhoto ? `
              <button type="button" class="pill danger" id="modalRemovePhotoBtn" style="font-size:11.5px; padding:5px 10px;">
                Remove
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Display Name Input -->
      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:12.5px; font-weight:700; color:var(--text); display:block; margin-bottom:6px;">Display Name:</label>
        <input type="text" id="editProfileNameInput" value="${escapeAttr(currentName)}" placeholder="Your full name or callsign"
          style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13.5px;">
      </div>

      <!-- Avatar Preset Avatars -->
      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-soft); display:block; margin-bottom:4px;">Or Choose an Avatar Preset:</label>
        <div class="avatar-presets-grid">
          ${presets.map((p, idx) => `
            <button type="button" class="avatar-preset-btn" data-preset-idx="${idx}" title="${escapeAttr(p.label)}" style="background:${p.bg};">
              <span>${p.emoji}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="btn-group" style="justify-content:flex-end; gap:8px;">
        <button type="button" class="pill" id="btnCancelEditProfile">Cancel</button>
        <button type="button" class="pill solid" id="btnSaveEditProfile"><i data-lucide="check"></i> <span>Save Changes</span></button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  let activeModalPhoto = currentPhoto;

  // File upload inside modal
  document.getElementById('modalAvatarFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    processAvatarFile(file, (dataUrl) => {
      activeModalPhoto = dataUrl;
      const prev = document.getElementById('modalAvatarPreview');
      const fall = document.getElementById('modalAvatarFallback');
      if (prev) {
        prev.src = dataUrl;
        prev.style.display = 'block';
      }
      if (fall) fall.style.display = 'none';
    });
  });

  // Remove photo button inside modal
  document.getElementById('modalRemovePhotoBtn')?.addEventListener('click', () => {
    activeModalPhoto = '';
    const prev = document.getElementById('modalAvatarPreview');
    const fall = document.getElementById('modalAvatarFallback');
    if (prev) prev.style.display = 'none';
    if (fall) fall.style.display = 'flex';
  });

  // Preset button clicks inside modal
  modal.querySelectorAll('.avatar-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-preset-idx'), 10);
      const chosen = presets[idx];
      if (!chosen) return;

      // Render preset SVG icon into canvas to create a custom photo data URL
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 160, 160);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 160, 160);

      // Emoji text
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chosen.emoji, 80, 85);

      activeModalPhoto = canvas.toDataURL('image/png');

      const prev = document.getElementById('modalAvatarPreview');
      const fall = document.getElementById('modalAvatarFallback');
      if (prev) {
        prev.src = activeModalPhoto;
        prev.style.display = 'block';
      }
      if (fall) fall.style.display = 'none';
    });
  });

  // Close & Cancel
  document.getElementById('closeEditProfileModal')?.addEventListener('click', closeEditProfileModal);
  document.getElementById('btnCancelEditProfile')?.addEventListener('click', closeEditProfileModal);
  modal.onclick = (e) => {
    if (e.target === modal) closeEditProfileModal();
  };

  // Save changes
  document.getElementById('btnSaveEditProfile')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('editProfileNameInput');
    const newName = nameInput ? nameInput.value.trim() : '';
    if (!newName) {
      showToast('Please enter a valid display name', true);
      return;
    }
    await updateUserProfile(newName, activeModalPhoto);
    closeEditProfileModal();
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

// =========================================================
// MAIN USER PROFILE UI RENDERER
// =========================================================

/**
 * Renders the User Profile & Cloud Hub into #userProfileCard
 */
function renderUserProfileUI() {
  const container = document.getElementById('userProfileCard');
  if (!container) return;

  const user = getCachedAuthUser();
  const custom = getCustomProfile() || {};
  const effectiveName = (user && user.displayName) ? user.displayName : (custom.displayName || 'Guest Aspirant');
  const effectivePhoto = (user && user.photoURL) ? user.photoURL : (custom.photoURL || '');

  const lastSyncIso = localStorage.getItem(FIREBASE_LAST_SYNC_KEY);
  let lastSyncFormatted = 'Never synced';
  if (lastSyncIso) {
    try {
      const d = new Date(lastSyncIso);
      lastSyncFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch (e) { }
  }

  const googleIconSvg = `
    <svg class="auth-icon-svg" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  `;

  const githubIconSvg = `
    <svg class="auth-icon-svg" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  `;

  const initials = (effectiveName || 'A').trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  if (user) {
    // Logged In State
    const isGoogle = user.providerId?.includes('google');
    const isGithub = user.providerId?.includes('github');

    container.innerHTML = `
      <div class="user-profile-header">
        <div class="user-profile-identity">
          <div class="user-avatar-wrap">
            ${effectivePhoto ? `
              <img src="${escapeAttr(effectivePhoto)}" alt="${escapeAttr(effectiveName)}" class="user-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="user-avatar-fallback" style="display:none;">${escapeHtml(initials)}</div>
            ` : `
              <div class="user-avatar-fallback">${escapeHtml(initials)}</div>
            `}
            <label for="profileAvatarUploadInput" class="avatar-edit-badge" title="Change Profile Picture" aria-label="Change profile picture">
              <i data-lucide="camera"></i>
            </label>
            <input type="file" id="profileAvatarUploadInput" accept="image/*" style="display:none;">
          </div>
          <div class="user-meta-info">
            <div class="user-name-row">
              <h3 class="user-display-name">${escapeHtml(effectiveName)}</h3>
              <button type="button" class="btn-edit-profile" id="btnOpenEditProfileModal" title="Edit Profile Name &amp; Picture" aria-label="Edit Profile">
                <i data-lucide="edit-2"></i>
              </button>
            </div>
            <p class="user-email-text">
              <i data-lucide="mail" style="width:14px; height:14px;"></i>
              ${escapeHtml(user.email || 'Cloud Account')}
            </p>
            <span class="user-provider-badge ${isGoogle ? 'google' : isGithub ? 'github' : ''}">
              ${isGoogle ? googleIconSvg : isGithub ? githubIconSvg : '<i data-lucide="cloud"></i>'}
              ${isGoogle ? 'Google Account' : isGithub ? 'GitHub Account' : 'Online Cloud'}
            </span>
          </div>
        </div>

        <div class="cloud-sync-status-card">
          <span class="cloud-status-dot" id="userCloudStatusDot"></span>
          <div>
            <div class="cloud-status-text">Cloud Sync: Connected</div>
            <span class="cloud-status-sub" id="userCloudStatusSub">Last Synced: ${escapeHtml(lastSyncFormatted)}</span>
          </div>
        </div>
      </div>

      <!-- Cloud Backup & Migration Hub -->
      <div class="cloud-backup-banner">
        <div class="cloud-banner-copy">
          <div class="cloud-banner-title">
            <i data-lucide="cloud-lightning" style="color:var(--accent2); width:18px; height:18px;"></i>
            Online Cloud Backup Active
          </div>
          <div class="cloud-banner-desc">
            Your routines, study hours, syllabus checklist, and mistake bank are securely linked to your account.
            Click below to migrate or update your online cloud backup instantly.
          </div>
        </div>
        <div class="cloud-banner-actions">
          <button type="button" class="btn-convert-cloud" id="btnUploadCloudNow" title="Upload and convert all local data into your cloud account">
            <i data-lucide="upload-cloud"></i> <span>Convert Local Data to Cloud</span>
          </button>
          <button type="button" class="pill subtle" id="btnRestoreCloudNow" title="Restore previous cloud backup into this device">
            <i data-lucide="download-cloud"></i> <span>Restore from Cloud</span>
          </button>
          <button type="button" class="pill danger" id="btnProfileSignOut" title="Sign out of this cloud account">
            <i data-lucide="log-out"></i> <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;
  } else {
    // Logged Out / Guest State
    container.innerHTML = `
      <div class="user-profile-header">
        <div class="user-profile-identity">
          <div class="user-avatar-wrap" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); box-shadow:none;">
            ${effectivePhoto ? `
              <img src="${escapeAttr(effectivePhoto)}" alt="${escapeAttr(effectiveName)}" class="user-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="user-avatar-fallback" style="display:none;">${escapeHtml(initials)}</div>
            ` : `
              <div class="user-avatar-fallback">${effectiveName && effectiveName !== 'Guest Aspirant' ? escapeHtml(initials) : '<i data-lucide="user" style="width:28px; height:28px; color:var(--text-soft);"></i>'}</div>
            `}
            <label for="profileAvatarUploadInput" class="avatar-edit-badge" title="Change Profile Picture" aria-label="Change profile picture">
              <i data-lucide="camera"></i>
            </label>
            <input type="file" id="profileAvatarUploadInput" accept="image/*" style="display:none;">
          </div>
          <div class="user-meta-info">
            <div class="user-name-row">
              <h3 class="user-display-name">${escapeHtml(effectiveName)}</h3>
              <button type="button" class="btn-edit-profile" id="btnOpenEditProfileModal" title="Edit Profile Name &amp; Picture" aria-label="Edit Profile">
                <i data-lucide="edit-2"></i>
              </button>
            </div>
            <p class="user-email-text">
              <i data-lucide="hard-drive" style="width:14px; height:14px;"></i>
              Local Storage Mode (Offline)
            </p>
            <span class="user-provider-badge">
              <i data-lucide="shield-alert" style="width:12px; height:12px;"></i>
              Unconnected &bull; Local Device Only
            </span>
          </div>
        </div>

        <div class="cloud-sync-status-card">
          <span class="cloud-status-dot offline" id="userCloudStatusDot"></span>
          <div>
            <div class="cloud-status-text">Cloud Sync: Inactive</div>
            <span class="cloud-status-sub">Data saved locally on this browser</span>
          </div>
        </div>
      </div>

      <div class="user-auth-bar">
        <p class="auth-prompt-text">
          Sign in to connect <strong>Firebase Cloud Sync</strong>. All your routines, study sessions, syllabus progress, and mistake bank will automatically back up online and synchronize seamlessly across all your phones, laptops, and tablets.
        </p>
        <div class="auth-buttons-group">
          <button type="button" class="btn-auth btn-google" id="btnSignInGoogle">
            ${googleIconSvg}
            <span>Sign in with Google</span>
          </button>
          <button type="button" class="btn-auth btn-github" id="btnSignInGithub">
            ${githubIconSvg}
            <span>Sign in with GitHub</span>
          </button>
          <button type="button" class="btn-firebase-cfg" id="btnOpenFirebaseCfg" title="Connect custom Firebase project credentials">
            <i data-lucide="settings-2" style="width:14px; height:14px;"></i>
            <span>Firebase Config</span>
          </button>
        </div>
      </div>
    `;
  }

  // Create Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// =========================================================
// GLOBAL DELEGATED EVENT LISTENERS (FOOLPROOF BINDINGS)
// =========================================================

document.addEventListener('click', async (e) => {
  // Sign Out Button
  const btnSignOut = e.target.closest('#btnProfileSignOut');
  if (btnSignOut) {
    e.preventDefault();
    e.stopPropagation();
    await signOutUser();
    return;
  }

  // Sign In Google
  const btnGoogle = e.target.closest('#btnSignInGoogle');
  if (btnGoogle) {
    e.preventDefault();
    await signInWithGoogle();
    return;
  }

  // Sign In GitHub
  const btnGithub = e.target.closest('#btnSignInGithub');
  if (btnGithub) {
    e.preventDefault();
    await signInWithGithub();
    return;
  }

  // Open Firebase Config Modal
  const btnOpenCfg = e.target.closest('#btnOpenFirebaseCfg');
  if (btnOpenCfg) {
    e.preventDefault();
    openFirebaseConfigModal(false);
    return;
  }

  // Upload to Cloud Now
  const btnUpload = e.target.closest('#btnUploadCloudNow');
  if (btnUpload) {
    e.preventDefault();
    await uploadBackupToCloud(true);
    return;
  }

  // Restore from Cloud Now
  const btnRestore = e.target.closest('#btnRestoreCloudNow');
  if (btnRestore) {
    e.preventDefault();
    await restoreBackupFromCloud();
    return;
  }

  // Open Edit Profile Modal
  const btnEditProfile = e.target.closest('#btnOpenEditProfileModal');
  if (btnEditProfile) {
    e.preventDefault();
    openEditProfileModal();
    return;
  }
});

// File input change listener for camera badge on avatar
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'profileAvatarUploadInput') {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    processAvatarFile(file, async (dataUrl) => {
      await updateUserProfile(undefined, dataUrl);
    });
    e.target.value = '';
  }
});

/**
 * Firebase Config Modal Management
 */
function openFirebaseConfigModal(isLoginPrompt = false, attemptedProvider = 'Google') {
  let modal = document.getElementById('firebaseConfigModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'firebaseConfigModal';
    document.body.appendChild(modal);
  }

  const currentCfg = getStoredFirebaseConfig();
  const cfgString = currentCfg ? JSON.stringify(currentCfg, null, 2) : '';

  modal.innerHTML = `
    <div class="glass modal-card firebase-cfg-modal">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="flame" style="color:#f59e0b; width:20px; height:20px;"></i>
          Firebase Cloud Connection
        </h3>
        <button class="modal-close" id="closeFirebaseCfgModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <p style="font-size:13px; color:var(--text-soft); margin:0 0 12px; line-height:1.45;">
        ${isLoginPrompt ? `To authenticate via <strong>${attemptedProvider}</strong> and sync backups online, connect your Firebase project credentials below, or click <em>Instant Demo Login</em> to test immediately.` : `Paste your Firebase web application configuration JSON object below to enable real-time Google/GitHub login and Firestore online backups.`}
      </p>

      <div class="form-group" style="margin-bottom:10px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:4px;">Firebase Config JSON:</label>
        <textarea id="firebaseConfigTextarea" class="cfg-textarea" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'>${escapeHtml(cfgString)}</textarea>
      </div>

      <div class="cfg-help-tip">
        <strong>Quick 2-Minute Setup:</strong>
        In Firebase Console &rarr; Project Settings &rarr; Your Apps &rarr; Web App &rarr; copy the <code>firebaseConfig</code> object and paste it above. Enable <em>Google</em> or <em>GitHub</em> in Authentication &rarr; Sign-in method.
      </div>

      <div class="btn-group" style="margin-top:18px; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <button type="button" class="pill" id="btnSimulateDemoLogin" style="font-size:12px; background:rgba(99,102,241,0.15); color:var(--accent1); border-color:rgba(99,102,241,0.3);">
          <i data-lucide="play"></i> <span>Instant Demo Login (${escapeHtml(attemptedProvider)})</span>
        </button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="pill" id="btnCancelFirebaseCfg">Cancel</button>
          <button type="button" class="pill solid" id="btnSaveFirebaseCfg"><i data-lucide="check"></i> <span>Save &amp; Connect</span></button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  document.getElementById('closeFirebaseCfgModal')?.addEventListener('click', closeFirebaseConfigModal);
  document.getElementById('btnCancelFirebaseCfg')?.addEventListener('click', closeFirebaseConfigModal);
  modal.onclick = (e) => {
    if (e.target === modal) closeFirebaseConfigModal();
  };
  
  document.getElementById('btnSimulateDemoLogin')?.addEventListener('click', () => {
    signInDemoUser(attemptedProvider);
  });

  document.getElementById('btnSaveFirebaseCfg')?.addEventListener('click', () => {
    const val = document.getElementById('firebaseConfigTextarea')?.value.trim();
    if (!val) {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
      showToast('Firebase configuration cleared.');
      closeFirebaseConfigModal();
      return;
    }
    try {
      const parsed = JSON.parse(val);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must include at least apiKey and projectId.');
      }
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(parsed));
      showToast('Firebase configuration saved successfully!');
      closeFirebaseConfigModal();
      initFirebaseApp();
      renderUserProfileUI();
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeFirebaseConfigModal() {
  const modal = document.getElementById('firebaseConfigModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

// =========================================================
// ERROR HANDLING & AUTHENTICATION GUIDANCE MODALS
// =========================================================

/**
 * Handles Firebase Authentication errors gracefully with actionable guidance
 */
function handleAuthError(err, providerName = 'Google') {
  console.error(`[CareerDesk Firebase] ${providerName} Sign-In Error:`, err);
  if (!err) return;

  const code = err.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return; // User intentionally dismissed the popup
  }

  if (code === 'auth/operation-not-supported-in-this-environment' || window.location.protocol === 'file:') {
    openProtocolHelpModal(providerName);
    return;
  }

  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    openProviderDisabledModal(providerName);
    return;
  }

  if (code === 'auth/unauthorized-domain') {
    openUnauthorizedDomainModal();
    return;
  }

  if (code === 'auth/popup-blocked') {
    showToast('The sign-in popup was blocked by your browser. Please allow popups for CareerDesk and try again.', true);
    return;
  }

  showToast(`${providerName} Sign-In: ${err.message || 'Error authenticating'}`, true);
}

/**
 * Modal displayed when attempting OAuth sign-in on file:// protocol
 */
function openProtocolHelpModal(providerName = 'Google') {
  let modal = document.getElementById('protocolHelpModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'protocolHelpModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="glass modal-card protocol-help-modal" style="max-width:540px; width:92%; padding:26px; border-radius:18px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="shield-alert" style="color:#f59e0b; width:22px; height:22px;"></i>
          Browser Security: Local File Mode
        </h3>
        <button class="modal-close" id="closeProtocolHelpModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <p style="font-size:13px; color:var(--text); margin:0 0 14px; line-height:1.5;">
        You opened CareerDesk directly from your filesystem (<code>file://</code>). Google and GitHub OAuth popups require an HTTP web server origin (like <code>http://localhost:3000</code>) because modern web browsers block cross-window authentication on local file paths.
      </p>

      <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
        <strong style="font-size:13px; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:6px;">
          <i data-lucide="terminal" style="width:16px; height:16px; color:var(--accent1);"></i>
          Option 1: Run Local Web Server (Full OAuth)
        </strong>
        <p style="font-size:12px; color:var(--text-soft); margin:0 0 8px; line-height:1.45;">
          Open your terminal in the <code>CareerDesk</code> folder and run:
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; font-family:var(--font-mono); font-size:12.5px; color:#67e8f9;">
          <code>npm start</code>
          <span style="font-size:11px; color:var(--text-soft);">or <code>node serve.js</code></span>
        </div>
        <p style="font-size:11.5px; color:var(--text-soft); margin:8px 0 0;">
          This automatically opens <strong>http://localhost:3000</strong> where real ${escapeHtml(providerName)} sign-in works natively.
        </p>
      </div>

      <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.25); border-radius:12px; padding:14px; margin-bottom:18px;">
        <strong style="font-size:13px; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <i data-lucide="zap" style="width:16px; height:16px; color:var(--accent2);"></i>
          Option 2: Instant Demo Login (Works on file://)
        </strong>
        <p style="font-size:12px; color:var(--text-soft); margin:0; line-height:1.4;">
          Test all user features right now in this tab without running a local server. Cloud sync, avatar upload, and profile editing will be fully active.
        </p>
      </div>

      <div class="btn-group" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <button type="button" class="pill solid" id="btnContinueWithDemo" style="background:linear-gradient(135deg, var(--accent1), var(--accent2)); color:#fff;">
          <i data-lucide="play"></i> <span>Instant Demo Login (${escapeHtml(providerName)})</span>
        </button>
        <button type="button" class="pill" id="btnDismissProtocolHelp">Close</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeProtocolHelpModal(); };
  document.getElementById('closeProtocolHelpModal')?.addEventListener('click', closeProtocolHelpModal);
  document.getElementById('btnDismissProtocolHelp')?.addEventListener('click', closeProtocolHelpModal);
  document.getElementById('btnContinueWithDemo')?.addEventListener('click', () => {
    closeProtocolHelpModal();
    signInDemoUser(providerName);
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeProtocolHelpModal() {
  const modal = document.getElementById('protocolHelpModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

/**
 * Modal displayed when Google/GitHub provider is not enabled in Firebase console
 */
function openProviderDisabledModal(providerName = 'Google') {
  let modal = document.getElementById('providerDisabledModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'providerDisabledModal';
    document.body.appendChild(modal);
  }

  const projectId = getStoredFirebaseConfig()?.projectId || 'careerdesk';
  const consoleUrl = `https://console.firebase.google.com/project/${encodeURIComponent(projectId)}/authentication/providers`;

  modal.innerHTML = `
    <div class="glass modal-card provider-disabled-modal" style="max-width:520px; width:92%; padding:26px; border-radius:18px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="alert-triangle" style="color:#f59e0b; width:22px; height:22px;"></i>
          ${escapeHtml(providerName)} Sign-In Not Enabled
        </h3>
        <button class="modal-close" id="closeProviderDisabledModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <p style="font-size:13px; color:var(--text); margin:0 0 14px; line-height:1.5;">
        Firebase rejected the sign-in because <strong>${escapeHtml(providerName)}</strong> authentication is not enabled yet in your Firebase console.
      </p>

      <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:16px;">
        <strong style="font-size:13px; color:var(--text); display:block; margin-bottom:6px;">Quick 1-Minute Fix:</strong>
        <ol style="font-size:12.5px; color:var(--text-soft); margin:0; padding-left:18px; line-height:1.55;">
          <li>Click the button below to open your Firebase Console.</li>
          <li>Under <strong>Sign-in method</strong>, click <strong>${escapeHtml(providerName)}</strong>.</li>
          <li>Toggle <strong>Enable</strong>, select your support email, and click <strong>Save</strong>.</li>
        </ol>
      </div>

      <div class="btn-group" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <a href="${consoleUrl}" target="_blank" rel="noopener noreferrer" class="pill solid" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="external-link"></i> <span>Open Firebase Console</span>
        </a>
        <div style="display:flex; gap:8px;">
          <button type="button" class="pill" id="btnProviderDemoFallback" style="font-size:12px;">Demo Login</button>
          <button type="button" class="pill" id="btnDismissProviderDisabled">Close</button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeProviderDisabledModal(); };
  document.getElementById('closeProviderDisabledModal')?.addEventListener('click', closeProviderDisabledModal);
  document.getElementById('btnDismissProviderDisabled')?.addEventListener('click', closeProviderDisabledModal);
  document.getElementById('btnProviderDemoFallback')?.addEventListener('click', () => {
    closeProviderDisabledModal();
    signInDemoUser(providerName);
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeProviderDisabledModal() {
  const modal = document.getElementById('providerDisabledModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

/**
 * Modal displayed when domain is not authorized in Firebase Console
 */
function openUnauthorizedDomainModal() {
  let modal = document.getElementById('unauthorizedDomainModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'unauthorizedDomainModal';
    document.body.appendChild(modal);
  }

  const projectId = getStoredFirebaseConfig()?.projectId || 'careerdesk';
  const consoleUrl = `https://console.firebase.google.com/project/${encodeURIComponent(projectId)}/authentication/settings`;
  const host = window.location.hostname || 'localhost';

  modal.innerHTML = `
    <div class="glass modal-card unauthorized-domain-modal" style="max-width:520px; width:92%; padding:26px; border-radius:18px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="globe" style="color:#f59e0b; width:22px; height:22px;"></i>
          Unauthorized Domain
        </h3>
        <button class="modal-close" id="closeUnauthorizedDomainModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <p style="font-size:13px; color:var(--text); margin:0 0 14px; line-height:1.5;">
        Firebase only accepts sign-ins from authorized domains. The current domain (<code>${escapeHtml(host)}</code>) is not yet on your authorized list.
      </p>

      <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:16px;">
        <strong style="font-size:13px; color:var(--text); display:block; margin-bottom:6px;">How to add it:</strong>
        <ol style="font-size:12.5px; color:var(--text-soft); margin:0; padding-left:18px; line-height:1.55;">
          <li>Open your Firebase Console Authentication Settings.</li>
          <li>Scroll to <strong>Authorized domains</strong>.</li>
          <li>Click <strong>Add domain</strong> and enter <code>${escapeHtml(host)}</code>.</li>
        </ol>
      </div>

      <div class="btn-group" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <a href="${consoleUrl}" target="_blank" rel="noopener noreferrer" class="pill solid" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="external-link"></i> <span>Open Auth Settings</span>
        </a>
        <button type="button" class="pill" id="btnDismissUnauthorizedDomain">Close</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeUnauthorizedDomainModal(); };
  document.getElementById('closeUnauthorizedDomainModal')?.addEventListener('click', closeUnauthorizedDomainModal);
  document.getElementById('btnDismissUnauthorizedDomain')?.addEventListener('click', closeUnauthorizedDomainModal);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeUnauthorizedDomainModal() {
  const modal = document.getElementById('unauthorizedDomainModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

// Global Escape Key Listener for Modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditProfileModal();
    closeFirebaseConfigModal();
    closeProtocolHelpModal();
    closeProviderDisabledModal();
    closeUnauthorizedDomainModal();
  }
});

// Auto-initialize on file load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initFirebaseApp();
  });
} else {
  initFirebaseApp();
}
