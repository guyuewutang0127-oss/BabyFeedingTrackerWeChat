const { 
  getFeedingPlanSchedule, saveFeedingPlanSchedule, 
  getLastFeedingTimeYesterday,
  getData, STORAGE_KEYS 
} = require('../../utils/storage');
const { 
  getFlexibleSchedule, getScheduleTemplateList, getScheduleByTemplate 
} = require('../../utils/feedingPlan');

// 时间加分钟，返回 "HH:MM"（可跨天）
function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// 根据第一顿时间与各顿间隔，重算整表 targetTime
function recalcScheduleTargetTimes(schedule) {
  const list = schedule.schedule;
  if (!list || list.length === 0) return;
  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1];
    const interval = typeof prev.interval === 'number' ? prev.interval : 180;
    list[i].targetTime = addMinutes(prev.targetTime, interval);
  }
}

// 确保每项有 interval（缺则用与下一顿的时间差推算）
function ensureIntervals(schedule) {
  const list = schedule.schedule;
  if (!list || list.length === 0) return;
  for (let i = 0; i < list.length; i++) {
    if (typeof list[i].interval === 'number') continue;
    if (i < list.length - 1) {
      const [h1, m1] = list[i].targetTime.split(':').map(Number);
      const [h2, m2] = list[i + 1].targetTime.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff <= 0) diff += 24 * 60;
      list[i].interval = diff;
    } else {
      list[i].interval = 180;
    }
  }
}

Page({
  data: {
    // 时间表数据
    schedule: null,
    hasSchedule: false,
    
    // 模板列表
    templateList: [],
    
    // 编辑模式
    isEditing: false,
    editingItem: null,
    editIndex: -1,
    
    // 表单数据（第一顿编辑时间，其余编辑间隔；预计时间由计算得出）
    formData: {
      name: '',
      targetTime: '',
      interval: 180,
      targetAmount: '',
      type: 'formula',
      note: ''
    },
    
    // 类型选项
    typeOptions: [
      { value: 'breastfeeding', label: '母乳' },
      { value: 'mixed', label: '混合' },
      { value: 'formula', label: '奶粉' }
    ],
    typeIndex: 0
  },

  onLoad() {
    this.loadSchedule();
    this.loadTemplateList();
  },

  onShow() {
    this.loadSchedule();
  },

  // 加载时间表（确保每项有 interval，用于“上一顿+间隔=下一顿”计算）
  loadSchedule() {
    const babyInfo = getData(STORAGE_KEYS.BABY_INFO);
    let schedule = getFeedingPlanSchedule();
    
    if (!schedule && babyInfo && babyInfo.birthDate) {
      schedule = getFlexibleSchedule(babyInfo.birthDate);
      saveFeedingPlanSchedule(schedule);
    }
    if (schedule && schedule.schedule) {
      ensureIntervals(schedule);
    }
    const lastYesterday = getLastFeedingTimeYesterday();
    this.setData({
      schedule,
      hasSchedule: !!schedule,
      lastYesterdayTime: lastYesterday.time,
      hasLastYesterday: lastYesterday.hasRecord
    });
  },

  // 用昨日最后一顿时间更新今日参考时间（第一顿时间可动态调整）
  syncFirstTimeFromYesterday() {
    const last = getLastFeedingTimeYesterday();
    if (!last.hasRecord) {
      wx.showToast({ title: '昨日无喂养记录', icon: 'none' });
      return;
    }
    const schedule = this.data.schedule;
    if (!schedule || !schedule.schedule || schedule.schedule.length === 0) {
      wx.showToast({ title: '请先添加时间表', icon: 'none' });
      return;
    }
    schedule.schedule[0].targetTime = last.time;
    recalcScheduleTargetTimes(schedule);
    saveFeedingPlanSchedule(schedule);
    this.setData({ schedule });
    wx.showToast({ title: '已同步为 ' + last.time, icon: 'success' });
  },

  // 加载模板列表
  loadTemplateList() {
    const list = getScheduleTemplateList();
    this.setData({ templateList: list });
  },

  // 选择模板
  selectTemplate(e) {
    const templateKey = e.currentTarget.dataset.key;
    const schedule = getScheduleByTemplate(templateKey);
    
    if (schedule) {
      saveFeedingPlanSchedule(schedule);
      this.setData({
        schedule,
        hasSchedule: true
      });
      wx.showToast({ title: '模板已应用', icon: 'success' });
    }
  },

  // 添加喂养时间（预计时间 = 上一顿时间 + 上一顿间隔，由计算得出）
  addFeedTime() {
    const list = this.data.schedule.schedule;
    const last = list[list.length - 1];
    const nextTime = last ? addMinutes(last.targetTime, last.interval || 180) : '08:00';
    const typeIndex = this.data.typeOptions.findIndex(o => o.value === 'formula');
    this.setData({
      isEditing: true,
      editIndex: -1,
      formData: {
        name: '',
        targetTime: nextTime,
        interval: 180,
        targetAmount: '120',
        type: 'formula',
        note: ''
      },
      typeIndex: typeIndex >= 0 ? typeIndex : 0
    });
  },

  // 编辑喂养时间（第一顿编辑时间，其余项预计时间只读；均编辑“与下一顿间隔”）
  editFeedTime(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.schedule.schedule[index];
    const typeIndex = this.data.typeOptions.findIndex(o => o.value === item.type);
    this.setData({
      isEditing: true,
      editIndex: index,
      formData: {
        name: item.name,
        targetTime: item.targetTime,
        interval: typeof item.interval === 'number' ? item.interval : 180,
        targetAmount: String(item.targetAmount),
        type: item.type,
        note: item.note || ''
      },
      typeIndex: typeIndex >= 0 ? typeIndex : 0
    });
  },

  // 删除喂养时间
  deleteFeedTime(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个喂养时间吗？',
      success: (res) => {
        if (res.confirm) {
          const schedule = this.data.schedule;
          schedule.schedule.splice(index, 1);
          
          // 重新生成ID
          schedule.schedule.forEach((item, i) => {
            item.id = i + 1;
          });
          
          saveFeedingPlanSchedule(schedule);
          this.setData({ schedule });
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  // 表单输入
  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ 'formData.targetTime': e.detail.value });
  },

  onIntervalInput(e) {
    const v = parseInt(e.detail.value, 10);
    this.setData({ 'formData.interval': isNaN(v) ? 180 : Math.max(0, v) });
  },

  onAmountInput(e) {
    this.setData({ 'formData.targetAmount': e.detail.value });
  },

  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'formData.type': this.data.typeOptions[index].value,
      typeIndex: index
    });
  },

  onNoteInput(e) {
    this.setData({ 'formData.note': e.detail.value });
  },

  // 保存编辑（第一顿保存时间，所有项保存间隔；保存后按“上一顿+间隔”重算后续预计时间）
  saveEdit() {
    const { formData, editIndex, schedule } = this.data;
    
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    if (!formData.targetAmount || parseInt(formData.targetAmount, 10) <= 0) {
      wx.showToast({ title: '请输入建议奶量', icon: 'none' });
      return;
    }
    const interval = Math.max(0, parseInt(String(formData.interval), 10) || 180);

    const newItem = {
      id: editIndex >= 0 ? schedule.schedule[editIndex].id : schedule.schedule.length + 1,
      name: formData.name.trim(),
      targetTime: formData.targetTime,
      interval,
      targetAmount: parseInt(formData.targetAmount, 10),
      type: formData.type,
      note: formData.note.trim()
    };

    if (editIndex >= 0) {
      schedule.schedule[editIndex] = newItem;
    } else {
      schedule.schedule.push(newItem);
    }

    // 按“上一顿+间隔=下一顿”重算所有预计时间
    recalcScheduleTargetTimes(schedule);

    // 按时间排序
    schedule.schedule.sort((a, b) => {
      const timeA = a.targetTime.split(':').map(Number);
      const timeB = b.targetTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

    schedule.schedule.forEach((item, i) => {
      item.id = i + 1;
    });

    saveFeedingPlanSchedule(schedule);
    this.setData({ schedule, isEditing: false });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({ isEditing: false });
  },

  // 开关时间表
  toggleSchedule(e) {
    const enabled = e.detail.value;
    const schedule = this.data.schedule;
    schedule.enabled = enabled;
    
    saveFeedingPlanSchedule(schedule);
    this.setData({ schedule });
    
    wx.showToast({
      title: enabled ? '时间表已开启' : '时间表已关闭',
      icon: 'none'
    });
  }
});
