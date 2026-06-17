/**
 * 自然语言解析工具
 * 解析喂养记录文本，支持单条或多条、补喝
 */

// 时间加减
function addMinutes(d, mins) {
  const t = new Date(d.getTime() + mins * 60 * 1000);
  return t;
}
function addHours(d, hours) {
  return addMinutes(d, hours * 60);
}

/**
 * 解析单段文本为一条记录（供多记录解析调用）
 * prevStartTime: 上一条的 startTime，用于「X小时后」「X分钟后」
 */
function parseOneSegment(text, prevStartTime) {
  const seg = text.trim();
  const result = {
    startTime: null,
    endTime: null,
    duration: 0,
    preparedAmount: 0,
    actualAmount: 0,
    feedingType: 'formula',
    note: '',
    isSupplement: false
  };

  // 补喝：又把剩的X喝了、过X分钟又喝了X、又喝了X
  const supplementMatch = seg.match(/(?:又把剩的|又喝了?|过\d+分钟又喝了?)\s*(\d+)\s*(ml|毫升|ML)?/i) || seg.match(/剩的\s*(\d+)\s*(ml|毫升)?\s*喝了?/i);
  if (supplementMatch && prevStartTime) {
    result.isSupplement = true;
    result.actualAmount = parseInt(supplementMatch[1], 10);
    result.preparedAmount = 0;
    const minsLater = seg.match(/(\d+)\s*分钟(?=后|又)/);
    const hoursLater = seg.match(/(\d+)\s*个?小时(?=后|又)/);
    if (minsLater) result.startTime = addMinutes(prevStartTime, parseInt(minsLater[1], 10));
    else if (hoursLater) result.startTime = addHours(prevStartTime, parseInt(hoursLater[1], 10));
    else result.startTime = addMinutes(prevStartTime, 10); // 默认 10 分钟后
    return result;
  }

  // 相对时间（本段）：X小时后、X分钟后（基于上一条时间）
  if (prevStartTime) {
    const hoursLater = seg.match(/(\d+)\s*个?小时\s*后/);
    const minsLater = seg.match(/(\d+)\s*分钟\s*后/);
    if (hoursLater) result.startTime = addHours(prevStartTime, parseInt(hoursLater[1], 10));
    else if (minsLater) result.startTime = addMinutes(prevStartTime, parseInt(minsLater[1], 10));
  }

  // 解析开始时间（绝对）
  const startTimeMatch = seg.match(/(上午|下午|晚上|凌晨)?\s*(\d{1,2})\s*[点:：]\s*(\d{1,2})?\s*[分]?\s*(开始|喂|喝)/);
  if (startTimeMatch) {
    const period = startTimeMatch[1];
    const hour = parseInt(startTimeMatch[2], 10);
    const minute = parseInt(startTimeMatch[3] || 0, 10);
    result.startTime = parseTime(period, hour, minute);
  }
  const endTimeMatch = seg.match(/(结束|喝完|完)\s*(\d{1,2})?\s*[点:：]?\s*(\d{1,2})?/);
  if (endTimeMatch && endTimeMatch[2]) {
    const hour = parseInt(endTimeMatch[2], 10);
    const minute = parseInt(endTimeMatch[3] || 0, 10);
    result.endTime = parseTime(null, hour, minute);
  }

  // 冲泡量
  let preparedMatch = seg.match(/(泡|冲|准备|倒了?)\s*(\d+)\s*(ml|毫升|ML)?/i);
  if (preparedMatch) result.preparedAmount = parseInt(preparedMatch[2], 10);
  if (result.preparedAmount === 0) {
    const m = seg.match(/(?:泡|冲|准备|倒)\s*了?\s*(\d+)/);
    if (m) result.preparedAmount = parseInt(m[1], 10);
  }
  // 实际奶量
  let actualMatch = seg.match(/(喝|吃|实际|剩|余)\s*了?\s*(\d+)\s*(ml|毫升|ML)?/i);
  if (actualMatch) {
    const keyword = actualMatch[1];
    const amount = parseInt(actualMatch[2], 10);
    if (keyword === '剩' || keyword === '余') result.actualAmount = Math.max(0, (result.preparedAmount || 0) - amount);
    else result.actualAmount = amount;
  }
  if (result.actualAmount === 0) {
    const m = seg.match(/(?:喂|喝|吃)\s*了?\s*(\d+)/);
    if (m) result.actualAmount = parseInt(m[1], 10);
  }
  const plainAmount = seg.match(/(\d+)\s*(ml|毫升|ML)/i);
  if (plainAmount && result.actualAmount === 0 && result.preparedAmount === 0) result.actualAmount = parseInt(plainAmount[1], 10);
  // 时长
  let durationMatch = seg.match(/(?:用时|持续|喂了?|吃了?|喝了?)\s*(\d+)\s*(分钟|分|min)/i);
  if (durationMatch) result.duration = parseInt(durationMatch[1], 10);
  if (result.duration === 0) {
    const m = seg.match(/(\d+)\s*(?:分钟|分)/);
    if (m) result.duration = parseInt(m[1], 10);
  }
  if (text.includes('母乳') || text.includes('亲喂')) result.feedingType = 'breastfeeding';
  else if (text.includes('混合')) result.feedingType = 'mixed';
  else if (text.includes('奶粉') || text.includes('配方')) result.feedingType = 'formula';

  if (!result.startTime) {
    const simpleTimeMatch = seg.match(/(\d{1,2})\s*[点:：]\s*(\d{1,2})?/);
    if (simpleTimeMatch) {
      const hour = parseInt(simpleTimeMatch[1], 10);
      const minute = parseInt(simpleTimeMatch[2] || 0, 10);
      result.startTime = parseTime(null, hour, minute);
    }
  }
  if (!result.startTime && /刚刚|刚才|刚喂|刚刚喂|才喂/.test(seg)) result.startTime = new Date(Date.now() - 10 * 60 * 1000);
  if (!result.startTime) {
    const minsAgo = seg.match(/(\d+)\s*分钟前/);
    const halfHour = seg.match(/半小时前/);
    const hoursAgo = seg.match(/(\d+)\s*小时前/);
    const now = Date.now();
    if (minsAgo) result.startTime = new Date(now - parseInt(minsAgo[1], 10) * 60 * 1000);
    else if (halfHour) result.startTime = new Date(now - 30 * 60 * 1000);
    else if (hoursAgo) result.startTime = new Date(now - parseInt(hoursAgo[1], 10) * 60 * 60 * 1000);
  }
  if (result.actualAmount === 0 && result.preparedAmount > 0) result.actualAmount = result.preparedAmount;
  return result;
}

/**
 * 解析喂养记录文本（支持多条、补喝）
 * 返回 { success, records: [ { startTime, duration, preparedAmount, actualAmount, feedingType, note, isSupplement }, ... ] }
 */
function parseFeedingText(text) {
  if (!text || !text.trim()) {
    return { success: false, error: '请输入文本内容', records: [] };
  }
  const segments = text.split(/[，,；;]\s*|然后|接着/).map(s => s.trim()).filter(Boolean);
  const records = [];
  let prevStartTime = null;
  for (const seg of segments) {
    const one = parseOneSegment(seg, prevStartTime);
    if (one.startTime || one.actualAmount > 0) {
      records.push(one);
      if (one.startTime) prevStartTime = one.startTime;
    }
  }
  if (records.length === 0) {
    const one = parseOneSegment(text, null);
    if (one.startTime || one.actualAmount > 0) records.push(one);
  }
  const success = records.length > 0;
  return {
    success,
    records,
    data: records[0] || null,
    parsed: success ? {
      hasStartTime: !!records[0].startTime,
      hasEndTime: !!records[0].endTime,
      hasPreparedAmount: (records[0].preparedAmount || 0) > 0,
      hasActualAmount: (records[0].actualAmount || 0) > 0,
      hasDuration: (records[0].duration || 0) > 0,
      hasFeedingType: records[0].feedingType !== 'formula'
    } : {}
  };
}

/**
 * 解析时间
 */
function parseTime(period, hour, minute) {
  const now = new Date();
  let adjustedHour = hour;
  
  if (period === '下午' && hour < 12) adjustedHour += 12;
  if (period === '凌晨' && hour >= 12) adjustedHour -= 12;
  if (period === '上午' && hour === 12) adjustedHour = 0;
  
  // 如果解析的时间在未来，假设是昨天
  if (adjustedHour > now.getHours() || (adjustedHour === now.getHours() && minute > now.getMinutes())) {
    now.setDate(now.getDate() - 1);
  }
  
  now.setHours(adjustedHour, minute, 0, 0);
  return now;
}

/**
 * 格式化时间
 */
function formatTime(date) {
  if (!date) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 获取解析示例
 */
function getParseExamples() {
  return [
    '下午3点开始喂，泡了120ml，喝了100ml，用了20分钟',
    '晚上8点喂奶粉，冲了150ml，剩了30ml',
    '上午10点亲喂，喂了25分钟',
    '凌晨2点混合喂养，先母乳10分钟，又喝了60ml奶粉'
  ];
}

/**
 * 格式化单条解析结果（用于展示）
 */
function formatParseResult(result) {
  if (!result || !result.success) return '未能识别有效信息';
  const records = result.records || (result.data ? [result.data] : []);
  if (records.length === 0) return '未能识别有效信息';
  return records.map((r, i) => {
    if (r.isSupplement) return `[补喝] ${formatTime(r.startTime)} 奶量${r.actualAmount}ml`;
    const parts = [];
    if (r.startTime) parts.push(formatTime(r.startTime));
    if (r.preparedAmount > 0) parts.push(`泡${r.preparedAmount}ml`);
    if (r.actualAmount > 0) parts.push(`喝${r.actualAmount}ml`);
    if (r.duration > 0) parts.push(`${r.duration}分钟`);
    return parts.join(' ');
  }).join('；');
}

/**
 * 使用本地小模型解析口语化表达（可选）
 * 返回 Promise<{ success, records }>，与 parseFeedingText 一致
 */
function parseFeedingTextWithModel(text, apiBase) {
  const ruleResult = parseFeedingText(text);
  const base = apiBase ? String(apiBase).trim().replace(/\/$/, '') : '';
  if (!base) return Promise.resolve(ruleResult);

  return new Promise((resolve) => {
    wx.request({
      url: base + '/parse',
      method: 'POST',
      data: { text },
      timeout: 20000,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode !== 200 || !res.data || !res.data.success) {
          resolve(ruleResult);
          return;
        }
        const d = res.data.data;
        if (!d) {
          resolve(ruleResult);
          return;
        }
        const startTime = d.startTime ? new Date(d.startTime) : null;
        const data = {
          startTime,
          endTime: d.endTime ? new Date(d.endTime) : null,
          duration: Math.max(0, parseInt(d.duration, 10) || 0),
          preparedAmount: Math.max(0, parseInt(d.preparedAmount, 10) || 0),
          actualAmount: Math.max(0, parseInt(d.actualAmount, 10) || 0),
          feedingType: ['breastfeeding', 'mixed', 'formula'].includes(d.feedingType) ? d.feedingType : 'formula',
          note: d.note || '',
          isSupplement: !!d.isSupplement
        };
        if (data.actualAmount === 0 && data.preparedAmount > 0) data.actualAmount = data.preparedAmount;
        const hasValid = data.startTime || data.actualAmount > 0;
        resolve({
          success: hasValid,
          records: [data],
          data,
          parsed: {
            hasStartTime: !!data.startTime,
            hasEndTime: !!data.endTime,
            hasPreparedAmount: data.preparedAmount > 0,
            hasActualAmount: data.actualAmount > 0,
            hasDuration: data.duration > 0,
            hasFeedingType: data.feedingType !== 'formula'
          }
        });
      },
      fail: () => resolve(ruleResult)
    });
  });
}

module.exports = {
  parseFeedingText, parseFeedingTextWithModel, formatTime, getParseExamples, formatParseResult
};
