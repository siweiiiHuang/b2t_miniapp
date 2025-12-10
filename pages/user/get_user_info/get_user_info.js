var app = getApp();
var request = app.request;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        requestData: null,
    },

    onLoad: function () {
        var that = this;
        wx.setStorageSync('login_user_info', true);
      wx.getSystemInfo({
        success(res) {
          that.setData({
            windowWidth: res.windowWidth,
            windowHeight: res.windowHeight,
          })
          
        }
      })
    },

    //返回的时候也可以刷新
    onShow: function () {
    },

    bindGetUserinfo:function(res){
        var that = this;
        if (res.detail.userInfo != undefined){
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                wx.setStorageSync('bind_third_login', true);
                app.globalData.wechatUser = res.detail.userInfo;
                app.auth.checkLogin(app.globalData.code, res.detail, function (loginData) {
                    app.showSuccess('登录成功', function () {
                    wx.removeStorageSync('first_leader');
                    wx.removeStorageSync('unique_id');
                    wx.removeStorageSync('login_user_info');
                    wx.navigateBack();
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }else{
            console.log('bindGetUserinfo fail . res.detail.userInfo is undefined');
        }
    },
    
    onUnload:function(){
        if (wx.getStorageSync('login_user_info') ){
            app.auth.clearAuth();
        }       
    },
});