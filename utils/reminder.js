/**
 * 喂养提醒工具函数（增强版）
 * 支持每顿独立提醒
 */

const { getData, STORAGE_KEYS } = require('./storage');
const { getFlexibleSchedule, getNextFeedReminder } = require('./feedingPlan');

/**
 * 检查是否需要提醒
 */
function checkFeedingReminder() {
  const settings = getData(STORAGE_KEYS.SETTINGS);
  
  if (!settings || !settings.reminderEnabled) {
    return { needRemind: false, message: '' };
  }
  
  // 优先使用灵活时间表提醒
  if (settings.perFeedReminderEnabled) {
    const schedule = getFlexibleSchedule();
    if (schedule && schedule.enabled) {
      const nextReminder = getNextFeedReminder(schedule);
      if (nextReminder) {
        return {
          needRemind: false,
          message: nextReminder.message,
          nextFeed: nextReminder,
          type: 'schedule'
        };
      }
    }
  }
  
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS);
  
  if (!records || records.length === 0) {
    return { needRemind: false, message: '' };
  }
  
  const lastRecord = records[records.length - 1];
  const lastFeedTime = new Date(lastRecord.startTime).getTime();
  const now = Date.now();
  const interval = (settings.reminderInterval || 180) * 60 * 1000;
  
  const timePassed = now - lastFeedTime;
  const minutesPassed = Math.floor(timePassed / (60 * 1000));
  
  if (timePassed >= interval) {
    const hours = Math.floor(minutesPassed / 60);
    const mins = minutesPassed % 60;
    
    return {
      needRemind: true,
      message: `距离上次喂养已过去 ${hours}小时${mins}分钟，该喂奶啦！`,
      minutesPassed,
      lastFeedTime: lastRecord.startTime,
      type: 'interval'
    };
  }
  
  const minutesUntilNext = Math.ceil((interval - timePassed) / (60 * 1000));
  
  return {
    needRemind: false,
    message: `预计${minutesUntilNext}分钟后需要喂养`,
    minutesUntilNext,
    lastFeedTime: lastRecord.startTime,
    type: 'interval'
  };
}

/**
 * 获取建议的下次喂养时间
 */
function getSuggestedNextFeedTime() {
  const settings = getData(STORAGE_KEYS.SETTINGS);
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS);
  
  if (!records || records.length === 0) return null;
  
  const lastRecord = records[records.length - 1];
  const lastFeedTime = new Date(lastRecord.startTime).getTime();
  const interval = (settings?.reminderInterval || 180) * 60 * 1000;
  
  const nextFeedTime = new Date(lastFeedTime + interval);
  
  return {
    time: nextFeedTime.toISOString(),
    displayTime: `${String(nextFeedTime.getHours()).padStart(2, '0')}:${String(nextFeedTime.getMinutes()).padStart(2, '0')}`,
    displayDate: `${nextFeedTime.getMonth() + 1}月${nextFeedTime.getDate()}日`
  };
}

/**
 * 格式化剩余时间
 */
function formatRemainingTime(minutes) {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

/**
 * 获取喂养状态
 */
function getFeedingStatus() {
  const reminder = checkFeedingReminder();
  const nextFeedTime = getSuggestedNextFeedTime();
  
  if (reminder.needRemind) {
    return {
      status: 'overdue', statusText: '已超时',
      message: reminder.message, color: '#FF4D4F', nextFeedTime
    };
  }
  
  if (reminder.minutesUntilNext && reminder.minutesUntilNext <= 30) {
    return {
      status: 'soon', statusText: '即将到期',
      message: reminder.message, color: '#FAAD14', nextFeedTime
    };
  }
  
  return {
    status: 'normal', statusText: '正常',
    message: reminder.message || '喂养时间正常', color: '#52C41A', nextFeedTime
  };
}

/**
 * 获取每顿提醒列表
 */
function getPerFeedReminders() {
  const settings = getData(STORAGE_KEYS.SETTINGS);
  
  if (!settings || !settings.perFeedReminderEnabled) {
    return [];
  }
  
  const schedule = getFlexibleSchedule();
  if (!schedule || !schedule.enabled || !schedule.schedule) {
    return [];
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const reminders = [];
  
  for (const item of schedule.schedule) {
    const [hours, minutes] = item.targetTime.split(':').map(Number);
    const feedTime = hours * 60 + minutes;
    const diff = feedTime - currentTime;
    
    // 提醒时间：目标时间前15分钟到后30分钟
    if (diff >= -15 && diff <= 30) {
      reminders.push({
        id: item.id,
        name: item.name,
        targetTime: item.targetTime,
        targetAmount: item.targetAmount,
        type: item.type,
        note: item.note,
        isDue: diff <= 0,
        minutesUntil: diff
      });
    }
  }
  
  return reminders;
}

module.exports = {
  checkFeedingReminder, getSuggestedNextFeedTime,
  formatRemainingTime, getFeedingStatus, getPerFeedReminders
};
