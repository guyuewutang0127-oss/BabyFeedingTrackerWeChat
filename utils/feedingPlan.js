/**
 * 科学喂养计划配置（增强版）
 * 支持灵活时间表
 */

// 喂养方式常量
const FEEDING_TYPES = {
  BREASTFEEDING: 'breastfeeding',
  MIXED: 'mixed',
  FORMULA: 'formula'
};

// 喂养方式显示名称
const FEEDING_TYPE_NAMES = {
  [FEEDING_TYPES.BREASTFEEDING]: '纯母乳喂养',
  [FEEDING_TYPES.MIXED]: '混合喂养',
  [FEEDING_TYPES.FORMULA]: '人工喂养'
};

// 喂养方式简写（用于提醒）
const FEEDING_TYPE_SHORT = {
  [FEEDING_TYPES.BREASTFEEDING]: '母乳',
  [FEEDING_TYPES.MIXED]: '混合',
  [FEEDING_TYPES.FORMULA]: '奶粉'
};

// 卫健委喂养指南
const FEEDING_GUIDE = {
  "0-1": { perFeed: "60-90ml", interval: "2-3h", daily: "400-600ml" },
  "1-2": { perFeed: "90-120ml", interval: "3h", daily: "600-800ml" },
  "2-4": { perFeed: "120-150ml", interval: "3-4h", daily: "750-900ml" },
  "4-6": { perFeed: "150-180ml", interval: "4h", daily: "800-1000ml" },
  "6-12": { perFeed: "180-210ml", interval: "4h", daily: "600-800ml" }
};

// 科学喂养计划
const FEEDING_PLANS = {
  '0-30': {
    stageName: '新生儿期',
    description: '按需喂养，建立母乳喂养',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 180, intervalRange: '2-3小时', minTimes: 8, maxTimes: 12,
        milkAmount: '按需', perFeedAmount: '按需', nightFeeds: 2,
        tips: ['按需喂养，宝宝饿了就喂', '每日母乳喂养8-12次', '夜间需要2-3次喂养']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 150, intervalRange: '2.5-3小时', minTimes: 7, maxTimes: 8,
        milkAmount: '600-700ml/日', perFeedAmount: '60-90ml', nightFeeds: 2,
        tips: ['先喂母乳，不足再补配方奶', '每日总奶量600-700ml']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 180, intervalRange: '3小时', minTimes: 7, maxTimes: 8,
        milkAmount: '600-700ml/日', perFeedAmount: '60-90ml', nightFeeds: 2,
        tips: ['按时喂养，每3小时一次', '每次60-90ml，根据体重调整']
      }
    }
  },
  '31-90': {
    stageName: '1-3月龄',
    description: '逐渐形成喂养规律',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 180, intervalRange: '3小时', minTimes: 6, maxTimes: 8,
        milkAmount: '按需', perFeedAmount: '按需', nightFeeds: 1,
        tips: ['逐渐形成3小时规律', '每日喂养6-8次', '夜间可减少至1次']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 180, intervalRange: '3小时', minTimes: 6, maxTimes: 7,
        milkAmount: '800-900ml/日', perFeedAmount: '90-150ml', nightFeeds: 1,
        tips: ['每日总奶量800-900ml', '母乳不足时补充配方奶']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 180, intervalRange: '3小时', minTimes: 6, maxTimes: 7,
        milkAmount: '800-900ml/日', perFeedAmount: '90-150ml', nightFeeds: 1,
        tips: ['每次90-150ml', '允许每次奶量波动']
      }
    }
  },
  '91-180': {
    stageName: '3-6月龄',
    description: '准备添加辅食',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 210, intervalRange: '3-4小时', minTimes: 5, maxTimes: 6,
        milkAmount: '按需', perFeedAmount: '按需', nightFeeds: 1, foodReady: true,
        tips: ['每日喂养5-6次', '6月龄开始添加辅食']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 210, intervalRange: '3.5小时', minTimes: 5, maxTimes: 6,
        milkAmount: '800-900ml/日', perFeedAmount: '150-180ml', nightFeeds: 1, foodReady: true,
        tips: ['每日总奶量800-900ml', '6月龄开始添加辅食']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 210, intervalRange: '3.5小时', minTimes: 5, maxTimes: 6,
        milkAmount: '800-900ml/日', perFeedAmount: '150-180ml', nightFeeds: 1, foodReady: true,
        tips: ['每次150-180ml', '6月龄开始添加辅食']
      }
    }
  },
  '181-240': {
    stageName: '6-8月龄',
    description: '辅食添加初期',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 240, intervalRange: '4小时', minTimes: 4, maxTimes: 5,
        milkAmount: '800-1000ml/日', perFeedAmount: '按需', foodTimes: '1-2次/日', nightFeeds: 0,
        tips: ['每日母乳4-5次', '奶量800-1000ml', '辅食每日1-2次']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 240, intervalRange: '4小时', minTimes: 4, maxTimes: 5,
        milkAmount: '800-900ml/日', perFeedAmount: '180-210ml', foodTimes: '1-2次/日', nightFeeds: 0,
        tips: ['每日总奶量800-900ml', '辅食每日1-2次']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 240, intervalRange: '4小时', minTimes: 4, maxTimes: 5,
        milkAmount: '800-900ml/日', perFeedAmount: '180-210ml', foodTimes: '1-2次/日', nightFeeds: 0,
        tips: ['每次180-210ml', '辅食每日1-2次']
      }
    }
  },
  '241-365': {
    stageName: '8-12月龄',
    description: '辅食为主过渡',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 240, intervalRange: '4小时', minTimes: 3, maxTimes: 4,
        milkAmount: '700-800ml/日', perFeedAmount: '按需', foodTimes: '2-3次/日', nightFeeds: 0,
        tips: ['每日母乳3-4次', '奶量700-800ml', '辅食每日2-3次']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 240, intervalRange: '4小时', minTimes: 3, maxTimes: 4,
        milkAmount: '700-800ml/日', perFeedAmount: '210-240ml', foodTimes: '2-3次/日', nightFeeds: 0,
        tips: ['每日总奶量700-800ml', '辅食每日2-3次']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 240, intervalRange: '4小时', minTimes: 3, maxTimes: 4,
        milkAmount: '700-800ml/日', perFeedAmount: '210-240ml', foodTimes: '2-3次/日', nightFeeds: 0,
        tips: ['每次210-240ml', '辅食每日2-3次']
      }
    }
  },
  '366-545': {
    stageName: '12-18月龄',
    description: '辅食为主，奶为辅',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 300, intervalRange: '4-5小时', minTimes: 2, maxTimes: 3,
        milkAmount: '600-700ml/日', perFeedAmount: '按需', foodTimes: '3次正餐+1-2次加餐', nightFeeds: 0,
        tips: ['每日母乳2-3次', '奶量600-700ml', '辅食每日3次正餐']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 300, intervalRange: '4-5小时', minTimes: 2, maxTimes: 3,
        milkAmount: '600-700ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+1-2次加餐', nightFeeds: 0,
        tips: ['每日总奶量600-700ml', '辅食单独制作']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 300, intervalRange: '4-5小时', minTimes: 2, maxTimes: 3,
        milkAmount: '600-700ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+1-2次加餐', nightFeeds: 0,
        tips: ['每次200-250ml', '辅食每日3次正餐']
      }
    }
  },
  '546-730': {
    stageName: '18-24月龄',
    description: '家庭膳食过渡',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '按需', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每日母乳2-3次', '奶量400-600ml', '辅食每日3次正餐+2次加餐']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每日总奶量400-600ml', '与家人共同进食']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每次200-250ml', '正餐间隔4-5小时']
      }
    }
  },
  '731-1095': {
    stageName: '24-36月龄',
    description: '规律饮食习惯',
    plans: {
      [FEEDING_TYPES.BREASTFEEDING]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '按需', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每日母乳2-3次', '奶量400-600ml', '规律饮食，定时定量']
      },
      [FEEDING_TYPES.MIXED]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每日总奶量400-600ml', '正餐不超过30分钟']
      },
      [FEEDING_TYPES.FORMULA]: {
        interval: 360, intervalRange: '5-6小时', minTimes: 2, maxTimes: 3,
        milkAmount: '400-600ml/日', perFeedAmount: '200-250ml', foodTimes: '3次正餐+2次加餐', nightFeeds: 0,
        tips: ['每次200-250ml', '每日饮奶2-3次']
      }
    }
  }
};

// 默认时间表模板（灵活时间表）
const DEFAULT_SCHEDULE_TEMPLATES = {
  newborn: {
    name: '新生儿模式',
    description: '0-1月龄，高频喂养',
    schedule: [
      { id: 1, name: '第一顿', targetTime: '06:00', interval: 180, targetAmount: 60, type: 'formula', note: '' },
      { id: 2, name: '第二顿', targetTime: '09:00', interval: 180, targetAmount: 70, type: 'formula', note: '' },
      { id: 3, name: '第三顿', targetTime: '12:00', interval: 180, targetAmount: 70, type: 'formula', note: '' },
      { id: 4, name: '第四顿', targetTime: '15:00', interval: 180, targetAmount: 70, type: 'formula', note: '' },
      { id: 5, name: '第五顿', targetTime: '18:00', interval: 180, targetAmount: 70, type: 'formula', note: '' },
      { id: 6, name: '第六顿', targetTime: '21:00', interval: 180, targetAmount: 80, type: 'formula', note: '' },
      { id: 7, name: '夜间', targetTime: '00:00', interval: 180, targetAmount: 60, type: 'formula', note: '夜奶' },
      { id: 8, name: '凌晨', targetTime: '03:00', interval: 180, targetAmount: 60, type: 'formula', note: '夜奶' }
    ]
  },
  stage1: {
    name: '1-3月龄模式',
    description: '1-3月龄，逐渐形成规律',
    schedule: [
      { id: 1, name: '第一顿', targetTime: '06:00', interval: 180, targetAmount: 100, type: 'formula', note: '' },
      { id: 2, name: '第二顿', targetTime: '09:00', interval: 180, targetAmount: 120, type: 'formula', note: '' },
      { id: 3, name: '第三顿', targetTime: '12:00', interval: 180, targetAmount: 120, type: 'formula', note: '' },
      { id: 4, name: '第四顿', targetTime: '15:00', interval: 180, targetAmount: 120, type: 'formula', note: '' },
      { id: 5, name: '第五顿', targetTime: '18:00', interval: 180, targetAmount: 120, type: 'formula', note: '' },
      { id: 6, name: '第六顿', targetTime: '21:00', interval: 240, targetAmount: 130, type: 'formula', note: '' },
      { id: 7, name: '夜间', targetTime: '01:00', interval: 240, targetAmount: 100, type: 'formula', note: '夜奶' }
    ]
  },
  stage2: {
    name: '3-6月龄模式',
    description: '3-6月龄，延长间隔',
    schedule: [
      { id: 1, name: '第一顿', targetTime: '06:00', interval: 210, targetAmount: 140, type: 'formula', note: '' },
      { id: 2, name: '第二顿', targetTime: '09:30', interval: 210, targetAmount: 150, type: 'formula', note: '' },
      { id: 3, name: '第三顿', targetTime: '13:00', interval: 210, targetAmount: 150, type: 'formula', note: '' },
      { id: 4, name: '第四顿', targetTime: '16:30', interval: 210, targetAmount: 150, type: 'formula', note: '' },
      { id: 5, name: '第五顿', targetTime: '20:00', interval: 240, targetAmount: 160, type: 'formula', note: '' },
      { id: 6, name: '夜间', targetTime: '00:00', interval: 360, targetAmount: 120, type: 'formula', note: '夜奶' }
    ]
  },
  stage3: {
    name: '6-12月龄模式',
    description: '6-12月龄，辅食加入',
    schedule: [
      { id: 1, name: '早餐奶', targetTime: '06:00', interval: 240, targetAmount: 180, type: 'formula', note: '' },
      { id: 2, name: '上午辅食+奶', targetTime: '10:00', interval: 240, targetAmount: 150, type: 'formula', note: '辅食后喝奶' },
      { id: 3, name: '午餐奶', targetTime: '14:00', interval: 240, targetAmount: 180, type: 'formula', note: '' },
      { id: 4, name: '下午辅食+奶', targetTime: '18:00', interval: 240, targetAmount: 150, type: 'formula', note: '辅食后喝奶' },
      { id: 5, name: '睡前奶', targetTime: '22:00', interval: 480, targetAmount: 200, type: 'formula', note: '' }
    ]
  },
  stage4: {
    name: '12月龄+模式',
    description: '12月龄以上，正餐为主',
    schedule: [
      { id: 1, name: '早餐奶', targetTime: '07:00', interval: 300, targetAmount: 200, type: 'formula', note: '' },
      { id: 2, name: '午餐后奶', targetTime: '12:00', interval: 360, targetAmount: 200, type: 'formula', note: '午餐后' },
      { id: 3, name: '晚餐后奶', targetTime: '18:00', interval: 360, targetAmount: 200, type: 'formula', note: '晚餐后' },
      { id: 4, name: '睡前奶', targetTime: '21:00', interval: 600, targetAmount: 220, type: 'formula', note: '' }
    ]
  }
};

// 计算月龄（天数）
function calculateAgeDays(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24));
}

// 获取月龄显示文本
function getAgeDisplay(birthDate) {
  const days = calculateAgeDays(birthDate);
  if (days < 30) return `${days}天`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return remainingDays > 0 ? `${months}个月${remainingDays}天` : `${months}个月`;
  }
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
}

// 根据最新评估记录获取成长状态（供喂养计划细化使用）
function getLatestGrowthStatus(assessmentRecords) {
  if (!assessmentRecords || assessmentRecords.length === 0) return null;
  const sorted = [...assessmentRecords].sort((a, b) => (b.assessmentDate || '').localeCompare(a.assessmentDate || ''));
  const latest = sorted[0];
  return latest.overallStatus || null; // 'malnutrition' | 'normal' | 'overweight'
}

// 获取当前月龄段的喂养计划（支持按性别与成长状态细化建议）
function getFeedingPlan(birthDate, feedingType = 'breastfeeding', options = {}) {
  const ageDays = calculateAgeDays(birthDate);
  const ageRange = Object.keys(FEEDING_PLANS).find(range => {
    const [min, max] = range.split('-').map(Number);
    return ageDays >= min && ageDays <= max;
  }) || '731-1095';

  const plan = FEEDING_PLANS[ageRange].plans[feedingType] || FEEDING_PLANS[ageRange].plans[FEEDING_TYPES.BREASTFEEDING];
  const base = {
    stageName: FEEDING_PLANS[ageRange].stageName,
    stageDescription: FEEDING_PLANS[ageRange].description,
    ageDays,
    ageDisplay: getAgeDisplay(birthDate),
    feedingType,
    feedingTypeName: FEEDING_TYPE_NAMES[feedingType],
    ...plan
  };

  const gender = options.gender === 'girl' ? 'girl' : 'boy';
  const growthStatus = options.growthStatus || null;
  base.genderLabel = gender === 'girl' ? '女宝' : '男宝';

  const tips = Array.isArray(base.tips) ? [...base.tips] : [];
  if (growthStatus === 'malnutrition') {
    tips.push('根据当前生长发育评估，体重/身高偏慢，可适当增加奶量或喂养次数，并定期评估。');
  } else if (growthStatus === 'overweight') {
    tips.push('根据当前生长发育评估，注意避免过度喂养，按需喂养即可，避免强迫进食。');
  }
  base.tips = tips;
  base.growthNote = growthStatus === 'malnutrition' ? '可适当增加奶量或次数' : growthStatus === 'overweight' ? '注意避免过度喂养' : '';

  return base;
}

// 获取建议的喂养间隔
function getRecommendedInterval(birthDate, feedingType = 'breastfeeding', nightMode = false) {
  const plan = getFeedingPlan(birthDate, feedingType);
  let interval = plan.interval;
  if (nightMode && isNightTime()) interval += 60;
  return interval;
}

// 判断是否为夜间
function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

// 获取辅食添加状态
function getFoodStatus(birthDate) {
  const ageDays = calculateAgeDays(birthDate);
  const startAge = 180;
  
  if (ageDays < startAge) {
    return {
      canAddFood: false,
      message: `还有${startAge - ageDays}天可以开始添加辅食`,
      daysToStart: startAge - ageDays
    };
  }
  
  const frequency = {
    '181-240': { times: '1～2次', description: '6-8月龄，辅食每日1～2次' },
    '241-365': { times: '2～3次', description: '8-12月龄，辅食每日2～3次' },
    '366-730': { times: '3次正餐+2次加餐', description: '12-24月龄' },
    '731-1095': { times: '3次正餐+2次加餐', description: '24-36月龄' }
  };
  
  for (const [range, freq] of Object.entries(frequency)) {
    const [min, max] = range.split('-').map(Number);
    if (ageDays >= min && ageDays <= max) {
      return {
        canAddFood: true, frequency: freq.times, description: freq.description,
        categories: [
          { name: '谷薯类', examples: '米粉、粥、面条、土豆、红薯' },
          { name: '动物性食物', examples: '肉泥、肝泥、鱼泥、蛋黄' },
          { name: '蔬菜', examples: '胡萝卜泥、南瓜泥、菠菜泥' },
          { name: '水果', examples: '苹果泥、香蕉泥、梨泥' },
          { name: '豆类坚果', examples: '豆腐、花生酱（需防过敏）' }
        ]
      };
    }
  }
  
  return { canAddFood: true, frequency: '3次正餐+2次加餐', description: '24-36月龄' };
}

// 获取灵活时间表（根据月龄自动选择模板）
function getFlexibleSchedule(birthDate, customSchedule = null) {
  if (customSchedule) return customSchedule;
  
  const ageDays = calculateAgeDays(birthDate);
  let templateKey = 'newborn';
  
  if (ageDays > 730) templateKey = 'stage4';
  else if (ageDays > 180) templateKey = 'stage3';
  else if (ageDays > 90) templateKey = 'stage2';
  else if (ageDays > 30) templateKey = 'stage1';
  
  const template = DEFAULT_SCHEDULE_TEMPLATES[templateKey];
  return {
    enabled: true,
    templateKey,
    templateName: template.name,
    schedule: JSON.parse(JSON.stringify(template.schedule))
  };
}

// 获取默认时间表模板列表
function getScheduleTemplateList() {
  return Object.entries(DEFAULT_SCHEDULE_TEMPLATES).map(([key, value]) => ({
    key, name: value.name, description: value.description
  }));
}

// 根据模板获取时间表
function getScheduleByTemplate(templateKey) {
  const template = DEFAULT_SCHEDULE_TEMPLATES[templateKey];
  if (!template) return null;
  
  return {
    enabled: true,
    templateKey,
    templateName: template.name,
    schedule: JSON.parse(JSON.stringify(template.schedule))
  };
}

// 获取下一顿提醒信息
function getNextFeedReminder(schedule, lastFeedTime = null) {
  if (!schedule || !schedule.enabled || !schedule.schedule || schedule.schedule.length === 0) {
    return null;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // 找到下一顿
  let nextFeed = null;
  let minDiff = Infinity;
  
  for (const item of schedule.schedule) {
    const [hours, minutes] = item.targetTime.split(':').map(Number);
    const feedTime = hours * 60 + minutes;
    const diff = feedTime - currentTime;
    
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextFeed = item;
    }
  }
  
  // 如果今天没有下一顿了，取第一顿（明天）
  if (!nextFeed) {
    nextFeed = schedule.schedule[0];
  }
  
  return {
    name: nextFeed.name,
    targetTime: nextFeed.targetTime,
    targetAmount: nextFeed.targetAmount,
    type: FEEDING_TYPE_SHORT[nextFeed.type] || '奶粉',
    message: `该吃${nextFeed.name}了，建议奶量 ${nextFeed.targetAmount}ml`
  };
}

// 获取喂养方式选项
function getFeedingTypeOptions() {
  return [
    { value: FEEDING_TYPES.BREASTFEEDING, label: '纯母乳喂养', icon: '🤱' },
    { value: FEEDING_TYPES.MIXED, label: '混合喂养', icon: '🍼🤱' },
    { value: FEEDING_TYPES.FORMULA, label: '人工喂养', icon: '🍼' }
  ];
}

// 获取作息模板选项
function getScheduleTemplateOptions() {
  return [
    { id: 'newborn', name: '新生儿模式', label: '新生儿模式 (0-1月龄)', ageRange: '0-1月龄', intervalDesc: '2-3小时' },
    { id: 'stage1', name: '1-3月龄模式', label: '1-3月龄模式', ageRange: '1-3月龄', intervalDesc: '3小时' },
    { id: 'stage2', name: '3-6月龄模式', label: '3-6月龄模式', ageRange: '3-6月龄', intervalDesc: '3.5小时' },
    { id: 'stage3', name: '6-12月龄模式', label: '6-12月龄模式', ageRange: '6-12月龄', intervalDesc: '4小时' },
    { id: 'stage4', name: '12月龄+模式', label: '12月龄+模式', ageRange: '12月龄+', intervalDesc: '5-6小时' }
  ];
}

// 评估今日喂养是否达标
function assessTodayFeeding(birthDate, feedingType, todayRecords) {
  const plan = getFeedingPlan(birthDate, feedingType);
  const count = todayRecords.length;
  const totalAmount = todayRecords.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
  
  const assessment = {
    countStatus: count >= plan.minTimes ? '达标' : count >= plan.minTimes - 1 ? '接近' : '不足',
    countMessage: `今日喂养${count}次，建议${plan.minTimes}-${plan.maxTimes}次`,
    milkStatus: '正常', milkMessage: '', overallStatus: '良好', suggestions: []
  };
  
  if (feedingType !== FEEDING_TYPES.BREASTFEEDING && plan.milkAmount !== '按需') {
    const milkMatch = plan.milkAmount.match(/(\d+)-(\d+)/);
    if (milkMatch) {
      const min = parseInt(milkMatch[1]);
      const max = parseInt(milkMatch[2]);
      
      if (totalAmount < min) {
        assessment.milkStatus = '不足';
        assessment.milkMessage = `今日奶量${totalAmount}ml，建议${plan.milkAmount}`;
        assessment.suggestions.push('奶量偏少，建议增加单次喂养量或次数');
      } else if (totalAmount > max) {
        assessment.milkStatus = '偏多';
        assessment.milkMessage = `今日奶量${totalAmount}ml，建议${plan.milkAmount}`;
        assessment.suggestions.push('奶量偏多，注意避免过度喂养');
      } else {
        assessment.milkStatus = '正常';
        assessment.milkMessage = `今日奶量${totalAmount}ml，符合建议范围`;
      }
    }
  }
  
  if (count < plan.minTimes) {
    assessment.overallStatus = '需关注';
    assessment.suggestions.push(`喂养次数偏少，建议每日${plan.minTimes}-${plan.maxTimes}次`);
  } else if (count > plan.maxTimes) {
    assessment.overallStatus = '需关注';
    assessment.suggestions.push(`喂养次数偏多，建议控制在${plan.maxTimes}次以内`);
  }
  
  return assessment;
}

module.exports = {
  FEEDING_TYPES, FEEDING_TYPE_NAMES, FEEDING_TYPE_SHORT, FEEDING_GUIDE,
  FEEDING_PLANS, DEFAULT_SCHEDULE_TEMPLATES,
  calculateAgeDays, getAgeDisplay, getFeedingPlan, getLatestGrowthStatus, getRecommendedInterval,
  getFoodStatus, getFlexibleSchedule, getScheduleTemplateList, getScheduleByTemplate,
  getNextFeedReminder, getFeedingTypeOptions, getScheduleTemplateOptions,
  assessTodayFeeding, isNightTime
};
