var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');

Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    order: null,
    optionIsGoup: false, //是否是拼团
    user_note: '',
    options: null,
    flag: true,
    currentTime: (new Date()).getTime() / 1000
  },



  onLoad: function(options) {
    var isGoup = typeof options.isGoup == 'undefined' ? false : options.isGoup;
    this.setData({
      optionIsGoup: isGoup,
      options: options
    });
    this.requestOrderDetail(options.order_id);
    wx.removeStorageSync('order:order_detail:update');
  },



  onShow: function() {
    if (wx.getStorageSync('order:order_detail:update')) {
      wx.removeStorageSync('order:order_detail:update');
      this.requestOrderDetail(this.data.order.order_id);
    }
  },

  requestOrderDetail: function(order_id) {
    var that = this;
    var url = '/api/order/order_detail?id=' + order_id
    if (that.data.optionIsGoup) {
      url = '/api/order/team_detail?order_id=' + order_id
    }
    request.get(that.data.url + url, {
      success: function(res) {
        var order = res.data.result.order;
        order.addTimeFormat = util.format(order.add_time);
        if (order.vrorders_code) {
          order.vrorders_code.forEach(function(value, index) {
            value.vr_indate = util.format(value.vr_indate);
            value.vr_usetime = util.format(value.vr_usetime);
          })
        }

        //自提订单检查是否全部已评论，是则交易完成
        let status = 1;
        let submit_order = res.data.result.order.order_goods;
        for (let i = 0; i < submit_order.length; i++) {
          if (submit_order[i]['is_comment'] == 0) {
            status = 0;
          }
        }

        that.setData({
          submit_comment_status: status,
          order: order,
          orders: res.data.result,
          user_note: unescape(order.user_note),
        });
      }
    });
  },

  contactService: function() {
    app.getConfig(function(res) {
      var phone = common.getConfigByName(res.config, 'phone');
      if (phone) {
        app.confirmBox('请联系客服：' + phone, function() {
          wx.makePhoneCall({
            phoneNumber: phone,
          });
        });
      }
    });
  },

  /** 取消订单 */
  cancelOrder: function(e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '是否取消订单？',
      success: function(res) {
        if (res.confirm) {
          request.post('/api/user/cancelOrder', {
            data: {
              order_id: orderId
            },
            success: function(res) {
                if (res.data.status == 1){
                    app.showSuccess('取消成功',function(){
                        that.requestOrderDetail(orderId);
                    });
                }
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

  /** 确认收货 */
  confirmOrder: function(e) {
    var that = this;
    var orderId = this.data.order.order_id;
    wx.showModal({
      title: '确定已收货？',
      success: function(res) {
        if (res.confirm) {
          request.post('/api/user/orderConfirm', {
            data: {
              order_id: orderId
            },
            success: function(res) {
              app.showSuccess(res.data.msg, function() {
                that.requestOrderDetail(orderId);
                wx.setStorageSync('order:order_list:update', true);
              });
            }
          });
        }
      }
    });
  },

  /** 立即付款 */
  jumpToCart4: function(e) {
    if (this.data.optionIsGoup) {
      wx.navigateTo({
        url: '/pages/team/team_confirm/team_confirm?orderSn=' + this.data.order.order_sn + '&orderPay=true',
      })
    } else {
      var orderAmount = this.data.order.order_amount;
      if (this.data.order.pay_tail_btn) { //预售订单的支付尾款
        orderAmount = this.data.order.total_amount - this.data.order.paid_money;
      }
      common.jumpToCart4({
        order_sn: this.data.order.order_sn,
        order_amount: orderAmount,
      }, 1);
    }
  },

  checkTeam: function() {
    wx.navigateTo({
      url: '/pages/team/team_detail/team_detail?foundId=' + this.data.orders.order_team_found.found_id + '&goods_id=' + this.data.order.order_goods[0].goods_id,
    });
  },

  //申请售后
  applySale: function(e) {
    var recId = e.currentTarget.dataset.recid;
    return wx.navigateTo({
      url: '/pages/user/return_goods/return_goods?rec_id=' + recId
    });
  },

  //查看退款
  checkReturn: function(e) {
    var returnId = e.currentTarget.dataset.returnid;
    wx.navigateTo({
      url: '/pages/user/return_goods_info/return_goods_info?id=' + returnId
    });
  },

  //去评论
  commentGoods: function() {
    wx.navigateTo({
      url: '/pages/user/comment/comment?status=0'
    });
  },

  //自提点拨打联系电话
  submit_phone: function(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone
    })
  },
  showModel: function() {
    this.setData({
      flag: false
    })
  },
  closeModel: function() {
    this.setData({
      flag: true
    })
  }
});