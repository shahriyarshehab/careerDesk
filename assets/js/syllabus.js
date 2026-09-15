/* ==========================================================================
   CareerDesk — Syllabus Module: Categories, Topics & Progress Tracking
   ========================================================================== */

// ===== Syllabus =====
const categoryList = document.getElementById('categoryList');
const openCategoryIds = new Set();
const topicDeleteModeCategories = new Set();

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
    const topicsHtml = cat.topics.length ? (
      '<div class="topic-tile-grid">' + cat.topics.map(t => `
        <div class="topic-tile ${t.done ? 'done' : ''}" data-cat="${cat.id}" data-topic="${t.id}">
          <span class="tile-label" data-topic-label="${t.id}" data-topic-cat="${cat.id}" title="Double-click to edit">${escapeHtml(t.name)}</span>
          <button class="tile-del" data-cat="${cat.id}" data-topic="${t.id}" title="Delete Topic" aria-label="Delete Topic">${ICON.x}</button>
        </div>
      `).join('') + '</div>'
    ) : '<div class="empty-state" style="padding:20px;">No topics in this category yet.</div>';

    const topicDelBanner = isTopicDelActive ? `
      <div class="topic-del-active-banner">
        <div class="del-banner-left">
          <span class="del-pulse-dot"></span>
          <span>Topic delete mode active — click <strong>✕</strong> on any topic to remove</span>
        </div>
        <button class="pill subtle mini-exit-del-btn" data-catdel-topics="${cat.id}" type="button">Done</button>
      </div>
    ` : '';

    return `
      <div class="category-card glass open ${isTopicDelActive ? 'topic-delete-mode' : ''}" data-cat="${cat.id}">
        <div class="category-head">
          <div class="category-head-left">
            <h3 class="category-title" data-category-title="${cat.id}" title="Double-click to edit">${escapeHtml(cat.name)}</h3>
          </div>
          <div class="category-head-right">
            <span class="category-progress-text">${done}/${total} • ${pct}%</span>
            <div class="category-mini-track"><div class="category-mini-fill" style="width:${pct}%"></div></div>
            <div class="btn-group category-action-group">
              <button class="cat-group-btn cat-add-btn" data-toggle-add-topic="${cat.id}" type="button" title="Add Topic" aria-label="Add Topic">
                ${ICON.plus} <span>Add Topic</span>
              </button>
              <button class="cat-group-btn cat-edit-btn" data-edit-category="${cat.id}" type="button" title="Edit Category" aria-label="Edit Category">
                ${ICON.edit} <span>Edit</span>
              </button>
              <div class="cat-del-dropdown-wrap">
                <button class="cat-group-btn cat-del-trigger ${isTopicDelActive ? 'active' : ''}" data-catdel-trigger="${cat.id}" type="button" title="Delete Options" aria-label="Delete Options">
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
          ${topicDelBanner}
          ${topicsHtml}
          <div class="add-topic-row" data-topic-form="${cat.id}" style="display:none;">
            <input type="text" placeholder="Enter topic name" data-topicinput="${cat.id}">
            <button class="pill" data-addtopic="${cat.id}">Add</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  renderSyllabusOverall();
}

function saveSyllabusAndRefresh() {
  saveData();
  renderCategories();
  syncAllSubjectSelects();
}

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategoryInput');
  const name = input.value.trim();
  if (!name) return;
  const topicInput = document.getElementById('newTopicInput');
  const firstTopic = topicInput.value.trim();
  const normalizedName = name.toLowerCase();
  const existingCat = state.syllabus.find(c => String(c.name).trim().toLowerCase() === normalizedName);
  if (existingCat) {
    if (firstTopic) {
      const normalizedTopic = firstTopic.toLowerCase();
      const alreadyExists = existingCat.topics.some(t => String(t.name).trim().toLowerCase() === normalizedTopic);
      if (alreadyExists) {
        showToast('This topic already exists in this category.', true);
      } else {
        existingCat.topics.push({ id: Date.now(), name: firstTopic, done: false });
        showToast('Topic added to existing category.');
      }
    } else {
      showToast('This category already exists.', true);
    }
    input.value = ''; topicInput.value = '';
    saveSyllabusAndRefresh();
    return;
  }
  const id = Date.now();
  state.syllabus.push({ id, name, topics: firstTopic ? [{ id: Date.now() + 1, name: firstTopic, done: false }] : [] });
  input.value = ''; topicInput.value = '';
  saveSyllabusAndRefresh();
});

categoryList.addEventListener('click', (e) => {
  if (e.detail > 1) return;

  // Delete trigger clicked: toggle dropdown menu
  const delTrigger = e.target.closest('[data-catdel-trigger]');
  if (delTrigger) {
    const catId = delTrigger.dataset.catdelTrigger;
    const menu = categoryList.querySelector(`[data-catdel-dropdown="${catId}"]`);
    const isCurrentlyOpen = menu && menu.style.display === 'flex';
    document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
    if (!isCurrentlyOpen && menu) {
      menu.style.display = 'flex';
      delTrigger.classList.add('menu-open');
    }
    return;
  }

  // Delete Subject option
  const subBtn = e.target.closest('[data-catdel-subject]');
  if (subBtn) {
    const catId = subBtn.dataset.catdelSubject;
    const cat = state.syllabus.find(c => String(c.id) === catId);
    const catName = cat && cat.name ? `"${cat.name}"` : 'this subject/category';
    document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
    if (!window.confirm(`Are you sure you want to delete subject ${catName} and all its topics?`)) return;
    openCategoryIds.delete(catId);
    topicDeleteModeCategories.delete(catId);
    state.syllabus = state.syllabus.filter(c => String(c.id) !== catId);
    saveSyllabusAndRefresh();
    showToast('Subject deleted');
    return;
  }

  // Delete Topic / Toggle topic delete mode option
  const topBtn = e.target.closest('[data-catdel-topics]');
  if (topBtn) {
    const catId = String(topBtn.dataset.catdelTopics);
    document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
    if (topicDeleteModeCategories.has(catId)) {
      topicDeleteModeCategories.delete(catId);
      showToast('Topic delete mode disabled');
    } else {
      topicDeleteModeCategories.add(catId);
      showToast('Topic delete mode enabled. Click ✕ on topics to delete.');
    }
    renderCategories();
    return;
  }

  const tile = e.target.closest('.topic-tile');
  if (tile && !e.target.closest('.tile-del')) {
    const cat = state.syllabus.find(c => String(c.id) === tile.dataset.cat);
    if (cat) {
      const topic = cat.topics.find(t => String(t.id) === tile.dataset.topic);
      if (topic) { topic.done = !topic.done; saveSyllabusAndRefresh(); }
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
    const name = input ? input.value.trim() : '';
    if (!name) return;
    const cat = state.syllabus.find(c => String(c.id) === catId);
    if (cat) { cat.topics.push({ id: Date.now(), name, done: false }); input.value = ''; saveSyllabusAndRefresh(); }
    return;
  }

  if (e.target.closest('[data-toggle-add-topic]')) {
    const btn = e.target.closest('[data-toggle-add-topic]');
    const catId = btn.dataset.toggleAddTopic;
    const panel = categoryList.querySelector(`[data-topic-form="${catId}"]`);
    if (panel) {
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
      const input = panel.querySelector('input');
      if (panel.style.display === 'flex' && input) input.focus();
    }
    return;
  }

  if (e.target.closest('[data-edit-category]')) {
    const btn = e.target.closest('[data-edit-category]');
    const catId = btn.dataset.editCategory;
    const cat = state.syllabus.find(c => String(c.id) === catId);
    if (!cat) return;
    const name = window.prompt('Enter new category name:', cat.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    cat.name = trimmed;
    saveSyllabusAndRefresh();
    return;
  }
});

// Global click to dismiss category delete dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.cat-del-dropdown-wrap')) {
    document.querySelectorAll('.cat-del-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.cat-del-trigger').forEach(b => b.classList.remove('menu-open'));
  }
});

categoryList.addEventListener('dblclick', (e) => {
  const label = e.target.closest('.tile-label');
  if (label) {
    const cat = state.syllabus.find(c => String(c.id) === label.dataset.topicCat);
    if (!cat) return;
    const topic = cat.topics.find(t => String(t.id) === label.dataset.topicLabel);
    if (!topic) return;
    const name = window.prompt('Enter new topic name:', topic.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    topic.name = trimmed;
    saveSyllabusAndRefresh();
    return;
  }
  const title = e.target.closest('.category-title');
  if (title) {
    const cat = state.syllabus.find(c => String(c.id) === title.dataset.categoryTitle);
    if (!cat) return;
    const name = window.prompt('Enter new category name:', cat.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    cat.name = trimmed;
    saveSyllabusAndRefresh();
  }
});

