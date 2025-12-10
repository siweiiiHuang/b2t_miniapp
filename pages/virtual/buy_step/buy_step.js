var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        goods: null,
        order_price: null,
        mobile: '',
    },

    onLoad: function (options) {
        var that = this;
        options.price = parseFloat(options.price.replace(',', '.')).toFixed(2).split('.')
        this.setData({ goods: options });
        var m = 0, s1 = this.data.goods.price.join('.'), s2 = this.data.goods.goods_num.toString();
        var order_price = (parseFloat(s1) * parseFloat(s2)).toFixed(2);
        this.setData({ order_price: order_price });
        app.getUserInfo(function(user) {
            that.setData({ mobile: user.mobile });
        });
    },

    submitOrder: function (e) {
        var that = this;
        var mobile = e.detail.value.mobile;
        var phoneReg = /(^1[3|4|5|7|8]\d{9}$)|(^09\d{8}$)/;
        if (!phoneReg.test(mobile)){
            app.showTextWarining("手机号不合法");
            return;
        }
        request.post('/api/virtual/add_order/add_order', {
            data: {
                goods_id: this.data.goods.goods_id,
                item_id: this.data.goods.item_id,
                goods_num: this.data.goods.goods_num,
                mobile: e.detail.value.mobile,
                user_note: e.detail.value.user_note,
            },
            success: function (res) {
                var params = {
                    order_sn: res.data.result,
                    order_amount: that.data.goods.price * that.data.goods.goods_num,
                    order_type: 5,
                };
                var url = '/pages/cart/cart4/cart4?' + util.Obj2Str(params);
                wx.redirectTo({ url: url });
            }
        });
    }

});