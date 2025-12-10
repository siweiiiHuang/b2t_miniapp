var common = require('./common.js');

/** 登录授权逻辑模块,不要在app.js使用 */
module.exports = {
    app: function () {
        return getApp();
    },

    /** 授权总入口，cb：成功回调函数 */
    auth: function (cb) {
        var app = this.app();
        var that = this;
        wx.checkSession({
            success: function () {
                !app.globalData.wechatUser && that.wxLogin(cb);
            },
            fail: function () {
                that.wxLogin(cb);
            }
        })
    },

    /** 是否已授权 */
    isAuth: function () {
        return (this.app().globalData.wechatUser) ? true : false;
    },

    /** 清除授权 */
    clearAuth: function () {
        this.app().globalData.wechatUser = null;
        wx.setStorageSync('isAuth', false);
    },

    /** 是否有登录过 */
    hadAuth: function () {
        try {
            return wx.getStorageSync('isAuth') ? true : false;
        } catch (e) {
            wx.setStorageSync('isAuth', false);
            return false;
        }
    },

    /**** 下面为内部函数，外部不要调用 ****/
    checkLogin: function (code, wxUser, cb) {
        var that = this;
        wx.getStorage({
            key: 'first_leader',
            success: function (res) {
                that.login(code, wxUser, cb, res.data);
            },
            fail(res) {
                that.login(code, wxUser, cb, '');
            },
        })
    },
    /** 登录商城,会更新用户信息,code五分钟过期 */
    login: function (code, wxUser, cb, firstLeader) {
        var app = this.app();
        var that = this;
        if (typeof code == 'undefined' || code == '') {
            app.globalData.wechatUser = null;
            that.alertLoginErrorAndGoHome('登录码为空，请重新尝试');
            return false;
        }
        var userInfo = wxUser.userInfo;
        var setting = app.globalData.setting;
        var versionCode = setting.versionCode;
       // var firstLeader = wx.getStorageSync('first_leader') ? wx.getStorageSync('first_leader'):'';
        app.request.post('/api/user/thirdLogin', {
            data: {
                code: code,
                versionCode: versionCode,
                encryptedData: wxUser.encryptedData,
                iv:wxUser.iv,
                oauth: 'miniapp',
                nickname: userInfo.nickName,
                head_pic: userInfo.avatarUrl,
                sex: userInfo.gender,
                terminal: 'miniapp',
                first_leader: firstLeader,
               // test: 3099//3040//3041//2950 //
            },            
            success: function (res) {
                if (res.data.result.head_pic) {
                    if (res.data.result.head_pic.indexOf("http") == -1) {
                        res.data.result.head_pic = setting.url + res.data.result.head_pic;
                    }
                }  
                wx.removeStorageSync('bind_third_login');
                wx.removeStorageSync('bind_third_logins');
                wx.setStorageSync('isAuth', true);
                wx.setStorageSync('app:userInfo', res.data.result);
                app.globalData.userInfo = res.data.result;
                app.globalData.userInfo.head_pic = common.getFullUrl(app.globalData.userInfo.head_pic);
                typeof cb == "function" && cb(app.globalData.userInfo, app.globalData.wechatUser);
            },
            failStatus: function (res) {
                //如果还没注册账户,关联账户
                if (res.data.result === '100') {
                    if (wx.getStorageSync('bind_third_login')) {
                        wx.redirectTo({
                            url: '/pages/user/binding_info/binding_info?nickName=' + userInfo.nickName + '&userHeadPic=' + userInfo.avatarUrl
                        })
                    }else if (wx.getStorageSync('bind_third_logins')) {
                        wx.navigateTo({
                            url: '/pages/user/binding_info/binding_info?nickName=' + userInfo.nickName + '&userHeadPic=' + userInfo.avatarUrl
                        });
                    }else {
                        wx.navigateTo({
                            url: '/pages/user/binding_info/binding_info?nickName=' + userInfo.nickName + '&userHeadPic=' + userInfo.avatarUrl
                        });
                    }                                                  
                        return false;           
                }
                //清除登录信息
                that.clearAuth();
                that.alertLoginErrorAndGoHome(res.data.msg);
                app.request.post('/api/user/logout', {
                    isShowLoading: false,
                    data: { token: app.request.getToken() },
                    failStatus: function () {
                        return false;
                    }
                });
                return false;
            },
            fail: function (res) {
                that.clearAuth();
                that.alertLoginErrorAndGoHome();
                return false;
            }
        });
    },

    /** 微信登录,cb成功回调 */
    wxLogin: function (cb) {
        var that = this;
        wx.login({
            success: function (res) {
                if (!res.code) {
                    wx.showModal({
                        title: '获取用户登录态失败',
                        content: res.errMsg,
                        showCancel: false,
                        complete: function () {
                            that.goHome();
                        }
                    });
                    return;
                }
                that.doGetWxUser(res.code, cb);
            },
            fail: function(res){
                console.log(res);
            }
        });
    },

    doGetWxUser: function (code, cb) {
        var that = this;
        var app = that.app();
        app.globalData.code = code;
        try {
          var userInfo = wx.getStorageSync('wx_user_info');
          if (userInfo && userInfo != undefined){
              app.globalData.wechatUser = userInfo;
              wx.getUserInfo({
                  success: function (res) {               
                      that.checkLogin(code, res, cb);
                  },
                  fail: function (res) {
                      that.goGetUserInfo();
                  }
              });         
          }else{
            that.goGetUserInfo();
          } 
        } catch (e) {
          that.goGetUserInfo();
        }
    },

    failGetWxUser: function (code, cb) {
        var that = this;
        wx.showModal({
            title: '请先授权登录哦',
            success: function (res) {
             
                if (res.confirm) {
                  that.goGetUserInfo();
                     
                } else if (res.cancel) {
                    that.alertNoAuthAndGoHome();
                }
            },
            fail: function (res) {
                that.goHome();
            }
        })
    },

    alertNoAuthAndGoHome: function () {
        var that = this;
        this.app().showTextWarining('你尚未授权登录', function () {
            that.goHome();
        }, null, true);
    },

    alertLoginErrorAndGoHome: function (msg) {
        if (!(typeof msg == 'string' && msg != '')) {
            msg = '登录时发生错误';
        }
        var that = this;
        this.app().showTextWarining(msg, function () {
            that.goHome();
        }, null, true);
    },

    goHome: function() {
        wx.reLaunch({ url: '/pages/index/index/index' });
    },

    goGetUserInfo: function () {
      wx.navigateTo({ url: '/pages/user/get_user_info/get_user_info' });
    }

}