(function() {
  var STORAGE_KEY = 'laike_inventory_dashboard_saved_data_v1_empty';
  var BACKUP_KEY = 'laike_inventory_dashboard_backup_v1_empty';
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
      /* 备份当前数据（保存上一步） */
      try {
        var old = localStorage.getItem(STORAGE_KEY);
        if (old) localStorage.setItem(BACKUP_KEY, old);
      } catch (e) {}
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
  function hasBackup() {
    return !!localStorage.getItem(BACKUP_KEY);
  }
  function undoLastSave() {
    try {
      var backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return false;
      localStorage.setItem(STORAGE_KEY, backup);
      localStorage.removeItem(BACKUP_KEY);
      return true;
    } catch (err) {
      console.warn('恢复上一步失败', err);
      return false;
    }
  }
  loadSavedData();
  window.LAIKE_STORAGE = { save: saveCurrentData, clear: clearSavedData, load: loadSavedData, hasBackup: hasBackup, undo: undoLastSave };

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
  function money(v) { return Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
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
    document.getElementById('statBalance').textContent = '¥' + money(data.summary.剩余库存余额 || 0);
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
        '<div><span>工厂总订单</span><strong>' + num(c.工厂总订单) + '</strong></div>' +
        '<div><span>已发货数量</span><strong>' + num(c.已发货数量) + '</strong></div>' +
        '<div><span>工厂剩余数量</span><strong>' + num(c.工厂剩余数量) + '</strong></div>' +
        '<div class="metric-balance"><span>剩余库存余额</span><strong>¥' + money(c.剩余库存余额 || 0) + '</strong></div>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  function renderFocusSkuBoard() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var board = document.getElementById('focusSkuBoard');
    if (!board) return;
    var focusCats = data.categorySummary.filter(function(c) { return c.品类 !== '润滑油'; }).map(function(c) { return c.品类; });
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
    }).join('') + '<th><span class="th-label">操作</span></th>';
    detailHeaderRow.querySelectorAll('.th-filter').forEach(function(sel) {
      sel.addEventListener('change', function() {
        headerFilters[sel.getAttribute('data-field')] = sel.value;
        sel.classList.toggle('active', !!sel.value);
        renderDetails();
      });
    });
  }

  var editRowIdx = -1; /* 当前正在编辑的行索引 */
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
      detailBody.innerHTML = '<tr><td class="empty" colspan="15">没有符合条件的数据</td></tr>';
      return;
    }
    detailBody.innerHTML = rows.map(function(r, displayIdx) {
      var realIdx = data.rows.indexOf(r);
      var progress = getProgressInfo(r);
      var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
      if (realIdx === editRowIdx) {
        return renderEditableRow(r, realIdx);
      }
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
        '<td><button class="btn-edit-row" data-edit-idx="' + realIdx + '" type="button" style="background:#eef;border:1px solid #36c;color:#36c;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:12px;">编辑</button></td>' +
        '</tr>';
    }).join('');
    detailBody.querySelectorAll('.btn-edit-row').forEach(function(btn) {
      btn.addEventListener('click', function() {
        editRowIdx = parseInt(btn.getAttribute('data-edit-idx'), 10);
        renderDetails();
      });
    });
    var saveBtn = detailBody.querySelector('.btn-save-row');
    if (saveBtn) saveBtn.addEventListener('click', saveRowEdit);
    var cancelBtn = detailBody.querySelector('.btn-cancel-row');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { editRowIdx = -1; renderDetails(); });
  }

  function renderEditableRow(r, realIdx) {
    var cats = ['润滑油', '制动液', '空调套装', '防冻液', '柴机油'];
    var catOpts = cats.map(function(c) { return '<option' + (c === r.品类 ? ' selected' : '') + '>' + c + '</option>'; }).join('');
    return '<tr style="background:#fffde6;">' +
      '<td><select class="edit-input" data-field="品类">' + catOpts + '</select></td>' +
      '<td><input class="edit-input" data-field="工厂" value="' + esc(r.工厂) + '" style="width:60px"></td>' +
      '<td><input class="edit-input mono" data-field="订单号" value="' + esc(r.订单号) + '" style="width:120px"></td>' +
      '<td><input class="edit-input mono" data-field="SKU编码" value="' + esc(r.SKU编码) + '" style="width:80px"></td>' +
      '<td><input class="edit-input" data-field="产品名称" value="' + esc(r.产品名称) + '" style="width:200px"></td>' +
      '<td><input class="edit-input" data-field="客户" value="' + esc(r.客户) + '" style="width:80px"></td>' +
      '<td><input class="edit-input num" type="number" data-field="工厂总订单" value="' + esc(r.工厂总订单) + '" style="width:70px"></td>' +
      '<td><input class="edit-input num" type="number" data-field="已发货数量" value="' + esc(r.已发货数量) + '" style="width:70px"></td>' +
      '<td><input class="edit-input num" type="number" data-field="工厂剩余数量" value="' + esc(r.工厂剩余数量) + '" style="width:70px"></td>' +
      '<td>-</td>' +
      '<td>-</td>' +
      '<td><input class="edit-input num" type="number" data-field="出货次数" value="' + esc(r.出货次数) + '" style="width:50px"></td>' +
      '<td><input class="edit-input" data-field="最晚发货" value="' + esc(r.最晚发货) + '" style="width:90px"></td>' +
      '<td><input class="edit-input" data-field="出货去向" value="' + esc(r.出货去向) + '" style="width:150px"></td>' +
      '<td><button class="btn-save-row" data-save-idx="' + realIdx + '" type="button" style="background:#2a9d8f;border:1px solid #2a9d8f;color:#fff;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:12px;">保存</button> <button class="btn-cancel-row" type="button" style="background:#eee;border:1px solid #999;color:#666;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:12px;">取消</button></td>' +
      '</tr>';
  }

  function saveRowEdit(e) {
    var idx = parseInt(e.target.getAttribute('data-save-idx'), 10);
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows || !data.rows[idx]) return;
    var row = e.target.closest('tr');
    var inputs = row.querySelectorAll('.edit-input');
    inputs.forEach(function(input) {
      var field = input.getAttribute('data-field');
      var val = input.value;
      if (field === '工厂总订单' || field === '已发货数量' || field === '工厂剩余数量' || field === '出货次数') {
        val = Number(val) || 0;
      }
      data.rows[idx][field] = val;
    });
    /* 自动重算 */
    var r = data.rows[idx];
    r.工厂剩余数量 = Number(r.工厂总订单 || 0) - Number(r.已发货数量 || 0);
    r.发货进度 = r.工厂总订单 > 0 ? r.已发货数量 / r.工厂总订单 : 0;
    r.剩余库存余额 = r.工厂剩余数量 * (r.单价 || 0);
    if (r.工厂总订单 <= 0) r.状态 = '待发货';
    else if (r.已发货数量 <= 0) r.状态 = '待发货';
    else if (r.已发货数量 >= r.工厂总订单) r.状态 = '全部发完';
    else r.状态 = '部分发货';
    if (window.LAIKE_UPLOAD && window.LAIKE_UPLOAD.rebuildSummaries) {
      window.LAIKE_UPLOAD.rebuildSummaries(data);
    }
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save(false);
    editRowIdx = -1;
    refreshAll();
    if (window.LAIKE_APP && window.LAIKE_APP.refresh) window.LAIKE_APP.refresh();
  }

  function renderSimpleTables() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var orderBody = document.getElementById('orderSummaryBody');
    var skuBody = document.getElementById('skuTableBody');
    var unmatchedBody = document.getElementById('unmatchedTableBody');

    orderBody.innerHTML = data.orderSummary.map(function(r) {
      var remainCls = r.工厂剩余数量 <= 0 ? ' neg' : '';
      return '<tr><td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="num">' + num(r.工厂总订单) + '</td><td class="num">' + num(r.已发货数量) + '</td><td class="num' + remainCls + '">' + num(r.工厂剩余数量) + '</td><td class="num">¥' + money(r.剩余库存余额 || 0) + '</td><td class="num">' + num(r.SKU行数) + '</td><td>' + pill(r.状态) + '</td><td><button class="btn-edit-order" data-order="' + esc(r.订单号) + '" data-cat="' + esc(r.品类) + '" type="button" style="background:#e8f4fd;border:1px solid #2a6da3;color:#2a6da3;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:13px;margin-right:4px;">编辑</button><button class="btn-del-order" data-order="' + esc(r.订单号) + '" data-cat="' + esc(r.品类) + '" type="button" style="background:#fee;border:1px solid #c33;color:#c33;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:13px;">删除</button></td></tr>';
    }).join('');
    orderBody.querySelectorAll('.btn-del-order').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var orderNo = btn.getAttribute('data-order');
        var cat = btn.getAttribute('data-cat');
        if (window.LAIKE_UPLOAD && window.LAIKE_UPLOAD.deleteOrder) {
          window.LAIKE_UPLOAD.deleteOrder(orderNo, cat);
        }
      });
    });
    orderBody.querySelectorAll('.btn-edit-order').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var orderNo = btn.getAttribute('data-order');
        var cat = btn.getAttribute('data-cat');
        if (window.LAIKE_UPLOAD && window.LAIKE_UPLOAD.editOrder) {
          window.LAIKE_UPLOAD.editOrder(orderNo, cat);
        }
      });
    });

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
    bindExportShipFlow();
    if (window.LAIKE_CHARTS && window.LAIKE_CHARTS.refresh) {
      window.LAIKE_CHARTS.refresh();
    }
  }

  function bindExportShipFlow() {
    var btn = document.getElementById('exportShipFlowBtn');
    if (!btn) return;
    btn.onclick = function() {
      var ver = window.LAIKE_SCRIPT_VERSION || '(旧版)';
      var data = window.LAIKE_DASHBOARD_DATA;
      var last = data && data.lastShipmentExport;
      /* 路径1：优先用最近一次提交保存的匹配结果（完美格式：原表+B列填订单号+拆单高亮） */
      if (last && last.previewRows && last.previewRows.length) {
        if (window.LAIKE_SHIP_EXPORT) {
          window.LAIKE_SHIP_EXPORT({
            rawRows: last.rawRows,
            headers: last.headers,
            headerIndex: last.headerIndex,
            cols: last.cols,
            previewRows: last.previewRows,
            fileName: last.fileName || '出货表'
          }, data);
        } else {
          alert('导出模块未加载，请强制刷新页面后重试');
        }
        return;
      }
      /* 路径2：当前有预览（上传后未提交），直接用预览导出 */
      var upload = window.LAIKE_UPLOAD_STATE;
      if (upload && upload.shipPreviewRows && upload.shipPreviewRows.length && upload.shipRawRows) {
        if (window.LAIKE_SHIP_EXPORT) {
          window.LAIKE_SHIP_EXPORT({
            rawRows: upload.shipRawRows,
            headers: upload.shipHeaders,
            headerIndex: upload.shipHeaderIndex,
            cols: upload.shipCols,
            previewRows: upload.shipPreviewRows,
            fileName: upload.shipPreviewFileName || '出货表'
          }, data);
        } else {
          alert('导出模块未加载，请强制刷新页面后重试');
        }
        return;
      }
      /* 路径3：兜底——从已保存的出货流水记录(shipments)重建匹配表 */
      var shipments = data && data.shipments ? data.shipments : [];
      if (shipments.length) {
        exportFromShipments(shipments, data);
        return;
      }
      /* 全部为空 */
      alert('暂无可导出的匹配结果（脚本版本: ' + ver + '）。\n\n可能原因：\n1. 浏览器缓存了旧版脚本——请强制刷新（Ctrl+Shift+R / Mac: Cmd+Shift+R）或用无痕窗口打开\n2. 提交扣减时本地存储已满导致匹配记录未保存\n3. 尚未上传过出货表\n\n如刚提交过扣减，请先强制刷新页面再点此按钮。');
    };
  }

  /* 兜底导出：从出货流水记录重建匹配表（无原表格式，但含全部匹配到的订单号） */
  function exportFromShipments(shipments, data) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = function() {
      var wb = XLSX.utils.book_new();
      /* Sheet1: 匹配明细 */
      var rows = [['序号', '订单号(匹配)', 'SKU编码', '产品名称', '本次发货数量', '扣减后剩余库存', '匹配模式', '提交时间']];
      shipments.forEach(function(r, i) {
        rows.push([i + 1, r.订单号 || '', r.SKU编码 || '', r.产品名称 || '', r.本次发货数量 || 0, r.扣减后剩余库存 || 0, r.匹配模式 || '', r.提交时间 || '']);
      });
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, '出货匹配记录');
      /* Sheet2: SKU剩余数量 */
      var skuMap = {}; var skuOrder = [];
      if (data && data.rows) {
        data.rows.forEach(function(r) {
          var sku = String(r.SKU编码 || '').trim();
          if (!sku) return;
          if (!skuMap[sku]) { skuMap[sku] = { 品类: r.品类 || '', 产品名称: r.产品名称 || '', 总订单: 0, 已发货: 0, 剩余: 0, 行数: 0 }; skuOrder.push(sku); }
          skuMap[sku].总订单 += Number(r.工厂总订单 || 0);
          skuMap[sku].已发货 += Number(r.已发货数量 || 0);
          skuMap[sku].剩余 += Number(r.工厂剩余数量 || 0);
          skuMap[sku].行数 += 1;
        });
      }
      var skuRows = [['品类', 'SKU编码', '产品名称', '工厂总订单', '已发货数量', '工厂剩余数量', '订单行数']];
      skuOrder.forEach(function(sku) { var m = skuMap[sku]; skuRows.push([m.品类, sku, m.产品名称, m.总订单, m.已发货, m.剩余, m.行数]); });
      var ws2 = XLSX.utils.aoa_to_sheet(skuRows);
      ws2['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'SKU剩余数量');
      XLSX.writeFile(wb, '出货匹配记录_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    };
    s.onerror = function() { alert('XLSX库加载失败，请检查网络后重试'); };
    document.head.appendChild(s);
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
