/* CareerDesk Group Chat: authenticated Firestore groups and real-time messages. */

const GROUP_CHAT_UI_KEY = 'careerdesk-groupchat-ui-v1';
const GROUP_CHAT_PAGE_SIZE = 50;
const GROUP_CHAT_DEFAULT_AVATAR = 'assets/icons/people.png';
const GROUP_CHAT_GENERAL_ID = 'general';
let groupChatState = {
  activeGroupId: null,
  groupsUnsubscribe: null,
  messagesUnsubscribe: null,
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

let generalGroupPromise = null;

function groupChatUser() {
  const user = typeof getCachedAuthUser === 'function' ? getCachedAuthUser() : null;
  if (!user) throw new Error('Please sign in to use Group Chat.');
  return user;
}

async function ensureGeneralGroup() {
  if (generalGroupPromise) return generalGroupPromise;
  generalGroupPromise = (async () => {
    const user = await groupChatAuthUser();
    const db = groupChatDb();
    const groupRef = db.collection('groups').doc(GROUP_CHAT_GENERAL_ID);
    const groupSnapshot = await groupRef.get();
    if (!groupSnapshot.exists) {
      const now = firebase.firestore.FieldValue.serverTimestamp();
      await groupRef.set({
        name: 'General',
        normalizedName: 'general',
        description: 'A public study community for everyone on CareerDesk.',
        avatarUrl: GROUP_CHAT_DEFAULT_AVATAR,
        ownerId: user.uid,
        ownerName: user.displayName || getEffectiveUsername(user),
        ownerAvatarUrl: user.photoURL || null,
        isPublic: true,
        requiresApproval: false,
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: null,
        lastMessagePreview: null
      });
      const membershipBatch = db.batch();
      membershipBatch.set(groupRef.collection('members').doc(user.uid), {
        uid: user.uid,
        displayName: user.displayName || getEffectiveUsername(user),
        photoURL: user.photoURL || null,
        role: 'owner',
        joinedAt: now
      });
      membershipBatch.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(GROUP_CHAT_GENERAL_ID), {
        groupId: GROUP_CHAT_GENERAL_ID,
        groupName: 'General',
        groupAvatarUrl: GROUP_CHAT_DEFAULT_AVATAR,
        role: 'owner',
        joinedAt: now,
        lastReadAt: null
      });
      try {
        await membershipBatch.commit();
        await groupRef.update({ memberCount: 1, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } catch (error) {
        if (error.code !== 'already-exists' && error.code !== 'failed-precondition') throw error;
      }
    }
    const memberRef = groupRef.collection('members').doc(user.uid);
    const memberSnapshot = await memberRef.get();
    if (!memberSnapshot.exists) {
      const group = (await groupRef.get()).data();
      const now = firebase.firestore.FieldValue.serverTimestamp();
      const membershipBatch = db.batch();
      membershipBatch.set(memberRef, {
        uid: user.uid,
        displayName: user.displayName || getEffectiveUsername(user),
        photoURL: user.photoURL || null,
        role: 'member',
        joinedAt: now
      });
      membershipBatch.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(GROUP_CHAT_GENERAL_ID), {
        groupId: GROUP_CHAT_GENERAL_ID,
        groupName: group.name,
        groupAvatarUrl: group.avatarUrl || GROUP_CHAT_DEFAULT_AVATAR,
        role: 'member',
        joinedAt: now,
        lastReadAt: null
      });
      await membershipBatch.commit();
      await groupRef.update({
        memberCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: now
      });
    }
  })().finally(() => { generalGroupPromise = null; });
  return generalGroupPromise;
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

function openGroupChatCreateModal() {
  const modal = document.getElementById('groupchatCreateModal');
  if (!modal) {
    groupChatError(new Error('Create Group dialog is missing from the page.'), 'Unable to open Create Group.');
    return;
  }
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
  document.getElementById('groupchatSettingsAvatar').value = group.groupAvatarUrl || group.avatarUrl || '';
  document.getElementById('groupchatSettingsStatus').textContent = '';
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
  const avatarUrl = document.getElementById('groupchatSettingsAvatar').value.trim();
  if (name.length < 3 || name.length > 80) throw new Error('Group name must be between 3 and 80 characters.');
  if (!description || description.length > 1000) throw new Error('Enter a description under 1000 characters.');
  if (avatarUrl) {
    const parsed = new URL(avatarUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Avatar URL must use HTTPS.');
  }
  const db = groupChatDb();
  const batch = db.batch();
  const joinPolicySel = document.getElementById('groupchatSettingsJoinPolicy');
  const requiresApproval = joinPolicySel ? joinPolicySel.value === 'approval' : false;
  batch.update(db.collection('groups').doc(group.id), {
    name, normalizedName: groupChatNormalize(name), description,
    avatarUrl: avatarUrl || GROUP_CHAT_DEFAULT_AVATAR, requiresApproval,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  batch.update(db.collection('users').doc(user.uid).collection('groupMemberships').doc(group.id), {
    groupName: name, groupAvatarUrl: avatarUrl || GROUP_CHAT_DEFAULT_AVATAR
  });
  await batch.commit();
  group.groupName = name;
  group.name = name;
  group.description = description;
  group.groupAvatarUrl = avatarUrl || GROUP_CHAT_DEFAULT_AVATAR;
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
  return groupChatAvatar(url || GROUP_CHAT_DEFAULT_AVATAR, name);
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
    ensureGeneralGroup()
      .then(() => loadMyGroups())
      .catch(error => groupChatError(error, 'Unable to initialize the General group.'));
  }
  else destroyGroupChatListeners();
}

async function loadMyGroups() {
  if (!groupChatState.initialized) return;
  try {
    const user = await groupChatAuthUser();
    const snapshot = await groupChatDb().collection('users').doc(user.uid)
      .collection('groupMemberships').orderBy('joinedAt', 'desc').limit(100).get();
    groupChatState.groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMyGroups();
    const savedId = groupChatUiState().activeGroupId;
    if (savedId && groupChatState.groups.some(group => group.id === savedId)) {
      selectGroup(savedId);
    } else if (!groupChatState.activeGroupId && groupChatState.groups.length > 0) {
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
  if (avatarUrl) {
    try {
      const parsedUrl = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch (error) {
      throw new Error('Avatar URL must be a valid HTTPS image URL.');
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
    membershipBatch.create(memberRef, {
      uid: user.uid, displayName: user.displayName || getEffectiveUsername(user),
      photoURL: user.photoURL || null, role: 'member', joinedAt: now
    });
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

async function selectGroup(groupId) {
  destroyMessageListener();
  groupChatState.activeGroupId = groupId;
  groupChatState.activeGroup = groupChatState.groups.find(group => group.id === groupId) || null;
  renderMyGroups();
  renderGroupChatHeader();
  hideMembersPanel();
  renderPinnedBanner(null); // clear while loading
  const composer = document.getElementById('groupchatComposer');
  if (!groupId) { if (composer) composer.hidden = true; return; }
  if (composer) composer.hidden = false;
  saveGroupChatUiState();
  subscribeToMessages(groupId);
  // Load pinned message and fresh group details
  try {
    const snap = await groupChatDb().collection('groups').doc(groupId).get();
    if (snap.exists) {
      const data = snap.data();
      if (groupChatState.activeGroup) {
        Object.assign(groupChatState.activeGroup, data);
      } else {
        groupChatState.activeGroup = { id: groupId, ...data };
      }
      renderGroupChatHeader();
      renderPinnedBanner(data.pinnedMessage || null);
    }
  } catch (e) { /* non-critical */ }
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
      ${groupChatGroupAvatar(group.groupAvatarUrl || group.avatarUrl, group.groupName || group.name)}
      <div>
        <h3 class="groupchat-title">${escapeHtml(group.groupName || group.name)}</h3>
        <span class="groupchat-member-count-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${escapeHtml(String(memberCount))} members
        </span>
      </div>
    </div>
    <div class="groupchat-header-actions">
      <button class="pill subtle" id="groupchatInviteBtn" type="button" title="Copy invite">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Invite</span>
      </button>
      <button class="pill subtle" id="groupchatMembersBtn" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Members</span>
      </button>
      ${isOwner
        ? `<button class="pill subtle" id="groupchatSettingsBtn" type="button">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             <span>Settings</span>
           </button>`
        : `<button class="pill subtle danger" id="groupchatLeaveBtn" type="button">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             <span>Leave</span>
           </button>`
      }
    </div>`;

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

function renderMessages(uid) {
  const container = document.getElementById('groupchatMessages');
  if (!container) return;
  const isOwner = groupChatState.activeGroup?.role === 'owner';

  if (!groupChatState.messages.length) {
    container.innerHTML = '<div class="groupchat-empty">No messages yet. Start the conversation.</div>';
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

  const messagesHtml = groupChatState.messages.map(message => {
    const isMine = message.senderId === uid;
    const pinBtn = isOwner
      ? `<div class="chat-bubble-actions"><button class="micro-btn" data-pin-id="${escapeAttr(message.id)}" type="button" title="Pin this message">📌</button></div>`
      : '';
    return `<article class="chat-bubble ${isMine ? 'me' : ''}">
      ${pinBtn}
      <div class="chat-sender">${groupChatAvatar(message.senderAvatarUrl, message.senderName, 'groupchat-avatar small')}<span>${escapeHtml(message.senderName || 'Member')}</span><time>${escapeHtml(groupChatFormatTime(message.createdAt))}</time></div>
      <div class="text">${escapeHtml(message.text || '')}</div>
    </article>`;
  }).join('');

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
  if (container) container.scrollTop = container.scrollHeight;
}

function destroyMessageListener() {
  if (groupChatState.messagesUnsubscribe) groupChatState.messagesUnsubscribe();
  groupChatState.messagesUnsubscribe = null;
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
      const avatarUrl = document.getElementById('groupchatAvatarInput').value.trim();
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
  if (composer) composer.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('groupchatMessageInput');
    try { await sendGroupChatMessage(input.value); input.value = ''; } catch (error) { groupChatError(error, 'Unable to send message.'); }
  });
  const messagesBox = document.getElementById('groupchatMessages');
  if (messagesBox) {
    messagesBox.addEventListener('scroll', () => {
      if (messagesBox.scrollTop <= 15 && groupChatState.hasMoreOlder && !groupChatState.loadingOlder) {
        loadOlderMessages();
      }
    });
  }
  document.addEventListener('click', async event => {
    const createTrigger = event.target.closest('#groupchatCreateBtn');
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
