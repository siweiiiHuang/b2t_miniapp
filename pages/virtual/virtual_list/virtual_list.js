var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
var util = require('../../../utils/util.js');
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        categories: [
            { name: "全部", id: 0 },
            { name: "待付款", id: 1 },
            { name: "已付款", id: 2 },
            { name: "已完成", id: 3 },
        ],
        activeCategoryId: 0,
        orderList: null, //请求的订单列表
        currentPage: 1
    },

    onLoad: function (options) {
        console.log(options)
        var id = typeof options.type == 'undefined' ? this.data.activeCategoryId : options.type;
        load.init(this, '', 'orderList');
        this.requestOrderList(id);
        wx.removeStorageSync('virtual:virtual_list:update');
    },

    onShow: function () {
        if (wx.getStorageSync('virtual:virtual_list:update')) {
            wx.setStorageSync('virtual:virtual_list:update', false);
            this.resetData();
            this.requestOrderList(this.data.activeCategoryId);
        }
    },

    changeTab: function(e) {
        this.resetData();
        this.requestOrderList(e.currentTarget.id);
    },

    //重置数据
    resetData: function () {
        load.resetConfig();
        this.data.orderList = null;
        this.data.currentPage = 1;
    },

    /** 请求订单数据 */
    requestOrderList: function(categoryId) {
        var that = this;
        var requestUrl = '/api/virtual/order_list';
        var tabType = '';
        if (categoryId == 1) {
            tabType = 'WAITPAY';
        } else if (categoryId == 2) {
            tabType = 'PAYED';
        } else if (categoryId == 3) {
            tabType = 'FINISH';
        }
        if (tabType) {
            requestUrl += '/type/' + tabType;
        }
        this.setData({ activeCategoryId: categoryId });
        requestUrl = requestUrl + '?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            res.data.result.order_list.forEach(function (val, index, arr) {
                if (val.order_goods){
                    val.goods_sum = val.order_goods.reduce(function (sum, idx) {
                        return sum + idx.goods_num
                    }, 0);
                }
            });
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestOrderList(this.data.activeCategoryId);
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.requestOrderList(this.data.activeCategoryId);
    },

    /** 取消订单 */
    cancelOrder: function (e) {
        var that = this;
        var orderId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '是否取消订单？',
            success: function (res) {
                if (res.confirm) {
                    request.post('/api/user/cancelOrder', {
                        data: { order_id: orderId },
                        success: function (res) {
                            if (that.data.activeCategoryId == 0) {
                                that.resetData();
                                that.requestOrderList(that.data.activeCategoryId);
                            } else {
                                that.deleteOrderData(orderId);
                            }
                        }
                    });
                }
            }
        });
    },

    /** 确认收货 */
    confirmOrder: function (e) {
        var that = this;
        var orderId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确定已收货？',
            success: function (res) {
                if (res.confirm) {
                    request.post('/api/user/orderConfirm', {
                        data: { order_id: orderId },
                        success: function (res) {                            
                            app.showSuccess(res.data.msg, function () {
                                that.resetData();
                                that.requestOrderList(that.data.activeCategoryId);
                            }); 
                        }
                    });
                }
            }
        });
    },

    /** 删掉订单数据 */
    deleteOrderData: function (orderId) {
        for (var i = 0; i < this.data.orderList.order_list.length; i++) {
            if (this.data.orderList.order_list[i].order_id == orderId) {
                this.data.orderList.order_list.splice(i, 1);
                this.setData({ orderList: this.data.orderList });
                break;
            }
        }
    },

    /** 跳到cart4页面 */
    jumpToCart4: function (e) {
        var order = this.data.orderList.order_list[e.currentTarget.dataset.idx];
        common.jumpToCart4({
            order_sn: order.order_sn,
            order_type:order.prom_type,
            order_amount: order.order_amount,
            is_virtual: 1,
        });
    },

    /** 跳到评论页 */
    comment: function (e) {
        var order = this.data.orderList.order_list[e.currentTarget.dataset.idx].order_goods[0];
        var params = util.Obj2Str({
            order_id: order.order_id,
            goods_id: order.goods_id,
            goods_name: order.goods_name,
            spec_key_name: order.spec_key_name,
            rec_id: order.rec_id,
            prom_type: this.data.orderList.order_list[e.currentTarget.dataset.idx].prom_type,
            order_type:'virtual' ,
        });
        wx.navigateTo({ url: '/pages/user/add_comment/add_comment?' + params });
    }

});