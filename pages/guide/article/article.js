var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var common = require('../../../utils/common.js');
var WxParse = require('../../../utils/wxParse/wxParse.js');

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        content: '',
        title: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.requestArticle(options.id);
    },

    requestArticle: function (id) {
        var that = this;
        request.get('/api/article/info', {
            data: { article_id: id },
            failRollback: true,
            success: function (res) {
                WxParse.wxParse('content', 'html', res.data.result.content, that, 6);
                common.wxParseAddFullImageUrl(that, 'content');
                wx.setNavigationBarTitle({ title: res.data.result.title });
            }
        });
    },

});