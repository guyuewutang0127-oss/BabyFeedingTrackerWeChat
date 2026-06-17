/**
 * 本地存储工具函数封装
 * 使用微信小程序 Storage API
 */

// 存储键名常量
const STORAGE_KEYS = {
  BABY_INFO: 'babyInfo',
  FEEDING_RECORDS: 'feedingRecords',
  SETTINGS: 'settings',
  GROWTH_RECORDS: 'growthRecords',
  ASSESSMENT_RECORDS: 'assessmentRecords',
  FEEDING_PLAN_SCHEDULE: 'feedingPlanSchedule' // 新增：灵活时间表存储
};

// 默认数据
const DEFAULT_DATA = {
  babyInfo: {
    name: '宝宝',
    birthDate: '',
    avatar: '',
    gender: 'boy'
  },
  feedingRecords: [],
  settings: {
    reminderEnabled: true,
    reminderInterval: 180,
    feedingType: 'breastfeeding',
    scientificPlanEnabled: true, // 默认开启科学喂养计划
    nightModeEnabled: true,
    scheduleTemplate: 'newborn',
    perFeedReminderEnabled: true // 新增：每顿独立提醒开关
  },
  growthRecords: [],
  assessmentRecords: [],
  feedingPlanSchedule: null // 新增：灵活时间表
};

/**
 * 初始化存储
 */
function initStorage() {
  try {
    const initialized = wx.getStorageSync('initialized');
    if (initialized) {
      // 确保新字段存在（向后兼容）
      ensureNewFields();
      return;
    }

    Object.keys(DEFAULT_DATA).forEach(key => {
      const existing = wx.getStorageSync(key);
      if (!existing) {
        wx.setStorageSync(key, DEFAULT_DATA[key]);
      }
    });

    wx.setStorageSync('initialized', true);
    console.log('Storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

/**
 * 确保新字段存在（向后兼容）
 */
function ensureNewFields() {
  try {
    const settings = wx.getStorageSync(STORAGE_KEYS.SETTINGS) || {};
    let updated = false;
    
    // 确保科学喂养计划默认开启
    if (settings.scientificPlanEnabled === undefined) {
      settings.scientificPlanEnabled = true;
      updated = true;
    }
    
    // 确保每顿提醒开关存在
    if (settings.perFeedReminderEnabled === undefined) {
      settings.perFeedReminderEnabled = true;
      updated = true;
    }
    
    if (updated) {
      wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings);
    }
  } catch (error) {
    console.error('Failed to ensure new fields:', error);
  }
}

/**
 * 获取数据
 */
function getData(key) {
  try {
    const data = wx.getStorageSync(key);
    return data !== '' ? data : DEFAULT_DATA[key] || null;
  } catch (error) {
    console.error(`Failed to get data for key "${key}":`, error);
    return DEFAULT_DATA[key] || null;
  }
}

/**
 * 保存数据
 */
function saveData(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (error) {
    console.error(`Failed to save data for key "${key}":`, error);
    wx.showToast({ title: '保存失败', icon: 'none' });
    return false;
  }
}

/**
 * 添加喂养记录（增强：支持喂养类型、补喝 isSupplement）
 */
function addFeedingRecord(record) {
  try {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    record.id = Date.now().toString();
    const date = new Date(record.startTime);
    record.date = formatDate(date);
    if (!record.feedingType) record.feedingType = 'formula';
    if (record.isSupplement === undefined) record.isSupplement = false;
    records.push(record);
    return saveData(STORAGE_KEYS.FEEDING_RECORDS, records);
  } catch (error) {
    console.error('Failed to add feeding record:', error);
    return false;
  }
}

/**
 * 批量添加喂养记录
 */
function addFeedingRecords(recordList) {
  if (!recordList || recordList.length === 0) return false;
  try {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    const base = Date.now();
    recordList.forEach((record, i) => {
      record.id = (base + i).toString();
      const date = new Date(record.startTime);
      record.date = formatDate(date);
      if (!record.feedingType) record.feedingType = 'formula';
      if (record.isSupplement === undefined) record.isSupplement = false;
      records.push(record);
    });
    return saveData(STORAGE_KEYS.FEEDING_RECORDS, records);
  } catch (error) {
    console.error('Failed to add feeding records:', error);
    return false;
  }
}

/**
 * 删除喂养记录
 */
function deleteFeedingRecord(id) {
  try {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    const index = records.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    records.splice(index, 1);
    return saveData(STORAGE_KEYS.FEEDING_RECORDS, records);
  } catch (error) {
    console.error('Failed to delete feeding record:', error);
    return false;
  }
}

/**
 * 更新喂养记录
 */
function updateFeedingRecord(id, updates) {
  try {
    const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
    const index = records.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    records[index] = { ...records[index], ...updates };
    return saveData(STORAGE_KEYS.FEEDING_RECORDS, records);
  } catch (error) {
    console.error('Failed to update feeding record:', error);
    return false;
  }
}

/**
 * 获取指定日期的记录
 */
function getRecordsByDate(date) {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  return records.filter(item => item.date === date);
}

/**
 * 获取日期范围内的记录
 */
function getRecordsByDateRange(startDate, endDate) {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  return records.filter(item => item.date >= startDate && item.date <= endDate);
}

/**
 * 获取今日记录
 */
function getTodayRecords() {
  const today = formatDate(new Date());
  return getRecordsByDate(today);
}

/**
 * 清空所有数据
 */
function clearAllData() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:mm
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 格式化时长
 */
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

/**
 * 添加生长发育记录
 */
function addGrowthRecord(record) {
  try {
    const records = getData(STORAGE_KEYS.GROWTH_RECORDS) || [];
    record.id = Date.now().toString();
    record.recordDate = formatDate(new Date());
    records.push(record);
    return saveData(STORAGE_KEYS.GROWTH_RECORDS, records);
  } catch (error) {
    console.error('Failed to add growth record:', error);
    return false;
  }
}

/**
 * 获取生长发育记录
 */
function getGrowthRecords() {
  return getData(STORAGE_KEYS.GROWTH_RECORDS) || [];
}

/**
 * 添加评估档案记录（增强版）
 */
function addAssessmentRecord(record) {
  try {
    const records = getData(STORAGE_KEYS.ASSESSMENT_RECORDS) || [];
    record.id = Date.now().toString();
    record.assessmentDate = formatDate(new Date());
    records.push(record);
    return saveData(STORAGE_KEYS.ASSESSMENT_RECORDS, records);
  } catch (error) {
    console.error('Failed to add assessment record:', error);
    return false;
  }
}

/**
 * 获取评估档案记录
 */
function getAssessmentRecords() {
  return getData(STORAGE_KEYS.ASSESSMENT_RECORDS) || [];
}

/**
 * 获取指定月龄的评估记录
 */
function getAssessmentByAge(ageMonths) {
  const records = getAssessmentRecords();
  return records.find(r => r.ageMonths === ageMonths) || null;
}

/**
 * 检查是否需要评估
 */
function checkAssessmentNeeded(ageMonths) {
  const KEY_AGES = [1, 3, 6, 8, 12, 18, 24, 30, 36];
  const records = getAssessmentRecords();
  
  let targetAge = null;
  for (const age of KEY_AGES) {
    if (ageMonths >= age) {
      const hasRecord = records.some(r => r.ageMonths === age);
      if (!hasRecord) {
        targetAge = age;
        break;
      }
    }
  }
  
  return {
    needed: targetAge !== null,
    targetAge,
    message: targetAge ? `建议进行${targetAge}月龄生长发育评估` : ''
  };
}

/**
 * 获取昨日最后一顿喂养时间（用于今日时间表参考时间）
 */
function getLastFeedingTimeYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = formatDate(yesterday);
  const records = getRecordsByDate(dateStr);
  if (!records || records.length === 0) return { hasRecord: false, time: '' };
  records.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const last = records[records.length - 1];
  const t = new Date(last.startTime);
  const time = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  return { hasRecord: true, time };
}

/**
 * 获取灵活时间表
 */
function getFeedingPlanSchedule() {
  return getData(STORAGE_KEYS.FEEDING_PLAN_SCHEDULE);
}

/**
 * 保存灵活时间表
 */
function saveFeedingPlanSchedule(schedule) {
  return saveData(STORAGE_KEYS.FEEDING_PLAN_SCHEDULE, schedule);
}

module.exports = {
  STORAGE_KEYS,
  initStorage,
  getData,
  saveData,
  addFeedingRecord,
  addFeedingRecords,
  deleteFeedingRecord,
  updateFeedingRecord,
  getRecordsByDate,
  getRecordsByDateRange,
  getTodayRecords,
  clearAllData,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  addGrowthRecord,
  getGrowthRecords,
  addAssessmentRecord,
  getAssessmentRecords,
  getAssessmentByAge,
  checkAssessmentNeeded,
  getLastFeedingTimeYesterday,
  getFeedingPlanSchedule,
  saveFeedingPlanSchedule
};
