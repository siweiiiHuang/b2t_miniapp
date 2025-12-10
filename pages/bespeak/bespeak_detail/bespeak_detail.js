var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');

Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    order: null,
    user_note: '',
    options: null,
    currentTime: (new Date()).getTime() / 1000,
    scan_pop: true, //消费券弹窗隐藏
    more_info: '',
    more_info_text: '更多信息'
  },

  onLoad: function (options) {
    this.setData({options: options });
    this.requestOrderDetail(options.order_id);
    wx.removeStorageSync('order:bespeak_detail:update');
  },

  onShow: function () {
    if (wx.getStorageSync('order:bespeak_detail:update')) {
      wx.removeStorageSync('order:bespeak_detail:update');
      this.requestOrderDetail(this.data.order.order_id);
    }
  },

  requestOrderDetail: function (order_id) {
    var that = this;
    var url = '/api/order/bespeakDetail?id=' + order_id
    request.get(that.data.url + url, {
      success: function (res) {
        var order = res.data.result.order;
        order.addTimeFormat = util.format(order.add_time);
        if (order.vrorders_code) {
          order.vrorders_code.forEach(function (value, index) {
            value.vr_indate = util.format(value.vr_indate);
            value.vr_usetime = util.format(value.vr_usetime);
          })
        }
        that.setData({
          order: order,
          orders: res.data.result,
          user_note: unescape(order.user_note),
        });
      }
    });
  },

  contactService: function () {
    app.getConfig(function (res) {
      var phone = common.getConfigByName(res.config, 'phone');
      if (phone) {
        app.confirmBox('请联系客服：' + phone, function () {
          wx.makePhoneCall({
            phoneNumber: phone,
          });
        });
      }
    });
  },

  contact: function(e){
    var phone = e.currentTarget.dataset.tel
    if (phone) {
      app.confirmBox('拨打商家电话：' + phone, function () {
        wx.makePhoneCall({
          phoneNumber: phone,
        });
      });
    }
  },

  /** 取消订单 */
  cancelOrder: function (e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '是否取消订单？',
      success: function (res) {
        if (res.confirm) {
          request.post('/api/user/cancelOrder', {
            data: { order_id: orderId },
            success: function (res) {
              that.requestOrderDetail(orderId);
              if (that.data.options.order_type == 'virtual') {
                wx.setStorageSync('virtual:virtual_list:update', true);
              } else {
                wx.setStorageSync('order:order_list:update', true);
              }

            }
          });
        }
      }
    });
  },

  /** 申请退款 */
  refoundOrder: function(e){
      wx.navigateTo({
        url: '/pages/order/refund_order/refund_order?order_id='+ e.currentTarget.dataset.id,
      })
  },

  /** 确认收货 */
  confirmOrder: function (e) {
    var that = this;
    var orderId = this.data.order.order_id;
    wx.showModal({
      title: '确定已收货？',
      success: function (res) {
        if (res.confirm) {
          request.post('/api/user/orderConfirm', {
            data: { order_id: orderId },
            success: function (res) {
              that.requestOrderDetail(orderId);
              wx.setStorageSync('order:order_list:update', true);
            }
          });
        }
      }
    });
  },

  /** 立即付款 */
  jumpToCart4: function (e) {
    if (this.data.optionIsGoup) {
      wx.navigateTo({
        url: '/pages/team/team_confirm/team_confirm?orderSn=' + this.data.order.order_sn + '&orderPay=true',
      })
    } else {
      var orderAmount = this.data.order.order_amount;
      if (this.data.order.pay_tail_btn) {//预售订单的支付尾款
        orderAmount = this.data.order.total_amount - this.data.order.paid_money;
      }
      common.jumpToCart4({
        order_sn: this.data.order.order_sn,
        order_amount: orderAmount,
      }, 1);
    }
  },

  checkTeam: function () {
    wx.navigateTo({
      url: '/pages/team/team_detail/team_detail?foundId=' + this.data.orders.order_team_found.found_id + '&goods_id=' + this.data.order.order_goods[0].goods_id,
    });
  },

  //申请售后
  applySale: function (e) {
    var recId = e.currentTarget.dataset.recid;
    return wx.navigateTo({ url: '/pages/user/return_goods/return_goods?rec_id=' + recId });
  },

  //查看退款
  checkReturn: function (e) {
    var returnId = e.currentTarget.dataset.returnid;
    wx.navigateTo({ url: '/pages/user/return_goods_info/return_goods_info?id=' + returnId });
  },

  //去评论
  commentGoods: function () {
    wx.navigateTo({ url: '/pages/user/comment/comment?status=0' });
  },

  bindGoGoodsInfo: function(){
    wx.navigateTo({
      url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + this.data.order.order_goods[0].goods_id,
    })
  },

  scanPop:function(e){
    var dataset = e.currentTarget.dataset;
    if (dataset && dataset.shop_code){
      this.setData({
        shop_code: dataset.shop_code
      })
    }
    this.setData({
      scan_pop: !this.data.scan_pop
    })
  },

  moreInfo: function(){
    this.setData({
      more_info: this.data.more_info ? '' : 'more',
      more_info_text: this.data.more_info ? '更多信息' : '收起信息' 
    })
  },

  showMap:function(){
    wx.navigateTo({
      url: '../../cart/cart2/shopDetail/shopDetail?datas=' + JSON.stringify(this.data.order.shop_order[0].shop),
    })
  }

});