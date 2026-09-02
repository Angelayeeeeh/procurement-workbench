(function() {
  var STORAGE_KEY = 'laike_inventory_dashboard_saved_data_v1';
  function nowText() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }
  function loadSavedData() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      var parsed = JSON.parse(saved);
      if (!parsed || !parsed.rows || !parsed.summary) return false;
      window.LAIKE_DASHBOARD_DATA = parsed;
      return true;
    } catch (err) {
      console.warn('读取本地保存库存失败', err);
      return false;
    }
  }
  function saveCurrentData(syncCloud) {
    try {
      var data = window.LAIKE_DASHBOARD_DATA;
      if (!data || !data.rows) return false;
      if (!data.meta) data.meta = {};
      data.meta.savedAt = nowText();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (syncCloud !== false && window.LAIKE_CLOUD && window.LAIKE_CLOUD.saveData) {
        window.LAIKE_CLOUD.saveData(data);
      }
      return true;
    } catch (err) {
      console.warn('保存本地库存失败', err);
      return false;
    }
  }
  function clearSavedData() {
    localStorage.removeItem(STORAGE_KEY);
  }
  loadSavedData();
  window.LAIKE_STORAGE = { save: saveCurrentData, clear: clearSavedData, load: loadSavedData };

  var searchInput = document.getElementById('searchInput');
  var statusFilter = document.getElementById('statusFilter');
  var categoryFilter = document.getElementById('categoryFilter');
  var tableCount = document.getElementById('tableCount');
  var detailHeaderRow = document.getElementById('detailHeaderRow');
  var headerFilters = {};
  var detailColumns = [
    { key: '品类', label: '品类', filter: true },
    { key: '工厂', label: '工厂', filter: true },
    { key: '订单号', label: '订单号', filter: true },
    { key: 'SKU编码', label: 'SKU编码', filter: true },
    { key: '产品名称', label: '产品名称', filter: true },
    { key: '客户', label: '客户', filter: true },
    { key: '工厂总订单', label: '工厂总订单', filter: false },
    { key: '已发货数量', label: '已发货数量', filter: false },
    { key: '工厂剩余数量', label: '工厂剩余数量', filter: false },
    { key: '发货进度', label: '发货进度', filter: false },
    { key: '状态', label: '状态', filter: true },
    { key: '出货次数', label: '出货次数', filter: false },
    { key: '最晚发货', label: '最晚发货', filter: true },
    { key: '出货去向', label: '出货去向', filter: true }
  ];

  function num(v) { return Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
  function pct(v) { return Math.round(Math.max(0, Math.min(v || 0, 1)) * 100); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function pill(s) {
    var cls = s === '全部发完' ? 'ok' : s === '超发异常' ? 'bad' : s === '部分发货' ? 'warn' : 'idle';
    return '<span class="pill ' + cls + '">' + esc(s) + '</span>';
  }
  function textMatch(row, q) {
    if (!q) return true;
    return [row.品类, row.工厂, row.订单号, row.SKU编码, row.产品名称, row.客户, row.出货去向].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function getField(row, key) {
    if (key === '发货进度') return getProgressInfo(row).text;
    return row[key] == null ? '' : row[key];
  }
  function getProgressInfo(row) {
    var total = Number(row.工厂总订单 || 0);
    var shipped = Number(row.已发货数量 || 0);
    var raw = total > 0 ? shipped / total * 100 : 0;
    var width = Math.max(0, Math.min(raw, 100));
    var text = Math.round(raw) + '%';
    var cls = raw > 100 ? 'over' : raw >= 100 ? 'done' : '';
    return { raw: raw, width: width, text: text, cls: cls };
  }

  function renderMeta() {
    var data = window.LAIKE_DASHBOARD_DATA;
    document.getElementById('sourceOrder').textContent = data.meta.orderSource;
    document.getElementById('sourceShip').textContent = data.meta.shipSource;
    document.getElementById('matchRule').textContent = data.meta.matchRule;
    document.getElementById('rawRows').textContent = '订单原始行：' + data.meta.orderRows + '；出货原始行：' + data.meta.shipRows + '；生成时间：' + data.meta.generatedAt + (data.meta.savedAt ? '；本地保存：' + data.meta.savedAt : '');
  }

  function renderStats() {
    var data = window.LAIKE_DASHBOARD_DATA;
    document.getElementById('statOrderLines').textContent = num(data.summary.订单SKU行);
    document.getElementById('statOrdered').textContent = num(data.summary.工厂总订单);
    document.getElementById('statShipped').textContent = num(data.summary.已发货数量);
    document.getElementById('statRemaining').textContent = num(data.summary.工厂剩余数量);
    document.getElementById('unmatchedCount').textContent = num(data.summary.未匹配出货行数 || (data.unmatched ? data.unmatched.length : 0));
  }

  function renderCategoryFilter() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var current = categoryFilter.value;
    var opts = '<option value="全部">全部品类</option>';
    data.categorySummary.forEach(function(c) {
      opts += '<option value="' + esc(c.品类) + '">' + esc(c.品类) + '</option>';
    });
    categoryFilter.innerHTML = opts;
    categoryFilter.value = current || '全部';
  }

  function renderCategoryCards() {
    var data = window.LAIKE_DASHBOARD_DATA;
    document.getElementById('categoryCards').innerHTML = data.categorySummary.map(function(c) {
      return '<article class="card category-card">' +
        '<div class="name">' + esc(c.品类) + '</div>' +
        '<p>SKU数：' + num(c.SKU数) + '；订单SKU行：' + num(c.订单SKU行) + '</p>' +
        '<div class="mini-metrics">' +
        '<div><strong>' + num(c.工厂总订单) + '</strong><span>工厂总订单</span></div>' +
        '<div><strong>' + num(c.已发货数量) + '</strong><span>已发货数量</span></div>' +
        '<div><strong>' + num(c.工厂剩余数量) + '</strong><span>工厂剩余数量</span></div>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  function renderFocusSkuBoard() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var board = document.getElementById('focusSkuBoard');
    if (!board) return;
    var focusCats = data.categorySummary.map(function(c) { return c.品类; });
    board.innerHTML = focusCats.map(function(cat) {
      var rows = data.skuSummary.filter(function(r) { return r.品类 === cat; });
      if (!rows.length) {
        return '<article class="card focus-category"><h3>' + esc(cat) + '<span>暂无 SKU</span></h3><p>当前数据里没有该品类。</p></article>';
      }
      var totalOrder = rows.reduce(function(s, r) { return s + Number(r.工厂总订单 || 0); }, 0);
      var totalShip = rows.reduce(function(s, r) { return s + Number(r.已发货数量 || 0); }, 0);
      var totalRemain = rows.reduce(function(s, r) { return s + Number(r.工厂剩余数量 || 0); }, 0);
      var cards = rows.map(function(r) {
        var info = getProgressInfo({ 工厂总订单: r.工厂总订单, 已发货数量: r.已发货数量 });
        var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
        return '<div class="sku-mini-card">' +
          '<div class="sku-mini-title"><strong>' + esc(r.SKU编码) + '</strong><span>' + esc(r.产品名称) + '</span></div>' +
          '<div class="sku-mini-metrics">' +
          '<div><strong>' + num(r.工厂总订单) + '</strong><span>工厂总订单</span></div>' +
          '<div><strong>' + num(r.已发货数量) + '</strong><span>已发货数量</span></div>' +
          '<div><strong class="' + remainCls.trim() + '">' + num(r.工厂剩余数量) + '</strong><span>工厂剩余数量</span></div>' +
          '</div>' +
          '<span class="progress-cell"><span class="progress"><span class="bar ' + info.cls + '" style="width:' + info.width + '%"></span></span><span class="progress-text">' + info.text + '</span></span>' +
          '</div>';
      }).join('');
      return '<article class="card focus-category">' +
        '<h3>' + esc(cat) + '<span>' + rows.length + ' 个 SKU</span></h3>' +
        '<div class="mini-metrics">' +
        '<div><strong>' + num(totalOrder) + '</strong><span>品类总订单</span></div>' +
        '<div><strong>' + num(totalShip) + '</strong><span>品类已发货</span></div>' +
        '<div><strong>' + num(totalRemain) + '</strong><span>品类剩余</span></div>' +
        '</div>' +
        cards +
        '</article>';
    }).join('');
  }

  function renderDetailHeaderFilters() {
    var data = window.LAIKE_DASHBOARD_DATA;
    detailHeaderRow.innerHTML = detailColumns.map(function(col) {
      if (!col.filter) return '<th><span class="th-label">' + esc(col.label) + '</span></th>';
      var values = [];
      var seen = {};
      data.rows.forEach(function(r) {
        var v = String(getField(r, col.key) || '').trim();
        if (v && !seen[v]) {
          seen[v] = true;
          values.push(v);
        }
      });
      values.sort(function(a, b) { return a.localeCompare(b, 'zh-CN', { numeric: true }); });
      var selected = headerFilters[col.key] || '';
      var opts = '<option value="">全部</option>' + values.map(function(v) {
        return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>';
      }).join('');
      return '<th><span class="th-label">' + esc(col.label) + '</span><select class="th-filter' + (selected ? ' active' : '') + '" data-field="' + esc(col.key) + '">' + opts + '</select></th>';
    }).join('');
    detailHeaderRow.querySelectorAll('.th-filter').forEach(function(sel) {
      sel.addEventListener('change', function() {
        headerFilters[sel.getAttribute('data-field')] = sel.value;
        sel.classList.toggle('active', !!sel.value);
        renderDetails();
      });
    });
  }

  function renderDetails() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var detailBody = document.getElementById('detailTableBody');
    var q = searchInput.value.trim().toLowerCase();
    var st = statusFilter.value;
    var cat = categoryFilter.value;
    var rows = data.rows.filter(function(r) {
      var passHeader = Object.keys(headerFilters).every(function(k) {
        return !headerFilters[k] || String(getField(r, k)) === String(headerFilters[k]);
      });
      return passHeader && (st === '全部' || r.状态 === st) && (cat === '全部' || r.品类 === cat) && textMatch(r, q);
    });
    tableCount.textContent = '显示 ' + rows.length + ' / ' + data.rows.length + ' 行';
    if (!rows.length) {
      detailBody.innerHTML = '<tr><td class="empty" colspan="14">没有符合条件的数据</td></tr>';
      return;
    }
    detailBody.innerHTML = rows.map(function(r) {
      var progress = getProgressInfo(r);
      var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
      return '<tr>' +
        '<td>' + esc(r.品类) + '</td>' +
        '<td>' + esc(r.工厂) + '</td>' +
        '<td class="mono">' + esc(r.订单号) + '</td>' +
        '<td class="mono">' + esc(r.SKU编码) + '</td>' +
        '<td class="text">' + esc(r.产品名称) + '</td>' +
        '<td>' + esc(r.客户) + '</td>' +
        '<td class="num">' + num(r.工厂总订单) + '</td>' +
        '<td class="num">' + num(r.已发货数量) + '</td>' +
        '<td class="num' + remainCls + '">' + num(r.工厂剩余数量) + '</td>' +
        '<td><span class="progress-cell"><span class="progress"><span class="bar ' + progress.cls + '" style="width:' + progress.width + '%"></span></span><span class="progress-text">' + progress.text + '</span></span></td>' +
        '<td>' + pill(r.状态) + '</td>' +
        '<td class="num">' + num(r.出货次数) + '</td>' +
        '<td>' + esc(r.最晚发货) + '</td>' +
        '<td class="text">' + esc(r.出货去向) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderSimpleTables() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var orderBody = document.getElementById('orderSummaryBody');
    var skuBody = document.getElementById('skuTableBody');
    var unmatchedBody = document.getElementById('unmatchedTableBody');

    orderBody.innerHTML = data.orderSummary.map(function(r) {
      var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
      return '<tr><td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="num">' + num(r.工厂总订单) + '</td><td class="num">' + num(r.已发货数量) + '</td><td class="num' + remainCls + '">' + num(r.工厂剩余数量) + '</td><td class="num">' + num(r.SKU行数) + '</td><td>' + pill(r.状态) + '</td></tr>';
    }).join('');

    skuBody.innerHTML = data.skuSummary.map(function(r) {
      var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
      return '<tr><td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.产品名称) + '</td><td class="num">' + num(r.工厂总订单) + '</td><td class="num">' + num(r.已发货数量) + '</td><td class="num' + remainCls + '">' + num(r.工厂剩余数量) + '</td><td class="num">' + num(r.订单行数) + '</td></tr>';
    }).join('');

    var unmatched = data.unmatched || [];
    unmatchedBody.innerHTML = unmatched.length ? unmatched.map(function(r) {
      return '<tr><td>' + esc(r.发货日期) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.货品名称) + '</td><td>' + esc(r.地名) + '</td><td class="num">' + num(r.发货数量) + '</td><td class="num">' + esc(r.出货表行号) + '</td></tr>';
    }).join('') : '<tr><td class="empty" colspan="7">所有出货均已匹配到订单表</td></tr>';
  }

  function refreshAll() {
    renderMeta();
    renderStats();
    renderCategoryFilter();
    renderCategoryCards();
    renderFocusSkuBoard();
    renderDetailHeaderFilters();
    renderDetails();
    renderSimpleTables();
    if (window.LAIKE_CHARTS && window.LAIKE_CHARTS.refresh) {
      window.LAIKE_CHARTS.refresh();
    }
  }

  [searchInput, statusFilter, categoryFilter].forEach(function(el) {
    el.addEventListener('input', renderDetails);
    el.addEventListener('change', renderDetails);
  });
  document.querySelectorAll('[data-status]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      statusFilter.value = btn.getAttribute('data-status');
      renderDetails();
      document.getElementById('orders').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  window.LAIKE_APP = { refresh: refreshAll, renderDetails: renderDetails };

  refreshAll();
})();
