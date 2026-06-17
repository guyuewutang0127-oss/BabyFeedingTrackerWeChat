const { addAssessmentRecord, getData, STORAGE_KEYS } = require('../../utils/storage');
const { assessGrowth, getAgeInMonths } = require('../../utils/growthTracker');

Page({
  data: {
    // 宝宝信息
    babyInfo: {},
    
    // 评估月龄
    ageMonths: 1,
    ageOptions: [1, 3, 6, 8, 12, 18, 24, 30, 36],
    
    // 表单数据
    assessmentDate: '',
    height: '',
    weight: '',
    feedingMethod: 'breastfeeding',
    dailyFeedCount: '',
    dailyMilkAmount: '',
    maxPerFeed: '',
    foodSupplement: [],
    sleepStatus: '',
    poopStatus: '',
    
    // 选项
    feedingMethodOptions: [
      { value: 'breastfeeding', label: '纯母乳' },
      { value: 'formula', label: '纯奶粉' },
      { value: 'mixed', label: '混合喂养' }
    ],
    foodOptions: [
      { value: 'rice', label: '米粉/米糊' },
      { value: 'vegetable', label: '蔬菜泥' },
      { value: 'fruit', label: '水果泥' },
      { value: 'meat', label: '肉泥/肝泥' },
      { value: 'egg', label: '蛋黄/蛋羹' },
      { value: 'noodle', label: '面条/粥' }
    ],
    
    // 评估结果
    assessmentResult: null,
    showResult: false,
    
    // 错误
    errors: {}
  },

  onLoad(options) {
    this.loadBabyInfo();
    
    // 初始化日期为今天
    const today = new Date();
    this.setData({
      assessmentDate: this.formatDate(today)
    });
    
    // 如果有传入月龄，设置选中
    if (options.ageMonths) {
      const age = parseInt(options.ageMonths);
      this.setData({ ageMonths: age });
    } else {
      // 默认选中当前月龄最接近的节点
      this.setDefaultAge();
    }
  },

  // 加载宝宝信息
  loadBabyInfo() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO) || { name: '宝宝', birthDate: '', gender: 'boy' };
    this.setData({ babyInfo });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 设置默认月龄
  setDefaultAge() {
    const { babyInfo, ageOptions } = this.data;
    if (!babyInfo.birthDate) return;
    
    const currentAge = getAgeInMonths(babyInfo.birthDate);
    
    // 找到最接近且不超过当前月龄的节点
    let closestAge = ageOptions[0];
    for (const age of ageOptions) {
      if (age <= currentAge) {
        closestAge = age;
      }
    }
    
    this.setData({ ageMonths: closestAge });
  },

  // 月龄选择
  onAgeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ ageMonths: this.data.ageOptions[index] });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ assessmentDate: e.detail.value });
  },

  // 身高输入
  onHeightInput(e) {
    this.setData({ height: e.detail.value });
    this.clearError('height');
  },

  // 体重输入
  onWeightInput(e) {
    this.setData({ weight: e.detail.value });
    this.clearError('weight');
  },

  // 喂养方式选择
  onFeedingMethodChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ feedingMethod: this.data.feedingMethodOptions[index].value });
  },

  // 每日喂养次数
  onDailyFeedCountInput(e) {
    this.setData({ dailyFeedCount: e.detail.value });
  },

  // 日均总奶量
  onDailyMilkAmountInput(e) {
    this.setData({ dailyMilkAmount: e.detail.value });
  },

  // 单次最大奶量
  onMaxPerFeedInput(e) {
    this.setData({ maxPerFeed: e.detail.value });
  },

  // 辅食选择
  onFoodChange(e) {
    const values = e.detail.value;
    this.setData({ foodSupplement: values });
  },

  // 睡眠情况
  onSleepChange(e) {
    this.setData({ sleepStatus: e.detail.value });
  },

  // 排便情况
  onPoopChange(e) {
    this.setData({ poopStatus: e.detail.value });
  },

  // 清除错误
  clearError(field) {
    const errors = this.data.errors;
    delete errors[field];
    this.setData({ errors });
  },

  // 验证表单
  validateForm() {
    const errors = {};
    const { height, weight } = this.data;
    
    if (!height || parseFloat(height) <= 0) errors.height = '请输入身高';
    if (!weight || parseFloat(weight) <= 0) errors.weight = '请输入体重';
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 计算评估
  calculateAssessment() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }
    
    const { height, weight, babyInfo, ageMonths } = this.data;
    
    // 使用选中的月龄进行评估
    const gender = babyInfo.gender || 'boy';
    
    // 创建一个临时的出生日期来计算评估
    const now = new Date();
    const birthDate = new Date(now);
    birthDate.setMonth(birthDate.getMonth() - ageMonths);
    
    const result = assessGrowth(parseFloat(height), parseFloat(weight), birthDate.toISOString().split('T')[0], gender);
    
    if (result.error) {
      wx.showToast({ title: result.error, icon: 'none' });
      return;
    }
    
    // 构建完整的评估结果
    const assessmentResult = {
      ...result,
      assessmentDate: this.data.assessmentDate,
      monthAge: ageMonths,
      feeding: {
        method: this.data.feedingMethod,
        dailyCount: parseInt(this.data.dailyFeedCount) || 0,
        dailyAmount: parseInt(this.data.dailyMilkAmount) || 0,
        maxPerFeed: parseInt(this.data.maxPerFeed) || 0,
        foodSupplement: this.data.foodSupplement,
        sleepStatus: this.data.sleepStatus,
        poopStatus: this.data.poopStatus
      },
      // 根据月龄和喂养情况生成建议
      feedingSuggestion: this.generateFeedingSuggestion(ageMonths, this.data.feedingMethod, this.data.dailyMilkAmount),
      overallSuggestion: this.generateOverallSuggestion(result)
    };
    
    this.setData({
      assessmentResult,
      showResult: true
    });
  },

  // 生成喂养建议
  generateFeedingSuggestion(ageMonths, method, dailyAmount) {
    const amount = parseInt(dailyAmount) || 0;
    
    // 根据月龄判断奶量是否达标
    let status = '达标';
    let suggestion = '';
    
    if (ageMonths <= 1) {
      if (amount < 400) {
        status = '不足';
        suggestion = '奶量偏少，建议增加喂养次数或单次奶量';
      } else if (amount > 600) {
        status = '偏多';
        suggestion = '奶量偏多，注意避免过度喂养';
      } else {
        suggestion = '奶量充足，继续保持';
      }
    } else if (ageMonths <= 3) {
      if (amount < 600) {
        status = '不足';
        suggestion = '奶量偏少，建议增加喂养量';
      } else if (amount > 900) {
        status = '偏多';
        suggestion = '奶量偏多，可适当减少';
      } else {
        suggestion = '奶量适中，可适当延长夜间喂养间隔';
      }
    } else if (ageMonths <= 6) {
      if (amount < 750) {
        status = '不足';
        suggestion = '奶量偏少，6月龄后可开始添加辅食';
      } else {
        suggestion = '奶量充足，6月龄后可开始添加辅食';
      }
    } else {
      suggestion = '辅食为主，奶为辅，保证每日奶量400-600ml';
    }
    
    return { status, suggestion, actual: amount };
  },

  // 生成整体建议
  generateOverallSuggestion(result) {
    const suggestions = [];
    
    if (result.overallStatus === 'normal') {
      suggestions.push('宝宝生长发育良好，继续保持良好的喂养习惯。');
    } else if (result.overallStatus === 'malnutrition') {
      suggestions.push('营养状况需关注，建议咨询儿科医生。');
    } else if (result.overallStatus === 'overweight') {
      suggestions.push('注意控制体重增长，避免过度喂养。');
    }
    
    if (result.height.status.level !== 'normal') {
      suggestions.push('身高增长' + result.height.status.text + '，保证充足睡眠和营养。');
    }
    
    if (result.weight.status.level !== 'normal') {
      suggestions.push('体重增长' + result.weight.status.text + '，注意调整喂养量。');
    }
    
    return suggestions.join('');
  },

  // 保存评估
  saveAssessment() {
    const { assessmentResult, ageMonths } = this.data;
    
    if (!assessmentResult) {
      wx.showToast({ title: '请先进行评估', icon: 'none' });
      return;
    }
    
    const record = {
      ageMonths,
      measurements: assessmentResult.measurements,
      height: assessmentResult.height,
      weight: assessmentResult.weight,
      feeding: assessmentResult.feeding,
      feedingSuggestion: assessmentResult.feedingSuggestion,
      overallSuggestion: assessmentResult.overallSuggestion,
      overallStatus: assessmentResult.overallStatus
    };
    
    const success = addAssessmentRecord(record);
    
    if (success) {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 重新评估
  reAssess() {
    this.setData({
      showResult: false,
      assessmentResult: null
    });
  },

  // 取消
  cancel() {
    wx.navigateBack();
  }
});
