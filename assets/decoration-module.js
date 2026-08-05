/**
 * 动态装饰 + 生日提醒模块
 * 独立运行，不修改原有业务逻辑
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'decoration_module_enabled';
  var LAST_SHOWN_KEY = 'decoration_last_shown_date';

  /* ========== 农历转换算法 ========== */
  // 农历数据表 1900-2100，每年用十六进制编码
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
    for (var i = 0x8000; i > 0x8; i >>= 1) {
      sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    }
    return sum + leapDays(y);
  }

  function leapMonth(y) {
    return LUNAR_INFO[y - 1900] & 0xf;
  }

  function leapDays(y) {
    if (leapMonth(y)) {
      return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  function monthDays(y, m) {
    return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  /**
   * 农历转公历
   * @param {number} year 公历年份
   * @param {number} lunarMonth 农历月 (1-12)
   * @param {number} lunarDay 农历日 (1-30)
   * @returns {Date} 公历日期
   */
  function lunarToSolar(year, lunarMonth, lunarDay) {
    var offset = 0;
    var i, temp;
    for (i = 1900; i < year && i < 2100; i++) {
      offset += lYearDays(i);
    }
    var leap = leapMonth(year);
    var isLeap = false;
    for (i = 1; i < lunarMonth; i++) {
      if (leap > 0 && i === leap + 1 && !isLeap) {
        isLeap = true;
        i--;
        continue;
      }
      if (isLeap && i === leap + 1) isLeap = false;
      offset += isLeap ? leapDays(year) : monthDays(year, i);
    }
    offset += lunarDay - 1;
    var baseDate = new Date(1900, 0, 31);
    var solarDate = new Date(baseDate.getTime() + offset * 86400000);
    return solarDate;
  }

  /* ========== 节日数据 ========== */
  // 阳历节日 {month-day: {name, greeting, sticker}}
  var SOLAR_HOLIDAYS = {
    '1-1': { name: '元旦', greeting: '新年快乐！新的一年，万事顺意，生意兴隆！', sticker: '🎉' },
    '2-14': { name: '情人节', greeting: '情人节快乐！愿你被温柔以待，今天也要元气满满！', sticker: '💝' },
    '3-8': { name: '妇女节', greeting: '女神节快乐！愿你独立自信，光芒万丈！', sticker: '🌸' },
    '5-1': { name: '劳动节', greeting: '劳动节快乐！辛苦了，今天记得好好休息一下！', sticker: '🌻' },
    '6-1': { name: '儿童节', greeting: '儿童节快乐！愿你永远保持一颗童心！', sticker: '🎈' },
    '10-1': { name: '国庆节', greeting: '国庆快乐！山河壮丽，国泰民安！', sticker: '🇨🇳' },
    '12-25': { name: '圣诞节', greeting: '圣诞快乐！愿温暖和幸福围绕着你！', sticker: '🎄' },
    '12-31': { name: '跨年夜', greeting: '跨年快乐！新的一年，新的开始，一起加油！', sticker: '🎆' }
  };

  // 农历节日 {lunarMonth-lunarDay: {name, greeting, sticker}}
  var LUNAR_HOLIDAYS = {
    '1-1': { name: '春节', greeting: '春节快乐！爆竹声中一岁除，春风送暖入屠苏。新春大吉！', sticker: '🧧' },
    '1-15': { name: '元宵节', greeting: '元宵节快乐！团团圆圆，甜甜蜜蜜！', sticker: '🏮' },
    '5-5': { name: '端午节', greeting: '端午安康！粽叶飘香，愿你平安喜乐！', sticker: '🐲' },
    '7-7': { name: '七夕节', greeting: '七夕快乐！愿有情人终成眷属，浪漫满屋！', sticker: '🦋' },
    '8-15': { name: '中秋节', greeting: '中秋快乐！月圆人团圆，幸福美满！', sticker: '🌕' },
    '9-9': { name: '重阳节', greeting: '重阳安康！登高望远，福寿绵长！', sticker: '🍁' },
    '12-8': { name: '腊八节', greeting: '腊八快乐！过了腊八就是年，记得喝碗腊八粥！', sticker: '🥣' }
  };

  /* ========== 生日档案 ========== */
  // 固定生日档案，每年循环生效
  var BIRTHDAY_ARCHIVE = [
    { type: 'lunar', month: 3, day: 27, name: '生日（农历三月廿七）', label: '农历三月廿七' },
    { type: 'lunar', month: 5, day: 18, name: '生日（农历五月十八）', label: '农历五月十八' },
    { type: 'lunar', month: 6, day: 18, name: '生日（农历六月十八）', label: '农历六月十八' },
    { type: 'solar', month: 10, day: 30, name: '生日（阳历10月30日）', label: '阳历10月30日' }
  ];

  /* ========== 每日贴纸 & 问候语 ========== */
  var DAILY_STICKERS = [
    '🐱', '🐰', '🐻', '🐼', '🦊', '🐨', '🐯', '🦁', '🐸', '🐵',
    '🦄', '🐧', '🐦', '🐹', '🐶', '🦝', '🐙', '🦋', '🌸', '🌻',
    '🍀', '⭐', '🌙', '☁️', '🌈', '🍉', '🍓', '🍑', '🧁', '🍰'
  ];

  var DAILY_GREETINGS = [
    '今天也是元气满满的一天，加油呀！',
    '每一个清晨都值得微笑，早安！',
    '认真工作的你，真的很闪闪发光呢～',
    '今天的你，依然很棒！别忘了休息哦～',
    '生活明朗，万物可爱，人间值得～',
    '愿你今天遇见所有美好！',
    '把今天过好，就是最好的生活～',
    '今日份的快乐已送达，请签收！',
    '工作再忙，也要记得喝水哦～',
    '你的努力，时间都看得见！',
    '愿今天一切顺利，心想事成～',
    '保持热爱，奔赴山海，加油！',
    '今天也要做个快乐的打工人～',
    '世界很大，幸福很小，愿你在当下～',
    '生活有点苦，但你很甜呀～',
    '今天的阳光和你一样温暖呢～',
    '愿你的每一份付出都有回报！',
    '累了就歇会儿，别太拼了哦～',
    '你的笑容是最好的装饰，今天也请保持微笑～',
    '万事胜意，一切都在慢慢变好～'
  ];

  /* ========== 工具函数 ========== */
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function getDateKey(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  // 种子随机：根据日期生成固定随机数，保证当天显示一致
  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function isEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch (e) {
      return true;
    }
  }

  function setEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (e) {}
  }

  /* ========== 获取农历日期信息 ========== */
  function getTodayLunar() {
    var today = new Date();
    return solarToLunarInfo(today);
  }

  function solarToLunarInfo(date) {
    var offset = Math.floor((date.getTime() - new Date(1900, 0, 31).getTime()) / 86400000);
    var i, temp = 0;
    var year = 1900;
    for (i = 1900; i < 2100 && offset > 0; i++) {
      temp = lYearDays(i);
      offset -= temp;
      year++;
    }
    if (offset < 0) {
      offset += temp;
      year--;
    }
    var leap = leapMonth(year);
    var isLeap = false;
    var month = 1;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === leap + 1 && !isLeap) {
        isLeap = true;
        i--;
        continue;
      }
      if (isLeap && i === leap + 1) isLeap = false;
      temp = isLeap ? leapDays(year) : monthDays(year, i);
      offset -= temp;
      month++;
    }
    if (offset < 0) {
      offset += temp;
      month--;
    }
    if (offset === 0 && leap > 0 && month === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        month--;
      }
    }
    var day = offset + 1;
    return { year: year, month: month, day: day, isLeap: isLeap };
  }

  /* ========== 获取今日节日 ========== */
  function getTodayHoliday() {
    var today = new Date();
    var solarKey = (today.getMonth() + 1) + '-' + today.getDate();
    if (SOLAR_HOLIDAYS[solarKey]) {
      return SOLAR_HOLIDAYS[solarKey];
    }
    var lunar = solarToLunarInfo(today);
    var lunarKey = lunar.month + '-' + lunar.day;
    if (LUNAR_HOLIDAYS[lunarKey]) {
      return LUNAR_HOLIDAYS[lunarKey];
    }
    return null;
  }

  /* ========== 生日检测 ========== */
  function checkBirthdays() {
    var today = new Date();
    var todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var alerts = [];

    BIRTHDAY_ARCHIVE.forEach(function (bd) {
      var solarDate;
      if (bd.type === 'lunar') {
        solarDate = lunarToSolar(today.getFullYear(), bd.month, bd.day);
      } else {
        solarDate = new Date(today.getFullYear(), bd.month - 1, bd.day);
      }

      var bdTime = new Date(solarDate.getFullYear(), solarDate.getMonth(), solarDate.getDate()).getTime();
      var diffDays = Math.round((bdTime - todayTime) / 86400000);

      if (diffDays === 0) {
        // 生日当天
        alerts.push({
          type: 'today',
          name: bd.name,
          label: bd.label,
          dateType: bd.type === 'lunar' ? '农历' : '阳历',
          message: '今天是' + bd.label + '，生日快乐！🎂 愿你新的一岁，平安喜乐，万事如意！'
        });
      } else if (diffDays === 1) {
        // 提前一天提醒
        alerts.push({
          type: 'tomorrow',
          name: bd.name,
          label: bd.label,
          dateType: bd.type === 'lunar' ? '农历' : '阳历',
          message: '明天是' + bd.label + '，记得提前准备好生日祝福哦！🎁'
        });
      }
    });

    return alerts;
  }

  /* ========== 获取今日贴纸 & 问候 ========== */
  function getTodayContent() {
    var holiday = getTodayHoliday();
    var dateSeed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();

    if (holiday) {
      return {
        sticker: holiday.sticker,
        greeting: holiday.greeting,
        isHoliday: true,
        holidayName: holiday.name
      };
    }

    var stickerIndex = Math.floor(seededRandom(dateSeed) * DAILY_STICKERS.length);
    var greetingIndex = Math.floor(seededRandom(dateSeed * 2 + 1) * DAILY_GREETINGS.length);

    return {
      sticker: DAILY_STICKERS[stickerIndex],
      greeting: DAILY_GREETINGS[greetingIndex],
      isHoliday: false,
      holidayName: ''
    };
  }

  /* ========== 渲染模块 ========== */
  function renderModule() {
    if (!isEnabled()) {
      hideAll();
      return;
    }

    var container = document.getElementById('decorationModule');
    if (!container) return;

    var content = getTodayContent();
    var birthdays = checkBirthdays();

    var stickerHtml = '<div class="deco-sticker' + (content.isHoliday ? ' deco-sticker-holiday' : '') + '">' + content.sticker + '</div>';
    var greetingHtml = '<div class="deco-greeting">' + escapeHTML(content.greeting) + '</div>';
    if (content.isHoliday) {
      greetingHtml = '<div class="deco-holiday-tag">' + escapeHTML(content.holidayName) + '</div>' + greetingHtml;
    }

    var birthdayHtml = '';
    if (birthdays.length > 0) {
      birthdayHtml = birthdays.map(function (bd) {
        var cls = bd.type === 'today' ? 'deco-birthday-today' : 'deco-birthday-tomorrow';
        var icon = bd.type === 'today' ? '🎂' : '🎁';
        return '<div class="deco-birthday ' + cls + '">' +
          '<span class="deco-birthday-icon">' + icon + '</span>' +
          '<span class="deco-birthday-text">' + escapeHTML(bd.message) + '</span>' +
          '</div>';
      }).join('');
    }

    var dateStr = new Date().getMonth() + 1 + '月' + new Date().getDate() + '日';
    var lunar = getTodayLunar();
    var lunarStr = '农历' + lunar.month + '月' + lunar.day + '日';

    container.innerHTML =
      '<div class="deco-inner">' +
        '<div class="deco-header">' +
          '<span class="deco-date">' + dateStr + ' · ' + lunarStr + '</span>' +
          '<button class="deco-toggle-btn" id="decoToggleBtn" type="button" title="关闭装饰模块">✕</button>' +
        '</div>' +
        '<div class="deco-body">' +
          stickerHtml +
          greetingHtml +
        '</div>' +
        (birthdayHtml ? '<div class="deco-birthdays">' + birthdayHtml + '</div>' : '') +
      '</div>';
    container.style.display = 'block';
    setTimeout(function () {
      container.classList.add('deco-show');
    }, 50);

    var toggleBtn = document.getElementById('decoToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        setEnabled(false);
        hideAll();
        showRestoreButton();
      });
    }

    // 生日弹窗
    if (birthdays.length > 0) {
      showBirthdayPopup(birthdays);
    }
  }

  function hideAll() {
    var container = document.getElementById('decorationModule');
    if (container) {
      container.classList.remove('deco-show');
      container.style.display = 'none';
    }
    var popup = document.getElementById('decoBirthdayPopup');
    if (popup) popup.remove();
  }

  function showRestoreButton() {
    var btn = document.getElementById('decoRestoreBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'decoRestoreBtn';
      btn.className = 'deco-restore-btn';
      btn.textContent = '✨ 开启装饰';
      btn.type = 'button';
      btn.addEventListener('click', function () {
        setEnabled(true);
        btn.remove();
        renderModule();
      });
      document.body.appendChild(btn);
    }
  }

  function showBirthdayPopup(birthdays) {
    // 同一天只弹一次
    var popupKey = 'deco_birthday_popup_' + todayKey();
    try {
      if (localStorage.getItem(popupKey) === 'shown') return;
    } catch (e) {}

    var existing = document.getElementById('decoBirthdayPopup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.id = 'decoBirthdayPopup';
    popup.className = 'deco-birthday-popup';

    var content = birthdays.map(function (bd) {
      var icon = bd.type === 'today' ? '🎂' : '🎁';
      var tag = bd.type === 'today' ? '今日生日' : '明日生日';
      var tagCls = bd.type === 'today' ? 'popup-tag-today' : 'popup-tag-tomorrow';
      return '<div class="popup-birthday-item">' +
        '<div class="popup-birthday-icon">' + icon + '</div>' +
        '<div class="popup-birthday-content">' +
          '<span class="popup-birthday-tag ' + tagCls + '">' + tag + ' · ' + escapeHTML(bd.dateType) + '</span>' +
          '<p class="popup-birthday-message">' + escapeHTML(bd.message) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');

    popup.innerHTML =
      '<div class="deco-popup-mask"></div>' +
      '<div class="deco-popup-card">' +
        '<div class="deco-popup-header">' +
          '<h3>🎂 生日提醒</h3>' +
          '<button class="deco-popup-close" type="button" title="收起">✕</button>' +
        '</div>' +
        '<div class="deco-popup-body">' + content + '</div>' +
        '<div class="deco-popup-footer">' +
          '<button class="deco-popup-dismiss" type="button">知道了，收起</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(popup);

    function closePopup() {
      popup.classList.add('deco-popup-closing');
      setTimeout(function () {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 300);
      try {
        localStorage.setItem(popupKey, 'shown');
      } catch (e) {}
    }

    popup.querySelector('.deco-popup-close').addEventListener('click', closePopup);
    popup.querySelector('.deco-popup-dismiss').addEventListener('click', closePopup);
    popup.querySelector('.deco-popup-mask').addEventListener('click', closePopup);

    setTimeout(function () {
      popup.classList.add('deco-popup-show');
    }, 50);
  }

  function escapeHTML(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  /* ========== 定时检查 ========== */
  function startTimer() {
    // 每10分钟检查一次，用于跨日刷新
    setInterval(function () {
      var lastShown = '';
      try {
        lastShown = localStorage.getItem(LAST_SHOWN_KEY) || '';
      } catch (e) {}
      var today = todayKey();
      if (lastShown !== today) {
        try {
          localStorage.setItem(LAST_SHOWN_KEY, today);
        } catch (e) {}
        renderModule();
      }
    }, 600000); // 10分钟

    // 每分钟检查生日提醒
    setInterval(function () {
      if (!isEnabled()) return;
      var now = new Date();
      // 只在 8:00-22:00 之间检查
      if (now.getHours() < 8 || now.getHours() > 22) return;
      var birthdays = checkBirthdays();
      if (birthdays.length > 0) {
        showBirthdayPopup(birthdays);
      }
    }, 60000); // 1分钟
  }

  /* ========== 初始化 ========== */
  function init() {
    try {
      localStorage.setItem(LAST_SHOWN_KEY, todayKey());
    } catch (e) {}
    renderModule();
    startTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
