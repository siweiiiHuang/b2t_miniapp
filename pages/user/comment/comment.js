// comment.js
var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        categories: [
            { name: "全部评价", status: 2 },
            { name: "待评价", status: 0 },
            { name: "已评价", status: 1 }
        ],
        activeStatus: 0,
        comments: null,
        currentPage: 1
    },

    onLoad: function (options) {
        var status = typeof options.status == 'undefined' ? this.data.activeStatus : options.status;
        load.init(this, '', 'comments');
        this.requestComments(status);
    },

    onShow: function () {
        if (wx.getStorageSync('user:comment:update')) {
            wx.setStorageSync('user:comment:update', false);
            this.resetData();
            this.requestComments(this.data.activeStatus);
        }
    },

    changeTab: function (e) {
        this.resetData();
        this.requestComments(e.currentTarget.dataset.status);
    },

    requestComments: function (status) {
        var that = this;
        var requestUrl = that.data.url + '/api/user/comment/status/' + status + '?p=' + that.data.currentPage;
        this.setData({ activeStatus: status });
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            res.data.result.forEach(function (val, index, arr) {
                val.payTimeFommat = util.formatTime(val.pay_time);
            });
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestComments(this.data.activeStatus);
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.requestComments(this.data.activeStatus);
    },

    /** 重置数据 */
    resetData: function () {
        this.data.comments = null;
        this.data.currentPage = 1;
        load.resetConfig();
    },

    /** 跳到评论页 */
    comment: function(e) {
        var rec_id = e.currentTarget.dataset.recid;
        var comments = this.data.comments;
        for (var i = 0; i < comments.length; i++) {
            if (comments[i].rec_id == rec_id) {
                break;
            }
        }
        if (i >= comments.length) {
            return; //没找着
        }
        var params = '?order_id=' + comments[i].order_id;
        params += '&goods_id=' + comments[i].goods_id;
        params += '&rec_id=' + comments[i].rec_id;
        params += '&goods_name=' + comments[i].goods_name;
        params += '&spec_key_name=' + comments[i].spec_key_name;
        params += '&prom_type=' + comments[i].prom_type;
        params += '&item_id=' + comments[i].item_id;
        wx.navigateTo({ url: '/pages/user/add_comment/add_comment' + params });
    }

});