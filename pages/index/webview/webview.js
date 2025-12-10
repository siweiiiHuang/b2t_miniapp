var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');

Page({
    data: {
        webUrl: '',
    },

    onLoad: function (options) {
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2];  //上一个页面
        var url = prevPage.data.webUrl; //取上页data里的数据
        url = request.modifyUrl(url);
        //处理webview业务域名需要添加https
        url = common.checkRequestIsHttps(url);
        this.setData({ webUrl: url + '#wechat_redirect' });
        app.showLoading(null, 1500);
    },
})