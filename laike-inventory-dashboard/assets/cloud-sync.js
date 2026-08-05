(function() {
  var panel = document.getElementById('cloudSyncPanel');
  var cfg = window.LAIKE_SUPABASE_CONFIG || {};
  var client = null;
  var session = null;
  var recordId = cfg.recordId || 'laike-main';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function setStatus(text, type) {
    var el = document.getElementById('cloudStatusText');
    if (!el) return;
    el.className = 'cloud-status' + (type ? ' ' + type : '');
    el.textContent = text;
  }

  function renderDisabled() {
    if (!panel) return;
    panel.innerHTML =
      '<strong>云端同步：未配置</strong>' +
      '<div class="cloud-status">请先在 <span class="mono">assets/supabase-config.js</span> 填入 Supabase URL 和 anon key。配置前仍会保存在当前浏览器本地。</div>';
  }

  function renderAuth() {
    if (!panel) return;
    if (!session) {
      panel.innerHTML =
        '<strong>云端同步：需要登录</strong>' +
        '<div class="cloud-row">' +
          '<input id="cloudEmail" type="email" placeholder="邮箱" autocomplete="username" />' +
          '<input id="cloudPassword" type="password" placeholder="密码" autocomplete="current-password" />' +
          '<button id="cloudLoginBtn">登录云端</button>' +
        '</div>' +
        '<div id="cloudStatusText" class="cloud-status">登录后会自动读取云端最新库存；完成上传确认后，请点击“一键保存”同步到云端。</div>';
      document.getElementById('cloudLoginBtn').addEventListener('click', signIn);
      return;
    }
    panel.innerHTML =
      '<strong>云端同步：已登录</strong>' +
      '<div class="cloud-row">' +
        '<span class="cloud-status ok">账号：' + esc(session.user.email || '') + '</span>' +
        '<button id="cloudLoadBtn">读取云端最新数据</button>' +
        '<button id="cloudSaveBtn">保存当前数据到云端</button>' +
        '<button id="cloudLogoutBtn">退出登录</button>' +
      '</div>' +
      '<div id="cloudStatusText" class="cloud-status">云端已连接。</div>';
    document.getElementById('cloudLoadBtn').addEventListener('click', function() { loadData(true); });
    document.getElementById('cloudSaveBtn').addEventListener('click', function() { saveData(window.LAIKE_DASHBOARD_DATA, true); });
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
    client.auth.signInWithPassword({ email: email, password: password }).then(function(res) {
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
    client.auth.signOut().then(function() {
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
      .from('inventory_snapshots')
      .select('data, updated_at')
      .eq('id', recordId)
      .maybeSingle()
      .then(function(res) {
        if (res.error) {
          if (showMessage) setStatus('读取失败：' + res.error.message, 'bad');
          return false;
        }
        if (!res.data || !res.data.data) {
          if (showMessage) setStatus('云端还没有库存数据。请先确认上传一次，或点击“保存当前数据到云端”。', '');
          return false;
        }
        window.LAIKE_DASHBOARD_DATA = res.data.data;
        if (window.LAIKE_STORAGE && window.LAIKE_STORAGE.save) {
          try {
            localStorage.setItem('laike_inventory_dashboard_saved_data_v1', JSON.stringify(window.LAIKE_DASHBOARD_DATA));
          } catch (err) {}
        }
        if (window.LAIKE_APP && window.LAIKE_APP.refresh) window.LAIKE_APP.refresh();
        if (showMessage) setStatus('已读取云端最新数据。云端更新时间：' + (res.data.updated_at || ''), 'ok');
        return true;
      });
  }

  function saveData(data, showMessage) {
    if (!client || !session) {
      if (showMessage) setStatus('请先登录云端。', 'bad');
      return Promise.resolve(false);
    }
    if (!data || !data.rows) {
      if (showMessage) setStatus('当前没有可保存的数据。', 'bad');
      return Promise.resolve(false);
    }
    if (showMessage) setStatus('正在保存到云端...', '');
    return client
      .from('inventory_snapshots')
      .upsert({
        id: recordId,
        data: data,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      }, { onConflict: 'id' })
      .then(function(res) {
        if (res.error) {
          if (showMessage) setStatus('云端保存失败：' + res.error.message, 'bad');
          return false;
        }
        if (showMessage) setStatus('已保存到云端。下次打开会读取这份最新库存。', 'ok');
        return true;
      });
  }

  window.LAIKE_CLOUD = {
    saveData: saveData,
    loadData: loadData
  };

  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    renderDisabled();
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey);
  client.auth.getSession().then(function(res) {
    session = res.data && res.data.session;
    renderAuth();
    if (session) loadData(false);
  });

  client.auth.onAuthStateChange(function(event, newSession) {
    session = newSession;
    renderAuth();
    if (session && event === 'SIGNED_IN') loadData(true);
  });
})();
