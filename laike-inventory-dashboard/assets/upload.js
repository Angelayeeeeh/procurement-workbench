(function() {
  var state = {
    shipParsed: null,
    orderParsed: null,
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
      var y = v.getFullYear(), m = String(v.getMonth() + 1).padStart(2, '0'), d = String(v.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }
    return String(v).trim();
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

  function parseExcel(file, cb) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        cb(null, rows);
      } catch (err) {
        cb(err);
      }
    };
    reader.onerror = function() { cb(new Error('文件读取失败')); };
    reader.readAsArrayBuffer(file);
  }

  function detectShipCols(headers) {
    var cols = {};
    cols.orderNo = findCol(headers, ['预订单IBOC号码', 'IBOC', '预订单']);
    cols.sku = findCol(headers, ['匹配型号', '型号', 'GY']);
    cols.shipQty = findCol(headers, ['发货数量', '发货']);
    if (cols.shipQty === -1) cols.shipQty = findCol(headers, ['数量']);
    cols.date = findCol(headers, ['日期']);
    cols.dest = findCol(headers, ['地名', '去向', '目的地']);
    cols.product = findCol(headers, ['货品名称', '品名', '货品']);
    cols.rowId = findCol(headers, ['行号', '序号']);
    return cols;
  }

  function detectOrderCols(headers) {
    var cols = {};
    cols.category = findCol(headers, ['品类', '类别']);
    cols.orderNo = findCol(headers, ['订单号']);
    cols.sku = findCol(headers, ['GY号', 'GY']);
    cols.qty = findCol(headers, ['数量']);
    cols.product = findCol(headers, ['产品名称及型号', '产品名称', '产品']);
    cols.customer = findCol(headers, ['客户']);
    cols.entity = findCol(headers, ['抬头']);
    cols.factory = findCol(headers, ['工厂']);
    cols.unit = findCol(headers, ['单位']);
    return cols;
  }

  function handleShipFile(file) {
    parseExcel(file, function(err, rows) {
      if (err) { showPreview('error', '出货表解析失败：' + err.message); return; }
      if (rows.length < 2) { showPreview('error', '出货表没有数据行'); return; }
      var headers = rows[0].map(function(h) { return String(h || '').trim(); });
      var cols = detectShipCols(headers);
      var missing = [];
      if (cols.orderNo === -1) missing.push('订单号(IBOC)');
      if (cols.sku === -1) missing.push('型号(GY号)');
      if (cols.shipQty === -1) missing.push('发货数量');
      if (missing.length) {
        showPreview('error', '出货表缺少必要列：' + missing.join('、') + '。检测到的表头：' + headers.join('、'));
        return;
      }
      var parsed = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length === 0) continue;
        var orderNo = String(r[cols.orderNo] || '').trim();
        var sku = String(r[cols.sku] || '').trim();
        var qty = Number(r[cols.shipQty]) || 0;
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
      state.pendingType = 'shipment';
      matchAndPreviewShipments(parsed, file.name);
    });
  }

  function matchAndPreviewShipments(parsed, fileName) {
    var data = window.LAIKE_DASHBOARD_DATA;
    var indexMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.订单号 + '|' + r.SKU编码;
      if (!indexMap[key]) indexMap[key] = [];
      indexMap[key].push(i);
    });
    var matched = {};
    var unmatched = [];
    var matchedCount = 0;
    parsed.forEach(function(s) {
      var key = s.订单号 + '|' + s.SKU编码;
      var idxs = indexMap[key];
      if (idxs && idxs.length) {
        idxs.forEach(function(idx) {
          if (!matched[idx]) matched[idx] = { qty: 0, dates: [], dests: {}, count: 0 };
          matched[idx].qty += s.发货数量;
          matched[idx].count++;
          if (s.发货日期) matched[idx].dates.push(s.发货日期);
          if (s.地名) matched[idx].dests[s.地名] = true;
        });
        matchedCount++;
      } else {
        unmatched.push(s);
      }
    });
    var matchedRows = [];
    Object.keys(matched).forEach(function(idx) {
      var row = data.rows[parseInt(idx)];
      var m = matched[idx];
      var sortedDates = m.dates.sort();
      var destList = Object.keys(m.dests);
      var destText = destList.length <= 4 ? destList.join('、') : destList.slice(0, 4).join('、') + '等' + destList.length + '项';
      matchedRows.push({
        品类: row.品类,
        订单号: row.订单号,
        SKU编码: row.SKU编码,
        产品名称: row.产品名称,
        工厂总订单: row.工厂总订单,
        原已发货: row.已发货数量,
        新增发货: m.qty,
        更新后发货: row.已发货数量 + m.qty,
        更新后剩余: row.工厂总订单 - (row.已发货数量 + m.qty),
        出货次数: m.count,
        最晚发货: sortedDates.length ? sortedDates[sortedDates.length - 1] : '',
        出货去向: destText
      });
    });
    showShipPreview(matchedRows, unmatched, parsed.length, fileName);
  }

  function showShipPreview(matchedRows, unmatched, total, fileName) {
    var zeroRemainCount = matchedRows.filter(function(r) { return r.更新后剩余 === 0; }).length;
    var negativeRemainCount = matchedRows.filter(function(r) { return r.更新后剩余 < 0; }).length;
    var html = '<div class="preview-header">' +
      '<h3>出货表智能识别结果</h3>' +
      '<p>文件：<strong>' + esc(fileName) + '</strong>；共识别 <strong>' + total + '</strong> 行出货记录，匹配到 <strong>' + matchedRows.length + '</strong> 个订单-SKU，未匹配 <strong>' + unmatched.length + '</strong> 行。</p>' +
      '</div>';
    if (zeroRemainCount || negativeRemainCount) {
      html += '<p class="neg" style="margin:10px 0 0;font-weight:700">提醒：识别结果中有 <strong>' + zeroRemainCount + '</strong> 个 SKU 更新后剩余数量为 0，<strong>' + negativeRemainCount + '</strong> 个 SKU 更新后剩余数量小于 0，请确认无误后再上传。</p>';
    }
    if (matchedRows.length) {
      html += '<div class="table-wrap" style="max-height:320px"><table><thead><tr>' +
        '<th>品类</th><th>订单号</th><th>SKU编码</th><th>产品名称</th><th>工厂总订单</th><th>原已发货</th><th>本次新增</th><th>更新后发货</th><th>更新后剩余</th><th>出货次数</th>' +
        '</tr></thead><tbody>';
      matchedRows.forEach(function(r) {
        var remainCls = r.更新后剩余 <= 0 ? ' neg' : '';
        html += '<tr>' +
          '<td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.产品名称) + '</td>' +
          '<td class="num">' + num(r.工厂总订单) + '</td><td class="num">' + num(r.原已发货) + '</td><td class="num">' + num(r.新增发货) + '</td>' +
          '<td class="num">' + num(r.更新后发货) + '</td><td class="num' + remainCls + '">' + num(r.更新后剩余) + '</td><td class="num">' + num(r.出货次数) + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }
    if (unmatched.length) {
      html += '<h4 style="margin:16px 0 8px">未匹配出货（' + unmatched.length + ' 行）</h4>';
      html += '<div class="table-wrap" style="max-height:200px"><table><thead><tr><th>发货日期</th><th>订单号</th><th>SKU编码</th><th>货品名称</th><th>地名</th><th>发货数量</th></tr></thead><tbody>';
      unmatched.forEach(function(r) {
        html += '<tr><td>' + esc(r.发货日期) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.货品名称) + '</td><td>' + esc(r.地名) + '</td><td class="num">' + num(r.发货数量) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '<div class="update-bar">' +
      '<button class="btn-primary" id="applyShipBtn">确认上传并扣减库存</button>' +
      '<button id="cancelUpdateBtn">取消</button>' +
      '<span class="hint">请先核对识别结果；点击确认后才会追加本次出货并重新计算剩余库存</span>' +
      '</div>';
    showPreview('ok', html);
    document.getElementById('applyShipBtn').addEventListener('click', function() { applyShipmentUpdate(); });
    document.getElementById('cancelUpdateBtn').addEventListener('click', clearPreview);
  }

  function applyShipmentUpdate() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var parsed = state.shipParsed;
    if (!parsed) return;
    var indexMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.订单号 + '|' + r.SKU编码;
      if (!indexMap[key]) indexMap[key] = [];
      indexMap[key].push(i);
    });
    var unmatched = [];
    var matched = {};
    parsed.forEach(function(s) {
      var key = s.订单号 + '|' + s.SKU编码;
      var idxs = indexMap[key];
      if (idxs && idxs.length) {
        idxs.forEach(function(idx) {
          if (!matched[idx]) matched[idx] = { qty: 0, dates: [], dests: {}, count: 0 };
          matched[idx].qty += s.发货数量;
          matched[idx].count++;
          if (s.发货日期) matched[idx].dates.push(s.发货日期);
          if (s.地名) matched[idx].dests[s.地名] = true;
        });
      } else {
        unmatched.push({
          发货日期: s.发货日期,
          订单号: s.订单号,
          SKU编码: s.SKU编码,
          货品名称: s.货品名称,
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
    data.unmatched = unmatched;
    data.meta.shipSource = state.shipFileName || '用户上传出货表';
    data.meta.shipRows = Number(data.meta.shipRows || 0) + parsed.length;
    data.meta.generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    rebuildSummaries(data);
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save();
    window.LAIKE_APP.refresh();
    clearPreview();
    showPreview('success', '<div class="preview-header"><h3>扣减并保存完成</h3><p>已将本次出货追加到现有已发货数量，并扣减对应库存。工厂总订单 <strong>' + num(data.summary.工厂总订单) + '</strong>，已发货 <strong>' + num(data.summary.已发货数量) + '</strong>，工厂剩余 <strong>' + num(data.summary.工厂剩余数量) + '</strong>。' + (saved ? '最新数据已保存，下次打开会自动读取。' : '注意：本地保存失败，请不要关闭页面，先联系处理。') + '</p></div>');
    setTimeout(clearPreview, 5000);
  }

  function handleOrderFile(file) {
    parseExcel(file, function(err, rows) {
      if (err) { showPreview('error', '订单表解析失败：' + err.message); return; }
      if (rows.length < 2) { showPreview('error', '订单表没有数据行'); return; }
      var headers = rows[0].map(function(h) { return String(h || '').trim(); });
      var cols = detectOrderCols(headers);
      var missing = [];
      if (cols.orderNo === -1) missing.push('订单号');
      if (cols.sku === -1) missing.push('GY号');
      if (cols.qty === -1) missing.push('数量');
      if (missing.length) {
        showPreview('error', '订单表缺少必要列：' + missing.join('、') + '。检测到的表头：' + headers.join('、'));
        return;
      }
      var parsed = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length === 0) continue;
        var qty = Number(r[cols.qty]) || 0;
        var orderNo = String(r[cols.orderNo] || '').trim();
        var sku = String(r[cols.sku] || '').trim();
        if (!orderNo && !sku && !qty) continue;
        parsed.push({
          品类: cols.category >= 0 ? String(r[cols.category] || '').trim() : '未分类',
          订单号: orderNo,
          SKU编码: sku,
          数量: qty,
          产品名称: cols.product >= 0 ? String(r[cols.product] || '').trim() : '',
          客户: cols.customer >= 0 ? String(r[cols.customer] || '').trim() : '',
          抬头: cols.entity >= 0 ? String(r[cols.entity] || '').trim() : '',
          工厂: cols.factory >= 0 ? String(r[cols.factory] || '').trim() : '莱克',
          单位: cols.unit >= 0 ? String(r[cols.unit] || '').trim() : ''
        });
      }
      state.orderParsed = parsed;
      state.pendingType = 'order';
      matchAndPreviewOrders(parsed, file.name);
    });
  }

  function matchAndPreviewOrders(parsed, fileName) {
    var data = window.LAIKE_DASHBOARD_DATA;
    var existingMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.品类 + '|' + r.订单号 + '|' + r.SKU编码;
      existingMap[key] = i;
    });
    var grouped = {};
    parsed.forEach(function(o) {
      var key = o.品类 + '|' + o.订单号 + '|' + o.SKU编码;
      if (!grouped[key]) grouped[key] = { 品类: o.品类, 订单号: o.订单号, SKU编码: o.SKU编码, 数量: 0, 产品名称: o.产品名称, 客户: o.客户, 抬头: o.抬头, 工厂: o.工厂, 单位: o.单位, 行数: 0 };
      grouped[key].数量 += o.数量;
      grouped[key].行数++;
    });
    var newOrders = [];
    var updatedOrders = [];
    Object.values(grouped).forEach(function(g) {
      var key = g.品类 + '|' + g.订单号 + '|' + g.SKU编码;
      if (existingMap[key] !== undefined) {
        var row = data.rows[existingMap[key]];
        updatedOrders.push({
          品类: g.品类,
          订单号: g.订单号,
          SKU编码: g.SKU编码,
          产品名称: row.产品名称,
          原总订单: row.工厂总订单,
          新增数量: g.数量,
          更新后总订单: row.工厂总订单 + g.数量,
          已发货: row.已发货数量,
          更新后剩余: row.工厂总订单 + g.数量 - row.已发货数量
        });
      } else {
        newOrders.push(g);
      }
    });
    showOrderPreview(newOrders, updatedOrders, Object.keys(grouped).length, fileName);
  }

  function showOrderPreview(newOrders, updatedOrders, total, fileName) {
    var zeroRemainCount = updatedOrders.filter(function(r) { return r.更新后剩余 === 0; }).length;
    var negativeRemainCount = updatedOrders.filter(function(r) { return r.更新后剩余 < 0; }).length;
    var html = '<div class="preview-header">' +
      '<h3>订单表智能识别结果</h3>' +
      '<p>文件：<strong>' + esc(fileName) + '</strong>；共识别 <strong>' + total + '</strong> 个品类-订单-SKU，其中新增 <strong>' + newOrders.length + '</strong> 个，追加 <strong>' + updatedOrders.length + '</strong> 个。</p>' +
      '</div>';
    if (zeroRemainCount || negativeRemainCount) {
      html += '<p class="neg" style="margin:10px 0 0;font-weight:700">提醒：识别结果中有 <strong>' + zeroRemainCount + '</strong> 个 SKU 更新后剩余数量为 0，<strong>' + negativeRemainCount + '</strong> 个 SKU 更新后剩余数量小于 0，请确认无误后再上传。</p>';
    }
    if (newOrders.length) {
      html += '<h4 style="margin:16px 0 8px">新增订单-SKU（' + newOrders.length + ' 个）</h4>';
      html += '<div class="table-wrap" style="max-height:260px"><table><thead><tr><th>品类</th><th>订单号</th><th>SKU编码</th><th>产品名称</th><th>客户</th><th>工厂</th><th>数量</th></tr></thead><tbody>';
      newOrders.forEach(function(r) {
        html += '<tr><td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.产品名称) + '</td><td>' + esc(r.客户) + '</td><td>' + esc(r.工厂) + '</td><td class="num">' + num(r.数量) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    if (updatedOrders.length) {
      html += '<h4 style="margin:16px 0 8px">追加到已有订单-SKU（' + updatedOrders.length + ' 个）</h4>';
      html += '<div class="table-wrap" style="max-height:260px"><table><thead><tr><th>品类</th><th>订单号</th><th>SKU编码</th><th>产品名称</th><th>原总订单</th><th>新增数量</th><th>更新后总订单</th><th>已发货</th><th>更新后剩余</th></tr></thead><tbody>';
      updatedOrders.forEach(function(r) {
        var remainCls = r.更新后剩余 <= 0 ? ' neg' : '';
        html += '<tr><td>' + esc(r.品类) + '</td><td class="mono">' + esc(r.订单号) + '</td><td class="mono">' + esc(r.SKU编码) + '</td><td class="text">' + esc(r.产品名称) + '</td><td class="num">' + num(r.原总订单) + '</td><td class="num">' + num(r.新增数量) + '</td><td class="num">' + num(r.更新后总订单) + '</td><td class="num">' + num(r.已发货) + '</td><td class="num' + remainCls + '">' + num(r.更新后剩余) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    if (!newOrders.length && !updatedOrders.length) {
      html += '<p>没有识别到有效订单数据。</p>';
    }
    html += '<div class="update-bar">' +
      '<button class="btn-primary" id="applyOrderBtn">确认上传并累计订单</button>' +
      '<button id="cancelUpdateBtn">取消</button>' +
      '<span class="hint">请先核对识别结果；点击确认后才会累计订单，已发货数量保持不变</span>' +
      '</div>';
    showPreview('ok', html);
    document.getElementById('applyOrderBtn').addEventListener('click', function() { applyOrderUpdate(); });
    document.getElementById('cancelUpdateBtn').addEventListener('click', clearPreview);
  }

  function applyOrderUpdate() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var parsed = state.orderParsed;
    if (!parsed) return;
    var existingMap = {};
    data.rows.forEach(function(r, i) {
      var key = r.品类 + '|' + r.订单号 + '|' + r.SKU编码;
      if (existingMap[key] === undefined) existingMap[key] = i;
    });
    var grouped = {};
    parsed.forEach(function(o) {
      var key = o.品类 + '|' + o.订单号 + '|' + o.SKU编码;
      if (!grouped[key]) grouped[key] = { 品类: o.品类, 订单号: o.订单号, SKU编码: o.SKU编码, 数量: 0, 产品名称: o.产品名称, 客户: o.客户, 抬头: o.抬头, 工厂: o.工厂, 单位: o.单位, 行数: 0 };
      grouped[key].数量 += o.数量;
      grouped[key].行数++;
    });
    Object.values(grouped).forEach(function(g) {
      var key = g.品类 + '|' + g.订单号 + '|' + g.SKU编码;
      if (existingMap[key] !== undefined) {
        data.rows[existingMap[key]].工厂总订单 += g.数量;
        data.rows[existingMap[key]].订单原始行数 += g.行数;
      } else {
        data.rows.push({
          品类: g.品类,
          工厂: g.工厂,
          订单号: g.订单号,
          SKU编码: g.SKU编码,
          产品名称: g.产品名称,
          客户: g.客户,
          抬头: g.抬头,
          单位: g.单位,
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
    data.meta.orderRows = Number(data.meta.orderRows || 0) + parsed.length;
    data.meta.generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    rebuildSummaries(data);
    var saved = window.LAIKE_STORAGE && window.LAIKE_STORAGE.save && window.LAIKE_STORAGE.save();
    window.LAIKE_APP.refresh();
    clearPreview();
    showPreview('success', '<div class="preview-header"><h3>累计并保存完成</h3><p>已将上传的订单数据累计到现有数据，已发货数量保持不变。工厂总订单 <strong>' + num(data.summary.工厂总订单) + '</strong>，已发货 <strong>' + num(data.summary.已发货数量) + '</strong>，工厂剩余 <strong>' + num(data.summary.工厂剩余数量) + '</strong>。' + (saved ? '最新数据已保存，下次打开会自动读取。' : '注意：本地保存失败，请不要关闭页面，先联系处理。') + '</p></div>');
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
    var el = document.getElementById('uploadPreview');
    el.style.display = 'block';
    el.className = 'upload-preview ' + (type === 'error' ? 'preview-error' : type === 'success' ? 'preview-success' : '');
    el.innerHTML = html;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearPreview() {
    var el = document.getElementById('uploadPreview');
    el.style.display = 'none';
    el.innerHTML = '';
  }

  function init() {
    var shipInput = document.getElementById('shipFileInput');
    var orderInput = document.getElementById('orderFileInput');
    var shipDrop = document.getElementById('shipDropZone');
    var orderDrop = document.getElementById('orderDropZone');

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
  }

  function setupDragDrop(zone, input, handler) {
    zone.addEventListener('click', function() { input.click(); });
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
