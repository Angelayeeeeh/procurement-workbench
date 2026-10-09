/* 纯本地存储模式（不依赖云端）
 * 数据保存在浏览器 localStorage，可通过"导出备份文件"保存到电脑硬盘
 * 下次进入自动读取本地数据；更换电脑/浏览器时需导入备份文件恢复
 */
(function() {
  var panel = document.getElementById('cloudSyncPanel');
  var STORAGE_KEY = 'laike_inventory_dashboard_saved_data_v1';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function localInfo() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { size: 0, savedAt: '', rows: 0 };
      var size = raw.length;
      var parsed = JSON.parse(raw);
      return {
        size: size,
        savedAt: (parsed && parsed.meta && parsed.meta.savedAt) || '',
        rows: (parsed && parsed.rows) ? parsed.rows.length : 0
      };
    } catch (e) {
      return { size: 0, savedAt: '', rows: 0 };
    }
  }

  function sizeText(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function setStatus(text, type) {
    var el = document.getElementById('cloudStatusText');
    if (!el) return;
    el.className = 'cloud-status' + (type ? ' ' + type : '');
    el.textContent = text;
  }

  /* 导出全部数据为 JSON 备份文件，保存到电脑硬盘 */
  function exportBackupFile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { alert('本地暂无数据，请先上传并保存一次。'); return; }
      var data = JSON.parse(raw);
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = '莱克库存备份_' + ts + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      setStatus('已导出备份文件到电脑（下载文件夹），请妥善保管。', 'ok');
    } catch (err) {
      setStatus('导出备份失败：' + err.message, 'bad');
    }
  }

  /* 从电脑硬盘导入 JSON 备份文件恢复数据 */
  function importBackupFile(file) {
    if (!file) { setStatus('请选择备份文件', 'bad'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data || !data.rows || !data.summary) { setStatus('备份文件格式不正确', 'bad'); return; }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.LAIKE_DASHBOARD_DATA = data;
        setStatus('已从备份文件恢复数据，正在刷新页面...', 'ok');
        setTimeout(function() { location.reload(); }, 1000);
      } catch (err) {
        setStatus('导入失败：' + err.message, 'bad');
      }
    };
    reader.readAsText(file);
  }

  function renderLocal() {
    if (!panel) return;
    var info = localInfo();
    var statusText = info.savedAt
      ? '本地已保存 ' + info.rows + ' 行数据，大小 ' + sizeText(info.size) + '，保存时间 ' + info.savedAt
      : '本地暂无保存数据，请先上传订单/出库表并点击"一键保存"';
    panel.innerHTML =
      '<strong>数据存储：本地浏览器</strong>' +
      '<div class="cloud-status ok">' + esc(statusText) + '</div>' +
      '<div class="cloud-row" style="flex-wrap:wrap;gap:8px;margin-top:8px;">' +
        '<button id="localExportBtn" type="button" style="padding:8px 16px;border-radius:8px;border:1px solid var(--accent-dark);background:var(--accent-dark);color:#fff;cursor:pointer;font-size:13px;">📥 导出备份文件到电脑</button>' +
        '<label for="localImportInput" style="padding:8px 16px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;font-size:13px;">📤 导入备份文件恢复</label>' +
        '<input id="localImportInput" type="file" accept=".json,application/json" style="display:none;" />' +
      '</div>' +
      '<div id="cloudStatusText" class="cloud-status" style="margin-top:6px;">数据仅保存在当前浏览器；为防丢失，请定期点"导出备份文件"保存到电脑硬盘。换电脑/浏览器时用"导入备份文件"恢复。</div>';
    var expBtn = document.getElementById('localExportBtn');
    if (expBtn) expBtn.addEventListener('click', exportBackupFile);
    var impInput = document.getElementById('localImportInput');
    if (impInput) impInput.addEventListener('change', function() { importBackupFile(this.files[0]); });
  }

  /* LAKE_CLOUD 兼容层：oneClickSave 调用 saveData 时只做本地提示，不报错 */
  window.LAIKE_CLOUD = {
    saveData: function(data, showMessage) {
      if (showMessage) setStatus('已保存到本地浏览器。建议定期点"导出备份文件"保存到电脑硬盘。', 'ok');
      return Promise.resolve(true);
    },
    loadData: function(showMessage) {
      if (showMessage) setStatus('数据已从本地读取。', 'ok');
      return Promise.resolve(true);
    }
  };

  renderLocal();
})();
