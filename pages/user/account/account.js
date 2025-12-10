// account.js
var app = getApp();

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        userInfo: []
    },

    onShow: function () {
        var that = this;

        app.getUserInfo(function (userInfo) {
            that.setData({
                userInfo: userInfo
            });
        }, true, false); 
    }

})