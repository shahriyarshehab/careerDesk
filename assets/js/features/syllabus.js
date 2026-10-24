/* ==========================================================================
   CareerDesk — Syllabus Module: Categories, Topics & Progress Tracking
   ========================================================================== */

// ===== Syllabus =====
const categoryList = document.getElementById('categoryList');
const openCategoryIds = new Set();
const topicDeleteModeCategories = new Set();
const topicEditModeCategories = new Set();
const editingSubjectCategories = new Set();
let editingTopicKey = null;

function syllabusTotals() {
  let total = 0, done = 0;
  state.syllabus.forEach(cat => { cat.topics.forEach(t => { total++; if (t.done) done++; }); });
  return { total, done };
}

function renderSyllabusOverall() {
  const { total, done } = syllabusTotals();
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('syllabusOverallLabel').textContent = `${done} / ${total} topics completed`;
  document.getElementById('syllabusOverallPct').textContent = pct + '%';
  document.getElementById('syllabusOverallFill').style.width = pct + '%';
}

function parseSyllabusTopicNames(value) {
  return [...new Set(value.split('|').map(topic => topic.trim()).filter(Boolean))];
}

function addSyllabusTopics(category, topicNames) {
  const existingNames = new Set(category.topics.map(topic => topic.name.trim().toLowerCase()));
  const allIds = new Set(state.syllabus.flatMap(item => item.topics.map(topic => String(topic.id))));
  let nextId = Date.now();
  let addedCount = 0;

  topicNames.forEach(name => {
    const normalizedName = name.toLowerCase();
    if (existingNames.has(normalizedName)) return;
    while (allIds.has(String(nextId))) nextId++;
    category.topics.push({ id: nextId, name, done: false });
    allIds.add(String(nextId));
    existingNames.add(normalizedName);
    nextId++;
    addedCount++;
  });

  return addedCount;
}

function renderCategories() {
  if (!state.syllabus.length) {
    categoryList.innerHTML = '<div class="empty-state">No categories yet. Add one above to begin your syllabus.</div>';
    renderSyllabusOverall();
    return;
  }
  categoryList.innerHTML = state.syllabus.map(cat => {
    const total = cat.topics.length;
    const done = cat.topics.filter(t => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const isTopicDelActive = topicDeleteModeCategories.has(String(cat.id));
    const isTopicEditActive = topicEditModeCategories.has(String(cat.id));
    const isSubjectEditing = editingSubjectCategories.has(String(cat.id));
    const meta = typeof getSubjectMeta === 'function' ? getSubjectMeta(cat.name) : { color: '#6366f1', icon: 'book-open' };
    const topicsHtml = cat.topics.length ? (
      '<div class="topic-tile-grid">' + cat.topics.map(t => `
        <div class="topic-tile ${t.done ? 'done' : ''} ${isTopicEditActive ? 'topic-edit-target' : ''} ${editingTopicKey === `${cat.id}:${t.id}` ? 'topic-editing' : ''}" data-cat="${cat.id}" data-topic="${t.id}">
          ${editingTopicKey === `${cat.id}:${t.id}`
            ? `<input class="topic-edit-input" data-topic-edit-input="${t.id}" data-topic-edit-cat="${cat.id}" value="${escapeAttr(t.name)}" aria-label="Edit topic name">
               <span class="topic-edit-controls">
                 <button class="topic-edit-save" data-save-topic="${t.id}" data-save-topic-cat="${cat.id}" type="button" aria-label="Save topic">${ICON.check}</button>
                 <button class="topic-edit-cancel" data-cancel-topic="${t.id}" type="button" aria-label="Cancel topic edit">${ICON.x}</button>
               </span>`
            : `<span class="tile-label" data-topic-label="${t.id}" data-topic-cat="${cat.id}" title="${isTopicEditActive ? 'Select to edit' : 'Double-click to edit'}">${escapeHtml(t.name)}</span>
               <button class="tile-del" data-cat="${cat.id}" data-topic="${t.id}" title="Delete Topic" aria-label="Delete Topic">${ICON.x}</button>`}
        </div>
      `).join('') + '</div>'
    ) : '<div class="empty-state" style="padding:20px;">No topics in this category yet.</div>';

    const topicModeBanner = isTopicDelActive || isTopicEditActive ? `
      <div class="topic-del-active-banner ${isTopicEditActive ? 'topic-edit-active-banner' : ''}">
        <div class="del-banner-left">
          <span class="del-pulse-dot"></span>
          <span>${isTopicEditActive
            ? 'Topic edit mode active — select a topic to edit its name'
            : 'Topic delete mode active — click <strong>✕</strong> on any topic to remove'}</span>
        </div>
        <button class="pill subtle mini-exit-del-btn" data-exit-topic-mode="${cat.id}" type="button">Done</button>
      </div>
    ` : '';

    return `
      <div class="category-card glass open ${isTopicDelActive ? 'topic-delete-mode' : ''}" data-cat="${cat.id}">
        <div class="category-head">
          <div class="category-head-left" style="display:flex; align-items:center; gap:10px;">
            <span class="category-icon-badge" style="color:${meta.color}; background:${meta.color}18; border:1px solid ${meta.color}30; width:30px; height:30px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
              <i data-lucide="${meta.icon || 'book-open'}" style="width:16px; height:16px;"></i>
            </span>
            <h3 class="category-title" data-category-title="${cat.id}" title="Double-click to edit">
              ${escapeHtml(typeof getSubjectDisplayName === 'function' ? getSubjectDisplayName(cat.name) : cat.name)}
            </h3>
          </div>
          <div class="category-head-right">
            <span class="category-progress-text">${done}/${total} • ${pct}%</span>
            <div class="category-mini-track"><div class="category-mini-fill" style="width:${pct}%"></div></div>
            <div class="btn-group category-action-group" aria-label="Subject actions">
              <button class="cat-group-btn cat-add-btn" data-toggle-add-topic="${cat.id}" type="button" title="Add Topic" aria-label="Add Topic">
                ${ICON.plus} <span>Add Topic</span>
              </button>
              <div class="cat-edit-dropdown-wrap">
                <button class="cat-group-btn cat-edit-btn" data-cat-edit-trigger="${cat.id}" type="button" title="Edit Subject or Topics" aria-label="Edit Subject or Topics" aria-expanded="false">
                  ${ICON.edit} <span>Edit</span>
                </button>
                <div class="cat-del-menu cat-edit-menu" data-cat-edit-menu="${cat.id}" style="display:none;">
                  <button class="cat-del-menu-item" data-edit-subject="${cat.id}" type="button">${ICON.edit}<span>Edit Subject</span></button>
                  <button class="cat-del-menu-item" data-edit-topics="${cat.id}" type="button">${ICON.edit}<span>Edit Topics</span></button>
                </div>
              </div>
              <div class="cat-del-dropdown-wrap">
                <button class="cat-group-btn cat-del-trigger ${isTopicDelActive ? 'active' : ''}" data-catdel-trigger="${cat.id}" type="button" title="Delete Subject or Topics" aria-label="Delete Subject or Topics" aria-expanded="false">
                  ${ICON.trash} <span>Delete</span>
                </button>
                <div class="cat-del-menu" data-catdel-dropdown="${cat.id}" style="display:none;">
                  <button class="cat-del-menu-item item-subject" data-catdel-subject="${cat.id}" type="button">
                    ${ICON.trash}
                    <span>Delete Subject</span>
                  </button>
                  <button class="cat-del-menu-item item-topics ${isTopicDelActive ? 'active-mode' : ''}" data-catdel-topics="${cat.id}" type="button">
                    ${ICON.x}
                    <span>${isTopicDelActive ? 'Done Deleting' : 'Delete Topic'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="category-body">
          ${topicModeBanner}
          ${isSubjectEditing ? `
            <div class="edit-subject-row" data-edit-subject-form="${cat.id}">
              <input type="text" data-subject-edit-input="${cat.id}" value="${escapeAttr(cat.name)}" aria-label="Edit subject name">
              <button class="pill solid" data-save-subject="${cat.id}" type="button">${ICON.check}<span>Save</span></button>
              <button class="pill subtle" data-cancel-subject="${cat.id}" type="button">Cancel</button>
            </div>
          ` : ''}
          ${topicsHtml}
          <div class="add-topic-row" data-topic-form="${cat.id}" hidden>
            <input type="text" placeholder="Topic name (use | between topics)" aria-label="Topic names, separated by vertical bars" data-topicinput="${cat.id}">
            <button class="pill" data-addtopic="${cat.id}">Add topics</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  renderSyllabusOverall();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function saveSyllabusAndRefresh() {
  saveData();
  renderCategories();
  syncAllSubjectSelects();
}

function positionSyllabusMenu(menu, trigger) {
  const menuHeight = menu.getBoundingClientRect().height;
  const triggerRect = trigger.getBoundingClientRect();
  const fitsBelow = window.innerHeight - triggerRect.bottom >= menuHeight + 8;
  const fitsAbove = triggerRect.top >= menuHeight + 8;
  menu.classList.toggle('opens-up', !fitsBelow && fitsAbove);
}

const addCategoryBtn = document.getElementById('addCategoryBtn');
if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', () => {
    const input = document.getElementById('newCategoryInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    if (typeof addSubject === 'function') addSubject(name);
    const topicInput = document.getElementById('newTopicInput');
    const topicNames = topicInput ? parseSyllabusTopicNames(topicInput.value) : [];
    const normalizedName = name.toLowerCase();
    const existingCat = state.syllabus.find(c => String(c.name).trim().toLowerCase() === normalizedName);
    if (existingCat) {
      if (topicNames.length) {
        const addedCount = addSyllabusTopics(existingCat, topicNames);
        showToast(addedCount
          ? `${addedCount} topic${addedCount === 1 ? '' : 's'} added to existing subject.`
          : 'These topics already exist in this subject.', !addedCount);
      } else {
        showToast('This category already exists.', true);
      }
      input.value = '';
      if (topicInput) topicInput.value = '';
      saveSyllabusAndRefresh();
      return;
    }
    const id = Date.now();
    const category = { id, name, topics: [] };
    addSyllabusTopics(category, topicNames);
    state.syllabus.push(category);
    input.value = '';
    if (topicInput) topicInput.value = '';
    saveSyllabusAndRefresh();
  });
}

if (categoryList) {
  categoryList.addEventListener('click', (e) => {
  if (e.detail > 1) return;

  const editTrigger = e.target.closest('[data-cat-edit-trigger]');
  if (editTrigger) {
    const catId = editTrigger.dataset.catEditTrigger;
    const menu = categoryList.querySelector(`[data-cat-edit-menu="${catId}"]`);
    const shouldOpen = menu && menu.style.display !== 'flex';
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    document.querySelectorAll('[data-cat-edit-trigger], .cat-del-trigger').forEach(button => {
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    });
    if (shouldOpen) {
      menu.style.display = 'flex';
      positionSyllabusMenu(menu, editTrigger);
      editTrigger.classList.add('menu-open');
      editTrigger.setAttribute('aria-expanded', 'true');
    }
    return;
  }

  const editSubjectButton = e.target.closest('[data-edit-subject]');
  if (editSubjectButton) {
    const catId = String(editSubjectButton.dataset.editSubject);
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    topicEditModeCategories.delete(catId);
    topicDeleteModeCategories.delete(catId);
    editingTopicKey = null;
    editingSubjectCategories.add(catId);
    renderCategories();
    categoryList.querySelector(`[data-subject-edit-input="${catId}"]`)?.focus();
    return;
  }

  const editTopicsButton = e.target.closest('[data-edit-topics]');
  if (editTopicsButton) {
    const catId = String(editTopicsButton.dataset.editTopics);
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    editingSubjectCategories.delete(catId);
    topicEditModeCategories.add(catId);
    topicDeleteModeCategories.delete(catId);
    renderCategories();
    return;
  }

  const saveSubjectButton = e.target.closest('[data-save-subject]');
  if (saveSubjectButton) {
    const catId = String(saveSubjectButton.dataset.saveSubject);
    const cat = state.syllabus.find(item => String(item.id) === catId);
    const input = categoryList.querySelector(`[data-subject-edit-input="${catId}"]`);
    const newName = input ? input.value.trim() : '';
    if (!cat || !newName) {
      showToast('Subject name cannot be empty.', true);
      input?.focus();
      return;
    }
    if (state.syllabus.some(item => item !== cat && item.name.trim().toLowerCase() === newName.toLowerCase())) {
      showToast('A subject with this name already exists.', true);
      input.focus();
      return;
    }
    editingSubjectCategories.delete(catId);
    if (cat.name === newName) {
      renderCategories();
    } else if (typeof renameSubject === 'function') renameSubject(cat.name, newName);
    else {
      cat.name = newName;
      saveSyllabusAndRefresh();
    }
    return;
  }

  const cancelSubjectButton = e.target.closest('[data-cancel-subject]');
  if (cancelSubjectButton) {
    editingSubjectCategories.delete(String(cancelSubjectButton.dataset.cancelSubject));
    renderCategories();
    return;
  }

  const saveTopicButton = e.target.closest('[data-save-topic]');
  if (saveTopicButton) {
    const catId = String(saveTopicButton.dataset.saveTopicCat);
    const topicId = String(saveTopicButton.dataset.saveTopic);
    const cat = state.syllabus.find(item => String(item.id) === catId);
    const topic = cat && cat.topics.find(item => String(item.id) === topicId);
    const input = categoryList.querySelector(`[data-topic-edit-input="${topicId}"][data-topic-edit-cat="${catId}"]`);
    const newName = input ? input.value.trim() : '';
    if (!topic || !newName) {
      showToast('Topic name cannot be empty.', true);
      input?.focus();
      return;
    }
    if (cat.topics.some(item => item !== topic && item.name.trim().toLowerCase() === newName.toLowerCase())) {
      showToast('A topic with this name already exists.', true);
      input.focus();
      return;
    }
    topic.name = newName;
    editingTopicKey = null;
    saveSyllabusAndRefresh();
    return;
  }

  const cancelTopicButton = e.target.closest('[data-cancel-topic]');
  if (cancelTopicButton) {
    editingTopicKey = null;
    renderCategories();
    return;
  }

  const exitTopicModeButton = e.target.closest('[data-exit-topic-mode]');
  if (exitTopicModeButton) {
    const catId = String(exitTopicModeButton.dataset.exitTopicMode);
    topicEditModeCategories.delete(catId);
    topicDeleteModeCategories.delete(catId);
    editingTopicKey = null;
    renderCategories();
    return;
  }

  // Delete trigger clicked: toggle dropdown menu.
  const delTrigger = e.target.closest('[data-catdel-trigger]');
  if (delTrigger) {
    const catId = delTrigger.dataset.catdelTrigger;
    const menu = categoryList.querySelector(`[data-catdel-dropdown="${catId}"]`);
    const isCurrentlyOpen = menu && menu.style.display === 'flex';
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    document.querySelectorAll('[data-cat-edit-trigger], .cat-del-trigger').forEach(button => {
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    });
    if (!isCurrentlyOpen && menu) {
      menu.style.display = 'flex';
      positionSyllabusMenu(menu, delTrigger);
      delTrigger.classList.add('menu-open');
      delTrigger.setAttribute('aria-expanded', 'true');
    }
    return;
  }

  // Delete Subject option
  const subBtn = e.target.closest('[data-catdel-subject]');
  if (subBtn) {
    const catId = subBtn.dataset.catdelSubject;
    const cat = state.syllabus.find(c => String(c.id) === catId);
    const catName = cat && cat.name ? `"${cat.name}"` : 'this subject/category';
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    document.querySelectorAll('[data-cat-edit-trigger], .cat-del-trigger').forEach(button => {
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    });
    if (!window.confirm(`Are you sure you want to delete subject ${catName} and all its topics?`)) return;
    openCategoryIds.delete(catId);
    topicDeleteModeCategories.delete(catId);
    topicEditModeCategories.delete(catId);
    editingSubjectCategories.delete(catId);
    state.syllabus = state.syllabus.filter(c => String(c.id) !== catId);
    saveSyllabusAndRefresh();
    showToast('Subject deleted');
    return;
  }

  // Delete Topic / Toggle topic delete mode option
  const topBtn = e.target.closest('[data-catdel-topics]');
  if (topBtn) {
    const catId = String(topBtn.dataset.catdelTopics);
    document.querySelectorAll('.cat-edit-menu, .cat-del-menu').forEach(item => { item.style.display = 'none'; });
    document.querySelectorAll('.cat-del-trigger').forEach(button => {
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    });
    editingSubjectCategories.delete(catId);
    editingTopicKey = null;
    if (topicDeleteModeCategories.has(catId)) {
      topicDeleteModeCategories.delete(catId);
      showToast('Topic delete mode disabled');
    } else {
      topicEditModeCategories.delete(catId);
      topicDeleteModeCategories.add(catId);
      showToast('Topic delete mode enabled. Click ✕ on topics to delete.');
    }
    renderCategories();
    return;
  }

  const tile = e.target.closest('.topic-tile');
  if (tile && !e.target.closest('.tile-del, .topic-edit-input, .topic-edit-controls')) {
    const cat = state.syllabus.find(c => String(c.id) === tile.dataset.cat);
    if (cat) {
      const topic = cat.topics.find(t => String(t.id) === tile.dataset.topic);
      const catId = String(cat.id);
      if (topic && topicEditModeCategories.has(catId)) {
        editingTopicKey = `${catId}:${topic.id}`;
        renderCategories();
        categoryList.querySelector(`[data-topic-edit-input="${topic.id}"][data-topic-edit-cat="${catId}"]`)?.focus();
      } else if (topic && !e.target.closest('.topic-edit-input, .topic-edit-controls')) {
        topic.done = !topic.done;
        saveSyllabusAndRefresh();
      }
    }
    return;
  }

  if (e.target.closest('.tile-del')) {
    const btn = e.target.closest('.tile-del');
    const cat = state.syllabus.find(c => String(c.id) === btn.dataset.cat);
    if (cat) {
      const topic = cat.topics.find(t => String(t.id) === btn.dataset.topic);
      const topicName = topic && topic.name ? `"${topic.name}"` : 'this topic';
      if (!window.confirm(`Are you sure you want to delete topic ${topicName}?`)) return;
      cat.topics = cat.topics.filter(t => String(t.id) !== btn.dataset.topic);
      if (!cat.topics.length) {
        topicDeleteModeCategories.delete(String(cat.id));
      }
      saveSyllabusAndRefresh();
      showToast('Topic deleted');
    }
    return;
  }

  if (e.target.closest('[data-addtopic]')) {
    const btn = e.target.closest('[data-addtopic]');
    const catId = btn.dataset.addtopic;
    const input = categoryList.querySelector(`[data-topicinput="${catId}"]`);
    const topicNames = input ? parseSyllabusTopicNames(input.value) : [];
    if (!topicNames.length) return;
    const cat = state.syllabus.find(c => String(c.id) === catId);
    if (cat) {
      const addedCount = addSyllabusTopics(cat, topicNames);
      input.value = '';
      saveSyllabusAndRefresh();
      showToast(addedCount
        ? `${addedCount} topic${addedCount === 1 ? '' : 's'} added.`
        : 'These topics already exist in this subject.', !addedCount);
    }
    return;
  }

  if (e.target.closest('[data-toggle-add-topic]')) {
    const btn = e.target.closest('[data-toggle-add-topic]');
    const catId = btn.dataset.toggleAddTopic;
    const panel = categoryList.querySelector(`[data-topic-form="${catId}"]`);
    if (panel) {
      panel.hidden = !panel.hidden;
      const input = panel.querySelector('input');
      if (!panel.hidden && input) input.focus();
    }
    return;
  }

});
}

// Global click to dismiss category delete dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.cat-del-dropdown-wrap, .cat-edit-dropdown-wrap')) {
    document.querySelectorAll('.cat-del-menu, .cat-edit-menu').forEach(menu => { menu.style.display = 'none'; });
    document.querySelectorAll('.cat-del-trigger, [data-cat-edit-trigger]').forEach(button => {
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    });
  }
});

if (categoryList) {
  categoryList.addEventListener('keydown', e => {
    if (e.key === 'Escape' && e.target.matches('[data-subject-edit-input]')) {
      editingSubjectCategories.delete(String(e.target.dataset.subjectEditInput));
      renderCategories();
      return;
    }
    if (e.key === 'Escape' && e.target.matches('[data-topic-edit-input]')) {
      editingTopicKey = null;
      renderCategories();
      return;
    }
    if (e.key === 'Enter' && e.target.matches('[data-subject-edit-input]')) {
      e.preventDefault();
      categoryList.querySelector(`[data-save-subject="${e.target.dataset.subjectEditInput}"]`)?.click();
    }
    if (e.key === 'Enter' && e.target.matches('[data-topic-edit-input]')) {
      e.preventDefault();
      categoryList.querySelector(`[data-save-topic="${e.target.dataset.topicEditInput}"][data-save-topic-cat="${e.target.dataset.topicEditCat}"]`)?.click();
    }
  });
}

if (categoryList) {
  categoryList.addEventListener('dblclick', (e) => {
    const label = e.target.closest('.tile-label');
    if (label) {
      const cat = state.syllabus.find(c => String(c.id) === label.dataset.topicCat);
      if (!cat) return;
      const topic = cat.topics.find(t => String(t.id) === label.dataset.topicLabel);
      if (!topic) return;
      const catId = String(cat.id);
      topicEditModeCategories.add(catId);
      editingTopicKey = `${catId}:${topic.id}`;
      renderCategories();
      categoryList.querySelector(`[data-topic-edit-input="${topic.id}"][data-topic-edit-cat="${catId}"]`)?.focus();
      return;
    }
    const title = e.target.closest('.category-title');
    if (!title) return;
    const catId = String(title.dataset.categoryTitle);
    editingSubjectCategories.add(catId);
    renderCategories();
    categoryList.querySelector(`[data-subject-edit-input="${catId}"]`)?.focus();
  });
}
