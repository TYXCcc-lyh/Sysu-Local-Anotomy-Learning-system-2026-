// 学科/课程管理注册中心 (Multi-Course Registry)
const CourseManager = {
  currentCourseId: "anatomy",

  courses: {
    anatomy: {
      id: "anatomy",
      name: "局部解剖学",
      shortName: "局解",
      badge: "ANATOMY",
      desc: "高等医学院校教学大纲 · 人卫十版教材 · 考点闪卡 · 全景导图 · 题库测评 · 临床病例",
      getKnowledge: () => (window.ANATOMY_KNOWLEDGE || (typeof KnowledgeData !== 'undefined' ? KnowledgeData : [])),
      getMindmap: () => (window.ANATOMY_MINDMAP || (typeof MindMapData !== 'undefined' ? MindMapData : {})),
      getQuestions: () => (window.ANATOMY_QUESTIONS || (typeof QuestionsData !== 'undefined' ? QuestionsData : [])),
      getCases: () => (window.ANATOMY_CASES || (typeof CasesData !== 'undefined' ? CasesData : []))
    },
    biochem: {
      id: "biochem",
      name: "生物化学与分子生物学",
      shortName: "生化",
      badge: "BIOCHEM",
      desc: "物质代谢通路 · 生物氧化 · 遗传信息传递 · 经典考点与临床生化病例",
      getKnowledge: () => (typeof BiochemCourseData !== 'undefined' ? BiochemCourseData.knowledge : []),
      getMindmap: () => (typeof BiochemCourseData !== 'undefined' ? BiochemCourseData.mindmap : {}),
      getQuestions: () => (typeof BiochemCourseData !== 'undefined' ? BiochemCourseData.questions : []),
      getCases: () => (typeof BiochemCourseData !== 'undefined' ? BiochemCourseData.cases : [])
    }
  },

  getCurrentCourse() {
    return this.courses[this.currentCourseId] || this.courses.anatomy;
  },

  switchCourse(courseId) {
    if (this.courses[courseId]) {
      this.currentCourseId = courseId;
      localStorage.setItem("anatomy_active_course", courseId);
      return true;
    }
    return false;
  },

  registerCourse(courseData) {
    if (!courseData || !courseData.id) return false;
    this.courses[courseData.id] = {
      id: courseData.id,
      name: courseData.name || "自定义学科",
      shortName: courseData.shortName || "学科",
      badge: courseData.badge || "CUSTOM",
      desc: courseData.desc || "用户自定义导入医学课程包",
      getKnowledge: () => courseData.knowledge || [],
      getMindmap: () => courseData.mindmap || {},
      getQuestions: () => courseData.questions || [],
      getCases: () => courseData.cases || []
    };
    try {
      localStorage.setItem("user_custom_courses", JSON.stringify(Object.values(this.courses).filter(c => c.id !== 'anatomy' && c.id !== 'biochem')));
    } catch(e) {}
    return true;
  },

  init() {
    const saved = localStorage.getItem("anatomy_active_course");
    if (saved && this.courses[saved]) {
      this.currentCourseId = saved;
    }
    // Load custom courses from localStorage
    try {
      const customs = JSON.parse(localStorage.getItem("user_custom_courses") || "[]");
      customs.forEach(c => this.registerCourse(c));
    } catch(e) {}
  }
};

CourseManager.init();

if (typeof window !== 'undefined') {
  window.CourseManager = CourseManager;
}

if (typeof module !== 'undefined') module.exports = CourseManager;
