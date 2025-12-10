// order_list.js
var app = getApp();
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        statuses: [
            { name: "未付款", status: '0' },
            { name: "已付款", status: '1,2' },
            { name: "已完成", status: '3' }
        ],
        activeStatus: '0',
        orders: null,
        currentPage: 1
    },

    onLoad: function (options) {
        var status = typeof options.status == 'undefined' ? this.data.activeStatus : options.status;
        load.init(this, '', 'orders');
        this.requestOrders(status);
    },

    changeTab: function (e) {
        this.resetData();
        this.requestOrders(e.currentTarget.dataset.status);
    },

    requestOrders: function (status) {
        var that = this;
        var requestUrl = '/api/distribut/order_list?status=' + status + '&p=' + that.data.currentPage;
        this.setData({ activeStatus: status });
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            res.data.result.forEach(function (val, index, arr) {
                val.createTimeFormat = util.formatTime(val.create_time);
                val.goods_list.forEach(function (val2, index2, arr2) {
                    val2.distributRatio = (val2.commission / val2.goods_price * 100).toFixed(1);
                });
            });
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestOrders(this.data.activeStatus);
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.requestOrders(this.data.activeStatus);
    },

    /** 重置数据 */
    resetData: function () {
        this.data.orders = null;
        this.data.currentPage = 1;
        load.resetConfig();
    },
});