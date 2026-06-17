const { getData, getAssessmentRecords, STORAGE_KEYS } = require('../../utils/storage');
const { getStatistics, getChartData, getFeedingIntervalAnalysis } = require('../../utils/charts');
const { getFeedingPlan, getLatestGrowthStatus } = require('../../utils/feedingPlan');

Page({
  data: {
    // 周期选择
    currentPeriod: 'today',
    periods: [
      { value: 'today', label: '今日' },
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' }
    ],
    
    // 统计数据
    statistics: {
      totalAmount: 0,
      totalCount: 0,
      avgAmount: 0,
      avgCountPerDay: 0
    },
    
    // 图表数据
    chartData: [],
    maxAmount: 1,
    
    // 间隔分析
    intervalAnalysis: {
      avgInterval: 0,
      intervals: []
    },
    
    // 喂养建议
    suggestions: [],
    
    // 宝宝信息
    babyInfo: {}
  },

  onLoad() {
    this.loadBabyInfo();
    this.loadStatistics();
    this.loadChartData();
    this.loadIntervalAnalysis();
  },

  onShow() {
    this.loadBabyInfo();
    this.loadStatistics();
    this.loadChartData();
    this.loadIntervalAnalysis();
  },

  // 加载宝宝信息
  loadBabyInfo() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO) || {};
    this.setData({ babyInfo });
  },

  // 切换周期
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ currentPeriod: period });
    this.loadStatistics();
    this.loadChartData();
  },

  // 加载统计数据
  loadStatistics() {
    const stats = getStatistics(this.data.currentPeriod);
    this.setData({ statistics: stats });
    this.generateSuggestions();
  },

  // 加载图表数据
  loadChartData() {
    const days = this.data.currentPeriod === 'today' ? 1 : 
                 this.data.currentPeriod === 'week' ? 7 : 30;
    const chartData = getChartData(days);
    
    this.setData({
      chartData: chartData.chartData,
      maxAmount: chartData.maxAmount
    });
  },

  // 加载间隔分析
  loadIntervalAnalysis() {
    const analysis = getFeedingIntervalAnalysis();
    this.setData({ intervalAnalysis: analysis });
  },

  // 生成喂养建议
  generateSuggestions() {
    const { statistics, babyInfo, currentPeriod } = this.data;
    const suggestions = [];
    
    if (!babyInfo.birthDate) {
      suggestions.push('请先在设置页填写宝宝信息，获取个性化建议');
      this.setData({ suggestions });
      return;
    }

    const settings = getData(STORAGE_KEYS.SETTINGS) || {};
    const feedingType = settings.feedingType || 'breastfeeding';
    const assessmentRecords = getAssessmentRecords() || [];
    const growthStatus = getLatestGrowthStatus(assessmentRecords);
    const feedingPlan = getFeedingPlan(babyInfo.birthDate, feedingType, {
      gender: babyInfo.gender,
      growthStatus
    });
    
    // 根据奶量给出建议
    if (statistics.avgAmount > 0) {
      if (feedingPlan.milkAmount !== '按需') {
        const milkMatch = feedingPlan.milkAmount.match(/(\d+)-(\d+)/);
        if (milkMatch) {
          const minAmount = parseInt(milkMatch[1]);
          const maxAmount = parseInt(milkMatch[2]);
          
          if (statistics.avgAmount < minAmount) {
            suggestions.push(`单次奶量偏少，建议每次${feedingPlan.perFeedAmount}`);
          } else if (statistics.avgAmount > maxAmount / feedingPlan.minTimes) {
            suggestions.push('单次奶量偏多，注意避免过度喂养');
          }
        }
      }
    }
    
    // 根据喂养次数给出建议
    if (currentPeriod === 'today' && statistics.totalCount > 0) {
      if (statistics.totalCount < feedingPlan.minTimes) {
        suggestions.push(`今日喂养次数偏少，建议每日${feedingPlan.minTimes}-${feedingPlan.maxTimes}次`);
      } else if (statistics.totalCount > feedingPlan.maxTimes) {
        suggestions.push(`今日喂养次数偏多，建议控制在${feedingPlan.maxTimes}次以内`);
      }
    }
    
    // 根据间隔给出建议
    if (this.data.intervalAnalysis.avgInterval > 0) {
      const avgInterval = this.data.intervalAnalysis.avgInterval;
      if (avgInterval < feedingPlan.interval - 30) {
        suggestions.push('喂养间隔较短，可适当延长');
      } else if (avgInterval > feedingPlan.interval + 60) {
        suggestions.push('喂养间隔较长，注意宝宝饥饿信号');
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('喂养情况良好，继续保持！');
    }
    
    this.setData({ suggestions });
  }
});
