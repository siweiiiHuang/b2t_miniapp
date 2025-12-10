var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        optionOrderPay: false, //是否是订单支付
        optionOrderSn: '', //订单sn
        address: null,
        mOrder: null, //原始订单数据(用来判断该订单是否已经选择了地址)
        order: null, //请求的订单数据
        goods: null,
        coupons: null, //可用的优惠券
        userInfo: null, //用户信息
        maxWord: 0,
        enterAddressPage: false,
      available_integral:0,//使用的积分
        firstEnter: true, //是否第一次进入页面
        coupon: null, //已使用的优惠券
        goodsInputNum: 1, //商品数量
        formData: {
            pay_points: '',
            user_money: '',
            user_note: '',
        },
        foundId:0,
    },

    onLoad: function (options) {
        var that = this
        var orderPay = typeof options.orderPay == 'undefined' ? false : options.orderPay;
        var orderSn = typeof options.orderSn == 'undefined' ? '' : options.orderSn;
        var foundId = typeof options.found_id == 'undefined' ? '' : options.found_id;
        this.setData({ 
            foundId: foundId,
            optionOrderPay: orderPay,
            optionOrderSn: orderSn,
            userInfo: wx.getStorageSync('app:userInfo') 
        });
        this.requestTeamOrder();
        //加载积分使用配置
        app.getConfig(function (res) {
            var is_use = common.getConfigByName(res.config, 'is_use_integral');
            if (0 == is_use) {
                that.setData({ 'userInfo.pay_points': 0 })
            }
        });
    },

    //重新加载数据
    onShow: function () {
        this.setData({ order: this.data.order });
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            var address = wx.getStorageSync('team:confirm:address');
            if (address !== '') {
                wx.removeStorageSync('team:confirm:address');
            }
            this.requestTeamOrder(address); //改变地址要重新请求数据
        } else if (!this.data.firstEnter && this.checkAddressList()) {
            var conponUse = wx.getStorageSync('team:confirm:cid');
            this.setData({ coupon: conponUse });
            this.calculatePrice();
        }
        this.data.firstEnter = false;
    },
    /** 获取用户收货地址 */
    getDefaultAddress: function () {
        var that = this;
        request.get('/api/User/ajaxAddressList', {
            success: function (res) {            
                    var address = res.data.result.length > 0? res.data.result[0] : null;
                    that.setData({ 'address': address });
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }                
            }
        });
    },

    requestTeamOrder: function (address) {
        var that = this;
        var data={
            order_sn: this.data.optionOrderSn,
        };
        request.get('/api/Team/order', {
            failRollback: true,
            data: data,
            success: function (res) {
                var result = res.data.result;         
                that.setData({ mOrder: result.order });
                that.setData({ order: result.order });
                that.setData({ goods: result.order_goods });
                that.setData({ goodsInputNum: result.order_goods.goods_num });
                that.setData({ coupons: result.userCartCouponList });
                // that.setData({ userInfo: result.userInfo });
                if (address) {
                    that.setData({ 'address': address });
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                }
                else {
                    that.getDefaultAddress();
                } 
            },
            failStatus: function (res) {
                if (res.data.status == 0) {
                    wx.showModal({
                        title: res.data.msg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                that.enterAddressPage();
                            } else {
                                wx.navigateBack();
                            }
                        },
                        fail: function () {
                            wx.navigateBack();
                        }
                    });
                }
                return false;
            }
        });
    },

    /** 检查是否已经选了地址 */
    checkAddressList: function () {
        var that = this;
        console.log(that.data.address)
        if (that.data.address == null) {
            wx.showModal({
                title: '请先填写或选择收货地址~',
                success: function (res) {
                    if (res.confirm) {
                        that.enterAddressPage();
                    } else {
                        wx.navigateBack();
                    }
                },
                fail: function () {
                    wx.navigateBack();
                }
            });
            return false;
        }
        return true;
    },


    
    keyUpChangeNum:function(e) {
        this.setData({
            maxWord: e.detail.value.length
        });
    },

    /** 减少购买的商品数量 */
    reduce: function(){
        var num = this.data.goodsInputNum - 1;
        if (num < 1) {
            num = 1;
        }
        this.setData({ goodsInputNum: num });
        this.calculatePrice();
    },

    /** 增加购买的商品数量 */
    add: function(){
        var num = this.data.goodsInputNum + 1;
        this.setData({ goodsInputNum: num });
        this.calculatePrice();
    },

    /** 输入购买的数量 */
    inputNum: function (e) {
        var num = Number(e.detail.value);
        if (num < 1) {
            num = 1;
        }
        this.setData({ goodsInputNum: num });
        this.calculatePrice();
    },

    /** 请求计算价格，无入参则使用已保存的参数 */
    calculatePrice: function () {
        var that = this;
        var formData = that.data.formData;
        var postData = {
            address_id: that.data.address.address_id,
            order_id: that.data.order.order_id,
            goods_num: that.data.goodsInputNum,
            coupon_id: that.data.coupon ? that.data.coupon.id : '',
            user_note: formData.user_note,
          pay_points: formData.pay_points ? formData.pay_points : that.data.available_integral,
            user_money: formData.user_money ? formData.user_money : 0,
        };
        request.get('/api/Team/getOrderInfo', {
            data: postData,
            success: function (res) {
                var result = res.data.result;
                that.setData({ order: result.order });
                that.setData({ goods: result.order_goods });
                that.setData({ coupons: result.couponList });
                if (result.order.integral_msg){
                    app.showTextWarining(result.order.integral_msg)
                    that.setData({ pay_points_val: result.order.total_amount * result.order.point_rate * (result.order.proportion /100)})
                }
                
            },
        });
    },

    /** 提交订单 */
    submitForm: function (e) {
        var that = this;
        var formData = e.detail.value;
        this.data.formData = formData;
        if (e.detail.target.id != 'submitOrder') {
            this.calculatePrice();
            return;
        }
        var postData = {
            address_id: this.data.address.address_id,
            order_id: this.data.order.order_id,
            goods_num: this.data.goodsInputNum,
            coupon_id: this.data.coupon ? this.data.coupon.id : '',
            user_note: formData.user_note,
          pay_points: formData.pay_points ? formData.pay_points : that.data.available_integral,
            user_money: formData.user_money ? formData.user_money : 0, 
            act: 'submit_order',
        };
        request.post('/api/Team/getOrderInfo', {
            data: postData,
            success: function (res) {
                console.log(that.data.foundId)
                var result = res.data.result;
                if (result.order_amount <= 0) {
                    wx.setStorageSync('team:order_list:update', true);
                    wx.redirectTo({
                        url: '/pages/payment/payment/payment?order_sn=' + that.data.optionOrderSn + '&order_amount=' + that.data.order.total_amount + '&order_type=6' + '&order_id=' + that.data.order.order_id + '&found_id=' + that.data.foundId
                    });
                } else {
                    var params = {
                        order_sn: that.data.optionOrderSn,
                        order_type: 6,
                        order_id: that.data.order.order_id,
                        found_id: that.data.foundId,
                    };
                    var url = '/pages/cart/cart4/cart4?' + util.Obj2Str(params);
                    wx.redirectTo({ url: url });
                }
            },
            failStatus: function (res) {
                if (res.data.status == -1) {
                    wx.showModal({
                        title: '请先设置支付密码',
                        success: function (res) {
                            if (res.confirm) {
                                wx.navigateTo({ url: '/pages/user/userinfo/userinfo' });
                            } else {
                                wx.navigateBack();
                            }
                        },
                        fail: function () {
                            wx.navigateBack();
                        }
                    });
                }
            }
        });
    },

    /** 使用优惠券 */
    useCoupon: function (e) {
        var num = this.data.coupons ? this.data.coupons.length : 0;
        if(num <= 0){
            return app.showTextWarining("无可用优惠券");
        }
        var params={
            lid: this.data.coupon ? this.data.coupon.id : '0',
        };
        wx.navigateTo({ url: '/pages/team/team_coupon/team_coupon?' + util.Obj2Str(params) });
    },

    enterAddressPage: function() {
        if (this.data.optionOrderPay && this.data.mOrder.province != 0){ //订单支付并且之前已经选择地址
            return;
        }
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=teamSelect' });
    },
  //使用积分
  user_pay_points: function (d) {
    var e = Object();
    if (d.detail.value) {
      e.pay_points = this.data.userInfo.pay_points;
    } else {
      e.pay_points = 0;
    }

    this.setData({ available_integral: e.pay_points, formData:e })
    this.calculatePrice();
  }
})