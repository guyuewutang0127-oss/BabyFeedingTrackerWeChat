/**
 * 生长发育追踪工具
 * WHO儿童生长标准2006（0-36月龄）
 */

// 年龄别身高标准（cm）
const HEIGHT_STANDARDS = {
  0: { boy: { m2: 46.8, m1: 48.6, median: 50.4, p1: 52.2, p2: 54.0 }, girl: { m2: 46.1, m1: 47.9, median: 49.7, p1: 51.5, p2: 53.3 } },
  1: { boy: { m2: 51.5, m1: 53.3, median: 55.1, p1: 56.9, p2: 58.7 }, girl: { m2: 50.5, m1: 52.3, median: 54.1, p1: 55.9, p2: 57.7 } },
  2: { boy: { m2: 55.1, m1: 57.1, median: 59.1, p1: 61.1, p2: 63.1 }, girl: { m2: 54.0, m1: 56.0, median: 58.0, p1: 60.0, p2: 62.0 } },
  3: { boy: { m2: 58.8, m1: 60.9, median: 63.0, p1: 65.1, p2: 67.2 }, girl: { m2: 57.5, m1: 59.6, median: 61.7, p1: 63.8, p2: 65.9 } },
  4: { boy: { m2: 61.6, m1: 63.8, median: 66.0, p1: 68.2, p2: 70.4 }, girl: { m2: 60.3, m1: 62.4, median: 64.5, p1: 66.6, p2: 68.7 } },
  5: { boy: { m2: 63.8, m1: 66.0, median: 68.2, p1: 70.4, p2: 72.6 }, girl: { m2: 62.2, m1: 64.3, median: 66.4, p1: 68.5, p2: 70.6 } },
  6: { boy: { m2: 65.4, m1: 67.8, median: 70.2, p1: 72.6, p2: 75.0 }, girl: { m2: 63.8, m1: 66.2, median: 68.6, p1: 71.0, p2: 73.4 } },
  7: { boy: { m2: 67.1, m1: 69.5, median: 71.9, p1: 74.3, p2: 76.7 }, girl: { m2: 65.4, m1: 67.8, median: 70.2, p1: 72.6, p2: 75.0 } },
  8: { boy: { m2: 68.7, m1: 71.2, median: 73.7, p1: 76.2, p2: 78.7 }, girl: { m2: 66.9, m1: 69.4, median: 71.9, p1: 74.4, p2: 76.9 } },
  9: { boy: { m2: 70.1, m1: 72.7, median: 75.3, p1: 77.9, p2: 80.5 }, girl: { m2: 68.4, m1: 70.9, median: 73.4, p1: 75.9, p2: 78.4 } },
  10: { boy: { m2: 71.5, m1: 74.2, median: 76.9, p1: 79.6, p2: 82.3 }, girl: { m2: 69.7, m1: 72.3, median: 74.9, p1: 77.5, p2: 80.1 } },
  11: { boy: { m2: 72.9, m1: 75.7, median: 78.5, p1: 81.3, p2: 84.1 }, girl: { m2: 71.1, m1: 73.7, median: 76.3, p1: 78.9, p2: 81.5 } },
  12: { boy: { m2: 74.3, m1: 77.2, median: 80.1, p1: 83.0, p2: 85.9 }, girl: { m2: 72.5, m1: 75.4, median: 78.3, p1: 81.2, p2: 84.1 } },
  15: { boy: { m2: 77.2, m1: 80.0, median: 82.8, p1: 85.6, p2: 88.4 }, girl: { m2: 75.2, m1: 78.1, median: 81.0, p1: 83.9, p2: 86.8 } },
  18: { boy: { m2: 79.6, m1: 82.9, median: 86.2, p1: 89.5, p2: 92.8 }, girl: { m2: 77.8, m1: 81.1, median: 84.4, p1: 87.7, p2: 91.0 } },
  21: { boy: { m2: 81.8, m1: 85.3, median: 88.8, p1: 92.3, p2: 95.8 }, girl: { m2: 80.0, m1: 83.5, median: 87.0, p1: 90.5, p2: 94.0 } },
  24: { boy: { m2: 84.0, m1: 87.6, median: 91.2, p1: 94.8, p2: 98.4 }, girl: { m2: 82.3, m1: 85.9, median: 89.5, p1: 93.1, p2: 96.7 } },
  27: { boy: { m2: 85.9, m1: 89.7, median: 93.5, p1: 97.3, p2: 101.1 }, girl: { m2: 84.2, m1: 88.0, median: 91.8, p1: 95.6, p2: 99.4 } },
  30: { boy: { m2: 87.8, m1: 91.7, median: 95.6, p1: 99.5, p2: 103.4 }, girl: { m2: 86.1, m1: 90.0, median: 93.9, p1: 97.8, p2: 101.7 } },
  33: { boy: { m2: 89.5, m1: 93.6, median: 97.7, p1: 101.8, p2: 105.9 }, girl: { m2: 87.8, m1: 91.9, median: 96.0, p1: 100.1, p2: 104.2 } },
  36: { boy: { m2: 91.2, m1: 95.4, median: 99.6, p1: 103.8, p2: 108.0 }, girl: { m2: 89.5, m1: 93.7, median: 97.9, p1: 102.1, p2: 106.3 } }
};

// 年龄别体重标准（kg）
const WEIGHT_STANDARDS = {
  0: { boy: { m2: 2.4, m1: 2.9, median: 3.4, p1: 3.9, p2: 4.4 }, girl: { m2: 2.3, m1: 2.8, median: 3.3, p1: 3.8, p2: 4.3 } },
  1: { boy: { m2: 3.4, m1: 4.0, median: 4.6, p1: 5.2, p2: 5.8 }, girl: { m2: 3.2, m1: 3.8, median: 4.4, p1: 5.0, p2: 5.6 } },
  2: { boy: { m2: 4.2, m1: 4.9, median: 5.6, p1: 6.3, p2: 7.0 }, girl: { m2: 3.9, m1: 4.6, median: 5.3, p1: 6.0, p2: 6.7 } },
  3: { boy: { m2: 5.0, m1: 5.8, median: 6.6, p1: 7.4, p2: 8.2 }, girl: { m2: 4.6, m1: 5.4, median: 6.2, p1: 7.0, p2: 7.8 } },
  4: { boy: { m2: 5.6, m1: 6.5, median: 7.4, p1: 8.3, p2: 9.2 }, girl: { m2: 5.2, m1: 6.1, median: 7.0, p1: 7.9, p2: 8.8 } },
  5: { boy: { m2: 6.0, m1: 7.0, median: 8.0, p1: 9.0, p2: 10.0 }, girl: { m2: 5.6, m1: 6.6, median: 7.6, p1: 8.6, p2: 9.6 } },
  6: { boy: { m2: 6.4, m1: 7.5, median: 8.6, p1: 9.7, p2: 10.8 }, girl: { m2: 5.8, m1: 6.9, median: 8.0, p1: 9.1, p2: 10.2 } },
  7: { boy: { m2: 6.8, m1: 7.9, median: 9.0, p1: 10.1, p2: 11.2 }, girl: { m2: 6.2, m1: 7.3, median: 8.4, p1: 9.5, p2: 10.6 } },
  8: { boy: { m2: 7.1, m1: 8.3, median: 9.5, p1: 10.7, p2: 11.9 }, girl: { m2: 6.5, m1: 7.6, median: 8.7, p1: 9.8, p2: 10.9 } },
  9: { boy: { m2: 7.4, m1: 8.6, median: 9.8, p1: 11.0, p2: 12.2 }, girl: { m2: 6.7, m1: 7.9, median: 9.1, p1: 10.3, p2: 11.5 } },
  10: { boy: { m2: 7.6, m1: 8.9, median: 10.2, p1: 11.5, p2: 12.8 }, girl: { m2: 7.0, m1: 8.2, median: 9.4, p1: 10.6, p2: 11.8 } },
  11: { boy: { m2: 7.9, m1: 9.2, median: 10.5, p1: 11.8, p2: 13.1 }, girl: { m2: 7.2, m1: 8.5, median: 9.8, p1: 11.1, p2: 12.4 } },
  12: { boy: { m2: 8.1, m1: 9.5, median: 10.9, p1: 12.3, p2: 13.7 }, girl: { m2: 7.5, m1: 8.8, median: 10.1, p1: 11.4, p2: 12.7 } },
  15: { boy: { m2: 8.6, m1: 10.1, median: 11.6, p1: 13.1, p2: 14.6 }, girl: { m2: 8.0, m1: 9.5, median: 11.0, p1: 12.5, p2: 14.0 } },
  18: { boy: { m2: 9.1, m1: 10.7, median: 12.3, p1: 13.9, p2: 15.5 }, girl: { m2: 8.5, m1: 10.0, median: 11.5, p1: 13.0, p2: 14.5 } },
  21: { boy: { m2: 9.6, m1: 11.3, median: 13.0, p1: 14.7, p2: 16.4 }, girl: { m2: 9.0, m1: 10.6, median: 12.2, p1: 13.8, p2: 15.4 } },
  24: { boy: { m2: 10.0, m1: 11.8, median: 13.6, p1: 15.4, p2: 17.2 }, girl: { m2: 9.4, m1: 11.1, median: 12.8, p1: 14.5, p2: 16.2 } },
  27: { boy: { m2: 10.4, m1: 12.3, median: 14.2, p1: 16.1, p2: 18.0 }, girl: { m2: 9.8, m1: 11.6, median: 13.4, p1: 15.2, p2: 17.0 } },
  30: { boy: { m2: 10.8, m1: 12.7, median: 14.6, p1: 16.5, p2: 18.4 }, girl: { m2: 10.2, m1: 12.1, median: 14.0, p1: 15.9, p2: 17.8 } },
  33: { boy: { m2: 11.2, m1: 13.2, median: 15.2, p1: 17.2, p2: 19.2 }, girl: { m2: 10.6, m1: 12.5, median: 14.4, p1: 16.3, p2: 18.2 } },
  36: { boy: { m2: 11.6, m1: 13.6, median: 15.6, p1: 17.6, p2: 19.6 }, girl: { m2: 11.0, m1: 13.0, median: 15.0, p1: 17.0, p2: 19.0 } }
};

// 关键月龄评估节点
const KEY_ASSESSMENT_AGES = [1, 3, 6, 8, 12, 18, 24, 30, 36];

// 计算月龄
function getAgeInMonths(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  return Math.max(0, months);
}

// 获取最接近的标准月龄
function getNearestMonth(ageMonths) {
  const availableMonths = Object.keys(HEIGHT_STANDARDS).map(Number).sort((a, b) => a - b);
  let nearest = availableMonths[0];
  let minDiff = Math.abs(ageMonths - nearest);
  
  for (const month of availableMonths) {
    const diff = Math.abs(ageMonths - month);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = month;
    }
  }
  return nearest;
}

// 计算Z评分
function calculateZScore(value, median, sd) {
  return (value - median) / sd;
}

// 获取标准差
function getSD(standard, month, gender) {
  const data = standard[month][gender];
  return (data.median - data.m2) / 2;
}

// 评估体格测量（增强版）
function assessGrowth(height, weight, birthDate, gender) {
  const ageMonths = getAgeInMonths(birthDate);
  const nearestMonth = getNearestMonth(ageMonths);
  const genderKey = gender === 'girl' ? 'girl' : 'boy';
  
  const heightStd = HEIGHT_STANDARDS[nearestMonth]?.[genderKey];
  const weightStd = WEIGHT_STANDARDS[nearestMonth]?.[genderKey];
  
  if (!heightStd || !weightStd) {
    return { error: '无法获取标准数据' };
  }
  
  const heightSD = getSD(HEIGHT_STANDARDS, nearestMonth, genderKey);
  const heightZScore = calculateZScore(height, heightStd.median, heightSD);
  
  const weightSD = getSD(WEIGHT_STANDARDS, nearestMonth, genderKey);
  const weightZScore = calculateZScore(weight, weightStd.median, weightSD);
  
  const heightInM = height / 100;
  const bmi = weight / (heightInM * heightInM);
  
  const result = {
    ageMonths, nearestMonth, gender: genderKey,
    measurements: { height, weight, bmi: bmi.toFixed(1) },
    
    height: {
      value: height, median: heightStd.median, zScore: heightZScore.toFixed(2),
      status: getStatusByZScore(heightZScore), percent: getPercentile(heightZScore)
    },
    
    weight: {
      value: weight, median: weightStd.median, zScore: weightZScore.toFixed(2),
      status: getStatusByZScore(weightZScore), percent: getPercentile(weightZScore)
    },
    
    overallStatus: 'normal', recommendations: []
  };
  
  // 评估建议
  if (heightZScore < -2 || weightZScore < -2) {
    result.overallStatus = 'malnutrition';
    result.recommendations.push('营养状况需关注，建议咨询医生');
  } else if (heightZScore > 2 || weightZScore > 2) {
    result.overallStatus = 'overweight';
    result.recommendations.push('注意控制体重增长，避免过度喂养');
  }
  
  if (heightZScore < -1) {
    result.recommendations.push('身高增长偏慢，保证充足睡眠和营养');
  }
  
  if (weightZScore < -1) {
    result.recommendations.push('体重增长偏慢，注意增加奶量');
  }
  
  return result;
}

// 根据Z评分获取状态
function getStatusByZScore(zScore) {
  if (zScore < -3) return { level: 'severe', text: '重度偏低', color: '#FF4D4F' };
  if (zScore < -2) return { level: 'moderate', text: '中度偏低', color: '#FAAD14' };
  if (zScore < -1) return { level: 'mild', text: '轻度偏低', color: '#FAAD14' };
  if (zScore <= 1) return { level: 'normal', text: '正常', color: '#52C41A' };
  if (zScore <= 2) return { level: 'mildHigh', text: '轻度偏高', color: '#FAAD14' };
  if (zScore <= 3) return { level: 'moderateHigh', text: '中度偏高', color: '#FAAD14' };
  return { level: 'severeHigh', text: '重度偏高', color: '#FF4D4F' };
}

// 获取百分位
function getPercentile(zScore) {
  if (zScore <= -2) return '<3';
  if (zScore <= -1) return '3-15';
  if (zScore <= 0) return '15-50';
  if (zScore <= 1) return '50-85';
  if (zScore <= 2) return '85-97';
  return '>97';
}

// 获取下次评估时间
function getNextAssessmentDate(birthDate) {
  const ageMonths = getAgeInMonths(birthDate);
  const nextAge = KEY_ASSESSMENT_AGES.find(age => age > ageMonths);
  
  if (!nextAge) return null;
  
  const birth = new Date(birthDate);
  const nextDate = new Date(birth);
  nextDate.setMonth(birth.getMonth() + nextAge);
  
  const daysToNext = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return { nextAge, nextDate: nextDate.toISOString().split('T')[0], daysToNext, shouldRemind: daysToNext <= 7 };
}

module.exports = {
  HEIGHT_STANDARDS, WEIGHT_STANDARDS, KEY_ASSESSMENT_AGES,
  getAgeInMonths, assessGrowth, getNextAssessmentDate, getStatusByZScore
};
