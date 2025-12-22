//app.js
var setting = require('setting.js');
var auth = require('./utils/auth.js');
var request = require('./utils/request.js');
var common = require('./utils/common.js');

App({
    globalData: {
        setting: setting,   //用户可配置项
        wechatUser: null,   //微信的用户信息
        userInfo: null,     //商城的用户信息TP 
        config: null,       //app系统配置
        code: null,         //微信登录code
        menu_index:0,       //自定义菜单索引
        menu_model:[],      //自定义菜单模型
        defaultMenu:false,  //自定义菜单状态  
		is_apply:0,         //是否在审核阶段
        pendingLogin: null, //待登录信息（用于获取手机号后登录）
    },

    /** 授权对象 */
    auth: auth,

    /** 全局请求对象，涉及业务的请求，请使用此接口 */
    request: request,

    /** 启动加载 */
    onLaunch: function () {
        this.initExt();
        var setting = this.globalData.setting;
        setting.resourceUrl = setting.url + '/template/mobile/rainbow';
    },

    initExt: function () {
        var ext = wx.getExtConfigSync();
        var setting = this.globalData.setting;
        if (ext.store_name) {
            setting.appName = ext.store_name;
            setting.share.title = ext.store_name;
            setting.appLogo = ext.store_logo;
            setting.saas_app = ext.saas_app;
            if (ext.is_refactor) {
                setting.url = ext.request_url + '/saas/' + setting.saas_app;
            } else {
                setting.url = ext.request_url;
            }
            setting.ext_on = 1; //第三方配置开启
        } else {
            setting.saas_app = '';
            setting.ext_on = 0;
        }
    },

    /** 
     * 获取用户信息（包括微信用户），有授权作用
     * cb：成功回调函数，入参:cb(userInfo,wechatUser)
     * force：是否强制更新数据（发出请求）
     */
    getUserInfo: function (cb, force, isShowLoading) {
        var that = this;
        if (auth.isAuth() && !force) {
            typeof cb == "function" && cb(that.globalData.userInfo, that.globalData.wechatUser);
        } else {
            if (!auth.isAuth()) {
                return auth.auth(cb); //授权操作
            }
            request.get('/api/user/userInfo', {
                isShowLoading: typeof isShowLoading == 'undefined' ? true : isShowLoading,
                success: function (res) {                   
                    if (res.data.result.head_pic) {
                        if (res.data.result.head_pic.indexOf("http") == -1) {
                            res.data.result.head_pic = setting.url + res.data.result.head_pic;
                        }
                    }                   
                    wx.removeStorageSync('bind_third_login');
                    wx.removeStorageSync('bind_third_logins');
                    wx.setStorageSync('app:userInfo', res.data.result);
                    that.globalData.userInfo = res.data.result;
                    that.globalData.userInfo.head_pic = common.getFullUrl(that.globalData.userInfo.head_pic);
                    typeof cb == "function" && cb(that.globalData.userInfo, that.globalData.wechatUser);
                }
            });
        }
    },
    
    /** 获取app系统配置 */
    getConfig: function (cb, force) {
        var that = this;
        if (this.globalData.config && !force) {
            typeof cb == "function" && cb(this.globalData.config);
        } else {
            request.get('/api/index/getConfig', {
                success: function (res) {
                    that.globalData.config = res.data.result;
                    typeof cb == "function" && cb(that.globalData.config);
                }
            });
        }
    },

    /** 获取前index页的数据，默认前一页 */
    getPrevPageData: function (index) {
        if (typeof index == 'undefined') {
            index = 1;
        }
        var pages = getCurrentPages();
        return pages[pages.length - index - 1].data; 
    },

    /** 加载提醒 */
    showLoading: function(func, time) {
        typeof time == 'undefined' && (time = 1500);
        wx.showToast({
            title: '加载中',
            icon: 'loading',
            duration: time,
            mask: true,
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showSuccess: function (msg, func, time) {
        typeof time == 'undefined' && (time = 1000);
        wx.showToast({
            title: msg,
            icon: 'success',
            duration: time,
            mask: true,
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showWarning: function (msg, func, time, mask) {
        !time && (time = 1500);
        typeof mask == 'undefined' && (mask = true);
        wx.showToast({
            title: msg,
            mask: mask,
            duration: time,
            image: '/images/gt.png',
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showTextWarining: function (msg, func, time, mask) {
        !time && (time = 2000);
        typeof mask == 'undefined' && (mask = true);
        wx.showToast({
            title: msg,
            mask: mask,
            duration: time,
            icon:'none',
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    confirmBox: function (msg, func) {
        wx.showModal({
            title: msg,
            showCancel: false,
            complete: function () {
                typeof func == 'function' && func();
            }
        });
    },
    
    validatemobile: function (mobile) {
         if (mobile.length == 0) {
             this.showTextWarining('请输入手机号码!');
              return false;
         }
         if (mobile.length != 11) {
           this.showTextWarining('手机号码长度有误!');
            return false;
         }
        var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(19[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
         if (!myreg.test(mobile)) {
                this.showTextWarining('手机号码有误!');
              return false;
         }
        return true;
    }
})