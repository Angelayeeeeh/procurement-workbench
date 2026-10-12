/* 空数据模板：不含任何业务数据，供新建空白仪表盘使用 */
window.LAIKE_DASHBOARD_DATA = {
  meta: {
    orderSource: '',
    shipSource: '',
    orderRows: 0,
    shipRows: 0,
    generatedAt: '',
    matchRule: '订单表：品类 + 订单号 + GY号；出货表：预订单IBOC号码 + 匹配型号'
  },
  summary: {
    订单SKU行: 0,
    工厂总订单: 0,
    已发货数量: 0,
    工厂剩余数量: 0,
    剩余库存余额: 0,
    未匹配出货行数: 0
  },
  categorySummary: [],
  orderSummary: [],
  rows: [],
  skuSummary: [],
  unmatched: []
};
