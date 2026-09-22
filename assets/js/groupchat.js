/* CareerDesk Group Chat: authenticated Firestore groups and real-time messages. */

const GROUP_CHAT_UI_KEY = 'careerdesk-groupchat-ui-v1';
const GROUP_CHAT_PAGE_SIZE = 50;
const GROUP_CHAT_DEFAULT_AVATAR = 'assets/icons/people.png';
let groupChatState = {
  activeGroupId: null,
  groupsUnsubscribe: null,
  messagesUnsubscribe: null,
  groups: [],
  activeGroup: null,
  messages: [],
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
    if (!firebase.auth().currentUser) await new Promise(resolve => setTimeout(resolve, 500));
    if (firebase.auth().currentUser) {
      return groupChatUser();
    }
  }
  return groupChatUser();
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
    loadMyGroups();
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
    if (!groupChatState.activeGroupId && savedId && groupChatState.groups.some(group => group.id === savedId)) {
      selectGroup(savedId);
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
  const batch = db.batch();
  batch.set(groupRef, {
    name: cleanName, normalizedName: groupChatNormalize(cleanName), description: cleanDescription,
    avatarUrl: cleanAvatarUrl, ownerId: user.uid, ownerName: user.displayName || getEffectiveUsername(user),
    ownerAvatarUrl: user.photoURL || null, isPublic: true, memberCount: 1,
    createdAt: now, updatedAt: now, lastMessageAt: null, lastMessagePreview: null
  });
  batch.set(groupRef.collection('members').doc(user.uid), {
    uid: user.uid, displayName: user.displayName || getEffectiveUsername(user), photoURL: user.photoURL || null,
    role: 'owner', joinedAt: now
  });
  batch.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupRef.id), {
    groupId: groupRef.id, groupName: cleanName, groupAvatarUrl: cleanAvatarUrl, role: 'owner', joinedAt: now, lastReadAt: null
  });
  await batch.commit();
  await loadMyGroups();
  selectGroup(groupRef.id);
}

async function joinGroup(groupId) {
  const user = await groupChatAuthUser();
  const db = groupChatDb();
  const groupRef = db.collection('groups').doc(groupId);
  await db.runTransaction(async transaction => {
    const groupSnapshot = await transaction.get(groupRef);
    if (!groupSnapshot.exists || groupSnapshot.data().isPublic !== true) throw new Error('This group is not available.');
    const memberRef = groupRef.collection('members').doc(user.uid);
    const memberSnapshot = await transaction.get(memberRef);
    if (memberSnapshot.exists) return;
    const data = groupSnapshot.data();
    const now = firebase.firestore.FieldValue.serverTimestamp();
    transaction.set(memberRef, { uid: user.uid, displayName: user.displayName || getEffectiveUsername(user), photoURL: user.photoURL || null, role: 'member', joinedAt: now });
    transaction.set(db.collection('users').doc(user.uid).collection('groupMemberships').doc(groupId), { groupId, groupName: data.name, groupAvatarUrl: data.avatarUrl || null, role: 'member', joinedAt: now, lastReadAt: null });
    transaction.update(groupRef, { memberCount: firebase.firestore.FieldValue.increment(1), updatedAt: now });
  });
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

async function selectGroup(groupId) {
  destroyMessageListener();
  groupChatState.activeGroupId = groupId;
  groupChatState.activeGroup = groupChatState.groups.find(group => group.id === groupId) || null;
  renderMyGroups();
  renderGroupChatHeader();
  const composer = document.getElementById('groupchatComposer');
  if (!groupId) { if (composer) composer.hidden = true; return; }
  if (composer) composer.hidden = false;
  saveGroupChatUiState();
  subscribeToMessages(groupId);
}

function renderGroupChatHeader() {
  const header = document.getElementById('groupchatHeader');
  if (!header) return;
  const group = groupChatState.activeGroup;
  if (!group) { header.innerHTML = '<span class="groupchat-subtle">Choose a group to start chatting.</span>'; return; }
  header.innerHTML = `<div class="groupchat-header-identity">${groupChatGroupAvatar(group.groupAvatarUrl || group.avatarUrl, group.groupName || group.name)}<div><h3 class="groupchat-title">${escapeHtml(group.groupName || group.name)}</h3><span class="groupchat-subtle">${escapeHtml(group.description || '')}</span></div></div>
    <button class="pill subtle" id="groupchatLeaveBtn" type="button">${group.role === 'owner' ? 'Owner' : 'Leave'}</button>`;
  const leave = document.getElementById('groupchatLeaveBtn');
  if (leave && group.role !== 'owner') leave.addEventListener('click', async () => { try { await leaveGroup(group.id); } catch (error) { groupChatError(error, 'Unable to leave group.'); } });
}

async function subscribeToMessages(groupId) {
  try {
    const user = await groupChatAuthUser();
    groupChatState.messagesUnsubscribe = groupChatDb().collection('groups').doc(groupId).collection('messages')
      .orderBy('createdAt', 'asc').limitToLast(GROUP_CHAT_PAGE_SIZE).onSnapshot(snapshot => {
        groupChatState.messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMessages(user.uid);
        saveGroupChatUiState();
      }, error => groupChatError(error, 'Unable to load group messages.'));
  } catch (error) { groupChatError(error, 'Unable to open this group.'); }
}

function renderMessages(uid) {
  const container = document.getElementById('groupchatMessages');
  if (!container) return;
  if (!groupChatState.messages.length) { container.innerHTML = '<div class="groupchat-empty">No messages yet. Start the conversation.</div>'; return; }
  container.innerHTML = groupChatState.messages.map(message => `<article class="chat-bubble ${message.senderId === uid ? 'me' : ''}">
    <div class="chat-sender">${groupChatAvatar(message.senderAvatarUrl, message.senderName, 'groupchat-avatar small')}<span>${escapeHtml(message.senderName || 'Member')}</span><time>${escapeHtml(groupChatFormatTime(message.createdAt))}</time></div>
    <div class="text">${escapeHtml(message.text || '')}</div>
  </article>`).join('');
  container.scrollTop = container.scrollHeight;
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
}

function destroyMessageListener() {
  if (groupChatState.messagesUnsubscribe) groupChatState.messagesUnsubscribe();
  groupChatState.messagesUnsubscribe = null;
  groupChatState.messages = [];
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
  if (composer) composer.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('groupchatMessageInput');
    try { await sendGroupChatMessage(input.value); input.value = ''; } catch (error) { groupChatError(error, 'Unable to send message.'); }
  });
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
