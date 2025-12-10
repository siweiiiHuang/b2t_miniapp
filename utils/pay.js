var app = getApp();
var request = app.request;

/** 微信支付 */
module.exports = {
    url: '/api/wxpay/dopay?trade_type=JSAPI',
    cash_delivery_url: '/api/Payment/pay_arrival',

    /** 充值接口 */
    rechange: function (money, success, failcb) {
        var that = this;
        request.post(this.url, {
            data: { account: money },
            success: function (res) {
                that.weixinPay(res.data.result, success, failcb);
            },
            fail: function() {
                typeof failcb == 'function' && failcb();
            },
            failStatus: function () {
                typeof failcb == 'function' && failcb();
            }
        });
    },

    /** 付款接口 */
    pay: function (orderSn, success, failcb) {
        var that = this;
        request.post(this.url, {
            data: { order_sn: orderSn },
            success: function (res) {
                that.weixinPay(res.data.result, success, failcb);
            },
            fail: function () {
                typeof failcb == 'function' && failcb();
            },
            failStatus: function () {
                typeof failcb == 'function' && failcb();
            }
        });
    },

    /** 货到付款接口 */
    cash_delivery: function (order_id, success, failcb) {
        var that = this;
        request.post(this.cash_delivery_url, {
            data: { order_id: order_id },
            success: function (res) {
                typeof success == 'function' && success();
            },
            fail: function () {
                typeof failcb == 'function' && failcb();
            },
            failStatus: function () {
                typeof failcb == 'function' && failcb();
            }
        });
    },

    /** 购买分销商等级接口 */
    distribut: function (obj, success, failcb) {
        var that = this;
        request.post(this.url, {
            data: { order_sn: obj.order_sn, level_id: obj.level_id },
            success: function (res) {
                that.weixinPay(res.data.result, success, failcb);
            },
            fail: function () {
                typeof failcb == 'function' && failcb();
            },
            failStatus: function () {
                typeof failcb == 'function' && failcb();
            }
        });
    },

    /** 小程序内部支付接口 */
    weixinPay: function (param, success, failcb) {
        wx.requestPayment({
            timeStamp: String(param.timeStamp),
            nonceStr: param.nonceStr,
            package: param.package,
            signType: param.signType,
            paySign: param.sign,
            success: function (res) {
                console.log(res);
                app.showSuccess('支付成功！', success);
            },
            fail: function (res) {
                console.log(res);
                if (res.errMsg == 'requestPayment:fail') {
                    app.showTextWarining('支付失败');
                } else if (res.errMsg == 'requestPayment:fail cancel') {
                    app.showTextWarining('您已取消支付');
                } else {
                    app.showTextWarining('支付失败：' + res.errMsg.substr('requestPayment:fail '.length));
                }
                typeof failcb == 'function' && failcb();
            },
        });
    }

}