(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var statusChart = null;
  var categoryChart = null;

  function sumByStatus() {
    var data = window.LAIKE_DASHBOARD_DATA;
    var map = {};
    data.rows.forEach(function(r) {
      map[r.状态] = (map[r.状态] || 0) + 1;
    });
    return Object.keys(map).map(function(k) { return { name: k, value: map[k] }; });
  }

  function initCharts() {
    var statusEl = document.getElementById('chart-status');
    var categoryEl = document.getElementById('chart-category');

    if (statusChart) { statusChart.dispose(); }
    if (categoryChart) { categoryChart.dispose(); }

    statusChart = echarts.init(statusEl, null, { renderer: 'svg' });
    categoryChart = echarts.init(categoryEl, null, { renderer: 'svg' });

    statusChart.setOption({
      animation: false,
      color: [accent, accent2, muted, accent + '99', accent2 + '99'],
      tooltip: { trigger: 'item', appendToBody: true },
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '43%'],
        data: sumByStatus(),
        label: { color: ink, formatter: '{b}: {c}' },
        itemStyle: { borderColor: bg2, borderWidth: 2 }
      }]
    });

    var data = window.LAIKE_DASHBOARD_DATA;
    var cats = data.categorySummary.map(function(d) { return d.品类; });
    categoryChart.setOption({
      animation: false,
      color: [accent, accent2, muted],
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: { top: 0, textStyle: { color: muted } },
      grid: { left: 50, right: 18, top: 52, bottom: 36 },
      xAxis: { type: 'category', data: cats, axisLabel: { color: muted }, axisLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      series: [
        { name: '工厂总订单', type: 'bar', data: data.categorySummary.map(function(d) { return d.工厂总订单; }) },
        { name: '已发货数量', type: 'bar', data: data.categorySummary.map(function(d) { return d.已发货数量; }) },
        { name: '工厂剩余数量', type: 'bar', data: data.categorySummary.map(function(d) { return d.工厂剩余数量; }) }
      ]
    });
  }

  function refresh() {
    if (!statusChart || !categoryChart) { initCharts(); return; }
    var data = window.LAIKE_DASHBOARD_DATA;

    statusChart.setOption({
      series: [{
        data: sumByStatus()
      }]
    });

    var cats = data.categorySummary.map(function(d) { return d.品类; });
    categoryChart.setOption({
      xAxis: { data: cats },
      series: [
        { data: data.categorySummary.map(function(d) { return d.工厂总订单; }) },
        { data: data.categorySummary.map(function(d) { return d.已发货数量; }) },
        { data: data.categorySummary.map(function(d) { return d.工厂剩余数量; }) }
      ]
    });
  }

  initCharts();

  window.addEventListener('resize', function() {
    if (statusChart) statusChart.resize();
    if (categoryChart) categoryChart.resize();
  });

  window.LAIKE_CHARTS = { refresh: refresh, init: initCharts };
})();
