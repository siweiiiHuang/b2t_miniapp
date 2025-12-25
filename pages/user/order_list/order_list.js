var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        currentTab: 0, // 当前选中的tab，0-自提取单码，1-我的订单
        searchValue: '', // 搜索框的值
        categories: [
            { name: "全部", id: 0 },
            { name: "待付款", id: 1 },
            { name: "待发货", id: 2 },
            { name: "待收货", id: 3 },
            { name: "已完成", id: 4 },
        ],
        activeCategoryId: 0,
        orderList: null, //请求的订单列表
        currentPage: 1
    },

    onLoad: function (options) {
        var id = typeof options.type == 'undefined' ? this.data.activeCategoryId : options.type;
        load.init(this, '', 'orderList');
        this.requestOrderList(id);
        wx.removeStorageSync('order:order_list:update');
    },

    onShow: function () {
        if (wx.getStorageSync('order:order_list:update')) {
            wx.setStorageSync('order:order_list:update', false);
            this.resetData();
            this.requestOrderList(this.data.activeCategoryId);
        }
    },

    // 切换tab
    switchTab: function(e) {
        const tab = parseInt(e.currentTarget.dataset.tab);
        this.setData({
            currentTab: tab
        });
        
        // 如果切换到我的订单tab，加载订单数据
        if (tab === 1 && !this.data.orderList) {
            this.requestOrderList(this.data.activeCategoryId);
        }
    },

    // 搜索输入
    onSearchInput: function(e) {
        this.setData({
            searchValue: e.detail.value
        });
    },

    // 搜索订单
    searchOrder: function() {
        const searchValue = this.data.searchValue.trim();
        if (!searchValue) {
            wx.showToast({
                title: '请输入订单编号或手机号',
                icon: 'none'
            });
            return;
        }
        
        // TODO: 这里可以添加搜索逻辑
        wx.showToast({
            title: '搜索功能开发中',
            icon: 'none'
        });
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
        var requestUrl = that.data.url + '/api/order/order_list';
        var tabType = '';
        if (categoryId == 1) {
            tabType = 'WAITPAY';
        } else if (categoryId == 2) {
            tabType = 'WAITSEND';
        } else if (categoryId == 3) {
            tabType = 'WAITRECEIVE';
        } else if (categoryId == 4) {
            tabType = 'WAITCCOMMENT'
        }
        if (tabType) {
            requestUrl += '/type/' + tabType;
        }
        this.setData({ activeCategoryId: categoryId });
        requestUrl = requestUrl + '?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            res.data.result.order_list.forEach(function (val, index, arr) {
                val.goods_sum = val.order_goods.reduce(function (sum, idx) {
                    return sum + idx.goods_num
                }, 0);
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
                            that.resetData();
                            that.requestOrderList(that.data.activeCategoryId);
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
                            app.showSuccess(res.data.msg,function(){
                                that.resetData();
                                that.requestOrderList(that.data.activeCategoryId);
                            });
                            
                        }
                    });
                }
            }
        });
    },

    /** 判断是否已申请退换货 */
    checkReturnGoodsStatus: function (e) {
        var recId = e.currentTarget.dataset.recid;
        request.get('/api/order/return_goods_status', {
            data: { rec_id: recId },
            success: function (res) {
                var returnId = res.data.result;
                if (returnId == 0) {
                    //未退换货
                    return wx.navigateTo({ 
                        url: '/pages/user/return_goods/return_goods?rec_id=' + recId
                    });
                }
                //已申请退换货
                wx.navigateTo({
                    url: '/pages/user/return_goods_info/return_goods_info?id=' + returnId
                });
            }
        });
    },

    /** 跳到cart4页面 */
    jumpToCart4: function (e) {
        var order = this.data.orderList.order_list[e.currentTarget.dataset.idx];
        common.jumpToCart4({
            order_sn: order.order_sn,
            order_amount: order.order_amount
        });
    },

    // 底部导航栏跳转
    navigateToPage(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        
        // 如果点击的是当前页面，不进行跳转
        if (index === 2) {
            return;
        }

        // 根据索引跳转到对应页面
        switch(index) {
            case 0: // 首页
                wx.reLaunch({
                    url: '/pages/index/index/index'
                });
                break;
            case 1: // 点单（购物车）
                wx.reLaunch({
                    url: '/pages/cart/cart/cart'
                });
                break;
            case 2: // 取单（订单列表）
                // 当前页面，不跳转
                break;
            case 3: // 个人中心
                wx.reLaunch({
                    url: '/pages/user/index/index'
                });
                break;
        }
    }

});