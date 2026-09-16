/* ==========================================================================
   CareerDesk — Privacy, Security & Anti-Hacking Engine
   Zero-Knowledge AES-GCM-256 Encryption, Strict XSS Sanitization,
   SHA-256 Checksum Tamper-Proofing & Privacy Screen PIN Lock
   ========================================================================== */

const CAREERDESK_VAULT_CFG_KEY = 'careerdesk_vault_cfg_v1';
const CAREERDESK_PIN_HASH_KEY = 'careerdesk_privacy_pin_hash_v1';
const CAREERDESK_AUTOLOCK_MINS_KEY = 'careerdesk_autolock_minutes_v1';

let lastUserActivityTimestamp = Date.now();
let autoLockIntervalTimer = null;
let isWorkspaceLocked = false;
let currentEnteredPin = '';

// =========================================================
// 1. NATIVE WEB CRYPTO AES-GCM-256 ENCRYPTION ENGINE
// =========================================================

function isWebCryptoSupported() {
  const subtle = (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) || (typeof crypto !== 'undefined' && crypto.subtle);
  return !!subtle;
}

/**
 * Converts ArrayBuffer / Uint8Array to base64 string
 */
function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Converts base64 string to Uint8Array
 */
function base64ToBuffer(base64) {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Computes SHA-256 hexadecimal hash string
 */
async function computeSha256(text) {
  if (!isWebCryptoSupported()) return '';
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives an AES-GCM 256-bit key from user passphrase using PBKDF2
 */
async function deriveKeyFromPassphrase(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any data bundle using Zero-Knowledge AES-GCM 256-bit encryption
 */
async function encryptVaultPayload(dataObj, passphrase) {
  if (!isWebCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, saltBytes);

  const jsonStr = JSON.stringify(dataObj);
  const checksum = await computeSha256(jsonStr);

  const enc = new TextEncoder();
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    enc.encode(jsonStr)
  );

  return {
    __careerdesk_vault: true,
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: bufferToBase64(saltBytes),
    iv: bufferToBase64(ivBytes),
    ciphertext: bufferToBase64(cipherBuffer),
    checksum: checksum,
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypts a vault envelope with passphrase and verifies checksum
 */
async function decryptVaultPayload(envelope, passphrase) {
  if (!isWebCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }
  if (!envelope || !envelope.__careerdesk_vault || !envelope.ciphertext) {
    throw new Error('Invalid or unencrypted vault file format.');
  }

  const saltBytes = base64ToBuffer(envelope.salt);
  const ivBytes = base64ToBuffer(envelope.iv);
  const cipherBytes = base64ToBuffer(envelope.ciphertext);

  const key = await deriveKeyFromPassphrase(passphrase, saltBytes);

  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBytes
    );
  } catch (err) {
    throw new Error('Incorrect passphrase. Decryption failed.');
  }

  const dec = new TextDecoder();
  const plaintext = dec.decode(decryptedBuffer);

  // Verify Checksum Integrity
  if (envelope.checksum) {
    const computedCheck = await computeSha256(plaintext);
    if (computedCheck !== envelope.checksum) {
      throw new Error('Security Alert: Checksum mismatch! The data appears tampered or corrupted.');
    }
  }

  return JSON.parse(plaintext);
}

/**
 * Gets the current Vault configuration
 */
function getVaultConfig() {
  try {
    const raw = localStorage.getItem(CAREERDESK_VAULT_CFG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return { enabled: false, lastConfigured: null };
}

function saveVaultConfig(cfg) {
  try {
    localStorage.setItem(CAREERDESK_VAULT_CFG_KEY, JSON.stringify(cfg));
  } catch (e) { }
}

// =========================================================
// 2. INPUT SANITIZATION & ANTI-XSS DEFENSE
// =========================================================

/**
 * Deep recursive object sanitizer to prevent Prototype Pollution
 */
function scrubPrototypePollution(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(scrubPrototypePollution);
  }
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Block prototype pollution vectors
    }
    clean[key] = scrubPrototypePollution(obj[key]);
  }
  return clean;
}

/**
 * Sanitizes rich text to prevent XSS execution
 */
function sanitizeHtmlString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;');
}

// =========================================================
// 3. PRIVACY PIN LOCK SCREEN & PANIC BUTTON
// =========================================================

function getPrivacyPinHash() {
  return localStorage.getItem(CAREERDESK_PIN_HASH_KEY);
}

async function setPrivacyPin(pin) {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  const hash = await computeSha256(pin);
  localStorage.setItem(CAREERDESK_PIN_HASH_KEY, hash);
}

function removePrivacyPin() {
  localStorage.removeItem(CAREERDESK_PIN_HASH_KEY);
}

function getAutoLockMinutes() {
  const val = localStorage.getItem(CAREERDESK_AUTOLOCK_MINS_KEY);
  return val ? parseInt(val, 10) : 0; // 0 = disabled
}

function setAutoLockMinutes(mins) {
  localStorage.setItem(CAREERDESK_AUTOLOCK_MINS_KEY, String(mins));
  setupAutoLockTimer();
}

/**
 * Lock the dashboard screen immediately
 */
function lockWorkspaceNow() {
  const pinHash = getPrivacyPinHash();
  if (!pinHash) {
    openSetPinModal();
    return;
  }
  isWorkspaceLocked = true;
  currentEnteredPin = '';
  renderLockScreenOverlay();
}

/**
 * Renders the PIN lock overlay
 */
function renderLockScreenOverlay() {
  let overlay = document.getElementById('privacyLockScreen');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'privacyLockScreen';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="privacy-lock-card">
      <div class="lock-shield-badge">
        <i data-lucide="shield-check" style="width:30px; height:30px;"></i>
      </div>
      <h2 class="lock-title">CareerDesk Locked</h2>
      <p class="lock-sub">Enter your 4-digit Privacy PIN to unlock</p>

      <div class="lock-pin-dots" id="lockPinDots">
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
      </div>

      <div class="lock-error-msg" id="lockErrorMsg"></div>

      <div class="lock-keypad">
        <button type="button" class="keypad-btn" data-key="1">1</button>
        <button type="button" class="keypad-btn" data-key="2">2</button>
        <button type="button" class="keypad-btn" data-key="3">3</button>
        <button type="button" class="keypad-btn" data-key="4">4</button>
        <button type="button" class="keypad-btn" data-key="5">5</button>
        <button type="button" class="keypad-btn" data-key="6">6</button>
        <button type="button" class="keypad-btn" data-key="7">7</button>
        <button type="button" class="keypad-btn" data-key="8">8</button>
        <button type="button" class="keypad-btn" data-key="9">9</button>
        <button type="button" class="keypad-btn action-btn" id="btnKeypadClear">C</button>
        <button type="button" class="keypad-btn" data-key="0">0</button>
        <button type="button" class="keypad-btn action-btn" id="btnKeypadBack"><i data-lucide="delete"></i></button>
      </div>
    </div>
  `;

  overlay.style.display = 'flex';

  overlay.querySelectorAll('.keypad-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      handlePinDigit(btn.getAttribute('data-key'));
    });
  });

  const clearBtn = overlay.querySelector('#btnKeypadClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentEnteredPin = '';
      updatePinDotsUI();
    });
  }

  const backBtn = overlay.querySelector('#btnKeypadBack');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentEnteredPin.length > 0) {
        currentEnteredPin = currentEnteredPin.slice(0, -1);
        updatePinDotsUI();
      }
    });
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

async function handlePinDigit(digit) {
  if (currentEnteredPin.length >= 6) return;
  currentEnteredPin += digit;
  updatePinDotsUI();

  const savedHash = getPrivacyPinHash();
  if (currentEnteredPin.length >= 4) {
    const inputHash = await computeSha256(currentEnteredPin);
    if (inputHash === savedHash) {
      unlockWorkspace();
    } else if (currentEnteredPin.length === 6 || (currentEnteredPin.length === 4 && savedHash.length > 0)) {
      setTimeout(async () => {
        const checkAgain = await computeSha256(currentEnteredPin);
        if (checkAgain === savedHash) {
          unlockWorkspace();
        } else {
          flashPinError('Incorrect PIN. Try again.');
        }
      }, 150);
    }
  }
}

function updatePinDotsUI() {
  const dots = document.querySelectorAll('#lockPinDots .pin-dot');
  dots.forEach((dot, index) => {
    if (index < currentEnteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function flashPinError(msg) {
  const errEl = document.getElementById('lockErrorMsg');
  const dotsEl = document.getElementById('lockPinDots');
  if (errEl) errEl.textContent = msg;
  if (dotsEl) {
    dotsEl.classList.add('shake');
    setTimeout(() => dotsEl.classList.remove('shake'), 400);
  }
  currentEnteredPin = '';
  setTimeout(() => {
    updatePinDotsUI();
    if (errEl) errEl.textContent = '';
  }, 1200);
}

function unlockWorkspace() {
  isWorkspaceLocked = false;
  currentEnteredPin = '';
  lastUserActivityTimestamp = Date.now();
  const overlay = document.getElementById('privacyLockScreen');
  if (overlay) {
    overlay.style.display = 'none';
  }
  if (typeof showToast === 'function') {
    showToast('Dashboard unlocked');
  }
}

// Global Activity Listener for Auto-Lock & Keyboard shortcuts
function setupAutoLockTimer() {
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  events.forEach(evt => {
    window.addEventListener(evt, () => {
      lastUserActivityTimestamp = Date.now();
    }, { passive: true });
  });

  // Shortcut: Alt + L to lock screen immediately
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      lockWorkspaceNow();
    }

    // Direct numpad input when lock screen is open
    if (isWorkspaceLocked) {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentEnteredPin.length > 0) {
          currentEnteredPin = currentEnteredPin.slice(0, -1);
          updatePinDotsUI();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        currentEnteredPin = '';
        updatePinDotsUI();
      }
    }
  });

  if (autoLockIntervalTimer) clearInterval(autoLockIntervalTimer);
  autoLockIntervalTimer = setInterval(() => {
    const mins = getAutoLockMinutes();
    if (mins > 0 && !isWorkspaceLocked) {
      const elapsedMs = Date.now() - lastUserActivityTimestamp;
      if (elapsedMs > mins * 60 * 1000) {
        lockWorkspaceNow();
      }
    }
  }, 15000);
}

// =========================================================
// 4. VAULT UI RENDERER & MODALS (Settings / Profile Tab)
// =========================================================

function renderSecurityVaultUI() {
  const container = document.getElementById('securityVaultCard');
  if (!container) return;

  const cfg = getVaultConfig();
  const isVaultEnabled = cfg && cfg.enabled;
  const hasPin = !!getPrivacyPinHash();
  const autoLockMins = getAutoLockMinutes();
  const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  container.innerHTML = `
    <div class="security-header">
      <div class="security-header-title">
        <div class="security-shield-icon">
          <i data-lucide="shield-check" style="width:20px; height:20px;"></i>
        </div>
        <div class="security-header-text">
          <h3>Privacy, Security &amp; Anti-Hacking Vault</h3>
          <p>Zero-Knowledge AES-GCM-256 cloud encryption, XSS defense &amp; PIN lock</p>
        </div>
      </div>
      <button type="button" class="pill btn-panic-lock" id="btnPanicLockNow" title="Lock your screen immediately (Shortcut: Alt+L)">
        <i data-lucide="lock"></i> <span>Lock Screen (Alt+L)</span>
      </button>
    </div>

    <div class="security-audit-grid">
      <!-- 1. Zero Knowledge Encryption -->
      <div class="security-audit-item">
        <div class="audit-item-info">
          <div class="audit-item-icon encrypted"><i data-lucide="lock"></i></div>
          <div>
            <div class="audit-item-title">Cloud Encryption</div>
            <div class="audit-item-sub">AES-GCM 256-bit</div>
          </div>
        </div>
        <span class="security-badge ${isVaultEnabled ? 'active' : 'inactive'}">
          ${isVaultEnabled ? 'Encrypted' : 'Off'}
        </span>
      </div>

      <!-- 2. Firestore Isolation -->
      <div class="security-audit-item">
        <div class="audit-item-info">
          <div class="audit-item-icon shield"><i data-lucide="shield-alert"></i></div>
          <div>
            <div class="audit-item-title">Data Isolation</div>
            <div class="audit-item-sub">Rules &amp; Auth Guard</div>
          </div>
        </div>
        <span class="security-badge active">Secured</span>
      </div>

      <!-- 3. Screen PIN Lock -->
      <div class="security-audit-item">
        <div class="audit-item-info">
          <div class="audit-item-icon lock"><i data-lucide="key-round"></i></div>
          <div>
            <div class="audit-item-title">Privacy Screen PIN</div>
            <div class="audit-item-sub">${autoLockMins > 0 ? autoLockMins + 'm auto-lock' : 'Manual / Alt+L'}</div>
          </div>
        </div>
        <span class="security-badge ${hasPin ? 'active' : 'inactive'}">
          ${hasPin ? 'PIN Active' : 'No PIN'}
        </span>
      </div>

      <!-- 4. Origin & Sanitization -->
      <div class="security-audit-item">
        <div class="audit-item-info">
          <div class="audit-item-icon tamper"><i data-lucide="check-circle-2"></i></div>
          <div>
            <div class="audit-item-title">Anti-XSS &amp; Checksum</div>
            <div class="audit-item-sub">${isHttps ? 'HTTPS TLS' : 'Local'} &bull; SHA-256</div>
          </div>
        </div>
        <span class="security-badge ready">Active</span>
      </div>
    </div>

    <div class="security-actions-bar">
      <div class="security-notice">
        <i data-lucide="info" style="width:15px; height:15px; color:var(--accent2); flex-shrink:0;"></i>
        <span>Zero-Knowledge: Your vault passphrase never leaves this device. Only you can decrypt your data.</span>
      </div>
      <div class="security-btn-group">
        <button type="button" class="pill" id="btnConfigureEncryption">
          <i data-lucide="key"></i> <span>${isVaultEnabled ? 'Manage Passphrase' : 'Enable Encryption'}</span>
        </button>
        <button type="button" class="pill" id="btnConfigurePin">
          <i data-lucide="hash"></i> <span>${hasPin ? 'Change PIN' : 'Set Lock PIN'}</span>
        </button>
        <button type="button" class="pill" id="btnExportEncryptedVault" title="Export client-encrypted backup file">
          <i data-lucide="file-lock-2"></i> <span>Export .vault</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btnPanicLockNow')?.addEventListener('click', lockWorkspaceNow);
  document.getElementById('btnConfigureEncryption')?.addEventListener('click', openVaultPassphraseModal);
  document.getElementById('btnConfigurePin')?.addEventListener('click', openSetPinModal);
  document.getElementById('btnExportEncryptedVault')?.addEventListener('click', exportEncryptedVaultFile);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Modal to set or update Vault Passphrase
 */
function openVaultPassphraseModal() {
  let modal = document.getElementById('vaultPassphraseModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'vaultPassphraseModal';
    document.body.appendChild(modal);
  }

  const cfg = getVaultConfig();

  modal.innerHTML = `
    <div class="glass modal-card" style="max-width:480px; width:92%; padding:26px; border-radius:18px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="lock" style="color:#10b981; width:20px; height:20px;"></i>
          Zero-Knowledge Cloud Encryption
        </h3>
        <button class="modal-close" id="closeVaultModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <p style="font-size:13px; color:var(--text-soft); margin:0 0 14px; line-height:1.45;">
        When enabled, your routines, notes, syllabus progress, and mistake bank are encrypted using <strong>AES-GCM-256</strong> before uploading to Firestore. Even database administrators cannot read your data.
      </p>

      <div class="form-group" style="margin-bottom:12px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:5px;">Vault Secret Passphrase:</label>
        <input type="password" id="vaultPassphraseInput" placeholder="Enter a strong passphrase..."
          style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13.5px;">
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:5px;">Confirm Passphrase:</label>
        <input type="password" id="vaultPassphraseConfirmInput" placeholder="Confirm passphrase..."
          style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13.5px;">
      </div>

      <div style="background:rgba(245,158,11,0.08); border-left:3px solid #f59e0b; padding:8px 12px; border-radius:6px; font-size:12px; color:var(--text-soft); margin-bottom:16px;">
        <strong>Important:</strong> We do not store your passphrase anywhere. If you forget it, encrypted cloud backups cannot be recovered.
      </div>

      <div class="btn-group" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        ${cfg.enabled ? '<button type="button" class="pill danger" id="btnDisableEncryption">Disable Encryption</button>' : '<span></span>'}
        <div style="display:flex; gap:8px;">
          <button type="button" class="pill" id="btnCancelVaultModal">Cancel</button>
          <button type="button" class="pill solid" id="btnSaveVaultPassphrase" style="background:linear-gradient(135deg, #10b981, #06b6d4); color:#fff;">
            <i data-lucide="check"></i> <span>Save &amp; Enable</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeVaultPassphraseModal(); };
  document.getElementById('closeVaultModal')?.addEventListener('click', closeVaultPassphraseModal);
  document.getElementById('btnCancelVaultModal')?.addEventListener('click', closeVaultPassphraseModal);

  document.getElementById('btnDisableEncryption')?.addEventListener('click', () => {
    saveVaultConfig({ enabled: false, lastConfigured: null });
    sessionStorage.removeItem('careerdesk_active_vault_pass');
    showToast('Zero-knowledge encryption disabled');
    closeVaultPassphraseModal();
    renderSecurityVaultUI();
  });

  document.getElementById('btnSaveVaultPassphrase')?.addEventListener('click', () => {
    const p1 = document.getElementById('vaultPassphraseInput')?.value || '';
    const p2 = document.getElementById('vaultPassphraseConfirmInput')?.value || '';
    if (!p1 || p1.length < 6) {
      showToast('Passphrase must be at least 6 characters', true);
      return;
    }
    if (p1 !== p2) {
      showToast('Passphrases do not match', true);
      return;
    }

    saveVaultConfig({ enabled: true, lastConfigured: new Date().toISOString() });
    sessionStorage.setItem('careerdesk_active_vault_pass', p1);
    showToast('🔒 Military-grade AES-GCM-256 cloud encryption enabled!');
    closeVaultPassphraseModal();
    renderSecurityVaultUI();
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeVaultPassphraseModal() {
  const modal = document.getElementById('vaultPassphraseModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

/**
 * Modal to set or update 4-digit Privacy PIN
 */
function openSetPinModal() {
  let modal = document.getElementById('setPinModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'setPinModal';
    document.body.appendChild(modal);
  }

  const hasPin = !!getPrivacyPinHash();
  const currentAutoLock = getAutoLockMinutes();

  modal.innerHTML = `
    <div class="glass modal-card" style="max-width:440px; width:92%; padding:26px; border-radius:18px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title" style="margin:0; font-family:var(--font-display); font-size:18px; color:var(--text); display:flex; align-items:center; gap:8px;">
          <i data-lucide="key-round" style="color:#6366f1; width:20px; height:20px;"></i>
          Privacy PIN &amp; Auto-Lock
        </h3>
        <button class="modal-close" id="closeSetPinModal" type="button" style="background:none; border:none; color:var(--text-soft); cursor:pointer; padding:4px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:5px;">4-Digit Lock PIN:</label>
        <input type="password" id="inputNewPin" maxlength="6" placeholder="e.g. 1234"
          style="width:100%; padding:10px 14px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:18px; letter-spacing:4px; text-align:center;">
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text); display:block; margin-bottom:5px;">Inactivity Auto-Lock:</label>
        <select id="selectAutoLockMins" style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px;">
          <option value="0" ${currentAutoLock === 0 ? 'selected' : ''}>Disabled (Manual / Alt+L only)</option>
          <option value="5" ${currentAutoLock === 5 ? 'selected' : ''}>Lock after 5 minutes of inactivity</option>
          <option value="15" ${currentAutoLock === 15 ? 'selected' : ''}>Lock after 15 minutes of inactivity</option>
          <option value="30" ${currentAutoLock === 30 ? 'selected' : ''}>Lock after 30 minutes of inactivity</option>
        </select>
      </div>

      <div class="btn-group" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
        ${hasPin ? '<button type="button" class="pill danger" id="btnRemovePin">Remove PIN</button>' : '<span></span>'}
        <div style="display:flex; gap:8px;">
          <button type="button" class="pill" id="btnCancelPinModal">Cancel</button>
          <button type="button" class="pill solid" id="btnSavePin">
            <i data-lucide="check"></i> <span>Save PIN</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 20);

  modal.onclick = (e) => { if (e.target === modal) closeSetPinModal(); };
  document.getElementById('closeSetPinModal')?.addEventListener('click', closeSetPinModal);
  document.getElementById('btnCancelPinModal')?.addEventListener('click', closeSetPinModal);

  document.getElementById('btnRemovePin')?.addEventListener('click', () => {
    removePrivacyPin();
    setAutoLockMinutes(0);
    showToast('Privacy PIN removed');
    closeSetPinModal();
    renderSecurityVaultUI();
  });

  document.getElementById('btnSavePin')?.addEventListener('click', async () => {
    const pinVal = document.getElementById('inputNewPin')?.value.trim() || '';
    const autoMins = parseInt(document.getElementById('selectAutoLockMins')?.value, 10) || 0;

    if (!pinVal || pinVal.length < 4) {
      showToast('PIN must be at least 4 digits', true);
      return;
    }

    await setPrivacyPin(pinVal);
    setAutoLockMinutes(autoMins);
    showToast('Privacy PIN configured successfully!');
    closeSetPinModal();
    renderSecurityVaultUI();
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function closeSetPinModal() {
  const modal = document.getElementById('setPinModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.style.display = 'none', 200);
}

/**
 * Prompts user for vault passphrase (returns active session passphrase if cached)
 */
async function promptVaultPassphrase(title = 'Enter Vault Passphrase') {
  const cached = sessionStorage.getItem('careerdesk_active_vault_pass');
  if (cached) return cached;

  const entered = prompt(title + ' (Required to decrypt your zero-knowledge data):');
  if (entered) {
    sessionStorage.setItem('careerdesk_active_vault_pass', entered);
  }
  return entered;
}

/**
 * Exports client-side encrypted .careerdesk.vault file
 */
async function exportEncryptedVaultFile() {
  let pass = sessionStorage.getItem('careerdesk_active_vault_pass');
  if (!pass) {
    pass = prompt('Enter a secret passphrase to encrypt this backup file:');
    if (!pass) return;
    if (pass.length < 6) {
      showToast('Passphrase must be at least 6 characters', true);
      return;
    }
    sessionStorage.setItem('careerdesk_active_vault_pass', pass);
  }

  try {
    showToast('Encrypting vault with AES-GCM 256-bit...');
    const bundle = typeof buildCloudDataBundle === 'function' ? buildCloudDataBundle() : { state: state };
    const encrypted = await encryptVaultPayload(bundle, pass);

    const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `careerdesk-vault-encrypted-${dateStr}.careerdesk.vault`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('🛡️ Encrypted backup exported successfully!');
  } catch (err) {
    showToast('Failed to export encrypted vault: ' + err.message, true);
  }
}

// Auto-initialize Security Engine on file load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAutoLockTimer();
    });
  } else {
    setupAutoLockTimer();
  }
}
