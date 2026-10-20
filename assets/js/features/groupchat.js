/* CareerDesk Group Chat: authenticated Firestore groups and real-time messages. */

const GROUP_CHAT_UI_KEY = 'careerdesk-groupchat-ui-v1';
const GROUP_CHAT_PAGE_SIZE = 50;

const PRESET_GROUP_ICONS = [
  { id: 'study', label: 'Study & BCS', color1: '#6366f1', color2: '#4338ca', path: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 2v20"/>' },
  { id: 'target', label: 'Exam Target', color1: '#f43f5e', color2: '#be123c', path: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
  { id: 'quiz', label: 'Quiz & Brain', color1: '#f59e0b', color2: '#b45309', path: '<path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7Z"/><path d="M9 21h6"/>' },
  { id: 'tech', label: 'Tech & ICT', color1: '#06b6d4', color2: '#0e7490', path: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { id: 'gk', label: 'World & GK', color1: '#10b981', color2: '#047857', path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>' },
  { id: 'math', label: 'Math & Logic', color1: '#8b5cf6', color2: '#6d28d9', path: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>' },
  { id: 'lang', label: 'English & Verbal', color1: '#14b8a6', color2: '#0f766e', path: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>' },
  { id: 'trophy', label: 'Rank & Club', color1: '#eab308', color2: '#a16207', path: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/>' },
  { id: 'community', label: 'Community', color1: '#3b82f6', color2: '#1d4ed8', path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id: 'sprint', label: 'Quick Sprint', color1: '#f97316', color2: '#c2410c', path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  { id: 'science', label: 'Science & Lab', color1: '#ec4899', color2: '#be185d', path: '<path d="M10 2v7.31"/><path d="M14 2v7.31"/><path d="M8.5 2h7"/><path d="M14 9.3 18.2 16c1.1 1.7.3 4-1.7 4H7.5c-2 0-2.8-2.3-1.7-4L10 9.3"/><line x1="7" y1="15" x2="17" y2="15"/>' },
  { id: 'ethics', label: 'Law & Ethics', color1: '#64748b', color2: '#334155', path: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>' }
];

PRESET_GROUP_ICONS.forEach(item => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${item.color1}"/><stop offset="100%" stop-color="${item.color2}"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g_${item.id})"/><g transform="translate(26, 26) scale(2)" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${item.path}</g></svg>`;
  item.uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
});

const GROUP_CHAT_DEFAULT_AVATAR = PRESET_GROUP_ICONS[0].uri;
let groupChatState = {
  activeGroupId: null,
  groupsUnsubscribe: null,
  messagesUnsubscribe: null,
  activeGroupUnsubscribe: null,
  groups: [],
  activeGroup: null,
  recentMessages: [],
  olderMessages: [],
  messages: [],
  hasMoreOlder: true,
  loadingOlder: false,
  initialized: false,
  loading: false
};

function groupChatUser() {
  const user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null;
  if (!user) throw new Error('Please sign in to use Group Chat.');
  return user;
}

async function groupChatAuthUser() {
  if (typeof initFirebaseApp === 'function'
    && (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length)) {
    initFirebaseApp();
  }
  if (typeof firebase !== 'undefined' && firebase.auth) {
    if (!firebase.auth().currentUser) {
      await new Promise(resolve => {
        let finished = false;
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          if (finished) return;
          finished = true;
          unsubscribe();
          resolve(user);
        });
        setTimeout(() => {
          if (!finished) {
            finished = true;
            unsubscribe();
            resolve(null);
          }
        }, 5000);
      });
    }
    if (firebase.auth().currentUser) {
      const liveUser = firebase.auth().currentUser;
      return {
        uid: liveUser.uid,
        displayName: liveUser.displayName || liveUser.email?.split('@')[0] || 'Aspirant',
        photoURL: liveUser.photoURL || '',
        email: liveUser.email || ''
      };
    }
    throw new Error('Your Firebase login session is still loading. Refresh and sign in again.');
  }
  throw new Error('Firebase Authentication is unavailable.');
}

function groupChatDb() {
  if (typeof firebase === 'undefined' || !firebase.firestore) {
    throw new Error('Firestore is not available.');
  }
  if (!firebase.apps || !firebase.apps.length) {
    if (typeof initFirebaseApp === 'function') initFirebaseApp();
  }
  if (!firebase.apps || !firebase.apps.length) {
    throw new Error('Firebase is still initializing. Please retry in a moment.');
  }
  return firebase.firestore();
}

function groupChatUiState() {
  try { return JSON.parse(localStorage.getItem(GROUP_CHAT_UI_KEY) || '{}'); } catch (e) { return {}; }
}

function saveGroupChatUiState() {
  try {
    const data = groupChatUiState();
    data.activeGroupId = groupChatState.activeGroupId;
    data.lastReadAtByGroup = data.lastReadAtByGroup || {};
    if (groupChatState.activeGroupId) data.lastReadAtByGroup[groupChatState.activeGroupId] = Date.now();
    localStorage.setItem(GROUP_CHAT_UI_KEY, JSON.stringify(data));
  } catch (e) { /* localStorage is optional */ }
}

function groupChatError(error, fallback) {
  console.error('[Group Chat]', error);
  const message = error && error.code === 'permission-denied'
    ? 'Chat permission was denied. Please sign in again and retry.'
    : (error.message || fallback);
  if (typeof showToast === 'function') showToast(message, true);
  const status = document.getElementById('groupchatCreateStatus');
  if (status) {
    status.textContent = message;
    status.className = 'groupchat-form-status error';
  }
}

function renderPresetIconPicker({ gridId, inputId, previewId, previewNameId, currentUri = '', onSelect }) {
  const grid = document.getElementById(gridId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const previewName = document.getElementById(previewNameId);
  if (!grid || !input || !preview) return;

  const targetUri = (currentUri || input.value || '').trim();
  let matchedIcon = PRESET_GROUP_ICONS.find(i => i.uri === targetUri);
  if (!matchedIcon && (!targetUri || targetUri === 'assets/icons/people.png')) {
    matchedIcon = PRESET_GROUP_ICONS[0];
  }

  grid.innerHTML = PRESET_GROUP_ICONS.map(item => {
    const isSelected = matchedIcon && matchedIcon.id === item.id && (!input.value.trim() || input.value.trim() === item.uri);
    return `
      <button type="button" class="groupchat-preset-icon-btn ${isSelected ? 'selected' : ''}" data-icon-id="${item.id}" title="${escapeAttr(item.label)}" aria-label="${escapeAttr(item.label)}">
        <img src="${escapeAttr(item.uri)}" alt="${escapeAttr(item.label)}">
      </button>`;
  }).join('');

  const syncState = (icon, isCustom = false) => {
    grid.querySelectorAll('.groupchat-preset-icon-btn').forEach(btn => {
      btn.classList.toggle('selected', !isCustom && !!icon && btn.dataset.iconId === icon.id);
    });
    if (!isCustom && icon) {
      grid.dataset.selectedUri = icon.uri;
      preview.src = icon.uri;
      if (previewName) previewName.textContent = icon.label;
    } else {
      grid.dataset.selectedUri = '';
      if (previewName) previewName.textContent = 'Custom Image';
    }
  };

  if (matchedIcon && (!input.value.trim() || input.value.trim() === matchedIcon.uri)) {
    syncState(matchedIcon, false);
  } else if (input.value.trim()) {
    syncState(null, true);
    preview.src = input.value.trim();
  } else {
    syncState(PRESET_GROUP_ICONS[0], false);
  }

  grid.querySelectorAll('.groupchat-preset-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = PRESET_GROUP_ICONS.find(i => i.id === btn.dataset.iconId);
      if (!icon) return;
      input.value = '';
      syncState(icon, false);
      if (typeof onSelect === 'function') onSelect(icon);
    });
  });

  input.oninput = () => {
    const val = input.value.trim();
    if (!val) {
      const activeBtn = grid.querySelector('.groupchat-preset-icon-btn.selected');
      const icon = activeBtn ? PRESET_GROUP_ICONS.find(i => i.id === activeBtn.dataset.iconId) : PRESET_GROUP_ICONS[0];
      syncState(icon, false);
      return;
    }
    const matchingPreset = PRESET_GROUP_ICONS.find(i => i.uri === val);
    if (matchingPreset) {
      syncState(matchingPreset, false);
    } else {
      syncState(null, true);
      let isValidUrl = false;
      try { isValidUrl = ['http:', 'https:'].includes(new URL(val).protocol); } catch (e) {}
      preview.src = isValidUrl ? val : PRESET_GROUP_ICONS[0].uri;
      preview.onerror = () => { preview.src = PRESET_GROUP_ICONS[0].uri; };
    }
  };
}

function openGroupChatCreateModal() {
  const modal = document.getElementById('groupchatCreateModal');
  if (!modal) {
    groupChatError(new Error('Create Group dialog is missing from the page.'), 'Unable to open Create Group.');
    return;
  }
  document.getElementById('groupchatCreateForm')?.reset();
  renderPresetIconPicker({
    gridId: 'groupchatCreatePresetIcons',
    inputId: 'groupchatAvatarInput',
    previewId: 'groupchatAvatarPreview',
    previewNameId: 'groupchatAvatarPreviewName',
    currentUri: PRESET_GROUP_ICONS[0].uri
  });
  modal.style.display = 'flex';
  modal.classList.add('open');
  document.getElementById('groupchatNameInput')?.focus();
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}

function closeGroupChatCreateModal() {
  const modal = document.getElementById('groupchatCreateModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function openGroupChatSettingsModal() {
  const group = groupChatState.activeGroup;
  if (!group || group.role !== 'owner') return;
  document.getElementById('groupchatSettingsName').value = group.groupName || group.name || '';
  document.getElementById('groupchatSettingsDescription').value = group.description || '';
  const currentAvatar = group.groupAvatarUrl || group.avatarUrl || '';
  const isCustomUrl = currentAvatar && !currentAvatar.startsWith('assets/') && !currentAvatar.startsWith('data:image/svg+xml');
  document.getElementById('groupchatSettingsAvatar').value = isCustomUrl ? currentAvatar : '';
  document.getElementById('groupchatSettingsStatus').textContent = '';

  renderPresetIconPicker({
    gridId: 'groupchatSettingsPresetIcons',
    inputId: 'groupchatSettingsAvatar',
    previewId: 'groupchatSettingsAvatarPreview',
    previewNameId: 'groupchatSettingsAvatarPreviewName',
    currentUri: currentAvatar
  });

  // Populate join policy from Firestore (membership doc may not carry requiresApproval)
  groupChatDb().collection('groups').doc(group.id).get().then(snap => {
    const joinPolicySel = document.getElementById('groupchatSettingsJoinPolicy');
    if (joinPolicySel) joinPolicySel.value = (snap.exists && snap.data().requiresApproval === true) ? 'approval' : 'anyone';
  }).catch(() => {});
  openModal('groupchatSettingsModal');
}

async function unblockGroupUser(groupId, uid) {
  await groupChatAuthUser();
  const db = groupChatDb();
  await db.collection('groups').doc(groupId).collection('blockedUsers').doc(uid).delete();
  if (typeof showToast === 'function') showToast('User unblocked.');
}

async function moderateJoinRequest(groupId, uid, approve) {
  await groupChatAuthUser();
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupId);
  const requestRef = groupRef.collection('joinRequests').doc(uid);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) throw new Error('This request is no longer pending.');
  const data = requestSnapshot.data();
  const batch = db.batch();
  if (approve) {
    batch.set(groupRef.collection('members').doc(uid), { uid, displayName: data.displayName || 'Member', photoURL: data.photoURL || null, role: 'member', joinedAt: firebase.firestore.FieldValue.serverTimestamp() });
    batch.set(db.collection('users').doc(uid).collection('groupMemberships').doc(groupId), { groupId, groupName: data.groupName, groupAvatarUrl: data.groupAvatarUrl || GROUP_CHAT_DEFAULT_AVATAR, role: 'member', joinedAt: firebase.firestore.FieldValue.serverTimestamp(), lastReadAt: null });
    batch.update(groupRef, { memberCount: firebase.firestore.FieldValue.increment(1), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
  batch.delete(requestRef);
  await batch.commit();
}

async function removeGroupMember(groupId, uid, block) {
  await groupChatAuthUser();
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupId);
  const batch = db.batch();
  batch.delete(groupRef.collection('members').doc(uid));
  batch.delete(db.collection('users').doc(uid).collection('groupMemberships').doc(groupId));
  if (block) batch.set(groupRef.collection('blockedUsers').doc(uid), { uid, blockedAt: firebase.firestore.FieldValue.serverTimestamp() });
  batch.update(groupRef, { memberCount: firebase.firestore.FieldValue.increment(-1), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await batch.commit();
}

async function updateGroupSettings() {
  const user = await groupChatAuthUser();
  const group = groupChatState.activeGroup;
  if (!group || group.role !== 'owner' || group.id !== groupChatState.activeGroupId) throw new Error('Only the group owner can change these settings.');
  const name = document.getElementById('groupchatSettingsName').value.trim();
  const description = document.getElementById('groupchatSettingsDescription').value.trim();
  const customAvatar = document.getElementById('groupchatSettingsAvatar')?.value.trim() || '';
  const selectedPreset = document.getElementById('groupchatSettingsPresetIcons')?.dataset.selectedUri || '';
  const avatarUrl = customAvatar || selectedPreset || group.groupAvatarUrl || group.avatarUrl || GROUP_CHAT_DEFAULT_AVATAR;

  if (name.length < 3 || name.length > 80) throw new Error('Group name must be between 3 and 80 characters.');
  if (!description || description.length > 1000) throw new Error('Enter a description under 1000 characters.');
  if (avatarUrl && !avatarUrl.startsWith('data:image/svg+xml') && !avatarUrl.startsWith('assets/')) {
    try {
      const parsed = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch (e) {
      throw new Error('Avatar URL must be a valid HTTPS image URL or preset icon.');
    }
  }
  const db = groupChatDb();
  const batch = db.batch();
  const joinPolicySel = document.getElementById('groupchatSettingsJoinPolicy');
  const requiresApproval = joinPolicySel ? joinPolicySel.value === 'approval' : false;
  batch.update(db.collection('groups').doc(group.id), {
    name, normalizedName: groupChatNormalize(name), description,
    avatarUrl, requiresApproval,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  batch.update(db.collection('users').doc(user.uid).collection('groupMemberships').doc(group.id), {
    groupName: name, groupAvatarUrl: avatarUrl
  });
  await batch.commit();
  group.groupName = name;
  group.name = name;
  group.description = description;
  group.groupAvatarUrl = avatarUrl;
  group.avatarUrl = group.groupAvatarUrl;
  renderMyGroups();
  renderGroupChatHeader();
}

function groupChatInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
}

function groupChatAvatar(url, name, className = 'groupchat-avatar') {
  return url
    ? `<img class="${className}" src="${escapeAttr(url)}" alt="">`
    : `<span class="${className} groupchat-avatar-fallback">${escapeHtml(groupChatInitials(name))}</span>`;
}

function groupChatGroupAvatar(url, name) {
  const effectiveUrl = (!url || url === 'assets/icons/people.png') ? GROUP_CHAT_DEFAULT_AVATAR : url;
  return groupChatAvatar(effectiveUrl, name);
}

function groupChatFormatTime(value) {
  const date = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value || Date.now());
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function groupChatNormalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function renderGroupChatAuth() {
  const user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null;
  const authRequired = document.getElementById('groupchatAuthRequired');
  const app = document.getElementById('groupchatApp');
  if (!authRequired || !app) return;
  authRequired.hidden = !!user;
  app.hidden = !user;
  if (user && groupChatState.initialized) {
    loadMyGroups().catch(error => groupChatError(error, 'Unable to load your groups.'));
  }
  else destroyGroupChatListeners();
}

async function loadMyGroups() {
  if (!groupChatState.initialized) return;
  try {
    const user = await groupChatAuthUser();
    const db = groupChatDb();
    const snapshot = await db.collection('users').doc(user.uid)
      .collection('groupMemberships').orderBy('joinedAt', 'desc').limit(100).get();
    groupChatState.groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMyGroups();

    // Enrich all joined groups with the latest group metadata (avatar, name, memberCount) from groups collection
    if (groupChatState.groups.length > 0) {
      const enrichPromises = groupChatState.groups.map(async (membership) => {
        try {
          const groupSnap = await db.collection('groups').doc(membership.id).get();
          if (groupSnap.exists) {
            const gData = groupSnap.data();
            const latestAvatar = gData.avatarUrl || gData.groupAvatarUrl;
            const latestName = gData.name || gData.groupName;
            let needsUpdate = false;

            if (latestAvatar && latestAvatar !== membership.groupAvatarUrl) {
              membership.groupAvatarUrl = latestAvatar;
              needsUpdate = true;
            }
            if (latestName && latestName !== membership.groupName) {
              membership.groupName = latestName;
              needsUpdate = true;
            }
            if (gData.description !== undefined) membership.description = gData.description;
            if (gData.memberCount !== undefined) membership.memberCount = gData.memberCount;

            // Self-heal: synchronize user's membership doc with the latest group metadata
            if (needsUpdate) {
              db.collection('users').doc(user.uid).collection('groupMemberships').doc(membership.id).update({
                groupAvatarUrl: membership.groupAvatarUrl,
                groupName: membership.groupName
              }).catch(() => {});
            }
          }
        } catch (e) { /* non-critical */ }
      });
      await Promise.all(enrichPromises);
      renderMyGroups();

      if (groupChatState.activeGroupId) {
        const activeItem = groupChatState.groups.find(g => g.id === groupChatState.activeGroupId);
        if (activeItem && groupChatState.activeGroup) {
          Object.assign(groupChatState.activeGroup, activeItem);
          renderGroupChatHeader();
        }
      }
    }

    const isMobile = window.innerWidth <= 768;
    const savedId = groupChatUiState().activeGroupId;
    if (savedId && groupChatState.groups.some(group => group.id === savedId)) {
      selectGroup(savedId);
    } else if (!isMobile && !groupChatState.activeGroupId && groupChatState.groups.length > 0) {
      selectGroup(groupChatState.groups[0].id);
    }
  } catch (error) {
    groupChatError(error, 'Unable to load your groups.');
  }
}

function renderMyGroups() {
  const list = document.getElementById('groupchatMyGroups');
  if (!list) return;
  if (!groupChatState.groups.length) {
    list.innerHTML = '<div class="groupchat-empty">You have not joined a group yet.</div>';
    return;
  }
  list.innerHTML = groupChatState.groups.map(group => `
    <button class="groupchat-group-item ${group.id === groupChatState.activeGroupId ? 'active' : ''}" data-group-id="${escapeAttr(group.id)}" type="button">
      ${groupChatGroupAvatar(group.groupAvatarUrl, group.groupName)}
      <span class="groupchat-group-copy"><strong class="groupchat-group-name">${escapeHtml(group.groupName || 'Unnamed group')}</strong><span class="groupchat-group-meta">${escapeHtml(group.role || 'member')}</span></span>
    </button>`).join('');
  list.querySelectorAll('[data-group-id]').forEach(button => button.addEventListener('click', () => selectGroup(button.dataset.groupId)));
}

async function searchPublicGroups(query) {
  const results = document.getElementById('groupchatSearchResults');
  if (!results) return;
  const term = groupChatNormalize(query);
  if (!term) { results.innerHTML = ''; return; }
  try {
    await groupChatAuthUser();
    const end = `${term}\uf8ff`;
    const snapshot = await groupChatDb().collection('groups').where('isPublic', '==', true)
      .where('normalizedName', '>=', term).where('normalizedName', '<=', end)
      .orderBy('normalizedName').limit(20).get();
    const memberIds = new Set(groupChatState.groups.map(group => group.id));
    results.innerHTML = snapshot.empty ? '<div class="groupchat-empty">No public groups found.</div>' :
      snapshot.docs.map(doc => {
        const group = { id: doc.id, ...doc.data() };
        return `<div class="groupchat-search-item">${groupChatGroupAvatar(group.avatarUrl, group.name)}
          <span class="groupchat-group-copy"><strong class="groupchat-group-name">${escapeHtml(group.name)}</strong><span class="groupchat-group-meta">${escapeHtml(group.description || '')}</span></span>
          ${memberIds.has(group.id) ? '<span class="groupchat-joined">Joined</span>' : `<button class="pill subtle groupchat-join-btn" data-join-id="${escapeAttr(group.id)}" type="button">Join</button>`}</div>`;
      }).join('');
    results.querySelectorAll('[data-join-id]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await joinGroup(button.dataset.joinId); } catch (error) { groupChatError(error, 'Unable to join group.'); button.disabled = false; }
    }));
  } catch (error) {
    results.innerHTML = '<div class="groupchat-empty">Search is unavailable right now.</div>';
    groupChatError(error, 'Unable to search groups.');
  }
}

async function createGroup({ name, description, avatarUrl }) {
  const user = await groupChatAuthUser();
  const cleanName = String(name || '').trim();
  const cleanDescription = String(description || '').trim();
  if (cleanName.length < 3 || cleanName.length > 80) throw new Error('Group name must be between 3 and 80 characters.');
  if (cleanDescription.length > 1000) throw new Error('Description cannot exceed 1000 characters.');
  if (avatarUrl && !avatarUrl.startsWith('data:image/svg+xml') && !avatarUrl.startsWith('assets/')) {
    try {
      const parsedUrl = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch (error) {
      throw new Error('Avatar URL must be a valid HTTPS image URL or preset icon.');
    }
  }
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc();
  const cleanAvatarUrl = avatarUrl || GROUP_CHAT_DEFAULT_AVATAR;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const joinPolicySel = document.getElementById('groupchatJoinPolicyInput');
  const requiresApproval = joinPolicySel ? joinPolicySel.value === 'approval' : false;
  await groupRef.set({
    name: cleanName, normalizedName: groupChatNormalize(cleanName), description: cleanDescription,
    avatarUrl: cleanAvatarUrl, ownerId: user.uid, ownerName: user.displayName || getEffectiveUsername(user),
    ownerAvatarUrl: user.photoURL || null, isPublic: true, requiresApproval, memberCount: 1,
    createdAt: now, updatedAt: now, lastMessageAt: null, lastMessagePreview: null
  });
  const membershipBatch = db.batch();
  membershipBatch.set(groupRef.collection('members').doc(user.uid), {
    uid: user.uid, displayName: user.displayName || getEffectiveUsername(user), photoURL: user.photoURL || null,
    role: 'owner', joinedAt: now
  });
  membershipBatch.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupRef.id), {
    groupId: groupRef.id, groupName: cleanName, groupAvatarUrl: cleanAvatarUrl, role: 'owner', joinedAt: now, lastReadAt: null
  });
  await membershipBatch.commit();
  await groupRef.update({ memberCount: 1, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await loadMyGroups();
  selectGroup(groupRef.id);
}

async function joinGroup(groupId) {
  const user = await groupChatAuthUser();
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupId);
  const groupSnapshot = await groupRef.get();
  if (!groupSnapshot.exists || groupSnapshot.data().isPublic !== true) throw new Error('This group is not available.');
  const data = groupSnapshot.data();
  const memberRef = groupRef.collection('members').doc(user.uid);
  if (data.requiresApproval === true) {
    const requestRef = groupRef.collection('joinRequests').doc(user.uid);
    await requestRef.set({
      uid: user.uid, displayName: user.displayName || 'Member', photoURL: user.photoURL || null,
      groupName: data.name, groupAvatarUrl: data.avatarUrl || GROUP_CHAT_DEFAULT_AVATAR,
      requestedAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'pending'
    });
    if (typeof showToast === 'function') showToast('Join request sent to the group owner.');
    return;
  }
  const memberSnapshot = await memberRef.get();
  if (!memberSnapshot.exists) {
    const data = groupSnapshot.data();
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const membershipBatch = db.batch();
    membershipBatch.set(memberRef, {
      uid: user.uid, displayName: user.displayName || getEffectiveUsername(user),
      photoURL: user.photoURL || null, role: 'member', joinedAt: now
    }, { merge: true });
    membershipBatch.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupId), {
      groupId, groupName: data.name, groupAvatarUrl: data.avatarUrl || GROUP_CHAT_DEFAULT_AVATAR,
      role: 'member', joinedAt: now, lastReadAt: null
    });
    await membershipBatch.commit();
    await groupRef.update({
      memberCount: firebase.firestore.FieldValue.increment(1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  await loadMyGroups();
  selectGroup(groupId);
  if (typeof showToast === 'function') showToast('Joined group.');
}

async function leaveGroup(groupId) {
  const user = await groupChatAuthUser();
  const membership = groupChatState.groups.find(group => group.id === groupId);
  if (membership && membership.role === 'owner') throw new Error('Group owners cannot leave their own group.');
  const db = groupChatDb();
  await db.runTransaction(async transaction => {
    const groupRef = db.collection('groups').doc(groupId);
    const memberRef = groupRef.collection('members').doc(user.uid);
    const memberSnapshot = await transaction.get(memberRef);
    if (!memberSnapshot.exists) return;
    transaction.delete(memberRef);
    transaction.delete(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupId));
    transaction.update(groupRef, { memberCount: firebase.firestore.FieldValue.increment(-1), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  });
  if (groupChatState.activeGroupId === groupId) selectGroup(null);
  await loadMyGroups();
}

async function deleteGroup(groupId) {
  const user = await groupChatAuthUser();
  const group = groupChatState.groups.find(g => g.id === groupId);
  if (!group || group.role !== 'owner') throw new Error('Only the group owner can delete this group.');
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupId);

  // Delete all documents in each subcollection in batches
  async function deleteSubcollection(collRef) {
    let snap;
    do {
      snap = await collRef.limit(400).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } while (!snap.empty);
  }

  await deleteSubcollection(groupRef.collection('members'));
  await deleteSubcollection(groupRef.collection('messages'));
  await deleteSubcollection(groupRef.collection('joinRequests'));
  await deleteSubcollection(groupRef.collection('blockedUsers'));

  // Delete the group doc itself and the owner's own membership record
  const finalBatch = db.batch();
  finalBatch.delete(groupRef);
  finalBatch.delete(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupId));
  await finalBatch.commit();

  // Reset UI
  destroyMessageListener();
  if (groupChatState.activeGroupId === groupId) {
    groupChatState.activeGroupId = null;
    groupChatState.activeGroup = null;
  }
  await loadMyGroups();
  renderGroupChatHeader();
  const composer = document.getElementById('groupchatComposer');
  if (composer) composer.hidden = true;
}

function renderEmptyMessagesSplash() {
  const container = document.getElementById('groupchatMessages');
  if (!container) return;
  container.innerHTML = `
    <div class="groupchat-empty-splash">
      <div class="groupchat-empty-icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
      </div>
      <h3>CareerDesk Study Chat</h3>
      <p>Select a group from the list to collaborate with fellow aspirants, share preparation notes, and solve problems together.</p>
      <div class="groupchat-empty-tip">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>Press <strong>Enter</strong> to send messages, <strong>Shift + Enter</strong> for a new line</span>
      </div>
    </div>`;
}

async function selectGroup(groupId) {
  destroyMessageListener();
  groupChatState.activeGroupId = groupId;
  groupChatState.activeGroup = groupChatState.groups.find(group => group.id === groupId) || null;
  const appShell = document.getElementById('groupchatApp');
  if (groupId) {
    appShell?.classList.add('groupchat-chat-active');
  } else {
    appShell?.classList.remove('groupchat-chat-active');
  }
  renderMyGroups();
  renderGroupChatHeader();
  hideMembersPanel();
  renderPinnedBanner(null); // clear while loading
  const composer = document.getElementById('groupchatComposer');
  if (!groupId) {
    if (composer) composer.hidden = true;
    renderEmptyMessagesSplash();
    saveGroupChatUiState();
    return;
  }
  if (composer) composer.hidden = false;
  saveGroupChatUiState();
  subscribeToMessages(groupId);
  // Subscribe to real-time group details (for dynamic avatar/name updates from owner and pinned messages)
  groupChatState.activeGroupUnsubscribe = groupChatDb().collection('groups').doc(groupId).onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    const latestAvatar = data.avatarUrl || data.groupAvatarUrl;
    const latestName = data.name || data.groupName;

    if (groupChatState.activeGroup) {
      Object.assign(groupChatState.activeGroup, data);
      if (latestAvatar) groupChatState.activeGroup.groupAvatarUrl = latestAvatar;
      if (latestName) groupChatState.activeGroup.groupName = latestName;
    } else {
      groupChatState.activeGroup = { id: groupId, ...data, groupAvatarUrl: latestAvatar, groupName: latestName };
    }

    // Sync active group's latest avatar and name to the sidebar item as well
    const listGroup = groupChatState.groups.find(g => g.id === groupId);
    if (listGroup) {
      let changed = false;
      if (latestAvatar && listGroup.groupAvatarUrl !== latestAvatar) {
        listGroup.groupAvatarUrl = latestAvatar;
        changed = true;
      }
      if (latestName && listGroup.groupName !== latestName) {
        listGroup.groupName = latestName;
        changed = true;
      }
      if (data.memberCount !== undefined && listGroup.memberCount !== data.memberCount) {
        listGroup.memberCount = data.memberCount;
        changed = true;
      }
      if (changed) {
        renderMyGroups();
        const curUser = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null;
        if (curUser) {
          groupChatDb().collection('users').doc(curUser.uid).collection('groupMemberships').doc(groupId).update({
            groupAvatarUrl: latestAvatar,
            groupName: latestName
          }).catch(() => {});
        }
      }
    }

    renderGroupChatHeader();
    renderPinnedBanner(data.pinnedMessage || null);
  }, err => { /* non-critical */ });
}

function renderGroupChatHeader() {
  const header = document.getElementById('groupchatHeader');
  if (!header) return;
  const group = groupChatState.activeGroup;
  if (!group) {
    header.innerHTML = '<span class="groupchat-subtle">Choose a group to start chatting.</span>';
    return;
  }
  const isOwner = group.role === 'owner';
  const memberCount = group.memberCount || '';
  header.innerHTML = `
    <div class="groupchat-header-identity">
      <button class="groupchat-mobile-back-btn" id="groupchatMobileBackBtn" type="button" title="Back to groups" aria-label="Back to groups">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      ${groupChatGroupAvatar(group.groupAvatarUrl || group.avatarUrl, group.groupName || group.name)}
      <div class="groupchat-header-titles">
        <h3 class="groupchat-title">${escapeHtml(group.groupName || group.name)}</h3>
        <span class="groupchat-member-count-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${escapeHtml(String(memberCount || '1'))} members
        </span>
      </div>
    </div>
    <div class="groupchat-header-actions">
      <button class="pill subtle" id="groupchatInviteBtn" type="button" title="Copy invite">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Invite</span>
      </button>
      <button class="pill subtle" id="groupchatMembersBtn" type="button" title="View members">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Members</span>
      </button>
      ${isOwner
        ? `<button class="pill subtle" id="groupchatSettingsBtn" type="button" title="Group settings">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             <span>Settings</span>
           </button>`
        : `<button class="pill subtle danger" id="groupchatLeaveBtn" type="button" title="Leave group">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             <span>Leave</span>
           </button>`
      }
    </div>`;

  document.getElementById('groupchatMobileBackBtn')?.addEventListener('click', () => selectGroup(null));

  document.getElementById('groupchatMembersBtn')?.addEventListener('click', toggleMembersPanel);
  document.getElementById('groupchatInviteBtn')?.addEventListener('click', () => groupChatCopyInvite(group));
  document.getElementById('groupchatSettingsBtn')?.addEventListener('click', openGroupChatSettingsModal);
  document.getElementById('groupchatLeaveBtn')?.addEventListener('click', async () => {
    try { await leaveGroup(group.id); } catch (error) { groupChatError(error, 'Unable to leave group.'); }
  });
  document.getElementById('groupchatMembersPanelClose')?.addEventListener('click', hideMembersPanel);
}

/* ── Members Panel ── */
function toggleMembersPanel() {
  const panel = document.getElementById('groupchatMembersPanel');
  if (!panel) return;
  if (panel.hidden) {
    panel.hidden = false;
    renderMembersPanel();
  } else {
    hideMembersPanel();
  }
}

function hideMembersPanel() {
  const panel = document.getElementById('groupchatMembersPanel');
  if (panel) panel.hidden = true;
}

async function renderMembersPanel() {
  const container = document.getElementById('groupchatMembersList');
  const group = groupChatState.activeGroup;
  if (!container || !group) return;
  container.innerHTML = '<div class="groupchat-empty" style="padding:14px 4px">Loading…</div>';
  try {
    const db = groupChatDb();
    const groupRef = db.collection('groups').doc(group.id);
    const isOwner = group.role === 'owner';

    // Fetch members and if owner, also joinRequests and blockedUsers
    const promises = [groupRef.collection('members').get()];
    if (isOwner) {
      promises.push(groupRef.collection('joinRequests').get());
      promises.push(groupRef.collection('blockedUsers').get());
    }

    const [membersSnap, requestsSnap, blockedSnap] = await Promise.all(promises);

    let html = '';

    // 1. Join Requests (for Group Owner)
    if (isOwner && requestsSnap && !requestsSnap.empty) {
      html += `
        <div class="groupchat-panel-section">
          <div class="groupchat-panel-section-title">
            <span>Join Requests</span>
            <span class="groupchat-badge alert">${requestsSnap.size}</span>
          </div>
          <div class="groupchat-moderation-list">
            ${requestsSnap.docs.map(doc => {
              const req = doc.data();
              return `<div class="groupchat-moderation-row">
                <div class="groupchat-moderation-user">
                  ${groupChatAvatar(req.photoURL, req.displayName || 'Applicant', 'groupchat-avatar small')}
                  <span class="groupchat-moderation-name" title="${escapeAttr(req.displayName || doc.id)}">${escapeHtml(req.displayName || 'Applicant')}</span>
                </div>
                <div class="groupchat-moderation-actions">
                  <button class="micro-btn" data-approve-uid="${escapeAttr(doc.id)}" type="button" title="Approve Request">✓</button>
                  <button class="micro-btn danger" data-reject-uid="${escapeAttr(doc.id)}" type="button" title="Reject Request">✕</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    // 2. Members List
    const membersDocs = membersSnap.docs.slice().sort((a, b) => {
      if (a.data().role === 'owner') return -1;
      if (b.data().role === 'owner') return 1;
      return (a.data().displayName || '').localeCompare(b.data().displayName || '');
    });

    html += `
      <div class="groupchat-panel-section">
        <div class="groupchat-panel-section-title">
          <span>Members</span>
          <span class="groupchat-badge">${membersDocs.length}</span>
        </div>
        <div class="groupchat-members-list">
          ${membersDocs.length === 0 ? '<div class="groupchat-empty" style="padding:10px 4px">No members found.</div>' :
            membersDocs.map(doc => {
              const m = doc.data();
              const isThisOwner = m.role === 'owner';
              const actions = isOwner && !isThisOwner
                ? `<div class="groupchat-member-actions">
                     <button class="micro-btn danger" data-remove-uid="${escapeAttr(doc.id)}" type="button" title="Remove member">✕</button>
                     <button class="micro-btn danger" data-block-uid="${escapeAttr(doc.id)}" type="button" title="Block member">🚫</button>
                   </div>`
                : '';
              return `<div class="groupchat-member-row">
                ${groupChatAvatar(m.photoURL, m.displayName, 'groupchat-avatar small')}
                <div class="groupchat-member-info">
                  <div class="groupchat-member-name">${escapeHtml(m.displayName || 'Member')}</div>
                  <span class="groupchat-role-badge ${isThisOwner ? 'owner' : 'member'}">${isThisOwner ? '👑 Owner' : 'Member'}</span>
                </div>
                ${actions}
              </div>`;
            }).join('')}
        </div>
      </div>`;

    // 3. Blocked Users (for Group Owner)
    if (isOwner && blockedSnap && !blockedSnap.empty) {
      html += `
        <div class="groupchat-panel-section">
          <div class="groupchat-panel-section-title">
            <span>Blocked Users</span>
            <span class="groupchat-badge">${blockedSnap.size}</span>
          </div>
          <div class="groupchat-moderation-list">
            ${blockedSnap.docs.map(doc => {
              return `<div class="groupchat-moderation-row">
                <span class="groupchat-moderation-name">ID: ${escapeHtml(doc.id.slice(0, 8))}…</span>
                <button class="micro-btn" data-unblock-uid="${escapeAttr(doc.id)}" type="button" title="Unblock user">Unblock</button>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = html;

    // Wire Join Request buttons
    container.querySelectorAll('[data-approve-uid]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await moderateJoinRequest(group.id, btn.dataset.approveUid, true);
        if (typeof showToast === 'function') showToast('Request approved.');
        renderMembersPanel();
      } catch (e) {
        btn.disabled = false;
        groupChatError(e, 'Unable to approve request.');
      }
    }));
    container.querySelectorAll('[data-reject-uid]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await moderateJoinRequest(group.id, btn.dataset.rejectUid, false);
        if (typeof showToast === 'function') showToast('Request rejected.');
        renderMembersPanel();
      } catch (e) {
        btn.disabled = false;
        groupChatError(e, 'Unable to reject request.');
      }
    }));

    // Wire Member remove & block buttons
    container.querySelectorAll('[data-remove-uid]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Remove this member from the group?')) return;
      try {
        await removeGroupMember(group.id, btn.dataset.removeUid, false);
        if (typeof showToast === 'function') showToast('Member removed.');
        renderMembersPanel();
      } catch (e) { groupChatError(e, 'Unable to remove member.'); }
    }));
    container.querySelectorAll('[data-block-uid]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Block this member? They will be removed and cannot request to join again.')) return;
      try {
        await removeGroupMember(group.id, btn.dataset.blockUid, true);
        if (typeof showToast === 'function') showToast('Member blocked.');
        renderMembersPanel();
      } catch (e) { groupChatError(e, 'Unable to block member.'); }
    }));

    // Wire Unblock buttons
    container.querySelectorAll('[data-unblock-uid]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        await unblockGroupUser(group.id, btn.dataset.unblockUid);
        renderMembersPanel();
      } catch (e) { groupChatError(e, 'Unable to unblock user.'); }
    }));

  } catch (e) {
    container.innerHTML = '<div class="groupchat-empty" style="padding:12px 4px">Failed to load members.</div>';
  }
}

/* ── Pinned Message ── */
function renderPinnedBanner(pinnedMessage) {
  const banner = document.getElementById('groupchatPinnedBanner');
  if (!banner) return;
  if (!pinnedMessage || !pinnedMessage.text) { banner.hidden = true; banner.innerHTML = ''; return; }
  const isOwner = groupChatState.activeGroup?.role === 'owner';
  banner.hidden = false;
  banner.innerHTML = `
    <span class="groupchat-pinned-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17H19V15L17 11V6H18V4H6V6H7V11L5 15V17Z"/></svg>
    </span>
    <div class="groupchat-pinned-content">
      <div class="groupchat-pinned-label">📌 Pinned · ${escapeHtml(pinnedMessage.senderName || '')}</div>
      <div class="groupchat-pinned-text">${escapeHtml(pinnedMessage.text)}</div>
    </div>
    ${isOwner ? `<button class="micro-btn groupchat-pinned-unpin" id="groupchatUnpinBtn" type="button" title="Unpin">Unpin</button>` : ''}`;
  if (isOwner) {
    banner.querySelector('#groupchatUnpinBtn')?.addEventListener('click', async () => {
      try { await unpinMessage(); } catch (e) { groupChatError(e, 'Unable to unpin.'); }
    });
  }
}

async function pinMessage(messageId, text, senderName) {
  const group = groupChatState.activeGroup;
  if (!group || group.role !== 'owner') return;
  const pinnedMessage = { messageId, text: text.slice(0, 200), senderName };
  await groupChatDb().collection('groups').doc(group.id).update({ pinnedMessage });
  renderPinnedBanner(pinnedMessage);
  if (typeof showToast === 'function') showToast('Message pinned.');
}

async function unpinMessage() {
  const group = groupChatState.activeGroup;
  if (!group || group.role !== 'owner') return;
  await groupChatDb().collection('groups').doc(group.id).update({ pinnedMessage: firebase.firestore.FieldValue.delete() });
  renderPinnedBanner(null);
  if (typeof showToast === 'function') showToast('Message unpinned.');
}

/* ── Invite / Share ── */
function groupChatCopyInvite(group) {
  const name = group.groupName || group.name || 'this group';
  const text = `Join "${name}" study group on CareerDesk! Search for it in the Group Chat tab.`;
  navigator.clipboard?.writeText(text).then(() => {
    const btn = document.getElementById('groupchatInviteBtn');
    if (!btn) return;
    btn.classList.add('groupchat-invite-copied');
    const span = btn.querySelector('span');
    if (span) { span.textContent = 'Copied!'; }
    setTimeout(() => {
      btn.classList.remove('groupchat-invite-copied');
      if (span) span.textContent = 'Invite';
    }, 2200);
  }).catch(() => { if (typeof showToast === 'function') showToast('Copy failed — try manually.', true); });
}

async function subscribeToMessages(groupId) {
  try {
    const user = await groupChatAuthUser();
    const container = document.getElementById('groupchatMessages');
    if (container && !groupChatState.messages.length) {
      container.innerHTML = '<div class="groupchat-empty">Loading messages...</div>';
    }
    groupChatState.hasMoreOlder = true;
    groupChatState.olderMessages = [];
    groupChatState.recentMessages = [];
    let isInitialLoad = true;

    groupChatState.messagesUnsubscribe = groupChatDb().collection('groups').doc(groupId).collection('messages')
      .orderBy('createdAt', 'asc').limitToLast(GROUP_CHAT_PAGE_SIZE).onSnapshot(snapshot => {
        groupChatState.recentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (snapshot.size < GROUP_CHAT_PAGE_SIZE && !groupChatState.olderMessages.length) {
          groupChatState.hasMoreOlder = false;
        }
        recombineMessages(user.uid, isInitialLoad);
        isInitialLoad = false;
        saveGroupChatUiState();
      }, error => groupChatError(error, 'Unable to load group messages.'));
  } catch (error) { groupChatError(error, 'Unable to open this group.'); }
}

function recombineMessages(uid, scrollToBottom = false) {
  const container = document.getElementById('groupchatMessages');
  const wasAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 80) : true;

  // Combine older + recent, deduplicated by id
  const map = new Map();
  groupChatState.olderMessages.forEach(m => map.set(m.id, m));
  groupChatState.recentMessages.forEach(m => map.set(m.id, m));
  groupChatState.messages = Array.from(map.values()).sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return tA - tB;
  });

  renderMessages(uid);

  if (container && (scrollToBottom || wasAtBottom)) {
    container.scrollTop = container.scrollHeight;
  }
}

async function loadOlderMessages() {
  if (groupChatState.loadingOlder || !groupChatState.hasMoreOlder || !groupChatState.activeGroupId) return;
  const oldest = groupChatState.olderMessages[0] || groupChatState.recentMessages[0];
  if (!oldest || !oldest.createdAt) {
    groupChatState.hasMoreOlder = false;
    const user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null;
    if (user) renderMessages(user.uid);
    return;
  }

  groupChatState.loadingOlder = true;
  const loadBtn = document.getElementById('groupchatLoadOlderBtn');
  if (loadBtn) {
    loadBtn.disabled = true;
    loadBtn.innerHTML = '<span>Loading older messages…</span>';
  }

  try {
    const user = await groupChatAuthUser();
    const container = document.getElementById('groupchatMessages');
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    const snap = await groupChatDb().collection('groups').doc(groupChatState.activeGroupId).collection('messages')
      .orderBy('createdAt', 'desc')
      .startAfter(oldest.createdAt)
      .limit(30)
      .get();

    if (snap.empty || snap.size < 30) {
      groupChatState.hasMoreOlder = false;
    }

    if (!snap.empty) {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      groupChatState.olderMessages = fetched.concat(groupChatState.olderMessages);
    }

    recombineMessages(user.uid, false);

    // Anchor scroll position so view doesn't jump
    if (container) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
    }
  } catch (error) {
    groupChatError(error, 'Unable to load older messages.');
  } finally {
    groupChatState.loadingOlder = false;
  }
}

function groupChatFormatDateBadge(createdAt) {
  if (!createdAt) return 'Recent';
  const date = createdAt.toDate ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : new Date(createdAt));
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - msgDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' })
  });
}

function renderMessages(uid) {
  const container = document.getElementById('groupchatMessages');
  if (!container) return;
  const isOwner = groupChatState.activeGroup?.role === 'owner';

  if (!groupChatState.messages.length) {
    container.innerHTML = '<div class="groupchat-empty">No messages yet. Start the conversation!</div>';
    return;
  }

  let headerHtml = '';
  if (groupChatState.hasMoreOlder) {
    headerHtml = `
      <div class="groupchat-load-older-wrap">
        <button id="groupchatLoadOlderBtn" class="groupchat-load-older-btn" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          <span>Load older messages</span>
        </button>
      </div>`;
  } else if (groupChatState.messages.length >= 10) {
    headerHtml = `<div class="groupchat-history-start">— Start of message history —</div>`;
  }

  let lastDateBadge = '';
  let messagesHtml = '';
  for (const message of groupChatState.messages) {
    const isMine = message.senderId === uid;
    const dateBadge = groupChatFormatDateBadge(message.createdAt);
    if (dateBadge && dateBadge !== lastDateBadge) {
      messagesHtml += `<div class="groupchat-date-separator"><span>${escapeHtml(dateBadge)}</span></div>`;
      lastDateBadge = dateBadge;
    }
    const pinBtn = isOwner
      ? `<div class="chat-bubble-actions"><button class="micro-btn" data-pin-id="${escapeAttr(message.id)}" type="button" title="Pin this message">📌</button></div>`
      : '';
    messagesHtml += `<article class="chat-bubble ${isMine ? 'me' : ''}">
      ${pinBtn}
      <div class="chat-sender">${groupChatAvatar(message.senderAvatarUrl, message.senderName, 'groupchat-avatar small')}<span>${escapeHtml(message.senderName || 'Member')}</span><time>${escapeHtml(groupChatFormatTime(message.createdAt))}</time></div>
      <div class="text">${escapeHtml(message.text || '')}</div>
    </article>`;
  }

  container.innerHTML = headerHtml + messagesHtml;

  // Wire load older button
  const loadBtn = document.getElementById('groupchatLoadOlderBtn');
  if (loadBtn) {
    loadBtn.addEventListener('click', loadOlderMessages);
  }

  // Wire pin buttons
  container.querySelectorAll('[data-pin-id]').forEach(btn => btn.addEventListener('click', async () => {
    const msg = groupChatState.messages.find(m => m.id === btn.dataset.pinId);
    if (!msg) return;
    try { await pinMessage(msg.id, msg.text || '', msg.senderName || 'Member'); } catch (e) { groupChatError(e, 'Unable to pin message.'); }
  }));
}

async function sendGroupChatMessage(text) {
  const user = await groupChatAuthUser();
  const cleanText = String(text || '').trim();
  if (!groupChatState.activeGroupId) throw new Error('Select a group first.');
  if (!cleanText || cleanText.length > 4000) throw new Error('Message must be between 1 and 4000 characters.');
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupChatState.activeGroupId);
  const memberRef = groupRef.collection('members').doc(user.uid);
  const messageRef = groupRef.collection('messages').doc();
  await db.runTransaction(async transaction => {
    const [groupSnapshot, memberSnapshot] = await Promise.all([transaction.get(groupRef), transaction.get(memberRef)]);
    if (!groupSnapshot.exists || !memberSnapshot.exists) throw new Error('You are no longer a member of this group.');
    const now = firebase.firestore.FieldValue.serverTimestamp();
    transaction.set(messageRef, { senderId: user.uid, senderName: user.displayName || getEffectiveUsername(user), senderAvatarUrl: user.photoURL || null, text: cleanText, createdAt: now, editedAt: null, deletedAt: null });
    transaction.update(groupRef, { updatedAt: now, lastMessageAt: now, lastMessagePreview: cleanText.slice(0, 120) });
  });
  const container = document.getElementById('groupchatMessages');
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}

function destroyMessageListener() {
  if (groupChatState.messagesUnsubscribe) groupChatState.messagesUnsubscribe();
  groupChatState.messagesUnsubscribe = null;
  if (groupChatState.activeGroupUnsubscribe) groupChatState.activeGroupUnsubscribe();
  groupChatState.activeGroupUnsubscribe = null;
  groupChatState.recentMessages = [];
  groupChatState.olderMessages = [];
  groupChatState.messages = [];
  groupChatState.hasMoreOlder = true;
  groupChatState.loadingOlder = false;
}

function destroyGroupChatListeners() {
  destroyMessageListener();
  if (groupChatState.groupsUnsubscribe) groupChatState.groupsUnsubscribe();
  groupChatState.groupsUnsubscribe = null;
}

function initGroupChat() {
  if (groupChatState.initialized) { renderGroupChatAuth(); return; }
  groupChatState.initialized = true;
  const search = document.getElementById('groupchatSearchInput');
  const createButton = document.getElementById('groupchatCreateBtn');
  const loginButton = document.getElementById('groupchatLoginBtn');
  const createForm = document.getElementById('groupchatCreateForm');
  const composer = document.getElementById('groupchatComposer');

  if (search) {
    let timer;
    search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => searchPublicGroups(search.value), 250); });
  }
  if (createButton) {
    createButton.dataset.groupchatBound = 'true';
    createButton.addEventListener('click', async () => {
    try {
      await groupChatAuthUser();
      openGroupChatCreateModal();
    } catch (error) {
      groupChatError(error, 'Please sign in first.');
      if (typeof openAuthModal === 'function') openAuthModal('login');
    }
    });
  }
  if (loginButton) loginButton.addEventListener('click', () => { if (typeof openAuthModal === 'function') openAuthModal('login'); });
  if (createForm) createForm.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopPropagation();
    const submitButton = document.getElementById('groupchatSubmitBtn');
    const status = document.getElementById('groupchatCreateStatus');
    try {
      const name = document.getElementById('groupchatNameInput').value.trim();
      const description = document.getElementById('groupchatDescriptionInput').value.trim();
      const customAvatar = document.getElementById('groupchatAvatarInput')?.value.trim() || '';
      const selectedPreset = document.getElementById('groupchatCreatePresetIcons')?.dataset.selectedUri || '';
      const avatarUrl = customAvatar || selectedPreset || GROUP_CHAT_DEFAULT_AVATAR;

      if (name.length < 3 || name.length > 80) throw new Error('Group name must be between 3 and 80 characters.');
      if (!description) throw new Error('Please enter a group description.');
      if (description.length > 1000) throw new Error('Description cannot exceed 1000 characters.');
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Creating...'; }
      if (status) { status.textContent = 'Creating group...'; status.className = 'groupchat-form-status'; }
      await createGroup({ name, description, avatarUrl });
      createForm.reset(); closeGroupChatCreateModal(); if (typeof showToast === 'function') showToast('Group created.');
    } catch (error) {
      groupChatError(error, 'Unable to create group.');
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Create Group'; }
    }
  });
  const settingsForm = document.getElementById('groupchatSettingsForm');
  if (settingsForm) settingsForm.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('groupchatSettingsStatus');
    const button = document.getElementById('groupchatSettingsSubmit');
    try {
      button.disabled = true;
      button.textContent = 'Saving...';
      status.textContent = 'Saving settings...';
      await updateGroupSettings();
      closeModal('groupchatSettingsModal');
      if (typeof showToast === 'function') showToast('Group settings updated.');
    } catch (error) {
      status.textContent = error.message || 'Unable to update group settings.';
      status.className = 'groupchat-form-status error';
      groupChatError(error, 'Unable to update group settings.');
    } finally {
      button.disabled = false;
      button.textContent = 'Save Settings';
    }
  });
  const deleteGroupBtn = document.getElementById('groupchatDeleteGroupBtn');
  if (deleteGroupBtn) deleteGroupBtn.addEventListener('click', async () => {
    const group = groupChatState.activeGroup;
    if (!group) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${group.groupName || group.name}"?\n\nAll messages and members will be removed. This cannot be undone.`);
    if (!confirmed) return;
    deleteGroupBtn.disabled = true;
    deleteGroupBtn.textContent = 'Deleting...';
    try {
      await deleteGroup(group.id);
      closeModal('groupchatSettingsModal');
      if (typeof showToast === 'function') showToast('Group deleted.');
    } catch (error) {
      groupChatError(error, 'Unable to delete group.');
      deleteGroupBtn.disabled = false;
      deleteGroupBtn.innerHTML = '<i data-lucide="trash-2"></i><span>Delete Group</span>';
      if (window.lucide) window.lucide.createIcons({ el: deleteGroupBtn });
    }
  });
  const composerInput = document.getElementById('groupchatMessageInput');
  if (composer) {
    composer.addEventListener('submit', async event => {
      event.preventDefault();
      if (!composerInput || !composerInput.value.trim()) return;
      const text = composerInput.value;
      composerInput.value = '';
      composerInput.style.height = 'auto';
      try {
        await sendGroupChatMessage(text);
      } catch (error) {
        composerInput.value = text;
        composerInput.style.height = 'auto';
        groupChatError(error, 'Unable to send message.');
      }
    });
  }

  if (composerInput) {
    const resizeInput = () => {
      composerInput.style.height = 'auto';
      const h = Math.min(composerInput.scrollHeight, 120);
      composerInput.style.height = Math.max(24, h) + 'px';
    };
    composerInput.addEventListener('input', resizeInput);
    composerInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (composer) composer.requestSubmit();
      }
    });
  }

  const messagesBox = document.getElementById('groupchatMessages');
  const scrollBottomBtn = document.getElementById('groupchatScrollBottomBtn');
  if (messagesBox) {
    const onMessagesScroll = () => {
      if (messagesBox.scrollTop <= 15 && groupChatState.hasMoreOlder && !groupChatState.loadingOlder) {
        loadOlderMessages();
      }
      if (scrollBottomBtn) {
        const distFromBottom = messagesBox.scrollHeight - messagesBox.scrollTop - messagesBox.clientHeight;
        scrollBottomBtn.hidden = distFromBottom <= 140;
      }
    };
    messagesBox.addEventListener('scroll', onMessagesScroll, { passive: true });
    if (scrollBottomBtn) {
      scrollBottomBtn.addEventListener('click', () => {
        messagesBox.scrollTo({ top: messagesBox.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  document.addEventListener('click', async event => {
    const createTrigger = event.target.closest('#groupchatCreateBtn, #groupchatSidebarCreateBtn');
    if (createTrigger && !createTrigger.dataset.groupchatBound) {
      event.preventDefault();
      try {
        await groupChatAuthUser();
        openGroupChatCreateModal();
      } catch (error) {
        groupChatError(error, 'Please sign in first.');
        if (typeof openAuthModal === 'function') openAuthModal('login');
      }
    }
    if (event.target.closest('[data-close="groupchatCreateModal"]')) {
      closeGroupChatCreateModal();
    }
  });
  renderGroupChatAuth();
}

window.initGroupChat = initGroupChat;
window.destroyGroupChatListeners = destroyGroupChatListeners;
window.addEventListener('careerdesk-auth-state-changed', renderGroupChatAuth);
