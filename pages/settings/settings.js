const { getData, saveData, STORAGE_KEYS } = require('../../utils/storage');
const { exportToCSV } = require('../../utils/charts');
const { getFeedingTypeOptions, getScheduleTemplateOptions } = require('../../utils/feedingPlan');

Page({
  data: {
    // 宝宝信息
    babyInfo: { name: '', birthDate: '', avatar: '', gender: 'boy' },
    
    // 性别选项
    genderOptions: [
      { value: 'boy', label: '男孩' },
      { value: 'girl', label: '女孩' }
    ],
    genderIndex: 0,
    
    // 设置
    settings: {
      reminderEnabled: true,
      reminderInterval: 180,
      feedingType: 'breastfeeding',
      scientificPlanEnabled: true,
      scheduleTemplate: 'newborn',
      perFeedReminderEnabled: true
    },
    
    // 喂养方式选项
    feedingTypeOptions: [],
    feedingTypeIndex: 0,
    feedingTypeLabel: '纯母乳喂养',
    
    // 作息模板选项
    scheduleTemplateOptions: [],
    scheduleTemplateIndex: 0,
    
    // 分享图弹窗
    showShareModal: false,
    canvasWidth: 300,
    canvasHeight: 400,

    reminderIntervalOptions: [
      { value: 120, label: '2 小时' },
      { value: 180, label: '3 小时' },
      { value: 240, label: '4 小时' },
      { value: 300, label: '5 小时' }
    ],
    reminderIntervalIndex: 1,
    reminderIntervalLabel: '3 小时'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO) || { name: '', birthDate: '', avatar: '', gender: 'boy' };
    const settings = getData(STORAGE_KEYS.SETTINGS) || { 
      reminderEnabled: true, 
      reminderInterval: 180,
      feedingType: 'breastfeeding',
      scientificPlanEnabled: true,
      scheduleTemplate: 'newborn',
      perFeedReminderEnabled: true
    };
    
    // 获取喂养方式选项
    const feedingTypeOptions = getFeedingTypeOptions();
    const feedingTypeIndex = feedingTypeOptions.findIndex(opt => opt.value === settings.feedingType);
    
    // 获取作息模板选项
    const scheduleTemplateOptions = getScheduleTemplateOptions();
    const scheduleTemplateIndex = scheduleTemplateOptions.findIndex(opt => opt.id === settings.scheduleTemplate);
    
    // 性别当前选中下标
    const genderIndex = babyInfo.gender === 'girl' ? 1 : 0;
    
    const fi = feedingTypeIndex >= 0 ? feedingTypeIndex : 0;
    const feedingTypeLabel = (feedingTypeOptions[fi] && feedingTypeOptions[fi].label) ? feedingTypeOptions[fi].label : '纯母乳喂养';

    const reminderIntervalOptions = this.data.reminderIntervalOptions;
    const interval = settings.reminderInterval || 180;
    let reminderIntervalIndex = reminderIntervalOptions.findIndex(opt => opt.value === interval);
    if (reminderIntervalIndex < 0) reminderIntervalIndex = 1;
    const reminderIntervalLabel = reminderIntervalOptions[reminderIntervalIndex].label;
    
    this.setData({
      babyInfo,
      settings,
      feedingTypeOptions,
      feedingTypeIndex: fi,
      feedingTypeLabel,
      scheduleTemplateOptions,
      scheduleTemplateIndex: scheduleTemplateIndex >= 0 ? scheduleTemplateIndex : 0,
      genderIndex,
      reminderIntervalIndex,
      reminderIntervalLabel
    });
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        const fs = wx.getFileSystemManager();
        const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.jpg`;
        
        fs.saveFile({
          tempFilePath,
          filePath: savePath,
          success: () => {
            this.setData({ 'babyInfo.avatar': savePath });
          },
          fail: () => {
            this.setData({ 'babyInfo.avatar': tempFilePath });
          }
        });
      }
    });
  },

  // 输入昵称
  onNameInput(e) {
    this.setData({ 'babyInfo.name': e.detail.value });
  },

  // 选择出生日期
  onBirthDateChange(e) {
    this.setData({ 'babyInfo.birthDate': e.detail.value });
  },
  
  // 选择性别
  onGenderChange(e) {
    const index = parseInt(e.detail.value);
    const gender = this.data.genderOptions[index].value;
    this.setData({ 'babyInfo.gender': gender, genderIndex: index });
  },
  
  // 选择喂养方式
  onFeedingTypeChange(e) {
    const index = parseInt(e.detail.value);
    const opts = this.data.feedingTypeOptions;
    const feedingType = opts[index] ? opts[index].value : 'breastfeeding';
    const feedingTypeLabel = opts[index] ? opts[index].label : '纯母乳喂养';
    this.setData({
      feedingTypeIndex: index,
      feedingTypeLabel,
      'settings.feedingType': feedingType
    });
    this.saveSettings();
    wx.showToast({ title: '喂养方式已更新', icon: 'success' });
  },
  
  // 切换科学喂养计划
  toggleScientificPlan(e) {
    const enabled = e.detail.value;
    this.setData({ 'settings.scientificPlanEnabled': enabled });
    this.saveSettings();
    wx.showToast({
      title: enabled ? '科学计划已开启' : '科学计划已关闭',
      icon: 'none'
    });
  },

  toggleReminder(e) {
    const enabled = e.detail.value;
    this.setData({ 'settings.reminderEnabled': enabled });
    this.saveSettings();
    wx.showToast({
      title: enabled ? '间隔提醒已开启' : '间隔提醒已关闭',
      icon: 'none'
    });
  },

  onReminderIntervalChange(e) {
    const index = parseInt(e.detail.value, 10);
    const opt = this.data.reminderIntervalOptions[index];
    this.setData({
      reminderIntervalIndex: index,
      reminderIntervalLabel: opt.label,
      'settings.reminderInterval': opt.value
    });
    this.saveSettings();
    wx.showToast({ title: '提醒间隔已更新', icon: 'success' });
  },

  // 切换每顿提醒
  togglePerFeedReminder(e) {
    const enabled = e.detail.value;
    this.setData({ 'settings.perFeedReminderEnabled': enabled });
    this.saveSettings();
    wx.showToast({
      title: enabled ? '每顿提醒已开启' : '每顿提醒已关闭',
      icon: 'none'
    });
  },
  
  // 选择作息模板
  onScheduleTemplateChange(e) {
    const index = parseInt(e.detail.value);
    const templateId = this.data.scheduleTemplateOptions[index].id;
    this.setData({
      scheduleTemplateIndex: index,
      'settings.scheduleTemplate': templateId
    });
    this.saveSettings();
    wx.showToast({ title: '作息模板已更新', icon: 'success' });
  },

  // 智能解析服务地址
  onParseApiBaseInput(e) {
    this.setData({ 'settings.parseApiBase': e.detail.value });
  },
  saveParseApiBase() {
    this.saveSettings();
  },

  // 跳转到时间表页面
  goToFeedingSchedule() {
    wx.navigateTo({ url: '/pages/feedingSchedule/feedingSchedule' });
  },

  // 保存宝宝信息
  saveBabyInfo() {
    const { babyInfo } = this.data;
    
    if (!babyInfo.name.trim()) {
      wx.showToast({ title: '请输入宝宝昵称', icon: 'none' });
      return;
    }
    
    const success = saveData(STORAGE_KEYS.BABY_INFO, babyInfo);
    
    if (success) {
      wx.showToast({ title: '保存成功', icon: 'success' });
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 保存设置
  saveSettings() {
    const { settings } = this.data;
    saveData(STORAGE_KEYS.SETTINGS, settings);
  },

  // 导出CSV
  exportToCSV() {
    const csvContent = exportToCSV();
    
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/feeding_records.csv`;
    
    try {
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      wx.shareFileMessage({
        filePath,
        fileName: '宝宝喂养记录.csv',
        success: () => {
          wx.showToast({ title: '导出成功', icon: 'success' });
        },
        fail: () => {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      });
    } catch (error) {
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  // 数据备份
  backupData() {
    try {
      const data = {
        babyInfo: getData(STORAGE_KEYS.BABY_INFO),
        feedingRecords: getData(STORAGE_KEYS.FEEDING_RECORDS),
        settings: getData(STORAGE_KEYS.SETTINGS),
        backupTime: new Date().toISOString()
      };
      
      wx.setStorageSync('backupData', data);
      wx.showToast({ title: '备份成功', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '备份失败', icon: 'none' });
    }
  },

  // 恢复数据
  restoreData() {
    wx.showModal({
      title: '恢复数据',
      content: '恢复备份将覆盖当前数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          try {
            const backup = wx.getStorageSync('backupData');
            
            if (!backup) {
              wx.showToast({ title: '没有找到备份', icon: 'none' });
              return;
            }
            
            if (backup.babyInfo) saveData(STORAGE_KEYS.BABY_INFO, backup.babyInfo);
            if (backup.feedingRecords) saveData(STORAGE_KEYS.FEEDING_RECORDS, backup.feedingRecords);
            if (backup.settings) saveData(STORAGE_KEYS.SETTINGS, backup.settings);
            
            this.loadData();
            wx.showToast({ title: '恢复成功', icon: 'success' });
          } catch (error) {
            wx.showToast({ title: '恢复失败', icon: 'none' });
          }
        }
      }
    });
  }
});
