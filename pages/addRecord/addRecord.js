const { addFeedingRecord, STORAGE_KEYS, getData } = require('../../utils/storage');

Page({
  data: {
    feedingDate: '',
    feedingTime: '',
    feedingType: 'formula',
    feedingTypeIndex: 2,
    preparedAmount: '',
    actualAmount: '',
    duration: '',
    note: '',
    feedingTypeOptions: [
      { value: 'breastfeeding', label: '母乳' },
      { value: 'mixed', label: '混合' },
      { value: 'formula', label: '奶粉' },
      { value: 'supplement', label: '补喝' }
    ],
    errors: {}
  },

  onLoad() {
    // 初始化默认时间为当前时间
    const now = new Date();
    this.setData({
      feedingDate: this.formatDate(now),
      feedingTime: this.formatTime(now)
    });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ feedingDate: e.detail.value });
    this.clearError('feedingDate');
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({ feedingTime: e.detail.value });
    this.clearError('feedingTime');
  },

  onTypeChange(e) {
    const index = parseInt(e.detail.value, 10);
    const type = this.data.feedingTypeOptions[index] ? this.data.feedingTypeOptions[index].value : 'formula';
    this.setData({ feedingType: type, feedingTypeIndex: index });
  },

  // 冲泡量输入
  onPreparedAmountInput(e) {
    this.setData({ preparedAmount: e.detail.value });
  },

  // 实际奶量输入
  onActualAmountInput(e) {
    this.setData({ actualAmount: e.detail.value });
    this.clearError('actualAmount');
  },

  // 时长输入
  onDurationInput(e) {
    this.setData({ duration: e.detail.value });
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 清除错误
  clearError(field) {
    const errors = this.data.errors;
    delete errors[field];
    this.setData({ errors });
  },

  validateForm() {
    const errors = {};
    const { feedingDate, feedingTime, actualAmount, feedingType } = this.data;
    if (!feedingDate) errors.feedingDate = '请选择日期';
    if (!feedingTime) errors.feedingTime = '请选择时间';
    const isSupplement = feedingType === 'supplement';
    if (feedingType !== 'breastfeeding' && !isSupplement && (!actualAmount || parseInt(actualAmount, 10) <= 0)) {
      errors.actualAmount = '请输入实际奶量';
    }
    if (isSupplement && (!actualAmount || parseInt(actualAmount, 10) <= 0)) {
      errors.actualAmount = '请输入奶量';
    }
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 保存记录
  saveRecord() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }
    
    const { 
      feedingDate, feedingTime, feedingType, 
      preparedAmount, actualAmount, duration, note 
    } = this.data;
    
    // 构建开始时间
    const startTime = new Date(`${feedingDate}T${feedingTime}:00`);
    
    const isSupplement = feedingType === 'supplement';
    const record = {
      startTime: startTime.toISOString(),
      feedingType: isSupplement ? 'formula' : feedingType,
      preparedAmount: isSupplement ? 0 : (parseInt(preparedAmount, 10) || 0),
      actualAmount: feedingType === 'breastfeeding' ? 0 : (parseInt(actualAmount, 10) || 0),
      duration: isSupplement ? 0 : (parseInt(duration, 10) || 0),
      note: note.trim(),
      isSupplement: !!isSupplement
    };
    const success = addFeedingRecord(record);
    
    if (success) {
      wx.showToast({ title: '添加成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  // 取消
  cancel() {
    wx.navigateBack();
  }
});
