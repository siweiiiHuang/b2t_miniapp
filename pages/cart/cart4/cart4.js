var app = getApp();
var request = app.request;
var pay = require('../../../utils/pay.js');
var util = require('../../../utils/util.js');
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        order: {}, 
        order_type: 0, //订单类型 0:普通 4:预售 5:虚拟订单 6:拼团订单 9 自提 7预约
        pay_type: [
            { 'name': '余额支付', 'checked': true, 'logo': '../../../images/balace_pay.png','pay_code':'' },
            { 'name': '微信支付', 'checked': false, 'logo': '../../../images/wx-pay.png', 'pay_code': '' }
            ],
        selected:0,
        balace:false,
        password:'',
        userInfo:{
            user_money:0
        },
        foundId:0,
    },

    onLoad: function (options) {
        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
        }, true, false); 
        var order_type = typeof options.order_type == 'undefined' ? 0 : options.order_type;
        if (order_type == 9 || order_type == 1 || order_type == 6 || order_type == 5 || order_type == 7 || order_type == 4){
            let pay_type = [
                { 'name': '余额支付', 'checked': true, 'logo': '../../../images/balace_pay.png', 'pay_code': '' },
                { 'name': '微信支付', 'checked': false, 'logo': '../../../images/wx-pay.png', 'pay_code': '' }        
            ]
            that.setData({ pay_type: pay_type });
        }else{
            request.get('/api/cart/codPay', {
                failRollback: true,
                success: function (res) {
                    if (res.data.result == 1){                        
                        that.setData({
                            pay_type: [
                                { 'name': '余额支付', 'checked': true, 'logo': '../../../images/balace_pay.png', 'pay_code': '' },
                                { 'name': '微信支付', 'checked': false, 'logo': '../../../images/wx-pay.png', 'pay_code': '' },
                                { 'name': '货到付款', 'checked': false, 'logo': '../../../images/self-pay.png', 'pay_code': '' }
                            ] });
                    }
                }
            })
        }
        that.setData({ order_type: order_type, foundId: options.found_id ? options.found_id:0,});
        if (options.order_sn){
            request.get('/api/cart/cart4', {
              data: { order_sn: options.order_sn },
                failRollback: true,
                success: function (res) {
                    var order_amount = res.data.result.order_amount;
                    if (parseFloat(order_amount) < 0.01) {
                        that.jumpSuccess();
                    }
                    that.setData({
                        order: {
                            order_id: res.data.result.order_id,
                            order_sn: options.order_sn,
                            order_amount: order_amount,                           
                        }
                    });
                }
            });
        } else {
            if (parseFloat(options.order_amount) < 0.01) {
                this.jumpSuccess();
            }
            this.setData({ order: options });
        }
    },
    radioChange(e){
        this.setData({ selected: e.detail.value})
    },
    payment: function () {
        var that = this;
        if (this.data.order && parseFloat(this.data.order.order_amount) < 0.01) {
            this.jumpSuccess();
            return;
        }

        if (that.data.selected == 0) {
            //余额支付
            if (that.data.userInfo.user_money - that.data.order.order_amount < 0 ){
                return app.showTextWarining('余额不足,请充值!');
            }else{
                that.setData({ balace: true });
            }            
        }else if (that.data.selected == 1){
            //微信支付
            pay.pay(this.data.order.order_sn, function () {
                that.jumpPaymentPage();
            });
        } else if (that.data.selected == 2){
            //货到付款
            pay.cash_delivery(this.data.order.order_id, function () {
                that.jumpPaymentPage();
            });
        }
        
    },

    jumpSuccess: function () {
        var that = this;
        app.showSuccess('下单成功', function () {
            if (that.data.order_type == 5){
                wx.redirectTo({ url: '/pages/virtual/virtual_list/virtual_list' });
            } else if (that.data.order_type == 6){
                // wx.redirectTo({ url: '/pages/team/team_order/team_order' });
              wx.redirectTo({ url: 'pages/team/team_detail/team_detail?order_id='.that.data.order.order_id });
               
            } else if (that.data.order_type == 8) {
                wx.redirectTo({ url: 'pages/Bargain/order_list/order_list' });
            }
            else{
                var pages = getCurrentPages();
                if (pages[pages.length - 2].route == 'pages/cart/cart/cart') {
                    //前一个页面是购物车页，则跳到待发货页
                    wx.redirectTo({ url: '/pages/user/order_list/order_list?type=2' });
                } else {
                    wx.setStorageSync('order:order_list:update', true);
                    wx.setStorageSync('order:order_detail:update', true);
                    wx.navigateBack();
                }
            }
        });
    },

    jumpPaymentPage: function () {
        wx.redirectTo({
            url: '/pages/payment/payment/payment?order_sn=' + this.data.order.order_sn + '&order_amount=' + this.data.order.order_amount + '&order_type=' + this.data.order_type + '&order_id=' + this.data.order.order_id + '&found_id=' + this.data.foundId 
        });
    },

    cancel:function(){
        this.setData({balace:false})
    },
    balacePay:function(){
        var that = this;
        if (!that.data.password){
            return app.showTextWarining('密码不能为空!');
        }
        if (that.data.password.length < 6) {
            return app.showTextWarining('密码错误');
        }

        request.post('/api/Payment/balancePay', {
            data: { order_sn: that.data.order.order_sn, password: md5('TPSHOP' +  that.data.password ) },
            failRollback: false,
            successReload:true,
            success: function (res) {
                if(res.data.status == 1){
                    app.showSuccess(res.data.msg,function(){
                        that.jumpPaymentPage();
                    });
                }
                else if (res.data.status == -101){
                    app.showTextWarining(res.data.msg,function(){
                        wx.reLaunch({
                            url: '/pages/index/index/index',
                        })
                    });
                }
                else {
                    app.showTextWarining(res.data.msg);
                }
            }
        });
    },
    inputPassword:function(e){
        this.setData({password:e.detail.value})
    }

})