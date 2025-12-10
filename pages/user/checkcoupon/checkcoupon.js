var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        coupons: null,
        lid: -1, //使用的优惠券id
    },

    onLoad: function (options) {
        var pages = getCurrentPages(); //获取页面栈
        if (pages.length > 1) {
            var prePage = pages[pages.length - 2]; //上一个页面实例对象
            for (var i = 0; i < prePage.data.coupons.length; i++) {
                prePage.data.coupons[i].coupon.addTimeFormat = util.formatTime(prePage.data.coupons[i].coupon.use_end_time);
            }
            this.setData({ coupons: prePage.data.coupons });
            console.log(prePage.data.coupons )
        }
        console.log(options.lid )
        if (typeof options.lid != 'undefined') {
            this.setData({ lid: options.lid });
        }
    },

    /** 使用优惠券 */
    useCoupon: function (e) {
        //设置cart2的变量，传递参数
        var coupon = this.data.coupons[e.currentTarget.dataset.idx];
        if (this.data.lid != coupon.id) {  //立即使用
            wx.setStorageSync('cart:cart2:cid', coupon);
        } else {  //取消使用
            wx.removeStorageSync('cart:cart2:cid');
        }
        wx.navigateBack();
    }

});