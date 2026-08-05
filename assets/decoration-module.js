/**
 * Angela专属悬浮面板（新增模块，不影响原有业务代码）
 * 板块1: 玉桂狗/哆啦A梦/波妞 卡通贴纸动画
 * 板块2: 时段自动切换问候语
 * 板块3: 当月简易日历（含生日标记）
 * 附加: 生日定时提醒弹窗（保留原有农历生日功能）
 */
(function () {
  'use strict';

  var PANEL_MIN_KEY = 'angela_panel_minimized';
  var BDAY_POPUP_KEY = 'angela_bday_popup_';

  /* ========== 农历转换算法（保留原有生日提醒依赖） ========== */
  var LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
    0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
    0x0d520
  ];

  function lYearDays(y) {
    var sum = 348;
    for (var i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y);
  }
  function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
  function leapDays(y) {
    if (leapMonth(y)) return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
    return 0;
  }
  function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

  function lunarToSolar(year, lunarMonth, lunarDay) {
    var offset = 0, i, temp;
    for (i = 1900; i < year && i < 2100; i++) offset += lYearDays(i);
    var leap = leapMonth(year), isLeap = false;
    for (i = 1; i < lunarMonth; i++) {
      if (leap > 0 && i === leap + 1 && !isLeap) { isLeap = true; i--; continue; }
      if (isLeap && i === leap + 1) isLeap = false;
      offset += isLeap ? leapDays(year) : monthDays(year, i);
    }
    offset += lunarDay - 1;
    return new Date(new Date(1900, 0, 31).getTime() + offset * 86400000);
  }

  function solarToLunarInfo(date) {
    var offset = Math.floor((date.getTime() - new Date(1900, 0, 31).getTime()) / 86400000);
    var i, temp = 0, year = 1900;
    for (i = 1900; i < 2100 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; year++; }
    if (offset < 0) { offset += temp; year--; }
    var leap = leapMonth(year), isLeap = false, month = 1;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === leap + 1 && !isLeap) { isLeap = true; i--; continue; }
      if (isLeap && i === leap + 1) isLeap = false;
      temp = isLeap ? leapDays(year) : monthDays(year, i);
      offset -= temp; month++;
    }
    if (offset < 0) { offset += temp; month--; }
    if (offset === 0 && leap > 0 && month === leap + 1) {
      if (isLeap) { isLeap = false; } else { isLeap = true; month--; }
    }
    return { year: year, month: month, day: offset + 1, isLeap: isLeap };
  }

  /* ========== 生日档案（保留原有数据） ========== */
  var BIRTHDAY_ARCHIVE = [
    { type: 'lunar', month: 3, day: 27, label: '农历三月廿七' },
    { type: 'lunar', month: 5, day: 18, label: '农历五月十八' },
    { type: 'lunar', month: 6, day: 18, label: '农历六月十八' },
    { type: 'solar', month: 10, day: 30, label: '阳历10月30日' }
  ];

  /* ========== 节日数据（阳历 + 农历） ========== */
  var SOLAR_HOLIDAYS = {
    '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '5-1': '劳动节',
    '6-1': '儿童节', '10-1': '国庆节', '12-25': '圣诞节', '12-31': '跨年夜'
  };
  var LUNAR_HOLIDAYS = {
    '1-1': '春节', '1-15': '元宵节', '5-5': '端午节', '7-7': '七夕节',
    '8-15': '中秋节', '9-9': '重阳节', '12-8': '腊八节'
  };

  function getHolidayKey(date) {
    var solarKey = (date.getMonth() + 1) + '-' + date.getDate();
    if (SOLAR_HOLIDAYS[solarKey]) return SOLAR_HOLIDAYS[solarKey];
    var lunar = solarToLunarInfo(date);
    var lunarKey = lunar.month + '-' + lunar.day;
    if (LUNAR_HOLIDAYS[lunarKey]) return LUNAR_HOLIDAYS[lunarKey];
    return null;
  }

  /* ========== 工具函数 ========== */
  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ========== 板块1: 卡通贴纸 SVG ========== */
  // 玉桂狗 Cinnamoroll — 白色小狗，蓝色长耳
  var STICKER_CINNAMOROLL =
    '<svg width="56" height="56" viewBox="0 0 60 60">' +
      '<ellipse cx="20" cy="8" rx="5" ry="12" fill="#B8D8F0" transform="rotate(-15 20 8)"/>' +
      '<ellipse cx="40" cy="8" rx="5" ry="12" fill="#B8D8F0" transform="rotate(15 40 8)"/>' +
      '<circle cx="30" cy="32" r="18" fill="#FFF8F0" stroke="#E8E4DE" stroke-width="1"/>' +
      '<circle cx="24" cy="30" r="2" fill="#5B9BD5"/>' +
      '<circle cx="36" cy="30" r="2" fill="#5B9BD5"/>' +
      '<ellipse cx="30" cy="35" rx="2.5" ry="2" fill="#F4A261"/>' +
      '<path d="M 27 36 Q 30 38 33 36" stroke="#E85D4E" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<circle cx="21" cy="35" r="2.5" fill="#FFC0CB" opacity="0.6"/>' +
      '<circle cx="39" cy="35" r="2.5" fill="#FFC0CB" opacity="0.6"/>' +
    '</svg>';

  // 哆啦A梦 Doraemon — 蓝色圆脸
  var STICKER_DORAEMON =
    '<svg width="56" height="56" viewBox="0 0 60 60">' +
      '<circle cx="30" cy="30" r="22" fill="#5BB5F0" stroke="#4A9FE0" stroke-width="1"/>' +
      '<circle cx="30" cy="30" r="15" fill="#FFFFFF"/>' +
      '<circle cx="24" cy="26" r="2.5" fill="#FFF"/>' +
      '<circle cx="36" cy="26" r="2.5" fill="#FFF"/>' +
      '<circle cx="24" cy="26" r="1.5" fill="#333"/>' +
      '<circle cx="36" cy="26" r="1.5" fill="#333"/>' +
      '<circle cx="30" cy="31" r="2.5" fill="#E85D4E"/>' +
      '<path d="M 26 33 Q 30 36 34 33" stroke="#333" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M 30 33 L 30 37" stroke="#333" stroke-width="0.8"/>' +
      '<ellipse cx="22" cy="34" rx="3" ry="2" fill="#FFC0CB" opacity="0.5"/>' +
      '<ellipse cx="38" cy="34" rx="3" ry="2" fill="#FFC0CB" opacity="0.5"/>' +
    '</svg>';

  // 波妞 Ponyo — 红裙子小女孩
  var STICKER_PONYO =
    '<svg width="56" height="56" viewBox="0 0 60 60">' +
      '<path d="M 18 16 Q 15 10 20 8 Q 25 6 24 12 Q 26 8 30 10 Q 34 8 36 12 Q 35 6 40 8 Q 45 10 42 16 Q 44 14 44 18 L 16 18 Q 16 14 18 16 Z" fill="#E85D4E"/>' +
      '<circle cx="30" cy="30" r="15" fill="#FFDDD2" stroke="#E8D5CC" stroke-width="0.5"/>' +
      '<circle cx="25" cy="29" r="1.8" fill="#333"/>' +
      '<circle cx="35" cy="29" r="1.8" fill="#333"/>' +
      '<circle cx="25.5" cy="28.5" r="0.6" fill="#fff"/>' +
      '<circle cx="35.5" cy="28.5" r="0.6" fill="#fff"/>' +
      '<path d="M 26 34 Q 30 37 34 34" stroke="#E85D4E" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="22" cy="33" rx="2.5" ry="1.8" fill="#FF9999" opacity="0.4"/>' +
      '<ellipse cx="38" cy="33" rx="2.5" ry="1.8" fill="#FF9999" opacity="0.4"/>' +
      '<path d="M 22 42 Q 30 50 38 42 L 38 48 Q 30 54 22 48 Z" fill="#E85D4E" opacity="0.8"/>' +
    '</svg>';

  function renderStickers() {
    var container = document.getElementById('angelaStickers');
    if (!container) return;
    container.innerHTML =
      '<div class="angela-sticker-item">' + STICKER_CINNAMOROLL + '<span class="angela-sticker-sparkle">✨</span></div>' +
      '<div class="angela-sticker-item">' + STICKER_DORAEMON + '<span class="angela-sticker-sparkle">⭐</span></div>' +
      '<div class="angela-sticker-item">' + STICKER_PONYO + '<span class="angela-sticker-sparkle">💫</span></div>';
  }

  /* ========== 板块2: 时段问候语 ========== */
  function getTimeGreeting() {
    var hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { icon: '🌅', text: '早安，今日采购工作顺利' };
    if (hour >= 12 && hour < 14) return { icon: '🍱', text: '午休愉快，劳逸结合' };
    if (hour >= 14 && hour < 18) return { icon: '💪', text: '加油，高效处理单据与库存事务' };
    return { icon: '🌙', text: '辛苦啦，记得适当休息放松' };
  }

  function renderGreeting() {
    var container = document.getElementById('angelaGreeting');
    if (!container) return;
    var g = getTimeGreeting();
    container.innerHTML =
      '<span class="angela-greeting-icon">' + g.icon + '</span>' +
      '<span class="angela-greeting-text">' + esc(g.text) + '</span>';
  }

  /* ========== 板块3: 当月简易日历 ========== */
  function renderCalendar() {
    var container = document.getElementById('angelaCalendar');
    if (!container) return;

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var today = now.getDate();

    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var dowNames = ['日','一','二','三','四','五','六'];

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrevMonth = new Date(year, month, 0).getDate();

    // 获取生日对应的公历日期
    var birthdayDates = getBirthdayDates(year);

    var html = '';
    html += '<div class="angela-cal-header">' + year + '年 ' + monthNames[month] + '</div>';
    html += '<div class="angela-cal-grid">';

    // 星期头
    dowNames.forEach(function (d) {
      html += '<div class="angela-cal-dow">' + d + '</div>';
    });

    // 上月填充
    for (var i = firstDay - 1; i >= 0; i--) {
      html += '<div class="angela-cal-day other-month">' + (daysInPrevMonth - i) + '</div>';
    }

    // 本月日期
    for (var d = 1; d <= daysInMonth; d++) {
      var classes = 'angela-cal-day';
      var dateObj = new Date(year, month, d);
      var isToday = (d === today);
      var holiday = getHolidayKey(dateObj);
      var bdayInfo = getBirthdayOnDate(year, month, d, birthdayDates);

      if (isToday) classes += ' today';
      if (bdayInfo && bdayInfo.type === 'today') classes += ' birthday-today';
      else if (bdayInfo && bdayInfo.type === 'tomorrow') classes += ' birthday-tomorrow';
      if (holiday && !isToday) classes += ' holiday';

      html += '<div class="' + classes + '">' + d + '</div>';
    }

    // 下月填充
    var totalCells = firstDay + daysInMonth;
    var remaining = (7 - (totalCells % 7)) % 7;
    for (var j = 1; j <= remaining; j++) {
      html += '<div class="angela-cal-day other-month">' + j + '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // 预留接口注释：后续可在此扩展农历标注、节假日提醒
  }

  /* ========== 生日检测（保留原有功能） ========== */
  function getBirthdayDates(year) {
    var dates = [];
    BIRTHDAY_ARCHIVE.forEach(function (bd) {
      var solarDate;
      if (bd.type === 'lunar') {
        solarDate = lunarToSolar(year, bd.month, bd.day);
      } else {
        solarDate = new Date(year, bd.month - 1, bd.day);
      }
      dates.push({
        date: solarDate,
        label: bd.label,
        dateType: bd.type === 'lunar' ? '农历' : '阳历'
      });
    });
    return dates;
  }

  function getBirthdayOnDate(year, month, day, birthdayDates) {
    var todayTime = new Date(year, month, day).getTime();
    var tomorrowTime = todayTime + 86400000;
    for (var i = 0; i < birthdayDates.length; i++) {
      var bdTime = new Date(birthdayDates[i].date.getFullYear(), birthdayDates[i].date.getMonth(), birthdayDates[i].date.getDate()).getTime();
      if (bdTime === todayTime) return { type: 'today', label: birthdayDates[i].label, dateType: birthdayDates[i].dateType };
      if (bdTime === tomorrowTime) return { type: 'tomorrow', label: birthdayDates[i].label, dateType: birthdayDates[i].dateType };
    }
    return null;
  }

  function checkBirthdays() {
    var today = new Date();
    var todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var alerts = [];
    var birthdayDates = getBirthdayDates(today.getFullYear());

    birthdayDates.forEach(function (bd) {
      var bdTime = new Date(bd.date.getFullYear(), bd.date.getMonth(), bd.date.getDate()).getTime();
      var diffDays = Math.round((bdTime - todayTime) / 86400000);
      if (diffDays === 0) {
        alerts.push({
          type: 'today',
          label: bd.label,
          dateType: bd.dateType,
          message: '今天是' + bd.label + '，生日快乐！🎂 愿你新的一岁，平安喜乐，万事如意！'
        });
      } else if (diffDays === 1) {
        alerts.push({
          type: 'tomorrow',
          label: bd.label,
          dateType: bd.dateType,
          message: '明天是' + bd.label + '，记得提前准备好生日祝福哦！🎁'
        });
      }
    });
    return alerts;
  }

  function renderBirthdayAlert() {
    var container = document.getElementById('angelaBirthdayAlert');
    if (!container) return;
    var alerts = checkBirthdays();
    if (alerts.length === 0) {
      container.className = 'angela-birthday-alert';
      return;
    }
    var first = alerts[0];
    container.className = 'angela-birthday-alert show ' + first.type;
    var icon = first.type === 'today' ? '🎂' : '🎁';
    container.innerHTML = icon + ' ' + esc(first.message);
  }

  /* ========== 生日弹窗 ========== */
  function showBirthdayPopup(birthdays) {
    var popupKey = BDAY_POPUP_KEY + todayKey();
    try { if (localStorage.getItem(popupKey) === 'shown') return; } catch (e) {}

    var existing = document.getElementById('angelaBdayPopup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.id = 'angelaBdayPopup';
    popup.className = 'angela-bday-popup';

    var content = birthdays.map(function (bd) {
      var icon = bd.type === 'today' ? '🎂' : '🎁';
      var tag = bd.type === 'today' ? '今日生日' : '明日生日';
      return '<div class="angela-bday-item">' +
        '<div class="angela-bday-icon">' + icon + '</div>' +
        '<div>' +
          '<span class="angela-bday-tag ' + bd.type + '">' + tag + ' · ' + esc(bd.dateType) + '</span>' +
          '<p class="angela-bday-msg">' + esc(bd.message) + '</p>' +
        '</div></div>';
    }).join('');

    popup.innerHTML =
      '<div class="angela-bday-mask"></div>' +
      '<div class="angela-bday-card">' +
        '<div class="angela-bday-head"><h3>🎂 生日提醒</h3><button class="angela-bday-close" type="button">✕</button></div>' +
        '<div class="angela-bday-body">' + content + '</div>' +
        '<div class="angela-bday-foot"><button class="angela-bday-btn" type="button">知道了，收起</button></div>' +
      '</div>';

    document.body.appendChild(popup);

    function closePopup() {
      popup.classList.add('closing');
      popup.classList.remove('show');
      setTimeout(function () { if (popup.parentNode) popup.parentNode.removeChild(popup); }, 300);
      try { localStorage.setItem(popupKey, 'shown'); } catch (e) {}
    }

    setTimeout(function () { popup.classList.add('show'); }, 50);
    popup.querySelector('.angela-bday-close').addEventListener('click', closePopup);
    popup.querySelector('.angela-bday-btn').addEventListener('click', closePopup);
    popup.querySelector('.angela-bday-mask').addEventListener('click', closePopup);
  }

  /* ========== 面板收起/展开 ========== */
  function initPanelToggle() {
    var panel = document.getElementById('angelaPanel');
    var header = document.getElementById('angelaPanelHeader');
    var toggle = document.getElementById('angelaPanelToggle');
    if (!panel || !header || !toggle) return;

    // 恢复上次状态
    try {
      if (localStorage.getItem(PANEL_MIN_KEY) === 'true') {
        panel.classList.add('minimized');
        toggle.textContent = '+';
      }
    } catch (e) {}

    function togglePanel() {
      panel.classList.toggle('minimized');
      var isMin = panel.classList.contains('minimized');
      toggle.textContent = isMin ? '+' : '−';
      try { localStorage.setItem(PANEL_MIN_KEY, isMin ? 'true' : 'false'); } catch (e) {}
    }

    header.addEventListener('click', function (e) {
      if (e.target === toggle) return;
      togglePanel();
    });
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePanel();
    });
  }

  /* ========== 定时刷新 ========== */
  function startTimers() {
    // 每分钟刷新问候语（跨时段更新）
    setInterval(function () { renderGreeting(); }, 60000);

    // 每天 8:00-22:00 每分钟检查生日
    setInterval(function () {
      var now = new Date();
      if (now.getHours() < 8 || now.getHours() > 22) return;
      var birthdays = checkBirthdays();
      if (birthdays.length > 0) showBirthdayPopup(birthdays);
    }, 60000);

    // 每小时刷新日历（跨日/跨月更新）
    setInterval(function () { renderCalendar(); renderBirthdayAlert(); }, 3600000);
  }

  /* ========== 初始化 ========== */
  function init() {
    renderStickers();
    renderGreeting();
    renderCalendar();
    renderBirthdayAlert();
    initPanelToggle();
    startTimers();

    // 页面加载后检查生日弹窗
    var birthdays = checkBirthdays();
    if (birthdays.length > 0) {
      setTimeout(function () { showBirthdayPopup(birthdays); }, 1500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
