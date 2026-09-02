(function() {
  var state = {
    shipParsed: null,
    orderParsed: null,
    shipPreviewRows: [],
    orderPreviewRows: [],
    shipPreviewFileName: '',
    orderPreviewFileName: '',
    pendingType: null
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function num(v) { return Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
  function fmtDate(v) {
    if (!v) return '';
    if (v instanceof Date) {
      var y = String(v.getFullYear()), m = String(v.getMonth() + 1), d = String(v.getDate());
      return y + '/' + m + '/' + d;
    }
    var s = String(v).trim();
    // 尝试解析各种日期格式，统一输出 YYYY/M/D
    var d2 = new Date(s);
    if (!isNaN(d2.getTime())) {
      return d2.getFullYear() + '/' + (d2.getMonth() + 1) + '/' + d2.getDate();
    }
    // 已经是 YYYY/M/D 或 YYYY-MM-DD 格式的，统一为 YYYY/M/D
    s = s.replace(/-/g, '/');
    var parts = s.split('/');
    if (parts.length >= 3) {
      return parts[0] + '/' + parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
    }
    return s;
  }
  function parseNumberLike(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var text = String(v == null ? '' : v).replace(/,/g, '').trim();
    if (!text) return 0;
    var n = Number(text);
    return isFinite(n) ? n : 0;
  }
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function() { cb(null); };
    s.onerror = function() { cb(new Error('加载失败：' + src)); };
    document.head.appendChild(s);
  }
  function ensureXLSX(cb) {
    if (window.XLSX) { cb(null); return; }
    loadScript('./_shared/js/xlsx.full.min.js', function(localErr) {
      if (window.XLSX) { cb(null); return; }
      loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', function(cdnErr) {
        if (window.XLSX) cb(null);
        else cb(cdnErr || localErr || new Error('XLSX 解析依赖加载失败'));
      });
    });
  }
  function latestDate(existing, dates) {
    var all = [];
    if (existing) all.push(existing);
    (dates || []).forEach(function(d) { if (d) all.push(d); });
    all.sort();
    return all.length ? all[all.length - 1] : '';
  }
  function mergeDests(existing, dests) {
    var seen = {};
    var list = [];
    function add(v) {
      v = String(v || '').trim();
      if (!v || v.indexOf('等') >= 0) return;
      if (!seen[v]) {
        seen[v] = true;
        list.push(v);
      }
    }
    String(existing || '').split(/[、,，\s]+/).forEach(add);
    Object.keys(dests || {}).forEach(add);
    return list.length <= 4 ? list.join('、') : list.slice(0, 4).join('、') + '等' + list.length + '项';
  }

  function findCol(headers, keywords) {
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

  function detectHeader(rows, detector, requiredKeys) {
    var best = null;
    var max = Math.min(rows.length, 20);
    for (var i = 0; i < max; i++) {
      var headers = (rows[i] || []).map(function(h) { return String(h || '').trim(); });
      var cols = detector(headers);
      var score = requiredKeys.reduce(function(sum, key) { return sum + (cols[key] !== -1 ? 1 : 0); }, 0);
      var current = { index: i, headers: headers, cols: cols, score: score };
      if (!best || current.score > best.score) best = current;
      if (score === requiredKeys.length) return current;
    }
    return best || { index: 0, headers: [], cols: {}, score: 0 };
  }

  function parseExcel(file, cb) {
    if (!file || !/\.(xlsx|xls)$/i.test(file.name || '')) {
      cb(new Error('请上传 .xls 或 .xlsx 格式的 Excel 文件'));
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      ensureXLSX(function(loadErr) {
        if (loadErr) { cb(loadErr); return; }
        try {
          var wb = window.XLSX.read(e.target.result, { type: 'array', cellDates: true });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          cb(null, rows);
        } catch (err) {
          cb(err);
        }
      });
    };
    reader.onerror = function() { cb(new Error('文件读取失败')); };
    reader.readAsArrayBuffer(file);
  }

  function detectShipCols(headers) {
    var cols = {};
    cols.orderNo = findCol(headers, ['订单号', '预订单IBOC号码', 'IBOC', '预订单', '销售订单号']);
    cols.sku = findCol(headers, ['SKU', 'SKU编码', 'GY号', '匹配型号', '型号', 'GY']);
    cols.shipQty = findCol(headers, ['本次已发货数量', '已发货数量', '本次发货数量', '发货数量', '出货数量', '发货']);
    if (cols.shipQty === -1) cols.shipQty = findCol(headers, ['数量']);
    cols.date = findCol(headers, ['日期']);
    cols.dest = findCol(headers, ['地名', '去向', '目的地']);
    cols.product = findCol(headers, ['产品名称', '货品名称', '品名', '货品']);
    cols.rowId = findCol(headers, ['行号', '序号']);
    return cols;
  }

  var ORDER_CATEGORIES = ['润滑油', '制动液', '空调套装', '防冻液', '柴机油'];

  function detectOrderCols(headers) {
    var cols = {};
    cols.orderNo = findCol(headers, ['订单号', '销售订单号', 'IBOC', '预订单']);
    cols.orderDate = findCol(headers, ['订单日期', '下单日期', '日期', '制单日期']);
    cols.model = findCol(headers, ['型号', 'SKU', 'SKU编码', 'GY号', 'GY', '匹配型号']);
    cols.product = findCol(headers, ['品名', '产品名称', '产品名称及型号', '货品名称', '货品', '产品']);
    cols.qty = findCol(headers, ['数量', '订货数量', '订单数量', '本次订单数量']);
    cols.unitPrice = findCol(headers, ['单价', '含税运单价', '含税单价', '无税单价', '价格']);
    cols.totalAmount = findCol(headers, ['总金额', '金额', '总价', '合计金额', '订单金额']);
    cols.category = findCol(headers, ['品类', '类别']);
    cols.customer = findCol(headers, ['客户']);
    cols.entity = findCol(headers, ['抬头']);
    cols.factory = findCol(headers, ['工厂']);
    cols.unit = findCol(headers, ['单位']);
    return cols;
  }

  function trimOrderNoSuffix(orderNo) {
    var s = String(orderNo || '').trim();
    // 去掉末尾的 -1, -2 等子订单后缀，只保留主订单号
    return s.replace(/-\d+$/, '');
  }

  function extractLabelValue(rows, label) {
    for (var i = 0; i < Math.min(rows.length, 15); i++) {
      var r = rows[i];
      if (!r) continue;
      for (var j = 0; j < r.length; j++) {
        var cell = String(r[j] || '').trim();
        if (cell === label || cell === label + '：' || cell === label + ':') {
          if (r[j + 1]) return String(r[j + 1]).trim();
        }
      }
    }
    return '';
  }

  function handleShipFile(file) {
    state.pendingType = 'shipment';
    parseExcel(file, function(err, rows) {
      if (err) { showPreview('error', '出货表解析失败：' + err.message); return; }
      if (rows.length < 2) { showPreview('error', '出货表没有数据行'); return; }
      var detected = detectHeader(rows, detectShipCols, ['orderNo', 'sku', 'shipQty']);
      var headers = detected.headers;
      var cols = detected.cols;
      var missing = [];
      if (cols.orderNo === -1) missing.push('订单号(IBOC)');
      if (cols.sku === -1) missing.push('型号(GY号)');
      if (cols.shipQty === -1) missing.push('发货数量');
      if (missing.length) {
        showPreview('error', '出货表缺少必要列：' + missing.join('、') + '。检测到的表头：' + headers.join('、'));
        return;
      }
      var parsed = [];
      for (var i = detected.index + 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length === 0) continue;
        var orderNo = String(r[cols.orderNo] || '').trim();
        var sku = String(r[cols.sku] || '').trim();
        var qty = parseNumberLike(r[cols.shipQty]);
        if (!orderNo && !sku && !qty) continue;
        parsed.push({
          订单号: orderNo,
          SKU编码: sku,
          发货数量: qty,
          发货日期: cols.date >= 0 ? fmtDate(r[cols.date]) : '',
          地名: cols.dest >= 0 ? String(r[cols.dest] || '').trim() : '',
          货品名称: cols.product >= 0 ? String(r[cols.product] || '').trim() : '',
          行号: i + 1
        });
      }
      state.shipParsed = parsed;
      state.shipPreviewFileName = file.name;
      matchAndPreviewShipments(parsed, file.name);
    });
  }

  function matchAndPreviewShipments(parsed, fileName) {
    var data = window.LAIKE_DASHBOARD_DATA;
    state.shipPreviewRows = parsed.map(function(s) {
      return calcShipmentPreviewRow({
        订单号: s.订单号,
        SKU编码: s.SKU编码,
        产品名称: s.货品名称,
        发货数量: s.发货数量,
        发货日期: s.发货日期,
        地名: s.地名,
        行号: s.行号
      }, data);
    });
    state.shipPreviewFileName = fileName;
    renderShipPreview();
  }

  function findDashboardRowIndex(orderNo, sku) {
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows) return -1;
    for (var i = 0; i < data.rows.length; i++) {
      if (String(data.rows[i].订单号) === String(orderNo) && String(data.rows[i].SKU编码) === String(sku)) return i;
    }
    return -1;
  }

  function calcShipmentPreviewRow(item, data) {
    var idx = findDashboardRowIndex(item.订单号, item.SKU编码);
    var base = idx >= 0 ? data.rows[idx] : null;
    var qty = parseNumberLike(item.发货数量);
    item.targetIndex = idx;
    item.matched = !!base;
    item.产品名称 = item.产品名称 || (base ? base.产品名称 : '');
    item.原剩余库存 = base ? Number(base.工厂剩余数量 || 0) : null;
    item.扣减后剩余库存 = base ? Number(base.工厂剩余数量 || 0) - qty : null;
    item.发货数量 = qty;
    return item;
  }

  function renderShipPreview() {
    var rows = state.shipPreviewRows || [];
    var matchedCount = rows.filter(function(r) { return r.matched; }).length;
    var unmatchedCount = rows.length - matchedCount;
    var negativeRemainCount = rows.filter(function(r) { return r.matched && r.扣减后剩余库存 < 0; }).length;
    var html = '<div class="preview-header">' +
      '<h3>出货表智能识别结果</h3>' +
      '<p>文件：<strong>' + esc(state.shipPreviewFileName) + '</strong>；共识别 <strong>' + rows.length + '</strong> 行，匹配 <strong>' + matchedCount + '</strong> 行，未匹配 <strong>' + unmatchedCount + '</strong> 行。确认提交前不会修改任何库存数据。</p>' +
      '</div>';
    if (negativeRemainCount) {
      html += '<p class="neg" style="margin:10px 0 0;font-weight:700">提醒：有 <strong>' + negativeRemainCount + '</strong> 行扣减后剩余库存小于 0，请核对后再提交。</p>';
    }
    if (rows.length) {
      html += '<div class="table-wrap" style="max-height:360px"><table><thead><tr>' +
        '<th>订单号</th><th>GY号 / SKU</th><th>产品名称</th><th>本次发货数量</th><th>扣减后剩余库存</th><th>匹配状态</th><th>操作</th>' +
        '</tr></thead><tbody>';
      rows.forEach(function(r, i) {
        var remainText = r.matched ? num(r.扣减后剩余库存) : '未匹配';
        var remainCls = r.matched && r.扣减后剩余库存 < 0 ? ' neg' : '';
        html += '<tr>' +
          '<td><input class="preview-input mono" data-ship-field="订单号" data-ship-index="' + i + '" value="' + esc(r.订单号) + '"></td>' +
          '<td><input class="preview-input mono" data-ship-field="SKU编码" data-ship-index="' + i + '" value="' + esc(r.SKU编码) + '"></td>' +
          '<td><input class="preview-input" data-ship-field="产品名称" data-ship-index="' + i + '" value="' + esc(r.产品名称) + '"></td>' +
          '<td><input class="preview-input num" type="number" min="0" step="1" data-ship-field="发货数量" data-ship-index="' + i + '" value="' + esc(r.发货数量) + '"></td>' +
          '<td class="num' + remainCls + '">' + remainText + '</td>' +
          '<td>' + (r.matched ? '<span class="pill ok">已匹配</span>' : '<span class="pill bad">未匹配</span>') + '</td>' +
          '<td><button type="button" class="preview-delete-btn" data-ship-delete="' + i + '">删除</button></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<p>当前预览没有可提交的出货行。</p>';
    }
    html += '<div class="update-bar">' +
      '<button class="btn-primary" id="applyShipBtn"' + (matchedCount ? '' : ' disabled') + '>确认提交扣减</button>' +
      '<button id="cancelUpdateBtn">取消</button>' +
      '<span class="hint">可先修改或删除错误行；只有点击确认提交扣减后才会更新库存</span>' +
      '</div>';
    showPreview('ok', html);
    document.getElementById('applyShipBtn').addEventListener('click', function() { applyShipmentUpdate(); });
    document.getElementById('cancelUpdateBtn').addEventListener('click', clearPreview);
    bindShipPreviewEvents();
  }

  function bindShipPreviewEvents() {
    var el = activePreviewEl();
    el.querySelectorAll('[data-ship-field]').forEach(function(input) {
      input.addEventListener('change', function() {
        var idx = parseInt(input.getAttribute('data-ship-index'), 10);
        var field = input.getAttribute('data-ship-field');
        if (!state.shipPreviewRows[idx]) return;
        state.shipPreviewRows[idx][field] = field === '发货数量' ? parseNumberLike(input.value) : input.value.trim();
        state.shipPreviewRows[idx] = calcShipmentPreviewRow(state.shipPreviewRows[idx], window.LAIKE_DASHBOARD_DATA);
        renderShipPreview();
      });
    });
    el.querySelectorAll('[data-ship-delete]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-ship-delete'), 10);
        state.shipPreviewRows.splice(idx, 1);
        renderShipPreview();
      });
    });
  }

  function applyShipmentUpdate() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var previewRows = state.shipPreviewRows || [];
    if (!previewRows.length) return;
    var unmatched = [];
    var matched = {};
    var confirmedFlow = [];
    previewRows.forEach(function(s) {
      s = calcShipmentPreviewRow(s, data);
      if (s.matched && s.发货数量 > 0) {
        var idx = s.targetIndex;
        if (!matched[idx]) matched[idx] = { qty: 0, dates: [], dests: {}, count: 0 };
        matched[idx].qty += s.发货数量;
        matched[idx].count++;
        if (s.发货日期) matched[idx].dates.push(s.发货日期);
        if (s.地名) matched[idx].dests[s.地名] = true;
        confirmedFlow.push({
          提交时间: new Date().toISOString(),
          订单号: s.订单号,
          SKU编码: s.SKU编码,
          产品名称: s.产品名称,
          本次发货数量: s.发货数量,
          扣减后剩余库存: s.扣减后剩余库存,
          来源文件: state.shipPreviewFileName || state.shipFileName || '用户上传出货表'
        });
      } else {
        unmatched.push({
          发货日期: s.发货日期,
          订单号: s.订单号,
          SKU编码: s.SKU编码,
          货品名称: s.产品名称,
          地名: s.地名,
          发货数量: s.发货数量,
          出货表行号: s.行号
        });
      }
    });
    Object.keys(matched).forEach(function(idx) {
      var row = data.rows[parseInt(idx)];
      var m = matched[idx];
      row.已发货数量 = Number(row.已发货数量 || 0) + m.qty;
      row.出货次数 = Number(row.出货次数 || 0) + m.count;
      row.最晚发货 = latestDate(row.最晚发货, m.dates);
      row.出货去向 = mergeDests(row.出货去向, m.dests);
    });
    data.unmatched = (data.unmatched || []).concat(unmatched);
    data.shipments = Array.isArray(data.shipments) ? data.shipments.concat(confirmedFlow) : confirmedFlow;
    data.meta.shipSource = state.shipFileName || '用户上传出货表';
    data.meta.shipRows = Number(data.meta.shipRows || 0) + previewRows.length;
    data.meta.generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    rebuildSummaries(data);
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save(false);
    window.LAIKE_APP.refresh();
    clearPreview();
    state.shipPreviewRows = [];
    showPreview('success', '<div class="preview-header"><h3>扣减完成，待一键保存</h3><p>已按确认预览执行出货扣减，并记录本次发货流水。工厂总订单 <strong>' + num(data.summary.工厂总订单) + '</strong>，已发货 <strong>' + num(data.summary.已发货数量) + '</strong>，工厂剩余 <strong>' + num(data.summary.工厂剩余数量) + '</strong>。' + (saved ? '当前浏览器已暂存，请点击下方“一键保存”同步云端。' : '注意：本地暂存失败，请不要关闭页面，先联系处理。') + '</p></div>');
    setSaveStatus('已有出货扣减更新，待一键保存云端', 'bad');
    setTimeout(clearPreview, 5000);
  }

  function handleOrderFile(file) {
    state.pendingType = 'order';
    parseExcel(file, function(err, rows) {
      if (err) { showPreview('error', '订单表解析失败：' + err.message); return; }
      if (rows.length < 2) { showPreview('error', '订单表没有数据行'); return; }

      // 先尝试从标签行提取订单号和订单日期（如"订单号：26IBOC0849-1"）
      var headerOrderNo = trimOrderNoSuffix(extractLabelValue(rows, '订单号'));
      var headerOrderDate = extractLabelValue(rows, '订单日期');
      if (headerOrderDate) headerOrderDate = fmtDate(headerOrderDate);

      var detected = detectHeader(rows, detectOrderCols, ['model', 'qty']);
      var headers = detected.headers;
      var cols = detected.cols;

      // 如果表头中没有订单号列，但有标签行的订单号，则使用标签值
      var hasOrderNoCol = cols.orderNo >= 0;
      var missing = [];
      if (!hasOrderNoCol && !headerOrderNo) missing.push('订单号');
      if (cols.model === -1) missing.push('型号');
      if (cols.qty === -1) missing.push('数量');
      if (missing.length) {
        showPreview('error', '订单表缺少必要列：' + missing.join('、') + '。检测到的表头：' + headers.join('、'));
        return;
      }

      var parsed = [];
      for (var i = detected.index + 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length === 0) continue;
        var model = String(r[cols.model] || '').trim();
        var qty = parseNumberLike(r[cols.qty]);
        // 跳过合计行和空行
        if (!model && !qty) continue;
        var rowText = r.join(' ').trim();
        if (rowText.indexOf('合计') >= 0 || rowText.indexOf('备注') >= 0) continue;
        var orderNo = hasOrderNoCol ? trimOrderNoSuffix(r[cols.orderNo]) : headerOrderNo;
        var orderDate = cols.orderDate >= 0 ? fmtDate(r[cols.orderDate]) : headerOrderDate;
        parsed.push({
          品类: cols.category >= 0 ? String(r[cols.category] || '').trim() : '',
          订单号: orderNo,
          订单日期: orderDate || '',
          型号: model,
          品名: cols.product >= 0 ? String(r[cols.product] || '').trim() : '',
          数量: qty,
          单价: cols.unitPrice >= 0 ? parseNumberLike(r[cols.unitPrice]) : 0,
          总金额: cols.totalAmount >= 0 ? parseNumberLike(r[cols.totalAmount]) : 0,
          客户: cols.customer >= 0 ? String(r[cols.customer] || '').trim() : '',
          抬头: cols.entity >= 0 ? String(r[cols.entity] || '').trim() : '',
          工厂: cols.factory >= 0 ? String(r[cols.factory] || '').trim() : '莱克',
          单位: cols.unit >= 0 ? String(r[cols.unit] || '').trim() : ''
        });
      }
      if (!parsed.length) {
        showPreview('error', '未识别到有效数据行，请检查Excel格式。检测到的表头：' + headers.join('、'));
        return;
      }
      state.orderParsed = parsed;
      state.orderPreviewFileName = file.name;
      matchAndPreviewOrders(parsed, file.name);
    });
  }

  function detectCategoryFromFileName(fileName) {
    var name = String(fileName || '').toLowerCase();
    var bestMatch = '';
    var bestScore = 0;
    ORDER_CATEGORIES.forEach(function(cat) {
      var score = 0;
      if (name.indexOf(cat) >= 0) score = cat.length;
      if (score > bestScore) { bestScore = score; bestMatch = cat; }
    });
    return bestMatch;
  }

  function matchAndPreviewOrders(parsed, fileName) {
    var autoCategory = detectCategoryFromFileName(fileName);
    state.orderPreviewRows = parsed.map(function(o) {
      return {
        品类: o.品类 || autoCategory || '',
        订单号: o.订单号,
        订单日期: o.订单日期 || '',
        型号: o.型号,
        SKU编码: o.型号,
        品名: o.品名 || '',
        产品名称: o.品名 || '',
        数量: parseNumberLike(o.数量),
        单价: parseNumberLike(o.单价),
        总金额: parseNumberLike(o.总金额),
        客户: o.客户,
        抬头: o.抬头,
        工厂: o.工厂 || '莱克',
        单位: o.单位,
        行数: 1
      };
    });
    state.orderPreviewFileName = fileName;
    state.autoCategory = autoCategory;
    renderOrderPreview();
  }

  function orderPreviewStatus(row) {
    var data = window.LAIKE_DASHBOARD_DATA;
    var key = row.品类 + '|' + row.订单号 + '|' + row.SKU编码;
    for (var i = 0; i < data.rows.length; i++) {
      var r = data.rows[i];
      if (r.品类 + '|' + r.订单号 + '|' + r.SKU编码 === key) {
        return { exists: true, text: '追加到历史订单', afterRemain: Number(r.工厂总订单 || 0) + parseNumberLike(row.数量) - Number(r.已发货数量 || 0) };
      }
    }
    return { exists: false, text: '新增订单', afterRemain: parseNumberLike(row.数量) };
  }

  function renderOrderPreview() {
    var rows = state.orderPreviewRows || [];
    var addCount = rows.filter(function(r) { return orderPreviewStatus(r).exists; }).length;
    var newCount = rows.length - addCount;
    var html = '<div class="preview-header">' +
      '<h3>订单表智能识别结果</h3>' +
      '<p>文件：<strong>' + esc(state.orderPreviewFileName) + '</strong>；共识别 <strong>' + rows.length + '</strong> 行，其中新增 <strong>' + newCount + '</strong> 行，追加 <strong>' + addCount + '</strong> 行。请选择品类后确认提交，提交前不会修改订单数据。</p>' +
      '</div>';
    if (rows.length) {
      html += '<div class="table-wrap" style="max-height:360px"><table><thead><tr>' +
        '<th>品类</th><th>订单号</th><th>订单日期</th><th>型号</th><th>品名</th><th>数量</th><th>单价</th><th>总金额</th><th>提交后状态</th><th>操作</th>' +
        '</tr></thead><tbody>';
      rows.forEach(function(r, i) {
        var st = orderPreviewStatus(r);
        var catOptions = ORDER_CATEGORIES.map(function(c) {
          return '<option value="' + esc(c) + '"' + (r.品类 === c ? ' selected' : '') + '>' + esc(c) + '</option>';
        }).join('');
        var catSelect = '<select class="preview-input" data-order-field="品类" data-order-index="' + i + '">' +
          '<option value=""' + (!r.品类 ? ' selected' : '') + '>请选择</option>' + catOptions + '</select>';
        html += '<tr>' +
          '<td>' + catSelect + '</td>' +
          '<td><input class="preview-input mono" data-order-field="订单号" data-order-index="' + i + '" value="' + esc(r.订单号) + '"></td>' +
          '<td><input class="preview-input" data-order-field="订单日期" data-order-index="' + i + '" value="' + esc(r.订单日期) + '"></td>' +
          '<td><input class="preview-input mono" data-order-field="型号" data-order-index="' + i + '" value="' + esc(r.型号) + '"></td>' +
          '<td><input class="preview-input" data-order-field="品名" data-order-index="' + i + '" value="' + esc(r.品名) + '"></td>' +
          '<td><input class="preview-input num" type="number" min="0" step="1" data-order-field="数量" data-order-index="' + i + '" value="' + esc(r.数量) + '"></td>' +
          '<td><input class="preview-input num" type="number" min="0" step="0.01" data-order-field="单价" data-order-index="' + i + '" value="' + esc(r.单价) + '"></td>' +
          '<td><input class="preview-input num" type="number" min="0" step="0.01" data-order-field="总金额" data-order-index="' + i + '" value="' + esc(r.总金额) + '"></td>' +
          '<td>' + esc(st.text) + '；剩余 ' + num(st.afterRemain) + '</td>' +
          '<td><button type="button" class="preview-delete-btn" data-order-delete="' + i + '">删除</button></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<p>当前预览没有可提交的订单行。</p>';
    }
    var noCatCount = rows.filter(function(r) { return !r.品类; }).length;
    var submitDisabled = !rows.length || noCatCount > 0;
    var hint = noCatCount > 0 ? '有 <strong>' + noCatCount + '</strong> 行未选择品类，请选择品类后再提交' : '可先修改或删除错误行；确认提交后只追加或累计，不覆盖历史订单';
    var autoCatHtml = state.autoCategory ?
      '<span style="margin-right:12px;font-size:13px;color:var(--accent)">从文件名识别到品类：<strong>' + esc(state.autoCategory) + '</strong></span>' +
      '<button type="button" class="btn-primary" id="autoFillCatBtn" style="padding:4px 12px;font-size:13px">一键填充所有行</button>' +
      '<select id="bulkCatSelect" class="preview-input" style="margin-left:8px;padding:4px 8px;width:auto"><option value="">修改为...</option>' +
      ORDER_CATEGORIES.map(function(c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '</select>'
      : '';
    html += '<div class="update-bar">' +
      (autoCatHtml ? '<div style="margin-bottom:8px">' + autoCatHtml + '</div>' : '') +
      '<button class="btn-primary" id="applyOrderBtn"' + (submitDisabled ? ' disabled' : '') + '>确认提交新增订单</button>' +
      '<button id="cancelUpdateBtn">取消</button>' +
      '<span class="hint">' + hint + '</span>' +
      '</div>';
    showPreview('ok', html);
    document.getElementById('applyOrderBtn').addEventListener('click', function() { applyOrderUpdate(); });
    document.getElementById('cancelUpdateBtn').addEventListener('click', clearPreview);
    var autoFillBtn = document.getElementById('autoFillCatBtn');
    if (autoFillBtn) {
      autoFillBtn.addEventListener('click', function() {
        if (!state.autoCategory) return;
        state.orderPreviewRows.forEach(function(r) { r.品类 = state.autoCategory; });
        renderOrderPreview();
      });
    }
    var bulkCatSelect = document.getElementById('bulkCatSelect');
    if (bulkCatSelect) {
      bulkCatSelect.addEventListener('change', function() {
        if (!bulkCatSelect.value) return;
        state.orderPreviewRows.forEach(function(r) { r.品类 = bulkCatSelect.value; });
        renderOrderPreview();
      });
    }
    bindOrderPreviewEvents();
  }

  function bindOrderPreviewEvents() {
    var el = activePreviewEl();
    el.querySelectorAll('[data-order-field]').forEach(function(input) {
      input.addEventListener('change', function() {
        var idx = parseInt(input.getAttribute('data-order-index'), 10);
        var field = input.getAttribute('data-order-field');
        if (!state.orderPreviewRows[idx]) return;
        var numericFields = ['数量', '单价', '总金额'];
        state.orderPreviewRows[idx][field] = numericFields.indexOf(field) >= 0 ? parseNumberLike(input.value) : input.value.trim();
        if (field === '型号') state.orderPreviewRows[idx].SKU编码 = state.orderPreviewRows[idx].型号;
        if (field === '品名') state.orderPreviewRows[idx].产品名称 = state.orderPreviewRows[idx].品名;
        renderOrderPreview();
      });
    });
    el.querySelectorAll('[data-order-delete]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-order-delete'), 10);
        state.orderPreviewRows.splice(idx, 1);
        renderOrderPreview();
      });
    });
  }

  function applyOrderUpdate() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var previewRows = state.orderPreviewRows || [];
    if (!previewRows.length) return;
    var noCat = previewRows.filter(function(r) { return !r.品类; });
    if (noCat.length) {
      showPreview('error', '有 ' + noCat.length + ' 行未选择品类，请选择品类后再提交。');
      return;
    }
    var existingMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.品类 + '|' + r.订单号 + '|' + r.SKU编码;
      if (existingMap[key] === undefined) existingMap[key] = i;
    });
    var grouped = {};
    previewRows.forEach(function(o) {
      if (!o.订单号 && !o.SKU编码 && !parseNumberLike(o.数量)) return;
      var key = o.品类 + '|' + o.订单号 + '|' + o.SKU编码;
      if (!grouped[key]) grouped[key] = { 品类: o.品类, 订单号: o.订单号, 订单日期: o.订单日期, SKU编码: o.SKU编码, 型号: o.型号, 品名: o.品名, 产品名称: o.品名, 数量: 0, 单价: o.单价, 总金额: 0, 客户: o.客户, 抬头: o.抬头, 工厂: o.工厂, 单位: o.单位, 行数: 0 };
      grouped[key].数量 += parseNumberLike(o.数量);
      grouped[key].总金额 += parseNumberLike(o.总金额);
      grouped[key].行数++;
    });
    Object.values(grouped).forEach(function(g) {
      var key = g.品类 + '|' + g.订单号 + '|' + g.SKU编码;
      if (existingMap[key] !== undefined) {
        data.rows[existingMap[key]].工厂总订单 += g.数量;
        data.rows[existingMap[key]].订单原始行数 += g.行数;
        if (g.订单日期 && !data.rows[existingMap[key]].订单日期) data.rows[existingMap[key]].订单日期 = g.订单日期;
        if (g.单价) data.rows[existingMap[key]].单价 = g.单价;
        if (g.总金额) data.rows[existingMap[key]].总金额 = (data.rows[existingMap[key]].总金额 || 0) + g.总金额;
      } else {
        data.rows.push({
          品类: g.品类,
          工厂: g.工厂,
          订单号: g.订单号,
          订单日期: g.订单日期,
          SKU编码: g.SKU编码,
          型号: g.型号,
          产品名称: g.产品名称,
          品名: g.品名,
          客户: g.客户,
          抬头: g.抬头,
          单位: g.单位,
          单价: g.单价,
          总金额: g.总金额,
          工厂总订单: g.数量,
          已发货数量: 0,
          工厂剩余数量: g.数量,
          发货进度: 0,
          状态: '待发货',
          出货次数: 0,
          最晚发货: '',
          出货去向: '',
          订单原始行数: g.行数
        });
      }
    });
    data.meta.orderSource = state.orderFileName || '用户上传订单表';
    data.meta.orderRows = Number(data.meta.orderRows || 0) + previewRows.length;
    data.meta.generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    rebuildSummaries(data);
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save(false);
    window.LAIKE_APP.refresh();
    clearPreview();
    state.orderPreviewRows = [];
    showPreview('success', '<div class="preview-header"><h3>订单追加完成，待一键保存</h3><p>已将上传的订单数据累计到现有数据，已发货数量保持不变。工厂总订单 <strong>' + num(data.summary.工厂总订单) + '</strong>，已发货 <strong>' + num(data.summary.已发货数量) + '</strong>，工厂剩余 <strong>' + num(data.summary.工厂剩余数量) + '</strong>。' + (saved ? '当前浏览器已暂存，请点击下方“一键保存”同步云端。' : '注意：本地暂存失败，请不要关闭页面，先联系处理。') + '</p></div>');
    setSaveStatus('已有新订单更新，待一键保存云端', 'bad');
    setTimeout(clearPreview, 5000);
  }

  function rebuildSummaries(data) {
    data.rows.forEach(function(r) {
      r.工厂剩余数量 = r.工厂总订单 - r.已发货数量;
      r.发货进度 = r.工厂总订单 > 0 ? r.已发货数量 / r.工厂总订单 : 0;
      if (r.已发货数量 <= 0) r.状态 = '待发货';
      else if (r.已发货数量 > r.工厂总订单) r.状态 = '超发异常';
      else if (r.已发货数量 >= r.工厂总订单) r.状态 = '全部发完';
      else r.状态 = '部分发货';
    });
    var total = { 订单SKU行: data.rows.length, 工厂总订单: 0, 已发货数量: 0, 工厂剩余数量: 0, 未匹配出货行数: (data.unmatched || []).length };
    data.rows.forEach(function(r) {
      total.工厂总订单 += r.工厂总订单;
      total.已发货数量 += r.已发货数量;
      total.工厂剩余数量 += r.工厂剩余数量;
    });
    data.summary = total;
    var catMap = {};
    var catSkuSet = {};
    data.rows.forEach(function(r) {
      if (!catMap[r.品类]) catMap[r.品类] = { 品类: r.品类, 工厂总订单: 0, 已发货数量: 0, 工厂剩余数量: 0, 订单SKU行: 0, SKU数: 0, 超发SKU行: 0 };
      var c = catMap[r.品类];
      c.工厂总订单 += r.工厂总订单;
      c.已发货数量 += r.已发货数量;
      c.工厂剩余数量 += r.工厂剩余数量;
      c.订单SKU行++;
      if (r.状态 === '超发异常') c.超发SKU行++;
      catSkuSet[r.品类 + '|' + r.SKU编码] = true;
    });
    Object.keys(catSkuSet).forEach(function(key) {
      var cat = key.split('|')[0];
      if (catMap[cat]) catMap[cat].SKU数++;
    });
    data.categorySummary = Object.values(catMap);
    var orderMap = {};
    data.rows.forEach(function(r) {
      var key = r.品类 + '|' + r.订单号;
      if (!orderMap[key]) orderMap[key] = { 品类: r.品类, 订单号: r.订单号, 工厂总订单: 0, 已发货数量: 0, 工厂剩余数量: 0, SKU行数: 0, 状态: '' };
      var o = orderMap[key];
      o.工厂总订单 += r.工厂总订单;
      o.已发货数量 += r.已发货数量;
      o.工厂剩余数量 += r.工厂剩余数量;
      o.SKU行数++;
    });
    Object.values(orderMap).forEach(function(o) {
      if (o.已发货数量 <= 0) o.状态 = '待发货';
      else if (o.工厂剩余数量 <= 0) o.状态 = '全部发完';
      else o.状态 = '部分发货';
    });
    data.orderSummary = Object.values(orderMap);
    var skuMap = {};
    data.rows.forEach(function(r) {
      var key = r.品类 + '|' + r.SKU编码;
      if (!skuMap[key]) skuMap[key] = { 品类: r.品类, SKU编码: r.SKU编码, 产品名称: r.产品名称, 工厂总订单: 0, 已发货数量: 0, 工厂剩余数量: 0, 订单行数: 0 };
      var s = skuMap[key];
      s.工厂总订单 += r.工厂总订单;
      s.已发货数量 += r.已发货数量;
      s.工厂剩余数量 += r.工厂剩余数量;
      s.订单行数++;
    });
    data.skuSummary = Object.values(skuMap).sort(function(a, b) { return b.工厂总订单 - a.工厂总订单; });
  }

  function showPreview(type, html) {
    var el = activePreviewEl();
    el.style.display = 'block';
    el.className = 'upload-preview ' + (type === 'error' ? 'preview-error' : type === 'success' ? 'preview-success' : '');
    el.innerHTML = html;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearPreview() {
    var el = activePreviewEl();
    el.style.display = 'none';
    el.innerHTML = '';
  }

  function activePreviewEl() {
    var id = state.pendingType === 'order' ? 'orderUploadPreview' : state.pendingType === 'shipment' ? 'shipUploadPreview' : 'uploadPreview';
    return document.getElementById(id) || document.getElementById('uploadPreview');
  }

  function setSaveStatus(text, type) {
    var el = document.getElementById('oneClickSaveStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'save-status' + (type ? ' ' + type : '');
  }

  function oneClickSave() {
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows) {
      setSaveStatus('当前没有可保存的数据', 'bad');
      return;
    }
    setSaveStatus('正在保存本地与云端...', '');
    var localSaved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save(false);
    if (!localSaved) {
      setSaveStatus('本地保存失败，请先不要关闭页面', 'bad');
      return;
    }
    if (window.LAIKE_CLOUD && window.LAIKE_CLOUD.saveData) {
      window.LAIKE_CLOUD.saveData(data, true).then(function(ok) {
        setSaveStatus(ok ? '已一键保存到云端' : '本地已保存，云端保存未完成', ok ? 'ok' : 'bad');
      });
    } else {
      setSaveStatus('本地已保存；云端未连接或未配置', 'bad');
    }
  }

  /* ========== 手动录入新订单 ========== */
  var manualRows = [];
  var MANUAL_CATEGORIES = ['润滑油', '制动液', '空调套装', '防冻液', '柴机油'];

  function emptyManualRow() {
    return { 品类: '', 工厂: '莱克', 订单号: '', SKU编码: '', 产品名称: '', 下单数量: 0 };
  }

  function manualRowStatus(row) {
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows) return { exists: false, text: '新增订单', afterRemain: parseNumberLike(row.下单数量) };
    var key = row.品类 + '|' + row.订单号 + '|' + row.SKU编码;
    for (var i = 0; i < data.rows.length; i++) {
      var r = data.rows[i];
      if (r.品类 + '|' + r.订单号 + '|' + r.SKU编码 === key) {
        return { exists: true, text: '追加到历史订单', afterRemain: Number(r.工厂总订单 || 0) + parseNumberLike(row.下单数量) - Number(r.已发货数量 || 0) };
      }
    }
    return { exists: false, text: '新增订单', afterRemain: parseNumberLike(row.下单数量) };
  }

  function renderManualEntry() {
    var container = document.getElementById('manualEntryContainer');
    if (!container) return;
    var html = '<div class="manual-table-wrap"><table><thead><tr>' +
      '<th>品类</th><th>工厂</th><th>订单号</th><th>SKU编码</th><th>产品名称</th><th>下单数量</th><th>提交后状态</th><th>操作</th>' +
      '</tr></thead><tbody>';
    manualRows.forEach(function(r, i) {
      var st = manualRowStatus(r);
      var catOptions = MANUAL_CATEGORIES.map(function(c) {
        return '<option value="' + esc(c) + '"' + (r.品类 === c ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('');
      var catSelect = '<select class="preview-input" data-manual-field="品类" data-manual-index="' + i + '">' +
        '<option value=""' + (!r.品类 ? ' selected' : '') + '>请选择</option>' + catOptions + '</select>';
      var statusCls = st.exists ? 'pill warn' : 'pill ok';
      html += '<tr>' +
        '<td>' + catSelect + '</td>' +
        '<td><input class="preview-input" data-manual-field="工厂" data-manual-index="' + i + '" value="' + esc(r.工厂) + '"></td>' +
        '<td><input class="preview-input mono" data-manual-field="订单号" data-manual-index="' + i + '" value="' + esc(r.订单号) + '"></td>' +
        '<td><input class="preview-input mono" data-manual-field="SKU编码" data-manual-index="' + i + '" value="' + esc(r.SKU编码) + '"></td>' +
        '<td><input class="preview-input" data-manual-field="产品名称" data-manual-index="' + i + '" value="' + esc(r.产品名称) + '"></td>' +
        '<td><input class="preview-input num" type="number" min="0" step="1" data-manual-field="下单数量" data-manual-index="' + i + '" value="' + esc(r.下单数量) + '"></td>' +
        '<td><span class="' + statusCls + '">' + esc(st.text) + '</span>；剩余 ' + num(st.afterRemain) + '</td>' +
        '<td><button type="button" class="preview-delete-btn" data-manual-delete="' + i + '">删除</button></td>' +
        '</tr>';
    });
    if (!manualRows.length) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">点击下方「添加一行」开始手动录入</td></tr>';
    }
    html += '</tbody></table></div>';
    var noCatCount = manualRows.filter(function(r) { return !r.品类; }).length;
    var emptyRequired = manualRows.filter(function(r) { return !r.订单号 || !r.SKU编码 || !parseNumberLike(r.下单数量); }).length;
    var submitDisabled = !manualRows.length || noCatCount > 0 || emptyRequired > 0;
    var hint = '';
    if (noCatCount > 0) hint = '有 <strong>' + noCatCount + '</strong> 行未选择品类';
    else if (emptyRequired > 0) hint = '有 <strong>' + emptyRequired + '</strong> 行缺少订单号、SKU编码或下单数量';
    else hint = '确认后同一 SKU 会自动追加到已有库存';
    html += '<div class="update-bar">' +
      '<button type="button" class="btn-primary" id="addManualRowBtn" style="background:var(--bg2);color:var(--ink);box-shadow:none;border:1px solid var(--rule)">+ 添加一行</button>' +
      '<button type="button" class="btn-primary" id="applyManualBtn"' + (submitDisabled ? ' disabled' : '') + '>确认提交</button>' +
      '<button type="button" id="clearManualBtn">清空全部</button>' +
      '<span class="hint">' + hint + '</span>' +
      '</div>';
    container.innerHTML = html;
    bindManualEvents();
  }

  function bindManualEvents() {
    var container = document.getElementById('manualEntryContainer');
    if (!container) return;
    container.querySelectorAll('[data-manual-field]').forEach(function(input) {
      input.addEventListener('change', function() {
        var idx = parseInt(input.getAttribute('data-manual-index'), 10);
        var field = input.getAttribute('data-manual-field');
        if (!manualRows[idx]) return;
        manualRows[idx][field] = field === '下单数量' ? parseNumberLike(input.value) : input.value.trim();
        renderManualEntry();
      });
    });
    container.querySelectorAll('[data-manual-delete]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-manual-delete'), 10);
        manualRows.splice(idx, 1);
        renderManualEntry();
      });
    });
    var addBtn = document.getElementById('addManualRowBtn');
    if (addBtn) addBtn.addEventListener('click', function() {
      manualRows.push(emptyManualRow());
      renderManualEntry();
    });
    var applyBtn = document.getElementById('applyManualBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyManualUpdate);
    var clearBtn = document.getElementById('clearManualBtn');
    if (clearBtn) clearBtn.addEventListener('click', function() {
      manualRows = [];
      renderManualEntry();
    });
  }

  function applyManualUpdate() {
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows) return;
    var validRows = manualRows.filter(function(r) {
      return r.品类 && r.订单号 && r.SKU编码 && parseNumberLike(r.下单数量) > 0;
    });
    if (!validRows.length) {
      showManualPreview('error', '没有有效的录入行，请检查品类、订单号、SKU编码和下单数量是否填写完整。');
      return;
    }
    var existingMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.品类 + '|' + r.订单号 + '|' + r.SKU编码;
      if (existingMap[key] === undefined) existingMap[key] = i;
    });
    var grouped = {};
    validRows.forEach(function(o) {
      var key = o.品类 + '|' + o.订单号 + '|' + o.SKU编码;
      if (!grouped[key]) grouped[key] = { 品类: o.品类, 订单号: o.订单号, SKU编码: o.SKU编码, 产品名称: o.产品名称, 工厂: o.工厂, 数量: 0, 行数: 0 };
      grouped[key].数量 += parseNumberLike(o.下单数量);
      grouped[key].行数++;
      if (o.产品名称 && !grouped[key].产品名称) grouped[key].产品名称 = o.产品名称;
    });
    var addedCount = 0, appendedCount = 0;
    Object.values(grouped).forEach(function(g) {
      var key = g.品类 + '|' + g.订单号 + '|' + g.SKU编码;
      if (existingMap[key] !== undefined) {
        data.rows[existingMap[key]].工厂总订单 += g.数量;
        data.rows[existingMap[key]].订单原始行数 = (data.rows[existingMap[key]].订单原始行数 || 0) + g.行数;
        if (g.产品名称 && !data.rows[existingMap[key]].产品名称) data.rows[existingMap[key]].产品名称 = g.产品名称;
        appendedCount++;
      } else {
        data.rows.push({
          品类: g.品类,
          工厂: g.工厂 || '莱克',
          订单号: g.订单号,
          订单日期: '',
          SKU编码: g.SKU编码,
          型号: g.SKU编码,
          产品名称: g.产品名称,
          品名: g.产品名称,
          客户: '',
          抬头: '',
          单位: '',
          单价: 0,
          总金额: 0,
          工厂总订单: g.数量,
          已发货数量: 0,
          工厂剩余数量: g.数量,
          发货进度: 0,
          状态: '待发货',
          出货次数: 0,
          最晚发货: '',
          出货去向: '',
          订单原始行数: g.行数
        });
        addedCount++;
      }
    });
    data.meta.orderSource = '手动录入';
    data.meta.orderRows = Number(data.meta.orderRows || 0) + validRows.length;
    data.meta.generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    rebuildSummaries(data);
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save(false);
    window.LAIKE_APP.refresh();
    manualRows = [];
    renderManualEntry();
    showManualPreview('success', '<div class="preview-header"><h3>手动录入完成，待一键保存</h3><p>已将手动录入的订单数据更新到库存：新增 <strong>' + addedCount + '</strong> 个 SKU，追加 <strong>' + appendedCount + '</strong> 个已有 SKU。工厂总订单 <strong>' + num(data.summary.工厂总订单) + '</strong>，已发货 <strong>' + num(data.summary.已发货数量) + '</strong>，工厂剩余 <strong>' + num(data.summary.工厂剩余数量) + '</strong>。' + (saved ? '当前浏览器已暂存，请点击下方"一键保存"同步云端。' : '注意：本地暂存失败，请不要关闭页面。') + '</p></div>');
    setSaveStatus('已有手动录入更新，待一键保存云端', 'bad');
    setTimeout(function() {
      var el = document.getElementById('manualUploadPreview');
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    }, 5000);
  }

  function showManualPreview(type, html) {
    var el = document.getElementById('manualUploadPreview');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'upload-preview ' + (type === 'error' ? 'preview-error' : type === 'success' ? 'preview-success' : '');
    el.innerHTML = html;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function init() {
    var shipInput = document.getElementById('shipFileInput');
    var orderInput = document.getElementById('orderFileInput');
    var shipDrop = document.getElementById('shipDropZone');
    var orderDrop = document.getElementById('orderDropZone');
    var oneClickSaveBtn = document.getElementById('oneClickSaveBtn');

    if (shipInput) {
      shipInput.addEventListener('change', function(e) {
        if (e.target.files.length) {
          state.shipFileName = e.target.files[0].name;
          handleShipFile(e.target.files[0]);
        }
      });
    }
    if (orderInput) {
      orderInput.addEventListener('change', function(e) {
        if (e.target.files.length) {
          state.orderFileName = e.target.files[0].name;
          handleOrderFile(e.target.files[0]);
        }
      });
    }
    if (shipDrop) {
      setupDragDrop(shipDrop, shipInput, function(file) {
        state.shipFileName = file.name;
        handleShipFile(file);
      });
    }
    if (orderDrop) {
      setupDragDrop(orderDrop, orderInput, function(file) {
        state.orderFileName = file.name;
        handleOrderFile(file);
      });
    }
    if (oneClickSaveBtn) oneClickSaveBtn.addEventListener('click', oneClickSave);
    var undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', function() {
      if (!window.LAIKE_STORAGE || !window.LAIKE_STORAGE.hasBackup || !window.LAIKE_STORAGE.hasBackup()) {
        setSaveStatus('没有可恢复的上一步数据', 'bad');
        return;
      }
      if (!confirm('确定恢复到上一步数据？当前未保存的更改将丢失。')) return;
      var ok = window.LAIKE_STORAGE.undo();
      if (ok) {
        setSaveStatus('已恢复到上一步，正在刷新页面...', 'ok');
        setTimeout(function() { location.reload(); }, 600);
      } else {
        setSaveStatus('恢复失败，请重试', 'bad');
      }
    });
    renderManualEntry();
  }

  function deleteOrder(orderNo, category) {
    var data = window.LAIKE_DASHBOARD_DATA;
    if (!data || !data.rows) return;
    var matchRows = data.rows.filter(function(r) { return r.订单号 === orderNo && r.品类 === category; });
    if (!matchRows.length) {
      alert('未找到订单：' + category + ' / ' + orderNo);
      return;
    }
    if (!confirm('确定删除整张订单？\n品类：' + category + '\n订单号：' + orderNo + '\n包含 ' + matchRows.length + ' 个SKU行\n该订单的所有库存数据将一并删除。')) return;
    /* 备份当前数据 */
    try {
      var old = localStorage.getItem('laike_inventory_dashboard_saved_data_v1');
      if (old) localStorage.setItem('laike_inventory_dashboard_backup_v1', old);
    } catch (e) {}
    /* 删除该订单的所有行 */
    data.rows = data.rows.filter(function(r) { return !(r.订单号 === orderNo && r.品类 === category); });
    /* 重新计算汇总 */
    rebuildSummaries(data);
    /* 保存并刷新 */
    if (window.LAIKE_STORAGE && window.LAIKE_STORAGE.save) {
      window.LAIKE_STORAGE.save(false);
    }
    if (window.LAIKE_APP && window.LAIKE_APP.refresh) {
      window.LAIKE_APP.refresh();
    }
    setSaveStatus('已删除订单 ' + orderNo + '，数据已更新', 'ok');
  }

  window.LAIKE_UPLOAD = { deleteOrder: deleteOrder };

  function setupDragDrop(zone, input, handler) {
    zone.addEventListener('click', function() { input.click(); });
    zone.querySelectorAll('.upload-preview').forEach(function(preview) {
      preview.addEventListener('click', function(e) { e.stopPropagation(); });
    });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        handler(e.dataTransfer.files[0]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
