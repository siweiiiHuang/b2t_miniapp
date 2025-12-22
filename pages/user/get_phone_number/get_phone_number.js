// pages/user/get_phone_number/get_phone_number.js
var app = getApp();

Page({
  data: {},

  onLoad: function (options) {
    // 页面加载
  },

  // 获取手机号
  getPhoneNumber: function (e) {
    var that = this;
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 用户同意授权，保存完整的e.detail对象（包含code、encryptedData、iv）
      var phoneDetail = e.detail;
      // 获取保存的登录信息
      var pendingLogin = app.globalData.pendingLogin;
      if (pendingLogin) {
        // 获取 first_leader
        wx.getStorage({
          key: 'first_leader',
          success: function (res) {
            // 调用登录接口，传入完整的phoneDetail
            app.auth.login(
              pendingLogin.code,
              pendingLogin.wxUser,
              pendingLogin.cb,
              res.data,
              phoneDetail
            );
          },
          fail: function () {
            // 调用登录接口，传入完整的phoneDetail
            app.auth.login(
              pendingLogin.code,
              pendingLogin.wxUser,
              pendingLogin.cb,
              '',
              phoneDetail
            );
          }
        });
        // 清除保存的登录信息
        app.globalData.pendingLogin = null;
        // 返回上一页
        wx.navigateBack();
      } else {
        wx.showToast({
          title: '登录信息已过期，请重新登录',
          icon: 'none'
        });
        setTimeout(function() {
          wx.navigateBack();
        }, 1500);
      }
    } else {
      // 用户拒绝授权
      wx.showToast({
        title: '需要授权手机号才能继续',
        icon: 'none'
      });
    }
  },

  // 跳过授权（已移除，必须授权手机号）
  skipAuth: function () {
    wx.showToast({
      title: '需要授权手机号才能继续',
      icon: 'none'
    });
  }
});



