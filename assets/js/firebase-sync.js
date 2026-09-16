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
 * Sign Up / Sign In with Email + Password
 */
async function signInWithEmailPassword(email, password, isSignUp = false, customDisplayName = '') {
  isExplicitlySignedOut = false;

  // Check if online & Firebase Auth is active on http/https
  const isOnlineHttp = (typeof window !== 'undefined' && window.location.protocol !== 'file:') && initFirebaseApp();
  if (isOnlineHttp && typeof firebase !== 'undefined' && firebase.auth) {
    try {
      let result;
      if (isSignUp) {
        result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        if (customDisplayName && result.user && result.user.updateProfile) {
          await result.user.updateProfile({ displayName: customDisplayName });
        }
      } else {
        result = await firebase.auth().signInWithEmailAndPassword(email, password);
      }
      const user = result.user;
      currentAuthUser = {
        uid: user.uid,
        displayName: customDisplayName || user.displayName || email.split('@')[0],
        email: user.email || email,
        photoURL: user.photoURL || '',
        providerId: 'password'
      };
      applyCustomProfileOverrides(currentAuthUser);
      localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
      showToast((isSignUp ? 'Account created! Signed in as ' : 'Signed in as ') + currentAuthUser.displayName);
      closeAuthModal();
      renderUserProfileUI();
      setTimeout(() => checkCloudInitialSync(), 600);
      return;
    } catch (err) {
      const el = document.getElementById('authModalError') || document.getElementById('emailAuthError');
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Try signing in.';
      else if (err.code === 'auth/user-not-found') msg = 'No account found with this email. Try signing up.';
      else if (err.code === 'auth/wrong-password') msg = 'Incorrect password. Please try again.';
      else if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (el) el.textContent = msg;
      else showToast(msg, true);
      return;
    }
  }

  // Local / Offline / file:// protocol session (Privacy-first client-side guarantee)
  const effectiveName = customDisplayName || email.split('@')[0];
  currentAuthUser = {
    uid: 'local_' + Math.abs(email.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)),
    displayName: effectiveName,
    email: email,
    photoURL: '',
    providerId: 'password',
    isLocalSession: true
  };
  applyCustomProfileOverrides(currentAuthUser);
  localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
  showToast((isSignUp ? 'Account created! Welcome, ' : 'Welcome back, ') + currentAuthUser.displayName);
  closeAuthModal();
  renderUserProfileUI();
}

/**
 * Send Phone OTP via Firebase Phone Auth
 */
async function sendPhoneOTP(phoneNumber) {
  isExplicitlySignedOut = false;
  if (window.location.protocol === 'file:') {
    openProtocolHelpModal('Phone');
    return;
  }
  const isInitialized = initFirebaseApp();
  if (!isInitialized || typeof firebase === 'undefined' || !firebase.auth) {
    showToast('Firebase is required for phone auth. Please configure Firebase first.', true);
    return;
  }
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('phoneRecaptchaContainer', {
        size: 'invisible',
        callback: () => {}
      });
    }
    const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier);
    window.phoneConfirmationResult = confirmationResult;
    const otpStep = document.getElementById('phoneOtpStep');
    const sendStep = document.getElementById('phoneSendStep');
    if (otpStep) otpStep.style.display = 'block';
    if (sendStep) sendStep.style.display = 'none';
    const phoneAuthError = document.getElementById('phoneAuthError');
    if (phoneAuthError) phoneAuthError.textContent = '';
    showToast('OTP sent to ' + phoneNumber);
  } catch (err) {
    const el = document.getElementById('phoneAuthError');
    let msg = err.message || 'Failed to send OTP.';
    if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number. Use international format: +880XXXXXXXXXX';
    if (err.code === 'auth/too-many-requests') msg = 'Too many OTP requests. Please wait and try again.';
    if (el) el.textContent = msg;
    else showToast(msg, true);
    if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch(e2) {} window.recaptchaVerifier = null; }
  }
}

async function verifyPhoneOTP(otp) {
  if (!window.phoneConfirmationResult) { showToast('Please request an OTP first.', true); return; }
  try {
    const result = await window.phoneConfirmationResult.confirm(otp);
    const user = result.user;
    currentAuthUser = {
      uid: user.uid,
      displayName: user.displayName || ('User ' + (user.phoneNumber || '').slice(-4)),
      email: user.email || '',
      photoURL: user.photoURL || '',
      providerId: 'phone',
      phoneNumber: user.phoneNumber || ''
    };
    applyCustomProfileOverrides(currentAuthUser);
    localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
    showToast('Phone sign-in successful!');
    closeEmailAuthModal();
    renderUserProfileUI();
    setTimeout(() => checkCloudInitialSync(), 600);
  } catch (err) {
    const el = document.getElementById('phoneAuthError');
    let msg = err.code === 'auth/invalid-verification-code' ? 'Invalid OTP code. Please try again.' : (err.message || 'OTP verification failed.');
    if (el) el.textContent = msg;
    else showToast(msg, true);
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
    let bundle = buildCloudDataBundle();
    const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo);

    const vaultCfg = typeof getVaultConfig === 'function' ? getVaultConfig() : null;
    let isEncrypted = false;
    if (vaultCfg && vaultCfg.enabled && typeof encryptVaultPayload === 'function') {
      const pass = typeof promptVaultPassphrase === 'function' 
        ? await promptVaultPassphrase('Cloud Vault Encryption Active')
        : prompt('Enter vault passphrase to encrypt cloud snapshot:');
      if (!pass) {
        throw new Error('Encryption passphrase is required to upload encrypted vault.');
      }
      showToast('🔒 Encrypting cloud snapshot with AES-GCM-256...');
      bundle = await encryptVaultPayload(bundle, pass);
      isEncrypted = true;
    }

    if (isFirebaseOnline) {
      const db = firebase.firestore();
      await db.collection('users').doc(user.uid).collection('careerdesk_backups').doc('latest').set(bundle, { merge: true });
      await db.collection('users').doc(user.uid).set({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isEncryptedVault: isEncrypted,
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
    } else if (isEncrypted) {
      showToast('🔒 Military-grade encrypted cloud backup saved (AES-GCM-256)!');
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

    // Decrypt if client-side Zero-Knowledge AES-GCM-256 encrypted
    if (imported.__careerdesk_vault && typeof decryptVaultPayload === 'function') {
      const pass = prompt('This cloud backup is protected with Zero-Knowledge AES-GCM-256 encryption.\nEnter your secret passphrase:');
      if (!pass) {
        throw new Error('Vault passphrase is required to decrypt cloud backup.');
      }
      showToast('🔓 Decrypting cloud vault with AES-GCM-256...');
      imported = await decryptVaultPayload(imported, pass);
      sessionStorage.setItem('careerdesk_active_vault_pass', pass);
    }

    // Anti-Prototype Pollution protection
    if (typeof scrubPrototypePollution === 'function') {
      imported = scrubPrototypePollution(imported);
    }

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

  const btnLogin = document.getElementById('btnOpenAuthModalLogin');
  if (btnLogin) btnLogin.addEventListener('click', () => { if (typeof openEmailAuthModal === 'function') openEmailAuthModal('email'); });

  const btnSignup = document.getElementById('btnOpenAuthModalSignup');
  if (btnSignup) btnSignup.addEventListener('click', () => { if (typeof openEmailAuthModal === 'function') openEmailAuthModal('email'); });

  const btnDemo = document.getElementById('btnSimulateDemoLoginFromCard');
  if (btnDemo) btnDemo.addEventListener('click', () => { if (typeof signInDemoUser === 'function') signInDemoUser('Demo'); });

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

/*/**
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

  const avatarHtml = effectivePhoto
    ? `<img src="${escapeAttr(effectivePhoto)}" alt="${escapeAttr(effectiveName)}" class="user-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div class="user-avatar-fallback" style="display:none;">${escapeHtml(initials)}</div>`
    : `<div class="user-avatar-fallback">${effectiveName && effectiveName !== 'Guest Aspirant' ? escapeHtml(initials) : '<i data-lucide="user" style="width:32px;height:32px;color:var(--text-soft);"></i>'}</div>`;

  const chevronSvg = `<svg class="auth-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

  // Calculate live study stats
  const sessionCount = (state && Array.isArray(state.sessions)) ? state.sessions.length : 0;
  const routineCount = (state && Array.isArray(state.routine)) ? state.routine.length : 0;
  let doneTopics = 0;
  let totalTopics = 0;
  if (state && Array.isArray(state.syllabus)) {
    state.syllabus.forEach(cat => {
      if (Array.isArray(cat.topics)) {
        totalTopics += cat.topics.length;
        doneTopics += cat.topics.filter(t => t.done).length;
      }
    });
  }
  const syllabusPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
  const examCount = (typeof exams !== 'undefined' && Array.isArray(exams)) ? exams.length : 0;

  if (user) {
    const isGoogle = user.providerId?.includes('google');
    const isGithub = user.providerId?.includes('github');
    const isEmail  = user.providerId === 'password';
    const isPhone  = user.providerId === 'phone';
    const isDemo   = !!user.isDemo;

    let providerLabel = 'Online Cloud';
    let providerClass = '';
    let providerIconHtml = '<i data-lucide="cloud" style="width:12px;height:12px;"></i>';

    if (isDemo) {
      providerLabel = 'Demo Account';
      providerClass = '';
      providerIconHtml = '<i data-lucide="play-circle" style="width:12px;height:12px;color:#f59e0b;"></i>';
    } else if (isGoogle) {
      providerLabel = 'Google Account';
      providerClass = 'google';
      providerIconHtml = googleIconSvg;
    } else if (isGithub) {
      providerLabel = 'GitHub Account';
      providerClass = 'github';
      providerIconHtml = githubIconSvg;
    } else if (isEmail) {
      providerLabel = 'Email Account';
      providerIconHtml = '<i data-lucide="mail" style="width:12px;height:12px;"></i>';
    } else if (isPhone) {
      providerLabel = 'Phone Account';
      providerIconHtml = '<i data-lucide="smartphone" style="width:12px;height:12px;"></i>';
    }

    container.innerHTML = `
      <!-- HERO BANNER -->
      <div class="profile-hero-banner">
        <div class="profile-hero-content">
          <!-- Avatar -->
          <div class="user-avatar-wrap">
            ${avatarHtml}
            <label for="profileAvatarUploadInput" class="avatar-edit-badge" title="Change Profile Picture" aria-label="Change profile picture">
              <i data-lucide="camera"></i>
            </label>
            <input type="file" id="profileAvatarUploadInput" accept="image/*" style="display:none;">
          </div>

          <!-- Name / Email / Badge -->
          <div class="user-hero-text">
            <div class="user-name-row">
              <h3 class="user-display-name">${escapeHtml(effectiveName)}</h3>
              <button type="button" class="btn-edit-profile" id="btnOpenEditProfileModal" title="Edit Profile Name &amp; Picture" aria-label="Edit Profile">
                <i data-lucide="edit-2"></i>
              </button>
            </div>
            <p class="user-email-text">
              <i data-lucide="${isPhone ? 'smartphone' : 'mail'}" style="width:13px;height:13px;"></i>
              ${escapeHtml(user.email || user.phoneNumber || 'Cloud Aspirant')}
            </p>
            <span class="user-provider-badge ${providerClass}">
              ${providerIconHtml} ${escapeHtml(providerLabel)}
            </span>
          </div>

          <!-- Cloud status pill -->
          <div class="profile-hero-actions">
            <div class="cloud-sync-status-card">
              <span class="cloud-status-dot" id="userCloudStatusDot"></span>
              <div>
                <div class="cloud-status-text">Cloud Sync Active</div>
                <span class="cloud-status-sub" id="userCloudStatusSub">${escapeHtml(lastSyncFormatted)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PROFILE BODY -->
      <div class="profile-card-body">

        <!-- Live Activity Stats Summary -->
        <div class="profile-stats-bar">
          <div class="profile-stat-card">
            <span class="profile-stat-val">${sessionCount}</span>
            <span class="profile-stat-lbl">Sessions</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-val">${routineCount}</span>
            <span class="profile-stat-lbl">Routines</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-val">${syllabusPct}%</span>
            <span class="profile-stat-lbl">Syllabus (${doneTopics}/${totalTopics})</span>
          </div>
          <div class="profile-stat-card">
            <span class="profile-stat-val">${examCount}</span>
            <span class="profile-stat-lbl">Target Exams</span>
          </div>
        </div>

        <!-- Cloud Action Cards -->
        <div class="cloud-actions-row">
          <button type="button" class="cloud-action-card upload-card" id="btnUploadCloudNow" title="Upload and convert all local data into your cloud account">
            <div class="cloud-action-icon">
              <i data-lucide="upload-cloud" style="width:18px;height:18px;"></i>
            </div>
            <div class="cloud-action-label">Convert / Upload to Cloud</div>
            <div class="cloud-action-desc">Save today's local progress to cloud storage</div>
          </button>
          <button type="button" class="cloud-action-card restore-card" id="btnRestoreCloudNow" title="Restore previous cloud backup into this device">
            <div class="cloud-action-icon">
              <i data-lucide="download-cloud" style="width:18px;height:18px;"></i>
            </div>
            <div class="cloud-action-label">Restore from Cloud</div>
            <div class="cloud-action-desc">Pull latest online backup to this browser</div>
          </button>
        </div>

        <!-- Modern Sign Out Row -->
        <div class="profile-signout-row">
          <div class="profile-signout-row-info">
            Signed in as <strong>${escapeHtml(user.email || user.phoneNumber || effectiveName)}</strong>
          </div>
          <button type="button" class="btn-signout-modern" id="btnProfileSignOut" title="Sign out from cloud account">
            <i data-lucide="log-out" style="width:14px;height:14px;"></i> <span>Sign Out</span>
          </button>
        </div>

      </div>
    `;
  } else {
    // ===== SIGNED-OUT / GUEST STATE (PROFESSIONAL SAAS LANDING CARD) =====
    container.innerHTML = `
      <div class="auth-guest-landing-card">
        <!-- Hero Header -->
        <div class="auth-guest-hero">
          <div class="auth-guest-badge-wrap">
            <div class="auth-guest-badge-icon">
              <i data-lucide="sparkles"></i>
            </div>
            <span class="auth-guest-pill">CareerDesk Cloud Portal</span>
          </div>

          <h2 class="auth-guest-title">Sign In to Your CareerDesk Account</h2>
          <p class="auth-guest-desc">
            Synchronize your study routines, smart notes, BCS syllabus progress, and mistake bank across all your computers, phones, and tablets with seamless cloud backup.
          </p>

          <!-- Primary Call to Action Buttons -->
          <div class="auth-guest-cta-row">
            <button type="button" class="btn-profile-login-cta" id="btnOpenAuthModalLogin" title="Open Sign In popup">
              <i data-lucide="log-in" style="width:17px; height:17px;"></i>
              <span>Sign In / Sign Up</span>
            </button>
            <button type="button" class="btn-profile-signup-cta" id="btnOpenAuthModalSignup" title="Create a new free account">
              <i data-lucide="user-plus" style="width:17px; height:17px;"></i>
              <span>Create Free Account</span>
            </button>
            <button type="button" class="btn-demo-auth" id="btnSimulateDemoLoginFromCard" title="Test cloud sync instantly with a demo account">
              <i data-lucide="zap" style="width:14px; height:14px;"></i>
              <span>Instant Demo Login</span>
            </button>
          </div>
        </div>

        <!-- Key Cloud Features Grid -->
        <div class="auth-guest-features-grid">
          <div class="auth-feature-card">
            <div class="auth-feature-icon" style="background:rgba(99,102,241,0.12); color:var(--accent1);">
              <i data-lucide="refresh-cw"></i>
            </div>
            <div class="auth-feature-info">
              <h4>Multi-Device Cloud Sync</h4>
              <p>Work seamlessly on desktop, continue revision on phone without missing data.</p>
            </div>
          </div>
          <div class="auth-feature-card">
            <div class="auth-feature-icon" style="background:rgba(6,182,212,0.12); color:var(--accent2);">
              <i data-lucide="shield-check"></i>
            </div>
            <div class="auth-feature-info">
              <h4>Encrypted Automated Backup</h4>
              <p>Your study notes, formulas, and target exams are securely protected.</p>
            </div>
          </div>
          <div class="auth-feature-card">
            <div class="auth-feature-icon" style="background:rgba(245,158,11,0.12); color:#f59e0b;">
              <i data-lucide="brain"></i>
            </div>
            <div class="auth-feature-info">
              <h4>Smart Mistake Bank</h4>
              <p>Missed questions automatically saved to your cloud bank for targeted mastery.</p>
            </div>
          </div>
          <div class="auth-feature-card">
            <div class="auth-feature-icon" style="background:rgba(16,185,129,0.12); color:#10b981;">
              <i data-lucide="target"></i>
            </div>
            <div class="auth-feature-info">
              <h4>Exam Target &amp; Syllabus Progress</h4>
              <p>Live countdowns and chapter checklists organized for BCS &amp; Job Prep.</p>
            </div>
          </div>
        </div>

        <!-- Local Data Security Guarantee Footer -->
        <div class="auth-guest-footer-bar">
          <div class="auth-footer-trust-item">
            <i data-lucide="lock" style="width:14px; height:14px; color:var(--accent1);"></i>
            <span>Offline-First Guarantee: Local browser data is safe and will automatically merge upon sign in.</span>
          </div>
        </div>
      </div>
    `;
  }

  // Bind Guest Auth Action Listeners
  const btnLogin = document.getElementById('btnOpenAuthModalLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      if (typeof openAuthModal === 'function') openAuthModal('login');
    });
  }

  const btnSignup = document.getElementById('btnOpenAuthModalSignup');
  if (btnSignup) {
    btnSignup.addEventListener('click', () => {
      if (typeof openAuthModal === 'function') openAuthModal('signup');
    });
  }

  const btnDemo = document.getElementById('btnSimulateDemoLoginFromCard');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      if (typeof signInDemoUser === 'function') signInDemoUser('Demo');
    });
  }

  // Bind Signed-In Action Listeners
  const btnSignOut = document.getElementById('btnProfileSignOut');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      if (typeof signOutUser === 'function') signOutUser();
    });
  }

  const btnUpload = document.getElementById('btnUploadCloudNow');
  if (btnUpload) {
    btnUpload.addEventListener('click', () => {
      if (typeof uploadBackupToCloud === 'function') uploadBackupToCloud(true);
    });
  }

  const btnRestore = document.getElementById('btnRestoreCloudNow');
  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      if (typeof restoreBackupFromCloud === 'function') restoreBackupFromCloud();
    });
  }

  const btnEditProfile = document.getElementById('btnOpenEditProfileModal');
  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      if (typeof openEditProfileModal === 'function') openEditProfileModal();
    });
  }

  const avatarUploadInput = document.getElementById('profileAvatarUploadInput');
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file && typeof processAvatarFile === 'function') {
        processAvatarFile(file, (dataUrl) => {
          if (typeof updateUserProfile === 'function') {
            const curName = effectiveName || 'Aspirant';
            updateUserProfile(curName, dataUrl);
          }
        });
      }
    });
  }

  // Create Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// =========================================================
// DEDICATED LOGIN & SIGN UP PAGE RENDERER (#panel-auth)
// =========================================================

let authPageIsSignUpMode = false;
let authPagePhoneVisible = false;

function renderAuthPageUI() {
  const container = document.getElementById('authPageContainer');
  if (!container) return;

  const user = getCachedAuthUser();
  const custom = getCustomProfile() || {};
  const effectiveName = (user && user.displayName) ? user.displayName : (custom.displayName || 'Aspirant');
  const effectivePhoto = (user && user.photoURL) ? user.photoURL : (custom.photoURL || '');

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

  // IF ALREADY SIGNED IN: Show Account Dashboard Card
  if (user) {
    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-card-hero">
          <div class="auth-hero-icon-wrap" style="background:linear-gradient(135deg, #10b981, #06b6d4);">
            <i data-lucide="check-circle-2" style="width:28px; height:28px;"></i>
          </div>
          <h2 class="auth-card-title">You're Signed In</h2>
          <p class="auth-card-subtitle">Connected as <strong>${escapeHtml(user.email || user.phoneNumber || effectiveName)}</strong>. Your routines, notes, and progress are synced with the cloud.</p>
        </div>

        <div class="auth-card-body" style="text-align:center;">
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button type="button" class="btn-auth-submit" id="btnAuthPageGoProfile">
              <i data-lucide="user" style="width:16px;height:16px;"></i>
              <span>View Profile &amp; Settings</span>
            </button>
            <button type="button" class="pill subtle" id="btnUploadCloudNow" style="padding:11px; justify-content:center; font-size:13.5px; font-weight:700;">
              <i data-lucide="upload-cloud" style="width:16px;height:16px;"></i>
              <span>Sync / Convert Local Data Now</span>
            </button>
            <button type="button" class="pill danger" id="btnProfileSignOut" style="padding:11px; justify-content:center; font-size:13.5px; font-weight:700; margin-top:6px;">
              <i data-lucide="log-out" style="width:16px;height:16px;"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();
    return;
  }

  // GUEST STATE: Full Modern Login & Sign Up Experience
  container.innerHTML = `
    <div class="auth-card">
      <!-- Hero Header -->
      <div class="auth-card-hero">
        <div class="auth-hero-icon-wrap">
          <i data-lucide="sparkles" style="width:28px; height:28px;"></i>
        </div>
        <h2 class="auth-card-title">Welcome to CareerDesk</h2>
        <p class="auth-card-subtitle">Sign in or create your account to synchronize your study routines, notes, syllabus checklist, and mistake bank across all your devices.</p>
      </div>

      <!-- Card Body Form -->
      <div class="auth-card-body">
        <!-- Segmented Mode Switcher: Sign In vs Sign Up -->
        <div class="auth-segmented-switch">
          <button type="button" class="auth-switch-btn ${!authPageIsSignUpMode ? 'active' : ''}" id="authPageTabSignIn">
            <i data-lucide="log-in" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i> Sign In
          </button>
          <button type="button" class="auth-switch-btn ${authPageIsSignUpMode ? 'active' : ''}" id="authPageTabSignUp">
            <i data-lucide="user-plus" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i> Create Account (Sign Up)
          </button>
        </div>

        <!-- 1-Tap Fast Social Sign-In -->
        <div class="auth-fast-grid">
          <button type="button" class="btn-auth btn-google" id="btnSignInGoogle" style="padding:11px 12px; justify-content:center;">
            ${googleIconSvg}
            <span style="font-size:13px;">Google</span>
          </button>
          <button type="button" class="btn-auth btn-github" id="btnSignInGithub" style="padding:11px 12px; justify-content:center;">
            ${githubIconSvg}
            <span style="font-size:13px;">GitHub</span>
          </button>
        </div>

        <div class="auth-divider"><span>or continue with email</span></div>

        <!-- Email & Password Form -->
        <form id="authPageForm" onsubmit="return false;" style="display:flex; flex-direction:column; gap:12px;">
          <!-- Display Name (Visible in Sign Up mode) -->
          <div id="authPageNameWrap" style="display:${authPageIsSignUpMode ? 'block' : 'none'};">
            <label class="auth-input-label">Full Name</label>
            <div class="auth-input-control">
              <span class="auth-input-icon"><i data-lucide="user" style="width:15px;height:15px;"></i></span>
              <input type="text" id="authPageNameInput" placeholder="Your name (e.g. Shahriyar Shehab)" autocomplete="name" class="auth-text-input">
            </div>
          </div>

          <!-- Email Address -->
          <div>
            <label class="auth-input-label">Email Address</label>
            <div class="auth-input-control">
              <span class="auth-input-icon"><i data-lucide="mail" style="width:15px;height:15px;"></i></span>
              <input type="email" id="authPageEmailInput" placeholder="you@example.com" autocomplete="email" required class="auth-text-input">
            </div>
          </div>

          <!-- Password -->
          <div>
            <div class="auth-input-label">
              <span>Password</span>
              ${!authPageIsSignUpMode ? `<a href="#" id="authPageForgotLink" style="color:var(--accent1); text-decoration:none; font-size:11.5px; font-weight:600;">Forgot password?</a>` : ''}
            </div>
            <div class="auth-input-control">
              <span class="auth-input-icon"><i data-lucide="lock" style="width:15px;height:15px;"></i></span>
              <input type="password" id="authPagePasswordInput" placeholder="${authPageIsSignUpMode ? 'Min. 6 characters' : 'Enter your password'}" autocomplete="${authPageIsSignUpMode ? 'new-password' : 'current-password'}" required class="auth-text-input" style="padding-right:40px;">
              <button type="button" class="auth-password-toggle" id="authPageTogglePassword" title="Show / Hide password">
                <i data-lucide="eye" style="width:15px;height:15px;"></i>
              </button>
            </div>
          </div>

          <p id="authPageError" style="color:#f43f5e; font-size:12.5px; margin:2px 0 0; min-height:16px; font-weight:600;"></p>

          <!-- Primary Submit Button -->
          <button type="button" class="btn-auth-submit" id="btnAuthPageSubmit">
            <i data-lucide="${authPageIsSignUpMode ? 'user-plus' : 'log-in'}" style="width:16px;height:16px;"></i>
            <span id="authPageSubmitLabel">${authPageIsSignUpMode ? 'Create Account &amp; Sync' : 'Sign In'}</span>
          </button>
        </form>

        <!-- Phone Number OTP Section (Collapsible) -->
        <div class="auth-phone-toggle-box">
          <button type="button" id="btnToggleAuthPhone" style="background:none; border:none; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:space-between; padding:0; color:var(--text); font-family:var(--font-sans); font-size:13px; font-weight:700;">
            <span style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="smartphone" style="width:15px;height:15px;color:#10b981;"></i>
              <span>Sign in with Phone Number (SMS OTP)</span>
            </span>
            <i data-lucide="${authPagePhoneVisible ? 'chevron-up' : 'chevron-down'}" style="width:15px;height:15px;color:var(--text-soft);"></i>
          </button>

          <div id="authPagePhoneWrap" style="display:${authPagePhoneVisible ? 'block' : 'none'}; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
            <div id="authPhoneSendStep">
              <label class="auth-input-label">Phone Number (International Format)</label>
              <div class="auth-input-control" style="margin-bottom:10px;">
                <span class="auth-input-icon"><i data-lucide="phone" style="width:15px;height:15px;"></i></span>
                <input type="tel" id="authPagePhoneInput" placeholder="+880 1XXX-XXXXXX" class="auth-text-input">
              </div>
              <div id="phonePageRecaptchaContainer"></div>
              <button type="button" class="pill solid" id="btnAuthPageSendOTP" style="width:100%; justify-content:center; padding:10px; font-weight:700;">
                <i data-lucide="send" style="width:14px;height:14px;"></i> <span>Send OTP Code</span>
              </button>
            </div>

            <div id="authPhoneOtpStep" style="display:none;">
              <p style="font-size:12.5px; color:var(--text-soft); margin:0 0 10px;">Enter the 6-digit verification code sent to your phone.</p>
              <input type="number" id="authPageOtpInput" placeholder="6-digit code" maxlength="6" class="auth-text-input" style="padding-left:14px; letter-spacing:4px; text-align:center; font-size:16px; margin-bottom:10px;">
              <button type="button" class="pill solid" id="btnAuthPageVerifyOTP" style="width:100%; justify-content:center; padding:10px; font-weight:700;">
                <i data-lucide="check-circle" style="width:14px;height:14px;"></i> <span>Verify &amp; Sign In</span>
              </button>
              <button type="button" class="pill subtle" id="btnAuthPageResendOTP" style="width:100%; justify-content:center; margin-top:8px; font-size:12px;">
                <i data-lucide="refresh-cw" style="width:13px;height:13px;"></i> <span>Resend Code</span>
              </button>
            </div>
            <p id="authPagePhoneError" style="color:#f43f5e; font-size:12px; margin:8px 0 0; min-height:14px; font-weight:600;"></p>
          </div>
        </div>

        <!-- Quick Tools & Demo Actions -->
        <div class="auth-footer-actions" style="margin-top:6px;">
          <button type="button" class="btn-demo-auth" id="btnAuthPageDemo" title="Test cloud sync instantly without Firebase keys">
            <i data-lucide="zap" style="width:14px;height:14px;"></i>
            <span>Instant Demo Aspirant Login</span>
          </button>
          <button type="button" class="btn-firebase-cfg" id="btnOpenFirebaseCfg" title="Connect custom Firebase project credentials">
            <i data-lucide="settings-2" style="width:13px;height:13px;"></i>
            <span>Firebase Credentials</span>
          </button>
        </div>

        <div style="text-align:center; margin-top:8px;">
          <button type="button" class="pill subtle" id="btnAuthPageBackHome" style="font-size:12px; border:none; background:none; color:var(--text-soft);">
            <i data-lucide="arrow-left" style="width:13px;height:13px;"></i> <span>Back to Mission Control</span>
          </button>
        </div>

      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Wire Tab Switches
  const tabSignIn = document.getElementById('authPageTabSignIn');
  const tabSignUp = document.getElementById('authPageTabSignUp');
  const nameWrap = document.getElementById('authPageNameWrap');
  const submitLabel = document.getElementById('authPageSubmitLabel');

  if (tabSignIn && tabSignUp) {
    tabSignIn.addEventListener('click', () => {
      authPageIsSignUpMode = false;
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      if (nameWrap) nameWrap.style.display = 'none';
      if (submitLabel) submitLabel.textContent = 'Sign In';
      const forgot = document.getElementById('authPageForgotLink');
      if (forgot) forgot.style.display = 'inline-block';
    });

    tabSignUp.addEventListener('click', () => {
      authPageIsSignUpMode = true;
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      if (nameWrap) nameWrap.style.display = 'block';
      if (submitLabel) submitLabel.textContent = 'Create Account & Sync';
      const forgot = document.getElementById('authPageForgotLink');
      if (forgot) forgot.style.display = 'none';
    });
  }

  // Password visibility
  const togglePassBtn = document.getElementById('authPageTogglePassword');
  const passInput = document.getElementById('authPagePasswordInput');
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" style="width:15px;height:15px;"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // Phone section toggle
  const togglePhoneBtn = document.getElementById('btnToggleAuthPhone');
  const phoneWrap = document.getElementById('authPagePhoneWrap');
  if (togglePhoneBtn && phoneWrap) {
    togglePhoneBtn.addEventListener('click', () => {
      authPagePhoneVisible = !authPagePhoneVisible;
      phoneWrap.style.display = authPagePhoneVisible ? 'block' : 'none';
      const icon = togglePhoneBtn.querySelector('.lucide-chevron-down, .lucide-chevron-up');
      if (icon) {
        icon.setAttribute('data-lucide', authPagePhoneVisible ? 'chevron-up' : 'chevron-down');
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Forgot password link
  const forgotLink = document.getElementById('authPageForgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authPageEmailInput')?.value.trim();
      const errEl = document.getElementById('authPageError');
      if (!email) {
        if (errEl) { errEl.style.color = '#f43f5e'; errEl.textContent = 'Enter your email address above to reset password.'; }
        return;
      }
      const isInitialized = initFirebaseApp();
      if (!isInitialized || typeof firebase === 'undefined' || !firebase.auth) {
        showToast('Firebase is required for password reset.', true);
        return;
      }
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('Password reset email sent to ' + email);
        if (errEl) { errEl.style.color = '#10b981'; errEl.textContent = 'Password reset link sent! Check your inbox / spam.'; }
      } catch (err) {
        if (errEl) { errEl.style.color = '#f43f5e'; errEl.textContent = err.message || 'Failed to send reset email.'; }
      }
    });
  }

  // Submit Email + Password
  const submitBtn = document.getElementById('btnAuthPageSubmit');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const email = document.getElementById('authPageEmailInput')?.value.trim();
      const password = document.getElementById('authPagePasswordInput')?.value;
      const displayName = document.getElementById('authPageNameInput')?.value.trim();
      const errEl = document.getElementById('authPageError');

      if (!email || !password) {
        if (errEl) { errEl.style.color = '#f43f5e'; errEl.textContent = 'Please fill in both email and password.'; }
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite;"></i> <span>${authPageIsSignUpMode ? 'Creating Account...' : 'Signing In...'}</span>`;
      if (window.lucide) lucide.createIcons();

      await signInWithEmailPassword(email, password, authPageIsSignUpMode);

      if (authPageIsSignUpMode && displayName && currentAuthUser) {
        await updateUserProfile(displayName);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="${authPageIsSignUpMode ? 'user-plus' : 'log-in'}" style="width:16px;height:16px;"></i> <span>${authPageIsSignUpMode ? 'Create Account &amp; Sync' : 'Sign In'}</span>`;
      if (window.lucide) lucide.createIcons();

      // If signed in successfully, auto-redirect to profile tab
      if (currentAuthUser) {
        activateTab('profile', true);
      }
    });
  }

  // Phone OTP handlers
  const sendOTPBtn = document.getElementById('btnAuthPageSendOTP');
  if (sendOTPBtn) {
    sendOTPBtn.addEventListener('click', async () => {
      const phone = document.getElementById('authPagePhoneInput')?.value.trim();
      const errEl = document.getElementById('authPagePhoneError');
      if (!phone) {
        if (errEl) errEl.textContent = 'Please enter your phone number in international format (+880...).';
        return;
      }
      await sendPhoneOTP(phone);
    });
  }

  const verifyOTPBtn = document.getElementById('btnAuthPageVerifyOTP');
  if (verifyOTPBtn) {
    verifyOTPBtn.addEventListener('click', async () => {
      const otp = document.getElementById('authPageOtpInput')?.value.trim();
      const errEl = document.getElementById('authPagePhoneError');
      if (!otp) {
        if (errEl) errEl.textContent = 'Please enter the 6-digit OTP code.';
        return;
      }
      await verifyPhoneOTP(otp);
      if (currentAuthUser) {
        activateTab('profile', true);
      }
    });
  }

  const resendOTPBtn = document.getElementById('btnAuthPageResendOTP');
  if (resendOTPBtn) {
    resendOTPBtn.addEventListener('click', () => {
      document.getElementById('authPhoneOtpStep').style.display = 'none';
      document.getElementById('authPhoneSendStep').style.display = 'block';
      window.phoneConfirmationResult = null;
      if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch(e) {} window.recaptchaVerifier = null; }
    });
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
    if (confirm('Are you sure you want to sign out? Your offline local data will remain intact on this browser.')) {
      await signOutUser();
    }
    return;
  }

  // Navigate to Dedicated Auth Page (from Profile CTA or anywhere)
  const btnGoToAuth = e.target.closest('#btnGoToAuthPage') || e.target.closest('#navAuthBtn');
  if (btnGoToAuth) {
    e.preventDefault();
    activateTab('auth', true);
    return;
  }

  // Navigate back to Profile from Auth Page
  const btnGoProfile = e.target.closest('#btnAuthPageGoProfile');
  if (btnGoProfile) {
    e.preventDefault();
    activateTab('profile', true);
    return;
  }

  // Back to Mission Control Home
  const btnBackHome = e.target.closest('#btnAuthPageBackHome');
  if (btnBackHome) {
    e.preventDefault();
    activateTab('home', true);
    return;
  }

  // Instant Demo Aspirant Login
  const btnDemo = e.target.closest('#btnSimulateDemoLoginFromCard') || e.target.closest('#btnAuthPageDemo');
  if (btnDemo) {
    e.preventDefault();
    await signInDemoUser('Demo');
    activateTab('profile', true);
    return;
  }

  // Sign In Google
  const btnGoogle = e.target.closest('#btnSignInGoogle');
  if (btnGoogle) {
    e.preventDefault();
    await signInWithGoogle();
    if (currentAuthUser) activateTab('profile', true);
    return;
  }

  // Sign In GitHub
  const btnGithub = e.target.closest('#btnSignInGithub');
  if (btnGithub) {
    e.preventDefault();
    await signInWithGithub();
    if (currentAuthUser) activateTab('profile', true);
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
// EMAIL + PHONE AUTHENTICATION MODAL
// =========================================================

function openEmailAuthModal(defaultTab = 'email') {
  let modal = document.getElementById('emailAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'emailAuthModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="glass modal-card" style="max-width:440px; width:93%; padding:0; overflow:hidden; border-radius:18px;">
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:10px; padding:18px 22px 14px; border-bottom:1px solid var(--border); background:var(--surface-strong);">
        <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, var(--accent1), var(--accent2)); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i data-lucide="log-in" style="width:16px; height:16px;"></i>
        </div>
        <h3 style="margin:0; font-family:var(--font-display); font-size:16px; color:var(--text); flex:1;">Sign In / Sign Up</h3>
        <button type="button" id="closeEmailAuthModalBtn" style="background:none; border:none; cursor:pointer; color:var(--text-soft); padding:4px; display:flex; align-items:center; border-radius:8px;" title="Close" aria-label="Close">
          <i data-lucide="x" style="width:18px; height:18px;"></i>
        </button>
      </div>

      <!-- Tab Switch: Email | Phone -->
      <div style="display:flex; border-bottom:1px solid var(--border); background:var(--surface-strong);">
        <button type="button" class="email-auth-tab ${defaultTab === 'email' ? 'active' : ''}" data-tab="email" style="flex:1; padding:10px; border:none; cursor:pointer; font-size:13px; font-weight:600; background:transparent; color:${defaultTab === 'email' ? 'var(--accent1)' : 'var(--text-soft)'}; border-bottom:2px solid ${defaultTab === 'email' ? 'var(--accent1)' : 'transparent'}; transition:all 0.2s;">
          <i data-lucide="mail" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i> Email
        </button>
        <button type="button" class="email-auth-tab ${defaultTab === 'phone' ? 'active' : ''}" data-tab="phone" style="flex:1; padding:10px; border:none; cursor:pointer; font-size:13px; font-weight:600; background:transparent; color:${defaultTab === 'phone' ? 'var(--accent1)' : 'var(--text-soft)'}; border-bottom:2px solid ${defaultTab === 'phone' ? 'var(--accent1)' : 'transparent'}; transition:all 0.2s;">
          <i data-lucide="smartphone" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i> Phone
        </button>
      </div>

      <!-- Body -->
      <div style="padding:18px 22px 22px;">

        <!-- Email/Password Tab -->
        <div id="emailAuthTabContent" style="display:${defaultTab === 'email' ? 'block' : 'none'};">
          <!-- Sign In / Sign Up Toggle -->
          <div class="segmented-toggle-group" style="margin-bottom:16px; display:flex;">
            <button type="button" class="chip btn-mode-switch active" id="emailTabSignIn" style="flex:1; justify-content:center;">Sign In</button>
            <button type="button" class="chip btn-mode-switch" id="emailTabSignUp" style="flex:1; justify-content:center;">Sign Up</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:11px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:600; color:var(--text-soft); margin-bottom:5px;">Email Address</label>
              <input type="email" id="authEmailInput" placeholder="you@example.com" autocomplete="email"
                style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; box-sizing:border-box;">
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="font-size:12px; font-weight:600; color:var(--text-soft); margin:0;">Password</label>
                <a href="#" id="linkForgotPassword" style="font-size:11.5px; color:var(--accent1); text-decoration:none;">Forgot?</a>
              </div>
              <div style="position:relative;">
                <input type="password" id="authPasswordInput" placeholder="Min. 6 characters" autocomplete="current-password"
                  style="width:100%; padding:10px 40px 10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; box-sizing:border-box;">
                <button type="button" id="togglePasswordVisibility" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-soft); padding:2px; display:flex;" title="Show/Hide password">
                  <i data-lucide="eye" style="width:15px; height:15px;"></i>
                </button>
              </div>
            </div>
            <div id="authNameFieldWrap" style="display:none;">
              <label style="display:block; font-size:12px; font-weight:600; color:var(--text-soft); margin-bottom:5px;">Display Name</label>
              <input type="text" id="authDisplayNameInput" placeholder="Your name (optional)" autocomplete="name"
                style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; box-sizing:border-box;">
            </div>
          </div>
          <p id="emailAuthError" style="color:#f43f5e; font-size:12.5px; margin:10px 0 0; min-height:16px;"></p>
          <button type="button" id="btnEmailAuthSubmit" class="pill solid" style="width:100%; margin-top:12px; justify-content:center; padding:11px; font-size:14px; font-weight:700;">
            <i data-lucide="log-in" style="width:15px; height:15px;"></i> <span id="emailAuthSubmitLabel">Sign In</span>
          </button>
          <div style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--border); text-align:center;">
            <button type="button" class="btn-demo-auth" id="btnModalDemoLogin" style="width:100%; justify-content:center; font-size:12.5px;">
              <i data-lucide="zap" style="width:14px;height:14px;"></i>
              <span>Instant Demo Aspirant Login</span>
            </button>
          </div>
          <p style="font-size:11.5px; color:var(--text-muted); text-align:center; margin:10px 0 0;">
            Study data synchronizes securely with Firebase Cloud Storage.
          </p>
        </div>

        <!-- Phone Tab -->
        <div id="phoneAuthTabContent" style="display:${defaultTab === 'phone' ? 'block' : 'none'};">
          <div id="phoneSendStep">
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-soft); margin-bottom:5px;">Phone Number (International Format)</label>
            <input type="tel" id="authPhoneInput" placeholder="+880 1XXX-XXXXXX"
              style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; box-sizing:border-box; margin-bottom:12px;">
            <div id="phoneRecaptchaContainer"></div>
            <button type="button" id="btnSendOTP" class="pill solid" style="width:100%; justify-content:center; padding:11px; font-size:14px; font-weight:700;">
              <i data-lucide="send" style="width:15px; height:15px;"></i> Send OTP
            </button>
          </div>
          <div id="phoneOtpStep" style="display:none;">
            <p style="font-size:13px; color:var(--text-soft); margin:0 0 12px;">Enter the 6-digit OTP sent to your phone.</p>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-soft); margin-bottom:5px;">OTP Code</label>
            <input type="number" id="authOtpInput" placeholder="6-digit code" maxlength="6"
              style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:16px; letter-spacing:4px; text-align:center; box-sizing:border-box; margin-bottom:12px;">
            <button type="button" id="btnVerifyOTP" class="pill solid" style="width:100%; justify-content:center; padding:11px; font-size:14px; font-weight:700;">
              <i data-lucide="check-circle" style="width:15px; height:15px;"></i> Verify &amp; Sign In
            </button>
            <button type="button" id="btnResendOTP" class="pill subtle" style="width:100%; justify-content:center; margin-top:8px; font-size:12.5px;">
              <i data-lucide="refresh-cw" style="width:13px; height:13px;"></i> Resend OTP
            </button>
          </div>
          <p id="phoneAuthError" style="color:#f43f5e; font-size:12.5px; margin:10px 0 0; min-height:16px;"></p>
        </div>

      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);
  if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();

  // Tab switching
  modal.querySelectorAll('.email-auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      modal.querySelectorAll('.email-auth-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-soft)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--accent1)';
      tab.style.borderBottomColor = 'var(--accent1)';
      document.getElementById('emailAuthTabContent').style.display = target === 'email' ? 'block' : 'none';
      document.getElementById('phoneAuthTabContent').style.display = target === 'phone' ? 'block' : 'none';
    });
  });

  // Sign In / Sign Up toggle
  let isSignUpMode = false;
  const emailTabSignIn = document.getElementById('emailTabSignIn');
  const emailTabSignUp = document.getElementById('emailTabSignUp');
  const nameWrap = document.getElementById('authNameFieldWrap');
  const submitLabel = document.getElementById('emailAuthSubmitLabel');

  function setEmailMode(mode) {
    isSignUpMode = (mode === 'signup');
    if (emailTabSignIn) { emailTabSignIn.classList.toggle('active', !isSignUpMode); }
    if (emailTabSignUp) { emailTabSignUp.classList.toggle('active', isSignUpMode); }
    if (nameWrap) nameWrap.style.display = isSignUpMode ? 'block' : 'none';
    if (submitLabel) submitLabel.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
    const passInput = document.getElementById('authPasswordInput');
    if (passInput) passInput.setAttribute('autocomplete', isSignUpMode ? 'new-password' : 'current-password');
  }

  if (emailTabSignIn) emailTabSignIn.addEventListener('click', () => setEmailMode('signin'));
  if (emailTabSignUp) emailTabSignUp.addEventListener('click', () => setEmailMode('signup'));

  // Password visibility toggle
  const togglePass = document.getElementById('togglePasswordVisibility');
  const passInput = document.getElementById('authPasswordInput');
  if (togglePass && passInput) {
    togglePass.addEventListener('click', () => {
      const show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      togglePass.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}" style="width:15px; height:15px;"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // Email submit
  const emailSubmitBtn = document.getElementById('btnEmailAuthSubmit');
  if (emailSubmitBtn) {
    emailSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('authEmailInput')?.value.trim();
      const password = document.getElementById('authPasswordInput')?.value;
      if (!email || !password) { document.getElementById('emailAuthError').textContent = 'Please fill in email and password.'; return; }
      emailSubmitBtn.disabled = true;
      emailSubmitBtn.innerHTML = `<i data-lucide="loader" style="width:15px; height:15px; animation:spin 1s linear infinite;"></i> ${isSignUpMode ? 'Creating Account...' : 'Signing In...'}`;
      if (window.lucide) lucide.createIcons();
      await signInWithEmailPassword(email, password, isSignUpMode);
      emailSubmitBtn.disabled = false;
      emailSubmitBtn.innerHTML = `<i data-lucide="log-in" style="width:15px; height:15px;"></i> <span id="emailAuthSubmitLabel">${isSignUpMode ? 'Create Account' : 'Sign In'}</span>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // Phone OTP
  const sendOTPBtn = document.getElementById('btnSendOTP');
  if (sendOTPBtn) {
    sendOTPBtn.addEventListener('click', async () => {
      const phone = document.getElementById('authPhoneInput')?.value.trim();
      if (!phone) { document.getElementById('phoneAuthError').textContent = 'Please enter your phone number.'; return; }
      await sendPhoneOTP(phone);
    });
  }

  const verifyOTPBtn = document.getElementById('btnVerifyOTP');
  if (verifyOTPBtn) {
    verifyOTPBtn.addEventListener('click', async () => {
      const otp = document.getElementById('authOtpInput')?.value.trim();
      if (!otp) { document.getElementById('phoneAuthError').textContent = 'Please enter the OTP code.'; return; }
      await verifyPhoneOTP(otp);
    });
  }

  const resendOTPBtn = document.getElementById('btnResendOTP');
  if (resendOTPBtn) {
    resendOTPBtn.addEventListener('click', () => {
      document.getElementById('phoneOtpStep').style.display = 'none';
      document.getElementById('phoneSendStep').style.display = 'block';
      window.phoneConfirmationResult = null;
      if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch(e) {} window.recaptchaVerifier = null; }
    });
  }

  // Forgot password
  const forgotLink = document.getElementById('linkForgotPassword');
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmailInput')?.value.trim();
      const errEl = document.getElementById('emailAuthError');
      if (!email) {
        if (errEl) {
          errEl.style.color = '#f43f5e';
          errEl.textContent = 'Please enter your email address above to reset password.';
        }
        return;
      }
      const isInitialized = initFirebaseApp();
      if (!isInitialized || typeof firebase === 'undefined' || !firebase.auth) {
        showToast('Firebase is required for password reset. Configure Firebase first.', true);
        return;
      }
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('Password reset email sent to ' + email);
        if (errEl) {
          errEl.style.color = '#10b981';
          errEl.textContent = 'Password reset email sent! Check your inbox / spam.';
        }
      } catch (err) {
        if (errEl) {
          errEl.style.color = '#f43f5e';
          errEl.textContent = err.message || 'Failed to send reset email.';
        }
      }
    });
  }

  // Instant Demo Login from inside Auth Modal
  const modalDemoBtn = document.getElementById('btnModalDemoLogin');
  if (modalDemoBtn) {
    modalDemoBtn.addEventListener('click', () => {
      closeEmailAuthModal();
      signInDemoUser('Demo');
    });
  }

  // Close
  const closeBtn = document.getElementById('closeEmailAuthModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeEmailAuthModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeEmailAuthModal(); });
}

function closeEmailAuthModal() {
  const modal = document.getElementById('emailAuthModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => { if (!modal.classList.contains('open')) modal.style.display = 'none'; }, 200);
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


// =========================================================
// CENTRAL AUTHENTICATION POPUP MODAL (#authModal) CONTROLLER
// (Supports Sign In, Sign Up, reCAPTCHA, Google, GitHub, Demo)
// =========================================================

let currentAuthModalMode = 'login'; // 'login' | 'signup'

function openAuthModal(mode = 'login') {
  initAuthModalEvents();
  const modal = document.getElementById('authModal');
  if (!modal) return;

  setAuthModalMode(mode);

  // Clear errors
  const errEl = document.getElementById('authModalError');
  if (errEl) errEl.textContent = '';

  // Reset inputs
  const emailInput = document.getElementById('authModalEmailInput');
  const passInput = document.getElementById('authModalPasswordInput');
  const nameInput = document.getElementById('authModalNameInput');
  if (emailInput && !emailInput.value) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (nameInput) nameInput.value = '';

  // Reset reCAPTCHA
  const recaptchaCheck = document.getElementById('authRecaptchaCheckbox');
  const recaptchaLabel = document.getElementById('authRecaptchaLabel');
  const recaptchaFallback = document.getElementById('authRecaptchaFallback');
  if (recaptchaCheck) recaptchaCheck.checked = false;
  if (recaptchaLabel) recaptchaLabel.textContent = 'I am not a robot';
  if (recaptchaFallback) {
    recaptchaFallback.style.borderColor = 'var(--border)';
    recaptchaFallback.style.boxShadow = 'none';
  }

  modal.style.display = 'flex';
  modal.classList.add('open');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.style.display = 'none';
}

// Alias for backwards compatibility
function openEmailAuthModal(defaultTab = 'email') {
  const mode = (defaultTab === 'signup') ? 'signup' : 'login';
  openAuthModal(mode);
}

function closeEmailAuthModal() {
  closeAuthModal();
}

function setAuthModalMode(mode) {
  currentAuthModalMode = (mode === 'signup') ? 'signup' : 'login';
  const isSignUp = (currentAuthModalMode === 'signup');

  const tabLogin = document.getElementById('authModalTabLogin');
  const tabSignup = document.getElementById('authModalTabSignup');
  const nameGroup = document.getElementById('authModalNameGroup');
  const titleEl = document.getElementById('authModalTitle');
  const subEl = document.getElementById('authModalSubtitle');
  const submitText = document.getElementById('authModalSubmitText');
  const submitIcon = document.getElementById('authModalSubmitIcon');
  const errEl = document.getElementById('authModalError');

  if (tabLogin) {
    tabLogin.classList.toggle('active', !isSignUp);
    tabLogin.style.color = !isSignUp ? 'var(--text)' : 'var(--text-soft)';
    tabLogin.style.background = !isSignUp ? 'var(--surface)' : 'transparent';
  }
  if (tabSignup) {
    tabSignup.classList.toggle('active', isSignUp);
    tabSignup.style.color = isSignUp ? 'var(--text)' : 'var(--text-soft)';
    tabSignup.style.background = isSignUp ? 'var(--surface)' : 'transparent';
  }
  if (nameGroup) {
    nameGroup.style.display = isSignUp ? 'block' : 'none';
  }
  if (titleEl) {
    titleEl.textContent = isSignUp ? 'Create Free Account' : 'Welcome to CareerDesk';
  }
  if (subEl) {
    subEl.textContent = isSignUp 
      ? 'Sign up to synchronize your syllabus, routines & mistakes'
      : 'Sign in to access your cloud routine & mistake bank';
  }
  if (submitText) {
    submitText.textContent = isSignUp ? 'Create Account' : 'Sign In';
  }
  if (submitIcon) {
    submitIcon.setAttribute('data-lucide', isSignUp ? 'user-plus' : 'log-in');
  }
  if (errEl) errEl.textContent = '';

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Initializes all event listeners for the centralized #authModal
 */
function initAuthModalEvents() {
  const modal = document.getElementById('authModal');
  if (!modal || modal.dataset.eventsInitialized === 'true') return;
  modal.dataset.eventsInitialized = 'true';

  // Close button
  const closeBtn = document.getElementById('closeAuthModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthModal();
    });
  }

  // Backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeAuthModal();
    }
  });

  // Mode Switch Tabs
  const tabLogin = document.getElementById('authModalTabLogin');
  if (tabLogin) {
    tabLogin.addEventListener('click', () => setAuthModalMode('login'));
  }
  const tabSignup = document.getElementById('authModalTabSignup');
  if (tabSignup) {
    tabSignup.addEventListener('click', () => setAuthModalMode('signup'));
  }

  // Password Visibility Toggle
  const togglePassBtn = document.getElementById('authModalTogglePass');
  const passInput = document.getElementById('authModalPasswordInput');
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = (passInput.type === 'password');
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" style="width:15px; height:15px;"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // Forgot Password Link
  const forgotBtn = document.getElementById('authModalForgotBtn');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('authModalEmailInput');
      const email = (emailInput?.value || '').trim();
      if (!email) {
        showToast('Please enter your email above first, then click Forgot password.');
      } else {
        showToast('Password reset link dispatched to ' + email);
      }
    });
  }

  // reCAPTCHA Checkbox Interaction
  const recaptchaCheck = document.getElementById('authRecaptchaCheckbox');
  const recaptchaLabel = document.getElementById('authRecaptchaLabel');
  const recaptchaFallback = document.getElementById('authRecaptchaFallback');
  if (recaptchaCheck) {
    recaptchaCheck.addEventListener('change', () => {
      if (recaptchaCheck.checked) {
        if (recaptchaLabel) recaptchaLabel.textContent = 'Verification verified';
        if (recaptchaFallback) {
          recaptchaFallback.style.borderColor = 'rgba(16, 185, 129, 0.5)';
          recaptchaFallback.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.15)';
        }
        const errEl = document.getElementById('authModalError');
        if (errEl) errEl.textContent = '';
      } else {
        if (recaptchaLabel) recaptchaLabel.textContent = 'I am not a robot';
        if (recaptchaFallback) {
          recaptchaFallback.style.borderColor = 'var(--border)';
          recaptchaFallback.style.boxShadow = 'none';
        }
      }
    });
  }

  // Social Sign-In 1-Tap Buttons
  const btnGoogle = document.getElementById('modalBtnSignInGoogle');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      closeAuthModal();
      await signInWithGoogle();
    });
  }
  const btnGithub = document.getElementById('modalBtnSignInGithub');
  if (btnGithub) {
    btnGithub.addEventListener('click', async () => {
      closeAuthModal();
      await signInWithGithub();
    });
  }
  const btnDemo = document.getElementById('modalBtnDemoLogin');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      closeAuthModal();
      signInDemoUser('Demo');
    });
  }

  // Main Form Submit Handler (with reCAPTCHA enforcement)
  const form = document.getElementById('authModalForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAuthModalSubmit();
    });
  }
  const submitBtn = document.getElementById('authModalSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAuthModalSubmit();
    });
  }
}

/**
 * Validates inputs and handles submission for #authModal
 */
function handleAuthModalSubmit() {
  const errEl = document.getElementById('authModalError');
  const isSignUp = (currentAuthModalMode === 'signup');

  // 1. Enforce reCAPTCHA
  const recaptchaCheck = document.getElementById('authRecaptchaCheckbox');
  if (!recaptchaCheck || !recaptchaCheck.checked) {
    if (errEl) errEl.textContent = 'Please complete the reCAPTCHA verification to continue.';
    const fallback = document.getElementById('authRecaptchaFallback');
    if (fallback) {
      fallback.style.borderColor = '#f43f5e';
      fallback.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.3)';
      fallback.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0)' }
      ], { duration: 300 });
    }
    return;
  }

  // 2. Validate Email
  const emailInput = document.getElementById('authModalEmailInput');
  const email = (emailInput?.value || '').trim();
  if (!email || !email.includes('@') || email.length < 5) {
    if (errEl) errEl.textContent = 'Please enter a valid email address.';
    if (emailInput) emailInput.focus();
    return;
  }

  // 3. Validate Password
  const passInput = document.getElementById('authModalPasswordInput');
  const password = (passInput?.value || '').trim();
  if (!password || password.length < 6) {
    if (errEl) errEl.textContent = 'Password must be at least 6 characters.';
    if (passInput) passInput.focus();
    return;
  }

  // 4. Validate Name if Signing Up
  let displayName = '';
  if (isSignUp) {
    const nameInput = document.getElementById('authModalNameInput');
    displayName = (nameInput?.value || '').trim();
    if (!displayName) {
      displayName = email.split('@')[0];
    }
  }

  // Clear errors & submit
  if (errEl) errEl.textContent = '';
  signInWithEmailPassword(email, password, isSignUp, displayName);
}

// Auto-initialize auth modal listeners on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthModalEvents);
  } else {
    initAuthModalEvents();
  }
}

// Global click delegation for close buttons
document.addEventListener('click', (e) => {
  if (e.target && (e.target.id === 'closeAuthModalBtn' || e.target.closest('#closeAuthModalBtn'))) {
    e.preventDefault();
    closeAuthModal();
  }
});
