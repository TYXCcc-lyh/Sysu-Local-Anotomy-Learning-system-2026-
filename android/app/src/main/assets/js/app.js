/**
 * 数字化医学交互学习系统 - Core Application Engine
 * 医考帮架构对标 · 多学科扩展 · 全量答题卡矩阵 · 智能斩题 · 思维导图内嵌展示 · 自主图文笔记
 * Pure Vanilla JS, High Performance, Zero External Dependencies
 */

(function () {
  'use strict';

  // ================= Course & Store Management =================
  function getCourse() {
    return (typeof CourseManager !== 'undefined') ? CourseManager.getCurrentCourse() : {
      id: 'anatomy',
      name: '局部解剖学',
      shortName: '局解',
      badge: 'ANATOMY',
      desc: '高等医学院校教学大纲 · 人卫十版教材'
    };
  }

  function getStoreKey() {
    const course = getCourse();
    return `MED_LEARNING_STORE_${course.id.toUpperCase()}_V4`;
  }

  const defaultStore = {
    answered: {},        // qId -> { userAnswer, isCorrect, timestamp }
    wrong: [],           // array of qIds
    starred: [],         // array of qIds
    slashed: [],         // array of qIds (医考帮斩题库)
    questionNotes: {},   // qId -> { note: string, customAns: string, img: string, time: number }
    mindmapCustom: {},   // kbId -> { notes: string, img: string, time: number }
    masteredCards: {},   // cardId -> { status: 'again'|'good'|'easy', count }
    masteredCases: [],   // array of caseIds
    starredCases: [],    // array of caseIds
    theme: 'light'
  };

  let store = loadStore();

  function loadStore() {
    try {
      const data = localStorage.getItem(getStoreKey());
      return data ? Object.assign({}, defaultStore, JSON.parse(data)) : Object.assign({}, defaultStore);
    } catch (e) {
      console.error('Failed to load localStorage', e);
      return Object.assign({}, defaultStore);
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(getStoreKey(), JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    updateBadgesAndStats();
  }

  // Active runtime state
  const state = {
    activeView: 'quiz',       // anki | mindmap | quiz | cases | errors | favorites | stats (default to quiz for immediate exam prep)
    chapter: '全部',          // 全部 | or specific chapter
    searchQuery: '',
    
    // Anki state
    ankiIndex: 0,
    ankiFlipped: false,
    
    // 医考帮 题库架构状态
    quizSlashFilter: 'all',    // all | slashed | unslashed (斩题)
    qTypeFilter: 'all',        // all | A | A2 | X
    qCategoryFilter: 'all',    // all | wrong | starred | unanswered
    qSubTopicFilter: 'all',    // all | specific subtopic string
    quizMode: 'practice',      // practice (练习) | speed (快刷) | exam (测试) | recite (背题)
    quizViewMode: 'sheet',     // sheet (答题卡矩阵全览) | card (单题沉浸) | list (连续流式)
    activeQuestionIndex: 0,    // current question index in active filtered list
    examAnswers: {},           // temp answers before exam submission
    examSubmitted: false,      // whether current exam has been submitted
    
    // Pagination (for list view)
    page: 1,
    pageSize: 20,
    
    // Cases state
    caseFilter: 'all',
    
    // Mind Map state
    selectedNode: null,
    expandedKnowledgeNodes: {}, // kbId -> boolean (whether leaf knowledge card is expanded)
    openMmBranches: {},         // nodeName -> boolean (whether folder branch is open)
    allBranchesOpen: false,     // whether expand-all is active
    
    // Editing modal state
    editingMmKbId: null,
    editingQId: null,
    
    // Temp x-type selections: qId -> Set of options
    xSelections: {}
  };

  // Dynamic Data Accessors
  function getKnowledgeData() {
    const c = (typeof CourseManager !== 'undefined') ? CourseManager.getCurrentCourse() : null;
    if (c && typeof c.getKnowledge === 'function') {
      const data = c.getKnowledge();
      if (data && data.length) return data;
    }
    return window.ANATOMY_KNOWLEDGE || (typeof KnowledgeData !== 'undefined' ? KnowledgeData : []);
  }

  function getQuestionsData() {
    const c = (typeof CourseManager !== 'undefined') ? CourseManager.getCurrentCourse() : null;
    if (c && typeof c.getQuestions === 'function') {
      const data = c.getQuestions();
      if (data && data.length) return data;
    }
    return window.ANATOMY_QUESTIONS || (typeof QuestionsData !== 'undefined' ? QuestionsData : []);
  }

  function getCasesData() {
    const c = (typeof CourseManager !== 'undefined') ? CourseManager.getCurrentCourse() : null;
    if (c && typeof c.getCases === 'function') {
      const data = c.getCases();
      if (data && data.length) return data;
    }
    return window.ANATOMY_CASES || (typeof CasesData !== 'undefined' ? CasesData : []);
  }

  function getMindMapData() {
    const c = (typeof CourseManager !== 'undefined') ? CourseManager.getCurrentCourse() : null;
    if (c && typeof c.getMindmap === 'function') {
      const data = c.getMindmap();
      if (data && (data.name || (data.children && data.children.length))) return data;
    }
    return window.ANATOMY_MINDMAP || (typeof MindMapData !== 'undefined' ? MindMapData : {});
  }

  // SVG Icon definitions
  const SVG = {
    chevronRight: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    star: `<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    check: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    book: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    arrowRight: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    slash: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line></svg>`,
    edit: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    image: `<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
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
    
    // Course Switcher Elements
    courseSelectBtn: document.getElementById('courseSelectBtn'),
    courseDropdownMenu: document.getElementById('courseDropdownMenu'),
    currentCourseBadge: document.getElementById('currentCourseBadge'),
    currentCourseName: document.getElementById('currentCourseName'),
    headerSubTag: document.getElementById('headerSubTag'),
    headerSubDesc: document.getElementById('headerSubDesc'),
    
    // Anki elements
    ankiCard: document.getElementById('ankiFlashcard'),
    ankiCardTag: document.getElementById('ankiCardTag'),
    ankiCardHint: document.getElementById('ankiCardHint'),
    ankiCardTitle: document.getElementById('ankiCardTitle'),
    ankiFrontText: document.getElementById('ankiCardPrompt'),
    ankiBackText: document.getElementById('ankiCardAnswer'),
    ankiClinicalBox: document.getElementById('ankiClinicalBox'),
    ankiClinicalText: document.getElementById('ankiClinicalText'),
    ankiProgressText: document.getElementById('ankiProgressText'),
    ankiProgressFill: document.getElementById('ankiProgressFill'),
    btnFlipCard: document.getElementById('btnAnkiFlip'),
    btnPrevCard: document.getElementById('btnAnkiPrev'),
    btnNextCard: document.getElementById('btnAnkiNext'),
    btnRateAgain: document.getElementById('btnRateAgain'),
    btnRateGood: document.getElementById('btnRateGood'),
    btnRateEasy: document.getElementById('btnRateEasy'),
    
    // Mind Map elements
    mindmapTree: document.getElementById('mindmapTree'),
    inspectorTitle: document.getElementById('inspectorTitle'),
    inspectorDesc: document.getElementById('inspectorDesc'),
    inspectorActions: document.getElementById('inspectorActions'),
    btnMmExpandAll: document.getElementById('btnMmExpandAll'),
    btnMmCollapseAll: document.getElementById('btnMmCollapseAll'),
    btnMmExpandAllKnowledge: document.getElementById('btnMmExpandAllKnowledge'),
    btnMmCollapseAllKnowledge: document.getElementById('btnMmCollapseAllKnowledge'),
    
    // Quiz & Testing Elements (医考帮架构)
    yikaoFilterPanel: document.getElementById('yikaoFilterPanel'),
    pillsSlashFilter: document.getElementById('pillsSlashFilter'),
    pillsTypeFilter: document.getElementById('pillsTypeFilter'),
    pillsCategoryFilter: document.getElementById('pillsCategoryFilter'),
    pillsModeFilter: document.getElementById('pillsModeFilter'),
    yikaoSubTopicRow: document.getElementById('yikaoSubTopicRow'),
    pillsSubTopicFilter: document.getElementById('pillsSubTopicFilter'),
    btnViewSheet: document.getElementById('btnViewSheet'),
    btnViewCard: document.getElementById('btnViewCard'),
    btnViewList: document.getElementById('btnViewList'),
    btnSubmitExam: document.getElementById('btnSubmitExam'),
    quizStatsBadge: document.getElementById('quizStatsBadge'),
    quizSheetContainer: document.getElementById('quizSheetContainer'),
    quizSheetGrid: document.getElementById('quizSheetGrid'),
    sheetTotalCount: document.getElementById('sheetTotalCount'),
    sheetUnansweredCount: document.getElementById('sheetUnansweredCount'),
    sheetSlashedCount: document.getElementById('sheetSlashedCount'),
    quizSingleCardContainer: document.getElementById('quizSingleCardContainer'),
    quizQuestionsList: document.getElementById('quizQuestionsList'),
    quizPaginationBar: document.getElementById('quizPaginationBar'),
    
    // Cases elements
    casesList: document.getElementById('casesList'),
    casesStatsBadge: document.getElementById('casesStatsBadge'),
    
    // Knowledge Modal
    modalOverlay: document.getElementById('knowledgeModal'),
    modalTitle: document.getElementById('modalKnowledgeTitle'),
    modalBody: document.getElementById('modalKnowledgeBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalGoAnkiBtn: document.getElementById('modalGoAnkiBtn'),
    
    // Mindmap Node Edit Modal
    mindmapNodeModal: document.getElementById('mindmapNodeModal'),
    mmEditNodeName: document.getElementById('mmEditNodeName'),
    mmEditCustomNotes: document.getElementById('mmEditCustomNotes'),
    mmImgFileInput: document.getElementById('mmImgFileInput'),
    mmImgUrlInput: document.getElementById('mmImgUrlInput'),
    btnApplyMmImgUrl: document.getElementById('btnApplyMmImgUrl'),
    mmImgPreviewBox: document.getElementById('mmImgPreviewBox'),
    mmImgPreviewThumb: document.getElementById('mmImgPreviewThumb'),
    btnRemoveMmImg: document.getElementById('btnRemoveMmImg'),
    btnSaveMmNode: document.getElementById('btnSaveMmNode'),
    btnResetMmNode: document.getElementById('btnResetMmNode'),
    
    // Question Note Modal
    questionNoteModal: document.getElementById('questionNoteModal'),
    modalQNoteStem: document.getElementById('modalQNoteStem'),
    qNoteContentInput: document.getElementById('qNoteContentInput'),
    qNoteCustomAns: document.getElementById('qNoteCustomAns'),
    qImgFileInput: document.getElementById('qImgFileInput'),
    qImgPreviewBox: document.getElementById('qImgPreviewBox'),
    qImgPreviewThumb: document.getElementById('qImgPreviewThumb'),
    btnRemoveQImg: document.getElementById('btnRemoveQImg'),
    btnSaveQNote: document.getElementById('btnSaveQNote'),
    btnDeleteQNote: document.getElementById('btnDeleteQNote'),
    
    // Course Import Modal
    courseImportModal: document.getElementById('courseImportModal'),
    coursePkgFileInput: document.getElementById('coursePkgFileInput'),
    btnConfirmImportCourse: document.getElementById('btnConfirmImportCourse'),
    btnOpenImportCourseModal: document.getElementById('btnOpenImportCourseModal')
  };

  // Temp holder for base64 images in modals
  let tempMmImg = "";
  let tempQImg = "";

  // ================= App Initialization =================
  function init() {
    // 1. Set theme
    document.documentElement.setAttribute('data-theme', store.theme || 'light');
    
    // 2. Setup Course Switcher & Header
    setupCourseSwitcher();
    renderChapterPills();
    updateSubTopicPills();

    // 3. Setup event listeners
    setupEventListeners();
    
    // 4. Update badge counters
    updateBadgesAndStats();
    
    // 5. Render active view
    renderView(state.activeView);
  }

  // ================= Course Switcher Logic =================
  function setupCourseSwitcher() {
    const course = getCourse();
    if (dom.currentCourseBadge) dom.currentCourseBadge.textContent = course.badge;
    if (dom.currentCourseName) dom.currentCourseName.textContent = course.name;
    if (dom.headerSubTag) dom.headerSubTag.textContent = course.shortName + " · 考点闪卡 · 导图 · 题库";
    if (dom.headerSubDesc) dom.headerSubDesc.textContent = course.desc;

    if (dom.courseSelectBtn && dom.courseDropdownMenu) {
      dom.courseSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.courseDropdownMenu.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        dom.courseDropdownMenu.classList.remove('show');
      });
    }

    document.querySelectorAll('.course-opt-item[data-course]').forEach(item => {
      item.addEventListener('click', () => {
        const cid = item.getAttribute('data-course');
        switchActiveCourse(cid);
      });
    });

    if (dom.btnOpenImportCourseModal) {
      dom.btnOpenImportCourseModal.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.courseDropdownMenu.classList.remove('show');
        dom.courseImportModal.classList.add('active');
      });
    }

    if (dom.btnConfirmImportCourse && dom.coursePkgFileInput) {
      dom.btnConfirmImportCourse.addEventListener('click', () => {
        const file = dom.coursePkgFileInput.files[0];
        if (!file) {
          alert('请选择有效的课程包 JSON 文件！');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (CourseManager.registerCourse(data)) {
              alert(`成功导入学科：${data.name}！已自动为您切换。`);
              dom.courseImportModal.classList.remove('active');
              switchActiveCourse(data.id);
            } else {
              alert('导入失败，课程包 JSON 数据格式缺少必要字段 (id, name 等)！');
            }
          } catch(err) {
            alert('JSON 解析失败：' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function switchActiveCourse(courseId) {
    if (typeof CourseManager !== 'undefined') {
      CourseManager.switchCourse(courseId);
    }
    store = loadStore();
    state.chapter = '全部';
    state.page = 1;
    state.ankiIndex = 0;
    state.activeQuestionIndex = 0;
    state.examAnswers = {};
    state.examSubmitted = false;

    // Refresh UI
    const course = getCourse();
    if (dom.currentCourseBadge) dom.currentCourseBadge.textContent = course.badge;
    if (dom.currentCourseName) dom.currentCourseName.textContent = course.name;
    if (dom.headerSubTag) dom.headerSubTag.textContent = course.shortName + " · 考点闪卡 · 导图 · 题库";
    if (dom.headerSubDesc) dom.headerSubDesc.textContent = course.desc;

    document.querySelectorAll('.course-opt-item[data-course]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-course') === courseId);
    });

    renderChapterPills();
    updateBadgesAndStats();
    renderCurrentViewContent();
  }

  // ================= Dynamic Chapter Pills =================
  function renderChapterPills() {
    if (!dom.chapterPills) return;
    const questions = getQuestionsData();
    const knowledge = getKnowledgeData();
    
    // Extract unique chapters from data
    const chaptersSet = new Set();
    questions.forEach(q => { if (q.chapter) chaptersSet.add(q.chapter); });
    knowledge.forEach(k => { if (k.chapter) chaptersSet.add(k.chapter); });
    
    const chapters = Array.from(chaptersSet);
    
    let html = `<span class="ch-label">章节分类:</span>`;
    html += `<button class="ch-pill ${state.chapter === '全部' ? 'active' : ''}" data-ch="全部">全部章节</button>`;
    
    chapters.forEach(ch => {
      html += `<button class="ch-pill ${state.chapter === ch ? 'active' : ''}" data-ch="${escapeHtml(ch)}">${escapeHtml(ch)}</button>`;
    });
    
    dom.chapterPills.innerHTML = html;
    
    // Bind pill clicks
    dom.chapterPills.querySelectorAll('.ch-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        dom.chapterPills.querySelectorAll('.ch-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.chapter = pill.getAttribute('data-ch');
        state.qSubTopicFilter = 'all'; // 切换章节时重置细分考点
        state.page = 1;
        state.ankiIndex = 0;
        state.activeQuestionIndex = 0;
        updateSubTopicPills();
        renderCurrentViewContent();
      });
    });
  }

  // ================= 医考帮 考点细分胶囊栏 (SubTopic Filter Bar) =================
  function updateSubTopicPills() {
    if (!dom.pillsSubTopicFilter || !dom.yikaoSubTopicRow) return;
    const questions = getQuestionsData();
    let currentScope = questions;
    if (state.chapter !== '全部') {
      currentScope = currentScope.filter(q => isChapterMatch(q.chapter, state.chapter));
    }
    
    // 统计当前章节范围内的考点细分题目数
    const subTopicCounts = {};
    currentScope.forEach(q => {
      const sub = q.subTopic;
      if (sub) {
        subTopicCounts[sub] = (subTopicCounts[sub] || 0) + 1;
      }
    });

    const subTopics = Object.keys(subTopicCounts);
    if (subTopics.length === 0) {
      dom.yikaoSubTopicRow.style.display = 'none';
      state.qSubTopicFilter = 'all';
      return;
    }

    dom.yikaoSubTopicRow.style.display = 'flex';
    
    // 如果当前选中的子分类不再属于当前章节，重置为全部
    if (state.qSubTopicFilter !== 'all' && !subTopics.includes(state.qSubTopicFilter)) {
      state.qSubTopicFilter = 'all';
    }

    let pillsHtml = `
      <button class="yikao-pill ${state.qSubTopicFilter === 'all' ? 'active' : ''}" data-subtopic="all">
        全部细分考点 (${currentScope.length})
      </button>
    `;

    subTopics.forEach(sub => {
      const count = subTopicCounts[sub];
      const isActive = state.qSubTopicFilter === sub;
      pillsHtml += `
        <button class="yikao-pill ${isActive ? 'active' : ''}" data-subtopic="${escapeHtml(sub)}">
          ${escapeHtml(sub)} (${count})
        </button>
      `;
    });

    dom.pillsSubTopicFilter.innerHTML = pillsHtml;

    dom.pillsSubTopicFilter.querySelectorAll('.yikao-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.pillsSubTopicFilter.querySelectorAll('.yikao-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.qSubTopicFilter = btn.getAttribute('data-subtopic');
        state.page = 1;
        state.activeQuestionIndex = 0;
        renderQuizView();
      });
    });
  }

  // ================= Event Listeners =================
  function setupEventListeners() {
    // Theme toggle
    if (dom.themeBtn) {
      dom.themeBtn.addEventListener('click', () => {
        store.theme = store.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', store.theme);
        saveStore();
      });
    }

    // Global search
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        state.page = 1;
        state.activeQuestionIndex = 0;
        renderCurrentViewContent();
      });
    }

    // Nav tabs
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        dom.navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderView(view);
      });
    });

    // 医考帮 斩题过滤 (Row 1)
    if (dom.pillsSlashFilter) {
      dom.pillsSlashFilter.querySelectorAll('.yikao-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          dom.pillsSlashFilter.querySelectorAll('.yikao-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.quizSlashFilter = pill.getAttribute('data-slash');
          state.page = 1;
          state.activeQuestionIndex = 0;
          renderQuizView();
        });
      });
    }

    // 医考帮 题型过滤 (Row 2)
    if (dom.pillsTypeFilter) {
      dom.pillsTypeFilter.querySelectorAll('.yikao-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          dom.pillsTypeFilter.querySelectorAll('.yikao-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.qTypeFilter = pill.getAttribute('data-qtype');
          state.page = 1;
          state.activeQuestionIndex = 0;
          renderQuizView();
        });
      });
    }

    // 医考帮 分类过滤 (Row 3)
    if (dom.pillsCategoryFilter) {
      dom.pillsCategoryFilter.querySelectorAll('.yikao-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          dom.pillsCategoryFilter.querySelectorAll('.yikao-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.qCategoryFilter = pill.getAttribute('data-qcat');
          state.page = 1;
          state.activeQuestionIndex = 0;
          renderQuizView();
        });
      });
    }

    // 医考帮 模式切换 (Row 4)
    if (dom.pillsModeFilter) {
      dom.pillsModeFilter.querySelectorAll('.yikao-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          dom.pillsModeFilter.querySelectorAll('.yikao-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.quizMode = pill.getAttribute('data-mode');
          state.examSubmitted = false;
          renderQuizView();
        });
      });
    }

    // 题库三视图模式切换 (答题卡全览 vs 单题沉浸 vs 列表流式)
    if (dom.btnViewSheet) {
      dom.btnViewSheet.addEventListener('click', () => {
        state.quizViewMode = 'sheet';
        updateQuizViewButtons();
        renderQuizView();
      });
    }
    if (dom.btnViewCard) {
      dom.btnViewCard.addEventListener('click', () => {
        state.quizViewMode = 'card';
        updateQuizViewButtons();
        renderQuizView();
      });
    }
    if (dom.btnViewList) {
      dom.btnViewList.addEventListener('click', () => {
        state.quizViewMode = 'list';
        updateQuizViewButtons();
        renderQuizView();
      });
    }

    // 考试模式交卷按钮
    if (dom.btnSubmitExam) {
      dom.btnSubmitExam.addEventListener('click', () => {
        handleSubmitExam();
      });
    }

    // Anki controls
    if (dom.btnFlipCard) dom.btnFlipCard.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAnkiFlip();
    });
    if (dom.ankiCard) dom.ankiCard.addEventListener('click', (e) => {
      if (!e.target.closest('.anki-rating-btns') && !e.target.closest('.btn-nav') && !e.target.closest('button') && !e.target.closest('a')) {
        toggleAnkiFlip();
      }
    });
    if (dom.btnPrevCard) dom.btnPrevCard.addEventListener('click', () => navigateAnkiCard(-1));
    if (dom.btnNextCard) dom.btnNextCard.addEventListener('click', () => navigateAnkiCard(1));
    if (dom.btnRateAgain) dom.btnRateAgain.addEventListener('click', () => rateAnkiCard('again'));
    if (dom.btnRateGood) dom.btnRateGood.addEventListener('click', () => rateAnkiCard('good'));
    if (dom.btnRateEasy) dom.btnRateEasy.addEventListener('click', () => rateAnkiCard('easy'));

    // Mind Map controls
    if (dom.btnMmExpandAll) {
      dom.btnMmExpandAll.addEventListener('click', () => {
        state.allBranchesOpen = true;
        renderMindMap();
      });
    }
    if (dom.btnMmCollapseAll) {
      dom.btnMmCollapseAll.addEventListener('click', () => {
        state.allBranchesOpen = false;
        state.openMmBranches = {};
        renderMindMap();
      });
    }
    if (dom.btnMmExpandAllKnowledge) {
      dom.btnMmExpandAllKnowledge.addEventListener('click', () => {
        state.allBranchesOpen = true;
        getKnowledgeData().forEach(k => {
          state.expandedKnowledgeNodes[k.id] = true;
        });
        document.querySelectorAll('.mm-children').forEach(c => c.classList.add('open'));
        document.querySelectorAll('.mm-toggle-btn').forEach(b => b.classList.add('expanded'));
        document.querySelectorAll('.mm-leaf-knowledge-box').forEach(b => b.style.display = 'block');
        document.querySelectorAll('.mm-leaf-toggle-btn').forEach(b => b.textContent = '收起知识');
      });
    }
    if (dom.btnMmCollapseAllKnowledge) {
      dom.btnMmCollapseAllKnowledge.addEventListener('click', () => {
        state.expandedKnowledgeNodes = {};
        document.querySelectorAll('.mm-leaf-knowledge-box').forEach(b => b.style.display = 'none');
        document.querySelectorAll('.mm-leaf-toggle-btn').forEach(b => b.textContent = '展开知识');
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Mindmap node edit modal events
    setupMindmapEditModal();
    // Question note modal events
    setupQuestionNoteModal();
  }

  function updateQuizViewButtons() {
    if (dom.btnViewSheet) dom.btnViewSheet.classList.toggle('active', state.quizViewMode === 'sheet');
    if (dom.btnViewCard) dom.btnViewCard.classList.toggle('active', state.quizViewMode === 'card');
    if (dom.btnViewList) dom.btnViewList.classList.toggle('active', state.quizViewMode === 'list');
  }

  // ================= View Routing =================
  function renderView(viewName) {
    state.activeView = viewName;
    dom.views.forEach(v => {
      v.classList.remove('active');
      if (v.id === `view-${viewName}`) v.classList.add('active');
    });
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
        renderQuizView();
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
  }

  // ================= 1. Anki Flashcards Engine =================
  function getFilteredAnkiCards() {
    let list = getKnowledgeData();
    if (state.chapter !== '全部') {
      list = list.filter(k => isChapterMatch(k.chapter, state.chapter));
    }
    if (state.searchQuery) {
      const q = state.searchQuery;
      list = list.filter(k => 
        (k.title && k.title.toLowerCase().includes(q)) ||
        (k.front && k.front.toLowerCase().includes(q)) ||
        (k.back && k.back.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function renderAnkiCard() {
    const cards = getFilteredAnkiCards();
    if (!cards || cards.length === 0) {
      if (dom.ankiCardTitle) dom.ankiCardTitle.textContent = "无考点";
      if (dom.ankiFrontText) dom.ankiFrontText.textContent = "当前分类未找到匹配的闪卡";
      if (dom.ankiBackText) dom.ankiBackText.textContent = "请切换章节分类或清空搜索关键词重试。";
      if (dom.ankiCardTag) dom.ankiCardTag.textContent = state.chapter;
      if (dom.ankiCardHint) dom.ankiCardHint.textContent = "0 / 0";
      if (dom.ankiProgressText) dom.ankiProgressText.textContent = "0%";
      if (dom.ankiProgressFill) dom.ankiProgressFill.style.width = "0%";
      return;
    }

    if (state.ankiIndex >= cards.length) state.ankiIndex = cards.length - 1;
    if (state.ankiIndex < 0) state.ankiIndex = 0;

    const card = cards[state.ankiIndex];
    state.ankiFlipped = false;
    if (dom.ankiCard) {
      dom.ankiCard.classList.remove('flipped');
      dom.ankiCard.classList.remove('is-flipped');
    }

    if (dom.ankiCardTitle) dom.ankiCardTitle.textContent = card.title || '核心考点';
    if (dom.ankiCardTag) dom.ankiCardTag.textContent = `${card.chapter || ''} · ${card.title || ''}`;
    if (dom.ankiCardHint) dom.ankiCardHint.textContent = `闪卡 #${state.ankiIndex + 1} / ${cards.length}`;
    if (dom.ankiFrontText) dom.ankiFrontText.textContent = card.front;
    if (dom.ankiBackText) dom.ankiBackText.textContent = card.back;
    
    const pct = Math.round(((state.ankiIndex + 1) / cards.length) * 100);
    if (dom.ankiProgressText) dom.ankiProgressText.textContent = `${pct}%`;
    if (dom.ankiProgressFill) dom.ankiProgressFill.style.width = `${pct}%`;

    // Check if user has custom notes or image on this card
    const custom = store.mindmapCustom[card.id] || {};
    let customHtml = '';
    if (custom.notes) {
      customHtml += `<div class="mm-leaf-custom-notes" style="margin-top:0.75rem;"><strong>【我的专属笔记】：</strong><br>${escapeHtml(custom.notes)}</div>`;
    }
    if (custom.img) {
      customHtml += `<img class="mm-leaf-img" src="${custom.img}" alt="解剖配图" style="max-height:220px;margin-top:0.5rem;" onclick="window.open('${custom.img}')">`;
    }

    if (dom.ankiClinicalBox && dom.ankiClinicalText) {
      let extraHtml = '';
      const mText = card.mnemonic || (card.back && card.back.includes('【记忆口诀】：') ? card.back.split('【记忆口诀】：')[1].split('\n')[0] : '');
      const cText = card.clinical || card.clinicalNote || '';
      if (mText) {
        extraHtml += `<div style="margin-bottom:0.4rem;"><span style="color:#059669; font-weight:700;">【记忆口诀】</span> ${escapeHtml(mText)}</div>`;
      }
      if (cText) {
        extraHtml += `<div style="margin-bottom:0.4rem;"><span style="color:var(--primary); font-weight:700;">【临床要点】</span> ${escapeHtml(cText)}</div>`;
      }
      extraHtml += customHtml;
      if (extraHtml) {
        dom.ankiClinicalBox.style.display = 'block';
        dom.ankiClinicalText.innerHTML = extraHtml;
      } else {
        dom.ankiClinicalBox.style.display = 'none';
      }
    }
  }

  function toggleAnkiFlip() {
    state.ankiFlipped = !state.ankiFlipped;
    if (dom.ankiCard) {
      dom.ankiCard.classList.toggle('flipped', state.ankiFlipped);
      dom.ankiCard.classList.toggle('is-flipped', state.ankiFlipped);
    }
  }

  function navigateAnkiCard(step) {
    const cards = getFilteredAnkiCards();
    if (!cards.length) return;
    state.ankiIndex = (state.ankiIndex + step + cards.length) % cards.length;
    renderAnkiCard();
  }

  function rateAnkiCard(rating) {
    const cards = getFilteredAnkiCards();
    if (!cards.length) return;
    const card = cards[state.ankiIndex];
    store.masteredCards[card.id] = { status: rating, time: Date.now() };
    saveStore();
    navigateAnkiCard(1);
  }

  // ================= 2. Mind Map Engine (内嵌展示与自主图文编辑) =================
  function renderMindMap() {
    if (!dom.mindmapTree) return;
    const data = getMindMapData();
    if (!data) {
      dom.mindmapTree.innerHTML = `<div class="empty-state">当前学科暂无思维导图数据</div>`;
      return;
    }
    dom.mindmapTree.innerHTML = renderTreeNodeHtml(data, 0, true);
  }

  function renderTreeNodeHtml(node, level) {
    const hasChildren = node.children && node.children.length > 0;
    const nodeId = 'mm_node_' + (node.kbId || encodeURIComponent(node.name).replace(/[^a-zA-Z0-9_]/g, '_'));
    const isLeafKnowledge = !!node.kbId;
    const custom = (node.kbId && store.mindmapCustom[node.kbId]) || {};
    const isInlineExpanded = !!state.expandedKnowledgeNodes[node.kbId];
    
    // 判定当前分支是否展开：若处于全展开模式或用户主动展开过，则保持开启
    const isBranchOpen = state.allBranchesOpen || (state.openMmBranches[node.name] !== undefined ? state.openMmBranches[node.name] : (level < 1));

    let html = `
      <div class="mm-node level-${level}" id="${nodeId}" data-kbid="${node.kbId || ''}" data-nodename="${escapeHtml(node.name)}">
        <div class="mm-node-row" onclick="window.APP.selectMmNode('${nodeId}', '${escapeHtml(node.name)}', '${escapeHtml(node.desc || '')}', '${node.chapter || ''}', '${node.kbId || ''}')">
          ${hasChildren ? `
            <button class="mm-toggle-btn ${isBranchOpen ? 'expanded' : ''}" onclick="window.APP.toggleMmNode(event, '${nodeId}')">
              ${SVG.chevronRight}
            </button>
          ` : `<span style="width:20px; display:inline-block; text-align:center; color:var(--primary); font-weight:700;">•</span>`}
          <span class="mm-node-label">${escapeHtml(node.name)}</span>
          ${hasChildren ? `<span class="mm-badge">${node.children.length}</span>` : ''}
          ${isLeafKnowledge ? `
            <span class="mm-badge" style="color:var(--primary); font-weight:700;">考点</span>
            ${custom.notes || custom.img ? `<span class="mm-badge" style="background:#fef3c7; color:#d97706; font-weight:700;">有笔记/图</span>` : ''}
            <button class="btn-nav mm-leaf-toggle-btn" style="padding:0.2rem 0.5rem; font-size:0.75rem; margin-left:0.5rem;" onclick="window.APP.toggleLeafKnowledge(event, '${node.kbId}')">
              ${isInlineExpanded ? '收起知识' : '展开知识'}
            </button>
          ` : ''}
        </div>
    `;

    // 叶子节点内嵌直接展示知识卡片 (常驻 DOM 并由 display 控制，避免全树重绘抖动)
    if (isLeafKnowledge) {
      const card = getKnowledgeData().find(k => k.id === node.kbId) || {};
      html += `
        <div class="mm-leaf-knowledge-box" style="display:${isInlineExpanded ? 'block' : 'none'};">
          <div class="mm-leaf-prompt">【考点引导】：${escapeHtml(card.front || node.desc || '')}</div>
          <div class="mm-leaf-back">${escapeHtml(card.back || '')}</div>
          ${card.mnemonic ? `<div class="mm-leaf-mnemonic">【记忆口诀】：${escapeHtml(card.mnemonic)}</div>` : ''}
          ${custom.notes ? `<div class="mm-leaf-custom-notes"><strong>【我的个性化笔记】：</strong><br>${escapeHtml(custom.notes)}</div>` : ''}
          ${custom.img ? `<img class="mm-leaf-img" src="${custom.img}" alt="解剖配图" onclick="window.open('${custom.img}')" title="点击放大图片">` : ''}
          <div class="mm-leaf-actions">
            <button class="btn-nav" style="background:var(--primary); color:#fff; border-color:var(--primary); font-size:0.78rem;" onclick="window.APP.openMmNodeEditModal('${node.kbId}', '${escapeHtml(node.name)}')">
              ${SVG.edit} 自主编辑/添加配图
            </button>
            <button class="btn-nav" style="font-size:0.78rem;" onclick="window.APP.goToAnkiCard('${node.kbId}')">
              ${SVG.book} 前往闪卡背诵
            </button>
            <button class="btn-nav" style="font-size:0.78rem;" onclick="window.APP.switchChapterAndQuiz('${node.chapter || ''}')">
              ${SVG.arrowRight} 测评相关题目
            </button>
          </div>
        </div>
      `;
    }

    if (hasChildren) {
      html += `
        <div class="mm-children ${isBranchOpen ? 'open' : ''}">
          ${node.children.map(child => renderTreeNodeHtml(child, level + 1)).join('')}
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  function toggleMindMapNode(event, nodeId) {
    if (event) event.stopPropagation();
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return;
    const btn = nodeEl.querySelector(':scope > .mm-node-row > .mm-toggle-btn');
    const children = nodeEl.querySelector(':scope > .mm-children');
    if (children && btn) {
      const willOpen = !children.classList.contains('open');
      children.classList.toggle('open', willOpen);
      btn.classList.toggle('expanded', willOpen);
      const name = nodeEl.getAttribute('data-nodename');
      if (name) state.openMmBranches[name] = willOpen;
    }
  }

  function toggleLeafKnowledge(event, kbId) {
    if (event) event.stopPropagation();
    const willExpand = !state.expandedKnowledgeNodes[kbId];
    state.expandedKnowledgeNodes[kbId] = willExpand;
    
    const nodeEl = document.querySelector(`.mm-node[data-kbid="${kbId}"]`);
    if (nodeEl) {
      const box = nodeEl.querySelector('.mm-leaf-knowledge-box');
      const toggleBtn = nodeEl.querySelector('.mm-leaf-toggle-btn');
      if (box) box.style.display = willExpand ? 'block' : 'none';
      if (toggleBtn) toggleBtn.textContent = willExpand ? '收起知识' : '展开知识';
    }
  }

  function inspectMindMapNode(name, desc, chapter, kbId) {
    if (!dom.inspectorTitle) return;
    dom.inspectorTitle.textContent = name;
    
    let fullDesc = desc || '该解剖结构是核心知识骨架的重要组成部分。';
    const custom = (kbId && store.mindmapCustom[kbId]) || {};
    
    let html = `<p style="font-size:0.88rem; line-height:1.6; margin-bottom:0.75rem;">${escapeHtml(fullDesc)}</p>`;
    
    if (custom.notes) {
      html += `<div class="mm-leaf-custom-notes" style="margin-bottom:0.75rem;"><strong>【我的专属笔记】：</strong><br>${escapeHtml(custom.notes)}</div>`;
    }
    if (custom.img) {
      html += `<img class="mm-leaf-img" src="${custom.img}" alt="解剖配图" style="max-height:220px;margin-bottom:0.75rem;" onclick="window.open('${custom.img}')">`;
    }
    
    if (dom.inspectorDesc) dom.inspectorDesc.innerHTML = html;

    let actionsHtml = '';
    if (kbId) {
      actionsHtml += `
        <button class="btn-nav" style="background:var(--primary); color:#fff; border-color:var(--primary);" onclick="window.APP.openKnowledgeModal('${kbId}')">
          ${SVG.book} 查阅权威考点精析
        </button>
        <button class="btn-nav" onclick="window.APP.openMmNodeEditModal('${kbId}', '${escapeHtml(name)}')">
          ${SVG.edit} 自主编辑/添加配图
        </button>
      `;
    }
    if (chapter && chapter !== '全部') {
      actionsHtml += `
        <button class="btn-nav" onclick="window.APP.switchChapterAndQuiz('${chapter}')">
          ${SVG.arrowRight} 测评本章节相关试题
        </button>
      `;
    }
    if (dom.inspectorActions) dom.inspectorActions.innerHTML = actionsHtml;
  }

  // ================= 3. 医考帮风格 题库测评引擎 (全览矩阵 + 智能斩题 + 模式切换) =================
  function getFilteredQuestions() {
    let list = getQuestionsData();

    // 1. 章节筛选
    if (state.chapter !== '全部') {
      list = list.filter(q => isChapterMatch(q.chapter, state.chapter));
    }

    // 1.5 细分考点过滤 (SubTopic)
    if (state.qSubTopicFilter && state.qSubTopicFilter !== 'all') {
      list = list.filter(q => q.subTopic === state.qSubTopicFilter);
    }

    // 2. 斩题过滤 (Row 1: 全部 | 已斩 | 未斩)
    if (state.quizSlashFilter === 'slashed') {
      list = list.filter(q => store.slashed.includes(q.id));
    } else if (state.quizSlashFilter === 'unslashed') {
      list = list.filter(q => !store.slashed.includes(q.id));
    }

    // 3. 题型过滤 (Row 2: 全部 | A1 | A2 | B | X)
    if (state.qTypeFilter === 'A') {
      list = list.filter(q => q.type === 'A' && (!q.typeLabel || !q.typeLabel.includes('A2')));
    } else if (state.qTypeFilter === 'A2') {
      list = list.filter(q => q.typeLabel && q.typeLabel.includes('A2'));
    } else if (state.qTypeFilter === 'B') {
      list = list.filter(q => q.type === 'B' || (q.typeLabel && q.typeLabel.includes('B')));
    } else if (state.qTypeFilter === 'X') {
      list = list.filter(q => q.type === 'X');
    }

    // 4. 分类过滤 (Row 3: 全部 | 做错的 | 收藏的 | 未做的)
    if (state.qCategoryFilter === 'wrong') {
      list = list.filter(q => store.wrong.includes(q.id));
    } else if (state.qCategoryFilter === 'starred') {
      list = list.filter(q => store.starred.includes(q.id));
    } else if (state.qCategoryFilter === 'unanswered') {
      list = list.filter(q => !store.answered[q.id]);
    }

    // 5. 关键词搜索
    if (state.searchQuery) {
      const s = state.searchQuery;
      list = list.filter(q => 
        (q.stem && q.stem.toLowerCase().includes(s)) ||
        (q.subTopic && q.subTopic.toLowerCase().includes(s)) ||
        (q.chapter && q.chapter.toLowerCase().includes(s)) ||
        Object.values(q.options || {}).some(opt => opt && opt.toLowerCase().includes(s))
      );
    }

    return list;
  }

  function renderQuizView() {
    const list = getFilteredQuestions();
    const allQuestions = getQuestionsData();

    // Update stats counts
    const unansweredCount = list.filter(q => !store.answered[q.id]).length;
    const slashedCount = list.filter(q => store.slashed.includes(q.id)).length;
    const totalCount = list.length;

    if (dom.sheetTotalCount) dom.sheetTotalCount.textContent = totalCount;
    if (dom.sheetUnansweredCount) dom.sheetUnansweredCount.textContent = unansweredCount;
    if (dom.sheetSlashedCount) dom.sheetSlashedCount.textContent = slashedCount;
    if (dom.quizStatsBadge) {
      const modeText = { practice: '练习模式', speed: '快刷模式', exam: '测试模式', recite: '背题模式' }[state.quizMode] || '练习模式';
      dom.quizStatsBadge.textContent = `${modeText} · 共 ${totalCount} 题`;
    }

    if (dom.btnSubmitExam) {
      dom.btnSubmitExam.style.display = (state.quizMode === 'exam' && !state.examSubmitted) ? 'inline-flex' : 'none';
    }

    // View Routing between 3 sub-views: sheet, card, list
    if (state.quizViewMode === 'sheet') {
      if (dom.quizSheetContainer) dom.quizSheetContainer.style.display = 'block';
      if (dom.quizSingleCardContainer) dom.quizSingleCardContainer.style.display = 'none';
      if (dom.quizQuestionsList) dom.quizQuestionsList.style.display = 'none';
      if (dom.quizPaginationBar) dom.quizPaginationBar.style.display = 'none';
      renderAnswerSheet(list);
    } else if (state.quizViewMode === 'card') {
      if (dom.quizSheetContainer) dom.quizSheetContainer.style.display = 'none';
      if (dom.quizSingleCardContainer) dom.quizSingleCardContainer.style.display = 'block';
      if (dom.quizQuestionsList) dom.quizQuestionsList.style.display = 'none';
      if (dom.quizPaginationBar) dom.quizPaginationBar.style.display = 'none';
      renderSingleQuestionCard(list);
    } else {
      if (dom.quizSheetContainer) dom.quizSheetContainer.style.display = 'none';
      if (dom.quizSingleCardContainer) dom.quizSingleCardContainer.style.display = 'none';
      if (dom.quizQuestionsList) dom.quizQuestionsList.style.display = 'flex';
      if (dom.quizPaginationBar) dom.quizPaginationBar.style.display = 'flex';
      renderQuizListView(list);
    }
  }

  // 医考帮 答题卡矩阵渲染 (Answer Sheet Grid)
  function renderAnswerSheet(list) {
    if (!dom.quizSheetGrid) return;
    if (!list || list.length === 0) {
      dom.quizSheetGrid.innerHTML = `
        <div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted);">
          未找到符合当前筛选条件的题目。请尝试在上方切换「斩题」、「题型」或「分类」标签。
        </div>
      `;
      const sheetBottomSummary = document.getElementById('sheetBottomSummary');
      if (sheetBottomSummary) sheetBottomSummary.textContent = '当前共 0 题，未做 0 题';
      return;
    }

    let unansweredCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let slashedCount = 0;
    list.forEach(q => {
      const ansInfo = store.answered[q.id];
      if (!ansInfo) unansweredCount++;
      else if (ansInfo.isCorrect) correctCount++;
      else wrongCount++;
      if (store.slashed.includes(q.id)) slashedCount++;
    });
    const answeredCount = list.length - unansweredCount;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    const sheetTotalCount = document.getElementById('sheetTotalCount');
    const sheetUnansweredCount = document.getElementById('sheetUnansweredCount');
    const sheetSlashedCount = document.getElementById('sheetSlashedCount');
    if (sheetTotalCount) sheetTotalCount.textContent = list.length;
    if (sheetUnansweredCount) sheetUnansweredCount.textContent = unansweredCount;
    if (sheetSlashedCount) sheetSlashedCount.textContent = slashedCount;

    const sheetBottomSummary = document.getElementById('sheetBottomSummary');
    if (sheetBottomSummary) {
      sheetBottomSummary.textContent = `当前共 ${list.length} 题，未做 ${unansweredCount} 题，已做 ${answeredCount} 题 (正确率 ${accuracy}%)，已斩 ${slashedCount} 题`;
    }

    let html = '';
    list.forEach((q, idx) => {
      const isAnswered = !!store.answered[q.id];
      const ansInfo = store.answered[q.id];
      const isCorrect = ansInfo && ansInfo.isCorrect;
      const isWrong = ansInfo && !ansInfo.isCorrect;
      const isSlashed = store.slashed.includes(q.id);
      const isStarred = store.starred.includes(q.id);
      const isActive = idx === state.activeQuestionIndex;

      let bubbleClass = 'sheet-bubble';
      if (isSlashed) bubbleClass += ' slashed';
      else if (isCorrect) bubbleClass += ' correct';
      else if (isWrong) bubbleClass += ' wrong';
      else bubbleClass += ' unanswered';

      if (isActive) bubbleClass += ' active-q';

      const tooltip = `#${q.num || idx + 1} [${q.subTopic || q.chapter}]: ${escapeHtml(q.stem || '').substring(0, 45)}...`;

      html += `
        <button class="${bubbleClass}" title="${tooltip}" onclick="window.APP.jumpToQuestionIndex(${idx})">
          ${q.num || idx + 1}
          ${isStarred ? `<span class="sheet-star-badge" title="已收藏"></span>` : ''}
        </button>
      `;
    });

    dom.quizSheetGrid.innerHTML = html;
  }

  // 单题沉浸模式渲染 (Single Card Mode)
  function renderSingleQuestionCard(list) {
    if (!dom.quizSingleCardContainer) return;
    if (!list || list.length === 0) {
      dom.quizSingleCardContainer.innerHTML = `<div class="empty-state">当前列表无题目</div>`;
      return;
    }

    if (state.activeQuestionIndex >= list.length) state.activeQuestionIndex = list.length - 1;
    if (state.activeQuestionIndex < 0) state.activeQuestionIndex = 0;

    const q = list[state.activeQuestionIndex];
    const isFirst = state.activeQuestionIndex === 0;
    const isLast = state.activeQuestionIndex === list.length - 1;

    let cardHtml = `
      <div style="margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
        <button class="btn-nav" onclick="window.APP.switchToSheetView()">
          ${SVG.chevronRight} 返回答题卡矩阵全览
        </button>
        <span style="font-weight:700; font-size:0.9rem; color:var(--text-muted);">
          第 ${state.activeQuestionIndex + 1} / ${list.length} 题
        </span>
      </div>
    `;

    cardHtml += renderSingleCardHtml(q);

    cardHtml += `
      <div class="single-card-nav-bar">
        <button class="btn-nav" ${isFirst ? 'disabled style="opacity:0.4;"' : ''} onclick="window.APP.navigateQuestionIndex(-1)">
          上一题
        </button>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-nav" onclick="window.APP.switchToSheetView()">
            答题卡全览
          </button>
          <button class="btn-slash ${store.slashed.includes(q.id) ? 'slashed' : ''}" onclick="window.APP.toggleSlash('${q.id}')">
            ${SVG.slash} ${store.slashed.includes(q.id) ? '已斩 (点击恢复)' : '斩此题 (已掌握)'}
          </button>
        </div>
        <button class="btn-nav" ${isLast ? 'disabled style="opacity:0.4;"' : ''} onclick="window.APP.navigateQuestionIndex(1)">
          下一题
        </button>
      </div>
    `;

    dom.quizSingleCardContainer.innerHTML = cardHtml;
  }

  // 连续流式列表模式渲染 (List View)
  function renderQuizListView(list) {
    if (!dom.quizQuestionsList) return;
    renderQuestionCards(dom.quizQuestionsList, list, true);
  }

  // 渲染题目通用 HTML 卡片
  function renderSingleCardHtml(q) {
    const isStarred = store.starred.includes(q.id);
    const isSlashed = store.slashed.includes(q.id);
    const ansInfo = store.answered[q.id];
    const isAnswered = !!ansInfo;
    const isRecite = state.quizMode === 'recite';
    const showExp = isAnswered || isRecite;
    const userNote = store.questionNotes[q.id] || {};

    let html = `
      <div class="question-card" id="qcard-${q.id}" data-qid="${q.id}">
        <div class="q-header">
          <div class="q-tags">
            <span class="q-tag type">${q.type === 'X' ? 'X型题 (多选题)' : (q.typeLabel || 'A型题')}</span>
            <span class="q-tag ch">${escapeHtml(q.chapter || '')}</span>
            ${q.subTopic ? `<span class="q-tag ch" style="background:rgba(37,99,235,0.08);color:var(--primary);">${escapeHtml(q.subTopic)}</span>` : ''}
            <span class="q-tag" style="color:var(--text-muted); font-weight:700;">#${q.num || ''}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <button class="btn-slash ${isSlashed ? 'slashed' : ''}" onclick="window.APP.toggleSlash('${q.id}')" title="斩题：标记为完全掌握">
              ${SVG.slash} ${isSlashed ? '已斩' : '斩'}
            </button>
            <button class="star-btn ${isStarred ? 'active' : ''}" onclick="window.APP.toggleStar('${q.id}')" title="${isStarred ? '取消收藏' : '收藏此题'}">
              ${SVG.star}
            </button>
            <button class="btn-nav" style="padding:0.35rem 0.65rem; font-size:0.78rem;" onclick="window.APP.openQNoteModal('${q.id}')">
              ${SVG.edit} ${userNote.note || userNote.customAns ? '编辑笔记' : '添加笔记'}
            </button>
          </div>
        </div>

        <div class="q-stem">${escapeHtml(q.stem || '')}</div>
        <div class="q-options" id="qopts-${q.id}">
          ${renderOptionsHtml(q, isAnswered, ansInfo, isRecite)}
        </div>
        ${q.type === 'X' && !isAnswered && state.quizMode !== 'recite' ? `
          <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
            <button class="btn-nav" style="background:var(--primary); color:#fff; border-color:var(--primary);" onclick="window.APP.submitX('${q.id}')">
              提交多选答案
            </button>
          </div>
        ` : ''}

        <div class="q-actions-bar">
          <div class="q-actions-left" style="display:flex; align-items:center; gap:0.5rem;">
            ${isAnswered ? `
              <button class="btn-nav" style="padding:0.25rem 0.65rem; font-size:0.78rem;" onclick="window.APP.resetQuestion('${q.id}')" title="清空本题记录以便盲测重做">
                重做本题
              </button>
            ` : ''}
            ${(userNote.note || userNote.customAns || userNote.img) ? `
              <span class="user-note-badge" style="display:inline-flex; align-items:center; gap:0.3rem; font-size:0.78rem; color:#d97706; background:#fef3c7; padding:0.25rem 0.6rem; border-radius:var(--radius-sm); font-weight:600;">
                已记录个人笔记
              </span>
            ` : ''}
          </div>
          <div class="q-actions-right">
            ${state.quizMode !== 'exam' || state.examSubmitted ? `
              <button class="btn-toggle-explain" id="btn-exp-${q.id}" onclick="window.APP.toggleExplanation('${q.id}')">
                ${showExp ? '收起答案与解析' : '查看答案与解析'}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="q-explanation ${showExp ? 'show' : ''}" id="qexp-${q.id}" style="display:${showExp ? 'block' : 'none'};">
          ${renderExplanationHtml(q)}
        </div>

        ${(userNote.note || userNote.customAns || userNote.img) ? `
          <div class="user-qnote-box">
            <div class="user-qnote-header">
              <span>【我的专属解析与答题心得】</span>
              <button class="btn-nav" style="padding:2px 8px; font-size:0.75rem;" onclick="window.APP.openQNoteModal('${q.id}')">编辑</button>
            </div>
            ${userNote.customAns ? `<div style="font-size:0.84rem; font-weight:700; color:#d97706; margin-bottom:0.3rem;">我的自拟/纠错答案：${escapeHtml(userNote.customAns)}</div>` : ''}
            ${userNote.note ? `<div class="user-qnote-text">${escapeHtml(userNote.note)}</div>` : ''}
            ${userNote.img ? `<img class="user-qnote-img" src="${userNote.img}" alt="题目附图" onclick="window.open('${userNote.img}')">` : ''}
          </div>
        ` : ''}
      </div>
    `;

    return html;
  }

  function renderOptionsHtml(q, isAnswered, ansInfo, isRecite) {
    const opts = q.options || {};
    const keys = Object.keys(opts).sort();
    const correctAns = (q.answer || '').toUpperCase();
    const userAns = ansInfo ? (ansInfo.userAnswer || '') : '';
    const isExam = state.quizMode === 'exam' && !state.examSubmitted;

    return keys.map(k => {
      const optText = opts[k] || '';
      let statusClass = '';

      if (isRecite) {
        // 背题模式直接高亮正确答案
        if (correctAns.includes(k)) statusClass = 'correct';
      } else if (isAnswered && !isExam) {
        const isOptCorrect = correctAns.includes(k);
        const isUserPicked = userAns.includes(k);
        if (isOptCorrect) statusClass = 'correct';
        else if (isUserPicked && !isOptCorrect) statusClass = 'wrong';
      } else if (isExam) {
        const selected = (state.examAnswers[q.id] || []).includes(k);
        if (selected) statusClass = 'selected';
      } else if (q.type === 'X') {
        const set = state.xSelections[q.id] || new Set();
        if (set.has(k)) statusClass = 'selected';
      }

      return `
        <div class="option-item ${statusClass}" onclick="window.APP.selectOption('${q.id}', '${k}', '${q.type}')">
          <div class="option-letter">${k}</div>
          <div class="option-text">${escapeHtml(optText)}</div>
        </div>
      `;
    }).join('');
  }

  function renderExplanationHtml(q) {
    let html = `
      <div class="ans-label">
        官方正解: <strong style="color:var(--success); font-size:1.15rem; margin-left:0.25rem;">${q.answer || '暂无'}</strong>
      </div>
      <div class="exp-text">${escapeHtml(q.explanation || '本题暂无详细解析')}</div>
    `;

    if (q.linkedKnowledge && q.linkedKnowledge.length > 0) {
      html += `
        <div class="linked-kb-box">
          <div style="font-weight:700; color:var(--text-muted); font-size:0.8rem; margin-bottom:0.35rem;">关联考点:</div>
          <div class="linked-chips">
            ${q.linkedKnowledge.map(k => `
              <span class="linked-chip" onclick="window.APP.openKnowledgeModal('${k.id}')">
                ${SVG.book} ${escapeHtml(k.title)}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    const userNote = store.questionNotes[q.id] || {};
    if (!userNote.note && !userNote.customAns && !userNote.img) {
      html += `
        <div style="margin-top:0.75rem; padding-top:0.65rem; border-top:1px dashed var(--border);">
          <button class="btn-nav" style="font-size:0.78rem; padding:0.3rem 0.65rem; border-color:rgba(37,99,235,0.4); color:var(--primary);" onclick="window.APP.openQNoteModal('${q.id}')">
            ${SVG.edit} 自主补充本题笔记、自拟解析与配图
          </button>
        </div>
      `;
    }

    return html;
  }

  // 选项点击响应 (根据当前模式 Practice / Speed / Exam / Recite)
  function handleSelectOption(qId, letter, qType) {
    const list = getQuestionsData();
    const q = list.find(item => item.id === qId);
    if (!q) return;

    if (state.quizMode === 'recite') return; // 背题模式点击不触发

    if (state.quizMode === 'exam' && !state.examSubmitted) {
      // 考试模式：只暂存答案，不显示对错
      if (!state.examAnswers[qId]) state.examAnswers[qId] = [];
      if (qType === 'X') {
        const idx = state.examAnswers[qId].indexOf(letter);
        if (idx > -1) state.examAnswers[qId].splice(idx, 1);
        else state.examAnswers[qId].push(letter);
      } else {
        state.examAnswers[qId] = [letter];
      }
      refreshCardUI(qId);
      return;
    }

    if (qType === 'X') {
      if (!state.xSelections[qId]) state.xSelections[qId] = new Set();
      if (state.xSelections[qId].has(letter)) {
        state.xSelections[qId].delete(letter);
      } else {
        state.xSelections[qId].add(letter);
      }
      refreshCardUI(qId);
      return;
    }

    // 单选题判定 (允许重选更正或盲测，保证做题体验灵动)
    const isCorrect = (letter.toUpperCase() === (q.answer || '').trim().toUpperCase());
    store.answered[qId] = {
      userAnswer: letter,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };

    if (!isCorrect) {
      if (!store.wrong.includes(qId)) store.wrong.push(qId);
    } else {
      store.wrong = store.wrong.filter(id => id !== qId);
    }

    saveStore();
    refreshCardUI(qId);

    // 快刷模式自动在 350ms 后切下一题
    if (state.quizMode === 'speed' && state.quizViewMode === 'card') {
      setTimeout(() => {
        window.APP.navigateQuestionIndex(1);
      }, 350);
    }
  }

  function handleResetQuestion(qId) {
    delete store.answered[qId];
    delete state.examAnswers[qId];
    delete state.xSelections[qId];
    store.wrong = store.wrong.filter(id => id !== qId);
    saveStore();
    refreshCardUI(qId);
  }

  function handleSubmitX(qId) {
    const list = getQuestionsData();
    const q = list.find(item => item.id === qId);
    if (!q) return;

    const selectedSet = state.xSelections[qId] || new Set();
    if (selectedSet.size === 0) {
      alert('请至少选择一个选项后再提交！');
      return;
    }

    const userAns = Array.from(selectedSet).sort().join('');
    const correctAns = (q.answer || '').trim().toUpperCase().split('').sort().join('');
    const isCorrect = (userAns === correctAns);

    store.answered[qId] = {
      userAnswer: userAns,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };

    if (!isCorrect) {
      if (!store.wrong.includes(qId)) store.wrong.push(qId);
    } else {
      store.wrong = store.wrong.filter(id => id !== qId);
    }

    delete state.xSelections[qId];
    saveStore();
    refreshCardUI(qId);
  }

  function handleSubmitExam() {
    const list = getFilteredQuestions();
    let score = 0;
    list.forEach(q => {
      const picked = (state.examAnswers[q.id] || []).sort().join('');
      const correctAns = (q.answer || '').trim().toUpperCase().split('').sort().join('');
      const isCorrect = (picked === correctAns);
      if (picked) {
        store.answered[q.id] = { userAnswer: picked, isCorrect, timestamp: Date.now() };
        if (isCorrect) score++;
        else if (!store.wrong.includes(q.id)) store.wrong.push(q.id);
      }
    });

    state.examSubmitted = true;
    saveStore();
    alert(`交卷成功！本次测试共答对 ${score} / ${list.length} 题，得分率 ${(score/list.length*100).toFixed(1)}%。答案与解析已全部展开！`);
    renderQuizView();
  }

  function refreshCardUI(qId) {
    if (state.quizViewMode === 'card') {
      const list = getFilteredQuestions();
      renderSingleQuestionCard(list);
    } else if (state.quizViewMode === 'sheet') {
      renderQuizView();
    } else {
      const card = document.getElementById(`qcard-${qId}`);
      if (!card) return;
      const list = getQuestionsData();
      const q = list.find(item => item.id === qId);
      if (!q) return;
      const ansInfo = store.answered[qId];
      const isAnswered = !!ansInfo;
      const isRecite = state.quizMode === 'recite';
      const showExp = isAnswered || isRecite;

      const optsEl = card.querySelector('.q-options');
      if (optsEl) optsEl.innerHTML = renderOptionsHtml(q, isAnswered, ansInfo, isRecite);

      const expEl = card.querySelector('.q-explanation');
      if (expEl) {
        expEl.innerHTML = renderExplanationHtml(q);
        if (showExp) {
          expEl.classList.add('show');
          expEl.style.display = 'block';
        }
      }
      const expBtn = card.querySelector('.btn-toggle-explain');
      if (expBtn && showExp) {
        expBtn.textContent = '收起答案与解析';
      }
    }
  }

  function toggleExplanation(qId) {
    const expBox = document.getElementById(`qexp-${qId}`);
    const expBtn = document.getElementById(`btn-exp-${qId}`);
    if (expBox) {
      const isVisible = (expBox.style.display === 'block') || expBox.classList.contains('show');
      if (isVisible) {
        expBox.style.display = 'none';
        expBox.classList.remove('show');
        if (expBtn) expBtn.textContent = '查看答案与解析';
      } else {
        expBox.style.display = 'block';
        expBox.classList.add('show');
        if (expBtn) expBtn.textContent = '收起答案与解析';
      }
    }
  }

  function handleToggleStar(qId) {
    if (store.starred.includes(qId)) {
      store.starred = store.starred.filter(id => id !== qId);
    } else {
      store.starred.push(qId);
    }
    saveStore();
    refreshCardUI(qId);
  }

  function handleToggleSlash(qId) {
    if (store.slashed.includes(qId)) {
      store.slashed = store.slashed.filter(id => id !== qId);
    } else {
      store.slashed.push(qId);
    }
    saveStore();
    refreshCardUI(qId);
  }

  // ================= 4. 自主编辑导图考点与配图模态框 (Mindmap Custom Editor) =================
  // 离线轻量图片压缩，防止 LocalStorage 超过浏览器配额
  function compressImage(file, maxDimension = 1200, quality = 0.82) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setupMindmapEditModal() {
    if (dom.btnApplyMmImgUrl && dom.mmImgUrlInput) {
      dom.btnApplyMmImgUrl.addEventListener('click', () => {
        const url = dom.mmImgUrlInput.value.trim();
        if (url) {
          tempMmImg = url;
          showMmImgPreview(url);
        }
      });
    }

    if (dom.mmImgFileInput) {
      dom.mmImgFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        tempMmImg = await compressImage(file);
        showMmImgPreview(tempMmImg);
      });
    }

    if (dom.btnRemoveMmImg) {
      dom.btnRemoveMmImg.addEventListener('click', () => {
        tempMmImg = "";
        hideMmImgPreview();
      });
    }

    if (dom.btnSaveMmNode) {
      dom.btnSaveMmNode.addEventListener('click', () => {
        if (!state.editingMmKbId) return;
        const notes = dom.mmEditCustomNotes.value.trim();
        store.mindmapCustom[state.editingMmKbId] = {
          notes: notes,
          img: tempMmImg,
          time: Date.now()
        };
        saveStore();
        closeMmNodeModal();
        renderMindMap();
        inspectMindMapNode(dom.mmEditNodeName.value, '', '', state.editingMmKbId);
      });
    }

    if (dom.btnResetMmNode) {
      dom.btnResetMmNode.addEventListener('click', () => {
        if (!state.editingMmKbId) return;
        delete store.mindmapCustom[state.editingMmKbId];
        saveStore();
        closeMmNodeModal();
        renderMindMap();
        inspectMindMapNode(dom.mmEditNodeName.value, '', '', state.editingMmKbId);
      });
    }
  }

  function openMmNodeEditModal(kbId, nodeName) {
    state.editingMmKbId = kbId;
    const custom = store.mindmapCustom[kbId] || {};
    tempMmImg = custom.img || "";

    if (dom.mmEditNodeName) dom.mmEditNodeName.value = nodeName || kbId;
    if (dom.mmEditCustomNotes) dom.mmEditCustomNotes.value = custom.notes || "";
    if (dom.mmImgUrlInput) dom.mmImgUrlInput.value = (tempMmImg.startsWith('http') ? tempMmImg : '');

    if (tempMmImg) showMmImgPreview(tempMmImg);
    else hideMmImgPreview();

    if (dom.mindmapNodeModal) dom.mindmapNodeModal.classList.add('active');
  }

  function closeMmNodeModal() {
    state.editingMmKbId = null;
    tempMmImg = "";
    if (dom.mindmapNodeModal) dom.mindmapNodeModal.classList.remove('active');
  }

  function showMmImgPreview(src) {
    if (dom.mmImgPreviewThumb) dom.mmImgPreviewThumb.src = src;
    if (dom.mmImgPreviewBox) dom.mmImgPreviewBox.style.display = 'block';
  }

  function hideMmImgPreview() {
    if (dom.mmImgPreviewThumb) dom.mmImgPreviewThumb.src = "";
    if (dom.mmImgPreviewBox) dom.mmImgPreviewBox.style.display = 'none';
  }

  // ================= 5. 自主编辑题目笔记与自拟解析模态框 (Question Note Editor) =================
  function setupQuestionNoteModal() {
    if (dom.qImgFileInput) {
      dom.qImgFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        tempQImg = await compressImage(file);
        showQImgPreview(tempQImg);
      });
    }

    if (dom.btnRemoveQImg) {
      dom.btnRemoveQImg.addEventListener('click', () => {
        tempQImg = "";
        hideQImgPreview();
      });
    }

    if (dom.btnSaveQNote) {
      dom.btnSaveQNote.addEventListener('click', () => {
        if (!state.editingQId) return;
        const note = dom.qNoteContentInput.value.trim();
        const customAns = dom.qNoteCustomAns.value.trim();
        store.questionNotes[state.editingQId] = {
          note,
          customAns,
          img: tempQImg,
          time: Date.now()
        };
        saveStore();
        closeQNoteModal();
        refreshCardUI(state.editingQId);
      });
    }

    if (dom.btnDeleteQNote) {
      dom.btnDeleteQNote.addEventListener('click', () => {
        if (!state.editingQId) return;
        delete store.questionNotes[state.editingQId];
        saveStore();
        closeQNoteModal();
        refreshCardUI(state.editingQId);
      });
    }
  }

  function openQNoteModal(qId) {
    state.editingQId = qId;
    const q = getQuestionsData().find(item => item.id === qId);
    if (!q) return;

    const userNote = store.questionNotes[qId] || {};
    tempQImg = userNote.img || "";

    if (dom.modalQNoteStem) {
      dom.modalQNoteStem.innerHTML = `<strong>#${q.num || ''}</strong> ${escapeHtml(q.stem || '')}`;
    }
    if (dom.qNoteContentInput) dom.qNoteContentInput.value = userNote.note || "";
    if (dom.qNoteCustomAns) dom.qNoteCustomAns.value = userNote.customAns || "";

    if (tempQImg) showQImgPreview(tempQImg);
    else hideQImgPreview();

    if (dom.questionNoteModal) dom.questionNoteModal.classList.add('active');
  }

  function closeQNoteModal() {
    state.editingQId = null;
    tempQImg = "";
    if (dom.questionNoteModal) dom.questionNoteModal.classList.remove('active');
  }

  function showQImgPreview(src) {
    if (dom.qImgPreviewThumb) dom.qImgPreviewThumb.src = src;
    if (dom.qImgPreviewBox) dom.qImgPreviewBox.style.display = 'block';
  }

  function hideQImgPreview() {
    if (dom.qImgPreviewThumb) dom.qImgPreviewThumb.src = "";
    if (dom.qImgPreviewBox) dom.qImgPreviewBox.style.display = 'none';
  }

  // ================= 6. 错题本与重点收藏夹 =================
  function renderErrorsList() {
    const list = getQuestionsData().filter(q => store.wrong.includes(q.id));
    const container = document.getElementById('errorsQuestionsList');
    if (container) renderQuestionCards(container, list, false);
  }

  function renderFavoritesList() {
    const list = getQuestionsData().filter(q => store.starred.includes(q.id));
    const container = document.getElementById('favoritesQuestionsList');
    if (container) renderQuestionCards(container, list, false);
  }

  function renderQuestionCards(container, list, isPaged) {
    if (!container) return;
    if (!list || list.length === 0) {
      container.innerHTML = `<div class="empty-state">当前分类下暂无试题</div>`;
      if (dom.quizPaginationBar) dom.quizPaginationBar.innerHTML = '';
      return;
    }

    let items = list;
    if (isPaged) {
      const totalPages = Math.ceil(list.length / state.pageSize);
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * state.pageSize;
      items = list.slice(start, start + state.pageSize);
      renderPagination(list.length);
    }

    container.innerHTML = items.map(q => renderSingleCardHtml(q)).join('');
  }

  function renderPagination(totalCount) {
    if (!dom.quizPaginationBar) return;
    const totalPages = Math.ceil(totalCount / state.pageSize);
    if (totalPages <= 1) {
      dom.quizPaginationBar.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${state.page <= 1 ? 'disabled' : ''} onclick="window.APP.changePage(${state.page - 1})">上一页</button>
      <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted); align-self:center;">
        第 ${state.page} / ${totalPages} 页
      </span>
      <button class="page-btn" ${state.page >= totalPages ? 'disabled' : ''} onclick="window.APP.changePage(${state.page + 1})">下一页</button>
    `;
    dom.quizPaginationBar.innerHTML = html;
  }

  // ================= 7. 临床病例研析 (Clinical Cases) =================
  function renderCasesList() {
    if (!dom.casesList) return;
    let list = getCasesData();

    if (state.chapter !== '全部') {
      list = list.filter(c => isChapterMatch(c.chapter, state.chapter));
    }
    if (state.caseFilter === '10th') {
      list = list.filter(c => c.is10thEdition);
    } else if (state.caseFilter === 'starred') {
      list = list.filter(c => store.starredCases.includes(c.id));
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(c => {
        const scenario = (c.scenario || c.summary || '').toLowerCase();
        const questionsStr = Array.isArray(c.questions) ? c.questions.join(' ').toLowerCase() : (c.question || '').toLowerCase();
        return (c.title && c.title.toLowerCase().includes(q)) ||
               scenario.includes(q) ||
               questionsStr.includes(q);
      });
    }

    if (dom.casesStatsBadge) dom.casesStatsBadge.textContent = `共 ${list.length} 个病例`;

    if (!list || list.length === 0) {
      dom.casesList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">未检索到相关临床病例</div>`;
      return;
    }

    dom.casesList.innerHTML = list.map((c, i) => {
      const isStarred = store.starredCases.includes(c.id);
      const scenarioText = c.scenario || c.summary || '';
      
      let questionsHtml = '';
      if (Array.isArray(c.questions)) {
        questionsHtml = c.questions.map(q => `<div style="margin-bottom:0.35rem; line-height:1.5;">${escapeHtml(q)}</div>`).join('');
      } else {
        questionsHtml = escapeHtml(c.question || '');
      }

      let answersHtml = '';
      if (Array.isArray(c.answers)) {
        answersHtml = c.answers.map(a => `<div style="margin-bottom:0.75rem; line-height:1.65;">${escapeHtml(a)}</div>`).join('');
      } else {
        answersHtml = escapeHtml(c.answer || '');
      }

      return `
        <div class="case-card" id="case-${c.id}">
          <div class="case-header">
            <div>
              <div class="case-number">${escapeHtml(c.chapter)} · ${c.caseNum || ('病例 #' + (i + 1))}</div>
              <h3 class="case-title">${escapeHtml(c.title)}</h3>
            </div>
            <button class="star-btn ${isStarred ? 'active' : ''}" onclick="window.APP.toggleStarCase('${c.id}')" title="收藏病例">
              ${SVG.star}
            </button>
          </div>
          <div class="case-body">
            ${c.diagnosis ? `
              <div style="margin-bottom:0.6rem; font-size:0.86rem;">
                <strong style="color:var(--primary);">【临床诊断】：</strong>
                <span style="font-weight:600;">${escapeHtml(c.diagnosis)}</span>
              </div>
            ` : ''}
            <div style="font-weight:700; color:var(--primary); font-size:0.85rem; margin-bottom:0.35rem;">【病史与临床体征】：</div>
            <div class="case-summary">${escapeHtml(scenarioText)}</div>
            <div class="case-question">
              <strong style="color:var(--text-main);">【解剖学思考题】：</strong><br>
              <div style="margin-top:0.35rem;">${questionsHtml}</div>
            </div>
            <button class="btn-toggle-answer" id="btn-toggle-case-${c.id}" onclick="window.APP.toggleCaseAnswer('${c.id}')">
              展开权威解剖学机制与思考题详解
            </button>
            <div class="case-answer-box" id="case-ans-${c.id}" style="display:none;">
              <div style="margin-bottom:0.5rem; font-weight:700; color:var(--success);">【权威解剖学思考题详解】：</div>
              ${answersHtml}
              ${c.clinicalPearl ? `
                <div style="margin-top:0.75rem; padding:0.6rem 0.85rem; background:rgba(16,185,129,0.08); border-left:3px solid #10b981; border-radius:4px; font-size:0.84rem; color:#065f46; line-height:1.55;">
                  <strong>【临床要点提炼】：</strong>${escapeHtml(c.clinicalPearl)}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function handleToggleCaseAnswer(cId) {
    const box = document.getElementById(`case-ans-${cId}`);
    const btn = document.getElementById(`btn-toggle-case-${cId}`);
    if (box) {
      const isHidden = box.style.display === 'none' || !box.classList.contains('show');
      if (isHidden) {
        box.style.display = 'block';
        box.classList.add('show');
        if (btn) btn.textContent = '收起权威解剖学机制与思考题详解';
      } else {
        box.style.display = 'none';
        box.classList.remove('show');
        if (btn) btn.textContent = '展开权威解剖学机制与思考题详解';
      }
    }
  }

  function handleToggleStarCase(cId) {
    if (store.starredCases.includes(cId)) {
      store.starredCases = store.starredCases.filter(id => id !== cId);
    } else {
      store.starredCases.push(cId);
    }
    saveStore();
    renderCasesList();
  }

  // ================= 8. 考点知识解析弹窗 =================
  function openKnowledgeModal(kbId) {
    const card = getKnowledgeData().find(k => k.id === kbId);
    if (!card) return;

    if (dom.modalTitle) dom.modalTitle.textContent = `${card.chapter} · ${card.title}`;
    
    const custom = store.mindmapCustom[kbId] || {};
    let customHtml = '';
    if (custom.notes) {
      customHtml += `<div class="mm-leaf-custom-notes" style="margin-top:1rem;"><strong>【我的个性化笔记】：</strong><br>${escapeHtml(custom.notes)}</div>`;
    }
    if (custom.img) {
      customHtml += `<img class="mm-leaf-img" src="${custom.img}" alt="解剖配图" style="max-height:280px;margin-top:0.75rem;" onclick="window.open('${custom.img}')">`;
    }

    if (dom.modalBody) {
      dom.modalBody.innerHTML = `
        <div style="font-weight:700; color:var(--primary); margin-bottom:0.75rem; font-size:1.02rem;">
          【考点引导】：
        </div>
        <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1.25rem; font-weight:600;">
          ${escapeHtml(card.front)}
        </div>
        <div style="font-weight:700; color:var(--text-main); margin-bottom:0.75rem; font-size:1.02rem;">
          【核心解剖毗邻与考点精析】：
        </div>
        <div style="line-height:1.7; font-size:0.95rem; white-space:pre-wrap; margin-bottom:1rem;">
          ${escapeHtml(card.back)}
        </div>
        ${card.mnemonic ? `
          <div style="background:rgba(16,185,129,0.08); border-left:3px solid var(--success); padding:0.75rem 1rem; border-radius:var(--radius-sm); color:#059669; font-weight:600;">
            <strong>【记忆口诀】</strong>：${escapeHtml(card.mnemonic)}
          </div>
        ` : ''}
        ${customHtml}
      `;
    }

    if (dom.modalGoAnkiBtn) {
      dom.modalGoAnkiBtn.onclick = () => {
        closeKnowledgeModal();
        window.APP.goToAnkiCard(kbId);
      };
    }

    if (dom.modalOverlay) dom.modalOverlay.classList.add('active');
  }

  function closeKnowledgeModal() {
    if (dom.modalOverlay) dom.modalOverlay.classList.remove('active');
  }

  // ================= 9. 数据中心与统计看板 =================
  function updateBadgesAndStats() {
    if (dom.badgeErrors) {
      const errCount = store.wrong.length;
      dom.badgeErrors.textContent = errCount;
      dom.badgeErrors.style.display = errCount > 0 ? 'inline-block' : 'none';
    }
    if (dom.badgeStarred) {
      const starCount = store.starred.length;
      dom.badgeStarred.textContent = starCount;
      dom.badgeStarred.style.display = starCount > 0 ? 'inline-block' : 'none';
    }
  }

  function renderStatsDashboard() {
    const questions = getQuestionsData();
    const knowledge = getKnowledgeData();
    const answeredCount = Object.keys(store.answered).length;
    const correctCount = Object.values(store.answered).filter(a => a.isCorrect).length;
    const wrongCount = store.wrong.length;
    const starredCount = store.starred.length;
    const slashedCount = store.slashed.length;
    const rate = answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(1) : '0.0';

    const statDoneCount = document.getElementById('statDoneCount');
    if (statDoneCount) statDoneCount.textContent = answeredCount;
    const statAccuracy = document.getElementById('statAccuracy');
    if (statAccuracy) statAccuracy.textContent = rate + '%';
    const statErrorCount = document.getElementById('statErrorCount');
    if (statErrorCount) statErrorCount.textContent = wrongCount;
    const statFavCount = document.getElementById('statFavCount');
    if (statFavCount) statFavCount.textContent = starredCount;
    const statMasteredCards = document.getElementById('statMasteredCards');
    if (statMasteredCards) statMasteredCards.textContent = `${slashedCount} 题已斩 / ${knowledge.length} 考点`;
  }

  // ================= Helpers =================
  function isChapterMatch(itemChapter, selectedChapter) {
    if (!itemChapter || selectedChapter === '全部') return true;
    if (itemChapter === selectedChapter) return true;
    if (selectedChapter.includes(itemChapter) || itemChapter.includes(selectedChapter)) return true;
    if ((selectedChapter.includes('脊柱') || selectedChapter.includes('背部')) && (itemChapter.includes('背') || itemChapter.includes('脊柱'))) return true;
    return false;
  }

  function handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (state.activeView === 'anki') {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleAnkiFlip();
      } else if (e.code === 'ArrowLeft') {
        navigateAnkiCard(-1);
      } else if (e.code === 'ArrowRight') {
        navigateAnkiCard(1);
      } else if (e.key === '1') {
        rateAnkiCard('again');
      } else if (e.key === '2') {
        rateAnkiCard('good');
      } else if (e.key === '3') {
        rateAnkiCard('easy');
      }
    } else if (state.activeView === 'quiz' && state.quizViewMode === 'card') {
      if (e.code === 'ArrowLeft') {
        window.APP.navigateQuestionIndex(-1);
      } else if (e.code === 'ArrowRight') {
        window.APP.navigateQuestionIndex(1);
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ================= Global Window API =================
  window.APP = {
    // Nav & Course
    switchCourse: switchActiveCourse,
    switchView: renderView,
    
    // Quiz Actions (医考帮架构)
    jumpToQuestionIndex: (idx) => {
      state.activeQuestionIndex = idx;
      state.quizViewMode = 'card';
      updateQuizViewButtons();
      renderQuizView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    switchToSheetView: () => {
      state.quizViewMode = 'sheet';
      updateQuizViewButtons();
      renderQuizView();
    },
    navigateQuestionIndex: (step) => {
      const list = getFilteredQuestions();
      state.activeQuestionIndex += step;
      if (state.activeQuestionIndex < 0) state.activeQuestionIndex = 0;
      if (state.activeQuestionIndex >= list.length) state.activeQuestionIndex = list.length - 1;
      renderSingleQuestionCard(list);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    selectOption: handleSelectOption,
    resetQuestion: handleResetQuestion,
    submitX: handleSubmitX,
    toggleStar: handleToggleStar,
    toggleSlash: handleToggleSlash,
    toggleExplanation: toggleExplanation,
    changePage: (p) => {
      state.page = p;
      renderQuizView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Question Note Modal
    openQNoteModal: openQNoteModal,
    closeQNoteModal: closeQNoteModal,

    // Mind Map Actions
    selectMmNode: (nodeId, name, desc, chapter, kbId) => {
      document.querySelectorAll('.mm-node').forEach(n => n.classList.remove('active'));
      const target = document.getElementById(nodeId);
      if (target) target.classList.add('active');
      inspectMindMapNode(name, desc, chapter, kbId);
      if (kbId) {
        toggleLeafKnowledge(null, kbId);
      }
    },
    toggleMmNode: toggleMindMapNode,
    toggleLeafKnowledge: toggleLeafKnowledge,
    openMmNodeEditModal: openMmNodeEditModal,
    closeMmNodeModal: closeMmNodeModal,

    // Case Actions
    toggleCaseAnswer: handleToggleCaseAnswer,
    toggleStarCase: handleToggleStarCase,
    setCaseFilter: (f) => {
      state.caseFilter = f;
      document.querySelectorAll('#caseFilterAll, #caseFilter10th, #caseFilterStarred').forEach(btn => btn.classList.remove('active'));
      if (f === 'all') document.getElementById('caseFilterAll').classList.add('active');
      if (f === '10th') document.getElementById('caseFilter10th').classList.add('active');
      if (f === 'starred') document.getElementById('caseFilterStarred').classList.add('active');
      renderCasesList();
    },

    // Cross-link Navigation
    openKnowledgeModal: openKnowledgeModal,
    goToAnkiCard: (kbId) => {
      const list = getKnowledgeData();
      const idx = list.findIndex(k => k.id === kbId);
      if (idx > -1) {
        state.chapter = '全部';
        renderChapterPills();
        state.ankiIndex = idx;
        renderView('anki');
      }
    },
    switchChapterAndQuiz: (ch) => {
      state.chapter = ch;
      renderChapterPills();
      state.quizViewMode = 'sheet';
      updateQuizViewButtons();
      renderView('quiz');
    }
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
