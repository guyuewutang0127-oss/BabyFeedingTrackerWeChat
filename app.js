const { initStorage, getData, STORAGE_KEYS } = require('./utils/storage');
const { getFlexibleSchedule } = require('./utils/feedingPlan');

App({
  globalData: {
    babyInfo: null,
    feedingRecords: [],
    settings: null
  },

  onLaunch() {
    console.log('App Launch');
    this.initAppData();
    this.checkReminder();
  },

  onShow() {
    console.log('App Show');
    this.checkReminder();
  },

  // 初始化应用数据
  initAppData() {
    try {
      initStorage();
      this.loadGlobalData();
      this.initFeedingPlanSchedule();
      console.log('App data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      wx.showToast({ title: '数据初始化失败', icon: 'none' });
    }
  },

  // 加载全局数据
  loadGlobalData() {
    this.globalData.babyInfo = getData(STORAGE_KEYS.BABY_INFO);
    this.globalData.feedingRecords = getData(STORAGE_KEYS.FEEDING_RECORDS);
    this.globalData.settings = getData(STORAGE_KEYS.SETTINGS);
  },

  // 初始化喂养计划时间表（默认开启）
  initFeedingPlanSchedule() {
    const { getFeedingPlanSchedule, saveFeedingPlanSchedule } = require('./utils/storage');
    const existingSchedule = getFeedingPlanSchedule();
    
    if (!existingSchedule) {
      const babyInfo = getData(STORAGE_KEYS.BABY_INFO);
      if (babyInfo && babyInfo.birthDate) {
        const defaultSchedule = getFlexibleSchedule(babyInfo.birthDate);
        saveFeedingPlanSchedule(defaultSchedule);
        console.log('Feeding plan schedule initialized');
      }
    }
  },

  // 检查是否需要提醒
  checkReminder() {
    const settings = getData(STORAGE_KEYS.SETTINGS);
    if (!settings || !settings.reminderEnabled) return;

    const records = getData(STORAGE_KEYS.FEEDING_RECORDS);
    if (!records || records.length === 0) return;

    const lastRecord = records[records.length - 1];
    const lastFeedTime = new Date(lastRecord.startTime).getTime();
    const now = Date.now();
    const interval = (settings.reminderInterval || 180) * 60 * 1000;

    if (now - lastFeedTime >= interval) {
      const minutesPassed = Math.floor((now - lastFeedTime) / (60 * 1000));
      wx.showModal({
        title: '喂养提醒',
        content: `距离上次喂养已过去 ${Math.floor(minutesPassed / 60)}小时${minutesPassed % 60}分钟，该喂奶啦！`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 更新全局数据
  updateGlobalData(key, value) {
    if (this.globalData.hasOwnProperty(key)) {
      this.globalData[key] = value;
    }
  }
});
