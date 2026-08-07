(function() {
  var style = getComputedStyle(document.documentElement);
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  /* 【图表样式优化】统一柔和清爽配色，区分度高 */
  var palette = ['#2A9D8F', '#E8B4B8', '#F4A261', '#6B5B95', '#E9C46A'];

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

    /* 订单状态分布 — 环形饼图 */
    statusChart.setOption({
      animation: false,
      color: palette,
      tooltip: { trigger: 'item', appendToBody: true, textStyle: { fontSize: 13 } },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 16
      },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '42%'],
        data: sumByStatus(),
        label: {
          color: ink,
          fontSize: 12,
          formatter: '{b}: {c}'
        },
        itemStyle: { borderColor: bg2, borderWidth: 2 }
      }]
    });

    /* 各品类工厂总订单、已发货与剩余 — 柱状图 */
    var data = window.LAIKE_DASHBOARD_DATA;
    var cats = data.categorySummary.map(function(d) { return d.品类; });
    categoryChart.setOption({
      animation: false,
      color: palette,
      tooltip: { trigger: 'axis', appendToBody: true, textStyle: { fontSize: 13 } },
      legend: {
        top: 0,
        textStyle: { color: muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 14
      },
      grid: { left: 55, right: 20, top: 48, bottom: 68 },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: {
          color: ink,
          fontSize: 11,
          rotate: 30,
          interval: 0
        },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        { name: '工厂总订单', type: 'bar', barMaxWidth: 36, data: data.categorySummary.map(function(d) { return d.工厂总订单; }) },
        { name: '已发货数量', type: 'bar', barMaxWidth: 36, data: data.categorySummary.map(function(d) { return d.已发货数量; }) },
        { name: '工厂剩余数量', type: 'bar', barMaxWidth: 36, data: data.categorySummary.map(function(d) { return d.工厂剩余数量; }) }
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
