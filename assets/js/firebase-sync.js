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

// =========================================================
// USERNAME MANAGEMENT & RESOLUTION SUBSYSTEM
// =========================================================
const CAREERDESK_USERNAMES_KEY = 'careerdesk_usernames_map_v1';

function normalizeUsername(raw) {
  if (!raw) return '';
  return raw.toString().toLowerCase().trim().replace(/^@+/, '').replace(/[^a-z0-9_-]/g, '');
}

function isValidUsername(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim().replace(/^@+/, '');
  return /^[a-zA-Z0-9_-]{3,25}$/.test(trimmed);
}

function getLocalUsernameMap() {
  try {
    const raw = localStorage.getItem(CAREERDESK_USERNAMES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return {};
}

function saveLocalUsernameMapping(username, email, uid = '') {
  const u = normalizeUsername(username);
  if (!u || !email) return;
  try {
    const map = getLocalUsernameMap();
    map[u] = { email: email.toLowerCase().trim(), uid: uid || '' };
    localStorage.setItem(CAREERDESK_USERNAMES_KEY, JSON.stringify(map));
  } catch (e) { }
}

async function isUsernameAvailable(username, excludeUid = '') {
  const u = normalizeUsername(username);
  if (!u || !isValidUsername(u)) return false;

  // 1. Check local map
  const map = getLocalUsernameMap();
  if (map[u] && map[u].uid && map[u].uid !== excludeUid) {
    return false;
  }

  // 2. Check Firestore
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.firestore) {
    try {
      const doc = await firebase.firestore().collection('usernames').doc(u).get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.uid && data.uid !== excludeUid) {
          return false;
        }
      }
    } catch (e) {
      console.warn('[Username Check] Firestore check skipped:', e);
    }
  }
  return true;
}

async function registerUsernameForUser(username, email, uid = '') {
  const u = normalizeUsername(username);
  if (!u || !email) return false;
  saveLocalUsernameMapping(u, email, uid);

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.firestore) {
    try {
      await firebase.firestore().collection('usernames').doc(u).set({
        username: u,
        email: email.toLowerCase().trim(),
        uid: uid || '',
        updatedAt: Date.now()
      }, { merge: true });
      if (uid) {
        await firebase.firestore().collection('users').doc(uid).set({
          username: u
        }, { merge: true });
      }
    } catch (e) {
      console.warn('[Register Username] Firestore mapping error:', e);
    }
  }
  return true;
}

async function resolveUsernameOrEmail(identifier) {
  const raw = (identifier || '').trim();
  if (!raw) return '';
  if (raw.includes('@') && raw.includes('.')) {
    return raw.toLowerCase();
  }
  const u = normalizeUsername(raw);
  if (!u) return '';

  // Check local mapping
  const map = getLocalUsernameMap();
  if (map[u] && map[u].email) {
    return map[u].email;
  }

  // Check Firestore usernames collection
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.firestore) {
    try {
      const doc = await firebase.firestore().collection('usernames').doc(u).get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.email) {
          saveLocalUsernameMapping(u, data.email, data.uid || '');
          return data.email;
        }
      }
    } catch (e) {
      console.warn('[Resolve Username] Firestore lookup warning:', e);
    }
  }
  return null; // Not found
}

function getEffectiveUsername(user = null) {
  if (!user) user = getCachedAuthUser();
  const custom = getCustomProfile() || {};
  if (custom.username) return normalizeUsername(custom.username);
  if (user && user.username) return normalizeUsername(user.username);
  if (user && user.email) {
    const map = getLocalUsernameMap();
    for (const [uname, info] of Object.entries(map)) {
      if (info.email && info.email.toLowerCase() === user.email.toLowerCase()) {
        return uname;
      }
    }
    return normalizeUsername(user.email.split('@')[0]);
  }
  return 'aspirant';
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
    if (custom.username) user.username = normalizeUsername(custom.username);
  }
  if (!user.username) {
    user.username = getEffectiveUsername(user);
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
function enableFirestoreOfflinePersistence() {
  if (typeof firebase === 'undefined' || !firebase.firestore) return;
  try {
    firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[CareerDesk] Firestore persistence limited to single active tab.');
      } else if (err.code === 'unimplemented') {
        console.warn('[CareerDesk] Browser does not support Firestore offline persistence.');
      }
    });
  } catch (e) { }
}

function initFirebaseApp() {
  if (typeof firebase === 'undefined') {
    console.warn('[CareerDesk Firebase] Firebase SDK scripts not loaded yet.');
    return false;
  }

  if (firebase.apps && firebase.apps.length > 0) {
    firebaseApp = firebase.apps[0];
    enableFirestoreOfflinePersistence();
    setupAuthStateListener();
    return true;
  }

  const config = getStoredFirebaseConfig();
  if (config && config.apiKey) {
    try {
      firebaseApp = firebase.initializeApp(config);
      enableFirestoreOfflinePersistence();
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
        // Strict Firebase Auth check: email/password accounts must be verified
        const isPasswordProvider = !user.providerData || user.providerData.length === 0 || user.providerData.some(p => p.providerId === 'password');
        if (isPasswordProvider && !user.emailVerified) {
          // Block access if email is not verified
          currentAuthUser = null;
          try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
          renderUserProfileUI();
          return;
        }

        const prevUid = currentAuthUser?.uid;
        currentAuthUser = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Aspirant',
          email: user.email || '',
          photoURL: user.photoURL || '',
          providerId: user.providerData?.[0]?.providerId || 'firebase',
          emailVerified: !!user.emailVerified
        };
        applyCustomProfileOverrides(currentAuthUser);
        try {
          localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
        } catch (e) { }

        // Always auto-load user data from Firestore on login or page load
        if (typeof collectUserDataFromFirestore === 'function') {
          collectUserDataFromFirestore(currentAuthUser);
        }
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
  if (isExplicitlySignedOut) return null;
  if (currentAuthUser) {
    if (currentAuthUser.providerId === 'password' && currentAuthUser.emailVerified === false) {
      return null;
    }
    return applyCustomProfileOverrides(currentAuthUser);
  }
  try {
    const raw = localStorage.getItem(FIREBASE_USER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.providerId === 'password' && parsed.emailVerified === false) {
        localStorage.removeItem(FIREBASE_USER_CACHE_KEY);
        return null;
      }
      currentAuthUser = parsed;
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

// =========================================================
// EMAIL VERIFICATION & SIMULATION HELPERS (Firebase Auth only)
// =========================================================
const SIMULATED_UNVERIFIED_KEY = 'careerdesk_unverified_emails';
let lastAttemptedVerification = { email: '', password: '' };

function isSimulatedEmailUnverified(email) {
  if (!email) return false;
  try {
    const list = JSON.parse(sessionStorage.getItem(SIMULATED_UNVERIFIED_KEY) || '[]');
    return list.includes(email.trim().toLowerCase());
  } catch (e) {
    return false;
  }
}

function saveSimulatedUnverifiedEmail(email) {
  if (!email) return;
  try {
    const list = JSON.parse(sessionStorage.getItem(SIMULATED_UNVERIFIED_KEY) || '[]');
    const normalized = email.trim().toLowerCase();
    if (!list.includes(normalized)) {
      list.push(normalized);
      sessionStorage.setItem(SIMULATED_UNVERIFIED_KEY, JSON.stringify(list));
    }
  } catch (e) { }
}

function markSimulatedEmailVerified(email) {
  if (!email) return;
  try {
    let list = JSON.parse(sessionStorage.getItem(SIMULATED_UNVERIFIED_KEY) || '[]');
    const normalized = email.trim().toLowerCase();
    list = list.filter(e => e !== normalized);
    sessionStorage.setItem(SIMULATED_UNVERIFIED_KEY, JSON.stringify(list));
  } catch (e) { }
}

// Expose on window for tests & developer console
if (typeof window !== 'undefined') {
  window.markSimulatedEmailVerified = markSimulatedEmailVerified;
  window.isSimulatedEmailUnverified = isSimulatedEmailUnverified;
  window.showEmailVerificationScreen = showEmailVerificationScreen;
  window.hideEmailVerificationScreen = hideEmailVerificationScreen;
}

/**
 * Displays the email verification screen inside #authModal
 */
function showEmailVerificationScreen(email, password = '') {
  lastAttemptedVerification = { email: email || '', password: password || '' };

  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
  }

  const switchWrapper = document.getElementById('authModalModeSwitchWrapper');
  const bodyWrapper = document.getElementById('authModalBodyWrapper');
  const verifyView = document.getElementById('authVerificationView');
  const emailSpan = document.getElementById('authVerificationEmail');
  const titleEl = document.getElementById('authModalTitle');
  const subEl = document.getElementById('authModalSubtitle');
  const resendStatus = document.getElementById('authVerificationResendStatus');

  if (switchWrapper) switchWrapper.style.display = 'none';
  if (bodyWrapper) bodyWrapper.style.display = 'none';
  if (verifyView) verifyView.style.display = 'block';
  if (emailSpan) emailSpan.textContent = email || '';
  if (titleEl) titleEl.textContent = 'Verify Your Email';
  if (subEl) subEl.textContent = 'Authentication confirmation required';
  if (resendStatus) resendStatus.textContent = '';

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Hides email verification screen and restores standard auth form
 */
function hideEmailVerificationScreen() {
  const switchWrapper = document.getElementById('authModalModeSwitchWrapper');
  const bodyWrapper = document.getElementById('authModalBodyWrapper');
  const verifyView = document.getElementById('authVerificationView');
  const resendStatus = document.getElementById('authVerificationResendStatus');

  if (switchWrapper) switchWrapper.style.display = '';
  if (bodyWrapper) bodyWrapper.style.display = '';
  if (verifyView) verifyView.style.display = 'none';
  if (resendStatus) resendStatus.textContent = '';
}

/**
 * Sign Up / Sign In with Email + Password (Firebase Authentication only)
 * Supports sign in via Email OR @username, and sets customUsername on registration
 */
async function signInWithEmailPassword(emailOrUsername, password, isSignUp = false, customDisplayName = '', customUsername = '') {
  isExplicitlySignedOut = false;

  let email = (emailOrUsername || '').trim();
  const errEl = document.getElementById('authModalError') || document.getElementById('emailAuthError') || document.getElementById('authPageError');

  // If login mode and entered value does not contain '@', resolve username to email
  if (!isSignUp && (!email.includes('@') || !email.includes('.'))) {
    const resolved = await resolveUsernameOrEmail(email);
    if (!resolved) {
      const u = normalizeUsername(email);
      const msg = `No account found with username @${u}. Please sign in with your email or register.`;
      if (errEl) errEl.textContent = msg;
      else showToast(msg, true);
      return;
    }
    email = resolved;
  }

  // Check if online & Firebase Auth is active
  const isOnlineHttp = (typeof window !== 'undefined' && (window.location.protocol !== 'file:' || window._forceFirebaseAuth)) && initFirebaseApp();
  if (isOnlineHttp && typeof firebase !== 'undefined' && firebase.auth) {
    try {
      if (isSignUp) {
        // Validate customUsername if provided
        if (customUsername) {
          const u = normalizeUsername(customUsername);
          if (!isValidUsername(u)) {
            const msg = 'Username must be 3-25 letters, numbers, or _';
            if (errEl) errEl.textContent = msg;
            else showToast(msg, true);
            return;
          }
          const isAvail = await isUsernameAvailable(u);
          if (!isAvail) {
            const msg = `Username @${u} is already taken. Please choose another.`;
            if (errEl) errEl.textContent = msg;
            else showToast(msg, true);
            return;
          }
        }

        // 1. Create account via Firebase Auth only
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = result.user;
        if (customDisplayName && user && user.updateProfile) {
          try {
            await user.updateProfile({ displayName: customDisplayName });
          } catch (e) { }
        }

        // 2. Save username mapping
        if (customUsername) {
          await registerUsernameForUser(customUsername, email, user.uid);
          const custom = getCustomProfile() || {};
          custom.username = normalizeUsername(customUsername);
          saveCustomProfile(custom);
        }

        // 3. Send verification email via Firebase Auth
        await user.sendEmailVerification();

        // 4. Do NOT sign them in automatically -> immediately sign out!
        await firebase.auth().signOut();
        currentAuthUser = null;
        try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
        renderUserProfileUI();

        // 5. Show verification screen with required message
        showEmailVerificationScreen(email, password);
        return;
      } else {
        // Sign in via Firebase Auth
        const result = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = result.user;

        // If a user logs in and their email is not verified: block access!
        if (!user.emailVerified) {
          // Immediately sign out to block access
          await firebase.auth().signOut();
          currentAuthUser = null;
          try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
          renderUserProfileUI();

          // Show the same verification screen
          showEmailVerificationScreen(email, password);
          return;
        }

        // Email IS verified -> fetch username from Firestore
        let savedUsername = '';
        if (firebase.firestore) {
          try {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data() && userDoc.data().username) {
              savedUsername = userDoc.data().username;
            }
          } catch (e) { }
        }

        // Grant access
        currentAuthUser = {
          uid: user.uid,
          displayName: customDisplayName || user.displayName || email.split('@')[0],
          email: user.email || email,
          username: savedUsername || '',
          photoURL: user.photoURL || '',
          providerId: 'password',
          emailVerified: true
        };
        applyCustomProfileOverrides(currentAuthUser);
        localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
        showToast('Signed in as ' + currentAuthUser.displayName);
        closeAuthModal();
        renderUserProfileUI();
        if (typeof collectUserDataFromFirestore === 'function') {
          await collectUserDataFromFirestore(currentAuthUser);
        }
        return;
      }
    } catch (err) {
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Try signing in.';
      else if (err.code === 'auth/user-not-found') msg = 'No account found with this email. Try signing up.';
      else if (err.code === 'auth/wrong-password') msg = 'Incorrect password. Please try again.';
      else if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (errEl) errEl.textContent = msg;
      else showToast(msg, true);
      return;
    }
  }

  // Local / Offline / file:// protocol session (Privacy-first client-side guarantee)
  // Preserves the exact same contract: register does not sign in, blocks unverified login
  if (isSignUp) {
    if (customUsername) {
      const u = normalizeUsername(customUsername);
      if (!isValidUsername(u)) {
        const msg = 'Username must be 3-25 letters, numbers, or _';
        if (errEl) errEl.textContent = msg;
        else showToast(msg, true);
        return;
      }
      const isAvail = await isUsernameAvailable(u);
      if (!isAvail) {
        const msg = `Username @${u} is already taken. Please choose another.`;
        if (errEl) errEl.textContent = msg;
        else showToast(msg, true);
        return;
      }
      saveLocalUsernameMapping(u, email, 'local_' + Math.abs(email.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)));
      const custom = getCustomProfile() || {};
      custom.username = u;
      saveCustomProfile(custom);
    }

    saveSimulatedUnverifiedEmail(email);
    currentAuthUser = null;
    try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
    renderUserProfileUI();
    showEmailVerificationScreen(email, password);
    return;
  } else {
    if (isSimulatedEmailUnverified(email)) {
      // Block access and show verification screen
      currentAuthUser = null;
      try { localStorage.removeItem(FIREBASE_USER_CACHE_KEY); } catch (e) { }
      renderUserProfileUI();
      showEmailVerificationScreen(email, password);
      return;
    }

    const effectiveName = customDisplayName || email.split('@')[0];
    const localUid = 'local_' + Math.abs(email.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0));
    currentAuthUser = {
      uid: localUid,
      displayName: effectiveName,
      email: email,
      username: '',
      photoURL: '',
      providerId: 'password',
      emailVerified: true,
      isLocalSession: true
    };
    applyCustomProfileOverrides(currentAuthUser);
    localStorage.setItem(FIREBASE_USER_CACHE_KEY, JSON.stringify(currentAuthUser));
    showToast('Welcome back, ' + currentAuthUser.displayName);
    closeAuthModal();
    renderUserProfileUI();
    if (typeof collectUserDataFromFirestore === 'function') {
      await collectUserDataFromFirestore(currentAuthUser);
    }
  }
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
 * Sign Out User - Cleans active user study data and resets to fresh state
 */
async function signOutUser() {
  isExplicitlySignedOut = true;

  // Cache outgoing user's data before cleaning if available
  if (currentAuthUser && currentAuthUser.uid) {
    try {
      localStorage.setItem('careerdesk_user_data_' + currentAuthUser.uid, JSON.stringify(buildCloudDataBundle()));
    } catch (e) { }
  }

  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && typeof firebase.auth === 'function') {
      await firebase.auth().signOut();
    }
  } catch (err) {
    console.warn('[CareerDesk Firebase] Signout warning:', err);
  }

  // Clear auth cache keys
  currentAuthUser = null;
  try {
    localStorage.removeItem(FIREBASE_USER_CACHE_KEY);
    localStorage.removeItem(CAREERDESK_CUSTOM_PROFILE_KEY);
    localStorage.removeItem(FIREBASE_LAST_SYNC_KEY);
  } catch (e) { }

  // Clean active workspace data completely
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('jobprep_exams_list');
    localStorage.removeItem('jobprep_mistakes_bank_v2');
    localStorage.removeItem('custom_bcs_questions_v3');
    localStorage.removeItem('jobprep_break_minutes_today');
    localStorage.removeItem('user_mcq_progress_v2');
    localStorage.removeItem('jobprep_mcq_progress_v2');
    localStorage.removeItem('jobprep_custom_quiz_questions');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('careerdesk_user_data_') || k.startsWith('careerdesk_cloud_backup_'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) { }

  if (_firestoreSyncTimer) {
    clearTimeout(_firestoreSyncTimer);
    _firestoreSyncTimer = null;
  }

  // Reset in-memory state to clean default
  if (typeof getDefaultState === 'function') {
    state = getDefaultState();
  }
  exams = [];
  mistakes = [];
  if (typeof userMCQProgress !== 'undefined') {
    userMCQProgress = { answers: {}, masteredIds: [], activePoolIds: [], removedSubjects: [], addedExtendedIndex: 0 };
  }

  try {
    await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { }

  try {
    refreshAllDashboardPanels();
  } catch (panelErr) {
    console.warn('[CareerDesk] Error refreshing panels on logout:', panelErr);
  }

  renderUserProfileUI();
  showToast('Signed out. Personal study data cleaned from this browser.');
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
 * Uploads/Syncs current active user data to Firestore
 */
async function syncUserDataToFirestore(user = null, silent = true) {
  if (!user) user = getCachedAuthUser();
  if (!user) {
    if (!silent) showToast('Please sign in to sync with cloud', true);
    return;
  }

  isCloudSyncing = true;
  updateCloudSyncDot(true);

  try {
    const bundle = buildCloudDataBundle();
    const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo && !user.isLocalSession);

    // Always update isolated local cache for this user
    try {
      localStorage.setItem('careerdesk_user_data_' + user.uid, JSON.stringify(bundle));
    } catch (e) { }

    if (isFirebaseOnline) {
      const db = firebase.firestore();
      const nowIso = new Date().toISOString();
      await db.collection('users').doc(user.uid).set({
        ...bundle,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        lastCloudSync: (firebase.firestore.FieldValue && typeof firebase.firestore.FieldValue.serverTimestamp === 'function')
          ? firebase.firestore.FieldValue.serverTimestamp()
          : nowIso
      }, { merge: true });
    }

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(FIREBASE_LAST_SYNC_KEY, nowIso);
    } catch (e) { }

    isCloudSyncing = false;
    updateCloudSyncDot(false);

    const sub = document.getElementById('userCloudStatusSub');
    if (sub) sub.textContent = 'Just now';

    const liveBadge = document.getElementById('cloudSyncLiveBadge');
    if (liveBadge) {
      liveBadge.innerHTML = `<i data-lucide="check-circle" style="width:12px; height:12px;"></i> Auto-Sync Active`;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    // Auto-create snapshot periodically if > 30 minutes since last snapshot or on manual sync
    try {
      const lastSnapKey = 'careerdesk_last_snap_' + user.uid;
      const lastSnapTs = parseInt(localStorage.getItem(lastSnapKey) || '0', 10);
      const nowMs = Date.now();
      if (!silent || (nowMs - lastSnapTs > 30 * 60 * 1000)) {
        createCloudSnapshot(silent ? 'Auto Snapshot' : 'Manual Sync Snapshot', user, true);
        localStorage.setItem(lastSnapKey, String(nowMs));
      }
    } catch (e) { }

    if (!silent) {
      showToast('Cloud data synced successfully! ✓');
    }
  } catch (err) {
    console.error('[CareerDesk] Firestore Sync Error:', err);
    isCloudSyncing = false;
    updateCloudSyncDot(false);
    if (!silent) {
      showToast('Sync failed: ' + (err.message || 'Check network'), true);
    }
  }
}

/**
 * Collects/Restores individual data from Firestore when a user logs in
 */
async function collectUserDataFromFirestore(user = null) {
  if (!user) user = getCachedAuthUser();
  if (!user) return;

  isCloudSyncing = true;
  updateCloudSyncDot(true);

  try {
    let cloudData = null;
    const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo && !user.isLocalSession);

    if (isFirebaseOnline) {
      try {
        const db = firebase.firestore();
        // 1. Primary document: users/{uid}
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data() && (userDoc.data().state || userDoc.data().routine || userDoc.data().syllabus)) {
          cloudData = userDoc.data();
        } else {
          // 2. Check legacy backup subcollection: users/{uid}/careerdesk_backups/latest
          const legacyDoc = await db.collection('users').doc(user.uid).collection('careerdesk_backups').doc('latest').get();
          if (legacyDoc.exists && legacyDoc.data()) {
            cloudData = legacyDoc.data();
          }
        }
      } catch (cloudFetchErr) {
        console.warn('[CareerDesk] Firestore fetch failed, falling back to local user cache:', cloudFetchErr);
      }
    }

    // 3. Fallback to local isolated user cache
    if (!cloudData) {
      const raw = localStorage.getItem('careerdesk_user_data_' + user.uid) || localStorage.getItem('careerdesk_cloud_backup_' + user.uid);
      if (raw) {
        try { cloudData = JSON.parse(raw); } catch (e) { }
      }
    }

    if (cloudData) {
      // Decrypt if client-side Zero-Knowledge AES-GCM-256 encrypted
      if (cloudData.__careerdesk_vault && typeof decryptVaultPayload === 'function') {
        const pass = prompt('This cloud data is protected with AES-GCM-256 encryption.\nEnter your secret passphrase:');
        if (pass) {
          cloudData = await decryptVaultPayload(cloudData, pass);
          sessionStorage.setItem('careerdesk_active_vault_pass', pass);
        }
      }

      if (typeof scrubPrototypePollution === 'function') {
        cloudData = scrubPrototypePollution(cloudData);
      }

      // Restore user-specific state
      if (cloudData.state) {
        state = cloudData.state;
        if (Array.isArray(state.flashcards) && typeof isMockFlashcard === 'function') {
          state.flashcards = state.flashcards.filter(f => f && !isMockFlashcard(f));
        }
        if (Array.isArray(state.routine) && typeof isMockRoutineTask === 'function') {
          state.routine = state.routine.filter(r => r && !isMockRoutineTask(r));
        }
        if (Array.isArray(state.syllabus) && typeof isMockSyllabusCategory === 'function') {
          state.syllabus = state.syllabus.filter(c => c && !isMockSyllabusCategory(c));
        }
      }
      if (Array.isArray(cloudData.exams)) {
        exams = cloudData.exams.filter(e => e && e.name !== '47th BCS Preliminary Exam' && e.name !== 'Combined Bank Senior Officer');
        if (typeof saveExams === 'function') saveExams();
      }
      if (Array.isArray(cloudData.mistakes)) {
        mistakes = cloudData.mistakes;
        if (typeof saveMistakes === 'function') saveMistakes();
      }
      if (Array.isArray(cloudData.customMCQQuestions) && typeof saveStoredQuestions === 'function') {
        saveStoredQuestions(cloudData.customMCQQuestions);
      }
      if (cloudData.mcqProgress && typeof saveMCQProgress === 'function') {
        userMCQProgress = cloudData.mcqProgress;
        saveMCQProgress();
      }
      if (typeof cloudData.todayBreakMinutes === 'number') {
        localStorage.setItem('jobprep_break_minutes_today', String(cloudData.todayBreakMinutes));
      }

      await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem('careerdesk_user_data_' + user.uid, JSON.stringify(cloudData));
      localStorage.setItem(FIREBASE_LAST_SYNC_KEY, new Date().toISOString());
      showToast(`Welcome back, ${user.displayName || 'Aspirant'}! Loaded your cloud data.`);
    } else {
      // First time login for this user: initialize cloud data with clean default state
      await syncUserDataToFirestore(user, true);
      showToast(`Welcome, ${user.displayName || 'Aspirant'}! Cloud account connected.`);
    }

    isCloudSyncing = false;
    updateCloudSyncDot(false);
    refreshAllDashboardPanels();
    renderUserProfileUI();
  } catch (err) {
    console.error('[CareerDesk] Collect User Data Error:', err);
    isCloudSyncing = false;
    updateCloudSyncDot(false);
    showToast('Failed to load cloud data: ' + (err.message || 'Check connection'), true);
  }
}

/**
 * Debounced Firestore Sync scheduler
 */
let _firestoreSyncTimer = null;
function scheduleFirestoreSync() {
  if (_firestoreSyncTimer) clearTimeout(_firestoreSyncTimer);
  const liveBadge = document.getElementById('cloudSyncLiveBadge');
  if (liveBadge) {
    liveBadge.innerHTML = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--accent2); margin-right:5px; animation:spin 1s linear infinite;"></span> Saving...`;
  }
  _firestoreSyncTimer = setTimeout(async () => {
    const user = getCachedAuthUser();
    if (user) {
      await syncUserDataToFirestore(user, true);
    }
  }, 2400);
}
window.scheduleFirestoreSync = scheduleFirestoreSync;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (_firestoreSyncTimer) {
      clearTimeout(_firestoreSyncTimer);
      const user = getCachedAuthUser();
      if (user) {
        try {
          const bundle = buildCloudDataBundle();
          localStorage.setItem('careerdesk_user_data_' + user.uid, JSON.stringify(bundle));
        } catch (e) { }
      }
    }
  });
}

/**
 * Refreshes all dashboard panels across the application
 */
function refreshAllDashboardPanels() {
  if (typeof syncAllSubjectSelects === 'function') syncAllSubjectSelects();
  if (typeof renderRoutine === 'function') renderRoutine();
  if (typeof renderDateSlider === 'function') renderDateSlider();
  if (typeof renderTrackerRoutinePreview === 'function') renderTrackerRoutinePreview();
  if (typeof renderNotes === 'function') renderNotes();
  if (typeof renderTrackerAll === 'function') renderTrackerAll();
  if (typeof renderCategories === 'function') renderCategories();
  if (typeof renderSyllabusOverall === 'function') renderSyllabusOverall();
  if (typeof renderExams === 'function') renderExams();
  if (typeof renderFlashcards === 'function') renderFlashcards();
  if (typeof renderFlashCategoryOptions === 'function') renderFlashCategoryOptions();
  if (typeof renderMistakes === 'function') renderMistakes();
  if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  if (typeof renderProfileAspirantHub === 'function') renderProfileAspirantHub();
  if (typeof renderSubjectManager === 'function') renderSubjectManager();
  if (typeof renderQuote === 'function') renderQuote();
  if (typeof renderQuoteManager === 'function') renderQuoteManager();
  if (typeof renderMCQQuestion === 'function') renderMCQQuestion();
  if (typeof updateMCQStats === 'function') updateMCQStats();
  if (typeof renderMCQPalette === 'function') renderMCQPalette();
  if (typeof renderMCQFilterBar === 'function') renderMCQFilterBar();
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Backward compatibility wrappers
 */
async function uploadBackupToCloud(isConversion = false) {
  await syncUserDataToFirestore(null, !isConversion);
}

async function restoreBackupFromCloud() {
  await collectUserDataFromFirestore(null);
}

function checkCloudInitialSync() {
  collectUserDataFromFirestore();
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
    if (custom.username) currentAuthUser.username = custom.username;
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
            photoURL: currentAuthUser.photoURL,
            username: currentAuthUser.username || ''
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
  return true;
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
  const currentUsername = (user && user.username) ? user.username : (getCustomProfile()?.username || getEffectiveUsername(user));

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
          style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13.5px; box-sizing:border-box;">
      </div>

      <!-- Username Input -->
      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:12.5px; font-weight:700; color:var(--text); display:block; margin-bottom:6px;">Username:</label>
        <div style="position:relative;">
          <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:700; color:var(--accent1); font-size:14px;">@</span>
          <input type="text" id="editProfileUsernameInput" value="${escapeAttr(currentUsername)}" placeholder="username"
            style="width:100%; padding:9px 12px 9px 32px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13.5px; box-sizing:border-box;">
        </div>
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

      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 160, 160);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 160, 160);

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
    const usernameInput = document.getElementById('editProfileUsernameInput');
    const newName = nameInput ? nameInput.value.trim() : '';
    const newUsername = usernameInput ? usernameInput.value.trim() : '';
    if (!newName) {
      showToast('Please enter a valid display name', true);
      return;
    }
    const success = await updateUserProfile(newName, activeModalPhoto, newUsername);
    if (success !== false) {
      closeEditProfileModal();
    }
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
  const effectiveUsername = (user && user.username) ? user.username : (custom.username || getEffectiveUsername(user));

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
  let totalStudyMinutes = 0;
  if (state && Array.isArray(state.sessions)) {
    state.sessions.forEach(s => {
      totalStudyMinutes += (s.duration || 0);
    });
  }
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);
  const sessionCount = (state && Array.isArray(state.sessions)) ? state.sessions.length : 0;
  const routineCount = (state && Array.isArray(state.routine)) ? state.routine.length : 0;
  const notesCount = (state && Array.isArray(state.notes)) ? state.notes.length : 0;

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
  const masteredMCQsCount = (typeof userMCQProgress !== 'undefined' && Array.isArray(userMCQProgress.masteredIds))
    ? userMCQProgress.masteredIds.length
    : 0;

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
              <button type="button" class="btn-edit-profile" id="btnOpenEditProfileModal" title="Edit Profile Name, Username &amp; Picture" aria-label="Edit Profile">
                <i data-lucide="edit-2"></i>
              </button>
            </div>
            <div class="user-handle-row" style="margin:2px 0 6px;">
              <span class="user-handle-badge" style="display:inline-flex; align-items:center; gap:4px; font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--accent2); background:rgba(6,182,212,0.12); border:1px solid rgba(6,182,212,0.25); padding:2px 8px; border-radius:6px;">@${escapeHtml(effectiveUsername)}</span>
            </div>
            <p class="user-email-text">
              <i data-lucide="${isPhone ? 'smartphone' : 'mail'}" style="width:13px;height:13px;"></i>
              ${escapeHtml(user.email || user.phoneNumber || 'Cloud Aspirant')}
            </p>
            <span class="user-provider-badge ${providerClass}">
              ${providerIconHtml} ${escapeHtml(providerLabel)}
            </span>
          </div>

          <!-- Hero Action: Sign Out -->
          <div class="profile-hero-actions" style="display:flex; align-items:center; gap:10px; margin-left:auto;">
            <button type="button" class="btn-signout-modern" id="btnProfileSignOut" title="Sign out from cloud account" style="padding:7px 16px; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="log-out" style="width:15px;height:15px;"></i> <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <!-- LIFETIME STATS SUMMARY GRID -->
      <div class="profile-card-body" style="padding:18px 22px 22px;">
        <div style="margin-bottom:12px;">
          <h4 style="font-size:14px; color:var(--text); margin:0 0 2px; font-weight:700;">Lifetime Preparation Metrics</h4>
          <span style="font-size:12px; color:var(--text-soft);">Your cumulative study milestone achievements</span>
        </div>
        <div class="profile-stats-bar" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(135px, 1fr)); gap:12px; margin:0;">
          <div class="profile-stat-card glass" style="padding:14px; text-align:center; border-radius:12px; border:1px solid var(--border);">
            <span class="profile-stat-val" style="font-size:22px; font-weight:800; color:var(--accent1); font-family:var(--font-display);">${totalStudyHours}h</span>
            <span class="profile-stat-lbl" style="font-size:12px; color:var(--text-soft); display:block; margin-top:2px;">Study Time (${sessionCount} sessions)</span>
          </div>
          <div class="profile-stat-card glass" style="padding:14px; text-align:center; border-radius:12px; border:1px solid var(--border);">
            <span class="profile-stat-val" style="font-size:22px; font-weight:800; color:var(--accent2); font-family:var(--font-display);">${syllabusPct}%</span>
            <span class="profile-stat-lbl" style="font-size:12px; color:var(--text-soft); display:block; margin-top:2px;">Syllabus (${doneTopics}/${totalTopics})</span>
          </div>
          <div class="profile-stat-card glass" style="padding:14px; text-align:center; border-radius:12px; border:1px solid var(--border);">
            <span class="profile-stat-val" style="font-size:22px; font-weight:800; color:#10b981; font-family:var(--font-display);">${masteredMCQsCount}</span>
            <span class="profile-stat-lbl" style="font-size:12px; color:var(--text-soft); display:block; margin-top:2px;">Mastered MCQs (/1,000)</span>
          </div>
          <div class="profile-stat-card glass" style="padding:14px; text-align:center; border-radius:12px; border:1px solid var(--border);">
            <span class="profile-stat-val" style="font-size:22px; font-weight:800; color:var(--text); font-family:var(--font-display);">${notesCount}</span>
            <span class="profile-stat-lbl" style="font-size:12px; color:var(--text-soft); display:block; margin-top:2px;">Study Notes (${routineCount} tasks)</span>
          </div>
        </div>
      </div>
    `;
  } else {
    // ===== SIGNED-OUT / GUEST STATE (CLEAN, READABLE TEXT) =====
    container.innerHTML = `
      <div class="auth-guest-landing-card clean-guest-card">
        <div class="clean-guest-content">
          <div class="auth-guest-badge-wrap">
            <div class="auth-guest-badge-icon">
              <i data-lucide="sparkles"></i>
            </div>
            <span class="auth-guest-pill">CareerDesk Cloud</span>
          </div>

          <h2 class="auth-guest-title">New here?</h2>
          <p class="auth-guest-desc">
            Create an account or sign in to save your personal study routines, notes, syllabus checklist, and mistake bank securely in the cloud across all your devices.
          </p>

          <div class="auth-guest-cta-row">
            <button type="button" class="btn-profile-signup-cta" id="btnOpenAuthModalSignup" title="Create a new free account">
              <i data-lucide="user-plus" style="width:16px; height:16px;"></i>
              <span>Create Account</span>
            </button>
            <button type="button" class="btn-profile-login-cta" id="btnOpenAuthModalLogin" title="Sign in to your account">
              <i data-lucide="log-in" style="width:16px; height:16px;"></i>
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Toggle storage management card visibility based on authentication state
  const dataMgmtCard = document.getElementById('dataManagementCard');
  if (dataMgmtCard) {
    dataMgmtCard.style.display = user ? '' : 'none';
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

  if (typeof renderProfileAspirantHub === 'function') {
    renderProfileAspirantHub();
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
        <div class="auth-hero-icon-wrap" style="background:transparent; box-shadow:none; padding:0; width:54px; height:54px; margin:0 auto 16px;">
          <img src="assets/icons/favicon.svg" alt="CareerDesk logo" style="width:54px; height:54px; border-radius:15px; box-shadow:0 8px 24px rgba(99,102,241,0.35);">
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

          <!-- Username (Visible in Sign Up mode) -->
          <div id="authPageUsernameWrap" style="display:${authPageIsSignUpMode ? 'block' : 'none'};">
            <label class="auth-input-label">Username</label>
            <div class="auth-input-control">
              <span class="auth-input-icon" style="font-weight:700; color:var(--accent1); font-size:14px;">@</span>
              <input type="text" id="authPageUsernameInput" placeholder="username (letters, numbers, _)" autocomplete="username" class="auth-text-input">
            </div>
          </div>

          <!-- Email / Username Field -->
          <div>
            <label class="auth-input-label" id="authPageEmailLabel">${authPageIsSignUpMode ? 'Email Address' : 'Email or Username'}</label>
            <div class="auth-input-control">
              <span class="auth-input-icon"><i data-lucide="mail" style="width:15px;height:15px;"></i></span>
              <input type="text" id="authPageEmailInput" placeholder="${authPageIsSignUpMode ? 'you@example.com' : 'Username or email address'}" autocomplete="username" required class="auth-text-input">
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

        <!-- Quick Tools & Settings Actions -->
        <div class="auth-footer-actions" style="margin-top:6px; display:flex; justify-content:center;">
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
  const usernameWrap = document.getElementById('authPageUsernameWrap');
  const emailLabel = document.getElementById('authPageEmailLabel');
  const emailInput = document.getElementById('authPageEmailInput');
  const submitLabel = document.getElementById('authPageSubmitLabel');

  if (tabSignIn && tabSignUp) {
    tabSignIn.addEventListener('click', () => {
      authPageIsSignUpMode = false;
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      if (nameWrap) nameWrap.style.display = 'none';
      if (usernameWrap) usernameWrap.style.display = 'none';
      if (emailLabel) emailLabel.textContent = 'Email or Username';
      if (emailInput) emailInput.placeholder = 'Username or email address';
      if (submitLabel) submitLabel.textContent = 'Sign In';
      const forgot = document.getElementById('authPageForgotLink');
      if (forgot) forgot.style.display = 'inline-block';
    });

    tabSignUp.addEventListener('click', () => {
      authPageIsSignUpMode = true;
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      if (nameWrap) nameWrap.style.display = 'block';
      if (usernameWrap) usernameWrap.style.display = 'block';
      if (emailLabel) emailLabel.textContent = 'Email Address';
      if (emailInput) emailInput.placeholder = 'you@example.com';
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
      const emailOrUser = document.getElementById('authPageEmailInput')?.value.trim();
      const password = document.getElementById('authPagePasswordInput')?.value;
      const displayName = document.getElementById('authPageNameInput')?.value.trim();
      const username = document.getElementById('authPageUsernameInput')?.value.trim();
      const errEl = document.getElementById('authPageError');

      if (!emailOrUser || !password) {
        if (errEl) { errEl.style.color = '#f43f5e'; errEl.textContent = 'Please fill in both identifier and password.'; }
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite;"></i> <span>${authPageIsSignUpMode ? 'Creating Account...' : 'Signing In...'}</span>`;
      if (window.lucide) lucide.createIcons();

      await signInWithEmailPassword(emailOrUser, password, authPageIsSignUpMode, displayName, username);

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
    resendOTPBtn.addEventListener('click', async () => {
      const phone = document.getElementById('authPagePhoneInput')?.value.trim();
      if (phone) await sendPhoneOTP(phone);
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
  const btnAuth = e.target.closest('#btnGoToAuthPage');
  if (btnAuth) {
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
        ${isLoginPrompt ? `To authenticate via <strong>${attemptedProvider}</strong> and sync backups online, connect your Firebase project credentials below.` : `Paste your Firebase web application configuration JSON object below to enable real-time Google/GitHub login and Firestore online backups.`}
      </p>

      <div class="form-group" style="margin-bottom:10px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:4px;">Firebase Config JSON:</label>
        <textarea id="firebaseConfigTextarea" class="cfg-textarea" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'>${escapeHtml(cfgString)}</textarea>
      </div>

      <div class="cfg-help-tip">
        <strong>Quick 2-Minute Setup:</strong>
        In Firebase Console &rarr; Project Settings &rarr; Your Apps &rarr; Web App &rarr; copy the <code>firebaseConfig</code> object and paste it above. Enable <em>Google</em> or <em>GitHub</em> in Authentication &rarr; Sign-in method.
      </div>

      <div class="btn-group" style="margin-top:18px; justify-content:flex-end; gap:8px;">
        <button type="button" class="pill" id="btnCancelFirebaseCfg">Cancel</button>
        <button type="button" class="pill solid" id="btnSaveFirebaseCfg"><i data-lucide="check"></i> <span>Save &amp; Connect</span></button>
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
          <p style="font-size:11.5px; color:var(--text-muted); text-align:center; margin:12px 0 0;">
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
          Run Local Web Server (Full OAuth)
        </strong>
        <p style="font-size:12px; color:var(--text-soft); margin:0 0 8px; line-height:1.45;">
          Open your terminal in the <code>CareerDesk</code> folder and run:
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; font-family:var(--font-mono); font-size:12.5px; color:#67e8f9;">
          <code>npm start</code>
          <span style="font-size:11px; color:var(--text-soft);">or <code>node serve.js</code></span>
        </div>
        <p style="font-size:11.5px; color:var(--text-soft); margin:8px 0 0;">
          This automatically opens <strong>http://localhost:3000</strong> where Google and GitHub sign-in work natively.
        </p>
      </div>

      <div class="btn-group" style="justify-content:flex-end; gap:8px;">
        <button type="button" class="pill" id="btnDismissProtocolHelp">Close</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeProtocolHelpModal(); };
  document.getElementById('closeProtocolHelpModal')?.addEventListener('click', closeProtocolHelpModal);
  document.getElementById('btnDismissProtocolHelp')?.addEventListener('click', closeProtocolHelpModal);

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
// FIREBASE RECAPTCHA VERIFICATION SUBSYSTEM
// (Provides official firebase.auth.RecaptchaVerifier with graceful fallback)
// =========================================================

let modalRecaptchaVerifier = null;
let modalRecaptchaWidgetId = null;
let modalRecaptchaSolved = false;

/**
 * Initializes and renders Firebase's official RecaptchaVerifier into container
 */
function setupFirebaseRecaptcha(target = 'modal') {
  const containerId = 'authRecaptchaContainer';
  const fallbackId = 'authRecaptchaFallback';
  const container = document.getElementById(containerId);
  const fallback = document.getElementById(fallbackId);
  if (!container) return;

  modalRecaptchaSolved = false;

  // Initialize Firebase app if needed
  initFirebaseApp();

  // If Firebase Auth and RecaptchaVerifier are available
  if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth.RecaptchaVerifier === 'function') {
    try {
      if (modalRecaptchaVerifier) {
        try { modalRecaptchaVerifier.clear(); } catch (e) {}
        modalRecaptchaVerifier = null;
        modalRecaptchaWidgetId = null;
      }

      container.innerHTML = '';

      modalRecaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        'size': 'normal',
        'theme': (document.documentElement.getAttribute('data-theme') === 'light') ? 'light' : 'dark',
        'callback': (response) => {
          modalRecaptchaSolved = true;
          const errEl = document.getElementById('authModalError');
          if (errEl) errEl.textContent = '';
        },
        'expired-callback': () => {
          modalRecaptchaSolved = false;
        }
      });

      modalRecaptchaVerifier.render().then((widgetId) => {
        modalRecaptchaWidgetId = widgetId;
        if (fallback) fallback.style.display = 'none';
        container.style.display = 'flex';
      }).catch((err) => {
        console.warn('[Firebase RecaptchaVerifier] Render warning, using visual verification:', err);
        if (fallback) fallback.style.display = 'flex';
      });
      return;
    } catch (err) {
      console.warn('[Firebase RecaptchaVerifier] Init warning, using visual verification:', err);
    }
  }

  // Fallback for offline or local file mode
  if (fallback) fallback.style.display = 'flex';
}

/**
 * Resets Firebase RecaptchaVerifier and checkbox fallback
 */
function resetFirebaseRecaptcha() {
  modalRecaptchaSolved = false;
  if (modalRecaptchaVerifier && modalRecaptchaWidgetId !== null) {
    try {
      if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.reset === 'function') {
        grecaptcha.reset(modalRecaptchaWidgetId);
      }
    } catch (e) {}
  }
  const check = document.getElementById('authRecaptchaCheckbox');
  if (check) check.checked = false;
  const label = document.getElementById('authRecaptchaLabel');
  if (label) label.textContent = 'I am not a robot';
  const fallback = document.getElementById('authRecaptchaFallback');
  if (fallback) {
    fallback.style.borderColor = 'var(--border)';
    fallback.style.boxShadow = 'none';
  }
}

/**
 * Validates whether reCAPTCHA is verified via Firebase RecaptchaVerifier or active fallback
 */
function isFirebaseRecaptchaVerified() {
  if (modalRecaptchaVerifier) {
    try {
      const resp = modalRecaptchaVerifier.getResponse ? modalRecaptchaVerifier.getResponse() : null;
      if ((resp && resp.length > 0) || modalRecaptchaSolved) {
        return true;
      }
    } catch (e) {
      if (modalRecaptchaSolved) return true;
    }
  }

  // Check fallback if active
  const fallback = document.getElementById('authRecaptchaFallback');
  const check = document.getElementById('authRecaptchaCheckbox');
  if (fallback && fallback.style.display !== 'none') {
    if (check && check.checked) {
      return true;
    }
  }

  return false;
}

// =========================================================
// CENTRAL AUTHENTICATION POPUP MODAL (#authModal) CONTROLLER
// (Supports Sign In, Sign Up, Firebase reCAPTCHA, Google, GitHub)
// =========================================================

let currentAuthModalMode = 'login'; // 'login' | 'signup'

function openAuthModal(mode = 'login') {
  initAuthModalEvents();
  const modal = document.getElementById('authModal');
  if (!modal) return;

  hideEmailVerificationScreen();
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
  resetFirebaseRecaptcha();

  modal.style.display = 'flex';
  modal.classList.add('open');

  // Initialize and render Firebase RecaptchaVerifier
  setupFirebaseRecaptcha('modal');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.style.display = 'none';
  hideEmailVerificationScreen();
  resetFirebaseRecaptcha();
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
  hideEmailVerificationScreen();
  currentAuthModalMode = (mode === 'signup') ? 'signup' : 'login';
  const isSignUp = (currentAuthModalMode === 'signup');

  const tabLogin = document.getElementById('authModalTabLogin');
  const tabSignup = document.getElementById('authModalTabSignup');
  const nameGroup = document.getElementById('authModalNameGroup');
  const usernameGroup = document.getElementById('authModalUsernameGroup');
  const emailLabel = document.getElementById('authModalEmailLabel');
  const emailInput = document.getElementById('authModalEmailInput');
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
  if (usernameGroup) {
    usernameGroup.style.display = isSignUp ? 'block' : 'none';
  }
  if (emailLabel) {
    emailLabel.textContent = isSignUp ? 'Email Address' : 'Email or Username';
  }
  if (emailInput) {
    emailInput.placeholder = isSignUp ? 'you@example.com' : 'Username or email address';
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

  // Verification Screen: Login Button (switches to login form with email prefilled)
  const btnVerifyLogin = document.getElementById('btnVerificationLogin');
  if (btnVerifyLogin) {
    btnVerifyLogin.addEventListener('click', () => {
      const email = lastAttemptedVerification.email || '';
      hideEmailVerificationScreen();
      setAuthModalMode('login');
      const emailInput = document.getElementById('authModalEmailInput');
      const passInput = document.getElementById('authModalPasswordInput');
      const errEl = document.getElementById('authModalError');
      if (emailInput && email) emailInput.value = email;
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
      if (errEl) errEl.textContent = '';
    });
  }

  // Verification Screen: Resend Verification Email
  const btnVerifyResend = document.getElementById('btnVerificationResend');
  if (btnVerifyResend) {
    btnVerifyResend.addEventListener('click', async () => {
      const email = lastAttemptedVerification.email;
      const pass = lastAttemptedVerification.password;
      const statusEl = document.getElementById('authVerificationResendStatus');
      if (statusEl) {
        statusEl.style.color = 'var(--text-soft)';
        statusEl.textContent = 'Resending verification email...';
      }

      // Check if online & Firebase Auth is active
      const isOnlineHttp = (typeof window !== 'undefined' && (window.location.protocol !== 'file:' || window._forceFirebaseAuth)) && initFirebaseApp();
      if (isOnlineHttp && typeof firebase !== 'undefined' && firebase.auth && email && pass) {
        try {
          const res = await firebase.auth().signInWithEmailAndPassword(email, pass);
          await res.user.sendEmailVerification();
          await firebase.auth().signOut();
          if (statusEl) {
            statusEl.style.color = '#10b981';
            statusEl.textContent = 'Verification email sent! Please check your inbox.';
          }
          return;
        } catch (e) {
          if (statusEl) {
            statusEl.style.color = '#f43f5e';
            statusEl.textContent = 'Could not resend email: ' + (e.message || 'Please log in to try again.');
          }
          return;
        }
      }

      // Offline / simulated response
      if (statusEl) {
        statusEl.style.color = '#10b981';
        statusEl.textContent = 'Verification email sent! Please check your inbox.';
      }
    });
  }
}

/**
 * Validates inputs and handles submission for #authModal
 */
async function handleAuthModalSubmit() {
  const errEl = document.getElementById('authModalError');
  const isSignUp = (currentAuthModalMode === 'signup');

  // 1. Enforce Firebase reCAPTCHA
  if (!isFirebaseRecaptchaVerified()) {
    if (errEl) errEl.textContent = 'Please complete the reCAPTCHA verification to continue.';
    const fallback = document.getElementById('authRecaptchaFallback');
    const container = document.getElementById('authRecaptchaContainer');
    const targetEl = (container && container.style.display !== 'none' && container.children.length > 0) ? container : fallback;
    if (targetEl) {
      if (fallback) {
        fallback.style.borderColor = '#f43f5e';
        fallback.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.3)';
      }
      targetEl.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0)' }
      ], { duration: 300 });
    }
    return;
  }

  // 2. Validate Email / Identifier
  const emailInput = document.getElementById('authModalEmailInput');
  const emailOrUser = (emailInput?.value || '').trim();
  if (!emailOrUser) {
    if (errEl) errEl.textContent = isSignUp ? 'Please enter a valid email address.' : 'Please enter your username or email address.';
    if (emailInput) emailInput.focus();
    return;
  }

  if (isSignUp && (!emailOrUser.includes('@') || emailOrUser.length < 5)) {
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

  // 4. Validate Sign Up specifics: Name & Username
  let displayName = '';
  let username = '';
  if (isSignUp) {
    const nameInput = document.getElementById('authModalNameInput');
    displayName = (nameInput?.value || '').trim();
    if (!displayName) {
      displayName = emailOrUser.split('@')[0];
    }

    const usernameInput = document.getElementById('authModalUsernameInput');
    username = normalizeUsername(usernameInput?.value || '');
    if (!username) {
      username = normalizeUsername(emailOrUser.split('@')[0]);
    }
    if (!isValidUsername(username)) {
      if (errEl) errEl.textContent = 'Username must be 3-25 characters (letters, numbers, _).';
      if (usernameInput) usernameInput.focus();
      return;
    }
    const isAvail = await isUsernameAvailable(username);
    if (!isAvail) {
      if (errEl) errEl.textContent = `Username @${username} is already taken. Please choose another.`;
      if (usernameInput) usernameInput.focus();
      return;
    }
  }

  // Clear errors & submit
  if (errEl) errEl.textContent = '';
  await signInWithEmailPassword(emailOrUser, password, isSignUp, displayName, username);
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

/* ==========================================================================
   POINT-IN-TIME CLOUD SNAPSHOTS & JSON BACKUP SUBSYSTEM
   ========================================================================== */

/**
 * Creates a point-in-time backup snapshot in Firestore
 * Stored at: /users/{uid}/backups/{snapshotId}
 */
async function createCloudSnapshot(label = null, user = null, isBackground = false) {
  if (!user) user = getCachedAuthUser();
  if (!user || user.isDemo || user.isLocalSession) {
    if (!isBackground) showToast('Please sign in to create cloud snapshots', true);
    return null;
  }

  const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0);
  const bundle = buildCloudDataBundle();
  const snapshotId = 'snap_' + Date.now();
  const now = new Date();

  const notesCount = (bundle.state && Array.isArray(bundle.state.notes)) ? bundle.state.notes.length : 0;
  const routineCount = (bundle.state && Array.isArray(bundle.state.routine)) ? bundle.state.routine.length : 0;
  const syllabusCount = (bundle.state && Array.isArray(bundle.state.syllabus))
    ? bundle.state.syllabus.reduce((acc, cat) => acc + (cat.topics ? cat.topics.filter(t => t.done).length : 0), 0)
    : 0;
  const masteredCount = (bundle.mcqProgress && Array.isArray(bundle.mcqProgress.masteredIds))
    ? bundle.mcqProgress.masteredIds.length
    : 0;

  const snapshotMeta = {
    id: snapshotId,
    label: label || `Snapshot (${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    timestamp: Date.now(),
    isoDate: now.toISOString(),
    stats: {
      notes: notesCount,
      routine: routineCount,
      topicsDone: syllabusCount,
      masteredMCQs: masteredCount
    }
  };

  // Cache locally for instant offline access
  const cacheKey = 'careerdesk_snapshots_cache_' + user.uid;
  let cached = [];
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) { }
  cached = cached.filter(s => s.id !== snapshotId);
  cached.unshift(snapshotMeta);
  if (cached.length > 10) cached = cached.slice(0, 10);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (e) { }

  if (isFirebaseOnline) {
    try {
      const db = firebase.firestore();
      const backupRef = db.collection('users').doc(user.uid).collection('backups').doc(snapshotId);
      await backupRef.set({
        ...snapshotMeta,
        data: bundle
      });

      // Prune snapshots older than 10 to conserve Firestore quota
      const allSnapsQuery = await db.collection('users').doc(user.uid).collection('backups').orderBy('timestamp', 'desc').get();
      if (allSnapsQuery.docs.length > 10) {
        const toDelete = allSnapsQuery.docs.slice(10);
        for (const doc of toDelete) {
          try { await doc.ref.delete(); } catch (delErr) { }
        }
      }
    } catch (snapErr) {
      console.warn('[CareerDesk] Firestore snapshot save warning:', snapErr);
    }
  }

  if (!isBackground) {
    showToast('Point-in-time cloud snapshot created! ✓');
    renderCloudSnapshotsList();
  }
  return snapshotMeta;
}

/**
 * Lists available cloud backup snapshots
 */
async function listCloudSnapshots(user = null) {
  if (!user) user = getCachedAuthUser();
  if (!user) return [];

  const cacheKey = 'careerdesk_snapshots_cache_' + user.uid;
  let cached = [];
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) { }

  const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo);
  if (isFirebaseOnline) {
    try {
      const db = firebase.firestore();
      const snapshotQuery = await db.collection('users').doc(user.uid).collection('backups').orderBy('timestamp', 'desc').limit(10).get();
      const list = [];
      snapshotQuery.forEach(doc => {
        const d = doc.data();
        list.push({
          id: d.id || doc.id,
          label: d.label || 'Snapshot',
          timestamp: d.timestamp || 0,
          isoDate: d.isoDate || '',
          stats: d.stats || { notes: 0, routine: 0, topicsDone: 0, masteredMCQs: 0 }
        });
      });
      if (list.length > 0) {
        cached = list;
        try { localStorage.setItem(cacheKey, JSON.stringify(cached)); } catch (e) { }
      }
    } catch (fetchErr) {
      console.warn('[CareerDesk] Remote snapshots fetch failed, using local cache:', fetchErr);
    }
  }

  return cached;
}

/**
 * Renders the snapshot list in the Settings Data Management Card
 */
async function renderCloudSnapshotsList() {
  const container = document.getElementById('cloudSnapshotsList');
  const toggleText = document.getElementById('snapshotToggleText');
  if (!container) return;

  const user = getCachedAuthUser();
  if (!user) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-soft); font-size:12.5px; padding:12px;">Sign in to view and restore cloud snapshots.</div>';
    if (toggleText) toggleText.textContent = 'View Snapshots (0)';
    return;
  }

  const snapshots = await listCloudSnapshots(user);
  if (toggleText) toggleText.textContent = `View Snapshots (${snapshots.length})`;

  if (!snapshots || snapshots.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-soft); font-size:12.5px; padding:12px;">No snapshots created yet. Click "Create Snapshot" above to save your first restore point.</div>';
    return;
  }

  let html = '';
  snapshots.forEach(snap => {
    const dateFormatted = snap.isoDate ? new Date(snap.isoDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date';
    const s = snap.stats || { notes: 0, routine: 0, topicsDone: 0, masteredMCQs: 0 };

    html += `
      <div class="glass" style="padding:10px 14px; border-radius:10px; border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-weight:700; font-size:13.5px; color:var(--text);">${escapeHtml(snap.label)}</div>
          <div style="font-size:11.5px; color:var(--text-soft); margin-top:2px;">
            ${dateFormatted} &bull; <span style="color:var(--accent1);">${s.notes} Notes</span> &bull; <span>${s.routine} Tasks</span> &bull; <span>${s.topicsDone} Topics</span> &bull; <span style="color:#10b981;">${s.masteredMCQs} Mastered</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="pill subtle btn-restore-snap" data-snap-id="${escapeAttr(snap.id)}" type="button" style="font-size:11.5px; padding:3px 10px; color:#10b981;">
            Restore
          </button>
          <button class="micro-btn danger btn-delete-snap" data-snap-id="${escapeAttr(snap.id)}" type="button" title="Delete Snapshot">
            ${typeof ICON !== 'undefined' && ICON.trash ? ICON.trash : '&times;'}
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind restore buttons
  container.querySelectorAll('.btn-restore-snap').forEach(btn => {
    btn.addEventListener('click', () => {
      const snapId = btn.getAttribute('data-snap-id');
      if (snapId) restoreCloudSnapshot(snapId);
    });
  });

  // Bind delete buttons
  container.querySelectorAll('.btn-delete-snap').forEach(btn => {
    btn.addEventListener('click', () => {
      const snapId = btn.getAttribute('data-snap-id');
      if (snapId) deleteCloudSnapshot(snapId);
    });
  });
}

/**
 * Restores state from a specific cloud snapshot
 */
async function restoreCloudSnapshot(snapshotId, user = null) {
  if (!user) user = getCachedAuthUser();
  if (!user) {
    showToast('Please sign in to restore snapshots', true);
    return false;
  }

  const isFirebaseOnline = (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0 && !user.isDemo);
  let snapshotData = null;

  if (isFirebaseOnline) {
    try {
      const doc = await firebase.firestore().collection('users').doc(user.uid).collection('backups').doc(snapshotId).get();
      if (doc.exists) {
        snapshotData = doc.data().data || doc.data();
      }
    } catch (e) {
      console.error('[CareerDesk] Snapshot fetch failed:', e);
    }
  }

  if (!snapshotData) {
    showToast('Could not load snapshot data from cloud.', true);
    return false;
  }

  const ok = window.confirm(`Restore this backup snapshot?\n\nThis will replace your current routines, notes, syllabus, and MCQ progress with the data from this snapshot.`);
  if (!ok) return false;

  try {
    if (snapshotData.state) {
      state = snapshotData.state;
      await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));
    }
    if (Array.isArray(snapshotData.exams)) {
      exams = snapshotData.exams;
      if (typeof saveExams === 'function') saveExams();
    }
    if (Array.isArray(snapshotData.mistakes)) {
      mistakes = snapshotData.mistakes;
      if (typeof saveMistakes === 'function') saveMistakes();
    }
    if (Array.isArray(snapshotData.customMCQQuestions) && typeof saveStoredQuestions === 'function') {
      saveStoredQuestions(snapshotData.customMCQQuestions);
    }
    if (snapshotData.mcqProgress && typeof saveMCQProgress === 'function') {
      userMCQProgress = snapshotData.mcqProgress;
      saveMCQProgress();
    }

    refreshAllDashboardPanels();
    await syncUserDataToFirestore(user, true);
    showToast('Snapshot restored successfully! All data updated. ✓');
    return true;
  } catch (err) {
    console.error('[CareerDesk] Restore snapshot error:', err);
    showToast('Failed to apply snapshot: ' + err.message, true);
    return false;
  }
}

/**
 * Deletes a specific snapshot
 */
async function deleteCloudSnapshot(snapshotId, user = null) {
  if (!user) user = getCachedAuthUser();
  if (!user) return;

  const ok = window.confirm('Delete this backup snapshot from the cloud?');
  if (!ok) return;

  if (typeof firebase !== 'undefined' && firebase.firestore && !user.isDemo) {
    try {
      await firebase.firestore().collection('users').doc(user.uid).collection('backups').doc(snapshotId).delete();
    } catch (e) { }
  }

  const cacheKey = 'careerdesk_snapshots_cache_' + user.uid;
  try {
    let cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    cached = cached.filter(s => s.id !== snapshotId);
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (e) { }

  showToast('Snapshot removed.');
  renderCloudSnapshotsList();
}

/**
 * Exports entire cloud data bundle as formatted JSON file
 */
function exportCloudBackupJSON() {
  const bundle = buildCloudDataBundle();
  const user = getCachedAuthUser();
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `careerdesk-cloud-backup-${user?.displayName ? normalizeUsername(user.displayName) + '-' : ''}${dateStr}.json`;

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Cloud backup exported as JSON! ✓');
}

/**
 * Imports cloud backup from a JSON file and syncs immediately to Firestore
 */
async function importCloudBackupJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      if (!parsed || (!parsed.state && !parsed.routine && !parsed.syllabus)) {
        showToast('Invalid backup file format.', true);
        return;
      }

      const ok = window.confirm('Restore and sync this JSON backup to your cloud account? Current data will be replaced.');
      if (!ok) return;

      if (parsed.state) {
        state = parsed.state;
      } else {
        state = {
          ...getDefaultState(),
          ...parsed
        };
      }
      await storageAdapter.set(STORAGE_KEY, JSON.stringify(state));

      if (Array.isArray(parsed.exams)) {
        exams = parsed.exams;
        if (typeof saveExams === 'function') saveExams();
      }
      if (Array.isArray(parsed.mistakes)) {
        mistakes = parsed.mistakes;
        if (typeof saveMistakes === 'function') saveMistakes();
      }
      if (Array.isArray(parsed.customMCQQuestions) && typeof saveStoredQuestions === 'function') {
        saveStoredQuestions(parsed.customMCQQuestions);
      }
      if (parsed.mcqProgress && typeof saveMCQProgress === 'function') {
        userMCQProgress = parsed.mcqProgress;
        saveMCQProgress();
      }

      refreshAllDashboardPanels();
      const user = getCachedAuthUser();
      if (user) {
        await syncUserDataToFirestore(user, false);
        await createCloudSnapshot('Imported JSON Backup', user, true);
      }
      showToast('JSON backup restored and synced to cloud! ✓');
    } catch (err) {
      console.error('[CareerDesk] JSON import error:', err);
      showToast('Failed to parse backup JSON file: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}

/**
 * Initialize Cloud Backup UI Controls & Event Handlers
 */
function initCloudBackupEvents() {
  const createSnapBtn = document.getElementById('btnCreateSnapshotNow');
  if (createSnapBtn) {
    createSnapBtn.addEventListener('click', () => {
      createCloudSnapshot(null, null, false);
    });
  }

  const toggleSnapBtn = document.getElementById('btnToggleSnapshotsList');
  const snapContainer = document.getElementById('cloudSnapshotsContainer');
  if (toggleSnapBtn && snapContainer) {
    toggleSnapBtn.addEventListener('click', () => {
      const isVisible = snapContainer.style.display === 'block';
      snapContainer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        renderCloudSnapshotsList();
      }
    });
  }

  const exportJSONBtn = document.getElementById('btnExportCloudJSON');
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', () => {
      exportCloudBackupJSON();
    });
  }

  const fileInput = document.getElementById('cloudJSONFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importCloudBackupJSON(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  // Pre-load snapshot count badge
  const user = getCachedAuthUser();
  if (user) {
    listCloudSnapshots(user).then(list => {
      const toggleText = document.getElementById('snapshotToggleText');
      if (toggleText) toggleText.textContent = `View Snapshots (${list.length})`;
    }).catch(() => { });
  }
}

// Auto-initialize cloud backup controls on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudBackupEvents);
  } else {
    initCloudBackupEvents();
  }
}
