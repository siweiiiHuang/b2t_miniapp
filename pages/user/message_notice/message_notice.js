// message_notice.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
Page({
    data: {
        url: app.globalData.setting.url,
        messageList: null,
        store_name: setting.appName,
    },

    onShow: function (options) {
        this.getMessageList();
    },

    getMessageList:function(){
        var that = this;
        request.get('/index.php?m=Api&c=Message&a=message_notice', {
            success: function (res) {
                res.data.result.forEach(function (val, index, arr) {
                    if (val.type == 0) {
                        val.url = "/pages/user/message_release/message_release";
                    } else if (val.type == 1) {
                        val.url = "/pages/user/active_mesg/active_mesg";
                    } else if (val.type == 2) {
                        val.url = "/pages/user/message_logistics/message_logistics";
                    }
                });
                that.setData({ messageList: res.data.result });
            }
        });
    }
});