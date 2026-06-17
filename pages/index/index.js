const { 
  getData, saveData, addFeedingRecord, addFeedingRecords, getTodayRecords, 
  getAssessmentRecords, STORAGE_KEYS, formatTime 
} = require('../../utils/storage');
const { getFeedingStatus, getSuggestedNextFeedTime } = require('../../utils/reminder');
const { parseFeedingText, parseFeedingTextWithModel, getParseExamples } = require('../../utils/parser');
const { 
  getFeedingPlan, getLatestGrowthStatus, getRecommendedInterval, getFoodStatus, 
  assessTodayFeeding, getNextFeedReminder 
} = require('../../utils/feedingPlan');
const { getNextAssessmentDate } = require('../../utils/growthTracker');

Page({
  data: {
    // 宝宝信息
    babyInfo: {},
    babyAge: '',
    
    // 设置
    settings: {},
    
    // 喂养状态
    feedingStatus: {},
    nextFeedTime: null,
    
    // 上次喂养信息
    lastFeedingInfo: { hasRecord: false, time: '', timeAgo: '', amount: 0 },
    nextFeedingCountdown: { label: '', value: '', color: '#52C41A', progress: 0 },
    
    // 今日统计
    todayDate: '',
    todayStats: { count: 0, totalAmount: 0, avgAmount: 0 },
    
    // 科学喂养计划
    feedingPlan: null,
    showFeedingPlan: false,
    
    // 辅食添加提示
    foodStatus: null,
    showFoodGuide: false,
    
    // 生长发育评估提醒
    assessmentReminder: null,
    
    // 今日喂养评估
    todayAssessment: null,
    
    // 提醒设置
    intervalRange: [['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']],
    intervalValue: [3, 0],
    reminderIntervalDisplay: '3小时0分钟',
    scheduleTemplates: [],
    scheduleTemplateIndex: 0,
    
    // 录入方式
    inputMode: 'timer',
    
    // 计时器相关
    isTiming: false,
    startTime: null,
    duration: 0,
    formattedDuration: '00:00',
    timerInterval: null,
    
    // 计时器时间编辑
    showTimeEdit: false,
    editStartTime: '',
    editEndTime: '',
    
    // 喂养类型选择
    feedingType: 'formula',
    feedingTypeIndex: 2,
    feedingTypeOptions: [
      { value: 'breastfeeding', label: '母乳' },
      { value: 'mixed', label: '混合' },
      { value: 'formula', label: '奶粉' }
    ],
    
    // 输入数据
    preparedAmount: '',
    actualAmount: '',
    
    // 文字解析相关
    parseText: '',
    parsePlaceholder: '例如：下午3点开始喂，泡了120ml，喝了100ml，用了20分钟；或：刚刚喂了100、泡了120',
    parseResult: null,
    parseExamples: [],
    showExamplesModal: false,

    // 今日记录
    todayRecords: [],
    lastRecord: null,

    // 计时录入确认（结束喂养后先确认再保存）
    showTimerConfirm: false,
    timerConfirmRecord: null,

    // 倒计时刷新定时器
    countdownInterval: null
  },

  onLoad() {
    this._pageActive = true;
    this.initPage();
  },

  onShow() {
    this.refreshData();
    this.startCountdownRefresh();
  },

  onHide() {
    if (this.data.isTiming) {
      this.saveTimerState();
    }
    this.stopCountdownRefresh();
  },

  onUnload() {
    this._pageActive = false;
    this.clearTimer();
    this.stopCountdownRefresh();
  },

  // 初始化页面
  initPage() {
    try {
      const today = new Date();
      this.setData({
        todayDate: `${today.getMonth() + 1}月${today.getDate()}日`,
        parseExamples: getParseExamples()
      });

      this.loadSettings();
      this.loadBabyInfo();
      this.loadTodayRecords();
      this.loadLastRecord();
      this.updateFeedingStatus();
      this.updateLastFeedingInfo();
      this.loadFeedingPlan();
      this.loadFoodStatus();
      this.loadAssessmentReminder();
      this.checkUnfinishedTimer();
    } catch (e) {
      console.error('index initPage error:', e);
      // 至少保证有默认展示数据，避免白屏
      this.setData({
        todayDate: `${new Date().getMonth() + 1}月${new Date().getDate()}日`,
        feedingStatus: { statusText: '正常', color: '#52C41A' },
        babyInfo: this.data.babyInfo && Object.keys(this.data.babyInfo).length ? this.data.babyInfo : { name: '宝宝', birthDate: '', avatar: '' },
        parseExamples: []
      });
    }
  },

  // 刷新数据
  refreshData() {
    this.loadSettings();
    this.loadBabyInfo();
    this.loadTodayRecords();
    this.updateFeedingStatus();
    this.updateLastFeedingInfo();
    this.loadFeedingPlan();
    this.loadFoodStatus();
    this.loadAssessmentReminder();
  },

  // 加载设置
  loadSettings() {
    const settings = getData(STORAGE_KEYS.SETTINGS) || {
      reminderEnabled: true,
      reminderInterval: 180,
      feedingType: 'breastfeeding',
      scientificPlanEnabled: true,
      scheduleTemplate: 'newborn'
    };
    
    const hours = Math.floor(settings.reminderInterval / 60);
    const minutes = settings.reminderInterval % 60;
    
    this.setData({
      settings,
      reminderIntervalDisplay: `${hours}小时${minutes}分钟`,
      intervalValue: [Math.min(hours, 12), Math.floor(minutes / 5)]
    });
  },

  // 加载科学喂养计划（按性别与成长状态细化建议）
  loadFeedingPlan() {
    const { babyInfo, settings, todayRecords } = this.data;
    if (!babyInfo.birthDate || !settings.scientificPlanEnabled) {
      this.setData({ feedingPlan: null, showFeedingPlan: false });
      return;
    }

    const feedingType = settings.feedingType || 'breastfeeding';
    const assessmentRecords = getAssessmentRecords() || [];
    const growthStatus = getLatestGrowthStatus(assessmentRecords);
    const plan = getFeedingPlan(babyInfo.birthDate, feedingType, {
      gender: babyInfo.gender,
      growthStatus
    });
    const todayAssessment = assessTodayFeeding(babyInfo.birthDate, feedingType, todayRecords);

    this.setData({
      feedingPlan: plan,
      showFeedingPlan: true,
      todayAssessment
    });
  },

  // 加载辅食添加状态
  loadFoodStatus() {
    const { babyInfo, settings } = this.data;
    if (!babyInfo.birthDate || !settings.scientificPlanEnabled) {
      this.setData({ foodStatus: null, showFoodGuide: false });
      return;
    }
    
    const status = getFoodStatus(babyInfo.birthDate);
    this.setData({
      foodStatus: status,
      showFoodGuide: status.canAddFood || status.daysToStart <= 30
    });
  },

  // 加载评估提醒
  loadAssessmentReminder() {
    const { babyInfo } = this.data;
    if (!babyInfo.birthDate) {
      this.setData({ assessmentReminder: null });
      return;
    }
    
    const nextAssessment = getNextAssessmentDate(babyInfo.birthDate);
    this.setData({ assessmentReminder: nextAssessment });
  },

  // 切换喂养计划显示
  toggleFeedingPlan() {
    this.setData({ showFeedingPlan: !this.data.showFeedingPlan });
  },

  // 切换辅食指南显示
  toggleFoodGuide() {
    this.setData({ showFoodGuide: !this.data.showFoodGuide });
  },

  // 跳转到评估页面
  goToAssessment() {
    wx.navigateTo({ url: '/pages/assessmentForm/assessmentForm' });
  },

  // 加载宝宝信息
  loadBabyInfo() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO) || { name: '宝宝', birthDate: '', avatar: '' };
    const babyAge = this.calculateBabyAge(babyInfo.birthDate);
    
    this.setData({ babyInfo, babyAge });
  },

  // 计算宝宝年龄
  calculateBabyAge(birthDate) {
    if (!birthDate) return '';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = now - birth;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays}天`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return days > 0 ? `${months}个月${days}天` : `${months}个月`;
    }
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
  },

  // 加载今日记录
  loadTodayRecords() {
    const records = getTodayRecords();
    const formattedRecords = records.map(record => ({
      ...record,
      displayTime: formatTime(new Date(record.startTime))
    }));
    
    const totalAmount = records.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
    const avgAmount = records.length > 0 ? Math.round(totalAmount / records.length) : 0;
    
    this.setData({
      todayRecords: formattedRecords,
      todayStats: { count: records.length, totalAmount, avgAmount }
    });
  },

  // 加载上次记录
  loadLastRecord() {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    if (records.length > 0) {
      this.setData({ lastRecord: records[records.length - 1] });
    }
  },

  // 更新上次喂养信息和倒计时
  updateLastFeedingInfo() {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    const settings = getData(STORAGE_KEYS.SETTINGS) || { reminderInterval: 180 };
    
    if (records.length === 0) {
      this.setData({ lastFeedingInfo: { hasRecord: false, time: '', timeAgo: '', amount: 0 } });
      return;
    }
    
    const lastRecord = records[records.length - 1];
    const lastTime = new Date(lastRecord.startTime);
    const now = new Date();
    const intervalMs = settings.reminderInterval * 60 * 1000;
    const nextFeedTime = new Date(lastTime.getTime() + intervalMs);
    
    const elapsedMs = now - lastTime;
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    
    let timeAgo = '';
    if (elapsedMinutes < 60) {
      timeAgo = `${elapsedMinutes}分钟前`;
    } else {
      const hours = Math.floor(elapsedMinutes / 60);
      const mins = elapsedMinutes % 60;
      timeAgo = mins > 0 ? `${hours}小时${mins}分钟前` : `${hours}小时前`;
    }
    
    this.setData({
      lastFeedingInfo: {
        hasRecord: true,
        time: formatTime(lastTime),
        timeAgo,
        amount: lastRecord.actualAmount || 0
      }
    });
    
    this.updateCountdown(nextFeedTime, now, intervalMs);
  },

  // 更新倒计时显示
  updateCountdown(nextFeedTime, now, totalIntervalMs) {
    const diffMs = nextFeedTime - now;
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    
    let label, value, color, progress;
    
    if (diffMs <= 0) {
      const overdueMinutes = Math.abs(diffMinutes);
      const overdueHours = Math.floor(overdueMinutes / 60);
      const overdueMins = overdueMinutes % 60;
      
      label = '已超时';
      value = overdueHours > 0 ? `${overdueHours}小时${overdueMins}分` : `${overdueMins}分钟`;
      color = '#FF4D4F';
      progress = 100;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      
      label = '距离下次喂养';
      value = hours > 0 ? `${hours}小时${mins}分` : `${mins}分钟`;
      color = diffMinutes <= 30 ? '#FAAD14' : '#52C41A';
      progress = Math.min(100, Math.max(0, (1 - diffMs / totalIntervalMs) * 100));
    }
    
    this.setData({ nextFeedingCountdown: { label, value, color, progress } });
  },

  // 启动倒计时刷新
  startCountdownRefresh() {
    this.stopCountdownRefresh();
    this.updateLastFeedingInfo();
    
    const interval = setInterval(() => {
      if (!this._pageActive) return;
      this.updateLastFeedingInfo();
    }, 60000);
    
    this.setData({ countdownInterval: interval });
  },

  // 停止倒计时刷新
  stopCountdownRefresh() {
    if (this.data.countdownInterval) {
      clearInterval(this.data.countdownInterval);
      this.setData({ countdownInterval: null });
    }
  },

  // 更新喂养状态
  updateFeedingStatus() {
    const status = getFeedingStatus();
    const nextFeedTime = getSuggestedNextFeedTime();
    
    this.setData({ feedingStatus: status, nextFeedTime });
  },

  // ==================== 录入方式切换 ====================
  
  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ inputMode: mode });
  },

  // ==================== 文字解析相关 ====================

  onParseTextInput(e) {
    this.setData({ parseText: e.detail.value });
  },

  clearParseText() {
    this.setData({ parseText: '', parseResult: null });
  },

  async parseText() {
    const { parseText } = this.data;
    if (!parseText.trim()) {
      wx.showToast({ title: '请输入文本内容', icon: 'none' });
      return;
    }
    const settings = getData(STORAGE_KEYS.SETTINGS) || {};
    const apiBase = (settings.parseApiBase || '').trim();
    if (apiBase) wx.showLoading({ title: '智能解析中…', mask: true });
    try {
      const result = await parseFeedingTextWithModel(parseText, apiBase);
      const records = (result.records && result.records.length) ? result.records : (result.data ? [result.data] : []);
      const withDisplay = records.map(r => {
        const start = r.startTime && r.startTime.toISOString ? r.startTime.toISOString() : (typeof r.startTime === 'string' ? r.startTime : '');
        const t = r.feedingType || 'formula';
        return {
          ...r,
          startTime: start,
          displayStartTime: r.startTime ? formatTime(r.startTime) : '',
          feedingTypeIndex: t === 'breastfeeding' ? 0 : (t === 'mixed' ? 1 : 2)
        };
      });
      this.setData({
        parseResult: {
          ...result,
          success: result.success && withDisplay.length > 0,
          data: result.data,
          records: withDisplay
        }
      });
      if (!result.success) wx.showToast({ title: '未能识别有效信息', icon: 'none' });
    } finally {
      if (apiBase) wx.hideLoading();
    }
  },

  saveParsedRecord() {
    const { parseResult } = this.data;
    if (!parseResult || !parseResult.success) return;
    const list = parseResult.records && parseResult.records.length ? parseResult.records : (parseResult.data ? [parseResult.data] : []);
    if (list.length === 0) return;
    const toSave = [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const startTime = r.startTime ? (typeof r.startTime === 'string' ? r.startTime : (r.startTime.toISOString ? r.startTime.toISOString() : '')) : '';
      if (!startTime) {
        wx.showToast({ title: `第${i + 1}条缺少时间`, icon: 'none' });
        return;
      }
      const isSupplement = !!r.isSupplement;
      if (!isSupplement && r.feedingType !== 'breastfeeding' && (r.actualAmount == null || parseInt(r.actualAmount, 10) <= 0)) {
        wx.showToast({ title: `第${i + 1}条请填写喝奶量`, icon: 'none' });
        return;
      }
      toSave.push({
        startTime: startTime,
        duration: parseInt(r.duration, 10) || 0,
        preparedAmount: isSupplement ? 0 : (parseInt(r.preparedAmount, 10) || 0),
        actualAmount: parseInt(r.actualAmount, 10) || 0,
        feedingType: r.feedingType || 'formula',
        isSupplement
      });
    }
    const success = addFeedingRecords(toSave);
    this.setData({ parseText: '', parseResult: null });
    if (success) {
      this.loadTodayRecords();
      this.loadLastRecord();
      this.updateFeedingStatus();
      this.updateLastFeedingInfo();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  updateParseRecord(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const records = (this.data.parseResult && this.data.parseResult.records) ? [...this.data.parseResult.records] : [];
    const r = records[index];
    if (!r) return;
    if (field === 'startTime') {
      const d = r.startTime ? new Date(r.startTime) : new Date();
      const parts = value.split(':');
      if (parts.length >= 2) {
        d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        r.startTime = d.toISOString();
        r.displayStartTime = value;
      }
    } else if (field === 'duration' || field === 'preparedAmount' || field === 'actualAmount') {
      const n = parseInt(value, 10) || 0;
      r[field] = n;
    } else if (field === 'feedingType') {
      const idx = parseInt(value, 10);
      r.feedingType = this.data.feedingTypeOptions[idx] ? this.data.feedingTypeOptions[idx].value : 'formula';
      r.feedingTypeIndex = idx;
    }
    this.setData({ 'parseResult.records': records });
  },

  showExamples() {
    this.setData({ showExamplesModal: true });
  },

  closeExamples() {
    this.setData({ showExamplesModal: false });
  },

  // ==================== 计时器相关（增强版） ====================

  checkUnfinishedTimer() {
    const timerState = wx.getStorageSync('timerState');
    if (timerState && timerState.isTiming) {
      wx.showModal({
        title: '恢复计时',
        content: '检测到上次有未完成的喂养记录，是否继续？',
        success: (res) => {
          if (res.confirm) {
            this.restoreTimerState(timerState);
          } else {
            wx.removeStorageSync('timerState');
          }
        }
      });
    }
  },

  restoreTimerState(timerState) {
    const now = Date.now();
    const elapsed = Math.floor((now - timerState.startTime) / 1000);
    
    this.setData({
      isTiming: true,
      startTime: timerState.startTime,
      duration: elapsed,
      formattedDuration: this.formatTimeDisplay(elapsed),
      preparedAmount: timerState.preparedAmount || '',
      actualAmount: timerState.actualAmount || '',
      feedingType: timerState.feedingType || 'formula'
    });
    
    this.startTimer();
  },

  saveTimerState() {
    const { isTiming, startTime, preparedAmount, actualAmount, feedingType } = this.data;
    if (isTiming) {
      wx.setStorageSync('timerState', {
        isTiming, startTime, preparedAmount, actualAmount, feedingType
      });
    }
  },

  startFeeding() {
    const now = Date.now();
    this.setData({
      isTiming: true,
      startTime: now,
      duration: 0,
      formattedDuration: '00:00',
      preparedAmount: '',
      actualAmount: '',
      feedingType: 'formula'
    });
    
    this.startTimer();
    wx.showToast({ title: '开始计时', icon: 'success' });
  },

  startTimer() {
    this.clearTimer();
    
    const interval = setInterval(() => {
      if (!this._pageActive) return;
      const duration = Math.floor((Date.now() - this.data.startTime) / 1000);
      this.setData({
        duration,
        formattedDuration: this.formatTimeDisplay(duration)
      });
    }, 1000);
    
    this.setData({ timerInterval: interval });
  },

  clearTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.setData({ timerInterval: null });
    }
  },

  formatTimeDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  // 显示时间编辑弹窗
  showTimeEditModal() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    this.setData({
      showTimeEdit: true,
      editStartTime: currentTime,
      editEndTime: currentTime
    });
  },

  // 隐藏时间编辑弹窗
  hideTimeEditModal() {
    this.setData({ showTimeEdit: false });
  },

  // 开始时间选择
  onEditStartTimeChange(e) {
    this.setData({ editStartTime: e.detail.value });
  },

  // 结束时间选择
  onEditEndTimeChange(e) {
    this.setData({ editEndTime: e.detail.value });
  },

  // 保存时间编辑
  saveTimeEdit() {
    const { editStartTime, editEndTime } = this.data;
    
    const [startHours, startMinutes] = editStartTime.split(':').map(Number);
    const [endHours, endMinutes] = editEndTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // 如果结束时间早于开始时间，假设是跨天
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const duration = Math.floor((endDate - startDate) / 1000);
    
    this.setData({
      startTime: startDate.getTime(),
      duration: duration,
      formattedDuration: this.formatTimeDisplay(duration),
      showTimeEdit: false
    });
    
    wx.showToast({ title: '时间已更新', icon: 'success' });
  },

  // 喂养类型选择
  onFeedingTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ 
      feedingType: this.data.feedingTypeOptions[index].value,
      feedingTypeIndex: index
    });
  },

  stopFeeding() {
    const { startTime, duration, preparedAmount, actualAmount, feedingType } = this.data;
    if (this.data.feedingType !== 'breastfeeding' && (!actualAmount || parseInt(actualAmount, 10) <= 0)) {
      wx.showToast({ title: '请输入实际喝奶量', icon: 'none' });
      return;
    }
    this.clearTimer();
    wx.removeStorageSync('timerState');
    const record = {
      startTime: new Date(startTime).toISOString(),
      duration: Math.ceil(duration / 60),
      preparedAmount: parseInt(preparedAmount, 10) || 0,
      actualAmount: this.data.feedingType === 'breastfeeding' ? 0 : (parseInt(actualAmount, 10) || 0),
      feedingType
    };
    const d = new Date(record.startTime);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const typeIndex = record.feedingType === 'breastfeeding' ? 0 : (record.feedingType === 'mixed' ? 1 : 2);
    this.setData({
      isTiming: false,
      startTime: null,
      duration: 0,
      formattedDuration: '00:00',
      preparedAmount: '',
      actualAmount: '',
      feedingType: 'formula',
      showTimerConfirm: true,
      timerConfirmRecord: record,
      timerConfirmTimeStr: timeStr,
      timerConfirmTypeIndex: typeIndex
    });
  },

  confirmTimerSave() {
    const record = this.data.timerConfirmRecord;
    if (!record || !record.startTime) return;
    const success = addFeedingRecord(record);
    this.setData({ showTimerConfirm: false, timerConfirmRecord: null });
    if (success) {
      this.loadTodayRecords();
      this.loadLastRecord();
      this.updateFeedingStatus();
      this.updateLastFeedingInfo();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  cancelTimerConfirm() {
    this.setData({ showTimerConfirm: false, timerConfirmRecord: null });
  },

  onTimerConfirmField(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const record = this.data.timerConfirmRecord ? { ...this.data.timerConfirmRecord } : {};
    if (field === 'startTime') {
      const d = new Date(record.startTime || Date.now());
      const [h, m] = value.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      record.startTime = d.toISOString();
      this.setData({ timerConfirmRecord: record, timerConfirmTimeStr: value });
    } else {
      if (field === 'duration' || field === 'preparedAmount' || field === 'actualAmount') {
        record[field] = parseInt(value, 10) || 0;
      } else if (field === 'feedingType') {
        const idx = parseInt(value, 10);
        record.feedingType = this.data.feedingTypeOptions[idx] ? this.data.feedingTypeOptions[idx].value : 'formula';
        this.setData({ timerConfirmRecord: record, timerConfirmTypeIndex: idx });
        return;
      }
      this.setData({ timerConfirmRecord: record });
    }
  },

  cancelFeeding() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消本次喂养记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.clearTimer();
          wx.removeStorageSync('timerState');
          
          this.setData({
            isTiming: false,
            startTime: null,
            duration: 0,
            formattedDuration: '00:00',
            preparedAmount: '',
            actualAmount: ''
          });
          
          wx.showToast({ title: '已取消', icon: 'none' });
        }
      }
    });
  },

  onPreparedAmountInput(e) {
    this.setData({ preparedAmount: e.detail.value });
  },

  onActualAmountInput(e) {
    this.setData({ actualAmount: e.detail.value });
  },

  copyLastRecord() {
    const { lastRecord } = this.data;
    if (lastRecord) {
      this.setData({
        preparedAmount: lastRecord.preparedAmount || '',
        actualAmount: lastRecord.actualAmount || ''
      });
      
      wx.showToast({ title: '已复制上次记录', icon: 'none' });
    }
  }
});
