(function () {
  'use strict';

  var STORAGE_KEY = 'autoPartsProcurementWorkbench.v1';

  var defaultFactories = ['莱克', '纯发', '纳科达', '汇财', '和润宇', '小松'];
  var factories = defaultFactories.slice();
  var modules = [
    { id: 'suppliers', name: '供应商管理' },
    { id: 'orders', name: '采购订单 & 跟进' },
    { id: 'smartEmail', name: '智能邮箱' },
    { id: 'finance', name: '付款 & 发票管理' },
    { id: 'reconciliation', name: '工厂月结对账' },
    { id: 'antifake', name: '防伪标管理' },
    { id: 'contracts', name: '合同管理' },
    { id: 'projects', name: '项目专项跟进' }
  ];
  var sections = [
    { id: 'home', name: '首页・今日总览', desc: '本周重点、逾期提醒、交付节点和快捷新建工作记录。' },
    { id: 'suppliers', name: '供应商管理', desc: '分供应商记录样品、包装、品质、库存、交期、对接人与历史沟通。' },
    { id: 'orders', name: '采购订单 & 跟进', desc: '采购订单、礼品订单、物流状态、卡扣和辅料配套发货。' },
    { id: 'smartEmail', name: '智能邮箱', desc: '根据采购订单号自动匹配工厂，生成待回签和已回签采购往来邮件。' },
    { id: 'finance', name: '付款 & 发票管理', desc: '货款付款、发票状态、运研报价与返利核算。' },
    { id: 'reconciliation', name: '工厂月结对账', desc: '按工厂和月份记录账单金额、差异项、确认状态、付款衔接和关闭时间。' },
    { id: 'antifake', name: '防伪标管理', desc: '记录防伪标申请、领用、库存、使用批次、产品关联和异常处理。' },
    { id: 'contracts', name: '合同管理', desc: '供应商合同续签、条款沟通、寄件进度和归档状态。' },
    { id: 'weekly', name: '周报管理', desc: '工作日持续录入，按本周记录生成精简采购周报。' },
    { id: 'projects', name: '项目专项跟进', desc: '莱克机油 T7/T9、防冻液标贴、纯发雨刷 LOGO、不良品和样品寄送。' }
  ];
  var statuses = [
    { id: '待跟进', name: '待跟进' },
    { id: '跟进中', name: '跟进中' },
    { id: '待确认', name: '待确认' },
    { id: '已完成', name: '已完成' },
    { id: '逾期', name: '逾期' }
  ];
  var projects = [
    { name: '莱克机油 T7/T9', factory: '莱克', tags: ['生产进度', '交期', '发货', '异常反馈'] },
    { name: '莱克防冻液标贴', factory: '莱克', tags: ['标贴确认', '包装资料', '打样进度'] },
    { name: '纯发雨刷 LOGO 改版', factory: '纯发', tags: ['LOGO 版本', '确认状态', '旧版处理'] },
    { name: '纯发不良品处理', factory: '纯发', tags: ['不良品数量', '原因', '补发 / 退换 / 折让'] },
    { name: '样品寄送跟进', factory: '多工厂', tags: ['样品名称', '物流单号', '反馈结果'] }
  ];

  // 智能邮箱：本地订单-工厂对应表。后续批量增加订单时，直接按此格式追加即可。
  var emailOrderFactoryMap = [
    { orderNo: 'PO202608001', factory: '莱克' },
    { orderNo: 'PO202608002', factory: '纯发' },
    { orderNo: 'PO202608003', factory: '纳科达' }
  ];

  // 智能邮箱：邮件模板配置。新增模板时复制一个对象，补充 subject/body/wechat 即可。
  var emailTemplates = {
    pendingSign: {
      name: '待回签邮件 + 工厂名称 + 订单号',
      subject: '【采购合同确认】采购订单{{订单号}}确认并回签',
      body: '您好！\n附件为我司本次采购订单（编号：{{订单号}}），请查收。\n烦请协助以下事项：\n1. 盖章回签：请贵司对订单盖章确认，并将扫描件回传至本邮箱。\n2. 确认交期：请根据订单要求，回复确认最终交期。如有特殊原因无法按期交付，请提前沟通说明。\n\n我方收到贵司盖章回签后，将在第一时间完成盖章并回传给您，以便双方留存归档。\n烦请于{{回复截止日期}}前回复确认，感谢配合。\n\n如有任何疑问，请随时与我联系。\n期待与贵司的合作顺利推进，顺祝商祺！',
      wechat: '采购单已发，后续下单统一走邮箱。我同步发一份至工作群，请贵司签章回传后，我方完成盖章再安排付款。麻烦确认订单，安排回签及开具发票，谢谢！'
    },
    signedReturn: {
      name: '已回签邮件 + 工厂名称 + 订单号',
      subject: '采购订单{{订单号}} 双方盖章版合同回传',
      body: '您好！\n我司已于{{收到回签日期}}，收到贵公司签署并盖章的采购订单回签文件。现随邮件附件，将经我司盖章确认的完整采购订单合同（双方盖章版PDF）回传给您，敬请查收并妥善保管，作为后续合作及结算正式依据。\n\n请贵司收到附件后，确认文件清晰完整，如有任何问题请及时与我们联系。\n\n感谢贵司对本次采购工作的积极配合与支持，期待未来继续与贵司保持高效、愉快的合作。\n顺祝商祺，生意兴隆！',
      wechat: ''
    }
  };

  var state = loadState();
  var selectedFactory = '';
  var supplierSubdir = 'profile';
  var selectedAntifakeFactory = '';
  var showAntifakeExemptFactories = false;
  var libraryQuickFilter = '';
  var selectedOrderIds = [];
  var pendingPurchaseOrderImport = null;
  ensureStateShape();
  syncFactories();

  function $(id) {
    return document.getElementById(id);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toYMD(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function parseYMD(ymd) {
    if (!ymd) return null;
    var parts = ymd.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function weekday(date) {
    return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  }

  function formatDate(ymd, suffix) {
    var date = parseYMD(ymd);
    if (!date) return '';
    return ymd + '（星期' + weekday(date) + '）' + (suffix || '');
  }

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(date, days) {
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonths(date, months) {
    var d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  function monthKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1);
  }

  function previousMonthKey(date) {
    return monthKey(addMonths(date, -1));
  }

  function lastWeekdayOfMonth(date, weekdayIndex) {
    var last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    while (last.getDay() !== weekdayIndex) {
      last.setDate(last.getDate() - 1);
    }
    return last;
  }

  function dayOfSameMonth(date, day) {
    return new Date(date.getFullYear(), date.getMonth(), day);
  }

  function settlementOrderDueDate(flow) {
    var base = parseYMD(flow.billDate) || parseYMD(flow.paymentDueDate) || today();
    return toYMD(dayOfSameMonth(base, 15));
  }

  function settlementOrderRecordDueDate(record) {
    var text = [record.content, record.product, record.nextStep, record.note].join(' ');
    if (!/月结采购单|月结流转|对账完成后制作采购单/.test(text)) return '';
    var noteDate = String(record.note || '').match(/账单日期：(\d{4}-\d{2}-\d{2})/);
    var base = parseYMD(noteDate && noteDate[1]) || parseYMD(record.dueDate) || today();
    return toYMD(dayOfSameMonth(base, 15));
  }

  function currencyNumber(value) {
    var text = String(value || '').replace(/[,，￥¥元\s]/g, '');
    var match = text.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function formatCurrency(value) {
    var num = typeof value === 'number' ? value : currencyNumber(value);
    if (!num || isNaN(num)) return '';
    var negative = num < 0 ? '-' : '';
    num = Math.abs(num);
    var fixed = num.toFixed(2);
    var parts = fixed.split('.');
    var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return negative + '￥' + intPart + '.' + parts[1];
  }

  function normalizeCurrency(value) {
    return formatCurrency(value) || String(value || '').trim();
  }

  function isCurrencyRecord(record) {
    var text = [record.content, record.product, record.module, record.note, record.nextStep, record.amount].join(' ');
    return /财务|付款|请款|金额|月结|对账|结算|货款|发票|￥|¥|元/.test(text);
  }

  function displayAmount(record) {
    if (!record || !record.amount) return '';
    return isCurrencyRecord(record) ? normalizeCurrency(record.amount) : record.amount;
  }

  function startOfWeek(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
  }

  function endOfWeek(date) {
    return addDays(startOfWeek(date), 6);
  }

  function isWithin(ymd, start, end) {
    var d = parseYMD(ymd);
    if (!d) return false;
    return d >= start && d <= end;
  }

  function normalizeTime(text) {
    var raw = (text || '').trim();
    if (!raw) return { date: '', label: '', suffix: '' };
    var base = today();
    var suffix = raw.indexOf('前') >= 0 ? '前' : '';
    var clean = raw.replace(/\s/g, '');
    var date = null;

    if (clean.indexOf('今天') >= 0) date = base;
    if (!date && clean.indexOf('明天') >= 0) date = addDays(base, 1);
    if (!date && clean.indexOf('后天') >= 0) date = addDays(base, 2);

    var afterMatch = clean.match(/(\d+)\s*天后/);
    if (!date && afterMatch) date = addDays(base, Number(afterMatch[1]));

    var dayMap = { '周日': 0, '星期日': 0, '周天': 0, '周一': 1, '星期一': 1, '周二': 2, '星期二': 2, '周三': 3, '星期三': 3, '周四': 4, '星期四': 4, '周五': 5, '星期五': 5, '周六': 6, '星期六': 6 };
    var matchedDay = Object.keys(dayMap).find(function (k) { return clean.indexOf(k) >= 0; });
    if (!date && matchedDay) {
      var target = dayMap[matchedDay];
      var current = base.getDay();
      var diff = target - current;
      if (clean.indexOf('下周') >= 0) {
        diff = diff <= 0 ? diff + 7 : diff;
        diff += 7;
      } else if (diff < 0 || clean.indexOf('下') >= 0) {
        diff += 7;
      }
      date = addDays(base, diff);
    }

    if (!date && clean.indexOf('下周') >= 0) date = addDays(startOfWeek(base), 7);
    if (!date && clean.indexOf('本周') >= 0) date = endOfWeek(base);

    if (!date) {
      var exact = clean.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
      if (exact) date = new Date(Number(exact[1]), Number(exact[2]) - 1, Number(exact[3]));
    }

    if (!date || isNaN(date.getTime())) return { date: '', label: raw, suffix: suffix };
    var ymd = toYMD(date);
    return { date: ymd, label: formatDate(ymd, suffix), suffix: suffix };
  }

  function moduleName(id) {
    var found = modules.find(function (m) { return m.id === id; });
    return found ? found.name : id || '未归类';
  }

  function statusClass(status, dueDate) {
    status = normalizeStatus(status);
    if (status === '已完成') return 'done';
    if (isOverdue({ status: status, dueDate: dueDate })) return 'overdue';
    if (status === '跟进中') return 'doing';
    if (status === '待确认') return 'confirm';
    return 'pending';
  }

  function normalizeStatus(status) {
    if (status === '待办') return '待跟进';
    if (status === '进行中') return '跟进中';
    return status || '待跟进';
  }

  function isOverdue(record) {
    if (!record.dueDate || record.status === '已完成') return false;
    return parseYMD(record.dueDate) < today();
  }

  function getDisplayStatus(record) {
    return isOverdue(record) ? '逾期' : normalizeStatus(record.status);
  }

  function inferFactory(text) {
    text = text || '';
    return factories.find(function (f) { return text.indexOf(f) >= 0; }) || '';
  }

  function inferModule(text) {
    text = text || '';
    var rules = [
      { id: 'smartEmail', words: ['智能邮箱', '邮件', '邮箱', '回签邮件', '邮件主题', '邮件正文'] },
      { id: 'reconciliation', words: ['月结', '对账', '账期', '账单', '差异项', '核对金额', '工厂账单'] },
      { id: 'antifake', words: ['防伪', '防伪标', '防伪码', '标签领用', '标码', '批次', '领用数量'] },
      { id: 'finance', words: ['付款', '货款', '发票', '锁死', '返利', '报价', '单位转换'] },
      { id: 'contracts', words: ['合同', '续签', '条款', '寄件', '回签', '归档'] },
      { id: 'orders', words: ['订单', '下单', '礼品订单', '采购单', '物流', '快递', '单号', '发货', '到货', '卡扣', '辅料'] },
      { id: 'projects', words: ['T7', 'T9', '防冻液', '雨刷', '不良品', '样品寄送', '专项'] },
      { id: 'suppliers', words: ['样品', '打样', '寄样', '品质', '瑕疵', '库存', '交期', '对接人', '沟通', '包装', '标贴', '装箱', '喷码', '包材', '旧包材', 'LOGO', '规格'] }
    ];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].words.some(function (w) { return text.indexOf(w) >= 0; })) return rules[i].id;
    }
    return 'suppliers';
  }

  function inferProduct(text) {
    var products = ['T7', 'T9', '机油', '雨刷', '车衣', '蓄电池', '防冻液', '标贴', '防伪标', '防伪码', 'LOGO', '卡扣', '辅料', '包材', '发票', '合同', '月结对账'];
    return products.filter(function (p) { return (text || '').indexOf(p) >= 0; }).join(' / ');
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return {
      records: seedRecords(),
      suppliers: defaultSupplierProfiles(),
      createdAt: nowISO()
    };
  }

  function defaultSupplierProfiles() {
    return defaultFactories.map(function (name) {
      return {
        name: name,
        contact: '',
        products: defaultSupplierProducts(name),
        settle: '',
        note: '',
        createdAt: nowISO()
      };
    });
  }

  function defaultSupplierProducts(name) {
    var map = {
      '莱克': '机油、防冻液',
      '纯发': '雨刷',
      '纳科达': '供应商合同 / 成品采购',
      '汇财': '成品采购',
      '和润宇': '成品采购',
      '小松': '票据与采购事项'
    };
    return map[name] || '';
  }

  function ensureStateShape() {
    state.records = Array.isArray(state.records) ? state.records : [];
    state.suppliers = Array.isArray(state.suppliers) ? state.suppliers : [];
    state.antifakeStock = state.antifakeStock && typeof state.antifakeStock === 'object' ? state.antifakeStock : {};
    state.antifakeMovements = Array.isArray(state.antifakeMovements) ? state.antifakeMovements : [];
    state.settlementFlows = Array.isArray(state.settlementFlows) ? state.settlementFlows : [];
    state.financePayments = Array.isArray(state.financePayments) ? state.financePayments : [];
    state.deletedSuppliers = Array.isArray(state.deletedSuppliers) ? state.deletedSuppliers : [];
    state.operationLogs = Array.isArray(state.operationLogs) ? state.operationLogs : [];
    state.customEmailTemplates = Array.isArray(state.customEmailTemplates) ? state.customEmailTemplates : [];
    state.antifakeThresholds = state.antifakeThresholds && typeof state.antifakeThresholds === 'object' ? state.antifakeThresholds : {};
    state.antifakeExempt = state.antifakeExempt && typeof state.antifakeExempt === 'object' ? state.antifakeExempt : {};
    state.antifakeExemptNote = state.antifakeExemptNote && typeof state.antifakeExemptNote === 'object' ? state.antifakeExemptNote : {};
    state.settlementFlows.forEach(function (flow) {
      flow.reconciliationStatus = flow.reconciliationStatus || '待对账';
      flow.orderStatus = flow.orderStatus || '待做采购单';
      flow.paymentStatus = flow.paymentStatus || '待付款';
      if (flow.amount) flow.amount = normalizeCurrency(flow.amount);
      if (flow.checkAmount) flow.checkAmount = normalizeCurrency(flow.checkAmount);
      flow.history = Array.isArray(flow.history) ? flow.history : [];
    });
    state.financePayments.forEach(function (payment) {
      payment.paymentStatus = payment.paymentStatus || '待付款';
      payment.invoiceStatus = payment.invoiceStatus || '待开票';
      payment.type = payment.type || '临时付款';
      if (payment.amount) payment.amount = normalizeCurrency(payment.amount);
      payment.history = Array.isArray(payment.history) ? payment.history : [];
    });
    state.records.forEach(function (record) {
      record.status = normalizeStatus(record.status);
      if (typeof record.orderNo !== 'string') record.orderNo = '';
      if (record.module === 'orders' && record.status !== '已完成') {
        record.dueDate = settlementOrderRecordDueDate(record) || record.dueDate;
      }
    });
    state.settlementFlows.forEach(function (flow) {
      syncSettlementLinkedDueDates(flow);
    });
    defaultFactories.forEach(function (name) {
      if (state.deletedSuppliers.indexOf(name) >= 0) return;
      if (!state.suppliers.some(function (s) { return s.name === name; })) {
        state.suppliers.push({
          name: name,
          contact: '',
          products: defaultSupplierProducts(name),
          settle: '',
          note: '',
          createdAt: nowISO()
        });
      }
    });
    state.records.forEach(function (record) {
      if (!record.factory) return;
      if (state.deletedSuppliers.indexOf(record.factory) >= 0) return;
      if (!state.suppliers.some(function (s) { return s.name === record.factory; })) {
        state.suppliers.push({
          name: record.factory,
          contact: '',
          products: '',
          settle: '',
          note: '由历史记录自动补入供应商列表。',
          createdAt: nowISO()
        });
      }
    });
    state.suppliers.forEach(function (supplier) {
      if (supplier.name && typeof state.antifakeStock[supplier.name] !== 'number') {
        state.antifakeStock[supplier.name] = 0;
      }
      if (supplier.name && typeof state.antifakeThresholds[supplier.name] !== 'number') {
        state.antifakeThresholds[supplier.name] = 50;
      }
      if (supplier.name && typeof state.antifakeExempt[supplier.name] !== 'boolean') {
        state.antifakeExempt[supplier.name] = false;
      }
      if (supplier.name && typeof state.antifakeExemptNote[supplier.name] !== 'string') {
        state.antifakeExemptNote[supplier.name] = '';
      }
    });
  }

  function syncFactories() {
    factories = state.suppliers
      .map(function (s) { return s.name; })
      .filter(Boolean)
      .filter(function (name, index, arr) { return arr.indexOf(name) === index; });
  }

  function saveState() {
    state.updatedAt = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seedRecords() {
    var d = today();
    var seed = [
      {
        content: '跟进莱克机油 T7/T9 生产进度，确认预计发货节点。',
        factory: '莱克',
        product: 'T7 / T9 机油',
        module: 'projects',
        status: '进行中',
        dueDate: toYMD(addDays(d, 2)),
        nextStep: '确认生产排期和物流安排。',
        note: '首批专项跟进事项。',
        weeklyCategory: 'auto'
      },
      {
        content: '确认莱克防冻液标贴版本和喷码位置资料。',
        factory: '莱克',
        product: '防冻液标贴',
        module: 'packaging',
        status: '待办',
        dueDate: toYMD(addDays(d, 4)),
        nextStep: '向工厂确认标贴定稿时间。',
        note: '用于包装标准库沉淀。',
        weeklyCategory: 'auto'
      },
      {
        content: '跟进纯发雨刷 LOGO 改版确认和旧版处理方式。',
        factory: '纯发',
        product: '雨刷 LOGO',
        module: 'projects',
        status: '待确认',
        dueDate: toYMD(addDays(d, 1)),
        nextStep: '确认新版 LOGO 打样结果。',
        note: '涉及包装改版和旧版处理。',
        weeklyCategory: 'auto'
      },
      {
        content: '整理纳科达合同续签条款沟通进度。',
        factory: '纳科达',
        product: '合同续签',
        module: 'contracts',
        status: '待办',
        dueDate: toYMD(addDays(d, 5)),
        nextStep: '补充条款确认记录。',
        note: '',
        weeklyCategory: 'auto'
      },
      {
        content: '记录小松发票单位转换事项，跟进发票状态。',
        factory: '小松',
        product: '发票单位转换',
        module: 'finance',
        status: '进行中',
        dueDate: toYMD(addDays(d, 3)),
        nextStep: '确认新开票单位和到票时间。',
        note: '财务票据专项记录。',
        weeklyCategory: 'auto'
      }
    ];

    return seed.map(function (r) {
      var id = makeId();
      var time = nowISO();
      return Object.assign({
        id: id,
        owner: '',
        orderNo: '',
        logisticsNo: '',
        amount: '',
        createdAt: time,
        updatedAt: time,
        completedAt: '',
        history: [{ time: time, action: '创建预置记录' }]
      }, r);
    });
  }

  function makeId() {
    return 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function escapeHTML(text) {
    return String(text || '').replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  function renderStatus(record) {
    var display = getDisplayStatus(record);
    return '<span class="status ' + statusClass(record.status, record.dueDate) + '">' + display + '</span>';
  }

  function fillSelect(id, items, options) {
    var el = $(id);
    if (!el) return;
    var opts = options || {};
    el.innerHTML = '';
    if (opts.anyLabel) {
      var any = document.createElement('option');
      any.value = '';
      any.textContent = opts.anyLabel;
      el.appendChild(any);
    }
    items.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.id || item;
      opt.textContent = item.name || item;
      el.appendChild(opt);
    });
  }

  function init() {
    renderNav();
    renderSelects();

    $('quickForm').addEventListener('submit', onQuickSubmit);
    $('recordForm').addEventListener('submit', onRecordSubmit);
    $('openModalBtn').addEventListener('click', function () { openModal(); });
    $('openModalFromQuickBtn').addEventListener('click', function () { openModal(); });
    $('closeModalBtn').addEventListener('click', closeModal);
    $('modalBackdrop').addEventListener('click', function (e) {
      if (e.target === $('modalBackdrop')) closeModal();
    });
    $('generateWeeklyBtn').addEventListener('click', generateWeekly);
    $('copyWeeklyBtn').addEventListener('click', copyWeekly);
    $('downloadWeeklyBtn').addEventListener('click', downloadWeekly);
    $('exportBtn').addEventListener('click', exportData);
    $('importFile').addEventListener('change', importData);
    $('openOrderImportBtn').addEventListener('click', openOrderImportModal);
    $('openOrderImportFromOrdersBtn').addEventListener('click', openOrderImportModal);
    $('closeOrderImportModalBtn').addEventListener('click', closeOrderImportModal);
    $('orderImportForm').addEventListener('submit', onOrderImportSubmit);
    $('orderImportFile').addEventListener('change', onOrderImportFileChange);
    setupPurchaseOrderUpload();
    $('applyOrderBulkStatusBtn').addEventListener('click', applyOrderBulkStatus);
    $('completeSelectedOrdersBtn').addEventListener('click', completeSelectedOrders);
    $('deleteSelectedOrdersBtn').addEventListener('click', deleteSelectedOrders);
    $('clearSelectedOrdersBtn').addEventListener('click', clearSelectedOrders);
    $('emailOrderNo').addEventListener('input', syncEmailFactoryByOrder);
    $('emailTemplate').addEventListener('change', renderSmartEmail);
    $('toggleEmailTemplateFormBtn').addEventListener('click', toggleEmailTemplateForm);
    $('saveEmailTemplateBtn').addEventListener('click', saveCustomEmailTemplate);
    $('cancelEmailTemplateBtn').addEventListener('click', function () {
      clearEmailTemplateForm();
      $('emailTemplateForm').style.display = 'none';
    });
    $('emailReplyDeadline').addEventListener('input', renderSmartEmail);
    $('emailSignedDate').addEventListener('input', renderSmartEmail);
    $('emailFactory').addEventListener('input', renderSmartEmail);
    $('emailExtraNote').addEventListener('input', renderSmartEmail);
    $('renderEmailBtn').addEventListener('click', renderSmartEmail);
    $('copyEmailSubjectBtn').addEventListener('click', function () { copyTextFromElement('emailSubjectOutput', '邮件主题已复制'); });
    $('copyEmailBodyBtn').addEventListener('click', function () { copyTextFromElement('emailBodyOutput', '邮件正文已复制'); });
    $('copyEmailWechatBtn').addEventListener('click', function () { copyTextFromElement('emailWechatOutput', '微信群文案已复制'); });
    $('orderImportModalBackdrop').addEventListener('click', function (e) {
      if (e.target === $('orderImportModalBackdrop')) closeOrderImportModal();
    });
    $('openSupplierModalBtn').addEventListener('click', openSupplierModal);
    document.querySelectorAll('[data-supplier-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        supplierSubdir = btn.getAttribute('data-supplier-tab') || 'profile';
        if (supplierSubdir === 'inventory' && !selectedFactory) selectedFactory = '莱克';
        renderSupplierSubdir();
        renderFactoryCards();
        renderFactoryInventoryPanel();
        renderFactoryFollowDetail();
      });
    });
    $('closeSupplierModalBtn').addEventListener('click', closeSupplierModal);
    $('supplierForm').addEventListener('submit', onSupplierSubmit);
    $('antifakeMoveForm').addEventListener('submit', onAntifakeMoveSubmit);
    $('settlementFlowForm').addEventListener('submit', onSettlementFlowSubmit);
    $('temporaryPaymentForm').addEventListener('submit', onTemporaryPaymentSubmit);
    $('openTempPaymentFormBtn').addEventListener('click', openTemporaryPaymentForm);
    $('cancelTempPaymentFormBtn').addEventListener('click', closeTemporaryPaymentForm);
    $('settlementBillDate').addEventListener('change', syncSettlementPayDue);
    $('settlementBillFile').addEventListener('change', onSettlementBillFileChange);
    $('supplierModalBackdrop').addEventListener('click', function (e) {
      if (e.target === $('supplierModalBackdrop')) closeSupplierModal();
    });
    ['searchInput', 'filterFactory', 'filterModule', 'filterStatus', 'filterWeek'].forEach(function (id) {
      if (!$(id)) return;
      $(id).addEventListener('input', function () {
        libraryQuickFilter = '';
        renderAll();
      });
    });

    var monday = startOfWeek(today());
    $('weeklyStart').value = toYMD(monday);
    $('antifakeMoveDate').value = toYMD(today());
    $('settlementBillDate').value = toYMD(today());
    $('settlementMonth').value = previousMonthKey(today());
    $('tempPayDueDate').value = toYMD(today());
    $('emailReplyDeadline').value = toYMD(addDays(today(), 2));
    $('emailSignedDate').value = toYMD(today());
    syncSettlementPayDue();
    renderSmartEmail();
    renderAll();
  }

  function renderSelects() {
    var currentQuickFactory = $('quickFactory') ? $('quickFactory').value : '';
    var currentFactory = $('factory') ? $('factory').value : '';
    var currentFilterFactory = $('filterFactory') ? $('filterFactory').value : '';
    var currentAntifakeFactory = $('antifakeMoveFactory') ? $('antifakeMoveFactory').value : '';
    var currentSettlementFactory = $('settlementFactory') ? $('settlementFactory').value : '';
    fillSelect('quickFactory', factories, { anyLabel: '自动识别' });
    fillSelect('quickModule', modules, { anyLabel: '自动识别' });
    fillSelect('factory', factories, { anyLabel: '未指定' });
    fillSelect('antifakeMoveFactory', factories);
    fillSelect('settlementFactory', factories);
    fillSelect('module', modules);
    fillSelect('status', statuses);
    if ($('filterFactory')) fillSelect('filterFactory', factories, { anyLabel: '全部工厂' });
    if ($('filterModule')) fillSelect('filterModule', modules, { anyLabel: '全部模块' });
    if ($('filterStatus')) fillSelect('filterStatus', statuses, { anyLabel: '全部状态' });
    if (currentQuickFactory && factories.indexOf(currentQuickFactory) >= 0) $('quickFactory').value = currentQuickFactory;
    if (currentFactory && factories.indexOf(currentFactory) >= 0) $('factory').value = currentFactory;
    if ($('filterFactory') && currentFilterFactory && factories.indexOf(currentFilterFactory) >= 0) $('filterFactory').value = currentFilterFactory;
    if (currentAntifakeFactory && factories.indexOf(currentAntifakeFactory) >= 0) $('antifakeMoveFactory').value = currentAntifakeFactory;
    if (currentSettlementFactory && factories.indexOf(currentSettlementFactory) >= 0) $('settlementFactory').value = currentSettlementFactory;
    renderEmailTemplateOptions();
  }

  function getAllEmailTemplates() {
    var all = {};
    Object.keys(emailTemplates).forEach(function (key) {
      all[key] = emailTemplates[key];
    });
    (state.customEmailTemplates || []).forEach(function (template) {
      if (!template || !template.id) return;
      all[template.id] = {
        name: template.name,
        subject: template.subject,
        body: template.body,
        wechat: template.wechat || ''
      };
    });
    return all;
  }

  function renderEmailTemplateOptions() {
    var select = $('emailTemplate');
    if (!select) return;
    var current = select.value || 'pendingSign';
    var all = getAllEmailTemplates();
    select.innerHTML = Object.keys(all).map(function (key) {
      return '<option value="' + escapeHTML(key) + '">' + escapeHTML(all[key].name || key) + '</option>';
    }).join('');
    select.value = all[current] ? current : 'pendingSign';
  }

  function renderNav() {
    var nav = $('nav');
    nav.innerHTML = sections.map(function (s) {
      return '<button data-nav="' + s.id + '" class="' + (s.id === 'home' ? 'active' : '') + '">' +
        '<span>' + s.name + '</span><small>' + countForSection(s.id) + '</small></button>';
    }).join('');
    nav.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchSection(btn.getAttribute('data-nav'));
      });
    });
  }

  function countForSection(id) {
    if (id === 'home') return state.records.filter(function (r) { return r.status !== '已完成'; }).length;
    if (id === 'weekly') return state.records.filter(function (r) { return r.weeklyCategory !== 'ignore'; }).length;
    if (id === 'finance') {
      return state.records.filter(function (r) { return r.module === id; }).length + state.financePayments.filter(function (p) {
        return p.paymentStatus !== '已付款' || p.invoiceStatus !== '已开票';
      }).length;
    }
    if (id === 'reconciliation') {
      return state.records.filter(function (r) { return r.module === id; }).length + state.settlementFlows.filter(function (f) { return f.paymentStatus !== '已付款'; }).length;
    }
    return state.records.filter(function (r) { return r.module === id; }).length;
  }

  function switchSection(id) {
    if (!hasSection(id)) id = 'home';
    sections.forEach(function (s) {
      var section = document.querySelector('[data-section="' + s.id + '"]');
      if (section) section.classList.toggle('active', s.id === id);
    });
    document.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-nav') === id);
    });
    var current = sections.find(function (s) { return s.id === id; });
    $('pageTitle').textContent = current.name;
    $('pageDesc').textContent = current.desc;
  }

  function hasSection(id) {
    return sections.some(function (s) { return s.id === id; }) && !!document.querySelector('[data-section="' + id + '"]');
  }

  function sectionForRecordModule(moduleId) {
    if (hasSection(moduleId)) return moduleId;
    if (moduleId === 'packaging') return 'suppliers';
    return 'suppliers';
  }

  function renderAll() {
    renderNav();
    renderMetrics();
    renderHomeLists();
    renderSupplierSubdir();
    renderFactoryCards();
    renderFactoryInventoryPanel();
    renderFactoryFollowDetail();
    renderProjectCards();
    renderAntifakePanel();
    renderSettlementFlowPanel();
    renderFinancePaymentPanel();
    renderTables();
    renderOperationLogPanel();
  }

  function renderMetrics() {
    var board = $('overviewBoard');
    if (!board) return;
    var flows = state.settlementFlows || [];
    var payments = state.financePayments || [];
    var waitOrderFlows = flows.filter(function (f) {
      return f.reconciliationStatus === '已完成' && f.orderStatus !== '已完成';
    });
    var waitPayOrders = payments.filter(function (p) { return p.paymentStatus !== '已付款'; });
    var waitOrderAmount = waitOrderFlows.reduce(function (sum, f) {
      return sum + currencyNumber(f.checkAmount || f.amount);
    }, 0);
    var waitPayAmount = waitPayOrders.reduce(function (sum, p) {
      return sum + currencyNumber(p.amount);
    }, 0);
    var waitReconcile = flows.filter(function (f) { return f.reconciliationStatus !== '已完成'; }).length;
    var waitOrder = waitOrderFlows.length;
    var waitPay = flows.filter(function (f) {
      return f.orderStatus === '已完成' && f.paymentStatus !== '已付款';
    }).length;
    var closed = flows.filter(function (f) { return f.paymentStatus === '已付款'; }).length;
    var totalFlow = Math.max(flows.length, 1);
    var payOverdue = waitPayOrders.filter(function (p) {
      return p.dueDate && p.dueDate < toYMD(today());
    }).length;
    var activeOrderTasks = state.records.filter(function (r) {
      return r.module === 'orders' && r.status !== '已完成';
    }).length;
    var execRows = [
      { cls: 'wait-reconcile', label: '待对账', count: waitReconcile },
      { cls: 'wait-order', label: '待下单', count: waitOrder },
      { cls: 'wait-pay', label: '待付款', count: waitPay },
      { cls: 'done', label: '已闭环', count: closed }
    ];
    board.innerHTML =
      '<div class="overview-card primary clickable-card" data-overview-nav="reconciliation" title="点击进入工厂月结对账">' +
        '<div class="overview-head"><div><h3>待下单</h3><span>已完成对账，等待做采购单</span></div><span>月结流转</span></div>' +
        '<div class="overview-kpis">' +
          '<div class="overview-kpi"><span>数量</span><strong>' + waitOrderFlows.length + '</strong></div>' +
          '<div class="overview-kpi amount"><span>金额</span><strong>' + escapeHTML(formatCurrency(waitOrderAmount) || '￥0.00') + '</strong></div>' +
        '</div>' +
        '<div class="overview-note">点击查看需要补采购单号、推进下单的工厂月结单。</div>' +
      '</div>' +
      '<div class="overview-card warning clickable-card" data-overview-nav="finance" title="点击进入财务付款台账">' +
        '<div class="overview-head"><div><h3>待付款订单</h3><span>财务台账中尚未登记付款</span></div><span>' + (payOverdue ? payOverdue + ' 笔逾期' : '无逾期') + '</span></div>' +
        '<div class="overview-kpis">' +
          '<div class="overview-kpi"><span>数量</span><strong>' + waitPayOrders.length + '</strong></div>' +
          '<div class="overview-kpi amount"><span>金额</span><strong>' + escapeHTML(formatCurrency(waitPayAmount) || '￥0.00') + '</strong></div>' +
        '</div>' +
        '<div class="overview-note">点击查看待付款明细、付款日、开票状态和操作按钮。</div>' +
      '</div>' +
      '<div class="overview-card clickable-card" data-overview-nav="reconciliation" title="点击进入订单执行流转">' +
        '<div class="overview-head"><div><h3>订单执行情况</h3><span>对账 → 采购单 → 付款的闭环进度</span></div><span>订单跟进 ' + activeOrderTasks + ' 项</span></div>' +
        '<div class="execution-list">' + execRows.map(function (row) {
          var pct = Math.round(row.count / totalFlow * 100);
          return '<div class="execution-row ' + row.cls + '"><span>' + row.label + '</span><div class="execution-bar"><i style="width:' + pct + '%"></i></div><strong class="mono">' + row.count + '</strong></div>';
        }).join('') + '</div>' +
        '<div class="overview-note">统计基于工厂月结流转单；右上角同时提示订单模块未完成事项。</div>' +
      '</div>';
    board.querySelectorAll('[data-overview-nav]').forEach(function (card) {
      card.addEventListener('click', function () {
        switchSection(card.getAttribute('data-overview-nav'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderHomeLists() {
    var start = startOfWeek(today());
    var end = endOfWeek(today());
    $('weekRange').textContent = formatDate(toYMD(start)) + ' - ' + formatDate(toYMD(end));

    var weekTasks = state.records
      .filter(function (r) { return r.status !== '已完成' && isWithin(r.dueDate, start, end); })
      .sort(byDue)
      .slice(0, 8);
    var overdue = state.records.filter(isOverdue).sort(byDue).slice(0, 8);
    var delivery = state.records
      .filter(function (r) {
        var text = [r.content, r.nextStep, r.note].join(' ');
        return isWithin(r.dueDate, start, end) && /交付|发货|到货|物流|寄出|寄件|样品|订单/.test(text);
      })
      .sort(byDue)
      .slice(0, 8);

    $('weekTasks').innerHTML = listHTML(weekTasks);
    $('overdueTasks').innerHTML = listHTML(overdue);
    $('deliveryTasks').innerHTML = listHTML(delivery);
    bindHomeListClicks('weekTasks');
    bindHomeListClicks('overdueTasks');
    bindHomeListClicks('deliveryTasks');
    bindHomeCardClick('weekTasks', 'week');
    bindHomeCardClick('overdueTasks', 'overdue');
    bindHomeCardClick('deliveryTasks', 'delivery');
  }

  function listHTML(records) {
    if (!records.length) return '<div class="empty">暂无记录</div>';
    return records.map(function (r) {
      return '<div class="item clickable-item" data-home-record="' + r.id + '" title="点击进入对应模块并编辑"><div><strong>' + escapeHTML(r.content) + '</strong><small>' +
        escapeHTML(r.factory || '未指定') + ' · ' + moduleName(r.module) + ' · ' + formatDate(r.dueDate) +
        '</small></div><div>' + renderStatus(r) + '</div></div>';
    }).join('');
  }

  function bindHomeListClicks(containerId) {
    var container = $(containerId);
    if (!container) return;
    container.querySelectorAll('[data-home-record]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        openRecordFromHome(item.getAttribute('data-home-record'));
      });
    });
  }

  function bindHomeCardClick(containerId, mode) {
    if (!hasSection('library')) return;
    var container = $(containerId);
    if (!container || !container.closest) return;
    var card = container.closest('.card');
    if (!card) return;
    card.classList.add('clickable-card');
    card.onclick = function (e) {
      if (e.target.closest && e.target.closest('[data-home-record]')) return;
      goToLibraryQuickFilter(mode);
    };
  }

  function openRecordFromHome(id) {
    var record = state.records.find(function (r) { return r.id === id; });
    if (!record) return;
    switchSection(sectionForRecordModule(record.module));
    openModal(record);
  }

  function resetLibraryFilters() {
    if ($('searchInput')) $('searchInput').value = '';
    if ($('filterFactory')) $('filterFactory').value = '';
    if ($('filterModule')) $('filterModule').value = '';
    if ($('filterStatus')) $('filterStatus').value = '';
    if ($('filterWeek')) $('filterWeek').value = '';
  }

  function goToLibraryQuickFilter(mode) {
    if (!hasSection('library')) return;
    resetLibraryFilters();
    libraryQuickFilter = mode || 'all';
    if (mode === 'done' && $('filterStatus')) $('filterStatus').value = '已完成';
    if (mode === 'overdue' && $('filterWeek')) $('filterWeek').value = 'overdue';
    if ((mode === 'week' || mode === 'delivery') && $('filterWeek')) $('filterWeek').value = 'week';
    switchSection('library');
    renderTables();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function byDue(a, b) {
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
  }

  function renderSupplierSubdir() {
    var profile = $('supplierProfilePanel');
    var inventory = $('supplierInventoryPanel');
    if (!profile || !inventory) return;
    profile.style.display = supplierSubdir === 'profile' ? 'block' : 'none';
    inventory.style.display = supplierSubdir === 'inventory' ? 'block' : 'none';
    document.querySelectorAll('[data-supplier-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-supplier-tab') === supplierSubdir);
    });
    if (supplierSubdir === 'inventory' && !selectedFactory) selectedFactory = '莱克';
  }

  function renderFactoryCards() {
    $('factoryCards').innerHTML = state.suppliers.map(function (supplier) {
      var f = supplier.name;
      var records = state.records.filter(function (r) { return r.factory === f; });
      var open = records.filter(function (r) { return r.status !== '已完成'; }).length;
      var latest = records.slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); })[0];
      return '<div class="factory-card ' + (selectedFactory === f ? 'active' : '') + '" data-factory-card="' + escapeHTML(f) + '"><div><h4>' + escapeHTML(f) + '</h4><p>' +
        '主营：' + escapeHTML(supplier.products || '未填写') + ' · 对接人：' + escapeHTML(supplier.contact || '未填写') + '</p><p>' +
        '未完成 ' + open + ' 项 · 总记录 ' + records.length + ' 项' + (supplier.settle ? ' · ' + escapeHTML(supplier.settle) : '') + '</p><p>' +
        escapeHTML(latest ? latest.content : '暂无历史沟通记录') +
        '</p></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">' +
        (open ? '<span class="status pending">待跟进</span>' : '<span class="status done">正常</span>') +
        '<button class="btn danger factory-delete-btn" data-delete-factory="' + escapeHTML(f) + '" style="font-size:12px;padding:4px 10px;min-height:auto;">删除</button>' +
        '</div></div>';
    }).join('');
    $('factoryCards').querySelectorAll('[data-factory-card]').forEach(function (card) {
      card.addEventListener('click', function () {
        selectedFactory = card.getAttribute('data-factory-card');
        renderFactoryCards();
        renderFactoryInventoryPanel();
        renderFactoryFollowDetail();
      });
    });
    $('factoryCards').querySelectorAll('[data-delete-factory]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteSupplier(btn.getAttribute('data-delete-factory'));
      });
    });
  }

  function renderFactoryFollowDetail() {
    var card = $('factoryDetailCard');
    if (!selectedFactory) {
      card.style.display = 'none';
      return;
    }
    var records = state.records.filter(function (r) { return r.factory === selectedFactory; }).sort(byDue);
    var open = records.filter(function (r) { return r.status !== '已完成'; }).length;
    card.style.display = 'block';
    $('factoryDetailTitle').textContent = selectedFactory + '・跟进明细';
    $('factoryDetailSummary').textContent = '共 ' + records.length + ' 项，未完成 ' + open + ' 项';
    renderFactoryFollowTable(records);
  }

  function renderFactoryInventoryPanel() {
    var title = $('factoryInventoryTitle');
    var summary = $('factoryInventorySummary');
    var body = $('factoryInventoryBody');
    if (!title || !summary || !body) return;
    if (!selectedFactory) {
      title.textContent = '工厂库存管理';
      summary.textContent = '选择工厂后查看对应库存管理工具';
      body.innerHTML = '<div class="inventory-empty">请先点击上方工厂卡片。当前已接入：莱克库存管理。</div>';
      return;
    }
    title.textContent = selectedFactory + '・工厂库存管理';
    if (selectedFactory === '莱克') {
      summary.textContent = '已接入莱克进销存模块，可在当前工作台内查看和维护。';
      body.innerHTML =
        '<div class="pill-row" style="margin-bottom:12px;">' +
        '<span class="pill">莱克库存</span>' +
        '<span class="pill">工厂订单出货</span>' +
        '<a class="btn" href="./laike-inventory-dashboard/laike-inventory-dashboard.html" target="_blank" rel="noopener">新窗口打开</a>' +
        '</div>' +
        '<iframe class="inventory-frame" src="./laike-inventory-dashboard/laike-inventory-dashboard.html" title="莱克库存管理"></iframe>';
      return;
    }
    summary.textContent = '该工厂暂未接入独立库存管理程序';
    body.innerHTML = '<div class="inventory-empty">当前选择的是「' + escapeHTML(selectedFactory) + '」。这个工厂暂未接入库存管理程序；后续可以按莱克的方式继续接入。</div>';
  }

  function renderFactoryFollowTable(records) {
    if (!records.length) {
      $('factoryFollowTable').innerHTML = '<div class="empty">该工厂暂无事项，可先用首页“一键添加”录入。</div>';
      return;
    }
    var rows = records.map(function (r) {
      return '<tr>' +
        '<td>' + statusSelectHTML(r) + '</td>' +
        '<td><strong>' + escapeHTML(r.content) + '</strong><div class="muted">' + escapeHTML(r.nextStep || '') + '</div></td>' +
        '<td>' + moduleName(r.module) + '</td>' +
        '<td>' + escapeHTML(r.product || '') + '</td>' +
        '<td>' + escapeHTML(formatDate(r.dueDate)) + '</td>' +
        '<td><span class="mono">' + escapeHTML(shortTime(r.updatedAt)) + '</span></td>' +
        '<td><div class="record-actions"><button data-action="edit" data-id="' + r.id + '">编辑</button><button data-action="delete" data-id="' + r.id + '">删除</button></div></td>' +
        '</tr>';
    }).join('');
    $('factoryFollowTable').innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>跟进状态</th><th>事项 / 下一步</th><th>模块</th><th>产品 / 事项</th><th>时间节点</th><th>更新时间</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    $('factoryFollowTable').querySelectorAll('[data-status-id]').forEach(function (select) {
      select.addEventListener('change', onInlineStatusChange);
    });
    $('factoryFollowTable').querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', onTableAction);
    });
  }

  function statusSelectHTML(record) {
    var current = normalizeStatus(record.status);
    var options = statuses.filter(function (s) { return s.id !== '逾期'; }).map(function (s) {
      return '<option value="' + s.id + '"' + (current === s.id ? ' selected' : '') + '>' + s.name + '</option>';
    }).join('');
    return '<select class="status-select" data-status-id="' + record.id + '">' + options + '</select>';
  }

  function renderProjectCards() {
    var projectCards = $('projectCards');
    if (!projectCards) return;
    var cardHTML = projects.map(function (p, index) {
      var matched = state.records.filter(function (r) {
        return (p.factory === '多工厂' || r.factory === p.factory) && p.tags.some(function (t) {
          return [r.content, r.product, r.note, r.nextStep].join(' ').indexOf(t.split(' ')[0]) >= 0;
        });
      });
      var openRecords = matched.filter(function (r) { return r.status !== '已完成'; }).sort(function (a, b) {
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
      });
      var completedRecords = matched.filter(function (r) { return r.status === '已完成'; });
      if (!openRecords.length && completedRecords.length) return '';
      var open = openRecords.length;
      var editId = openRecords[0] ? openRecords[0].id : '';
      return '<div class="factory-card project-card clickable-card" role="button" tabindex="0" data-project-index="' + index + '" data-project-record-id="' + editId + '" title="点击编辑或补充这个项目">' +
        '<div><h4>' + p.name + '</h4><p>' + p.factory +
        ' · 未完成 ' + open + ' 项</p><div class="pill-row" style="margin-top:8px;">' +
        p.tags.map(function (t) { return '<span class="pill">' + t + '</span>'; }).join('') +
        '</div></div><div>' + (open ? '<span class="status doing">推进中</span>' : '<span class="status pending">待补充</span>') + '</div></div>';
    }).join('');
    projectCards.innerHTML = cardHTML || '<div class="empty" style="grid-column:1 / -1;">当前没有待补充或跟进中的项目，已完成项目可在下方跟进记录里查看。</div>';
    projectCards.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('click', function () { openProjectCard(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProjectCard(card);
        }
      });
    });
  }

  function openProjectCard(card) {
    var recordId = card.getAttribute('data-project-record-id');
    var index = Number(card.getAttribute('data-project-index'));
    var project = projects[index];
    if (recordId) {
      var record = state.records.find(function (r) { return r.id === recordId; });
      if (record) {
        openModal(record);
        return;
      }
    }
    if (!project) return;
    openModal({
      content: project.name + ' 待补充',
      factory: project.factory === '多工厂' ? '' : project.factory,
      product: project.name,
      module: 'projects',
      status: '待跟进',
      dueDate: '',
      owner: '',
      orderNo: '',
      logisticsNo: '',
      amount: '',
      nextStep: '补充当前进度和下一步',
      note: project.tags.join(' / '),
      weeklyCategory: 'auto'
    });
    $('recordId').value = '';
    $('modalTitle').textContent = '新建项目记录';
  }

  function renderTables() {
    renderTable('supplierTable', filterByModule('suppliers'));
    renderTable('orderTable', filterByModule('orders'));
    renderTable('financeTable', filterByModule('finance'));
    renderTable('reconciliationTable', filterByModule('reconciliation'));
    renderTable('antifakeTable', filterByModule('antifake'));
    renderTable('contractTable', filterByModule('contracts'));
    renderTable('projectTable', filterByModule('projects'));
  }

  function addOperationLog(action, record, detail) {
    state.operationLogs = Array.isArray(state.operationLogs) ? state.operationLogs : [];
    state.operationLogs.unshift({
      id: makeId(),
      time: nowISO(),
      action: action,
      module: record && record.module ? record.module : '',
      recordId: record && record.id ? record.id : '',
      title: record && record.content ? record.content : '',
      factory: record && record.factory ? record.factory : '',
      detail: detail || ''
    });
    state.operationLogs = state.operationLogs.slice(0, 300);
  }

  function renderOperationLogPanel() {
    var target = $('projectOperationLog');
    if (!target) return;
    var logs = (state.operationLogs || []).filter(function (log) {
      return log.module === 'projects';
    }).slice(0, 20);
    if (!logs.length) {
      target.innerHTML = '<div class="empty">暂无项目操作记录。之后项目的新增、编辑、删除都会自动留痕，且这里不提供删除入口。</div>';
      return;
    }
    target.innerHTML = '<div class="operation-log-list">' + logs.map(function (log) {
      return '<div class="operation-log-item">' +
        '<div><strong>' + escapeHTML(log.action || '操作') + '</strong><span>' + escapeHTML(log.title || '未命名项目记录') + '</span></div>' +
        '<small><span class="mono">' + escapeHTML(shortTime(log.time)) + '</span>' +
        (log.factory ? ' · ' + escapeHTML(log.factory) : '') +
        (log.detail ? ' · ' + escapeHTML(log.detail) : '') +
        '</small>' +
        '</div>';
    }).join('') + '</div>';
  }

  function renderAntifakePanel() {
    renderAntifakeStockPanel();
    renderAntifakeMovementTable();
  }

  function renderAntifakeStockPanel() {
    var panel = $('antifakeStockPanel');
    if (!panel) return;
    var hiddenBtn = $('toggleAntifakeHiddenBtn');
    var hiddenHint = $('antifakeHiddenHint');
    var hiddenFactories = factories.filter(function (factory) { return !!state.antifakeExempt[factory]; });
    var visibleFactories = factories.filter(function (factory) {
      return showAntifakeExemptFactories ? !!state.antifakeExempt[factory] : !state.antifakeExempt[factory];
    });

    if (hiddenBtn) {
      hiddenBtn.textContent = showAntifakeExemptFactories
        ? '返回正常防伪标看板'
        : '查看隐藏的无需寄标工厂（' + hiddenFactories.length + '）';
      hiddenBtn.classList.toggle('primary', showAntifakeExemptFactories);
      hiddenBtn.onclick = function () {
        showAntifakeExemptFactories = !showAntifakeExemptFactories;
        selectedAntifakeFactory = '';
        renderAntifakePanel();
      };
    }
    if (hiddenHint) {
      hiddenHint.textContent = showAntifakeExemptFactories
        ? '当前只显示已标记「无需寄标」的工厂，可在卡片内取消勾选后恢复到主看板。'
        : '主看板已自动隐藏「无需寄标」工厂，只保留需要关注库存的供应商。';
    }

    if (selectedAntifakeFactory && visibleFactories.indexOf(selectedAntifakeFactory) < 0) {
      selectedAntifakeFactory = '';
    }

    if (!visibleFactories.length) {
      panel.innerHTML = '<div class="empty antifake-empty">' +
        (showAntifakeExemptFactories ? '当前没有被隐藏的无需寄标工厂。' : '当前没有需要寄标跟进的工厂。') +
        '</div>';
      renderAntifakeMovementTable();
      return;
    }

    panel.innerHTML = visibleFactories.map(function (factory) {
      var qty = Number(state.antifakeStock[factory] || 0);
      var threshold = Number(state.antifakeThresholds[factory] != null ? state.antifakeThresholds[factory] : 50);
      var exempt = !!state.antifakeExempt[factory];
      var exemptNote = state.antifakeExemptNote[factory] || '';
      var low = !exempt && qty < threshold;

      // 计算寄出累计（send + initial）和扣减累计（use + damage + return）
      var sentTotal = 0;
      var deductedTotal = 0;
      state.antifakeMovements.forEach(function (m) {
        if (m.factory !== factory) return;
        if (m.type === 'send' || m.type === 'initial') {
          sentTotal += Number(m.qty || 0);
        } else {
          deductedTotal += Number(m.qty || 0);
        }
      });

      var cardClass = exempt ? 'exempt' : (low ? 'low' : '');
      if (selectedAntifakeFactory === factory) cardClass += ' active';
      var statusText = exempt
        ? '无需寄标' + (exemptNote ? '（' + escapeHTML(exemptNote) + '）' : '')
        : (low ? '红灯：低于 ' + threshold + '，需补充' : '库存正常');
      return '<div class="stock-card ' + cardClass + '" data-factory="' + escapeHTML(factory) + '">' +
        '<h4>' + escapeHTML(factory) + '</h4>' +
        '<div class="stock-summary">' +
        '<div class="stock-item"><span class="label">寄出累计</span><span class="value">' + sentTotal + '</span></div>' +
        '<div class="stock-item"><span class="label">扣减累计</span><span class="value">' + deductedTotal + '</span></div>' +
        '<div class="stock-item remaining"><span class="label">当前剩余</span><span class="value">' + qty + '</span></div>' +
        '</div>' +
        '<div class="stock-light">' + statusText + '</div>' +
        '<div class="threshold-field"><label>预警阈值</label>' +
        '<input type="number" min="0" value="' + threshold + '" data-threshold-factory="' + escapeHTML(factory) + '" class="threshold-input"' + (exempt ? ' disabled' : '') + '></div>' +
        '<div class="exempt-field">' +
        '<label class="exempt-toggle"><input type="checkbox" data-exempt-factory="' + escapeHTML(factory) + '"' + (exempt ? ' checked' : '') + '> 无需寄标</label>' +
        '</div>' +
        '<div class="exempt-note-field"' + (exempt ? '' : ' style="display:none;"') + '>' +
        '<input type="text" placeholder="填写备注（如已停止合作）" value="' + escapeHTML(exemptNote) + '" data-exempt-note="' + escapeHTML(factory) + '" class="exempt-note-input">' +
        '</div>' +
        '</div>';
    }).join('');

    // 点击卡片切换筛选
    panel.querySelectorAll('[data-factory]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        // 如果点击的是输入框或勾选框，不触发筛选
        if (e.target.closest('.threshold-field, .exempt-field, .exempt-note-field')) return;
        var factoryName = card.getAttribute('data-factory');
        selectedAntifakeFactory = selectedAntifakeFactory === factoryName ? '' : factoryName;
        renderAntifakePanel();
      });
    });

    panel.querySelectorAll('[data-threshold-factory]').forEach(function (input) {
      input.addEventListener('change', function () {
        var factoryName = input.getAttribute('data-threshold-factory');
        var val = Number(input.value);
        if (isNaN(val) || val < 0) val = 50;
        state.antifakeThresholds[factoryName] = val;
        saveState();
        renderAntifakeStockPanel();
      });
    });
    panel.querySelectorAll('[data-exempt-factory]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var factoryName = cb.getAttribute('data-exempt-factory');
        state.antifakeExempt[factoryName] = cb.checked;
        if (!cb.checked) {
          state.antifakeExemptNote[factoryName] = '';
        }
        saveState();
        renderAntifakeStockPanel();
        renderAntifakeMovementTable();
        toast(cb.checked ? '已设置「' + factoryName + '」无需寄标' : '已恢复「' + factoryName + '」防伪标预警');
      });
    });
    panel.querySelectorAll('[data-exempt-note]').forEach(function (input) {
      input.addEventListener('change', function () {
        var factoryName = input.getAttribute('data-exempt-note');
        state.antifakeExemptNote[factoryName] = input.value.trim();
        saveState();
      });
    });
  }

  function renderAntifakeMovementTable() {
    var target = $('antifakeMovementTable');
    if (!target) return;
    var filterLabel = $('antifakeMoveFilterLabel');

    // 按工厂筛选
    var list = state.antifakeMovements.slice();
    if (selectedAntifakeFactory) {
      list = list.filter(function (m) { return m.factory === selectedAntifakeFactory; });
      if (filterLabel) filterLabel.innerHTML = '<strong>' + escapeHTML(selectedAntifakeFactory) + '</strong> · 点击卡片取消筛选';
    } else {
      if (filterLabel) filterLabel.textContent = '全部工厂 · 点击上方卡片可单独筛选某工厂';
    }

    if (!list.length) {
      target.innerHTML = '<div class="empty">暂无防伪标流转记录。可通过上方表单或首页智能录入添加。</div>';
      return;
    }

    // 按日期升序排列以计算累计剩余
    var sorted = list.sort(function (a, b) {
      return (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    // 计算累计剩余
    var runningBalance = 0;
    var rows = sorted.map(function (m) {
      var typeLabelMap = { send: '寄出工厂', use: '订单扣减', damage: '损耗', return: '退回', initial: '工厂原剩余' };
      var typeLabel = typeLabelMap[m.type] || m.type;
      var isInflow = m.type === 'send' || m.type === 'initial';
      var sign = isInflow ? '+' : '-';
      if (isInflow) {
        runningBalance += Number(m.qty || 0);
      } else {
        runningBalance -= Number(m.qty || 0);
      }
      var sentCol = isInflow ? '<span class="mono" style="color:var(--accent)">' + Number(m.qty || 0) + '</span>' : '<span class="muted">—</span>';
      var deductCol = !isInflow ? '<span class="mono" style="color:var(--danger)">' + Number(m.qty || 0) + '</span>' : '<span class="muted">—</span>';
      var balanceClass = runningBalance < 0 ? 'style="color:var(--danger)"' : '';
      return '<tr>' +
        '<td>' + escapeHTML(formatDate(m.date)) + '</td>' +
        '<td>' + escapeHTML(typeLabel) + '</td>' +
        (!selectedAntifakeFactory ? '<td>' + escapeHTML(m.factory || '') + '</td>' : '') +
        '<td>' + escapeHTML(m.orderNo || '—') + '</td>' +
        '<td>' + (m.orderQty ? '<span class="mono">' + Number(m.orderQty) + '</span>' : '—') + '</td>' +
        '<td>' + escapeHTML(m.category || '—') + '</td>' +
        '<td>' + escapeHTML(m.labelSize || '—') + '</td>' +
        '<td>' + sentCol + '</td>' +
        '<td>' + deductCol + '</td>' +
        '<td><span class="mono" ' + balanceClass + '>' + runningBalance + '</span></td>' +
        '<td>' + escapeHTML(m.note || '') + '</td>' +
        '</tr>';
    }).join('');

    var factoryCol = selectedAntifakeFactory ? '' : '<th>工厂</th>';
    target.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>日期</th><th>类型</th>' + factoryCol +
      '<th>采购单号</th><th>采购单数量</th><th>品类</th><th>标尺寸</th>' +
      '<th>寄出(+)</th><th>扣减(-)</th><th>剩余</th><th>备注</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function syncSettlementPayDue() {
    if (!$('settlementBillDate') || !$('settlementPayDue')) return;
    var billDate = parseYMD($('settlementBillDate').value);
    if (!billDate) return;
    $('settlementPayDue').value = toYMD(lastWeekdayOfMonth(billDate, 4));
  }

  function renderSettlementFlowPanel() {
    var panel = $('settlementFlowPanel');
    if (!panel) return;
    var list = state.settlementFlows.slice().sort(function (a, b) {
      return (b.month || '').localeCompare(a.month || '') || (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    if (!list.length) {
      panel.innerHTML = '<div class="empty">暂无月结流转单。上方新增后，会按“对账 → 采购单 → 付款”自动跟进。</div>';
      return;
    }
    panel.innerHTML = '<div class="flow-list">' + list.map(function (flow) {
      var paid = flow.paymentStatus === '已付款';
      var dueOver = !paid && flow.paymentDueDate && flow.paymentDueDate < toYMD(today());
      var orderDue = settlementOrderDueDate(flow);
      var orderDueOver = flow.reconciliationStatus === '已完成' && flow.orderStatus !== '已完成' && orderDue < toYMD(today());
      var actions = [];
      if (flow.reconciliationStatus !== '已完成') actions.push('<button class="btn primary" data-settlement-action="confirm" data-flow-id="' + flow.id + '">确认对账完成</button>');
      if (flow.orderStatus !== '已完成') actions.push('<button class="btn primary" data-settlement-action="order" data-flow-id="' + flow.id + '">已做采购单</button>');
      if (flow.paymentStatus !== '已付款') actions.push('<button class="btn primary" data-settlement-action="pay" data-flow-id="' + flow.id + '">登记已付款</button>');
      actions.push('<button class="btn danger" data-settlement-action="delete" data-flow-id="' + flow.id + '">删除流转单</button>');
      return '<div class="flow-card">' +
        '<div class="flow-head"><div>' +
        '<h4>' + escapeHTML(flow.factory || '未指定工厂') + ' · ' + escapeHTML(flow.month || '未填账期') + '月结</h4>' +
        '<div class="flow-meta">账单金额：' + escapeHTML(flow.amount || '未填') +
        ' · 核对金额：' + escapeHTML(flow.checkAmount || '未填') +
        ' · 预计付款：' + escapeHTML(formatDate(flow.paymentDueDate) || '未设置') + '</div>' +
        (flow.diff ? '<div class="flow-meta">差异/备注：' + escapeHTML(flow.diff) + '</div>' : '') +
        '</div><div>' + flowFinalBadge(flow) + '</div></div>' +
        '<div class="flow-steps">' +
        flowStepHTML('1. 对账', flow.reconciliationStatus, flow.billDate, flow.reconciliationStatus === '已完成' ? 'done' : 'active') +
        flowStepHTML('2. 采购单', flow.orderStatus, (flow.orderNo || '待补采购单号') + ' · 通常15号左右做单：' + (formatDate(orderDue) || ''), flow.orderStatus === '已完成' ? 'done' : (orderDueOver ? 'overdue' : (flow.reconciliationStatus === '已完成' ? 'active' : ''))) +
        flowStepHTML('3. 付款', flow.paymentStatus, '通常20-30号付款，预计：' + (formatDate(flow.paymentDueDate) || '未设置'), paid ? 'done' : (dueOver ? 'overdue' : (flow.orderStatus === '已完成' ? 'active' : ''))) +
        '</div>' +
        '<div class="flow-actions">' + actions.join('') + '</div>' +
        '</div>';
    }).join('') + '</div>';
    panel.querySelectorAll('[data-settlement-action]').forEach(function (btn) {
      btn.addEventListener('click', onSettlementFlowAction);
    });
  }

  function flowStepHTML(title, status, detail, cls) {
    return '<div class="flow-step ' + (cls || '') + '">' +
      '<strong>' + escapeHTML(title) + '</strong>' +
      '<span class="status ' + flowStatusClass(status, cls) + '">' + escapeHTML(status) + '</span>' +
      '<small>' + escapeHTML(detail || '') + '</small>' +
      '</div>';
  }

  function flowStatusClass(status, cls) {
    if (cls === 'done' || status === '已付款') return 'done';
    if (cls === 'overdue') return 'overdue';
    if (cls === 'active') return 'doing';
    return statusClass(status);
  }

  function flowFinalBadge(flow) {
    if (flow.paymentStatus === '已付款') return '<span class="status done">已闭环</span>';
    if (flow.paymentDueDate && flow.paymentDueDate < toYMD(today())) return '<span class="status overdue">付款逾期</span>';
    if (flow.orderStatus === '已完成') return '<span class="status doing">待付款</span>';
    if (flow.reconciliationStatus === '已完成' && settlementOrderDueDate(flow) < toYMD(today())) return '<span class="status overdue">采购单待跟进</span>';
    if (flow.reconciliationStatus === '已完成') return '<span class="status confirm">待采购单</span>';
    return '<span class="status pending">待对账</span>';
  }

  function renderFinancePaymentPanel() {
    var panel = $('financePaymentPanel');
    if (!panel) return;
    var currentYear = today().getFullYear();
    var months = [7, 8, 9].map(function (month) { return currentYear + '-' + pad(month); });
    var scoped = state.financePayments.filter(function (p) {
      var key = monthKey(parseYMD(p.dueDate) || today());
      return months.indexOf(key) >= 0 || p.type === '采购订单待付款';
    }).sort(function (a, b) {
      return (a.dueDate || '').localeCompare(b.dueDate || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
    });
    var totalWaitPay = scoped.filter(function (p) { return p.paymentStatus !== '已付款'; }).length;
    var totalWaitPayAmount = scoped.filter(function (p) { return p.paymentStatus !== '已付款'; }).reduce(function (sum, p) {
      return sum + currencyNumber(p.amount);
    }, 0);
    var totalCard = '<div class="finance-month-card" style="margin-bottom:14px;">' +
      '<h4>7月 / 8月 / 9月待付款总台</h4>' +
      '<div class="finance-kpis">' +
      '<div class="finance-kpi danger"><span>待付款笔数</span><strong>' + totalWaitPay + '</strong></div>' +
      '<div class="finance-kpi danger"><span>待付款金额</span><strong>' + escapeHTML(formatCurrency(totalWaitPayAmount) || '￥0.00') + '</strong></div>' +
      '</div></div>';
    var cards = months.map(function (m) {
      var items = scoped.filter(function (p) { return monthKey(parseYMD(p.dueDate) || today()) === m; });
      var waitPay = items.filter(function (p) { return p.paymentStatus !== '已付款'; }).length;
      var paid = items.filter(function (p) { return p.paymentStatus === '已付款'; }).length;
      var waitInvoice = items.filter(function (p) { return p.invoiceStatus !== '已开票'; }).length;
      var invoiced = items.filter(function (p) { return p.invoiceStatus === '已开票'; }).length;
      var waitPayAmount = items.filter(function (p) { return p.paymentStatus !== '已付款'; }).reduce(function (sum, p) {
        return sum + currencyNumber(p.amount);
      }, 0);
      return '<div class="finance-month-card">' +
        '<h4>' + escapeHTML(m) + '</h4>' +
        '<div class="finance-kpis">' +
        '<div class="finance-kpi danger"><span>待付款</span><strong>' + waitPay + '</strong></div>' +
        '<div class="finance-kpi danger"><span>待付款金额</span><strong>' + escapeHTML(formatCurrency(waitPayAmount) || '￥0.00') + '</strong></div>' +
        '<div class="finance-kpi success"><span>已付款</span><strong>' + paid + '</strong></div>' +
        '<div class="finance-kpi warning"><span>待开票</span><strong>' + waitInvoice + '</strong></div>' +
        '<div class="finance-kpi success"><span>已开票</span><strong>' + invoiced + '</strong></div>' +
        '</div></div>';
    }).join('');
    if (!scoped.length) {
      panel.innerHTML = totalCard + '<div class="finance-month-grid">' + cards + '</div><div class="empty">7月、8月、9月暂无付款/开票记录。月结下推到付款或添加临时付款后会自动显示。</div>';
      return;
    }
    var rows = scoped.map(function (p) {
      var billNo = p.orderNo || p.kingdeeNo || '待补单号';
      return '<tr>' +
        '<td>' + escapeHTML(p.type || '') + '</td>' +
        '<td>' + escapeHTML(p.factory || '未指定') + '</td>' +
        '<td><span class="mono">' + escapeHTML(billNo) + '</span></td>' +
        '<td>' + escapeHTML(normalizeCurrency(p.amount)) + '</td>' +
        '<td>' + escapeHTML(p.requester || '') + '</td>' +
        '<td>' + escapeHTML(formatDate(p.dueDate) || '') + '</td>' +
        '<td><span class="status ' + (p.paymentStatus === '已付款' ? 'done' : statusClass('待跟进', p.dueDate)) + '">' + escapeHTML(p.paymentStatus) + '</span></td>' +
        '<td><span class="status ' + (p.invoiceStatus === '已开票' ? 'done' : 'pending') + '">' + escapeHTML(p.invoiceStatus) + '</span></td>' +
        '<td>' + escapeHTML(p.note || '') + '</td>' +
        '<td><div class="record-actions">' +
        (p.paymentStatus !== '已付款' ? '<button data-finance-action="paid" data-payment-id="' + p.id + '">已付款</button>' : '') +
        (p.invoiceStatus !== '已开票' ? '<button data-finance-action="invoiced" data-payment-id="' + p.id + '">已开票</button>' : '') +
        '<button data-finance-action="delete" data-payment-id="' + p.id + '">删除</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
    panel.innerHTML = totalCard + '<div class="finance-month-grid">' + cards + '</div>' +
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>来源</th><th>工厂</th><th>采购单号 / 金蝶单号</th><th>金额</th><th>请款人</th><th>预计付款日</th><th>付款状态</th><th>开票状态</th><th>备注</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    panel.querySelectorAll('[data-finance-action]').forEach(function (btn) {
      btn.addEventListener('click', onFinancePaymentAction);
    });
  }

  function onFinancePaymentAction(e) {
    var id = e.currentTarget.getAttribute('data-payment-id');
    var action = e.currentTarget.getAttribute('data-finance-action');
    var payment = state.financePayments.find(function (p) { return p.id === id; });
    if (!payment) return;
    if (action === 'delete') {
      if (!confirm('确认删除这条财务付款记录？关联普通事项不会删除。')) return;
      state.financePayments = state.financePayments.filter(function (p) { return p.id !== id; });
    }
    if (action === 'paid') markFinancePaymentPaid(payment);
    if (action === 'invoiced') markFinancePaymentInvoiced(payment);
    saveState();
    renderAll();
  }

  function filterByModule(moduleId) {
    return state.records.filter(function (r) { return r.module === moduleId; }).sort(byDue);
  }

  function filteredRecords() {
    var q = $('searchInput') ? $('searchInput').value.trim() : '';
    var factory = $('filterFactory') ? $('filterFactory').value : '';
    var moduleId = $('filterModule') ? $('filterModule').value : '';
    var status = $('filterStatus') ? $('filterStatus').value : '';
    var time = $('filterWeek') ? $('filterWeek').value : '';
    var start = startOfWeek(today());
    var end = endOfWeek(today());
    return state.records.filter(function (r) {
      var text = [r.content, r.factory, r.product, r.note, r.nextStep, r.orderNo, r.logisticsNo, r.amount].join(' ');
      if (libraryQuickFilter === 'open' && r.status === '已完成') return false;
      if (libraryQuickFilter === 'done' && r.status !== '已完成') return false;
      if (libraryQuickFilter === 'overdue' && !isOverdue(r)) return false;
      if (libraryQuickFilter === 'week' && !isWithin(r.dueDate, start, end)) return false;
      if (libraryQuickFilter === 'delivery') {
        if (!isWithin(r.dueDate, start, end)) return false;
        if (!/交付|发货|到货|物流|寄出|寄件|样品|订单/.test(text)) return false;
      }
      if (q && text.indexOf(q) < 0) return false;
      if (factory && r.factory !== factory) return false;
      if (moduleId && r.module !== moduleId) return false;
      if (status && getDisplayStatus(r) !== status) return false;
      if (time === 'today' && r.dueDate !== toYMD(today())) return false;
      if (time === 'week' && !isWithin(r.dueDate, start, end)) return false;
      if (time === 'overdue' && !isOverdue(r)) return false;
      return true;
    }).sort(byDue);
  }

  function renderTable(targetId, records) {
    if (!$(targetId)) return;
    if (!records.length) {
      $(targetId).innerHTML = '<div class="empty">暂无记录，可通过“新建工作记录”或首页快捷输入添加。</div>';
      if (targetId === 'orderTable') updateSelectedOrderCount();
      return;
    }
    var isOrderTable = targetId === 'orderTable';
    if (isOrderTable) {
      var visibleIds = records.map(function (r) { return r.id; });
      selectedOrderIds = selectedOrderIds.filter(function (id) { return visibleIds.indexOf(id) >= 0; });
    }
    var rows = records.map(function (r) {
      return '<tr>' +
        (isOrderTable ? '<td><input class="row-check order-row-check" type="checkbox" data-order-select="' + r.id + '"' + (selectedOrderIds.indexOf(r.id) >= 0 ? ' checked' : '') + '></td>' : '') +
        '<td>' + renderStatus(r) + '</td>' +
        '<td><strong>' + escapeHTML(r.content) + '</strong><div class="muted">' + escapeHTML(r.nextStep || '') + '</div></td>' +
        '<td>' + escapeHTML(r.factory || '未指定') + '</td>' +
        '<td>' + escapeHTML(r.orderNo || '') + '</td>' +
        '<td>' + escapeHTML(r.product || '') + '</td>' +
        '<td>' + moduleName(r.module) + '</td>' +
        '<td>' + escapeHTML(formatDate(r.dueDate)) + '</td>' +
        '<td>' + escapeHTML(r.logisticsNo || '') + '</td>' +
        '<td>' + escapeHTML(displayAmount(r)) + '</td>' +
        '<td><span class="mono">' + escapeHTML(shortTime(r.updatedAt)) + '</span></td>' +
        '<td><div class="record-actions">' +
        '<button data-action="done" data-id="' + r.id + '">完成</button>' +
        '<button data-action="edit" data-id="' + r.id + '">编辑</button>' +
        '<button data-action="delete" data-id="' + r.id + '">删除</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
    $(targetId).innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      (isOrderTable ? '<th><input class="row-check" type="checkbox" id="selectAllOrders"></th>' : '') +
      '<th>状态</th><th>工作内容 / 下一步</th><th>工厂</th><th>订单号</th><th>产品 / 事项</th><th>模块</th><th>时间节点</th><th>物流单号</th><th>金额 / 数量</th><th>更新时间</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    $(targetId).querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', onTableAction);
    });
    if (isOrderTable) bindOrderSelection(records);
  }

  function bindOrderSelection(records) {
    var selectAll = $('selectAllOrders');
    var visibleIds = records.map(function (r) { return r.id; });
    if (selectAll) {
      selectAll.checked = visibleIds.length > 0 && visibleIds.every(function (id) { return selectedOrderIds.indexOf(id) >= 0; });
      selectAll.addEventListener('change', function () {
        if (selectAll.checked) {
          visibleIds.forEach(function (id) {
            if (selectedOrderIds.indexOf(id) < 0) selectedOrderIds.push(id);
          });
        } else {
          selectedOrderIds = selectedOrderIds.filter(function (id) { return visibleIds.indexOf(id) < 0; });
        }
        renderTable('orderTable', filterByModule('orders'));
      });
    }
    $('orderTable').querySelectorAll('[data-order-select]').forEach(function (check) {
      check.addEventListener('change', function () {
        var id = check.getAttribute('data-order-select');
        if (check.checked && selectedOrderIds.indexOf(id) < 0) selectedOrderIds.push(id);
        if (!check.checked) selectedOrderIds = selectedOrderIds.filter(function (item) { return item !== id; });
        updateSelectedOrderCount();
      });
    });
    updateSelectedOrderCount();
  }

  function updateSelectedOrderCount() {
    var el = $('selectedOrderCount');
    if (el) el.textContent = selectedOrderIds.length;
  }

  function selectedOrderRecords() {
    return state.records.filter(function (r) {
      return r.module === 'orders' && selectedOrderIds.indexOf(r.id) >= 0;
    });
  }

  function applyOrderBulkStatus() {
    var records = selectedOrderRecords();
    if (!records.length) {
      toast('请先勾选需要操作的订单');
      return;
    }
    var status = $('orderBulkStatus').value;
    var time = nowISO();
    records.forEach(function (record) {
      record.status = normalizeStatus(status);
      record.updatedAt = time;
      if (record.status === '已完成') record.completedAt = time;
      if (record.status !== '已完成') record.completedAt = '';
      record.history = record.history || [];
      record.history.push({ time: time, action: '订单批量更新状态为：' + record.status });
    });
    saveState();
    renderAll();
    toast('已批量更新 ' + records.length + ' 个订单');
  }

  function completeSelectedOrders() {
    $('orderBulkStatus').value = '已完成';
    applyOrderBulkStatus();
  }

  function deleteSelectedOrders() {
    var records = selectedOrderRecords();
    if (!records.length) {
      toast('请先勾选需要删除的订单');
      return;
    }
    if (!confirm('确认删除选中的 ' + records.length + ' 个订单吗？')) return;
    var ids = records.map(function (r) { return r.id; });
    state.records = state.records.filter(function (r) { return ids.indexOf(r.id) < 0; });
    selectedOrderIds = [];
    saveState();
    renderAll();
    toast('已删除选中订单');
  }

  function clearSelectedOrders() {
    selectedOrderIds = [];
    renderTable('orderTable', filterByModule('orders'));
    toast('已清空订单选择');
  }

  function shortTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return toYMD(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function onQuickSubmit(e) {
    e.preventDefault();
    var raw = $('quickBulkContent').value.trim();
    if (!raw) return;
    var lines = raw.split(/\n+/).map(function (line) {
      return line.replace(/^[\s\-—•·、\d.）)]+/, '').trim();
    }).filter(Boolean);
    if (!lines.length) return;

    var added = [];
    var updated = [];

    lines.forEach(function (content) {
      var parsed = buildSmartRecord(content);
      var antifakeMove = parseAntifakeMovement(content, parsed);
      if (antifakeMove) {
        applyAntifakeMovement(antifakeMove);
      }
      var match = findMatchingRecord(content, parsed.factory, parsed.product);
      if (match) {
        var changes = applySmartUpdate(match, content, parsed);
        if (antifakeMove) {
          var moveLabelMap = { send: '防伪标寄出+', initial: '防伪标原剩余+', use: '防伪标扣减-', damage: '防伪标损耗-', return: '防伪标退回-' };
          var moveLabel = (moveLabelMap[antifakeMove.type] || '防伪标') + antifakeMove.qty;
          changes.push(moveLabel);
        }
        updated.push({ input: content, record: match, changes: changes });
      } else {
        addRecord(parsed, true);
        added.push({ input: content, factory: parsed.factory, product: parsed.product });
      }
    });

    saveState();
    renderAll();
    $('quickForm').reset();
    renderQuickFeedback(added, updated);
  }

  // 智能匹配：在已有未完成记录中找同工厂 + 同产品关键词的事项
  function findMatchingRecord(content, factory, product) {
    if (!factory) return null;
    var candidates = state.records.filter(function (r) {
      return r.factory === factory && r.status !== '已完成';
    });
    if (!candidates.length) return null;

    // 提取产品关键词
    var keywords = product ? product.split(' / ') : [];
    if (!keywords.length) keywords = extractKeywords(content);
    if (!keywords.length) return null;

    var bestMatch = null;
    var bestScore = 0;
    candidates.forEach(function (r) {
      var score = 0;
      keywords.forEach(function (kw) {
        if (r.content.indexOf(kw) >= 0) score++;
        if (r.product && r.product.indexOf(kw) >= 0) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = r;
      }
    });
    // 至少匹配 1 个产品关键词才算命中
    return (bestMatch && bestScore >= 1) ? bestMatch : null;
  }

  function extractKeywords(text) {
    text = text || '';
    var known = ['T7', 'T9', '机油', '雨刷', '车衣', '蓄电池', '防冻液', '标贴', '防伪标', '防伪码', 'LOGO', '卡扣', '辅料', '包材', '发票', '合同', '月结对账', '不良品', '样品', '包装', '装箱', '喷码'];
    return known.filter(function (k) { return text.indexOf(k) >= 0; });
  }

  function parseAntifakeMovement(content, parsed) {
    var text = content || '';
    if (!/防伪|防伪标|防伪码/.test(text)) return null;
    var factory = parsed.factory || inferFactory(text);
    var qty = inferQtyNumber(text);
    if (!factory || qty <= 0) return null;
    var type = 'send';
    if (/原剩余|原有|初始|期初|结余|库存余/.test(text)) {
      type = 'initial';
    } else if (/损耗|损坏|破损|报废|丢|倒置/.test(text)) {
      type = 'damage';
    } else if (/退回|退了|还回|归还/.test(text)) {
      type = 'return';
    } else if (/订单|使用|扣减|消耗|贴标|用了|用掉|出货/.test(text)) {
      type = 'use';
    } else if (/寄出|寄给|发给|发出|补充|领用|给.*工厂/.test(text)) {
      type = 'send';
    }
    var parsedDate = normalizeTime(text);
    return {
      type: type,
      factory: factory,
      qty: qty,
      date: parsedDate.date || toYMD(today()),
      note: '智能录入：' + text,
      source: 'smart'
    };
  }

  function inferQtyNumber(text) {
    var withUnit = String(text || '').match(/(\d+(?:\.\d+)?)\s*(?:张|个|枚|条|份)/);
    if (withUnit) return Number(withUnit[1]);
    var afterKeyword = String(text || '').match(/(?:数量|扣减|使用|寄出|发出|领用|原剩余|原有|初始|结余)[:：\s]*(\d+(?:\.\d+)?)/);
    return afterKeyword ? Number(afterKeyword[1]) : 0;
  }

  // 对已有记录做智能更新：状态、订单号、物流单号、数量、时间、下一步
  function applySmartUpdate(record, content, parsed) {
    var changes = [];
    var time = nowISO();

    if (parsed.status && parsed.status !== record.status) {
      record.status = parsed.status;
      changes.push('状态→' + parsed.status);
      if (parsed.status === '已完成') record.completedAt = time;
    }

    if (parsed.orderNo && !record.orderNo) {
      record.orderNo = parsed.orderNo;
      changes.push('订单号→' + parsed.orderNo);
    }

    if (parsed.logisticsNo && !record.logisticsNo) {
      record.logisticsNo = parsed.logisticsNo;
      changes.push('物流单号→' + parsed.logisticsNo);
    }

    if (parsed.amount && !record.amount) {
      record.amount = parsed.amount;
      changes.push('数量→' + parsed.amount);
    }

    if (parsed.dueDate && parsed.dueDate !== record.dueDate) {
      record.dueDate = parsed.dueDate;
      changes.push('时间→' + formatDate(parsed.dueDate));
    }

    if (parsed.nextStep) {
      record.nextStep = parsed.nextStep;
      changes.push('下一步已更新');
    }

    record.note = (record.note || '') + (record.note ? ' | ' : '') + '智能更新：' + content;
    record.updatedAt = time;
    record.history = record.history || [];
    record.history.push({ time: time, action: '智能更新：' + (changes.join('，') || '内容补充') });

    return changes;
  }

  function renderQuickFeedback(added, updated) {
    var el = $('quickFeedback');
    if (!el) return;
    var html = '';
    if (added.length) {
      html += '<div class="feedback-section"><strong>新增 ' + added.length + ' 条事项</strong>';
      added.forEach(function (a) {
        html += '<div class="feedback-item added">＋ ' + escapeHTML(a.input) + '</div>';
      });
      html += '</div>';
    }
    if (updated.length) {
      html += '<div class="feedback-section"><strong>更新 ' + updated.length + ' 条已有事项状态</strong>';
      updated.forEach(function (u) {
        var label = escapeHTML(u.record.factory || '未指定') + ' · ' + escapeHTML(u.record.product || u.record.content.slice(0, 20));
        var detail = u.changes.length ? u.changes.join('，') : '内容补充';
        html += '<div class="feedback-item updated">↻ ' + label + '：' + escapeHTML(detail) + '</div>';
      });
      html += '</div>';
    }
    el.innerHTML = html;
    el.style.display = html ? 'block' : 'none';
  }

  function buildSmartRecord(content) {
    var parsed = normalizeTime(content);
    var status = inferStatus(content);
    var orderNo = inferOrderNo(content);
    var logisticsNo = inferLogisticsNo(content);
    var amount = inferAmount(content);
    var noteParts = [];
    if (parsed.label) noteParts.push('时间识别：' + parsed.label);
    if (!parsed.date) noteParts.push('未识别到明确日期，可后续补充时间节点。');
    return {
      content: content,
      factory: inferFactory(content),
      product: inferProduct(content),
      module: inferModule(content),
      status: status,
      dueDate: parsed.date,
      owner: '',
      orderNo: orderNo,
      logisticsNo: logisticsNo,
      amount: amount,
      nextStep: inferNextStep(content, status),
      note: noteParts.join(' '),
      weeklyCategory: 'auto'
    };
  }

  function inferStatus(text) {
    text = text || '';
    if (/已完成|完成了|已处理|已确认|已发货|已到货|已寄出|发走了|收到了|到了|搞定了|办完了|寄出了|签了|回签了|已开票|已付款|已对账/.test(text)) return '已完成';
    if (/待确认|确认中|等确认|需确认|待反馈|等反馈|待回复|等回复|待核对|待定|未确认/.test(text)) return '待确认';
    if (/跟进中|处理中|推进中|沟通中|核对中|生产中|在做|在跟进|在处理|正在|安排中|打样中|对账中|制作中/.test(text)) return '跟进中';
    return '待跟进';
  }

  function inferNextStep(text, status) {
    if (status === '已完成') return '';
    if (/确认|核对|跟进|沟通|处理|登记|申请|补发|寄送|发货/.test(text)) return text;
    return '';
  }

  function inferLogisticsNo(text) {
    var match = String(text || '').match(/(?:物流单号|快递单号|运单号|物流|快递)[:：#\s]*([A-Za-z0-9\-]{6,})/);
    return match ? match[1] : '';
  }

  function inferOrderNo(text) {
    var raw = String(text || '');
    var labeled = raw.match(/(?:订单号|采购单号|采购订单号|平台订单号|合同号|PO|po|单据号)[:：#\s]*([A-Za-z0-9][A-Za-z0-9\-_\/]{4,})/);
    if (labeled) return labeled[1].replace(/[，,。;；\s]+$/, '');
    var parts = raw.split(/[\t,，;；\s]+/).filter(Boolean);
    var candidates = parts.filter(function (p) {
      if (/^(物流单号|快递单号|数量|金额|元|万元)$/.test(p)) return false;
      return /[A-Za-z]/.test(p) && /\d/.test(p) && /^[A-Za-z0-9\-_\/]{5,}$/.test(p);
    });
    return candidates.length ? candidates[0] : '';
  }

  function inferAmount(text) {
    var match = String(text || '').match(/(\d+(?:\.\d+)?\s*(?:元|万元|张|个|件|箱|瓶|桶|套|只|条|支|批))/);
    return match ? match[1] : '';
  }

  function onRecordSubmit(e) {
    e.preventDefault();
    var id = $('recordId').value;
    var content = $('content').value.trim();
    var parsed = normalizeTime($('dueText').value || content);
    var dueDate = $('dueDate').value || parsed.date;
    var payload = {
      content: content,
      factory: $('factory').value || inferFactory(content),
      product: $('product').value || inferProduct(content),
      module: $('module').value || inferModule(content),
      status: normalizeStatus($('status').value),
      dueDate: dueDate,
      owner: $('owner').value.trim(),
      orderNo: $('orderNo').value.trim() || inferOrderNo(content),
      logisticsNo: $('logisticsNo').value.trim(),
      amount: $('amount').value.trim(),
      nextStep: $('nextStep').value.trim(),
      note: $('note').value.trim(),
      weeklyCategory: $('weeklyCategory').value
    };
    if (id) {
      updateRecord(id, payload);
      toast('已更新记录');
    } else {
      addRecord(payload);
      toast('已保存记录');
    }
    closeModal();
  }

  function onSettlementFlowSubmit(e) {
    e.preventDefault();
    var billDate = $('settlementBillDate').value || toYMD(today());
    var paymentDueDate = $('settlementPayDue').value || toYMD(lastWeekdayOfMonth(parseYMD(billDate) || today(), 4));
    var factory = $('settlementFactory').value;
    var month = $('settlementMonth').value;
    if (!factory || !month) {
      toast('请先选择工厂和账期月份');
      return;
    }
    var flow = {
      id: makeId(),
      factory: factory,
      month: month,
      billDate: billDate,
      amount: normalizeCurrency($('settlementAmount').value),
      checkAmount: normalizeCurrency($('settlementCheckAmount').value),
      orderNo: $('settlementOrderNo').value.trim(),
      paymentDueDate: paymentDueDate,
      diff: $('settlementDiff').value.trim(),
      reconciliationStatus: '待对账',
      orderStatus: '待做采购单',
      paymentStatus: '待付款',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      history: [{ time: nowISO(), action: '新增月结流转单' }]
    };
    var reconRecord = createSettlementLinkedRecord(flow, 'reconciliation', '待确认');
    flow.reconciliationRecordId = reconRecord.id;
    state.settlementFlows.unshift(flow);
    saveState();
    renderAll();
    $('settlementFlowForm').reset();
    $('settlementBillDate').value = toYMD(today());
    $('settlementMonth').value = previousMonthKey(today());
    syncSettlementPayDue();
    toast('已新增月结流转单：' + factory + ' ' + month);
  }

  function onTemporaryPaymentSubmit(e) {
    e.preventDefault();
    var kingdeeNo = $('tempPayKingdeeNo').value.trim();
    var amount = normalizeCurrency($('tempPayAmount').value);
    var requester = $('tempPayRequester').value.trim();
    var dueDate = $('tempPayDueDate').value || toYMD(today());
    var reason = $('tempPayReason').value.trim();
    if (!amount) {
      toast('请填写付款金额');
      return;
    }
    var record = addRecord({
      content: '临时付款' + (kingdeeNo ? ' ' + kingdeeNo : '') + (requester ? ' · 请款人：' + requester : ''),
      factory: '',
      product: '临时付款',
      module: 'finance',
      status: '待跟进',
      dueDate: dueDate,
      owner: requester,
      orderNo: kingdeeNo,
      logisticsNo: '',
      amount: amount,
      nextStep: '跟进付款与开票状态',
      note: reason || '临时付款',
      weeklyCategory: 'auto'
    }, true);
    state.financePayments.unshift({
      id: makeId(),
      type: '临时付款',
      factory: '',
      kingdeeNo: kingdeeNo,
      orderNo: '',
      amount: amount,
      requester: requester,
      dueDate: dueDate,
      paymentStatus: '待付款',
      invoiceStatus: '待开票',
      note: reason,
      recordId: record.id,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      history: [{ time: nowISO(), action: '新增临时付款' }]
    });
    saveState();
    renderAll();
    closeTemporaryPaymentForm();
    toast('已新增临时付款');
  }

  function openTemporaryPaymentForm() {
    $('temporaryPaymentForm').style.display = 'grid';
    $('openTempPaymentFormBtn').style.display = 'none';
    $('tempPayDueDate').value = $('tempPayDueDate').value || toYMD(today());
  }

  function closeTemporaryPaymentForm() {
    $('temporaryPaymentForm').reset();
    $('tempPayDueDate').value = toYMD(today());
    $('temporaryPaymentForm').style.display = 'none';
    $('openTempPaymentFormBtn').style.display = 'inline-flex';
  }

  function onSettlementFlowAction(e) {
    var id = e.currentTarget.getAttribute('data-flow-id');
    var action = e.currentTarget.getAttribute('data-settlement-action');
    var flow = state.settlementFlows.find(function (f) { return f.id === id; });
    if (!flow) return;
    if (action === 'delete') {
      if (!confirm('确认删除这条月结流转单？关联的普通事项记录不会删除。')) return;
      state.settlementFlows = state.settlementFlows.filter(function (f) { return f.id !== id; });
      state.financePayments = state.financePayments.filter(function (p) { return p.flowId !== id; });
      saveState();
      renderAll();
      toast('已删除月结流转单');
      return;
    }
    if (action === 'confirm') {
      completeSettlementReconciliation(flow);
      toast('已确认对账完成，并生成采购单待办');
    }
    if (action === 'order') {
      completeSettlementReconciliation(flow);
      if (!flow.orderNo) {
        var orderNo = prompt('请输入采购单号（可留空后续再补）', '');
        if (orderNo) flow.orderNo = orderNo.trim();
      }
      completeSettlementOrder(flow);
      toast('已完成采购单节点，并生成付款待办');
    }
    if (action === 'pay') {
      completeSettlementReconciliation(flow);
      completeSettlementOrder(flow);
      completeSettlementPayment(flow);
      toast('已登记付款，月结流转已闭环');
    }
    flow.updatedAt = nowISO();
    flow.history.push({ time: flow.updatedAt, action: settlementActionText(action) });
    saveState();
    renderAll();
  }

  function settlementActionText(action) {
    if (action === 'confirm') return '确认对账完成';
    if (action === 'order') return '已做采购单';
    if (action === 'pay') return '登记已付款';
    return action;
  }

  function completeSettlementReconciliation(flow) {
    flow.reconciliationStatus = '已完成';
    updateSettlementLinkedRecord(flow.reconciliationRecordId, {
      status: '已完成',
      nextStep: '',
      note: flowNote(flow, '对账已确认，等待采购单下推。')
    });
    if (!flow.orderRecordId) {
      var orderRecord = createSettlementLinkedRecord(flow, 'orders', '待跟进');
      flow.orderRecordId = orderRecord.id;
    }
    syncSettlementLinkedDueDates(flow);
  }

  function completeSettlementOrder(flow) {
    flow.reconciliationStatus = '已完成';
    flow.orderStatus = '已完成';
    updateSettlementLinkedRecord(flow.orderRecordId, {
      status: '已完成',
      orderNo: flow.orderNo || '',
      nextStep: '',
      note: flowNote(flow, '采购单已完成，等待账期内付款。')
    });
    if (!flow.financeRecordId) {
      var financeRecord = createSettlementLinkedRecord(flow, 'finance', '待跟进');
      flow.financeRecordId = financeRecord.id;
    }
    syncSettlementLinkedDueDates(flow);
    ensureFinancePaymentForFlow(flow);
  }

  function completeSettlementPayment(flow) {
    flow.reconciliationStatus = '已完成';
    flow.orderStatus = '已完成';
    flow.paymentStatus = '已付款';
    updateSettlementLinkedRecord(flow.financeRecordId, {
      status: '已完成',
      orderNo: flow.orderNo || '',
      nextStep: '',
      note: flowNote(flow, '付款已完成，月结闭环。')
    });
    var payment = ensureFinancePaymentForFlow(flow);
    markFinancePaymentPaid(payment);
  }

  function ensureFinancePaymentForFlow(flow) {
    var payment = state.financePayments.find(function (p) { return p.flowId === flow.id; });
    if (!payment) {
      payment = {
        id: makeId(),
        type: '月结付款',
        flowId: flow.id,
        recordId: flow.financeRecordId || '',
        factory: flow.factory,
        orderNo: flow.orderNo || '',
        amount: flow.amount || flow.checkAmount || '',
        dueDate: flow.paymentDueDate,
        paymentStatus: flow.paymentStatus === '已付款' ? '已付款' : '待付款',
        invoiceStatus: '待开票',
        note: flow.month + '月结付款',
        createdAt: nowISO(),
        updatedAt: nowISO(),
        history: [{ time: nowISO(), action: '月结流转生成付款记录' }]
      };
      state.financePayments.unshift(payment);
    } else {
      payment.recordId = flow.financeRecordId || payment.recordId;
      payment.factory = flow.factory;
      payment.orderNo = flow.orderNo || payment.orderNo;
      payment.amount = flow.amount || flow.checkAmount || payment.amount;
      payment.dueDate = flow.paymentDueDate || payment.dueDate;
      payment.updatedAt = nowISO();
    }
    return payment;
  }

  function markFinancePaymentPaid(payment) {
    if (!payment) return;
    payment.paymentStatus = '已付款';
    payment.paidAt = nowISO();
    payment.updatedAt = nowISO();
    payment.history = payment.history || [];
    payment.history.push({ time: payment.updatedAt, action: '标记已付款' });
    updateSettlementLinkedRecord(payment.recordId, {
      status: '已完成',
      orderNo: payment.orderNo || '',
      nextStep: payment.invoiceStatus === '已开票' ? '' : '等待开票',
      note: (payment.note || '') + '；付款已完成。'
    });
    if (payment.flowId) {
      var flow = state.settlementFlows.find(function (f) { return f.id === payment.flowId; });
      if (flow) flow.paymentStatus = '已付款';
    }
  }

  function markFinancePaymentInvoiced(payment) {
    if (!payment) return;
    payment.invoiceStatus = '已开票';
    payment.invoiceAt = nowISO();
    payment.updatedAt = nowISO();
    payment.history = payment.history || [];
    payment.history.push({ time: payment.updatedAt, action: '标记已开票' });
    updateSettlementLinkedRecord(payment.recordId, {
      note: (payment.note || '') + '；发票已开。'
    });
  }

  function createSettlementLinkedRecord(flow, moduleId, status) {
    var titleMap = {
      reconciliation: flow.factory + ' ' + flow.month + '月结对账',
      orders: flow.factory + ' ' + flow.month + '月结采购单',
      finance: flow.factory + ' ' + flow.month + '月结付款'
    };
    var nextStepMap = {
      reconciliation: '核对工厂账单金额、采购核对金额和差异项',
      orders: '月结货款通常15号左右做采购单',
      finance: '月结货款通常20-30号付款'
    };
    return addRecord({
      content: titleMap[moduleId],
      factory: flow.factory,
      product: '月结流转',
      module: moduleId,
      status: status,
      dueDate: settlementRecordDueDate(flow, moduleId),
      owner: '',
      orderNo: flow.orderNo || '',
      logisticsNo: '',
      amount: moduleId === 'reconciliation' ? (flow.checkAmount || flow.amount) : flow.amount,
      nextStep: nextStepMap[moduleId],
      note: flowNote(flow, ''),
      weeklyCategory: 'auto'
    }, true);
  }

  function settlementRecordDueDate(flow, moduleId) {
    if (moduleId === 'orders') return settlementOrderDueDate(flow);
    if (moduleId === 'finance') return flow.paymentDueDate;
    return flow.billDate;
  }

  function syncSettlementLinkedDueDates(flow) {
    [
      { id: flow.orderRecordId, moduleId: 'orders' },
      { id: flow.financeRecordId, moduleId: 'finance' }
    ].forEach(function (item) {
      if (!item.id) return;
      var record = state.records.find(function (r) { return r.id === item.id; });
      if (!record || record.status === '已完成') return;
      record.dueDate = settlementRecordDueDate(flow, item.moduleId) || record.dueDate;
      record.updatedAt = nowISO();
    });
  }

  function updateSettlementLinkedRecord(recordId, payload) {
    var record = state.records.find(function (r) { return r.id === recordId; });
    if (!record) return;
    var previousStatus = record.status;
    Object.assign(record, payload);
    record.updatedAt = nowISO();
    if (record.status === '已完成' && previousStatus !== '已完成') record.completedAt = record.updatedAt;
    if (record.status !== '已完成') record.completedAt = '';
    record.history = record.history || [];
    record.history.push({ time: record.updatedAt, action: '月结流转自动更新：' + record.status });
  }

  function flowNote(flow, extra) {
    var parts = [
      '账期：' + (flow.month || ''),
      '账单日期：' + (formatDate(flow.billDate) || ''),
      '预计付款日：' + (formatDate(flow.paymentDueDate) || ''),
      '账单金额：' + (flow.amount || '未填'),
      '核对金额：' + (flow.checkAmount || '未填')
    ];
    if (flow.diff) parts.push('差异/备注：' + flow.diff);
    if (extra) parts.push(extra);
    return parts.join('；');
  }

  function addRecord(payload, skipRender) {
    var time = nowISO();
    var record = Object.assign({
      id: makeId(),
      createdAt: time,
      updatedAt: time,
      completedAt: payload.status === '已完成' ? time : '',
      history: [{ time: time, action: '创建记录' }]
    }, payload);
    state.records.unshift(record);
    if (record.module === 'projects') {
      addOperationLog('新增项目记录', record, '通过项目卡片或表单新增');
    }
    if (!skipRender) {
      saveState();
      renderAll();
    }
    return record;
  }

  function updateRecord(id, payload) {
    var record = state.records.find(function (r) { return r.id === id; });
    if (!record) return;
    var previousStatus = record.status;
    Object.assign(record, payload);
    record.updatedAt = nowISO();
    if (payload.status === '已完成' && previousStatus !== '已完成') record.completedAt = record.updatedAt;
    record.history = record.history || [];
    record.history.push({ time: record.updatedAt, action: '更新记录' });
    if (record.module === 'projects' || payload.module === 'projects') {
      addOperationLog('编辑项目记录', record, '状态：' + normalizeStatus(record.status));
    }
    saveState();
    renderAll();
  }

  function onTableAction(e) {
    var btn = e.currentTarget;
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');
    var record = state.records.find(function (r) { return r.id === id; });
    if (!record) return;
    if (action === 'done') {
      record.status = '已完成';
      record.completedAt = nowISO();
      record.updatedAt = record.completedAt;
      record.history = record.history || [];
      record.history.push({ time: record.updatedAt, action: '标记为已完成' });
      if (record.module === 'projects') {
        addOperationLog('完成项目记录', record, '标记为已完成');
      }
      saveState();
      renderAll();
      toast('已标记完成');
    }
    if (action === 'edit') openModal(record);
    if (action === 'delete') {
      if (confirm('确定删除这条记录吗？')) {
        if (record.module === 'projects') {
          addOperationLog('删除项目记录', record, '记录内容已删除，操作留痕保留');
        }
        state.records = state.records.filter(function (r) { return r.id !== id; });
        saveState();
        renderAll();
        toast('已删除记录');
      }
    }
  }

  function onInlineStatusChange(e) {
    var select = e.currentTarget;
    var id = select.getAttribute('data-status-id');
    var record = state.records.find(function (r) { return r.id === id; });
    if (!record) return;
    record.status = normalizeStatus(select.value);
    record.updatedAt = nowISO();
    if (record.status === '已完成') record.completedAt = record.updatedAt;
    if (record.status !== '已完成') record.completedAt = '';
    record.history = record.history || [];
    record.history.push({ time: record.updatedAt, action: '工厂明细更新状态为：' + record.status });
    if (record.module === 'projects') {
      addOperationLog('更新项目状态', record, '状态：' + record.status);
    }
    saveState();
    renderAll();
    toast('已更新状态：' + record.status);
  }

  function openModal(record) {
    $('modalTitle').textContent = record ? '编辑工作记录' : '新建工作记录';
    $('recordForm').reset();
    $('recordId').value = record ? record.id : '';
    $('content').value = record ? record.content : '';
    $('factory').value = record ? record.factory : '';
    $('product').value = record ? record.product : '';
    $('module').value = record ? record.module : 'suppliers';
    $('status').value = record ? normalizeStatus(record.status) : '待跟进';
    $('dueText').value = '';
    $('dueDate').value = record ? record.dueDate : '';
    $('owner').value = record ? record.owner : '';
    $('orderNo').value = record ? (record.orderNo || '') : '';
    $('logisticsNo').value = record ? record.logisticsNo : '';
    $('amount').value = record ? record.amount : '';
    $('nextStep').value = record ? record.nextStep : '';
    $('note').value = record ? record.note : '';
    $('weeklyCategory').value = record ? record.weeklyCategory : 'auto';
    $('modalBackdrop').classList.add('show');
  }

  function closeModal() {
    $('modalBackdrop').classList.remove('show');
  }

  function openOrderImportModal() {
    $('orderImportForm').reset();
    $('orderImportFeedback').style.display = 'none';
    $('orderImportFeedback').innerHTML = '';
    $('orderImportModalBackdrop').classList.add('show');
  }

  function closeOrderImportModal() {
    $('orderImportModalBackdrop').classList.remove('show');
  }

  function setupPurchaseOrderUpload() {
    var drop = $('purchaseOrderDropZone');
    var input = $('purchaseOrderFileInput');
    if (!drop || !input) return;
    drop.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) readPurchaseOrderFile(file);
    });
    ['dragenter', 'dragover'].forEach(function (eventName) {
      drop.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (eventName) {
      drop.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove('drag-over');
      });
    });
    drop.addEventListener('drop', function (e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) readPurchaseOrderFile(file);
    });
  }

  function readPurchaseOrderFile(file) {
    var name = file.name || '';
    var ext = name.split('.').pop().toLowerCase();
    var done = function (rows) {
      var parsed = parsePurchaseOrderRows(rows, name);
      pendingPurchaseOrderImport = parsed;
      renderPurchaseOrderPreview(parsed);
    };
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      var textReader = new FileReader();
      textReader.onload = function () { done(parseDelimitedRows(String(textReader.result || ''))); };
      textReader.readAsText(file, 'UTF-8');
      return;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      if (!window.XLSX) {
        renderPurchaseOrderUploadMessage('Excel 解析库未加载，请检查网络后重试，或另存为 CSV 后上传。', 'updated');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var workbook = XLSX.read(reader.result, { type: 'array', cellDates: true });
        var rows = [];
        workbook.SheetNames.forEach(function (sheetName) {
          rows = rows.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' }));
        });
        done(rows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    renderPurchaseOrderUploadMessage('暂不支持该文件格式，请使用 Excel、CSV 或 TSV。', 'updated');
  }

  function parseDelimitedRows(text) {
    return String(text || '').split(/\n+/).map(function (line) {
      return line.split(/\t|,|，/).map(function (cell) { return cell.trim(); });
    });
  }

  function parsePurchaseOrderRows(rows, fileName) {
    rows = (rows || []).filter(function (row) {
      return row && row.some(function (cell) { return String(cell || '').trim(); });
    });
    var headerInfo = findPurchaseOrderHeader(rows);
    var header = headerInfo.header;
    var map = detectPurchaseOrderHeaderMap(header);
    var topOrderNo = detectLabeledValue(rows, fileName, ['订单编号', '订单号', '采购订单号', '采购单号', 'IBOC号', 'IBOC号码', 'IBOC', 'PO']);
    var topDate = detectLabeledValue(rows, fileName, ['下单日期', '订单日期', '采购日期', '日期']);
    var topSupplier = detectPurchaseOrderSupplier(rows, fileName, map, headerInfo.index);
    var summaryTotal = detectPurchaseOrderSummaryTotal(rows, map, headerInfo.index);
    var item = detectFirstPurchaseOrderItem(rows, map, headerInfo.index, {
      supplier: topSupplier,
      orderNo: topOrderNo,
      orderDate: parseDateText(topDate)
    });
    var items = [];
    var skipped = [];
    if (item) {
      item.totalAmount = summaryTotal;
      items.push(item);
    } else {
      skipped.push({ line: headerInfo.index + 2, reason: '未识别到红框里的第一行产品明细' });
    }
    var singleOrder = buildSinglePurchaseOrder(items, {
      supplier: topSupplier,
      orderNo: topOrderNo,
      orderDate: parseDateText(topDate),
      summaryTotal: summaryTotal
    });
    return {
      fileName: fileName,
      header: header,
      map: map,
      items: items,
      singleOrder: singleOrder,
      skipped: skipped,
      supplier: topSupplier,
      headerRow: headerInfo.index + 1
    };
  }

  function findPurchaseOrderHeader(rows) {
    var best = { index: 0, score: -1, header: rows[0] || [] };
    (rows || []).slice(0, 20).forEach(function (row, index) {
      var header = (row || []).map(cleanCell);
      var map = detectPurchaseOrderHeaderMap(header);
      var rowText = header.join('');
      var score = Object.keys(map).filter(function (key) { return map[key] != null; }).length;
      if (/固特异型号/.test(rowText)) score += 6;
      if (/品名/.test(rowText)) score += 4;
      if (/数量/.test(rowText)) score += 3;
      if (/含税.*单价|单价/.test(rowText)) score += 3;
      if (/总金额/.test(rowText)) score += 3;
      if (/订单号|订单日期|供货方|购货方/.test(rowText)) score -= 5;
      if (score > best.score) best = { index: index, score: score, header: header };
    });
    var required = detectPurchaseOrderHeaderMap(best.header);
    if (required.gyModel == null || required.productName == null || required.qty == null || required.unitPrice == null) {
      for (var i = 0; i < (rows || []).length && i < 30; i++) {
        var h = (rows[i] || []).map(cleanCell);
        var text = h.join('');
        if (/固特异型号/.test(text) && /品名/.test(text) && /数量/.test(text) && (/含税.*单价|单价/.test(text))) {
          return { index: i, score: 999, header: h };
        }
      }
    }
    return best;
  }

  function detectPurchaseOrderHeaderMap(header) {
    var map = {
      supplier: findHeaderIndex(header, ['供货方', '供应商名称', '供应商', '供方', '卖方', '厂家名称', '工厂名称']),
      orderNo: findHeaderIndex(header, ['订单编号', '订单号', '采购订单号', '采购单号', 'PO', '单据编号', '单据号']),
      orderDate: findHeaderIndex(header, ['下单日期', '订单日期', '采购日期', '日期', '制单日期']),
      gyModel: findHeaderIndex(header, ['固特异型号', 'GY型号', 'GY号', 'GY', 'GY编码']),
      productName: findHeaderIndex(header, ['品名', '产品名称', '货品名称', '商品名称', '名称']),
      qty: findHeaderIndex(header, ['数量', '采购数量', '订购数量', '下单数量']),
      unitPrice: findHeaderIndex(header, ['含税单价', '含税不含运单价', '单价', '采购单价']),
      totalAmount: findHeaderIndex(header, ['总金额', '金额', '价税合计', '合计金额', '总价', '含税金额'])
    };
    return map;
  }

  function findHeaderIndex(header, keywords) {
    var normalized = (header || []).map(function (h) { return String(h || '').replace(/\s/g, '').toLowerCase(); });
    for (var i = 0; i < normalized.length; i++) {
      for (var j = 0; j < keywords.length; j++) {
        if (normalized[i] === String(keywords[j]).replace(/\s/g, '').toLowerCase()) return i;
      }
    }
    for (var m = 0; m < normalized.length; m++) {
      for (var n = 0; n < keywords.length; n++) {
        if (normalized[m].indexOf(String(keywords[n]).replace(/\s/g, '').toLowerCase()) >= 0) return m;
      }
    }
    return null;
  }

  function getMappedCell(row, index) {
    return index == null ? '' : row[index];
  }

  function parsePurchaseOrderUnitPrice(row, index) {
    if (index == null) return 0;
    var direct = parseNumberLike(row[index]);
    if (direct) return direct;
    for (var i = index + 1; i <= index + 2 && i < row.length; i++) {
      var nearby = parseNumberLike(row[i]);
      if (nearby) return nearby;
    }
    return 0;
  }

  function detectFirstPurchaseOrderItem(rows, map, headerIndex, fallback) {
    var start = Math.max(0, (headerIndex || 0) + 1);
    for (var i = start; i < (rows || []).length; i++) {
      var row = rows[i] || [];
      if (!row.some(function (cell) { return cleanCell(cell); })) continue;
      var rowText = row.map(cleanCell).join(' ');
      if (/合计|总计|总金额|金额合计/.test(rowText)) break;
      var gyModel = cleanCell(getMappedCell(row, map.gyModel));
      var productName = cleanCell(getMappedCell(row, map.productName));
      var qty = parseNumberLike(getMappedCell(row, map.qty));
      var unitPrice = parsePurchaseOrderUnitPrice(row, map.unitPrice);
      if (!gyModel && !productName && !qty && !unitPrice) continue;
      if (/订单具体要求|产品要求|产品图片|包装方式|包装配件|外箱|装箱数|尺寸|请仔细阅读|条款/.test(rowText)) continue;
      if (!gyModel && !productName) continue;
      return {
        supplier: fallback.supplier || '',
        orderNo: fallback.orderNo || '',
        orderDate: fallback.orderDate || '',
        gyModel: gyModel,
        productName: productName,
        qty: qty,
        unitPrice: unitPrice,
        sourceRow: i + 1
      };
    }
    return detectFirstPurchaseOrderItemByGyRow(rows, fallback);
  }

  function detectFirstPurchaseOrderItemByGyRow(rows, fallback) {
    for (var i = 0; i < (rows || []).length; i++) {
      var row = rows[i] || [];
      var cells = row.map(cleanCell);
      var rowText = cells.join(' ');
      if (/合计|总计|订单具体要求|产品要求|产品图片|包装方式|包装配件/.test(rowText)) continue;
      var gyIndex = -1;
      for (var c = 0; c < cells.length; c++) {
        if (/^GY[-\s]?\w+/i.test(cells[c])) {
          gyIndex = c;
          break;
        }
      }
      if (gyIndex < 0) continue;
      var productName = '';
      for (var p = gyIndex + 1; p < cells.length; p++) {
        if (cells[p] && !/^\d/.test(cells[p]) && !/[￥¥]/.test(cells[p])) {
          productName = cells[p];
          break;
        }
      }
      var qty = 0;
      var unitPrice = 0;
      var priceMarkIndex = -1;
      for (var mark = gyIndex + 1; mark < cells.length; mark++) {
        if (/[￥¥]/.test(cells[mark])) {
          priceMarkIndex = mark;
          break;
        }
      }
      if (priceMarkIndex >= 0) {
        for (var up = priceMarkIndex; up <= priceMarkIndex + 2 && up < cells.length; up++) {
          unitPrice = parseNumberLike(cells[up]);
          if (unitPrice) break;
        }
        for (var q = priceMarkIndex - 1; q > gyIndex; q--) {
          var qv = parseNumberLike(cells[q]);
          if (qv >= 1 && qv === Math.floor(qv)) {
            qty = qv;
            break;
          }
        }
      }
      if (!qty) {
        var maxInt = 0;
        for (var n = gyIndex + 1; n < cells.length; n++) {
          var value = parseNumberLike(cells[n]);
          if (value >= 1 && value === Math.floor(value) && value > maxInt) maxInt = value;
        }
        qty = maxInt;
      }
      return {
        supplier: fallback.supplier || '',
        orderNo: fallback.orderNo || '',
        orderDate: fallback.orderDate || '',
        gyModel: cells[gyIndex],
        productName: productName,
        qty: qty,
        unitPrice: unitPrice,
        sourceRow: i + 1
      };
    }
    return null;
  }

  function cleanCell(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function parseNumberLike(value) {
    var text = cleanCell(value).replace(/[,，￥¥元]/g, '');
    var match = text.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function detectPurchaseOrderSummaryTotal(rows, map, headerIndex) {
    var totalCol = map && map.totalAmount != null ? map.totalAmount : null;
    var best = 0;
    (rows || []).forEach(function (row, index) {
      if (index <= (headerIndex || 0)) return;
      var cells = (row || []).map(cleanCell);
      var rowText = cells.join(' ');
      if (!/合计|总计|总金额|金额合计/.test(rowText)) return;
      var amount = 0;
      if (totalCol != null) amount = parseNumberLike(cells[totalCol]);
      if (!amount) {
        for (var i = cells.length - 1; i >= 0; i--) {
          var n = parseNumberLike(cells[i]);
          if (n) {
            amount = n;
            break;
          }
        }
      }
      if (amount) best = amount;
    });
    return best;
  }

  function parseDateText(value) {
    if (value instanceof Date) return toYMD(value);
    var text = cleanCell(value);
    if (!text) return '';
    var serial = Number(text);
    if (!isNaN(serial) && serial > 20000 && serial < 80000) {
      var base = new Date(1899, 11, 30);
      base.setDate(base.getDate() + serial);
      return toYMD(base);
    }
    var m = text.match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);
    if (m) return m[1] + '-' + pad(Number(m[2])) + '-' + pad(Number(m[3]));
    return '';
  }

  function detectLabeledValue(rows, fileName, labels) {
    for (var r = 0; r < (rows || []).length && r < 24; r++) {
      var row = rows[r] || [];
      for (var c = 0; c < row.length; c++) {
        var cell = cleanCell(row[c]);
        if (!cell) continue;
        for (var k = 0; k < labels.length; k++) {
          var label = labels[k];
          var labelRe = new RegExp('^' + label + '\\s*[:：]?\\s*(.*)$');
          var exact = cell.match(labelRe);
          if (!exact) continue;
          if (cleanCell(exact[1])) return cleanCell(exact[1]).replace(/[，,。;；]+$/, '');
          for (var next = c + 1; next < row.length; next++) {
            var v = cleanCell(row[next]);
            if (!v) continue;
            if (/^(订单号|订单日期|购货方|供货方|地址|联系人|电话|邮箱|交货日期|交货地点|付款方式)[:：]?$/.test(v)) break;
            return v.replace(/[，,。;；]+$/, '');
          }
        }
      }
    }
    var text = [fileName || ''].concat((rows || []).slice(0, 20).map(function (row) { return (row || []).join(' '); })).join(' ');
    for (var i = 0; i < labels.length; i++) {
      var re = new RegExp(labels[i] + '[:：\\s]*([^\\s]+(?:\\s*[^\\s:：]+){0,8})');
      var match = text.match(re);
      if (match) return cleanCell(match[1]).replace(/[，,。;；]+$/, '');
    }
    return '';
  }

  function detectPurchaseOrderSupplier(rows, fileName, map, headerIndex) {
    var dataRows = (rows || []).slice((headerIndex || 0) + 1, (headerIndex || 0) + 8);
    if (map.supplier != null) {
      for (var i = 0; i < dataRows.length; i++) {
        var v = cleanCell(dataRows[i][map.supplier]);
        if (v && !/供应商|供方|工厂/.test(v)) return v;
      }
    }
    var labeled = detectLabeledValue(rows, fileName, ['供货方', '供应商名称', '供应商', '供方', '卖方', '工厂', '厂家']);
    if (labeled && labeled.length <= 30) return labeled;
    var text = [fileName || ''].concat((rows || []).slice(0, 30).map(function (row) { return (row || []).join(' '); })).join(' ').replace(/\s/g, '');
    return factories.filter(function (name) {
      return name && text.indexOf(String(name).replace(/\s/g, '')) >= 0;
    }).sort(function (a, b) { return b.length - a.length; })[0] || '';
  }

  function groupPurchaseOrderItems(items) {
    var map = {};
    (items || []).forEach(function (item) {
      var key = (item.supplier || '未识别供应商') + '|' + item.orderNo;
      if (!map[key]) {
        map[key] = {
          supplier: item.supplier || '',
          orderNo: item.orderNo,
          orderDate: item.orderDate,
          qty: 0,
          items: [],
          gyModels: {}
        };
      }
      map[key].qty += Number(item.qty || 0);
      if (!map[key].orderDate && item.orderDate) map[key].orderDate = item.orderDate;
      if (item.gyModel) map[key].gyModels[item.gyModel] = true;
      map[key].items.push(item);
    });
    return Object.keys(map).map(function (key) { return map[key]; });
  }

  function buildSinglePurchaseOrder(items, fallback) {
    var order = {
      supplier: fallback.supplier || '',
      orderNo: fallback.orderNo || '',
      orderDate: fallback.orderDate || '',
      qty: 0,
      totalAmount: 0,
      items: items || [],
      gyModels: {},
      productNames: {},
      orderNos: {},
      suppliers: {}
    };
    (items || []).forEach(function (item) {
      if (!order.supplier && item.supplier) order.supplier = item.supplier;
      if (!order.orderNo && item.orderNo) order.orderNo = item.orderNo;
      if (!order.orderDate && item.orderDate) order.orderDate = item.orderDate;
      if (item.supplier) order.suppliers[item.supplier] = true;
      if (item.orderNo) order.orderNos[item.orderNo] = true;
      if (item.gyModel) order.gyModels[item.gyModel] = true;
      if (item.productName) order.productNames[item.productName] = true;
      order.qty += Number(item.qty || 0);
    });
    if (fallback.summaryTotal) order.totalAmount = Number(fallback.summaryTotal || 0);
    return order;
  }

  function renderPurchaseOrderPreview(parsed) {
    var el = $('purchaseOrderUploadPreview');
    if (!el) return;
    var single = parsed.singleOrder || buildSinglePurchaseOrder(parsed.items, {});
    var rows = parsed.items.slice(0, 80).map(function (r) {
      return '<tr>' +
        '<td>' + escapeHTML(r.supplier || '未识别') + '</td>' +
        '<td><span class="mono">' + escapeHTML(r.orderNo) + '</span></td>' +
        '<td>' + escapeHTML(r.orderDate || '') + '</td>' +
        '<td>' + escapeHTML(r.gyModel || '') + '</td>' +
        '<td>' + escapeHTML(r.productName || '') + '</td>' +
        '<td>' + escapeHTML(r.qty || '') + '</td>' +
        '<td>' + escapeHTML(r.unitPrice ? formatCurrency(r.unitPrice) : '') + '</td>' +
        '<td>' + escapeHTML(r.totalAmount ? formatCurrency(r.totalAmount) : '') + '</td>' +
        '</tr>';
    }).join('');
    var orderNoCount = Object.keys(single.orderNos || {}).length;
    var supplierCount = Object.keys(single.suppliers || {}).length;
    var warning = '';
    if (orderNoCount > 1) warning += '<div class="feedback-item updated">提醒：明细中出现 ' + orderNoCount + ' 个订单编号，系统仍按同一张已完成采购单流转，请核对订单编号是否正确。</div>';
    if (supplierCount > 1) warning += '<div class="feedback-item updated">提醒：明细中出现 ' + supplierCount + ' 个供应商名称，系统仍按同一张已完成采购单流转，请核对供应商是否正确。</div>';
    var summary = '<div class="feedback-item added">已识别采购单，待进入流转：' + escapeHTML(single.supplier || '未识别供应商') +
      ' · ' + escapeHTML(single.orderNo || '未识别订单编号') +
      ' · 明细 ' + single.items.length + ' 行 · 合计数量 ' + escapeHTML(single.qty || '') +
      ' · 总金额（合计行） ' + escapeHTML(single.totalAmount ? formatCurrency(single.totalAmount) : '未识别') + '</div>' + warning;
    var skipped = parsed.skipped.length ? '<div class="feedback-section"><strong>未导入提示</strong>' +
      parsed.skipped.map(function (s) { return '<div class="feedback-item updated">第 ' + s.line + ' 行：' + escapeHTML(s.reason) + '</div>'; }).join('') +
      '</div>' : '';
    el.innerHTML =
      '<div class="feedback-section"><strong>采购订单识别结果：' + escapeHTML(parsed.fileName) + '</strong>' +
      '<div class="feedback-item updated">只识别红框里的第一行产品明细；订单具体要求后面的内容不识别。总金额从底部合计行提取。请核对后确认上传。</div>' +
      summary +
      '<div class="po-preview-table"><table><thead><tr><th>供货方</th><th>订单号</th><th>订货日期</th><th>固特异型号</th><th>品名</th><th>数量</th><th>单价</th><th>总金额</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="8" class="muted">没有识别到可导入明细</td></tr>') +
      '</tbody></table></div>' +
      '<div class="record-actions" style="margin-top:12px;">' +
      '<button class="btn primary" id="confirmPurchaseOrderImportBtn" type="button">确认识别并进入流转</button>' +
      '<button class="btn" id="cancelPurchaseOrderImportBtn" type="button">取消</button>' +
      '</div></div>' + skipped;
    el.style.display = 'block';
    $('confirmPurchaseOrderImportBtn').addEventListener('click', confirmPurchaseOrderImport);
    $('cancelPurchaseOrderImportBtn').addEventListener('click', function () {
      pendingPurchaseOrderImport = null;
      el.style.display = 'none';
      el.innerHTML = '';
    });
  }

  function renderPurchaseOrderUploadMessage(message, cls) {
    var el = $('purchaseOrderUploadPreview');
    if (!el) return;
    el.innerHTML = '<div class="feedback-item ' + (cls || 'updated') + '">' + escapeHTML(message) + '</div>';
    el.style.display = 'block';
  }

  function confirmPurchaseOrderImport() {
    var parsed = pendingPurchaseOrderImport;
    if (!parsed || !parsed.singleOrder || !parsed.singleOrder.orderNo) {
      toast('没有可确认上传的采购订单');
      return;
    }
    var addedOrders = 0;
    var updatedPayments = 0;
    var group = parsed.singleOrder;
    if (group.supplier) ensureImportedSupplier(group.supplier);
    var gyList = Object.keys(group.gyModels || {});
    var productNameList = Object.keys(group.productNames || {});
    var productParts = [];
    if (gyList.length) productParts.push('固特异型号：' + gyList.slice(0, 5).join('、') + (gyList.length > 5 ? '等' + gyList.length + '项' : ''));
    if (productNameList.length) productParts.push('品名：' + productNameList.slice(0, 5).join('、') + (productNameList.length > 5 ? '等' + productNameList.length + '项' : ''));
    var product = productParts.join('；') || '采购订单';
    var amount = group.totalAmount ? formatCurrency(group.totalAmount) : '';
    var existingOrder = findOrderByNo(group.supplier, group.orderNo);
    var record;
    if (existingOrder) {
      existingOrder.product = product || existingOrder.product;
      existingOrder.amount = amount || existingOrder.amount;
      existingOrder.dueDate = group.orderDate || existingOrder.dueDate;
      existingOrder.note = (existingOrder.note || '') + ' | 已完成采购单识别更新：' + parsed.fileName;
      existingOrder.updatedAt = nowISO();
      record = existingOrder;
    } else {
      record = addRecord({
        content: (group.supplier ? group.supplier + ' ' : '') + '采购订单 ' + group.orderNo + ' 待付款',
        factory: group.supplier || '',
        product: product,
        module: 'orders',
        status: '待跟进',
        dueDate: group.orderDate || toYMD(today()),
        owner: '',
        orderNo: group.orderNo,
        logisticsNo: '',
        amount: amount,
        nextStep: '已完成采购单识别入库，流转到财务待付款跟进付款与开票',
        note: '已完成采购单识别：' + parsed.fileName + '；明细行数：' + group.items.length + '；合计数量：' + group.qty,
        weeklyCategory: 'auto'
      }, true);
      addedOrders++;
    }
    if (upsertPurchaseOrderPayment(group, record, amount, parsed.fileName)) updatedPayments++;
    syncEmailOrderFactory(group.orderNo, group.supplier);
    saveState();
    renderSelects();
    renderAll();
    pendingPurchaseOrderImport = null;
    if ($('purchaseOrderUploadPreview')) $('purchaseOrderUploadPreview').style.display = 'none';
    switchSection('finance');
    var panel = $('financePaymentPanel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('已完成采购单识别并进入流转：跟进记录已更新，财务待付款 ' + updatedPayments + ' 笔');
  }

  function upsertPurchaseOrderPayment(group, record, amount, fileName) {
    var payment = state.financePayments.find(function (p) {
      return p.type === '采购订单待付款' && p.orderNo === group.orderNo && (!group.supplier || p.factory === group.supplier);
    });
    if (!payment) {
      state.financePayments.unshift({
        id: makeId(),
        type: '采购订单待付款',
        factory: group.supplier || '',
        orderNo: group.orderNo,
        amount: amount,
        requester: '',
        dueDate: group.orderDate || toYMD(today()),
        paymentStatus: '待付款',
        invoiceStatus: '待开票',
        note: '已完成采购单识别流转；来源文件：' + fileName + '；明细行数：' + group.items.length,
        recordId: record.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        history: [{ time: nowISO(), action: '已完成采购单识别为待付款' }]
      });
      return true;
    }
    payment.factory = group.supplier || payment.factory;
    payment.amount = amount || payment.amount;
    payment.dueDate = group.orderDate || payment.dueDate;
    payment.recordId = record.id || payment.recordId;
    payment.note = '已完成采购单识别更新；来源文件：' + fileName + '；明细行数：' + group.items.length;
    payment.updatedAt = nowISO();
    payment.history = payment.history || [];
    payment.history.push({ time: payment.updatedAt, action: '已完成采购单更新待付款' });
    return true;
  }

  function syncEmailOrderFactory(orderNo, supplier) {
    if (!orderNo || !supplier) return;
    var found = emailOrderFactoryMap.find(function (item) {
      return String(item.orderNo || '').trim().toLowerCase() === String(orderNo).trim().toLowerCase();
    });
    if (found) {
      found.factory = supplier;
    } else {
      emailOrderFactoryMap.push({ orderNo: orderNo, factory: supplier });
    }
  }

  function onOrderImportSubmit(e) {
    e.preventDefault();
    var raw = $('orderImportText').value.trim();
    if (!raw) return;
    var lines = raw.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean);
    importOrderLines(lines, '文本导入');
  }

  function importOrderLines(lines, sourceLabel) {
    var added = [];
    var updated = [];
    var skipped = [];
    lines.forEach(function (line) {
      var parsed = parseOrderImportLine(line);
      if (!parsed.orderNo) {
        skipped.push({ line: line, reason: '未识别到订单号' });
        return;
      }
      var existing = findOrderByNo(parsed.factory, parsed.orderNo);
      if (existing) {
        var changes = applyOrderImportUpdate(existing, parsed, line);
        updated.push({ record: existing, changes: changes });
      } else {
        addRecord(parsed, true);
        added.push(parsed);
      }
    });
    saveState();
    renderSelects();
    renderAll();
    renderOrderImportFeedback(added, updated, skipped);
    switchSection('orders');
    toast((sourceLabel || '订单导入') + '完成：新增 ' + added.length + ' 条，更新 ' + updated.length + ' 条');
  }

  function onSettlementBillFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var name = file.name || '';
    var ext = name.split('.').pop().toLowerCase();
    var uploadDate = today();
    var uploadYMD = toYMD(uploadDate);
    var done = function (rows) {
      var result = detectSettlementBillAmount(rows);
      var supplier = detectSettlementSupplier(rows, name);
      $('settlementBillDate').value = uploadYMD;
      $('settlementMonth').value = previousMonthKey(uploadDate);
      syncSettlementPayDue();
      if (supplier) $('settlementFactory').value = supplier;
      if (result.amount) {
        $('settlementAmount').value = result.amount;
        $('settlementCheckAmount').value = result.amount;
        $('settlementBillFileHint').textContent = '已自动识别：' +
          (supplier ? '供应商「' + supplier + '」、' : '供应商未匹配、') +
          '总金额 ' + result.amount + '、账期 ' + previousMonthKey(uploadDate) +
          '、账单日期 ' + uploadYMD + '、付款日 ' + $('settlementPayDue').value + '。请确认后新增流转单。';
        toast('已识别对账单并自动填充字段');
      } else {
        $('settlementBillFileHint').textContent = '已自动填充：' +
          (supplier ? '供应商「' + supplier + '」、' : '供应商未匹配、') +
          '账期 ' + previousMonthKey(uploadDate) + '、账单日期 ' + uploadYMD +
          '、付款日 ' + $('settlementPayDue').value + '；未识别到明确总金额，请手动填写账单金额。';
        toast('已填充日期字段，金额需手动确认');
      }
    };
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      var textReader = new FileReader();
      textReader.onload = function () {
        var rows = String(textReader.result || '').split(/\n+/).map(function (line) {
          return line.split(/\t|,|，/).map(function (cell) { return cell.trim(); });
        });
        done(rows);
      };
      textReader.readAsText(file, 'UTF-8');
      return;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      if (!window.XLSX) {
        $('settlementBillFileHint').textContent = 'Excel解析库未加载，请检查网络后重试，或另存为CSV后上传。';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var workbook = XLSX.read(reader.result, { type: 'array' });
        var allRows = [];
        workbook.SheetNames.forEach(function (sheetName) {
          allRows = allRows.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' }));
        });
        done(allRows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    $('settlementBillFileHint').textContent = '暂不支持该文件格式，请使用 Excel、CSV 或 TSV。';
  }

  function detectSettlementBillAmount(rows) {
    var candidates = [];
    (rows || []).forEach(function (row, rowIndex) {
      (row || []).forEach(function (cell, colIndex) {
        var text = String(cell || '').replace(/\s/g, '');
        if (!text) return;
        var amount = parseAmountNumber(text);
        var context = [
          text,
          row[colIndex - 1] || '',
          row[colIndex + 1] || '',
          row.slice(0, colIndex).join(' ')
        ].join(' ');
        if (amount > 0) {
          var score = /合计|总计|总金额|应付|本期应付|价税合计|金额合计/.test(context) ? 10 : 1;
          candidates.push({ amount: amount, score: score, rowIndex: rowIndex });
        }
      });
    });
    if (!candidates.length) return { amount: '' };
    candidates.sort(function (a, b) {
      return b.score - a.score || b.amount - a.amount || b.rowIndex - a.rowIndex;
    });
    return { amount: formatCurrency(candidates[0].amount) };
  }

  function detectSettlementSupplier(rows, fileName) {
    var text = [
      fileName || '',
      (rows || []).slice(0, 30).map(function (row) {
        return (row || []).join(' ');
      }).join(' ')
    ].join(' ');
    var normalizedText = String(text || '').replace(/\s/g, '');
    var matched = factories.filter(function (name) {
      var normalizedName = String(name || '').replace(/\s/g, '');
      return normalizedName && normalizedText.indexOf(normalizedName) >= 0;
    }).sort(function (a, b) {
      return String(b).length - String(a).length;
    })[0];
    return matched || '';
  }

  function parseAmountNumber(text) {
    var clean = String(text || '').replace(/[,，¥￥元]/g, '');
    var match = clean.match(/-?\d+(?:\.\d+)?/);
    return match ? Math.abs(Number(match[0])) : 0;
  }

  function onOrderImportFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var name = file.name || '';
    var ext = name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      var textReader = new FileReader();
      textReader.onload = function () {
        var text = String(textReader.result || '');
        $('orderImportText').value = text;
        importOrderLines(text.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean), '表格文件导入');
      };
      textReader.readAsText(file, 'UTF-8');
      return;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      if (!window.XLSX) {
        renderOrderImportFeedback([], [], [{ line: name, reason: 'Excel 解析库未加载，请检查网络后重试，或另存为 CSV 后导入' }]);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var workbook = XLSX.read(reader.result, { type: 'array' });
        var firstSheet = workbook.SheetNames[0];
        var rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, raw: false, defval: '' });
        var lines = tableRowsToOrderLines(rows);
        $('orderImportText').value = lines.join('\n');
        importOrderLines(lines, 'Excel 导入');
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    renderOrderImportFeedback([], [], [{ line: name, reason: '暂不支持该文件格式，请使用 Excel、CSV 或 TSV' }]);
  }

  function tableRowsToOrderLines(rows) {
    rows = (rows || []).filter(function (row) {
      return row && row.some(function (cell) { return String(cell || '').trim(); });
    });
    if (!rows.length) return [];
    var header = rows[0].map(function (cell) { return String(cell || '').trim(); });
    var map = detectOrderHeaderMap(header);
    var hasHeader = Object.keys(map).length >= 2;
    var dataRows = hasHeader ? rows.slice(1) : rows;
    return dataRows.map(function (row) {
      if (!hasHeader) return row.map(function (cell) { return String(cell || '').trim(); }).filter(Boolean).join('\t');
      var parts = [];
      if (map.factory != null && row[map.factory]) parts.push(String(row[map.factory]).trim());
      if (map.orderNo != null && row[map.orderNo]) parts.push('订单号：' + String(row[map.orderNo]).trim());
      if (map.product != null && row[map.product]) parts.push(String(row[map.product]).trim());
      if (map.amount != null && row[map.amount]) parts.push('数量/金额：' + String(row[map.amount]).trim());
      if (map.logisticsNo != null && row[map.logisticsNo]) parts.push('物流：' + String(row[map.logisticsNo]).trim());
      if (map.status != null && row[map.status]) parts.push(String(row[map.status]).trim());
      if (map.date != null && row[map.date]) parts.push(String(row[map.date]).trim());
      return parts.join('\t');
    }).filter(Boolean);
  }

  function detectOrderHeaderMap(header) {
    var map = {};
    header.forEach(function (name, index) {
      var h = String(name || '').replace(/\s/g, '');
      if (map.factory == null && /供应商|工厂|厂家|供方/.test(h)) map.factory = index;
      if (map.orderNo == null && /订单号|采购单号|采购订单号|平台订单号|PO|合同号|单据号/.test(h)) map.orderNo = index;
      if (map.product == null && /产品|品名|商品|型号|物料|项目/.test(h)) map.product = index;
      if (map.amount == null && /数量|金额|采购量|订货量|合计|总价/.test(h)) map.amount = index;
      if (map.logisticsNo == null && /物流|快递|运单|单号/.test(h) && !/订单|采购/.test(h)) map.logisticsNo = index;
      if (map.status == null && /状态|进度|发货状态|到货状态/.test(h)) map.status = index;
      if (map.date == null && /日期|时间|交期|到货日|发货日/.test(h)) map.date = index;
    });
    return map;
  }

  function parseOrderImportLine(line) {
    var orderNo = inferOrderNo(line);
    var factory = inferFactory(line) || inferFactoryFromOrderLine(line, orderNo);
    if (factory) ensureImportedSupplier(factory);
    var parsedDate = normalizeTime(line);
    var product = inferProduct(line);
    var logisticsNo = inferLogisticsNo(line);
    var amount = inferAmount(line);
    return {
      content: (factory ? factory + ' ' : '') + '订单 ' + orderNo + ' 跟进',
      factory: factory,
      product: product || '订单',
      module: 'orders',
      status: inferStatus(line),
      dueDate: parsedDate.date || '',
      owner: '',
      orderNo: orderNo,
      logisticsNo: logisticsNo,
      amount: amount,
      nextStep: inferNextStep(line, inferStatus(line)),
      note: '批量导入原始数据：' + line,
      weeklyCategory: 'auto'
    };
  }

  function inferFactoryFromOrderLine(line, orderNo) {
    var first = String(line || '').split(/[\t,，;；]/).map(function (p) { return p.trim(); }).filter(Boolean)[0] || '';
    if (!first || first === orderNo) return '';
    if (/订单|采购|PO|po|数量|金额|物流|快递|单号|日期/.test(first)) return '';
    if (/^\d/.test(first)) return '';
    if (first.length > 18) return '';
    return first;
  }

  function ensureImportedSupplier(name) {
    if (!name) return;
    if (state.suppliers.some(function (s) { return s.name === name; })) return;
    state.suppliers.push({
      name: name,
      contact: '',
      products: '',
      settle: '',
      note: '由订单批量导入自动创建。',
      createdAt: nowISO()
    });
    state.antifakeStock[name] = 0;
    state.antifakeThresholds[name] = 50;
    state.antifakeExempt[name] = false;
    state.antifakeExemptNote[name] = '';
    state.deletedSuppliers = state.deletedSuppliers.filter(function (n) { return n !== name; });
    syncFactories();
  }

  function findOrderByNo(factory, orderNo) {
    return state.records.find(function (r) {
      if (r.module !== 'orders') return false;
      if (!r.orderNo || r.orderNo !== orderNo) return false;
      if (factory && r.factory && r.factory !== factory) return false;
      return true;
    });
  }

  function applyOrderImportUpdate(record, parsed, rawLine) {
    var changes = [];
    var time = nowISO();
    ['factory', 'product', 'logisticsNo', 'amount', 'dueDate', 'nextStep'].forEach(function (key) {
      if (parsed[key] && !record[key]) {
        record[key] = parsed[key];
        changes.push(key);
      }
    });
    if (parsed.status && parsed.status !== record.status) {
      record.status = parsed.status;
      changes.push('状态');
      if (record.status === '已完成') record.completedAt = time;
    }
    record.note = (record.note || '') + (record.note ? ' | ' : '') + '订单导入更新：' + rawLine;
    record.updatedAt = time;
    record.history = record.history || [];
    record.history.push({ time: time, action: '批量订单导入更新：' + (changes.join('，') || '补充原始数据') });
    return changes;
  }

  function renderOrderImportFeedback(added, updated, skipped) {
    var el = $('orderImportFeedback');
    var grouped = {};
    added.forEach(function (r) {
      var key = r.factory || '未指定供应商';
      grouped[key] = grouped[key] || { added: [], updated: [] };
      grouped[key].added.push(r.orderNo);
    });
    updated.forEach(function (u) {
      var key = u.record.factory || '未指定供应商';
      grouped[key] = grouped[key] || { added: [], updated: [] };
      grouped[key].updated.push(u.record.orderNo);
    });
    var html = '';
    Object.keys(grouped).forEach(function (factory) {
      html += '<div class="feedback-section"><strong>' + escapeHTML(factory) + '</strong>';
      if (grouped[factory].added.length) html += '<div class="feedback-item added">新增订单号：' + escapeHTML(grouped[factory].added.join('，')) + '</div>';
      if (grouped[factory].updated.length) html += '<div class="feedback-item updated">更新订单号：' + escapeHTML(grouped[factory].updated.join('，')) + '</div>';
      html += '</div>';
    });
    if (skipped.length) {
      html += '<div class="feedback-section"><strong>未导入 ' + skipped.length + ' 行</strong>';
      skipped.forEach(function (s) {
        html += '<div class="feedback-item updated">' + escapeHTML(s.reason + '：' + s.line) + '</div>';
      });
      html += '</div>';
    }
    el.innerHTML = html || '<div class="empty">没有识别到可导入的订单。</div>';
    el.style.display = 'block';
  }

  function openSupplierModal() {
    $('supplierForm').reset();
    $('supplierModalBackdrop').classList.add('show');
  }

  function closeSupplierModal() {
    $('supplierModalBackdrop').classList.remove('show');
  }

  function onSupplierSubmit(e) {
    e.preventDefault();
    var name = $('supplierName').value.trim();
    if (!name) return;
    if (state.suppliers.some(function (s) { return s.name === name; })) {
      alert('该供应商已存在，不需要重复添加。');
      return;
    }
    state.suppliers.push({
      name: name,
      contact: $('supplierContact').value.trim(),
      products: $('supplierProducts').value.trim(),
      settle: $('supplierSettle').value.trim(),
      note: $('supplierNote').value.trim(),
      createdAt: nowISO()
    });
    state.antifakeStock[name] = 0;
    state.antifakeThresholds[name] = 50;
    state.antifakeExempt[name] = false;
    state.antifakeExemptNote[name] = '';
    state.deletedSuppliers = state.deletedSuppliers.filter(function (n) { return n !== name; });
    syncFactories();
    saveState();
    renderSelects();
    renderAll();
    closeSupplierModal();
    toast('已新增供应商：' + name);
  }

  function deleteSupplier(name) {
    if (!name) return;
    var records = state.records.filter(function (r) { return r.factory === name; });
    var msg = '确认删除供应商「' + name + '」？';
    if (records.length) {
      msg += '\n该工厂下有 ' + records.length + ' 条工作记录，记录将保留但工厂档案、防伪标库存和流转记录将被清除。';
    }
    if (!confirm(msg)) return;
    state.suppliers = state.suppliers.filter(function (s) { return s.name !== name; });
    delete state.antifakeStock[name];
    delete state.antifakeThresholds[name];
    delete state.antifakeExempt[name];
    delete state.antifakeExemptNote[name];
    state.antifakeMovements = state.antifakeMovements.filter(function (m) { return m.factory !== name; });
    if (state.deletedSuppliers.indexOf(name) < 0) state.deletedSuppliers.push(name);
    if (selectedFactory === name) selectedFactory = '';
    syncFactories();
    saveState();
    renderSelects();
    renderAll();
    toast('已删除供应商：' + name);
  }

  function onAntifakeMoveSubmit(e) {
    e.preventDefault();
    var type = $('antifakeMoveType').value;
    var factory = $('antifakeMoveFactory').value;
    var qty = Number($('antifakeMoveQty').value || 0);
    var date = $('antifakeMoveDate').value || toYMD(today());
    var note = $('antifakeMoveNote').value.trim();
    var orderNo = $('antifakeMoveOrderNo').value.trim();
    var orderQty = Number($('antifakeMoveOrderQty').value || 0);
    var category = $('antifakeMoveCategory').value.trim();
    var labelSize = $('antifakeMoveLabelSize').value;
    if (!factory || qty <= 0) return;
    var typeLabelMap = { send: '寄出工厂', use: '订单扣减', damage: '损耗', return: '退回', initial: '工厂原剩余' };
    applyAntifakeMovement({
      type: type,
      factory: factory,
      qty: qty,
      date: date,
      note: note || ('手动登记' + typeLabelMap[type]),
      orderNo: orderNo,
      orderQty: orderQty,
      category: category,
      labelSize: labelSize,
      source: 'manual'
    });
    saveState();
    renderAll();
    $('antifakeMoveForm').reset();
    $('antifakeMoveDate').value = toYMD(today());
    var toastMap = { send: '已记录寄出并增加工厂余量', use: '已记录订单扣减并减少工厂余量', damage: '已记录损耗并减少工厂余量', return: '已记录退回并减少工厂余量', initial: '已登记工厂原剩余并更新余量' };
    toast(toastMap[type]);
  }

  function applyAntifakeMovement(move) {
    if (!move.factory || !move.qty || move.qty <= 0) return null;
    if (typeof state.antifakeStock[move.factory] !== 'number') state.antifakeStock[move.factory] = 0;
    // send 和 initial 增加余量；use、damage、return 减少余量
    var isInflow = move.type === 'send' || move.type === 'initial';
    var delta = isInflow ? move.qty : -move.qty;
    state.antifakeStock[move.factory] = Math.max(0, Number(state.antifakeStock[move.factory] || 0) + delta);
    var record = {
      id: makeId(),
      type: move.type,
      factory: move.factory,
      qty: move.qty,
      date: move.date || toYMD(today()),
      note: move.note || '',
      orderNo: move.orderNo || '',
      orderQty: move.orderQty || 0,
      category: move.category || '',
      labelSize: move.labelSize || '',
      source: move.source || 'manual',
      createdAt: nowISO()
    };
    state.antifakeMovements.unshift(record);
    return record;
  }

  function generateWeekly() {
    var start = parseYMD($('weeklyStart').value) || startOfWeek(today());
    var end = addDays(start, 4);
    var records = state.records.filter(function (r) {
      if (r.weeklyCategory === 'ignore') return false;
      return isWithin(r.dueDate, start, end) || (r.updatedAt && isWithin(toYMD(new Date(r.updatedAt)), start, end));
    }).sort(byDue);

    var done = [];
    var review = [];
    var next = [];
    records.forEach(function (r) {
      var category = weeklyCategory(r);
      if (category === 'done') done.push(r);
      if (category === 'review') review.push(r);
      if (category === 'next') next.push(r);
    });

    var doneReconciliation = done.filter(isReconciliationRecord);
    var normalDone = done.filter(function (r) { return !isReconciliationRecord(r); });
    var text = '采购周报（' + toYMD(start) + ' - ' + toYMD(end) + '）\n\n' +
      '一、本周已完成工作\n' + smartDoneLines(doneReconciliation, normalDone, start, end) + '\n\n' +
      '二、复盘思考\n' + smartReviewLines(review) + '\n\n' +
      '三、下周重点跟进事项\n' + smartNextLines(next);
    $('weeklyOutput').value = text;
    switchSection('weekly');
    toast('已生成采购周报');
  }

  function syncEmailFactoryByOrder() {
    var orderNo = $('emailOrderNo').value.trim();
    var matched = findEmailOrder(orderNo);
    if (matched) {
      $('emailFactory').value = matched.factory;
      $('emailFactoryMatch').innerHTML = '已匹配：<strong>' + escapeHTML(matched.factory) + '</strong> · 订单号 <span class="mono">' + escapeHTML(matched.orderNo) + '</span>';
    } else if (orderNo) {
      $('emailFactoryMatch').textContent = '未在本地订单-工厂表中匹配到该订单号，可手动填写工厂名称，或后续在代码表里补充。';
    } else {
      $('emailFactoryMatch').textContent = '请输入订单号，系统会从本地订单-工厂表中匹配合作工厂。';
    }
    renderSmartEmail();
  }

  function toggleEmailTemplateForm() {
    var form = $('emailTemplateForm');
    if (!form) return;
    form.style.display = form.style.display === 'none' || !form.style.display ? 'block' : 'none';
  }

  function clearEmailTemplateForm() {
    ['newEmailTemplateName', 'newEmailTemplateSubject', 'newEmailTemplateBody', 'newEmailTemplateWechat'].forEach(function (id) {
      if ($(id)) $(id).value = '';
    });
  }

  function saveCustomEmailTemplate() {
    var name = $('newEmailTemplateName').value.trim();
    var subject = $('newEmailTemplateSubject').value.trim();
    var body = $('newEmailTemplateBody').value.trim();
    var wechat = $('newEmailTemplateWechat').value.trim();
    if (!name || !subject || !body) {
      toast('请填写模板名称、邮件主题和邮件正文');
      return;
    }
    state.customEmailTemplates = Array.isArray(state.customEmailTemplates) ? state.customEmailTemplates : [];
    var id = 'custom_' + Date.now();
    state.customEmailTemplates.push({
      id: id,
      name: name,
      subject: subject,
      body: body,
      wechat: wechat,
      createdAt: nowISO()
    });
    saveState();
    renderEmailTemplateOptions();
    $('emailTemplate').value = id;
    clearEmailTemplateForm();
    $('emailTemplateForm').style.display = 'none';
    renderSmartEmail();
    toast('邮件模板已保存');
  }

  function findEmailOrder(orderNo) {
    var normalized = String(orderNo || '').trim().toLowerCase();
    if (!normalized) return null;
    var fixed = emailOrderFactoryMap.find(function (item) {
      return String(item.orderNo || '').trim().toLowerCase() === normalized;
    });
    if (fixed) return fixed;
    var record = state.records.find(function (r) {
      return r.module === 'orders' && String(r.orderNo || '').trim().toLowerCase() === normalized && r.factory;
    });
    return record ? { orderNo: record.orderNo, factory: record.factory } : null;
  }

  function renderSmartEmail() {
    if (!$('emailTemplate')) return;
    var template = getAllEmailTemplates()[$('emailTemplate').value] || emailTemplates.pendingSign;
    var values = {
      '订单号': $('emailOrderNo').value.trim() || '【请填写订单号】',
      '工厂名称': $('emailFactory').value.trim() || '【请填写工厂名称】',
      '回复截止日期': formatDate($('emailReplyDeadline').value) || '【请填写回复截止日期】',
      '收到回签日期': formatDate($('emailSignedDate').value) || '【请填写收到回签日期】'
    };
    var subject = fillEmailTemplate(template.subject, values);
    var body = fillEmailTemplate(template.body, values);
    body = addSupplierNameBeforeGreeting(body, $('emailFactory').value.trim());
    var note = $('emailExtraNote').value.trim();
    if (note) body += '\n\n补充说明：\n' + note;
    $('emailSubjectOutput').value = subject;
    $('emailBodyOutput').value = body;
    $('emailWechatOutput').value = template.wechat ? fillEmailTemplate(template.wechat, values) : '';
    $('wechatCopyBlock').style.display = template.wechat ? 'block' : 'none';
  }

  function fillEmailTemplate(text, values) {
    return String(text || '').replace(/\{\{([^}]+)\}\}/g, function (_, key) {
      return values[key] || '';
    });
  }

  function addSupplierNameBeforeGreeting(body, supplierName) {
    body = String(body || '');
    supplierName = String(supplierName || '').trim();
    if (!supplierName || /【请填写/.test(supplierName)) return body;
    var lines = body.split('\n');
    var greetingIndex = -1;
    for (var i = 0; i < lines.length; i++) {
      if (/^\s*您好/.test(lines[i])) {
        greetingIndex = i;
        break;
      }
    }
    if (greetingIndex < 0) return supplierName + '\n' + body;
    if (greetingIndex > 0 && lines[greetingIndex - 1].trim() === supplierName) return body;
    lines.splice(greetingIndex, 0, supplierName);
    return lines.join('\n');
  }

  function copyTextFromElement(id, message) {
    var el = $(id);
    if (!el) return;
    var text = el.value || el.textContent || '';
    if (!text.trim()) {
      toast('暂无可复制内容');
      return;
    }
    copyPlainText(text, message || '已复制');
  }

  function copyPlainText(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(message);
      }).catch(function () {
        fallbackCopyText(text, message);
      });
      return;
    }
    fallbackCopyText(text, message);
  }

  function fallbackCopyText(text, message) {
    var temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    toast(message);
  }

  function weeklyCategory(record) {
    if (record.weeklyCategory && record.weeklyCategory !== 'auto') return record.weeklyCategory;
    var text = [record.content, record.note, record.nextStep].join(' ');
    if (/失误|遗漏|延期|异常|锁死|不良|瑕疵|逾期/.test(text) || isOverdue(record)) return 'review';
    if (record.status === '已完成') return 'done';
    return 'next';
  }

  function smartDoneLines(reconciliationRecords, records, start, end) {
    var lines = [];
    var recon = reconciliationSummaryLine(reconciliationRecords, start, end);
    if (recon) lines.push(recon);
    records.forEach(function (r) {
      if (isTemporaryPaymentRecord(r)) {
        lines.push(temporaryPaymentSummaryLine(r));
        return;
      }
      lines.push('完成' + cleanSentence(projectTitle(r)) + completionReasonText(r) + '。');
    });
    return numberedLines(lines);
  }

  function smartReviewLines(records) {
    if (!records.length) return '无。';
    return numberedLines(records.map(function (r) {
      return cleanSentence(projectTitle(r)) + '存在需要复盘的问题；原因：' + reviewReason(r) + '；后续处理：' + followReasonText(r, '补充时间节点并持续跟进') + '。';
    }));
  }

  function smartNextLines(records) {
    if (!records.length) return '无。';
    var lines = [];
    var monthlyOrders = records.filter(isMonthlyPurchaseOrderRecord);
    var normalRecords = records.filter(function (r) { return !isMonthlyPurchaseOrderRecord(r); });
    var monthlySummary = monthlyPurchaseOrderSummaryLine(monthlyOrders);
    if (monthlySummary) lines.push(monthlySummary);
    normalRecords.forEach(function (r) {
      if (isTemporaryPaymentRecord(r)) {
        lines.push(temporaryPaymentSummaryLine(r));
        return;
      }
      var action = cleanSentence(r.nextStep || r.content || projectTitle(r));
      var reason = followReasonText(r, '');
      lines.push(action + (reason ? '；事由：' + reason : '') + '。');
    });
    return numberedLines(lines);
  }

  function numberedLines(lines) {
    if (!lines.length) return '无。';
    return lines.map(function (line, i) {
      return (i + 1) + '. ' + line;
    }).join('\n');
  }

  function isReconciliationRecord(r) {
    var text = [r.content, r.product, r.note, r.nextStep, r.module].join(' ');
    return r.module === 'reconciliation' || /月结|对账|账单|结算/.test(text);
  }

  function isMonthlyPurchaseOrderRecord(r) {
    var text = [r.content, r.product, r.note, r.nextStep, r.module].join(' ');
    return /月结采购单|待做采购单|做采购单|对账完成后制作采购单/.test(text);
  }

  function monthlyPurchaseOrderSummaryLine(records) {
    if (!records.length) return '';
    var amount = records.reduce(function (sum, r) {
      return sum + currencyNumber(r.amount);
    }, 0);
    var factories = unique(records.map(function (r) { return r.factory; }).filter(Boolean));
    var factoryText = factories.length ? '，涉及' + factories.join('、') : '';
    return '月结对账待下单数量 ' + records.length + ' 单，合计金额 ' + (formatCurrency(amount) || '￥0.00') + factoryText + '。';
  }

  function isTemporaryPaymentRecord(r) {
    var text = [r.content, r.product, r.note, r.nextStep].join(' ');
    return /临时付款|临时请款|预付款|加急付款|补差价/.test(text);
  }

  function temporaryPaymentSummaryLine(r) {
    var payment = findLinkedTemporaryPayment(r);
    var title = cleanSentence(projectTitle(r)).replace(/^临时付款\s*/, '临时请款');
    if (payment && payment.paymentStatus === '已付款') {
      return title + '已完成付款，付款日期：' + (toDateOnly(payment.paidAt || r.completedAt || r.updatedAt) || '已登记付款') + '。';
    }
    if (r.status === '已完成') {
      return title + '已完成付款，付款日期：' + (toDateOnly(r.completedAt || r.updatedAt) || '已登记付款') + '。';
    }
    return title + '当前状态：待付款' + (r.dueDate ? '，预计付款日：' + r.dueDate : '') + '。';
  }

  function findLinkedTemporaryPayment(record) {
    if (!record) return null;
    return (state.financePayments || []).find(function (p) {
      if (p.type !== '临时付款') return false;
      if (p.recordId && p.recordId === record.id) return true;
      if (record.orderNo && p.kingdeeNo && record.orderNo === p.kingdeeNo) return true;
      return false;
    }) || null;
  }

  function toDateOnly(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    var date = new Date(value);
    return isNaN(date.getTime()) ? '' : toYMD(date);
  }

  function reconciliationSummaryLine(records, start, end) {
    if (!records.length) return '';
    return monthlyPurchaseOrderSummaryLine(records);
  }

  function weeklyMonthText(records, start) {
    var month = '';
    records.some(function (r) {
      var text = [r.content, r.note, r.nextStep].join(' ');
      var match = text.match(/(\d{4}-\d{2}|\d{1,2}月)/);
      if (match) month = match[1];
      return !!month;
    });
    if (month) return month.indexOf('月') >= 0 ? month : month.replace('-', '年') + '月';
    return '本月';
  }

  function projectTitle(r) {
    return r.product || r.content || r.nextStep || '相关事项';
  }

  function completionReasonText(r) {
    var reason = firstMeaningful([r.note, r.nextStep, r.amount, r.orderNo, r.logisticsNo]);
    return reason ? '；完成结果：' + reason : '；完成结果：已完成并关闭';
  }

  function followReasonText(r, fallback) {
    return firstMeaningful([r.note, r.content !== r.nextStep ? r.content : '', r.amount, r.orderNo, r.logisticsNo]) || fallback || '';
  }

  function firstMeaningful(list) {
    for (var i = 0; i < list.length; i++) {
      var text = cleanSentence(list[i] || '');
      if (!text) continue;
      if (/^(无|暂无|待补充|补充当前进度和下一步)$/.test(text)) continue;
      return text;
    }
    return '';
  }

  function weeklyDateLabel(r, start, end) {
    return '';
  }

  function weeklyRangeLabel(records, start, end) {
    var dates = records.map(function (r) {
      var ymd = r.completedAt ? toYMD(new Date(r.completedAt)) : (r.updatedAt ? toYMD(new Date(r.updatedAt)) : r.dueDate);
      return parseYMD(ymd);
    }).filter(Boolean).sort(function (a, b) { return a - b; });
    if (!dates.length) return '本周';
    var first = dates[0];
    var last = dates[dates.length - 1];
    var firstLabel = isWithin(toYMD(first), start, end) ? '周' + weekday(first) : formatDate(toYMD(first));
    var lastLabel = isWithin(toYMD(last), start, end) ? '周' + weekday(last) : formatDate(toYMD(last));
    return firstLabel === lastLabel ? firstLabel : firstLabel + '到' + lastLabel;
  }

  function unique(list) {
    var seen = {};
    return list.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function weeklyLines(records, type) {
    if (!records.length) return '无。';
    return records.map(function (r, i) {
      if (type === 'done') {
        return (i + 1) + '. ' + cleanSentence(r.content) + resultText(r) + '。';
      }
      if (type === 'review') {
        return (i + 1) + '. ' + cleanSentence(r.content) + '；问题点：' + reviewReason(r) + '；后续调整：' + (r.nextStep || '补充时间节点并持续跟进') + '。';
      }
      return (i + 1) + '. ' + cleanSentence(r.nextStep || r.content) + '。';
    }).join('\n');
  }

  function cleanSentence(text) {
    return String(text || '').replace(/[。；;]+$/g, '').replace(/非常|重点|尽快|及时/g, '').trim();
  }

  function resultText(r) {
    var bits = [];
    if (r.factory) bits.push(r.factory);
    if (r.orderNo) bits.push('订单号 ' + r.orderNo);
    if (r.product) bits.push(r.product);
    if (r.logisticsNo) bits.push('物流单号 ' + r.logisticsNo);
    if (!bits.length) return '';
    return '（' + bits.join('，') + '）';
  }

  function reviewReason(r) {
    var text = [r.note, r.content].join(' ');
    if (isOverdue(r)) return '事项超过计划日期未关闭';
    if (/锁死/.test(text)) return '发票存在锁死异常';
    if (/不良|瑕疵/.test(text)) return '产品品质或不良品处理未完全关闭';
    if (/延期/.test(text)) return '交期或反馈节点延期';
    if (/遗漏|失误/.test(text)) return '记录或跟进存在遗漏';
    return r.note || '需补充原因和处理结论';
  }

  function copyWeekly() {
    var text = $('weeklyOutput').value;
    if (!text) {
      generateWeekly();
      text = $('weeklyOutput').value;
    }
    navigator.clipboard.writeText(text).then(function () {
      toast('周报已复制');
    }).catch(function () {
      $('weeklyOutput').select();
      document.execCommand('copy');
      toast('周报已复制');
    });
  }

  function downloadWeekly() {
    var text = $('weeklyOutput').value;
    if (!text) {
      generateWeekly();
      text = $('weeklyOutput').value;
    }
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '采购周报-' + toYMD(today()) + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '成品采购工作台数据-' + toYMD(today()) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importData(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data.records || !Array.isArray(data.records)) throw new Error('数据格式不正确');
        state = data;
        ensureStateShape();
        syncFactories();
        saveState();
        renderSelects();
        renderAll();
        toast('数据已导入');
      } catch (err) {
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      el.classList.remove('show');
    }, 1800);
  }

  window.PROCUREMENT_WORKBENCH = {
    storageKey: STORAGE_KEY,
    getState: function () {
      return JSON.parse(JSON.stringify(state));
    },
    setState: function (nextState) {
      if (!nextState || !Array.isArray(nextState.records)) {
        throw new Error('云端数据格式不正确，缺少采购工作台 records。');
      }
      state = nextState;
      ensureStateShape();
      syncFactories();
      saveState();
      renderSelects();
      renderSmartEmail();
      renderAll();
      toast('已读取云端采购工作台数据');
    },
    saveState: saveState,
    refresh: function () {
      ensureStateShape();
      syncFactories();
      renderSelects();
      renderSmartEmail();
      renderAll();
    },
    toast: toast
  };

  window.addEventListener('DOMContentLoaded', init);
})();
