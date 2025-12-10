// comment.js
var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');
var request = app.request;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl + '/static/images/user68.jpg',
        categories: [           
        ],
        cat_id: 0,
        list: null,
        currentPage: 1 ,
        width:875,
    },

    onLoad: function (options) {
        this.getNewsCat();     
        load.init(this, '', 'list');
    },

    getNewsCat:function(){        
        var that = this;
        request.get('/Api/News/cat_list',{
            success: function (res) {
                that.setData({ categories: res.data.result, width: 175 * res.data.result.length })
                that.requestNewsList(res.data.result.length > 0 ? res.data.result[0].cat_id : 0);
            }
        })
    },

    onShow: function () {
        if (wx.getStorageSync('news:comment:update')) {
            wx.setStorageSync('news:comment:update', false);
            this.resetData();
            this.requestNewsList(this.data.cat_id);
        }
    },

    changeTab: function (e) {
        this.resetData();
        this.requestNewsList(e.currentTarget.dataset.id);
    },

    requestNewsList: function (cat_id) {
        var that = this;
        that.setData({ cat_id: cat_id });
        var requestUrl = that.data.url + '/Api/News/newsList?cat_id=' + cat_id + '&page=' + that.data.currentPage;  
        load.request(requestUrl, function (res) {
            that.data.currentPage++;       
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestNewsList(this.data.cat_id);
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.requestNewsList(this.data.cat_id);
    },

    /** 重置数据 */
    resetData: function () {
        this.data.list = null;
        this.data.currentPage = 1;
        load.resetConfig();
    },

    /**
    * 转发按钮
    */
    onShareAppMessage: function (res) {
        return {
            title: '资讯列表',//自定义转发标题
            path: '/pages/news/news_list/news_list?first_leader=' + wx.getStorageSync('app:userInfo')['user_id'],
        }
    }
});