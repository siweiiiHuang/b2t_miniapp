var app = getApp();
var request = app.request;
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: app.globalData.setting.url,
        userMoney: 0,
        cashConfig: null,
        money: '',
        withdrawFee: 0.00,
        pwd: '',
    },

    onLoad: function (options) {
        this.setData({ userMoney: options.money });
        this.getCashConfig();
    },
    onShow(){
        wx.removeStorageSync('withdrawals_pay');
    },
    getCashConfig: function () {
        var that = this;
        request.post('/api/user/cash_config',{
            success: function (res) {
                that.setData({ cashConfig: res.data.result });
            }
        });
    },
    userinfoEdit:function(e){
        console.log(e)
        if (!app.globalData.userInfo.mobile){             
              app.showTextWarining('请先设置手机号码',function(){
                  wx.setStorageSync('withdrawals_pay', true);
                  wx.navigateTo({
                      url: '/pages/user/userinfo_edit/userinfo_edit?type=mobile',
                  })
              });
        }else{
            wx.navigateTo({
                url: e.currentTarget.dataset.url,
            })
        }     
    },
    bindWechat: function () {
        var that = this;
        if (that.data.cashConfig.openid == '') {
            return app.showTextWarining("请打开电脑端扫码绑定微信");
        }
    },

    withdrawMoney: function (e) {
        var money = e.detail.value;
        this.setData({ money: money });
        var m = 0, s1 = money.toString(), s2 = (this.data.cashConfig.service_ratio*0.01).toString();
        try { m += s1.split(".")[1].length } catch (e) { }
        try { m += s2.split(".")[1].length } catch (e) { }
        var fee = Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
        if (!this.data.cashConfig.service_ratio){
            this.setData({ withdrawFee: 0.00 });
        }else{
            if (fee < this.data.cashConfig.min_service_money){
                this.setData({ withdrawFee: this.data.cashConfig.min_service_money });
            } else if (fee > this.data.cashConfig.max_service_money){
                if (this.data.cashConfig.max_service_money > 0){
                    this.setData({ withdrawFee: this.data.cashConfig.max_service_money });
                }else{
                    this.setData({ withdrawFee: fee });
                }
            }else{
                this.setData({ withdrawFee: fee });
            }
        }
    },

    setPwd: function (e) {
        this.setData({ pwd: e.detail.value });
    },

    allWithdraw: function () {
        this.setData({ money: this.data.userMoney });
        var m = 0, s1 = this.data.userMoney.toString(), s2 = (this.data.cashConfig.service_ratio * 0.01).toString();
        try { m += s1.split(".")[1].length } catch (e) { }
        try { m += s2.split(".")[1].length } catch (e) { }
        var fee = Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
        if (!this.data.cashConfig.service_ratio) {
            this.setData({ withdrawFee: 0.00 });
        } else {
            if (fee < this.data.cashConfig.min_service_money) {
                this.setData({ withdrawFee: this.data.cashConfig.min_service_money });
            } else if (fee > this.data.cashConfig.max_service_money) {
                if (this.data.cashConfig.max_service_money > 0) {
                    this.setData({ withdrawFee: this.data.cashConfig.max_service_money });
                } else {
                    this.setData({ withdrawFee: fee });
                }
            } else {
                this.setData({ withdrawFee: fee });
            }
        }
    },

    submit: function () {
        var that = this;
        if (that.data.cashConfig.openid == '') {
            return app.showTextWarining("请打开电脑端扫码绑定微信");
        }

        if (that.data.money==''){
            return app.showTextWarining("请输入金额");
        }
        if (that.data.money <= 0) {
            return app.showTextWarining("请输入正确的金额");
        }
        if (that.data.pwd==''){
            return app.showTextWarining("请输入支付密码");
        }
        request.post('/api/user/withdrawals',{
            data: {
                bank_name: '微信',
                bank_card: '',
                money: that.data.money,
                paypwd: md5('TPSHOP' + that.data.pwd),
                usermoney: that.data.userMoney,
            },
            success: function (res) {
                app.showSuccess('申请成功',function(){
                    wx.navigateBack({
                        delta:1
                    })
                })
            }
        });
    },

});