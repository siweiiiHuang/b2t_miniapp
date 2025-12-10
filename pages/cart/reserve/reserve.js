var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        goods: null, //立即购买商品参数
        order: null, //请求的订单数据
        orderPrices: null, //请求的订单价格数据 
        maxWord: 0,
        enterAddressPage: false,
        firstEnter: true, //是否第一次进入页面
        invoice_title: '个人',
        taxpayer: '',
        invoice_desc:'不开发票',
        text:'不开发票',
        formData: {          
            pay_points: '',
            user_money: '',
            paypwd: '',
            user_note: '',
        },
       
    },

    onLoad: function (options) {
        this.setData({ goods: options });
        this.requestCart2();
        this.requestInvoice();
        this.setData({ userInfo: wx.getStorageSync('app:userInfo')})
    },

    //重新加载数据
    onShow: function () {
        this.setData({ order: this.data.order });
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            var address = wx.getStorageSync('cart:cart2:address'); 
            if (address !== '') {
                wx.removeStorageSync('cart:cart2:address');
            }
            this.requestCart2(address); //改变地址要重新请求数据
        } else if (!this.data.firstEnter && this.checkAddressList()) {
           
            this.setData({text:this.data.text});
            this.calculatePrice(); //其他操作离开页面要重新计算价格
        }
        this.data.firstEnter = false;        
    },
    /** 获取用户收货地址 */
    getDefaultAddress: function (){
        var that = this;        
            request.get('/api/User/ajaxAddressList', {
                success: function (res) {
                    if (res.data.result.length > 0) {
                        var address = res.data.result[0] || null;
                        that.setData({ 'order.userAddress': address });
                        if (that.checkAddressList()) {
                            that.calculatePrice();
                        } 
                    }else{
                        that.checkAddressList();
                    }                  
                }
            });             
    },
    /** 发票 */
    requestInvoice:function (){
        var that = this;
        request.get('/api/cart/invoice', {
            success: function (res) {
                if (res.data.result.invoice_title){
                    that.setData({
                      text: res.data.result.invoice_desc != '不开发票' ? '纸质 ( ' + res.data.result.invoice_title + '-' + res.data.result.invoice_desc + ' )' : '不开发票',    
                        invoice_title: res.data.result.invoice_title,
                        invoice_desc: res.data.result.invoice_desc,
                        taxpayer: res.data.result.taxpayer,
                    })
                }               
            },
            failStatus: function (res){
               return false
            },
        });  
    },
    requestCart2: function (address) {
        var that = this;
        var data;
        if (this.data.goods.action) { //商品立即购买跳转
            data = {
                goods_num: this.data.goods.goods_num,
                prom_id: this.data.goods.prom_id,           
            };
        } 
        request.get('/api/cart/pre_sell', {
            failRollback: true,
            data: data,
            success: function (res) {
                that.setData({ order: res.data.result });                                      
                if (address) {
                    that.setData({ 'order.userAddress': address });
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                } else if (wx.getStorageSync('goodsInfo:goodsInfo:address')){
                    that.setData({ 'order.userAddress': wx.getStorageSync('goodsInfo:goodsInfo:address') });
                    wx.removeStorageSync('goodsInfo:goodsInfo:address');
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }
                }
                else{
                    that.getDefaultAddress();
                }           
            },
            failStatus: function(res){
                if (res.data.status == 0){
                    wx.showModal({
                        title: res.data.msg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                wx.navigateBack();
                            }
                        },
                        fail: function () {
                            wx.navigateBack();
                        }
                    });
                } else if (res.data.status == -1) {
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
    showInvoice:function() {
        wx.navigateTo({
            url: '../../cart/invoice/invoice',
        })
    },


    keyUpChangeNum:function(e) {
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
                act: submitOrder ? 'submit_order' : 'order_price',
                user_note: formData.user_note,                   
                pre_sell_id: this.data.goods.prom_id,
                goods_num: this.data.goods.goods_num,
            };
        
        request.post('/api/cart/pre_sell_place', {
            data: postData,
            success: function (res) {
                if (!submitOrder) {
                    that.setData({ orderPrices: res.data.result })
                    return;
                }
                if (that.data.orderPrices.order_amount <= 0){
                    wx.setStorageSync('order:order_list:update', true);
                    wx.redirectTo({
                        url: '/pages/payment/payment/payment?order_sn=' + res.data.result + '&order_amount=' + that.data.orderPrices.total_amount +'&order_type=0'
                    });
                }else{
                    var params = {
                        order_sn: res.data.result,
                        order_type: 0,
                    };
                    var url = '/pages/cart/cart4/cart4?' + util.Obj2Str(params);
                    wx.redirectTo({ url: url });
                }
            },
            failStatus: function (res) {
                app.confirmBox(res.data.msg);
            }
        });
    },

    /** 提交订单 */
    submitForm: function (e) {
        var submitOrder = (e.detail.target.id == 'submitOrder') ? true : false;
        this.calculatePrice(e.detail.value, submitOrder);
    },   

    enterAddressPage: function() {
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=select' });
    },

})