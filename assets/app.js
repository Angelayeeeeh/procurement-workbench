(function () {
  'use strict';

  var STORAGE_KEY = 'autoPartsProcurementWorkbench.v1';

  var defaultFactories = ['莱克', '纯发', '纳科达', '汇财', '和润宇', '小松'];
  var factories = defaultFactories.slice();

  /* ========== 【合同迭代新增】默认合同数据（来自合同汇总 Excel） ========== */
  var defaultContracts = [
    { contractType: '供应商合同', factory: '河北新派瑞新能源材料有限公司', category: '防冻液', startDate: '2025-09-24', expiryDate: '2026-09-23' },
    { contractType: '生产授权', factory: '东莞市纯发实业有限公司', category: 'EP5无骨雨刷，EP8复合式雨刷', startDate: '2025-10-22', expiryDate: '2026-12-31' },
    { contractType: '供应商合同', factory: '山东莱克科技有限公司', category: '制动液和防冻液', startDate: '2025-12-09', expiryDate: '2026-12-31' },
    { contractType: '供应商合同', factory: '佛山市卡皮诺复合材料有限公司', category: '改色膜', startDate: '2026-01-20', expiryDate: '2027-01-19' },
    { contractType: '供应商合同', factory: '南通纳尔材料科技有限公司', category: '窗膜、车衣', startDate: '2025-03-18', expiryDate: '2027-03-17' },
    { contractType: '供应商合同', factory: '江西和润宇电源科技有限公司', category: '蓄电池', startDate: '2026-03-13', expiryDate: '2026-12-31' },
    { contractType: '供应商合同', factory: '运研材料科技（上海）有限公司', category: '隐形车衣', startDate: '2026-04-01', expiryDate: '2027-03-31' },
    { contractType: '供应商合同', factory: '江西科为薄膜新型材料有限公司', category: '窗膜', startDate: '2026-04-17', expiryDate: '2027-04-16' },
    { contractType: '供应商合同', factory: '宁波中炫电子科技有限公司', category: '火花塞', startDate: '2026-01-01', expiryDate: '2026-12-31' },
    { contractType: '三方合同', factory: '纳琳科新材料（南通）有限公司&郑州汇财包装有限公司', category: '汽车窗膜', startDate: '2026-05-17', expiryDate: '2027-05-16' },
    { contractType: '三方合同', factory: '海安浩驰科技有限公司&郑州汇财包装有限公司', category: '汽车窗膜', startDate: '2026-05-23', expiryDate: '2027-05-22' },
    { contractType: '三方合同', factory: '南通纳科达聚氨酯科技有限公司', category: '隐形车衣&天窗冰甲', startDate: '2026-07-16', expiryDate: '2027-07-15' }
  ];
  var modules = [
    { id: 'suppliers', name: '供应商管理' },
    { id: 'orders', name: '采购订单 & 跟进' },
    { id: 'smartEmail', name: '智能邮箱' },
    { id: 'finance', name: '付款 & 发票管理' },
    { id: 'reconciliation', name: '工厂月结对账' },
    { id: 'antifake', name: '防伪标管理' },
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
  var orderQuickFilter = '';
  var financeListFilter = null;
  var selectedOrderIds = [];
  var pendingPurchaseOrderImport = null;
  var pendingPdfPurchaseOrderImport = null;
  // 【库存汇总迭代新增】汇总查询视图状态
  var inventorySummaryMode = 'gy'; // 'gy' 或 'order'
  var inventorySummaryGyFilter = '';
  var inventorySummaryOrderFilter = '';
  // 【增量变更】采购订单预览页防伪标扣减比例下拉选择（临时状态，预览时使用）
  var previewAntifakeRatio = null;
  var previewAntifakeRatioOptions = ['1:1', '4:1'];
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
      contracts: defaultContracts.slice(),
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
    // 【合同迭代新增】合同数据数组
    state.contracts = Array.isArray(state.contracts) ? state.contracts : [];
    // 【莱克专属库存转移】若合同数据为空，自动载入默认合同（含山东莱克科技有限公司），确保供应商名片存在
    if (state.contracts.length === 0 && typeof defaultContracts !== 'undefined') {
      state.contracts = defaultContracts.slice();
    }
    // 工厂代管库存总账：按「工厂名称 -> GY号」保存当前库存数量，Excel采购单确认后自动累加。
    state.factoryInventory = state.factoryInventory && typeof state.factoryInventory === 'object' ? state.factoryInventory : {};
    // 工厂代管库存流水：记录每一次采购单入库来源，便于从库存回溯到订单号。
    state.factoryInventoryMovements = Array.isArray(state.factoryInventoryMovements) ? state.factoryInventoryMovements : [];
    state.antifakeThresholds = state.antifakeThresholds && typeof state.antifakeThresholds === 'object' ? state.antifakeThresholds : {};
    state.antifakeExempt = state.antifakeExempt && typeof state.antifakeExempt === 'object' ? state.antifakeExempt : {};
    state.antifakeExemptNote = state.antifakeExemptNote && typeof state.antifakeExemptNote === 'object' ? state.antifakeExemptNote : {};
    // 【防伪标迭代新增】防伪标使用记录数组（仅采购订单自动扣减生成）
    state.antifakeUsageRecords = Array.isArray(state.antifakeUsageRecords) ? state.antifakeUsageRecords : [];
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
      payment.paymentFlows = Array.isArray(payment.paymentFlows) ? payment.paymentFlows : [];
      payment.paidAmount = Number(payment.paidAmount || 0);
      payment.invoiceFlows = Array.isArray(payment.invoiceFlows) ? payment.invoiceFlows : [];
      payment.invoicedAmount = Number(payment.invoicedAmount || 0);
      syncFinancePaymentPaidStatus(payment);
      syncFinancePaymentInvoiceStatus(payment);
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
    // 【合同迭代新增】合同数据中的工厂名称自动补入供应商、库存和防伪标管理
    (state.contracts || []).forEach(function (contract) {
      var name = contract.factory;
      if (!name) return;
      if (state.deletedSuppliers.indexOf(name) >= 0) return;
      if (!state.suppliers.some(function (s) { return s.name === name; })) {
        state.suppliers.push({
          name: name,
          contact: '',
          products: contract.category || '',
          settle: '',
          note: '由合同管理自动补入。',
          createdAt: nowISO()
        });
      }
      if (typeof state.antifakeStock[name] !== 'number') state.antifakeStock[name] = 0;
      if (typeof state.antifakeThresholds[name] !== 'number') state.antifakeThresholds[name] = 50;
      if (!state.antifakeExempt[name]) state.antifakeExempt[name] = false;
      if (!state.antifakeExemptNote[name]) state.antifakeExemptNote[name] = '';
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
      if (supplier.name && !state.factoryInventory[supplier.name]) {
        state.factoryInventory[supplier.name] = {};
      }
      // 【防伪标迭代新增】供应商防伪标扣减比例（默认1表示1:1）和特殊工厂标记
      if (typeof supplier.antifakeRatio !== 'number') supplier.antifakeRatio = 1;
      if (typeof supplier.isSpecialFactory !== 'boolean') supplier.isSpecialFactory = false;
      // 江西和润宇电源科技有限公司默认为特殊工厂
      if (supplier.name === '江西和润宇电源科技有限公司') supplier.isSpecialFactory = true;
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
    setupPurchaseOrderPdfUpload();
    if ($('orderQuickFilter')) {
      $('orderQuickFilter').addEventListener('input', function () {
        orderQuickFilter = $('orderQuickFilter').value.trim();
        renderTables();
      });
    }
    if ($('clearOrderQuickFilterBtn')) {
      $('clearOrderQuickFilterBtn').addEventListener('click', function () {
        orderQuickFilter = '';
        $('orderQuickFilter').value = '';
        renderTables();
      });
    }
    if ($('exportPurchaseOrdersExcelBtn')) $('exportPurchaseOrdersExcelBtn').addEventListener('click', exportAllPurchaseOrdersExcel);
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
        if (supplierSubdir === 'inventory') selectedFactory = '';
        renderSupplierSubdir();
        renderFactoryCards();
        renderFactoryInventoryPanel();
        renderFactoryFollowDetail();
        if (supplierSubdir === 'contracts') renderContractExpiry();
      });
    });
    $('closeSupplierModalBtn').addEventListener('click', closeSupplierModal);
    $('supplierForm').addEventListener('submit', onSupplierSubmit);
    // 【合同迭代新增】合同管理事件绑定
    setupContractUpload();
    setupContractAddSupplierBtn();
    $('antifakeMoveForm').addEventListener('submit', onAntifakeMoveSubmit);
    var antifakeSubtabs = $('antifakeSubtabs');
    if (antifakeSubtabs) {
      antifakeSubtabs.querySelectorAll('.antifake-subtab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-antifake-subtab');
          antifakeSubtabs.querySelectorAll('.antifake-subtab-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          document.querySelectorAll('[data-antifake-subtab-content]').forEach(function (c) {
            c.classList.toggle('active', c.getAttribute('data-antifake-subtab-content') === target);
          });
          if (target === 'stock' || target === 'ledger') renderAntifakePanel();
          if (target === 'usage') renderAntifakeUsageRecords();
        });
      });
      var toggleBtn = $('antifakeSubtabToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
          antifakeSubtabs.classList.toggle('collapsed');
        });
      }
    }
    var ratioInput = $('antifakeUseRatio');
    if (ratioInput) {
      var updateRatioPreview = function () {
        var parsed = parseAntifakeRatio(ratioInput.value);
        var preview = $('antifakeRatioPreview');
        if (preview) {
          preview.textContent = parsed ? '→ 每件产品配 ' + parsed + ' 个防伪标' : '格式无效，请输入如 1:1 或 4:1';
        }
        if (pendingPurchaseOrderImport && pendingPurchaseOrderImport.singleOrder) {
          renderPurchaseOrderPreview(pendingPurchaseOrderImport);
        }
      };
      ratioInput.addEventListener('input', updateRatioPreview);
      updateRatioPreview();
    }
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
    renderContractExpiry();
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
    // 【修改】待付款 = 流转上传采购单未付款 + 临时付款未付款
    var waitPayFlows = flows.filter(function (f) {
      return f.orderStatus === '已完成' && f.paymentStatus !== '已付款';
    }).length;
    var tempPayCount = payments.filter(function (p) {
      return p.type === '临时付款' && p.paymentStatus !== '已付款';
    }).length;
    var totalWaitPay = waitPayFlows + tempPayCount;
    // 【修改】已开票 = 付款发票管理中已完成开票的采购订单
    var invoicedCount = payments.filter(function (p) { return p.invoiceStatus === '已开票'; }).length;
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
      { cls: 'wait-pay', label: '待付款', count: totalWaitPay },
      { cls: 'done', label: '已开票', count: invoicedCount }
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
        '<div class="overview-head"><div><h3>订单执行情况</h3><span>对账 → 采购单 → 付款 → 开票进度</span></div><span>订单跟进 ' + activeOrderTasks + ' 项</span></div>' +
        '<div class="execution-list">' + execRows.map(function (row) {
          var pct = Math.round(row.count / totalFlow * 100);
          return '<div class="execution-row ' + row.cls + '"><span>' + row.label + '</span><div class="execution-bar"><i style="width:' + pct + '%"></i></div><strong class="mono">' + row.count + '</strong></div>';
        }).join('') + '</div>' +
        '<div class="overview-note">待付款含流转上传采购单及临时付款；已开票统计付款发票管理中已完成开票的订单。</div>' +
      '</div>';
    board.querySelectorAll('[data-overview-nav]').forEach(function (card) {
      card.addEventListener('click', function () {
        switchSection(card.getAttribute('data-overview-nav'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    /* ========== 更新今日导览卡片数据（新增，不修改原有逻辑） ========== */
    var weekTaskCount = state.records.filter(function (r) {
      return r.status !== '已完成' && isWithin(r.dueDate, startOfWeek(today()), endOfWeek(today()));
    }).length;
    var overdueCount = state.records.filter(isOverdue).length;
    var invoicePending = (state.financePayments || []).filter(function (p) {
      return p.invoiceStatus && p.invoiceStatus !== '无需开票' && p.invoiceStatus !== '已开票';
    }).length;
    var elPending = $('homeStatPending');
    var elPayment = $('homeStatPayment');
    var elWeek = $('homeStatWeekTasks');
    var elOverdue = $('homeStatOverdue');
    if (elPending) elPending.textContent = waitOrder;
    if (elPayment) elPayment.textContent = totalWaitPay;
    if (elWeek) elWeek.textContent = weekTaskCount;
    if (elOverdue) elOverdue.textContent = overdueCount;
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
    var contracts = $('supplierContractsPanel');
    if (!profile || !inventory) return;
    profile.style.display = supplierSubdir === 'profile' ? 'block' : 'none';
    inventory.style.display = supplierSubdir === 'inventory' ? 'block' : 'none';
    if (contracts) contracts.style.display = supplierSubdir === 'contracts' ? 'block' : 'none';
    document.querySelectorAll('[data-supplier-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-supplier-tab') === supplierSubdir);
    });
    if (supplierSubdir === 'contracts') renderContractExpiry();
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
        '<button class="btn factory-rename-btn" data-rename-factory="' + escapeHTML(f) + '" style="font-size:12px;padding:4px 10px;min-height:auto;">修改名称</button>' +
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
    $('factoryCards').querySelectorAll('[data-rename-factory]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openRenameSupplierModal(btn.getAttribute('data-rename-factory'));
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
      summary.textContent = '选择工厂卡片后进入该工厂专属库存管理页面';
      body.innerHTML = renderInventoryFactoryDirectoryHTML();
      bindInventoryFactoryDirectory();
      return;
    }
    title.textContent = selectedFactory + '・工厂库存管理';
    var localInventoryHtml = renderFactoryManagedInventoryHTML(selectedFactory);
    if (selectedFactory === '莱克' || selectedFactory === '山东莱克科技有限公司') {
      summary.textContent = '单HTML内置库存台账；可通过“莱克专属库存”进入订单出货看板。';
      body.innerHTML =
        localInventoryHtml +
        '<div class="inventory-empty">后续采购单确认流转产生的入库数量，会继续显示在上方“工厂代管库存（GY号主键）”和“最近入库流水”中；莱克订单出货扣减请进入“莱克专属库存”。</div>';
      bindFactoryInventoryActions();
      return;
    }
    summary.textContent = '显示 Excel 采购单确认流转后自动累计的工厂代管库存。';
    body.innerHTML = localInventoryHtml;
    bindFactoryInventoryActions();
  }

  function renderInventoryFactoryDirectoryHTML() {
    // 【增量变更】删除莱克重复条目，仅保留山东莱克科技有限公司
    var visibleSuppliers = state.suppliers.filter(function (s) { return s.name !== '莱克'; });
    var cards = visibleSuppliers.map(function (supplier) {
      var factory = supplier.name;
      var stocks = factoryInventoryStockRows(factory);
      var totalQty = stocks.reduce(function (sum, item) { return sum + Number(item.库存数量 || 0); }, 0);
      var latest = factoryLatestInventoryMovement(factory);
      var laikeLink = (factory === '山东莱克科技有限公司')
        ? '<a class="btn primary" href="./laike-inventory-dashboard/laike-inventory-dashboard.html" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="font-size:12px;padding:6px 10px;min-height:auto;">莱克专属库存</a>'
        : '';
      return '<div class="factory-card" data-inventory-factory-card="' + escapeHTML(factory) + '"><div><h4>' + escapeHTML(factory) + '</h4>' +
        '<p>主营：' + escapeHTML(supplier.products || '未填写') + '</p>' +
        '<p>库存型号 ' + stocks.length + ' 个 · 当前库存总数 ' + totalQty + '</p>' +
        '<p>' + escapeHTML(latest ? ('最近更新：订单 ' + (latest.orderNo || '未填') + ' / ' + shortTime(latest.createdAt)) : '暂无库存流水') + '</p>' +
        '</div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">' +
        laikeLink +
        '<span class="status ' + (stocks.length ? 'doing' : 'pending') + '">' + (stocks.length ? '查看库存' : '暂无库存') + '</span>' +
        '</div></div>';
    }).join('');
    return '<div class="pill-row" style="margin-bottom:12px;">' +
      '<span class="pill">点击工厂卡片进入库存</span>' +
      '<span class="pill">按 GY 号统计库存</span>' +
      '<span class="pill">扣减后自动保存</span>' +
      '</div><div class="grid cols-3">' + cards + '</div>' +
      renderInventorySummaryHTML();
  }

  // 【库存汇总迭代新增】判断是否为莱克专属库存工厂（汇总时排除）
  function isLaikeDedicatedFactory(factory) {
    return factory === '莱克' || factory === '山东莱克科技有限公司';
  }

  // 【库存汇总迭代新增】渲染库存汇总板块 HTML
  function renderInventorySummaryHTML() {
    return '<div class="card" style="margin-top:18px;box-shadow:none;border:1px solid var(--line);">' +
      '<div class="card-header">' +
      '<h3>库存汇总查询</h3>' +
      '<span>统计数据已自动排除莱克专属库存，不纳入汇总计算</span>' +
      '</div>' +
      '<div class="card-body">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">' +
      '<div style="flex:1;min-width:200px;">' +
      '<label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">GY号（模糊检索）</label>' +
      '<input type="text" id="inventorySummaryGyInput" placeholder="输入GY号关键词…" value="' + escapeHTML(inventorySummaryGyFilter) + '" ' +
      'style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 12px;font:inherit;color:var(--text);background:#fff;">' +
      '</div>' +
      '<div style="flex:1;min-width:200px;">' +
      '<label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">订单号（模糊检索）</label>' +
      '<input type="text" id="inventorySummaryOrderInput" placeholder="输入订单号关键词…" value="' + escapeHTML(inventorySummaryOrderFilter) + '" ' +
      'style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 12px;font:inherit;color:var(--text);background:#fff;">' +
      '</div>' +
      '<button class="btn primary" id="inventorySummarySearchBtn" type="button" style="margin-top:18px;">查询</button>' +
      '<button class="btn" id="inventorySummaryClearBtn" type="button" style="margin-top:18px;">清除</button>' +
      '</div>' +
      '<div class="antifake-subtabs" id="inventorySummaryTabs" style="margin-bottom:12px;">' +
      '<button class="antifake-subtab-btn' + (inventorySummaryMode === 'gy' ? ' active' : '') + '" data-inventory-summary-tab="gy" type="button">按 GY 号汇总</button>' +
      '<button class="antifake-subtab-btn' + (inventorySummaryMode === 'order' ? ' active' : '') + '" data-inventory-summary-tab="order" type="button">按 订单号 汇总</button>' +
      '</div>' +
      '<div id="inventorySummaryContent">' + renderInventorySummaryTableHTML() + '</div>' +
      '</div>' +
      '</div>';
  }

  // 【库存汇总迭代新增】计算汇总数据（排除莱克专属库存）
  function computeInventorySummaryData() {
    var inventory = state.factoryInventory || {};
    var gyMap = {};   // { gy: { gy, productNames, factories, totalQty, factoryList } }
    var orderMap = {}; // { orderNo: { orderNo, items: [...] } }
    var gyFilterLower = inventorySummaryGyFilter.toLowerCase().trim();
    var orderFilterLower = inventorySummaryOrderFilter.toLowerCase().trim();

    Object.keys(inventory).forEach(function (factoryName) {
      // 排除莱克专属库存
      if (isLaikeDedicatedFactory(factoryName)) return;
      var factoryStock = inventory[factoryName] || {};
      Object.keys(factoryStock).forEach(function (gy) {
        var item = factoryStock[gy] || {};
        var gyModel = item.gyModel || gy;
        var qty = Number(item.qty || 0);
        var productName = item.productName || '';
        var orderNo = item.orderNo || '';

        // GY号汇总
        if (!gyMap[gyModel]) {
          gyMap[gyModel] = { gy: gyModel, productNames: {}, factories: {}, totalQty: 0 };
        }
        gyMap[gyModel].totalQty += qty;
        if (productName) gyMap[gyModel].productNames[productName] = true;
        if (!gyMap[gyModel].factories[factoryName]) gyMap[gyModel].factories[factoryName] = 0;
        gyMap[gyModel].factories[factoryName] += qty;

        // 订单号汇总
        if (orderNo) {
          if (!orderMap[orderNo]) {
            orderMap[orderNo] = { orderNo: orderNo, items: [] };
          }
          orderMap[orderNo].items.push({
            factory: factoryName,
            gy: gyModel,
            productName: productName,
            qty: qty
          });
        }
      });
    });

    // 应用筛选
    var gyList = Object.keys(gyMap).map(function (k) { return gyMap[k]; }).filter(function (row) {
      if (gyFilterLower && row.gy.toLowerCase().indexOf(gyFilterLower) < 0) return false;
      return true;
    }).sort(function (a, b) { return b.totalQty - a.totalQty; });

    var orderList = Object.keys(orderMap).map(function (k) { return orderMap[k]; }).filter(function (row) {
      if (orderFilterLower && row.orderNo.toLowerCase().indexOf(orderFilterLower) < 0) return false;
      return true;
    }).map(function (row) {
      var totalQty = row.items.reduce(function (s, i) { return s + Number(i.qty || 0); }, 0);
      var factorySet = {};
      row.items.forEach(function (i) { factorySet[i.factory] = true; });
      return {
        orderNo: row.orderNo,
        factories: Object.keys(factorySet).join('、'),
        gyCount: row.items.length,
        totalQty: totalQty,
        items: row.items
      };
    }).sort(function (a, b) { return b.totalQty - a.totalQty; });

    return { gyList: gyList, orderList: orderList };
  }

  // 【库存汇总迭代新增】渲染汇总表格 HTML
  function renderInventorySummaryTableHTML() {
    var data = computeInventorySummaryData();
    var gyList = data.gyList;
    var orderList = data.orderList;

    // 统计概览
    var gyTotalQty = gyList.reduce(function (s, r) { return s + r.totalQty; }, 0);
    var orderTotalQty = orderList.reduce(function (s, r) { return s + r.totalQty; }, 0);

    if (inventorySummaryMode === 'gy') {
      var gyRows = gyList.length ? gyList.map(function (row) {
        var factoryList = Object.keys(row.factories).map(function (f) {
          return escapeHTML(f) + '（' + row.factories[f] + '）';
        }).join('、');
        var productNames = Object.keys(row.productNames).join('、');
        return '<tr>' +
          '<td class="mono" style="font-weight:600;">' + escapeHTML(row.gy) + '</td>' +
          '<td>' + escapeHTML(productNames || '—') + '</td>' +
          '<td>' + factoryList + '</td>' +
          '<td class="num" style="color:var(--accent);font-weight:700;font-size:16px;">' + row.totalQty + '</td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="4" class="empty">暂无符合条件的 GY 号库存数据</td></tr>';

      return '<div class="pill-row" style="margin-bottom:10px;">' +
        '<span class="pill">GY 号汇总：' + gyList.length + ' 个型号</span>' +
        '<span class="pill" style="background:var(--accent-soft);color:var(--accent);">剩余总库存：' + gyTotalQty + ' 件</span>' +
        '</div>' +
        '<div class="table-wrap" style="max-height:420px;"><table>' +
        '<thead><tr><th>GY号</th><th>品名</th><th>涉及工厂（库存数）</th><th>剩余总库存</th></tr></thead>' +
        '<tbody>' + gyRows + '</tbody></table></div>';
    } else {
      var orderRows = orderList.length ? orderList.map(function (row) {
        var detailItems = row.items.map(function (i) {
          return escapeHTML(i.gy) + '：' + i.qty + '件' + (i.factory ? '（' + escapeHTML(i.factory) + '）' : '');
        }).join('；');
        return '<tr>' +
          '<td class="mono" style="font-weight:600;">' + escapeHTML(row.orderNo) + '</td>' +
          '<td>' + escapeHTML(row.factories || '—') + '</td>' +
          '<td class="num">' + row.gyCount + '</td>' +
          '<td class="num" style="color:var(--accent);font-weight:700;font-size:16px;">' + row.totalQty + '</td>' +
          '<td style="font-size:12px;color:var(--muted);max-width:360px;">' + escapeHTML(detailItems || '—') + '</td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="5" class="empty">暂无符合条件的订单号库存数据</td></tr>';

      return '<div class="pill-row" style="margin-bottom:10px;">' +
        '<span class="pill">订单号汇总：' + orderList.length + ' 笔订单</span>' +
        '<span class="pill" style="background:var(--accent-soft);color:var(--accent);">剩余总库存：' + orderTotalQty + ' 件</span>' +
        '</div>' +
        '<div class="table-wrap" style="max-height:420px;"><table>' +
        '<thead><tr><th>订单号</th><th>工厂</th><th>型号数</th><th>剩余总库存</th><th>明细</th></tr></thead>' +
        '<tbody>' + orderRows + '</tbody></table></div>';
    }
  }

  // 【库存汇总迭代新增】绑定汇总板块事件
  function bindInventorySummaryControls() {
    var gyInput = $('inventorySummaryGyInput');
    var orderInput = $('inventorySummaryOrderInput');
    var searchBtn = $('inventorySummarySearchBtn');
    var clearBtn = $('inventorySummaryClearBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        inventorySummaryGyFilter = gyInput ? gyInput.value.trim() : '';
        inventorySummaryOrderFilter = orderInput ? orderInput.value.trim() : '';
        var content = $('inventorySummaryContent');
        if (content) content.innerHTML = renderInventorySummaryTableHTML();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        inventorySummaryGyFilter = '';
        inventorySummaryOrderFilter = '';
        if (gyInput) gyInput.value = '';
        if (orderInput) orderInput.value = '';
        var content = $('inventorySummaryContent');
        if (content) content.innerHTML = renderInventorySummaryTableHTML();
      });
    }
    // 回车触发查询
    if (gyInput) {
      gyInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && searchBtn) searchBtn.click();
      });
    }
    if (orderInput) {
      orderInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && searchBtn) searchBtn.click();
      });
    }
    // Tab 切换
    document.querySelectorAll('[data-inventory-summary-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        inventorySummaryMode = btn.getAttribute('data-inventory-summary-tab') || 'gy';
        document.querySelectorAll('[data-inventory-summary-tab]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        var content = $('inventorySummaryContent');
        if (content) content.innerHTML = renderInventorySummaryTableHTML();
      });
    });
  }

  function bindInventoryFactoryDirectory() {
    var body = $('factoryInventoryBody');
    if (!body) return;
    body.querySelectorAll('[data-inventory-factory-card]').forEach(function (card) {
      card.addEventListener('click', function () {
        selectedFactory = card.getAttribute('data-inventory-factory-card') || '';
        renderFactoryInventoryPanel();
      });
    });
    // 【库存汇总迭代新增】绑定汇总板块事件
    bindInventorySummaryControls();
  }

  function ensureXLSXLibrary(cb) {
    if (window.XLSX) { cb(null); return; }
    var s = document.createElement('script');
    s.src = './xlsx.full.min.js';
    s.onload = function () { cb(null); };
    s.onerror = function () {
      var s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s2.onload = function () { cb(null); };
      s2.onerror = function () { cb(new Error('XLSX 库加载失败')); };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }

  function findInventoryCol(headers, keywords) {
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').trim().toLowerCase();
      for (var j = 0; j < keywords.length; j++) {
        if (h === keywords[j].toLowerCase()) return i;
      }
    }
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').trim().toLowerCase();
      for (var j = 0; j < keywords.length; j++) {
        if (h.indexOf(keywords[j].toLowerCase()) >= 0) return i;
      }
    }
    return -1;
  }

  function handleFactoryInventoryUpload(file) {
    if (!file || !/\.(xlsx|xls)$/i.test(file.name || '')) {
      showFactoryInventoryUploadMessage('请上传 .xls 或 .xlsx 格式的 Excel 文件', 'error');
      return;
    }
    if (!selectedFactory) {
      showFactoryInventoryUploadMessage('请先选择工厂', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      ensureXLSXLibrary(function (err) {
        if (err) { showFactoryInventoryUploadMessage('Excel 解析库加载失败：' + err.message, 'error'); return; }
        try {
          var wb = window.XLSX.read(e.target.result, { type: 'array', cellDates: true });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!rows || rows.length < 2) { showFactoryInventoryUploadMessage('Excel 文件没有数据行', 'error'); return; }
          var headers = (rows[0] || []).map(function (h) { return String(h || '').trim(); });
          var colOrder = findInventoryCol(headers, ['订单号', '订单编号', 'PO号', ' order']);
          var colGY = findInventoryCol(headers, ['GY号', 'GY编码', '型号', 'SKU', 'GY']);
          var colName = findInventoryCol(headers, ['品名', '产品名称', '货品名称', '产品', '货品']);
          var colQty = findInventoryCol(headers, ['库存数量', '数量', '库存', 'qty']);
          var missing = [];
          if (colGY === -1) missing.push('GY号');
          if (colQty === -1) missing.push('库存数量');
          if (missing.length) {
            showFactoryInventoryUploadMessage('缺少必要列：' + missing.join('、') + '。检测到的表头：' + headers.join('、'), 'error');
            return;
          }
          var parsed = [];
          var errors = [];
          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            if (!r || r.length === 0) continue;
            var gy = colGY >= 0 ? String(r[colGY] || '').trim() : '';
            var qtyRaw = colQty >= 0 ? r[colQty] : '';
            var qtyNum = parseNumberLike(qtyRaw);
            if (!gy && !qtyRaw) continue;
            if (!gy) { errors.push('第' + (i + 1) + '行缺少GY号'); continue; }
            if (isNaN(Number(qtyRaw)) && qtyRaw !== '') { errors.push('第' + (i + 1) + '行库存数量不是有效数字：' + qtyRaw); continue; }
            if (qtyNum < 0) { errors.push('第' + (i + 1) + '行库存数量为负数：' + qtyNum); continue; }
            parsed.push({
              orderNo: colOrder >= 0 ? String(r[colOrder] || '').trim() : '',
              gyModel: gy,
              productName: colName >= 0 ? String(r[colName] || '').trim() : '',
              qty: qtyNum
            });
          }
          if (errors.length) {
            showFactoryInventoryUploadMessage('解析发现以下问题，请修正后重新上传：\n' + errors.slice(0, 10).join('\n'), 'error');
            return;
          }
          if (!parsed.length) { showFactoryInventoryUploadMessage('未解析到有效数据行', 'error'); return; }
          renderFactoryInventoryUploadPreview(parsed, file.name);
        } catch (parseErr) {
          console.error('Excel解析失败', parseErr);
          showFactoryInventoryUploadMessage('Excel 解析失败：' + (parseErr.message || '未知错误'), 'error');
        }
      });
    };
    reader.onerror = function () { showFactoryInventoryUploadMessage('文件读取失败', 'error'); };
    reader.readAsArrayBuffer(file);
  }

  function showFactoryInventoryUploadMessage(message, type) {
    var el = $('factoryInventoryUploadPreview');
    if (!el) return;
    var cls = type === 'error' ? 'updated' : 'added';
    el.innerHTML = '<div class="feedback-item ' + cls + '">' + escapeHTML(message).replace(/\n/g, '<br>') + '</div>';
    el.style.display = 'block';
  }

  function renderFactoryInventoryUploadPreview(parsed, fileName) {
    var el = $('factoryInventoryUploadPreview');
    if (!el) return;
    var totalQty = parsed.reduce(function (s, r) { return s + Number(r.qty || 0); }, 0);
    var rows = parsed.map(function (r, i) {
      return '<tr>' +
        '<td>' + escapeHTML(r.orderNo || '') + '</td>' +
        '<td>' + escapeHTML(r.gyModel || '') + '</td>' +
        '<td>' + escapeHTML(r.productName || '') + '</td>' +
        '<td>' + escapeHTML(r.qty || 0) + '</td>' +
        '</tr>';
    }).join('');
    el.innerHTML =
      '<div class="feedback-section"><strong>库存明细识别结果：' + escapeHTML(fileName) + '</strong>' +
      '<div class="feedback-item added">共识别 ' + parsed.length + ' 行，库存数量合计 ' + totalQty + '</div>' +
      '<div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>订单号</th><th>GY号</th><th>品名</th><th>库存数量</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="record-actions" style="margin-top:12px;">' +
      '<button class="btn primary" id="confirmFactoryInventoryUploadBtn" type="button">确认写入库存</button>' +
      '<button class="btn" id="cancelFactoryInventoryUploadBtn" type="button">取消</button>' +
      '</div></div>';
    el.style.display = 'block';
    $('confirmFactoryInventoryUploadBtn').addEventListener('click', function () {
      confirmFactoryInventoryUpload(parsed, fileName);
    });
    $('cancelFactoryInventoryUploadBtn').addEventListener('click', function () {
      el.style.display = 'none';
      el.innerHTML = '';
    });
  }

  function confirmFactoryInventoryUpload(parsed, fileName) {
    try {
      var factory = selectedFactory;
      if (!factory) { toast('请先选择工厂'); return; }
      state.factoryInventory = state.factoryInventory && typeof state.factoryInventory === 'object' ? state.factoryInventory : {};
      state.factoryInventoryMovements = Array.isArray(state.factoryInventoryMovements) ? state.factoryInventoryMovements : [];
      if (!state.factoryInventory[factory]) state.factoryInventory[factory] = {};
      var count = 0;
      parsed.forEach(function (item) {
        var gy = item.gyModel;
        var qty = Number(item.qty || 0);
        if (!gy || qty < 0) return;
        var stock = state.factoryInventory[factory][gy] || {
          factory: factory, gyModel: gy, productName: item.productName || '', qty: 0,
          orderNo: item.orderNo || '', createdAt: nowISO(), updatedAt: nowISO()
        };
        stock.productName = item.productName || stock.productName || '';
        stock.orderNo = item.orderNo || stock.orderNo || '';
        stock.qty = qty;
        stock.updatedAt = nowISO();
        state.factoryInventory[factory][gy] = stock;
        state.factoryInventoryMovements.unshift({
          id: makeId(), type: 'Excel上传入库', factory: factory, gyModel: gy,
          productName: item.productName || '', qty: qty, unitPrice: 0, lineAmount: 0,
          orderNo: item.orderNo || '', orderDate: '', recordId: '',
          sourceFile: fileName || '', sourceRow: '',
          createdAt: nowISO(), note: 'Excel库存明细上传入库，工厂：' + factory
        });
        count++;
      });
      state.operationLogs = state.operationLogs || [];
      state.operationLogs.unshift({
        time: nowISO(), action: 'Excel库存明细上传',
        detail: factory + ' / ' + count + ' 行 / 来源：' + (fileName || ''),
        factory: factory
      });
      saveState();
      renderAll();
      var el = $('factoryInventoryUploadPreview');
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
      toast('已写入 ' + factory + ' 库存明细 ' + count + ' 行，总库存 ' + parsed.reduce(function (s, r) { return s + Number(r.qty || 0); }, 0));
    } catch (err) {
      console.error('写入库存失败', err);
      toast('写入库存失败：' + (err.message || '未知错误'));
    }
  }

  function renderFactoryManagedInventoryHTML(factory) {
    var inventoryMap = state.factoryInventory && state.factoryInventory[factory] ? state.factoryInventory[factory] : {};
    var stocks = Object.keys(inventoryMap).map(function (gy) { return inventoryMap[gy]; }).sort(function (a, b) {
      return String(a.gyModel || '').localeCompare(String(b.gyModel || ''));
    });
    var movements = (state.factoryInventoryMovements || []).filter(function (m) { return m.factory === factory; }).slice(0, 20);
    var totalQty = stocks.reduce(function (sum, item) { return sum + Number(item.qty || 0); }, 0);
    var currentOrderNo = factoryLatestPurchaseOrderNo(factory);
    var laikeDedicatedLink = (factory === '莱克' || factory === '山东莱克科技有限公司')
      ? '<a class="btn primary" href="./laike-inventory-dashboard/laike-inventory-dashboard.html" target="_blank" rel="noopener">莱克专属库存</a>'
      : '';
    var uploadZoneHtml = '<div class="card" style="box-shadow:none;border:1px solid var(--line);margin-bottom:14px;">' +
      '<div class="card-header"><h3>拖拽上传库存明细</h3><span>支持 Excel 文件，自动识别订单号、GY号、品名、库存数量</span></div>' +
      '<div class="card-body">' +
      '<div class="po-upload-box" id="factoryInventoryDropZone" style="margin-bottom:12px;">' +
      '<input id="factoryInventoryFileInput" type="file" accept=".xlsx,.xls">' +
      '<div class="po-upload-icon">⇪</div>' +
      '<div><strong>拖拽库存明细 Excel 到这里，或点击选择文件</strong>' +
      '<p>自动识别列名：订单号、GY号、品名、库存数量（支持模糊匹配）</p>' +
      '<small>仅支持 .xlsx / .xls 格式</small></div>' +
      '</div>' +
      '<div class="quick-feedback" id="factoryInventoryUploadPreview" style="display:none;"></div>' +
      '</div></div>';
    var stockRows = stocks.map(function (item) {
      var latest = factoryLatestInventoryMovement(factory, item.gyModel);
      return '<tr>' +
        '<td>' + escapeHTML((latest && latest.orderNo) || item.orderNo || '') + '</td>' +
        '<td>' + escapeHTML(item.gyModel || '') + '</td>' +
        '<td>' + escapeHTML(item.productName || '') + '</td>' +
        '<td>' + escapeHTML(item.qty || 0) + '</td>' +
        '<td>' + escapeHTML(shortTime(item.updatedAt)) + '</td>' +
        '<td><div class="record-actions" style="gap:6px;flex-wrap:nowrap;">' +
        '<input data-inventory-deduct-gy="' + escapeHTML(item.gyModel || '') + '" type="number" min="0" step="1" placeholder="扣减数量" style="width:96px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;">' +
        '<button class="btn" data-inventory-deduct-btn="' + escapeHTML(item.gyModel || '') + '" type="button">确认扣减</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
    var movementRows = movements.map(function (m) {
      var moveQty = Number(m.qty || 0);
      return '<tr>' +
        '<td>' + escapeHTML(shortTime(m.createdAt)) + '</td>' +
        '<td>' + escapeHTML(m.orderNo || '') + '</td>' +
        '<td>' + escapeHTML(m.gyModel || '') + '</td>' +
        '<td>' + escapeHTML(m.productName || '') + '</td>' +
        '<td>' + escapeHTML((moveQty > 0 ? '+' : '') + moveQty) + '</td>' +
        '<td>' + escapeHTML(m.sourceFile || '') + '</td>' +
        '</tr>';
    }).join('');
    return uploadZoneHtml + '<div class="card" style="box-shadow:none;border:1px solid var(--line);margin-bottom:14px;">' +
      '<div class="card-header"><h3>工厂代管库存（GY号主键）</h3><span>当前型号 ' + stocks.length + ' 个，库存总数 ' + totalQty + '</span></div>' +
      '<div class="card-body">' +
      '<div class="po-backup-notice">提示：库存数据保存在本浏览器 localStorage。浏览器缓存有丢失风险，建议定期导出库存备份文件长期保存。</div>' +
      '<div class="record-actions" style="margin:8px 0 12px;">' +
      '<button class="btn" id="backInventoryDirectoryBtn" type="button">返回工厂库存首页</button>' +
      laikeDedicatedLink +
      '<button class="btn primary" id="deductCurrentOrderInventoryBtn" type="button"' + (currentOrderNo ? '' : ' disabled') + '>按当前订单一键扣减库存' + (currentOrderNo ? '（' + escapeHTML(currentOrderNo) + '）' : '') + '</button>' +
      '<button class="btn primary" id="exportFactoryInventoryBtn" type="button">导出库存备份</button></div>' +
      (stockRows ? '<div class="table-wrap"><table><thead><tr><th>订单号</th><th>GY号</th><th>品名</th><th>库存数量</th><th>最后更新时间</th><th>手动扣减</th></tr></thead><tbody>' + stockRows + '</tbody></table></div>' : '<div class="inventory-empty">暂无 Excel 采购单入库库存。确认 Excel 采购单后会按 GY 号自动累加。</div>') +
      '<h4 style="margin:14px 0 8px;">最近入库流水</h4>' +
      (movementRows ? '<div class="table-wrap"><table><thead><tr><th>时间</th><th>来源订单号</th><th>GY号</th><th>品名</th><th>数量变动</th><th>来源文件</th></tr></thead><tbody>' + movementRows + '</tbody></table></div>' : '<div class="inventory-empty">暂无入库流水。</div>') +
      '</div></div>';
  }

  function bindFactoryInventoryActions() {
    var btn = $('exportFactoryInventoryBtn');
    if (btn) btn.addEventListener('click', exportFactoryInventoryBackup);
    var backBtn = $('backInventoryDirectoryBtn');
    if (backBtn) backBtn.addEventListener('click', function () {
      selectedFactory = '';
      renderFactoryInventoryPanel();
    });
    var orderBtn = $('deductCurrentOrderInventoryBtn');
    if (orderBtn) orderBtn.addEventListener('click', deductCurrentOrderInventory);
    var body = $('factoryInventoryBody');
    if (!body) return;
    body.querySelectorAll('[data-inventory-deduct-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var gy = btn.getAttribute('data-inventory-deduct-btn') || '';
        var input = body.querySelector('[data-inventory-deduct-gy="' + gy.replace(/"/g, '\\"') + '"]');
        var qty = input ? parseNumberLike(input.value) : 0;
        deductFactoryInventoryItem(selectedFactory, gy, qty, '手动扣减', '');
      });
    });
    var dropZone = $('factoryInventoryDropZone');
    var fileInput = $('factoryInventoryFileInput');
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (file) handleFactoryInventoryUpload(file);
        fileInput.value = '';
      });
      ['dragenter', 'dragover'].forEach(function (eventName) {
        dropZone.addEventListener(eventName, function (e) {
          e.preventDefault(); e.stopPropagation();
          dropZone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(function (eventName) {
        dropZone.addEventListener(eventName, function (e) {
          e.preventDefault(); e.stopPropagation();
          dropZone.classList.remove('drag-over');
        });
      });
      dropZone.addEventListener('drop', function (e) {
        var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleFactoryInventoryUpload(file);
      });
    }
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
    renderTable('orderTable', filterOrderRecords());
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
    renderAntifakeStockTablePanel();
    renderAntifakeStockPanel();
    renderAntifakeMovementTable();
  }

  function renderAntifakeStockTablePanel() {
    var container = $('antifakeStockTablePanel');
    if (!container) return;
    var visibleFactories = factories.filter(function (factory) {
      return !state.antifakeExempt[factory];
    });
    if (!visibleFactories.length) {
      container.innerHTML = '<div class="empty">当前没有需要寄标的工厂。</div>';
      return;
    }
    var totalRemaining = 0;
    var totalSent = 0;
    var totalDeducted = 0;
    var alertCount = 0;
    var factoryData = visibleFactories.map(function (factory) {
      var qty = Number(state.antifakeStock[factory] || 0);
      var threshold = Number(state.antifakeThresholds[factory] != null ? state.antifakeThresholds[factory] : 50);
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
      var isLow = qty < threshold;
      if (isLow) alertCount++;
      totalRemaining += qty;
      totalSent += sentTotal;
      totalDeducted += deductedTotal;
      return { factory: factory, qty: qty, threshold: threshold, sentTotal: sentTotal, deductedTotal: deductedTotal, isLow: isLow };
    });
    var summaryHtml = '<div class="antifake-stock-summary" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-radius:var(--radius);background:var(--accent-soft);border:1px solid rgba(224,122,95,0.18);">' +
      '<div style="font-size:12px;color:var(--muted);font-weight:700;">防伪标剩余总量</div>' +
      '<div style="font-family:JetBrains Mono,monospace;font-size:28px;font-weight:800;color:var(--accent);">' + totalRemaining + '</div>' +
      '<div style="font-size:11px;color:var(--muted);font-weight:700;">需寄标工厂 ' + visibleFactories.length + ' 家</div></div>' +
      '<div style="padding:14px 20px;border-radius:var(--radius);background:#F5F5F5;border:1px solid var(--rule);">' +
      '<div style="font-size:12px;color:var(--muted);font-weight:700;">累计寄出</div>' +
      '<div style="font-family:JetBrains Mono,monospace;font-size:28px;font-weight:800;color:var(--blue);">' + totalSent + '</div>' +
      '<div style="font-size:11px;color:var(--muted);font-weight:700;">全部工厂寄出累计</div></div>' +
      '<div style="padding:14px 20px;border-radius:var(--radius);background:#F5F5F5;border:1px solid var(--rule);">' +
      '<div style="font-size:12px;color:var(--muted);font-weight:700;">累计扣减</div>' +
      '<div style="font-family:JetBrains Mono,monospace;font-size:28px;font-weight:800;color:var(--accent2);">' + totalDeducted + '</div>' +
      '<div style="font-size:11px;color:var(--muted);font-weight:700;">含订单扣减/损耗/退回</div></div>' +
      '<div style="padding:14px 20px;border-radius:var(--radius);background:' + (alertCount > 0 ? 'var(--danger-bg)' : 'var(--success-bg)') + ';border:1px solid ' + (alertCount > 0 ? 'rgba(224,122,95,0.22)' : 'rgba(76,175,80,0.20)') + ';">' +
      '<div style="font-size:12px;color:var(--muted);font-weight:700;">库存告警</div>' +
      '<div style="font-family:JetBrains Mono,monospace;font-size:28px;font-weight:800;color:' + (alertCount > 0 ? 'var(--danger)' : 'var(--success)') + ';">' + alertCount + '</div>' +
      '<div style="font-size:11px;color:var(--muted);font-weight:700;">' + (alertCount > 0 ? '家工厂低于阈值' : '全部库存正常') + '</div></div>' +
      '</div>';
    var tableRows = factoryData.map(function (d) {
      var rowCls = d.isLow ? ' style="background:#FFF5F4;"' : '';
      var statusHtml = d.isLow
        ? '<span class="status pending" style="background:var(--danger-bg);color:var(--danger);">低于阈值</span>'
        : '<span class="status done">正常</span>';
      var qtyCls = d.isLow ? ' style="color:var(--danger);font-weight:700;"' : ' style="color:var(--success);font-weight:700;"';
      return '<tr' + rowCls + '>' +
        '<td><strong>' + escapeHTML(d.factory) + '</strong></td>' +
        '<td style="font-family:JetBrains Mono,monospace;"' + qtyCls + '>' + d.qty + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--muted);">' + d.threshold + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--blue);">' + d.sentTotal + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--accent2);">' + d.deductedTotal + '</td>' +
        '<td>' + statusHtml + '</td>' +
        '</tr>';
    }).join('');
    var tableHtml = '<div class="table-wrap"><table><thead><tr>' +
      '<th>工厂</th><th>剩余库存数量</th><th>预警阈值</th><th>寄出累计</th><th>扣减累计</th><th>状态</th>' +
      '</tr></thead><tbody>' + tableRows + '</tbody></table></div>';
    container.innerHTML = summaryHtml + tableHtml;
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
      // 【防伪标迭代新增】读取工厂防伪标扣减比例和特殊工厂标记
      var supplier = state.suppliers.find(function (s) { return s.name === factory; });
      var antifakeRatio = supplier && typeof supplier.antifakeRatio === 'number' ? supplier.antifakeRatio : 1;
      var isSpecial = supplier && supplier.isSpecialFactory;

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
        '<h4>' + escapeHTML(factory) + (isSpecial ? ' <span class="pill warn" style="font-size:11px;">特殊工厂</span>' : '') + '</h4>' +
        '<div class="stock-summary">' +
        '<div class="stock-item"><span class="label">寄出累计</span><span class="value">' + sentTotal + '</span></div>' +
        '<div class="stock-item"><span class="label">扣减累计</span><span class="value">' + deductedTotal + '</span></div>' +
        '<div class="stock-item remaining"><span class="label">当前剩余</span><span class="value">' + qty + '</span></div>' +
        '</div>' +
        '<div class="stock-light">' + statusText + '</div>' +
        '<div class="threshold-field"><label>预警阈值</label>' +
        '<input type="number" min="0" value="' + threshold + '" data-threshold-factory="' + escapeHTML(factory) + '" class="threshold-input"' + (exempt ? ' disabled' : '') + '></div>' +
        '<div class="threshold-field"><label>防伪标扣减比例</label>' +
        '<input type="number" min="0" step="0.1" value="' + antifakeRatio + '" data-ratio-factory="' + escapeHTML(factory) + '" class="threshold-input" placeholder="1表示1:1，0.25表示4:1">' +
        '<small style="color:var(--muted);font-size:11px;">1=1:1，0.25=4:1（4件产品扣1个标）</small></div>' +
        '<div class="exempt-field">' +
        '<label class="exempt-toggle"><input type="checkbox" data-exempt-factory="' + escapeHTML(factory) + '"' + (exempt ? ' checked' : '') + '> 无需寄标</label>' +
        '</div>' +
        '<div class="exempt-field">' +
        '<label class="exempt-toggle"><input type="checkbox" data-special-factory="' + escapeHTML(factory) + '"' + (isSpecial ? ' checked' : '') + '> 特殊工厂（跳过库存和付款）</label>' +
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
        if (e.target.closest('.threshold-field, .exempt-field, .exempt-note-field, .ratio-field')) return;
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
    // 【防伪标迭代新增】防伪标扣减比例变更
    panel.querySelectorAll('[data-ratio-factory]').forEach(function (input) {
      input.addEventListener('change', function () {
        var factoryName = input.getAttribute('data-ratio-factory');
        var val = Number(input.value);
        if (isNaN(val) || val < 0) val = 1;
        var supplier = state.suppliers.find(function (s) { return s.name === factoryName; });
        if (supplier) {
          supplier.antifakeRatio = val;
          saveState();
          toast('已设置「' + factoryName + '」防伪标扣减比例为 1:' + val);
        }
      });
    });
    // 【防伪标迭代新增】特殊工厂复选框变更
    panel.querySelectorAll('[data-special-factory]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var factoryName = cb.getAttribute('data-special-factory');
        var supplier = state.suppliers.find(function (s) { return s.name === factoryName; });
        if (supplier) {
          supplier.isSpecialFactory = cb.checked;
          saveState();
          toast(cb.checked ? '已设置「' + factoryName + '」为特殊工厂' : '已取消「' + factoryName + '」特殊工厂标记');
        }
      });
    });
  }

  // 【防伪标迭代新增】防伪标使用记录渲染函数
  function renderAntifakeUsageRecords() {
    var statsEl = $('antifakeUsageStats');
    var bodyEl = $('antifakeUsageTableBody');
    if (!bodyEl) return;
    var records = state.antifakeUsageRecords || [];
    var totalDeduction = records.reduce(function (s, r) { return s + Number(r.deductionQty || 0); }, 0);
    var totalOrderQty = records.reduce(function (s, r) { return s + Number(r.orderQty || 0); }, 0);
    var factories = {};
    records.forEach(function (r) { factories[r.factory] = (factories[r.factory] || 0) + 1; });
    var factoryCount = Object.keys(factories).length;
    if (statsEl) {
      statsEl.innerHTML =
        '<span class="pill">使用记录：' + records.length + ' 条</span>' +
        '<span class="pill" style="background:var(--accent-soft);color:var(--accent);">累计扣减：' + totalDeduction + ' 个</span>' +
        '<span class="pill">累计订单数量：' + totalOrderQty + ' 件</span>' +
        '<span class="pill">涉及工厂：' + factoryCount + ' 家</span>';
    }
    if (!records.length) {
      bodyEl.innerHTML = '<tr><td colspan="7" class="empty">暂无防伪标使用记录。采购订单上传确认后将自动生成。</td></tr>';
      return;
    }
    bodyEl.innerHTML = records.map(function (r) {
      return '<tr>' +
        '<td class="mono">' + escapeHTML(r.orderNo || '') + '</td>' +
        '<td>' + escapeHTML(formatDateTime(r.createdAt)) + '</td>' +
        '<td>' + escapeHTML(r.factory || '') + '</td>' +
        '<td>' + escapeHTML(r.ratio || '') + '</td>' +
        '<td class="num" style="color:var(--accent);font-weight:700;">' + escapeHTML(String(r.deductionQty || 0)) + '</td>' +
        '<td class="num">' + escapeHTML(String(r.orderQty || 0)) + '</td>' +
        '<td>' + escapeHTML(r.fileName || '') + '</td>' +
        '</tr>';
    }).join('');
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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
      if (filterLabel) filterLabel.textContent = '全部工厂 · 切换到「防伪标库存管理」点击卡片可单独筛选某工厂';
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
      return sum + financePaymentRemainingAmount(p);
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
      var waitInvoice = items.filter(function (p) { return p.invoiceStatus !== '已开票' && p.invoiceStatus !== '无需开票'; }).length;
      var invoiced = items.filter(function (p) { return p.invoiceStatus === '已开票'; }).length;
      var waitPayAmount = items.filter(function (p) { return p.paymentStatus !== '已付款'; }).reduce(function (sum, p) {
        return sum + financePaymentRemainingAmount(p);
      }, 0);
      return '<div class="finance-month-card">' +
        '<h4>' + escapeHTML(m) + '</h4>' +
        '<div class="finance-kpis">' +
        '<div class="finance-kpi danger clickable-card" data-finance-filter-month="' + escapeHTML(m) + '" data-finance-filter-status="waitPay" title="点击只看' + escapeHTML(m) + '待付款订单"><span>待付款</span><strong>' + waitPay + '</strong></div>' +
        '<div class="finance-kpi danger"><span>待付款金额</span><strong>' + escapeHTML(formatCurrency(waitPayAmount) || '￥0.00') + '</strong></div>' +
        '<div class="finance-kpi success clickable-card" data-finance-filter-month="' + escapeHTML(m) + '" data-finance-filter-status="paid" title="点击只看' + escapeHTML(m) + '已付款订单"><span>已付款</span><strong>' + paid + '</strong></div>' +
        '<div class="finance-kpi warning clickable-card" data-finance-filter-month="' + escapeHTML(m) + '" data-finance-filter-status="waitInvoice" title="点击只看' + escapeHTML(m) + '待开票订单"><span>待开票</span><strong>' + waitInvoice + '</strong></div>' +
        '<div class="finance-kpi success"><span>已开票</span><strong>' + invoiced + '</strong></div>' +
        '</div></div>';
    }).join('');
    if (!scoped.length) {
      panel.innerHTML = totalCard + '<div class="finance-month-grid">' + cards + '</div><div class="empty">7月、8月、9月暂无付款/开票记录。月结下推到付款或添加临时付款后会自动显示。</div>';
      bindFinanceFilterCards(panel);
      return;
    }
    var list = applyFinanceListFilter(scoped);
    var filterBar = financeListFilter
      ? '<div class="quick-feedback" style="display:block;margin:12px 0;"><div class="feedback-item updated">当前筛选：' + escapeHTML(financeFilterLabel(financeListFilter)) + '，共 ' + list.length + ' 笔。<button class="btn" id="clearFinanceListFilterBtn" type="button" style="margin-left:10px;">显示全部</button></div></div>'
      : '';
    var rows = list.map(function (p) {
      var billNo = p.orderNo || p.kingdeeNo || '待补单号';
      syncFinancePaymentPaidStatus(p);
      syncFinancePaymentInvoiceStatus(p);
      var totalAmount = financePaymentTotalAmount(p);
      var paidAmount = financePaymentPaidAmount(p);
      var remainingAmount = financePaymentRemainingAmount(p);
      var percent = totalAmount ? (paidAmount / totalAmount * 100) : 0;
      var flowHtml = financePaymentFlowHTML(p);
      var invoiceAmount = financePaymentInvoicedAmount(p);
      var invoiceRemaining = financePaymentInvoiceRemainingAmount(p);
      var invoiceFlowHtml = financeInvoiceFlowHTML(p);
      return '<tr>' +
        '<td>' + escapeHTML(p.type || '') + '</td>' +
        '<td>' + escapeHTML(p.factory || '未指定') + '</td>' +
        '<td><span class="mono">' + escapeHTML(billNo) + '</span></td>' +
        '<td>' +
          '<div>总货款：' + escapeHTML(formatCurrency(totalAmount) || normalizeCurrency(p.amount)) + '</div>' +
          '<div class="muted">已付款：' + escapeHTML(formatCurrency(paidAmount) || '￥0.00') + '（' + percent.toFixed(2) + '%）</div>' +
          '<div class="muted">剩余待付：' + escapeHTML(formatCurrency(remainingAmount) || '￥0.00') + '</div>' +
        '</td>' +
        '<td>' + escapeHTML(p.requester || '') + '</td>' +
        '<td>' + escapeHTML(formatDate(p.dueDate) || '') + '</td>' +
        '<td><span class="status ' + (p.paymentStatus === '已付款' ? 'done' : statusClass('待跟进', p.dueDate)) + '">' + escapeHTML(p.paymentStatus) + '</span></td>' +
        '<td><span class="status ' + (p.invoiceStatus === '已开票' ? 'done' : (p.invoiceStatus === '部分开票' ? 'doing' : (p.invoiceStatus === '无需开票' ? 'idle' : 'pending'))) + '">' + escapeHTML(p.invoiceStatus) + '</span>' +
          (p.invoiceStatus === '无需开票' ? '' :
            '<div class="muted">已开票：' + escapeHTML(formatCurrency(invoiceAmount) || '￥0.00') + '</div>' +
            '<div class="muted">剩余待开：' + escapeHTML(formatCurrency(invoiceRemaining) || '￥0.00') + '</div>') + '</td>' +
        '<td>' + escapeHTML(p.note || '') + flowHtml + invoiceFlowHtml + '</td>' +
        '<td><div class="record-actions">' +
        '<button data-finance-action="partialPay" data-payment-id="' + p.id + '">登记分批付款</button>' +
        (p.invoiceStatus === '无需开票' ? '' : '<button data-finance-action="partialInvoice" data-payment-id="' + p.id + '">登记分批开票</button>') +
        (p.invoiceStatus === '无需开票' ? '' : '<button data-finance-action="noInvoice" data-payment-id="' + p.id + '">标记无需开票</button>') +
        '<button data-finance-action="delete" data-payment-id="' + p.id + '">删除</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
    panel.innerHTML = totalCard + '<div class="finance-month-grid">' + cards + '</div>' + filterBar +
      (list.length ? '<div class="table-wrap"><table><thead><tr>' +
      '<th>来源</th><th>工厂</th><th>采购单号 / 金蝶单号</th><th>金额</th><th>请款人</th><th>预计付款日</th><th>付款状态</th><th>开票状态</th><th>备注</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">当前筛选条件下暂无订单。</div>');
    bindFinanceFilterCards(panel);
    if ($('clearFinanceListFilterBtn')) {
      $('clearFinanceListFilterBtn').addEventListener('click', function () {
        financeListFilter = null;
        renderFinancePaymentPanel();
      });
    }
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
    if (action === 'partialPay') {
      openFinancePartialPaymentModal(payment);
      return;
    }
    if (action === 'partialInvoice') {
      openFinancePartialInvoiceModal(payment);
      return;
    }
    if (action === 'invoiced') markFinancePaymentInvoiced(payment);
    if (action === 'noInvoice') markFinancePaymentNoInvoice(payment);
    saveState();
    renderAll();
  }

  function bindFinanceFilterCards(panel) {
    panel.querySelectorAll('[data-finance-filter-status]').forEach(function (card) {
      card.addEventListener('click', function () {
        financeListFilter = {
          month: card.getAttribute('data-finance-filter-month') || '',
          status: card.getAttribute('data-finance-filter-status') || ''
        };
        renderFinancePaymentPanel();
        var target = $('financePaymentPanel');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function applyFinanceListFilter(list) {
    if (!financeListFilter) return list;
    return list.filter(function (p) {
      var key = monthKey(parseYMD(p.dueDate) || today());
      if (financeListFilter.month && key !== financeListFilter.month) return false;
      if (financeListFilter.status === 'waitPay') return p.paymentStatus !== '已付款';
      if (financeListFilter.status === 'paid') return p.paymentStatus === '已付款';
      if (financeListFilter.status === 'waitInvoice') return p.invoiceStatus !== '已开票' && p.invoiceStatus !== '无需开票';
      return true;
    });
  }

  function financeFilterLabel(filter) {
    var statusMap = { waitPay: '待付款订单', paid: '已付款订单', waitInvoice: '待开票订单' };
    return (filter.month || '全部月份') + ' · ' + (statusMap[filter.status] || '全部状态');
  }

  function financePaymentTotalAmount(payment) {
    return currencyNumber(payment && payment.amount);
  }

  function financePaymentPaidAmount(payment) {
    payment.paymentFlows = Array.isArray(payment.paymentFlows) ? payment.paymentFlows : [];
    var sum = payment.paymentFlows.reduce(function (total, flow) {
      return total + Number(flow.amount || 0);
    }, 0);
    if (!sum && payment.paymentStatus === '已付款' && financePaymentTotalAmount(payment)) {
      sum = financePaymentTotalAmount(payment);
    }
    payment.paidAmount = sum;
    return sum;
  }

  function financePaymentRemainingAmount(payment) {
    return Math.max(0, financePaymentTotalAmount(payment) - financePaymentPaidAmount(payment));
  }

  function syncFinancePaymentPaidStatus(payment) {
    if (!payment) return;
    var total = financePaymentTotalAmount(payment);
    var paid = financePaymentPaidAmount(payment);
    if (payment.paymentStatus === '已付款' && !paid && total) {
      payment.paidAmount = total;
      return;
    }
    if (total && paid >= total) {
      payment.paymentStatus = '已付款';
      if (!payment.paidAt) payment.paidAt = nowISO();
    } else if (paid > 0) {
      payment.paymentStatus = '部分付款';
      payment.paidAt = '';
    } else if (payment.paymentStatus === '已付款' || payment.paymentStatus === '部分付款') {
      payment.paymentStatus = '待付款';
      payment.paidAt = '';
    }
  }

  function financePaymentFlowHTML(payment) {
    var flows = Array.isArray(payment.paymentFlows) ? payment.paymentFlows : [];
    if (!flows.length) return '';
    var rows = flows.slice().sort(function (a, b) {
      return String(b.time || '').localeCompare(String(a.time || ''));
    }).map(function (flow) {
      return '<tr><td>' + escapeHTML(shortTime(flow.time)) + '</td>' +
        '<td>' + escapeHTML(formatCurrency(flow.amount) || '￥0.00') + '</td>' +
        '<td>' + escapeHTML(Number(flow.percent || 0).toFixed(2) + '%') + '</td></tr>';
    }).join('');
    return '<details style="margin-top:8px;"><summary class="muted">查看付款流水（' + flows.length + '笔）</summary>' +
      '<div class="table-wrap" style="margin-top:6px;"><table><thead><tr><th>付款时间</th><th>付款金额</th><th>付款比例</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }

  function financePaymentInvoicedAmount(payment) {
    payment.invoiceFlows = Array.isArray(payment.invoiceFlows) ? payment.invoiceFlows : [];
    var sum = payment.invoiceFlows.reduce(function (total, flow) {
      return total + Number(flow.amount || 0);
    }, 0);
    if (!sum && payment.invoiceStatus === '已开票' && financePaymentTotalAmount(payment)) {
      sum = financePaymentTotalAmount(payment);
    }
    payment.invoicedAmount = sum;
    return sum;
  }

  function financePaymentInvoiceRemainingAmount(payment) {
    return Math.max(0, financePaymentTotalAmount(payment) - financePaymentInvoicedAmount(payment));
  }

  function syncFinancePaymentInvoiceStatus(payment) {
    if (!payment) return;
    if (payment.invoiceStatus === '无需开票') return;
    var total = financePaymentTotalAmount(payment);
    var invoiced = financePaymentInvoicedAmount(payment);
    if (payment.invoiceStatus === '已开票' && !invoiced && total) {
      payment.invoicedAmount = total;
      return;
    }
    if (total && invoiced >= total) {
      payment.invoiceStatus = '已开票';
      if (!payment.invoiceAt) payment.invoiceAt = nowISO();
    } else if (invoiced > 0) {
      payment.invoiceStatus = '部分开票';
      payment.invoiceAt = '';
    } else if (payment.invoiceStatus === '已开票' || payment.invoiceStatus === '部分开票') {
      payment.invoiceStatus = '待开票';
      payment.invoiceAt = '';
    }
  }

  function financeInvoiceFlowHTML(payment) {
    var flows = Array.isArray(payment.invoiceFlows) ? payment.invoiceFlows : [];
    if (!flows.length) return '';
    var rows = flows.slice().sort(function (a, b) {
      return String(b.time || '').localeCompare(String(a.time || ''));
    }).map(function (flow) {
      return '<tr><td>' + escapeHTML(shortTime(flow.time)) + '</td>' +
        '<td>' + escapeHTML(formatCurrency(flow.amount) || '￥0.00') + '</td></tr>';
    }).join('');
    return '<details style="margin-top:8px;"><summary class="muted">查看开票流水（' + flows.length + '笔）</summary>' +
      '<div class="table-wrap" style="margin-top:6px;"><table><thead><tr><th>开票时间</th><th>开票金额</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }

  function openFinancePartialPaymentModal(payment) {
    var total = financePaymentTotalAmount(payment);
    var paid = financePaymentPaidAmount(payment);
    var remaining = financePaymentRemainingAmount(payment);
    var modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.id = 'financePartialPaymentModal';
    modal.innerHTML =
      '<div class="modal" style="max-width:560px;">' +
      '<div class="modal-header"><h3>登记分批付款</h3><button class="icon-btn" id="closeFinancePartialPaymentModalBtn" type="button">×</button></div>' +
      '<form id="financePartialPaymentForm" class="modal-body">' +
      '<div class="quick-feedback" style="display:block;margin-bottom:12px;">' +
      '<div class="feedback-item added">总货款：' + escapeHTML(formatCurrency(total) || '￥0.00') +
      '；已付款：' + escapeHTML(formatCurrency(paid) || '￥0.00') +
      '；剩余待付款：' + escapeHTML(formatCurrency(remaining) || '￥0.00') + '</div></div>' +
      '<div class="form-grid">' +
      '<div class="field wide"><label>录入方式</label><select id="partialPayMode"><option value="amount">自定义本次实付金额</option><option value="percent">按总货款百分比填写</option></select></div>' +
      '<div class="field" id="partialPayAmountField"><label>本次实付金额</label><input id="partialPayAmount" placeholder="例：5000"></div>' +
      '<div class="field" id="partialPayPercentField" style="display:none;"><label>付款比例（%）</label><input id="partialPayPercent" placeholder="例：30"></div>' +
      '<div class="field wide"><label>备注</label><input id="partialPayNote" placeholder="可填写付款批次、凭证或说明"></div>' +
      '</div>' +
      '<div class="record-actions" style="justify-content:flex-end;margin-top:14px;">' +
      '<button class="btn" id="cancelFinancePartialPaymentBtn" type="button">取消</button>' +
      '<button class="btn primary" type="submit">提交付款</button>' +
      '</div>' +
      '</form></div>';
    document.body.appendChild(modal);
    var close = function () {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    };
    $('closeFinancePartialPaymentModalBtn').addEventListener('click', close);
    $('cancelFinancePartialPaymentBtn').addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    $('partialPayMode').addEventListener('change', function () {
      var mode = $('partialPayMode').value;
      $('partialPayAmountField').style.display = mode === 'amount' ? '' : 'none';
      $('partialPayPercentField').style.display = mode === 'percent' ? '' : 'none';
    });
    $('financePartialPaymentForm').addEventListener('submit', function (e) {
      e.preventDefault();
      submitFinancePartialPayment(payment, close);
    });
  }

  function submitFinancePartialPayment(payment, close) {
    var total = financePaymentTotalAmount(payment);
    var remaining = financePaymentRemainingAmount(payment);
    var mode = $('partialPayMode').value;
    var amount = 0;
    var percent = 0;
    if (mode === 'percent') {
      percent = parseNumberLike($('partialPayPercent').value);
      amount = total * percent / 100;
    } else {
      amount = parseNumberLike($('partialPayAmount').value);
      percent = total ? amount / total * 100 : 0;
    }
    if (!amount || amount <= 0) {
      toast('请填写有效的付款金额或比例');
      return;
    }
    if (remaining && amount > remaining) amount = remaining;
    payment.paymentFlows = Array.isArray(payment.paymentFlows) ? payment.paymentFlows : [];
    var time = nowISO();
    payment.paymentFlows.push({
      id: makeId(),
      time: time,
      amount: amount,
      percent: total ? amount / total * 100 : percent,
      note: $('partialPayNote') ? $('partialPayNote').value.trim() : ''
    });
    payment.updatedAt = time;
    payment.history = payment.history || [];
    payment.history.push({ time: time, action: '登记分批付款：' + (formatCurrency(amount) || amount) });
    syncFinancePaymentPaidStatus(payment);
    if (payment.paymentStatus === '已付款') {
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
    saveState();
    renderAll();
    if (close) close();
    toast('已登记本次付款，剩余待付款已更新');
  }

  function openFinancePartialInvoiceModal(payment) {
    var total = financePaymentTotalAmount(payment);
    var invoiced = financePaymentInvoicedAmount(payment);
    var remaining = financePaymentInvoiceRemainingAmount(payment);
    var modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.id = 'financePartialInvoiceModal';
    modal.innerHTML =
      '<div class="modal" style="max-width:520px;">' +
      '<div class="modal-header"><h3>登记分批开票</h3><button class="icon-btn" id="closeFinancePartialInvoiceModalBtn" type="button">×</button></div>' +
      '<form id="financePartialInvoiceForm" class="modal-body">' +
      '<div class="quick-feedback" style="display:block;margin-bottom:12px;">' +
      '<div class="feedback-item added">总货款：' + escapeHTML(formatCurrency(total) || '￥0.00') +
      '；已开票：' + escapeHTML(formatCurrency(invoiced) || '￥0.00') +
      '；剩余待开票：' + escapeHTML(formatCurrency(remaining) || '￥0.00') + '</div></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label>本次开票金额</label><input id="partialInvoiceAmount" placeholder="例：5000"></div>' +
      '<div class="field wide"><label>备注</label><input id="partialInvoiceNote" placeholder="可填写发票号、批次或说明"></div>' +
      '</div>' +
      '<div class="record-actions" style="justify-content:flex-end;margin-top:14px;">' +
      '<button class="btn" id="cancelFinancePartialInvoiceBtn" type="button">取消</button>' +
      '<button class="btn primary" type="submit">提交开票</button>' +
      '</div>' +
      '</form></div>';
    document.body.appendChild(modal);
    var close = function () {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    };
    $('closeFinancePartialInvoiceModalBtn').addEventListener('click', close);
    $('cancelFinancePartialInvoiceBtn').addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    $('financePartialInvoiceForm').addEventListener('submit', function (e) {
      e.preventDefault();
      submitFinancePartialInvoice(payment, close);
    });
  }

  function submitFinancePartialInvoice(payment, close) {
    var remaining = financePaymentInvoiceRemainingAmount(payment);
    var amount = parseNumberLike($('partialInvoiceAmount').value);
    if (!amount || amount <= 0) {
      toast('请填写有效的开票金额');
      return;
    }
    if (remaining && amount > remaining) amount = remaining;
    payment.invoiceFlows = Array.isArray(payment.invoiceFlows) ? payment.invoiceFlows : [];
    var time = nowISO();
    payment.invoiceFlows.push({
      id: makeId(),
      time: time,
      amount: amount,
      note: $('partialInvoiceNote') ? $('partialInvoiceNote').value.trim() : ''
    });
    payment.updatedAt = time;
    payment.history = payment.history || [];
    payment.history.push({ time: time, action: '登记分批开票：' + (formatCurrency(amount) || amount) });
    syncFinancePaymentInvoiceStatus(payment);
    updateSettlementLinkedRecord(payment.recordId, {
      note: (payment.note || '') + '；已登记开票：' + (formatCurrency(amount) || amount)
    });
    saveState();
    renderAll();
    if (close) close();
    toast('已登记本次开票，剩余待开票已更新');
  }

  function filterByModule(moduleId) {
    return state.records.filter(function (r) { return r.module === moduleId; }).sort(byDue);
  }

  function filterOrderRecords() {
    var list = filterByModule('orders');
    var q = String(orderQuickFilter || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (r) {
      var text = [r.orderNo, r.factory, r.content, r.product, r.note].join(' ').toLowerCase();
      return text.indexOf(q) >= 0;
    });
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
        renderTable('orderTable', filterOrderRecords());
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

  function markFinancePaymentNoInvoice(payment) {
    if (!payment) return;
    payment.invoiceStatus = '无需开票';
    payment.invoiceAt = '';
    payment.updatedAt = nowISO();
    payment.history = payment.history || [];
    payment.history.push({ time: payment.updatedAt, action: '标记无需开票' });
    updateSettlementLinkedRecord(payment.recordId, {
      note: (payment.note || '') + '；标记无需开票。'
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

  function setupPurchaseOrderPdfUpload() {
    var drop = $('purchaseOrderPdfDropZone');
    var input = $('purchaseOrderPdfFileInput');
    if (!drop || !input) return;
    drop.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) readPurchaseOrderPdfFile(file);
      input.value = '';
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
      if (file) readPurchaseOrderPdfFile(file);
    });
  }

  function readPurchaseOrderPdfFile(file) {
    var name = file.name || '';
    if (!/\.pdf$/i.test(name) && file.type !== 'application/pdf') {
      renderPurchaseOrderUploadMessage('请上传 PDF 格式的采购订单文件。', 'updated');
      return;
    }
    if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
      renderPurchaseOrderUploadMessage('PDF 解析库未加载。请使用已打包的单 HTML 版本，或检查页面脚本是否完整。', 'updated');
      return;
    }
    renderPurchaseOrderUploadMessage('正在解析 PDF：' + name + '，请稍等。', 'updated');
    var reader = new FileReader();
    reader.onload = function () {
      var bytes = new Uint8Array(reader.result);
      // 纯前端读取 PDF 文本；disableWorker 避免本地 file:// 双击时 Worker 路径失效。
      var task = window.pdfjsLib.getDocument({ data: bytes, disableWorker: true });
      task.promise.then(function (pdf) {
        return extractPdfTextByLines(pdf);
      }).then(function (text) {
        var parsed = parsePurchaseOrderPdfText(text, name);
        pendingPdfPurchaseOrderImport = parsed;
        renderPurchaseOrderPdfPreview(parsed);
      }).catch(function (err) {
        renderPurchaseOrderUploadMessage('PDF 解析失败：' + (err && err.message ? err.message : err), 'updated');
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function extractPdfTextByLines(pdf) {
    var pages = [];
    for (var p = 1; p <= pdf.numPages; p++) pages.push(p);
    return Promise.all(pages.map(function (pageNo) {
      return pdf.getPage(pageNo).then(function (page) {
        return page.getTextContent().then(function (content) {
          var lineMap = {};
          (content.items || []).forEach(function (item) {
            var text = cleanCell(item.str);
            if (!text) return;
            var transform = item.transform || [];
            var x = Number(transform[4] || 0);
            var y = Math.round(Number(transform[5] || 0));
            var key = String(y);
            lineMap[key] = lineMap[key] || [];
            lineMap[key].push({ x: x, text: text });
          });
          return Object.keys(lineMap).map(function (key) {
            return { y: Number(key), items: lineMap[key] };
          }).sort(function (a, b) {
            return b.y - a.y;
          }).map(function (line) {
            return line.items.sort(function (a, b) { return a.x - b.x; }).map(function (item) { return item.text; }).join(' ');
          }).join('\n');
        });
      });
    })).then(function (pageTexts) {
      return pageTexts.join('\n');
    });
  }

  function parsePurchaseOrderPdfText(text, fileName) {
    var raw = String(text || '').replace(/\u00a0/g, ' ');
    var lines = raw.split(/\n+/).map(function (line) {
      return line.replace(/[ \t]+/g, ' ').trim();
    }).filter(Boolean);
    var compact = lines.join('\n');

    // 只提取订单头部与底部汇总 5 项，不解析明细行的单行金额。
    var orderNo = firstPdfMatch(compact, [
      /订单号\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9\-_/]*)/i,
      /采购订单号\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9\-_/]*)/i
    ]);
    var dateText = firstPdfMatch(compact, [
      /订单日期\s*[:：]\s*(\d{4}[\/\-.年]\d{1,2}[\/\-.月]\d{1,2})/,
      /订货日期\s*[:：]\s*(\d{4}[\/\-.年]\d{1,2}[\/\-.月]\d{1,2})/
    ]);
    var supplier = detectPdfSupplier(lines, compact);
    var summary = detectPdfSummaryLine(lines, compact);
    var parsed = {
      fileName: fileName,
      orderNo: orderNo,
      supplier: supplier,
      orderDate: parseDateText(dateText),
      totalQty: summary.qty || '',
      totalAmount: summary.amount || '',
      summaryLine: summary.line || '',
      rawText: raw
    };
    parsed.missing = [];
    if (!parsed.orderNo) parsed.missing.push('订单号');
    if (!parsed.supplier) parsed.missing.push('供货方（工厂名称）');
    if (!parsed.orderDate) parsed.missing.push('订单日期');
    if (!parsed.totalQty) parsed.missing.push('合计数量');
    if (!parsed.totalAmount) parsed.missing.push('合计总金额');
    return parsed;
  }

  function firstPdfMatch(text, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      var match = String(text || '').match(patterns[i]);
      if (match && match[1]) return cleanCell(match[1]).replace(/[，,。;；]+$/, '');
    }
    return '';
  }

  function detectPdfSupplier(lines, compact) {
    for (var i = 0; i < lines.length && i < 20; i++) {
      var line = lines[i];
      if (line.indexOf('供货方') < 0) continue;
      var value = line.replace(/^.*?供货方\s*[:：]\s*/, '');
      value = value.replace(/\s*(地址|联系人|电话|邮箱)\s*[:：].*$/, '');
      value = cleanCell(value);
      if (value) return value;
    }
    var match = String(compact || '').replace(/\n/g, ' ').match(/供货方\s*[:：]\s*(.+?)(?:\s+地址\s*[:：]|\s+联系人\s*[:：]|\s+电话\s*[:：]|\s+邮箱\s*[:：]|$)/);
    return match ? cleanCell(match[1]) : '';
  }

  function detectPdfSummaryLine(lines, compact) {
    var candidates = (lines || []).filter(function (line) {
      return /(合计|总计|金额合计|价税合计)/.test(line) && /\d/.test(line);
    });
    if (!candidates.length) {
      var flat = String(compact || '').replace(/\n/g, ' ');
      var flatMatch = flat.match(/(合计|总计|金额合计|价税合计)[^一二三四五六七八九十]{0,80}/);
      if (flatMatch) candidates.push(flatMatch[0]);
    }
    for (var i = candidates.length - 1; i >= 0; i--) {
      var line = candidates[i];
      var amountMatch = line.match(/[￥¥]\s*([0-9,，]+(?:\.\d{1,2})?)/);
      var amount = amountMatch ? parseNumberLike(amountMatch[1]) : 0;
      var beforeAmount = amountMatch ? line.slice(0, amountMatch.index) : line;
      var afterLabel = beforeAmount.replace(/^.*?(合计|总计|金额合计|价税合计)\s*/, '');
      var qtyNums = afterLabel.match(/[0-9][0-9,，]*(?:\.\d+)?/g) || [];
      var qty = qtyNums.length ? parseNumberLike(qtyNums[qtyNums.length - 1]) : 0;
      if (!amount) {
        var nums = line.match(/[0-9][0-9,，]*(?:\.\d+)?/g) || [];
        if (nums.length >= 2) {
          qty = parseNumberLike(nums[nums.length - 2]);
          amount = parseNumberLike(nums[nums.length - 1]);
        }
      }
      if (qty || amount) return { line: line, qty: qty, amount: amount };
    }
    return { line: '', qty: 0, amount: 0 };
  }

  function renderPurchaseOrderPdfPreview(parsed) {
    var el = $('purchaseOrderUploadPreview');
    if (!el) return;
    var missingHtml = parsed.missing.length
      ? '<div class="feedback-item updated">PDF 识别未完整命中：' + escapeHTML(parsed.missing.join('、')) + '。你可以在下方手动补齐后再确认保存。</div>'
      : '<div class="feedback-item added">PDF 5 个关键字段已识别，请核对无误后确认保存。</div>';
    el.innerHTML =
      '<div class="feedback-section"><strong>PDF 采购订单识别结果：' + escapeHTML(parsed.fileName) + '</strong>' +
      '<div class="feedback-item updated">本次只保存 5 项汇总字段：订单号、供货方、订单日期、合计数量、合计总金额；PDF 其余内容和明细行单行金额均忽略。</div>' +
      missingHtml +
      '<div class="po-pdf-edit-grid">' +
      '<label>订单号<input id="pdfOrderNoInput" value="' + escapeHTML(parsed.orderNo) + '" required></label>' +
      '<label>供货方<input id="pdfSupplierInput" value="' + escapeHTML(parsed.supplier) + '" required></label>' +
      '<label>订单日期<input id="pdfOrderDateInput" type="date" value="' + escapeHTML(parsed.orderDate) + '" required></label>' +
      '<label>合计数量<input id="pdfTotalQtyInput" value="' + escapeHTML(parsed.totalQty || '') + '" required></label>' +
      '<label>合计总金额<input id="pdfTotalAmountInput" value="' + escapeHTML(parsed.totalAmount ? formatCurrency(parsed.totalAmount) : '') + '" required></label>' +
      '</div>' +
      '<div class="feedback-item updated" style="margin-top:10px;">底部汇总识别行：' + escapeHTML(parsed.summaryLine || '未识别到合计行') + '</div>' +
      '<div class="record-actions" style="margin-top:12px;">' +
      '<button class="btn primary" id="confirmPurchaseOrderPdfImportBtn" type="button">确认保存 PDF 订单</button>' +
      '<button class="btn" id="cancelPurchaseOrderPdfImportBtn" type="button">取消</button>' +
      '</div></div>';
    el.style.display = 'block';
    $('confirmPurchaseOrderPdfImportBtn').addEventListener('click', confirmPurchaseOrderPdfImport);
    $('cancelPurchaseOrderPdfImportBtn').addEventListener('click', function () {
      pendingPdfPurchaseOrderImport = null;
      el.style.display = 'none';
      el.innerHTML = '';
    });
  }

  function confirmPurchaseOrderPdfImport() {
    if (!pendingPdfPurchaseOrderImport) {
      toast('没有可保存的 PDF 采购订单');
      return;
    }
    var orderNo = cleanCell($('pdfOrderNoInput').value);
    var supplier = cleanCell($('pdfSupplierInput').value);
    var orderDate = cleanCell($('pdfOrderDateInput').value);
    var totalQty = parseNumberLike($('pdfTotalQtyInput').value);
    var totalAmount = currencyNumber($('pdfTotalAmountInput').value);
    var missing = [];
    if (!orderNo) missing.push('订单号');
    if (!supplier) missing.push('供货方');
    if (!orderDate) missing.push('订单日期');
    if (!totalQty) missing.push('合计数量');
    if (!totalAmount) missing.push('合计总金额');
    if (missing.length) {
      toast('请先补齐：' + missing.join('、'));
      return;
    }
    ensureImportedSupplier(supplier);
    var amount = formatCurrency(totalAmount);
    // PDF 订单按“追加”写入采购订单跟进，不覆盖同订单号的历史记录。
    addRecord({
      content: supplier + ' 采购订单 ' + orderNo + ' PDF已识别',
      factory: supplier,
      product: 'PDF采购订单汇总；合计数量：' + totalQty,
      module: 'orders',
      status: '待跟进',
      dueDate: orderDate,
      owner: '',
      orderNo: orderNo,
      logisticsNo: '',
      amount: amount,
      nextStep: 'PDF采购订单已确认入库，后续跟进回签、付款、发票和交付节点',
      note: 'PDF识别来源：' + pendingPdfPurchaseOrderImport.fileName + '；只提取5项汇总字段；合计行：' + (pendingPdfPurchaseOrderImport.summaryLine || '用户手动补齐'),
      weeklyCategory: 'auto'
    }, true);
    syncEmailOrderFactory(orderNo, supplier);
    // 【合同迭代新增】PDF采购订单确认后也自动填充智能邮箱
    autoFillEmailFromOrder(orderNo, supplier);
    saveState();
    renderSelects();
    renderAll();
    pendingPdfPurchaseOrderImport = null;
    if ($('purchaseOrderUploadPreview')) $('purchaseOrderUploadPreview').style.display = 'none';
    toast('PDF 采购订单已追加保存到采购订单跟进列表');
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
    var topOrderNo = detectLabeledValue(rows, fileName, ['订单号', '订单编号', '采购订单号', '采购单号', 'IBOC号', 'IBOC号码', 'IBOC', 'PO']);
    var topDate = detectLabeledValue(rows, fileName, ['订单日期', '订货日期', '下单日期', '采购日期', '日期']);
    var topSupplier = detectPurchaseOrderSupplier(rows, fileName, map, headerInfo.index);
    var summary = detectPurchaseOrderSummary(rows, map, headerInfo.index);
    // Excel 上传完整读取整张采购单：顶部订单头、表格中全部产品明细、底部合计汇总。
    // 注意：底部汇总必须来自表格原有“合计/总计”行，禁止用明细行重新求和代替。
    var detailItems = detectPurchaseOrderItems(rows, map, headerInfo.index, {
      supplier: topSupplier,
      orderNo: topOrderNo,
      orderDate: parseDateText(topDate)
    });
    var singleOrder = {
      supplier: topSupplier,
      orderNo: topOrderNo,
      orderDate: parseDateText(topDate),
      qty: summary.qty || 0,
      totalAmount: summary.amount || 0,
      summaryLine: summary.line || '',
      items: detailItems,
      gyModels: detailItems.reduce(function (acc, item) { if (item.gyModel) acc[item.gyModel] = true; return acc; }, {}),
      productNames: detailItems.reduce(function (acc, item) { if (item.productName) acc[item.productName] = true; return acc; }, {}),
      orderNos: topOrderNo ? (function () { var o = {}; o[topOrderNo] = true; return o; })() : {},
      suppliers: topSupplier ? (function () { var o = {}; o[topSupplier] = true; return o; })() : {}
    };
    var missing = [];
    if (!singleOrder.orderNo) missing.push('订单号');
    if (!singleOrder.supplier) missing.push('供货方（工厂名称）');
    if (!singleOrder.orderDate) missing.push('订单日期');
    if (!detailItems.length) missing.push('产品明细行');
    if (!singleOrder.qty) missing.push('合计数量');
    if (!singleOrder.totalAmount) missing.push('合计总金额');
    return {
      fileName: fileName,
      header: header,
      map: map,
      items: detailItems,
      singleOrder: singleOrder,
      skipped: [],
      missing: missing,
      supplier: topSupplier,
      headerRow: headerInfo.index + 1
    };
  }

  function detectPurchaseOrderItems(rows, map, headerIndex, fallback) {
    // 产品明细只认 GY 号作为型号主键；EP5 等其他编号不会作为库存主键写入。
    var items = [];
    var start = Math.max(0, (headerIndex || 0) + 1);
    for (var i = start; i < (rows || []).length; i++) {
      var row = rows[i] || [];
      var cells = row.map(cleanCell);
      if (!cells.some(Boolean)) continue;
      var rowText = cells.join(' ');
      if (/订单具体要求|产品要求|产品图片|包装方式|包装配件|外箱|装箱数|尺寸|请仔细阅读|以下条款|条款|箱唛按照|备注|特殊要求/.test(rowText)) continue;
      if (/合计|总计/.test(rowText)) continue;
      var item = parsePurchaseOrderDetailRow(cells, map, fallback, i + 1);
      if (!item) continue;
      items.push(item);
    }
    return items;
  }

  function parsePurchaseOrderDetailRow(cells, map, fallback, sourceRow) {
    var gyModel = cleanGyModel(getMappedCell(cells, map.gyModel));
    var gyIndex = map.gyModel != null ? map.gyModel : -1;
    if (!gyModel) {
      for (var c = 0; c < cells.length; c++) {
        var candidate = cleanGyModel(cells[c]);
        if (candidate) {
          gyModel = candidate;
          gyIndex = c;
          break;
        }
      }
    }
    if (!gyModel) return null;

    var productName = cleanCell(getMappedCell(cells, map.productName));
    if (!productName) {
      for (var p = gyIndex + 1; p < cells.length; p++) {
        if (!cells[p]) continue;
        if (/^GY[-\s]?\w+/i.test(cells[p])) continue;
        if (/^[\d,，.￥¥元\s-]+$/.test(cells[p])) continue;
        productName = cells[p];
        break;
      }
    }

    var qty = parseNumberLike(getMappedCell(cells, map.qty));
    var unitPrice = parsePurchaseOrderUnitPrice(cells, map.unitPrice);
    var lineAmount = parseNumberLike(getMappedCell(cells, map.totalAmount));
    if (!qty || !unitPrice || !lineAmount) {
      var numbers = collectNumericCellsAfterGy(cells, gyIndex);
      if (!qty && numbers.length) qty = numbers[0].value;
      if (!unitPrice && numbers.length >= 2) unitPrice = numbers[1].value;
      if (!lineAmount && numbers.length >= 3) lineAmount = numbers[numbers.length - 1].value;
      if (!lineAmount && qty && unitPrice) lineAmount = qty * unitPrice;
    }

    return {
      supplier: fallback.supplier || '',
      orderNo: fallback.orderNo || '',
      orderDate: fallback.orderDate || '',
      gyModel: gyModel,
      productName: productName,
      qty: qty || 0,
      unitPrice: unitPrice || 0,
      lineAmount: lineAmount || 0,
      sourceRow: sourceRow
    };
  }

  function cleanGyModel(value) {
    var text = cleanCell(value).replace(/\s+/g, '').toUpperCase();
    var match = text.match(/GY[-]?[A-Z0-9]+/);
    // GY号必须完整保留横杠，例如 GY-8844 不能被改成 GY8844。
    return match ? match[0] : '';
  }

  function collectNumericCellsAfterGy(cells, gyIndex) {
    var nums = [];
    for (var i = Math.max(0, gyIndex + 1); i < cells.length; i++) {
      var n = parseNumberLike(cells[i]);
      if (n) nums.push({ index: i, value: n });
    }
    return nums;
  }

  function findPurchaseOrderHeader(rows) {
    var best = { index: 0, score: -1, header: rows[0] || [] };
    (rows || []).slice(0, 20).forEach(function (row, index) {
      var header = (row || []).map(cleanCell);
      var map = detectPurchaseOrderHeaderMap(header);
      var rowText = header.join('');
      var score = 0;
      if (map.qty != null) score += 5;
      if (map.totalAmount != null) score += 5;
      if (map.gyModel != null) score += 6;
      if (map.productName != null) score += 3;
      if (map.unitPrice != null) score += 3;
      if (/GY号|GY型号|固特异型号|品名|产品名称|单价/.test(rowText)) score += 6;
      if (/合计数量|总数量|总计数量|数量/.test(rowText)) score += 3;
      if (/合计总金额|总计金额|总金额|合计金额|金额/.test(rowText)) score += 3;
      if (/合计|总计/.test(rowText)) score += 1;
      if (/订单号|订单日期|供货方|购货方/.test(rowText)) score -= 5;
      if (score > best.score) best = { index: index, score: score, header: header };
    });
    var required = detectPurchaseOrderHeaderMap(best.header);
    if (required.qty == null || required.totalAmount == null) {
      for (var i = 0; i < (rows || []).length && i < 30; i++) {
        var h = (rows[i] || []).map(cleanCell);
        var text = h.join('');
        if ((/合计数量|总数量|总计数量|数量/.test(text)) && (/合计总金额|总计金额|总金额|合计金额|金额/.test(text))) {
          return { index: i, score: 999, header: h };
        }
      }
    }
    return best;
  }

  function detectPurchaseOrderHeaderMap(header) {
    var map = {
      supplier: findHeaderIndex(header, ['供货方', '供应商名称', '供应商', '供方', '卖方', '厂家名称', '工厂名称', '工厂']),
      orderNo: findHeaderIndex(header, ['订单编号', '订单号', '采购订单号', '采购单号', 'PO', '单据编号', '单据号']),
      orderDate: findHeaderIndex(header, ['订单日期', '订货日期', '下单日期', '采购日期', '日期', '制单日期']),
      gyModel: findHeaderIndex(header, ['固特异型号', 'GY型号', 'GY号', 'GY', 'GY编码']),
      productName: findHeaderIndex(header, ['品名', '产品名称', '货品名称', '商品名称', '名称']),
      qty: findHeaderIndex(header, ['合计数量', '总数量', '总计数量', '数量', '采购数量', '订购数量', '下单数量']),
      unitPrice: findHeaderIndex(header, ['含税单价', '含税不含运单价', '单价', '采购单价']),
      totalAmount: findHeaderIndex(header, ['合计总金额', '总计金额', '总金额', '金额', '价税合计', '合计金额', '总价', '含税金额'])
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

  function formatPurchaseOrderMoney(value) {
    return (formatCurrency(value) || '').replace(/^￥/, '¥');
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

  function detectPurchaseOrderSummary(rows, map, headerIndex) {
    var qtyCol = map && map.qty != null ? map.qty : null;
    var totalCol = map && map.totalAmount != null ? map.totalAmount : null;
    var best = { qty: 0, amount: 0, line: '' };
    (rows || []).forEach(function (row, index) {
      if (index <= (headerIndex || 0)) return;
      var cells = (row || []).map(cleanCell);
      var rowText = cells.join(' ');
      // 只认底部合计/总计行；遇到订单具体要求和条款区时不再解析后续文字内容。
      if (/订单具体要求|请仔细阅读|以下条款|条款|箱唛按照/.test(rowText)) return;
      if (!/合计|总计/.test(rowText)) return;
      var qty = qtyCol != null ? parseNumberLike(cells[qtyCol]) : 0;
      var amount = totalCol != null ? parseNumberLike(cells[totalCol]) : 0;

      if (!amount) {
        for (var i = cells.length - 1; i >= 0; i--) {
          if (!cells[i]) continue;
          if (/[￥¥元]|\d/.test(cells[i])) {
            var amountCandidate = parseNumberLike(cells[i]);
            if (amountCandidate) {
              amount = amountCandidate;
              break;
            }
          }
        }
      }

      if (!qty) {
        var beforeAmountCells = amount && amount.toString ? cells.slice(0) : cells;
        if (amount) {
          var amountIndex = -1;
          for (var a = cells.length - 1; a >= 0; a--) {
            if (parseNumberLike(cells[a]) === amount) {
              amountIndex = a;
              break;
            }
          }
          beforeAmountCells = amountIndex >= 0 ? cells.slice(0, amountIndex) : cells;
        }
        for (var q = beforeAmountCells.length - 1; q >= 0; q--) {
          var qtyCandidate = parseNumberLike(beforeAmountCells[q]);
          if (qtyCandidate && qtyCandidate !== amount) {
            qty = qtyCandidate;
            break;
          }
        }
      }

      if (qty || amount) best = { qty: qty, amount: amount, line: rowText };
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
    // 【增量变更】兼容 yyyy/m/d 斜杠日期格式（例：2026/6/20），同时兼容带时间后缀和 Date.toString() 格式
    var m = text.match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);
    if (m) return m[1] + '-' + pad(Number(m[2])) + '-' + pad(Number(m[3]));
    // 兼容 Date.toString() 输出格式（如 "Sat Jun 20 2026 00:00:00 GMT+0800"）
    var monthMap = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    var dm = text.match(/\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/);
    if (dm && monthMap[dm[1]]) return dm[3] + '-' + pad(monthMap[dm[1]]) + '-' + pad(Number(dm[2]));
    return '';
  }

  function cleanLabeledValue(value) {
    return cleanCell(value)
      .replace(/\s+(订单号|订单编号|采购订单号|采购单号|订单日期|订货日期|下单日期|采购日期|购货方|供货方|供应商|工厂|地址|联系人|电话|邮箱|交货日期|交货地点|付款方式)[:：].*$/, '')
      .replace(/[，,。;；]+$/, '');
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
          if (cleanCell(exact[1])) return cleanLabeledValue(exact[1]);
          for (var next = c + 1; next < row.length; next++) {
            var v = cleanCell(row[next]);
            if (!v) continue;
            if (/^(订单号|订单日期|购货方|供货方|地址|联系人|电话|邮箱|交货日期|交货地点|付款方式)[:：]?$/.test(v)) break;
            return cleanLabeledValue(v);
          }
        }
        for (var embedded = 0; embedded < labels.length; embedded++) {
          var embeddedLabel = labels[embedded];
          var embeddedRe = new RegExp(embeddedLabel + '\\s*[:：]\\s*([^\\s]+(?:\\s*[^\\s:：]+){0,8})');
          var embeddedMatch = cell.match(embeddedRe);
          if (embeddedMatch && cleanCell(embeddedMatch[1])) return cleanLabeledValue(embeddedMatch[1]);
        }
      }
    }
    var text = [fileName || ''].concat((rows || []).slice(0, 20).map(function (row) { return (row || []).join(' '); })).join(' ');
    for (var i = 0; i < labels.length; i++) {
      var re = new RegExp(labels[i] + '[:：\\s]*([^\\s]+(?:\\s*[^\\s:：]+){0,8})');
      var match = text.match(re);
      if (match) return cleanLabeledValue(match[1]);
    }
    return '';
  }

  function detectPurchaseOrderSupplier(rows, fileName, map, headerIndex) {
    var topText = (rows || []).slice(0, 20).map(function (row) { return (row || []).map(cleanCell).join(' '); }).join('\n');
    var topMatch = topText.match(/供货方\s*[:：]\s*(.+?)(?:\s+地址\s*[:：]|\s+联系人\s*[:：]|\s+电话\s*[:：]|\s+邮箱\s*[:：]|\n|$)/);
    if (topMatch && cleanCell(topMatch[1])) return cleanLabeledValue(topMatch[1]);
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
    var missing = parsed.missing || [];
    var warning = missing.length
      ? '<div class="feedback-item updated">以下关键字段未识别完整：' + escapeHTML(missing.join('、')) + '。请检查表格顶部订单信息和底部合计行。</div>'
      : '';
    var summary = '<div class="feedback-item added">已识别采购单，待进入流转：' + escapeHTML(single.supplier || '未识别供应商') +
      ' · ' + escapeHTML(single.orderNo || '未识别订单编号') +
      ' · ' + escapeHTML(single.orderDate || '未识别订单日期') +
      ' · 合计数量 ' + escapeHTML(single.qty || '未识别') +
      ' · 合计总金额 ' + escapeHTML(single.totalAmount ? formatPurchaseOrderMoney(single.totalAmount) : '未识别') + '</div>' + warning;
    var headerCards = [
      { label: '订单号', field: 'orderNo', value: single.orderNo || '' },
      { label: '订单日期', field: 'orderDate', value: single.orderDate || '' },
      { label: '供货方', field: 'supplier', value: single.supplier || '' }
    ].map(function (item) {
      return '<div class="po-summary-card"><span>' + escapeHTML(item.label) + '</span>' +
        (item.field === 'orderDate'
          ? purchasePreviewDateInput('data-po-field="' + escapeHTML(item.field) + '"', item.value, item.label)
          : purchasePreviewInput('data-po-field="' + escapeHTML(item.field) + '"', item.value, item.label)) +
        '</div>';
    }).join('');
    var detailRows = (single.items || []).map(function (item, index) {
      return '<tr>' +
        '<td>' + purchasePreviewInput('data-po-detail-index="' + index + '" data-po-detail-field="gyModel"', item.gyModel || '', 'GY号') + '</td>' +
        '<td>' + escapeHTML(item.productName || '') + '</td>' +
        '<td>' + purchasePreviewInput('data-po-detail-index="' + index + '" data-po-detail-field="qty"', item.qty || '', '数量') + '</td>' +
        '<td>' + purchasePreviewInput('data-po-detail-index="' + index + '" data-po-detail-field="unitPrice"', item.unitPrice || '', '含税单价') + '</td>' +
        '<td>' + purchasePreviewInput('data-po-detail-index="' + index + '" data-po-detail-field="lineAmount"', item.lineAmount || '', '总金额') + '</td>' +
        '</tr>';
    }).join('');
    var detailTable = detailRows
      ? '<div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>GY号</th><th>品名</th><th>数量</th><th>含税单价</th><th>总金额</th></tr></thead><tbody>' + detailRows + '</tbody></table></div>'
      : '<div class="empty">未识别到产品明细行。请确认表格内包含 GY号、品名、数量、含税单价、总金额。</div>';
    var footerCards = [
      { label: '合计数量', field: 'qty', value: single.qty || '' },
      { label: '合计总金额', field: 'totalAmount', value: single.totalAmount || '' }
    ].map(function (item) {
      return '<div class="po-summary-card"><span>' + escapeHTML(item.label) + '</span>' +
        purchasePreviewInput('data-po-field="' + escapeHTML(item.field) + '"', item.value, item.label) +
        '</div>';
    }).join('');
    el.innerHTML =
      '<div class="feedback-section"><strong>采购订单识别结果：' + escapeHTML(parsed.fileName) + '</strong>' +
      '<div class="feedback-item updated">完整读取整张采购单全部产品明细，以GY号作为库存型号，底部读取合计行；核对全部信息后再确认上传。</div>' +
      summary +
      '<h4 style="margin:12px 0 8px;">订单头信息</h4>' +
      '<div class="po-summary-grid">' + headerCards + '</div>' +
      '<h4 style="margin:12px 0 8px;">全部产品明细</h4>' +
      detailTable +
      '<h4 style="margin:12px 0 8px;">底部汇总</h4>' +
      '<div class="po-summary-grid">' + footerCards + '</div>' +
      (function () {
        var factory = single.supplier || '';
        var isExempt = factory && state.antifakeExempt[factory];
        // 【增量变更】读取工厂预设防伪标扣减比例
        var factorySupplier = state.suppliers.find(function (s) { return s.name === factory; });
        var factoryRatio = factorySupplier && typeof factorySupplier.antifakeRatio === 'number' ? factorySupplier.antifakeRatio : 1;
        var isSpecial = factorySupplier && factorySupplier.isSpecialFactory;
        var ratioInput = $('antifakeUseRatio');
        var ratioStr = ratioInput ? ratioInput.value : '1:1';
        var ratio = factoryRatio;
        var ratioDisplay = ratioToDisplay(factoryRatio);
        if (!factorySupplier || typeof factorySupplier.antifakeRatio !== 'number' || factorySupplier.antifakeRatio === 1) {
          ratio = parseAntifakeRatio(ratioStr);
          ratioDisplay = ratioStr;
        }
        // 【增量变更】将初始比例存入预览状态
        previewAntifakeRatio = ratio;
        var totalQty = Number(single.qty || 0);
        var deduction = ratio && totalQty ? Math.ceil(totalQty * ratio) : 0;
        var currentStock = factory ? Number(state.antifakeStock[factory] || 0) : 0;
        var afterStock = currentStock - deduction;
        if (isExempt) {
          return '<div class="feedback-item" style="margin-top:10px;">防伪标扣减：已跳过 — 该工厂（' + escapeHTML(factory) + '）已标记无需寄标</div>';
        }
        if (!factory) {
          return '<div class="feedback-item" style="margin-top:10px;">防伪标扣减：未识别供应商，跳过自动扣减</div>';
        }
        if (!ratio) {
          return '<div class="feedback-item" style="margin-top:10px;color:var(--danger);">防伪标扣减：使用比例格式无效，请修改后再确认</div>';
        }
        var specialHint = isSpecial
          ? '<div class="feedback-item" style="margin-top:6px;color:var(--warning);">⚠ 特殊工厂规则：将跳过工厂库存入库和财务待付款，订单状态标记为无需付款，仅扣减防伪标并生成使用记录</div>'
          : '';
        // 【增量变更】构建下拉选择框选项
        var currentDisplay = ratioToDisplay(ratio);
        var allOptions = previewAntifakeRatioOptions.slice();
        if (allOptions.indexOf(currentDisplay) < 0) allOptions.push(currentDisplay);
        var ratioOptions = allOptions.map(function (opt) {
          return '<option value="' + escapeHTML(opt) + '"' + (opt === currentDisplay ? ' selected' : '') + '>' + escapeHTML(opt) + '</option>';
        }).join('');
        return '<div class="feedback-item" style="margin-top:10px;">防伪标自动扣减预览：工厂 ' + escapeHTML(factory) +
          ' · 使用比例 <strong id="antifakePreviewRatioText">' + escapeHTML(ratioDisplay) + '</strong>' +
          ' · 订单数量 ' + totalQty +
          ' · 预计扣减 ' + deduction + ' 个' +
          ' · 当前余量 ' + currentStock +
          ' · 扣减后余量 ' + Math.max(0, afterStock) +
          (afterStock < 0 ? '（余量不足！）' : '') + '</div>' +
          '<div class="po-summary-grid" style="margin-top:8px;">' +
          '<div class="po-summary-card"><span>防伪标扣减比例</span>' +
          '<div style="display:flex;gap:6px;align-items:center;margin-top:4px;">' +
          '<select id="antifakeRatioSelect" style="font-size:16px;font-weight:700;color:var(--accent);border:1px solid var(--line);border-radius:8px;padding:4px 8px;background:#fff;">' + ratioOptions + '</select>' +
          '<button class="btn" id="antifakeRatioAddBtn" type="button" style="font-size:12px;padding:4px 10px;min-height:auto;white-space:nowrap;">新增扣减比例</button>' +
          '</div></div>' +
          '<div class="po-summary-card"><span>本次防伪标扣减数量</span><strong id="antifakeDeductionDisplay" style="font-size:18px;color:var(--accent);">' + deduction + ' 个</strong></div>' +
          '<div class="po-summary-card"><span>扣减后防伪标剩余库存</span><strong id="antifakeAfterStockDisplay" style="font-size:18px;color:' + (afterStock < 0 ? 'var(--danger)' : 'var(--good)') + ';">' + Math.max(0, afterStock) + ' 个</strong></div>' +
          '</div>' + specialHint;
      })() +
      '<div class="record-actions" style="margin-top:12px;">' +
      '<button class="btn primary" id="confirmPurchaseOrderImportBtn" type="button">确认识别并进入流转</button>' +
      '<button class="btn" id="cancelPurchaseOrderImportBtn" type="button">取消</button>' +
      '</div></div>';
    el.style.display = 'block';
    $('confirmPurchaseOrderImportBtn').addEventListener('click', confirmPurchaseOrderImport);
    $('cancelPurchaseOrderImportBtn').addEventListener('click', function () {
      pendingPurchaseOrderImport = null;
      previewAntifakeRatio = null;
      el.style.display = 'none';
      el.innerHTML = '';
    });
    // 【增量变更】绑定防伪标扣减比例下拉框事件
    var ratioSelect = $('antifakeRatioSelect');
    var ratioAddBtn = $('antifakeRatioAddBtn');
    if (ratioSelect) {
      ratioSelect.addEventListener('change', function () {
        previewAntifakeRatio = parseAntifakeRatio(ratioSelect.value);
        updateAntifakePreviewCalc();
      });
    }
    if (ratioAddBtn) {
      ratioAddBtn.addEventListener('click', function () {
        var custom = window.prompt('请输入自定义扣减比例（格式如 3:1、5:1、2:1）');
        if (!custom) return;
        var parsed = parseAntifakeRatio(custom);
        if (!parsed || parsed <= 0) { toast('比例格式无效，请使用如 3:1 的格式'); return; }
        var display = ratioToDisplay(parsed);
        if (previewAntifakeRatioOptions.indexOf(display) < 0) previewAntifakeRatioOptions.push(display);
        if (ratioSelect) {
          var exists = Array.prototype.some.call(ratioSelect.options, function (opt) { return opt.value === display; });
          if (!exists) {
            var newOpt = document.createElement('option');
            newOpt.value = display;
            newOpt.textContent = display;
            ratioSelect.appendChild(newOpt);
          }
          ratioSelect.value = display;
        }
        previewAntifakeRatio = parsed;
        updateAntifakePreviewCalc();
      });
    }
  }

  function purchasePreviewInput(attrs, value, label) {
    return '<input ' + attrs + ' value="' + escapeHTML(value == null ? '' : value) + '" aria-label="' + escapeHTML(label || '') + '" ' +
      'style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;color:var(--text);background:#fff;">';
  }

  function purchasePreviewDateInput(attrs, value, label) {
    return '<input type="date" ' + attrs + ' value="' + escapeHTML(value == null ? '' : value) + '" aria-label="' + escapeHTML(label || '') + '" ' +
      'onclick="if(this.showPicker){this.showPicker();}" onfocus="if(this.showPicker){this.showPicker();}" ' +
      'style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;color:var(--text);background:#fff;">';
  }

  function applyPurchaseOrderPreviewEdits(parsed) {
    var el = $('purchaseOrderUploadPreview');
    if (!el || !parsed || !parsed.singleOrder) return;
    var group = parsed.singleOrder;
    var fieldInput = function (field) {
      var input = el.querySelector('[data-po-field="' + field + '"]');
      return input ? cleanCell(input.value) : '';
    };
    group.orderNo = fieldInput('orderNo') || group.orderNo || '';
    group.orderDate = fieldInput('orderDate') || group.orderDate || '';
    group.supplier = fieldInput('supplier') || group.supplier || '';
    group.qty = parseNumberLike(fieldInput('qty')) || 0;
    group.totalAmount = parseNumberLike(fieldInput('totalAmount')) || 0;

    (group.items || []).forEach(function (item, index) {
      var readDetail = function (field) {
        var input = el.querySelector('[data-po-detail-index="' + index + '"][data-po-detail-field="' + field + '"]');
        return input ? cleanCell(input.value) : '';
      };
      item.gyModel = cleanGyModel(readDetail('gyModel')) || readDetail('gyModel') || item.gyModel || '';
      item.qty = parseNumberLike(readDetail('qty')) || 0;
      item.unitPrice = parseNumberLike(readDetail('unitPrice')) || 0;
      item.lineAmount = parseNumberLike(readDetail('lineAmount')) || 0;
      item.supplier = group.supplier;
      item.orderNo = group.orderNo;
      item.orderDate = group.orderDate;
    });

    group.gyModels = {};
    group.productNames = {};
    group.orderNos = group.orderNo ? (function () { var o = {}; o[group.orderNo] = true; return o; })() : {};
    group.suppliers = group.supplier ? (function () { var o = {}; o[group.supplier] = true; return o; })() : {};
    (group.items || []).forEach(function (item) {
      if (item.gyModel) group.gyModels[item.gyModel] = true;
      if (item.productName) group.productNames[item.productName] = true;
    });
    parsed.items = group.items || [];
  }

  function purchaseOrderMissingFields(group) {
    var missing = [];
    if (!group.orderNo) missing.push('订单号');
    if (!group.supplier) missing.push('供货方（工厂名称）');
    if (!group.orderDate) missing.push('订单日期');
    if (!(group.items || []).length) missing.push('产品明细行');
    if (!group.qty) missing.push('合计数量');
    if (!group.totalAmount) missing.push('合计总金额');
    (group.items || []).forEach(function (item, index) {
      if (!item.gyModel) missing.push('第' + (index + 1) + '行GY号');
      if (!item.qty) missing.push('第' + (index + 1) + '行数量');
      if (!item.unitPrice) missing.push('第' + (index + 1) + '行含税单价');
      if (!item.lineAmount) missing.push('第' + (index + 1) + '行总金额');
    });
    return missing;
  }

  function renderPurchaseOrderUploadMessage(message, cls) {
    var el = $('purchaseOrderUploadPreview');
    if (!el) return;
    el.innerHTML = '<div class="feedback-item ' + (cls || 'updated') + '">' + escapeHTML(message) + '</div>';
    el.style.display = 'block';
  }

  function confirmPurchaseOrderImport() {
    var parsed = pendingPurchaseOrderImport;
    if (!parsed || !parsed.singleOrder) {
      toast('没有可确认上传的采购订单');
      return;
    }
    applyPurchaseOrderPreviewEdits(parsed);
    parsed.missing = purchaseOrderMissingFields(parsed.singleOrder);
    if (parsed.missing && parsed.missing.length) {
      toast('关键字段未识别完整：' + parsed.missing.join('、'));
      return;
    }
    var addedOrders = 0;
    var updatedPayments = 0;
    var group = parsed.singleOrder;
    if (group.supplier) ensureImportedSupplier(group.supplier);
    var product = '采购订单汇总；合计数量：' + (group.qty || 0) + '；明细行数：' + ((group.items || []).length);
    var amount = group.totalAmount ? formatPurchaseOrderMoney(group.totalAmount) : '';
    var existingOrder = findOrderByNo(group.supplier, group.orderNo);
    var record;
    if (existingOrder) {
      existingOrder.product = product || existingOrder.product;
      existingOrder.amount = amount || existingOrder.amount;
      existingOrder.dueDate = group.orderDate || existingOrder.dueDate;
      existingOrder.purchaseOrderHeader = { orderNo: group.orderNo, orderDate: group.orderDate, supplier: group.supplier };
      existingOrder.purchaseOrderItems = group.items || [];
      existingOrder.purchaseOrderSummary = { qty: group.qty || 0, totalAmount: group.totalAmount || 0, summaryLine: group.summaryLine || '' };
      existingOrder.importSourceType = 'Excel完整采购单';
      existingOrder.note = (existingOrder.note || '') + ' | Excel完整采购单识别更新：' + parsed.fileName + '；合计数量：' + group.qty + '；合计总金额：' + amount + '；明细行数：' + ((group.items || []).length);
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
        note: 'Excel完整采购单识别：' + parsed.fileName + '；合计数量：' + group.qty + '；合计总金额：' + amount + '；明细行数：' + ((group.items || []).length) + '；付款开票仅使用整单汇总字段',
        purchaseOrderHeader: { orderNo: group.orderNo, orderDate: group.orderDate, supplier: group.supplier },
        purchaseOrderItems: group.items || [],
        purchaseOrderSummary: { qty: group.qty || 0, totalAmount: group.totalAmount || 0, summaryLine: group.summaryLine || '' },
        importSourceType: 'Excel完整采购单',
        weeklyCategory: 'auto'
      }, true);
      addedOrders++;
    }
    // 【防伪标迭代新增】特殊工厂分支判断
    var importSupplier = state.suppliers.find(function (s) { return s.name === group.supplier; });
    var isSpecial = importSupplier && importSupplier.isSpecialFactory;
    var updatedInventory = 0;
    var antifakeResult = applyAntifakeOrderDeduction(group, parsed.fileName);
    if (isSpecial) {
      // 分支B：特殊工厂 — 跳过库存入库和财务待付款，订单标记无需付款
      record.status = '无需付款';
      record.nextStep = '特殊工厂采购订单，无需付款，仅扣减防伪标';
      record.note = (record.note || '') + ' | 特殊工厂规则：跳过工厂库存入库和财务待付款';
      record.updatedAt = nowISO();
    } else {
      // 分支A：普通工厂 — 执行库存入库和财务待付款
      updatedInventory = applyPurchaseOrderInventoryReceipt(group, record, parsed.fileName);
      if (upsertPurchaseOrderPayment(group, record, amount, parsed.fileName)) updatedPayments++;
    }
    syncEmailOrderFactory(group.orderNo, group.supplier);
    // 【合同迭代新增】采购订单确认后自动填充智能邮箱的订单号和供应商名称
    autoFillEmailFromOrder(group.orderNo, group.supplier);
    saveState();
    renderSelects();
    renderAll();
    pendingPurchaseOrderImport = null;
    previewAntifakeRatio = null;
    if ($('purchaseOrderUploadPreview')) $('purchaseOrderUploadPreview').style.display = 'none';
    switchSection('finance');
    var panel = $('financePaymentPanel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var toastMsg = isSpecial
      ? '已完成特殊工厂采购单识别：' + group.supplier + '（无需付款），库存无变动'
      : '已完成采购单识别并进入流转：库存入库 ' + updatedInventory + ' 行，财务待付款 ' + updatedPayments + ' 笔';
    if (antifakeResult && !antifakeResult.skipped) {
      toastMsg += '；防伪标自动扣减 ' + antifakeResult.factory + '：' + antifakeResult.deducted + ' 个（比例 ' + antifakeResult.ratio + '，剩余 ' + antifakeResult.after + '）';
    } else if (antifakeResult && antifakeResult.skipped && antifakeResult.factory) {
      toastMsg += '；防伪标扣减已跳过：' + antifakeResult.factory + '（' + antifakeResult.reason + '）';
    }
    toast(toastMsg);
  }

  function applyPurchaseOrderInventoryReceipt(group, record, fileName) {
    // Excel确认后才自动入库；PDF导入不会调用此函数。
    var factory = group.supplier || '';
    if (!factory) return 0;
    state.factoryInventory = state.factoryInventory && typeof state.factoryInventory === 'object' ? state.factoryInventory : {};
    state.factoryInventoryMovements = Array.isArray(state.factoryInventoryMovements) ? state.factoryInventoryMovements : [];
    if (!state.factoryInventory[factory]) state.factoryInventory[factory] = {};
    var count = 0;
    (group.items || []).forEach(function (item) {
      var gy = cleanGyModel(item.gyModel);
      var qty = Number(item.qty || 0);
      if (!gy || !qty) return;
      var stock = state.factoryInventory[factory][gy] || {
        factory: factory,
        gyModel: gy,
        productName: item.productName || '',
        qty: 0,
        createdAt: nowISO(),
        updatedAt: nowISO()
      };
      stock.productName = item.productName || stock.productName || '';
      stock.orderNo = group.orderNo || stock.orderNo || '';
      stock.qty = Number(stock.qty || 0) + qty;
      stock.updatedAt = nowISO();
      state.factoryInventory[factory][gy] = stock;
      state.factoryInventoryMovements.unshift({
        id: makeId(),
        type: '采购入库',
        factory: factory,
        gyModel: gy,
        productName: item.productName || '',
        qty: qty,
        unitPrice: item.unitPrice || 0,
        lineAmount: item.lineAmount || 0,
        orderNo: group.orderNo || '',
        orderDate: group.orderDate || '',
        recordId: record.id || '',
        sourceFile: fileName || '',
        sourceRow: item.sourceRow || '',
        createdAt: nowISO(),
        note: 'Excel采购单确认流转自动入库，库存型号主键为GY号。'
      });
      count++;
    });
    if (count) {
      state.operationLogs = state.operationLogs || [];
      state.operationLogs.unshift({
        time: nowISO(),
        action: 'Excel采购单自动入库',
        detail: factory + ' / 订单 ' + (group.orderNo || '') + ' / 明细 ' + count + ' 行',
        factory: factory
      });
    }
    return count;
  }

  function factoryLatestInventoryMovement(factory, gyModel) {
    return (state.factoryInventoryMovements || []).filter(function (m) {
      if (m.factory !== factory) return false;
      if (gyModel && m.gyModel !== gyModel) return false;
      return true;
    }).sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })[0] || null;
  }

  function factoryLatestPurchaseOrderNo(factory) {
    var latest = (state.factoryInventoryMovements || []).filter(function (m) {
      return m.factory === factory && m.type === '采购入库' && m.orderNo;
    }).sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })[0];
    return latest ? latest.orderNo : '';
  }

  function deductCurrentOrderInventory() {
    var factory = selectedFactory || '';
    var orderNo = factoryLatestPurchaseOrderNo(factory);
    if (!factory || !orderNo) {
      toast('当前工厂暂无可扣减的订单库存');
      return;
    }
    var byGy = {};
    (state.factoryInventoryMovements || []).forEach(function (m) {
      if (m.factory !== factory || m.orderNo !== orderNo || m.type !== '采购入库') return;
      if (!m.gyModel) return;
      if (!byGy[m.gyModel]) byGy[m.gyModel] = { qty: 0, productName: m.productName || '' };
      byGy[m.gyModel].qty += Number(m.qty || 0);
      if (m.productName) byGy[m.gyModel].productName = m.productName;
    });
    var deducted = 0;
    Object.keys(byGy).forEach(function (gy) {
      if (deductFactoryInventoryItem(factory, gy, byGy[gy].qty, '按当前订单一键扣减库存', orderNo, true)) deducted++;
    });
    if (!deducted) {
      toast('当前订单没有可扣减的库存明细');
      return;
    }
    saveState();
    renderFactoryInventoryPanel();
    toast('已按当前订单 ' + orderNo + ' 扣减库存 ' + deducted + ' 个型号');
  }

  function deductFactoryInventoryItem(factory, gyModel, qty, reason, orderNo, silent) {
    qty = Number(qty || 0);
    if (!factory || !gyModel || !qty || qty <= 0) {
      if (!silent) toast('请输入有效扣减数量');
      return false;
    }
    state.factoryInventory = state.factoryInventory && typeof state.factoryInventory === 'object' ? state.factoryInventory : {};
    state.factoryInventoryMovements = Array.isArray(state.factoryInventoryMovements) ? state.factoryInventoryMovements : [];
    if (!state.factoryInventory[factory]) state.factoryInventory[factory] = {};
    var stock = state.factoryInventory[factory][gyModel];
    if (!stock) {
      if (!silent) toast('未找到该GY号库存');
      return false;
    }
    var before = Number(stock.qty || 0);
    var actual = Math.min(before, qty);
    if (!actual) {
      if (!silent) toast('该GY号当前库存为0，无法扣减');
      return false;
    }
    stock.qty = before - actual;
    stock.updatedAt = nowISO();
    state.factoryInventory[factory][gyModel] = stock;
    state.factoryInventoryMovements.unshift({
      id: makeId(),
      type: reason || '库存扣减',
      factory: factory,
      gyModel: gyModel,
      productName: stock.productName || '',
      qty: -actual,
      unitPrice: 0,
      lineAmount: 0,
      orderNo: orderNo || stock.orderNo || '',
      orderDate: '',
      recordId: '',
      sourceFile: '',
      sourceRow: '',
      createdAt: nowISO(),
      note: (reason || '库存扣减') + '，扣减前库存：' + before + '，本次扣减：' + actual + '，扣减后库存：' + stock.qty
    });
    // 【库存汇总迭代新增】库存扣减操作日志留存
    state.operationLogs = state.operationLogs || [];
    state.operationLogs.unshift({
      time: nowISO(),
      action: '工厂库存手动扣减',
      detail: factory + ' / GY号 ' + gyModel + ' / 扣减前 ' + before + ' / 本次扣减 ' + actual + ' / 扣减后 ' + stock.qty + (orderNo ? ' / 订单 ' + orderNo : ''),
      factory: factory
    });
    state.operationLogs = state.operationLogs.slice(0, 300);
    if (!silent) {
      saveState();
      renderFactoryInventoryPanel();
      toast('已扣减 ' + gyModel + ' 库存 ' + actual);
    }
    return true;
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
        note: 'Excel完整采购单汇总字段流转；来源文件：' + fileName + '；合计数量：' + (group.qty || 0) + '；付款开票只使用整单汇总，产品明细不参与付款金额计算',
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
    payment.note = 'Excel完整采购单汇总字段更新；来源文件：' + fileName + '；合计数量：' + (group.qty || 0) + '；付款开票只使用整单汇总，产品明细不参与付款金额计算';
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

  function openRenameSupplierModal(oldName) {
    if (!oldName) return;
    var modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.id = 'renameSupplierModal';
    modal.innerHTML =
      '<div class="modal" style="max-width:440px;">' +
      '<div class="modal-header"><h3>修改供应商名称</h3><button class="icon-btn" id="closeRenameSupplierModalBtn" type="button">×</button></div>' +
      '<form id="renameSupplierForm" class="modal-body">' +
      '<div class="quick-feedback" style="display:block;margin-bottom:12px;">' +
      '<div class="feedback-item updated">当前名称：<strong>' + escapeHTML(oldName) + '</strong></div></div>' +
      '<div class="form-grid"><div class="field wide">' +
      '<label for="renameSupplierInput">新供应商名称</label>' +
      '<input id="renameSupplierInput" placeholder="请输入新的供应商名称" required>' +
      '</div></div>' +
      '<div class="record-actions" style="justify-content:flex-end;margin-top:14px;">' +
      '<button class="btn" id="cancelRenameSupplierBtn" type="button">取消</button>' +
      '<button class="btn primary" type="submit">确认修改</button>' +
      '</div></form></div>';
    document.body.appendChild(modal);
    var input = $('renameSupplierInput');
    if (input) { input.focus(); input.value = oldName; input.select(); }
    var close = function () { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); };
    $('closeRenameSupplierModalBtn').addEventListener('click', close);
    $('cancelRenameSupplierBtn').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    $('renameSupplierForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var newName = input.value.trim();
      if (!newName) { toast('供应商名称不能为空'); return; }
      if (newName === oldName) { toast('名称未变更'); close(); return; }
      if (factories.indexOf(newName) >= 0) { toast('已存在同名供应商，请使用其他名称'); return; }
      confirmRenameSupplier(oldName, newName);
      close();
    });
  }

  function confirmRenameSupplier(oldName, newName) {
    try {
      var supplier = state.suppliers.find(function (s) { return s.name === oldName; });
      if (supplier) supplier.name = newName;
      state.records.forEach(function (r) { if (r.factory === oldName) r.factory = newName; });
      if (state.factoryInventory && state.factoryInventory[oldName]) {
        state.factoryInventory[newName] = state.factoryInventory[oldName];
        delete state.factoryInventory[oldName];
      }
      if (state.factoryInventoryMovements) {
        state.factoryInventoryMovements.forEach(function (m) { if (m.factory === oldName) m.factory = newName; });
      }
      if (state.antifakeStock && typeof state.antifakeStock[oldName] !== 'undefined') {
        state.antifakeStock[newName] = state.antifakeStock[oldName];
        delete state.antifakeStock[oldName];
      }
      if (state.antifakeThresholds && typeof state.antifakeThresholds[oldName] !== 'undefined') {
        state.antifakeThresholds[newName] = state.antifakeThresholds[oldName];
        delete state.antifakeThresholds[oldName];
      }
      if (state.antifakeExempt && typeof state.antifakeExempt[oldName] !== 'undefined') {
        state.antifakeExempt[newName] = state.antifakeExempt[oldName];
        delete state.antifakeExempt[oldName];
      }
      if (state.antifakeExemptNote && typeof state.antifakeExemptNote[oldName] !== 'undefined') {
        state.antifakeExemptNote[newName] = state.antifakeExemptNote[oldName];
        delete state.antifakeExemptNote[oldName];
      }
      if (state.antifakeMovements) {
        state.antifakeMovements.forEach(function (m) { if (m.factory === oldName) m.factory = newName; });
      }
      if (state.settlementFlows) {
        state.settlementFlows.forEach(function (f) { if (f.factory === oldName) f.factory = newName; });
      }
      if (state.financePayments) {
        state.financePayments.forEach(function (p) { if (p.factory === oldName) p.factory = newName; });
      }
      if (state.settlementBills) {
        state.settlementBills.forEach(function (b) { if (b.factory === oldName) b.factory = newName; });
      }
      if (selectedFactory === oldName) selectedFactory = newName;
      syncFactories();
      saveState();
      renderSelects();
      renderAll();
      toast('已将供应商「' + oldName + '」重命名为「' + newName + '」，全部关联数据已同步更新');
    } catch (err) {
      console.error('修改供应商名称失败', err);
      toast('修改供应商名称失败：' + (err.message || '未知错误'));
    }
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

  // 【增量变更】将比例数值转为展示格式（1→"1:1"，0.25→"4:1"）
  function ratioToDisplay(ratio) {
    if (ratio === 1) return '1:1';
    var inverse = 1 / ratio;
    if (Math.abs(inverse - Math.round(inverse)) < 0.001) return Math.round(inverse) + ':1';
    return '1:' + ratio;
  }

  // 【增量变更】实时重算防伪标预览扣减数量和剩余库存
  function updateAntifakePreviewCalc() {
    var parsed = pendingPurchaseOrderImport;
    if (!parsed || !parsed.singleOrder) return;
    var single = parsed.singleOrder;
    var factory = single.supplier || '';
    var ratio = previewAntifakeRatio;
    var totalQty = Number(single.qty || 0);
    var deduction = ratio && totalQty ? Math.ceil(totalQty * ratio) : 0;
    var currentStock = factory ? Number(state.antifakeStock[factory] || 0) : 0;
    var afterStock = currentStock - deduction;
    var ratioTextEl = $('antifakePreviewRatioText');
    if (ratioTextEl) ratioTextEl.textContent = ratio ? ratioToDisplay(ratio) : '—';
    var deductionEl = $('antifakeDeductionDisplay');
    if (deductionEl) deductionEl.textContent = deduction + ' 个';
    var afterStockEl = $('antifakeAfterStockDisplay');
    if (afterStockEl) {
      afterStockEl.textContent = Math.max(0, afterStock) + ' 个';
      afterStockEl.style.color = afterStock < 0 ? 'var(--danger)' : 'var(--good)';
    }
  }

  function parseAntifakeRatio(str) {
    if (!str) return null;
    var text = String(str).trim();
    var m = text.match(/^(\d+(?:\.\d+)?)\s*[:：]\s*(\d+(?:\.\d+)?)$/);
    var products, labels;
    if (m) {
      products = parseFloat(m[1]);
      labels = parseFloat(m[2]);
    } else {
      var n = parseFloat(text);
      if (isNaN(n) || n <= 0) return null;
      products = n;
      labels = 1;
    }
    if (products <= 0) return null;
    return labels / products;
  }

  function applyAntifakeOrderDeduction(group, fileName) {
    var factory = group.supplier || '';
    if (!factory) return { factory: '', deducted: 0, skipped: true, reason: '未识别供应商' };
    if (state.antifakeExempt[factory]) {
      return { factory: factory, deducted: 0, skipped: true, reason: '该工厂已标记无需寄标' };
    }
    // 【增量变更】优先使用预览页下拉选择的扣减比例，其次工厂配置，最后全局输入框
    var supplier = state.suppliers.find(function (s) { return s.name === factory; });
    var factoryRatio = supplier && typeof supplier.antifakeRatio === 'number' ? supplier.antifakeRatio : 1;
    var ratioInput = $('antifakeUseRatio');
    var ratioStr = ratioInput ? ratioInput.value : '1:1';
    var ratio = factoryRatio;
    var ratioDisplay = ratioToDisplay(factoryRatio);
    // 若工厂未配置专属比例（默认1），则回退到全局输入框
    if (!supplier || typeof supplier.antifakeRatio !== 'number' || supplier.antifakeRatio === 1) {
      ratio = parseAntifakeRatio(ratioStr);
      ratioDisplay = ratioStr;
    }
    // 【增量变更】若预览页下拉选择了比例，优先使用
    if (previewAntifakeRatio && previewAntifakeRatio > 0) {
      ratio = previewAntifakeRatio;
      ratioDisplay = ratioToDisplay(ratio);
    }
    if (!ratio || ratio <= 0) {
      return { factory: factory, deducted: 0, skipped: true, reason: '防伪标使用比例格式无效' };
    }
    var totalQty = Number(group.qty || 0);
    if (!totalQty) {
      (group.items || []).forEach(function (item) { totalQty += Number(item.qty || 0); });
    }
    if (!totalQty) {
      return { factory: factory, deducted: 0, skipped: true, reason: '订单合计数量为0' };
    }
    var deduction = Math.ceil(totalQty * ratio);
    if (deduction <= 0) {
      return { factory: factory, deducted: 0, skipped: true, reason: '计算扣减数量为0' };
    }
    if (typeof state.antifakeStock[factory] !== 'number') state.antifakeStock[factory] = 0;
    var before = state.antifakeStock[factory];
    state.antifakeStock[factory] = Math.max(0, before - deduction);
    var actualDeducted = before - state.antifakeStock[factory];
    var record = {
      id: makeId(),
      type: 'use',
      factory: factory,
      qty: actualDeducted,
      date: toYMD(today()),
      note: '采购订单自动扣减 · 使用比例 ' + ratioDisplay + ' · 订单数量 ' + totalQty + ' · 来源文件 ' + (fileName || ''),
      orderNo: group.orderNo || '',
      orderQty: totalQty,
      category: '',
      labelSize: '',
      source: 'auto_order',
      createdAt: nowISO()
    };
    state.antifakeMovements.unshift(record);
    // 【防伪标迭代新增】同步写入防伪标使用记录
    state.antifakeUsageRecords.unshift({
      id: makeId(),
      orderNo: group.orderNo || '',
      factory: factory,
      ratio: ratioDisplay,
      ratioValue: ratio,
      deductionQty: actualDeducted,
      orderQty: totalQty,
      fileName: fileName || '',
      createdAt: nowISO()
    });
    state.operationLogs = state.operationLogs || [];
    state.operationLogs.unshift({
      time: nowISO(),
      action: '采购订单防伪标自动扣减',
      detail: factory + ' / 订单 ' + (group.orderNo || '') + ' / 订单数量 ' + totalQty + ' / 比例 ' + ratioDisplay + ' / 扣减 ' + actualDeducted + ' / 扣减前 ' + before + ' / 扣减后 ' + state.antifakeStock[factory],
      factory: factory
    });
    return { factory: factory, deducted: actualDeducted, skipped: false, before: before, after: state.antifakeStock[factory], ratio: ratioDisplay, orderQty: totalQty };
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

  function exportAllPurchaseOrdersExcel() {
    var orders = filterByModule('orders');
    if (!orders.length) {
      toast('暂无采购订单可导出');
      return;
    }
    var headerRows = orders.map(function (r) {
      var summary = r.purchaseOrderSummary || {};
      var header = r.purchaseOrderHeader || {};
      return {
        状态: getDisplayStatus(r),
        工作内容: r.content || '',
        下一步: r.nextStep || '',
        供货方: header.supplier || r.factory || '',
        订单号: header.orderNo || r.orderNo || '',
        订单日期: header.orderDate || formatDate(r.dueDate) || '',
        产品或事项: r.product || '',
        时间节点: formatDate(r.dueDate) || '',
        物流单号: r.logisticsNo || '',
        合计数量: summary.qty || '',
        合计总金额: summary.totalAmount ? formatPurchaseOrderMoney(summary.totalAmount) : (displayAmount(r) || ''),
        明细行数: Array.isArray(r.purchaseOrderItems) ? r.purchaseOrderItems.length : 0,
        导入类型: r.importSourceType || '',
        备注: r.note || '',
        创建时间: shortTime(r.createdAt),
        更新时间: shortTime(r.updatedAt)
      };
    });
    var detailRows = [];
    var summaryRows = [];
    orders.forEach(function (r) {
      var header = r.purchaseOrderHeader || {};
      var summary = r.purchaseOrderSummary || {};
      summaryRows.push({
        供货方: header.supplier || r.factory || '',
        订单号: header.orderNo || r.orderNo || '',
        订单日期: header.orderDate || formatDate(r.dueDate) || '',
        合计数量: summary.qty || '',
        合计总金额: summary.totalAmount ? formatPurchaseOrderMoney(summary.totalAmount) : (displayAmount(r) || ''),
        底部合计原文: summary.summaryLine || ''
      });
      (r.purchaseOrderItems || []).forEach(function (item, index) {
        detailRows.push({
          供货方: header.supplier || r.factory || '',
          订单号: header.orderNo || r.orderNo || '',
          订单日期: header.orderDate || formatDate(r.dueDate) || '',
          序号: index + 1,
          GY号: item.gyModel || '',
          品名: item.productName || '',
          数量: item.qty || '',
          单价: item.unitPrice ? formatPurchaseOrderMoney(item.unitPrice) : '',
          单行总金额: item.lineAmount ? formatPurchaseOrderMoney(item.lineAmount) : '',
          来源行号: item.sourceRow || ''
        });
      });
    });
    var fileName = '采购订单全套备份-' + toYMD(today()) + '.xlsx';
    if (window.XLSX) {
      var book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(headerRows), '订单头');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(detailRows.length ? detailRows : [{ 提示: '暂无Excel采购单产品明细' }]), '产品明细');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(summaryRows), '底部汇总');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(factoryInventoryMovementRows()), '库存入库流水');
      XLSX.writeFile(book, fileName);
      toast('已导出采购订单全套 Excel 备份');
      return;
    }
    var csvRows = detailRows.length ? detailRows : headerRows;
    var csv = '\ufeff' + objectRowsToCsv(csvRows);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.xlsx$/, '.csv');
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Excel 库未加载，已导出 CSV 备份');
  }

  function factoryInventoryMovementRows(factory) {
    return (state.factoryInventoryMovements || [])
      .filter(function (m) { return !factory || m.factory === factory; })
      .map(function (m) {
        return {
          时间: shortTime(m.createdAt),
          类型: m.type || '采购入库',
          工厂: m.factory || '',
          来源订单号: m.orderNo || '',
          订单日期: m.orderDate || '',
          GY号: m.gyModel || '',
          品名: m.productName || '',
          入库数量: m.qty || '',
          单价: m.unitPrice ? formatPurchaseOrderMoney(m.unitPrice) : '',
          单行总金额: m.lineAmount ? formatPurchaseOrderMoney(m.lineAmount) : '',
          来源文件: m.sourceFile || '',
          来源行号: m.sourceRow || ''
        };
      });
  }

  function factoryInventoryStockRows(factory) {
    var rows = [];
    var inventory = state.factoryInventory || {};
    Object.keys(inventory).forEach(function (factoryName) {
      if (factory && factoryName !== factory) return;
      Object.keys(inventory[factoryName] || {}).forEach(function (gy) {
        var item = inventory[factoryName][gy] || {};
        rows.push({
          工厂: factoryName,
          GY号: item.gyModel || gy,
          品名: item.productName || '',
          库存数量: item.qty || 0,
          创建时间: shortTime(item.createdAt),
          最后更新: shortTime(item.updatedAt)
        });
      });
    });
    return rows;
  }

  function exportFactoryInventoryBackup() {
    var factory = selectedFactory || '';
    var stocks = factoryInventoryStockRows(factory);
    var movements = factoryInventoryMovementRows(factory);
    if (!stocks.length && !movements.length) {
      toast('当前工厂暂无库存可导出');
      return;
    }
    var fileName = (factory || '全部工厂') + '-代管库存备份-' + toYMD(today()) + '.xlsx';
    if (window.XLSX) {
      var book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(stocks.length ? stocks : [{ 提示: '暂无库存总账' }]), '库存总账');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(movements.length ? movements : [{ 提示: '暂无入库流水' }]), '入库流水');
      XLSX.writeFile(book, fileName);
      toast('已导出库存 Excel 备份');
      return;
    }
    var blob = new Blob(['\ufeff' + objectRowsToCsv(stocks.length ? stocks : movements)], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.xlsx$/, '.csv');
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Excel 库未加载，已导出库存 CSV 备份');
  }

  function objectRowsToCsv(rows) {
    if (!rows.length) return '';
    var headers = Object.keys(rows[0]);
    var escapeCsv = function (value) {
      return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
    };
    return [headers.map(escapeCsv).join(',')].concat(rows.map(function (row) {
      return headers.map(function (h) { return escapeCsv(row[h]); }).join(',');
    })).join('\n');
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

  /* ========== 【合同迭代新增】合同时效管理 ========== */

  function renderContractExpiry() {
    var contracts = state.contracts || [];
    var statsEl = $('contractExpiryStats');
    var tableEl = $('contractExpiryTable');
    if (!statsEl || !tableEl) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var WARNING_DAYS = 60;
    var valid = 0, warning = 0, expired = 0;

    contracts.forEach(function (c) {
      var expiry = new Date(c.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      var diffDays = Math.floor((expiry - today) / 86400000);
      if (diffDays < 0) expired++;
      else if (diffDays <= WARNING_DAYS) warning++;
      else valid++;
    });

    statsEl.innerHTML =
      '<div class="pill-row">' +
        '<span class="pill">合同总数：' + contracts.length + ' 份</span>' +
        '<span class="pill" style="background:#e8f5e9;color:#2e7d32;">有效：' + valid + ' 份</span>' +
        '<span class="pill" style="background:#fff3e0;color:#e65100;">即将到期（2个月内）：' + warning + ' 份</span>' +
        '<span class="pill" style="background:#ffebee;color:#c62828;">已过期：' + expired + ' 份</span>' +
      '</div>';

    if (!contracts.length) {
      tableEl.innerHTML = '<div class="empty">暂无合同数据，请点击「上传合同 Excel」导入合同汇总表。</div>';
      return;
    }

    var sorted = contracts.slice().sort(function (a, b) {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    var rows = sorted.map(function (c, idx) {
      var expiry = new Date(c.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      var diffDays = Math.floor((expiry - today) / 86400000);
      var statusHTML, rowClass;
      if (diffDays < 0) {
        statusHTML = '<span class="status" style="background:#c62828;color:#fff;">已过期 ' + Math.abs(diffDays) + ' 天</span>';
        rowClass = ' style="background:#ffebee;"';
      } else if (diffDays <= WARNING_DAYS) {
        statusHTML = '<span class="status" style="background:#e65100;color:#fff;">即将到期 · 剩余 ' + diffDays + ' 天</span>';
        rowClass = ' style="background:#fff3e0;"';
      } else {
        statusHTML = '<span class="status" style="background:#2e7d32;color:#fff;">有效 · 剩余 ' + diffDays + ' 天</span>';
        rowClass = '';
      }
      return '<tr' + rowClass + '>' +
        '<td>' + escapeHTML(c.contractType || '') + '</td>' +
        '<td><strong>' + escapeHTML(c.factory || '') + '</strong></td>' +
        '<td>' + escapeHTML(c.category || '') + '</td>' +
        '<td class="mono">' + escapeHTML(c.startDate || '') + '</td>' +
        '<td class="mono">' + escapeHTML(c.expiryDate || '') + '</td>' +
        '<td>' + statusHTML + '</td>' +
        '<td><button class="btn danger" style="font-size:12px;padding:4px 10px;min-height:auto;" onclick="window.__deleteContract(' + idx + ')">删除</button></td>' +
      '</tr>';
    }).join('');

    tableEl.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
        '<th>合同类型</th><th>工厂名称</th><th>品类</th><th>合同开始日</th><th>合同到期日</th><th>状态 / 预警</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  window.__deleteContract = function (sortedIdx) {
    var contracts = state.contracts || [];
    var sorted = contracts.slice().sort(function (a, b) {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    var target = sorted[sortedIdx];
    if (!target) return;
    var realIdx = contracts.findIndex(function (c) {
      return c.factory === target.factory && c.expiryDate === target.expiryDate && c.contractType === target.contractType;
    });
    if (realIdx < 0) return;
    contracts.splice(realIdx, 1);
    saveState();
    renderContractExpiry();
    toast('已删除该合同记录');
  };

  function setupContractUpload() {
    var btn = $('contractUploadBtn');
    var input = $('contractFileInput');
    if (!btn || !input) return;
    btn.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      parseContractExcel(file);
      input.value = '';
    });
    /* 【合同迭代新增】确认上传按钮 — 用户核对预览数据后才正式入库 */
    var confirmBtn = $('contractConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!pendingContracts || !pendingContracts.length) { toast('没有待确认的合同数据'); return; }
        var addedSuppliers = [];
        pendingContracts.forEach(function (contract) {
          if (ensureContractSupplier(contract.factory)) addedSuppliers.push(contract.factory);
        });
        state.contracts = pendingContracts;
        saveState();
        renderContractExpiry();
        renderFactoryCards();
        renderFactoryInventoryPanel();
        renderSelects();
        var msg = '已导入 ' + pendingContracts.length + ' 份合同记录';
        if (addedSuppliers.length) {
          msg += '；自动新增供应商 ' + addedSuppliers.length + ' 家：' + addedSuppliers.join('、');
        }
        toast(msg);
        pendingContracts = null;
        var previewArea = $('contractPreviewArea');
        if (previewArea) previewArea.style.display = 'none';
      });
    }
    /* 【合同迭代新增】取消按钮 — 丢弃预览数据 */
    var cancelBtn = $('contractCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        pendingContracts = null;
        var previewArea = $('contractPreviewArea');
        if (previewArea) previewArea.style.display = 'none';
        toast('已取消上传');
      });
    }
  }

  /* 【合同迭代新增】待确认的合同数据暂存 */
  var pendingContracts = null;

  function parseContractExcel(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array', cellDates: true });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        /* 使用 header:1 获取数组格式，便于按列位置精确读取 D列和F列 */
        var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (!rows.length) { toast('Excel 中未读取到数据'); return; }

        var headers = rows[0].map(function (h) { return String(h).trim(); });

        function findColIdx(keys) {
          for (var i = 0; i < headers.length; i++) {
            if (keys.indexOf(headers[i]) >= 0) return i;
          }
          return -1;
        }

        var idxType = findColIdx(['合同类型', '合同 类型']);
        var idxFactory = findColIdx(['工厂名称', '工厂 名称', '供应商']);
        var idxCategory = findColIdx(['品类', '产品类别', '品名']);

        /* 【合同迭代新增】合同开始日参考D列(index 3)，合同到期日参考F列(index 5) */
        var idxStart = 3;   /* D列 */
        var idxExpiry = 5;  /* F列 */
        /* 若表头能匹配到日期列名，优先使用表头位置 */
        var hIdxStart = findColIdx(['合同开始日', '开始日期', '合同开始日期']);
        var hIdxExpiry = findColIdx(['合同到期日', '到期日期', '合同到期日期', '结束日期']);
        if (hIdxStart >= 0) idxStart = hIdxStart;
        if (hIdxExpiry >= 0) idxExpiry = hIdxExpiry;

        function formatDate(val) {
          if (!val || val === '') return '';
          if (val instanceof Date) {
            var y = val.getFullYear();
            var m = String(val.getMonth() + 1).padStart(2, '0');
            var d = String(val.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + d;
          }
          var s = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
          if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(s)) {
            var parts = s.split(/[\/\s]/);
            return parts[0] + '-' + String(parts[1]).padStart(2, '0') + '-' + String(parts[2]).padStart(2, '0');
          }
          /* 【合同迭代新增】处理 Excel 日期序列号（如 46112 → 2026-03-01） */
          if (/^\d+\.?\d*$/.test(s)) {
            var serial = parseFloat(s);
            if (serial > 30000 && serial < 70000) {
              var epoch = new Date(1899, 11, 30);
              var dt = new Date(epoch.getTime() + Math.round(serial) * 86400000);
              var y2 = dt.getFullYear();
              var m2 = String(dt.getMonth() + 1).padStart(2, '0');
              var d2 = String(dt.getDate()).padStart(2, '0');
              return y2 + '-' + m2 + '-' + d2;
            }
          }
          var d3 = new Date(s);
          if (!isNaN(d3)) return d3.toISOString().slice(0, 10);
          return s;
        }

        function getCell(row, idx) {
          if (idx < 0 || idx >= row.length) return '';
          var v = row[idx];
          return v === undefined || v === null ? '' : v;
        }

        var newContracts = [];
        for (var r = 1; r < rows.length; r++) {
          var row = rows[r];
          /* 跳过全空行 */
          var hasData = false;
          for (var c = 0; c < row.length; c++) { if (row[c] !== '') { hasData = true; break; } }
          if (!hasData) continue;
          var factory = String(getCell(row, idxFactory >= 0 ? idxFactory : 1)).trim();
          if (!factory) continue;
          var contract = {
            contractType: String(getCell(row, idxType >= 0 ? idxType : 0)).trim(),
            factory: factory,
            category: String(getCell(row, idxCategory >= 0 ? idxCategory : 2)).trim(),
            startDate: formatDate(getCell(row, idxStart)),
            expiryDate: formatDate(getCell(row, idxExpiry))
          };
          newContracts.push(contract);
        }

        if (!newContracts.length) { toast('未识别到有效的合同数据'); return; }

        /* 【合同迭代新增】显示预览，等待用户确认后才入库 */
        pendingContracts = newContracts;
        showContractPreview(newContracts);
      } catch (err) {
        toast('解析 Excel 失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* 【合同迭代新增】合同智能识别预览渲染 */
  function showContractPreview(contracts) {
    var area = $('contractPreviewArea');
    var tableEl = $('contractPreviewTable');
    if (!area || !tableEl) return;

    var rowsHtml = contracts.map(function (c, i) {
      return '<tr>' +
        '<td style="text-align:center;">' + (i + 1) + '</td>' +
        '<td>' + escapeHTML(c.contractType) + '</td>' +
        '<td>' + escapeHTML(c.factory) + '</td>' +
        '<td>' + escapeHTML(c.category) + '</td>' +
        '<td><strong>' + escapeHTML(c.startDate) + '</strong></td>' +
        '<td><strong>' + escapeHTML(c.expiryDate) + '</strong></td>' +
      '</tr>';
    }).join('');

    tableEl.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>#</th><th>合同类型</th><th>工厂名称</th><th>品类</th><th>合同开始日（D列）</th><th>合同到期日（F列）</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
      '<p style="margin:8px 0 0;font-size:13px;color:var(--muted);">共识别 ' + contracts.length + ' 条记录，请核对无误后点击「确认上传」</p>';

    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    toast('已识别 ' + contracts.length + ' 条合同，请确认后上传');
  }

  function ensureContractSupplier(name) {
    if (!name) return false;
    if (state.suppliers.some(function (s) { return s.name === name; })) return false;
    state.suppliers.push({
      name: name,
      contact: '',
      products: '',
      settle: '',
      note: '由合同管理自动补入。',
      createdAt: nowISO()
    });
    state.antifakeStock[name] = 0;
    state.antifakeThresholds[name] = 50;
    state.antifakeExempt[name] = false;
    state.antifakeExemptNote[name] = '';
    state.deletedSuppliers = (state.deletedSuppliers || []).filter(function (n) { return n !== name; });
    syncFactories();
    return true;
  }

  function setupContractAddSupplierBtn() {
    var btn = $('contractAddSupplierBtn');
    if (!btn) return;
    btn.addEventListener('click', function () { openSupplierModal(); });
  }

  /* ========== 【合同迭代新增】采购订单确认后自动填充智能邮箱 ========== */
  function autoFillEmailFromOrder(orderNo, supplier) {
    var orderInput = $('emailOrderNo');
    var factoryInput = $('emailFactory');
    var matchEl = $('emailFactoryMatch');
    if (!orderInput || !factoryInput) return;
    orderInput.value = orderNo || '';
    factoryInput.value = supplier || '';
    if (matchEl && orderNo && supplier) {
      matchEl.innerHTML = '已自动填充：<strong>' + escapeHTML(supplier) + '</strong> · 订单号 <span class="mono">' + escapeHTML(orderNo) + '</span>';
    }
    syncEmailFactoryByOrder();
    renderSmartEmail();
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
