var app = getApp();
var setting = app.globalData.setting;
var request = app.request;

Page({
  data: {
    url: setting.url,
    resourceUrl: setting.resourceUrl,
    order:null
  },

  onLoad: function (options) {
    var that = this;
    this.setData({ orderId: options.order_id });
    this.requestCancelOrder();
  },

  /** 已付款未发货的取消订单 */
  requestCancelOrder: function () {
    var that = this;
    request.post('/api/order/cancel_order_info', {
      data: {
        order_id: that.data.orderId,
      },
      success: function (res) {
        that.setData({
          order:res.data.result
        })
      }
    });
  },

  

});