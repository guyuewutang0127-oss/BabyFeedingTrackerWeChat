/**
 * 图表数据统计工具
 */

const { getData, STORAGE_KEYS, formatDate } = require('./storage');

/**
 * 获取每日奶量数据
 */
function getDailyMilkData(days = 7) {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  const result = [];
  
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    const dayRecords = records.filter(r => r.date === dateStr);
    const totalAmount = dayRecords.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
    
    result.push({
      date: dateStr,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      amount: totalAmount,
      count: dayRecords.length
    });
  }
  
  return result;
}

/**
 * 获取统计数据
 */
function getStatistics(period = 'today') {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  const today = new Date();
  let filteredRecords = [];
  
  switch (period) {
    case 'today':
      const todayStr = formatDate(today);
      filteredRecords = records.filter(r => r.date === todayStr);
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredRecords = records.filter(r => new Date(r.date) >= weekAgo);
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      filteredRecords = records.filter(r => new Date(r.date) >= monthAgo);
      break;
  }
  
  const totalAmount = filteredRecords.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
  const totalCount = filteredRecords.length;
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  
  // 计算日均次数
  let avgCountPerDay = 0;
  if (period === 'week') {
    avgCountPerDay = Math.round(totalCount / 7 * 10) / 10;
  } else if (period === 'month') {
    avgCountPerDay = Math.round(totalCount / 30 * 10) / 10;
  }
  
  return {
    period,
    totalAmount,
    totalCount,
    avgAmount,
    avgCountPerDay
  };
}

/**
 * 获取喂养间隔分析
 */
function getFeedingIntervalAnalysis() {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  
  if (records.length < 2) {
    return { avgInterval: 0, intervals: [] };
  }
  
  const intervals = [];
  for (let i = 1; i < records.length; i++) {
    const prevTime = new Date(records[i - 1].startTime).getTime();
    const currTime = new Date(records[i].startTime).getTime();
    const interval = (currTime - prevTime) / (1000 * 60); // 分钟
    intervals.push(interval);
  }
  
  const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  
  return {
    avgInterval: Math.round(avgInterval),
    intervals: intervals.map(i => Math.round(i))
  };
}

/**
 * 获取图表数据
 */
function getChartData(days = 7) {
  const dailyData = getDailyMilkData(days);
  const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);
  
  return {
    dailyData,
    maxAmount,
    chartData: dailyData.map(d => ({
      ...d,
      height: maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0
    }))
  };
}

/**
 * 导出为CSV
 */
function exportToCSV() {
  const records = getData(STORAGE_KEYS.FEEDING_RECORDS) || [];
  const babyInfo = getData(STORAGE_KEYS.BABY_INFO);
  
  let csv = '\uFEFF'; // BOM for Excel
  csv += '宝宝喂养记录导出\n';
  csv += `宝宝姓名:,${babyInfo?.name || '宝宝'}\n`;
  csv += `导出时间:,${new Date().toLocaleString()}\n\n`;
  
  csv += '日期,时间,喂养类型,冲泡量(ml),实际奶量(ml),喂养时长(分钟),备注\n';
  
  const typeNames = { breastfeeding: '母乳', mixed: '混合', formula: '奶粉' };
  
  records.forEach(record => {
    const date = new Date(record.startTime);
    const dateStr = formatDate(date);
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const type = typeNames[record.feedingType] || '奶粉';
    
    csv += `${dateStr},${timeStr},${type},${record.preparedAmount || 0},${record.actualAmount || 0},${record.duration || 0},${record.note || ''}\n`;
  });
  
  return csv;
}

module.exports = {
  getDailyMilkData, getStatistics, getFeedingIntervalAnalysis, getChartData, exportToCSV
};
