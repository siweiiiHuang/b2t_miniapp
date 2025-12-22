var common = require('./common.js');
var sha256 = require('./sha256.js');

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
        // 先显示获取手机号的弹窗
        that.showPhoneAuthModal(code, wxUser, cb);
    },

    /** 显示手机号授权弹窗 */
    showPhoneAuthModal: function (code, wxUser, cb) {
        var that = this;
        // 必须授权手机号，直接跳转到获取手机号页面
        that.goGetPhoneNumber(code, wxUser, cb);
    },

    /** 跳转到获取手机号页面 */
    goGetPhoneNumber: function (code, wxUser, cb) {
        var that = this;
        // 保存登录信息到全局，以便获取手机号后使用
        var app = that.app();
        app.globalData.pendingLogin = {
            code: code,
            wxUser: wxUser,
            cb: cb
        };
        // 跳转到获取手机号页面
        wx.navigateTo({
            url: '/pages/user/get_phone_number/get_phone_number'
        });
    },

    /**
     * 生成phoneCode（SHA-256哈希）
     * @param {string} encryptedData 微信加密串
     * @param {string} iv 加密向量
     * @param {string} code 登录code
     * @returns {string} SHA-256哈希串
     */
    generatePhoneCode: function (encryptedData, iv, code) {
        // 固定盐值，需与后端校验规则一致
        var salt = 'tpshop_miniapp_2025';
        // 拼接：encryptedData + iv + code + salt
        var hashSource = (encryptedData || '') + (iv || '') + (code || '') + salt;
        // 进行SHA-256哈希
        var phoneCode = sha256(hashSource);
        return phoneCode;
    },
    /** 登录商城,会更新用户信息,code五分钟过期 */
    login: function (code, wxUser, cb, firstLeader, phoneDetail, retryCount) {
        var app = this.app();
        var that = this;
        // 防止无限重试，最多重试1次
        retryCount = retryCount || 0;
        if (retryCount > 1) {
            that.alertLoginErrorAndGoHome('登录失败，请稍后重试');
            return false;
        }
        // 必须提供手机号授权信息
        if (!phoneDetail || !phoneDetail.code) {
            app.globalData.wechatUser = null;
            that.alertLoginErrorAndGoHome('需要授权手机号才能登录');
            return false;
        }
        var userInfo = wxUser.userInfo;
        var setting = app.globalData.setting;
        var versionCode = setting.versionCode;
       // var firstLeader = wx.getStorageSync('first_leader') ? wx.getStorageSync('first_leader'):'';
        
        // 生成phoneCode：使用encryptedData + iv + code + salt进行SHA-256哈希
        var phoneCode = that.generatePhoneCode(
            phoneDetail.encryptedData || '',
            phoneDetail.iv || '',
            code
        );
        
        // 打印两个code
        console.log('=== 登录参数打印 ===');
        console.log('wx.login返回的code:', code);
        console.log('手机号授权返回的code:', phoneDetail.code);
        console.log('手机号授权返回的encryptedData:', phoneDetail.encryptedData);
        console.log('手机号授权返回的iv:', phoneDetail.iv);
        console.log('生成的phoneCode:', phoneCode);
        console.log('==================');
        
        // code使用wx.login返回的code，encryptedData和iv使用getPhoneNumber返回的e.detail
        var loginData = {
            code: code, // 使用wx.login返回的code
            phoneCode: phoneCode, // 生成的phoneCode（SHA-256哈希）
            versionCode: versionCode,
            encryptedData: phoneDetail.encryptedData || '', // 使用e.detail中的encryptedData
            iv: phoneDetail.iv || '', // 使用e.detail中的iv
            oauth: 'miniapp',
            nickname: userInfo.nickName,
            head_pic: userInfo.avatarUrl,
            sex: userInfo.gender,
            terminal: 'miniapp',
            first_leader: firstLeader,
        };
        app.request.post('/api/user/thirdLogin', {
            data: loginData,            
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
                // 检查是否包含 40163 错误码（code 已使用或过期）
                var errorMsg = res.data.msg || '';
                if (errorMsg.indexOf('40163') !== -1) {
                    // code 失效，需要重新获取手机号授权
                    console.log('检测到 40163 错误，需要重新授权手机号');
                    wx.showToast({
                        title: '授权已过期，请重新授权手机号',
                        icon: 'none'
                    });
                    // 重新跳转到获取手机号页面
                    that.goGetPhoneNumber(code, wxUser, cb);
                    return false;
                }
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
                console.log('res.code', res.code);
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