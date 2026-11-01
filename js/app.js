/**
 * 中山大学《局部解剖学》数字化学习系统 - Core Application Engine
 * Pure Vanilla JS, High Performance, Zero External Dependencies, Professional SVGs
 */

(function () {
  'use strict';

  // ================= State & Store =================
  const STORE_KEY = 'SYSU_ANATOMY_LEARNING_DATA_V3';

  const defaultStore = {
    answered: {},     // qId -> { userAnswer, isCorrect, timestamp }
    wrong: [],        // array of qIds
    starred: [],      // array of qIds
    masteredCards: {},// cardId -> { status: 'again'|'good'|'easy', count }
    masteredCases: [],// array of caseIds
    starredCases: [], // array of caseIds
    theme: 'light'
  };

  let store = loadStore();

  function loadStore() {
    try {
      const data = localStorage.getItem(STORE_KEY);
      return data ? Object.assign({}, defaultStore, JSON.parse(data)) : Object.assign({}, defaultStore);
    } catch (e) {
      console.error('Failed to load localStorage', e);
      return Object.assign({}, defaultStore);
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    updateBadgesAndStats();
  }

  // Active runtime state
  const state = {
    activeView: 'anki',       // anki | mindmap | quiz | cases | errors | favorites | stats
    chapter: '全部',          // 全部 | 下肢 | 上肢 | 头部 | 颈部 | 头颈部 | 胸部 | 腹部 | 盆部和会阴 | 背部（脊柱区）
    searchQuery: '',
    
    // Anki state
    ankiIndex: 0,
    ankiFlipped: false,
    
    // Quiz state
    qTypeFilter: 'all',       // all | A | X
    qStatusFilter: 'all',     // all | unanswered | wrong | correct | starred
    page: 1,
    pageSize: 20,
    
    // Cases state
    caseFilter: 'all',
    
    // Mind Map state
    selectedNode: null,
    
    // Temp x-type selections: qId -> Set of options
    xSelections: {}
  };

  // Safe access to data arrays
  const KnowledgeData = window.ANATOMY_KNOWLEDGE || [];
  const QuestionsData = window.ANATOMY_QUESTIONS || [];
  const CasesData = window.ANATOMY_CASES || [];
  const MindMapData = window.ANATOMY_MINDMAP || null;

  // SVG Icon definitions
  const SVG = {
    chevronRight: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    star: `<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    check: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    book: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    arrowRight: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    info: `<svg class="svg-icon icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  // ================= DOM Elements =================
  const dom = {
    themeBtn: document.getElementById('themeToggleBtn'),
    searchInput: document.getElementById('globalSearchInput'),
    navTabs: document.querySelectorAll('.nav-tab'),
    chapterPills: document.getElementById('chapterPillsContainer'),
    views: document.querySelectorAll('.view-section'),
    
    // Badges
    badgeErrors: document.getElementById('badgeErrorCount'),
    badgeStarred: document.getElementById('badgeStarredCount'),
    
    // Anki elements
    ankiCard: document.getElementById('ankiFlashcard'),
    ankiCardTag: document.getElementById('ankiCardTag'),
    ankiCardHint: document.getElementById('ankiCardHint'),
    ankiCardTitle: document.getElementById('ankiCardTitle'),
    ankiCardPrompt: document.getElementById('ankiCardPrompt'),
    ankiCardAnswer: document.getElementById('ankiCardAnswer'),
    ankiClinicalBox: document.getElementById('ankiClinicalBox'),
    ankiClinicalText: document.getElementById('ankiClinicalText'),
    ankiProgressTrack: document.getElementById('ankiProgressFill'),
    ankiProgressText: document.getElementById('ankiProgressText'),
    btnRateAgain: document.getElementById('btnRateAgain'),
    btnRateGood: document.getElementById('btnRateGood'),
    btnRateEasy: document.getElementById('btnRateEasy'),
    btnAnkiPrev: document.getElementById('btnAnkiPrev'),
    btnAnkiNext: document.getElementById('btnAnkiNext'),
    btnAnkiFlip: document.getElementById('btnAnkiFlip'),
    
    // Mind Map elements
    mmTree: document.getElementById('mindmapTree'),
    btnMmExpandAll: document.getElementById('btnMmExpandAll'),
    btnMmCollapseAll: document.getElementById('btnMmCollapseAll'),
    inspectorTitle: document.getElementById('inspectorTitle'),
    inspectorDesc: document.getElementById('inspectorDesc'),
    inspectorActions: document.getElementById('inspectorActions'),
    
    // Quiz elements
    quizList: document.getElementById('quizQuestionsList'),
    quizStatsBadge: document.getElementById('quizStatsBadge'),
    quizPagination: document.getElementById('quizPaginationBar'),
    typeFilterBtns: document.querySelectorAll('[data-qtype]'),
    statusFilterBtns: document.querySelectorAll('[data-qstatus]'),
    
    // Cases elements
    casesList: document.getElementById('casesList'),
    casesStatsBadge: document.getElementById('casesStatsBadge'),
    
    // Errors view
    errorsList: document.getElementById('errorsQuestionsList'),
    errorsStatsBadge: document.getElementById('errorsStatsBadge'),
    btnClearErrors: document.getElementById('btnClearErrorsBtn'),
    
    // Favorites view
    favsList: document.getElementById('favoritesQuestionsList'),
    favsStatsBadge: document.getElementById('favsStatsBadge'),
    
    // Stats elements
    statDoneCount: document.getElementById('statDoneCount'),
    statAccuracy: document.getElementById('statAccuracy'),
    statMasteredCards: document.getElementById('statMasteredCards'),
    statErrorCount: document.getElementById('statErrorCount'),
    statFavCount: document.getElementById('statFavCount'),
    btnExportData: document.getElementById('btnExportData'),
    btnImportData: document.getElementById('btnImportData'),
    fileImportInput: document.getElementById('fileImportInput'),
    btnResetData: document.getElementById('btnResetData'),
    
    // Modal
    modalOverlay: document.getElementById('knowledgeModal'),
    modalTitle: document.getElementById('modalKnowledgeTitle'),
    modalBody: document.getElementById('modalKnowledgeBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalGoAnkiBtn: document.getElementById('modalGoAnkiBtn')
  };

  // ================= Initialization =================
  function init() {
    if (store.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    setupEventListeners();
    updateBadgesAndStats();
    renderView();
  }

  // ================= Event Listeners =================
  function setupEventListeners() {
    // Theme toggle
    dom.themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      store.theme = newTheme;
      saveStore();
    });

    // Global Search
    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      state.page = 1;
      state.ankiIndex = 0;
      renderCurrentViewContent();
    });

    // Nav Tabs switching
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeView = tab.getAttribute('data-view');
        state.page = 1;
        renderView();
      });
    });

    // Chapter Pills switching
    dom.chapterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.ch-pill');
      if (!pill) return;
      document.querySelectorAll('.ch-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.chapter = pill.getAttribute('data-ch');
      state.page = 1;
      state.ankiIndex = 0;
      renderCurrentViewContent();
    });

    // Anki controls
    dom.ankiCard.addEventListener('click', toggleAnkiFlip);
    dom.btnAnkiFlip.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAnkiFlip();
    });

    dom.btnAnkiPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateAnkiCard(-1);
    });

    dom.btnAnkiNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateAnkiCard(1);
    });

    dom.btnRateAgain.addEventListener('click', (e) => {
      e.stopPropagation();
      rateAnkiCard('again');
    });

    dom.btnRateGood.addEventListener('click', (e) => {
      e.stopPropagation();
      rateAnkiCard('good');
    });

    dom.btnRateEasy.addEventListener('click', (e) => {
      e.stopPropagation();
      rateAnkiCard('easy');
    });

    // Keyboard shortcuts for Anki
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (state.activeView === 'anki') {
        if (e.code === 'Space') {
          e.preventDefault();
          toggleAnkiFlip();
        } else if (e.key === '1') {
          rateAnkiCard('again');
        } else if (e.key === '2') {
          rateAnkiCard('good');
        } else if (e.key === '3') {
          rateAnkiCard('easy');
        } else if (e.key === 'ArrowLeft') {
          navigateAnkiCard(-1);
        } else if (e.key === 'ArrowRight') {
          navigateAnkiCard(1);
        }
      }
    });

    // Mind Map controls
    if (dom.btnMmExpandAll) {
      dom.btnMmExpandAll.addEventListener('click', () => {
        document.querySelectorAll('.mm-children').forEach(c => c.classList.add('open'));
        document.querySelectorAll('.mm-toggle-btn').forEach(b => b.classList.add('expanded'));
      });
    }

    if (dom.btnMmCollapseAll) {
      dom.btnMmCollapseAll.addEventListener('click', () => {
        document.querySelectorAll('.mm-children').forEach((c, idx) => {
          if (idx > 0) c.classList.remove('open');
        });
        document.querySelectorAll('.mm-toggle-btn').forEach((b, idx) => {
          if (idx > 0) b.classList.remove('expanded');
        });
      });
    }

    // Quiz Filter Buttons
    dom.typeFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.typeFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.qTypeFilter = btn.getAttribute('data-qtype');
        state.page = 1;
        renderQuizList();
      });
    });

    dom.statusFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.statusFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.qStatusFilter = btn.getAttribute('data-qstatus');
        state.page = 1;
        renderQuizList();
      });
    });

    // Modal Close
    dom.modalCloseBtn.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    // Clear Errors
    if (dom.btnClearErrors) {
      dom.btnClearErrors.addEventListener('click', () => {
        if (confirm('确定要清空错题本记录吗？清空后将重新开始统计。')) {
          store.wrong = [];
          saveStore();
          renderErrorsList();
        }
      });
    }

    // Export / Import / Reset
    if (dom.btnExportData) dom.btnExportData.addEventListener('click', exportUserData);
    if (dom.btnImportData) dom.btnImportData.addEventListener('click', () => dom.fileImportInput.click());
    if (dom.fileImportInput) dom.fileImportInput.addEventListener('change', importUserData);
    if (dom.btnResetData) {
      dom.btnResetData.addEventListener('click', () => {
        if (confirm('警告：重置将清空所有答题记录、错题本、收藏夹和闪卡掌握进度！确定重置吗？')) {
          store = Object.assign({}, defaultStore);
          saveStore();
          location.reload();
        }
      });
    }
  }

  // ================= Chapter Matching Helper =================
  function isChapterMatch(itemChapter, selectedChapter) {
    if (!selectedChapter || selectedChapter === '全部') return true;
    if (!itemChapter) return false;
    if (itemChapter === selectedChapter) return true;
    if (itemChapter.includes(selectedChapter) || selectedChapter.includes(itemChapter)) return true;
    if ((selectedChapter.includes('背') || selectedChapter.includes('脊柱')) && 
        (itemChapter.includes('背') || itemChapter.includes('脊柱'))) return true;
    if (selectedChapter === '头颈部' && (itemChapter.includes('头') || itemChapter.includes('颈'))) return true;
    if (selectedChapter === '头部' && itemChapter.includes('头')) return true;
    if (selectedChapter === '颈部' && itemChapter.includes('颈')) return true;
    if (itemChapter === '头颈部' && (selectedChapter === '头部' || selectedChapter === '颈部')) return true;
    if ((selectedChapter.includes('盆') || selectedChapter.includes('会阴')) &&
        (itemChapter.includes('盆') || itemChapter.includes('会阴'))) return true;
    return false;
  }

  // ================= View Routing =================
  function renderView() {
    dom.views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${state.activeView}`);
    if (target) {
      target.classList.add('active');
    }
    renderCurrentViewContent();
  }

  function renderCurrentViewContent() {
    switch (state.activeView) {
      case 'anki':
        renderAnkiCard();
        break;
      case 'mindmap':
        renderMindMap();
        break;
      case 'quiz':
        renderQuizList();
        break;
      case 'cases':
        renderCasesList();
        break;
      case 'errors':
        renderErrorsList();
        break;
      case 'favorites':
        renderFavoritesList();
        break;
      case 'stats':
        renderStatsDashboard();
        break;
    }
    updateBadgesAndStats();
  }

  // ================= Anki Flashcards Engine =================
  function getFilteredAnkiCards() {
    return KnowledgeData.filter(card => {
      if (!isChapterMatch(card.chapter, state.chapter)) return false;
      if (state.searchQuery) {
        const text = (card.title + card.front + card.back + card.keyPoints.join(' ') + (card.clinicalNote || '')).toLowerCase();
        if (!text.includes(state.searchQuery)) return false;
      }
      return true;
    });
  }

  function renderAnkiCard() {
    const cards = getFilteredAnkiCards();
    if (cards.length === 0) {
      dom.ankiCardTitle.textContent = '未找到匹配知识点';
      dom.ankiCardPrompt.textContent = '请尝试清除搜索关键词或切换至其他章节。';
      dom.ankiCardAnswer.textContent = '';
      dom.ankiClinicalBox.style.display = 'none';
      dom.ankiCardTag.textContent = '无数据';
      dom.ankiCardHint.textContent = '0 / 0';
      dom.ankiProgressText.textContent = '0%';
      dom.ankiProgressTrack.style.width = '0%';
      return;
    }

    if (state.ankiIndex >= cards.length) state.ankiIndex = cards.length - 1;
    if (state.ankiIndex < 0) state.ankiIndex = 0;

    const card = cards[state.ankiIndex];
    state.ankiFlipped = false;
    dom.ankiCard.classList.remove('is-flipped');

    dom.ankiCardTag.textContent = `${card.chapter} · ${card.section}`;
    dom.ankiCardHint.textContent = `闪卡 ${state.ankiIndex + 1} / ${cards.length}`;
    dom.ankiCardTitle.textContent = card.title;
    dom.ankiCardPrompt.textContent = card.front;
    dom.ankiCardAnswer.textContent = card.back;

    if (card.clinicalNote) {
      dom.ankiClinicalBox.style.display = 'block';
      dom.ankiClinicalText.textContent = card.clinicalNote;
    } else {
      dom.ankiClinicalBox.style.display = 'none';
    }

    const masteredCount = cards.filter(c => store.masteredCards[c.id] && store.masteredCards[c.id].status === 'easy').length;
    const pct = Math.round((masteredCount / cards.length) * 100);
    dom.ankiProgressTrack.style.width = `${pct}%`;
    dom.ankiProgressText.textContent = `${pct}% 熟练掌握 (${masteredCount}/${cards.length})`;
  }

  function toggleAnkiFlip() {
    state.ankiFlipped = !state.ankiFlipped;
    dom.ankiCard.classList.toggle('is-flipped', state.ankiFlipped);
  }

  function navigateAnkiCard(direction) {
    const cards = getFilteredAnkiCards();
    if (cards.length === 0) return;
    state.ankiIndex = (state.ankiIndex + direction + cards.length) % cards.length;
    renderAnkiCard();
  }

  function rateAnkiCard(rating) {
    const cards = getFilteredAnkiCards();
    if (cards.length === 0) return;
    const card = cards[state.ankiIndex];
    
    if (!store.masteredCards[card.id]) {
      store.masteredCards[card.id] = { status: rating, count: 0 };
    }
    store.masteredCards[card.id].status = rating;
    store.masteredCards[card.id].count += 1;
    saveStore();

    navigateAnkiCard(1);
  }

  // ================= Mind Map Interactive Tree Engine =================
  function renderMindMap() {
    if (!dom.mmTree || !MindMapData) return;

    // Filter tree according to current chapter
    let root = MindMapData;
    if (state.chapter !== '全部') {
      const matchChild = MindMapData.children.find(c => isChapterMatch(c.chapter, state.chapter) || isChapterMatch(c.name, state.chapter));
      if (matchChild) {
        root = {
          name: `局部解剖学 - ${state.chapter}`,
          chapter: state.chapter,
          desc: matchChild.desc,
          children: [matchChild]
        };
      }
    }

    dom.mmTree.innerHTML = renderTreeNodeHtml(root, 0, true);
    
    // Select root or first child by default in inspector
    if (!state.selectedNode) {
      inspectMindMapNode(root.name, root.desc, root.chapter, null);
    }
  }

  function renderTreeNodeHtml(node, level, isOpen = false) {
    const hasChildren = node.children && node.children.length > 0;
    const nodeId = 'mm-node-' + Math.random().toString(36).substr(2, 9);

    let html = `
      <div class="mm-node level-${level}" id="${nodeId}">
        <div class="mm-node-row" onclick="window.APP.selectMmNode('${nodeId}', '${escapeHtml(node.name)}', '${escapeHtml(node.desc || '')}', '${node.chapter || ''}', '${node.kbId || ''}')">
          ${hasChildren ? `
            <button class="mm-toggle-btn ${isOpen ? 'expanded' : ''}" onclick="window.APP.toggleMmNode(event, '${nodeId}')">
              ${SVG.chevronRight}
            </button>
          ` : `<span style="width:20px; display:inline-block; text-align:center; color:var(--teal);">•</span>`}
          <span class="mm-node-label">${node.name}</span>
          ${hasChildren ? `<span class="mm-badge">${node.children.length}</span>` : ''}
          ${node.kbId ? `<span class="mm-badge" style="color:var(--primary); font-weight:700;">考点</span>` : ''}
        </div>
    `;

    if (hasChildren) {
      html += `
        <div class="mm-children ${isOpen ? 'open' : ''}">
          ${node.children.map(child => renderTreeNodeHtml(child, level + 1, level < 1)).join('')}
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  function toggleMindMapNode(e, nodeId) {
    e.stopPropagation();
    const el = document.getElementById(nodeId);
    if (!el) return;
    const btn = el.querySelector('.mm-toggle-btn');
    const childContainer = el.querySelector('.mm-children');
    if (btn && childContainer) {
      btn.classList.toggle('expanded');
      childContainer.classList.toggle('open');
    }
  }

  function inspectMindMapNode(name, desc, chapter, kbId) {
    if (!dom.inspectorTitle) return;
    dom.inspectorTitle.textContent = name;
    dom.inspectorDesc.textContent = desc || '该解剖结构是局部解剖学核心知识骨架的重要组成部分。';

    let actionsHtml = '';
    if (kbId) {
      actionsHtml += `
        <button class="btn-nav" style="background:var(--primary); color:#fff; border-color:var(--primary);" onclick="window.APP.openKnowledgeModal('${kbId}')">
          ${SVG.book} 查阅权威解剖精析
        </button>
      `;
    }
    if (chapter && chapter !== '全部') {
      actionsHtml += `
        <button class="btn-nav" onclick="window.APP.switchChapterAndQuiz('${chapter}')">
          ${SVG.arrowRight} 测评本章节相关题目
        </button>
      `;
    }

    dom.inspectorActions.innerHTML = actionsHtml;
  }

  // ================= Quiz & Testing Engine =================
  function getFilteredQuestions(customFilter = null) {
    return QuestionsData.filter(q => {
      if (customFilter && !customFilter(q)) return false;

      if (!isChapterMatch(q.chapter, state.chapter)) return false;

      if (state.qTypeFilter !== 'all') {
        if (q.type !== state.qTypeFilter) return false;
      }

      if (state.qStatusFilter !== 'all') {
        const isAnswered = !!store.answered[q.id];
        const isWrong = store.wrong.includes(q.id);
        const isStarred = store.starred.includes(q.id);
        const isCorrect = isAnswered && store.answered[q.id].isCorrect;

        if (state.qStatusFilter === 'unanswered' && isAnswered) return false;
        if (state.qStatusFilter === 'wrong' && !isWrong) return false;
        if (state.qStatusFilter === 'correct' && !isCorrect) return false;
        if (state.qStatusFilter === 'starred' && !isStarred) return false;
      }

      if (state.searchQuery) {
        const optText = Object.values(q.options || {}).join(' ');
        const text = (q.stem + optText + q.chapter + q.answer).toLowerCase();
        if (!text.includes(state.searchQuery)) return false;
      }

      return true;
    });
  }

  function renderQuizList() {
    const list = getFilteredQuestions();
    renderQuestionCards(list, dom.quizList, dom.quizPagination, dom.quizStatsBadge);
  }

  function renderErrorsList() {
    const list = getFilteredQuestions(q => store.wrong.includes(q.id));
    renderQuestionCards(list, dom.errorsList, null, dom.errorsStatsBadge, true);
  }

  function renderFavoritesList() {
    const list = getFilteredQuestions(q => store.starred.includes(q.id));
    renderQuestionCards(list, dom.favsList, null, dom.favsStatsBadge, false, true);
  }

  function renderQuestionCards(questions, container, paginationContainer, statsContainer, isErrorView = false, isFavView = false) {
    if (!container) return;

    if (statsContainer) {
      statsContainer.innerHTML = `共 <b>${questions.length}</b> 道题目`;
    }

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="empty-box">
          <div class="empty-icon-wrap">${SVG.info}</div>
          <h3>${isErrorView ? '错题本已清空' : isFavView ? '暂无收藏题目' : '未找到符合条件的题目'}</h3>
          <p>${isErrorView ? '你做错的题目会自动收录至此，方便随时专项攻克。' : isFavView ? '在答题时点击右上角星标，即可收藏重点难点题目。' : '请尝试调整筛选条件或搜索关键词。'}</p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    let pageItems = questions;
    if (paginationContainer) {
      const totalPages = Math.ceil(questions.length / state.pageSize);
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * state.pageSize;
      pageItems = questions.slice(start, start + state.pageSize);
      renderPagination(paginationContainer, totalPages);
    }

    let html = '';
    pageItems.forEach((q) => {
      const isStarred = store.starred.includes(q.id);
      const isAnswered = !!store.answered[q.id];
      const ansRecord = store.answered[q.id];
      const typeBadgeClass = q.type === 'A' ? 'badge-a' : 'badge-x';

      html += `
        <div class="q-card" id="card-${q.id}" data-qid="${q.id}">
          <div class="q-header">
            <div class="q-meta">
              <span class="q-badge ${typeBadgeClass}">${q.typeLabel}</span>
              <span class="q-badge badge-chapter">${q.chapter}</span>
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">#${q.num}</span>
            </div>
            <div class="q-actions">
              ${isErrorView ? `<button class="btn-nav" onclick="window.APP.removeError('${q.id}')" style="font-size:0.75rem; padding:0.25rem 0.6rem; color:var(--success);">移出错题本</button>` : ''}
              <button class="star-btn ${isStarred ? 'active' : ''}" onclick="window.APP.toggleStar('${q.id}')" title="收藏题目">
                ${SVG.star}
              </button>
            </div>
          </div>

          <div class="q-stem">${q.num}. ${q.stem}</div>

          <div class="options-grid" data-qid="${q.id}" data-type="${q.type}">
            ${renderOptionsHtml(q, ansRecord)}
          </div>

          ${q.type === 'X' && !isAnswered ? `
            <div class="x-submit-bar">
              <button class="btn-submit-x" onclick="window.APP.submitXQuestion('${q.id}')">提交多选答案</button>
            </div>
          ` : ''}

          ${isAnswered ? renderExplanationHtml(q, ansRecord) : `
            <div style="text-align:right;">
              <button class="btn-nav" style="font-size:0.75rem; padding:0.25rem 0.6rem;" onclick="window.APP.showAnswerEarly('${q.id}')">查看答案与解析</button>
            </div>
          `}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderOptionsHtml(q, ansRecord) {
    const opts = q.options || {};
    let html = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const isAnswered = !!ansRecord;
    const userAns = ansRecord ? ansRecord.userAnswer : '';
    const correctAns = q.answer || '';
    const tempX = state.xSelections[q.id] || new Set();

    letters.forEach(letter => {
      if (!opts[letter]) return;

      let btnClass = 'option-btn';
      if (isAnswered) {
        const isUserPick = userAns.includes(letter);
        const isRealCorrect = correctAns.includes(letter);

        if (isRealCorrect) {
          btnClass += ' correct';
        } else if (isUserPick && !isRealCorrect) {
          btnClass += ' wrong';
        }
      } else {
        if (q.type === 'X' && tempX.has(letter)) {
          btnClass += ' selected';
        }
      }

      html += `
        <button class="${btnClass}" onclick="window.APP.selectOption('${q.id}', '${letter}')">
          <span class="opt-key">${letter}</span>
          <span class="opt-text">${opts[letter]}</span>
        </button>
      `;
    });

    return html;
  }

  function renderExplanationHtml(q, ansRecord) {
    const isCorrect = ansRecord ? ansRecord.isCorrect : false;
    const userAns = ansRecord ? ansRecord.userAnswer : '未作答';
    
    let linkHtml = '';
    if (q.linkedKnowledge && q.linkedKnowledge.length > 0) {
      linkHtml = `
        <div class="knowledge-links">
          <span style="font-size:0.8rem; font-weight:700; color:var(--teal);">关联考点：</span>
          ${q.linkedKnowledge.map(k => `
            <span class="k-link-pill" onclick="window.APP.openKnowledgeModal('${k.id}')">
              ${k.title}
            </span>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="q-explanation">
        <div class="exp-header">
          <span class="exp-ans ${isCorrect ? 'text-success' : 'text-danger'}">
            ${ansRecord ? (isCorrect ? '回答正确' : `回答错误（你的选择: ${userAns}）`) : '参考答案揭示'}
          </span>
          <span style="font-weight:700; color:var(--text-main);">官方标准答案: <span style="color:var(--primary); font-size:1.1rem;">${q.answer}</span></span>
        </div>
        <div class="exp-body">${q.explanation || '暂无详细解析。'}</div>
        ${linkHtml}
      </div>
    `;
  }

  function renderPagination(container, totalPages) {
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${state.page <= 1 ? 'disabled' : ''} onclick="window.APP.changePage(${state.page - 1})">上一页</button>
    `;

    const maxButtons = 7;
    let startPage = Math.max(1, state.page - 3);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      html += `<button class="page-btn" onclick="window.APP.changePage(1)">1</button>`;
      if (startPage > 2) html += `<span style="padding:0 0.2rem; color:var(--text-muted);">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `
        <button class="page-btn ${p === state.page ? 'active' : ''}" onclick="window.APP.changePage(${p})">${p}</button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="padding:0 0.2rem; color:var(--text-muted);">...</span>`;
      html += `<button class="page-btn" onclick="window.APP.changePage(${totalPages})">${totalPages}</button>`;
    }

    html += `
      <button class="page-btn" ${state.page >= totalPages ? 'disabled' : ''} onclick="window.APP.changePage(${state.page + 1})">下一页</button>
    `;

    container.innerHTML = html;
  }

  function handleSelectOption(qId, letter) {
    const q = QuestionsData.find(item => item.id === qId);
    if (!q || store.answered[qId]) return;

    if (q.type === 'A') {
      const isCorrect = (letter.toUpperCase() === q.answer.toUpperCase());
      store.answered[qId] = {
        userAnswer: letter,
        isCorrect: isCorrect,
        timestamp: Date.now()
      };

      if (!isCorrect) {
        if (!store.wrong.includes(qId)) store.wrong.push(qId);
      } else {
        const idx = store.wrong.indexOf(qId);
        if (idx > -1) store.wrong.splice(idx, 1);
      }

      saveStore();
      refreshCardUI(qId);
    } else {
      if (!state.xSelections[qId]) state.xSelections[qId] = new Set();
      const set = state.xSelections[qId];
      if (set.has(letter)) {
        set.delete(letter);
      } else {
        set.add(letter);
      }
      refreshCardUI(qId);
    }
  }

  function handleSubmitX(qId) {
    const q = QuestionsData.find(item => item.id === qId);
    if (!q || store.answered[qId]) return;

    const set = state.xSelections[qId] || new Set();
    if (set.size === 0) {
      alert('请至少勾选一个选项后再提交！');
      return;
    }

    const userAns = Array.from(set).sort().join('');
    const correctAns = q.answer.split('').sort().join('');
    const isCorrect = (userAns === correctAns);

    store.answered[qId] = {
      userAnswer: userAns,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };

    if (!isCorrect) {
      if (!store.wrong.includes(qId)) store.wrong.push(qId);
    } else {
      const idx = store.wrong.indexOf(qId);
      if (idx > -1) store.wrong.splice(idx, 1);
    }

    delete state.xSelections[qId];
    saveStore();
    refreshCardUI(qId);
  }

  function handleShowAnswerEarly(qId) {
    const q = QuestionsData.find(item => item.id === qId);
    if (!q) return;

    store.answered[qId] = {
      userAnswer: '(主动查阅)',
      isCorrect: false,
      timestamp: Date.now()
    };
    if (!store.wrong.includes(qId)) store.wrong.push(qId);
    saveStore();
    refreshCardUI(qId);
  }

  function refreshCardUI(qId) {
    const cardEl = document.getElementById(`card-${qId}`);
    if (!cardEl) return;
    const q = QuestionsData.find(item => item.id === qId);
    if (!q) return;

    const ansRecord = store.answered[qId];
    const grid = cardEl.querySelector('.options-grid');
    if (grid) grid.innerHTML = renderOptionsHtml(q, ansRecord);

    const xBar = cardEl.querySelector('.x-submit-bar');
    if (xBar) xBar.remove();

    let expEl = cardEl.querySelector('.q-explanation');
    if (!expEl && ansRecord) {
      cardEl.insertAdjacentHTML('beforeend', renderExplanationHtml(q, ansRecord));
    }
  }

  function handleToggleStar(qId) {
    const idx = store.starred.indexOf(qId);
    if (idx > -1) {
      store.starred.splice(idx, 1);
    } else {
      store.starred.push(qId);
    }
    saveStore();

    const card = document.getElementById(`card-${qId}`);
    if (card) {
      const btn = card.querySelector('.star-btn');
      if (btn) {
        btn.classList.toggle('active', store.starred.includes(qId));
      }
    }

    if (state.activeView === 'favorites') {
      renderFavoritesList();
    }
  }

  function handleRemoveError(qId) {
    const idx = store.wrong.indexOf(qId);
    if (idx > -1) {
      store.wrong.splice(idx, 1);
      saveStore();
      renderErrorsList();
    }
  }

  // ================= Clinical Cases Engine =================
  function getFilteredCases() {
    return CasesData.filter(c => {
      if (!isChapterMatch(c.chapter, state.chapter)) return false;
      if (state.caseFilter === '10th' && !c.is10thEdition) return false;
      if (state.caseFilter === 'starred' && !store.starredCases.includes(c.id)) return false;
      if (state.searchQuery) {
        const text = (c.title + c.scenario + (c.diagnosis || '') + c.questions.join(' ') + c.answers.join(' ') + (c.clinicalPearl || '')).toLowerCase();
        if (!text.includes(state.searchQuery)) return false;
      }
      return true;
    });
  }

  function handleSetCaseFilter(filterType) {
    state.caseFilter = filterType;
    renderCasesList();
  }

  function renderCasesList() {
    const btnAll = document.getElementById('caseFilterAll');
    const btn10th = document.getElementById('caseFilter10th');
    const btnStarred = document.getElementById('caseFilterStarred');
    if (btnAll) btnAll.classList.toggle('active', state.caseFilter === 'all');
    if (btn10th) btn10th.classList.toggle('active', state.caseFilter === '10th');
    if (btnStarred) btnStarred.classList.toggle('active', state.caseFilter === 'starred');

    const cases = getFilteredCases();
    dom.casesStatsBadge.innerHTML = `当前显示 <b>${cases.length}</b> 个病例`;

    if (cases.length === 0) {
      dom.casesList.innerHTML = `
        <div class="empty-box">
          <div class="empty-icon-wrap">${SVG.info}</div>
          <h3>未找到匹配的临床病例</h3>
          <p>请尝试切换题库类型、清除搜索关键词或切换至其他章节查看。</p>
        </div>
      `;
      return;
    }

    let html = '';
    cases.forEach((item) => {
      const isMastered = store.masteredCases.includes(item.id);
      const isStarred = store.starredCases.includes(item.id);

      html += `
        <div class="case-card" id="case-${item.id}">
          <div class="case-header">
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <span class="q-badge badge-chapter">${item.chapter}</span>
              <span class="q-badge badge-a">${item.caseNum}</span>
              ${item.is10thEdition ? `
                <span class="q-badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #7dd3fc; font-weight:700;">
                  人卫第十版教材考题
                </span>
              ` : `
                <span class="q-badge" style="background:var(--bg-subtle); color:var(--text-muted); border:1px solid var(--border);">
                  中山医讲义重点案例
                </span>
              `}
            </div>
            <div class="q-actions">
              <button class="btn-nav" style="font-size:0.75rem; padding:0.25rem 0.6rem; ${isMastered ? 'color:var(--success); border-color:var(--success);' : ''}" onclick="window.APP.toggleCaseMastered('${item.id}')">
                ${isMastered ? '已掌握' : '标记已掌握'}
              </button>
              <button class="star-btn ${isStarred ? 'active' : ''}" onclick="window.APP.toggleCaseStar('${item.id}')" title="收藏病例">
                ${SVG.star}
              </button>
            </div>
          </div>

          <h3 class="case-title" style="margin-bottom:1rem;">${item.title}</h3>

          <div class="case-scenario-box">
            <b>【临床病例情境】：</b>${item.scenario}
          </div>

          <div class="case-q-box">
            <div class="case-q-title">临床解剖学问题：</div>
            <ul class="case-q-list">
              ${item.questions.map(q => `<li class="case-q-item">${q}</li>`).join('')}
            </ul>
          </div>

          <button class="case-reveal-btn" onclick="window.APP.toggleCaseAnswers('${item.id}')">
            <span>思考完毕 · 展开解剖学答案与临床机制解析</span>
          </button>

          <div class="case-answers-drawer" id="case-ans-${item.id}">
            ${item.diagnosis ? `
              <div style="background:var(--bg-main); border-left:4px solid var(--success); padding:0.65rem 0.95rem; margin-bottom:0.85rem; border-radius:var(--radius-sm); font-weight:700; color:var(--success); font-size:0.95rem;">
                【临床权威诊断】：${item.diagnosis}
              </div>
            ` : ''}
            <div style="font-weight:700; color:var(--primary); margin-bottom:0.75rem; font-size:1.02rem;">
              【逐问解剖机制权威精析】：
            </div>
            ${item.answers.map(ans => `<div class="ans-item">${ans}</div>`).join('')}
            ${item.clinicalPearl ? `
              <div class="ans-pearl-box">
                临床要点提炼 (Clinical Pearl)：${item.clinicalPearl}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    dom.casesList.innerHTML = html;
  }

  function handleToggleCaseAnswers(caseId) {
    const drawer = document.getElementById(`case-ans-${caseId}`);
    if (drawer) {
      drawer.classList.toggle('open');
    }
  }

  function handleToggleCaseMastered(caseId) {
    const idx = store.masteredCases.indexOf(caseId);
    if (idx > -1) {
      store.masteredCases.splice(idx, 1);
    } else {
      store.masteredCases.push(caseId);
    }
    saveStore();
    renderCasesList();
  }

  function handleToggleCaseStar(caseId) {
    const idx = store.starredCases.indexOf(caseId);
    if (idx > -1) {
      store.starredCases.splice(idx, 1);
    } else {
      store.starredCases.push(caseId);
    }
    saveStore();
    renderCasesList();
  }

  // ================= Knowledge Modal Linkage =================
  function openKnowledgeModal(kbId) {
    const card = KnowledgeData.find(k => k.id === kbId);
    if (!card) return;

    dom.modalTitle.textContent = `${card.chapter} · ${card.title}`;
    dom.modalBody.innerHTML = `
      <div style="font-weight:700; color:var(--primary); margin-bottom:0.75rem; font-size:1.02rem;">
        【考点引导】：
      </div>
      <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1.25rem; font-weight:600;">
        ${card.front}
      </div>

      <div style="font-weight:700; color:var(--teal); margin-bottom:0.75rem; font-size:1.02rem;">
        【解剖学精析与结构毗邻】：
      </div>
      <div style="line-height:1.8; color:var(--text-main); margin-bottom:1.25rem;">
        ${card.back}
      </div>

      ${card.clinicalNote ? `
        <div class="card-clinical-box" style="margin-top:0;">
          <b>临床应用要点：</b>${card.clinicalNote}
        </div>
      ` : ''}
    `;

    dom.modalGoAnkiBtn.onclick = () => {
      closeModal();
      dom.navTabs.forEach(t => {
        if (t.getAttribute('data-view') === 'anki') t.click();
      });
      const idx = KnowledgeData.findIndex(k => k.id === kbId);
      if (idx > -1) {
        state.chapter = '全部';
        document.querySelectorAll('.ch-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-ch') === '全部'));
        state.ankiIndex = idx;
        renderAnkiCard();
      }
    };

    dom.modalOverlay.classList.add('active');
  }

  function closeModal() {
    dom.modalOverlay.classList.remove('active');
  }

  // ================= Dashboard & Stats =================
  function updateBadgesAndStats() {
    const errorCount = store.wrong.length;
    const favCount = store.starred.length;

    if (dom.badgeErrors) {
      dom.badgeErrors.textContent = errorCount;
      dom.badgeErrors.style.display = errorCount > 0 ? 'inline-block' : 'none';
    }

    if (dom.badgeStarred) {
      dom.badgeStarred.textContent = favCount;
      dom.badgeStarred.style.display = favCount > 0 ? 'inline-block' : 'none';
    }
  }

  function renderStatsDashboard() {
    const answeredKeys = Object.keys(store.answered);
    const totalAnswered = answeredKeys.length;
    const totalCorrect = answeredKeys.filter(k => store.answered[k].isCorrect).length;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const masteredCardsCount = Object.keys(store.masteredCards).filter(k => store.masteredCards[k].status === 'easy').length;

    dom.statDoneCount.textContent = totalAnswered;
    dom.statAccuracy.textContent = `${accuracy}%`;
    dom.statMasteredCards.textContent = `${masteredCardsCount} / ${KnowledgeData.length}`;
    dom.statErrorCount.textContent = store.wrong.length;
    dom.statFavCount.textContent = store.starred.length;
  }

  // ================= Export & Import =================
  function exportUserData() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `局部解剖学学习档案备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importUserData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        store = Object.assign({}, defaultStore, imported);
        saveStore();
        alert('学习记录备份导入成功！');
        location.reload();
      } catch (err) {
        alert('文件格式错误，无法导入！');
      }
    };
    reader.readAsText(file);
  }

  function escapeHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ================= Global Public API for Inline Handlers =================
  window.APP = {
    selectOption: handleSelectOption,
    submitXQuestion: handleSubmitX,
    showAnswerEarly: handleShowAnswerEarly,
    toggleStar: handleToggleStar,
    removeError: handleRemoveError,
    changePage: (p) => {
      state.page = p;
      renderQuizList();
      window.scrollTo({ top: 120, behavior: 'smooth' });
    },
    toggleCaseAnswers: handleToggleCaseAnswers,
    toggleCaseMastered: handleToggleCaseMastered,
    toggleCaseStar: handleToggleCaseStar,
    setCaseFilter: handleSetCaseFilter,
    openKnowledgeModal: openKnowledgeModal,
    
    // Mind Map
    toggleMmNode: toggleMindMapNode,
    selectMmNode: (nodeId, name, desc, chapter, kbId) => {
      document.querySelectorAll('.mm-node').forEach(n => n.classList.remove('active'));
      const target = document.getElementById(nodeId);
      if (target) target.classList.add('active');
      inspectMindMapNode(name, desc, chapter, kbId);
    },
    switchChapterAndQuiz: (ch) => {
      state.chapter = ch;
      document.querySelectorAll('.ch-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-ch') === ch));
      dom.navTabs.forEach(t => {
        if (t.getAttribute('data-view') === 'quiz') t.click();
      });
    }
  };

  window.addEventListener('DOMContentLoaded', init);

})();
