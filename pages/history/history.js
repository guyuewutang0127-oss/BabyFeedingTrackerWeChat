const { 
  getData, deleteFeedingRecord, getAssessmentRecords, 
  STORAGE_KEYS, formatDate, formatTime 
} = require('../../utils/storage');
const { getAgeInMonths } = require('../../utils/growthTracker');

Page({
  data: {
    activeTab: 'records',
    babyInfo: {},
    filterDate: '',
    allRecords: [],
    groupedRecords: [],
    totalRecords: 0,
    summary: { totalCount: 0, totalAmount: 0, avgAmount: 0 },
    pageSize: 20,
    currentPage: 1,
    hasMore: false,
    showDeleteModal: false,
    recordToDelete: null,
    touchStartX: 0,
    touchCurrentX: 0,
    swipingRecordId: null,
    assessmentRecords: [],
    keyAssessmentAges: [1, 3, 6, 8, 12, 18, 24, 30, 36],
    pendingAssessments: [],
    showAddModal: false
  },

  onLoad() {
    this.loadBabyInfo();
    this.loadRecords();
    this.loadAssessmentRecords();
  },

  onShow() {
    this.loadBabyInfo();
    this.loadRecords();
    this.loadAssessmentRecords();
  },

  // 加载宝宝信息
  loadBabyInfo() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO) || { name: '宝宝', birthDate: '', gender: 'boy' };
    this.setData({ babyInfo });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 加载评估档案
  loadAssessmentRecords() {
    const { babyInfo, keyAssessmentAges } = this.data;
    const records = getAssessmentRecords();
    const currentAge = babyInfo.birthDate ? getAgeInMonths(babyInfo.birthDate) : 0;
    
    const pendingAssessments = keyAssessmentAges
      .filter(age => age <= currentAge)
      .filter(age => !records.some(r => r.ageMonths === age))
      .map(age => ({ ageMonths: age, status: 'pending', label: `${age}月龄评估` }));
    
    this.setData({ assessmentRecords: records, pendingAssessments });
  },

  // 跳转到评估页面
  goToAssessment(e) {
    const ageMonths = e.currentTarget.dataset.age;
    wx.navigateTo({ url: `/pages/assessmentForm/assessmentForm?ageMonths=${ageMonths || ''}` });
  },

  // 查看评估详情
  viewAssessmentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/assessment/assessment?id=${id}` });
  },

  // 加载记录
  loadRecords() {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    const sortedRecords = [...records].reverse();
    this.setData({ allRecords: sortedRecords });
    this.processRecords();
  },

  // 处理记录数据
  processRecords() {
    let { allRecords, filterDate, currentPage, pageSize } = this.data;
    
    let filteredRecords = allRecords;
    if (filterDate) {
      filteredRecords = allRecords.filter(r => r.date === filterDate);
    }
    
    const totalCount = filteredRecords.length;
    const totalAmount = filteredRecords.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
    
    const start = 0;
    const end = currentPage * pageSize;
    const pagedRecords = filteredRecords.slice(start, end);
    const hasMore = end < filteredRecords.length;
    
    const grouped = this.groupRecordsByDate(pagedRecords);
    
    this.setData({
      groupedRecords: grouped,
      totalRecords: totalCount,
      summary: { totalCount, totalAmount, avgAmount },
      hasMore
    });
  },

  // 按日期分组
  groupRecordsByDate(records) {
    const groups = {};
    const typeNames = { breastfeeding: '母乳', mixed: '混合', formula: '奶粉' };
    
    records.forEach(record => {
      const date = record.date;
      if (!groups[date]) {
        groups[date] = { date, displayDate: this.formatDisplayDate(date), records: [] };
      }
      const feedingTypeName = record.isSupplement ? '补喝' : (typeNames[record.feedingType] || '奶粉');
      groups[date].records.push({
        ...record,
        displayTime: formatTime(new Date(record.startTime)),
        feedingTypeName,
        translateX: 0,
        showDelete: false
      });
    });
    
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // 格式化显示日期
  formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === formatDate(today)) return '今天';
    if (dateStr === formatDate(yesterday)) return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ filterDate: e.detail.value, currentPage: 1 });
    this.processRecords();
  },

  // 清除筛选
  clearFilter() {
    this.setData({ filterDate: '', currentPage: 1 });
    this.processRecords();
  },

  // 加载更多
  loadMore() {
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.processRecords();
  },

  // ==================== 滑动删除 ====================
  
  touchStart(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ 
      touchStartX: e.touches[0].clientX,
      swipingRecordId: id 
    });
    this.resetAllDeleteButtons(id);
  },

  touchMove(e) {
    const id = e.currentTarget.dataset.id;
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - this.data.touchStartX;
    
    // 只允许左滑（删除）
    if (diff < 0) {
      const translateX = Math.max(diff, -160);
      this.updateRecordTranslateX(id, translateX);
    }
  },

  touchEnd(e) {
    const id = e.currentTarget.dataset.id;
    const { groupedRecords } = this.data;
    
    let currentRecord = null;
    groupedRecords.forEach(group => {
      const record = group.records.find(r => r.id === id);
      if (record) currentRecord = record;
    });
    
    if (currentRecord) {
      // 滑动超过阈值显示删除按钮
      if (currentRecord.translateX < -80) {
        this.showDeleteButton(id);
      } else {
        this.hideDeleteButton(id);
      }
    }
    
    this.setData({ swipingRecordId: null });
  },

  updateRecordTranslateX(id, translateX) {
    const { groupedRecords } = this.data;
    
    groupedRecords.forEach(group => {
      group.records.forEach(record => {
        if (record.id === id) {
          record.translateX = translateX;
        }
      });
    });
    
    this.setData({ groupedRecords });
  },

  showDeleteButton(id) {
    const { groupedRecords } = this.data;
    
    groupedRecords.forEach(group => {
      group.records.forEach(record => {
        if (record.id === id) {
          record.translateX = -120;
          record.showDelete = true;
        }
      });
    });
    
    this.setData({ groupedRecords });
  },

  hideDeleteButton(id) {
    const { groupedRecords } = this.data;
    
    groupedRecords.forEach(group => {
      group.records.forEach(record => {
        if (record.id === id) {
          record.translateX = 0;
          record.showDelete = false;
        }
      });
    });
    
    this.setData({ groupedRecords });
  },

  resetAllDeleteButtons(exceptId) {
    const { groupedRecords } = this.data;
    
    groupedRecords.forEach(group => {
      group.records.forEach(record => {
        if (record.id !== exceptId) {
          record.translateX = 0;
          record.showDelete = false;
        }
      });
    });
    
    this.setData({ groupedRecords });
  },

  // 删除记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    this.resetAllDeleteButtons();
    this.setData({ showDeleteModal: true, recordToDelete: id });
  },

  cancelDelete() {
    this.setData({ showDeleteModal: false, recordToDelete: null });
  },

  confirmDelete() {
    const { recordToDelete } = this.data;
    
    if (recordToDelete) {
      const success = deleteFeedingRecord(recordToDelete);
      
      if (success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadRecords();
      } else {
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    }
    
    this.setData({ showDeleteModal: false, recordToDelete: null });
  },

  // ==================== 手动添加记录 ====================
  
  showAddRecord() {
    wx.navigateTo({ url: '/pages/addRecord/addRecord' });
  }
});
