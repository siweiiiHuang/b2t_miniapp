var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var common = require('../../../utils/common.js');

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        defaultAvatar: "/images/user1.png",
        userInfo: {
            collect_count: 0,
            message_count: 0,
            waitPay: 0,
            waitReceive: 0,
            uncomment_count: 0,
            return_count: 0,
            user_money: 0,
            coupon_count: 0,
            pay_points: 0,
            
        },
        storageUserInfo: {},
        defaultMenu: false,  //默认底部菜单显示状态
        distribut:0,
        sign:0,
        webUrl:'',
        click:false, //避免多次发出登录请求造成token的覆盖
    },

    onShow: function() {
        var that = this;
        that.data.click = false;
        
        // 从Storage读取app:userInfo
        try {
            var storageUserInfo = wx.getStorageSync('app:userInfo');
            if (storageUserInfo) {
                that.setData({
                    storageUserInfo: storageUserInfo
                });
            }
        } catch (e) {
            console.log('读取Storage中的app:userInfo失败:', e);
        }
        
        // 确保配置已加载
        if (!app.globalData.config) {
            app.getConfig(function(config) {
                that.initPageData();
            });
        } else {
            that.initPageData();
        }
    },
    
    initPageData: function() {
        var that = this;
        
        if (app.globalData.menu_model.length == 0) {
            app.globalData.menu_index = 3
        } else {
            //遍历自定义底部，该页面在哪个位置
            for (var i in app.globalData.menu_model) {
                if (app.globalData.menu_model[i].app_url.indexOf('User/index') != -1) {
                    app.globalData.menu_index = i;
                }
            }
        }
       
        that.setData({
            defaultMenu: app.globalData.defaultMenu,
            menu_index: app.globalData.menu_index,
            menu_model: app.globalData.menu_model,
            distribut: app.globalData.config && app.globalData.config['config'] ? common.getConfigByName(app.globalData.config['config'], 'switch') : 0,
            sign: app.globalData.config && app.globalData.config['config'] ? common.getConfigByName(app.globalData.config['config'], 'sign_on_off') : 0
        })     
        var status = false;
        //先预设值，加速加载
        if (app.globalData.userInfo) {
            that.setData({ userInfo: app.globalData.userInfo });
            status = true;
        }
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
        }        

        if (status){
            app.getUserInfo(function (userInfo) {
                that.setData({ userInfo: userInfo });
            }, true, false); 
        }

        request.get('/api/user/center_menu', {
            success: function (res) {
                wx.setStorageSync('custom_menu', res.data.result.menu_list);
                that.menu(res.data.result.menu_list);
                that.setData({ head_color: res.data.result.header_background })
            }
        });

        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#fdda65',
            animation: {
                duration: 400,
                timingFunc: 'easeIn'
            }
        })
        wx.setBackgroundColor({
            backgroundColor:'#fdda65',
            backgroundColorTop: '#fdda65',
            backgroundColorBottom: '#fdda65',
        })
       
    },
    onLoad: function () {
        var that = this;

        //预加载自定义缓存菜单
        if (wx.getStorageSync('custom_menu')) {
            that.menu(wx.getStorageSync('custom_menu'));
        }

        if (app.globalData.menu_model.length == 0 || !app.globalData.menu_model) {
            request.get('/api/Index/getConfig', {
                failRollback: true,
                successReload: true,
                success: function (res) {
                    var data = res.data.result.config;
                    var is_block = common.getConfigByName(data, 'is_block_index');

                    if (is_block == 0) {
                        wx.removeStorageSync('custom_data');
                        app.globalData.menu_model = []; 
                        that.setData({ defaultMenu: true, menu_model: []});
                        app.globalData.defaultMenu = true;
                    } else {
                        that.getAutoData();
                    }
                }
            });
        }
    },
    getAutoData: function (id) {
        var that = this;
        var url = !id ? '/api/Index/block_index' : '/api/Index/block_index/id/' + id
        request.get(url, {
            failRollback: true,
            successReload: true,
            success: function (res) {
                if (res.data.status == 1) {
                    that.customRendering(res.data.result.blocks)
                }
            }
        });
    },
    /** 自定义组件渲染 */
    customRendering: function (custom) {
        var that = this;
        var data = custom;
        var menu_model = [];                    //菜单集合
        for (let z = 0; z < data.length; z++) {
            if (data[z]['block_type'] == '11') {
                menu_model = data[z];
            }
        }
        app.globalData.menu_model = menu_model.nav;
        for (var i in app.globalData.menu_model) {
            if (app.globalData.menu_model[i].app_url.indexOf('User/index') != -1) {
                app.globalData.menu_index = i;
            }
        }

        that.setData({
            defaultMenu: app.globalData.defaultMenu,
            menu_index: app.globalData.menu_index,
            menu_model: app.globalData.menu_model,
        })
    },
    /** 首次登陆小程序，授权用户信息 */
    login:function(){
        var that = this;
        if(that.data.click) return false;
        that.data.click = true;
        if (!that.data.userInfo.user_id){
            app.getUserInfo(function (userInfo) {
                that.setData({ userInfo: userInfo });
            }, true, false); 
        }       
    },

    /** 处理用户信息授权 */
    bindGetUserinfo: function(res) {
        var that = this;
        if (that.data.click) return false;
        that.data.click = true;
        
        if (res.detail.userInfo != undefined) {
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                wx.setStorageSync('bind_third_login', true);
                app.globalData.wechatUser = res.detail.userInfo;
                
                app.auth.checkLogin(app.globalData.code, res.detail, function (loginData) {
                    app.showSuccess('登录成功', function () {
                        wx.removeStorageSync('first_leader');
                        wx.removeStorageSync('unique_id');
                        wx.removeStorageSync('login_user_info');
                        // 刷新用户信息
                        that.onShow();
                    });
                });
            } catch (e) {
                console.log(e);
                that.data.click = false;
            }
        } else {
            console.log('bindGetUserinfo fail . res.detail.userInfo is undefined');
            that.data.click = false;
        }
    },
    menu:function(data){
       var menu = [      
            { id:2, url: '/pages/user/coupon/coupon', logo: '../../../images/w4.png' },                       //我的优惠券             
            { id:4, url: '/pages/distribut/index/index', logo: '../../../images/w1.png' },                    //我的团队
            { id:5, url: '/pages/virtual/virtual_list/virtual_list', logo: '../../../images/w10.png' },       //虚拟订单
            { id:6, url: '/pages/team/team_order/team_order', logo: '../../../images/w4.png' },               //拼团订单
            { id:9, url: '/pages/user/comment/comment?status=1', logo: '../../../images/w2.png' },            //我的评价  
            { id:12, url: '/pages/activity/coupon_list/coupon_list', logo: '../../../images/w7.png' },         //领券中心
            { id: 13, url: '/pages/user/collect_list/collect_list', logo: '../../../images/w17.png' },         //我的收藏
            { id:14, url: '/pages/user/visit_log/visit_log', logo: '../../../images/w3.png' },                 //浏览历史                 
            { id:15, url: '/pages/user/message_notice/message_notice', logo: '../../../images/w18.png' },      //消息通知
            { id:17, url: '/pages/user/address_list/address_list', logo: '../../../images/w8.png' },           //地址管理     
            { id:10, url: '/pages/goods/integralMall/integralMall', logo: '../../../images/w5.png' },          //积分商城 
           // { id: 10, url: '', logo: '../../../images/w5.png' },                                              //积分兑换
            { id: 11, url: '/pages/user/sign_in/sign_in', logo: '../../../images/w11.png' },                    //我的签到
            { id: 16, url: '', logo: '../../../images/w15.png' },                                                //我的发票
            { id: 7, url: '/pages/bespeak/bespeak_list/bespeak_list', logo: '../../../images/w19.png' },          //预约订单
            { id: 8, url: '/pages/shop_order/shop_order_list/shop_order_list', logo: '../../../images/w14.png' }, //自提订单  
            { id: 3, url: '/pages/distribut/poster/poster', logo: '../../../images/w16.png' },                   //我的海报      
           { id: 18, url: '/pages/Bargain/order_list/order_list', logo: '../../../images/w16.png' },              //砍价活动和订单     
        ];

        for(let i = 0; i < data.length;i++){
            for (let ii = 0; ii < menu.length; ii++) {
                if (data[i]['menu_id'] == menu[ii]['id']){
                    data[i]['url'] = menu[ii]['url']
                    data[i]['logo'] = menu[ii]['logo']
                }
            }  
        }
        this.setData({ 'userInfoList.manageList': data })
    },
    clickMenu(e){
        var that = this;
        if(that.data.click) return false;
        that.data.click = true;
        //在个人中心浏览其他入口页面前判断是否登录
        if (!that.data.userInfo.user_id) {
            app.getUserInfo(function (userInfo) {
                that.setData({ userInfo: userInfo });
            }, true, false); 
            return false;
        }
        if (e.currentTarget.dataset.url == '/pages/distribut/index/index'){
            if (that.data.distribut == 0){
               return app.showTextWarining('分销功能已关闭')
            }
        } 
        if (e.currentTarget.dataset.url == '/pages/user/sign_in/sign_in'){
            if (that.data.sign == 0) {
                return app.showTextWarining('签到功能已关闭')
            }
        }
        wx.navigateTo({ url: e.currentTarget.dataset.url });
    },
    /** 跳转模式 自定义页面 || 自定义菜单 || 自定义控件控件*/
    topage(e) {
        //自定义菜单
        var idx = e.currentTarget.dataset.idx;
        app.globalData.menu_index = idx;
        var page_type = this.data.menu_model[idx].url_type
        var id = this.data.menu_model[idx].app_url
        //判断跳转的类型  0 = 外部网址,1 = 小程序页面，2 = 分类商品，3 = 商品详情 ，4 = 自定义页面
        if (page_type == 1) {
            //要访问的页面idx，当前页面menu_index
            common.totabar(idx, this.data.menu_index, this.data.menu_model);
        } else if (page_type == 2) {
            wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + id });
        } else if (page_type == 3) {
            wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + id });
        } else if (page_type == 0) {
            this.setData({ webUrl: id });
            wx.navigateTo({ url: '/pages/index/webview/webview' });
        }else{
            wx.reLaunch({
                url: '../../index/customPage/customPage?id=' + this.data.menu_model[idx].app_url,
            })
        }
    },
    /** 默认菜单 */
    topages: function (e) {
        var idx = e.currentTarget.dataset.idx;
        app.globalData.menu_index = idx;
        common.defaultTotabar(idx, 3);
    },
    onPullDownRefresh: function (e) {
        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
            wx.stopPullDownRefresh();
        }, true);
    },
    authorization: function () {
        //再授权
        wx.openSetting({
            success: (res) => {         
                //因为openSetting会返回用户当前设置
                if (res.authSetting["scope.userInfo"] === true) {
                    var that = this
                    app.getUserInfo(function (userInfo) {
                        //更新数据
                        that.setData({
                            userInfo: userInfo,
                        })
                    })
                }
                else {
                    wx.showModal({
                        title: '用户未授权',
                        content: '如需正常使用小程序，请点击授权按钮。',
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                console.log('用户点击确定')
                            }
                        }
                    })
                }
            }
        })
    },

    // 底部导航栏跳转
    navigateToPage(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        
        // 如果点击的是当前页面，不进行跳转
        if (index === 3) {
            return;
        }

        // 根据索引跳转到对应页面
        switch(index) {
            case 0: // 首页
                wx.reLaunch({
                    url: '/pages/index/index/index'
                });
                break;
            case 1: // 点单（购物车）
                wx.reLaunch({
                    url: '/pages/cart/cart/cart'
                });
                break;
            case 2: // 取单（订单列表）
                wx.reLaunch({
                    url: '/pages/user/order_list/order_list'
                });
                break;
            case 3: // 个人中心
                // 当前页面，不跳转
                break;
        }
    }

})