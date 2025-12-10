var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        order: null, //请求的订单数据
        orderPrices: null, //请求的订单价格数据
        invoiceToggle: true, //写发票抬头开关
        payWithPoints: true, //是否使用积分支付
        maxWord: 0,
        text: '不开发票',
        enterAddressPage: false,
        firstEnter: true, //是否第一次进入页面
        invoice_title: '个人',
        taxpayer: '',
        invoice_desc: '不开发票',
        formData: {
            user_note: '',
        }
    },

    onLoad: function (options) {
        var that = this;
        that.setData({ goods: options });
        that.requestCart2();
        //可用余额实时刷新    
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
        }, true, false);
    },

    //重新加载数据
    onShow: function () {
        this.setData({ order: this.data.order, text: this.data.text});
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            var address = wx.getStorageSync('cart:cart2:address');
            if (address !== '') {
                wx.removeStorageSync('cart:cart2:address');
            }
            this.requestCart2(address); //改变地址要重新请求数据
        } 
        this.data.firstEnter = false;
    },

    /** 获取用户收货地址 */
    getDefaultAddress: function () {
        var that = this;
        request.get('/api/User/ajaxAddressList', {
            success: function (res) {
                if (res.data.result.length > 0) {
                    var address = res.data.result[0] || null;
                    that.setData({ 'order.userAddress': address });
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                }else {
                    that.checkAddressList();
                }
            }
        });
    },

    requestCart2: function (address) {
        var that = this;
        request.post('/api/cart/integral', {
            failRollback: true,
            data: {
                goods_id: this.data.goods.goods_id,
                item_id: this.data.goods.item_id,
                goods_num: this.data.goods.goods_num,
                action: this.data.goods.action,
            },
            success: function (res) {
                that.setData({ order: res.data.result });              
                that.setData({ 'order.cartList': [res.data.result.goods] });
                if (address) {
                    that.setData({ 'order.userAddress': address });
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                } else if (wx.getStorageSync('goodsInfo:goodsInfo:address')) {
                    that.setData({ 'order.userAddress': wx.getStorageSync('goodsInfo:goodsInfo:address') });
                    wx.removeStorageSync('goodsInfo:goodsInfo:address');
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                }
                else {
                    that.getDefaultAddress();
                } 
            },
            failStatus: function (res) {
                if (res.data.status == -1) {
                    that.setData({ order: null });
                    that.checkAddressList();
                }
                return false;
            }
        });
    },

    checkAddressList: function () {
        var that = this;
        if (!that.data.order || that.data.order.userAddress == null) {
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

    /** 显示发票信息 */
    showInvoice: function () {
        wx.navigateTo({
            url: '../../cart/invoice/invoice',
        })
    },



    keyUpChangeNum: function (e) {
        this.setData({
            maxWord: e.detail.value.length
        });
    },

    /** 请求计算价格 */
    calculatePrice: function (formData, submitOrder) {
        var that = this;
        if (typeof formData == 'undefined') {
            formData = that.data.formData;
        } else {
            that.data.formData = formData;
        }
        if (!!!that.data.order.userAddress) {
            return app.showTextWarining('请添加地址', function () {
                that.setData({ enterAddressPage: true })
                wx.navigateTo({
                    url: '../../user/address_list/address_list',
                })
            });
        }

        var postData = {
            address_id: that.data.order.userAddress.address_id,
            invoice_title: that.data.invoice_title ? that.data.invoice_title : '',
            taxpayer: that.data.taxpayer ? that.data.taxpayer : '',
            invoice_desc: that.data.invoice_desc ? that.data.invoice_desc : '',
            act: submitOrder ? 'submit_order' : '',
            goods_id: this.data.goods.goods_id,
            item_id: this.data.goods.item_id,
            goods_num: this.data.goods.goods_num,
            user_note: formData.user_note,
        };
        request.post('/api/cart/integral2', {
            data: postData,
            success: function (res) {
                if (!submitOrder) {
                    that.setData({ orderPrices: res.data.result })
                    return;
                }
                if (that.data.orderPrices.order_amount <= 0) {
                    wx.setStorageSync('order:order_list:update', true);
                    wx.redirectTo({
                        url: '/pages/payment/payment/payment?order_sn=' + res.data.result + '&order_amount=' + that.data.orderPrices.total_amount
                    });
                    return;
                }
                common.jumpToCart4({
                    order_sn: res.data.result,
                    order_amount: that.data.orderPrices.order_amount,
                }, 1);
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

    /** 提交订单 */
    submitForm: function (e) {
        var submitOrder = (e.detail.target.id == 'submitOrder') ? true : false;
        this.calculatePrice(e.detail.value, submitOrder);
    },

    enterAddressPage: function () {
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=select' });
    }

})