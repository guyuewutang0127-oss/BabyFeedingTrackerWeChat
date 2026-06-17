const { getAssessmentRecords, STORAGE_KEYS, getData } = require('../../utils/storage');

Page({
  data: {
    assessmentRecord: null,
    hasRecord: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadAssessmentDetail(options.id);
    } else {
      // 显示最新评估
      this.loadLatestAssessment();
    }
  },

  // 加载评估详情
  loadAssessmentDetail(id) {
    const records = getAssessmentRecords();
    const record = records.find(r => r.id === id);
    
    if (record) {
      this.setData({
        assessmentRecord: record,
        hasRecord: true
      });
    }
  },

  // 加载最新评估
  loadLatestAssessment() {
    const records = getAssessmentRecords();
    
    if (records.length > 0) {
      const latest = records[records.length - 1];
      this.setData({
        assessmentRecord: latest,
        hasRecord: true
      });
    }
  },

  // 跳转到评估表单
  goToAssessmentForm() {
    wx.navigateTo({ url: '/pages/assessmentForm/assessmentForm' });
  }
});
