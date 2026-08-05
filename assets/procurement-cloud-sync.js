(function () {
  'use strict';

  var panel = document.getElementById('cloudSyncPanel');
  var cfg = window.PROCUREMENT_SUPABASE_CONFIG || {};
  var client = null;
  var session = null;
  var recordId = cfg.recordId || 'procurement-main';
  var ANTIFAKE_LOCAL_KEY = 'of_antifake_local_records_v1';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function setStatus(text, type) {
    var el = document.getElementById('cloudStatusText');
    if (!el) return;
    el.className = 'cloud-status' + (type ? ' ' + type : '');
    el.textContent = text;
  }

  function readAntiFakeLocalData() {
    try {
      var rows = JSON.parse(localStorage.getItem(ANTIFAKE_LOCAL_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      return [];
    }
  }

  function writeAntiFakeLocalData(rows) {
    localStorage.setItem(ANTIFAKE_LOCAL_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
  }

  function makeSnapshot() {
    if (!window.PROCUREMENT_WORKBENCH || !window.PROCUREMENT_WORKBENCH.getState) {
      throw new Error('采购工作台还没有加载完成。');
    }
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      workbench: window.PROCUREMENT_WORKBENCH.getState(),
      antiFakeLocalRecords: readAntiFakeLocalData()
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot || !snapshot.workbench) {
      throw new Error('云端数据格式不正确。');
    }
    window.PROCUREMENT_WORKBENCH.setState(snapshot.workbench);
    writeAntiFakeLocalData(snapshot.antiFakeLocalRecords || []);
    if (window.PROCUREMENT_WORKBENCH.toast) {
      window.PROCUREMENT_WORKBENCH.toast('云端数据已同步到本机');
    }
  }

  function renderDisabled() {
    if (!panel) return;
    panel.innerHTML =
      '<strong>云端同步：未配置</strong>' +
      '<div class="cloud-status">请先配置 <span class="mono">assets/procurement-supabase-config.js</span>，并在 Supabase 执行 <span class="mono">procurement-supabase-setup.sql</span>。配置前仍会保存在当前浏览器本地。</div>';
  }

  function renderAuth() {
    if (!panel) return;
    if (!session) {
      panel.innerHTML =
        '<strong>云端同步：需要登录</strong>' +
        '<div class="cloud-row">' +
          '<input id="cloudEmail" type="email" placeholder="Supabase 登录邮箱" autocomplete="username">' +
          '<input id="cloudPassword" type="password" placeholder="密码" autocomplete="current-password">' +
          '<button class="btn primary" id="cloudLoginBtn" type="button">登录云端</button>' +
        '</div>' +
        '<div id="cloudStatusText" class="cloud-status">登录后可把采购工作台数据和防伪标上传库同步到云端数据库。</div>';
      document.getElementById('cloudLoginBtn').addEventListener('click', signIn);
      return;
    }
    panel.innerHTML =
      '<strong>云端同步：已登录</strong>' +
      '<div class="cloud-row">' +
        '<span class="cloud-status ok">账号：' + esc(session.user.email || '') + '</span>' +
        '<button class="btn" id="cloudLoadBtn" type="button">读取云端最新数据</button>' +
        '<button class="btn primary" id="cloudSaveBtn" type="button">保存当前数据到云端</button>' +
        '<button class="btn" id="cloudLogoutBtn" type="button">退出登录</button>' +
      '</div>' +
      '<div id="cloudStatusText" class="cloud-status">云端已连接。建议在大量编辑后点击“保存当前数据到云端”。</div>';
    document.getElementById('cloudLoadBtn').addEventListener('click', function () { loadData(true); });
    document.getElementById('cloudSaveBtn').addEventListener('click', function () { saveData(true); });
    document.getElementById('cloudLogoutBtn').addEventListener('click', signOut);
  }

  function signIn() {
    var email = document.getElementById('cloudEmail').value.trim();
    var password = document.getElementById('cloudPassword').value;
    if (!email || !password) {
      setStatus('请先输入邮箱和密码。', 'bad');
      return;
    }
    setStatus('正在登录云端...', '');
    client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) {
        setStatus('登录失败：' + res.error.message, 'bad');
        return;
      }
      session = res.data.session;
      renderAuth();
      loadData(true);
    });
  }

  function signOut() {
    client.auth.signOut().then(function () {
      session = null;
      renderAuth();
    });
  }

  function loadData(showMessage) {
    if (!client || !session) {
      if (showMessage) setStatus('请先登录云端。', 'bad');
      return Promise.resolve(false);
    }
    if (showMessage) setStatus('正在读取云端最新数据...', '');
    return client
      .from('procurement_snapshots')
      .select('data, updated_at')
      .eq('id', recordId)
      .maybeSingle()
      .then(function (res) {
        if (res.error) {
          if (showMessage) setStatus('读取失败：' + res.error.message, 'bad');
          return false;
        }
        if (!res.data || !res.data.data) {
          if (showMessage) setStatus('云端还没有数据。请先点击“保存当前数据到云端”。', '');
          return false;
        }
        try {
          applySnapshot(res.data.data);
          if (showMessage) setStatus('已读取云端最新数据。云端更新时间：' + (res.data.updated_at || ''), 'ok');
          return true;
        } catch (err) {
          if (showMessage) setStatus('读取后应用失败：' + err.message, 'bad');
          return false;
        }
      });
  }

  function saveData(showMessage) {
    if (!client || !session) {
      if (showMessage) setStatus('请先登录云端。', 'bad');
      return Promise.resolve(false);
    }
    var snapshot;
    try {
      snapshot = makeSnapshot();
    } catch (err) {
      if (showMessage) setStatus(err.message, 'bad');
      return Promise.resolve(false);
    }
    if (showMessage) setStatus('正在保存到云端...', '');
    return client
      .from('procurement_snapshots')
      .upsert({
        id: recordId,
        data: snapshot,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      }, { onConflict: 'id' })
      .then(function (res) {
        if (res.error) {
          if (showMessage) setStatus('云端保存失败：' + res.error.message, 'bad');
          return false;
        }
        if (showMessage) setStatus('已保存到云端。其他设备登录后可读取这份最新数据。', 'ok');
        return true;
      });
  }

  window.PROCUREMENT_CLOUD = {
    loadData: loadData,
    saveData: saveData
  };

  if (!panel) return;
  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    renderDisabled();
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey);
  client.auth.getSession().then(function (res) {
    session = res.data && res.data.session;
    renderAuth();
    if (session) loadData(false);
  });

  client.auth.onAuthStateChange(function (event, newSession) {
    session = newSession;
    renderAuth();
    if (session && event === 'SIGNED_IN') loadData(true);
  });
})();
