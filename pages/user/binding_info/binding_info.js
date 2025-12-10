// pages/user/binding_info/binding_info.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var common = require('../../../utils/common.js');

Page({
  data: {
    store_name: setting.appName,
    url: setting.url,
    nickName: '',
    userHeadPic: '',
    isRegist: false,
    bindMobile: '',
    bindCode: '',
    regMobile: '',
    regCode: '',
    regPwd: '',
    isAgree: false,
    canGetCode: false, //是否能获取验证码
    write: false,
    timer: '', //定时器名字
    countDownNum: '60', //倒计时初始值
    is_send: false
  },

  onLoad: function(options) {
    var that = this
    this.getName(options.nickName);
    this.setData({
      userHeadPic: options.userHeadPic
    });
    app.getConfig(function(res) {
      var store_name = common.getConfigByName(res.config, 'store_name');
      if (store_name) {
        that.setData({
          store_name: store_name
        })
      }
    });
  },
  //去掉特殊字符的昵称
  getName: function(nickname) {
    var that = this;
    request.get(that.data.url + '/api/user/getname?nickname=' + nickname, {
      success: function(res) {
        that.setData({
          nickName: res.data.result.nickname
        });
      }
    })

  },

  account: function() {
    this.setData({
      isRegist: false
    });
  },

  regist: function() {
    this.setData({
      isRegist: true
    });
  },

  setMobile: function(e) {
    this.data.bindMobile = e.detail.value;
  },

  setCode: function(e) {
    this.data.bindCode = e.detail.value;
  },

  //获取验证码前检查注册账号的合法性
  getCode: function(e) {
    if (this.data.bindMobile == '') {
      app.showTextWarining("请输入手机号码");
      return;
    }
    var that = this;
    request.post('/Home/Api/checkBindMobile', {
      data: {
        mobile: that.data.bindMobile
      },
      success: function(res) {
        common.sendBindSmsCode(that.data.bindMobile, function(res) {
          if (res.data.status == 1) {
            that.setData({
              is_send: true
            });
            that.countDown();
          }
        });
      }
    });
  },

  setRegMobile: function(e) {
    this.data.regMobile = e.detail.value;
  },

  setRegPwd: function(e) {
    this.data.regPwd = e.detail.value;
  },

  setRegCode: function(e) {
    this.data.regCode = e.detail.value;
  },

  //获取验证码前检查注册账号的合法性
  getRegCode: function(e) {
    if (this.data.regMobile == '') {
      app.showTextWarining("请输入手机号码");
      return;
    }
    var that = this;
    request.post('/Home/Api/checkRegMobile', {
      data: {
        mobile: this.data.regMobile
      },
      success: function(res) {
        common.sendBindSmsCode(that.data.regMobile, function (res) {
          if (res.data.status == 1) {
            that.setData({
              is_send: true
            });
            that.countDown();
          }
        });
      }
    });
  },

  check: function() {
    this.setData({
      isAgree: !this.data.isAgree
    });
  },

  //绑定已有账号
  bindAccount: function() {
    var that = this;
    if (this.data.bindMobile == '') {
      app.showTextWarining("请输入手机号码");
      return;
    }
    if (this.data.bindCode == '') {
      app.showTextWarining("请输入验证码");
      return;
    }
    request.post('/api/user/bind_account', {
      data: {
        mobile: that.data.bindMobile,
        verify_code: that.data.bindCode,
      },
      successReload: true,
      success: function(res) {
        if (res.data.result == -1) {
          app.showTextWarining(res.data.msg, function() {
            wx.reLaunch({
              url: '/pages/index/index/index'
            });
          });
        }
        if (res.data.status == 0) {
          app.showTextWarining(res.data.msg);
        }
        wx.setStorageSync('isAuth', true);
        wx.setStorageSync('app:userInfo', res.data.result.user);
        app.globalData.userInfo = res.data.result.user;
        app.globalData.userInfo.head_pic = common.getFullUrl(app.globalData.userInfo.head_pic);
        typeof cb == "function" && cb(app.globalData.userInfo, app.globalData.wechatUser);
        app.showSuccess('绑定成功', function() {
          that.data.write = true;
          wx.reLaunch({
            url: '/pages/user/index/index'
          });
        });
      }
    });
  },
  onUnload: function() {
    if (!this.data.write) {
      wx.setStorageSync('bind_third_login', false);
      wx.setStorageSync('bind_third_logins', true);
      app.auth.clearAuth();
    }
  },
  //注册并绑定
  bindReg: function() {
    var that = this;
    if (this.data.regMobile == '') {
      app.showTextWarining("请输入手机号码");
      return;
    }
    if (this.data.regPwd == '') {
      app.showTextWarining("请输入密码");
      return;
    }
    if (this.data.regPwd.length < 6 || this.data.regPwd.length > 18) {
      app.showTextWarining("密码长度不合法");
      return;
    }
    if (this.data.regCode == '') {
      app.showTextWarining("请输入验证码");
      return;
    }
    if (!this.data.isAgree) {
      app.showTextWarining("请同意协议");
      return;
    }
    request.post('/api/user/bind_reg', {
      data: {
        mobile: that.data.regMobile,
        verify_code: that.data.regCode,
        password: that.data.regPwd,
        nickname: that.data.nickName,
      },
      success: function(res) {
        wx.setStorageSync('isAuth', true);
        wx.setStorageSync('app:userInfo', res.data.result.user);
        app.globalData.userInfo = res.data.result.user;
        app.globalData.userInfo.head_pic = common.getFullUrl(app.globalData.userInfo.head_pic);
        typeof cb == "function" && cb(app.globalData.userInfo, app.globalData.wechatUser);
        app.showSuccess('绑定成功', function() {
          wx.reLaunch({
            url: '/pages/user/index/index'
          });
        });
      }
    });
  },

  countDown: function() {
    let that = this;
    let countDownNum = that.data.countDownNum;
    that.setData({
      timer: setInterval(function() {
        if (countDownNum == 0) {
          clearInterval(that.data.timer);
          that.setData({
            is_send: false,
            countDownNum: 60
          });
          return;
        } else {
          countDownNum--;
          that.setData({
            countDownNum: countDownNum
          })
        }
      }, 1000)
    })
  }

})