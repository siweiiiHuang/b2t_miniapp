var app = getApp()
const util = require('../../../utils/util.js')

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        order: null
    },

    onLoad: function (param) {
      console.log('param', param)
        this.setData({ order: param });
      if (param.take_time){
        var take_time = util.formatTime(param.take_time)
          this.setData({ 
            'order.take_time': take_time
            });
      }
    },

    lookOrder: function () {
        if (this.data.order.order_type == 5) {
            wx.setStorageSync('virtual:virtual_list:update', true);
            wx.redirectTo({ url: '/pages/virtual/virtual_list/virtual_list' });
        } else if (this.data.order.order_type == 6) {
            wx.setStorageSync('team:order_list:update', true);
            //wx.redirectTo({ url: '/pages/team/team_order/team_order' });
          console.log(this.data)
            if (this.data.order.found_id>0){
                wx.redirectTo({ url: '/pages/team/team_detail/team_detail?foundId=' + this.data.order.found_id });
          }else{
                wx.redirectTo({ url: '/pages/team/team_detail/team_detail?order_id=' + this.data.order.order_id });
          }
          
        } else if (this.data.order.order_type == 8) {
            wx.setStorageSync('order:bargain_order_list:update', true);
            wx.redirectTo({ url: '/pages/Bargain/order_list/order_list' });
        } 
        else if (this.data.order.order_type == 9) {
          wx.setStorageSync('order:shop_order_list:update', true);
          wx.redirectTo({ url: '/pages/shop_order/shop_order_list/shop_order_list' });
        } else {
            // 直接跳转到订单详情页面，而不是订单列表
            wx.redirectTo({ url: '/pages/user/order_detail/order_detail?order_id=' + this.data.order.order_id });
        }
    },

  beSpeakOrder:function(){
    wx.setStorageSync('order:bespeak_list:update', true);
    wx.redirectTo({ url: '/pages/bespeak/bespeak_list/bespeak_list' });
  }

})